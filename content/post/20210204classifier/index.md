---
title: "分散表現の利用法 バギングによるクラス分類や汎化性能について"
description: ""
date: "2021-02-04T13:24:19+09:00"
thumbnail: ""
tags: [分散表現,技術系,機械学習,汎化性能,技術]
---

分散表現が得られた後、
機械学習によってクラス分類を行うことができる。

使えるモデルとして
- 決定木
- SVM サポートベクターマシン
- NN ニューラルネット

などがある。

SVMは広義のNNに含まれる。

ここでは決定木を用いた方法にする。

## バギング
- 複数の決定木による多数決的なイメージ
- シンプルな理論
    - 決定木は説明可能性が高く、古典的な機械学習モデル
    - 計算負荷も深層学習に比較して軽い
        - モデルの大きさによる
- 説明可能性はあまりない
    - 複数の決定木それぞれを解析するのだろうか？

```py
from sklearn.ensemble import BaggingClassifier
from sklearn.tree import DecisionTreeClassifier

bagging = BaggingClassifier(DecisionTreeClassifier(class_weight="balanced"),
                                        n_estimators=best_params["n_estimators"],
                                            max_samples=best_params["max_samples"],
                                            max_features=best_params["max_features"], n_jobs=-1, )
bagging.fit(X_train, y_train)
y_pred = bagging.predict(X_test)
```

## 汎化性能の調整
- トレーニングデータでの予測性能が高いにも関わらず、テストデータでは予測性能が低い場合はままある。
- テストデータはトレーニングデータに含まれない未知のデータなのでそれ自体は自然なこと
- しかし、実際にはテストデータ、未知のデータでの性能向上こそが目的であることが多い
- そのような性能を汎化性能と呼ぶ

### ハイパーパラメータ調整
- モデルにはさまざまなパラメータがある。
- 学習によって調整されないパラメータをハイパーパラメータと呼ぶ
- このハイパーパラメータは学習で調整されないが、モデルの性能に影響することもある
- 主に二つの方法がある
    - エキスパートが調整する
        - データコンペでやっていること？
    - ハイパーパラメータを最適化するステップを設ける
        - optunaと呼ばれるハイパーパラメータ最適化ライブラリがある
        - ガウス過程最適化はこのステップに使われることが多い

### アンダーサンプリング
- randam under samplingが経験的には有効
- ラベルの数に偏りがあるときに間引きを行う
- トレーニングデータのラベルに偏りがある場合、モデルはラベルの偏りを学習する
- 間引きによってラベルの偏りをならすことで、トレーニングデータ内でのラベルの偏りを減らす

### データ水増し data augmentation
- 逆にサンプルの個数を水増しする方法もある
- 自然な偽データを作る必要がある
    - 画像分野では反転、回転、拡大縮小などがよく使われている
    - 自然言語分野ではバックトランスレーションが使われる
        - 例えば機械翻訳によって日→英→日と翻訳する

## 参考リンク
- [sklearn.ensemble.BaggingClassifier](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.BaggingClassifier.html)
- [optuna](https://optuna.org/)


<!-- MAF Rakuten Widget FROM HERE -->
<script type="text/javascript">MafRakutenWidgetParam=function() { return{ size:'468x160',design:'slide',recommend:'on',auto_mode:'on',a_id:'2220301', border:'off'};};</script><script type="text/javascript" src="//image.moshimo.com/static/publish/af/rakuten/widget.js"></script>
<!-- MAF Rakuten Widget TO HERE -->