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
  <a href="https://x-fav-gellery.com/?utm_source=subcul-science&utm_medium=lp&utm_campaign=x-fav-md&utm_content=hero" target="_blank" rel="noopener noreferrer"
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

1. **ログイン** — [x-fav-gellery.com](https://x-fav-gellery.com/?utm_source=subcul-science&utm_medium=lp&utm_campaign=x-fav-md&utm_content=text) にアクセスし、Xアカウントでログイン（Googleアカウントにも対応）
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
| 認証 | X OAuth 2.0 / Firebase Google OAuth |
| Chrome拡張 | TypeScript + Vite (Manifest V3) |
| インフラ | Docker Compose + Caddy（自動SSL） |

---

## あなたのいいねを、資産にしよう

押しっぱなしのいいねが、自分だけのコンテンツライブラリになります。
AIレコメンドが、好みに合った新たな出会いを届けます。

<div style="text-align: center; margin: 2rem 0;">
  <a href="https://x-fav-gellery.com/?utm_source=subcul-science&utm_medium=lp&utm_campaign=x-fav-md&utm_content=footer" target="_blank" rel="noopener noreferrer"
     style="background-color: #1DA1F2; color: white; padding: 14px 36px; border-radius: 8px; font-size: 1.1rem; font-weight: bold; text-decoration: none; display: inline-block;">
    X Favorites Gallery を使ってみる →
  </a>
</div>

---

## 利用意向の確認

有料プランの利用を検討している方はこちらからご回答ください。

<div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
<form name="inquiry-x-fav-gellery" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="inquiry-x-fav-gellery" />
  <div style="margin-bottom: 1rem;">
    <label style="display: block; font-weight: bold; margin-bottom: 0.4rem;">メールアドレス <span style="color: #e83929;">*</span></label>
    <input type="email" name="email" required placeholder="your@email.com" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box;" />
  </div>
  <div style="margin-bottom: 1rem;">
    <label style="display: block; font-weight: bold; margin-bottom: 0.4rem;">月額いくらまでなら利用を検討できますか？ <span style="color: #e83929;">*</span></label>
    <select name="budget" required style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; background: white;">
      <option value="">選択してください</option>
      <option value="free_only">無料でなければ使わない</option>
      <option value="under_3000">〜3,000円/月</option>
      <option value="under_10000">〜10,000円/月</option>
      <option value="under_30000">〜30,000円/月</option>
      <option value="over_30000">30,000円/月以上・相談したい</option>
    </select>
  </div>
  <div style="margin-bottom: 1rem;">
    <label style="display: block; font-weight: bold; margin-bottom: 0.4rem;">利用開始を検討している時期は？ <span style="color: #e83929;">*</span></label>
    <select name="timeline" required style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; background: white;">
      <option value="">選択してください</option>
      <option value="immediate">すぐにでも（1ヶ月以内）</option>
      <option value="3months">3ヶ月以内</option>
      <option value="6months">半年以内</option>
      <option value="undecided">まだ未定</option>
    </select>
  </div>
  <div style="margin-bottom: 1.5rem;">
    <label style="display: block; font-weight: bold; margin-bottom: 0.4rem;">ご要望・ご質問（任意）</label>
    <textarea name="message" rows="4" placeholder="使いたい機能、現在の課題など" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box; resize: vertical;"></textarea>
  </div>
  <button type="submit" style="background-color: #e83929; color: white; padding: 14px 36px; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; width: 100%;">
    送信する →
  </button>
</form>
</div>
