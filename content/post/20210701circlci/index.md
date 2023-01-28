---
title: "Circle Ci を利用してre:viewをビルドしてpdfを得る手順"
description: ""
date: "2021-07-01T06:06:49+09:00"
thumbnail: ""
tags: [技術, circle ci, github]
---
## Circle Ci を利用してre:viewをビルドしてpdfを得る手順
1. [Re:VIEW Template](https://github.com/TechBooster/ReVIEW-Template) をローカルに用意する
2. 自分のgithubレポジトリに移す
3. article フォルダ以下の該当するファイルを編集する
4. [Circle Ci](https://circleci.com/ja/)へgithubアカウントでログインして連携する
5. 自分のgithub レポジトリへpushするとgithub actions が実行される
6. Actions -> buildの指定 -> Artifacts から出力されたpdfをダウンロードできる

## 参考リンク
- [ワークフローの成果物をダウンロードする](https://docs.github.com/ja/actions/managing-workflow-runs/downloading-workflow-artifacts)
- [Circle Ci](https://circleci.com/ja/)
- [Re:VIEW Template](https://github.com/TechBooster/ReVIEW-Template)

<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3563352&pid=887685184"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3563352&pid=887685184" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3563352&pid=887685184" border="0"></a></noscript>

