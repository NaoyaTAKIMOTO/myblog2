---
title: "Creating data in Natural Language Inference (NLI) format for Sentence transformer"
description: ""
date: "2021-02-17T10:32:03+09:00"
thumbnail: ""
tags: [NLI,sentence transformer,technology,natural language processing,document classification]
---
Using the Sentence Transformer to
I'm trying to use Sentence Transformer to infer causal relationships between documents.

If we can do this, we can extract the cause and symptoms of the incident from the report.

So, I wondered if NLI could be used for feature learning to extract causal information. I thought.

## What is NLI?
Inference of the relationship between two sentences

- Forward
- Inverse
- Unrelated

The three relations are.


## Apply to causal relationships
If we apply the three relationships of NLI to causality, the following patterns are possible.

- Contradiction: cause, effect pairs
- Entailment: cause and effect pairs
- Neutral: a pair of cause or effect and the other 

You can create data for at least x3 number of case reports.

## Script Example　

What we want to do is

- Create a pair of contradiction and entailment by extracting about a certain case from the data frame.
- Extract two rows at random from the data frame and create a pair of
Create a pair of neutrals

You can use ``py
import random

traindev_samples = [].
data_size = 400
train_batch_size = 32
(cause_text_list, effect_text_list, other_texts_list) = extract_cause_effect_other_text(df)
# contradiction
for i in range(max(df["doc_no"])):
    effect_text = effect_text_list[i].replace(" ","")
    cause_text = cause_text_list[i].
    if len(effect_text) == 0 or len(cause_text) == 0:
        continue
    else:
        traindev_samples.append(InputExample(texts=[effect_text, cause_text], label=label2int["contradiction"]))
# entailment
for i in range(max(df["doc_no"])):
    effect_text = effect_text_list[i].replace(" ","")
    cause_text = cause_text_list[i].
    if len(effect_text) == 0 or len(cause_text) == 0:
        continue
    else:
        traindev_samples.append(InputExample(texts=[cause_text, effect_text], label=label2int["entailment"]))
# neutral
random.seed(45)
choise_patterns = {"cause2other":0, "effect2other":1, "other2cause":2, "other2effect":3}
for i in range(data_size):
    ind_0 = random.randint(0, max(df["doc_no"])-1)
    ind_1 = random.randint(0, max(df["doc_no"])-1)
    if ind_0 == ind_1:
        continue
    else:
        choice = random.randint(0, 3)
        other_texts = other_texts_list[ind_1].
        if len(other_texts) == 0:
            continue
        other_text = random.sample(other_texts,k=1)[0]
        if choice == 0:
            traindev_samples.append(InputExample(texts=[cause_text_list[ind_0], other_text], label=label2int["neutral"]))
        elif choice == 1:
            traindev_samples.append(InputExample(texts=[effect_text_list[ind_0], other_text], label=label2int["neutral"]))
        elif choice == 2:
            traindev_samples.append(InputExample(texts=[other_text, cause_text_list[ind_0]], label=label2int["neutral"]))
        elif choice == 3:
            traindev_samples.append(InputExample(texts=[other_text, effect_text_list[ind_0]], label=label2int["neutral"]))
````
## Set the loss function.
We chose softmax for the loss function, interpreting it as a prediction problem with labels of 0, 1, and 2.
```py
SoftmaxLoss(model=model, sentence_embedding_dimension=model.get_sentence_embedding_dimension(), num_labels=len( label2int))
````
## Training
The specific way to train the model is

[How to train Japanese model with Sentence transformer to get distributed representation of sentences]({{<ref "/post/20210203SBERT.md">}})

See


## Question.
- What about the epoch of learning?
  - Is that a hyperparameter?
- How does the number of data affect the learning?

