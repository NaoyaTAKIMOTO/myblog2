---
title: "デッサン先生"
subtitle: "AIが6項目で採点。絵の上達を、データで加速する"
comments: false
---

## 「なんか違う」を、具体的なフィードバックに変える

絵を描いても、何が悪くてどう直せばいいかわからない。先生に見せる機会もない——そんなデッサン学習者の悩みに応えるアプリです。

**デッサン先生** は、写真をアップロードするだけでAIが6つの評価項目（構図・明暗・線の質・プロポーション・立体感・完成度）を10点満点でスコアリングし、具体的な改善アドバイスを返します。

---

## できること

### 6項目の定量スコアリング
「なんとなくダメ」ではなく、何点でどこが弱いかが数値でわかります。毎回の練習を記録することで成長の可視化にも使えます。

### 具体的な改善アドバイス
各項目に対して「影の付け方を意識してみましょう」「手前のオブジェクトをもう少し大きく」といった実践的なコメントが得られます。

### プライバシー保護のローカル処理
クラウドAPIを使わずローカルLLM（Ollama + Qwen3.5）で動作するため、描いた絵が外部に送信されません。

### iPadからそのまま送信
撮影してアップロードするだけ。スキャナ不要でスケッチブックの絵を即座に添削できます。

---

## こんな人に向いています

- 独学でデッサンを練習している人
- 定期的にフィードバックを受けたいアート学習者
- 絵の上達を数値で管理したい人

---

## 利用意向の確認

有料プランの利用を検討している方はこちらからご回答ください。

<div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
<form name="inquiry-dessan-sensei" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="inquiry-dessan-sensei" />
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

**AIアプリ開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
