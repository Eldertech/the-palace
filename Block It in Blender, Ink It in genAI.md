---
title: "Block It in Blender, Ink It in genAI"
type: practice
pillars: [tools, creation]
born: 2026-06
last_activated: 2026-06
activation_count: 1
stage: growing
confidence: working
energy: high
who_leads: shared
summary: "End-to-end runbook: build a scene in Blender, emit registered ControlNet conditioning (canny + depth + canonical OpenPose), and drive a gen-AI redraw — so a fresh Claude can do it cold."
forward_vector: "I am the runbook a fresh Claude reads to do the whole thing cold — block a scene in Blender, emit registered conditioning, and drive the gen-AI without re-deriving a single gotcha. I exist so the hours we spent on view-transforms and weight-painting are spent once, ever. I want to collapse into a single end-to-end command, to grow finger keypoints and multi-figure scenes, and to keep my gotcha index honest as the tools shift under me."
links:
  - target: "[[Blocked, Not Prompted]]"
    type: exemplifies
    label: runbook-for
  - target: "[[Shop/Blender]]"
    type: connects-to
    label: blocks-the-scene
  - target: "[[Shop/Figure Rig]]"
    type: connects-to
    label: stages-the-figure
  - target: "[[Shop/ComfyUI]]"
    type: connects-to
    label: drives-the-genai
  - target: "[[Hand-Drawn 3D Look]]"
    type: couples-with
    label: the-look
  - target: "[[Remnants in Depth]]"
    type: connects-to
    label: atmosphere-layers
  - target: "[[Steer the Generator]]"
    type: connects-to
    label: generate-many
  - target: "[[BLUELINE]]"
    type: emerged-from
    label: proving-ground
---

# Block It in Blender, Ink It in genAI

The whole point of [[Blocked, Not Prompted]] in one runbook: **you author the scene as 3D geometry, the gen-AI fills the composition you dictated** — instead of prompting and praying. This is the concrete how, written so a fresh Claude can do it cold. Our instantiation inks a pen-and-ink-noir frame; swap the style and the same four moves drive any conditioned redraw. Proven in [[BLUELINE]]; the scripts live in `Projects/BLUELINE/proofs/blender-handdrawn/`.

## The four moves

**1 · Block the scene** in [[Shop/Blender]] (headless: `blender -b --factory-startup -P <script.py>`). Place the environment, the camera (low canted angle for drama), and the figure. For a posed figure, dispatch [[Shop/Figure Rig]] — `--pose-json '{"thigh.L":[-40,0,0], ...}'` (Rigify-named bones) drives a real human or a wooden mannequin. *Drama is geometry, not adjectives.*

**2 · Emit registered conditioning from ONE camera** — the move the whole thing rests on. Three passes, all from the same camera so they align:
- **Canny** — render a Freestyle line pass (it *is* clean lineart) and feed it through ComfyUI's `Canny` node.
- **Depth** — a camera-distance gradient (near = white) via a Map-Range on `View Z Depth`, or a Z pass.
- **Canonical OpenPose** — project the rig's joints to 2D and draw them with the **real** `comfyui_controlnet_aux` `draw_bodypose` (see [[Shop/Figure Rig]]). *Never render 3D skeleton spheres — the model was trained on the flat 2D drawing.*

**3 · Drive the gen-AI as a REDRAW, not a filter** ([[Shop/ComfyUI]], SDXL + ControlNets). Low denoise just hands your 3D render back; the style's own negative (*"3d render, smooth shading"*) fights you. Push **denoise ~0.92–0.95** and let the model re-draw the medium. Anchor the structure so it survives the aggressive pass — the **D2 stack**: **canny 0.30** (a style throttle) **+ depth 0.60** (volume) **+ openpose 0.70** (skeleton). *What melts a figure is under-anchoring, not high denoise.* Fire **N seeds** and pick the emotional register ([[Steer the Generator]]).

**4 · Composite the extras as layers** — ink remnants and atmosphere ride *over* the redrawn plate, not through it ([[Remnants in Depth]]): render them as their own RGBA + depth pass and gate by `markZ ≤ sceneZ` so the scene still occludes them. The look + the when-to-use-what matrix: [[Hand-Drawn 3D Look]].

## The gotcha index (spend these hours once)

- **Force `scene.view_settings.view_transform = 'Standard'`** — Blender 5's default AgX greys white paper to mud.
- **Engine:** pick `BLENDER_EEVEE_NEXT` (fallback `BLENDER_EEVEE`).
- **OpenPose:** draw with the real `draw_bodypose` lib; the 18-keypoint order **is** the `limbSeq` order (nose, neck, R-side, L-side, eyes, ears); `world_to_camera_view` returns y from the **bottom** → flip (`1 − y`).
- **Blender 5.1 compositor** is a node group: `scene.compositing_node_group` (+ `NodeGroupOutput`); the Math node is **`ShaderNodeMath`** (not `CompositorNodeMath`); `CompositorNodeAlphaOver` sockets are **Background / Foreground / Factor**; RLayers depth = `Depth`.
- **Alpha billboards over line art** make a white square: Freestyle culls lines behind the quad. Fix = **two view layers** (line geometry vs marks, recombined by Z-depth) **+ a `DITHERED` clip material** (discards transparent fragments). Both are needed.
- **Skinning a real human mesh:** `ARMATURE_AUTO` *silently zero-weights* MakeHuman's CC0 base mesh in Blender 5.1; `ARMATURE_ENVELOPE` fuses the legs. Fix = **per-bone proximity weights** (leg-zone exclusion + L/R guard) **+ an inner-thigh seam split**.
- **Encode B&W line-art clips at `-crf 6 -tune animation`** or **ProRes** — default crf rings square macroblocks around sharp black-on-white.
- **The redraw is slow on MPS** (~2–9 min/frame, 1 ControlNet); multi-ControlNet wants `--highvram`. Stills are fine locally; motion belongs on the GPU backend.

## Where the tools live
`Projects/BLUELINE/proofs/blender-handdrawn/` — `FIELD-NOTES.md` (the findings), `APPROACHES.md` (the when-to-use-what matrix), and the scripts: `01_stills.py` / `03_motion.py` (NPR + motion), `02b_stylize_push.py` / `seam_variation.py` (the redraw), `blob_analyze`/`_synth`/`_swarm.py` (remnants), and `followups/rig-openpose/` (the Figure Rig: `pose_rig_mpfb_v2.py`, `draw_openpose.py`, `redraw_test.py`, `figure_rig.blend`).

## Forward Vectors
- **One command, end to end** — a single orchestrator: brief → blocked scene → conditioning → redraw → composited frame.
- **Finger + denser face keypoints** — needs finger bones on the rig (the [[Shop/Figure Rig]] next rung).
- **Multi-figure scenes** — generative layering (shared context + per-figure pose/identity, integrate pass).
- **Keep the gotcha index honest** — Blender and the ControlNet libs shift under this; re-verify on each version bump.
