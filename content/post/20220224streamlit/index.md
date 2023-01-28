---
title: "poetry環境でstreamlitを実行する方法"
description: ""
date: "2022-02-24T16:01:29+09:00"
thumbnail: ""
tags: [python,poetry,streamlit]
---
## 症状
- streamlitをpoetryを使ってインストールした場合に、streamlitが実行できない
- ```poetry add streamlit```でstreamlitを追加した場合、通常のシェルからはstreamlitのパスが通っていない
- ```which streamlit```の実行結果でなにもでてこない 

## 対処
- poetry からシェルを実行する
- ```poetry shell```
- ```streamlit run sample.py```
- streamlitコマンドが実行できるようになる
- 仮想環境にstreamlitをインストールした場合には通常のシェルからはstreamlitを実行できない
- その場合の対処法は公式サイトに載っている


## 参考リンク
- [streamlit 公式サイト](https://streamlit.io/)
- [poetry 公式サイト](https://python-poetry.org/)


<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3639942&pid=887928593"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3639942&pid=887928593" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3639942&pid=887928593" border="0"></a></noscript>