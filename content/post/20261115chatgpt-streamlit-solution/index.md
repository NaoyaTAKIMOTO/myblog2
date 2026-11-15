---
title: "検索付きチャットUIを最短で用意する — Streamlit と ReAct エージェントで作る調査アシスタント"
date: 2026-11-15T12:50:00+09:00
draft: false
tags: [Streamlit, LangChain, ReAct, Python, 課題解決]
summary: "最新情報を聞くと古い知識が返ってくる。そのたびに検索タブとチャットを行き来していませんか。LangChain の ReAct エージェントに Google 検索と Wikipedia を渡し、Streamlit の1ファイルで検索付きチャットUIを用意するまでの手順と、向かないケースをまとめました。"
---

## 調べものを頼むたびに、知識の古さが気になる

「先週発表されたあの件について教えて」と ChatGPT に聞くと、知らないと答えるか、古い情報を自信ありげに返します。そこで別タブで検索し、結果をコピーして貼り、また質問する。この往復が地味に高くつきます。

`chatGPT_streamlit` は、その往復を1つの画面に畳むための最小構成です。質問を投げると、エージェントが Google 検索と Wikipedia を自分で引き、根拠を添えて日本語で答えます。UI は Streamlit の1ファイル、起動はコマンド1行です。

## 既存手段の限界

| 手段 | できること | 限界 |
|---|---|---|
| ChatGPT 単体 | 一般知識の回答 | カットオフ以降と一次情報に弱い。出典を示さない |
| 自分で検索して貼る | 最新情報を渡せる | 質問と検索の往復が毎回発生する。使う検索先も自分で決める |
| 自前でツール呼び出しを実装 | 自由に組める | ツール選択、ループ、履歴をすべて自分で書く |
| Streamlit + ReAct | 選択とループをライブラリに任せられる | 画面は素朴。ストリーミングや認証は別途 |

このリポジトリが狙ったのは4番目です。「ツールを渡せば、どれを使うかは LLM が決める」というのが ReAct の利点で、質問ごとの分岐を自分で書かずに済みます。

## 解決の設計

作業の前後を並べます。

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: 手で往復する</strong>
    <div class="diagram-box">ChatGPT に質問する</div>
    <div class="diagram-box">古い知識・出典なしの回答が返る</div>
    <div class="diagram-box">別タブで検索し、結果をコピーして貼る</div>
    <div class="diagram-box">また質問する（履歴はタブごとに散らばる）</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: 1画面で完結</strong>
    <div class="diagram-box">質問を入力する</div>
    <div class="diagram-box">エージェントが Google / Wikipedia を選んで引く</div>
    <div class="diagram-box">根拠つきの回答が返る</div>
    <div class="diagram-box">履歴が同じ画面に残る</div>
  </div>
</div>
<p class="diagram-caption">図1: 調査の往復の前後比較</p>
</div>

設計の要点は3つです。

- **ツールは2つ、説明文で選ばせる**: 現在の情報は Google、過去の情報は Wikipedia。分岐はコードに書かない
- **手順はプロンプトで固定する**: 思考は英語、回答は日本語、根拠を述べる、不足なら質問する
- **履歴は画面の状態に持つ**: DB を用意せず、`session_state` に文字列で積む

トレードオフもはっきりしています。ツールの選択精度は `description` の書き方に依存し、DB を持たないので再起動で履歴は消えます。まず動かして価値を見る、という順番を優先した構成です。

もう1つ、あえて自動にしなかった部分があります。検索するかどうかの判断を、コードの分岐ではなく LLM に渡しています。挨拶程度の質問なら、ツールを呼ばずに Final Answer を返せます。ルールで縛ると、そのぶん例外処理が増えます。

## 実装の要点

### ツールを2つ渡す

`chatgpt_streamlit/streamlit_run.py` で、検索と Wikipedia を `Tool` として定義します。

```python
# chatgpt_streamlit/streamlit_run.py
search = GoogleSearchAPIWrapper()
docstore = DocstoreExplorer(Wikipedia())

tools = [
    Tool(name="Search Google", func=search.run,
         description="useful for when you need to answer questions about current events"),
    Tool(name="Search Wikipedia", func=docstore.search,
         description="useful for when you need to answer questions about historical events"),
]
```

