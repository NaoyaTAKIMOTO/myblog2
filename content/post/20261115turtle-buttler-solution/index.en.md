---
title: "A LINE Butler That Keeps Its Character While Recommending Products"
date: 2026-11-15T09:50:00+09:00
draft: false
tags: [LINE Bot, Gemini, MCP, Rakuten API, problem solving]
summary: "A characterful bot turns into a salesperson when you add product links, and a sales bot loses the character. How turtle-buttler split voice, catalogue, and judgement across a prompt, an API, and the model."
---

## Give a butler something to sell, and he stops being a butler

The first wall in a LINE bot is not technology. It is that people stop opening it. A character carries the first few conversations, then the replies start repeating and the chat goes quiet. Add product recommendations to fix that, and the butler turns into a salesperson mid-sentence.

**Turtle Butler** is a LINE bot built to hold both at once. It speaks as a calm Kansai-dialect butler, remembers names and preferences, and recommends Rakuten products only when the conversation turns that way. It is TypeScript and Gemini, with Firebase Realtime Database for memory and an MCP service wrapping the Rakuten API.

This post is about where the character ends and the selling begins, and where the design compromised.

## Why existing options fall short

| Approach | What it does | Where it breaks |
|---|---|---|
| Branches with canned replies | Fast, cheap, predictable | Same answer every time; conversation dies |
| Product links hard-coded in the prompt | A few lines of work | Prices and stock go stale; recommendations ignore context |
| One LLM call does everything | Natural prose | Invents URLs and prices |
| A general chat UI | Powerful | Not reachable from a LINE friend list |

The first fails by being boring. The third fails by lying. The butler had to avoid both.

## The design

Here is the before and after.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: character or products</strong>
    <div class="diagram-box">Canned Kansai-dialect templates</div>
    <div class="diagram-box">No memory of name or taste</div>
    <div class="diagram-box">Product URLs typed into the copy</div>
    <div class="diagram-box">Conversation stalls after a few turns</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: the turtle butler</strong>
    <div class="diagram-box">Persona prompt fixes the voice</div>
    <div class="diagram-box">Name, taste, mood, topics stored in RTDB</div>
    <div class="diagram-box">Model writes the keyword; the API returns real items</div>
    <div class="diagram-box">The model decides whether to recommend at all</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: Separating conversation from recommendation</p>
</div>

Three decisions carry the design.

- **Voice in the prompt, catalogue in the API.** The persona lives in one constant in `src/prompts.ts`. Every product fact comes from a Rakuten API response.
- **The model decides when to recommend.** There is no `if keyword in message` branch. The decision is a function call that Gemini may or may not make.
- **Limit what memory you hand over.** Only the last two messages go in raw; the long term is compressed into a summary plus five recent topics.

There is a trade-off. Letting the model decide means some turns get no recommendation at all. For the cases where a recommendation must happen, the prompt provides wake words: "search Rakuten", "find me a product", "what do you recommend". Forcing a recommendation every turn is what breaks the voice, so the design deliberately does not raise the odds. It is built for quiet service, not for conversion.

## Implementation notes

### 1. Write the prohibitions into the persona prompt

The character is a single constant, `BASE_SYSTEM_PROMPT` in `src/prompts.ts`. It carries the personality and the dialect, but more importantly it carries what the butler must not do.

```ts
// src/prompts.ts (excerpt from BASE_SYSTEM_PROMPT)
【商品提案の振る舞い】
以下の場合に楽天の検索ツール（search_rakuten_items）を使って商品を検索し、
そのリンクを穏やかに提案します：
1. ユーザーが商品について直接尋ねた場合
2. 「楽天で検索」「商品を探して」「おすすめを教えて」などのウェイクアップワードを使った場合
3. ユーザーの感情や会話履歴から、気分転換や興味を引く商品が適切だと判断した場合

【禁止事項】私を急かしたり、プレッシャーをかけること。
ネガティブな話題に深く入り込むこと。キツいユーモアや不快な言葉遣い。
専門的なアドバイス。キャラクター設定を破る発言（例：「私はAIです」）。
```

The prohibitions did more work than the personality description. Characters usually break in three ways: admitting to being an AI, drifting into expert advice, and rushing the user. Adding a sales capability makes all three more likely. Naming them explicitly is what brings the voice back after a feature is added.

