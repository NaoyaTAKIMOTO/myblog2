---
title: 'Re:VIEW+docker-composeでのpdfを作成するまでの手順'
date: 2020-12-24T14:33:00.007+09:00
draft: false
aliases: [ "/2020/12/reviewdocker-compose.html" ]
tags : [技術系,re:view,技術]
---

## docker composeとreview


Mac環境でのdocker-composeでRe:VIEWを扱う方法のメモ。

基本的には

[https://github.com/vvakame/docker-review/blob/master/doc/windows-review.md](https://github.com/vvakame/docker-review/blob/master/doc/windows-review.md)を辿ればいい。


## 作業ディレクトリの作成

```
mkdir work
```

workは任意の名前に変更可能

## Dockerfileとdocker-compose.ymlの作成

下記のworkは作業ディレクトリの名前に合わせること。

Dockerfile

```
FROM vvakame/review
```

docker-compose.yml

```yml
  
version: '3'  
services:  
  review:  
    volumes:  
      - .:/work  
    build: .  
    working_dir: /work  
    ports:  
      - "127.0.0.1:18000:18000"
```

## 作業ディレクトリでRe:VIEWの初期化


```
cd work  
  
docker pull vvakame/review  
  
docker-compose run --rm review review-init sampledoc  
  
cp docker-compose.yml Dockerfile sampledoc  

```

sampledocは任意の名前に変更可能

## テキストの編集

.reファイルを編集する。

文法は [https://github.com/kmuto/review/blob/master/doc/format.ja.md](https://github.com/kmuto/review/blob/master/doc/format.ja.md) を参照する。

## PDFの作成

sampledocディレクトリで下記のコマンドを実行する。

```
  
docker-compose run --rm review rake pdf  

```

成功すればbook.pdfが作成される。
