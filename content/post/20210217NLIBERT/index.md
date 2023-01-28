---
title: " Sentence transformer用にNatural Language Inference(NLI)形式でデータ作成"
description: ""
date: "2021-02-17T10:32:03+09:00"
thumbnail: ""
tags: [NLI,sentence transformer,技術,自然言語処理,文書分類]
---
Sentence Transformer を使って、
文書間の因果関係を推論しようとしている。

これができれば、報告書からそのインシデントの原因と症状を抽出できる。

そこで特徴量の学習にNLIを因果関係の情報抽出に使えないか？と考えた。

## NLIとは
二つの文章の 前後関係を推測する

- 順
- 逆
- 無関係

の三つの関係である。


## 因果関係に当てはめる
NLIの３つの関係性を因果関係に当てはめると以下のパターンが考えられる。

- コントラディクション：原因、結果のペア
- エンテイルメント：結果、原因のペア
- ニュートラル：原因もしくは結果とそれ以外のペア 

事例の報告書の件数×3以上はデータを作成できる。

## スクリプトの例　

やりたいことは

- データフレームからとある事例について抜き出して、コントラディクションとエンテイルメントのペアを作成
- データフレームからランダムに２行を抽出して、
ニュートラルのペアを作成

```py
import random

traindev_samples = []
data_size = 400
train_batch_size = 32
(cause_text_list, effect_text_list, other_texts_list) = extract_cause_effect_other_text(df)
# contradiction
for i in range(max(df["doc_no"])):
    effect_text = effect_text_list[i].replace(" ","")
    cause_text = cause_text_list[i]
    if len(effect_text) == 0 or len(cause_text) == 0:
        continue
    else:
        traindev_samples.append(InputExample(texts=[effect_text, cause_text], label=label2int["contradiction"]))
# entailment
for i in range(max(df["doc_no"])):
    effect_text = effect_text_list[i].replace(" ","")
    cause_text = cause_text_list[i]
    if len(effect_text) == 0 or len(cause_text) == 0:
        continue
    else:
        traindev_samples.append(InputExample(texts=[cause_text, effect_text], label=label2int["entailment"]))
# neutral
random.seed(45)
choise_patterns = {"cause2other":0, "effect2other":1,"other2cause":2, "other2effect":3}
for i in range(data_size):
    ind_0 = random.randint(0, max(df["doc_no"])-1)
    ind_1 = random.randint(0, max(df["doc_no"])-1)
    if ind_0 == ind_1:
        continue
    else:
        choice = random.randint(0, 3)
        other_texts = other_texts_list[ind_1]
        if len(other_texts) == 0:
            continue
        other_text = random.sample(other_texts,k=1)[0]
        if choice == 0:
            traindev_samples.append(InputExample(texts=[cause_text_list[ind_0], other_text], label=label2int["neutral"]))
        elif choice == 1:
            traindev_samples.append(InputExample(texts=[effect_text_list[ind_0], other_text], label=label2int["neutral"]))
        elif choice == 2:
            traindev_samples.append(InputExample(texts=[other_text, cause_text_list[ind_0]], label=label2int["neutral"]))
        elif choice == 3:
            traindev_samples.append(InputExample(texts=[other_text, effect_text_list[ind_0]], label=label2int["neutral"]))
```
## 損失関数の設定
０，１，２のラベルの予測問題として解釈して、損失関数にはsoftmaxを選択した。
```py
train_loss = losses.SoftmaxLoss(model=model, sentence_embedding_dimension=model.get_sentence_embedding_dimension(), num_labels=len(label2int))
```
## 学習
具体的なモデルの学習方法は[Sentence transformerで日本語モデルを学習して文章の分散表現を得る方法]({{<ref "/post/20210203SBERT.md">}})を参照する

## 疑問
- 学習のエポックはどうするか？
  - そこはハイパーパラメータなんかな？
- データの数は学習にどのように影響するか？

DNN系の自然言語処理には以下の書籍がおすすめ！
<div data-vc_mylinkbox_id="887699994"></div>