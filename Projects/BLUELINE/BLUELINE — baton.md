---
title: "BLUELINE — baton"
born: 2026-06-22
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the in-progress move on BLUELINE's new-story sequence across a pause, waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Baton: BLUELINE

> Replaces the consumed 2026-06-19 InstantID baton (that move is done — InstantID identity proven, [[Steer the Generator]] + [[Frame Designer]] deposited). New move below.

## Move
Take the new-story opening sequence from *proven-method* to *polished frames* — render the multi-figure shots (05 dying-girl, then 04 plummet, 06 kiss) via **generative layering** with the hero's identity **InstantID-locked**, getting each composite's scale/focus/lighting to actually match.

## Why this move matters
The hard part is solved: the [[Frame Designer]] system is deposited to canon and all three legs are proven (staging / render / composition / assess). What's left is *using it well* to finish the sequence — the dying-girl frame works in method but its hero is a generic figure and the composite is rough. This move is craft, not R&D: don't re-invent the pipeline, run it with care.

## Tried and rejected (negative space — do not re-explore)
- **Single-pass dense multi-figure** → secondary figures dissolve in heavy ink. Use **generative layering** (`layer_render.py`): render each character its own clean pass, composite, integrate-fuse.
- **DWPose on a lying/occluded figure** → drops it (trained on upright). Use **openpose compositing** (`compose_pose.py`): hand-place that skeleton.
- **Blind joint-table authoring** (`newstory_bench.py`) → fine for clean single poses (NS-02/03 worked) but **fails on multi-figure + extreme foreshortening** (NS-04 plummet, NS-06 kiss didn't read). Use **generate→extract** (`gen_pose.py`) for those.
- **Prompt-only gaze/pose** → seed-lottery drift. Always condition on openpose/depth.
- **cv2 paste-swap** for faces → looks pasted. Use InstantID (Tier-1 inpaint / Tier-2 composite-regen).
- **Validator alone** (`validate_pose.py`) → geometric checks pass poses the eye rejects. Keep the greybox eyeball.
- **FLUX for the look** → too perfect/vector. SDXL + locked `pen-flow`.

## Current state
- **[[Frame Designer]]** deposited to canon: `Frame Designer.md` on **main** (`641d34d`) — the dispatch entry + method catalogue + forward vectors. 4 weave flags on the persistent board (Maker · Shop · Production Pipeline · Board Record Schema).
- **Generative layering proven** (`6b233ec`): `proofs/new-story/layers/final.png` — dying-girl frame fused (scene+girl → composite → integrate). Hero is generic (this test was composition, not identity).
- **Shots so far** (`proofs/new-story/out/`): 01 burning-city ✓ · 02 hero-pointing ✓ · 03 leap-legs ✓ · 05 dying-girl (method ✓, needs identity-lock + composite polish). **Pending: 04 plummet, 06 kiss.**
- The 6-shot sequence + prompts live in `render_shot.py` (`SHOTS` dict).

## Next move
Re-render **shot 05** to production quality first: InstantID-lock the hero across the layers, and refine the `layer_render.py` composite so the girl, hero, and crowd share scale/focus/lighting (see Calibrations). Then carry the same method to **04** (plummet — generate→extract the falling pose) and **06** (kiss — generate→extract or composite the two-figure pose; intertwined figures lose the buried one in extraction, so expect to composite). Optionally, promote the tools into [[The Shop]] as Specialists (InstantID first), per the weave flags.

## Receiving environment
- **Worktree** (work lives here, NOT merged to main): branch `feature/blueline-m3` · `/Users/loudonstearns/Documents/palace-feature-blueline-m3` · profile `blueline`. Recreate if gone: `node _ops/worktree/new-worktree.mjs --name feature/blueline-m3 --profile blueline --memory`.
- **[[Frame Designer]] entry is on `main`**, not this branch; the proofs + tools are on this branch.
- **Local ComfyUI** `:8189` (`_tools/ComfyUI/venv/bin/python main.py --listen 127.0.0.1 --port 8189`) has sd_xl_base + openpose/depth-sdxl ControlNets. Kill when idle (MPS memory).
- **InstantID** is NOT local → the pod: `proofs/style-lock/instantid_orchestrator.py` (volume-free, gated readiness, **always terminates**; `--terminate-only <id>` safety). RunPod key: `RunPod Images/studio/config.json`. Run scripts under the comfy venv (needs insightface).
- Commit on the branch; verify branch before+after (shared trees switch branches). Generated images are gitignored.

## Calibrations from this session
- **Compositing — Loudon's directive:** great care must be taken to get **scale, focus, and lighting to match** across the layers, or the composite looks fake. **Try a few more times to get it right** (generate-many-select; tune mask feather, per-layer scale, the integrate denoise, and shared lighting/plate context until the layers read as one drawing).
- **Build the system, not the sequence** — the suite is the prize; record method+params+assessment per shot; promote proofs→Shop. ([[Frame Designer]] is the home.)
- **Don't duplicate planned structure** — Frame Designer is the [[Maker]]'s first per-medium Designer split (checked the Shop docs), subordinate to it, not a new top-level maker.
- Cheap-first: greybox + `validate_pose` before any paid render. Loudon picks by eye — show options.

## Load these files first
- **T1:** `Frame Designer.md` (on **main** — the dispatch entry, method catalogue, forward vectors) · `Projects/BLUELINE/BLUELINE.md` § Where it stands.
- **T2:** `proofs/new-story/` — `layer_render.py` (generative layering), `render_shot.py` (Seam-B + the SHOTS), `gen_pose.py` (generate→extract), `compose_pose.py` (openpose compositing), `validate_pose.py`, `newstory_bench.py` · `proofs/style-lock/locked-style.json` + `instantid_orchestrator.py` + `instantid_composite_regen.py`.
- **T3:** `proofs/new-story/layers/` (the proven layering output: scene · girl · composite · final).

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
*Identical in every baton. It rides along because the catching Claude loads the baton and the entry, not the ceremony — so the catcher's obligations live where the catcher will see them. Omit nothing here.*
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive Step 6 relies on.
3. Mark it caught: remove the "Active Baton" section from the parent entry; for a board-announced baton with no parent entry, post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) instead.
4. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
5. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it (`node _ops/worktree/new-worktree.mjs --name <branch> --profile <p>`) if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
6. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.
