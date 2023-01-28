---
title: "chromebookでスクリーンショットを撮影してニコニコ動画に投稿する"
description: ""
date: "2021-04-27T21:08:23+09:00"
thumbnail: ""
tags: [chromebook, 動画編集,tux guitar,ffmpeg]
---

tux guitarで譜面を作成した。

しかし直接音声や動画で出力する機能がtux guitarになかったのでchromebookの機能でスクリーンショットを取ることにした。

さらにその動画をニコニコ動画にアップしようとしたところ、エラーが出たので動画の形式を変更した。

以下に手順を示す。
## スクリーンショットで音声つきの動画を撮影する
1. chromebook のメニューからスクリーンショットを選択する
2. スクリーンショット機能のモードを写真から動画へと切り替える
3. スクリーンショット機能のマイクをオンにする
4. tux guitar の画面を選択する
5. 撮影を開始する
6. tux guitar を再生する
7. 再生が終わったらメニューバーの録音停止ボタンを押す

### 注意事項
- 動画モードにする
- マイクをオンにする

## ffmpegで動画の形式を変換する
シェルを開いて、該当する箇所に移動して下のコマンドを実行する。

```
ffmpeg -i input.webm output.mp4
```

処理時間は等倍程度かかる。

## ニコニコ動画にアップする
ブラウザからmp4形式の動画をアップする。

## Youtubeにアップする
こちらはwebmとmp4のどちらでもアップできる。

## 感想
chromebookで音声つきの動画をスクリーンショットで撮影できることは大変便利な機能だと思う。

特別な環境構築やアプリの導入をすることなく、
マイクさえつなげれば講義動画とか簡単につくれるんちゃう？
いや普通に外部の音拾ってるわ。
音量設定からマイクの感度は設定できる。

ただ動画編集自体はchromebookでやるものではないかもしれない。それもハイエンドのモデルなら話が違ってくるのか？

## 課題
- chromebookが再生している音声を直接録音することは可能なのか？
- tux guitar の再生がカクつく問題
  - メモリ不足か？
  - いまいちlinux側のguiアプリは動作がスムーズでない。

<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3563352&pid=887895158"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3563352&pid=887895158" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3563352&pid=887895158" border="0"></a></noscript>