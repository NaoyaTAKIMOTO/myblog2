---
title: "When the Timeline Fills Up with Reposts and Copies: Designing a Filter That Only Changes What You See"
date: 2026-11-15T15:10:00+09:00
draft: false
tags: [chrome-extension, twitter, timeline, duplicate-detection, privacy, problem solving]
summary: "How to fix a timeline buried under reposts and re-uploaded images without deleting anything: why mute and keyword filters fall short, how to pick the original by timestamp, and how to keep a way back when the filter guesses wrong."
---

## A timeline buried under copies

Open X and the same picture shows up three or four times. Reposts are at least labelled, but once accounts start saving an image and posting it with new text, the timeline stops being worth reading.

The real problem is that you cannot tell which post is the original by looking. Timelines stream newest first, so the first version you see is often not the source. Only later, when the actual post appears, do you realise what you saw earlier was a copy.

**X Original Filter** takes the "change only what is displayed" approach. It is a Chrome extension that hides posts in the browser. It does not delete anything and it does not report anything.

## Why existing tools fall short

| Approach | What it gives you | Where it breaks |
|---|---|---|
| X mute and block | Hides an account entirely | Copy accounts keep appearing; one setting per account |
| Keyword filters | Removes posts by phrase | Image duplicates are invisible to them |
| "Not interested" on a post | Removes that one post | The next copy is a different post |
| Reverse image search API | Finds the origin across the web | Sends images to a third party, and costs money |

The goal was to get close to the fourth option, knowing the origin, without sending images anywhere. The README is explicit that a copy cannot be detected when the original is not in your timeline; finding the origin across the whole web is out of scope.

## The design

Three decisions carry it:

- **Decide in the browser**: the only host contacted is `pbs.twimg.com`, and no verdict is sent anywhere.
- **Pick the original by post time**: compare `time[datetime]`, not arrival order.
- **Hide, do not remove**: leave the DOM alone, hide with CSS, and keep a way back.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: put up with it</strong>
    <div class="diagram-box">The same image keeps coming back</div>
    <div class="diagram-box">No way to tell which is the original</div>
    <div class="diagram-box">Mute copy accounts one by one</div>
    <div class="diagram-box">The timeline fills up with copies</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: X Original Filter</strong>
    <div class="diagram-box">Reposts hidden as they arrive</div>
    <div class="diagram-box">Duplicates keep the earliest post</div>
    <div class="diagram-box">Original authors protected by a whitelist</div>
    <div class="diagram-box">One click restores a wrong guess</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: The timeline before and after</p>
</div>

The tradeoff was how much to automate. Full automation means a wrong guess becomes a post you cannot read. Adding a confirmation step leaves manual work behind. The compromise: hide by default, and provide two escape hatches, a collapse mode and a whitelist.

## Implementation notes

### 1. Put settings, counters, and hashes in different places

Settings go to `chrome.storage.sync`, the daily counters to `chrome.storage.local`, and image hashes to IndexedDB `xof`. Only settings need to follow you between devices; counters and hashes depend on what you browsed and stay on the machine.

```js
// src/lib.js (part of DEFAULTS)
hammingThreshold: 5,
minTextLength: 60,
whitelist: [],
selfHandle: ''
```

`hammingThreshold` ranges from 0 to 12 and `minTextLength` from 20 to 500, both editable on the options page. The defaults live in `DEFAULTS` in `src/lib.js` and match the controls in the options page opened from `options_ui` in `manifest.json`.

### 2. Apply threshold changes without a reload

The slider saves on `change`, and the content script picks the value up through `chrome.storage.onChanged`.

```js
// src/options.js
$('hammingThreshold').addEventListener('change', (event) =>
  save({ hammingThreshold: Number(event.target.value) })
);
```

Once saved, the content script calls `applySettings()` and the next scan uses the new value. No page reload. Raising the threshold too far increases false positives, so the README puts the practical range around 5.

### 3. Make a wrong guess one click away from coming back

Hidden cells carry `data-xof-hidden-kind`. In collapse mode, clicking the strip restores the post.

```js
// src/content.js (unhide)
function unhide(cell) {
  if (!cell || !cell.dataset || !cell.dataset.xofHiddenKind) return;
  cell.classList.remove('xof-hidden', 'xof-collapsed');
  const badge = cell.querySelector(':scope > .xof-badge');
  if (badge) badge.remove();
  delete cell.dataset.xofHiddenKind;
  delete cell.dataset.xofLabel;
}
```

If everything is fully hidden, turning the extension off runs `unhideAll` and brings the timeline back at once. Adding an author to the whitelist keeps their posts as the original and hides the copies instead. Leaving your own handle empty makes the extension detect it from the sidebar account button.

## Results

- Reposts are hidden as they arrive.
- Among duplicate images, only the earliest post by timestamp stays.
- A repost by the same handle is not treated as theft, so nothing happens.
- Hidden counts appear in the popup and on the badge, capped as `999+`.

The numbers worth stating are the defaults: Hamming distance 5, minimum text length 60 characters, and a cap of 6000 stored records. There is no record of user counts or reduction rates in the repository, so none are quoted here.

Verification is 27 unit tests plus an end-to-end run that loads the extension into a full Chromium via Playwright. It never connects to X; a local page imitating X's DOM checks three cases: a repost, a duplicate image, and a copy seen before the original.

## When not to use it

- **Original not in the timeline**: nothing can be detected. A reverse image search API would widen the net but was rejected on cost and privacy grounds.
- **Video, GIF, and images inside quotes**: out of scope. Only still images in `tweetPhoto` are examined.
- **Text with reordered words**: detection is exact-match, so it does not follow edits.
- **Cropped or captioned images**: dHash reads gradients of a downscaled image and is weak here.
- **X changing its DOM**: if `data-testid` values change, selectors need updating.

The extension also neither deletes nor reports posts. It changes what you see, so it cannot make a bad post disappear for anyone else.

## Takeaways

- Decide the original by timestamp; do not trust arrival order in a timeline.
- Automate the judgement, and let the person choose how to hide and how to undo.
- Keeping images inside the browser keeps both privacy and cost under control.

The position is not "remove it automatically" but "judge automatically, and hide in a way that can be undone".

## Related posts

- [Detecting duplicate images with dHash and Hamming distance in a Chrome extension](/en/post/20261115x-original-filter-tech/)

---

**Dealing with timeline noise or building a browser extension?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1117897)
