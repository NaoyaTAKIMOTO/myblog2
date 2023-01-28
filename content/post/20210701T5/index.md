---
title: "日本語で学習済みのT5がhugging face で公開されたので使い方メモ"
description: ""
date: "2021-07-01T20:57:39+09:00"
thumbnail: ""
tags: [自然言語処理,T5,技術]
---
## T5(Text-To-Text Transfer Transformer) とは
- 事前学習における入出力を文に統一してしまうことで、
複数の形式の問題に対しても適応できる様式となった。
- モデルの基本構造としては Transformer が使われており、その点はBERTと共通している。
- 事前学習の形式をすべてテキストによる指定にするというアイデアはGPT-3などでも用いられている。
  - 0 shot learning など入力文で模範解答例を入力するだけで、出力を操作するということも行われている
  - "操作の指定:入力文１、出力に期待する文、操作の指定：入力文２"で、"出力文２"が得られるという次第

## できること
- 下流のタスクとして転移学習を行うことで以下のようなことが実行できる。
  - 文書分類
  - タイトル生成
  - 文章生成
  - 生成要約

## 生成要約の例
- 一つの原文から２種類の要約文を生成するファインチューニングが思いの外うまく働いた。

データとしては
| 原文                             | 要約文１       | 要約文２     |
| -------------------------------- | -------------- | ------------ |
| 原文のようなある程度の長さの文章 | そこからの要約 | タイトルとか |

これを以下のような形式に変換することでファインチューニング用の新たなタスクに落とし込む。

| body                                          | target         |
| --------------------------------------------- | -------------- |
| 要約タスク1: 原文のようなある程度の長さの文章 | そこからの要約 |
| 要約タスク2: 原文のようなある程度の長さの文章 | タイトルとか   |

- 文頭にタスクの名前を入れるだけでよい。
- これでそれなりに上手く動くのが不思議で仕方がない。

## サンプルコード
```
!pip install -qU torch==1.7.1 torchtext==0.8.0 torchvision==0.8.2
!pip install -q transformers==4.4.2 pytorch_lightning==1.2.1 sentencepiece
from os import path
import pandas as pd
import math
!mkdir -p /content/data /content/model
ROOT = "/content/drive/MyDrive/Colab_data/Tanshin"
# 事前学習済みモデル
PRETRAINED_MODEL_NAME = "sonoisa/t5-base-japanese"

# 転移学習済みモデル
MODEL_DIR = "/content/drive/MyDrive/Colab_data/Tanshin/t5generate"
```

```py
# https://github.com/neologd/mecab-ipadic-neologd/wiki/Regexp.ja から引用・一部改変
from __future__ import unicode_literals
import re
import unicodedata

def unicode_normalize(cls, s):
    pt = re.compile('([{}]+)'.format(cls))

    def norm(c):
        return unicodedata.normalize('NFKC', c) if pt.match(c) else c

    s = ''.join(norm(x) for x in re.split(pt, s))
    s = re.sub('－', '-', s)
    return s

def remove_extra_spaces(s):
    s = re.sub('[ 　]+', ' ', s)
    blocks = ''.join(('\u4E00-\u9FFF',  # CJK UNIFIED IDEOGRAPHS
                      '\u3040-\u309F',  # HIRAGANA
                      '\u30A0-\u30FF',  # KATAKANA
                      '\u3000-\u303F',  # CJK SYMBOLS AND PUNCTUATION
                      '\uFF00-\uFFEF'   # HALFWIDTH AND FULLWIDTH FORMS
                      ))
    basic_latin = '\u0000-\u007F'

    def remove_space_between(cls1, cls2, s):
        p = re.compile('([{}]) ([{}])'.format(cls1, cls2))
        while p.search(s):
            s = p.sub(r'\1\2', s)
        return s

    s = remove_space_between(blocks, blocks, s)
    s = remove_space_between(blocks, basic_latin, s)
    s = remove_space_between(basic_latin, blocks, s)
    return s

def normalize_neologd(s):
    s = s.strip()
    s = unicode_normalize('０-９Ａ-Ｚａ-ｚ｡-ﾟ', s)

    def maketrans(f, t):
        return {ord(x): ord(y) for x, y in zip(f, t)}

    s = re.sub('[˗֊‐‑‒–⁃⁻₋−]+', '-', s)  # normalize hyphens
    s = re.sub('[﹣－ｰ—―─━ー]+', 'ー', s)  # normalize choonpus
    s = re.sub('[~∼∾〜〰～]+', '〜', s)  # normalize tildes (modified by Isao Sonobe)
    s = s.translate(
        maketrans('!"#$%&\'()*+,-./:;<=>?@[¥]^_`{|}~｡､･｢｣',
              '！”＃＄％＆’（）＊＋，－．／：；＜＝＞？＠［￥］＾＿｀｛｜｝〜。、・「」'))

    s = remove_extra_spaces(s)
    s = unicode_normalize('！”＃＄％＆’（）＊＋，－．／：；＜＞？＠［￥］＾＿｀｛｜｝〜', s)  # keep ＝,・,「,」
    s = re.sub('[’]', '\'', s)
    s = re.sub('[”]', '"', s)
    return s
