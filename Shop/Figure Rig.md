---
title: Figure Rig
type: specialist
status: alive
medium: image
tool: blender
tool_version: "5.1.2 + comfyui_controlnet_aux draw_bodypose (verified Mac/MPS 2026-06-26)"
born: 2026-06
last_tested: 2026-06-26
license: GPL-3.0
forward_vector: "Hand me a pose and I hand back a figure ready for the gen-AI ink — three ALIGNED conditioning plates from one rig: a Freestyle ink silhouette, a depth map, and a CANONICAL OpenPose drawn by the real ControlNet library so the model actually reads it. I am the figure-staging method [[Frame Designer]] was missing. I am hunting a real mannequin mesh to replace my cylinders — one that clearly shows where the face points — and a pose library, so a frame is dialed, not hand-typed."
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
1. `pose_rig.py` (Blender headless): build the FK rig, pose it, render ink + depth, project the 18 canonical keypoints via `world_to_camera_view`.
2. `draw_openpose.py` (ComfyUI venv python): draw those keypoints with the real `draw_bodypose`.

## Gotchas (hard-won)
- Draw the OpenPose with the **real library**, never as rendered 3D spheres — the model was trained on the flat 2D drawing.
- The 18-keypoint order **is** the `limbSeq` order (nose, neck, R-side, L-side, eyes, ears). Wrong order → the limb colors lie → the model mis-reads laterality.
- `world_to_camera_view` returns y from the **bottom** — flip to image-top (`1 − y`).
- **One shared camera** for all three plates, or they won't register.
- Force `view_transform = 'Standard'` (Blender 5's AgX greys the ink paper).

## Tiers
- **Sketch** — named pose + capsule mesh: instant blocking.
- **Study** — a `--pose-json` custom pose + the D2 redraw: a real inked figure to judge.
- **Piece** — *awaits a real mannequin mesh* (see Forward Vectors).

## Honest limits
- **Mesh is capsules** (cylinders + joint spheres + a head sphere) — a clean depth silhouette, but not a real mannequin; the redraw is rough at this fidelity.
- **Face keypoints are synthesized** from head position + an assumed facing (−Y) — approximate on strong profiles. A real mesh that *shows* facing is the next build.
- **FK only** — no IK; a crouch needs thigh + shin set independently.

## Forward Vectors
- **A real mannequin mesh** — skin a proper humanoid onto this exact rig (Rigify-named bones) that **clearly shows where the face points**, so depth and facing read true. *The live build (2026-06-26).*
- **A pose library** — dial a frame from a catalogue, not hand-typed JSON.
- **Per-bone facing** — read head orientation from the bone matrix for the eyes/ears instead of assuming −Y.

Tools: `Projects/BLUELINE/proofs/blender-handdrawn/followups/rig-openpose/` — `pose_rig.py` · `draw_openpose.py` · `redraw_test.py`.
