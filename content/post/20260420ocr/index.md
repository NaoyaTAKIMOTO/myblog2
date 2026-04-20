---
title: "EasyOCRで日本語画像をテキスト化—セットアップから実運用まで"
date: 2026-04-20T20:00:00+09:00
draft: false
tags: ["EasyOCR", "Python", "OCR", "PIL", "画像処理"]
summary: "EasyOCRを使ってJPEG画像から日本語テキストを抽出するスクリプトを作りました。フォルダにまとめて置いた画像を一括処理し、テキストファイルに書き出します。日本語OCRの精度と前処理のコツも解説します。"
---

## はじめに

紙の書類・手書きメモ・スクリーンショットのテキストをデジタル化したい場面は日常的にあります。

Googleドキュメントや各種オンラインツールで画像のOCRができますが、**大量の画像をバッチ処理したい**、**ローカルで完結させたい**、という要件があったためPythonスクリプトを作りました。

使ったのは **EasyOCR** です。インストールが簡単で日本語を含む80以上の言語に対応しています。

## EasyOCR とは

EasyOCR は JaidedAI が開発したオープンソースのOCRライブラリです。

**特徴**:
- 80以上の言語をサポート（日本語・中国語・韓国語含む）
- GPU / CPU の両方で動作
- pip 一発でインストール可能
- 認識精度が実用的なレベル

**他の選択肢との比較**:

| ライブラリ | 日本語対応 | インストール難易度 | 精度 |
|-----------|-----------|-----------------|------|
| **EasyOCR** | ◎ | 簡単（pip） | 良好 |
| Tesseract | ○ | やや複雑 | 普通 |
| PaddleOCR | ◎ | やや複雑 | 高い |
| Google Cloud Vision | ◎ | API設定が必要 | 非常に高い |

手軽さと精度のバランスから EasyOCR を選びました。

## 実装

コードはシンプルです。

```python
import easyocr
import os
from PIL import Image

# 日本語 OCR リーダーの初期化
reader = easyocr.Reader(["ja"])

# 対象ディレクトリの JPEG ファイルを列挙
directory_path = os.path.join(".", "data")
files = [
    f for f in os.listdir(directory_path)
    if f.endswith(".jpg") or f.endswith(".jpeg")
]

# 出力ディレクトリの作成
output_dir = os.path.join(directory_path, "output")
tmp_dir = os.path.join(directory_path, "tmp")
os.makedirs(output_dir, exist_ok=True)
os.makedirs(tmp_dir, exist_ok=True)

for filename in files:
    file_path = os.path.join(directory_path, filename)

    # 画像を 1024×1024 にリサイズ（OCR精度の安定化）
    image = Image.open(file_path)
    image = image.resize((1024, 1024))
    tmp_path = os.path.join(tmp_dir, filename)
    image.save(tmp_path)

    # OCR 実行
    result = reader.readtext(tmp_path)

    # テキスト部分のみ抽出
    text_parts = [item[1] for item in result]

    # テキストファイルに書き出し
    stem = os.path.splitext(filename)[0]
    output_path = os.path.join(output_dir, f"{stem}.txt")
    with open(output_path, "w") as f:
        f.write("".join(text_parts))
```

## `readtext` の返り値を理解する

EasyOCR の `readtext` はリストを返します。各要素は `(bbox, text, confidence)` のタプルです。

```python
result = reader.readtext("image.jpg")

# 例：
# [
#   ([[10, 20], [200, 20], [200, 50], [10, 50]], "東京都", 0.95),
#   ([[10, 60], [300, 60], [300, 90], [10, 90]], "渋谷区", 0.87),
# ]

# テキストのみ取り出す
texts = [item[1] for item in result]
print("".join(texts))  # 東京都渋谷区
```

信頼度（confidence）を使ってフィルタリングすることで、精度を上げられます。

```python
# 信頼度 0.5 以上のテキストのみ使用
texts = [item[1] for item in result if item[2] >= 0.5]
```

## 前処理でOCR精度を上げる

### リサイズの効果

小さい画像や解像度が低い画像は、そのままでは認識精度が下がります。1024×1024 にリサイズすることでモデルが安定して処理できます。

ただし、アスペクト比を保たないリサイズは文字の形が歪むため注意が必要です。

```python
# アスペクト比を保ってリサイズする場合
from PIL import Image

def resize_with_aspect(image: Image.Image, max_size: int = 1024) -> Image.Image:
    w, h = image.size
    scale = min(max_size / w, max_size / h)
    return image.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
```

### グレースケール変換

カラー画像は OCR の前にグレースケールに変換すると精度が上がることがあります。

```python
image = Image.open(file_path).convert("L")  # グレースケール変換
```

### コントラスト強調

薄い文字や背景と文字の色が近い画像には、PIL の `ImageEnhance` でコントラストを上げると改善されます。

```python
from PIL import ImageEnhance

enhancer = ImageEnhance.Contrast(image)
image = enhancer.enhance(2.0)  # コントラストを2倍に
```

## 日本語 OCR の注意点

### 縦書きの扱い

EasyOCR はデフォルトで横書きを前提としています。縦書きのテキストは認識精度が下がる場合があります。縦書き画像を使う場合は `paragraph=True` オプションを試してみてください。

```python
result = reader.readtext(tmp_path, paragraph=True)
```

### 混在文字（日本語 + 英数字）

`Reader(["ja"])` だけではなく、英語も含める場合は以下のようにします。

```python
reader = easyocr.Reader(["ja", "en"])
```

ただし、言語を追加するとモデルのロード時間が増えるため注意です。

## ディレクトリ構成

```
OCR/
├── ocr/
│   └── ocr.py         # メインスクリプト
├── data/
│   ├── sample.jpg     # 入力画像
│   ├── output/
│   │   └── sample.txt # OCR結果テキスト
│   └── tmp/           # リサイズ済み一時ファイル
└── pyproject.toml
```

## セットアップ

```bash
# 依存関係インストール
poetry install

# 実行
poetry run python ocr/ocr.py
```

GPU を使う場合（CUDA 環境）は EasyOCR が自動で GPU を使用します。Mac の場合は CPU 動作になりますが、A4サイズ程度の画像なら数秒で処理できます。

## まとめ

EasyOCR を使った日本語 OCR のポイント：

1. **インストールが簡単** — `pip install easyocr` だけで日本語OCRが動く
2. **前処理が精度を左右する** — 1024px 以上にリサイズ、コントラスト強調が効果的
3. **信頼度フィルタリング** — `item[2] >= 0.5` で低精度の認識を除外できる
4. **バッチ処理** — フォルダごとまとめて処理して CSV や JSON に書き出すと活用しやすい

無料・オフラインで動く日本語OCRとして、書類のデジタル化・ノートの文字起こしなど幅広い場面で活用できます。

---

**OCRや画像処理の自動化でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
