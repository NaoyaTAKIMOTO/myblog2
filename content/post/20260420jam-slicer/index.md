---
title: "配信録画を自動で分割！FFmpegのsilencedetectで作る動画分割Webアプリ"
date: 2026-04-20T09:00:00+09:00
draft: false
tags: ["FFmpeg", "Python", "FastAPI", "React", "動画処理", "Node.js"]
summary: "FFmpegのsilencedetect フィルターを使って動画を無音区間で自動分割する Webアプリ「JamSlicer」を開発しました。従来の librosa/moviepy 実装と比べてメモリ使用量を 1/100 以下に抑えつつ、分割速度を10〜20倍に向上させた実装を解説します。"
---

## はじめに

ライブ演奏や配信録画を曲ごとに分割する作業、手作業でやっていませんか？

筆者のバンド「Luke Avenue」では、スタジオ録音や配信のフル動画を曲ごとに切り出す作業が毎回発生していました。動画編集ソフトで手動タイムスタンプを打ち込む作業は時間がかかり、間違いも起きやすい。

そこで開発したのが **JamSlicer** です。FFmpegの無音検出機能を使い、動画を自動で曲単位に分割するWebアプリです。

## 解決した3つの課題

### 1. 手作業によるタイムスタンプ入力ミス

40〜50分の録画を曲ごとに切り出すには、各曲の開始・終了時刻を手動で調べる必要があります。ミスが起きると再作業になり、1回の作業に30分以上かかることもありました。

### 2. 既存ツールのメモリ問題

当初は Python の `librosa` と `moviepy` を使った実装を試みましたが、1GBの動画ファイルを処理しようとすると **5〜10GBのメモリ**を消費してしまいました。一般的なPCでは処理できないケースが頻出していました。

### 3. 処理速度の遅さ

再エンコードを伴う分割処理は、1曲あたり数分かかることもあり、10曲以上あるライブ録画では1時間以上待つこともありました。

## FFmpegの silencedetect フィルターで解決

FFmpegには `silencedetect` という強力なフィルターが組み込まれています。これを使うと、動画/音声ファイルの無音区間を高速に検出できます。

```bash
ffmpeg -i input.mp4 \
  -af "silencedetect=noise=-30dB:duration=0.5" \
  -f null - 2>&1
```

出力例:
```
[silencedetect @ ...] silence_start: 45.23
[silencedetect @ ...] silence_end: 47.81 | silence_duration: 2.58
```

このログをパースすれば、無音区間の開始・終了時刻が取得できます。

さらに、分割には **ストリームコピー**（`-c copy`）を使うことで、**再エンコード不要**の高速分割が可能です。

```bash
ffmpeg -i input.mp4 -ss 0 -to 45.23 -c copy segment_01.mp4
```

## アーキテクチャ

```
JamSlicer/
├── frontend/          # React 19 + TypeScript + Vite
│   └── src/
└── backend/           # Python 3.11 + FastAPI
    └── main.py
```

フロントエンドとバックエンドを分離した構成にしています。ブラウザから動画をアップロードし、バックエンドの FastAPI で FFmpeg を実行して結果を返します。

## バックエンドの実装

### 音量解析エンドポイント

`POST /analyze-simple` で動画を受け取り、FFmpeg の silencedetect を実行します。

```python
import subprocess
import re

def analyze_silence(filepath: str, threshold: float = 0.01) -> dict:
    # dBに変換（0.01 → -40dB 相当）
    noise_db = 20 * math.log10(threshold) if threshold > 0 else -60

    cmd = [
        "ffmpeg", "-i", filepath,
        "-af", f"silencedetect=noise={noise_db:.1f}dB:duration=0.3",
        "-f", "null", "-"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    # ログをパースして無音区間を抽出
    silence_starts = re.findall(r"silence_start: ([\d.]+)", result.stderr)
    silence_ends = re.findall(r"silence_end: ([\d.]+)", result.stderr)

    return parse_segments(silence_starts, silence_ends)
```

### 動画分割エンドポイント

`POST /cut-simple` でセグメント情報を受け取り、ストリームコピーで分割します。

```python
def cut_segment(filepath: str, start: float, end: float, output: str):
    cmd = [
        "ffmpeg", "-i", filepath,
        "-ss", str(start),
        "-to", str(end),
        "-c", "copy",       # 再エンコード不要
        "-avoid_negative_ts", "1",
        output
    ]
    subprocess.run(cmd, check=True)
```

### ZIP 一括ダウンロード

分割後の全セグメントをZIPにまとめてダウンロードできます。`zipfile` モジュールを使ったストリーミング生成で、サーバーメモリへの負荷を最小化しています。

## フロントエンドの実装

React + TypeScript でシンプルなUIを実装しています。

1. 動画ファイルをドラッグ＆ドロップでアップロード
2. 音量しきい値スライダーでリアルタイムに検出感度を調整
3. 「解析開始」でFFmpegによる無音区間検出を実行
4. 音量グラフと検出セグメントを可視化
5. 「動画を切り出し」で全セグメントをサーバー側で生成
6. ZIPで一括ダウンロード

## パフォーマンス比較

| 項目 | 従来実装（librosa + moviepy） | JamSlicer（FFmpeg） |
|------|------------------------------|---------------------|
| メモリ使用量 | 5〜10 GB | **30〜50 MB** |
| 音量解析速度 | 基準 | **2〜5倍** |
| 動画分割速度 | 基準 | **10〜20倍** |
| ファイルサイズ制限 | あり | **なし（ストリーミング）** |

メモリ使用量が劇的に改善された最大の理由は、FFmpegが内部でストリーミング処理を行うためです。librosaはファイル全体をRAMに展開してから処理しますが、FFmpegはファイルを読みながら処理します。

## 実際の使用感

40分のライブ録画（約2GB）で試した結果:

- 無音検出: **約5秒**
- 10曲分割: **約30秒**

手作業で30分かかっていた作業が合計35秒に短縮されました。

## セットアップ方法

```bash
# FFmpegのインストール（macOS）
brew install ffmpeg

# バックエンド起動
cd backend
uv sync
uv run uvicorn main:app --reload

# フロントエンド起動（別ターミナル）
cd frontend
pnpm install
pnpm dev
```

- バックエンド: http://localhost:8000
- フロントエンド: http://localhost:5173

## まとめ

JamSlicer は、FFmpegの `silencedetect` フィルターとストリームコピー分割を組み合わせることで、従来の Python ベースの実装と比べて大幅なパフォーマンス改善を達成しました。

- **メモリ**: 5〜10GB → 30〜50MB（1/100以下）
- **速度**: 10〜20倍高速化

配信録画の曲別分割だけでなく、会議録音の話者交代区間検出や、ポッドキャスト編集など、無音区間をヒントとした様々な動画・音声分割に応用できます。

FFmpegは奥が深く、音量正規化・フォーマット変換・字幕埋め込みなど多彩なフィルターが使えます。動画処理に困ったときはまずFFmpegのフィルターを探してみることをおすすめします。

---

**動画処理・自動化ツールの開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
