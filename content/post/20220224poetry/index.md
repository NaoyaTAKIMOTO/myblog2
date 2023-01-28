---
title: "pycharmからpoetryで環境の作成ができない"
description: ""
date: "2022-02-24T11:56:49+09:00"
thumbnail: ""
tags: [環境構築,python,poetry]
---
## 症状
pycharmでinterpreterの指定にエラーが出た。
改めてpoetryの環境構築を行おうとしたところ、以下のエラーが出た。
```py
ModuleNotFoundError No module named 'virtualenv.activation.xonsh' at <frozen importlib._bootstrap>:984 in _find_and_load_unlocked
```
## 解決方法
```
pip3 uninstall virtualenv
```

## 原因
- anyenvのアップデートをかけたのが悪かったか？

## 反省
- 不用意なアップデートは不具合の原因になる

<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3639942&pid=887928593"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3639942&pid=887928593" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3639942&pid=887928593" border="0"></a></noscript>