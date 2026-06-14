# BLUELINE Track IV — The Bench (report)

**Date:** 2026-06-14 · Mac-side Claude Code · [[BLUELINE — Production Plan]] Track IV, first move.
**Question:** does the proven single-pose keystone (Session 1) scale into a reusable, hand-tunable
**vocabulary** — a pose library + camera-grammar solvers — without losing register-clean conditioning?

## What was built

`bench.py` grows Session 1's one-off geometric emission into two reusable pieces, and wires them to
the converged board record:

1. **A pose library** — named COCO-18 held poses (`sword_draw_lunge` from S1, plus `defiant_stand`
   and `overhead_strike`). Each is a joint table; adding a pose is one dict.
2. **Camera-grammar solvers** — `worms_eye`, `low_hero`, `ots` as **declarative constraint solvers**,
   not typed coordinates: each names an offset direction + lens + an on-screen-layout intent, and a
   shared `fit_camera()` auto-pushes the camera along the view ray until the figure fills ~82% of frame
   (the size constraint). This is the [[Declarative Camera Control]] idea made concrete — "OTS" is a
   *solved* camera, not a hand-placed one.
3. **Board-record emission** — each shot (pose × grammar) emits registered passes (geometric OpenPose,
   Blender depth, Blender normal, RGB, canny EDGE) **and writes a board record** in the converged
   [[BLUELINE — Board Record Schema]] format, carrying `CAMERA_GRAMMAR` + `FLAGGED`.

## Proof — three shots, each a complete board

`renders/CONTACT-SHEET-bench.png` (rgb / openpose / depth / canny per shot):

| Shot | Pose × grammar | Reads |
|---|---|---|
| **IV-A** | `sword_draw_lunge` × **worm's-eye** | low angle looking up; the lunge's drama survives; passes registered |
| **IV-B** | `defiant_stand` × **low-hero** | near-eye-level hero, raised fist; clean pose channel |
| **IV-C** | `overhead_strike` × **OTS** | back-3/4 of the overhead strike, subject facing away |

Each shot ships: `passes/IV-*_{rgb,openpose,depth,normal,canny}.png` + `*_keypoints.json`, a
hand-editable `blends/IV-*.blend`, and `boards/IV-*.board.txt`.

**Acceptance met:** the single-pose keystone scaled into a library + solvers that round-trip
register-clean passes into board records. Hand-editability holds — each `.blend` opens to the metaball
mannequin + the solved camera; re-pose by editing the joint table (or the armature, per S1) and re-run.

## Honest limits / gotchas

- **OTS is an approximation.** `grammar_ots` frames the figure centered from behind (back-3/4); a *true*
  shoulder-in-foreground OTS aims **past** the figure down-scene — which needs an **environment** to look
  into. Flagged: OTS gets its real solve once Track IV gains environment blocking (the S2 alley work is
  the seam). `worms_eye` and `low_hero` solve cleanly as-is.
- **No environment yet** — the bench emits the *figure's* control passes; `asset_kit` stays flagged in
  every board (the S2 SceneCraft alley is where environment blocking folds in).
- Greybox metaball mannequin (Sketch tier) — pose *reads* for conditioning, but isn't a finished mesh.

## Ships to the palace

The **pose/camera library** (`bench.py` + `post.py`) is reusable Shop/Blender machinery. Per
bundle-docs-before-skills, it's grown here in the BLUELINE proofs first; promote it into the
`Shop/Blender` bundle (extending [[Shop/Blender/toyxyz-conditioning-recipe]]) once the vocabulary is
stable across more shots. The camera-grammar solver is reusable for **any** character imagery, not just
BLUELINE.

## Next on this track

- Fold S2's SceneCraft environment blocking in → real OTS solve + `asset_kit` resolved.
- Grow the pose library (held extremes) + a worm's-eye/dutch/profile grammar set.
- Wire a board's passes through the Track I RunPod backend (needs the endpoint) → the first
  fully-resolved board rendered.
