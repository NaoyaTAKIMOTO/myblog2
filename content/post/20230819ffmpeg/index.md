---
title: "Dockerfileでffmpegをインストールするときのメモ"
date: 2023-08-19T11:01:33+09:00
draft: false
tags: [ffmpeg, docker]
---
## 失敗例
`RUN apt update && apt install -y ffmpeg`

updateとinstallは同じタイミングで行わないとupdateの状態が引き継がれない。Dockerfileでは行ごとにshが初期化されるため。

自動でインストールするために-yオプションをつける。これをつけないとインストールするかどうかの確認ステップで止まる。

同様にしてffmpegの場合、地理情報の入力ステップが起こってインストールが止まる。

## 解決策
`ENV DEBIAN_FRONTEND=noninteractive`
をDockerfile冒頭に追記する。

これで地理情報の入力を求められずにインストールが進む。

## 関連記事
- [ffmpegで音声ファイルの音量の正規化]({{<ref "/post/20210522ffmpegNorm/">}})
- [ffmpegを用いて一枚の画像と音声から動画を作成]({{<ref "/post/20210420ffmpeg/">}})