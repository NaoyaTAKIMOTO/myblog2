---
title: "Apple SiliconでLLMをファインチューニング！MLX + LoRAで日本語読解モデルを自作する方法"
date: 2026-04-20T16:00:00+09:00
draft: false
tags: ["MLX", "LoRA", "LLM", "Apple Silicon", "ファインチューニング", "Python", "機械学習"]
summary: "LiquidAI の LFM2.5-1.2B-JP モデルを Apple Silicon の MLX フレームワークで LoRA ファインチューニングするパイプラインを構築しました。JsQuAD（日本語読解）データセットで学習し、カスタム Chunked Loss と早期停止も実装しています。"
---

## はじめに

「自分専用のLLMを作りたい」「特定のタスクに特化したモデルを手元で動かしたい」

そんなときに使えるのが **LoRA（Low-Rank Adaptation）** によるファインチューニングです。モデル全体を再学習するのではなく、少数の追加パラメータだけを学習するため、一般的なGPUやApple Siliconでも現実的な時間で実行できます。

本記事では、**MLX**（Apple製のML フレームワーク）を使って Mac 上でLLMのファインチューニングを行うパイプライン「FT_LLM」を解説します。

## 使用モデル：LFM2.5-1.2B-JP

LiquidAI が開発した **LFM2.5-1.2B-JP** は、日本語に特化した13億パラメータのモデルです。

| 特徴 | 内容 |
|------|------|
| パラメータ数 | 1.2B（13億） |
| 日本語能力 | 強い（JP特化） |
| 量子化 | 8bit（MLX-8bit版） |
| VRAM（推定） | 約 3GB |

Mac mini M4（16GB）でも十分に動作するサイズです。

## なぜ MLX を使うか

**MLX** は Apple が開発したオープンソースの ML フレームワークで、Apple Silicon の Unified Memory アーキテクチャを最大限に活用します。

### PyTorch vs MLX（Apple Silicon 上）

| 項目 | PyTorch + MPS | MLX |
|------|--------------|-----|
| GPU メモリ管理 | CPU/GPU 分離 | Unified Memory（共有）|
| 日本語モデルの互換性 | 要変換 | GGUF/MLX 形式が豊富 |
| Apple Silicon 最適化 | 限定的 | ネイティブ |

MLX では CPU と GPU がメモリを共有するため、16GB の Mac でも大きなモデルのファインチューニングが可能です。

## LoRA の仕組み

LoRAは、大きなモデルの重み行列 $W$ を「低ランク行列の積 $A \times B$」で近似的に更新する手法です。

```
通常の学習: W' = W + ΔW  （Δ W はW と同じ次元→メモリが巨大）
LoRA:       W' = W + A × B （A: d×r, B: r×d で r≪d→省メモリ）
```

`rank=16` の場合、更新パラメータはモデル全体の数%以下になります。

### LoRA の適用先

LFM2.5-1.2B-JP では以下の層に LoRA を適用しています。

```yaml
lora_parameters:
  rank: 16
  dropout: 0.0
  scale: 20.0
  keys:
    - "self_attn.q_proj"   # クエリ射影
    - "self_attn.k_proj"   # キー射影
    - "self_attn.v_proj"   # バリュー射影
    - "self_attn.out_proj" # 出力射影
    - "conv.in_proj"       # SSM 入力射影（LFM独自）
    - "conv.out_proj"      # SSM 出力射影
    - "feed_forward.w1"    # FFN レイヤー
    - "feed_forward.w3"
```

## 訓練データ：JsQuAD

日本語の機械読解ベンチマーク **JsQuAD** を訓練データに使います。JsQuAD は Wikipedia の文章と、その内容についての質問・回答のペアで構成されています。

```json
{
  "context": "東京スカイツリーは東京都墨田区押上にある電波塔である。高さは634メートルで自立式鉄塔としては世界一の高さを誇る。",
  "question": "東京スカイツリーの高さは何メートルですか？",
  "answers": {"text": ["634メートル"]}
}
```

これをチャット形式に変換してファインチューニングに使います。

```python
# src/ft_llm/data/formatters.py
SYSTEM_QA = (
    "あなたは日本語の読解問題に回答するアシスタントです。"
    "与えられた文章をもとに、質問に対して正確に回答してください。"
)

def format_jsquad(example: dict) -> dict:
    return {
        "messages": [
            {"role": "system", "content": SYSTEM_QA},
            {"role": "user", "content": f"文章:\n{example['context']}\n\n質問:\n{example['question']}"},
            {"role": "assistant", "content": example["answers"]["text"][0]},
        ]
    }
```

