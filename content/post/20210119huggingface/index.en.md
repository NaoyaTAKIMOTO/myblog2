---
title: "Using BART (sentence summary model) with hugging face"
description: ""
date: "2021-01-19T03:03:11+09:00"
thumbnail: ""
tags: [engineering,natural language processing,python,technology,distributed representation,sentence generation]
---

- BART is a model for document summarization
- Derived from the same transformer as BERT
- Unlike BERT, it has an encoder-decoder structure
    - This is because it is intended for sentence generation

This page shows the steps to run a tutorial on BART.

## Procedure
1. install transformers

Run ``sh
pip install transformers
```` 2.
Run summary

2. Run the summary
from transformers import BartTokenizer, BartForConditionalGeneration, BartConfig

model = BartForConditionalGeneration.from_pretrained('facebook/bart-large')
tokenizer = BartTokenizer.from_pretrained('facebook/bart-large')

ARTICLE_TO_SUMMARIZE = "My friends are cool but they eat too many carbs."
inputs = tokenizer([ARTICLE_TO_SUMMARIZE], max_length=1024, return_tensors='pt')

# Generate Summary
summary_ids = model.generate(inputs['input_ids'], num_beams=4, max_length=5, early_stopping=True)
print([tokenizer.decode(g, skip_special_tokens=True, clean_up_tokenization_spaces=False) for g in summary_ids])
```

On 2021/01/18, the output was MyMy friends.

Interesting.

## Where I got stuck.
Error when the version of pytorch is different from the one specified in transformers.
````
pip install -U torch
```
to update pytorch and it solved the problem.

## tips
max_length is the length of the word sequence and num_beams is the width of the beam search.

max_length adjusts the length of the generated sentences.

When generating long sentences, a wider search must be used, or else it will fall into a local solution and unnatural sentences will be output.

The two parameters are a trade-off between computation time, so it is better to start with a small one.

## Reference links
- [transformers official documentation](https://huggingface.co/transformers/model_doc/bart.html)

## Learn how distributed representation works.

Let's learn about distributed representations that learn the meaning of words.
Why don't you understand how it works while actually running the program?

If you can get an idea of how distributed representations are learned, you will have a better understanding of what the BERT system learns and how it learns it.

For more information, please refer to the following link
> ### [First Introduction to Natural Language Processing with Googlecolaboratory and python](https://subcul-science.booth.pm/items/1562211)
> > This document will help the reader to understand how distributed representation works in natural language processing and help the reader to develop new natural language processing services.

## Finally.
If there are any unclear points, please comment!

<iframe style="width:120px;height:240px;" marginwidth="0" marginheight="0" scrolling="no" frameborder="0" src="//rcm-fe.amazon-adsystem. com/e/cm?lt1=_blank&bc1=000000&IS2=1&bg1=FFFFFF&fc1=000000&lc1=0000FF&t=subculturesci-22&language=en_JP&o=9&p=8&l=as4&m=amazon&f= ifr&ref=as_ss_li_til&asins=B084WPRT44&linkId=7f1720c9cca99ccf6b5daeb1270354fa"></iframe