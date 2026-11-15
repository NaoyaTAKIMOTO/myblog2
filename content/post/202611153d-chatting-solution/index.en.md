---
title: "Turning One Image into a Talking 3D Character: Making the Build Repeatable"
date: 2026-11-15T13:50:00+09:00
draft: false
tags: [VRM, VRoid, 3D, MCP, reproducibility, problem solving]
summary: "Full mesh generation gives a different character on every run, and hand editing leaves no record. How driving VRoid Studio through an MCP turned character work into a repeatable cycle of change, export, compare, and accept."
---

## Why "make it good again" is so hard

Put in one reference image, get a 3D character, and start talking to it. Generation models will give you a shape. But the GLB they return has no expression parts, so the app has to overlay eye and mouth textures on top. If something looks wrong, you change the seed and generate again — and now the face and hair are a different character, so the two runs cannot be compared at all.

Modelling by hand does let you fix things one at a time. It also takes a long time per character, and when you start the next one, none of the previous judgement is written down anywhere.

What this project needed was not **one good character** but **a process that can be pushed toward a reference again and again**. This post is about how the production pipeline was rebuilt for that. The app architecture itself is in [the technical post](/en/post/202611153d-chatting-tech/).

## Why existing tools fall short

| Approach | What it gives you | Where it breaks |
|---|---|---|
| Full generation (Meshy / Tripo / StdGEN) | A mesh from an image | No expression parts, and a different shape every run. StdGEN went from about 7 hours to 1 h 52 min for all stages, but a comparison at the same pose gave contour IoU 0.61 and face colour difference 34.0 — not usable for conversation |
| Driving VRoid Studio by hand | A VRM with expressions, bones, and springs | The work lives in the screen; it cannot be re-run, and nothing is recorded |
| Existing VRoid MCP servers | Many tools through the internal API | Pinned to Windows and VRoid 2.14.0; they do not run on this Mac |

A VRM from VRoid Studio already has humanoid bones, five mouth vowels, blinking, and SpringBone. As a base, that is the closest thing available. The open question was how to record the edits and run them again.

## The design

The work was split into three stages — make the parts, assemble them, finish them — and every operation was written down as a command.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: generate and hand-edit</strong>
    <div class="diagram-box">Feed the image to a generator (different result each time)</div>
    <div class="diagram-box">Overlay eyes and mouth in the app</div>
    <div class="diagram-box">Nudge things by hand in the UI</div>
    <div class="diagram-box">No record of what changed; cannot reproduce it tomorrow</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: a process with a record</strong>
    <div class="diagram-box">Write the change as a "label=value" command</div>
    <div class="diagram-box">One command runs through VRM export</div>
    <div class="diagram-box">An in-app render is compared with the previous version automatically</div>
    <div class="diagram-box">A human only picks save or undo</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: One refinement cycle, before and after</p>
</div>

Four decisions carry the design.

- **No internal API**: VRoid Studio is driven through its screen. Nothing to inject, and it works today with no official API.
- **Operations are written as "label=value"**: a change is a string such as `目尻の高さ=0.15`.
- **The cycle is fixed**: change → VRM export → in-app render → compare → accept.
- **A human keeps the verdict**: numbers cannot decide whether it looks like the reference, so the tool does not decide.

The trade-off is that screen-driven work breaks when VRoid changes its layout or wording. That failure mode is at least legible, which is better than depending on an internal API that breaks on every release.

## Implementation notes

### 1. One cycle, one command

`tools/vroid-macos-mcp/scripts/refine_cycle.py` runs everything from the change to the comparison image.

```sh
cd tools/vroid-macos-mcp

UV_CACHE_DIR=/tmp/uv-cache uv run python scripts/refine_cycle.py \
    --label eye-corner --section 顔 --set '目尻の高さ=0.15'
```

The script widens the window, applies the parameters, exports the VRM, runs `frontend/e2e/verify-vrm.mjs` (1440×860, 11 checks), crops the face, and builds a side-by-side comparison with the previous version. **It never saves.** After looking at the image, a person runs `vroid-macos-mcp save` or `undo`.

### 2. Version numbers come from the files

So that the VRM and its comparison image stay in step, the next number is derived from what is already on disk.

```python
# tools/vroid-macos-mcp/scripts/refine_cycle.py
def next_version(stem: str) -> tuple[int, Path]:
    versions = [
        int(match.group(1))
        for item in DATA.glob(f"{stem}-v*.vrm")
        if (match := re.search(r"-v(\d+)\.vrm$", item.name))
    ]
    number = max(versions) + 1 if versions else 1
    return number, DATA / f"{stem}-v{number:03d}.vrm"
```

`nikke-refinement-d-vNNN.vrm` and `compare-vNNN.png` share a number, so the ledger needs one line per version: what changed, what was observed, accepted or not. The original `.vroid` is never overwritten.

### 3. Keep screen flakiness in one place

Driving a UI means failures like a row that is off-screen or a value that did not take. `apply_settings` scrolls to the row and retries once.

```python
# tools/vroid-macos-mcp/scripts/refine_cycle.py (apply_settings)
try:
    result = macos.set_color(label, value) if is_color else macos.set_param(label, value)
except macos.VroidError:
    # The row may be below the fold: scroll the panel to it, then retry once.
    if not macos.scroll_to(label).get("visible"):
        raise
    result = macos.set_color(label, value) if is_color else macos.set_param(label, value)
```

Because everything that depends on UI state sits here, callers only deal with a label and a value.

## Results

The VRoid MCP grew from 20 tools in the prototype to 33. State check → open project → section and category → presets → numbers, colours, sliders → verify → save / save as → VRM export now closes inside the MCP alone.

Three things are left for a person:

- write the change as one command
- look at the comparison image
- choose `save` or `undo`

Colours are given in hex, and rows whose number field is read-only are set by dragging the slider. Saving clicks ☰ → Save and waits for the `*` in the title to disappear, because `cmd+s` does not always work.

Similarity is **not passing yet**. Of a 25-item evaluation table, 16 items are partially scored, and of the 11 required items, 6 of the 7 scored ones are below 3. Passing behaviour (VRM import, mouth, blink, springs, motion construction) and passing likeness are recorded as separate results.

## When not to use it

- **Shapes with no preset**: hats and waist belts have no VRoid template. Five hat types were tried, none was the right shape, and placement through the MCP stayed unstable — those go to Blender.
- **Texture work**: tie stripes and skirt colour splits are 2D editor operations, outside the MCP's reach.
- **Preset selection**: hair and outfit cards have no readable names, so they are chosen by looking at thumbnails; grid calibration is still needed.
- **Version drift**: because this is not an internal API, a VRoid update or UI language change means adjusting coordinates and vocabulary.
- **No full automation**: there is no feature that takes an image inside the app and runs the whole pipeline. Blender correction has not started.

## Takeaways

- Moving from "generate and hope" to "record and steer" makes a result reproducible
- Turning operations into commands leaves a person only the accept/reject decision
- Measure working and looking alike separately; one passing does not stand in for the other

The same shape works for any app that only offers a screen.

## Related posts

- [Building a talking 3D character app with FastAPI, TypeScript, VRM and passkeys](/en/post/202611153d-chatting-tech/)

---

**Working on VRM characters, or on automation that has to drive another app?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1993863)
