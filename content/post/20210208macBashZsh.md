---
title: "Macでbashからzshへ移行する方法"
description: ""
date: "2021-02-08T20:54:54+09:00"
thumbnail: ""
tags: [bash,zsh,技術]
---

## 手順
1. 環境変数などの移行

    cat .bash_profile >> .zprofile

1. bashからzshへの切り替え

    chsh -s /bin/zsh
## 参考リンク
https://qiita.com/shionit/items/31bfffa5057e66e46450