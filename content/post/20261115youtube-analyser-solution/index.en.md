---
title: "Reading Trend Performance in Numbers — Filling the Blind Spot in View-Count Rankings"
date: 2026-11-15T13:30:00+09:00
draft: false
tags: [YouTube, data analysis, Next.js, TypeScript, problem solving]
summary: "A view-count ranking cannot tell you whether a trend video worked. This is how one app puts a viral coefficient, a median, and an engagement rate on one screen, aligns the comparison group, and where those numbers still fail."
---

## A view-count ranking does not settle a content plan

When a planning meeting shares "what is trending right now on YouTube", the usual move is to open the Trending tab and project it. What you see is a wall of channels with hundreds of thousands of subscribers. Sorting by view count gives the same result, because the top is always occupied by the largest channels.

What you actually need is not the biggest number but the answer to "how far did channels our size get?". Neither the Trending tab nor a view-count sort corrects for channel size. So the meeting ends up sharing the size of numbers instead of discussing why a video worked.

This post is about what to put on one screen to make that comparison, and how it was built.

## Why existing tools fall short

| Approach | What it gives you | Where it stops |
|---|---|---|
| YouTube's Trending tab | Videos rising right now | Dominated by large channels nationwide; no size correction |
| Sorting by view count | Order by a large number | Big channels fill the top; small-channel hits stay buried |
| A spreadsheet by hand | Full freedom to compute | Copying subscriber counts video by video; updates stop |
| Filtering by subscriber count | An aligned comparison group | You still need a way to compare within that group |

The fourth approach points the right way, but after filtering there is no column that says which video overperformed its size. Aligning the group and comparing within it are two separate steps, and that is why the manual work never ends. In practice, the slow part of building the sheet by hand is not the arithmetic but opening each channel to copy its subscriber count. If that step stays manual, the sheet goes stale within a few weeks.

## The design

The design is simply three numbers living on the same screen.

- **Viral coefficient** (views ÷ subscribers): size correction, one number that produces a ranking
- **Median**: a representative value that survives outliers; only meaningful next to the mean
- **Engagement rate** ((likes + comments) ÷ views): quality of attention, separating videos that got views from videos that got a reaction

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: just read the ranking</strong>
    <div class="diagram-box">Open the Trending tab</div>
    <div class="diagram-box">Sort by view count</div>
    <div class="diagram-box">The top is all big channels</div>
    <div class="diagram-box">Size is never compared</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: align, then compare</strong>
    <div class="diagram-box">Filter by keyword, period, category</div>
    <div class="diagram-box">Divide by subscribers for a coefficient</div>
    <div class="diagram-box">Read the median and engagement rate too</div>
    <div class="diagram-box">Compare performance against size</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: Before and after the change</p>
</div>

There are two tradeoffs.

First, a single number is powerful but unstable when the denominator is small; one outlier can swing the coefficient. The median and engagement rate are shown alongside precisely so nobody decides on the coefficient alone. Second, the app does not decide what counts as a hit. That definition depends on the goal of the plan, so a human still reads the numbers at the end.

I also considered a composite score — weighting the coefficient and engagement rate into one figure — and dropped it. There is no defensible basis for the weights. Showing three numbers and letting the reader decide which one matters suits planning discussions better.

## Implementation notes

### Divide by size

The coefficient is computed where video details and channel data meet.

```ts
// src/lib/youtube/client.ts (calcStats)
const engagementRate = viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0

// src/lib/youtube/client.ts (buildVideoItems)
const subscriberCount = subscriberMap.get(item.snippet.channelId) ?? 0
const viralCoefficient =
  subscriberCount > 0 ? Math.round((stats.viewCount / subscriberCount) * 10) / 10 : 0
```

When the subscriber count is 0 the code skips the division and returns 0. That avoids a divide-by-zero, and it is also the pitfall described later.

### Look at the middle of the distribution

With a mean alone, one video out of fifty can change the impression of the whole set. So the median is computed from the same array, and the top performer is picked by coefficient rather than view count.

```ts
// src/lib/youtube/stats.ts
const sorted = [...viewCounts].sort((a, b) => a - b)
const mid = Math.floor(sorted.length / 2)
const medianViewCount =
  sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]

const topPerformer = videos.reduce((top, v) =>
  v.viralCoefficient > top.viralCoefficient ? v : top
)
```

### Align the comparison group

Subscriber filtering is exposed as presets rather than free input, so that everyone shares the same basis for the group.

```tsx
// src/components/search/SearchForm.tsx
const SUBSCRIBER_MAX_PRESETS = [
  { label: '指定なし', max: undefined },
  { label: '〜1万', max: 10_000 },
  { label: '〜10万', max: 100_000 },
  { label: '〜100万', max: 1_000_000 },
] as const
```

The chosen ceiling travels to the API as `subscriberCountMax`. In `src/lib/youtube/client.ts` it filters to videos whose channel is at or below the ceiling, and only then sorts by coefficient. The order matters: filtering after taking the top 50 would leave too few rows, so this sequence is not interchangeable.

## Results

The same fifty videos produce a different order under view count and under the coefficient. What the meeting looks at first shifts from "the biggest number" to "the video that grew beyond its channel size", and the conversation moves on to why it worked.

The summary shows five numbers: result count, average views, median views, average engagement rate, and average viral coefficient. I keep it at five so the meeting always reads them in the same order. The more metrics you add, the more people pick the flattering one.

The other thing that helped was how cheap trending mode is. It requests Japan's most popular videos with `chart=mostPopular` and `regionCode=JP`, then makes two calls — `videos.list` and `channels.list` — without the three pages of `search.list` that keyword search needs. That makes it cheap enough to run repeatedly without watching quota.

As for the work itself, copying subscriber counts into a sheet is gone. What remains is the time spent reading the numbers.

## When not to use it

- **Channels with hidden subscriber counts**: when `hiddenSubscriberCount` is true, the channel is treated as having 0 subscribers, the coefficient becomes 0, and it falls to the bottom. The UI cannot yet distinguish "no traction" from "no data".
- **Subscriber counts are current values**: the denominator is the count at fetch time, not at publish time. If a video itself drove subscriber growth, its coefficient reads low.
- **Brand-new videos**: while view counts are small, a single view carries a lot of weight and the coefficient swings by multiples. Choosing "this week" as the period makes this worse.
- **The sort label**: "sort order (at fetch time)" only changes how candidates are collected; display is always by coefficient.
- **Tests**: the tests expect `subscriberCountMin` and `viewCountMin`, but the implementation only goes as far as `subscriberCountMax`. At the time of writing, `npm test` reports 25 failures out of 51.
- **Period end**: `publishedBefore` is accepted by the API layer, but the UI has no input for it.

## Takeaways

- Ranking videos of different sizes produces a meaningless order. Align the group first
- Once aligned, show a divided metric (the coefficient) next to a distribution summary (the median)
- Do not let one number decide; keep a second axis such as engagement rate beside it
- Be able to explain the limits — hidden counts, current values, brand-new videos — outside the screen

No special analytics stack is required. A few API calls and one division change what the meeting talks about.

## Related posts

- [Trend analysis with Next.js and the YouTube Data API — designing filters and aggregation](/en/post/20261115youtube-analyser-tech/)

---

**Working on YouTube data analysis or metric design and need help?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1117897)
