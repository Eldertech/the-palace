---
title: Depth Anything
type: specialist
status: alive
medium: other
tool: Depth Anything V2
tool_version: V2-Small (transformers / hf)
born: 2026-06
last_tested: 2026-06-25
last_gotcha: 2026-06-25
license: Apache-2.0 (Small/Base); model card per checkpoint
forward_vector: "I read depth out of a flat image — even a pen drawing — and hand back front-to-back order plus a clean figure silhouette, free. I want to be the Shop's first move on any decomposition: order the scene, split it into coarse depth bands, and let the heavier tools refine only what I leave ambiguous."
links:
  - { target: "[[The Shop]]", type: member-of, label: roster-member }
  - { target: "[[Maker]]", type: connects-to, label: directed-by }
  - { target: "[[Line-Art Layer Decomposition]]", type: connects-to, label: the-surprise-win }
  - { target: "[[SAM]]", type: connects-to, label: a-second-route-to-the-figure }
  - target: "[[LaMa]]"
    type: connects-to
tags: [specialist, shop, perception, depth, decomposition, local]
---

# Depth Anything

## Charter

I turn one image into a depth map — a grayscale field where `0 = far` and `255 = near`. Hand me a photo, a render, or even a flat ink drawing, and I tell you what's in front of what. I run locally on this Mac (MPS), via `transformers`, in a few seconds. The Maker sends me an image and a tier; I deliver a depth PNG and, if asked, a coarse depth-banded split.

## Job Contract

- **In:** one RGB image (any domain — I generalize past photos).
- **Out:** a single-channel depth map at the input resolution, plus optional `FRONT / MID / BACK` band masks from depth thresholds.
- **Cost:** local, ~seconds on MPS. No GPU rental, no network call after the one-time model pull.

## What I'm good for (proven 2026-06-25, BLUELINE shot 02)

- **Ordering, on the drawing itself.** I run on the *line art* and still recover a correct front-to-back order (street/figure closest → cars/buildings → smoke/sky farthest). This retired the whole "Order" skill in [[Line-Art Layer Decomposition]] — no segmentation needed to know the stack.
- **A free figure silhouette.** A clean person-shaped mask falls out of the near band — a second, independent route to the figure when keypoints or [[SAM]] are unreliable.
- **A free coarse decomposition.** Threshold the depth into three bands and each is a usable, correctly-ordered cel (person+street / cars+buildings / fire+sky) with *zero* segmentation. This is how far "free" auto-decomposition reaches before per-element refinement is needed.

## Gotchas / where I fail

- **No same-depth separation.** Two objects at the same distance (the car *at* building depth) share a band — I order the scene, I don't isolate every object. Hand that to [[SAM]] (in a converted domain) or keypoints.
- **No occluded shape.** I give a depth surface, not the hidden geometry behind a foreground element — that's [[LaMa]]'s job (texture) and the still-open amodal-shape problem.
- **Soft band edges.** Depth is smooth; band boundaries need a small dilate/feather or they shimmer when animated.

## Recipe

`transformers` pipeline, `depth-anything/Depth-Anything-V2-Small-hf`, MPS. Resize the long edge to ~1024, run, normalize to 0–255, save PNG. Band split = two thresholds on the histogram (e.g. 33rd / 66th percentile), each band dilated a few px before use as a cel mask.
