---
title: "The Aftermath Frame"
type: concept
pillars: [creation, tools, philosophy]
born: 2026-07
stage: growing
confidence: working
energy: high
who_leads: loudon
forward_vector: "I am the dramatic still that remembers the motion that made it. I want to become the tool that turns a physical seed — one authored swing, modeled as a real rotation — into consistent, beautiful gen-AI action frames: the motion stays honest, the consequences go super-physical (impossibly strong, impossibly fast), and the frame resolves to pen-flow ink. My precise target is a frame a reader believes and a diffusion model can hold."
links:
  - target: "[[The Flow Field is the Spine]]"
    type: emerged-from
    label: spine-extended-into-time
  - target: "[[Graphic Storytelling]]"
    type: exemplifies
    label: closure
  - target: "[[Blocked, Not Prompted]]"
    type: connects-to
    label: author-the-motion
  - target: "[[BLUELINE — Motion and Flow]]"
    type: connects-to
    label: subsystem-home
  - target: "[[Shop/Figure Rig]]"
    type: connects-to
    label: the-posed-swinger
  - target: "[[BLUELINE]]"
    type: connects-to
    label: dramatic-frame-engine
  - target: "[[Steer the Generator]]"
    type: connects-to
    label: stylize-to-ink-target
tags: [concept, blueline, motion, physics, comics, aftermath]
---

# The Aftermath Frame

**A dramatic still is the time-integral of an authored motion.** The sword has just struck the
column; the frame is the *moment after* — shards flying, air torn along the swing, the figure in
follow-through. Nothing in the frame moves, yet the frame *is* the motion: the reader runs the swing
backwards from the debris. This is McCloud's **closure** ([[Graphic Storytelling]]), and it is the most
BLUELINE-native thing there is. The frame is never authored directly — it is the *consequences of an
authored motion, sampled at "now."*

## The method — model the action as a rotation

The physical honesty lives here. Author only the rotational state — `{pivot, axis, θ(t) with a
peak-at-impact ω, blade as a rigid body}` — and **derive** the arc, every point's velocity
(`v = ω × (r − pivot)`), the tip speed, and the **contact velocity** that sources every consequence.
Real numbers fall out (an overhead chop: Δθ 133°, ω 23 rad/s, tip **33 m/s**). This is the reusable
**Motion Model**: it generalizes to any action — chop, side slash, rising cut (proven), and punch,
leap, throw, whip (the same shape). It extends [[Blocked, Not Prompted]] from *author the geometry* to
*author the motion*.

## Real motion, amplified consequences

The load-bearing split: the **motion is real** (the arc, the character's trajectory, a somewhat-real
follow-through pose); the **consequences are physically-sourced, then comic-amplified** — because
comics are *super-physical* (impossibly strong, impossibly fast). The shards, the air wake, and the
speed-lines take their *direction and relative speed* from the real contact velocity; a comic gain
scales only their count, spread, and streak-length — never the motion. The impact is real too: a
boolean **wound** removes material exactly where the blade passed, and the shards spray from that gash.

## The target — consistent, beautiful gen-AI frames

The physical solver is the **seed, not the product.** The product is *consistent, beautiful gen-AI
frames*: the physical consequences + the depth / OpenPose plates → ControlNet / img2img → pen-flow ink
([[Steer the Generator]]). **Consistency** comes from the physical seed, **beauty** from the render,
**drama** from the super-physics. Aim at that precise target.

## Why it belongs to the spine

It is [[The Flow Field is the Spine]] **extended into time** — one authored source, many registers, all
in register because they share the trajectory. And because the impact lands on a beat, every
consequence is a function of `(now − impact)` — the field→clock coupling ([[BLUELINE — Motion and Flow]]
Edge 2) made concrete and dramatic.

## Proofs

`Projects/BLUELINE/proofs/` — `session-7-aftermath` (first frame), `session-8-swing` (the solver, real
derived physics), `session-9-three-swings` (generalization), `session-10-impact` (real boolean wound +
arc speed-lines). Blender-local, deterministic (a pure function of the authored motion + seeds).

## Forward Vectors

- **Stylize to pen-flow ink** — the beauty/consistency target; the whole point. The clay proof becomes a
  board only when it's inked.
- **Parameterize the super-physics** as coherent knobs (impossibly strong / fast) on top of the real seed.
- **Cell Fracture the wound** — so the shards *are* the removed material (mass conserved) + splinters + cracks.
- **IK-animate the full swing** — the definitive "the motion happened" clip (windup → impact → aftermath).
- **Generalize** beyond swings: punch, leap, throw, whip — the Motion Model already fits them.
