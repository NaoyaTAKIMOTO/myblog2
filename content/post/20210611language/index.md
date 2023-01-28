---
title: "ブログを多言語対応にするためにしたこと"
description: ""
date: "2021-06-11T06:44:01+09:00"
thumbnail: "/img/silhouette.png"
tags: [hugo]
---
## hugo は多言語をサポートしている
基本的には`index.md`を`index.en.md`
などのように言語情報を追記するだけでいい。

それで翻訳ページとして処理される。

しかし、私の場合、それだけだとうまくhugoが各言語のページを認識しなかったので、
tomlにlanguageの設定を追記する。

## config.tomlに追記
```toml
[languages]
  [languages.en]
    languageName = "English"
    weight = 10
    title = "Blog of Subculture Science Research Group"
  [languages.ja]
    languageName = "Japanese"
    weight = 20

```
おそらく関係する言語の情報をすべて追記すればいい。

## ファイルの名前を修正するだけで翻訳ページ扱いされる
`index.md`　と`index.en.md`
をつかって多言語対応をしていこうと思う。

<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3563352&pid=887685184"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3563352&pid=887685184" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3563352&pid=887685184" border="0"></a></noscript>