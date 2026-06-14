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

## Environment extension — IV-D (2026-06-14, closes the OTS flag)

`bench_env.py` folds the S2 alley into the bench and adds the missing piece:

- **An environment library** — `alley_urban` (the S2 procedural alley → vanishing point), built into
  the scene with the figure.
- **`grammar_ots_env` — the TRUE OTS solve.** Camera behind+above the near shoulder, aimed **past** the
  figure to the environment's vanishing point. The shoulder occupies the foreground; the alley recedes.
  This is the real over-the-shoulder the `grammar_ots` note said "needs an environment to look into."

**IV-D** (`run_sword_drawn × ots_env × alley_urban`) ships as a complete board record with **all passes
including the environment**: `renders/CONTACT-SHEET-bench-IV-D.png` shows the figure foreground-left over
the shoulder, the alley receding, and — crucially — **depth now carries the recession** (figure white/near,
alley darkening to the vanishing point), not just the figure. `boards/IV-D.board.txt` adds a `LOCATION`
field (`ALLEY_URBAN`) and downgrades `asset_kit` to "greybox alley, real kit later." The S2 seam is closed:
staging (S2) and the bench (IV) now meet in one board record — pose × camera-grammar × environment.

Honest note: the geometric OpenPose skeleton for a back-facing, foreshortened foreground figure is sparse
(several keypoints project off-frame) — correct and exact, but depth + canny carry more of IV-D's
conditioning than pose does. That's the right balance for an OTS-into-environment shot.

## Next on this track

- ~~Fold S2's SceneCraft environment blocking in → real OTS solve~~ — **done (IV-D above).** `asset_kit`
  now reads "greybox, real kit later"; the real KitBash3D/Poly Haven import is the production upgrade.
- Grow the pose library (held extremes) + a worm's-eye/dutch/profile grammar set; add more environments.
- Wire a board's passes through the Track I RunPod backend (needs the endpoint) → the first
  fully-resolved board rendered.
