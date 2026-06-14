---
title: "BLUELINE — baton"
born: 2026-06-14
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[BLUELINE]] across the Cowork→Claude-Code boundary, waiting to be caught on the Mac and deleted once the move is picked up."
session_thread: "Cowork session 2026-06-14 — render-backend integration + production-plan reset"
---

# Baton: BLUELINE

## Move
Pick up the reset [[BLUELINE — Production Plan]] and execute its "First moves": stand up Track I (GPU substrate / merged runner — the unblocker) with Tracks III (Clock) and IV (Bench) in parallel.

## Why this move matters
The plan was just reset from a single thread to five parallel, substrate-first tracks because most of BLUELINE turned out to be palace-wide infrastructure (a Shop GPU backend, an Ableton clock, LoRA + a measurement ruler) other work needs anyway. Track I unblocks II & V; III and IV need no GPU coordination, so three threads can start at once. Starting parallel is the whole point of the reset — don't collapse it back into a sequence.

## Tried and rejected (negative space — don't re-explore)
- **Animal motion** — cut from scope; humanoid only. Don't re-add.
- **toyxyz Gumroad rig** — not acquired; the bespoke geometric pose script won. Don't wire the rig unless hand-GUI posing is explicitly wanted.
- **DWPose / any 2D estimator on a greybox proxy** — returns a black image. Emit the OpenPose skeleton geometrically. Settled.
- **img2img to hold pose + restyle at once** — proven to fail (the business-eras movie). Re-render the record via ControlNet instead.
- **Standalone SDXL lineart ControlNet** — none strong at this date; use canny on SDXL, reserve true lineart for FLUX/SD1.5.
- **All-pods routing (the zip's assumption)** — rejected: Study→pod, Piece→serverless.
- **Forking a new runner** — rejected: merge the zip's title-contract runner onto the palace client's hardened transport (browser UA + curl upload), or it 403s on the RunPod proxy WAF.
- **Per-channel vs Union** — closed: per-channel for SDXL, Union for FLUX. Don't re-litigate.
- **Strong "one untouched field" claim** — falsified Session 3; shared-source + thin per-leg scalar holds.

## Current state
- Committed from Cowork: `fb62370` (seed deposit) and `b823f87` (integration + plan reset).
- **Uncommitted, needs a Mac-side deposit:** `Shop/RunPod GPU Backend.md` + its bundle + `RunPod Images/` (all untracked — never committed); plus modified `Artifacts/Shop/host-capability.json` and `_ops/Deposit Archive.md`. My BLUELINE→RunPod link-edit rides along when you commit the RunPod entry.
- BLUELINE bumped seed→sprout (conditioning keystone + flow-field spine both proved).
- Cowork left a `.git/index.lock` (sandbox can't unlink); relocated locks are in `_ops/scratch/gitlock-junk/`.

## Next move
On the Mac, first commit the untracked RunPod canon (Deposit Ceremony) so links resolve in git and the Deposit Archive is honest. Then run the plan's First Moves: **Track I** — endpoint + network volume up, port the zip's `runner.py` onto the hardened transport, drive the existing `flux-controlnet-openpose.workflow.json` from one board record end-to-end, prove the Study-pod/Piece-serverless split. In parallel, **Track III** (M4L→OSC→WS, prove beats land on whole frames) and **Track IV** (three dramatic poses + one camera-grammar constraint solver → board records). Then II (one character + one style LoRA + the assess ruler) and V (2-board motion-coherence test) once the endpoint is warm.

## Receiving environment
Claude Code, Mac, palace root. Capability deltas that matter here: **GPU/MPS** (Cowork had none — Tracks I/II/V need it), **normal git** (the Cowork unlink hazard does not apply — but `rm -f .git/*.lock` first to clear the lock Cowork couldn't delete), **local ComfyUI** at `_tools/ComfyUI` (reuse, don't reinstall), **Blender 5.1.2** verified, and the **RunPod** account + `Palace Studio` tooling in the RunPod bundle. Commit normally Mac-side; route the untracked RunPod entry through the Deposit Ceremony.

## Calibrations from this session
- Define the tracks from the project's real seams + Loudon's sensibilities — **not** a handed feature list. (He corrected an early default to his Ableton/pose/LoRA examples.)
- Substrate-first: prioritize what serves **all** palace work; each track must ship a reusable Shop capability, not project-local scratch.
- Smallest useful test of the **most unknown/difficult** aspect first; capability-first (prove, then optimize).
- Blender is the familiar hand-tuning surface and first-class — but keep comparing alternatives.
- Frugality (Shopkeeper bar): adopt a tool only once something real was made with it; no hopeful pre-deposits.
- He calls the Baton the "Relay" (relay-race metaphor) — same ceremony, no new entry.

## Load these files first
1. `Projects/BLUELINE/BLUELINE — Production Plan.md` — the active plan (the five tracks + First Moves).
2. `Projects/BLUELINE/BLUELINE.md` — the project face.
3. `Projects/BLUELINE/BLUELINE — Render Backend.md` + `BLUELINE — Board Record Schema.md` — the three merge changes + the shared contract.
4. `Shop/RunPod GPU Backend.md` (+ bundle: `pod-comfyui-client.py`, `flux-controlnet-openpose.workflow.json`) — substrate + transport gotchas; `Shop/Blender/toyxyz-conditioning-recipe.md` — proven conditioning.
5. `Projects/BLUELINE/render-backend/` — `runner.py`, `graph_spec.md`, `board_template.txt`, `models_manifest.md`.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. If this baton or its board line is still uncommitted (authored on Cowork), commit them first. That commit is the git archive Step 6 relies on.
3. Mark it caught: remove the "Active Baton" section from `BLUELINE.md`; for a board-announced baton with no parent entry, post the paired `handoff_picked_up` REPLY instead.
4. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
5. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.
