# BLUELINE M3 — flow-warped noise vs seed-lock (Path B)

> **The question.** Track V proved seed-locking holds a character across a *small* pose delta (run A↔B,
> palette 0.94 vs 0.17). The coherence stack's step 4 is **flow-warped noise**: warp the FLUX latent noise
> from frame A to frame B *along the motion* so the look survives a **large** delta, where seed-lock alone
> breaks. M3 tests exactly that — **does warped noise beat seed-lock when the pose delta is big?** — in the
> image pipeline (Path B), keeping BLUELINE board-driven and "staged, not simulated" (Path A, a video model,
> was rejected as off-thesis).

## The design

A **large-delta board pair**, A = `coil` (compact, low) → B = `leap` (extended, tall) — chosen so seed-lock
should struggle. Three renders, same prompt + same FLUX-ControlNet conditioning per frame:

| render | initial noise | expectation |
|---|---|---|
| **A** | seed 777 → `N_A` | the anchor |
| **B · seed-lock** (baseline) | `N_A` reused (Track V's lever) | look drifts — the delta is too big for the shared latent |
| **B · warped** | `N_A` warped A→B along the flow (`N_warped`) | the look **holds** — the noise moved *with* the motion |

Verdict by `render-backend/consistency_ruler.py` (embed-cos + color-corr) on (A, B-seedlock) vs (A, B-warped).

## Local groundwork — DONE + verified (free, no pod)

- `pair.py` (Blender) → `passes/{A_coil,B_leap}_{rgb,depth,keypoints}` from one shared camera. The A→B
  delta is **482 px** (genuinely large).
- `warp_demo.py` (numpy/scipy) → the A→B dense flow (from keypoint displacements), and the FLUX-latent
  noise tensors: **`N_A.npy`** (seed 777) and **`N_warped.npy`** (warped + renormalised). Both stay
  **~N(0,1)** (mean ≈0, std ≈1.00 — GtF's renorm holds); they differ by 0.80 mean-abs (the warp moved the
  noise). `warp-proof.png` shows the warp carrying the motion. The warp = Session 3's backward-warp +
  renormalise, applied to the 16×152×104 FLUX latent.

## Pod render — the next step (the R&D crux + the spend)

1. `pair_post.py` (comfy venv) — draw the geometric OpenPose for A & B (reuse `gallery_post`).
2. **Inject the noise.** The crux: feed `N_A` / `N_warped` as the FLUX **initial latent noise** in a
   ComfyUI graph (extend `Shop/RunPod GPU Backend/flux-controlnet-openpose.workflow.json` with a latent /
   noise-injection input — a `LoadLatent` or custom-noise node). This is the one unproven piece; verify the
   injection on a fast local/SDXL render before the pod if it resists.
3. **RunPod pod** (Track I recipe: pod on the `blueline-models` volume that already holds FLUX-ControlNet
   Union; `pod-comfyui-client.py`) — render A, B-seedlock, B-warped; retrieve; terminate. ~$0.20–0.50.
4. `consistency_ruler.py` on both B-pairs → the number: does warped beat seed-lock at 482 px?

**Status: M3 DONE → M3.5 DONE.** See [`m3-report.md`](m3-report.md) then [`m3.5-report.md`](m3.5-report.md).

- **M3** ([`m3-report.md`](m3-report.md)) — inject path proven end to end (`NoiseFromNPY` →
  `SamplerCustomAdvanced`, deterministic, base64-inline). Honest negative: the **naive** warp (backward-warp
  + global renorm) collapses to **rainbow garbage** (0.508/0.016) because it breaks the spatial white-noise
  prior; seed-lock degrades gracefully (0.744/0.380). Renders: `renders/`.
- **M3.5** ([`m3.5-report.md`](m3.5-report.md)) — the **fix**: `warp_noise_gtf.py` (forward-splat +
  per-cell L2-normalize + disocclusion hole-fill — the HIWYN / [[Go-with-the-Flow]] core; nearest splat is
  as white as the base noise, lag-1 autocorr 0.001 vs naive 0.127). The rainbow is **gone** — B-warped is now
  a coherent figure (0.709/0.373) **~level with seed-lock** at the 483 px delta. Renders: `renders-gtf/`,
  local gate `local-sdxl/NW_gtf.png`.
- **M3.6** ([`m3.6-report.md`](m3.6-report.md)) — the **delta sweep** (48/96/169/290/483 px, seed-lock vs
  warped, one pod, 11 renders). **No crossover:** on `embed_cos` the two are tied at *every* delta (Δ within
  ±0.035, no trend); `color_corr` is noisy (warp wins at 96 px, loses at 169/290). Seed-lock is already
  near-ceiling at small deltas (0.92–0.96), leaving no headroom, and single-sample renders are
  variance-dominated. **Flow-warped noise does not beat seed-lock for a single staged jump at any size.** Its
  only surviving regime is a **cumulative multi-frame sequence** (drift compounds) — that's **M3.7**. Curve:
  `renders-sweep/m3.6-sweep.png`.
- **M3.7** ([`m3.7-report.md`](m3.7-report.md)) — the **cumulative-sequence** test (6-frame coil→leap;
  seed-lock vs per-step warped chain; one pod). **Seed-lock wins** on adjacent-frame coherence: embed 0.858 vs
  0.809 (Δ −0.049), color +0.596 vs +0.476 — the chain wanders (`renders-seq/m3.7-filmstrip.png` + GIFs).
  **The render-noise bet is CLOSED:** flow-warped noise never beats seed-lock in *any* regime (single jump or
  sequence). [[The Flow Field is the Spine]]'s "move the noise at the render" is retired; the field stays the
  compositional/FX spine (M2). Panel-render coherence = seed-lock + pose ControlNet + identity + depth + img2img.
- **M4** ([`m4-report.md`](m4-report.md)) — **hyperreal-impact reconnaissance**: comic↔hyperreal pair (same
  pose + `N_A`, two style prompts), boards A & B. Identity across the style jump = **0.72 mean embed_cos ≥ 0.60
  target**, with *no* identity model (`color_corr ≈ 0`, expected — palette flips). Montage `renders-m4/m4-pairs.png`.
  The "same face in two registers" risk is **tractable**; full M4 gated on Track II (style LoRA for crisp comic
  ink + PuLID for rigorous face-hold), not on a new unknown.
