---
title: "StreamlitでChatGPTのUIを作る—LangChain ReActエージェントとGoogle検索の組み合わせ"
date: 2026-04-20T21:00:00+09:00
draft: false
tags: ["Streamlit", "LangChain", "ChatGPT", "Python", "Google検索", "Wikipedia", "ReAct"]
summary: "Streamlit と LangChain を組み合わせて、Google検索・Wikipedia検索ツールを持つ ChatGPT エージェントのWebUIを作りました。LangChain の ReAct（Reason + Act）エージェントが自律的にツールを選択して質問に答えます。"
---

## はじめに

「ChatGPT に Google 検索させたい」

2023年当時、ChatGPT の知識は学習データのカットオフ以降の情報を持っていませんでした。最新のニュースや現在の情報を調べてほしいとき、ChatGPT だけでは回答できません。

LangChain の **ReAct エージェント**を使うと、LLM が自律的に「どのツールを使うか」を判断して検索・参照してから回答できます。これを Streamlit でシンプルな Chat UI として実装しました。

## 完成したアプリの機能

- **チャット形式の UI**（streamlit-chat）
- **Google 検索ツール**（GoogleSearchAPIWrapper）
- **Wikipedia 検索ツール**（DocstoreExplorer）
- **ReAct エージェント**が自律的にツールを選択して回答
- 日本語で回答（関西弁スタイル）

質問例：
- 「ガンダムで一番速度のある機体の半分の速さの機体を教えてください。」
- 「艦これが流行っていた頃に放映していたアニメを列挙してください。」

## ReAct エージェントとは

**ReAct（Reason + Act）** は、LLM が「考える（Reason）」と「行動する（Act）」を交互に繰り返しながら問題を解くフレームワークです。

```
質問: 「艦これが流行っていた頃のアニメは？」

Thought: 艦これのサービス開始時期を調べる必要がある
Action: Search Google("艦これ サービス開始 2013")
Observation: 「艦隊これくしょんは2013年4月にサービス開始」

Thought: 2013年〜2015年頃のアニメを調べる
Action: Search Wikipedia("2013年アニメ一覧")
Observation: ...

Final Answer: 艦これが流行っていた2013〜2015年頃のアニメは...（関西弁で回答）
```

このプロセスを LangChain が自動化します。

## 実装コード

### エージェントのセットアップ

```python
from langchain.llms import OpenAIChat
from langchain import PromptTemplate, LLMChain
from langchain.agents import ZeroShotAgent, Tool, AgentExecutor
from langchain.utilities import GoogleSearchAPIWrapper
from langchain.agents.react.base import DocstoreExplorer
from langchain import Wikipedia

# LLM の設定
llm = OpenAIChat(temperature=0.5)

# ツールの定義
search = GoogleSearchAPIWrapper()
docstore = DocstoreExplorer(Wikipedia())

tools = [
    Tool(
        name="Search Google",
        func=search.run,
        description="最新情報や現在の出来事について調べるときに使う",
    ),
    Tool(
        name="Search Wikipedia",
        func=docstore.search,
        description="歴史的な出来事や詳細な事典的情報を調べるときに使う",
    ),
]
```

### プロンプトの設計

エージェントのプロンプトは prefix（前提設定）と suffix（指示）で構成します。

```python
prefix = """Answer the following questions as best you can.
You think step by step in English.
Finally answer in Japanese.
You have access to the following tools:"""

suffix = """Begin!
最終的な答えは日本語で答えてください。
質問に答える時には根拠も述べてください。
不足する情報がある場合は質問してください。
関西弁で答えてください。

Question: {input}
{agent_scratchpad}"""

prompt = ZeroShotAgent.create_prompt(
    tools,
    prefix=prefix,
    suffix=suffix,
    input_variables=["input", "agent_scratchpad"],
)
```

`{agent_scratchpad}` の部分に、エージェントの「思考プロセス（Thought → Action → Observation）」が入ります。

### Streamlit UI

```python
import streamlit as st
from streamlit_chat import message

st.markdown("## chatGPT")
st.markdown("1. 色々なことを質問してみてください")

# チャット履歴の表示
if "generated" not in st.session_state:
    st.session_state["generated"] = []
if "past" not in st.session_state:
    st.session_state["past"] = []

# 入力フォーム
user_input = st.text_input("メッセージを入力してください")

if user_input:
    output = agent_executor.run(user_input)

    st.session_state.past.append(user_input)
    st.session_state.generated.append(output)

# メッセージ表示（新しいものが上に来るよう逆順で表示）
if st.session_state["generated"]:
    for i in range(len(st.session_state["generated"]) - 1, -1, -1):
        message(st.session_state["generated"][i], key=str(i))
        message(st.session_state["past"][i], is_user=True, key=f"{i}_user")
```

### セッションステートで会話履歴を保持

Streamlit は毎回ページ全体を再レンダリングするため、変数をそのまま使うと値がリセットされます。`st.session_state` に保存することで会話履歴が維持されます。

## より簡単なチャット版

Google 検索なしのシンプルなチャット版（`streamlit_run_chat.py`）もあります。LangChain の `ChatOpenAI` を直接呼ぶだけです。

```python
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

chat = ChatOpenAI(temperature=0)

messages = [
    SystemMessage(content="あなたは役立つアシスタントです。日本語で答えてください。"),
    HumanMessage(content=user_input),
]

response = chat(messages)
print(response.content)
```

## 環境変数の設定

```bash
export OPENAI_API_KEY="sk-..."
export GOOGLE_API_KEY="your-google-api-key"
export GOOGLE_CSE_ID="your-custom-search-engine-id"  # カスタム検索エンジンID
```

Google カスタム検索エンジン（CSE）の作成手順：
1. [Google Custom Search Engine](https://cse.google.com/cse/) でエンジンを作成
2. 「ウェブ全体を検索」を設定
3. 検索エンジン ID をコピー

## 起動

```bash
# エージェント版（Google検索 + Wikipedia）
poetry run streamlit run chatgpt_streamlit/streamlit_run.py

# シンプルチャット版
poetry run streamlit run chatgpt_streamlit/streamlit_run_chat.py
```

ブラウザで `http://localhost:8501` が開きます。

## Cloud Functions へのデプロイ

`cloud_function_chatGPT.py` を Google Cloud Functions にデプロイすることで、APIとして呼び出せます。Streamlit UI を持たない軽量な推論エンドポイントとして活用できます。

## まとめ

LangChain の ReAct エージェント + Streamlit で作る ChatGPT UI のポイント：

1. **ReAct エージェント** で LLM が自律的にツールを選択・実行できる
2. **Google検索 + Wikipedia** の組み合わせで最新情報と詳細情報の両方に対応
3. **st.session_state** で Streamlit 特有の再レンダリング問題を解決
4. **プロンプトの prefix/suffix** でキャラクター性（関西弁）を付与できる

LangChain はバージョンによって API が大きく変わりますが、エージェントの基本的な考え方（ReAct パターン）は現在の LangChain v0.3 や LangGraph でも同様に使えます。

---

**LangChainやStreamlitを使ったAIアプリ開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
