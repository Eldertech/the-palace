# BLUELINE M3 — flow-warped noise vs seed-lock (report)

**Date:** 2026-06-18 · Mac-side Claude Code (feature/blueline-m3 worktree) · [[BLUELINE — Production Plan]]
M3 / the coherence stack's **step 4** ([[The Flow Field is the Spine]] reaching the render — the #1 bet).
**Question:** at a **large** pose delta (where Track V's seed-lock is expected to break), does **flow-warped
noise** — warping the FLUX latent noise from frame A to frame B *along the motion* — hold the look
**better** than seed-lock? Track V proved seed-lock holds a *small* delta (palette 0.94 vs 0.17); M3 asks
the large-delta question. Loudon greenlit the RunPod spend.

## What ran

A **large-delta board pair**, A = `coil` (compact, low) → B = `leap` (extended, arms up) — A→B keypoint
displacement **482 px** (genuinely large; `pair.py`, one shared camera). Three FLUX-ControlNet-OpenPose
renders, **same prompt + same render params**, the only variables being pose (A vs B) and the injected
initial latent noise:

| render | initial noise | pose |
|---|---|---|
| **A** | `N_A` (seed 777) | A · coil |
| **B · seed-lock** (baseline) | `N_A` reused (Track V's lever) | B · leap |
| **B · warped** | `N_warped` = `N_A` warped A→B along the flow | B · leap |

The render plumbing — feeding an **external** noise tensor as the FLUX initial noise — was the one
unproven piece, and it is now proven end to end:

- **Local SDXL inject-check (free):** the `NoiseFromNPY` node feeding `SamplerCustomAdvanced` is
  deterministic (inject the same `.npy` with two *different* seed-widget values → **pixel-identical**
  render, 0.0000/255: the `.npy` drives it, the seed widget is inert) and the warp changes the render
  (inject-warped → 57.7/255). The base64 transport renders **pixel-identical** to the path transport.
- **Pod render:** the same node, the same `SamplerCustomAdvanced` / `BasicGuider` / `KSamplerSelect` /
  `BasicScheduler` chain, on a RunPod RTX 4090 with FLUX-ControlNet-Union (the Track I Phase B recipe);
  noise carried **inline as base64** in the workflow (no file transfer). A / B-seedlock / B-warped all
  rendered, retrieved, pod terminated. `renders/{A,B_seedlock,B_warped}.png`, `renders/m3-compare.png`.

## Result — an HONEST NEGATIVE: warped noise *lost* to seed-lock ❌

Scored by `render-backend/consistency_ruler.py` (CNN embed-cos, pose-invariant; + HSV color_corr):

| pair | `embed_cos` (semantic) | `color_corr` (palette) |
|---|---|---|
| **A vs B · seed-lock** | **0.744** | **0.380** |
| **A vs B · warped** | 0.508 | 0.016 |
| Track V seed-lock (small delta, for scale) | 0.880 | 0.935 |

**The warp did not hold the look — it destroyed it.** B-warped is not a "moved" version of A; it is
**incoherent rainbow striping** — no figure, no scene (`renders/B_warped.png`). B-seed-lock, by contrast,
is a **coherent, palette-consistent** figure in the same teal/amber misty register as A, posed to the leap
skeleton — degraded from Track V's small-delta hold (0.74/0.38 vs 0.88/0.94, exactly the graceful decay
Track V predicted at large deltas) but a *real picture*.

## Why — the naive warp breaks the white-noise prior

The warp here is **backward-warp + global renormalize** (`warp_demo.py`: map each latent cell from
`A` along the dense A→B flow, then rescale to mean 0 / std 1). That fixes the *global* statistics — `N_warped`
is verifiably ~N(0,1) — but it does **not** preserve the **spatial whiteness** the diffusion prior requires.
A large, heavily-smoothed flow (max disp ~60 latent cells) maps many output cells from a compressed input
region, injecting strong local correlation / repetition; renormalization cannot remove it. The sampler
reads that correlated field as off-manifold and renders it as the rainbow barcode. The **same failure
reproduced on local SDXL** (warped → identical rainbow artifact), so this is the **warp method, not a
transport or pod bug** (the inject path is pixel-verified).

This is precisely the problem [[Go-with-the-Flow]] exists to solve: its contribution is a noise-warping
that keeps the warped field **white** (Gaussian, uncorrelated), not merely mean-0/std-1. A generic image
warp + renorm is the wrong tool. And a **single 482 px jump** is the worst case — GtF warps across *small
incremental* video steps, never one large staged leap.

## What it means for the bet ([[The Flow Field is the Spine]])

The #1 bet is **not disproven** — it is **untested at the render**, because the implementation tested was
the wrong noise-warp. What M3 establishes, cheaply and honestly:

1. **Seed-lock degrades gracefully** at a large delta (coherent figure, palette in-family) — it remains
   the dependable floor of the coherence stack even past its comfort zone.
2. **Naive flow-warped noise fails** at a large staged delta — worse than doing nothing. The flow-field
   spine cannot move the *noise* at the render via a generic warp.
3. The next rung is specific: **whiteness-preserving noise warping** (GtF's actual algorithm — e.g.
   noise-resampling that maintains the Gaussian field under advection), and **incremental** warping along
   the clock (many small steps), not one comic-panel jump. Until then, large staged jumps lean on the
   *other* coherence levers (identity model / depth / img2img), not noise-warping.

This also sharpens "**staged, not simulated**": a large comic→comic pose jump is too far to bridge by
warping noise; coherence across big staged deltas is a *different* mechanism than coherence across small
simulated increments.

## Ships to the palace

- **The noise-injection capability (proven):** `comfy_inject_node.py` (`NoiseFromNPY`, path **and** inline
  base64 transports) + `flux-controlnet-openpose-inject.workflow.json` (the seed `KSampler` swapped for the
  `NoiseFromNPY → BasicGuider/KSamplerSelect/BasicScheduler/SamplerCustomAdvanced` chain). Any future rung
  that needs to control FLUX's initial noise now has a verified, pod-portable path.
- **Transport gotcha (Track-I-class):** the RunPod proxy WAF **broke** `urllib`'s POST of the ~1.3 MB
  inline-noise `/prompt` body (broken pipe mid-send); routing `/prompt` through **curl** (`--data-binary`,
  browser-UA) — the same hardening the upload path already used — beats it. `m3_pod_render.py` now submits
  via curl.
- **The finding** → refines [[The Flow Field is the Spine]] and feeds the M4/M5 coherence work: noise-warp
  is real R&D, needs the whiteness-preserving algorithm + incremental application, not a generic warp.
- `m3_pod_orchestrator.py` — create → readiness-gate (ComfyUI + node + CN) → render → **always terminate**.

## Cost

Two RTX 4090 pod sessions (the first aborted at the `urllib` `/prompt` break, before any render; the second
rendered all three). ~15 min of 4090 time total ≈ **~$0.18** — within the greenlit ~$0.30.

## Status

Inject path: **proven** (local SDXL + pod FLUX). M3 thesis (warp beats seed-lock at a large delta):
**not yet** — the naive warp fails; the real test awaits a whiteness-preserving, incremental noise-warp.
Honest negative recorded, like Track II's — the rung shipped a verified capability and a sharp next question.
