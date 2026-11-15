---
title: "The Small LLM That Answers Before It Thinks: Four Roles and a Comparison Design"
date: 2026-11-15T15:30:00+09:00
draft: false
tags: [LLM, LoRA, reinforcement learning, evaluation, problem solving]
summary: "Small LLMs commit to a hunch and stop tracking candidates. This post breaks down the failure modes, describes a loop that grows a creator and a solver in turn, and reports how far a per-turn reward actually moved the numbers."
---

## It is not "I don't know", it is "I won't reconsider"

When a small LLM plays an exploratory task, the near-misses are the interesting part. The repository records what a 4B instruct model did on troubleshooting, where a single faulty component hides in a dependency graph.

- Solve rate 56% (the oracle that plays the optimal strategy reaches 100%)
- Even when it succeeded, it used 2.3 more turns than optimal
- The failures split into premature answers (23%) and naming a component that had already been excluded (12%)
- A 1.7B model reached 6%

The gap is not knowledge. The model picks an answer before collecting the observations, and it resurrects candidates it already ruled out. That is the behaviour to improve.

## Why existing tools fall short

| Approach | What it gives | Where it stops |
|---|---|---|
| Prompting it to "think before answering" | The output shape changes | The policy does not. It fails the same way on the same problem |
| SFT on a fixed problem set | Strength on the demonstrations' distribution | No exploration beyond them; it saturates at 56% → 83% |
| RL on a fixed distribution (GRPO) | A reward for correct answers | 83.3% → 81.3%; a fixed problem set saturates the signal |
| Swapping to a larger model | More raw capability | Breaks the premise of running up to 4B on local 48GB |

The last two were measured, not assumed. If "the problem set is fixed" is the common cause, then the side that writes problems should grow too. That was the starting idea.

## The design

The design has three parts: split the side that writes problems from the side that solves them and update both in turn; move the difficulty to match the solver's current ability; and put something other than correctness into the reward — specifically, what the solver knew at the moment it answered.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: a fixed problem set</strong>
    <div class="diagram-box">SFT on demonstrated problems (56%→83%)</div>
    <div class="diagram-box">RL on the same distribution (83.3%→81.3%)</div>
    <div class="diagram-box">Correct/incorrect only; middle turns ungraded</div>
    <div class="diagram-box">Premature answers persist; excluded candidates return</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: four roles, updated in turn</strong>
    <div class="diagram-box">The creator writes problems against the current solver</div>
    <div class="diagram-box">The creator judge filters; only valid problems pass</div>
    <div class="diagram-box">Reward per turn: how many candidates were left</div>
    <div class="diagram-box">Compare on solve rate and on step count</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: The training loop before and after</p>
</div>

Three trade-offs shaped it. First, growing the creator risks problems that become too hard, so the creator peaks at a 0.5 solve rate and loses reward on either side. Second, training the judges too would leave no stable ground when things break, so the judges stay fixed code and only the machinery is validated first. Third, conditions differ in generation and rejection cost, so they are matched on wall-clock training time rather than on update count.

## Implementation notes

### 1. Measure how many candidates were left, per turn

`turn_diagnostics` in `src/coevo/domains/troubleshoot.py` compares, at every turn, the candidate set implied by the observations with the list the model wrote in its reply.

```python
# src/coevo/domains/troubleshoot.py (turn_diagnostics)
true = frozenset(remaining_candidates(problem.public, observations))
m = _BELIEF.search(t.get("response") or "")
...
d = {
    "kind": kind,
    "true_candidates": sorted(true),
    "belief_exact": belief is not None and set(belief) == true,
}
```

`belief_exact` asks whether the remaining candidates were named exactly. A correct answer taken from three remaining candidates counts as a solve just like a correct answer from one, and this field separates the two.

### 2. Discount the reward by how guessable the answer was

`posterior_solver_reward` in `src/coevo/rewards.py` replaces correctness with the probability of being right given the candidate set.

```python
# src/coevo/rewards.py (posterior_solver_reward)
answer = next((d for d in diagnostics if d["kind"] == "answer"), None)
if answer is None or not answer["answer_in_candidates"]:
    return 0.0
p = 1.0 / answer["answer_candidates"]
return p * max(floor, 1.0 - step_penalty * max(0, n_turns - minimal_turns))
```

One candidate left gives p=1; three give p=1/3. The step penalty is measured from that problem's worst-case optimum rather than from a fixed free-turn count, so narrowing the field first is what pays.

### 3. Pin the alternation order with a state machine

One cycle is: two creator updates, then collect 20 new problems, then five solver updates. Getting the order wrong invalidates the comparison, so `next_action` in `src/coevo/alternating.py` validates the combination of counters and raises on an illegal transition.

```python
# src/coevo/alternating.py (next_action)
if creators_done < creator_steps:
    if pool_count or solvers_done or collection_batches:
        raise ValueError("collection or solver advanced before creator phase finished")
    return "creator", creators_done + 1
```

## Results

One alternating cycle lifted the 50-problem validation set from 80.0% to 87.3%. On the 200-problem final evaluation with three seeds, though, co-evolution landed at −2.8pt [−4.8, −0.9] against the fixed problem set, and the per-seed signs did not agree. **The advantage of co-evolution itself was not confirmed under this design.**

The diagnostics were more informative than the headline. In 13 of the 14 failures of the solver trained on the fixed set, the candidate list was wrong. On top of that, only 8.6 of the 16 episodes in an update carried any learning signal on average, and because `free_turns=5`, the step penalty was barely active.

The per-turn reward condition addresses exactly those two points, adding candidate-list agreement and uninformative questions as separate standardised terms.

| Comparison | Difference |
|---|---|
| Matched to the fixed set's training time | +3.4pt [+1.9, +5.1] |
| Validation set | +4.0pt [+2.4, +5.7] |
| Hard set | +6.6pt |

That condition was the first to raise exact candidate-list agreement on all three seeds. Looking only at correctness, that change is invisible.

## When not to use it

- **When you need to claim co-evolution wins**: this work cannot support that. More seeds, or a design with a larger per-seed effect, would be needed.
- **When you want to train the judges**: not attempted. A learned judge can collude with the creator and drift the difficulty, so a fixed-judge baseline has to exist first.
- **When you want turtle soup or math**: the domain is an interface, so it can be swapped, but only troubleshooting and a tiny guess-the-number domain for tests are implemented.
- **When you want a strong step penalty**: push it too far and guessing rises. The variant that added only the candidate-set reward (R1) did increase uninformative questions and copied candidate lists.
- **When you want to evaluate in Japanese**: the Japanese evaluation set is not built yet.

## Takeaways

- Breaking failure down into premature answers, excluded candidates, and candidate tracking tells you where the reward belongs
- A correctness-only reward pays the same point for one remaining candidate and for three; discount it by guessability
- "The machinery runs" and "the effect is real" are separate verdicts. Here only the first was established

Fixing "answers before thinking" required measuring the state just before the answer, not the answer itself.

## Related posts

- [Co-evolving four roles, GAN-style: the testbed behind umigame_GAN](/en/post/20261115umigame-gan-tech/)

---

**Need help with post-training or evaluation design for LLMs?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1993863)
