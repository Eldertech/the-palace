---
title: "Figure Rig — baton"
born: 2026-07-02
links:
  - target: "[[Figure Rig]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress multi-figure + hands refinement loop across a session boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
session_thread: "2026-07-01 → 07-02 — gen matrix + hands ablation, then multi-figure THE LIFT, then an autonomous hands/Route-B/BLUELINE refinement loop"
---

# Baton: Figure Rig

## Move
Everything in the refinement loop is **built, staged, and committed** — the only thing left is to
**run three gen batches on a clean RunPod pod** (blocked by a day-long RunPod capacity incident),
then **inspect + log + fold the results into the deposit HTML**. One combined runner already
batches them onto a single boot.

## Why this move matters
The hard parts are done: the multi-figure engine, all 6 THE LIFT beats (genned Route A), the
hands-objects proxy rig, Route B regional conditioning (native `ConditioningSetMask` + a working
mask-from-color-ID tool), and the two BLUELINE scenes (A5, A6') — all staged and committed. What
remains is cheap once a pod boots: ~14 renders, ~10 min. The blocker is **not** the pipeline — it is
RunPod handing out dud nodes (~8 in a row today; ComfyUI never starts). The early-abort monitor
keeps each dud to ~9 min instead of a 30-min timeout.

## The three pending gens (one combined pod)
From the worktree, one boot does all three via `pass_combined_pod.py`:
```
cd Projects/BLUELINE/proofs/new-story
POD_CANNY=1 python3 -u pose_pod_orchestrator.py --render-script \
  ../blender-handdrawn/followups/rig-openpose/pass_combined_pod.py
```
Runs in order: `batch_hands_objects_pod.py` (glass/snake/flower proxy-guided, §5 A/B vs the
prompt-only hands matrix) → `multi_regionB_pod.py --scene B4_cradle` → `--scene B6_held_up` (Route
B). **A5/A6' still need a gen** — add them to `multi_batch_pod.SCENES` (staged plates in
`renders/multi/A5_impact` + `A6_kiss`, openpose drawn) and run `multi_batch_pod.py --only
A5_impact,A6_kiss`, or fold into a second combined run.

**Route B masks are pre-made** for B4 (4) and B6 (5) in `renders/multi/<scene>/masks/`. If you
re-render a scene, re-run `make_masks.py <scene_dir> <n>` (comfy venv python) first — `multi_regionB`
aborts if masks are missing.

## Tried and rejected (negative space — don't re-explore)
- **RunPod, this session:** ~8 dud nodes. A clean boot shows `ComfyUI HTTP up` by ~250–350s; a dud
  never does. **Early-abort at ~575s** (not the 1800s timeout). Always sweep `/v1/pods` after.
- **make_masks color-ID → mask:** exact-hue `dist<90` fails (rendered emission is gamma-shifted from
  nominal IDPAL); `int16` squared-distance overflows to garbage; gating on brightness sweeps in the
  **white floor**. **Winner:** `float32`, **nearest-hue classification**, gate on **chroma
  (max−min) > 40**. Balanced per-figure coverage confirms it.
- **Local ComfyUI (:8188):** has the models but **>30 min/frame** at 1216×832 with 3 CNs —
  impractical for batches (may share Loudon's instance; interrupt the queue if you leave a job).
- **Clothing via prompt:** doesn't hold — canny off the **nude base mesh** keeps ink figures bare.
  Real fix is **clothing geometry on the mesh**, not prompt.
- **FK contact poses (blind):** `ARMS_UP`, `bend_over`, `lie` (tilt=90), `lean_in` read well;
  `recoil` (A5) and the tightest `cradle`/overhead-`support_up` are weak — arm-bone axes need
  in-Blender calibration, not more euler guessing.

## Current state (all committed on `feature/figure-rig-gen`, worktree palace-feature-figure-rig-gen)
- **THE LIFT (invented wordless story):** 6 beats staged + **genned Route A** (ink+comic). Honest
  result in the deposit + note §6b: separation holds everywhere; B1/B2/B3/B5 read; **B4 (cradle) +
  B6 (overhead lift) are where Route A ends → Route B**.
- Route A gens: `renders/multi-gen/<scene>/gen_{ink,comic}.png`. Route B writes `genB_{ink,comic}.png`.
- **Hands-objects:** proxies staged (`renders/hands-objects/*_proxy_closeup/`, openpose drawn). Gen pending.
- **A5/A6':** staged (`renders/multi/A5_impact`, `A6_kiss`), openpose drawn. Gen pending.
- **Deposit HTML** has the THE LIFT section. **Pending sections once gens land:** hands-objects A/B,
  Route-B-vs-A for B4/B6, BLUELINE A5/A6'.
- Last commits: `bd5d4c5` (loop tooling), `ba71023` (THE LIFT deposit), `747b0b8` (engine).

## Next move
1. Boot one clean pod, run `pass_combined_pod.py`; retry on dud (early-abort). Sweep `/v1/pods` after.
2. **Inspect Route B vs Route A** for B4/B6 — does binding each figure's prompt to its color-ID
   region resolve the tight contact Route A blurred? Log honestly.
3. Gen A5/A6'.
4. Add the three pending sections to `build_deposit.py`, regen `figure_rig_deposit.html`.
5. Append Route-B + hands-objects outcomes to the conditioning-stack note §6b.
6. Commit. **Do NOT reveal/send files** — Loudon asked for no reveals during this loop; work, log, commit only.

## Receiving environment
Same surface (Claude Code, Mac). Worktree `palace-feature-figure-rig-gen` (branch
`feature/figure-rig-gen`). GPU: RunPod via `pose_pod_orchestrator.py` in `new-story/`, key at
`RunPod Images/studio/config.json`; flaky — expect retries, early-abort ~575s, sweep strays.
Blender 5.1.2 headless (`/opt/homebrew/bin/blender -b -P …`, NOT `--factory-startup`). Comfy venv
python for PIL/numpy/draw: `_tools/ComfyUI/venv/bin/python`. Regional-conditioning nodes native on
:8188 (`ConditioningSetMask`, `ImageToMask`, `ConditioningCombine`, GLIGEN* — no Attention Couple).

## Calibrations from this session
- Batch every gen job per pod boot (`pass_combined_pod.py` is the pattern).
- Judge multi-figure staging by the **shaded plate** before genning; judge contact by whether the
  overlap reads, not per-bone perfection.
- Color-ID separation is robust; depth orders front/back; Route A keeps figures distinct — the open
  frontier is **close contact (Route B)** and **clothing geometry**.
- Honest logging over triumphant: the deposit records where Route A wins *and* where it hands off.

## Load these files first
1. `Shop/Figure Rig.md` + `Shop/Figure Rig/Figure Rig — conditioning stack and scene expansion.md` (§6b).
2. `multi_figure_rig.py` · `make_masks.py` · `multi_regionB_pod.py` · `pass_combined_pod.py` ·
   `batch_hands_objects_pod.py` · `multi_batch_pod.py`.
3. `figure_rig_deposit.html`.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
*Identical in every baton. It rides along because the catching Claude loads the
baton and the entry, not this ceremony — so the catcher's obligations live where
the catcher will see them. Omit nothing here.*
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive Step 6 relies on.
3. Mark it caught: remove the "Active Baton" section from the parent entry; for a board-announced baton with no parent entry, post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) instead.
4. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
5. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it (`node _ops/worktree/new-worktree.mjs --name <branch> --profile <p>`) if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
6. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.
