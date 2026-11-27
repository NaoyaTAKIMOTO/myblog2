---
title: "Filling a Quiet Discord Channel and a Broken News Flow with One Resident Bot"
date: 2026-11-15T10:50:00+09:00
draft: false
tags: [Discord, community, bot, local LLM, problem solving]
summary: "Two common problems in a small Discord server: chat that never gets going, and news that stays inside everyone's own RSS reader. How one resident bot addresses both with a persona, scheduled posts, and interests that grow from conversation."
---

## A quiet channel and news nobody shares

In a small Discord server, the general channel tends to become a notification board. Someone posts, nobody answers, and the gap before the next message slowly grows. A new member has no obvious way into the conversation.

News sharing breaks in a similar way. Everyone follows their own RSS reader or feed, finds something interesting, and keeps it. Even when they think about sharing it, they do not know who cares about that topic, so they skip it. When they do post it, someone else posts the same link a week later.

These look like separate problems, but both come down to the same thing: there is no shared entry point. So I built **Lobster**, a bot that lives in the general channel and handles both the conversation partner role and the news sharing role in one process.

## Why existing tools fall short

| Approach | What it gives you | Where it breaks |
|---|---|---|
| A generic greeting bot | Something always online | No context, so conversation dies |
| An RSS reader | Articles collected for you | Stays personal, never shared |
| Posting links by hand | Human judgment about what matters | Does not last, and links repeat |
| A cloud LLM bot | Natural conversation | Ongoing cost and conversation data leave the server |
| A scheduled news bot | Posts at fixed times | Ignores interests and reposts old links |

Each option covers either conversation or information sharing, not both. Lobster's aim was to connect them through one list of interests.

## The design

Here is the before and after.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: a quiet channel</strong>
    <div class="diagram-box">Chat every few days, no replies</div>
    <div class="diagram-box">News stays in each member's RSS reader</div>
    <div class="diagram-box">Nobody shares, unsure who cares</div>
    <div class="diagram-box">The same link gets posted twice</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: Lobster</strong>
    <div class="diagram-box">Mention it and get a reply in dialect</div>
    <div class="diagram-box">Up to five news items at 9:00 and 18:00</div>
    <div class="diagram-box">Posted URLs recorded, so links do not repeat</div>
    <div class="diagram-box">Ask "about X" for related articles and topics</div>
    <div class="diagram-box">Interests added or removed from chat</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: Conversation and news sharing, before and after</p>
</div>

Four decisions carry the design:

- **Make the persona a friend, not an assistant**: polite forms and assistant phrasing are banned, and replies are one to three sentences.
- **Keep two entry points**: mentions for conversation, scheduled posts for information, in the same process.
- **Let interests change from chat**: nobody has to open a config file.
- **Bridge topics across languages**: Japanese interests connect to English feeds.

There are tradeoffs. Because inference is local, vocabulary and speed are worse than the newest cloud models, and a machine has to stay on. I prioritized keeping conversation data on the machine and keeping cost fixed.

The bot also does not join conversations on its own. It responds only when mentioned. The design is "always answer when called, and place material at fixed times," not "autonomously liven up the channel."

## Implementation notes

### 1. Acknowledge as fast as possible

In casual chat, speed matters more than polish. Generation takes time, so the handler reacts with 👀 and shows a typing indicator as soon as it accepts a mention.

```ts
// src/discord/handler.ts
if (!isMentioned) return

// 受け付けたことを最速で知らせる（完了は待たない）
void message.react(ACK_EMOJI).catch(() => {})

const userContent = stripMentions(message.content, botId)
```

The reaction is not awaited, so that round trip never delays generation. An immediate reaction makes the wait read as thinking rather than silence.

### 2. Grow interests from conversation

Interests live in `config/news.json`, but asking members to edit JSON is a non-starter. Instead, they can be added and removed from chat. At runtime the array in `runtime.ts` is the source of truth.

```ts
// src/interests/runtime.ts
let current: ReadonlyArray<string> = [...config.news.interests]

export function getInterests(): ReadonlyArray<string> {
  return [...current]
}
```

`config` is `as const` and read-only, so the live value lives separately. An addition is confirmed with a ✅ reaction, and pending requests expire after 60 seconds. The write goes through a temporary file, so a crash mid-write cannot corrupt `news.json`. No restart is needed; the next scheduled post uses the new interests.

### 3. Connect Japanese interests to English feeds

Register "3Dプリンター" and an English feed will still say `3D printing`. A literal match fails. So interests and question keywords are expanded into synonyms and translations with Ollama.

```ts
// src/discord/handler.ts (topic question branch)
const topics = await extractTopics(userContent)
const searchTerms = await expandTerms(topics)
const articles = await fetchAllFeeds()
const matched = rankArticlesByTopics(articles, searchTerms)
```

Results are cached in `data/synonyms.json`, so the second question about the same term does not call Ollama. Scheduled posts use the same expansion, which means interests registered in Japanese still shape which English articles get picked. Keyword matching respects word boundaries, so `CAD` does not match `academic` and `Rust` does not match `Trust`.

## Results

Here is what the repository actually records.

| Item | Value |
|---|---|
| News sources | 17 (domestic and international; RSS1, RSS2, Atom) |
| Scheduled posts | Twice a day, up to 5 articles each, max 2 per source |
| Deduplication | Keeps the last 500 posted URLs |
| Topic questions | Up to 3 related articles and 5 related topics |
| Interest updates | Add or remove from chat, no restart |

Three things change qualitatively:

- Conversation has one clear entry point, and a mention always gets an answer.
- Topics appear at fixed times even when nobody is in the mood to share.
- Interest settings happen inside conversation, so nobody needs to know a config file exists.

The repository does not record usage counts or response rates, so I am not inventing any. What can be said is that a shared entry point now exists.

## When not to use it

- **Multiple chat channels**: only one channel is watched, set by `DISCORD_CHANNEL_ID`. You can separate chat and news, but spreading chat across several channels needs changes.
- **A bot that starts conversations**: responses happen only on mention. Apart from scheduled posts, it will not join a conversation by itself.
- **Per-user context**: history is shared across the channel (the last 20 messages). Profile summaries compensate, but simultaneous conversations blur together.
- **Modest hardware**: the setup assumes a Mac mini M4 Pro with 24 GB or more. Smaller models are faster but hold the tone less reliably.
- **Feed dependence**: news depends on RSS. If sources die, articles dry up, which is why a monthly source audit exists.
- **Voice replies**: speech output is implemented but disabled by default via `TTS_ENABLED`.

## Takeaways

- A quiet channel needs a resident persona and an immediate acknowledgement. Keeping it reactive rather than autonomous made it predictable.
- A broken news flow needs two paths: scheduled posts and topic questions.
- Connecting both through one interest list lets the settings grow inside conversation.
- Local inference protects cost and privacy, at the price of speed and model quality.

There is nothing flashy here. The point is that it keeps running without anyone touching settings, which is what makes it more than a bot that merely sits in the server.

## Related posts

- [A Discord bot that lives in the chat: Ollama, discord.js, and a news pipeline](/en/post/20261115discord-bot-tech/)
- [A Discord bot running a local LLM on a Mac mini M4 (Japanese)](/post/discord-bot/)

---

**Running a Discord community or building a bot?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1117897)
