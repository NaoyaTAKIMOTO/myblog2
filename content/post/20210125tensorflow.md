---
title: "tensorflow GPUメモリを一気に確保しない設定の仕方"
description: ""
date: "2021-01-25T08:17:54+09:00"
thumbnail: ""
tags: [技術系,python,tensorflow,gpu,技術]
---

tensorflow 1系は使える全てのGPUリソースを確保する。

メモリオーバーを観測できないので、
逐次的にGPUメモリを確保するように設定を変更する。

これによってGPU使用量の観測ができる。

ただし実行速度は劣化する。

## 記述例
```py
config = tf.ConfigProto(
    gpu_options=tf.GPUOptions(
        allow_growth=True
    )
)
sess = sess = tf.Session(config=config)
```

## 参考リンク

https://qiita.com/kikusumk3/items/907565559739376076b9