```

```py
import tarfile
import re

def remove_brackets(text):
    text = re.sub(r"(^【[^】]*】)|(【[^】]*】$)", "", text)
    return text

def normalize_text(text):
    assert "\n" not in text and "\r" not in text
    text = text.replace("\t", " ")
    text = text.strip()
    text = normalize_neologd(text)
    text = text.lower()
    return text

def read_title_body(file):
    next(file)
    next(file)
    title = next(file).decode("utf-8").strip()
    title = normalize_text(remove_brackets(title))
    body = normalize_text(" ".join([line.decode("utf-8").strip() for line in file.readlines()]))
    return title, body
```

```
report_path=path.join(ROOT, "data","raw", '決算短信要約データ解析.xlsx')
df = pd.read_excel(report_path, sheet_name="data")
```

```py
all_data = []
for i, rows in df.iterrows():
    text = str(rows["原文"])
    if str(text) == "nan":
        continue
    abstract_text = rows["要約文"]

    text = text.replace("\n","")
    abstract_text = abstract_text.replace("\n","")
    text = normalize_text(text)
    abstract_text = normalize_text(abstract_text)
    if len(text) > 0:
        all_data.append({
            "body": "短信要約:"+text,
            "title": abstract_text
            })
```

```py
import random
from tqdm import tqdm

random.seed(1234)
random.shuffle(all_data)

def to_line(data):
    title = data["title"]
    body = data["body"]

    assert len(title) > 0 and len(body) > 0
    return f"{title}\t{body}\n"

data_size = len(all_data)
train_ratio, dev_ratio, test_ratio = 0.5, 0.2, 0.3


with open(path.join(ROOT, "data","processed","train.tsv"), "w", encoding="utf-8") as f_train, \
    open(path.join(ROOT, "data","processed","dev.tsv"), "w", encoding="utf-8") as f_dev, \
    open(path.join(ROOT, "data","processed","test.tsv"), "w", encoding="utf-8") as f_test:
    
    for i, data in tqdm(enumerate(all_data)):
        line = to_line(data)
        if i < train_ratio * data_size:
            f_train.write(line)
        elif i < (train_ratio + dev_ratio) * data_size:
            f_dev.write(line)
        else:
            f_test.write(line)
```


```py
import argparse
import glob
import os
import json
import time
import logging
import random
import re
from itertools import chain
from string import punctuation

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
import pytorch_lightning as pl


from transformers import (
    AdamW,
    T5ForConditionalGeneration,
    T5Tokenizer,
    get_linear_schedule_with_warmup
)

