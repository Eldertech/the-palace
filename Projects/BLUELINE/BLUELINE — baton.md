---
title: BLUELINE — baton
born: 2026-06-19
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: baton-for
forward_vector: "I hand the next Claude exactly the move in flight — stand up InstantID for the swappable character — and the negative space already ruled out this session, then I am deleted."
---

# BLUELINE — baton

> Relay from the 2026-06-19 Mac-side session. Disposable: delete on pickup, git is the archive.

## The move
**Stand up InstantID on a RunPod pod and render the locked `pen-flow` character at a *controlled* gaze** — condition each frame on (a) a **reference identity face** and (b) a **face-keypoint layout** (the gaze direction). This is the one fix for the two open failures below; it bakes identity at generation instead of pasting it, and sets gaze as an input instead of hoping the prompt does it. The discipline behind it is now canon: [[Steer the Generator]].

## Why this and not the obvious thing
Don't reach for a face-swap or a better gaze *prompt* — both were tried and failed this session. Identity and gaze are the *same* problem (a structure the prompt can't hold), and InstantID solves both at once because it conditions on a reference **and** face keypoints. The keypoints are BLUELINE's own staging vocabulary (the M1 oriented head / eyeline) — already the project's way to specify head direction.

## Negative space — do NOT re-explore (all ruled out this session)
- **Flow-warped noise at the render** — fully closed. Never beats plain seed-lock (single jump M3, swept M3.6, sequence M3.7). The flow field stays a *compositional/FX* spine (M2), not a render-noise trick. Reports in `proofs/m3-warped-noise/`.
- **Crystal-head via prompt** — dead on base SDXL (6 phrasings, all kept a human head + threw crystals into the scene). Revisit *only* via inpaint / FLUX-reference / a LoRA, not wording.
- **cv2 / landmark paste-swap** — looked **horrible** (compositing fights the ink; profiles/up-down can't 2D-rotate). Abandon post-hoc compositing; bake at generation.
- **Prompt-only gaze** — collapses to near-frontal (measured: asked L90→R60, got yaw ≈ −1..22°). Gaze must be *controlled* (keypoints).
- **FLUX for the house look** — "too perfect/vector." SDXL keeps the hand-drawn ink. (FLUX is still the right tool where *concept-adherence* matters, e.g. the crystal head — different job.)

## Current state (what's already true)
- **House style LOCKED**: `pen-flow` — verbatim recipe in `proofs/style-lock/locked-style.json`. Don't re-derive it.
- **Pose volume shipped**: 100 SDXL `pen-flow` action frames (`proofs/style-lock/sdxl-poses/`, gitignored).
- **Face-slot + token proven**: neutral placeholder + per-frame registration token (known direction + insightface landmarks, **6/6** detected incl. profile/up-down). `face_slot_test.py`.
- **The pod SDXL pipeline works**: `sdxl_orchestrator.py` (volume-free → any datacenter; create-retry; **always terminates**) + `sdxl_pose_render.py`. Reuses the hardened `m3_pod_render.Pod` transport.

## Next move, concretely
1. On the pod (start from `sdxl_orchestrator.py`'s pattern): install the InstantID ComfyUI node + models (InstantID ip-adapter + its ControlNet + the `antelopev2` insightface pack) via the `dockerStartCmd` (parallel-download trick — see the SDXL start-script: launch ComfyUI immediately, fetch models in the background, gate readiness on the model appearing; size-guard the downloads).
2. Inputs: one **reference identity** face (generate a `pen-flow` one, or use a chosen image) + **face-keypoint images** for the gaze range (front / 3q L+R / profile / up / down — drive from the staging head keypoints).
3. **Prove on the gaze range first** (one identity × the L90→R60 span) — clean, in-style, gaze-matched — *before* any volume. Verify gaze with the insightface pose token (the loop is already built in `gaze_range.py`).
4. Then scale across the pose library.

## Calibrations from this session (diverge from defaults)
- **Hand-drawn ink is paramount** — SDXL, not FLUX, for the look. Loudon picks *by eye*; show options, don't ask abstract questions.
- **Use gen-AI well = generate many, select** (intuition via the Taste Breeder, or a metric). Under-generating is under-using it.
- **Verify by measurement** (insightface pose/landmarks, embedding cosine) — not vibes.
- **Local MPS is memory-bound**: a second ComfyUI + full-res (832×1216) swaps the Mac to ~14% free → ~6 min/frame. Kill local `:8189` when idle; use 640–832 px + **the pod** for any volume.
- **Pod hygiene** (all in the orchestrators already): curl submit/upload **retries** (proxy SSL-resets the ~1.3 MB body), **create-retry** (EU-RO-1 capacity gaps), **volume-free** to dodge the shortage, and a `finally` that **always terminates** + an explicit `--terminate-only` safety.
- **Commit on the branch**; verify branch before+after (shared working tree switches branches).

## Receiving environment
- **Worktree**: branch `feature/blueline-m3` · `/Users/loudonstearns/Documents/palace-feature-blueline-m3` · profile `blueline`. (Recreate: `node _ops/worktree/new-worktree.mjs --name feature/blueline-m3 --profile blueline --memory`.)
- This branch is **not merged to main** — the whole `proofs/style-lock/` sidequest + the M3 arc live here. The canon deposit ([[Steer the Generator]]) is already on **main**.
- RunPod key: `RunPod Images/studio/config.json`. Comfy venv: `_tools/ComfyUI/venv/bin/python`.

## Load first (tiered)
- **T1**: `Projects/BLUELINE/BLUELINE.md` § Where it stands · `Steer the Generator.md` (on main) · `proofs/style-lock/locked-style.json` + `proofs/style-lock/README.md`
- **T2**: `proofs/style-lock/` — `face_slot_test.py`, `gaze_range.py`, `face_swap_demo.py` (why paste-swap was dropped), `sdxl_orchestrator.py` + `sdxl_pose_render.py`, `flux_orchestrator.py` (volume-free pattern)
- **T3 (orientation only)**: `Projects/BLUELINE/BLUELINE — Production Plan.md` (Tracks I–V; this sidequest = Track II identity/style + Track I GPU; Track V flow-field-at-render is closed) · `proofs/m3-warped-noise/m3*-report.md`
