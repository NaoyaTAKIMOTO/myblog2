---
title: "How to train a Japanese model with Sentence transformer to get a distributed representation of a sentence"
description: ""
date: "2021-02-03T15:58:41+09:00"
thumbnail: ""
tags: ["technical", "natural language processing", "BERT", "distributed representation",technology,sentence transformer]
---.
BERT is a model that can be powerfully applied to natural language processing tasks.

However, it does not do a good job of capturing sentence-wise features.

Some claim that sentence features appear in \[ CLS\ ], but
This paper](https://arxiv.org/abs/1908.10084) claims that it does not contain that much useful information for the task.

Sentence BERT is a model that extends BERT to be able to obtain features per sentence.

The following are the steps to create Sentence BERT in Japanese.

## Build the environment
We will use Google colab to train the model. 

````
! pip install -U sentence-transformers
! apt-get install mecab mecab-ipadic-utf8 python-mecab libmecab-dev
!pip install mecab-python3 fugashi ipadic
````
Since we are using the Japanese version of BERT, we need to install mecab etc. along with it.

## Model building
If you don't specify GPU, it will be set to use it automatically.
```py
import transformers
from transformers import BertJapaneseTokenizer, BertModel

BertTokenizer = transformers.BertJapaneseTokenizer

from sentence_transformers import SentenceTransformer
from sentence_transformers import models,InputExample,losses
from sentence_transformers.losses import TripletDistanceMetric, TripletLoss
from sentence_transformers.evaluation import TripletEvaluator
from sentence_transformers.readers import TripletReader
from sentence_transformers.datasets import SentencesDataset
from torch.utils.data import DataLoader

# Until ver0.4, the following
#transformer = models.BERT('cl-tohoku/bert-base-japanese-whole-word-masking')
# In ver1. and above
Transformer = models.Transformer('cl-tohoku/bert-base-japanese-whole-word-masking')

Pooling = models.Pooling(
    transformer.get_word_embedding_dimension(), 
    pooling_mode_mean_tokens=True, 
    pooling_mode_cls_token=False, 
    pooling_mode_max_tokens=False
)

model = SentenceTransformer(modules=[transformer, pooling])
````
## Create dataset
Consider a model that predicts labels for sentences.

We have a multi-label data set, so we create a triplet data set.
```py
df = pd.read_excel(report_path, dtype={'text':str,'tokens':str,'label':int, "cause":int, "effect":int,})

train_exapmle = []
labels = []
for index1, row1 in df.iterrows():    
    if row1['cause'] == 1:
        label = 1
    elif row1["effect"] == 1:
        label = 2
    else:
        label = 0
        
    train_exapmle.append(InputExample(text=[row1.tokens], label=float(label)))
    labels.append(label)
````

    InputExample(text=[row1.tokens], label=float(label))
The description here needs to be modified depending on your choice of loss function.

In this case, we chose BatchAllTripletLoss, so we have a single statement and a set of labels.

In the following, we create a data loader for training with pytorch.
```py
train_example = SentenceLabelDataset(train_exapmle, samples_per_label=16)
train_dataloader = DataLoader(train_example, batch_size=32)
```.
- Adjust the batch_size according to your computing environment. It affects memory usage.
- samples_per_label is the number of samples to be sampled for automatic triplet dataset creation.

Here, samples_per_label must be a fraction of batch_size.

For more information on how to create other data, please refer to the following link.

[Create data in Natural Language Inference (NLI) format for Sentence transformer]({{<ref "/post/20210217NLIBERT.md">}})

## Training

```py
train_loss = losses.BatchAllTripletLoss(model)
model.fit(train_objectives=[(train_dataloader, train_loss)], epochs=30, warmup_steps=100)
```

## Acquire a distributed representation of sentences
Enter a list of sentences to get a distributed representation of numpya.array.
```py
nunpy_array = model.encode([str,str,])
```
## Save the model.
```py
model.save(path.join(ROOT, "model", "sentenceBERT"))
```
## Load the model
```py
model2 = SentenceTransformer(path.join(ROOT, "model", "sentenceBERT"))
```

## The resulting distributed representation can be used in the following ways
[Application of the document classification problem]({{<ref "/post/20200618blog-post_54.md">}})

[Usage of Distributed Representation A note on classifier and generalization performance by bagging]({{<ref "/post/20210204classifier.md">}})

## Learn the basics of distributed representation.
> ### [First introduction to natural language processing with Googlecolaboratory and python](https://subcul-science.booth.pm/items/1562211)
> > This document will help you understand how distributed representation works in natural language processing, and will help readers develop new natural language processing services.

## Reference Links
- [Official document](https://www.sbert.net/docs/package_reference/losses.html)
- [Examples in Japanese](https://www.ogis-ri.co.jp/otc/hiroba/technical/similar-document-search/part9.html)

<iframe style="width:120px;height:240px;" marginwidth="0" marginheight="0" scrolling="no" frameborder="0" src="//rcm-fe.amazon-adsystem. com/e/cm?lt1=_blank&bc1=000000&IS2=1&bg1=FFFFFF&fc1=000000&lc1=0000FF&t=subculturesci-22&language=en_JP&o=9&p=8&l=as4&m=amazon&f= ifr&ref=as_ss_li_til&asins=B084WPRT44&linkId=7f1720c9cca99ccf6b5daeb1270354fa"></iframe