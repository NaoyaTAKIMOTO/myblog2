---
title: "ロブスター（Discord Bot）"
subtitle: "サーバーに常駐するローカルAI。雑談もニュースも、クラウド不要"
comments: false
---

## Discordに「賢い住人」を追加する

ChatGPT APIは使い続けるとコストがかさむ。プライベートなサーバーの会話をクラウドに送りたくない——そんなニーズに応えるDiscord Botです。

**ロブスター** は、Mac mini M4上のローカルLLM（qwen2.5:14b）で動作する関西弁AIです。クラウドAPIなしでサーバーのメンバーと自然な雑談ができ、テックニュースの自動投稿機能も備えています。

---

## できること

### 関西弁で自然な雑談
qwen2.5:14bによる高品質な日本語会話。関西弁キャラクターとして設定されており、堅苦しくない空気を作ります。

### テックニュースの自動投稿
はてなブックマーク・Zenn・Qiitaから最新記事を自動収集し、設定したチャンネルに定期投稿します。情報収集の手間を省けます。

### 完全ローカル動作
Mac mini M4上のOllamaで推論するため、会話内容が外部サーバーに送信されません。APIコストもゼロです。

### 用途に合わせてカスタマイズ
システムプロンプトやキャラクター設定を変更するだけで、別のペルソナにも対応できます。

---

## こんな人に向いています

- Discord サーバーにAIキャラクターを常駐させたい人
- APIコストを抑えてAIチャットボットを運用したい人
- チーム向けにテックニュースを自動配信したい人

---

## 利用意向の確認

有料プランの利用を検討している方はこちらからご回答ください。

<div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
<form name="inquiry-discord-bot" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="inquiry-discord-bot" />
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

**Discord Bot・ローカルLLM導入でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
