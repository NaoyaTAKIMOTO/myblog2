---
title: "hugo で作成したページをtwitter_cardsとして表示できるようにする"
description: ""
date: "2021-04-30T14:53:53+09:00"
thumbnail: ""
tags: [hugo]
---

hugoで作成した記事のリンクをtwitterなどで記載したときに、
twitter card表記されるようにしたい。

## 手順

layouts/_default/baseof.html

に
```html
{{ template "_internal/opengraph.html"}}
{{ template "_internal/twitter_cards.html"}}
```
を追記する。

環境によってはbaseof.htmlではない場合もある。

## 結果
いまいち上手くいっていないのか？

## 参考リンク
[HugoでOGPの設定をする](https://miyahara.hikaru.dev/posts/20200319/)