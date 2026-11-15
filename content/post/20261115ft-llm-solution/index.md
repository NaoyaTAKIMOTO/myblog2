---
title: "GPU なしで日本語 LLM をファインチューニングする — Mac 1台で回す学習と評価"
date: 2026-11-15T11:50:00+09:00
draft: false
tags: [MLX, LoRA, LLM, Apple Silicon, ファインチューニング, 課題解決]
summary: "GPU を用意せずに日本語 LLM を調整したい。その壁を、MLX と mlx-lm を使った Mac 1台のパイプラインで外しました。環境構築からデータ整形、長文のメモリ対策、評価、Ollama での配布までの詰まりどころと、実際の数値を整理します。"
---

## GPU がないと、どこで止まるか

日本語 LLM を自分のタスクに合わせたい。そう思って調べると、ほぼ必ず CUDA のGPUが出てきます。

止まり方は3つです。**用意できない**（GPUがない、クラウドの費用と枠を毎回考える）、**書けない**（学習・整形・評価をそれぞれ用意する）、**続かない**（条件を変えるたびに同じ作業を繰り返す）。

FT_LLM は、この3つを Mac 1台に寄せたパイプラインです。CUDA のGPUは使わず、Apple Silicon の統合メモリと MLX で学習します。対象は LFM2.5-1.2B-JP と LFM2-24B-A2B です。

## 既存手段の限界

| 手段 | できること | 限界 |
|---|---|---|
| クラウドGPU | 何でも動く。メモリも潤沢 | 確保と費用の判断が毎回必要 |
| PyTorch + MPS | Mac でも GPU を使える | ADR-0001 は MLX の約1/30の推論速度として不採用にしている |
| CPU だけで学習 | 追加の環境が要らない | 1.2B でも現実的な時間で終わらない |
| 既製のファインチューニングサービス | コードを書かずに試せる | データ形式・評価・配布の自由度が低い |

## 解決の設計

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: GPU を探すところから</strong>
    <div class="diagram-box">クラウドGPUの確保と費用判断</div>
    <div class="diagram-box">学習・整形・評価をそれぞれ自作</div>
    <div class="diagram-box">条件を変えるたびに同じ作業</div>
    <div class="diagram-box">配布方法が決まらない</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: Mac 1台で完結</strong>
    <div class="diagram-box">uv sync で依存を揃える</div>
    <div class="diagram-box">YAML を1枚書いて1コマンドで学習</div>
    <div class="diagram-box">同じリポジトリで採点と長文テスト</div>
    <div class="diagram-box">GGUF に変換して Ollama で配布</div>
  </div>
</div>
<p class="diagram-caption">図1: ファインチューニング作業の前後比較</p>
</div>

要点は3つです。

- **計算は mlx-lm に任せる**: 学習ループを自作しない
- **設定と後処理だけを持つ**: 前処理・評価・変換をリポジトリ側に置く
- **メモリは「必要になったときだけ」削る**: 長文学習のときだけ損失をチャンク分割する

フルファインチューニングは選びませんでした。8bit 量子化のまま LoRA を載せる方が、メモリも時間も読めるからです。

## 実装の要点

### 1. 環境を揃え、dry-run で確認してから回す

依存は `pyproject.toml` にまとまっています。Python は 3.11 以上、Apple Silicon の Mac が前提です。仮想環境の作成もパッケージ解決も uv に任せられるため、GPU ドライバの調整は要りません。

```bash
uv sync
```

学習は YAML 1枚と1コマンドです。実行前に `--dry-run` を付けると、パスを解決したあとの設定と、どちらの実行モードになるかが表示されます。

```bash
# 設定の確認（学習は走らない）
uv run python -m ft_llm.train.run \
  --config configs/lora_1.2b_jp.yaml --dry-run

# 学習
uv run python -m ft_llm.train.run --config configs/lora_1.2b_jp.yaml
```

1.2B の設定は JsQuAD の 62,859件、15,000イテレーション、batch_size 4、max_seq_length 2,048 です。ADR-0001 では M4 Pro で約30〜60分と記録されています。

### 2. 8K の長文はチャンク損失で通す

長い系列をそのまま扱うと、全トークンの logits がメモリを占めます。`chunked_loss: true` を設定すると、`run.py` は mlx-lm の Python API 経路に切り替わり、`src/ft_llm/train/chunked_loss.py` の損失関数を使います。

