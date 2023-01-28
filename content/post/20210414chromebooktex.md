---
title: "chromebookでre:view用にtexをインストールするときに発生したエラーの対処法"
description: ""
date: "2021-04-14T04:36:07+09:00"
thumbnail: ""
tags: [chromebook,環境構築,tex live,re:view]
---
## re:view用に日本語用のtex liveをインストール
re:viewの依存関係としてtexがあるので以下のコマンドでtexをインストールする。
```sh
sudo apt install texlive-lang-cjk xdvik-ja evince
```

ここでrakeコマンドを実行してpdfを作成しようとするが、
エラーが発生した。
```sh
rake pdf
```
エラーメッセージで検索すると下記コマンドを実行するとよいらしい。

! LaTeX Error: File `filehook.sty' not found. が発生する場合

```sh
sudo apt install texlive-latex-extra
```

問題は解決した。

他の問題については下記リンク先を参考にする。

## 参考リンク
- [TEX Wiki](https://texwiki.texjp.org/?Linux%2FLinux%20Mint#texlive)
- [WSL上のUbuntu18.04で日本語レポート作成環境を整える
](https://www.aise.ics.saitama-u.ac.jp/~gotoh/Ubuntu1804JPonWSL.html#toc5)

<a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3563352&pid=887689136" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3563352&pid=887689136" height="1" width="1" border="0">BTOパソコンならパソコンショップSEVEN</a>