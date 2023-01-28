---
title: 'python でのmlflowの使い方'
date: 2020-07-18T16:24:00.000+09:00
draft: false
aliases: [ "/2020/07/python-mlflow.html" ]
tags : [技術系,python,devops,mlflow,技術]
---

## python でmlflow使うメモ

実験結果を比較するために便利っぽいのでmlflow を使ってみた。

パラメータと実験結果の記録をある程度自動化できる。

機械学習の実践はある種の黒魔術となることが多いので再現性を担保するための努力は後々に影響する。

使う際の手順をメモしておく。

## mlflow のインストール
pip でインストールできる。

```sh
pip install mlflow
```

## クイックスタート
pythonで以下のような記述を用いる。

```py
with mlflow.start_run():  
   mlflow.log_param("a", 1)  
   mlflow.log_metric("b", 2)  
   mlflow.log_artifact("output.txt")
```

log\_paramにはパラメータを入れる。

log\_metricには損失関数や評価指標を入れる。valueには数値しか受け付けない。

log\_params({"example":hoge，“example2”：True})の方が便利。 同様にlog\_metricsもある。

log\_artifact でファイルを保存できる(csvやjsonなど)。metricの書式に当てはまらないものをこちらで保存する。

## 実験の種類ごとに枠を作る
CLI で以下を実行してexperimentを作成する。

```sh
mlflow experiments create --experiment-name fraud-detection
```

CLI でexperimentが作成されたことを確認。

experiment \_idをメモしておく。

```sh
mlflow experiments list  

```

以下のようにpythonで記述して、experimentを指定する。

```py
mlflow.set_experiment('experiment_name')  
  
with mlflow.start_run():  
   mlflow.log_param("a", 1)  
   mlflow.log_metric("b", 2)  
   mlflow.log_artifact("output.txt")  

```

## 実験結果の比較

CLIでサーバーを立ち上げる。

```sh
mlflow ui
```

表示されたアドレスをブラウザで開く。

サーバーを落とす時はctrl＋c。

<a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3563352&pid=887689136" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3563352&pid=887689136" height="1" width="1" border="0">BTOパソコンならパソコンショップSEVEN</a>