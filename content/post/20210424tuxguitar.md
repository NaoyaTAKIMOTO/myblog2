---
title: "chromebookでtux guitarを使う"
description: ""
date: "2021-04-24T20:00:56+09:00"
thumbnail: ""
tags: [tab譜, tux guitar, chromebook]
---
chromebookでtab譜を作成しようとしたら躓いたので解決方法をメモする。

## tux guitar のインストール
tab譜を作成するためにtux guitarを使おうとした。

```
sudo apt install tuxguitar
```

でtux guitarがインストールできる。

しかし、音が再生されない。

## 症状

tux guitarの設定から音声をチェックすると空白になっている箇所があった。

おそらく音声の出力がうまく設定されていない状態になっていた。

ということでubuntuで同様の症状が起きていないか調べた。

## 解決法

```
sudo apt install tuxguitar-alsa tuxguitar-jsa tuxguitar-oss
```

詳細はよくわからないが、これで音声設定にGervillが表示され、音声を再生できるようになった。

## 未解決の問題

tux guitarの画面がちらつくのはしょうがないのか？


## 参考リンク
https://askubuntu.com/questions/457321/tuxguitar-no-sound-in-14-04

<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3563352&pid=887895158"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3563352&pid=887895158" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3563352&pid=887895158" border="0"></a></noscript>