---
title: "海亀チャット"
subtitle: "AIが謎を守る。水平思考クイズで思考力を鍛える対話ゲーム"
comments: false
---

## 「海亀のスープ」を、AIと何問でも楽しむ

水平思考クイズ（海亀スープ）は「はい」「いいえ」で質問しながら謎を解くゲームです。でも、GMを毎回人間がやるのは大変——問題を用意して、質問に答え続けるのは手間がかかります。

**海亀チャット** は、AIがGMを担当する水平思考クイズアプリです。思考の枠を外してくれる謎に、いつでも何問でも挑戦できます。

---

## できること

### AIが「はい」「いいえ」「わからない」で回答
Cohere command-r-plusモデルが問題の答えを知った上でGMを担当。プレイヤーの質問に対して正確に「はい」「いいえ」「関係ない」を返します。

### 豊富な問題をCSVで管理
問題はCSVファイルで管理されており、自分で追加・編集できます。オリジナルの謎を用意して友人に出題することも可能です。

### Hugging Face Spacesで無料公開
セットアップ不要。ブラウザでアクセスするだけですぐに遊べます。

### ヒント機能付き
詰まったときはヒントをリクエストできます。完全に諦めたら答えも表示されます。

---

## こんな人に向いています

- 論理的思考・発想力を楽しみながら鍛えたい人
- 友人や家族と一緒にパーティゲームとして楽しみたい人
- 自分で作った謎をAI GMに出題したいパズル好き

---

## 利用意向の確認

有料プランの利用を検討している方はこちらからご回答ください。

<div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
<form name="inquiry-umigame-chat" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="inquiry-umigame-chat" />
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

**GradioやHugging Faceを使ったAIアプリ開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
