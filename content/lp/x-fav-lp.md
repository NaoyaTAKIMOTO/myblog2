---
title: "X Favorites Gallery"
subtitle: "いいねした投稿を、AIが整理・レコメンドするパーソナルギャラリー"
comments: false
---

## X/Twitterのいいね、見返せていますか？

X（Twitter）でいいねした投稿が、流れていくだけになっていませんか。
**X Favorites Gallery** は、いいねした画像・動画・テキストを自動収集し、
AIレコメンドで新たな発見ができるパーソナルギャラリーアプリです。

<div style="text-align: center; margin: 2rem 0;">
  <a href="https://x-fav-gellery.com/" target="_blank" rel="noopener noreferrer"
     style="background-color: #1DA1F2; color: white; padding: 14px 36px; border-radius: 8px; font-size: 1.1rem; font-weight: bold; text-decoration: none; display: inline-block;">
    今すぐギャラリーをつくる →
  </a>
</div>

<div style="text-align: center; margin: 2.5rem 0;">
  <img src="/img/IMG_3883.png" alt="X Favorites Gallery ギャラリー画面" style="max-width: 320px; width: 100%; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.18); border: 1px solid #e0e0e0;">
  <p style="color: #888; font-size: 0.9rem; margin-top: 0.75rem;">いいねした画像がギャラリー形式で一覧表示される</p>
</div>

---

## なぜ必要なのか

Xのいいねは「あとで見る」のつもりで押すことが多いですが、タイムラインに埋もれて実際に見返す機会はほとんどありません。公式の「いいね一覧」は検索もできず、コンテンツの種類で絞り込む機能もありません。

**X Favorites Gallery** を使えば：

- いいねした画像・動画がギャラリー形式で見返せる
- AIが「この画像が好きならこれも好きかも」と類似コンテンツを提示する
- 自分だけのパーソナルなコンテンツコレクションとして蓄積される

---

## 具体的にできること

### Chrome拡張で自動収集
インストール後、Xのいいねページを開くだけで自動スクレイピングが始まります。画像・動画・テキストのいずれにも対応しており、動画はサムネイルを自動生成します。

### AIによる類似コンテンツのレコメンド
Meta製の最先端ビジョンモデル **DINOv2** による画像埋め込みを使用。閲覧中の画像に視覚的に似たコンテンツをリアルタイムで提示します。「あの絵柄の作品をもっと見たい」という使い方ができます。

<div style="display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; margin: 1.5rem 0;">
  <div style="text-align: center;">
    <img src="/img/IMG_3884.png" alt="ツイート詳細とおすすめ表示" style="max-width: 240px; width: 100%; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); border: 1px solid #e0e0e0;">
    <p style="color: #888; font-size: 0.85rem; margin-top: 0.5rem;">投稿の詳細とおすすめアカウントを表示</p>
  </div>
  <div style="text-align: center;">
    <img src="/img/IMG_3886.png" alt="類似コンテンツのレコメンド" style="max-width: 240px; width: 100%; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); border: 1px solid #e0e0e0;">
    <p style="color: #888; font-size: 0.85rem; margin-top: 0.5rem;">画像をクリックするとAIが類似コンテンツを10件提示</p>
  </div>
</div>

### NSFWフィルタリング
NSFW分類モデルによる自動フィルタリングを搭載。センシティブなコンテンツを適切に管理できます。

### 公式アーカイブのインポート
X公式の「データのダウンロード」で取得したZIPファイルをアップロードすれば、過去のいいね履歴を一括で取り込めます。

---

## 使い方

1. **ログイン** — [x-fav-gellery.com](https://x-fav-gellery.com/) にアクセスし、Googleアカウントでログイン
2. **Chrome拡張のセットアップ** — 設定画面でAPIキーを発行し、Chrome拡張に登録
3. **収集開始** — XのいいねページをChromeで開くと自動スクレイピングが走る
4. **閲覧・発見** — ギャラリーで好きな画像をクリックすると、AIが類似コンテンツをレコメンド

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js / React / Tailwind CSS |
| データベース | PostgreSQL + pgvector（ベクトル検索） |
| AI | DINOv2 埋め込み / NSFW分類 |
| 認証 | Firebase Google OAuth |
| Chrome拡張 | TypeScript + Vite (Manifest V3) |
| インフラ | Docker Compose + Caddy（自動SSL） |

---

## あなたのいいねを、資産にしよう

押しっぱなしのいいねが、自分だけのコンテンツライブラリになります。
AIレコメンドが、好みに合った新たな出会いを届けます。

<div style="text-align: center; margin: 2rem 0;">
  <a href="https://x-fav-gellery.com/" target="_blank" rel="noopener noreferrer"
     style="background-color: #1DA1F2; color: white; padding: 14px 36px; border-radius: 8px; font-size: 1.1rem; font-weight: bold; text-decoration: none; display: inline-block;">
    X Favorites Gallery を使ってみる →
  </a>
</div>

---

## β版 先行登録

新機能のβ版リリース時にいち早くお知らせを受け取りたい方はこちらからご登録ください。

<iframe src="https://docs.google.com/forms/d/e/1FAIpQLScU91dYzxe1mBniwUabVQ83AjVNPvPAPaw5dgmVNjkRSBfz3Q/viewform?embedded=true&entry.219602922=x-fav-gellery" width="100%" height="480" frameborder="0" marginheight="0" marginwidth="0">読み込んでいます…</iframe>