## トレーニングの実行

### 設定ファイル（YAML）

```yaml
# configs/lora_1.2b_jp.yaml
model: "LiquidAI/LFM2.5-1.2B-JP-MLX-8bit"

lora_parameters:
  rank: 16
  scale: 20.0

train: true
data: "data/processed/jsquad"
num_layers: 16
batch_size: 4
iters: 15000
val_batches: 50
learning_rate: 2.0e-4
steps_per_report: 100
steps_per_eval: 1500
save_every: 3000
adapter_path: "models/adapters/lora_1.2b_jp_jsquad"
max_seq_length: 2048
```

### 実行コマンド

```bash
# 学習実行
python -m ft_llm.train.run --config configs/lora_1.2b_jp.yaml

# ドライラン（設定確認のみ）
python -m ft_llm.train.run --config configs/lora_1.2b_jp.yaml --dry-run
```

内部では `mlx_lm lora` コマンドにパラメータを渡しています。Python API モードではカスタム損失関数を注入できます。

## カスタム機能：Chunked Cross-Entropy Loss

長いシーケンスのファインチューニングでは、全トークンの logits を一度にメモリに乗せることが難しくなります。そこで **Chunked Loss** を実装しました。

```python
# src/ft_llm/train/chunked_loss.py
def chunked_cross_entropy_loss(
    logits: mx.array,
    targets: mx.array,
    chunk_size: int = 512,
) -> mx.array:
    """
    logits をチャンク分割して cross-entropy loss を計算。
    長いシーケンスでのメモリ使用量を削減する。
    """
    total_loss = mx.array(0.0)
    n_chunks = (logits.shape[1] + chunk_size - 1) // chunk_size

    for i in range(n_chunks):
        start = i * chunk_size
        end = min(start + chunk_size, logits.shape[1])
        chunk_logits = logits[:, start:end, :]
        chunk_targets = targets[:, start:end]
        total_loss += nn.losses.cross_entropy(chunk_logits, chunk_targets).mean()

    return total_loss / n_chunks
```

設定ファイルで有効化：

```yaml
chunked_loss: true
chunked_loss_chunk_size: 512
```

## カスタム機能：早期停止

検証損失が改善しない場合にトレーニングを自動停止します。

```python
# src/ft_llm/train/early_stopping.py
class EarlyStopping:
    def __init__(self, patience: int = 5, min_delta: float = 0.001):
        self.patience = patience
        self.min_delta = min_delta
        self.best_loss = float("inf")
        self.counter = 0

    def __call__(self, val_loss: float) -> bool:
        if val_loss < self.best_loss - self.min_delta:
            self.best_loss = val_loss
            self.counter = 0
        else:
            self.counter += 1

        return self.counter >= self.patience  # True なら停止
```

## 推論デモ

LoRAアダプターを適用した状態で推論を確認できます。

```bash
# ベースモデル（LoRA なし）
python -m ft_llm.demo --model LiquidAI/LFM2.5-1.2B-JP-MLX-8bit

# LoRA アダプター適用
python -m ft_llm.demo \
    --model LiquidAI/LFM2.5-1.2B-JP-MLX-8bit \
    --adapter-path models/adapters/lora_1.2b_jp_jsquad
```

デモ出力例（JsQuAD 形式）：

```
文章: 東京スカイツリーは東京都墨田区押上にある電波塔である。
      高さは634メートルで自立式鉄塔としては世界一の高さを誇る。

質問: 東京スカイツリーの高さは何メートルですか？

回答: 634メートル
```

## LoRA アダプターのマージ

本番利用する際はアダプターをベースモデルにマージして単一のモデルファイルにします。

```bash
python -m ft_llm.train.fuse \
    --model LiquidAI/LFM2.5-1.2B-JP-MLX-8bit \
    --adapter-path models/adapters/lora_1.2b_jp_jsquad \
    --output fused_model/
```

## まとめ

- **MLX + mlx-lm** を使えば Mac 上で LLM のファインチューニングが現実的に実行できる
- **LoRA（rank=16）** で全パラメータの数%未満の追加学習で十分な性能が得られる
- **Chunked Loss** で長いシーケンスのメモリ問題を解消できる
- **JsQuAD** などの日本語データセットで日本語タスク特化モデルを作れる

Apple Silicon の高いメモリ帯域幅と Unified Memory を活かすことで、クラウドGPU不要でLLMのファインチューニングが手軽に試せる時代になっています。

---

**LLMのファインチューニングや機械学習開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
