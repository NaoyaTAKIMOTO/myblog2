---
title: "Reading Aloud in My Own Voice: Voice-Clone TTS from 30 Seconds of Audio"
date: 2026-11-15T11:10:00+09:00
draft: false
tags: [TTS, voice cloning, FastAPI, Whisper, problem solving]
summary: "Ready-made TTS reads text well but never in your voice. Here is how a reference clip of about 30 seconds becomes a registered voice you can call over HTTP, using TADA and FastAPI."
---

## The voice is still not yours

When you want to automate narration for a video or a course, the first wall with ready-made TTS is rarely fluency. It is identity. The reading is natural, but it is not the voice the audience associates with you. Recording everything yourself has the opposite problem: every script edit means another session, plus editing.

The starting point for this project was a single requirement: **read any text aloud in my own voice**. If a reference clip of about 30 seconds is enough, then from that point on you should only need to send text and get audio back in the same timbre.

The result is a repository called `tts` that calls TADA 3B-ML behind FastAPI. This post is about how the act of "registering a voice" was broken down, and where it hurt.

## Why existing tools fall short

| Approach | What it gives you | Limitation |
|---|---|---|
| Hosted TTS services | Instant, high quality | You pick from their speakers; it is not your voice |
| Fine-tuning a model on your audio | High fidelity | Needs a dataset and GPU time; heavy for one person |
| Recording the whole script yourself | Exactly your voice | Re-record on every script change; manual editing |
| TADA with a reference clip | Voice identity from a short sample | A 30-second limit and environment setup |

The fourth option was chosen because it avoids training. Skipping fine-tuning turns voice setup into a few minutes of preprocessing, which is what makes script edits survivable.

## The design

Registration and generation were put into separate processes. Here is the work before and after.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: the voice cannot change</strong>
    <div class="diagram-box">Pick a speaker from a hosted TTS (not your voice)</div>
    <div class="diagram-box">Record the entire script yourself</div>
    <div class="diagram-box">Re-record after every edit</div>
    <div class="diagram-box">Cut and paste in an editor</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: register once, reuse</strong>
    <div class="diagram-box">Prepare about 30 seconds of reference audio</div>
    <div class="diagram-box">Register once from the CLI (transcript + encode)</div>
    <div class="diagram-box">POST text, receive a WAV file</div>
    <div class="diagram-box">No re-registration when the script changes</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: Narration work before and after</p>
</div>

There are three design points.

- **Register the voice once**: build `prompt.pt` from the reference audio and store it under `voices/`.
- **Keep generation stateless**: the server receives only a `voice_id` and text.
- **Never co-locate the heavy models**: Whisper and the encoder run in the CLI, one after another, and are freed.

Registration lives in a CLI so that a model used only there never sits in the server. The server holds TADA 3B-ML alone, at about 6GB. Adding Whisper large (about 3GB) and the encoder (about 1GB) leaves no headroom on a Mac.

The trade-off is one manual command during registration. There is no web admin screen for adding voices. In exchange, the server loads its model once at startup and never swaps models per request, so reading latency has a fixed, explainable source instead of depending on what else is in memory.

## Implementation notes

### 1. Fit the reference audio into 30 seconds

The TADA encoder caps out at a sequence length of 8192, so audio longer than 30 seconds cannot be passed directly. Long material is cut with FFmpeg `silencedetect`.

```bash
uv run python tools/split_audio.py \
  --audio path/to/long_audio.mp3 \
  --output-dir segments/speaker_name \
  --min-duration 5.0 --max-duration 30.0 \
  --silence-thresh -30dB --min-silence 0.5
```

Because cuts land at the midpoint of each silence, phrase tails are less likely to be truncated. Output is 24kHz mono, and `segments.json` records the duration of each piece. Picking one clean segment from the list is the actual manual step.

### 2. Register with a transcript

Registration is one command in `tools/register_voice.py`.

```bash
uv run python tools/register_voice.py \
  --name speaker_name \
  --audio segments/speaker_name/segment_003.wav \
  --transcript "the words spoken in the reference clip"
```

Omitting `--transcript` makes Whisper large transcribe in Japanese. TADA's own ASR is English-only, though, so a Japanese reference clip always needs a transcript. When Whisper's guess differs from what was actually said, supplying `--transcript` explicitly is the safer path.

The command writes `audio.wav`, `metadata.json`, and `prompt.pt` into `voices/speaker_name/`. `prompt.pt` holds the representation the model consumes, with tensors kept on CPU.

### 3. Send text, receive a WAV

Once the server is running, everything is HTTP.

```bash
PYTHONPATH=server uv run python server/run.py

curl -X POST http://localhost:8100/tts \
  -H "Content-Type: application/json" \
  -d '{"voice_id":"speaker_name","text":"今日はとても良い天気ですね。","speed":1.0}' \
  --output output.wav
```

The response is a 24kHz, 16-bit, mono WAV. An unknown `voice_id` returns 404, and empty text returns 422. `speed` is optional and maps to `speed_up_factor` on `InferenceOptions`.

Inference is serialized by an `asyncio.Lock`. Concurrent requests queue up. That is a deliberate concession so that MPS never sees competing inference.

## Results

Registered voices are listable with `GET /voices`, and specifying `voice_id` is all it takes to get the same timbre back.

| Item | Value |
|---|---|
| Reference length | 5-30 seconds (recommended) |
| Output | 24kHz / 16-bit / mono |
| Server memory | about 6GB (TADA 3B-ML only) |
| Tests | 20 (API 8 / service 5 / store 7) |

In terms of work, "record again whenever the script changes" becomes "edit the text and POST it." How closely the voice matches depends on the reference clip and the recording conditions, so this is something you judge by listening rather than measure.

A registered voice stays under `voices/` and can be reused for any text. The more scripts you produce in the same voice, the more the registration cost amortizes.

## When not to use it

- **Reference audio over 30 seconds**: the encoder limit blocks it. Split the material and choose one representative segment.
- **Emotion or acting direction**: there is no control beyond text and `speed`. Instructions like "in an angry tone" are not supported.
- **Languages other than Japanese**: registration is fixed at `language="ja"`. Multi-language switching is not implemented.
- **Concurrent requests**: the inference lock serializes them. A multi-user service needs a queue or additional workers.
- **Consent**: only register reference audio you have permission to use. This tool assumes you are not enrolling someone else's voice without their agreement.

It fits "one person, their own voice, a script that changes often." If expressive delivery or many speakers at once is the core requirement, a different design is needed.

## Takeaways

- Treat voice registration as one-time preprocessing; it is what makes script edits cheap.
- Keep the reference clip under 30 seconds, and cut long material at silences.
- Load a model only while it is in use; not co-locating them is the memory strategy.

A voice clone without training replaces the data problem with a short-reference problem. What decides the outcome is preprocessing and the shape of the runtime, not the model call itself.

## Related posts

- [A Japanese voice-clone TTS pipeline with TADA, FastAPI, Whisper, and FFmpeg](/en/post/20261115tts-tech/)
- [Learning a voice for text-to-speech: a Japanese voice-clone TTS with TADA (in Japanese)](/post/tts/)
- [Fixing inconsistent loudness across audio files with FFmpeg normalization](/en/post/20250705audio-volume-normalization-solution/)

---

**Working on speech synthesis or narration automation?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1117897)
