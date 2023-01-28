---
title: "On the use of distributed representations bagging for class classification and generalization performance"
description: ""
date: "2021-02-04T13:24:19+09:00"
thumbnail: ""
tags: [distributed representation,engineering,machine learning,generalization performance,technology]
---

After the distributed representation has been obtained, the
After the distributed representation is obtained, machine learning can be used to classify it.

Models that can be used include
- Decision Tree
- SVM Support Vector Machine
- NN Neural Networks

and others.

SVM is included in NN in a broad sense.

In this section, we will use the decision tree method.

## Bagging
- Image of majority voting with multiple decision trees
- Simple theory
    - Decision trees are highly explainable and are a classic machine learning model.
    - Computational load is light compared to deep learning
        - Depends on the size of the model
- Not much explainability
    - Do we want to analyze each of the multiple decision trees?

``py
from sklearn.ensemble import BaggingClassifier
from sklearn.tree import DecisionTreeClassifier

bagging = BaggingClassifier(DecisionTreeClassifier(class_weight="balanced"),
                                        n_estimators=best_params["n_estimators"],
                                            max_samples=best_params["max_samples"],
                                            max_features=best_params["max_features"], n_jobs=-1, )
bagging.fit(X_train, y_train)
y_pred = bagging.predict(X_test)
```

## Adjusting generalization performance
- It is often the case that the prediction performance is high on the training data, but low on the test data.
- This is natural because the test data is unknown data that is not included in the training data.
- However, in reality, the goal is often to improve the performance on the test data, the unknown data.
- Such performance is called generalization performance.

### Hyperparameter Tuning
- There are various parameters in a model.
- Parameters that are not tuned by training are called hyperparameters.
- These hyperparameters are not tuned by training, but they can affect the performance of the model.
- There are two main ways to do this
    - Adjusted by experts
        - What we do in a data competition?
    - Provide a step to optimize the hyperparameters
        - There is a hyperparameter optimization library called optuna
        - Gaussian process optimization is often used for this step

### under sampling
- randam under sampling is empirically valid
- Perform thinning when there is a bias in the number of labels.
- When training data has biased labels, the model learns the bias of the labels
- Reduce the bias in the training data by thinning out the labels.

### Data augmentation data augmentation
- On the other hand, there is a way to augment the number of samples.
- Need to create natural false data.
    - Flipping, rotation, scaling, etc. are often used in image fields.
    - Back-translation is used in the natural language field
        - For example, machine translation is used to translate from Japanese to English to Japanese.

## Reference links
- [sklearn.ensemble.BaggingClassifier](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.BaggingClassifier.html)
- [optuna](https://optuna.org/)