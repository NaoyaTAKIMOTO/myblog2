---
title: 'Macでpyenvを利用したpythonの環境構築の方法'
date: 2020-06-16T04:58:00.010+09:00
draft: false
aliases: [ "/2020/06/mac-python.html" ]
tags : [技術系,mac os,python,環境構築,技術]
---

## Mac でpythonの環境構築

Mac にpythonをどうやってインストールしたらいいのか悩んでいませんか？

単純にhome brewを使ってインストールしてもいいのですが、
以下のデメリットがあります。
- 環境を汚してしまう
- バージョンの管理が難しい

そこでここではpyenvを利用して、
python環境を構築する方法について説明します。

### 追記
- pyenv+poetryによる環境構築をおすすめします。
  - ディレクトリ毎に環境を分離    
  - 依存関係の解消をpoetryが行ってくれる

[mac os でpoetryによるpythonの環境構築]({{<ref "/post/20210520poetry/index.md">}})

### 追記
- asdf を利用する方法もある
- pyenv に比べてよりシンプルに環境の設定ができる

## 独立したpython の環境構築

python の実行環境をプロジェクトごとに管理する必要がある場合に以下の手順を行います。

利点としては、

1.  システムの環境を汚さないこと
2.  他人と合同で開発を進めるときに共通の環境を作成しやすいこと
3.  ディレクトリごとに環境が自動で変更されること

があげられます。

前提として多少のITスキル(コマンドライン、IPアドレスの設定など)が必要とされます。

それならばDockerを利用して環境構築を行う方が洗練されています。

そして、ITスキルが無いならば、Anacondaを利用する方が簡便です。

以上から、Dockerについて勉強する時間が無く、多少のコマンドラインは扱え、複数のプロジェクトに対応する必要がある人間を対象としています。

## homebrew

以下のリンクに従ってhomebrewをセットアップします 。

[Homebrew](https://brew.sh/index_ja)

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"  

```

## pyenv

コマンドラインからpythonのバージョン管理をするために、homebrew でpyenvをinstallします。

```sh
brew install pyenv
```

## pyenv + virtualenv で環境構築

pyenv + virtualenv で名前を付けて、指定したバージョン(今回は3.6.3)のpythonをインストールします。

```sh
pyenv virtualenv 3.6.3 PROJECT-NAME 
```

指定のディレクトリで下記のコマンドを実行することで、特定のディレクトリ下で特定のpython環境を実行するようになります。

```sh
cd project-dir   
pyenv local PROJECT-NAME
```

## Mac でpythonの環境構築まとめ

*   homebrew のセットアップ
*   pyenvのインストール
*   指定のディレクトリで指定のpython環境を設定

<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3639942&pid=887928593"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3639942&pid=887928593" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3639942&pid=887928593" border="0"></a></noscript>