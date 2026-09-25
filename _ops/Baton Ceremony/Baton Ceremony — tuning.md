---
title: "Baton Ceremony — tuning"
born: 2026-09-25
links:
  - target: "[[Baton Ceremony]]"
    type: connects-to
    label: tuning-for
forward_vector: "I am the Baton's record of what each run taught it, numbered, each lesson tied to the spec change it forced, so the ceremony's version has a reason you can read. Every run leaves a line here; a run that changed the ceremony also leaves a numbered item. Never prune what a real run taught."
---

# Baton Ceremony — tuning

What each baton taught the ceremony. Each item names what the run showed and the spec change it forced, or says **owed** when the change hasn't landed. Newest last. Hashes are commits to `_ops/Baton Ceremony.md` unless noted. The number moves when the procedure does — a step, the footer, a completion signal — never for prose; why v1.0 starts where it does is in [[Baton Ceremony — Context]] § The Version and the Tuning File.

## From the first batons — 2026-06-09

1. **The catcher reads the baton, never the spec.** So the checklist has to travel inside the artifact. Forced: the fixed On-pickup footer in every baton, and the catcher commits an uncommitted baton before anything else (`01d9ea92`).

## From the simplification pass — 2026-06-16

2. **Guardrails written for weaker models had aged.** Forced: the spec-side Resumption Protocol was deleted, and its one unique check — the receiving surface's capability delta — folded into the footer (`49a45354`).

## From the worktree practice — 2026-06-17

3. **A baton on a feature branch is invisible from every other worktree.** Forced: a worktree coordinate in the baton and a required announcement on the owner's board (`2f43c6de`).

## From the skepticism pass — 2026-07-03

4. **A baton is a snapshot, and a stale one followed silently produces drift.** The spec already said so, but only in its Completion Signal, which the catcher never opens. Forced: the freshness gate, On-pickup step 2 (`f99e5160`).

## From Loudon's calibration and the cold-start catch — 2026-07-04

5. **Finishing a plan's stage and pointing at the next is a handoff too.** The baton carries the session's calibrations, which the plan can't; "no half-finished move to rescue" is not a reason to skip one. Forced: § When to reach for a baton (`83dcfd98`).
6. **The move a baton names is an entry point, not a scope limit.** A baton can commission the start of something large. Forced: the cold-start variant, with its own trigger and template note (`d4c0af41`).

## From the Reliable Handoff ladder — 2026-07-07

7. **A caught-then-dropped baton vanished from the queue.** Forced: the three-state lifecycle — claim at the catch, close at the landing — with deletion moved from the catch to the close (`7b2f750b`).

## From the footer drift — 2026-08-25

8. **A checklist that is copied drifts.** The lifecycle reached the spec on 07-07 and never reached `baton-executor.mjs`'s own copy, so for seven weeks machine-written batons shipped the pre-lifecycle text. Forced: one home for the checklist (`_ops/Baton Ceremony/Baton Ceremony — on-pickup.md`) and `lint-baton-footer.py` to guard it (`f6cf60c0`).
- run · 2026-09-25 · v1.0 · Palace Ceremonies, phases 4–5 · nothing new
- run · 2026-09-25 · v1.0 · Enrichment · nothing new
- run · 2026-09-25 · v1.0 · Kuramoto Coupling · nothing new
- run · 2026-09-25 · v1.0 · Language as a Tonal Medium · nothing new
- run · 2026-09-25 · v1.0 · No Mind Checks Itself · nothing new
- run · 2026-09-25 · v1.0 · Palace Ceremonies, review and Phase 5 · nothing new

## From the STIGMERGY hardening baton — 2026-09-25

9. **The executor can't point from an entry that already has a baton, or announce one that lives on main.** Placing the STIGMERGY hardening baton, `baton-executor.mjs --write` found STIGMERGY's existing `## Active Baton` section, printed "already had — left as is", and added no pointer — completion signal 2 unmet, with no error. And `--post` refused without `--wt-branch`/`--wt-dir`, though a baton on main has no worktree. Both were done by hand (the pointer line; the announce through `_ops/commons/board-post.mjs`). Spec change owed: the executor adds its pointer line inside an existing section, and asks for a worktree coordinate only when the baton lives off main.
- run · 2026-09-25 · v1.1 · STIGMERGY, hardening · taught item 9
