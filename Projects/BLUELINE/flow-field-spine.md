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

> **Superseded (2026-07-03) — folded into [[BLUELINE — Motion and Flow]].** This recipe predated the
> character-aware field (Session 4) and the elemental-motion bench (Track VI), and its "steers via
> noise-warp" leg was retired (M3.7). It is kept for the field-math recipe below (still correct), but
> the *current* motion story — the seven threads, the retired render-noise result, and the
> pose → field → clock coupling — lives in [[BLUELINE — Motion and Flow]]. Start there.
>
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

## Obstacle — the field flows around a character (Session 4)

The field can be made **character-aware** — a *field-author* stage before the legs, so the shared-source
rule is untouched. Three steps (`proofs/session-4-figure-flow/field.py`):

1. **Mask** the character to a solid silhouette: gate the true filled depth plate with the *dilated OpenPose
   skeleton* as a locator, so the floor + background props drop out and only the body remains.
2. **Project**: zero the velocity inside the solid, then one Poisson solve `∇²p = ∇·v` — Neumann (no-flux)
   at the body surface + top/bottom walls, open inlet/outlet — and set `v = v − ∇p`. The fluid is now
   divergence-free **and tangent to the body**: streamlines part around it, compress past the shoulders/hips,
   stagnate windward.
3. **Wake**: seed a counter-rotating vortex **pair** (curl of gaussians) just behind the lee edge *before*
   the projection, so the disturbance sheds downwind instead of re-closing symmetrically.

Output is still one `flow-field.json` (now carrying a `solid` mask); every leg reads it untouched — comic
speed-lines wrap the body, dust piles windward + sheds a wake, from the same field. Honest limit: the wake
is *authored* (a placed pair), not emergent; genuine shed turbulence wants the light stable-fluids option.
See `proofs/session-4-figure-flow/session-4-report.md`.

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
