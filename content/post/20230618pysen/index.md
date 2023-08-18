---
title: "pysenをインストールするとmypy周りで他のライブラリがエラーになる"
date: 2023-06-18T01:53:52+09:00
draft: false
tags: [環境構築, python, poetry]
---
## pysenが入っていたらlangChainと依存関係がバッティングする？

## 環境
Mac OS
poetry
python == 3.9


## LangChainのインストールに失敗する

    poetry add langchain
が失敗する
```py
CLANG 〜
```
C言語関係のエラーかと思われた。

なんだっけ

xcode-toolsのインストールとアップデート


    pip install --update pip
    pip install --upgrade setuptools

mypyのバージョンによるエラーらしい

mypyのバージョンを制限しているのがpysenが原因

pysenを除いて
    poetry update

で解決した。

どうせmypyはリンターとしても使ってなかったのでなんか上手く回避できないものか