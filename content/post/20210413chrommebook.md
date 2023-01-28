---
title: "chromebookのセットアップ"
description: ""
date: "2021-04-13T15:12:55+09:00"
thumbnail: ""
tags: [chromebook,環境構築]
---
## 手順
1. OSの更新
1. bitwardenの導入
1. visual code studioの導入
    1. Intel, amdなら amd64版を選択する
    1. CPUによる
1. Linuxの導入
    1. 設定からコマンドラインの導入ができる。
1. Linuxの環境構築

```sh
sudo apt update
sudo apt upgrade
sudo apt install aptitude
sudo aptitude safe-upgrade
```
6. GitHubのSSHの設定
6. hugoの設定

```sh
sudo aptitude install hugo
git clone my_repository

git submodule foreach git stash
git submodule foreach git checkout master
git submodule foreach git pull origin master
```
8. linuxアプリの日本語入力設定

```sh
sudo aptitude install fcitx-mozc -y
```
    8. fxitxの実行
```sh
fcitx-configtool
```
下のーボタンでデフォルトのキーボード設定を削除する。

チェックボックスを外してmozcで検索する。

mozcを入れる。

9. 再起動後に日本語の設定を維持するためにprofileに設定を記述する。
```sh
echo "fcitx > /dev/null 2>&1" >> ~/.profile
```

10. gemコマンドを使うために rubygems のインストール
```sh
sudo aptitude install rubygems
```

11. re:view のインストール
```sh
sudo gem install review
```

## 参考リンク
- [git submodule 更新](https://m-tmatma.github.io/git/update-submodule.html)
- [visual studio code公式サイト](https://code.visualstudio.com)
- [ChromeBookのVSCodeで日本語入力できるようにする](https://gotoblog.org/chromebook-vscode-japanese/)

<a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3563352&pid=887689136" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3563352&pid=887689136" height="1" width="1" border="0">BTOパソコンならパソコンショップSEVEN</a>