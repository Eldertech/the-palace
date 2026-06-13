# BLUELINE Session 3 — Flow-field spine spike report

**Date:** 2026-06-13 · Mac-side Claude Code · the [[BLUELINE — Claude Code Job]] Session 3 — *the #1 risk.*
**Question:** does **one authored field** truly serve all three resolutions of reality, or does each leg
need its own transfer function on top of a shared source?
**Design:** built to **falsify the strong claim** — one field array (`flow-field.json`) is read
*untouched* by all three legs; whatever each leg must add is the measured per-leg cost.

See `renders/CONTACT-SHEET-one-field-three-resolutions.png` — the vortices sit in the **same places**
across source / drawn / steers / sim because every leg reads the same source.

---

## The one source

`field.py` builds **one** divergence-free field = curl of a scalar potential (a laminar "rushing-by"
drift + four Gaussian vortices), samples it to a 120×76 grid, and exports `flow-field.json`. That file
is the spine. No leg edits it; `legs/flowlib.py` (Python) and the JS `sample()` (Three.js) only *read*
it.

## The three resolutions (each rendered from the untouched source)

1. **Drawn** (`legs/drawn_speedlines.py` → `01-drawn-speedlines.png`) — streamlines integrated through
   the field, rendered as tapered comic speed-lines. The comic register.
2. **Steers** (`legs/steers_motion.py` → `02-steers-motion.png`) — the dense motion-vector **HSV map**
   (the render-conditioning form) **+** a **Go-with-the-Flow noise-warp** demo: Gaussian noise
   backward-warped along the flow and re-normalised across t0/t2/t4, showing the field carries coherent
   motion into the diffusion noise. *(The full GtF video-diffusion run is deferred — see below.)*
3. **Sim** — particles advected by the field, **two forks**:
   - real-time: `legs/particles.html` (Three.js, 6,000 particles, trails) — verified live (port 8201).
   - offline: `legs/blender_particles.py` → `03b-sim-blender.png` (Blender, beveled-curve trails,
     emissive, real 3D geometry).

---

## VERDICT — strong vs likely-true

**Strong claim** (one *untouched* field serves all three legs, zero per-leg work): **FALSIFIED.**
**Likely-true claim** (one shared *source* + a thin per-leg transfer): **HOLDS — and the transfer is
small.** Every leg read the identical `flow-field.json`; none re-authored the field. What each leg
added was a thin, mechanical mapping:

| Leg | Field edited? | Per-leg massaging (the measured cost) | Size of the cost |
|---|---|---|---|
| Drawn | no | seed strategy (jittered grid), step length, streak count, magnitude→width taper | render params only |
| Steers | no | **one scalar** `dt_px` (magnitude → pixels/frame ≈ 9.3) to match displacement units; HSV normalisation | ~1 scalar + a viz map |
| Sim | no | velocity `SCALE` + `dt` + re-seed-on-exit (identical in both forks) | ~2 scalars + seeding |

**Conclusion:** the single-source coupling is **real and load-bearing.** The field *is* the spine —
the comic speed-line and the dust plume are literally the same arrow at different fidelities, so the
registers stay in register automatically. But "one *untouched* field" overstates it: each leg needs a
**scalar magnitude scale + a seeding/format choice**. That is *thin mapping, not re-authoring* — the
expensive thing (the field's structure, its vortices and drift) is shared and untouched. This is
exactly the **shared-source-plus-mapping** form [[The Flow Field is the Spine]] predicted; the entry's
confidence moves `hypothesis → working`.

**De-risking outcome:** the project's #1 risk is substantially retired. The novel bet pays off in its
practical form; the residual per-leg cost is characterised and small.

---

## Sim-engine fork — decided

**Use both; they are complementary, not rivals** (the same pattern S1/S2 found):

- **Three.js (real-time) = author + preview.** Instant feedback, 6,000 particles live, browser-
  deployable, ideal for *dialing the field and the sim look* in the loop. Limits: flat/2D, no
  depth-correct compositing, stills are screenshots.
- **Blender (offline) = bake the hero render.** Real 3D tube geometry, depth-correct, compositing-ready,
  motion-blur/volumetrics available — the fidelity the browser can't hold. Slow (offline).

**Decision:** previz and tune the field in **Three.js**; when a shot is chosen, **bake the same field
to Blender** for the offline hero render. The shared `flow-field.json` makes the handoff lossless (same
spine, both engines) — the Session-2 "spec-is-the-interchange" lesson, again.

---

## Go-with-the-Flow — assessment (propose? )

**Not adopted as a Specialist this round** (frugality bar). What's proven: the **noise-warp mechanism**
(warp-along-flow + renormalise) carries the field's motion coherently — `02-steers-motion.png`. What's
**not** done: an actual **GtF video-diffusion run** (their warped-noise sampler + a video model). That
is the heavier next step — a real model install + their pipeline — the same "prove the mechanism now,
defer the heavy model" call made for FLUX in Session 1.
- **Recommendation:** keep `Go-with-the-Flow` as the **published `source` entry** (already in the
  Deposit Map) and as a **candidate Specialist** pending one real video-diffusion run. When that run
  happens and produces a real flow-driven clip, *then* `Shop/Go-with-the-Flow` earns its entry. Until
  then it's a recipe-grade mechanism inside the flow-field-spine workflow, not a stocked tool.

---

## Write-back

- **`flow-field-spine.md`** workflow doc drafted in this bundle (`../../flow-field-spine.md`) — the
  one-field → three-resolutions recipe, per the Deposit-Map "bundle docs before skills" decision.
- **[[The Flow Field is the Spine]]** confidence `hypothesis → working`; framing updated to lead with
  shared-source-plus-mapping (the entry's own note invited this on spike report).
- **Sim engine:** resolved (Three.js previz + Blender bake).
- **Go-with-the-Flow:** source entry stands; Specialist deferred to a real video-diffusion run.
