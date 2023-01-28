---
title: 'I made a summary text generation AI for making short-form news'
date: 2020-06-13T00:24:00.004+09:00
draft: false
aliases: [ "/2020/06/ai.html" ]
tags : [gpu,engineering,sentence shortening,technology,sentence generation,deep learning,natural language processing]
--- .


We have successfully trained a model to automatically generate titles from news texts using a machine translation model based on deep learning.

## Preliminaries

In the past, I was involved in a project to automatically generate titles from manuscripts for online news. In the past, I was involved in a project to automatically generate titles from manuscripts for online news.

In order to tackle this project, I was looking into existing methods.

I found out that the Asahi Shimbun had already started working on a similar technology.

[Automated summaries for short-form news on trains, 90 minutes becomes 1 minute](https://prtimes.jp/main/html/rd/p/000000809.000009214.html)

Well, the Asahi Shimbun has released a text summarization API for a fee.

Thanks to the Asahi Shimbun, I found out that title generation is technically feasible. So I decided to try to create an automatic title generation model myself.

As for the technical details, I searched for related links, but could not find any useful information.

All I could find were similar news-like articles.

So I switched to paper-based research, and got some information that might be helpful.

## Paper-based research

We could not go into technical details by examining related links from news articles.

Therefore, we decided to expand the scope of our research to papers.

If the technology has reached the level of practical use, it should naturally have passed the research stage long ago.

Extending the scope of research to English papers would provide information that can be used for implementation.

And research papers, especially in the field of information technology, can be easily found in PDF format by searching Google Scholar.

Personally, I mainly use [semantic scholar](https://www.semanticscholar.org/) rather than Google Scholar because it is easier to access related terms and citation sources.

Narrowing down effective search terms in a field I am not familiar with is one of the difficulties, but thanks to semantic scholar, I was able to lower that hurdle.

I did a quick search for "natural language processing + summary" and found that the Japanese information was

[Generation of Yahoo Topics headline candidates using multiple encoders](https://research-lab.yahoo.co.jp/nlp/20180326_kobayashi.html)

[Asahi Shimbun Media Lab's Artificial Intelligence Research Efforts](https://www.jstage.jst.go.jp/article/jkg/68/12/68_591/_pdf/-char/ja)

etc. were found.

The gist of it is to let a language model learn a pair of news body and title in the way of machine translation.

The model is trained to generate the title from the news body.

After further literature research, I found that the direction of research has gone from generating titles to setting character count constraints on them.

This seems to be a very practical problem.

The problem of character count constraint is more apparent in ideographic cultures, and I could not find any English papers on it.

So now all we have to do is collect the teacher data, describe the model, and run it through the computer.

## Experiment

## Data

For the teacher data, we scraped news sites and prepared about 20,000 pairs of news texts and titles.

## Model

For the model, we used a multi-stage transformer based on Albert.

It is an encoder-decoder model.

Albert is a model from BERT with a more efficient number of parameters. The model size is reduced by repeatedly going through the same transformer layers. For more details, see [BERT is still evolving! Lighter and stronger ALBERT is here!] (https://ai-scholar.tech/articles/treatise/albert-ai-227).

The reason for adopting the encoder-decoder model is that the models PEGASUS, BART, etc. finally adopt a similar structure.

This model is a deep learning attenntion model, so it requires a GPU or TPU for training.

This model is a deep learning attenntion model, which requires a GPU or TPU for training. You can use RNN models as in the original paper, but I used this model because the recent trend is transformer models.

I personally feel more comfortable with the transformer model.

From what I have read in the literature, the transformer system seems to be better in terms of computational efficiency and performance.

### Development environment

We used python-pytorch because of its good environment.

The basic components and tools for deep learning models are already in place, so we don't have to reinvent the wheel. It is also easy to write, which makes it suitable for prototyping.

### Result

We observed the progress using 11GB GPU✖️2✖️5days.

The output results converged in about a few hours.

One of the difficult aspects of evaluating this problem is how to evaluate the generalization performance.

As for how to evaluate the naturalness of a text, as of 2020, human scoring using crowdsourcing is considered to be the closest to human sensitivity, and automatic scoring is a hot topic.

For this reason, I employed my own visual confirmation to evaluate the results of this project.

As a result, I was able to get to the point where I could output something that was reasonably watchable.

## Impressions

There are a few places in the raw text that are replaced by unnatural ones, and mistakes that are strange to humans.

However, if you read the output result and the text, the rest will be practical even for a layman with some modifications.

## Discussion


When we learned the semantic vector for each token, the results were even more stable.

The inclusion of errors in company names and proper nouns is a trivial error in terms of the model's loss function, but it is perceived as a major error by humans.

This type of error occurred frequently.

In this regard, it is better to deal with it by either increasing the amount of teacher data or incorporating a copy mechanism into the model.

We found that the model is very vulnerable to numbers such as price and year in the input text.

Numbers were output where they corresponded to numbers, but most of the time they were different numbers.

This can be attributed to the fact that the model is not equipped with a mechanism to grasp the meaning of numbers.

This is a known weakness, as the research on question and answer systems has shown that the top of the leader board is the method of adding another mechanism to handle numbers, apart from the transformer system, to build a large system.

However, I have to admit that I have not found a smart solution yet.

[AI2 Leaderboard](https://leaderboard.allenai.org/drop/submissions/public)

## Summary
-----------------

Writing and summarizing can be treated as the same thing in the context of deep learning.

And as a common problem in deep learning, securing teacher data and learning resources is essential.

However, if we can solve this problem, we can get more than adequate results.