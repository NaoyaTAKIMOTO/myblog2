---
title: "住まい探しの優先順位を逆にする — ジム起点の検索を成立させた設計"
date: 2026-11-15T12:10:00+09:00
draft: false
tags: [Go, React, PostGIS, commute, real-estate, 課題解決]
summary: "住まい探しは勤務先が起点で、ジムは住んでから探すものになっています。筋肉不動産が検索の順序を逆にし、施設条件・通勤圏・ジム・物件の4段に組み直した設計と、そのトレードオフをまとめました。未実装の範囲も明記し、「あとから探す」前提の見直し方として整理しています。"
---

## 引っ越すたびに、ジムを探し直している

引越しを決めたとき、まず何を基準にしますか。多くの人は勤務先と通勤時間です。ジムは「住んでから近くで探すもの」という扱いになります。

ところが毎日通うトレーニーにとって、ジムまでの距離は通勤時間と同じくらい重い条件です。候補の物件を3つに絞ったあと、それぞれの最寄りジムを地図で調べ、24時間営業か、プールがあるか、サウナがあるかを確認する。この作業を物件の数だけ繰り返すことになります。

**筋肉不動産** は、この順序を逆にしたWebアプリです。ジムを先に決め、通勤圏でエリアを絞り、選んだジムの周辺で物件を探します。ここでは、順序を入れ替えると何が変わるのか、どこで妥協したのかを書きます。

## 既存手段の限界

| 手段 | できること | 限界 |
|---|---|---|
| 不動産ポータル | 駅・通勤時間・家賃で絞れる | 設備条件でジムを探す軸が無い。ジムは住んでから探す前提 |
| 地図アプリ | ジムと物件の位置は分かる | 候補ごとに距離を手で測る。比較のたびに往復が発生する |
| 表計算で比較 | 自由な軸で並べられる | データを手で集める必要があり、更新されない |
| ジムの口コミサイト | 設備や雰囲気が分かる | 住まいとの組み合わせは分からない |

足りないのは、ジムの設備条件と住まいの条件を同じ画面で扱うことでした。

## 解決の設計

検索の順序を、次の4段に固定しました。

1. **施設条件**でジムを絞る（9種類の設備から選択）
2. **通勤圏**でエリアを決める（許容時間と交通手段）
3. **ジム**を選ぶ
4. **物件**を見る（ジムの周辺1km）

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: 勤務先が起点</strong>
    <div class="diagram-box">勤務先と通勤時間を決める</div>
    <div class="diagram-box">エリアを絞って物件を探す</div>
    <div class="diagram-box">住んでからジムを探す</div>
    <div class="diagram-box">ジムまでの距離を候補ごとに地図で確認</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: ジムが起点</strong>
    <div class="diagram-box">施設条件でジムを絞る（9種類）</div>
    <div class="diagram-box">通勤圏でエリアを決める</div>
    <div class="diagram-box">ジムを選ぶ</div>
    <div class="diagram-box">周辺1kmの物件を同じ画面で見る</div>
  </div>
</div>
<p class="diagram-caption">図1: 住まい探しの順序の前後比較</p>
</div>

設計上の判断は3つです。

- **順序をAPIの引数にする**: 画面の状態を「どの段まで進んだか」だけに減らす
- **絞り込みは緩められる形にする**: 許容時間は `max_time`、交通手段は `mode` で毎回変えられる
- **通勤時間の計算は差し替え可能にする**: 外部APIの口だけ先に作り、中身は後から入れる

いちばん大きなトレードオフは、先に絞ると候補が消えることです。施設条件を3つ選べば、該当するジムがゼロになることもあります。そのため、施設はANDで絞りつつ、選び直しがすぐ効くようにしました。チップを外すと即座に再検索されます。

## 実装の要点

### 1. 4段の順序をURLに出す

順序が決まっていれば、APIは素直に並びます。

```bash
# 1. 施設条件でジムを絞る
curl "http://localhost:3001/api/gyms/search?facilities=プール,サウナ"

# 2. 通勤圏のエリアを取る（既定は30分・transit）
curl "http://localhost:3001/api/commute/areas?origin=新宿駅&max_time=30&mode=transit"

# 3. 選んだジムの座標で周辺物件を探す（既定は半径1,000m）
curl "http://localhost:3001/api/properties/search?lat=35.6586&lng=139.7008&radius=1000"
```

どの段も単体で叩けるので、UIを作らずに検索の妥当性を確認できます。`docs/api-implementation-log-2024-11-29.md` には、この順序の各エンドポイントまで動作確認が終わったと記録されています。

