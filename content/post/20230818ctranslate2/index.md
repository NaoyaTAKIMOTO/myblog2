---
title: "ctranslate2でpytorchがimportできないエラーが出たので回避方法メモ"
date: 2023-08-18T16:23:27+09:00
draft: false
tags: [python, ctranslate2, Docker, whisper]
---
## 公式のインストール方法
    pip install ctranslate2

https://github.com/OpenNMT/CTranslate2

## Macでは上手く動作しない
`segmentatioin fault`になった。

しかしlinuxでは動作するとの情報を得た。
なのでまずはMacの中でDocker環境を構築して問題を回避できないか確認しようとした。

## Dockerで環境構築する
Dockerfileを作成した。
下記は失敗例。
```
FROM python:3.10.10-slim

RUN python -m pip install ctranslate2
```
そしてビルドして実行する。

    docker build -t $(IMAGE_NAME):latest .
    docker run --rm -it $(IMAGE_NAME):latest

下記コマンドでモデルの変換を試みる。

    ct2-transformers-converter --model openai/whisper-tiny --output_dir whisper-tiny-ct
すると失敗した。

    ModuleNotFoundError:No module named "torch"

なので`pip install torch`を行った。

`python -c "import torch"`でtorchがインストールできていることを確認した。

しかし再度ctranslate2を実行すると同様のエラーが出た。なぜ？

## 解決方法
    pip install torch transformers ctranslate2

とpipを修正したところ上手くctranslate2を実行できた。

ctranslate2をインストールするまえにtorchをインストールしておかないとctranslate2がtorchを認識しないっぽい。
(transformersはwhisperを扱うために必要になる)

## 感想
通常の作業を想定するとtorchなどのモジュールはインストールされていて当然なのでこのような問題が起きたのだろう。