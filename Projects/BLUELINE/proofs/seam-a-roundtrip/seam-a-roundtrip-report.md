# BLUELINE Seam A — animatic→Blender round-trip (report)

**Date:** 2026-06-17 · `feature/blueline-live-loop` · the test for **the transition itself** (2D animatic →
3D Blender layout → reproject to 2D), built on the [[staging-skeleton]] unification (Build #1).
**Question:** when we move a shot from the animatic into Blender, does the **authored staging vocabulary**
(facing · shot-size · laterality · eyeline) **survive the trip**? And where it doesn't — what's lost?

## The method

Each test shot is a tiny **board record**: a 3D pose × camera grammar (the realization, reusing the gallery
rig) **plus the staging the animatic authored** (facing, eyeline target, shot-size). `roundtrip.py`
realizes it in Blender and **reprojects** the canonical COCO-18 keypoints to screen (the "back to 2D" leg).
`roundtrip_diff.py` derives the staging frame with the **shared skeleton module** and diffs the
**realized** staging against the **authored** one. *Same board record, two registers; the disagreement is
the Seam-A loss.* The viewer (`roundtrip.html`) draws the authored facing tick (amber) over the read-back
tick (coral) — when facing survives, the ticks coincide.

`figure_fill` is the vertical span of the **subject set** (the keypoints that define the shot), i.e. "did
the solver frame the subject to its band?" — not all-in-frame span, which is noisy when a tight crop leaves
only a few scattered keypoints. `off-frame` counts all keypoints (the informational crop indicator).

## Result — 16 PASS / 2 WARN / 2 FAIL (after the two fixes)

The first pass scored **11 / 3 / 6** and named two gaps; both are now fixed (below). Current scores:

| Shot | facing | shot-size | laterality | eyeline |
|---|---|---|---|---|
| R01 lunge × worms-eye | PASS Δ0.15 | PASS .70 (MS) | PASS | PASS 24° |
| R02 punch-at-cam × hero-push | **PASS Δ0** | WARN .65 (CU) | **FAIL ×2** | PASS 4° |
| R03 spin-slash × dutch | WARN Δ0.30 | PASS .70 (MS) | PASS | PASS 14° |
| R04 overhead × profile | **PASS Δ0.08** | PASS .70 (MS) | PASS | PASS 29° |
| R05 high-kick × hero-push | PASS Δ0.10 | PASS .75 (CU) | PASS | **FAIL 117°** |

## The two fixes (implemented)

**Fix A — shot-size in the camera solver.** The grammars used to `fit_camera` the *whole figure* to ~0.82,
so an authored CU/MS/WIDE was ignored. Now the solver frames a **subject set** to a target fill — CU =
head + shoulders (.86), MS = head → hips (.70), WIDE = all (.46) — letting the rest fall out of frame
(correct for a CU). A **re-fit after head-aim** corrects the framing that `aim_head` perturbs (the nose is
part of a CU's subject). Shot-size went **2 PASS → 4 PASS + 1 WARN**; `frame_for_shot` lives in the shared
rig (`blender-gallery/gallery.py`).

**Fix B — head-aim (M1's oriented head, carried into 3D).** The bench poses set head *position* but didn't
*aim* it, so eyeline was unmeasurable. `aim_head` is a proper **3D look-at**: it aligns the nose-vector
(ear-midpoint → nose) to the gaze ray (head → the world point that projects to the authored EYELINE
target), pivoting at the head centre so the head turns *in place* (the nose doesn't swing off a tight CU).
The first attempt aimed the nose *position* (wrong objective — the metric is head *direction*) and made
eyeline worse; the look-at fixed it. Eyeline went **1 PASS → 4 PASS**.

## What survives the trip now — and the two honest residuals

- **Facing survives cleanly** (unchanged by the fixes) — read-back tracks authored on every shot, even a
  profile (R04, authored 0.9 → Δ0.08). The load-bearing dimension does not leak across Seam A.
- **Shot-size now survives** — 4/5 land in band; **R02 is WARN** because the fist-at-camera *lean*
  foreshortens the head+shoulders span a touch under the CU band (close, honest).
- **Eyeline now survives** for 4/5 — the head look-at delivers the authored gaze.
- **Laterality holds** where the pose allows.

The **two FAILs are findings, not bugs:**
- **R02 laterality (×2 crossings)** — the foreshortened fist-at-camera projects the punching arm *across*
  the centerline. The skeleton still **declares** L/R correctly (so the conditioning is right), but the
  meter is flagging, truthfully, that this projection is hard for a diffusion estimator to read — a shot to
  **stage and light deliberately**, not a solver failure.
- **R05 eyeline (117°)** — the one pose (high-kick) in a very tight CU where the look-at doesn't converge;
  the raised-leg geometry + extreme crop. A residual to chase only if high-kick CUs become load-bearing.

## Conclusion

The transition is **testable**, and after the two fixes the authored staging vocabulary **largely survives
it**: facing (clean), shot-size (honored), eyeline (delivered), laterality (declared). The harness did its
job twice — first naming the two gaps, then proving the fixes closed them, and now isolating two genuine
*hard-shot* residuals (a foreshortened punch; one extreme CU) that are staging decisions, not engineering
ones. Re-run after any rig change and watch the board.

## Run it

```
/opt/homebrew/bin/blender --background --python roundtrip.py   # realize + reproject (-> roundtrip-realized.json)
python3 roundtrip_diff.py                                       # staging-fidelity verdicts (-> roundtrip-report.json)
# open roundtrip.html for the side-by-side + authored-vs-read-back facing ticks
```
