---
title: "toyxyz Conditioning Recipe"
type: recipe
status: untested
born: 2026-06-13
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

**Status: untested.** This recipe is the spec the Claude Code job's Session 1 will prove or correct. Treat the parameters below as starting points, not gospel.

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

## Channel notes (starting points)

- **Pose:** prefer **DWPose** over classic OpenPose for accuracy; strength ~0.7–0.9.
- **Depth:** governs front/back limb ordering — essential for the foreshortened poses the aesthetic wants.
- **Lineart:** holds clothing/feature consistency between frames.
- **Identity:** lives in IP-Adapter (+ per-character reference/LoRA), *not* in a ControlNet channel — keep it separate.

## Open questions for Session 1

- toyxyz rig vs a bespoke pass-emission script — which is more reliable for *our* poses?
- SDXL vs FLUX ControlNet for conditioning fidelity at this date.
- Does the drama of an extreme pose survive the fill, and is the front-on default measurably defeated against a prompt-only control?

## Verdict slot

_(Filled after Session 1: recommended preprocessor, base model, rig-vs-script, and any gotchas. Until then this recipe is a hypothesis.)_
