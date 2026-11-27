---
title: "Less Time Searching the Cargo Area: A Load Plan That Does Not Cram the Van"
date: 2026-11-15T14:50:00+09:00
draft: false
tags: [logistics, last-mile delivery, Python, simulation, case study]
summary: "Work inside the cargo area takes about 18% of a delivery driver's time, and the cause is cramming the van full at the cost of delivery order. This post covers a load plan that stops at the volume the order can survive, and the simulation used to measure it."
---

## How the morning load decides the afternoon

A parcel driver's day starts by filling the van as full as possible. Carry more per trip and you need fewer trips, so the vehicle and the driver both look more efficient.

Filling the van, however, means breaking the delivery order. Boxes for later stops go near the door; boxes for the first stops get pushed to the back or buried at the bottom. At every stop the driver then moves a box out of the way, searches for the right one, and stacks it again.

Work inside the cargo area — searching and reorganising — accounts for about 18% of time away from the depot. The repository quotes this figure in `docs/research.md` §7 from a 2018 Yamato Transport ride-along study of roughly 4,500 observations. If out-of-depot work fills eight hours, more than an hour of it goes to moving boxes around.

**3d_packing** turns the decision not to fill the van into a plan. It enforces six rules: maximum payload, this-side-up, load bearing, support from below, unloadable in delivery order, and centre-of-gravity balance. The output is not only a 3D view but also A6 box labels and an A4 loading sheet.

## Why existing tools fall short

| Approach | What it does | Limitation |
|---|---|---|
| Loading by experience | Adapts to whatever is on the dock | Person-dependent, ignores delivery order, and cannot be verified |
| 3D CAD and load simulators | Show whether the boxes fit by dimension | Cannot combine delivery order, load bearing, and support ratio, and stop at geometry |
| Generic bin packing | Produces a tight, gap-free plan | Optimises the gaps, not the field rules or the unloading order |

The survey in `docs/worklog.md` found no Python OSS that handles all the constraints, and no commercial tool that prints a per-box label for the floor. So the engine was written from scratch, and the scope was extended to the output the crew actually uses.

## The design

Here is the before and after.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: cram it full</strong>
    <div class="diagram-box">Break the delivery order to fill the van</div>
    <div class="diagram-box">Later stops end up near the door</div>
    <div class="diagram-box">Every stop means digging a box out</div>
    <div class="diagram-box">Cargo work takes about 18% of the day</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: stop at what the order allows</strong>
    <div class="diagram-box">Load about 80% and run two trips</div>
    <div class="diagram-box">First stops sit nearest the rear door</div>
    <div class="diagram-box">Zero boxes have to be moved</div>
    <div class="diagram-box">Cargo work drops to 1%</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: Before and after the loading change</p>
</div>

Three decisions carry the design.

- **Make delivery order a hard constraint**: it is mandatory that no later-delivered box sits above an earlier one or between it and the rear door.
- **Do not optimise for fullness**: cap trip 1 at the volume where the order still holds, and carry the rest on trip 2.
- **Deliver something the crew can follow**: turn the plan into labels and a sheet with step, position, and which face goes up.

The trade-off is trip count. Loading less means a second trip, which means a return to the depot and a reload. The tool computes the break-even point: how long that return can take before the change stops paying off.

## Implementation notes

### 1. Make delivery order a hard constraint

The test is whether a later-delivered box sits above the box in question or between it and the rear door. `rehandles` in `src/packing/constraints.py` counts those, and `validate_load` reports them as `LIFO` violations.

```python
# src/packing/constraints.py (rehandles)
above = xy & (arr[:, g.Z0] >= b[g.Z1])
door_side = yz & (arr[:, g.X0] >= b[g.X1])
blockers = np.nonzero(later & (above | door_side))[0]
```

The last-mile scene sets `lifo=True` (`src/packing/presets.py`), which makes this condition mandatory. In the crammed plan, 47 of 80 boxes were flagged as boxed in. In the proposed plan, zero were.

### 2. Simulate both the full and the ordered load

The effect is measured by simulating a whole delivery day. Three loading strategies — crammed, delivery order, and delivery order plus absence robustness — run against the same random absence draws.

```bash
uv run packing efficiency --mode multi --seed 0 --days 60 --out out/eff_multi
```

