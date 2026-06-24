---
title: "Animate the Background"
type: practice
pillars: [tools, creation]
born: 2026-06
last_activated: 2026-06
activation_count: 1
stage: sprout
confidence: working
energy: high
links:
  - target: "[[The Flow Field is the Spine]]"
    type: exemplifies
    label: the-sim-leg-realized
  - target: "[[Blocked, Not Prompted]]"
    type: couples-with
    label: author-fg-animate-bg
  - target: "[[Adopt the Craft, Author the Seam]]"
    type: connects-to
    label: composite-is-the-seam
  - target: "[[Steer the Generator]]"
    type: connects-to
    label: take-what-it-gives-and-select
  - target: "[[BLUELINE]]"
    type: emerged-from
    label: proving-ground
  - target: "[[Frame Designer]]"
    type: connects-to
    label: a-method-in-the-roster
forward_vector: "I hold one rule — keep what you authored, animate what should breathe. I want to grow from two proofs into a Shop Specialist any frame can call, and to be tested on the hard case — the moving thing behind the figure — where my separate-and-infill steps actually earn their keep."
---

# Animate the Background

A still drawing comes alive without becoming a video: **separate the foreground from the background, give the background motion, and composite them back together.** What you authored — the hero, the camera, the staging — stays crisp and exactly where you drew it. What should breathe — sky, smoke, fire, water, a crowd — gets real motion.

This is [[Blocked, Not Prompted]] carried into time: author what matters, let the model animate what merely lives. It is the half of [[The Flow Field is the Spine]] that survives — the field the compositor *keeps*, not the one the diffusion eats. The arrow becomes the wind by **compositing**, not by steering the noise.

## The four steps

1. **Separate** — cut the foreground (figures, structure) from the background (the moving element). A figure cutout, or a general segmentation for any frame.
2. **Infill** — fill the hole behind the foreground so the background is whole. Skip this and a moving background tears at the figure's edge.
3. **Animate** — give the clean background motion. Image-to-video (SVD) seeded by the drawing itself, then an optical-flow morph (RAFT) that turns 25 generated frames into a smooth, slow, forward loop.
4. **Composite** — lay the static, authored foreground back on top, crisp.

## What's proven (BLUELINE, 2026-06)

Two frames, two shapes, both lovely — `Projects/BLUELINE/proofs/cloud-i2v/` (on the `feature/blueline-m3` branch):

- **Sky** (shot 01) — the burning-city smoke billows behind a static skyline. No foreground to separate; steps 3–4 only.
- **Fire** (shot 02) — fire and smoke live above and behind a hero who stands crisp and still, cars and street held.

The motion *engine* matters less than the division of labor. Plain SVD gives **plausible** motion (smoke rises and billows) but not **controllable direction** — measured at ~55° off the drawn wind. So for backgrounds, take what it gives and select, rather than fight it ([[Steer the Generator]]). RAFT beat the basic Farnebäck morph; a neural interpolator (FILM/RIFE) is the next rung.

## The edge still untested

Both clean proofs animated backgrounds with *no* foreground overlap — sky above the skyline, smoke above the hero's head. The hard case is the moving element *behind* the figure (the street-level fire around his legs), where **separate** and **infill** actually carry weight. That is the next test, and why this is a sprout, not yet mature.

<!-- CLAUDE → LOUDON: deposited 2026-06-24 from the cloud-I2V session. Proofs + the reusable scripts (crop → SVD orchestrator → RAFT morph → composite) live in Projects/BLUELINE/proofs/cloud-i2v/ on feature/blueline-m3; they'll land on main with the branch. When the hard separation case is proven and the recipe stabilises across a few frames, this graduates toward a Shop Specialist (parallel to how flow-field-spine is graduating). -->
