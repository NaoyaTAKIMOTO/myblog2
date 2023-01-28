---
title: 'A note on how to use BERT learned from Japanese Wikipedia, now available'
date: 2020-06-17T07:34:00.013+09:00
draft: false
aliases: [ "/2020/06/wikipediabert.html" ]
tags : [technical,natural language processing,bert,technology,python,distributed representation]
---

huggingface has released a Japanese model for BERT.

The Japanese model is included in transformers.

However, I stumbled over a few things before I could get it to actually work in a Mac environment, so I'll leave a note.

## Preliminaries: Installing mecab


The morphological analysis engine, mecab, is required to use BERT's Japanese model.

The tokenizer will probably ask for mecab.

This time, we will use homebrew to install Mecab and ipadic.

```sh
brew install mecab mecab-ipadic
````

To update the dictionaries, create an appropriate directory for dictionaries and run the following command.

```sh
git clone --depth 1 https://github.com/neologd/mecab-ipadic-neologd.git  
. /bin/install-mecab-ipadic-neologd -n -a
``` .

Install the mecab wrapper for python.

```sh
pip install mecab-python3
```

## Install transformers.
[huggingface/transformers](https://github.com/huggingface/transformers)

Follow the official documentation to install transformers.

```sh
pip install transformers
```

## Refer to the following example on how to use BERT.
[cl-tohoku](https://github.com/cl-tohoku/bert-japanese)

```py
import torch  
from transformers.tokenization_bert_japanese import BertJapaneseTokenizer  
from transformers.modeling_bert import BertForMaskedLM  
tokenizer = BertJapaneseTokenizer.from_pretrained('bert-base-japanese-whole-word-masking
````

bert-base-japanese-whole-word-masking specifies the tokenization method (word-delimited or character-delimited) used during training.

```py
model = BertForMaskedLM.from_pretrained('bert-base-japanese-whole-word-masking')
````

Load the BERT model corresponding to the task.

This time it will be MLM (Masked Language Model ). It returns the probability of a word falling into the position where the mask token is located.

```py
input_ids = tokenizer.encode(f''')  
   青葉山で{tokenizer.mask_token}の研究をしています。  
''', return_tensors='pt'')
```

Use the tokenizer to convert tokens to their corresponding dictionary numbers.

```py
print(input_ids)  
print(tokenizer.convert_ids_to_tokens(input_ids[0].tolist()))
````

Replace id numbers with tokens from the corresponding dictionary.

```py
masked_index = torch.where(input_ids == tokenizer.mask_token_id)[1].tolist()[0])  
print(masked_index)  
result = model(input_ids)  
pred_ids = result[0][:, masked_index].topk(5).indices.tolist()[0]  
for pred_id in pred_ids:  
   output_ids = input_ids.tolist()[0].  
   output_ids[masked_index] = pred_id  
   print(tokenizer.decode(output_ids))
````

Print k=5 tokens that have a high probability of entering the position that the masked token is in.

By specifying the BERT model, we can calculate not only the word probabilities, but also the variance representation.
```py
hidden_states = result.hidden_states
```

## Range of applications after obtaining a distributed representation of a natural language

The following link shows the range of applications of the distributed representation of words

- [What are some applications of the document classification problem?] ({{<ref "/post/20200618blog-post_54.md">}})
- [How to use distributed representations Classification and generalization performance by bagging]({{<ref "/post/20210204classifier.md">}})


## Learn how distributed representation works.

Let's take a look at distributed representation, which learns the meaning of words.
Why don't you understand how distributed representations work by actually executing a program?

If you can get an idea of how distributed representations work, you will be able to better understand what and how the BERT system learns.

For more information, please refer to the following link
> ### [First Introduction to Natural Language Processing with Googlecolaboratory and python](https://subcul-science.booth.pm/items/1562211)
> > This document will help the reader understand how distributed representation works in natural language processing, and will help the reader develop new natural language processing services.
