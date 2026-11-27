---
title: "No One to Critique Your Drawing, and No Wish to Upload It"
date: 2026-11-15T10:30:00+09:00
draft: false
tags: [Ollama, VLM, Go, local LLM, drawing, problem solving]
summary: "Drawing alone means no reviewer nearby, and uploading practice sketches to a cloud service feels wrong. How Dessan-sensei removed both walls with a local vision model on the LAN, using text-only history as context and level-aware prompting."
---

## Nobody to ask, right after you finish

When you teach yourself to draw, the hardest part is not knowing whether this drawing is better than last week's. A finished study takes real time and real concentration. If you attend a class, someone looks at your work once a week; at night, drawing alone at home, no teacher is sitting next to you.

There are substitutes. Post it on social media and collect reactions, pay a critique service, or call a cloud image-analysis API. All of them assume one thing: the drawing leaves your hands. Practice sketches and copies of other artists' work are exactly the things people hesitate to upload. If you are copying copyrighted material for study, the hesitation is stronger.

**Dessan-sensei** ("drawing teacher") was built to remove both problems at once: no reviewer nearby, and no wish to send the drawing out. You take a photo, upload it, and get six criteria scored out of ten, plus an overall comment and a suggestion for what to practise next. Inference and storage both stay inside the Mac on your desk.

## Why existing tools fall short

| Approach | What it gives you | Where it breaks |
|---|---|---|
| Art class or tutor | Precise critique and demonstration | Limited frequency and cost; not available when you draw alone at night |
| Asking on social media | A human looks at it | Public by default, delayed replies, inconsistent depth |
| Cloud VLM API | Instant answers, around the clock | The drawing is uploaded; usage billing; unusable offline |
| Judging it yourself | No extra cost | You cannot see your own blind spots, and nothing is recorded |

None of these is wrong. But lined up side by side, none of them is private, immediate, and recorded at the same time. That gap is what Dessan-sensei targets.

## The design

Here is the workflow before and after.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: drawing alone</strong>
    <div class="diagram-box">Finish a drawing, unable to name what went wrong</div>
    <div class="diagram-box">Class is once a week; feedback cannot wait that long</div>
    <div class="diagram-box">A critique service means uploading the drawing</div>
    <div class="diagram-box">Last week's advice lives only in memory</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: Dessan-sensei</strong>
    <div class="diagram-box">Photograph it on the iPad; six criteria scored out of ten</div>
    <div class="diagram-box">Overall comment, top improvement, next practice in one pass</div>
    <div class="diagram-box">Inference and storage stay on the Mac; nothing is uploaded</div>
    <div class="diagram-box">History and average scores accumulate; the trend is visible</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: The critique workflow before and after</p>
</div>

Three decisions carry the design:

- **Keep inference inside the LAN**: Ollama runs on the Mac, and the Go server calls `:11434` on the same machine.
- **Fix the shape of the output**: scores, overall comment, top improvement, next practice. Nothing else.
- **Pass context as text**: past critiques go into the prompt as date, average score, and improvement point — never as images.

The third is a bundle of tradeoffs. Sending the previous drawings along might help the model compare, but it adds tokens and waiting time. docs/adr/0002-learning-focused-design.md rejects an image-carrying chat history for "context explosion" and dismisses RAG as "over-engineering for personal use". Instead, only the recent scores and comments are mixed in as text.

The other tradeoff is the absence of authentication. The server listens on `0.0.0.0:8080` with no login and no user management. That is a deliberate bet on "one user, home LAN", and the price is that the app does not work from outside the house.

## Implementation notes

### 1. Context is the last five critiques, as text

Before calling the model, the server loads summaries of the five most recent critiques and injects them into the prompt.

```go
// internal/handler/critique_handler.go
history, _ := h.critiques.RecentSummaries(r.Context(), 5)

vlmReq := domain.CritiqueRequest{
    ImageBytes: imageBytes,
    Items:      criteriaSet.Items,
    Level:      level,
    History:    history,
}
```

The summaries come from a single SQL query: average the scores, take the previous improvement point.

```go
// internal/store/critique_store.go (RecentSummaries)
SELECT c.created_at, COALESCE(AVG(s.value), 0), COALESCE(c.improvement, '')
FROM critiques c
LEFT JOIN scores s ON s.critique_id = c.id
GROUP BY c.id
ORDER BY c.created_at DESC
LIMIT ?
```

