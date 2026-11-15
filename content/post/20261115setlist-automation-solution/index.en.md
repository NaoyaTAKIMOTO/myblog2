---
title: "Three Constraints in Setlist Planning, and How Each One Was Removed"
date: 2026-11-15T11:30:00+09:00
draft: false
tags: [OR-Tools, setlist, optimization, Google Sheets, problem solving]
summary: "Planning a setlist where members switch instruments runs into three constraints: transition cost, stage time, and where the break goes. How the manual limits were framed, and how OR-Tools TSP plus a break inserter removed them."
---

## The night before rehearsal, staring at a spreadsheet

Deciding a band's setlist is not a single decision.

In a band where members switch instruments per song, swapping two songs changes the number of transitions. Put two songs with different drummers back to back and the kit gets rebuilt in between. Group the same drummer together and transitions drop, but the energy curve suffers.

Then there is stage time. Even with a rule like "break after 40 minutes," which song the break follows is a guess. Every reorder means recalculating total time, moving the break, and reordering again. That loop used to eat a good half hour before rehearsal.

**SetlistAutomation** replaces the loop with "fill in the spreadsheet, run the script, adjust the draft." This post is about the three constraints that come with setlist planning and how each was removed.

## Why existing tools fall short

| Approach | What it gives you | Where it breaks |
|---|---|---|
| Ordering by eye | Energy flow and song pairing | Only adjacent pairs are considered, so total transition cost is not minimal; total time is recalculated by hand on every reorder |
| Spreadsheet sort and filter | Groups songs that share a player | Cannot represent weights (drums vs. bass), and the break is still manual |
| Brute force over permutations | Guarantees the minimum-cost order | Grows factorially, so it does not finish at realistic set sizes |

The real cost of manual planning is not time. It is reproducibility: why this order was chosen is never recorded, so the whole argument happens again next time.

## The design

Here is the planning workflow before and after.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: manual</strong>
    <div class="diagram-box">Reorder songs by eye in the sheet</div>
    <div class="diagram-box">Hunt for heavy transitions visually</div>
    <div class="diagram-box">Add up total time and pick a break point</div>
    <div class="diagram-box">Reorder again and restart the arithmetic</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: SetlistAutomation</strong>
    <div class="diagram-box">Fill in players and YouTube URLs</div>
    <div class="diagram-box">Transition cost matrix built automatically</div>
    <div class="diagram-box">TSP fixes the order; 40-minute blocks get breaks</div>
    <div class="diagram-box">Order, costs, and total time written to a sheet</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: Setlist planning before and after</p>
</div>

Three decisions carry the design:

- **Leave ordering to the solver**: turn transition cost into an N×N matrix and solve it as a TSP.
- **Treat stage time as post-processing**: once the order exists, accumulate song lengths and split at 40 minutes.
- **Aim breaks at heavy transitions**: if a 15-minute break can absorb a drum swap, move the break a few songs to land there.

Ordering and breaking are not solved together because they optimize different things. Ordering minimizes total transition cost; breaking decides where the heaviest transition happens. Solving them separately makes the result explainable.

## Implementation notes

### 1. Use the song table as the input

The input is a Google Sheet. Row 4 is the header, row 5 onward is data, and the status column filters the set. `main.py` keeps only confirmed songs.

```python
# main.py (data loading)
        header = all_values[3]
        song_data_rows = all_values[4:]
        header_map = {h.strip(): i for i, h in enumerate(header)}
        ...
            status = row[status_col_idx].strip()
            if status.lower() != '成立': continue
```

The local script `local_main_youtube.py` broadens the filter so a draft can still be built from songs that are not fully staffed yet. Data also starts on row 8.

```python
# local_main_youtube.py (settings)
TARGET_STATUSES = [
    "成立",
    "あと一人",
    "募集中",  # uncomment if needed
]
HEADER_ROW_NUMBER = 4
DATA_START_ROW = 8
```

Filtering to confirmed songs alone yields too few candidates for a full set. Drafting with "one member short" songs included means the plan is ready the moment the slot is filled.

### 2. Turn transitions into a matrix, then let the solver order