### 2. 施設はANDで絞る

「プールとサウナの両方があるジム」を探したいので、施設条件はORではなくANDです。`server/internal/repository/gym_repository.go` は条件の数だけ `$n = ANY(facilities)` を並べます。

```go
// server/internal/repository/gym_repository.go（ComplexSearch）
for _, facility := range facilities {
    facilityConditions = append(facilityConditions,
        fmt.Sprintf("$%d = ANY(facilities)", argIndex))
    args = append(args, facility)
    argIndex++
}
conditions = append(conditions, "("+strings.Join(facilityConditions, " AND ")+")")
```

UI側のチップは9種類です。`client/src/components/GymSearch.tsx` の `availableFacilities` に、24時間営業・カーディオマシン・フリーウェイト・プール・サウナ・スタジオレッスン・スパ・温浴施設・ゴルフレンジが並びます。チップを押すと、その配列をそのまま `facilities` として送ります。

### 3. 通勤圏は「時間で切る」

`GET /api/commute/areas` は、固定の5地点（渋谷・新宿・池袋・品川・恵比寿）を持ち、`max_time` 以下になるものだけを返します。交通手段で時間を補正する部分が、このAPIの実質的な中身です。

```go
// server/internal/service/commute_service.go（getMockCommutableAreas）
switch mode {
case "driving":
    adjustedTime = adjustedTime / 2
case "walking":
    adjustedTime = adjustedTime * 3
case "bicycling":
    adjustedTime = adjustedTime * 2
}

if adjustedTime <= maxTime {
    area.CommuteTime = adjustedTime
    filteredAreas = append(filteredAreas, area)
}
```

`max_time` の既定は30分、`mode` の既定は `transit` です。`docs/api-implementation-log` には許容時間の候補として30/45/60/90分が記録されています。値はクエリで受けるので、UI側の選択肢を増やしてもAPIは変わりません。

## 結果

Before の「候補ごとにジムを調べる」往復が、1画面の操作に置き換わりました。ジムを選ぶと、周辺1kmの物件が家賃・広さ・間取りの絞り込みつきで並び、右パネルに物件数・平均家賃・最短距離が出ます。

ただし、現時点で実現できているのはここまでです。正確に書いておきます。

- **通勤時間はモック**: `commute_service.go` はAPIキーがあっても実APIを呼びません。画面にも通勤時間は出していません
- **UIは4段のうち2段**: フロントが呼んでいるのはジム検索と物件検索で、通勤圏APIはまだ接続していません
- **地図はプレースホルダ**: `client/src/components/MapView.tsx` は「Google Maps 連携予定」と表示し、位置関係の描画は未実装です
- **データは限定的**: ジムは16件（東京・大阪・名古屋・福岡・札幌）、シードの物件は15件です

数値の改善を主張できる段階ではありません。言えるのは、探す順序を変えたことで「住んでから気づく」種類のミスが減る、という設計上の効果までです。

## 向かないケース・残課題

- **ジムが決まっていない人**: 起点が無いと成立しません。エリアからジムを探す逆方向の導線が必要です
- **施設条件がニッチな人**: 設備の語彙が9種類に固定されているため、パーソナルジムや女性専用などは表現できません
- **実データが必要な人**: 物件は外部API、通勤時間は Distance Matrix API の統合が前提になります
- **郊外・車社会**: 通勤圏を駅単位で持つ設計なので、駅が起点にならない地域は扱いにくいです

残課題は、通勤時間の実計算、地図の描画、物件データの接続、そしてジムの実データ収集です。どれも「順序」ではなく「中身」の話なので、4段の設計はそのまま使えます。

## まとめ

- 優先順位を入れ替えると、検索条件の持ち方が変わる。ジムの設備条件が第一級の条件になる
- 順序をAPIの引数に落とすと、画面は「今どの段か」だけを持てばよくなる
- 中身が未実装の段は、モックだと明示して先に形だけ作る。ただし実測値として見せない

住まい探しに限らず、「あとから探すもの」を前提にしているサービスは、順序を入れ替えるだけで別の体験になります。

## 関連記事

- [ジムを起点に住まいを探す — Go(Gin)+React と PostGIS で組む通勤圏APIの設計](/post/20261115muscle-realestate-tech/)
- [ジムから住む場所を決める！Go + Reactで作る「筋肉不動産」アプリの設計](/post/muscle-realestate/)

---

**「探す順序」からサービスを設計し直したい方はいませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1117897)
