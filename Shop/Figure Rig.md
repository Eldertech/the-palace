---
title: Figure Rig
type: specialist
status: alive
medium: image
tool: blender
tool_version: "5.1.2 + comfyui_controlnet_aux draw_bodypose + MakeHuman/MPFB2 CC0 base mesh (verified Mac/MPS 2026-06-30)"
born: 2026-06
last_tested: 2026-06-30
license: GPL-3.0
forward_vector: "Hand me a pose and I hand back a figure ready for the gen-AI ink — three ALIGNED conditioning plates from one rig: a Freestyle ink silhouette, a depth map, and a CANONICAL OpenPose drawn by the real ControlNet library so the model actually reads it. I am the figure-staging method [[Frame Designer]] was missing. I wear two skins now — a stylized wooden mannequin (clean, fast) and a REAL human body (MakeHuman's CC0 base mesh skinned to the same rig, so facing reads from anatomy + hair). My OpenPose face keypoints track the real head direction. I am hunting finger keypoints (the toyxyz pattern — I need finger bones), IK, and a pose library so a frame is dialed, not hand-typed."
links:
  - { target: "[[The Shop]]", type: member-of, label: roster-member }
  - { target: "[[Frame Designer]]", type: connects-to, label: staging-method }
  - { target: "[[Shop/Blender]]", type: connects-to, label: built-on }
  - { target: "[[Shop/ComfyUI]]", type: enables, label: feeds-the-redraw }
  - { target: "[[Hand-Drawn 3D Look]]", type: couples-with, label: figure-staging }
  - { target: "[[Blocked, Not Prompted]]", type: exemplifies, label: author-the-geometry }
  - { target: "[[BLUELINE]]", type: connects-to, label: commissioned-by }
tags: [specialist, shop, rig, openpose, controlnet, figure, blender]
---

# Figure Rig

## Charter
I turn a **pose** into a figure ready for the hand-drawn-3D seam. One FK rig (Rigify-named bones) → **three aligned ControlNet plates from one camera**: ink, depth, and a *canonical* OpenPose. The OpenPose is the whole point — I do **not** render 3D spheres; I project the rig's joints to 2D and draw them with the **actual `draw_bodypose` from `comfyui_controlnet_aux`**, so the skeleton is pixel-identical to the preprocessor and the controlnet-openpose model reads it cleanly. I am the figure-staging method [[Frame Designer]] dispatches, the bring-together of [[Blocked, Not Prompted|authored geometry]] and a ControlNet-ready pose.

## Job Contract
- **in:** a pose — named (`A` crouch / `B` stride / `C` arms-up) or `--pose-json '{"thigh.L":[-40,0,0], ...}'` (bone → XYZ-Euler degrees, Rigify names); one shared camera.
- **out:** `ink_plate.png` (Freestyle ink), `depth_plate.png` (near = white), `openpose.png` (canonical 18-keypoint OpenPose), `keypoints.json` (the 2D keypoints) — all registered to the same camera.
- **downstream recipe (the payoff):** the **D2 redraw** — img2img over the ink plate, anchored **canny 0.30 + depth 0.60 + openpose 0.70** at denoise 0.92 → a posed figure inked in the locked style, **pose held** (proven end-to-end 2026-06-26).

## How it works — two steps, one camera
1. **Blender headless:** build the FK rig, pose it, build + skin a body, render ink + depth, and project the 18 canonical keypoints via `world_to_camera_view` — with facing read from the head bone's world matrix. Two mesh variants share this exact pipeline:
   - `pose_rig_mesh.py` — a **stylized wooden mannequin** (procedural: tapered limbs, joint balls, chest/pelvis blocks, egg head + nose nub). Clean, fast, fully procedural.
   - `pose_rig_mpfb_v2.py` — a **real human** (MakeHuman/MPFB2's **CC0 base mesh** skinned to the same rig). Anatomical body, real face + hair. *(The original `pose_rig.py` is the capsule reference.)*
2. `draw_openpose.py` (ComfyUI venv python): draw those keypoints with the real `draw_bodypose`.

## Gotchas (hard-won)
- Draw the OpenPose with the **real library**, never as rendered 3D spheres — the model was trained on the flat 2D drawing.
- The 18-keypoint order **is** the `limbSeq` order (nose, neck, R-side, L-side, eyes, ears). Wrong order → the limb colors lie → the model mis-reads laterality.
- `world_to_camera_view` returns y from the **bottom** — flip to image-top (`1 − y`).
- **One shared camera** for all three plates, or they won't register.
- Force `view_transform = 'Standard'` (Blender 5's AgX greys the ink paper).
- **Real-body skinning (MPFB2):** no addon install needed — pull just the **CC0 `base.obj`** from the MPFB2 GitHub zipball and import it (scaled dm→m + lifted so feet hit Z=0). Then: Blender 5.1's `ARMATURE_AUTO` (bone-heat) **silently zero-weights** this mesh; `ARMATURE_ENVELOPE` works but **fuses the two legs into a skirt**. The fix that holds: **custom per-bone proximity weights** (closest-point-on-segment, with a leg-zone exclusion so torso/arm bones can't claim sub-1.15m verts, + a ±L/R side guard) **plus an inner-thigh seam split** (the base mesh has zero clearance between the thighs — duplicate the X≈0 verts and displace ±8mm so each leg is an independent surface).

## Tiers
- **Sketch** — named pose + the wooden mannequin: instant blocking.
- **Study** — a `--pose-json` custom pose + the D2 redraw: a real inked figure to judge.
- **Piece** — the **real human body** (`pose_rig_mpfb_v2.py`) + custom pose + D2 redraw → a believable inked figure with anatomical facing.

## Honest limits
- **Two bodies, two characters.** The wooden mannequin reads stylized/mechanical with cleanly separated limbs; the MPFB2 human reads anatomical (real face, hair, shoulders, hips) — the realism win, especially for facing.
- **Facing is real** — the OpenPose nose/eyes/ears derive from the **head bone's world matrix**, so they track head-turns and profiles.
- **MPFB legs read close from the hero diagonal camera** in *sagittal* strides — the legs are genuinely separated in depth but project near each other; a little lateral (Z-axis) thigh spread in the pose, or a side camera, fixes the read. Ankle is slightly boxy (the rig's short foot bone), and there are **no finger bones** (so no finger keypoints yet).
- **FK only** — no IK; a crouch needs thigh + shin set independently.

## Forward Vectors
- **Finger + denser face keypoints** (the toyxyz pattern) — needs **finger bones** on the rig (or MPFB2's own rig) so `draw_handpose` has something to project.
- **IK + a pose library** — dial a frame from a catalogue, not hand-typed JSON.
- *(Closed: head-bone-derived facing; a real wooden-mannequin mesh with a face nub (2026-06-26); and a real MPFB2 human body with separated legs (2026-06-30).)*

Tools: `Projects/BLUELINE/proofs/blender-handdrawn/followups/rig-openpose/` — `pose_rig_mpfb_v2.py` (real human) · `pose_rig_mesh.py` (wooden mannequin) · `pose_rig.py` (capsule, reference) · `draw_openpose.py` · `redraw_test.py` · `open_blend.py`. Base mesh: `Projects/BLUELINE/_tools/mpfb2-base/base.obj` (MakeHuman CC0).