Only the current drawing is sent as an image, so five history entries do not make the request heavier. The model still knows that shading was the problem last time. In the prompt, the history branch asks it to point out what changed since the previous session; the first-run branch asks it to find basic strengths and praise them (internal/ollama/prompt.go).

### 2. The level changes how much criticism you get

Five improvement points at once will discourage a beginner. The app splits users into three levels and changes both the count and the vocabulary.

```go
// internal/ollama/prompt.go
var levelDescriptions = map[string]string{
    "beginner": `初心者です。
- 良い点を最初にしっかり褒めてください
- 改善点は最も効果的な1点に絞ってください
- 専門用語は使わず、わかりやすい言葉で説明してください
- 励ましの言葉を添えてください`,
    // intermediate / advanced are defined the same way
}
```

The instruction text stays in Japanese because the app's UI and its output are Japanese. Beginners get one improvement point, intermediates one or two, advanced users two or three. The value chosen in the select box is posted as `level` (web/src/features/critique/CritiquePage.tsx), and the server falls back to `beginner` when it is missing.

### 3. Criteria are data, not code

Six criteria ship by default: proportion, shading and tone, composition, line quality, three-dimensionality, and overall finish (internal/store/seed.go). They are inserted at startup after migration, only if no criteria set exists yet.

```go
// internal/store/seed.go (excerpt)
{Key: "proportion", Label: "プロポーション", Description: "対象の形状・比率の正確さ"},
{Key: "shading", Label: "陰影・トーン", Description: "光源を意識した明暗表現、グラデーションの滑らかさ"},
{Key: "composition", Label: "構図", Description: "画面内の配置とバランス、余白の使い方"},
```

You can add or remove items in the UI, or call the API directly.

```bash
curl -s -X POST http://localhost:8080/api/criteria \
  -H 'Content-Type: application/json' \
  -d '{"name":"Gesture only","items":[{"key":"gesture","label":"Flow of the pose","description":"Does the movement read?"}]}'
```

Change the criteria and both the prompt items and the JSON skeleton change with them. Because the prompt is not hard-coded, you can narrow the session to "just look at hands today" without touching code.

## Results

- Each critique covers six criteria out of ten, plus an overall comment, the single most effective improvement, and a suggested next practice.
- History accumulates automatically and supports listing, detail view, and deletion. The five most recent entries feed the next critique.
- Uploads are capped at 20 MB and accept JPEG and PNG.
- Inference and storage stay on the Mac; nothing is sent outside, and there is no per-call billing.
- A PWA share target lets the iPad share sheet hand an image to the app (web/public/manifest.json and web/public/sw.js).

The part that matters in practice is that the waiting time ends with a decision. One low-scoring criterion is singled out, and a practice method for it is written next to it, so the next drawing has a purpose. The week until the next class stops being empty.

## When not to use it

- **Multiple users or remote access**: there is no authentication, and the app assumes access from inside the LAN. Exposing it would require auth and HTTPS.
- **HEIC photos as-is**: only JPEG and PNG are accepted (internal/handler/critique_handler.go). Depending on the iPad settings, the image must be converted when sharing.
- **Accuracy**: scores depend on the model. Reading them as a trend on the same criteria is far more useful than reading them as absolute values.
- **Marking up the drawing**: the README lists highlighting mistakes with rectangles and circles, but the current code has no such implementation. That part is still to come.
- **Distribution**: the binary from `make build` serves the API only; the UI still depends on the Vite dev server. The README also lists the bundled SPA as unsupported.

It fits "one person, at home, without sending the drawing anywhere, wanting an opinion right away". It does not fit shared use, remote access, or demands for rigorous scoring.

## Takeaways

- Remove the missing-reviewer wall with a local VLM and fixed criteria.
- Remove the privacy wall by keeping inference and storage on the same machine.
- Remove the continuity wall by feeding recent results back as text.

None of the three needed an extra service. Each came from deciding where the work should live. The same reasoning applies to critiquing a diary entry or checking the composition of a photograph.

## Related posts

- [A drawing critique app in Go, SQLite (WAL), React, and an Ollama VLM](/en/post/20261115dessan-sensei-tech/)
- [Building a drawing critique app with a local LLM: Ollama + Qwen3.5 + Go + React (in Japanese)](/post/dessan-sensei/)

---

**Building a private tool on top of a local LLM?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1117897)
