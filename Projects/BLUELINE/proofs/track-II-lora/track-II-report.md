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

## Done — trained + graded (2026-06-16)

Trained on an SSH pod (ai-toolkit FLUX LoRA, trigger `r4ng3r`, rank 16, ~1200 steps) plus an SDXL/kohya
LoRA in parallel. Rendered `r4ng3r` across **4 new scenes × 4 different seeds** at Study tier, each with a
no-LoRA **baseline** (the detailed text description alone), plus a **DreamBooth control** (a known-easy
subject) to test the pipeline independently of the ranger. Graded with the **v2 ruler** — DINOv2 subject
fidelity · CLIP-T context adherence · ArcFace face identity · HSV color — the DreamBooth-standard metrics
that fix v1's ResNet/whole-image confound. Scores: `grade/grade-v2-scores.txt` + `dbgrade/db-dino-scores.txt`;
contact sheets alongside.

## The verdict — the LoRA *failed* its purpose; the pipeline is sound (honest negative result)

| set (4 seeds) | DINO ↑ | ArcFace ↑ | face% | CLIP-T | read |
|---|---|---|---|---|---|
| FLUX + LoRA | 0.317 | 0.110 | 75% | 0.290 | identity **worse** than baseline |
| FLUX baseline (text only) | **0.475** | **0.376** | 100% | 0.250 | the stronger identity anchor |
| SDXL + LoRA | 0.203 | 0.101 | 75% | 0.324 | same pattern |
| SDXL baseline (text only) | **0.490** | 0.175 | 100% | 0.281 | — |

The LoRA scored **below its own no-LoRA baseline on every identity metric** (FLUX DINO 0.317 vs 0.475;
ArcFace 0.110 vs 0.376; face detection 100% → 75%). Visually (`grade/CONTACT-grade.png`) the baseline rows
are a consistent freckled auburn-braided ranger; the LoRA rows are hooded silhouettes, hidden faces, and
one off-character horned figure. **The detailed text description alone held the character better than the
LoRA trained on it.**

**Why it's not the pipeline — the DreamBooth control (`dbgrade/`):** on an easy subject the *same*
train→render→score pipeline delivered the textbook win — **dog LoRA DINO 0.776 vs baseline 0.422, lift
+0.35 → PIPELINE OK ✓** (visually, one consistent corgi across all four contexts vs four random dogs). The
machinery works; the r4ng3r failure is **the dataset, not the pipeline.**

**Diagnosis:** the character set was built from *dramatic full-body* poses (guard / reach / walk / crouch /
hero-turn) that often put the hood up and the face small, turned, or distant. The LoRA learned a
**costume-silhouette, not a face** — exactly why ArcFace cratered, face% fell, and renders pulled toward
"hooded figure in green" instead of the brief. The dog control used close, face-forward framing and locked
cleanly. The ceiling is reachable; this dataset aimed the LoRA at the wrong signal.

**Metric note:** the old "bar to beat" (Track V's `embed 0.82`) was in the **deprecated v1 ResNet/whole-image
ruler**, which conflates scene with identity — not comparable to these DINO/ArcFace numbers. The v2 ruler
supersedes it, and it just earned its keep: it caught a LoRA that *looked* plausible but *measurably
degraded* identity. Numbers over vibes, as designed.

**Next (the fix the control points to):** rebuild the character set with **face-forward, identity-bearing
framing** (close + frontal, hood down) — and/or face-region-weighted training, higher rank/steps — then
re-grade against the v2 ruler. Do not re-run the dramatic-pose dataset expecting a different number.

## Ships to the palace

- `poseset.py` / `draw_poses.py` — the character-sheet pose generator (reusable).
- The dataset-generation method (shared-seed + pose library → consistent character set, embed 0.93) — a
  BLUELINE capability for *any* character. **Lesson banked:** frame for the face when the goal is a LoRA.
- **`grade_score_v2.py` — the v2 measurement ruler** (DINO + CLIP-T + ArcFace + color): the palace-wide
  identity / context / style metric, validated here by catching a bad LoRA *and* confirming a good one.
- The training kit (`train_flux_lora.yaml` + `TRAIN.md`) — **pipeline proven** (DreamBooth control +0.35);
  reusable for any future character, given a face-forward dataset.
