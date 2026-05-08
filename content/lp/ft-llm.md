---
title: "ローカルLLMファインチューニング"
subtitle: "Apple Siliconで独自LLMを作る。クラウド不要・コストゼロ"
comments: false
---

## 「自分用のLLM」を、手元のMacで育てる

LLMのファインチューニングはGPUサーバーが必要で高コスト——そう思っていませんか。Apple Silicon（M1/M2/M3/M4）のMacなら、クラウドなしで独自LLMを作れます。

**ローカルLLMファインチューニング** は、MLX + LoRAを使ってApple Silicon上でLLMをファインチューニングするパイプラインです。独自データで学習させた日本語対応の小型LLMを、コストゼロで手元に持てます。

---

## できること

### Apple SiliconのGPUをフル活用
MLXフレームワークがM1〜M4チップのUnified Memoryを最大限に活用。16GBメモリのMacBookでも実用的な速度でファインチューニングできます。

### LoRAで効率的な学習
全パラメータを更新せず差分だけを学習するLoRAにより、メモリ消費を抑えながら高品質なファインチューニングが可能です。

### 日本語読解データで学習済み
JsQuAD（日本語読解QAデータセット）での学習パイプラインを提供。独自データへの差し替えも容易です。

### 早期停止・カスタムロス対応
過学習を防ぐ早期停止とChunked Lossを実装済み。長時間学習の品質管理も自動化されています。

---

## こんな人に向いています

- 社内データで専用LLMを作りたいエンジニア
- クラウドAPIのコスト・プライバシーが気になる開発者
- Apple Silicon MacでAI開発を始めたい人

---

## 利用意向の確認

有料プランの利用を検討している方はこちらからご回答ください。

<div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
<form name="inquiry-ft-llm" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="inquiry-ft-llm" />
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

**LLMファインチューニング・機械学習開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
