---
title: '学習済みUniversal Sentence Encoder を使って日本語の文章の分散表現を得る手順'
date: 2020-06-22T18:29:00.006+09:00
draft: false
aliases: [ "/2020/06/universal-sentence-encoder.html" ]
tags : [技術系,自然言語処理,universal sentence encoder,技術,python,分散表現]
---

Universal Sentence Encoder を使って文書のベクトルが得られる。

## 特徴

多言語に対応している。

日本語にも対応している。

日本語の文章をベクトルで扱える

## 使い道

クラスタリング、類似度の計算、特徴量の抽出

## 使い方

準備として以下のコマンドを実行する。

```sh
pip install tensorflow tensorflow_hub tensorflow_text numpy   
```

学習済みのモデルが公開されている。

具体的な利用方法は以下のpythonの記述を参照

```py
import tensorflow_hub as hub  
import tensorflow_text
import numpy as np  
# for avoiding error  
import ssl  
ssl._create_default_https_context = ssl._create_unverified_context  

def cos_sim(v1, v2):  
   return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))  
  
embed = hub.load("https://tfhub.dev/google/universal-sentence-encoder-multilingual/3")  
  
texts = ["昨日、お笑い番組を見た。", "昨夜、テレビで漫才をやっていた。", "昨日、公園に行った。", "I saw a comedy show last night.", "Yesterday, I went to the park."]  
vectors = embed(texts)  
```

より詳細は以下のリンクを参照

[Universal Sentence Encoderを日本語で試す](https://qiita.com/kenta1984/items/9613da23766a2578a27a)


### 追記
```py
import tensorflow_text
_ = tensorflow_text
```
この行がないと、sentencepieceが見つからない！的なエラーが出る。
サンプルのソースでは明示的には使用されていないが、
実際の実行時には必要になる。

### モデルの保存
sslの設定はhttps周りの安全な接続を回避する設定らしいので、
できたら使わないほうがいいよと助言を受けた。

また何回もダウンロードする必要ないよね、とのことだったのでモデルを以下のようにして保存する。

```py
import tensorflow as tf
tf.saved_model.save(embed, module_no_signatures_path)
```

### モデルのロード
```py
import tensorflow as tf
import tensorflow_text
imported = tf.saved_model.load(module_no_signatures_path)
```

## 参考リンク
得られた分散表現の利用方法は以下を参照

> #### [文書分類問題の応用はなにがある？]({{<ref "/post/20200618blog-post_54.md" >}})
> 
> 機械学習について勉強したけど、その使い道が分からん！ってなってないですか？

## 分散表現の仕組みについて学ぶ

単語の意味を学習する分散表現について、
実際にプログラムを実行しながら仕組みを理解しませんか？

分散表現の学習のイメージをつかめるとBERT系で何をどのように学習しているのかについても理解が深まります。

詳しくは以下のリンク

> ### [Googlecolaboratory と pythonで学ぶ初めての 自然言語処理入門](https://subcul-science.booth.pm/items/1562211)
> 本ドキュメントを利用することで自然言語処理における分散表現の仕組みが理解でき、読者が新しい自然言語処理のサービスを開発する助けになる。