---
title: Séance Cat Probe — Findings
born: 2026-06-22
links:
  - target: "[[Retrospective Delay]]"
    type: connects-to
    label: probe-findings
forward_vector: I record what the Gorey-Ink + Cyberpunk smoke renders proved, what they didn't, and which path Stage-4 character work should take next.
---

# Findings — 2026-06-22

Both renders shipped against the dispatch sheet. Seed 42, 1024², SDXL base, 30 steps, CFG 7.5, no ControlNet.

| Render | Time | Style legible? | Character legible? | Pose-3 (arms overhead, ectoplasm, stars-in-eyes) legible? |
|---|---|---|---|---|
| `gorey-ink-pose-3-probe.png` | 351 s (cold) | **yes** — fine crosshatch, Victorian gothic, ink-on-cream | yes — small black cat reads | **no** — cat is sitting calmly by a fireplace, no arms raised, no ectoplasm |
| `cyberpunk-pose-3-probe.png` | 94 s (warm) | **yes** — neon magenta/blue, dark synth atmosphere | partial — head-and-shoulders portrait only | **no** — no body, no arms, no pose |

## What the probe proves

1. **The base model can hit both styles.** Gorey-Ink reads as Gorey (the harder of the two). Cyberpunk reads as cyberpunk. The style ceiling is high enough for both directions — neither needs a LoRA to clear the floor.
2. **Prompt-only pose conditioning is the bottleneck.** SDXL ignored "arms stretched wide overhead" in both renders. Gorey collapsed to a static seated portrait inside a richly-described room; Cyberpunk collapsed to a head shot. The pose is the constraint, not the style.
3. **Character consistency is untested.** Seed 42 was held, but only one pose was attempted per style. The cross-pose identity question (IP-Adapter or not) is downstream of pose conditioning.

## The next move — ControlNet-scribble from the seed SVG

`assets/2026-05-04-seance-cat-poses-v2-7frames.svg` already carries the pose silhouettes. Export frame 4 (arms-overhead) as a 1024² PNG, wire it into the workflow as ControlNet-scribble (check `_tools/ComfyUI/models/controlnet/` first — Union may not be installed). This locks the pose without touching the style prompts.

If ControlNet-scribble lands the pose:
- Re-run both styles at Pose 3 to confirm.
- Then sweep Poses 1, 2, 4, 5 with the same seed and scribble-per-pose.
- Then attempt IP-Adapter for cross-pose identity using Pose-3 as the reference image.

If ControlNet-scribble does **not** land the pose (rare but possible if the scribble is too sparse): pose-2-text-strength dial first, then switch to ControlNet-openpose with a rigged stick figure rather than the SVG silhouette.

## Honest stopping condition

The original dispatch said: "if both styles produce a legible upright cat with something reading as raised arms and something reading as eerie atmosphere, the pipeline is proven." We got eerie atmosphere in spades and raised arms in neither. Pipeline is proven for style; not yet proven for pose. ControlNet-scribble is exactly the contingency the probe-author named for this outcome.
