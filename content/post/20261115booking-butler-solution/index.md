---
title: "出張の移動時間を手計算しない — カレンダーから出発時刻を逆算する仕組み"
date: 2026-11-15T13:10:00+09:00
draft: false
tags: [Go, React, Google Calendar API, 出張管理, 課題解決]
summary: "出張のたびに予定表と地図アプリを行き来して出発時刻を計算していませんか。BookingButler は予定の前後関係から起点を決め、到着時刻から逆算して移動の時刻を埋めます。手作業のどこを機械に渡したかを整理しました。"
---

## 出張前夜にやっていること

翌日の出張の準備で、こんな作業をしていませんか。

1. カレンダーを開き、明日の予定と場所を確認する
2. 場所を地図アプリにコピーし、経路を検索する
3. 所要時間を見て、予定の開始時刻から逆算する
4. 出発時刻をメモする
5. 予定が3件あれば、それを3回繰り返す

1件あたり数分でも、予定の数だけ積み上がります。しかも予定が1つ動くたびに、逆算をやり直すことになります。前日が別の街なら、起点は自宅ではなくホテルや前の現場になります。この「起点の判断」が、地図アプリだけでは埋まりません。

**BookingButler** は、この逆算をカレンダーから自動で行う Web アプリです。Go の API が予定を取得し、Google Maps で最寄り駅を、NAVITIME で経路を引き、出発と到着の時刻を予定の隣に並べます。

## 既存手段の限界

| 手段 | できること | 限界 |
|---|---|---|
| カレンダーの場所欄 | 予定と住所が1箇所に揃う | 移動時間は計算されない |
| 地図アプリで経路検索 | 乗換と所要時間が出る | 予定ごとに住所を貼り直す。起点は人が決める |
| 表計算で逆算 | 自分なりの式を持てる | 予定変更に追従しない。入力漏れが起きる |

3つに共通するのは、**起点を決めるのが人**だという点です。同じ日の2件目なら前の現場から、日付が変わったら自宅から。この判断を毎回やり直しているうちに、確認そのものが面倒になります。

## 解決の設計

作業の前後を比べます。

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: 手計算</strong>
    <div class="diagram-box">予定表を開いて場所を読む</div>
    <div class="diagram-box">住所を地図アプリに貼り直す</div>
    <div class="diagram-box">所要時間を見て電卓で逆算</div>
    <div class="diagram-box">メモを見ながら当日また確認</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: BookingButler</strong>
    <div class="diagram-box">期間を選んで Google にログイン</div>
    <div class="diagram-box">予定と場所を一括で取得</div>
    <div class="diagram-box">起点を自動で判定して経路を検索</div>
    <div class="diagram-box">出発・到着の時刻が予定の隣に出る</div>
  </div>
</div>
<p class="diagram-caption">図1: 出発時刻の調べ方の前後比較</p>
</div>

設計の要点は3つです。

- **入力は予定表だけ**: 場所はカレンダーの場所欄を使い、別の一覧を管理しない
- **起点は機械が決める**: 同じ日なら前の予定、日付が変われば自宅
- **逆算は到着時刻から**: 経路 API に予定の開始時刻を渡し、出発時刻を受け取る

起点の判断を関数1つに閉じ込めたことで、予定が増えても分岐が増えません。その代わり、場所が空の予定は自宅から、終日予定は9時開始と仮定する割り切りを入れています。ここは後述の残課題です。

## 実装の要点

### 起点を決めるのは1箇所だけ

`backend/calendar/calendar_processor.go` の `ProcessEvents` が、直前の予定と比べて起点を切り替えます。

```go
// backend/calendar/calendar_processor.go（ProcessEvents）
if isDateDifferenceOverOneDay(previousDate, currentEventDateStr) {
	if location != homeLocation {
		transitFromTimeStr, transitToTimeStr = planRoute(mapsClient, homeLocation, location, eventTimeStr)
	}
} else if previousLocation != "" && previousLocation != location {
	transitFromTimeStr, transitToTimeStr = planRoute(mapsClient, previousLocation, location, eventTimeStr)
}
```

日付が変われば自宅から、同じ日なら前の予定の場所から。同じ場所が続く場合は経路検索をしません。日付の比較は UTC の日付に正規化して行うため、時刻の差ではなく日付の差で判定されます。

