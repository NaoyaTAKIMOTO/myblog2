---
title: 'I even did a document classification problem with Fasttext'
date: 2020-06-13T07:29:00.016+09:00
draft: false
aliases: [ "/2020/06/fasttext.html" ]
tags : [technical,natural language processing,fasttext,technology,distributed representation,document classification]
---

## Summary of what I've done with Fasttext to the document classification problem.

* Facebook research has published a document classification library using Fasttext.
* Fasttext is easy to install in a python environment.
* Run time is fast.
    
## Preliminaries

I decided to tackle the task of document classification, and initially thought.

> NeuralClassifier: An Open-source Neural Hierarchical Multi-label Text Classification Toolkit

NeuralClassifier: An Open-source Neural Hierarchical Multi-label Text Classification Toolkit. However, it was not very accurate.

My boss taught me how to do it.

>[2\] A. Joulin, E. Grave, P. Bojanowski, T. Mikolov, Bag of Tricks for Efficient Text Classification

In.

## Features of the Fasttext library


This will be a library that solves the document classification problem using Fasttext in an end-to-end manner.

Therefore, it is designed to optimize document vectors for classification tasks.

It is very fast, taking less than a few seconds to learn, and is a good starting point.

Also, the performance is not bad. Hyperparameter tuning](https://fasttext.cc/docs/en/autotune.html) is also available.

The basics are as above.

Just specify the parameters you want to fix (e.g., the number of dimensions of the variance representation), and run as follows

````
model = fasttext.train_supervised(input='cooking.train', autotuneValidationFile='cooking.valid')
````

where 'cooking.train' and 'cooking.valid' are text files in the specified format.

## How to use the Fasttext library.


You can use the fasttext library by running ````p
pip install fasttext
``` pip install fasttext

The above command is all you need to set up a fastText environment for python as of June 2020. It is very easy.

## How to use it for document classification problems


We need to create a 'data.train.txt' file as the teacher data.

The format of the data is a text file with "**label**" and a tokenized document on each line.

````
train.txt   
  
__label__1 Love is heavy  
__label__2 I love you
```

In the same way, we will create test data, etc. in the same format as the teacher data.

To train the model, run the following code.

```` import fasttext
import fasttext  
  
model = fasttext.train_supervised('train.txt')
```

The training time depends on the amount of teacher data, but can be handled by the CPU, and with the data at hand (about 1000 cases), training was completed in a few seconds.

Estimation results using the learned model can be obtained as follows.

```
model.predict("Do you believe in love?")
``` model.predict("Do you believe in love?")

In this case, an array of classes to be classified and the predicted probabilities will be returned.

This solves the document classification problem using fastText.

Evaluation

You can use sklearn to do mixing matrices and accuracy comparisons.

The following is a quote from the official scikit-learn website.

```py
from sklearn.metrics import confusion_matrix  
  
y_true = ["cat", "ant", "cat", "cat", "ant", "bird"]  
y_pred = ["ant", "ant", "cat", "cat", "ant", "cat"]  
confusion_matrix(y_true, y_pred, labels=["ant", "bird", "cat"])  
array([[2, 0, 0],  
      [0, 0, 1],  
      [1, 0, 2]])
````py

```py
from sklearn.metrics import classification_report  
y_true = [0, 1, 2, 2, 2].  
y_pred = [0, 0, 2, 2, 1]]  
target_names = ['class 0', 'class 1', 'class 2']  
print(classification_report(y_true, y_pred, target_names=target_names))  
             precision recall f1-score support  
<BLANKLINE  
    class 0 0.50 1.00 0.67 1  
    class 1 0.00 0.00 0.00 1  
    class 2 1.00 0.67 0.80 3  
<BLANKLINE  
   accuracy 0.60 5  
  macro avg 0.50 0.56 0.49 5  
weighted avg 0.70 0.60
```

## Summary


By using fastText and scikit-learn, we can use

Using fastText and scikit-learn, we can easily tackle document classification problems in the python environment.

Using fastText and scikit-learn, we can easily tackle document classification problems in python environment.

Since python is also useful for creating datasets, it is a good option if you want to try document classification for the first time.

For practical applications, please refer to the following links.

[What are some applications of the document classification problem?] ({{<ref "/post/20200618blog-post_54/index.en.md">}})

## Learn about how distributed representation works.

We will learn about distributed representations, which are used to learn the meanings of words.
Why don't you try to understand how distributed expressions work by actually running the program?

If you can get an idea of how distributed representations are learned, you will have a better understanding of what and how they are learned in the BERT system.

For more information, please refer to the following link
> ### [First Introduction to Natural Language Processing with Googlecolaboratory and python](https://subcul-science.booth.pm/items/1562211)
> > This document will help readers to understand how distributed representation works in natural language processing, and help readers to develop new natural language processing services.

## References 
- [NeuralNLP-NeuralClassifier](https://github.com/Tencent/NeuralNLP-NeuralClassifier)
- [fastText](https://github.com/facebookresearch/fastText)

<div class="booklink-box" style="text-align:left;padding-bottom:20px;font-size:small;zoom: 1;overflow: hidden;"><div class="booklink-image" style="float:left;margin:0 15px 10px 0;"><a href="//af.moshimo.com/af/c/click?a_id=2220301&p_id=56&pc_id=56&pl_id=637&s_v=b5Rz2P0601xu&url=http%3A%2F%2Fbooks.rakuten.co.jp%2Frb%2F16190713%2F" target="_blank" ><img src="https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/6607/9784839966607.jpg?_ex=64x64" style="border: none;" /></a><img src="//i.moshimo.com/af/i/impression?a_id=2220301&p_id=56&pc_id=56&pl_id=637" width="1" height="1" style="border:none;"></div><div class="booklink-info" style="line-height:120%;zoom: 1;overflow: hidden;"><div class="booklink-name" style="margin-bottom:10px;line-height:120%"><a href="//af.moshimo.com/af/c/click?a_id=2220301&p_id=56&pc_id=56&pl_id=637&s_v=b5Rz2P0601xu&url=http%3A%2F%2Fbooks.rakuten.co.jp%2Frb%2F16190713%2F" target="_blank" >機械学習・深層学習による自然言語処理入門</a><img src="//i.moshimo.com/af/i/impression?a_id=2220301&p_id=56&pc_id=56&pl_id=637" width="1" height="1" style="border:none;"><div class="booklink-powered-date" style="font-size:8pt;margin-top:5px;font-family:verdana;line-height:120%">posted with <a href="https://yomereba.com" rel="nofollow" target="_blank">ヨメレバ</a></div></div><div class="booklink-detail" style="margin-bottom:5px;">中山光樹 マイナビ出版 2020年02月27日頃    </div><div class="booklink-link2" style="margin-top:10px;"><div class="shoplinkrakuten" style="display:inline;margin-right:5px"><a href="//af.moshimo.com/af/c/click?a_id=2220301&p_id=56&pc_id=56&pl_id=637&s_v=b5Rz2P0601xu&url=http%3A%2F%2Fbooks.rakuten.co.jp%2Frb%2F16190713%2F" target="_blank" >楽天ブックス</a><img src="//i.moshimo.com/af/i/impression?a_id=2220301&p_id=56&pc_id=56&pl_id=637" width="1" height="1" style="border:none;"></div><div class="shoplinkrakukobo" style="display:inline;margin-right:5px"><a href="//af.moshimo.com/af/c/click?a_id=2220301&p_id=56&pc_id=56&pl_id=637&s_v=b5Rz2P0601xu&url=https%3A%2F%2Fbooks.rakuten.co.jp%2Frk%2F350e869d324d356eb91b3b52d00d0e36%2F" target="_blank" >楽天kobo</a><img src="//i.moshimo.com/af/i/impression?a_id=2220301&p_id=56&pc_id=56&pl_id=637" width="1" height="1" style="border:none;"></div><div class="shoplinkamazon" style="display:inline;margin-right:5px"><a href="//af.moshimo.com/af/c/click?a_id=2220302&p_id=170&pc_id=185&pl_id=4062&s_v=b5Rz2P0601xu&url=https%3A%2F%2Fwww.amazon.co.jp%2Fexec%2Fobidos%2FASIN%2F4839966605" target="_blank" >Amazon</a></div><div class="shoplinkkindle" style="display:inline;margin-right:5px"><a href="//af.moshimo.com/af/c/click?a_id=2220302&p_id=170&pc_id=185&pl_id=4062&s_v=b5Rz2P0601xu&url=https%3A%2F%2Fwww.amazon.co.jp%2Fgp%2Fsearch%3Fkeywords%3D%25E6%25A9%259F%25E6%25A2%25B0%25E5%25AD%25A6%25E7%25BF%2592%25E3%2583%25BB%25E6%25B7%25B1%25E5%25B1%25A4%25E5%25AD%25A6%25E7%25BF%2592%25E3%2581%25AB%25E3%2582%2588%25E3%2582%258B%25E8%2587%25AA%25E7%2584%25B6%25E8%25A8%2580%25E8%25AA%259E%25E5%2587%25A6%25E7%2590%2586%25E5%2585%25A5%25E9%2596%2580%26__mk_ja_JP%3D%2583J%2583%255E%2583J%2583i%26url%3Dnode%253D2275256051" target="_blank" >Kindle</a></div><div class="shoplinkseven" style="display:inline;margin-right:5px"><a href="//af.moshimo.com/af/c/click?a_id=2317554&p_id=932&pc_id=1188&pl_id=12456&s_v=b5Rz2P0601xu&url=http%3A%2F%2F7net.omni7.jp%2Fsearch%2F%3FsearchKeywordFlg%3D1%26keyword%3D9784839966607" target="_blank" >7net<img src="//i.moshimo.com/af/i/impression?a_id=2317554&p_id=932&pc_id=1188&pl_id=12456" width="1" height="1" style="border:none;"></a></div>            	  	  	  	  	</div></div><div class="booklink-footer" style="clear: left"></div></div>
