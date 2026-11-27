---
title: "自分の声で読み上げたい — 参照音声30秒から作るボイスクローンTTS"
date: 2026-11-15T11:10:00+09:00
draft: false
tags: [TTS, voice cloning, FastAPI, Whisper, 課題解決]
summary: "自分の声でテキストを読み上げたいとき、既製のTTSでは声が違うという壁が残ります。参照音声30秒から声を登録し、HTTPで読み上げるまでを、TADAとFastAPIの実装から整理しました。登録と生成を分けた設計、長い音声の分割、そして向かないケースもまとめています。"
---

## 「自分の声じゃない」が残る

動画のナレーションや教材の読み上げを自動化したいとき、既製のTTSを試すと、たいてい最初の壁は声です。読み上げ自体は自然でも、聞き手が知っている自分の声とは違う。かといって自分で全部録音すると、原稿の修正のたびに録り直しになります。

この記事の出発点は、**自分の声で、任意のテキストを読み上げたい**という要求です。参照音声を30秒ほど用意すれば、以降はテキストを投げるだけで同じ声質の音声が返る状態を目指しました。

作ったのは `tts` というリポジトリで、TADA 3B-ML を FastAPI から呼ぶ構成です。ここでは「声を登録する」という作業をどう分解したか、どこでつまずいたかを書きます。

## 既存手段の限界

| 手段 | できること | 限界 |
|---|---|---|
| 既製のTTSサービス | すぐ使える。品質も高い | 声は選んだ話者の中から。自分の声にはならない |
| 有声モデルの追加学習 | 高い再現度 | 学習データとGPU時間が必要。個人には重い |
| 自分で全編録音 | 完全に自分の声 | 原稿変更のたびに録り直し。編集も手作業 |
| TADA + 参照音声 | 短い参照で声質を渡せる | 30秒という制約と、実行環境の準備が要る |

選んだのは4番目です。狙いは「学習させない」ことでした。追加学習を避けられれば、声の登録は数分の前処理で済み、原稿の変更にも耐えられます。

## 解決の設計

登録と生成を、別のプロセスに分けました。作業の前後を比べます。

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: 声を変えられない</strong>
    <div class="diagram-box">既製TTSの話者から選ぶ（自分の声ではない）</div>
    <div class="diagram-box">原稿を全部自分で録音する</div>
    <div class="diagram-box">修正のたびに録り直し</div>
    <div class="diagram-box">編集ソフトで切り貼り</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: 声を登録して使い回す</strong>
    <div class="diagram-box">参照音声を30秒ほど用意する</div>
    <div class="diagram-box">CLIで1回だけ登録（書き起こし＋encode）</div>
    <div class="diagram-box">テキストをPOSTするとWAVが返る</div>
    <div class="diagram-box">原稿を変えても再登録は不要</div>
  </div>
</div>
<p class="diagram-caption">図1: 読み上げ作成の前後比較</p>
</div>

設計の要点は3つです。

- **声の登録は1回だけ**: 参照音声から `prompt.pt` を作り、`voices/` に置く
- **生成はステートレス**: サーバーは `voice_id` とテキストだけを受け取る
- **重いモデルを同居させない**: Whisper と encoder は CLI 側で順番に使い、解放する

登録を CLI に置いたのは、そこでしか使わないモデルをサーバーに載せないためです。サーバーが持つのは TADA 3B-ML だけで、約6GB。Whisper large（約3GB）と encoder（約1GB）を足すと、Mac のメモリでは余裕がなくなります。

トレードオフは、登録に手作業のコマンドが1回挟まることです。Webの管理画面から声を追加できる形にはしていません。その代わり、サーバーは起動時に1回モデルを読むだけで、以降はリクエストごとにモデルを入れ替えません。読み上げの待ち時間が、登録の手間で説明できる形になっています。

## 実装の要点

### 1. 参照音声を30秒以内に整える

TADA の encoder はシーケンス長 8192 が上限で、30秒を超える音声はそのまま渡せません。長い素材は FFmpeg の `silencedetect` で刻みます。

```bash
uv run python tools/split_audio.py \
  --audio path/to/long_audio.mp3 \
  --output-dir segments/speaker_name \
  --min-duration 5.0 --max-duration 30.0 \
  --silence-thresh -30dB --min-silence 0.5
```

