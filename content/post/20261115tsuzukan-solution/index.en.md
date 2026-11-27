---
title: "Preventing Missed Sequels by Design: Stop Relying on Remembering at the Bookstore"
date: 2026-11-15T09:10:00+09:00
draft: false
tags: [Go, React, PostgreSQL, Firebase, book metadata, problem solving]
summary: "Missing the next volume is not a memory problem, it is a problem of where the state lives. How tsuzukan records owned volumes by ISBN and reports what the series is missing, including the cases a machine cannot decide."
---

## Noticing the sequel exists, too late

The miss usually happens in a bookstore. You see a new volume on the display table and realise the previous one is at home and you never bought the one after it. Or an Amazon recommendation reminds you, weeks later. Remembering was luck, not a system.

The hard part is that a missed sequel reduces to state: which work, and up to which volume do I own. You remember the title. You do not remember the latest volume number. Ten series means holding ten pieces of state in your head.

tsuzukan exists to move that state somewhere else. Scan the barcode on the back of a book, or import an Amazon or Rakuten purchase-history CSV; the app resolves the ISBN, works out the series and volume number, and records it. Run the release check and unowned volumes appear in a list, with Amazon and Rakuten links to buy them.

This post is about what was actually difficult and how the design addresses it.

## Why existing tools fall short

| Approach | What it gives you | Where it breaks |
|---|---|---|
| Publisher or store newsletters | Announce new releases | Scoped to an author or imprint; matching against what you own is manual |
| Amazon wish lists | A place to park products | You must remove what you bought; sequels are not added automatically |
| A spreadsheet | Any schema you want | Volume parsing, covers, and purchase links are all yours to fill in |
| Calendar reminders | Date-based notification | You research the release date and retype it; a slipped date breaks it |

What they share is the assumption that a person holds the state. Each one requires you to remember to update the record, and a person who forgets to buy the book is not a reliable updater.

## The design

The scope was cut to three things.

1. **Register only what you own.** Do not pre-register upcoming volumes; register the volumes on the shelf.
2. **Let the machine parse series and volume.** Extract `(1)`, `第1巻`, `Vol.1` and friends from the title.
3. **Query releases per series.** Search by author and series name, then keep only the volumes you do not own.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: manual</strong>
    <div class="diagram-box">Check shops and sites now and then for new volumes</div>
    <div class="diagram-box">Try to recall and count the volumes at home</div>
    <div class="diagram-box">Search the title and check it is the right volume</div>
    <div class="diagram-box">Notice the miss afterwards</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: tsuzukan</strong>
    <div class="diagram-box">Scan a barcode, or import a purchase-history CSV</div>
    <div class="diagram-box">Series and volume parsed automatically</div>
    <div class="diagram-box">The release check lists only unowned volumes</div>
    <div class="diagram-box">Buy through the Amazon or Rakuten link</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: Tracking sequels before and after</p>
</div>

Three trade-offs shaped it.

- **Not fully automatic**: the release check is something the user runs. Making it a scheduled job would let API failures and rate limits accumulate silently.
- **Shared records, personal state**: bibliographic data (`books`, `series`) is shared across users; ownership, settings, and check timestamps live in per-user tables. The same ISBN is never resolved twice for no reason.
- **Ask the user when the machine cannot decide**: some works share no title between volumes. No external source can settle that. Manual mode lets the user link the volumes.

The third point is what makes the design work, and it is worth explaining.

## Implementation notes

### Registration: everything starts from an ISBN

Registering means posting an ISBN to `POST /api/v1/books`. Barcode scanning and CSV import both reduce to this.

```bash
curl -X POST http://localhost:8080/api/v1/books \
  -H "Content-Type: application/json" \
  -d '{"isbn": "9784088820774"}'
```

The server asks openBD for the record and falls back to NDL Search, then Rakuten Books. One ISBN means one row in `books`, shared as a catalogue.

Purchase-history import handles Amazon's `Retail.OrderHistory.3.csv` (physical goods) and `Digital Items.csv` (Kindle and similar). Each row is searched for an ISBN from its ASIN or title, so not every product ends up registered — a limitation the README states rather than hides.

### Parsing: pull the series and volume out of the title

`ExtractSeriesInfo` in `internal/transform/text.go` normalises the title first, then looks for a volume number with regular expressions.

