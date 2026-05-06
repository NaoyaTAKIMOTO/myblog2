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
## 関連記事
- [Mac bashからzshへ変更する際の設定と注意点]({{<ref "/post/20210127zsh/">}})

## 参考リンク
[bashからzshへの移行（Qiita）](https://qiita.com/shionit/items/31bfffa5057e66e46450)
---

**関連書籍**

[Pythonではじめる機械学習](https://www.amazon.co.jp/dp/4873117984?tag=subculturesci-22)
