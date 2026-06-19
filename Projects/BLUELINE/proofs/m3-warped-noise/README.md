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
  a coherent figure (0.709/0.373) **~level with seed-lock** but not beating it at the 482 px delta. Reading:
  noise-warp ties seed-lock at an extreme single jump; its win is in **small incremental** motion (GtF's
  regime). The bet ([[The Flow Field is the Spine]]) is intact for within-shot motion. **Next: M3.6 =
  small-delta / multi-step test.** Renders: `renders-gtf/`, local gate `local-sdxl/NW_gtf.png`.
