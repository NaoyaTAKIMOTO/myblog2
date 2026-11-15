---
title: "When Your Likes Get Buried: Designing Capture and Rediscovery for X Favorites"
date: 2026-11-15T09:30:00+09:00
draft: false
tags: [X, DINOv2, pgvector, Chrome extension, iOS, problem solving]
summary: "Likes on X sink into the timeline the moment you tap them, and there is no way to search by what an image looks like. How Refav Gallery split capture, storage, and rediscovery to fix that, including the tradeoffs and measured results."
---

## The problem

You are scrolling X, see an image you like, and tap the heart. A few months later you want to see it again. That is when the trouble starts:

- The likes tab has thousands of entries, and scrolling back is a chore.
- The timeline is chronological, so you cannot see one artist's work side by side.
- You cannot search by what the image looks like: composition, colour, line work.
- Taking a screenshot only moves the problem into a folder.

The real issue is not that nothing was saved. It is that **there is no path back to what was saved**. Refav Gallery (repository name `x-fav-gallery`) addresses that by splitting the job into capture, storage, and rediscovery. This post describes the design and its tradeoffs in a form you can reuse for your own tool.

## Why existing tools fall short

| Approach | What it gives you | Where it breaks |
|---|---|---|
| The likes tab on X | Everything you liked, in order | The further back you go, the harder it is to reach one item; no content search |
| X search | Find posts by text or account | Cannot search by visual content, and it is awkward for old likes |
| Screenshots and folders | A local copy | Manual work, and the folder buries things just as effectively |
| Bookmark apps | Tags and folders | Curation becomes the job; capture stays manual |
| Your own scheduled X API sync | Automatic collection | Metered billing, and unpredictable cost for personal use |

All of these lean either toward **collecting** or toward **organising**. The weak part is retrieval. The design goal was to automate capture and then give retrieval a different handle: visual similarity.

## The design

Here is the workflow before and after.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: buried</strong>
    <div class="diagram-box">Scroll the likes tab endlessly</div>
    <div class="diagram-box">Give up and take a screenshot</div>
    <div class="diagram-box">Name folders and hope</div>
    <div class="diagram-box">Lose it again a few months later</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: retrievable</strong>
    <div class="diagram-box">Capture happens while you browse X</div>
    <div class="diagram-box">Images, videos, text, and articles in one gallery</div>
    <div class="diagram-box">Follow similar images from one to the next</div>
    <div class="diagram-box">Filter by author, or meet it again in the daily selection</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: Looking back at likes, before and after</p>
</div>

Four decisions carry the design:

- **Capture while the user is already there.** The Chrome extension reads X's own traffic, so no X API calls are made.
- **Fill history from the archive.** Older likes come in through X's official archive ZIP.
- **Retrieve by similarity.** DINOv2 embeddings in pgvector supply nearby images as candidates.
- **Mix in diversity when ordering.** MMR keeps one style from filling the Lightbox.

Two tradeoffs shaped this.

First, **we gave up on full automatic sync.** Scheduled API sync is reliable but metered, which is a poor fit for a personal tool whose cost should stay legible. Instead the extension passively captures the range the user actually opens. Missed items are covered by archive import, so the split is: extension for daily browsing, ZIP for history.

Second, **we stopped trying to rebuild search.** The repository removed search entirely on 2026-08-06 (applied in production as migration 066). Usage had not grown, and the vector tables occupied database buffers, slowing the gallery itself. What remains is an author filter, which needs no vectors and no model. Rediscovery moved from search to similar images and a daily selection.

## Implementation notes

### Capture: send batches, let the server drop duplicates

The extension builds tweets and media URLs from the intercepted GraphQL responses and posts them in one batch.

```ts
// chrome-extension/src/lib/api.ts
const response = await fetch(`${apiUrl}/api/tweets`, {
  method: 'POST',
  headers,
  // source: which client captured this (the extension). The server defaults to 'graphql'.
  body: JSON.stringify({ tweets, collection, source: 'extension' }),
})
```

