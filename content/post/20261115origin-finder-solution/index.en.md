---
title: "Folding the Search for a Repost's Origin into One Query"
date: 2026-11-15T14:30:00+09:00
draft: false
tags: [Python, reverse image search, OpenCV, automation, problem solving]
summary: "Tracing a reposted image back to its original post is a manual loop across several reverse image search engines and dozens of page dates. How Origin Finder collapses that loop, and what it still leaves to a human."
---

## The problem: several search tabs and a hundred page dates

Your photo shows up on an account you have never heard of, with no credit. You want to show that it is yours, so you need evidence. Or an image came your way and you want to know where it started.

So you open a reverse image search. The trouble is that one engine is not enough. Yandex, TinEye, Google, Bing, and for illustrations ascii2d or SauceNAO all return different candidates for the same image. The loop looks like this:

1. Feed the image into several engines.
2. Open each result list.
3. Open candidate pages one by one and read the publication date.
4. Compare the image by eye to see whether it is the same file or an edited copy.
5. Note the oldest one so far, then continue.

Candidates can number in the dozens or hundreds. At ten seconds each, a hundred of them takes over fifteen minutes. And the first result is rarely the origin: search results are ranked by relevance, not by date.

## Why existing tools fall short

| Approach | What it gives you | Where it breaks |
|---|---|---|
| One reverse image search at a time | A list of candidates | Every engine differs; comparing across them is manual |
| The engine's ranking | Relevance-ordered results | Not chronological; an old repost is not guaranteed to be near the top |
| The candidate page's publication date | A date for that page | That date belongs to the page, not necessarily to this image |
| Comparing images by eye | You notice crops and overlays | Time grows with the number of candidates |

The third row is the trap that actually bit. A page's publication date belongs to the page's main image. When a page shows a different photo in a related-images block, reading only the date picks up the wrong image's date. In practice that produced a false origin: a Tenor page from 2021 was reported as the original.

## The design

Here is the workflow before and after.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: manual</strong>
    <div class="diagram-box">Submit the same image to several engines</div>
    <div class="diagram-box">Open candidate pages one by one for dates</div>
    <div class="diagram-box">Judge same-or-not by eye</div>
    <div class="diagram-box">Work out the oldest candidate yourself</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: Origin Finder</strong>
    <div class="diagram-box">Pass an image, an image URL, or an X post URL once</div>
    <div class="diagram-box">Candidates from five engines are merged and judged</div>
    <div class="diagram-box">Dates carry their evidence: post ID, page, archive capture</div>
    <div class="diagram-box">The oldest candidate is presented as the origin</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: The origin search before and after</p>
</div>

Three decisions carry the design:

- **Let the engines enumerate.** Finding more candidates is their job; the app only owns the cross-engine comparison.
- **The machine decides, the person confirms.** Matching settles "is this the same image". Whether that candidate is a credible origin stays a human judgement.
- **Dates keep their evidence type.** Post IDs, page metadata, and archive captures are compared as distinct kinds of evidence, not flattened into one timestamp.

There are two trade-offs. The app does not aim to be fully automatic: it returns the oldest candidate, not the first post in the world. And the scope is deliberately narrow: only the first appearance of the same image, not other photos of the same person. Because it is built to handle NSFW images, Google's engines are not the primary path.

## Implementation notes

### Three input types

`uv run origin-finder` serves `http://127.0.0.1:8765`.

```bash
uv run origin-finder
curl -s -X POST http://127.0.0.1:8765/api/search -F "file=@image.jpg"
curl -s -X POST http://127.0.0.1:8765/api/search -F "url=https://x.com/<user>/status/<id>"
```

Given an X post URL, the app fetches the attached images through FxTwitter and adds the post itself as a candidate. Instagram and TikTok URLs are not supported; the image has to be saved and uploaded.

### Three stages for same-image matching

Running the expensive check on every candidate is not affordable. Thumbnails settle the easy copies first, thumbnail keypoints filter the rest, and only the top 40 get their full images refetched.

```python
# src/origin_finder/matching.py
INLIERS_SAME_MIN = 18
COVERAGE_MIN = 0.15
PHOTOMETRIC_MIN = 0.7
```

At least 18 inliers (keypoints that survive the geometric fit), coverage of at least 15 percent, and photometric agreement of at least 0.70 after alignment. All three must hold for a "same photo" verdict. The conditions exist to reject a different photo that merely shares the same shapes.

### Dates as evidence that something existed

```python
# src/origin_finder/judge.py (end of judge)
eligible = [c for c in cands if c.date and is_match(c) and c.date_source != OTHER_IMAGE]
eligible.sort(key=lambda c: (effective_date(c), DATE_RANK.get(c.date_source, 9)))
origin = eligible[0] if eligible else None
```

Date sources are X, TikTok, and Instagram post IDs, page metadata, TinEye crawl dates, and Wayback captures. When picking the origin, the app does not exclude weaker sources; it takes the oldest date, because every one of them is evidence that the image already existed at that point. A date known only to the day is compared as the end of that day.

## Results

Numbers recorded in `docs/plan.md`.

| Metric | Value |
|---|---|
| Time per search | 15–20 s (about a minute at worst when stages are cut off) |
| Deduplication, Eiffel Tower | 106 pages → 30 groups |
| Deduplication, sink post | 179 pages → 32 groups |
| Same-photo candidates with no date, Eiffel Tower | 51 → 40 |

The work changes shape: opening several result lists and working through them becomes one search and a review of the output. Each candidate arrives with a verdict (same photo, same scene, different image) and the evidence behind its date, so there is no question of where to start reading.

## When not to use it

- **Instagram and TikTok URLs.** Not supported, because there is no legitimate fetch path; save the image and upload it instead.
- **Bing.** It fails every time because PicImageSearch no longer matches its markup.
- **Engine strengths.** For real photographs, Yandex and TinEye do most of the work; ascii2d and SauceNAO are aimed at illustrations.
- **Low-texture selfies.** On skin and other areas with few keypoints, ORB matching may fail and the verdict drifts toward "different image". If accuracy proves insufficient, the plan is to evaluate SSCD.
- **Misses.** If the origin is not in any engine's results, the app cannot find it. The miss rate has not been measured yet.

What it does today is this: within what the search results contain, identify the oldest post with the evidence attached.

## Takeaways

- The manual cost sits in cross-engine comparison and date checking. Parallel search removes the first; dated evidence removes the second.
- Automate up to the verdict and leave the final call to a person.
- "Oldest equals origin" only holds once the kinds of date evidence are kept apart.

## Related posts

- [Combining several reverse image searches to estimate an origin — the staged reranking inside Origin Finder](/en/post/20261115origin-finder-tech/)

---

**Investigating reposted images, or building a tool that spans several services?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1117897)
