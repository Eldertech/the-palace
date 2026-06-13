---
title: "flow-field-spine"
born: 2026-06-13
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: workflow-doc-of
  - target: "[[The Flow Field is the Spine]]"
    type: exemplifies
    label: the-recipe-for
forward_vector: "I am the working recipe for BLUELINE's single-source flow field — one authored field rendered at three resolutions of reality. I stay a bundle doc until the coupling is stable across several real shots, then I graduate to a skill."
---

# flow-field-spine (workflow doc)

> Bundle doc, not a skill yet (Deposit-Map decision #3: bundle docs before skills). Proven by
> [[BLUELINE — Claude Code Job]] Session 3 — see `proofs/session-3-flowfield/`. The recipe for
> [[The Flow Field is the Spine]].

## The one rule

**Author one field. Render it three ways. Never re-author it per leg — only *scale + seed* it.**
Session 3 falsified the strong claim ("one untouched field") and confirmed the practical one: a
**shared source + a thin per-leg transfer** (a scalar magnitude scale + a seeding/format choice). The
field's *structure* is the shared, expensive thing; the per-leg cost is a scalar.

## The field (source)

One divergence-free field = **curl of a scalar potential** ψ (laminar drift + Gaussian vortices):
`(vx, vy) = (∂ψ/∂y, −∂ψ/∂x)`. Sample to a grid, export `flow-field.json`. Everything reads this file
**untouched**. (`proofs/session-3-flowfield/field.py`.)

## The three resolutions

| Leg | Register | How | Per-leg transfer (all it needs) |
|---|---|---|---|
| **Drawn** | comic | integrate streamlines → tapered speed-lines | seed grid · step length · magnitude→width taper |
| **Steers** | render conditioning | dense motion (HSV) map **+** Go-with-the-Flow noise-warp (warp diffusion noise along the flow, renormalise) | **one scalar** `dt_px` (magnitude → pixels/frame) |
| **Sim** | cinema | advect particles by the field | velocity `scale` · `dt` · re-seed on exit |

## Sim engine

**Three.js (real-time) to author + preview; Blender (offline) to bake the hero render.** Same
`flow-field.json` drives both → lossless handoff. (`legs/particles.html`, `legs/blender_particles.py`.)

## Status of the steers leg

The **noise-warp mechanism** is proven (the field carries coherent motion into the noise). The full
**Go-with-the-Flow video-diffusion run** (their warped-noise sampler + a video model) is deferred — the
heavy next step. Wire it when a real flow-driven clip is needed; only then does `Shop/Go-with-the-Flow`
earn a Specialist entry.

## Open

- How much does the `dt_px` / velocity scale need re-tuning per shot vs. once per project? (Spike used
  one set of scalars; multi-shot stability untested.)
- Time-varying fields (the spike field is static in time; "rushing by" used static field + particle
  advection). A field that evolves per beat is the next escalation.
- Promote to a skill once the coupling holds across several real shots.
