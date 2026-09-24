---
title: "Weave 2026-09-24 — child vs schema vs elder: result"
born: 2026-09-24
links:
  - target: "[[Weave Ceremony]]"
    type: connects-to
    label: worker-growth-experiment
  - target: "[[No Mind Checks Itself]]"
    type: connects-to
    label: what-actually-caught-the-errors
forward_vector: "I am the answer to 'should weave workers grow up?', judged against a rule fixed before the results. I point the next weave at the errors that actually mattered: the harness and the reading, not the workers' age."
---

# Should weave workers grow up? — result

**Pre-registered verdict: not shown.** Growing up the workers (ELDER + SCHEMA + Reference) did not make their proposals better, and schema-only fell short of the threshold. Neither becomes a rule. See `DESIGN.md` for the rule, fixed before any arm returned.

## The numbers (10 rooms, seeded stratified; judged blind by elder judges who verified against the files)

| | Judged | Invalid (J1) | Would stand behind (J2) | Ranked first (J3) | Tokens / worker |
|---|---|---|---|---|---|
| Child | 72 | **71%** | 17 (24%) | 3 of 10 | ~106k |
| Schema-only | 74 | **62%** | **25 (34%)** | **5 of 10** | ~120k |
| Elder | 75 | **71%** | 16 (21%) | 2 of 10 | ~125k |

Deterministic, over every proposal: exact duplicates of existing links are about a third in every arm (32 / 30 / 34%). Person-stage errors go 2 → 0 → 0, the one error the schema carries a rule for.

**Reading it honestly:**
- **The elder arm didn't help** on any judged measure, and cost about 16% more per worker. There's no case for "weave workers must grow up".
- **Schema-only trended best**: fewest invalid, most stand-behind, most firsts. But it missed the pre-registered bar (it needed ≤ 47% invalid; it scored 62%). With 10 rooms and a single child run there's no noise baseline, so this is a **lean, not a finding**.
- **About 70% of sampled proposals were invalid in every arm.** Whatever drives that isn't the workers' context.

## What actually drove the errors (found through the judges' notes)

1. **A harness error — mine.** `new-entry-catchup.py` counted a symmetric link (`connects-to`, `mirrors`, `contradicts`, `couples-with`) as inbound for its target only. It reported **17 entries with nothing pointing to them; the true number is 1** (control-vocabulary-math). It also told each walk worker a newcomer had "1 inbound" when it already had several symmetric partners. **46% of the walk's proposals re-drew a symmetric link that already existed**, and another 13% duplicated a link of another type. The judges read these as "exists-already". Fixed 2026-09-24: the script now counts *reach*, with symmetric links holding both ways.
2. **Not reading both pages.** About a third of all proposals, in every arm, duplicated a link sitting in one of the two pages' own frontmatter. That's attention, not knowledge. More context doesn't fix it; handing workers each member's existing links does.
3. **Forced or passing links** (about 20–28%) persist in every arm. The fidelity test was only asked of the bridge lens.
4. **Curation errors — the coordinator's (an elder).** The Concierge's cold read found five wrong items in a 10-item Pile A sample, two misread merges and a backwards gloss. Growing up didn't stop an elder making errors; **a second mind reading cold** caught them.

## Recommendations (for the next weave; none is a rule until re-tested)
- **Don't make growth a worker rule.** Keep workers as children.
- **Fix the harness:** reach-based counting (done). Room files carry each member's **existing links in both directions**. The prompt says *read both pages' frontmatter before proposing; symmetric links hold both ways*. Ask for the **fidelity test on every relation**, not just bridge.
- **Inline the one schema rule that measurably mattered**: SCHEMA §1's "a person's stage tracks palace citizenship".
- **Provisionally add the SCHEMA card** (not ELDER, not the Reference) to the worker preamble, and **re-measure** with this same protocol and more rooms, plus a child-vs-child rerun for a noise baseline.
- **Keep the cold second read before any signing.** It caught more than any change to worker context did.

## Limits
- One child run, 10 rooms, one judge per room. The judge is a model verifying against files, not ground truth.
- The harness error (1) hit all three arms equally, so it doesn't bias the comparison. But it did inflate every arm's invalid rate, which may have hidden a real schema effect.

---

## Follow-up the same day — the harness fixes, measured (v1 vs v2)

The recommendations above were applied at once: reach-based counting, each member's existing links shown both ways in the room file, "read both pages first", symmetric links held both ways, the fidelity test on every relation, the §1 citizenship line inline, and the SCHEMA card provisionally. v2 reran the connection-finding (27 rooms, children, Sonnet, 2.73M tokens, on estimate).

**Deterministic, same 22 rooms:** exact duplicates 13% → **2%**, already-linked pairs 4% → **1%**, unmappable 18% → **6%**. The walk's 35 proposals: **0 duplicates**.

**Blind judge, 8 shared rooms:**

| | Invalid | Already exists | Wrong type | Forced or passing | Would stand behind | First |
|---|---|---|---|---|---|---|
| v1 | 78% | 11 | 6 | 26 | 20% | 3 of 8 |
| v2 | **64%** | **0** | **0** | 23 | **29%** | **5 of 8** |

**What this settles.** The mechanical errors (duplicates, wrong types) were the harness's, and fixing the harness removed them. That did more than growing up the workers did. What's left is almost entirely **forced or passing links**, about half of v2's sampled items, and no change to worker context moved it. That's a judgment problem. The answer that fits is the palace's own [[No Mind Checks Itself]]: **an adversarial verify stage**, a skeptic per proposal, before anything reaches a batch signing. Every correction today came from a second reader (the Concierge, the blind judges, replication across runs). The first readers never caught their own.

**Replication caution.** 73 pairs were found by both runs, but both runs read the same rooms, so a room's forced analogy can repeat (Dispersion Table ↔ Spinoza did). Replication is evidence of salience, not of truth. It did, though, overturn one coordinator decline: Quadratic Interpolation ↔ Reflective Practice is real; the entry discusses PID (:139-149).

**Recommendation for the next weave (to go in Weave Ceremony — Context):** children, with the fixed harness, plus the SCHEMA card; **an adversarial verify stage before synthesis**; and the cold second read before signing, as today.
