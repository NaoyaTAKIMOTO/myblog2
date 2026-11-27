---
title: "Turning a Drawing-Only Part Back into Editable 3D: How image2CAD Keeps Dimensions and History"
date: 2026-11-15T14:10:00+09:00
draft: false
tags: [FreeCAD, CAD, drawings, automation, engineering]
summary: "When the CAD file is gone and only a drawing survives, modelling the shape by hand is not enough: the first dimension edit breaks it. How image2CAD treats drawing dimensions as the source of truth, tests editability mechanically, and uses three independent checks to avoid false accepts."
---

## The drawing exists. The model does not.

A familiar situation with older parts: the paper drawing and the PDF survive, with dimensions and material notes, but the CAD data is gone. The hard part is not reading the shape. It is that **without a 3D model you cannot check interference, carry a design change through, or plan CAM**. Remodelling by hand produces a shape, but it is a shape that looks right: change the plate thickness by 1 mm and the hole positions drift.

image2CAD automates that re-reading. This post looks at what has to hold for a model to count as "editable", and at the design and results that follow from it.

## Why existing tools fall short

| Approach | What it gives you | Where it stops |
|---|---|---|
| Remodel by hand | Design intent included | Slow, and transcription errors remain |
| Trace into 2D CAD | Lines and dimensions as data | Still 2D; extrusion is separate work |
| Extrude the outline into 3D | A shape in minutes | Holes get filled in, dimensions are not in the history, and editing breaks it |
| image2CAD | A PartDesign history built from the drawing dimensions | Prismatic parts with holes; unsupported shapes listed below |

The third row is the "looks right, cannot be edited" model. What we wanted was not the appearance but a history that survives a dimension change.

## The design

Here is the work before and after.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: remodelling by hand</strong>
    <div class="diagram-box">Read the drawing, note the dimensions</div>
    <div class="diagram-box">Draw sketches and extrude</div>
    <div class="diagram-box">Add holes and pockets one by one</div>
    <div class="diagram-box">Change a number, the shape breaks, start over</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: image2CAD</strong>
    <div class="diagram-box">Read the drawing, extract dimensions</div>
    <div class="diagram-box">Check projection consistency</div>
    <div class="diagram-box">Build a feature plan (IR) with dimensions as expressions</div>
    <div class="diagram-box">Build in FreeCAD, keep only what passes the checks</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: Remodelling work, before and after</p>
</div>

Three decisions carry the design.

- **Dimensions are the source of truth.** Coordinates are assembled from the dimension values printed on the drawing and carried as expressions. Values that no dimension backs are recorded separately and flagged as outside the guarantee.
- **History is checked mechanically.** One Body, no booleans, every sketch fully constrained, a `Params` sheet, and every parameter must survive a 5% change and actually move the geometry.
- **Verification runs in three passes.** Reprojection against the drawing, a DXF round trip, and drawing the read back over the input. Three independent views, not one.

Nothing is auto-corrected. When crosscheck reports an error the run stops and returns the discrepancy as a report, because that is the stage where a human should judge.

## Implementation notes

### 1. Turn dimensions into expressions

Coordinates follow the network of dimensions and become linear expressions. `Lin` in `src/image2cad/infer/params.py` holds such an expression and `render()` writes it into the IR.

```python
# src/image2cad/infer/params.py (Lin.render)
for k, c in sorted(self.terms.items()):
    if abs(c - 1) < 1e-12:
        s = k
    elif abs(c - 0.5) < 1e-12:
        s = f"{k}/2"
    else:
        s = f"{round(c, 6)}*{k}"
    parts.append(s)
expr = " + ".join(parts).replace("+ -", "- ")
```

That expression lands in the IR as something like `dia_2/2 - width/2` and becomes `Params.dia_2/2 - Params.width/2` in FreeCAD. Change a cell in `Params` and the hole positions and the outline follow. Values the dimensions do not determine are recorded under `measured`, and `fully_dimensioned` becomes false: the ±0.01 mm guarantee covers only values backed by a dimension.

### 2. Make "editable" a test

`src/image2cad/validate/freecad_validate.py` changes every parameter by 5%, recomputes, and checks that the model still solves and that vertex coordinates actually move. A parameter wired to nothing fails here.

That is how editability becomes a pass/fail result instead of a feeling. A sketch with missing constraints, or a number no expression reaches, looks fine at build time and only shows up when something moves it.

### 3. Report failures with a stage

A drawing that cannot be read comes back as a report with the stage that failed, not as an exception.

```python
# src/image2cad/pipeline.py (drawing_to_model)
if not cc["ok"]:
    report["ok"] = False
    report["stage"] = "crosscheck"
    _dump(out / "report.json", report)
    return report
```

`stage` is one of `crosscheck`, `infer`, `build`, `validate`, `verify` or `roundtrip`, which separates a drawing problem from a reading problem from an inference problem. The local GUI (`uv run python -m image2cad.gui`, 127.0.0.1:8765) also only lets you download a model that passed every check.

## Results

Numbers as recorded in the repository.

| Target | Result |
|---|---|
| 20 TechDraw drawings (independent source) | pipeline 20/20, validate 20/20, dimensions 170/170 |
| 200 drawings with randomised styles | 1700/1700 dimensions |
| Round trip (10 parts × 2 styles) | every dimension and angle matched |
| Synthetic scan L1 (300 dpi) | 10/10 parts reached a model |

The 20 TechDraw drawings were 0/20 with exceptions before the fixes, and 20/20 after them.

The checks also catch their own kind of failure. A model whose parameters are shifted by 0.02 mm fails the round trip in every case, and across 16 complex-shape cases there were **no false accepts** (11 matched, 2 rejected by the round trip, 2 hit the 90-second timeout, 1 raised on a missing view).

In practice, the work moves from copying numbers off a drawing to reading the extraction result and the verification report and deciding. It is not fully automatic.

## When not to use it

- **Fillets, chamfers, revolves, sections, blind holes, recesses from the far side**: unsupported. Shapes that cannot be inferred are raised as `Unsupported` and the next candidate direction is tried.
- **C, t, SR, Sφ, M and angle notes**: read, but not applied to the model; surfaced as `unused_notation` warnings.
- **Parameter names**: mechanical, such as `x_pos_1`. Naming that follows design intent (hole pitch, slot width) is not done, and a symmetric hole pattern cannot yet be expressed as a single pitch.
- **Coverage of external sources**: one TechDraw template (A3) has been verified. Arrowheads that are not triangles (open arrows, dots, slashes) are not handled.
- **Photos**: perspective correction is not implemented. Scans pass 150 of 160 across seeds, not all of them.
- **Similar-drawing search (milestone M6)**: not started.

The honest summary: strong on prismatic parts with holes when all three views are present, and increasingly dependent on human review as a drawing moves away from that.

## Takeaways

- Define "editable" as dimensions living in expressions, then put that definition into a test.
- Judge the output by whether it matches the drawing, using three independent views, not by whether a model was produced.
- Discrepancies that cannot be resolved are returned with the stage that failed, never silently fixed.

## Related posts

- [From 2D drawings to editable FreeCAD models: the image2CAD pipeline](/en/post/20261115image2cad-tech/)

---

**Working on drawing digitisation or CAD automation?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1117897)
