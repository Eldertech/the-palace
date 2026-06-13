---
title: "Blocked, Not Prompted"
type: concept
pillars: [tools, creation, philosophy]
born: 2026-06-13
last_activated: 2026-06-13
activation_count: 1
stage: seed
confidence: working
energy: high
links:
  - target: "[[BLUELINE]]"
    type: exemplifies
    label: core-mechanism-of
  - target: "[[The Flow Field is the Spine]]"
    type: couples-with
    label: geometry-first-siblings
  - target: "[[Shop/Blender]]"
    type: connects-to
    label: the-blocking-surface
  - target: "[[Shop/ComfyUI]]"
    type: connects-to
    label: fills-what-is-blocked
tags: [concept, generative, controlnet, staging, blueline, seed]
---

# Blocked, Not Prompted

**Author the composition as geometry, so the model fills it rather than chooses it.**

Prompt-only image generation defaults to a centered, front-on portrait — it chooses the composition, and it chooses the safe one. *Blocked, not prompted* refuses that default by moving the compositional decisions upstream into a 3D block: camera position, framing, figure pose, environment layout are all *authored* (in [[Shop/Blender]], by hand or by a staging-AI), then emitted as conditioning passes (depth, pose, lineart, normal) that the diffusion model must obey. The model's job shrinks from "decide and draw" to "fill a frame someone already staged."

**Drama becomes geometry, not adjectives.** You don't write "dramatic low angle, intense" and hope; you put the camera at the worm's-eye and the model renders the drama you built. The conditioning is the contract. See the mechanism in [[Shop/Blender/toyxyz-conditioning-recipe]].

## Why it works

Diffusion models are unreliable at *choosing* bold composition but reliable at *filling* a given structure. Blocking plays to the second and removes the first. It also makes the result **editable** — the block is a scene you can nudge, not a prompt you can only re-roll. This is the staging-AI half of [[BLUELINE]]'s two-AI split: cheap, structured, reliable.

## The one rule it inherits

One preprocessor and one ControlNet per channel, each with its own weight on the faithful↔exotic dial. The dial is *how far the fill may depart from the block* — turned down for the comic register's discipline, up for the hyperreal impact.

## Wider resonance

The same shape recurs wherever a generative system is constrained by an authored structure rather than steered by description — the structure carries the intent and the generator supplies the texture. It `couples-with` [[The Flow Field is the Spine]]: both put authored geometry first and let generation serve it.

<!-- CLAUDE → LOUDON: thin on the wider-resonance face — wants a non-BLUELINE example (a synth-design or palace parallel) once one surfaces. -->
