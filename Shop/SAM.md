---
title: SAM
type: specialist
status: alive
medium: other
tool: Segment Anything (ultralytics)
tool_version: MobileSAM + ViT-B
born: 2026-06
last_tested: 2026-06-25
last_gotcha: 2026-06-25
license: Apache-2.0 (code); weights per checkpoint (SAM ViT-B; MobileSAM)
forward_vector: "I cut a picture into its objects — but only where the picture looks like the photos I learned on. On line art I flail; on photoreal or flat-cel I'm sharp. I want to be the reason we convert first: send me a domain I know, and I hand back clean cels."
links:
  - { target: "[[The Shop]]", type: member-of, label: roster-member }
  - { target: "[[Maker]]", type: connects-to, label: directed-by }
  - { target: "[[Line-Art Layer Decomposition]]", type: connects-to, label: the-Segment-skill-and-its-wall }
  - { target: "[[Depth Anything]]", type: connects-to, label: orders-what-I-isolate }
  - target: "[[LaMa]]"
    type: connects-to
tags: [specialist, shop, perception, segmentation, decomposition, local]
---

# SAM

## Charter

I cut an image into its constituent objects — a mask per thing. Auto mode (MobileSAM) finds everything; prompted mode (ViT-B, box or point) isolates one. I'm the **Segment** skill of layer decomposition. But I carry a sharp, well-mapped limit, and naming it is half my value: **I only work where the image resembles the photographs I was trained on.**

## Job Contract

- **In:** an RGB image; optionally box/point prompts for a specific object.
- **Out:** binary masks (one per object in auto mode; one in prompted mode).
- **Cost:** local, ~seconds (MobileSAM) to tens of seconds (ViT-B auto).

## The wall — and what it taught us (proven 2026-06-25)

- **I fail on line art.** A pen drawing of a car is sparse outline strokes on the same paper as everything else — there's no solid textured region for me to grab, so I snap to the nearest tonal block and over-segment into fragments. On BLUELINE shot 02 I never once isolated the car; the figure came out *better from a keypoint mask* than from me.
- **I work cleanly once the image is converted.** Run me on the *same composition* re-rendered to photoreal or flat-cel (SDXL/FLUX + canny ControlNet) and I segment sharply — 30/26/22 distinct object regions on photoreal, **44/47/25 on flat-cel** across three test scenes. I am the tool that *motivates* the convert-first reframe in [[Line-Art Layer Decomposition]]: my training domain *is* the intermediate domain we should convert to. **Flat cel-shaded is my best input** — solid flat regions, crisp edges, separable even before I run.
- The reframe in one line: don't fix the segmenter, **move the image into the segmenter's world, then stylize back.**

## Gotchas / where I fail

- **Thin, see-through objects** defeat me even in photoreal if they're glassy/wireframe — no solid region to bound.
- **Auto-mode over-segments** busy scenes into fragments; prompted mode (box around the object) is steadier when you know what you want.
- **Pair me with [[Depth Anything]]:** I isolate, depth orders. Neither alone gives a stacked, ordered cel set; together they do.

## Recipe

`ultralytics` SAM (`mobile_sam.pt` for auto, `sam_b.pt` for prompted). Best results: convert the drawing to **flat cel-shaded** first (canny ControlNet, low strength / posterized), then auto-segment, then [[LaMa]]-infill behind each cel and [[Depth Anything]] to stack them.
