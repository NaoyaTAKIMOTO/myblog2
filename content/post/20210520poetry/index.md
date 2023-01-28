---
title: "mac os でpoetryによるpythonの環境構築"
description: ""
date: "2021-05-20T20:53:52+09:00"
thumbnail: "/img/man-593333_1920.jpg"
tags: [環境構築,python,poetry]
---
- pythonのライブラリをインストールする方法としてメジャーなpip
- より開発環境のバージョン管理に特化した高機能なpoetry
- pyenvとの連携は公式でサポートしているっぽい
- mac os での導入方法とハマったところをメモしておく


## poetry の利点
- ライブラリの依存関係を整理できる
  - 意外とライブラリのバージョンによって良からぬ副作用が起こることがある
  - 環境を再現しようとしてライブラリのバージョンやインストールの順番でエラーがでる
  - 環境構築は人間が頭を悩ませてもしょうなない部分なのでできれば自動化したい
  - また依存関係に考慮してライブラリのバージョンをアップデートできるっぽい
  - そしてその状態を記録してくれる
- git のbranchによって依存関係の記録を切り分けられる？
- pip　とインストールできるライブラリに遜色がない
  - pypyとかの参照先が一緒なのか？
- 使い勝手がpipと大差ない
  - pip install の代わりにpoetry add
- pyenv で作成した仮想環境を認識して連携してくれる

以上からこれまでの環境構築方法からあまり手間をかけずに便利になるっぽいので導入する。

## 導入方法
mac os の場合、下記のコマンドを実行する。

    curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python -

.zprofile へ下記の行を追記してzshへのパスを通す。
```sh
export PATH="HOME/.poetry/bin:$PATH"
```

下記のコマンドでインストールが成功していることを確認する。

    poetry --version

## 使い方
### プロジェクトの作成

    poetry new projec_name

なんか色々のものが生成される

すでにディレクトリがあるなら

    poetry init

### 仮想環境の設定
（追記）
- pycharm を利用している場合にはデフォルトでpoetry環境の設定をできるようになっている

poetryはvirtualenvでやっていた仮想環境の構築を勝手にやってくれるらしい
1. 利用するpythonのインストール

    pyenv install some.ver.sion

2. 該当するプロジェクトのディレクトリで任意のpythonをアクティベイトする

    pyenv local some.ver.sion

3. poetryに任意のpythonを指定する（任意？）

    poetry env use some.ver.sion

### ライブラリのインストール

    poetry add library_name
上記コマンドで依存関係を解消しつつ、指定したライブラリをインストールできる
### 環境の再現
poetry.lockがあるディレクトリで下記のコマンドを実行する

    poetry install

## ハマったところ
- homebrew でpoetryのインストール
  - よくわからんが上手くpythonが動かなかった
  - pyenvでの仮想環境ではなく、システムデフォルトのpythonに紐付いているようだった
- pyenv自体のアップデート
  - pyenvでインストールできるpythonのバージョンが古かった
  - git pull で解決
- zshへのパスを手動で通す必要がある
  - poetryのインストール時に環境変数通しといたで！みたいな表示が出た気がしたが、自動では設定されないものらしい
- 2022/02/26現在ginzaの追加がうまく働かない。よそで公開されているpoetry.lockを利用するとうまくginzaを動かす事ができた。なぜ？

## requirements.txtに手を焼く必要がなくなるのならよいのでは？
- poetryの導入自体はそんなに難しくない
- poetryの運用自体も簡単そう
- 依存関係を考慮した環境再現ができるのでよさげ
- パスはちゃんと通す

## 疑問
- プライベートレポジトリはどうやって使うんや？
  - 多分pip の場合と同様にできる
- pip でもインストールできる

<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3639942&pid=887928593"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3639942&pid=887928593" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3639942&pid=887928593" border="0"></a></noscript>