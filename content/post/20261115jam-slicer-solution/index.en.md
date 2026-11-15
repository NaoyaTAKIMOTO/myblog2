---
title: "Automating the Split of Stream Archives: Three Walls of Manual Work, Memory, and Speed"
date: 2026-11-15T10:10:00+09:00
draft: false
tags: [ffmpeg, video processing, Python, FastAPI, problem solving]
summary: "Splitting a long stream archive into individual songs runs into three walls: manual timestamps, huge memory use, and waiting. How JamSlicer removes each one, with the design and code behind it."
---

## Why splitting a recording hurts

Wanting each song as its own file should not require this much work.

1. Play the archive from the start and find each song's start and end by ear.
2. Write the timestamps down, then type them into an editor.
3. Wait for the export.
4. Repeat for every song.

Ten songs means ten rounds. One wrong timestamp means redoing that segment.

JamSlicer replaces the loop with three steps: upload, adjust the threshold, cut everything at once. This post is about the three walls the project hit and how each was removed.

## Where existing tools fall short

| Approach | What it gives you | Where it breaks |
|---|---|---|
| Manual editing | Any cut point you like | Time grows with the number of songs; timestamps are recorded twice |
| librosa / moviepy in Python | Automatic silence detection | Loads audio into arrays; a 1 GB video costs 5–10 GB of memory |
| Calling FFmpeg directly | Fast and memory-light | Rebuilding commands every time, with no way to check the cuts |

JamSlicer aimed at the speed of the third option with the reviewability of the first.

## The design

Here is the workflow before and after.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: manual</strong>
    <div class="diagram-box">Open the recording in a player</div>
    <div class="diagram-box">Find start and end by ear</div>
    <div class="diagram-box">Retype timestamps into an editor</div>
    <div class="diagram-box">Wait for export (repeat per song)</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: JamSlicer</strong>
    <div class="diagram-box">Upload the video</div>
    <div class="diagram-box">Silent gaps detected automatically</div>
    <div class="diagram-box">Confirm split points with a slider</div>
    <div class="diagram-box">Stream-copy every segment into a ZIP</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: The split workflow before and after</p>
</div>

Three decisions carry the design:

- **Analyze once**: the volume curve is computed at upload and reused afterwards.
- **Adjust in the browser**: changing the threshold never triggers a re-analysis.
- **Cut by copying**: no re-encode, so quality and runtime are preserved.

Putting the review step in the browser is what makes the automatic result editable on the spot. It stays manual by design, because silence length and loudness differ from video to video, and a wrong automatic cut is more annoying than a quick slider adjustment. The tool does the boring part and leaves the judgement to the person who knows the material.

## Implementation notes

### Analysis: capture the volume curve

`POST /analyze-volume` returns volume samples every 0.5 seconds plus a suggested threshold computed from the mean and standard deviation.

```bash
curl -X POST http://localhost:8000/analyze-volume \
  -F "file=@live.mp4"
```

### Adjustment: build segments on the client

`detectSilence` finds silent ranges from that volume data, and `calculateSegments` assembles the audio ranges. The minimum silence is 1.0 second and the sampling interval is 0.5 seconds.

```ts
// frontend/src/segmentCalculator.ts
const isSilent = point.volume < threshold;
```

A lower threshold yields longer segments, a higher one shorter. Being able to iterate without a network round trip is the core of the experience.

### Cutting: send only the confirmed ranges

Once the ranges look right, they are posted to `/cut-simple`.

```bash
curl -X POST http://localhost:8000/cut-simple \
  -F "file=@live.mp4" \
  -F 'segments=[{"start":0,"end":45.2,"duration":45.2}]'
```

The server stream-copies each range, zips them, and returns a download URL. Segments shorter than two seconds are dropped as noise.

### Cleanup and download

Cut segments land in a temporary directory, get zipped, and are served from `/download-segments/{zip_filename}`. The uploaded video's temp file is deleted at the end of the request, so nothing accumulates on disk.

```python
# backend/main.py (cut_simple)
output_dir = tempfile.mkdtemp()
...
"download_path": f"/download-segments/{os.path.basename(zip_path)}"
```

Because results are not persisted, trying a threshold, checking the cuts, and trying again stays cheap.

## Results

Numbers recorded in the README, compared with the earlier implementation.

| Metric | Previous (librosa/moviepy) | JamSlicer |
|---|---|---|
| Memory usage | 5–10 GB | 30–50 MB |
| Volume analysis speed | baseline | 2–5x faster |
| Splitting speed | baseline | 10–20x faster |

The per-song timestamp work disappears; what remains is review and adjustment. Cutting is a stream copy, so the wait is roughly file-copy time.

### What it costs to run

Analysis is the only CPU-heavy step: FFmpeg decodes the audio track once, and the rest is a few hundred kilobytes of JSON. Cutting is I/O-bound because it copies streams. That means the tool runs comfortably on a laptop or a small VPS without a GPU, and the machine stays responsive while a segment is being written.

## When not to use it

- **Short gaps**: if applause keeps the gap under one second, silence detection will miss it. Raising the threshold only blurs the boundary.
- **Continuous background music**: with sound between songs, silence detection has nothing to detect.
- **Frame-exact cues**: `-c copy` cuts on keyframes, so the result can be a few frames off. Exact cues need re-encoding.
- **Normalization**: the code has a YouTube-style loudness option (-14 LUFS), but the UI does not expose it yet.

The conclusion so far: this works well for material that is actually separated by silence. Material where boundaries are marked by changes in sound needs a different detector.

## Takeaways

- Remove the manual wall by automating with a review step, not by removing the human.
- Remove the memory wall by leaving decoding to FFmpeg.
- Remove the speed wall by not re-encoding.

None of the three needed a special library; each came from moving work to the right place.

## Related posts

- [How JamSlicer splits long videos with FFmpeg silencedetect](/en/post/20261115jam-slicer-tech/)
- [Splitting stream recordings automatically with FFmpeg silencedetect (in Japanese)](/post/jam-slicer/)

---

**Need help building video or automation tooling?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1993863)
