---
title: "TopicDigestX"
subtitle: "Xのタイムラインを自動要約。見たいトピックだけを毎日ダイジェストで"
comments: false
---

## Xのタイムライン、追いきれていますか？

フォロー数が増えると、タイムラインは膨大な情報の洪水になります。本当に知りたいトピックの投稿を見逃すことも多くなります。

**TopicDigestX** は、関心のあるキーワードを登録しておくと、Xの関連ツイートを自動収集してLLMがトピックごとに要約するWebアプリです。毎日ダイジェストを読むだけで重要な情報をキャッチアップできます。

---

## できること

### キーワードでトピックを登録
「機械学習」「スタートアップ」「Go言語」など、追いたいトピックをキーワードで登録するだけです。

### LLMによる自動要約
収集したツイートをLLMが要約し、「今日のトレンド」「注目の議論」「重要なリンク」を整理して提示します。

### 読んだ・未読の管理
ダイジェスト単位で既読管理ができます。見逃した日のサマリーも後から確認できます。

### Docker Composeで簡単起動
セルフホスト対応。自分のサーバーで動かすことでAPIキーの管理・プライバシーを確保できます。

---

## こんな人に向いています

- 特定テーマのXトレンドを毎日把握したいリサーチャー
- タイムラインを追う時間を減らしたい情報収集者
- ニュースレターや社内報にXの情報を活用したい人

---

## 利用意向の確認

有料プランの利用を検討している方はこちらからご回答ください。

<div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
<form name="inquiry-topic-digestx" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="inquiry-topic-digestx" />
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

---

**FastAPI・LLMを使ったシステム開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
