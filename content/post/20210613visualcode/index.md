---
title: "visual studio codeをChroomebookでブラウザから使うためのcode serverの利用法"
description: ""
date: "2021-06-13T16:14:20+09:00"
thumbnail: "/img/TKL0614_19_TP_V.jpg"
tags: [開発環境, visual studio code]
---
## 手順
1. ターミナルで`curl -fsSL https://code-server.dev/install.sh | sh
`を実行してインストールする。
1. バックエンドでcode-serverを起動するようにする。`sudo systemctl enable --now code-server@$USER`
1. `cat ~/.config/code-server/config.yaml`でパスワードを確認する。ここでパスワードを設定し直したり、ipアドレスを設定したりする。
1. http://127.0.0.1:8080 をブラウザからアクセスして、上で確認したパスワードを入力する。



## 参考リンク
- [Visual Studio Code を Chromebook で使う方法と、Chrome OS のレンダリングパイプライン](https://blog2.issei.org/2020/09/16/visual-studio-code-on-chromebook/)
- [code server](https://github.com/cdr/code-server/blob/v3.5.0/doc/guide.md)

<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3563352&pid=887685184"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3563352&pid=887685184" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3563352&pid=887685184" border="0"></a></noscript>