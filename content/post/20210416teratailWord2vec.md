---
title: "word2vecでteratailの検索システムっぽいものを作る"
description: ""
date: "2021-04-16T12:21:29+09:00"
thumbnail: ""
tags: [word2vec,分散表現,自然言語処理,技術,技術系,スクレイピング,pytorch,google colaboratory,制作物]
---
## 概要
分散表現を用いた検索システムを作る。

1. teratailから質問をスクレイピングする。
2. スクレイピングした文章をもとにword2vecを学習する。
3. word2vecによって得られた分散表現をもとにcosine similarityを計算して、クエリと質問文の類似度を得る。
4. 類似度をもとにソートする。

## ソース
[teratail_w2v_question.ipynb](https://colab.research.google.com/drive/1YeWBFTptroOury6DjI9ly7j-fVmtdYei?usp=sharing)