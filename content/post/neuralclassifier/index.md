---
title: '文書分類問題に対応するめちゃたくさんのモデルを提供するライブラリNeuralClassifier の使い方について'
date: 2020-06-15T02:11:00.007+09:00
draft: false
aliases: [ "/2020/06/neuralclassifier.html" ]
tags : [技術系,自然言語処理,neural classifier,技術,python,fasttext,]
---

[![](https://1.bp.blogspot.com/-YlMb8v77MN4/XurdQSzS1yI/AAAAAAAAg6Y/oSZrJ0c9yxYbzQnNNTynRvZnEp-xGE7NwCK4BGAsYHg/s320/AFE90C8A-A49C-4475-9F05-50E2D56D5B63.jpeg)](https://1.bp.blogspot.com/-YlMb8v77MN4/XurdQSzS1yI/AAAAAAAAg6Y/oSZrJ0c9yxYbzQnNNTynRvZnEp-xGE7NwCK4BGAsYHg/s1920/AFE90C8A-A49C-4475-9F05-50E2D56D5B63.jpeg)

NeuralClassifier: An Open-source Neural Hierarchical Multi-label Text Classification Toolkit はTencentが公開しているマルチラベルな文書分類問題用のpythonライブラリです。  

詳しくは

> [NeuralClassifier: An Open-source Neural Hierarchical Multi-label Text Classification Toolkit](https://github.com/Tencent/NeuralNLP-NeuralClassifier)
>NeuralClassifier is designed for quick implementation of neural models for hierarchical multi-label classification task, which is more challenging and common in real-world scenarios. 

を参照しましょう。

文書分類問題に特化して複数のモデルで学習、分類が可能なライブラリです。

mecabなどを用いて前処理として単語の分割を行えば日本語のデータに対しても利用可能です。

さて、以下ではこのライブラリの使い方を開設します。

## 環境設定
pytorch に依存しているライブラリなので、あらかじめ以下のコマンドでinstallしておきます。

```sh
pip install torch
```

また、作業用のディレクトリにレポジトリをcloneします。今回はzipをダウンロードして用いました。

## 実行方法
コマンドラインから.pyファイルをそれぞれ実行することで、学習、評価、予測を行います。

```sh
python train.py conf/train.json
```

conf/train.json に実行時の設定が記述されています。必要に応じて変更します。

```sh
python eval.py conf/train.json
```

で学習済みのモデルを評価できます。

各ラベルに対してprecision、 recall 、f value をまとめたものと混合行列を、それぞれ.txt形式で出力します。

## conf/train.json の設定
各種モデルのハイパーパラメータや学習、評価時に利用されるモデルの選択について記述されています。  

主に必要なのは、cpuかgpuの指定、入力データの情報、学習と評価に用いるモデルの選択に関しての記述になります。

num＿workerで警告が出たので0に変更すると解消した。

入力データは指定の形式を守って作成し、パスを指定します。

モデルの指定は学習用のモデルの指定と評価用のモデルの指定が独立して別に存在するので、注意すること。

## 入力データの形式


```json
JSON example:  
  
{  
   "doc_label": ["Computer--MachineLearning--DeepLearning", "Neuro--ComputationalNeuro"],  
   "doc_token": ["I", "love", "deep", "learning"],  
   "doc_keyword": ["deep learning"],  
   "doc_topic": ["AI", "Machine learning"]  
}  
{  
   "doc_label": ["Computer--MachineLearning--DeepLearning"],  
   "doc_token": ["I", "love", "deep", "learning"],  
   "doc_keyword": ["deep learning"],  
   "doc_topic": ["AI", "Machine learning"]  
}
```

この形式で作成すること！

厳密にはjsonの形式を守ってはいないので、pythonでデータを作成する際にはdictデータをjsonで出力する方法は取れません。諦めて、ファイルに一行ずつ書き込むのがよいです。

またこの例ではマルチラベルの例を示しているが、シングルラベルの場合にも要素数が1のリスト形式とすることに注意しましょう。私はそこでハマりました。

## **文書分類問題の応用について**
- [文書分類問題の応用はなにがある？]({{<ref "/post/20200618blog-post_54.md">}})


## 分散表現の仕組みについて学ぶ

単語の意味を学習する分散表現について、
実際にプログラムを実行しながら仕組みを理解しませんか？

分散表現の学習のイメージをつかめるとBERT系で何をどのように学習しているのかについても理解が深まります。

詳しくは以下のリンク

- [Googlecolaboratory と pythonで学ぶ初めての 自然言語処理入門](https://subcul-science.booth.pm/items/1562211)


<!-- MAF Rakuten Widget FROM HERE -->
<script type="text/javascript">MafRakutenWidgetParam=function() { return{ size:'468x160',design:'slide',recommend:'on',auto_mode:'on',a_id:'2220301', border:'off'};};</script><script type="text/javascript" src="//image.moshimo.com/static/publish/af/rakuten/widget.js"></script>
<!-- MAF Rakuten Widget TO HERE -->