---
title: "Cutting the Cost of Knowing What Is Trending on X"
date: 2026-11-15T12:30:00+09:00
draft: false
tags: [X, FastAPI, LLM, information gathering, problem solving]
summary: "Following an X timeline costs three things: finding the right posts, reading them, and summarizing them. How TopicDigestX moves each to a server, the trade-offs, and what is still not built."
---

## There is no time to read the timeline

You open the timeline on the commute. By lunch a different topic has taken over, and by evening you cannot say what the discussion was actually about. Following more people adds information without adding reading time.

The problem splits into three stages.

1. **Discovery**: you cannot tell whether a post matters until you open it.
2. **Reading**: even when it matters, long threads and quote chains take time.
3. **Digesting**: you still have to condense what you read into "here is what happened today."

TopicDigestX moves those three stages to a server. You register keywords as topics, collection and summarization run automatically, and you read only a digest. What exists today is the foundation; collection and summarization are still ahead.

## Why existing tools fall short

| Approach | What it gives you | Where it breaks |
|---|---|---|
| Reading the timeline | Full context | The volume does not shrink, and the order disappears as it flows |
| Lists and search | Catches accounts you do not follow | The reading is still yours to do |
| Aggregators and newsletters | The highlights, already summarized | Not tuned to your topics, and you cannot pick the granularity |
| Bookmarks and read-later | You can find it again | It piles up; the reading still happens later |
| Pasting posts into an LLM | A summary on demand | Manual copying every time, and that one batch only |

None of these removes the reading itself. What can be removed is the searching before, and the condensing after.

## The design

Here is the workflow before and after.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: follow by hand</strong>
    <div class="diagram-box">Scan the timeline for what looks relevant</div>
    <div class="diagram-box">Follow threads and quote chains</div>
    <div class="diagram-box">Condense it in your head</div>
    <div class="diagram-box">A day later, the details blur</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: TopicDigestX</strong>
    <div class="diagram-box">Register keywords as a topic</div>
    <div class="diagram-box">The server collects related posts (planned)</div>
    <div class="diagram-box">An LLM summarizes them (planned)</div>
    <div class="diagram-box">You read the digest only</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: Knowing what is trending, before and after</p>
</div>

Three decisions define the design.

- **Store the interest**: keywords become a row in the database, not something retyped each session.
- **Move the expensive work server-side**: collection and summarization are detached from the reader's waiting time.
- **Fix the output shape**: you decide how much to read before you start reading.

The trade-offs are real. Freshness depends on how often collection runs, so breaking news will lag. Summarization compresses, so nuance and counterarguments get flattened. What you buy is the ability to judge whether something is worth reading before spending the time.

## Implementation notes

### 1. Turn an interest into one row

```python
# backend/model.py
class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    keywords = Column(Text, nullable=True)
```

Keywords are a comma-separated `Text` column. Normalizing search conditions into their own table can wait until topics actually carry more than one shape of condition.

### 2. Keep keys and connection strings on the server

```python
# backend/main.py
class Settings(BaseSettings):
    database_url: str = "sqlite:///./test.db"
    llm_model_name: str = "gpt-3.5-turbo"

    model_config = SettingsConfigDict(env_file='../.env', extra='ignore')
```

The browser never receives a key, and `/config` returns only a type name and the model name. When collection and summarization live on the server, that line is the security boundary.

### 3. Decide the output shape first

`/digest/{topic_id}` returns dummy data today, but the shape is already fixed.

```python
# backend/main.py
return {
    "topic_id": topic_id,
    "generated_at": "2023-10-27T10:00:00Z",
    "summary": "LLMs continue to advance rapidly. ...",
    "key_tweets": [{"id": "12345", "text": "...", "author": "userA"}],
}
```

Fixing the shape lets the UI and the summarizer be built separately. Dummy content still supports a real screen as long as the interface is stable.

## Results

The project is in development, so there are no user counts or time-saved figures. What can be claimed is qualitative.

- Discovery becomes "register a keyword" instead of scanning.
- The amount read is set by the digest length, not by how busy the timeline is.
- Condensing moves to the server in the form of a summary.

| Stage | Before | After (as designed) |
|---|---|---|
| Discovery | Scanning the timeline by eye | Collecting against stored conditions |
| Reading | Following posts and threads | Reading a summary and the key posts |
| Digesting | Condensing mentally | Saved as a digest and revisited |

The "After" column is the design target. Until collection and summarization exist, it stays unfilled.

## When not to use it

- **Breaking news**: collection interval decides the lag. Real-time needs a different tool.
- **Cases where the exact wording matters**: summarization drops context around quotes and rebuttals. The design should let you jump back to the source through `key_tweets`.
- **Topics with little activity**: a niche keyword produces an empty digest, so a minimum-volume threshold is needed.
- **Anything depending on the X API**: changes to the API or its limits stop collection. The client needs to be replaceable.
- **Multi-user use**: there is no authentication yet, so topics are not owned by anyone.
- **Schema changes**: without Alembic there is no migration history.

## Takeaways

- Do not try to add reading time; move the stages before and after reading to a server.
- Once an interest is data, collection and summarization become automatable.
- Fixing the output shape lets the UI and the processing be built in parallel.

Today the container is there and the digest is empty. The shape — decide what to read, then read it — does not change once collection and summarization arrive.

## Related posts

- [Building the TopicDigestX Backend on FastAPI and PostgreSQL](/en/post/20261115topic-digestx-tech/)
- [Summarizing an X timeline automatically: designing a topic digest system with FastAPI and an LLM (in Japanese)](/post/topic-digestx/)

---

**Building an information pipeline or an LLM summarizer of your own?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1993863)
