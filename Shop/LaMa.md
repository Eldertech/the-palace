---
title: LaMa
type: specialist
status: alive
medium: other
tool: LaMa (simple-lama-inpainting)
tool_version: big-lama
born: 2026-06
last_tested: 2026-06-25
last_gotcha: 2026-06-25
license: Apache-2.0 (code); big-lama weights per model card
forward_vector: "I paint back what was hidden. Pull a figure out of a scene and I rebuild the wall, the car, the fire behind it — plausible texture, not a blur. I want to get past texture into true occluded shape, so the thing I reconstruct is the thing that was actually there."
links:
  - { target: "[[The Shop]]", type: member-of, label: roster-member }
  - { target: "[[Maker]]", type: connects-to, label: directed-by }
  - { target: "[[Line-Art Layer Decomposition]]", type: connects-to, label: the-Complete-skill }
  - { target: "[[Animate the Background]]", type: connects-to, label: fills-the-extracted-hole }
  - { target: "[[SAM]]", type: connects-to, label: consumes-its-mask }
  - { target: "[[R. Murray Schafer]]", type: contradicts, label: invent-the-absence-vs-honor-it }
tags: [specialist, shop, perception, inpainting, decomposition, local]
---

# LaMa

## Charter

I fill holes. Give me an image and a binary mask of what to remove, and I reconstruct what should be behind it — large-mask inpainting that resolves into plausible structure, not the smeared average that classical inpainters produce. I run locally (`simple-lama-inpainting`, the `big-lama` weights). I'm the **Complete** skill of layer decomposition: extract the foreground, hand me the hole, get a clean plate back.

## Job Contract

- **In:** an RGB image + a single-channel mask (white = remove/fill).
- **Out:** the image with the masked region reconstructed — a clean background plate.
- **Cost:** local, ~seconds. CPU-fine; faster on MPS/GPU.

## What I'm good for (proven 2026-06-25)

- **Reconstructing what a figure hid.** Remove the man from BLUELINE shot 02 and I rebuild the car, fire, and street behind him plausibly — good enough that the eye accepts the clean plate. This is the infill step both [[Line-Art Layer Decomposition]] and [[Animate the Background]] depend on: you can't animate or restack a background layer until the foreground's hole is filled.
- **The reason we stopped using `cv2.inpaint`.** Loudon's verdict on the classical fill was blunt — *"that infill looks horrible."* It blurs; the eye rejects it. I synthesize texture and structure instead, so the plate survives a second look.

## Gotchas / where I fail

- **Texture, not exact shape.** I invent *plausible* content for the hole, not the *actual* occluded geometry. If the real car door was behind the figure, I'll paint a believable surface — not necessarily that door. Exact occluded-shape completion is the deeper, still-open problem.
- **Mask quality is everything.** A mask that leaks past the object's edge leaves a halo of the original foreground; a mask that's too tight leaves a fringe to fill. Dilate the mask a few px past the silhouette ([[SAM]] or keypoint or depth-silhouette sourced) before handing it to me.
- **Very large holes drift.** The bigger the missing region relative to the image, the more I'm guessing — best on holes that are a minority of the frame with context on most sides.

## Recipe

`from simple_lama_inpainting import SimpleLama`; `SimpleLama()(image, mask)`. Mask = the foreground silhouette, dilated ~5–10px. For [[Animate the Background]]: infill *first*, then animate the clean plate, then composite the crisp foreground back on top.
