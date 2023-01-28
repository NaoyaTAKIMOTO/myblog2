---
title: 'Procedure for obtaining a distributed representation of a Japanese sentence using a trained Universal Sentence Encoder'
date: 2020-06-22T18:29:00.006+09:00
draft: false
aliases: [ "/2020/06/universal-sentence-encoder.html" ]
tags : [technology,natural language processing,universal sentence encoder,technology,python,distributed representation]
---.

A vector of documents can be obtained using Universal Sentence Encoder.

## Features

Supports multiple languages.

Japanese is supported.

Can handle Japanese sentences as vectors.

## Usage

Clustering, similarity calculation, feature extraction.

## Usage

Execute the following command as preparation.

```sh
pip install tensorflow tensorflow_hub tensorflow_text numpy   
````

Trained models are available.

See the python description below for details on how to use it.

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
  
texts = ["I saw a comedy show yesterday." , "There was a comedy show on TV last night." , "I went to the park yesterday." , "I saw a comedy show last night.", "Yesterday, I went to the park."]  
vectors = embed(texts)  
```.

See the following link for more details

[Try Universal Sentence Encoder in Japanese](https://qiita.com/kenta1984/items/9613da23766a2578a27a)


### Postscript
```py
import tensorflow_text
```
Without this line, you will get an error like ``Sentencepiece not found! error.
This line is not explicitly used in the sample source, but is required for the actual execution.
This line is not explicitly used in the sample source, but is required in the actual runtime.

### Save the model
The ssl setting is supposed to bypass secure connections around https.
I was advised not to use it if possible.

You don't need to download it many times, so you can save the model as follows.

``py
import tensorflow as tf
tf.saved_model.save(embed, module_no_signatures_path)
```

### Load the model.
```py
import tensorflow as tf
import tensorflow_text
imported = tf.saved_model.load(module_no_signatures_path)
```

## Reference links
For more information on how to use the resulting distributed representation, see

> #### [What are some applications of the document classification problem?] ({{<ref "/post/20200618blog-post_54.md" >}}
> 
> I've learned about machine learning, but I don't know how to use it! Do you have a problem with that?

## Learn how distributed representation works.

Let's take a look at distributed representation, which learns the meaning of words.
Why don't you understand how distributed representations work by actually executing a program?

If you can get an idea of how distributed representations work, you will be able to better understand what and how the BERT system learns.

For more information, please refer to the following link

> ### [First Introduction to Natural Language Processing with Googlecolaboratory and python](https://subcul-science.booth.pm/items/1562211)
> > This document will help the reader understand how distributed representation works in natural language processing, and will help the reader develop new natural language processing services.