```go
// internal/transform/text.go (excerpt from ExtractSeriesInfo)
candidate := stripTrailingEditionLabel(stripTrailingLabels(StripWaveDashSubtitle(title)))

for _, pattern := range reVolumePatterns {
	matches := pattern.re.FindStringSubmatch(candidate)
	if len(matches) < 3 {
		continue
	}
	volume, err := strconv.Atoi(toASCIIDigits(matches[2]))
	if err != nil || volume <= 0 {
		continue
	}
	if !pattern.marked && volume > maxPlausibleVolume {
		continue
	}
	return trimSeriesNameTrailingPunctuation(matches[1]), &volume
}
```

Stripping the publisher label and tagline *before* matching is what makes the order matter. Skip it and the parser picks up numbers from a subtitle, or takes the whole marketing title as the series name.

### Tracking: for some series, do not search at all

The release check searches per series and returns whatever is left after removing owned ISBNs and volume numbers. That fails for works whose volumes share no title. With 綾辻行人's 館シリーズ or 森博嗣's S&M series, a title search finds nothing and an author search drags in the author's other series.

External data cannot decide it. openBD and NDL put the imprint in their series field; of 100 sampled books, 0 carried the work's name. So `detection_mode = 'manual'` lets the linked volumes *be* the definition, and the check reports every linked volume the user does not own, with no external call.

```go
// internal/service/release.go (excerpt from checkSingleSeriesNew)
if series.DetectionMode == model.DetectionModeManual {
	return s.checkManualSeries(userID, series)
}
```

Placing that branch before the cache check is deliberate. The cache records when Rakuten was last asked; a series switched to manual may still carry a recent timestamp from when it matched by title, which would skip a check that costs nothing.

### Buying: build the links from the ISBN

Every release card carries Amazon and Rakuten links. Amazon is a product page (`/dp/<ASIN>`), with ISBN-13 converted to ISBN-10 to form the ASIN. Rakuten has no product ID in this flow, so it is a search URL. Neither calls an API, so rendering the list costs no external requests.

For books whose Amazon product page has disappeared, the link is suppressed rather than shown broken (`books.amazon_available`, migration `000046`).

## Results

What remains is registration and an occasional check. Counting volumes by hand has been replaced by series parsing.

The numbers the repository actually records:

| Item | Value | Source |
|---|---|---|
| NDL Search coverage | 97% of a 100-book sample | comment in `cmd/server/main.go` |
| Already-owned volumes returned when searched by series name | 91% | same |
| Release-check cache | 24 hours by default | `config/config.go` |
| 959 releases collapsed to latest-per-series | 75 cards | `docs/new-release-covers.md` |

The release list used to be one card per release, so three volumes of one series sat side by side. It now shows one card per series with the latest volume, and the hidden ones are reachable through an "N more" link to the series detail page.

## When not to use it

- **Books without volume numbers**: art books and standalone novels have no sequel to track. Failed series detection leaves them as unassigned books to tidy by hand. The README records a point where 6 books had no series.
- **Paper and digital together**: owning the same volume in both formats can double the record. Edition-level tracking exists, but part of this is handled by how you use it.
- **Rakuten's IP allowlist**: the Rakuten application only permits the VPS outbound IP, so local development gets 403 `CLIENT_IP_NOT_ALLOWED` and falls back to NDL — without covers.
- **NDL concurrency**: NDL caps simultaneous access and answers 429. The client allows at most one request in flight.
- **Release-day notifications**: the current design asks "has a new volume appeared", not "is one coming out next month". Future release dates are not modelled as a notification.

The conclusion so far: this works well for works whose owned volumes are unambiguous. Books with no notion of a volume, or works that rename themselves every time, still need a human.

## Takeaways

- A missed sequel is a question of where the state lives, not of memory. Let the person do one thing: register what they own.
- Automate what can be decided; let a person decide the rest. Manual mode is what brings title-changing series into the same screen.
- Share the records, personalise the state. Not re-resolving an ISBN is what keeps external calls down.
- If something cannot be searched, do not search it. Having a path that makes no external call removes a failure mode, not just latency.

## Related posts

- [How tsuzukan tracks manga sequels: Go, React 19, and three bibliographic APIs](/en/post/20261115tsuzukan-tech/)
- [Never miss the next volume again: a Go + React sequel tracker (in Japanese)](/post/tsuzukan/)

---

**Need help with a book-management tool or an external API integration?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1117897)
