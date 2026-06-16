---
title: toyxyz-conditioning-recipe
born: 2026-06-13
last_tested: 2026-06-13
forward_vector: "I am the tested recipe that turns a posed Blender scene into registered multi-ControlNet conditioning passes for ComfyUI; I want to stay the first-try path for Blocked-Not-Prompted work and grow to cover the Cycles-render variant."
links:
  - target: "[[Shop/Blender]]"
    type: member-of
    label: recipe-of
  - target: "[[Shop/ComfyUI]]"
    type: connects-to
    label: feeds-multi-controlnet
  - target: "[[Blocked, Not Prompted]]"
    type: exemplifies
    label: the-mechanism
tags: [recipe, shop, blender, controlnet, conditioning, blueline]
---

# toyxyz Conditioning Recipe

> The keystone move of [[Blocked, Not Prompted]]: turn a posed Blender scene into clean multi-ControlNet conditioning so the render-AI *fills a composition Loudon dictated* instead of choosing its own. A recipe inside [[Shop/Blender]], not its own Specialist — it is a way of using Blender, not a separate tool.

**Status: tested 2026-06-13** (Session 1, Mac/MPS). The keystone proved out — blocking defeats the
front-on default, the pose's drama survives the fill. Parameters below are updated to what worked;
full evidence + frames in [Shop/Blender/tests/](../../Shop/Blender/tests/)
(`CONTACT-SHEET-keystone.png`, `gotchas-2026-06-13.md`).

## What it is

**toyxyz's "Character bones that look like OpenPose for Blender"** is a Blender rig whose bones render as OpenPose-style keypoints, plus geometry that emits depth, canny, normal, MediaPipe-face, and finger passes — all from a single posed scene, registered to the same frame. It is the cheapest reliable bridge from 3D blocking to ControlNet conditioning.

- Source: `toyxyz.gumroad.com` (the OpenPose-bones Blender rig).
- Pairs with the **ComfyUI ControlNet Auxiliary Preprocessors** for any pass the rig doesn't emit directly.

## The move, step by step

1. **Pose** a humanoid armature in Blender in a dramatic, *non-front-on* stance (foreshortened, OTS, worm's-eye). Hand-tune until the drama reads.
2. **Attach** the toyxyz OpenPose-bones rig / pass geometry to the armature.
3. **Emit** the conditioning passes for the framed camera: OpenPose (and DWPose for comparison), depth, normal, canny, lineart.
4. **Feed** them into the ComfyUI two-pass multi-ControlNet graph (lineart/pose/depth stack → fill → 1.5× img2img refine).

## The one hard rule

**One preprocessor and one ControlNet per channel.** Do not merge depth + canny into a single ControlNet model — it's ineffective. Each conditioning signal gets its own preprocessor and its own ControlNet slot, with its own weight on the faithful↔exotic dial.

## Channel notes (tested 2026-06-13, SDXL)

- **Pose:** emit the OpenPose skeleton **geometrically** — project the armature's COCO-18 joints to
  camera space and draw the canonical skeleton. **Do NOT use a 2D estimator (DWPose/OpenPose) on the
  proxy render:** DWPose on the greybox clay returned a *fully black image* (zero keypoints). Geometric
  projection is exact on any proxy, needs no model, and is deterministic. Strength **0.9**, full range
  — the load-bearing channel. (DWPose is correct only when the source is photoreal — not a greybox.)
- **Depth:** emit from Blender's **Z pass** (true geometry — cleaner than MiDaS estimation). Governs
  front/back limb ordering, essential for the foreshortened poses. Strength **0.7**, full range.
- **Edge:** on **SDXL** the edge channel is **canny** (strength **0.45**, early-only `end 0.5`) — there
  is **no strong standalone SDXL lineart ControlNet** at this date. Emit `lineart.png` as an artifact,
  but feed **canny**. Reserve a true lineart channel for the FLUX / SD1.5 path.
- **Refine:** the 1.5× pass is plain img2img (no CN), denoise **0.42** — composition is already locked.
- **Identity:** lives in IP-Adapter (+ per-character reference/LoRA), *not* in a ControlNet channel — keep it separate.

## Verdict (Session 1, 2026-06-13)

- **Rig vs bespoke script → bespoke geometric script wins** for a scripted, headless, reproducible
  Blender→ControlNet bridge. The toyxyz Gumroad rig was *not* acquired (needs Loudon's checkout); the
  bespoke pose-emission script (`blocking/pose_and_emit.py` + `draw_passes.py`) is its functional
  equivalent and is the recommended default. Acquire the toyxyz rig only if hand-GUI posing of an
  OpenPose-bones armature is preferred over scripting.
- **Base model → SDXL** (per-channel pose+depth+canny). FLUX-ControlNet deferred (40 GB gated local
  install; the FLUX Specialist is cloud-text-to-image only).
- **The drama survives, and the front-on default is defeated** — proven against a prompt-only control
  at two seeds (both centered/eye-level/frontal; blocked produced the worm's-eye OTS foreshortening
  neither seed reached).
- **Still open:** per-channel (this recipe's hard rule) vs **ControlNet-Union** single-model — Session 1
  ran only the per-channel arm; the Union arm is owed (the `ControlNet Workflow Mastery` ghost's home).

## Grows into (Track IV — the pose/camera library)

The single-pose emission proved here is being grown into a reusable **pose library + camera-grammar
solvers** (named held poses + declarative OTS / worm's-eye / low-hero camera solvers that round-trip
registered passes into a [[BLUELINE — Board Record Schema|board record]]). It lives in
`Projects/BLUELINE/proofs/track-IV-bench/` (`bench.py` + `post.py`) until the vocabulary is stable
across more shots, then it promotes into this `Shop/Blender` bundle. The camera-grammar solver is
reusable for *any* character imagery, not just BLUELINE.

## Open questions (remaining)

- ControlNet-Union vs one-CN-per-channel: does Union's single model match the per-channel route's
  independent strength+range scheduling? (Untested; the recipe's hard rule held for SDXL this round.)
- FLUX-local ControlNet fidelity vs SDXL — only worth standing up if SDXL proves insufficient on a real shot.
- Skinning the metaball body to the armature so GUI re-posing updates the mesh live (current loop:
  edit armature/J → re-run the script).