### 2. Three layers of memory, and only some of it goes to the model

State lives in RTDB and is re-read on every request: name, preferences, sentiment, recent topics, chat history, and a summary. Only part of that reaches Gemini.

```ts
// src/kame_buttler.ts (handleLineRequest)
userInfo.recentTopics.push(userMessage);
if (userInfo.recentTopics.length > 5) {
  userInfo.recentTopics.shift(); // drop the oldest topic
}

if (userInfo.chatHistory.length % 10 === 0) {
  userInfo.chatSummary = await summarizeChatHistory(userInfo.chatHistory);
  userInfo.chatHistory = []; // clear the raw log after summarizing
}
```

The three layers are: the last two messages raw, a summary every ten turns, and five recent topics plus preferences. Passing the whole log pulls answers toward old subjects and away from the message just sent. Passing only a summary loses the temperature of that message. Keeping the immediate turns raw and compressing the rest is the split that worked.

Extracting preferences is deliberately not left to the model. Messages beginning with "my name is" or "my favourite food is" are parsed with fixed prefixes (`updateUserName` and friends). Memory is the part that must not fail silently, so it uses the boring mechanism.

### 3. Do not let the model write the product data

Ask a model for a URL and you get one that does not resolve, or a price from last year. So the model only supplies a keyword, and the items come from the API.

```ts
// src/kame_buttler.ts (getGeminiResponse)
if (functionCall.name === 'search_rakuten_items') {
  const products = await callMcpTool('rakuten-server', 'search_rakuten_items', {
    keyword: args.keyword,
    hits: args.hits
  });
  return JSON.stringify({
    tool_code: {
      name: 'search_rakuten_items',
      result: JSON.stringify(products)
    }
  });
}
```

On the receiving side, `apps/rakuten-server/src/index.ts` clamps the request with `Math.min(args.hits || 5, 30)`. If the model asks for a hundred items, it gets thirty, so neither cost nor latency runs away.

This is also where the implementation is unfinished. Nothing sends the tool result back to Gemini as a `functionResponse` for a second pass, so today the JSON itself becomes the reply. The split of facts and voice is right; the final leg is missing.

## Results

What the repository can actually show:

- Preferences are captured from ordinary conversation. A message that starts with "my name is" or "my favourite food is" is stored, no onboarding flow needed.
- Recommendation moved from a code branch to a model decision, so it can appear mid-conversation instead of on a fixed trigger.
- RTDB rules enforce the data shape: at most 100 chat entries, at most 5 recent topics, `language` limited to four dialects, `sentiment` limited to five values.
- Tests: 27 unit, 23 integration, 9 E2E, plus 7 and 5 on the MCP services. Persona and memory regressions are caught by the first two tiers.

To be honest about scope: the repository contains no measurement of user counts or retention. What can be claimed here is that the shape of the design holds, not that it moved a metric.

## When not to use it

- **You need to sell on every turn.** This design intentionally skips recommendations, so it is wrong for a bot whose purpose is promotion.
- **Tool results must sound like the butler.** As described, they do not yet. Fixing that round trip is the top priority.
- **You need fine-grained sticker emotions.** Stickers are mapped by package and sticker ID (about twenty entries), and anything unknown becomes `neutral`. Gemini Vision for sticker images is listed as planned in the docs, not implemented.
- **You need nuanced sentiment.** It is a four-way keyword match. Sarcasm and mixed feelings are out of reach.
- **You need the mood saved for the same turn.** Sentiment analysis runs after the save, so it lands one turn late.

For quiet, low-pressure service it fits. For time-sensitive selling, it needs a different design.

## Takeaways

Balancing character and recommendation is not a matter of adding features. It is a matter of placing them.

- Keep the voice in one prompt, and defend it with prohibitions.
- Keep products and prices in an API, out of the model's reach.
- Let the model decide when to recommend; add wake words for the cases that must fire.
- Limit what memory you send: recent turns raw, the long term summarised.

Those four points apply to any bot that pairs a persona with external data, on LINE or anywhere else.

## Related posts

- [Building a LINE butler bot with Gemini function calling and MCP](/en/post/20261115turtle-buttler-tech/)
- [Fixing a LINE bot's user retention problem with MCP integration (in Japanese)](/post/20250711turtle-buttler/)

---

**Planning or designing a LINE bot?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1993863)
