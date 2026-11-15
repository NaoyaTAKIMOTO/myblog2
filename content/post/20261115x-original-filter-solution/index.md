---
title: "タイムラインがリポストとパクリで埋まる — 表示だけを変える重複フィルタの設計"
date: 2026-11-15T15:10:00+09:00
draft: false
tags: [chrome-extension, twitter, timeline, duplicate-detection, privacy, 課題解決]
summary: "X のタイムラインがリポストと転載で埋まる問題を、投稿を消さずに表示だけ変えて解きます。既存のミュートや NG ワードで足りない理由から、投稿時刻で原本を決める設計、ハミング距離の閾値調整と誤検知からの復帰までを、ブラウザ内で完結する実装とあわせて整理しました。"
---

## タイムラインが転載で埋まる

X を開くと、同じ画像が3回、4回と流れてきます。リポストの表示ならまだ分かりますが、画像だけを保存して本文を差し替えた投稿が混ざり始めると、タイムラインは読む気が失せます。

問題は、どれが原本かを目で追えないことです。タイムラインは新しい順に流れてくるので、最初に見たものが原本とは限りません。後から本物の投稿が現れて、ようやく「さっき見たのは転載だったのか」と分かります。

**X Original Filter** は、この状況に対して「表示だけを変える」アプローチを取ります。投稿を削除も通報もせず、ブラウザ上で非表示にするだけの Chrome 拡張です。

## 既存手段の限界

| 手段 | できること | 限界 |
|---|---|---|
| X 標準のミュート / ブロック | アカウント単位で非表示にできる | 転載アカウントは増え続ける。同じ画像を出すたびに設定が要る |
| NG ワードの設定 | 語句で投稿を消せる | 画像の重複は見えない |
| 「この投稿を表示しない」 | その投稿だけ消せる | 次に流れてきた転載には効かない |
| 逆画像検索 API | Web 全体の初出を調べられる | 画像を外部に送る。コストもかかる |

この拡張が狙ったのは、4番目の「初出を知る」に近い体験を、画像を外に出さずに得ることでした。README でも、転載元がタイムラインに無い場合は検出できないと明記しています。Web 全体の初出判定は範囲外です。

## 解決の設計

設計の軸は3つです。

- **判定はブラウザ内**: 画像の取得先は `pbs.twimg.com` だけで、判定結果を送る先は無い
- **原本は投稿時刻で決める**: 到着順ではなく `time[datetime]` を比較する
- **消さずに隠す**: DOM からは抜かず CSS で隠し、誤検知はワンクリックで戻せる

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: 目視で我慢する</strong>
    <div class="diagram-box">同じ画像が何度も流れてくる</div>
    <div class="diagram-box">どれが原本か分からない</div>
    <div class="diagram-box">転載アカウントを1件ずつミュート</div>
    <div class="diagram-box">タイムラインが転載で埋まる</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: X Original Filter</strong>
    <div class="diagram-box">リポストは流れた時点で非表示</div>
    <div class="diagram-box">重複画像は投稿時刻の早い方を残す</div>
    <div class="diagram-box">原作家はホワイトリストで保護</div>
    <div class="diagram-box">誤検知はクリックで復帰</div>
  </div>
</div>
<p class="diagram-caption">図1: タイムラインの見え方の前後比較</p>
</div>

トレードオフは「どこまで自動で隠すか」でした。完全自動にすると、誤検知がそのまま読めない投稿になります。かといって確認を挟むと手作業が残ります。そこで、既定は非表示にしつつ、折りたたみモードとホワイトリストという2段の逃げ道を用意しました。

## 実装の要点

### 1. 設定・カウント・ハッシュを別々の場所に置く

設定は `chrome.storage.sync`、当日のカウントは `chrome.storage.local`、ハッシュは IndexedDB `xof` に置きます。同期させたいのは設定だけで、閲覧に依存するカウントやハッシュは端末内に留めます。

