# BLUELINE Seam A — animatic→Blender round-trip (report)

**Date:** 2026-06-17 · `feature/blueline-live-loop` · the test for **the transition itself** (2D animatic →
3D Blender layout → reproject to 2D), built on the [[staging-skeleton]] unification (Build #1).
**Question:** when we move a shot from the animatic into Blender, does the **authored staging vocabulary**
(facing · shot-size · laterality · eyeline) **survive the trip**? And where it doesn't — what exactly is lost?

## The method

Each test shot is a tiny **board record**: a 3D pose × camera grammar (the realization, reusing the gallery
rig) **plus the staging the animatic authored** (facing, eyeline target, shot-size). `roundtrip.py`
realizes it in Blender and **reprojects** the canonical COCO-18 keypoints to screen (the "back to 2D" leg).
`roundtrip_diff.py` then derives the staging frame with the **shared skeleton module** and diffs the
**realized** staging against the **authored** one. *Same board record, two registers; the disagreement is
the Seam-A loss.* The viewer (`roundtrip.html`) draws the authored facing tick (amber) and the read-back
tick (coral) over the reprojected skeleton — when facing survives, the two ticks coincide.

## Result — 11 PASS / 3 WARN / 6 FAIL across 20 scored dimensions

| Shot | facing | shot-size | laterality | eyeline |
|---|---|---|---|---|
| R01 lunge × worms-eye | PASS Δ0.15 | WARN (fill .41 / MS) | WARN (1 cross) | FAIL (164°) |
| R02 punch-at-cam × hero-push | **PASS Δ0** | FAIL (fill .55 / CU) | PASS | PASS (8.7°) |
| R03 spin-slash × dutch | WARN Δ0.30 | PASS | PASS | FAIL (96°) |
| R04 overhead × profile | **PASS Δ0.03** | PASS | PASS (cross expected) | FAIL (101°) |
| R05 high-kick × hero-push | PASS Δ0.10 | FAIL (fill .37 / CU) | PASS | FAIL (179°) |

## What survives the trip — and what doesn't

**Facing SURVIVES (the win).** The read-back facing tracks the authored facing on every shot — most
strikingly R04, a *profile* (authored 0.9) that read back within Δ0.03. The chest-yaw staging vocabulary
makes the 2D→3D→2D round-trip faithfully. This is the load-bearing result: the thing the whole pipeline
hangs on (blocking dictates facing) does not leak across Seam A.

**Shot-size does NOT survive — the concrete fix is clear.** The camera grammars `fit_camera` to ~0.82 of
the figure's *full bounding box* and ignore an authored CU/MS/WIDE; off-frame keypoint loss compounds it
(R02/R05 authored CU landed at fill .55/.37 → FAIL). **Fix: add a `shot_size` parameter to the grammar
solver** — CU should crop to the head/chest band, not fit the whole figure — and write the achieved band
back into the board record. This is the single highest-value Seam-A follow-up the test surfaced.

**Laterality mostly survives.** Crossings appear only where the *pose itself* crosses (R01's lunge reaches
an arm across; R04's single crossing is expected because it faces away). Because the skeleton **declares**
L/R rather than letting an estimator guess (Build #1), the labels are never wrong — the meter just flags
where the projection will challenge the downstream model.

**Eyeline can't be validated yet — and that's the finding.** The 3D bench poses set head *position* but do
not **aim** the head at a gaze target, so the head-yaw vector is undefined/noisy (the metric reads large
angles for near-frontal heads). The animatic's M1 layer already solved this in 2D (the oriented head +
eyeline ray). **Fix: carry M1's oriented-head into the 3D bench** — aim the head keypoints (nose/eyes/ears)
at the board record's `EYELINE` target — then this dimension becomes measurable and the eyeline survives.

## Conclusion

The transition is now **testable** (this harness), and the most important staging dimension — **facing** —
**survives it cleanly**. The test converted two vague worries into two concrete, scoped bench tasks:

1. **A `shot_size` parameter on the camera grammars** (CU/MS/WIDE crop bands), written back into the record.
2. **Head-aim in the 3D bench** (point the head keypoints at the `EYELINE` target), carrying M1's
   oriented-head across Seam A.

Both write back into the [[BLUELINE — Board Record Schema|board record]], so the comic and the Blender
layout stay one source. Re-run after each to watch the FAILs turn green.

## Run it

```
/opt/homebrew/bin/blender --background --python roundtrip.py   # realize + reproject (writes roundtrip-realized.json)
python3 roundtrip_diff.py                                       # staging-fidelity verdicts (writes roundtrip-report.json)
# open roundtrip.html (served from this folder) for the side-by-side + authored-vs-read-back ticks
```
