---
title: "Sentence transformersを使って日本語版BERTで文章の分散表現を得る方法"
description: ""
date: "2021-02-03T15:58:41+09:00"
thumbnail: ""
tags: ["技術系","自然言語処理","BERT","分散表現",技術,sentence transformers]
---
- BERTは自然言語処理タスクに強力に応用できるモデルである。
- しかし、文章単位の特徴量をうまく取得できない。
- \[ CLS\] に文の特徴量が現れるという主張もあるが、それほどタスクに対して有益な情報は含まれていないと[この論文](https://arxiv.org/abs/1908.10084)は主張する。
- 文単位の特徴量を取得できるようにBERTを拡張するモデルがSentence BERTである。

## 2022/03追記
- [Hugging Face](https://huggingface.co/sonoisa/sentence-bert-base-ja-mean-tokens-v2)
で日本語のSentence BERTが公開されているのでそちらを利用してもいい。
- fugashi ipadicが単語分割のために要求されるのでインストールしておく
```
pip transformers fugashi ipadic
```

### サンプル
```py
from transformers import BertJapaneseTokenizer, BertModel
import torch


class SentenceBertJapanese:
    def __init__(self, model_name_or_path, device=None):
        self.tokenizer = BertJapaneseTokenizer.from_pretrained(model_name_or_path)
        self.model = BertModel.from_pretrained(model_name_or_path)
        self.model.eval()

        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = torch.device(device)
        self.model.to(device)

    def _mean_pooling(self, model_output, attention_mask):
        token_embeddings = model_output[0] #First element of model_output contains all token embeddings
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

    @torch.no_grad()
    def encode(self, sentences, batch_size=8):
        all_embeddings = []
        iterator = range(0, len(sentences), batch_size)
        for batch_idx in iterator:
            batch = sentences[batch_idx:batch_idx + batch_size]

            encoded_input = self.tokenizer.batch_encode_plus(batch, padding="longest", 
                                           truncation=True, return_tensors="pt").to(self.device)
            model_output = self.model(**encoded_input)
            sentence_embeddings = self._mean_pooling(model_output, encoded_input["attention_mask"]).to('cpu')

            all_embeddings.extend(sentence_embeddings)

        # return torch.stack(all_embeddings).numpy()
        return torch.stack(all_embeddings)


MODEL_NAME = "sonoisa/sentence-bert-base-ja-mean-tokens-v2"  # <- v2です。
model = SentenceBertJapanese(MODEL_NAME)

sentences = ["暴走したAI", "暴走した人工知能"]
sentence_embeddings = model.encode(sentences, batch_size=8)

print("Sentence embeddings:", sentence_embeddings)
```

## Sentence Transformers
- 以下はSentence Transformers を日本語BERTモデルで作成する際の手順になる。
### 環境構築
- 今回はGoogle colabでのモデル学習方法を行う。 

```
!pip install -U sentence-transformers
!apt-get install mecab mecab-ipadic-utf8 python-mecab libmecab-dev
!pip install mecab-python3 fugashi ipadic
```
- 日本語版BERTを使うのでそれに伴ってmecabなどのインストールが必要

### モデル構築
- sentence_transformersのライブラリを利用した場合、GPUについては指定しない場合、自動で利用する設定になるらしい。
```py
import transformers
from transformers import BertJapaneseTokenizer, BertModel

transformers.BertTokenizer = transformers.BertJapaneseTokenizer

from sentence_transformers import SentenceTransformer
from sentence_transformers import models,InputExample,losses
from sentence_transformers.losses import TripletDistanceMetric, TripletLoss
from sentence_transformers.evaluation import TripletEvaluator
from sentence_transformers.readers import TripletReader
from sentence_transformers.datasets import SentencesDataset
from torch.utils.data import DataLoader

# ver0.4までは以下
#transformer = models.BERT('cl-tohoku/bert-base-japanese-whole-word-masking')
# ver1.以上では以下
transformer = models.Transformer('cl-tohoku/bert-base-japanese-whole-word-masking')

pooling = models.Pooling(
    transformer.get_word_embedding_dimension(), 
    pooling_mode_mean_tokens=True, 
    pooling_mode_cls_token=False, 
    pooling_mode_max_tokens=False
)

model = SentenceTransformer(modules=[transformer, pooling])
```
### データセット作成
- センテンスに対してラベルを予測するモデルを考える。
- マルチラベルのデータを用意した。tripletのデータセットを作成する。
```py
df = pd.read_excel(report_path, dtype={'text':str,'tokens':str,'label':int,"cause":int,"effect":int,})

train_exapmle = []
labels = []
for index1, row1 in df.iterrows():    
    if row1['cause'] == 1:
        label = 1
    elif row1["effect"] == 1:
        label = 2
    else:
        label = 0
        
    train_exapmle.append(InputExample(texts=[row1.tokens], label=float(label)))
    labels.append(label)
```

    InputExample(texts=[row1.tokens], label=float(label))
- ここの記述は損失関数の選択によって修正する必要がある。
- 今回は BatchAllTripletLoss を選択したため、一つの文とラベルのセットになっている。
- 以下でpytorchでの学習用データローダーを作成する。
```py
train_example = SentenceLabelDataset(train_exapmle, samples_per_label=16)
train_dataloader = DataLoader(train_example, batch_size=32)
```
- batch_sizeは計算環境に応じて調整する。メモリ使用量に影響する。
- samples_per_labelは自動でtriplet datasetを作成する際のサンプリング数らしい。
  - ここで samples_per_label は batch_size の約数でなければならない。
- 他のデータの作り方は以下のリンクを参照する。

[Sentence transformer用にNatural Language Inference(NLI)形式でデータ作成]({{<ref "/post/20210217NLIBERT.md">}})

### 学習 training

```py
train_loss = losses.BatchAllTripletLoss(model)
model.fit(train_objectives=[(train_dataloader, train_loss)], epochs=30, warmup_steps=100)
```

### 文章の分散表現の獲得
文章のリストを入力すると、numpya.arrayの分散表現が得られる。
```py
nunpy_array = model.encode([str,str,])
```
### モデルの保存
```py
model.save(path.join(ROOT, "model","sentenceBERT"))
```
### モデルのロード
```py
model2 = SentenceTransformer(path.join(ROOT, "model","sentenceBERT"))
```

## 得られた分散表現の利用方法は以下
- [文書分類問題の応用]({{<ref "/post/20200618blog-post_54.md">}})
- [分散表現の利用法 バギングによるクラス分類や汎化性能についてのメモ]({{<ref "/post/20210204classifier.md">}})

## 分散表現の基礎を学習する
- Sentence Transformersのデモを動かせるjupyter notebookを用意しました。
- 実際に動かしてみて、感覚を掴みましょう
  - [Google colabを使ってSentence Transformersで日本語の文章の分散表現を取得](https://subcul-science.booth.pm/items/3714846)
- BERTなどに代表される言語モデルの基礎を抑えて、最新のモデルの根本を理解してトレンドを抑えましょう
  - [word2vecのアルゴリズムを把握するためにプログラムを動かしながら挙動を理解しよう]({{<ref "/post/20200615google-colaboratory-word2vec/index.md">}})
- またword2vecの派生系であり、未知語に強く計算時間が早いfasttextを抑えることもいいでしょう。
  - [Fasttextで文書分類問題までやったった]({{<ref "post/20200613fasttext/index.md">}})もオススメします。


## 参考リンク
- [公式ドキュメント](https://www.sbert.net/docs/package_reference/losses.html)
- [日本語での使用例](https://www.ogis-ri.co.jp/otc/hiroba/technical/similar-document-search/part9.html)

DNN系の自然言語処理には以下の書籍がおすすめ！
<div data-vc_mylinkbox_id="887898765"></div>

<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3639942&pid=887928593"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3639942&pid=887928593" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3639942&pid=887928593" border="0"></a></noscript>