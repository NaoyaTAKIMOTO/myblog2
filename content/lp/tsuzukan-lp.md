---
title: "tsuzukan（続刊）"
subtitle: "漫画・小説の続きを買い忘れない。新刊を自動検出してワンクリック購入"
comments: false
layout: "tsuzukan"
---

## 「あの漫画、続き出たっけ？」をなくす

複数シリーズを追いかけていると、気づいたら数巻分が積み上がっていた——そんな経験はありませんか。
**tsuzukan（続刊）** は、持っている漫画・小説を登録しておくと、シリーズの新刊を自動検出してAmazon・楽天の購入リンクをワンクリックで生成するWebアプリです。

<div style="text-align: center; margin: 2rem 0;">
  <a href="https://tsuzukan.com/" target="_blank" rel="noopener noreferrer"
     style="background-color: #e83929; color: white; padding: 14px 36px; border-radius: 8px; font-size: 1.1rem; font-weight: bold; text-decoration: none; display: inline-block;">
    今すぐ使ってみる →
  </a>
</div>

<div style="text-align: center; margin: 2.5rem 0;">
  <img src="/img/image.png" alt="tsuzukan ダッシュボード画面" style="max-width: 680px; width: 100%; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); border: 1px solid #e0e0e0;">
  <p style="color: #888; font-size: 0.9rem; margin-top: 0.75rem;">ダッシュボードで所有書籍・シリーズ数・新刊数を一目で把握できる</p>
</div>

---

## なぜ続刊を見逃してしまうのか

漫画の新刊発売日を把握するには、出版社のサイトを個別に確認したり、SNSで情報を拾ったりする必要があります。複数シリーズを追っていると管理しきれず、気づいたら何巻もスキップしてしまいます。

**tsuzukan** を使えば：

- 持っている本をスキャン・検索・CSVで一括登録できる
- シリーズを自動検出し、未所持の新刊を一覧表示する
- Amazon・楽天のカートへ直接飛べるリンクがワンクリックで取得できる

---

## 具体的にできること

### バーコードスキャンで瞬時に登録
スマホのカメラでISBNバーコードを読み取るだけで書籍情報（タイトル・著者・出版社）を自動取得して登録します。openBD APIと連携しているため手入力は不要です。

### 購入履歴から一括インポート
楽天市場・AmazonのCSVをアップロードするだけで、既存コレクションを一括登録できます。KindleなどAmazonデジタル商品にも対応しています。

### シリーズを自動グループ化
タイトルと著者名から連番シリーズを自動検出。英語サブタイトルや括弧内のふりがなが混在するケースにも対応した独自の正規化ロジックを搭載しています。

### 新刊をまとめて確認・購入
「新刊一覧」ページで、登録済みシリーズの未所持巻がシリーズごとにアコーディオン表示されます。Amazon・楽天のカートURLをワンクリックで生成します。

---

## 使い方

### 書籍を登録する

**スマホのカメラで登録**
1. [tsuzukan.com](https://tsuzukan.com/) にスマホでアクセス
2. 「カメラを起動」ボタンをタップ
3. 書籍のISBNバーコードにカメラをかざす — 自動で登録される

**タイトル・著者名で検索して登録**
検索欄に入力すると楽天Books APIで候補が表示されます。選んで登録するだけです。

**CSVで一括登録**
1. 楽天市場またはAmazonの購入履歴CSVをダウンロード
2. 「一括登録」ページでファイルをアップロード — 書籍を自動検出して登録

### 新刊をチェックして購入する
「新刊一覧」ページを開くと、シリーズ別に未所持巻が表示されます。欲しい巻の「Amazon」または「楽天」ボタンを押すとカートへ直接遷移します。

---

## 資料ダウンロード

<div style="text-align: center; margin: 1.5rem 0;">
  <a href="/tsuzukan.pdf" target="_blank" rel="noopener noreferrer"
     style="background-color: #f5f5f5; color: #333; padding: 12px 32px; border-radius: 8px; font-size: 1rem; font-weight: bold; text-decoration: none; display: inline-block; border: 1px solid #ccc;">
    📄 tsuzukan 概要資料をダウンロード（PDF）
  </a>
</div>

---

## こんな人に向いています

- 複数のシリーズ漫画・ラノベを追いかけているコレクター
- 続きを買い忘れることを防ぎたい人
- 楽天・Amazonを使い分けて購入したい人
- 既存の購入履歴をまとめて登録したい人

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| バックエンド | Go 1.21 + Gin |
| フロントエンド | React 19 + TypeScript + Vite |
| データベース | PostgreSQL |
| 外部API | openBD / 楽天Books API |
| バーコードスキャン | html5-qrcode |
| スタイリング | Tailwind CSS v4 |

---

## 続刊を、もう見逃さない

本棚の「持っている本」を登録するだけで、あとはtsuzukanが新刊をチェックします。
買い忘れのない読書生活を、今日から始めましょう。

<div style="text-align: center; margin: 2rem 0;">
  <a href="https://tsuzukan.com/" target="_blank" rel="noopener noreferrer"
     style="background-color: #e83929; color: white; padding: 14px 36px; border-radius: 8px; font-size: 1.1rem; font-weight: bold; text-decoration: none; display: inline-block;">
    tsuzukan（続刊）を使ってみる →
  </a>
</div>

---

## 利用意向の確認

有料プランの利用を検討している方はこちらからご回答ください。

<div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
<form name="inquiry-tsuzukan" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="inquiry-tsuzukan" />
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
