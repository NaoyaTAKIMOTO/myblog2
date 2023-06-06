---
title: "Dockerfileでasdfを実行できないことについて"
date: 2023-06-07T05:58:28+09:00
draft: false
tags: [Docker, 環境構築, asdf]
---
## Dockerfile でsource ~/.bashrc ができない
- Dockerfile　ではデフォルトのシェルはsh
- shではsourceは実行できない

## 対策１：デフォルトのシェルをbashに変更
- デフォルトのシェルをbashに変更した
   `SHELL [/bin/bash,-lc]`

## Dockerfile でasdf が実行できない
- RUN asdf　に失敗する
  - asdfが見つからない
- しかしDocker内部ではasdfを実行できる

## 原因
- DockerfileではRUNごとに異なるシェルが実行される

## 効果がなかったこと
1. 同一のRUNで`source ~/.bashrc`と`asdf install `を実行
   1. asdfが実行できない
2. `bash/exec`でbashを再起動
   1. asdfが実行できない 

## 最終的な対処
- `apt install python3`

## 感想
- Dockerとasdfと何重にも仮想環境を重ねることにどれだけの意味があるだろうか？