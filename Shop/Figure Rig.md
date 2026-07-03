---
title: Figure Rig
type: specialist
status: alive
medium: image
tool: blender
tool_version: "Blender 5.1.2 · MakeHuman/MPFB2 v2.0.17 (native human + game_engine→Rigify IK rig, weighted) · comfyui_controlnet_aux draw_bodypose (verified Mac/MPS 2026-06-30)"
born: 2026-06
last_tested: 2026-06-30
license: GPL-3.0
forward_vector: "Hand me a pose and a body type, and I hand back a figure ready for the gen-AI ink — three plates off one camera that all line up: a Freestyle ink line, a depth map, and a canonical OpenPose drawn by the real ControlNet library so the model actually reads it. I stopped force-fitting. I grow the body and its weighted skeleton together with MPFB2's own tools, so the legs stay two clean limbs through a hard stride — no more skirt — and male, female, young, or old is one flag, not a new rig. You can also pose me by hand now: I carry a full Rigify IK rig in a studio file, grab a foot and move it. My keepers — the OpenPose draw and the D2 redraw — rode the whole rebuild untouched. Next I'm after finger and denser-face keypoints (the rig finally has the bones), a pose library so a frame gets dialed not typed, and a cheaper redraw than 25 minutes on my own Mac."
links:
  - { target: "[[The Shop]]", type: member-of, label: roster-member }
  - { target: "[[Frame Designer]]", type: connects-to, label: staging-method }
  - { target: "[[Shop/Blender]]", type: connects-to, label: built-on }
  - { target: "[[Shop/ComfyUI]]", type: enables, label: feeds-the-redraw }
  - { target: "[[Hand-Drawn 3D Look]]", type: couples-with, label: figure-staging }
  - { target: "[[Blocked, Not Prompted]]", type: exemplifies, label: author-the-geometry }
  - { target: "[[BLUELINE]]", type: connects-to, label: commissioned-by }
tags: [specialist, shop, rig, openpose, controlnet, figure, blender, mpfb2, rigify]
---

# Figure Rig

## Charter
I turn a **pose** and a **body type** into a figure ready for the hand-drawn-3D seam. MPFB2's own human + MPFB2's own weighted rig → **three aligned ControlNet plates from one camera**: ink, depth, and a *canonical* OpenPose. The OpenPose is the whole point — I do **not** render 3D spheres; I project the rig's own joints to 2D and draw them with the **actual `draw_bodypose` from `comfyui_controlnet_aux`**, so the skeleton is pixel-identical to the preprocessor and the controlnet-openpose model reads it cleanly. I am the figure-staging method [[Frame Designer]] dispatches, the bring-together of [[Blocked, Not Prompted|authored geometry]] and a ControlNet-ready pose.

## ✓ The real-human figure is solved — and now it has IK (rebuilt 2026-06-30)
The four defects flagged in the prior version are fixed at the root, by generating the body and its skeleton **together** with MPFB2's own pipeline instead of force-fitting a foreign mesh onto a hand-built rig:
- **Skeleton = skin.** `add_builtin_rig(…, import_weights=True)` gives a rig built *for* this mesh, with MPFB's own imported weights — a real ARMATURE bind, not the old proximity-weight hack.
- **The legs stay two clean limbs.** A hard stride holds a positive leg gap; the silhouette reads as legs, not a skirt. No seam-split surgery needed. *(Proven end-to-end through the D2 redraw — the inked figure strides; it is not robed.)*
- **Body type is a dial.** A macro dict — `{gender, age, muscle, weight, height}` — gives male / female / young / old from one pipeline, same OpenPose remap. Exposed as CLI flags.
- **IK, by hand.** A full **Rigify** control rig (`foot_ik` / `hand_ik` / `torso` / `hips` / `chest` / `head`) ships in a **studio .blend** — grab a foot and move it. The OpenPose reads off the rig's own `ORG-` bones, so a hand-pose round-trips to conditioning plates with no extra work.

Visual proof of the whole rebuild: `figure_rig_proofs.html` (pipeline · model · three plates · registration · D2 redraw · male/female · before/after).