`collection` is `'like' | 'bookmark'`, so likes and bookmarks are stored separately and merged without duplicates in the gallery. Within one tweet, the same media collapses to a single row through the unique index on `media_identity`, even when different capture paths produce different URL forms. The same media reposted in a different tweet is deliberately not merged, because that would change rediscovery behaviour.

Batches go out every 50 tweets (`INGEST_BATCH_SIZE`, half the server's limit of 100), with a final flush when scraping ends. Sending one item at a time would mean dozens of round trips per scroll; holding everything to the end would lose data when the tab closes.

### History: try the archive as a dry run first

To import old likes, the project reads X's official archive ZIP. Before writing anything, there is a dry run.

```bash
pnpm import:archive:dry
```

That runs `scripts/import-archive.ts` with `--detect-all --dry-run`, showing what media the ZIP holds and how many before importing. Archive formats change, so **counting first** avoids the "I imported it and almost nothing arrived" surprise.

### Rediscovery: fetch similar candidates, then rerank with MMR

Opening a Lightbox calls `GET /api/recommend?imageId=...`. On the server, a collection of 20,000 likes or fewer gets an exact KNN inside the user's own collection; above that, the query switches to the global HNSW index. Before returning, MMR (λ = 0.7) reranks the candidates so one artist's run of images does not fill the list.

That "similar but not the same" ordering is the handle for digging up buried likes. Find one image and you can walk to another in the same style.

## Results

Measurements recorded in the repository:

| Metric | Change | Source |
|---|---|---|
| Similar-image search (before/after HNSW) | 142 ms → 1.3 ms | `docs/operations/query-tuning-notes.md` |
| Recommendation function (local) | 78 ms | same |
| Already-seen rate on load-more | 57.9% → 42.1% | `docs/課題.md` (measured 2026-09-18) |
| Average age of the ordering | +16.7% | same |
| First gallery render query | ~1.1 s → 0.45–0.64 s | `docs/PROJECT_STATUS.md` |

The seen-rate improvement came from ranking on "old × not yet viewed". Performance checks across three functions at three collection sizes stayed within +9%, so changing the ordering did not make the gallery slower.

What changed in use is that **the act of finding moved from scrolling to browsing**. When you know what you want, filter by author. When you do not, follow similar images or the daily selection. Thousands of likes stopped being unread inventory.

## When not to use it

- **Fewer than a few dozen likes**: there are not enough candidates for similarity to help. Archive import can add volume, or the chronological view is simply enough.
- **You need full-text search**: search was removed on 2026-08-06 and is not offered today apart from the author filter.
- **You do not want an extension reading X traffic**: capture assumes either the browser extension or the mobile app. The archive ZIP alone works for history but gives up daily automatic capture.
- **You want to share with other people**: this is built as a personal gallery; viewing someone else's collection together is out of scope.
- **Shipping on iOS is cheap**: the app does not use `expo-updates`, so there is no OTA channel. Even a JavaScript-only change needs a store release, and a published version cannot take a new build, so `mobile/app.json`'s version and buildNumber go up every time.
- **You need guaranteed completeness**: passive capture depends on what the user actually scrolled. Active re-fetch through the API is still being validated in admin and is not offered to all users.

## Takeaways

- Treat the problem as "no path back", not "nothing saved"; that changes what you build.
- Push capture onto a path that avoids metered billing (passive plus archive) and accept that it is not exhaustive.
- Build retrieval from similarity and diversity rather than search.
- When a feature is not used, return its resources to the main path and rebuild it in another form later.

The same shape works for photo libraries, saved articles, and books you mean to reread. The important part is to **design the retrieval path before the collection mechanism**.

## Related posts

- [Rediscovering likes with similar images: Next.js, pgvector, DINOv2, and an MV3 extension](/en/post/20261115x-fav-gallery-tech/)
- [Turning X likes into an asset: image recommendations with a Chrome extension, pgvector, and DINOv2](/post/x-fav-gellery/) (Japanese)

---

**Building a tool for content you saved but never look at again?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1993863)
