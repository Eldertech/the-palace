# BLUELINE Track II — Character LoRA + Identity (report)

**Date:** 2026-06-14 · Mac-side Claude Code · [[BLUELINE — Production Plan]] Track II.
**Question:** can we lock a character's identity with a trained LoRA so it survives **across different
seeds** (and the base swap) — where Track V's seed-lock trick can't reach?

## Done this round — the dataset (the hard part) ✅

A character LoRA's quality is its dataset, and a *consistent* character dataset is exactly the
chicken-and-egg the LoRA is meant to solve. Solved it with the **shared-seed + pose-ControlNet** method
proven in Track V:

- `poseset.py` → 8 varied **character-sheet poses** (stand / 3-4 / guard / reach / walk / crouch /
  portrait / hero-turn) as geometric OpenPose skeletons (free, local Blender).
- Rendered the **same character** — *"a young woman ranger, freckled, auburn braid, weathered green
  hooded cloak over leather armor"* — across all 8 at **shared seed 333** on a RunPod FLUX-ControlNet
  pod (`pod_runner.py`). → `dataset/*.png` + trigger-word captions (`r4ng3r`).

**Graded by the ruler — it's a good training set:** `embed_cos` **0.93–0.94** across poses (the character
is consistent) while `color_corr` stays **low/varied** (backgrounds differ) — the ideal shape, so the
LoRA learns the *character*, not a fixed backdrop. Contact: `dataset/CONTACT-dataset.png`.

This also validates a reusable BLUELINE capability: **generate a consistent-identity dataset for any
character on demand**, from a one-line description + the pose library.

## Staged — the training run (next step, needs an SSH pod)

The training itself is set up and turnkey but not yet run, for one concrete reason: our render pods
expose only ComfyUI's HTTP API, and a trainer needs **shell access** (an SSH-enabled pod). The kit is
ready: `train_flux_lora.yaml` (ai-toolkit FLUX LoRA config, trigger `r4ng3r`, rank 16, ~1200 steps) and
`TRAIN.md` (the exact SSH-pod procedure + an SDXL/kohya fallback that needs no gated download). Estimated
~30–45 min on an A40/A100, ~$1–2.

**Honest scope note:** I terminated the dataset pod rather than bill an A100 I couldn't train on — the
training needs a differently-provisioned pod. The dataset (the genuinely hard, reusable artifact) is
banked; the training is a focused next run.

## The test it sets up (Track II's verdict, pending the LoRA)

Render `r4ng3r` in new poses with **different seeds each**, and grade with `consistency_ruler.py`. The
result is the LoRA's `embed_cos` across seeds vs the no-LoRA baseline. The bar to beat is **Track V's
independent-seed drift (embed 0.82 / color 0.17)** — if the LoRA holds identity across seeds where
seed-locking couldn't, that's the win, and it stacks under Track V's coherence stack as the
seed-independent identity rung.

## Ships to the palace

- `poseset.py` / `draw_poses.py` — the character-sheet pose generator (reusable).
- The dataset-generation method (shared-seed + pose library → consistent character set) — a BLUELINE
  capability for *any* character.
- The training kit (`train_flux_lora.yaml` + `TRAIN.md`) — turnkey once an SSH pod is up.
