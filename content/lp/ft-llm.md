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

## β版 先行登録

β版リリース時にいち早くお知らせを受け取りたい方はこちらからご登録ください。

<iframe src="https://docs.google.com/forms/d/e/1FAIpQLScU91dYzxe1mBniwUabVQ83AjVNPvPAPaw5dgmVNjkRSBfz3Q/viewform?embedded=true&entry.219602922=ft-llm" width="100%" height="480" frameborder="0" marginheight="0" marginwidth="0">読み込んでいます…</iframe>

---

**LLMファインチューニング・機械学習開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
