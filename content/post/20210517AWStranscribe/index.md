---
title: "Amazon Transcribe を使って文字起こしをして、話者分離してみた"
description: ""
date: "2021-05-17T15:07:00+09:00"
thumbnail: "/img/man-593333_1920.jpg"
tags: [AWS, 文字起こし]
---
Amazon Transcribe という文字起こしのサービスがある。

このサービスの特徴として、

- 2021/05/17時点で話者分離を行える
- 日本語に対応している
- 動画、音声の両方のフォーマットに対応している

点がある。

GUIでの使い方をメモしておく。

## 手順
手順については画面の説明を見れば特に苦労するところはない。

1. AWSコンソールにログインする。
   1. AWS用にアカウントを作成する必要がある
2. S3に音声ファイルをアップする。
   1. 特にオプションをいじる必要はない。
   2. リージョン（地域）設定は自分の所在地に近いところを選ぶといいくらいか？
3. Amazon Transcribeで文字起こしを行う
   1. create jobをクリック
   2. Name は区別ができればなんでもいい
   3. Langueage はJapaneseを選択
   4. Input data はBrowse S3からアップしたファイルを選択する
   5. Nextをクリック
   6. Audio setting
      1. Audio identification （話者分離）の設定をオンにする
      2. Speaker Identificationを選択することで話者ごとの特徴を利用して話者の区別を行う
      3. Alternative results をオンにする
         1. Maximum alternative は１にする
         2. ここで設定した数だけalternativeが出力される。バリエーションを吟味したい場合には2以上の数字にしてもいい。
   7. createをクリック
   8. Transcription jobs にNameで記入したジョブが追加されていることを確認する
   9. StatusがCompleteになるのを待つ
   10. 対象をクリックして出力のjsonを取得する

## 話者ごとの発話を抽出する
スクリプトの例
pythonでの記述

```py
import json
from os import path
folder_path = 'directory/path'
json_path = path.join(folder_path, "asrOutput.json")
with open(json_path,"r") as f:
    data = json.load(f)
speaker_labels = [item["speaker_label"] for item in data["results"]["speaker_labels"]["segments"]]
transcripts = [item["alternatives"][0]["transcript"] for item in data["results"]["segments"]]
lines = ["{}:{}".format(sp,tr) for sp, tr in zip(speaker_labels, transcripts)]
with open(path.join(folder_path, "transcript.txt"), 'w') as f:
    f.write('\n'.join(lines))
```

抽出したtranscript.txtの例
```
spk_0:そうですはい
spk_0:はい今日は何日だ?
spk_0:二千二十数年高圧の十五日
spk_0:でま一応第一回の企画として
spk_0:あります
spk_0:か
spk_1:えね国道みたいな感じだ
spk_0:うんというか
spk_1:竹花さんもなんかユーチューブの動画を上げる時に行きはい今日は何月?何日?何で
spk_0:ああそう
spk_0:できればでもまあ残る門だったらいつ取ったかっていうのは残しておいた方がま勿論データとして作成費とかはあるだけど言っといた方が
spk_0:あとでもし聞き返す時とかに張り合う考えてるうちにやるかと言うか?そのライブなんていうのが出るのかなって思う
spk_0:てる感じだね
spk_0:一応第一回なんで多少紹介的なことをしますか
spk_0:はい
```
ここから
- 発話者のラベルの変更
- 誤字脱字の修正

などを行って体裁を整えることができる。

発話のタイミングなどもjsonに入っているので、
簡単な字幕を自動生成することもできる。

[FFmpegを使って動画に字幕を焼く](https://www.storange.jp/2015/12/ffmpeg.html)

## CLIを使うと無料枠が大きい
CLIで処理を自動化できると無料枠が大きくなるため、
可能であればCLIからの利用を検討するといい。

## 注意点
- 無料枠を超える時間の文字起こしを行うと料金が発生する
  - AWSに限った話ではないがハッキングを受けて膨大な利用料を請求されるといった事例も過去にはあった
  - 実際に心当たりがない場合にはサポートへと連絡することで対処してもらえるらしい
  - クレジットカードの情報と同様、セキュリティには注意して利用してほしい
- 文字起こしは別に完璧ではない
  - また文字起こしをしたら、会話として味気ないなどはある。
  - そのあたりは編集で味付けしよう
- jsonファイルを読解するには多少の慣れが必要になる
  - スクリプトにjsonの構造に触れている部分があるがその解説はここではしない。
  - IDEなどで整形しながら全体像をながめるといい

## 改善点
- 句読点処理を行うとみやすくなるかも？
- 同じ話者が続くときにはくっつけてしまってもいいかも知れない。
- やはりcliで自動化したい。


<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3639942&pid=887928593"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3639942&pid=887928593" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3639942&pid=887928593" border="0"></a></noscript>