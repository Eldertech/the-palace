---
title: "Deposit Ceremony — tuning"
born: 2026-09-25
links:
  - target: "[[Deposit Ceremony]]"
    type: connects-to
    label: tuning-for
forward_vector: "I am the Deposit's record of what each run taught it, numbered, each lesson tied to the spec change it forced, so the ceremony's version has a reason you can read. Append after a run that changed the ceremony; never prune what a real run taught."
---

# Deposit Ceremony — tuning

What each deposit taught the ceremony. Each item names what the run showed and the spec change it forced, or says **owed** when the change hasn't landed. Newest last. Hashes are commits to `_ops/Deposit Ceremony.md` unless noted. The number moves when the procedure does — a step, a gate, a completion signal — never for prose; why v1.0 starts where it does is in [[Deposit Ceremony — Context]] § The Version and the Tuning File.

## From the early deposits — 2026-03-21

1. **Loudon's reflections were the rare lines in his own voice** in a palace largely written by AI. Forced: a significant answer to the reflection question is deposit material, kept close to his words — Step 3 (Context § Session Log — 2026-03-21).

## From the board — 2026-06-05

2. **Weave flags lived in archive prose the Weave never read.** Forced: each flag posts to the persistent board as a `weave_flag`, and the Completion Signal checks it (`996b3f70`).

## From the simplification pass and the worktree practice — 2026-06-16 to 06-17

3. **Guardrails written for weaker models had aged.** Forced: Step 5's latent-variable and reconstruction checks were cut (`49a45354`).
4. **Canon committed on a feature branch never reaches main.** Forced: a deposit always writes and commits to the owner (`2f43c6de`, `0bbd152a`).

## From the LOG migration — 2026-06-21 to 07-02

5. **A hand-kept archive table repeated what the commit already said.** Forced: the deposit's record is its commit body, under a self-classifying `deposit(<id>)` subject; the archive froze (`78a2f326`).
6. **Hand-rolled commits slipped three ways at once** — the retired subject, no trailers, a row appended to the frozen archive (`641d34d`, the slipping commit, not a card commit). Forced: Step 7b's "use the committer, do not hand-roll" (`89542e70`).
7. **With the server down, a Mac session had no committer it could run.** Forced: Step 7b leads with the server-less `palace-commit.mjs` (`06e36897`).

## From the LDN RTM deposit — 2026-09-02

8. **Three weave flags were malformed by copying a neighbour's line**, and the ceremony asserted its postcondition instead of checking it. Forced: Step 7c, verify backstage, and flags posted through `python3 -m commons weave-flag` (`05a2b4cc`; Context § What the LDN RTM deposit taught).
9. **The fold-or-mint question never ran**, because minting is the drafter's easier default. Forced: the Concierge is summoned at Step 1 if none is resident, and the map asks it fold-or-mint first (`05a2b4cc`).

## From the close of 2026-09-02 — 2026-09-03

10. **A clause that needs that much warning is the warning.** The punchlist clause ran 200 words, 120 of them warning against performing it. Forced: cut; [[Closing Well]] already names punchlists (`1b67a68a`).

## From the defect audit and the crossing deposit — 2026-09-04

11. **The opening block addressed a claude.ai window**, telling a Claude Code session to fetch a file it already held. Forced: the opening routes placement to the Concierge before drafting (`02d7d3b6`).
12. **A declined branch, read back later, looked like a lost one.** A session reopened a deferred item from a transcript on the theory it had been lost; it had been left. Forced: a lost branch says which kind it is — queued on [[Palace To-Do]], or declined (`ff8595be`).

## From the versioning read — 2026-09-25

13. **§ Where the Deposit Lands still shows a hand-rolled commit with the retired subject** — `git -C "<owner>" commit -m "Deposit — …"` (`Deposit Ceremony.md:81`) — which Step 7b forbids. An example is what gets copied. Spec change owed: the example becomes the committer with `PALACE_ROOT="<owner>"`.
