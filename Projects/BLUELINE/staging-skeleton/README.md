# BLUELINE — staging-skeleton

> **One skeleton.** Our author-facing staging frame (the shoulder–shoulder–pelvis triangle, the
> chest-facing tick, the L/R handedness) is a **pure function of canonical COCO-18 OpenPose keypoints** —
> and the emit to the render is canonical OpenPose, untouched. This is Build #1 of the Seam-A/Seam-B
> unification: it makes "author the staging vocabulary" and "condition the render" the *same act*.

## The observation this answers

OpenPose draws the torso as a **neck-HUB**: the neck is the apex and four limbs radiate down to the
shoulders and hips, so the torso "points up" to the neck. Our staging frame is a **shoulder–shoulder–
pelvis triangle** — the shoulder line is the wide base on top, converging to a pelvis apex below, so it
"points down" ▽. **Same points, opposite apex.** They are not two skeletons to keep in sync; they are two
*renderings* of one set of keypoints, for two audiences:

- **the ControlNet** reads the canonical neck-hub limbs (`OPENPOSE_LIMBS` / `OPENPOSE_COLORS`);
- **the author** reads the triangle + tick + L/R.

## The one rule: derive affordances, never invent keypoints

The module exposes both faces of one skeleton:

- `OPENPOSE_LIMBS`, `OPENPOSE_COLORS` — the canonical emit. **Send this to the render untouched.**
- `staging_frame(kp, facing)` — the derived author view: `triangle` (R-sho, L-sho, pelvis), `facing_tick`
  (the chest normal, image space), `head` + `head_facing`, and `lr` (which keypoints are char-R/char-L).

Every author-facing affordance is **computed from the canonical points**. We never add a keypoint the
ControlNet wasn't trained on — that is exactly what would corrupt the conditioning. The pelvis apex is the
only point COCO-18 lacks (it has no mid-hip), so we **derive** it as `midpoint(R_hip, L_hip)` and mark it
`pelvis_derived: true`.

## The COCO-18 vs BODY_25 decision

COCO-18 (BODY_18 — neck=1, 18 points, **no mid-hip, no feet**) is what the SDXL/FLUX OpenPose ControlNets
most likely expect. BODY_25 adds a native mid-hip and feet — which our pelvis apex and the proposed
foot-contact field would both like. **Decision: stay COCO-18, derive the mid-hip as an affordance.** Match
whatever the chosen ControlNet's preprocessor actually emits; never get ahead of it. Revisit BODY_25 only
after confirming the ControlNet was trained on that rendering (and if foot-contact precision becomes
load-bearing). The whole module is written so a later switch is localized to `IDX` + the pelvis derivation.

## `facing` — authored vs estimated

`facing` (chest yaw, −1 screen-L … 0 camera … +1 screen-R) is **authored** by the animatic / board record
and is authoritative; the 3D bench confirms it. `facing_from_keypoints(kp)` is a rough **estimate** for the
Seam-A fidelity diff (Build #2) only — 2D carries a front/back ambiguity (a back-facing chest reads like a
front one), so it is never used for authoring. It is mannequin-calibrated via `FRONT_SHOULDER_RATIO`.

## Files

| File | What |
|---|---|
| `staging_skeleton.py` | Python reference (the bench / Blender post side). Pure, no deps. `--gen` writes the fixtures. |
| `staging_skeleton.js` | JS mirror (the comic renderer side). UMD-lite → `window.StagingSkeleton` in a browser, `require()` in Node. |
| `staging-skeleton.fixtures.json` | Golden vectors (3 sample poses → expected frames + facing estimates). The cross-language contract. |
| `test_staging_skeleton.py` / `.js` | Parity tests. Both must reproduce the fixtures (numeric-tolerant). **PY PASS / JS PASS, 0 mismatch.** |
| `skeleton-demo.html` | Visual proof — canonical OpenPose ↔ staging frame, side by side, from one keypoint set. |

## How each consumer adopts it (the integration recipe)

This module is the **single source**; the consumers stop hardcoding their own copies.

- **The bench / gallery (Python):** replace the local `LIMBS` in `gallery.py`/`bench.py` and the `COLORS`
  in `post.py` with `from staging_skeleton import OPENPOSE_LIMBS, OPENPOSE_COLORS`, and use
  `staging_frame(kp, facing)` when a board record needs its triangle/tick/L-R derived. (Non-breaking; the
  values are identical to what they hardcode today — that is why the gallery already matches.)
- **The comic renderer (JS, M2 player):** ✅ **wired (2026-06-18).** `m2-motion-comic.html` loads
  `staging_skeleton.js` (symlinked into the folder), bridges its pose chains → canonical COCO-18 via
  `poseKeypoints()`, and derives its `torsoFrame` (the ▽ triangle + chest tick) and `extremityTags` L/R
  from `StagingSkeleton.stagingFrame(kp, facing)` / `lrSide()` instead of bespoke per-pose math. The head's
  *gaze* stays authored (the comic authors the eyeline; the bench derives it — same board-record field).
  Verified in-browser: 8/8 poses render, 0 errors, visual unchanged.

The comic preview and the Blender layout now provably speak one skeleton — the precondition that **Build #2**
(the animatic→Blender round-trip) relied on, now satisfied on the *live* comic side too.

## Run

```
python staging_skeleton.py --gen        # (re)generate fixtures after a change
python test_staging_skeleton.py         # Python regression guard
node   test_staging_skeleton.js         # JS cross-language parity
# open skeleton-demo.html               # the side-by-side visual
```
