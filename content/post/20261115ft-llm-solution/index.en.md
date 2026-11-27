---
title: "Fine-tuning a Japanese LLM Without a GPU: One Mac, One Pipeline"
date: 2026-11-15T11:50:00+09:00
draft: false
tags: [MLX, LoRA, LLM, Apple Silicon, fine-tuning, problem solving]
summary: "No CUDA GPU, no cloud quota, no separate evaluation scripts. How FT_LLM turns fine-tuning a Japanese LLM into one Mac workflow, and where the approach still falls short."
---

## Where things stall without a GPU

You want a Japanese LLM tuned for your own task. You search, and every path leads to a CUDA GPU.

The stalls come in three shapes. **You cannot get one**: no GPU on hand, and cloud quota plus cost is a decision to re-make every time. **You cannot write it**: training script, data formatting, and evaluation each need their own code. **You cannot keep it up**: even after it runs once, every new comparison means repeating the same setup.

FT_LLM moves all three onto a single Mac. It skips CUDA and trains on Apple Silicon's unified memory with MLX. The models are LFM2.5-1.2B-JP and, later, LFM2-24B-A2B.

## Why existing tools fall short

| Option | What it gives you | Where it stops |
|---|---|---|
| Cloud GPU | Anything runs; plenty of memory | Quota and cost decisions every time |
| PyTorch + MPS | GPU access on a Mac | ADR-0001 rejected it at roughly 1/30 of MLX's inference speed |
| CPU-only training | No extra environment | Even 1.2B will not finish in a practical time |
| Hosted fine-tuning services | No code required | Little control over data format, evaluation, or distribution |

What this repository wanted was the freedom of the first option with the convenience of the third.

## The design

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: starting from the GPU hunt</strong>
    <div class="diagram-box">Find cloud GPU, weigh cost</div>
    <div class="diagram-box">Write training, formatting, evaluation</div>
    <div class="diagram-box">Repeat setup for every comparison</div>
    <div class="diagram-box">No plan for distribution</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: one Mac, end to end</strong>
    <div class="diagram-box">uv sync for dependencies</div>
    <div class="diagram-box">One YAML, one training command</div>
    <div class="diagram-box">Same repo for scoring and long-context tests</div>
    <div class="diagram-box">Convert to GGUF, serve with Ollama</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: The fine-tuning workflow before and after</p>
</div>

Three decisions carry the design.

- **Let mlx-lm do the computing**: no hand-written training loop.
- **Own only configuration and post-processing**: preprocessing, evaluation, and conversion stay in the repository.
- **Cut memory only where needed**: chunk the loss for long-context training, not everywhere.

Full fine-tuning was not an option. LoRA on top of the 8-bit quantized model keeps both memory and runtime predictable.

## Implementation notes

### 1. Set up the environment, dry-run, then train

Dependencies live in `pyproject.toml`. Python 3.11 or newer and an Apple Silicon Mac are required; uv handles the virtual environment and resolution, so there are no GPU driver versions to align.

```bash
uv sync
```

Training is one YAML file and one command. Adding `--dry-run` prints the config with paths resolved and says which execution mode will be used.

```bash
# Check the config without training
uv run python -m ft_llm.train.run \
  --config configs/lora_1.2b_jp.yaml --dry-run

# Train
uv run python -m ft_llm.train.run --config configs/lora_1.2b_jp.yaml
```

The 1.2B config uses 62,859 JsQuAD rows, 15,000 iterations, `batch_size: 4`, and `max_seq_length: 2048`. ADR-0001 records this run at roughly 30–60 minutes on an M4 Pro.

### 2. Reach 8K with a chunked loss

Holding logits for every token of a long sequence is what breaks memory. Setting `chunked_loss: true` makes `run.py` take the mlx-lm Python API path and use the loss in `src/ft_llm/train/chunked_loss.py`.

```yaml
# configs/qlora_24b_mixed.yaml (excerpt)
max_seq_length: 8192
grad_checkpoint: true
grad_accumulation_steps: 4

chunked_loss: true
chunked_loss_chunk_size: 512

early_stopping_patience: 5
early_stopping_min_delta: 0.001
```

The backbone runs once, then the LM-head projection and cross-entropy are computed 512 tokens at a time. A comment in the module records the effect: at a 32K vocabulary and 16K sequence length, peak logits memory drops from about 6.5 GB to about 200 MB. `grad_checkpoint` and `grad_accumulation_steps` do the rest to stay inside 48 GB.

### 3. Evaluate from the same repository

Scoring is `ft_llm.eval.cli`; long-context generalization is `ft_llm.eval.needle_haystack`. Both take the same model and adapter arguments as training.

```bash
uv run python -m ft_llm.eval.cli \
  --model LiquidAI/LFM2.5-1.2B-JP-MLX-8bit \
  --adapter-path models/adapters/lora_1.2b_jp_jsquad \
  --data data/processed/jsquad \
  --task jsquad --max-examples 100 \
  --output results/eval_1.2b_ft_jsquad.json
```

Scoring is character-level F1 and exact match. No word segmentation means models stay comparable when you swap them.

## Results

| Item | 1.2B-JP | 24B-A2B (mixed data) |
|---|---|---|
| Training data | 62,859 JsQuAD rows | 15,000 short/medium/long rows |
| Runtime | about 30–60 min (ADR-0001) | about 3 h (ADR-0002 estimate) |
| Peak memory | not recorded | 28.055 GB of 48 GB |
| Adapter | about 34 MB | about 3.2 MB |

On 100 held-out JsQuAD examples, the 24B model rose from F1 0.2268 to 0.6945. The same adapter scores 0.8072 on JaQuAD (EM 0.65), 0.73 on JCommonsenseQA, and 0.79 on JNLI.

Long context is measured by needle-in-a-haystack: five facts embedded in 2,048–16,384 characters at varying positions, 100 tests in total. The mixed-data adapter beats the base model at 4,096 characters (0.7635 vs 0.5794) and at 8,192 characters (0.5039 vs 0.4508). At 16,384 characters it reaches 0.3089 against the base model's 0.4451.

Distribution fuses the adapter with `mlx_lm.fuse`, converts to GGUF, and imports into Ollama. ADR-0003 confirms a 14 GB q4_K_M model answering through `ollama run`.

## When not to use it

- **Full fine-tuning or pretraining**: this is a LoRA setup; updating every parameter is out of scope.
- **Larger than 48 GB**: the 24B mixed run peaked at 28.055 GB. Bigger models do not fit the same frame.
- **Context beyond 16K**: training data stops at 8K, so generalization is not guaranteed, and the measurement falls short of the base model.
- **The 1.2B result**: JsQuAD F1 dropped from 0.3426 to 0.0236 and the cause is unidentified, so that configuration is not in use.

The honest conclusion: this is strong for models that fit in a Mac's unified memory and are adapted with LoRA. Beyond that, getting a GPU is the earlier decision.

## Takeaways

- Remove the environment wall by putting dependencies behind one command.
- Remove the manual wall with one config and one command, checked by a dry run.
- Remove the memory wall by chunking the loss only for long-context training.
- Remove the evaluation wall by keeping scoring next to training.

Nothing exotic was added. The work simply moved onto the Mac, which is what makes repeated comparisons cheap enough to actually run.

## Related posts

- [A LoRA training pipeline for Japanese LLMs on MLX: LFM2.5-1.2B-JP](/en/post/20261115ft-llm-tech/)
- [Fine-tuning an LLM on Apple Silicon with MLX and LoRA (in Japanese)](/post/ft-llm/)

---

**Setting up LLM training or an evaluation harness on a Mac?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1117897)