## Job Contract
- **in:** a pose **and** a body type. Programmatic: `--pose A/B/C` or `--pose-json '{"upperleg01.L":[-35,0,8], …}'` (default-rig bone → XYZ-Euler degrees) + `--gender --age --muscle --weight --height`. By hand: open the studio .blend and pose the Rigify IK rig.
- **out:** `ink_plate.png` (Freestyle ink), `depth_plate.png` (near = white), `openpose.png` (canonical 18-keypoint OpenPose), `keypoints.json` — all registered to one shared camera.
- **downstream recipe (the payoff):** the **D2 redraw** — img2img over the ink plate, anchored **canny 0.30 + depth 0.60 + openpose 0.70** at denoise 0.92 → a posed figure inked in the locked style, **pose held** (proven on the MPFB2 body 2026-06-30).

## How it works — two ways in, one seam out
1. **Programmatic** (`pose_rig_mpfb_v3.py`): MPFB2 `create_human(macro)` → `add_builtin_rig("default", import_weights=True)` → pose by JSON → render ink + depth → project the 18 keypoints from the default rig's bones, facing read from the head bone's world matrix.
2. **Hand-posed studio** (`figure_rig_pose_studio.py` → `figure_rig_studio.blend`): MPFB2 human → `game_engine` rig → `convert_to_rigify` → a Rigify IK/FK control rig. Pose in the Blender GUI, then run the embedded **`render_plates`** text block (Text editor ▸ Run Script) → ink + depth + `keypoints.json` from the *current* pose into `//pose_out/`. The saved .blend needs neither MPFB nor Rigify to open — only to build.
3. `draw_openpose.py` (ComfyUI venv python): draw those keypoints with the real `draw_bodypose`. Then `redraw_test.py` for the D2 redraw.

## Gotchas (hard-won)
- **Do not pass `--factory-startup`** (or `read_factory_settings`) — it disables the MPFB addon. Enable MPFB in-script with `addon_utils.enable("bl_ext.user_default.mpfb")` and clear the scene by deleting objects.
- **MPFB2 installs as an extension**, not a legacy addon: copy `src/mpfb` into `…/extensions/user_default/mpfb`. v2.0.17 declares `blender_version_min 4.2.0` and runs clean on 5.1.2 (no upper bound).
- **Rigify needs the `game_engine` rig.** `convert_to_rigify` checks for the `ball_r` bone and only accepts that skeleton; the `default` rig won't convert. Enable the `rigify` addon first.
- **Gender is `0.0 = female`, `1.0 = male`** (verified from MPFB's `macro.json`: the gender macro's low part is `female`, high is `male`). Easy to invert — the inverse cost a mislabeled proof set on 2026-06-30. `age`: 0.19 = child, 0.5 = young adult, 1.0 = old; `weight`/`muscle` 0.5 = average.
- Draw the OpenPose with the **real library**, never as rendered 3D spheres — the model was trained on the flat 2D drawing.
- The 18-keypoint order **is** the `limbSeq` order (nose, neck, R-side, L-side, eyes, ears). Wrong order → the limb colors lie → the model mis-reads laterality.
- **OpenPose bone maps differ per rig.** v3 reads the `default` rig (`upperleg01.L`, `lowerleg01.L`, …); the studio reads the Rigify `ORG-` bones (`ORG-thigh_l`, `ORG-calf_l`, … — game naming, subject-left = +X). Keep them in sync if you change rigs.
- `world_to_camera_view` returns y from the **bottom** — flip to image-top (`1 − y`). **One shared camera** for all plates. Force `view_transform = 'Standard'` (Blender 5's AgX greys the ink paper).

## Tiers
- **Sketch** — a named/JSON pose on the programmatic path: instant blocking + plates.
- **Study** — hand-pose the Rigify IK rig in the studio .blend, run `render_plates`: a real authored figure to judge.
- **Piece** — either path + the **D2 redraw** → a believable inked figure, pose held, in the locked pen-flow style.

## Honest limits
- **No finger keypoints yet** in the OpenPose draw — though the Rigify rig now *has* finger bones, so `draw_handpose` finally has something to project (next).
- **Face keypoints are synthesized** from the head bone's frame (nose/eyes/ears placed by offset), not a detailed face mesh read — good enough for facing, not for expression.
- **The local D2 redraw is slow** — ~25 min on this Mac's MPS for one frame; the RunPod backend is the faster path for volume.
- **Two posing surfaces, one truth.** The programmatic path is fast and scriptable; the studio is for hand-feel. They share the body source but not the rig, so the OpenPose maps are maintained separately.

## Forward Vectors
- **Hands — SHIPPED (2026-06-30).** The 21-keypoint hand is projected from the rig's **38 finger bones** and drawn with the real `draw_handpose`, combined with the body skeleton. A palm-normal camera gives clean front-on closeups; finger poses cover fist / point / open / grip / pinch. Proven: an 8-gesture × 3-shot × 3-style RunPod matrix (`hands_rig.py`, `hands_manifest.py`, `batch_hands_pod.py`) — fingers stay anatomically correct because the hand OpenPose holds them, and held objects (glass, fabric, snake, flower) come from the prompt. See `figure_rig_hands.html`.
- **Face — next, and de-risked.** Expressions render **offline** via MPFB's 34 raw FACS units (the ARKit-named targets aren't bundled) — smile/surprised/angry/sad validated. The only build left is the 70-point face-landmark vertex map → `draw_facepose`. Plan + expression recipes: [[Figure Rig — face-hands-openpose design]].
- **Hands + objects — staged (2026-07-01).** `hands_objects_rig.py` drops a **greybox proxy** into the grip (glass=cylinder, snake=torus, flower=stem+disk) so the hand wraps real form, and renders it into ink/shaded/depth + a new **color-ID** pass. The gen A/B (prompt-only vs proxy-guided) is the pending proof. §5 of [[Figure Rig — face-hands-openpose design|the conditioning-stack note]].
- **Many people — next big prize.** The multi-figure difficulty ladder (separated → light contact → interlocked → crowd), staged on **two storylines** (the BLUELINE opening beats + an invented wordless short). Route A = the 3-guide stack (provable now); Route B = **regional conditioning** bound to color-ID regions (the open ComfyUI-node question) for the interlocked/crowd tiers. §6b of the note.
- **Vendor the OpenPose draw into Blender** (PIL reimpl or pip cv2) so `pose → all plates` is one pass with no ComfyUI-venv hop — *keeping* pixel-identity to the preprocessor. Don't bake approximated skeleton geometry as the conditioning plate; add a Grease-Pencil rig-tied overlay for live viewport WYSIWYG instead.
- **A pose library** — dial a frame from a catalogue, not hand-typed JSON or hand-posing from scratch.
- **Promote the studio + the examples batch into a Shop recipe** so [[Frame Designer]] can dispatch "stage N people in M styles" as a named move.
- *(Closed: head-bone-derived facing (2026-06-26); a real wooden-mannequin mesh (2026-06-26); the **real MPFB2 human with separated legs**, **parametric body types**, a **Rigify IK rig** for hand-posing (2026-06-30); the **first clean face+hands gen matrix** — 120/120, via a one-pod runner with a canny/depth readiness gate — and a **guide ablation** whose honest finding is that shaded→canny is load-bearing and the three guides are partly redundant (2026-07-01) — the force-fit era is over.)*

