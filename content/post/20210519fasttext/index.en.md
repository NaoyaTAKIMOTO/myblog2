---
title: "Why is fasttext so fast?"
description: ""
date: "2021-05-19T02:10:01+09:00"
thumbnail: "/img/automobile-3075396_1920.jpg"
tags: [natural language processing,distributed representation]
---
## Features of fasttext
- Improved objective function
  - Consideration of negative samples
  - This should not affect training time.
- Change in optimization method
  - Use of stochastic optimization
  - If it affects the learning time, it should be this one
- Implementation in C language
  - This is the most effective, isn't it?

If we implement it in ## pytorch, it won't be much different from word2vec.
It would depend on the amount of data to be trained.
## It depends on the amount of data to be trained, but it is unlikely that a toy program can measure a significant difference.

## Are there hidden implementation innovations that are not described in the paper?
- Is there an implementation device?
  - Isn't it unfair not to describe it in the paper?
  - I think it is dishonest to say that the implementation made it faster.

## I can't tell what is fast just by reading the paper.
- I wonder what makes it fast?



Translated with www.DeepL.com/Translator (free version)