```js
// src/lib.js（DEFAULTS の一部）
hammingThreshold: 5,
minTextLength: 60,
whitelist: [],
selfHandle: ''
```

`hammingThreshold` は 0〜12、`minTextLength` は 20〜500 の範囲で設定ページから変えられます。既定値は `src/lib.js` の `DEFAULTS` にあり、`manifest.json` の `options_ui` から開く設定ページの UI と対応しています。

### 2. 閾値の変更は再読み込みなしで効かせる

設定ページのスライダーは `change` で保存し、content script 側は `chrome.storage.onChanged` で受け取ります。

```js
// src/options.js
$('hammingThreshold').addEventListener('change', (event) =>
  save({ hammingThreshold: Number(event.target.value) })
);
```

保存されると content script が `applySettings()` を呼び、次の走査から新しい閾値が使われます。ページを開き直す必要はありません。上げすぎると誤検知が増えるため、README では 5 前後が実用域と書いています。

### 3. 誤検知からは1クリックで戻す

隠したセルには `data-xof-hidden-kind` が付きます。折りたたみモードでは帯のクリックで戻せます。

```js
// src/content.js（unhide）
function unhide(cell) {
  if (!cell || !cell.dataset || !cell.dataset.xofHiddenKind) return;
  cell.classList.remove('xof-hidden', 'xof-collapsed');
  const badge = cell.querySelector(':scope > .xof-badge');
  if (badge) badge.remove();
  delete cell.dataset.xofHiddenKind;
  delete cell.dataset.xofLabel;
}
```

完全非表示のままでも、拡張自体をオフにすれば `unhideAll` が走ってまとめて表示に戻ります。ホワイトリストに原作家のハンドルを入れておけば、その作者の投稿は常に原本として扱われ、転載側が隠れます。自分のハンドルを空にしておくと、サイドバーのアカウントボタンから自動で拾います。

## 結果

- リポストは流れてきた時点で非表示になる
- 同じ画像は投稿時刻の早い方だけが残り、後発は隠れる
- 同一ハンドルの再掲は「パクツイ」ではないので触らない
- 隠した件数はポップアップとバッジに出る（999 件を超えると `999+` 表示）

数値面では、照合に使うハミング距離の既定値が 5、テキスト判定の最小文字数が 60、保持するレコードが 6000 件です。利用者数や削減率のような指標はリポジトリに記録がないため、ここには書きません。

検証はユニットテスト 27 件と、Playwright のフル Chromium で拡張を読み込む E2E です。E2E は X に接続せず、DOM を模したローカルページで「リポスト」「重複画像」「先に見た方が転載」の3ケースを確認します。

## 向かないケース・残課題

- **転載元がタイムラインに無い**: 検出できません。逆画像検索 API を使えば範囲は広がりますが、コストとプライバシーの理由で採用していません
- **動画・GIF・引用内の画像**: 対象外です。静止画の `tweetPhoto` のみを見ます
- **語順を入れ替えたテキスト**: 完全一致系なので追従しません
- **トリミングや文字入れ**: dHash は縮小画像の勾配を見るため弱いです
- **X の DOM 変更**: `data-testid` が変わると壊れます。セレクタの更新が必要です

この拡張は投稿を削除も通報もしません。表示を変えるだけなので、問題のある投稿を「なかったこと」にはできません。

## まとめ

- 原本の判定は投稿時刻で行う。タイムラインの到着順は信用しない
- 自動化するのは判定まで。隠し方と戻し方は人が選べるようにする
- 画像を外に出さない構成なら、プライバシーとコストの両方を抑えられる

「完全自動で消す」のではなく「自動で判定して、戻せる形で隠す」に寄せたのが、この拡張の立ち位置です。

## 関連記事

- [dHash とハミング距離で重複画像を判定する Chrome 拡張 — X Original Filter の技術構成](/post/20261115x-original-filter-tech/)

---

**タイムラインのノイズ除去やブラウザ拡張の開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