```yaml
# configs/qlora_24b_mixed.yaml（抜粋）
max_seq_length: 8192
grad_checkpoint: true
grad_accumulation_steps: 4

chunked_loss: true
chunked_loss_chunk_size: 512

early_stopping_patience: 5
early_stopping_min_delta: 0.001
```

バックボーンを1回通し、LM ヘッドへの射影を 512 トークンずつに分けて交差エントロピーを積みます。コメントには、語彙数 32K・系列長 16K で logits のピークが約6.5GBから約200MBになると書かれています。`grad_checkpoint` と `grad_accumulation_steps` も併用し、48GB の枠に収めています。

### 3. 評価も同じリポジトリで回す

採点は `ft_llm.eval.cli`、長文の汎化は `ft_llm.eval.needle_haystack` です。どちらも学習と同じモデル指定とアダプタ指定で動きます。

```bash
uv run python -m ft_llm.eval.cli \
  --model LiquidAI/LFM2.5-1.2B-JP-MLX-8bit \
  --adapter-path models/adapters/lora_1.2b_jp_jsquad \
  --data data/processed/jsquad \
  --task jsquad --max-examples 100 \
  --output results/eval_1.2b_ft_jsquad.json
```

採点は文字単位の F1 と EM です。単語分割に依存せず、モデルを替えても同じ土俵で比べられます。

## 結果

| 項目 | 1.2B-JP | 24B-A2B（混合データ） |
|---|---|---|
| 学習データ | JsQuAD 62,859件 | 短文・中文・長文 15,000件 |
| 実行時間 | 約30〜60分（ADR-0001） | 約3時間（ADR-0002 の想定） |
| ピークメモリ | 記録なし | 28.055 GB / 48GB |
| アダプタ | 約34MB | 約3.2MB |

JsQuAD の検証データ100件での F1 は、24B がベース 0.2268 から 0.6945 へ上がりました。同じアダプタで JaQuAD は 0.8072（EM 0.65）、JCommonsenseQA は 0.73、JNLI は 0.79 です。

長文は needle-in-a-haystack で、5つの事実を 2,048〜16,384 文字に埋め、位置を変えた計100テストです。混合データのアダプタは 4,096 文字で 0.7635（ベース 0.5794）、8,192 文字で 0.5039（ベース 0.4508）とベースを上回りました。16,384 文字は 0.3089 で、ベースの 0.4451 に届いていません。

配布は `mlx_lm.fuse` で統合し、GGUF に変換して Ollama に取り込みます。ADR-0003 では 14GB の q4_K_M として `ollama run` で応答するところまで確認済みです。

## 向かないケース・残課題

- **フルファインチューニングや事前学習**: LoRA 前提の構成で、全パラメータ更新は想定していません。
- **48GB を超える規模**: 24B の混合データ学習でピーク 28.055GB でした。これ以上のモデルは同じ枠に収まりません。
- **16K 以上の長文**: 訓練データが 8K までなので汎化は保証されず、実測でもベース未達です。
- **1.2B の結果**: JsQuAD の F1 はベース 0.3426 から 0.0236 へ下がり、原因も未特定です。この構成は実用にしていません。

「Mac の統合メモリに収まるモデルを LoRA で調整する」範囲では強い、というのが現時点の結論です。それ以外は GPU を用意する判断が先になります。

## まとめ

- 環境の壁は「依存を1つのコマンドに寄せる」ことで外す
- 手作業の壁は「設定1枚と1コマンド」にし、dry-run で先に確認する
- メモリの壁は「長文学習のときだけ損失を分割する」ことで外す
- 評価の壁は「学習と同じ場所に採点を置く」ことで外す

特別なハードウェアを足したわけではなく、作業の置き場所を Mac に寄せただけです。そのぶん、条件を変えて比べる回数を増やせます。

## 関連記事

- [MLX で組む日本語 LLM の LoRA 学習パイプライン — LFM2.5-1.2B-JP の実装と評価](/post/20261115ft-llm-tech/)
- [Apple SiliconでLLMをファインチューニング！MLX + LoRAで日本語読解モデルを自作する方法](/post/ft-llm/)

---

**Mac での LLM 学習環境の構築や、評価基盤づくりでお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
