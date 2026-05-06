---
title: "git submoduleでのpullで更新する方法"
description: ""
date: "2021-01-24T12:54:44+09:00"
thumbnail: ""
tags: [git,技術]
---

[Hugo]({{<ref "/post/20210110hugo/">}})のthemeを`git submodule add`で導入したため、少し手順を踏まないとthemeの更新が反映されない。

以下の手順でthemeの最新バージョンへの更新ができる。

## 手順
管理下の全てのsubmoduleに対して
stash, checkout, pullを行う。

```sh
git submodule foreach git stash
git submodule foreach git checkout master
git submodule foreach git pull origin master
```


## 参考リンク
[git submodule update方法](https://m-tmatma.github.io/git/update-submodule.html)
---

**関連書籍**

[Pythonではじめる機械学習](https://www.amazon.co.jp/dp/4873117984?tag=subculturesci-22)