Part weights are drums 5, guitars 3, bass and keys 2, vocals, chorus, and misc 1. The cost from song A to song B is the maximum weight among the parts that change.

```python
# local_main_youtube.py (create_cost_matrix)
    for i in range(num_songs):
        for j in range(num_songs):
            if i == j:
                continue
            members_i = songs_data[i]["ParsedMembers"]
            members_j = songs_data[j]["ParsedMembers"]
            cost, is_drum_change = calculate_transition_cost(
                members_i, members_j, costs_dict
            )
            cost_matrix[i, j] = cost
            if is_drum_change:
                drum_change_transitions_set.add((i, j))
```

Handed to OR-Tools as a TSP, that matrix returns the order with the lowest total cost. Manual planning can only improve adjacent pairs; the solver reorders against the global total. Drum changes are recorded in a separate set as well, which the break inserter later reads.

### 3. Aim breaks at heavy transitions, not at the clock

Break insertion in `main.py` is straightforward: if the block plus the next song passes 40 minutes, a break goes before that song, and the transition at that boundary counts as zero, because the swap can happen during the break.

`local_main_youtube.py` goes one level deeper. Even when the block is about to pass 40 minutes, if a drum change appears within three songs, it allows up to 10 minutes of overrun and pushes the break to that point.

```python
# local_main_youtube.py (settings)
lookahead_steps = 3  # how many songs ahead to look for a drum change
break_time_allowance = 10  # tolerated overrun when delaying a break (min)
```

```python
# local_main_youtube.py (create_detailed_setlist_with_breaks)
                            estimated_time_at_future_drum_change = (
                                current_block_time + time_accum_for_delay_check
                            )
                            if (
                                estimated_time_at_future_drum_change
                                <= play_time_limit + break_time_allowance
                            ):
```

A drum swap is the heaviest transition in the model. Doing it inside a 15-minute break removes it from the total and keeps the show moving. Treating stage time as soft by a bounded amount is what creates room to hide the heaviest swap.

## Results

The repository records no reduction rate or runtime figures, so there is no percentage to quote. What the implementation changes is this:

| Aspect | Manual | SetlistAutomation |
|---|---|---|
| Basis for the order | Visual check of adjacent pairs | Transition cost matrix and a TSP solution |
| Total time | Recalculated on every reorder | Accumulated from song lengths |
| Break placement | Guessed | Pulled toward drum changes within 40 minutes plus a 10-minute allowance (look-ahead build) |
| Record | None | Order, transition cost, effective cost, and total time written to a sheet |

In practice, the time spent arguing about order becomes time spent filling in the table, and only review and adjustment remain. In the look-ahead build, the break lands before a drum change rather than at the 40-minute mark, so the heaviest transition no longer interrupts the set.

## When not to use it

- **Few songs, few transitions**: with a handful of songs and little instrument swapping, arranging by hand is faster. The solver only earns its place when transition cost varies a lot.
- **Songs that change parts internally**: cost is defined between songs, so a part change inside one song cannot be expressed.
- **Original songs with no YouTube reference**: length falls back to 5.0 minutes, which makes the total time estimate rough.
- **Units of transition cost**: the weights are unitless values from 1 to 5, but block time adds them as if they were minutes. Total time is therefore a guide, not a measured transition duration.
- **No MC or measured swap time**: stage banter and actual swap durations are not inputs. Feeding measured values back into the weights is not implemented.
- **README drift**: the README describes `main.py` with data starting on row 5, while the local scripts use row 8. Which script you run changes how the sheet is read.

## Takeaways

- Turning transition cost into a numeric matrix reduces ordering to a known problem, the TSP.
- Stage time and breaks belong after the solve; do not stuff constraints with different objectives into one model.
- Placing a break where it can absorb a heavy transition lowers total cost without changing the order.

No special algorithm was written. Deciding how to represent the constraints is what turned a recurring argument into a repeatable procedure.

## Related posts

- [Optimizing a band setlist with OR-Tools TSP](/en/post/20261115setlist-automation-tech/)
- [Generating a band setlist with OR-Tools TSP (in Japanese)](/post/setlist-automation/)

---

**Need help structuring a planning or optimization workflow?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1993863)
