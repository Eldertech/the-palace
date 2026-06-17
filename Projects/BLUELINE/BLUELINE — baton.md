---
title: "BLUELINE — baton"
born: 2026-06-17
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry BLUELINE across a session boundary at a clean checkpoint — re-founded on the established animation pipeline, M0 + M1 shipped, the staging vocabulary banked as canon, everything merged to main. I point the next Claude at the pipeline doc and the next rung (M2), and ask it to spawn its own worktree first. Delete me on pickup; git is my archive."
session_thread: "Mac-side 2026-06-17 — pipeline re-founding + deposit + relay-to-main; worktree torn down; handing to a fresh Claude"
---

# Baton: BLUELINE — re-founded on the pipeline, clean to hand off

## Move
Everything through **M1 is shipped and on `main`**, and BLUELINE is **re-founded on the established animation pipeline**. The next rung is **M2 (motion comic)**. First, spawn your own worktree (see On pickup) — the last one was torn down.

## Where we are (all on `main`)
- **Re-founded (2026-06-17).** BLUELINE now models the established pipeline — **anime backbone · comics skin · animated-feature tissue · music-video clock** — with the render-AI dropped in. The only novelty is **two seams**: board→layout (2D→3D handoff) and layout→render (staging→conditioning). Read `Projects/BLUELINE/BLUELINE — Production Pipeline.md`. Founding rationale deposited as canon: [[Adopt the Craft, Author the Seam]].
- **M0 + M1 shipped + verified.** M0 greybox previz and M1 comic-register animatic both play the storyboard in time with the live clock. The **staging vocabulary** is built — facing · eyeline · L/R laterality · the framing-robust shoulder–shoulder–pelvis **torso frame** · shot size · camera grammar · the CU **detail ladder** — and does *three jobs at once* (board-record schema · AI conditioning keypoints · lossless 2D→3D transfer). New fields in the Board Record Schema: `FACING` / `EYELINE` / `HANDS` / `SECTION`.
- **Track II (identity): honest negative.** The r4ng3r LoRA scored *below* its text-only baseline (learned a hooded costume, not a face). Pipeline is sound (DreamBooth dog control +0.35); the fix is a **face-forward dataset**. Until then: text-described characters + Track V seed-locking.
- **Relay done.** `feature/blueline` merged → `main` (`61b439d`); its worktree + branch were **removed this session**.

## Next moves
1. **M2 motion comic** — held comic panels gain limited motion (parallax, held-pose drift, speed-lines animating along the field): the first place the flow field *moves* in the comic register, still ahead of the render-AI seam.
2. **Per-stage role-Specialists** under a BLUELINE [[Maker]] — Director · Board artist · DP/layout · Render-AI · Editor — make the team real (the Production Pipeline forward vector).
3. **The 3D-assisted-boarding lane** — camera-heavy shots born in grey-box [[Shop/Blender]] and drawn over (the anime 3D-layout move), feeding the same board record. The open Seam-A branch.
4. **Track II face-forward LoRA redo** (optional loop-back) — rebuild the character set close + frontal, retrain, re-grade against the v2 ruler.
5. **The real M4L clip-scan device** (only `clip_scan_sim.py` exists) + the trivial `/m1` relay route so M1 runs off the live Ableton clock, not just self-play.
6. **Resume the cited deep-research run** (parked, rate-limited) to back the pipeline synthesis with sources: `Workflow({scriptPath: ".../workflows/scripts/deep-research-wf_3fe30979-6c8.js", resumeFromRunId: "wf_3fe30979-6c8"})` once usage has reset (completed search/fetch agents return cached).

## State / receiving environment
- **Owner is `main`** at the primary worktree `/Users/loudonstearns/Documents/The Palace`. The `feature/blueline` worktree + branch are gone.
- **RunPod:** verify 0 pods; network volume `blueline-models` (`aqm8oev4b0`) persists models; `palace-flux` serverless parked at `workersMax=0`. Key in `RunPod Images/studio/config.json` (gitignored; symlinked per worktree profile).
- **No running processes** — preview servers + the OSC relay are stopped; the deep-research workflow was stopped (resumable, above).
- **Local tooling** lives under the gitignored `_tools/` (16 G ComfyUI) — symlinked into any worktree by the `blueline`/`full` profile.

## Read these first
1. `Projects/BLUELINE/BLUELINE — Production Pipeline.md` (the re-founding: flowchart, the two seams, tracks-mapped-onto-stages) + `BLUELINE.md` (the face).
2. [[Adopt the Craft, Author the Seam]] (the founding concept) + `Projects/BLUELINE/BLUELINE — Board Record Schema.md` (the spine + the staging-vocabulary fields).
3. `Projects/BLUELINE/proofs/m1-animatic/m1-report.md` (the staging vocabulary, the framing-robust torso frame, the CU ladder, the blue-line→ink register).

## On pickup (the catcher's checklist)
1. **Spawn your own worktree first** — Loudon's standing rule (memory `feedback_create_worktree_first`): `node _ops/worktree/new-worktree.mjs --name feature/blueline-m2 --profile blueline --memory`. Work there; commit BLUELINE to that branch; merge to `main` when a rung ships; canon/deposit always commit to the owner on `main`.
2. State the move back in one sentence (re-founded on the pipeline; next is M2). If you can't, the baton wasn't caught — stop and ask Loudon.
3. This baton is committed on `main` — that commit is its archive.
4. Mark it caught: delete this baton file (git is the archive).
5. Act on the move, holding the calibrations below.

## Calibrations
- **Adopt the craft, author the seam** — don't reinvent established film/animation craft; the only new work is the two seams.
- **Look vs legibility** — staging clarity is *conditioning* (substrate); aesthetic polish is deferred.
- **The board record is the single source of truth** — 2D and Blender both render it; tune *params, not pixels*; depth round-trips. Blender stops at the grey-box; the AI paints.
- **Loudon builds the Max patches himself** — give precise, testable Max guidance.
- **Reveal files in Finder** (`open -R`) when you locate or produce them (memory `feedback_reveal_in_finder`).
- **Verify the owner is on `main` before any canon/baton commit** — the shared tree thrashes branches.