無音区間の中点で切るので、語尾の減衰を切り落としにくくなっています。出力は 24kHz モノラルで、`segments.json` に各区間の長さが残ります。ここから聞き取りやすい1本を選ぶのが実際の手順です。

### 2. 書き起こしを付けて登録する

登録は `tools/register_voice.py` の1コマンドです。

```bash
uv run python tools/register_voice.py \
  --name speaker_name \
  --audio segments/speaker_name/segment_003.wav \
  --transcript "参照音声で話している内容"
```

`--transcript` を省くと Whisper large が日本語で書き起こします。ただし TADA 側の ASR は英語のみのため、日本語の参照音声では書き起こしが必須です。自動で作った文が聞き取りと違う場合は、`--transcript` で上書きしたほうが安全です。

このコマンドが `voices/speaker_name/` に `audio.wav`、`metadata.json`、`prompt.pt` を書き出します。`prompt.pt` はモデルに渡す前の表現で、テンソルは CPU に置いたまま保存されます。

### 3. テキストを投げてWAVを受け取る

サーバーを起動したら、あとは HTTP だけです。

```bash
PYTHONPATH=server uv run python server/run.py

curl -X POST http://localhost:8100/tts \
  -H "Content-Type: application/json" \
  -d '{"voice_id":"speaker_name","text":"今日はとても良い天気ですね。","speed":1.0}' \
  --output output.wav
```

返るのは 24kHz・16bit・モノラルの WAV です。`voice_id` が無ければ 404、テキストが空なら 422 が返ります。`speed` は省略可能で、`InferenceOptions` の `speed_up_factor` に渡されます。

推論はサーバー側で `asyncio.Lock` により1本ずつ実行されます。同時に投げると順番待ちになりますが、MPS 上で推論を競合させないための割り切りです。

## 結果

登録済みの声は `GET /voices` で一覧でき、`voice_id` を指定するだけで同じ声質の読み上げが得られます。

| 項目 | 値 |
|---|---|
| 参照音声の長さ | 5〜30秒（推奨） |
| 出力 | 24kHz / 16bit / mono |
| サーバーのメモリ | 約6GB（TADA 3B-ML のみ） |
| テスト | 20件（API 8 / service 5 / store 7） |

作業としては、原稿を変えるたびに録音していた工程が「テキストを書き換えてPOSTする」に置き換わります。声質の一致度は参照音声の長さと録音状態に左右されるため、数値ではなく「聞いて判断する」項目になります。

一度登録した声は `voices/` に残り続けるので、別のテキストにも使い回せます。同じ声で複数の原稿を作る用途ほど、登録のコストは薄まります。

## 向かないケース・残課題

- **30秒を超える参照音声**: encoder の上限で登録できません。分割して、代表的な1本を選ぶ必要があります。
- **感情や演技の指定**: テキストと `speed` 以外に、抑揚を細かく指示する仕組みはありません。「怒った口調で」といった制御は未対応です。
- **日本語以外**: 登録は `language="ja"` 固定です。多言語の切り替えは口が空いていません。
- **同時リクエスト**: 推論ロックにより直列化されます。複数人で使うサービスには、キューかワーカー追加が要ります。
- **声の利用許容**: 参照音声は本人の同意があるものに限ります。第三者の声を無断で登録しない前提のツールです。

「1人で、自分の声で、原稿を何度も直す」用途には合います。逆に、感情表現や多話者の同時生成が中心なら、別の設計が必要です。

## まとめ

- 声の登録を「1回の前処理」として切り出すと、原稿変更に強い
- 参照音声は30秒以内に整える。長い素材は無音で刻む
- 使うときだけモデルを載せる。同居させないことがメモリ対策になる

学習をしないボイスクローンは、データ量の壁を「短い参照音声」に置き換えます。その代わり、前処理と実行環境の設計が成果を左右します。

## 関連記事

- [TADA + FastAPI + Whisper + FFmpeg で組む日本語ボイスクローンTTSのパイプライン](/post/20261115tts-tech/)
- [声を学習してテキスト読み上げ！TADAで作る日本語ボイスクローンTTSシステム](/post/tts/)
- [音声ファイルの音量バラツキで品質が統一できない問題をffmpeg正規化で解決する方法](/post/20250705audio-volume-normalization-solution/)

---

**音声合成や読み上げ自動化の開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1117897)
