---
title: "Chrome OS で　Rstudio Server のセットアップ"
description: ""
date: "2021-06-28T22:31:37+09:00"
thumbnail: ""
tags: [R, 開発環境]
---
Chrome OSでRを触るために環境を構築した。

文字入力の利便性の点からRstudio Serverを利用することとした。

Rstudio Serverはサーバー上にRstudioを起動してクライアントのブラウザから操作ができる。

今回は別にサーバーを立てることはしない。

## R と　Rstudio Serverのインストール
```sh
apt install r-base
sudo apt-get install gdebi-core
wget https://download2.rstudio.org/server/bionic/amd64/rstudio-server-1.4.1717-amd64.deb
sudo gdebi rstudio-server-1.4.1717-amd64.deb
```

## ユーザーの作成
```sh
sudo useradd "username"
sudo passwd "username"
```
ここで入力した"username"とpasswordは次の手順でつかうのでメモしておく。

## 依存するライブラリのインストール
bash
`sudo apt install libcurl4-openssl-dev libssl-dev libxml2-dev libfontconfig1-dev libcairo2-dev`

R
`install.packages("readr")`

## Rstudio Server へのアクセス
localhost:8787 をブラウザで開く。

ユーザーの作成で設定した"username"とpasswordでログインする。

## 参考資料
[Download RStudio Server for Debian & Ubuntu](https://www.rstudio.com/products/rstudio/download-server/debian-ubuntu/)

<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3563352&pid=887685184"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3563352&pid=887685184" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3563352&pid=887685184" border="0"></a></noscript>