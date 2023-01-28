---
title: 'How to use NeuralClassifier, a library that provides a crazy number of models for document classification problems'
date: 2020-06-15T02:11:00.007+09:00
draft: false
aliases: [ "/2020/06/neuralclassifier.html" ]
tags : [technical,natural language processing,neural classifier,technology,python,fasttext,]
---

[! [](https://1.bp.blogspot.com/-YlMb8v77MN4/XurdQSzS1yI/AAAAAAAAg6Y/oSZrJ0c9yxYbzQnNNTynRvZnEp-xGE7NwCK4BGAsYHg/s320/AFE90C8A-A49C- 4475-9F05-50E2D56D5B63.jpeg)](https://1.bp.blogspot.com/-YlMb8v77MN4/XurdQSzS1yI/AAAAAAAAg6Y/oSZrJ0c9yxYbzQnNNTynRvZnEp-xGE7NwCK4 BGAsYHg/s1920/AFE90C8A-A49C-4475-9F05-50E2D56D5B63.jpeg)

NeuralClassifier: An Open-source Neural Hierarchical Multi-label Text Classification Toolkit is a python library for multi-label document classification problems published by Tencent.  

For more information, see

> [NeuralClassifier: An Open-source Neural Hierarchical Multi-label Text Classification Toolkit](https://github.com/Tencent/NeuralNLP- NeuralClassifier)
>NeuralClassifier is designed for quick implementation of neural models for hierarchical multi-label classification task, which is more challenging and common in real-world scenarios. 

for more details.

NeuralClassifier is designed for quick implementation of neural models for hierarchical multi-label classification task, which is more challenging and common in real-world scenarios.

It can also be used for Japanese data if word segmentation is done as a preprocessing step using mecab.

In the following, we will show you how to use this library.

## Environment settings
Since this library depends on pytorch, you need to install it beforehand with the following command.

```sh
pip install torch
````

Also, clone the repository into your working directory. In this case, I downloaded the zip file and used it.

## How to run
Run each .py file from the command line to train, evaluate, and predict.

```sh
python train.py conf/train.json
```` conf/train.json

conf/train.json contains the runtime configuration. You can change it as needed.

```sh
python eval.py conf/train.json
You can evaluate the trained model with ````.

You can evaluate the trained model with

For each label, it will output a summary of precision, recall, f value, and the mixing matrix in .txt format, respectively.

## Configure conf/train.json
This section describes the hyperparameters of the various models and the selection of models to be used during training and evaluation.  

We mainly need to specify the cpu or gpu, the input data information, and the model selection for training and evaluation.

I got a warning on num_worker, which was resolved by changing it to 0.

The input data should be created in the specified format and the path should be specified.

Note that the specification of the model for training and the model for evaluation exist independently and separately.

## Input data format


```json
JSON example:  
  
{  
   "doc_label": ["Computer--MachineLearning--DeepLearning", "Neuro--ComputationalNeuro"],  
   "doc_token": ["I", "love", "deep", "learning"],  
   "doc_keyword": ["deep learning"],  
   "doc_topic": ["AI", "Machine learning"]  
}  
{  
   "doc_label": ["Computer--MachineLearning--DeepLearning"],  
   "doc_token": ["I", "love", "deep", "learning"],  
   "doc_keyword": ["deep learning"],  
   "doc_topic": ["AI", "Machine learning"]  
}
````

Create it in this format!

Strictly speaking, we don't follow the json format, so we can't take the method of outputting dict data as json when creating data in python. It is better to give up and write the data line by line to a file.

Also note that this example shows a multi-label example, but even for single labels, the format should be a list with 1 element. That's where I got stuck.

## **On the application of the document classification problem**.
- [What are some applications of the document classification problem?] ({{<ref "/post/20200618blog-post_54.md">}})


## Learn how distributed representation works.

We will learn about distributed representations, which are used to learn the meanings of words.
Why don't you try to understand how distributed expressions work by actually running the program?

If you can get an idea of how distributed representations are learned, you will have a better understanding of what and how they are learned in the BERT system.

For more information, see the following links

- [First Introduction to Natural Language Processing with Googlecolaboratory and python](https://subcul-science.booth.pm/items/1562211)