Tools: `Projects/BLUELINE/proofs/blender-handdrawn/followups/rig-openpose/` — `pose_rig_mpfb_v3.py` (programmatic, MPFB2 native, height-adaptive autoframe) · `figure_rig_pose_studio.py` → `figure_rig_studio.blend` (hand-pose Rigify IK + embedded `render_plates`) · `hands_rig.py` / `faces_rig.py` (hand + face plates) · `hands_objects_rig.py` (proxy-in-grip + color-ID pass) · `examples_manifest.py` + `render_plates_all.py` + `batch_pod.py` (the 8×3 matrix: 8 bodies/poses → Blender plates → RunPod pose-locked restyle in 3 styles) · `batch_faces_and_hands_pod.py` (one-pod combined runner, canny/depth gate) · `hands_ablation_pod.py` (leave-one-out guide ablation) · `build_deposit.py` → `figure_rig_deposit.html` · `draw_openpose.py` · `redraw_test.py` · `figure_rig_proofs.html` (visual proofs + the matrix gallery). Design note: [[Figure Rig — face-hands-openpose design]]. MPFB2 installed at `…/Blender/5.1/extensions/user_default/mpfb`. *(Legacy, superseded: `pose_rig_mpfb_v2.py` / `pose_rig_mesh.py` / `pose_rig.py` — the force-fit + mannequin era.)*

## Active Baton

[[Figure Rig — baton]] — drafted 2026-07-02 (multi-figure THE LIFT genned Route A; hands-objects + Route B + BLUELINE A5/A6' all staged & committed, gens blocked on a RunPod capacity incident)