`description` は「いつ使うか」で書きます。エージェントはこの文しか見ていないため、ここが曖昧だと検索先を間違えます。日本語で質問しても、エージェントが読むのは英語の説明文です。日本語に訳すかどうかは、質問の言語に合わせて決める余地があります。

### 手順をプロンプトに埋める

`suffix` に、回答の作法をそのまま書きます。

```python
suffix = """Begin!  
最終的な答えは日本語で答えてください。
質問に答える時には根拠も述べてください。
不足する情報がある場合は質問してください。
関西弁で答えてください。

Question: {input}
{agent_scratchpad}"""
```

`{agent_scratchpad}` に Thought / Action / Observation が積まれます。`ZeroShotAgent.create_prompt()` に `tools` を渡すと、ツール一覧の説明が自動で差し込まれる仕組みです。

### 起動して確かめる

```bash
poetry install
poetry run streamlit run chatgpt_streamlit/streamlit_run.py
```

環境変数は `OPENAI_API_KEY`、`GOOGLE_API_KEY`、`GOOGLE_CSE_ID` の3つです（README の記載）。ブラウザで質問すると、`verbose=True` の設定により、選んだツールと検索結果がサーバーの標準出力に出ます。

## 結果

リポジトリに計測値はないため、定性でまとめます。

- 検索タブとの往復が消え、質問と確認が同じ画面で完結します
- 回答に根拠が付きます。`suffix` の「根拠も述べてください」が効いている範囲です
- 途中経過が標準出力で読めるので、どのツールを何回使ったかを後から追えます
- 履歴が残るので「さっきの件だけど」が通ります

一方で、待ち時間は LLM の呼び出し回数に比例して増えます。ReAct は1質問で複数回モデルを呼ぶため、ツールを2回使えば3回以上待つことになります。速さより、往復の手間を減らすことを優先した結果です。

もう1点、確認の手間も変わります。回答が根拠を述べていても、その根拠が正しいかは結局こちらが読む必要があります。検索結果をそのまま信じるのではなく、引用された内容と質問の噛み合いを見る作業が残ります。自動化で消えたのは「検索して貼る」工程であって、「読んで判断する」工程ではありません。

## 向かないケース・残課題

- **ストリーミングが無い**: 長い回答では画面が止まって見えます。`agent_executor.run()` が返るまで何も動きません
- **履歴が揮発する**: `session_state` のみなので、再起動で消えます
- **公開部分が未整備**: `cloud_function_chatGPT.py` は `predict()` を1回呼ぶ単体スクリプトで、HTTP リクエストを受けるハンドラがありません。MySQL への接続も接続先が空欄で、永続化は未設定です
- **テストが無い**: `tests/` は空で、確認は手動と notebook です
- **依存が古い**: `langchain 0.0.101` 前提の import なので、現在のバージョンでは動きません
- **ツール選択の評価が無い**: 誤選択を測る仕組みはなく、精度は `description` とモデル任せです

「自分用の調査アシスタントを今日動かす」用途には向きますが、複数人で使うサービスにするなら、認証・永続化・評価の3つを足す必要があります。

## まとめ

- 検索付きチャットは「ツール定義」「プロンプト」「画面」の3点で成立する
- 分岐を書かずにツールを選ばせるなら ReAct。説明文が実質の設定ファイルになる
- 最短で試すなら Streamlit の1ファイル。永続化と公開は後回しにできる

作り込む前に「自分の質問で役に立つか」を確かめられるのが、この小さな構成の価値です。

## 関連記事

- [Streamlit + LangChain ReAct で作る検索付きチャットUI — chatGPT_streamlit の技術構成](/post/20261115chatgpt-streamlit-tech/)
- [StreamlitでChatGPTのUIを作る—LangChain ReActエージェントとGoogle検索の組み合わせ](/post/chatgpt-streamlit/)

---

**LangChain や Streamlit を使った AI アプリ開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
