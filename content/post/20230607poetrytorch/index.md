---
title: "poetry環境でpytorchをインストールしても失敗したのでその対処法"
date: 2023-06-07T05:47:12+09:00
draft: false
tags: [poetry, python, pytorch, 環境構築]
---

## `poetry add torch` でパスが通らない
- Dcokerfile＋poetry で環境構築をしていた
- `poetry add torch`でpytorchをインストールした
- `import torch`でエラー
- cuda周りのパスが通っていないらしい
- 

## 対処法
- `poetry run python -m pip install torch`
- poetry.tomlに記述することもできるらしい


## 参考資料
- [stack overflow](https://stackoverflow.com/questions/59158044/poetry-and-pytorch)