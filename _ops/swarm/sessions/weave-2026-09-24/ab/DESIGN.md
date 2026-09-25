---
title: "Weave 2026-09-24 — child vs schema vs elder (pre-registered)"
born: 2026-09-24
links:
  - target: "[[Weave Ceremony]]"
    type: connects-to
    label: worker-growth-experiment
  - target: "[[ELDER]]"
    type: connects-to
    label: under-test
forward_vector: "I am the design of a small experiment, written before its results: should a weave's workers grow up? I end as a rule, or as an honest 'not shown'."
---

# Should weave workers grow up? (pre-registered 2026-09-24, before any arm returned)

**Question (Loudon).** Are the weave's worker errors caused by running workers as children (CLAUDE + Jewel + World, plus SCHEMA §4 inline in the prompt) rather than elders? Should it be a rule that weave workers carry the schema, and possibly more?

**Arms** (same rooms, model (Sonnet), tools (`palace-reader`), prompt and output schema; only the preamble differs):
- **C — child:** this morning's run (`workers/`), cached, not rerun.
- **S — schema-only:** reads SCHEMA + SCHEMA — Reference before the task.
- **E — elder:** told to grow up; reads ELDER, then SCHEMA, then SCHEMA — Reference.

**Rooms:** 10, picked by seeded stratified random (seed 924), not by where C made errors, which would bias toward regression to the mean: L1 · L4 · L6 · F-Shop · F-small-families · C1.2 · C2.2 · C5.2+C7+C8 · B1 · B5.

## Metrics (defined now)
**Deterministic, over every proposal** (script, from the map):
- **M1 already-exists rate:** proposed links that already exist in either direction.
- **M2 unmappable rate:** targets that are not entries (bundle files, ghosts), or a `type` outside §4.
- **M3 hard-direction errors:** a hub emitting `member-of`; the method `exemplifies` its instance (the curate.py flip class).
- **M4 citizenship-stage errors:** a stage raised on a `person` because the dossier is rich (SCHEMA §1: a person's stage tracks citizenship).
- **M5 cost:** worker tokens per room.

**Blind judge, over a seeded sample** (8 items per arm per room, arms relabelled X/Y/Z by a per-room permutation the judge never sees):
- **J1 invalid:** exists already · wrong direction · wrong type · not an entry · evidence not in the page (fabricated) · forced or passing.
- **J2 stand-behind:** the judge would write it into the palace as proposed.
- **J3 per-room ranking** of X/Y/Z by "which worker's proposals would I rather sign".

## Decision rule (fixed now)
- **Elders become the rule** if E's J1 invalid rate is at least a third lower than C's (relative), with no fall in J2 stand-behind count, and E ranks first in J3 in 6 or more of 10 rooms.
- **Schema-only becomes the rule instead** if S captures most of that gain (S's J1 within a quarter of E's) at lower cost (M5).
- **Otherwise: not shown.** Keep children and fix the specific failures in the prompt: tell workers to read each page's own frontmatter before proposing, and put §1's citizenship note inline.
- M1–M4 are reported either way. A clear deterministic drop (e.g. M4 falling to zero in E and S) justifies a *targeted* inline addition even if the overall rule isn't met.

## Known limits
- One child run, so no child-vs-child noise baseline. With 10 rooms, only large effects show.
- The judge is a model reading files, not ground truth. Its verdicts are spot-checked by the coordinator.
