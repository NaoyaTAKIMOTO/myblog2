---
title: "ffmpegで音声ファイルの音量の正規化(ノーマライゼーション)"
description: ""
date: "2021-05-22T17:41:25+09:00"
thumbnail: "/img/equalizer-153212_1280.png"
tags: [ffmpeg,音量の正規化,ノイズ除去]
---
- ffmpegで音声ファイルの音量を調整する方法
- 音量の正規化のためにffmpegを用いた
  - ffmpegはコマンドラインで利用できるメディアの加工ができる
- 後々のために使用方法を記録しておく
  - たまに使うときにコマンドを忘れやすい
  - 似たような処理をしたくなることが多いのでメモが役に立つ気がする

## ffmpegのインストール
ubuntu 系の場合、以下のコマンドでffmpegのダウンロードとインストールが完了する
  sudo apt update
  sudo apt install ffmpeg
## コマンドの例
- 例えば以下のような例で利用する
  - この例では音量の正規化を行っている

    ffmpeg -i input.mp3 -af loudnorm=I=-16:LRA=11:TP=-1.5 output_norm.mp3

- *input.mp3*, *output.mp3*は適当な名前に変更すること。
- 拡張子はmp3以外でも構わない
  - mp4など多種多様なフォーマットに対応している

## ノイズ除去
- ノイズを除去するために一定の音量以下の音声を削除する
    ffmpeg -i output_norm.mp3 -af "afftdn=nf=-25" output_nf.mp3
- また不必要な周波数帯の音声を削除する
    ffmpeg -i output_nf.mp3 -af "highpass=f=200, lowpass=f=3000" output_pass.mp3

## 無音削除
- 無音部分の削除を行う
  - 一定の音量以下の部分を切り取る作業を行う
    ffmpeg -i output_pass.mp3 -af silenceremove=1:0:-10dB output_rm.mp3

## 他の方法
- 音量の正規化のアプリは色々とあるだろうけれど、コマンドで一発で変換したかったので今回はffmpegを利用することにした。
- シェルスクリプトにまとめた。
```sh
#! /bin/bash
input_dir="$(dirname -- $1)"
filename="$(basename -- $1)"
echo "$1"
echo "$input_dir"
echo "$filename"
ffmpeg -y -i $1 -af loudnorm=I=-16:LRA=11:TP=-1.5  $input_dir/temp_$filename
ffmpeg -y -i $input_dir/temp_$filename -af "afftdn=nf=-25" $input_dir/temp1_$filename
ffmpeg -y -i $input_dir/temp1_$filename -af "highpass=f=200, lowpass=f=3000" $2
rm $input_dir/temp*
```
- `bash ./norm_and_cut.sh input.mp3 output.mp3`で利用する。
## 感想
- まあ、音量としてはちょうどいい。
- 一般のストリーミングサービスの音量と同じくらいに調整できているんじゃかろうか？
  - この点についてはパラメータの調整が必要になるかもしれない
- ただ賢いノーマライズをしていないので、ノイズも増幅される点には注意してほしい
  - 音量の正規化してからノイズの除去を行うのと、ノイズを除去してから音量の正規化を行うのとどちらがよいか？

## 購入リンク
- シェルスクリプトの購入は以下のリンクから
  - [ffmpeg音量ノーマライズの.shファイル](https://subcul-science.booth.pm/items/3718764)

## 参考リンク
[(FFmpeg) How to normalize audio?](http://johnriselvato.com/ffmpeg-how-to-normalize-audio/)

<script language="javascript" src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3563352&pid=887895158"></script><noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3563352&pid=887895158" rel="nofollow"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3563352&pid=887895158" border="0"></a></noscript>