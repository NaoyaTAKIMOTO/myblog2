---
title: "hugging face でBART(文章要約モデル)を使ってみた"
description: ""
date: "2021-01-19T03:03:11+09:00"
thumbnail: ""
tags: [技術系,自然言語処理,python,技術,分散表現,文生成, 要約,BART]
---

- BARTは文書要約のためのモデル
- BERTと同じtransformerの派生
- BERTとは異なり、encoder-decoderの構造
    - これは文生成を目的とするため

## 2022/03追記
- [日本語の文章要約についてのまとめ]({{<ref "post/20220309summarize-matome/index.md">}})を作成した

このページではBARTのチュートリアルを実行する手順を示す。

## 手順
1. transformersのインストール

```sh
pip install transformers
```
2. 要約の実行

```py
from transformers import BartTokenizer, BartForConditionalGeneration, BartConfig

model = BartForConditionalGeneration.from_pretrained('facebook/bart-large')
tokenizer = BartTokenizer.from_pretrained('facebook/bart-large')

ARTICLE_TO_SUMMARIZE = "My friends are cool but they eat too many carbs."
inputs = tokenizer([ARTICLE_TO_SUMMARIZE], max_length=1024, return_tensors='pt')

# Generate Summary
summary_ids = model.generate(inputs['input_ids'], num_beams=4, max_length=5, early_stopping=True)
print([tokenizer.decode(g, skip_special_tokens=True, clean_up_tokenization_spaces=False) for g in summary_ids])
```

2021/01/18ではMyMy friendsと出力された。

面白い。

## ハマったところ
pytorchのバージョンがtransformersの指定と異なるとエラーが出た。
```
pip install -U torch
```
でpytorchをアップデートして解決した。

## コツ
max_lengthが単語列の長さ、num_beamsがビームサーチの幅を指定する。

max_lengthが生成される文の長さを調整する。

長い文を生成する場合にはより幅の広い探索をしないと局所解に陥って不自然な文が出力された。

二つのパラメータは計算時間とのトレードオフなので小さいものから試していくのがいい。

## 参考リンク
- [transformers 公式ドキュメント](https://huggingface.co/transformers/model_doc/bart.html)

## 分散表現の仕組みについて学ぶ
- 単語の意味を学習する分散表現について実際にプログラムを実行しながら仕組みを理解しませんか？
  - [Googlecolaboratory と pythonで学ぶ初めての 自然言語処理入門](https://subcul-science.booth.pm/items/1562211)
- 分散表現の学習のイメージをつかめるとBERT系で何をどのように学習しているのかについても理解が深まります。

## 最後に
不明点などあればコメントお願いします！

DNN系の自然言語処理には以下の書籍がおすすめ！
<div data-vc_mylinkbox_id="887898765"></div>

<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3639942&pid=887928593"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3639942&pid=887928593" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3639942&pid=887928593" border="0"></a></noscript>