`--mode multi` covers operations with two or more trips; `--mode single` covers a one-trip day. `--shares` changes the candidate volumes for trip 1 (default 100%, 90%, and 80% of a crammed load). The crammed plan is built by dropping `lifo` and setting the absence weight to zero.

```python
# src/packing/efficiency.py (strategy_scene)
if strategy == "cram":
    return replace(scene, lifo=False, absence_weight=0.0)
if strategy == "ordered":
    return replace(scene, lifo=True, absence_weight=0.0)
if strategy == "robust":
    return replace(scene, lifo=True)
```

The same parcels, with only the constraints changed, produce today's practice and the proposed practice side by side.

### 3. Translate the plan into the crew's language

A good plan is useless if the loader cannot reproduce it. `src/packing/instructions.py` emits, for each box, a zone (back, middle, front), a side (left, centre, right), a level, and which face goes up.

```python
# src/packing/instructions.py (_load_steps)
code=f"L{li}-S{step_no:03d}-{DEPTH_CODE[di]}-{SIDE_CODE[si]}-{lv}",
position_ja=f"{DEPTH_JA[di]}・{SIDE_JA[si]}・{level_ja(lv)}",
face_up_ja=FACE_UP_JA[face],
```

A position code such as `L1-S003-B-L-1` means vehicle 1, third box loaded, back, left, level 1. That code becomes the A6 label (with a QR code) and the A4 sheet, all generated from the same plan data as the 3D view.

## Results

Numbers from `docs/benchmark.md`, seeds 0 to 2, with a day simulated 40 times.

| Operation (seed) | Today (crammed full) | Best strategy | Time saved per day |
|---|---|---|---|
| Two or more trips (0) | 173.3 s/parcel | Delivery order + absence robustness, 144.3 s/parcel | 61 min |
| Two or more trips (1) | 173.2 s/parcel | Delivery order + absence robustness, 144.1 s/parcel | 62 min |
| Two or more trips (2) | 169.6 s/parcel | Delivery order + absence robustness at 74%, 163.2 s/parcel | 14 min |
| One trip (0) | 151.3 s/parcel | Crammed full, 151.3 s/parcel | 0 min |

With two or more trips, time per parcel falls from 173 to 144 seconds, about one hour a day. Cargo-area work drops from 17% to 1%. That is roughly 20 more parcels per driver per day, or an hour less overtime. All three seeds improve; seed 2 saves 14 minutes because the ordered load needs a third trip.

The fact that the crammed case lands at 17–19% cargo work, close to the measured 18%, is treated as a sanity check on the model. In the sensitivity analysis the conclusion holds in all five variants, and even the most conservative assumptions (15 seconds to take a box out and put it back, zero search time) leave 27 minutes saved per day.

## When not to use it

- **Operations that fit in one trip**: cramming is faster. Respecting the order forces a second trip, and the depot return costs more than the cargo work it saves. The break-even is 36 to 45 minutes; below that, the ordered load wins.
- **Redeliveries themselves**: failed attempts and repeat visits cost about 45 to 70 minutes a day, and no loading pattern changes that. Loading only affects the few minutes lost to carried-back boxes getting in the way (`docs/plan.md` §12).
- **Reliance on estimates**: the seconds for moving, searching, and putting a box on the passenger seat are estimates, not measurements. That is exactly why the claim is presented with a sensitivity analysis rather than a single number.
- **Validation on real data**: parcels are generated or loaded from CSV, and the demo has not been run on live operational data. Cargo dimensions and axle loads are representative demo values.

## Takeaways

- Optimising for fullness breaks the delivery order and increases cargo-area work.
- Capping the load at what the order allows, and moving the rest to a second trip, lowers time per parcel.
- The effect reverses when one trip is enough, so decide with trip count and depot-return time.
- A plan only becomes reproducible on the floor when it comes with labels and a step sheet.

The claim is not "carry more" but "do not carry too much". Problems that loading cannot solve, such as redeliveries, belong to a different mechanism — and drawing that line is part of what makes the demo usable in a proposal.

## Related posts

- [Loading 80 parcels into a kei van in seconds: extreme points and an independent validator](/en/post/202611153d-packing-tech/)

---

**Working on a loading plan or delivery simulation?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1117897)
