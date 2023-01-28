---
title: "要約文の評価指標についてのメモ"
description: ""
date: "2021-01-20T11:00:34+09:00"
thumbnail: ""
tags: [自然言語処理,評価指標,技術]
---
生成式要約文のモデルに需要がある。

そのモデルの評価指標についてのめも。

結論としてはやはり正解になる文の用意は必要だということ。

そこを省きたいんだけどなぁ？


## 自動の各種評価指標
- rouge
    - 正解文との一致度をn-gramで評価
- bleu
- meteor
- BERT score
    - embeddingでcos simを計算
- 何にせよ正解文は必要になる

## 人力
多分、ネイティブの人間を雇って、点数をつけていくのだと思う。

## 最後に
補足情報などあるとコメントしてください。

## 参考リンク
- https://towardsdatascience.com/evaluating-text-output-in-nlp-bleu-at-your-own-risk-e8609665a213
- https://www.cs.cmu.edu/~alavie/METEOR/README.html
- https://arxiv.org/pdf/1904.09675.pdf
-