### 到着時刻から逆算する

経路は RapidAPI 経由の NAVITIME に問い合わせます。予定の開始時刻を `goal_time` に渡すのが逆算の部分です。

```go
// backend/calendar/calendar_processor.go（makeRapidAPIRequest）
parsedTime, err := time.Parse(time.RFC3339, goalTime)
goalTime = parsedTime.Format("2006-01-02T15:04:05")

query := url.Values{
	"start":      {fmt.Sprintf("%f,%f", startLat, startLng)},
	"goal":       {fmt.Sprintf("%f,%f", goalLat, goalLng)},
	"datum":      {"wgs84"},
	"term":       {"1440"},
	"limit":      {"5"},
	"goal_time":  {goalTime},
	"coord_unit": {"degree"},
}
```

住所のままでは経路 API に渡せないため、`getNearbyStationName` がジオコーディングのあと半径3000メートル以内の駅を探し、その座標を使います。返ってきた候補のうち先頭の `move.from_time` と `move.to_time` だけを採用します。

### 画面は時刻を並べるだけ

バックエンドは `EventInfo` の配列を返します。ブラウザ側は整形して表示するだけです。

```tsx
// vite-project/src/App.tsx
{event.TransitFromTime && event.TransitToTime && (
  <p>Transit: {new Date(event.TransitFromTime).toLocaleString()} - {new Date(event.TransitToTime).toLocaleString()}</p>
)}
```

呼び出しは `GET /api/events?code=<認可コード>&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` の1本です。Vite の開発サーバーが `/api` をバックエンドに転送するので、フロント側に特別な設定は要りません。

## 結果

作業としては、予定ごとのコピー＆逆算が「期間を選んでログイン」に置き換わります。残るのは結果の確認だけです。

リポジトリの実装に基づく条件は次のとおりです。

| 項目 | 値 |
|---|---|
| 1リクエストで扱う予定 | 最大10件 |
| 予定間の待機 | 500ミリ秒 |
| 駅を探す半径 | 3000メートル |
| 経路の候補要求数（limit） | 5件（先頭を採用） |

外部 API の呼び出しは、予定ごとに起点と終点の駅を引く Maps（Geocoding と NearbySearch）と、NAVITIME の1回です。予定のループには500ミリ秒の待機を入れており、連続で叩かないようにしています。

手計算が消えることで変わるのは、確認の回数です。予定表を見れば出発時刻が並んでいるので、「この予定の前にどこまで移動できるか」を毎回調べ直さなくて済みます。

## 向かないケース・残課題

- **予定が多い期間**: 1リクエストは10件までなので、11件目以降は返りません。期間を分けて取得する必要があります。
- **電車以外の移動**: 経路は `route_transit` 固定です。車や徒歩が中心の出張には向きません。
- **場所が空の予定**: 場所欄が空だと自宅として扱われます。オンライン会議のように移動を伴わない予定も、同じ扱いになります。
- **終日予定**: 開始時刻がないため、経路検索では当日9時とみなします。実際の到着時刻とはずれます。
- **「間に合うか」の判定**: 前の予定の終了時刻と移動開始時刻を比べる処理は `backend/cmd/dev/main.go` の CLI にあり、Web の画面には出ていません。画面は時刻の並置までです。
- **認証**: 認可コードはリクエストごとに交換し、トークンは保存していません。期間を変えるたびにログインが必要です。

「移動の時刻を並べる」までが現在の到達点で、遅刻の危険を自動で警告するところは CLI 側にあります。

## まとめ

- 手計算の正体は「起点の判断」と「到着時刻からの逆算」の2つで、それぞれ別に自動化できる
- 起点の判断を1つの関数に閉じ込めると、予定が増えても分岐が増えない
- 予定表を入力にすると、予定の変更にそのまま追従できる
- 外部 API の呼びすぎは、件数の上限と待機時間で抑える

同じ形は、出張に限らず「予定表の空白を埋める」種類のツールに流用できます。

## 関連記事

- [Go + Gorilla Mux + React で組む出張カレンダー — BookingButler の技術構成](/post/20261115booking-butler-tech/)
- [BookingButler：Googleカレンダー連携で出張管理を自動化するWebアプリ](/post/20250711booking-buttler/)

---

**出張管理やスケジュール自動化のツール開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