### 乱数シードの設定
def set_seed(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

set_seed(42)

### GPU利用有無
USE_GPU = torch.cuda.is_available()

### 各種ハイパーパラメータ
args_dict = dict(
    data_dir=path.join(ROOT, "data","processed"),  # データセットのディレクトリ
    model_name_or_path=PRETRAINED_MODEL_NAME,
    tokenizer_name_or_path=PRETRAINED_MODEL_NAME,

    learning_rate=3e-4,
    weight_decay=0.0,
    adam_epsilon=1e-8,
    warmup_steps=0,
    gradient_accumulation_steps=1,

    # max_input_length=512,
    # max_target_length=64,
    # train_batch_size=8,
    # eval_batch_size=8,
    # num_train_epochs=4,

    n_gpu=1 if USE_GPU else 0,
    early_stop_callback=False,
    fp_16=False,
    opt_level='O1',
    max_grad_norm=1.0,
    seed=42,
)

```

```py
class TsvDataset(Dataset):
    def __init__(self, tokenizer, data_dir, type_path, input_max_len=512, target_max_len=512):
        self.file_path = os.path.join(data_dir, type_path)
        
        self.input_max_len = input_max_len
        self.target_max_len = target_max_len
        self.tokenizer = tokenizer
        self.inputs = []
        self.targets = []

        self._build()
  
    def __len__(self):
        return len(self.inputs)
  
    def __getitem__(self, index):
        source_ids = self.inputs[index]["input_ids"].squeeze()
        target_ids = self.targets[index]["input_ids"].squeeze()

        source_mask = self.inputs[index]["attention_mask"].squeeze()
        target_mask = self.targets[index]["attention_mask"].squeeze()

        return {"source_ids": source_ids, "source_mask": source_mask, 
                "target_ids": target_ids, "target_mask": target_mask}

    def _make_record(self, title, body):
        # ニュースタイトル生成タスク用の入出力形式に変換する。
        input = f"{body}"
        target = f"{title}"
        return input, target
  
    def _build(self):
        with open(self.file_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip().split("\t")
                assert len(line) == 2
                assert len(line[0]) > 0
                assert len(line[1]) > 0

                title = line[0]
                body = line[1]

                input, target = self._make_record(title, body)

                tokenized_inputs = self.tokenizer.batch_encode_plus(
                    [input], max_length=self.input_max_len, truncation=True, 
                    padding="max_length", return_tensors="pt"
                )

                tokenized_targets = self.tokenizer.batch_encode_plus(
                    [target], max_length=self.target_max_len, truncation=True, 
                    padding="max_length", return_tensors="pt"
                )

                self.inputs.append(tokenized_inputs)
                self.targets.append(tokenized_targets)

```

```py
### トークナイザー（SentencePiece）モデルの読み込み
tokenizer = T5Tokenizer.from_pretrained(PRETRAINED_MODEL_NAME, is_fast=True)

### テストデータセットの読み込み
train_dataset = TsvDataset(tokenizer, args_dict["data_dir"], "train.tsv", 
                           input_max_len=1024, target_max_len=128)
```

```py
class T5FineTuner(pl.LightningModule):
    def __init__(self, hparams):
        super().__init__()
        self.hparams = hparams

        # 事前学習済みモデルの読み込み
        self.model = T5ForConditionalGeneration.from_pretrained(hparams.model_name_or_path)

        # トークナイザーの読み込み
        self.tokenizer = T5Tokenizer.from_pretrained(hparams.tokenizer_name_or_path, is_fast=True)

    def forward(self, input_ids, attention_mask=None, decoder_input_ids=None, 
                decoder_attention_mask=None, labels=None):
        """順伝搬"""
        return self.model(
            input_ids,
            attention_mask=attention_mask,
            decoder_input_ids=decoder_input_ids,
            decoder_attention_mask=decoder_attention_mask,
            labels=labels
        )

    def _step(self, batch):
        """ロス計算"""
        labels = batch["target_ids"]

        # All labels set to -100 are ignored (masked), 
        # the loss is only computed for labels in [0, ..., config.vocab_size]
        labels[labels[:, :] == self.tokenizer.pad_token_id] = -100

        outputs = self(
            input_ids=batch["source_ids"],
            attention_mask=batch["source_mask"],
            decoder_attention_mask=batch['target_mask'],
            labels=labels
        )

        loss = outputs[0]
        return loss

    def training_step(self, batch, batch_idx):
        """訓練ステップ処理"""
        loss = self._step(batch)
        self.log("train_loss", loss)
        return {"loss": loss}

    def validation_step(self, batch, batch_idx):
        """バリデーションステップ処理"""
        loss = self._step(batch)
        self.log("val_loss", loss)
        return {"val_loss": loss}

    def test_step(self, batch, batch_idx):
        """テストステップ処理"""
        loss = self._step(batch)
        self.log("test_loss", loss)
        return {"test_loss": loss}

    def configure_optimizers(self):
        """オプティマイザーとスケジューラーを作成する"""
        model = self.model
        no_decay = ["bias", "LayerNorm.weight"]
        optimizer_grouped_parameters = [
            {
                "params": [p for n, p in model.named_parameters() 
                            if not any(nd in n for nd in no_decay)],
                "weight_decay": self.hparams.weight_decay,
            },
            {
                "params": [p for n, p in model.named_parameters() 
                            if any(nd in n for nd in no_decay)],
                "weight_decay": 0.0,
            },
        ]
        optimizer = AdamW(optimizer_grouped_parameters, 
                          lr=self.hparams.learning_rate, 
                          eps=self.hparams.adam_epsilon)
        self.optimizer = optimizer

        scheduler = get_linear_schedule_with_warmup(
            optimizer, num_warmup_steps=self.hparams.warmup_steps, 
            num_training_steps=self.t_total
        )
        self.scheduler = scheduler

        return [optimizer], [{"scheduler": scheduler, "interval": "step", "frequency": 1}]

    def get_dataset(self, tokenizer, type_path, args):
        """データセットを作成する"""
        return TsvDataset(
            tokenizer=tokenizer, 
            data_dir=args.data_dir, 
            type_path=type_path, 
            input_max_len=args.max_input_length,
            target_max_len=args.max_target_length)
    
    def setup(self, stage=None):
        """初期設定（データセットの読み込み）"""
        if stage == 'fit' or stage is None:
            train_dataset = self.get_dataset(tokenizer=self.tokenizer, 
                                             type_path="train.tsv", args=self.hparams)
            self.train_dataset = train_dataset

            val_dataset = self.get_dataset(tokenizer=self.tokenizer, 
                                           type_path="dev.tsv", args=self.hparams)
            self.val_dataset = val_dataset

            self.t_total = (
                (len(train_dataset) // (self.hparams.train_batch_size * max(1, self.hparams.n_gpu)))
                // self.hparams.gradient_accumulation_steps
                * float(self.hparams.num_train_epochs)
            )

    def train_dataloader(self):
        """訓練データローダーを作成する"""
        return DataLoader(self.train_dataset, 
                          batch_size=self.hparams.train_batch_size, 
                          drop_last=True, shuffle=True, num_workers=4)

    def val_dataloader(self):
        """バリデーションデータローダーを作成する"""
        return DataLoader(self.val_dataset, 
                          batch_size=self.hparams.eval_batch_size, 
                          num_workers=4)


```

```py
### 学習に用いるハイパーパラメータを設定する
args_dict.update({
    "max_input_length":  1024,  # 入力文の最大トークン数
    "max_target_length": 128,  # 出力文の最大トークン数
    "train_batch_size":  2,  # 訓練時のバッチサイズ
    "eval_batch_size":   4,  # テスト時のバッチサイズ
    "num_train_epochs":  8,  # 訓練するエポック数
    })
args = argparse.Namespace(**args_dict)

train_params = dict(
    accumulate_grad_batches=args.gradient_accumulation_steps,
    gpus=args.n_gpu,
    max_epochs=args.num_train_epochs,
    precision= 16 if args.fp_16 else 32,
    amp_level=args.opt_level,
    gradient_clip_val=args.max_grad_norm,
)
```

```py
### 転移学習の実行（GPUを利用すれば1エポック10分程度）
model = T5FineTuner(args)
if finetune_is:
    trainer = pl.Trainer(**train_params)
    trainer.fit(model)

    # 最終エポックのモデルを保存
    model.tokenizer.save_pretrained(MODEL_DIR)
    model.model.save_pretrained(MODEL_DIR)

del model
```

```py
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import T5ForConditionalGeneration, T5Tokenizer

### 学習済みモデル
if finetune_is:
    # トークナイザー（SentencePiece）
    tokenizer = T5Tokenizer.from_pretrained(MODEL_DIR, is_fast=True)
    trained_model = T5ForConditionalGeneration.from_pretrained(MODEL_DIR)
else:

    # トークナイザー（SentencePiece）
    tokenizer = T5Tokenizer.from_pretrained(PRETRAINED_MODEL_NAME, is_fast=True)

    # 学習済みモデル
    trained_model = T5ForConditionalGeneration.from_pretrained(PRETRAINED_MODEL_NAME)

### GPUの利用有無
USE_GPU = torch.cuda.is_available()
if USE_GPU:
    trained_model.cuda()
```

```py
import textwrap
from tqdm.auto import tqdm
from sklearn import metrics

### テストデータの読み込み
test_dataset = TsvDataset(tokenizer, args_dict["data_dir"], "test.tsv", 
                          input_max_len=args.max_input_length, 
                          target_max_len=args.max_target_length)

test_loader = DataLoader(test_dataset, batch_size=4, num_workers=4)

trained_model.eval()

inputs = []
outputs = []
targets = []

for batch in tqdm(test_loader):
    input_ids = batch['source_ids']
    input_mask = batch['source_mask']
    if USE_GPU:
        input_ids = input_ids.cuda()
        input_mask = input_mask.cuda()

    output = trained_model.generate(input_ids=input_ids, 
        attention_mask=input_mask, 
        max_length=args.max_target_length,
        temperature=1.5,          # 生成にランダム性を入れる温度パラメータ
        repetition_penalty=2.0,   # 同じ文の繰り返し（モード崩壊）へのペナルティ
        )

    output_text = [tokenizer.decode(ids, skip_special_tokens=True, 
                            clean_up_tokenization_spaces=False) 
                for ids in output]
    target_text = [tokenizer.decode(ids, skip_special_tokens=True, 
                               clean_up_tokenization_spaces=False) 
                for ids in batch["target_ids"]]
    input_text = [tokenizer.decode(ids, skip_special_tokens=True, 
                               clean_up_tokenization_spaces=False) 
                for ids in input_ids]

    inputs.extend(input_text)
    outputs.extend(output_text)
    targets.extend(target_text)
    
```

```py
for output, target, input in zip(outputs, targets, inputs):
    print("generated: " + output)
    print("actual:    " + target)
    print("body:      " + input)
    print()
```
## デモを触ってみた感想
- 思った以上にうまく出力している印象を受けた。
- リンク先のサンプルプログラムを多少改造することでそれぞれのタスクに対応できるという柔軟性の高さもいい感じ。
- 転移学習のハイパーパラメータには検討の余地がある
  - しかし、ハイパラチューニングしている間に新しいSOTAモデルが提案されている気はする


## 参考リンク
公開元の解説や使用例がわかりやすいので、そちらを是非読んでいただきたい。

google colab で使用例が公開されているので、
デモプログラムを簡単に実行できる。

[日本語T5のgithub](https://github.com/sonoisa/t5-japanese)

以下では分散表現を得たあとにどのように利用するかを書いている

[文書分類問題の応用はなにがある？]({{<ref "/post/20200618blog-post_54.md" >}})

## 分散表現の仕組みについて学ぶ
- 単語の分散表現を得るとはどういうことか、ご存知ですか？
- 単語の意味を学習する分散表現について、実際にプログラムを実行しながら仕組みを理解しましょう
- 分散表現の学習のイメージをつかめるとBERT系で何をどのように学習しているのかについても理解が深まります。

詳しくは以下のリンク

> [Googlecolaboratory と pythonで学ぶ初めての 自然言語処理入門](https://subcul-science.booth.pm/items/1562211)
> 本ドキュメントを利用することで自然言語処理における分散表現の仕組みが理解でき、読者が新しい自然言語処理のサービスを開発する助けになる。

<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3639942&pid=887928593"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3639942&pid=887928593" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3639942&pid=887928593" border="0"></a></noscript>