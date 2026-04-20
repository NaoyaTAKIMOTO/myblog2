---
title: "声を学習してテキスト読み上げ！TADAで作る日本語ボイスクローンTTSシステム"
date: 2026-04-20T14:00:00+09:00
draft: false
tags: ["TTS", "Python", "FastAPI", "音声合成", "ボイスクローン", "TADA", "HumeAI"]
summary: "HumeAIのTADA（Text-Acoustic Dual Alignment）を使って、参照音声の声質でテキストを読み上げるボイスクローンTTSシステムを構築しました。FastAPIサーバーとCLIツールで構成し、日本語の読み上げに対応しています。"
---

## はじめに

「この人の声でテキストを読み上げてほしい」

音声読み上げ（TTS: Text-to-Speech）の分野では、特定の声質を学習してその声でテキストを合成する「ボイスクローン」技術が急速に進歩しています。

本記事では、HumeAI が公開している **TADA（Text-Acoustic Dual Alignment）** を使ったボイスクローン TTS システムの構築方法を解説します。

## TADA とは

TADA（Text-Acoustic Dual Alignment）は、テキストと音声の特徴を同時に学習する音声生成モデルです。

特徴：
- **参照音声のみで声質を学習** — 大量の学習データが不要
- **日本語対応** — 英語以外の言語でも動作
- **高品質な音声生成** — 自然なイントネーションと声質再現

## システム構成

```
tts/
├── tada/          # TADA ライブラリ本体（HumeAI/tada をgit clone）
├── voices/        # 登録済み音声データ
│   └── {voice_id}/
│       ├── audio.wav      # 参照音声
│       ├── metadata.json  # メタデータ（名前・書き起こし・言語）
│       └── prompt.pt      # TADA EncoderOutput（事前計算済み）
├── segments/      # 音声分割の出力先
├── server/        # FastAPI サーバー
└── tools/         # CLI ツール（音声登録・分割）
```

## 音声の登録フロー

### Step 1: 長い音声の分割

長い参照音声（例：録音データ）は、先に無音区間で分割して使いやすいセグメントに分けます。

```bash
cd tts/tada

uv run python tools/split_audio.py \
    --audio path/to/long_audio.mp3 \
    --output-dir segments/speaker_name \
    --min-duration 5.0 \
    --max-duration 30.0 \
    --silence-thresh -30dB \
    --min-silence 0.5
```

分割後の出力：
```
segments/speaker_name/
├── segment_001.wav
├── segment_002.wav
├── ...
└── segments.json   # マニフェスト（各セグメントの情報）
```

FFmpeg の `silencedetect` フィルターを使っているため、高速・低メモリで動作します。

### Step 2: 音声の登録

分割したセグメントから声質を学習し、`voices/` ディレクトリに保存します。

```bash
uv run python tools/register_voice.py \
    --audio segments/speaker_name/segment_001.wav \
    --transcript "こんにちは、今日はいい天気ですね。" \
    --voice-id my_speaker \
    --language ja
```

登録時に TADA の EncoderOutput（`prompt.pt`）が計算・保存されます。以降の TTS 生成ではこれをキャッシュとして使います。

### Step 3: TTS 生成

登録した音声IDを指定してテキストを合成します。

```bash
uv run python -m server.main generate \
    --voice-id my_speaker \
    --text "明日の会議は14時から始まります。" \
    --output output.wav
```

## FastAPI サーバーの実装

HTTP API として TTS 生成を提供します。

```python
# server/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path
import torch

app = FastAPI(title="TTS Voice Clone Server")

class GenerateRequest(BaseModel):
    voice_id: str
    text: str
    language: str = "ja"

@app.post("/generate")
async def generate_speech(request: GenerateRequest):
    voice_dir = Path("voices") / request.voice_id

    if not voice_dir.exists():
        raise HTTPException(status_code=404, detail=f"Voice '{request.voice_id}' not found")

    # 事前計算済みの音声プロンプトを読み込み
    prompt = torch.load(voice_dir / "prompt.pt")

    # テキストを音声に変換
    audio = tada_model.generate(
        text=request.text,
        prompt=prompt,
        language=request.language,
    )

    # WAV ファイルとして返す
    return StreamingResponse(
        audio_to_wav_stream(audio),
        media_type="audio/wav",
    )
```

### 音声一覧エンドポイント

```python
@app.get("/voices")
async def list_voices():
    voices_dir = Path("voices")
    voices = []

    for voice_dir in voices_dir.iterdir():
        if voice_dir.is_dir():
            metadata_path = voice_dir / "metadata.json"
            if metadata_path.exists():
                with open(metadata_path) as f:
                    metadata = json.load(f)
                voices.append({
                    "id": voice_dir.name,
                    **metadata,
                })

    return {"voices": voices}
```

## セットアップ方法

### 前提条件

- Python 3.10+
- uv
- ffmpeg（`brew install ffmpeg`）
- HuggingFace アカウント（モデルダウンロード）

### インストール

```bash
# TADA ライブラリのインストール
cd tts/tada
uv venv
uv pip install -e .
uv pip install fastapi "uvicorn[standard]" python-multipart openai-whisper

# HuggingFace からモデルをダウンロード（初回のみ）
python -c "from tada import TadaModel; TadaModel.from_pretrained('hume-ai/tada')"
```

### サーバー起動

```bash
cd tts/tada
uv run uvicorn server.main:app --reload --host 0.0.0.0 --port 8080
```

## 日本語TTSの品質について

TADA の日本語対応は実用的なレベルにあります。ただし、いくつかの注意点があります：

**良好な点：**
- 声質の再現度が高い（参照音声に近いトーン）
- 自然なイントネーション
- 感情的な抑揚も再現される

**注意点：**
- 固有名詞（人名・地名）の読み方が不正確になることがある
- 数字の読み上げ（「1万2千円」→「いちまんにせんえん」）に設定が必要
- 長文（200文字以上）は分割して生成することを推奨

## 書き起こしの自動生成

参照音声の書き起こし（transcript）を手動で用意するのが手間な場合は、Whisper で自動生成できます。

```python
import whisper

model = whisper.load_model("large-v3")
result = model.transcribe("reference_audio.wav", language="ja")
print(result["text"])
```

## まとめ

TADA を使ったボイスクローン TTS システムのポイント：

1. **参照音声だけで声質学習** — 大量のデータ収集が不要
2. **EncoderOutput のキャッシュ** — 毎回学習しなくていいため高速に生成できる
3. **FFmpegで音声前処理** — 長い音声も無音区間で適切に分割できる
4. **FastAPI** でHTTP API化 — 他のアプリからも呼び出しやすい

ナレーション読み上げ・有声解説動画の自動生成・オーディオブック制作など、音声を使うプロジェクトに活用できます。

---

**音声合成・TTS システム開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
