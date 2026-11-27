---
title: "A Search-Enabled Chat UI in the Shortest Path: A Research Assistant with Streamlit and a ReAct Agent"
date: 2026-11-15T12:50:00+09:00
draft: false
tags: [Streamlit, LangChain, ReAct, Python, problem solving]
summary: "Ask a chat model about last week and you get stale knowledge. Then you search in another tab, paste the result, and ask again. Here is how a LangChain ReAct agent with Google and Wikipedia tools collapses that loop into one Streamlit file, and where the approach stops working."
---

## Every research task reminds you how old the model is

Ask ChatGPT about something announced last week and it either says it does not know or answers confidently with outdated facts. So you open another tab, search, copy the result, paste it back, and ask again. That round trip is quiet but expensive.

`chatGPT_streamlit` folds the round trip into one screen. You ask a question, the agent decides to call Google Search or Wikipedia, and it answers in Japanese with its sources stated. The UI is a single Streamlit file, and starting it takes one command.

## Why existing tools fall short

| Approach | What it gives you | Where it breaks |
|---|---|---|
| ChatGPT alone | General knowledge answers | Weak on anything after the cutoff; no sources |
| Searching and pasting yourself | Current information reaches the model | A round trip per question, and you pick the source each time |
| Hand-rolled tool calling | Full control | You write the selection, the loop, and the history |
| Streamlit + ReAct | Selection and looping come from the library | Plain UI; streaming and auth are on you |

The repository targets the fourth row. Give the agent tools and let the model choose between them — that is the point of ReAct, and it removes the per-question branching you would otherwise write by hand.

## The design

Here is the work before and after.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: manual round trips</strong>
    <div class="diagram-box">Ask ChatGPT</div>
    <div class="diagram-box">Get stale facts, no sources</div>
    <div class="diagram-box">Search another tab and paste results</div>
    <div class="diagram-box">Ask again (history scattered across tabs)</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: one screen</strong>
    <div class="diagram-box">Type the question</div>
    <div class="diagram-box">The agent picks Google or Wikipedia and searches</div>
    <div class="diagram-box">An answer with its reasoning stated</div>
    <div class="diagram-box">History stays on the same screen</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: The research loop before and after</p>
</div>

Three decisions carry the design.

- **Two tools, chosen by description**: current events go to Google, historical topics to Wikipedia. No branching in code.
- **The procedure lives in the prompt**: think in English, answer in Japanese, state the grounds, ask when information is missing.
- **History lives in the UI state**: no database, just strings appended to `session_state`.

The tradeoffs are just as clear. Tool selection is only as good as the `description` text, and without a database the history disappears on restart. The build order favored getting something useful running first.

One thing was also left deliberately automatic. Whether to search at all is a decision made by the model, not by a branch in the code. A greeting can come back as a Final Answer with no tool call. Encoding that as a rule would only add exception handling.

## Implementation notes

### Hand the agent two tools

In `chatgpt_streamlit/streamlit_run.py`, search and Wikipedia are declared as `Tool` objects.

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

Write each `description` as a statement of when to use the tool. It is the only routing information the agent has, so a vague sentence sends the question to the wrong place. The descriptions stay in English even though questions arrive in Japanese; whether to localize them is a decision left open in the code.

### Put the procedure in the prompt

The `suffix` spells out how to answer.

```python
suffix = """Begin!  
最終的な答えは日本語で答えてください。
質問に答える時には根拠も述べてください。
不足する情報がある場合は質問してください。
関西弁で答えてください。

Question: {input}
{agent_scratchpad}"""
```

`{agent_scratchpad}` accumulates Thought, Action, and Observation. Passing `tools` to `ZeroShotAgent.create_prompt()` inserts the tool list automatically.

### Start it and check

```bash
poetry install
poetry run streamlit run chatgpt_streamlit/streamlit_run.py
```

Three environment variables are involved: `OPENAI_API_KEY`, `GOOGLE_API_KEY`, and `GOOGLE_CSE_ID`, per the README. Because `verbose=True` is set, the chosen tool and its search results appear in the server's standard output as you ask questions.

## Results

The repository records no measurements, so this is qualitative.

- The trip to a separate search tab disappears; asking and checking happen on one screen.
- Answers state their grounds, to the extent the `suffix` instruction holds.
- The reasoning trace is readable in standard output, so you can see afterwards which tool ran and how often.
- History persists, so follow-ups like "about that thing earlier" work.

What does not improve is latency. A ReAct loop calls the model several times per question, so two tool calls mean three or more waits. The design traded speed for removing manual work.

Review effort does not disappear either. Even when an answer states its grounds, someone still has to read them and decide whether they hold. What got automated is the searching and pasting, not the reading and judging.

## When not to use it

- **No streaming**: on a long answer the page looks frozen, because nothing moves until `agent_executor.run()` returns.
- **History is volatile**: it lives only in `session_state` and is lost on restart.
- **The public-facing part is unfinished**: `cloud_function_chatGPT.py` is a script that calls `predict()` once; there is no HTTP handler. Its MySQL connection is also left blank, so persistence is not configured.
- **No tests**: `tests/` is empty and verification was manual, plus a notebook.
- **Old dependencies**: the imports assume `langchain 0.0.101` and will not run on current versions.
- **No evaluation of tool selection**: nothing measures a wrong choice; accuracy rests on the descriptions and the model.

For a personal research assistant you want running today, this is a good fit. For a service several people use, authentication, persistence, and evaluation all need to be added.

## Takeaways

- A search-enabled chat needs three things: tool definitions, a prompt, and a screen.
- If you want the model to choose tools without branching, ReAct is enough, and the descriptions act as the config file.
- For the shortest path, one Streamlit file works; persistence and deployment can wait.

The value of this small setup is that you can find out whether it helps with your own questions before investing in the rest.

## Related posts

- [Inside chatGPT_streamlit: a search-enabled chat UI with Streamlit and LangChain ReAct](/en/post/20261115chatgpt-streamlit-tech/)
- [Building a ChatGPT UI with Streamlit and a LangChain ReAct agent (in Japanese)](/post/chatgpt-streamlit/)

---

**Working on an AI app with LangChain or Streamlit?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1117897)
