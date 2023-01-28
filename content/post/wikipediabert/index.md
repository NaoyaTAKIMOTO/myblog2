---
title: '日本語Wikipediaで学習したBERTが公開されたので使い方のメモ'
date: 2020-06-17T07:34:00.013+09:00
draft: false
aliases: [ "/2020/06/wikipediabert.html" ]
tags : [技術系,自然言語処理,bert,技術,python,分散表現]
---

- huggingface がBERTの日本語モデルを公開しました。
- 日本語モデルはtransformersに含まれています。
- しかし、Mac 環境で実際に動かすまでにいくつか躓いたので、メモを残しておきます。

## 前準備:mecabのインストール

- 形態素解析エンジンであるmecabが BERT の日本語モデルを利用する際に必要になります。
- おそらくトークナイザがmecabを要求する仕組みになっています。
- 今回はhomebrew を利用して、Mecab とipadicをインストールします。

```sh
brew install mecab mecab-ipadic
```

- 辞書を更新するために、適当な辞書用のディレクトリを作成し、以下のコマンドを実行します。

```sh
git clone --depth 1 https://github.com/neologd/mecab-ipadic-neologd.git  
./bin/install-mecab-ipadic-neologd -n -a
```

- python のmecabラッパーをインストールします。

```sh
pip install mecab-python3
```

## transformersのインストール
- [huggingface/transformers](https://github.com/huggingface/transformers)
- 公式のドキュメントに従ってtransformersをインストールします。

```sh
pip install transformers
```

## BERT の利用方法については下記の例を参考にします。
- [clｰtohoku](https://github.com/cl-tohoku/bert-japanese)

```py
import torch  
from transformers.tokenization_bert_japanese import BertJapaneseTokenizer  
from transformers.modeling_bert import BertForMaskedLM  
tokenizer = BertJapaneseTokenizer.from_pretrained('bert-base-japanese-whole-word-masking
```

- bert-base-japanese-whole-word-maskingは学習時に用いたトークナイズの方法(単語区切りか文字区切り)を指定しています。

```py
model = BertForMaskedLM.from_pretrained('bert-base-japanese-whole-word-masking')
```

- タスクに対応したBERTモデルを読み込みます。
- 今回はMLM(Masked Language Model )となります。
- マスクトークンが存在する位置に入る単語の確率を返します。

```py
input_ids = tokenizer.encode(f'''  
   青葉山で{tokenizer.mask_token}の研究をしています。  
''', return_tensors='pt')
```

- トークナイザを利用して、トークンを対応する辞書番号に変換します。

```py
print(input_ids)  
print(tokenizer.convert_ids_to_tokens(input_ids[0].tolist()))
```

- id番号を対応する辞書のトークンに置き換えます。

```py
masked_index = torch.where(input_ids == tokenizer.mask_token_id)[1].tolist()[0]  
print(masked_index)  
result = model(input_ids)  
pred_ids = result[0][:, masked_index].topk(5).indices.tolist()[0]  
for pred_id in pred_ids:  
   output_ids = input_ids.tolist()[0]  
   output_ids[masked_index] = pred_id  
   print(tokenizer.decode(output_ids))
```

- マスクトークンが入っている位置に入る確率が高いトークンをk=5個表示します。
- BERT のモデルを指定することで、単語の確率だけでなく、分散表現も計算できます。
```py
hidden_states = result.hidden_states
```

## 自然言語の分散表現を取得したあとの応用範囲

### 単語の分散表現の応用範囲は以下のリンク

- [文書分類問題の応用はなにがある？]({{<ref "/post/20200618blog-post_54.md">}})
- [分散表現の利用法 バギングによるクラス分類や汎化性能について]({{<ref "/post/20210204classifier.md">}})


### 分散表現の仕組みについて学ぶ

単語の意味を学習する分散表現について、
実際にプログラムを実行しながら仕組みを理解しませんか？

分散表現の学習のイメージをつかめるとBERT系で何をどのように学習しているのかについても理解が深まります。

詳しくは以下のリンク
> ### [Googlecolaboratory と pythonで学ぶ初めての 自然言語処理入門](https://subcul-science.booth.pm/items/1562211)
> 本ドキュメントを利用することで自然言語処理における分散表現の仕組みが理解でき、読者が新しい自然言語処理のサービスを開発する助けになる。

<div data-vc_mylinkbox_id="887685228"></div>