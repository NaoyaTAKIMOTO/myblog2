---
title: 'Enumerating Applications of Document Classification Problems Only'
date: 2020-06-18T06:42:00.008+09:00
draft: false
aliases: [ "/post/blog-post_54/" ]
tags : [technical,natural language processing,technology,document classification]
---
## Applying the Document Classification Problem

You've learned about machine learning, but you don't know how to use it! Isn't it?

It is easy to overlook this if you don't pay attention to it when you study it, but if you don't keep your antennas up, you won't know how to use it.

If you don't keep your antennae up, you won't know how to use it. Since a tool is only a tool if it is used, you should make a note of how you use your newly acquired tool.


## Scope of the Document Classification Problem


If you have studied document classification in natural language processing, you should be able to do the following.

* Spam mail detection.
* News topic classification
* Extraction of important parts
* Document summarization
* Recommendations to users
* Clustering
* Sentiment analysis, etc.

It seems to have a surprisingly wide range of applications, doesn't it?

## What is the document classification problem?


It is the process of assigning one or more labels to a single document. In machine learning, we build a model to predict the labels.

Here, documents can be as short as a word or as long as a news article, and the length is not so important.

Labels can be important or not (binary), topic, sentiment (multiclass, multi-label), etc.

There are supervised and unsupervised methods.

### Supervised
In the supervised case, the labels need to be prepared by humans.

This can be done by crowdsourcing annotations, collecting tags from social networking sites or reviews from e-commerce sites.

In this case, it is often impossible to prepare a sufficient amount of data on our own. For this reason, machine learning methods may be useful.

### Unsupervised
Unsupervised is easy to prepare because you only need the data of documents.

For example, the data from Wikipedia can be used.

### Features
We need to extract features from documents.

TF-IDF and distributed representation are used as features.

In recent research (as of 2020), deep learning is the main topic.

Based on the obtained features, classification can be done using machine learning methods such as SVM in the supervised case.

## Actual usage examples

The actual usage is noted in the following link.

- [Memo on how to use Universal Sentence Encoder]({{<ref "/post/universal-sentence-encoder/index.en.md">}})
- [A note on how to use BERT learned from Japanese Wikipedia, since it was published]({{<ref "/post/wikipediabert/index.en.md">}})
- [From Word2Vec mechanism to model training using Google colaboratory]({{<ref "/post/20200615google-colaboratory-word2vec/index.en.md">}})
- [How to solve document classification problems with Fasttext]({{<ref "/post/20200613fasttext/index.en.md">}})
- [A note on how to use NeuralClassifier, which provides a model for solving document classification problems]({{<ref "/post/neuralclassifier/index.en.md">}})
- [Notes on learning the Sentence BERT Japanese model]({{<ref "/post/20210203SBERT/index.en.md">}})
- [Usage of Distributed Representations A note on classifier and generalization performance with bagging]({{<ref "/post/20210204classifier.md">}})
- [Using BART (sentence summary model) with hugging face]({{<ref "/post/20210119huggingface.md">}})

## Learn about how distributed representation works.

We will learn about distributed representations, which learn the meanings of words.
Why don't you try to understand how distributed expressions work by actually running the program?

If you can get an idea of how distributed representations are learned, you will have a better understanding of what and how they are learned in the BERT system.

For more information, please refer to the following link
> ### [First Introduction to Natural Language Processing with Googlecolaboratory and python](https://subcul-science.booth.pm/items/1562211)
> > This document will help readers to understand how distributed representation works in natural language processing, and help readers to develop new natural language processing services.

## Reference books
<iframe style="width:120px;height:240px;" marginwidth="0" marginheight="0" scrolling="no" frameborder="0" src="//rcm-fe.amazon-adsystem. com/e/cm?lt1=_blank&bc1=000000&IS2=1&bg1=FFFFFF&fc1=000000&lc1=0000FF&t=subculturesci-22&language=en_JP&o=9&p=8&l=as4&m=amazon&f= ifr&ref=as_ss_li_til&asins=B084WPRT44&linkId=7f1720c9cca99ccf6b5daeb1270354fa"></iframe>