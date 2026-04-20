---
title: "GradioでAI水平思考クイズを作ってHugging Face Spacesにデプロイした話"
date: 2026-04-20T19:00:00+09:00
draft: false
tags: ["Gradio", "Python", "Hugging Face Spaces", "Cohere", "LLM", "ゲーム"]
summary: "水平思考クイズ（海亀スープ）のAI GMをGradioで作りました。Cohere の command-r-plus モデルが「はい」「いいえ」「わからない」で答えるGMを担当し、CSVで問題を管理します。Hugging Face Spacesに無料でデプロイしています。"
---

## はじめに

**海亀スープ**（水平思考クイズ）をご存じですか？

出題者が謎めいた状況を提示し、参加者が「はい」「いいえ」「わからない」で答えられる質問を繰り返して真相を当てるゲームです。

例題：
> 「ある男性が、海の前に立っています。スープを一口飲み、泣き出してしまいました。なぜでしょう？」

この謎かけゲームに AI がGM（ゲームマスター）として参加する Web アプリ「**umigame-chat**」を Gradio で作りました。

## アプリの機能

- **ランダムお題選択**: CSVに収録した問題からランダムに出題
- **AI GM**: Cohere の `command-r-plus` がシステムプロンプトを受けて「はい/いいえ/わからない」で回答
- **ヒント機能**: プレイヤーが詰まったときにヒントを確認できる
- **答え確認**: 「答えを教えて」で正解を開示
- **会話例**: 典型的な質問の例文を表示

## 技術スタック

| 用途 | 技術 |
|------|------|
| UI | Gradio 4.4.1 |
| LLM | Cohere command-r-plus |
| 問題データ | CSV（merged_themes.csv）|
| ホスティング | Hugging Face Spaces |
| 依存管理 | Poetry |

## なぜ Cohere を使うか

Gradio アプリを Hugging Face Spaces で無料公開する場合、OpenAI APIの費用が問題になります。Cohere の `command-r-plus` は無料のトライアルAPIキーがあり、個人プロジェクトでの利用コストを抑えられます。

また、`command-r-plus` は日本語の理解・生成品質が高く、「はい/いいえ/わからない」という制約付き回答も指示に従ってくれます。

## プロンプト設計

GMの振る舞いをシステムプロンプトで制御しています。

```python
def set_theme(question_umigame, answer_umigame):
    system_prompt = """
    you are the GM of the soup of sea turtle. 
    the question and answer are given below.

    The given question：{0}
    The given answer：{1}

    「ゲーム開始」「問題を出してください」に対しては問題文を答えてください。
    質問には問題文や答えと内容を考慮して絶対に「はい」か「いいえ」か「わからない」だけで答えてください。
    質問が問題文や答えとあっている場合には「はい」と答えてください。
    質問が問題文や答えと合致しない場合には「いいえ」と答えてください。
    質問が問題文や答えと関係ない場合には「わからない」と答えてください。
    「回答：...」内容が答えにおおまかに合致している場合には答えの内容を、
    合致していない場合には「いいえ」だけで答えてください。
    答えを教えてという質問に対しては答えの内容を教えてください。
    """.format(question_umigame, answer_umigame)
    return system_prompt
```

ポイントは **お題と答えをプロンプトに埋め込む**ことです。GMは回答に基づいて質問の正誤を判定するため、事前に答えを持っている必要があります。一方、プレイヤーには答えのタブが隠れているため、不正はできません。

## Cohere API の呼び出し

```python
import cohere

co = cohere.Client(api_key)

def call_chatgpt(message, chat_history, system_prompt):
    response = co.chat(
        model="command-r-plus",
        message=f"SYSTEM:{system_prompt}, USER:{message}",
        temperature=0.3,    # 低めにして安定した「はい/いいえ」回答を得る
        chat_history=[],
        prompt_truncation="AUTO",
    )

    bot_message = response.text
    chat_history.append((message, bot_message))
    return "", chat_history
```

`temperature=0.3` にしているのは、創造的な回答より一貫した「はい/いいえ/わからない」が必要だからです。

## 問題データの管理

問題は CSV ファイル（`data/merged_themes.csv`）で管理しています。

```csv
お題,答え,ヒント
ある男性がバーでスープを一口飲んで家に帰り、妻を殺した。,男性は目が見えず妻が浮気をしているとは知らなかったが、スープの味から知ってしまった。,目
...
```

ランダム選択はシンプルに `random.randint` で実装：

```python
def random_theme():
    with open("data/merged_themes.csv", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    row = rows[random.randint(0, len(rows) - 1)]
    return row["お題"], row["答え"], row["ヒント"]
```

## Gradio UI の実装

Gradio の `Blocks` API でタブ構成の UI を作っています。

```python
def main():
    with gr.Blocks() as demo:
        # お題・ヒント・答えをタブに分けて表示
        with gr.Tab("お題"):
            question = gr.Text(label="ウミガメのスープのお題")
        with gr.Tab("ヒント"):
            hint = gr.Text(label="ヒント")
        with gr.Tab("答え"):
            answer = gr.Text(label="答え")
        with gr.Tab("system prompt"):
            system_prompt = gr.Text(label="system prompt")

        random_theme_btn = gr.Button("ランダムにお題を選ぶ")

        gr.Markdown("## 質問コーナー")
        chatbot = gr.Chatbot()
        msg = gr.Textbox()
        btn = gr.Button("Submit")

        # 例文ボタン（クリックで msg に入力）
        gr.Examples(
            [["問題を出して"],
             ["その人は生きていますか？"],
             ["それは食べられますか？"],
             ["回答：ひろし君は逆走している"],
             ["答えを教えて"]],
            [msg],
        )

        # イベント設定
        btn.click(call_chatgpt, [msg, chatbot, system_prompt], [msg, chatbot])
        msg.submit(call_chatgpt, [msg, chatbot, system_prompt], [msg, chatbot])
        random_theme_btn.click(
            random_theme_callback,
            outputs=[question, answer, hint, system_prompt, chatbot]
        )

        demo.launch()
```

## Hugging Face Spaces へのデプロイ

Hugging Face Spaces では `README.md` のフロントマターに設定を書くだけでデプロイできます。

```yaml
---
title: Umigame Chat
sdk: gradio
sdk_version: 4.4.1
app_file: app.py
---
```

### secrets の設定

API キーは Spaces の「Settings → Repository secrets」で設定します。`os.getenv("CO_API_KEY")` で読み込むだけで本番環境でも安全です。

```python
import os
api_key = os.getenv("CO_API_KEY")
co = cohere.Client(api_key)
```

### requirements.txt の管理

Spaces では `requirements.txt` が依存関係の解決に使われます。Poetry を使っている場合は別途管理する必要があります。

```bash
# requirements.txt に書き出す
poetry export -f requirements.txt --output requirements.txt --without-hashes
```

## まとめ

Gradio + Hugging Face Spaces でのAIゲームアプリ開発で学んだポイント：

1. **Gradio の Blocks API** でタブ・ボタン・チャットボットを組み合わせたUIが短時間で作れる
2. **システムプロンプトへの埋め込み** でお題・答えをGMに渡し、ゲームロジックを制御できる
3. **temperature を低く設定** して「はい/いいえ/わからない」の制約付き回答を安定させる
4. **Hugging Face Spaces** は README のフロントマターだけで無料デプロイができる

「海亀スープで遊びたい友達がいないとき」や「一人でゲームを練習したいとき」に使えます。プレイ中の考え方の練習にもなって意外と楽しいので、ぜひ試してみてください。

---

**GradioやHugging Faceを使ったAIアプリ開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
