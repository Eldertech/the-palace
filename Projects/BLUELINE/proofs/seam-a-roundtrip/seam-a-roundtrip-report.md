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

## Result — 17 PASS / 3 WARN / **0 FAIL**

Three passes: **11/3/6** (named the gaps) → **16/2/2** (shot-size + head-aim fixes) → **17/3/0** (the two
residual fixes below). No failures remain; the 3 WARNs are honest near-misses.

| Shot | facing | shot-size | laterality | eyeline |
|---|---|---|---|---|
| R01 lunge × worms-eye | PASS Δ0.15 | PASS .70 (MS) | PASS | PASS 22° |
| R02 punch-at-cam × hero-push | **PASS Δ0** | WARN .65 (CU) | **PASS** (depth-exempt) | PASS 2° |
| R03 spin-slash × dutch | WARN Δ0.30 | PASS .70 (MS) | PASS | PASS 13° |
| R04 overhead × profile | **PASS Δ0.08** | PASS .70 (MS) | PASS | PASS 26° |
| R05 high-kick × hero-push | PASS Δ0.10 | PASS .75 (CU) | PASS | **WARN 38°** |

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

## The two residual fixes (2026-06-18) — both FAILs cleared

**R02 laterality — depth-exempt foreshortened crossings.** A limb thrust toward camera (the fist-at-camera
punch) legitimately crosses the centerline *in projection* — but the **DEPTH** pass disambiguates it
(schema: NEAR/FAR rides DEPTH). `roundtrip.py` now emits per-keypoint camera depth, and the diff **exempts**
a crossing when the limb sits markedly forward of the torso (it is a depth effect, not an L/R swap). R02
laterality **FAIL → PASS**.

**R05 eyeline — the metric was wrong, the aim was right.** Instrumenting R05 showed the head *was* aiming at
the target (head-vector from the **ear-midpoint** pointed at it) — but the metric measured `target − nose`
while `head_facing` is anchored at the ear-midpoint. Mismatched origins gave a turned head a false ~144°.
Anchoring `to_target` at the ear-midpoint (head_facing's origin) fixed it: R05 eyeline **FAIL 117° → WARN
38°**, and the other four eyelines stayed/ improved (R01 22°, R02 2°, R03 13°, R04 26°). *No `aim_head`
change was needed* — the look-at was correct.

## What survives the trip now — and the three honest WARNs

- **Facing survives cleanly** — read-back tracks authored on every shot, even a profile (R04, 0.9 → Δ0.08).
- **Shot-size survives** — 4/5 in band; **R02 WARN .65** (the fist-at-camera lean foreshortens the
  head+shoulders span a touch under the CU band — close).
- **Eyeline survives** — 4/5 PASS; **R05 WARN 38°** (high-kick in an extreme CU, just over the 35° line).
- **Laterality holds** — declared L/R, with forward-limb crossings depth-exempted.
- **R03 facing WARN Δ0.30** — the dutch-tilted spin wobbles the 2D facing estimate (authoring stays
  authoritative; the estimate is for the diff only).

The three WARNs are genuine near-misses on the hardest shots (a foreshortened punch, a dutch spin, an
extreme high-kick CU), not failures — and each names a *staging* decision, not an engineering gap.

## Conclusion

The transition is **testable**, and the authored staging vocabulary **survives it** — facing (clean),
shot-size (honored), eyeline (delivered), laterality (declared) — with **0 failures**. The harness did its
job three times: named the gaps, closed them, then cleared the last two (one a real depth-aware fix, one a
metric correction that revealed the aim had been right). Re-run after any rig change and watch the board.

## Run it

```
/opt/homebrew/bin/blender --background --python roundtrip.py   # realize + reproject (-> roundtrip-realized.json)
python3 roundtrip_diff.py                                       # staging-fidelity verdicts (-> roundtrip-report.json)
# open roundtrip.html for the side-by-side + authored-vs-read-back facing ticks
```
