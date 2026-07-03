# BLUELINE Session 4 — the flow field flows around a CHARACTER

**Date:** 2026-07-02 · Mac-side Claude Code · moving [[The Flow Field is the Spine]] out of research
and into the actual graphic generations, coupled to the posed-mannequin work.
**Question:** the Session-3 field was character-*blind* — drift + hand-placed vortices, nothing knew a
figure was standing in the wind. Can the same one-field spine be made **character-aware**, so the motion
flowlines are *disturbed by* and *flow around* a posed character — and does it still stay one field feeding
both registers?

See `renders/CONTACT-SHEET-one-field-around-a-character.png` — the crouching hero sits in the **same place**
in the source field, the drawn speed-lines, and the dust sim, because all three read the same
character-aware `flow-field.json`.

---

## What was coupled

Two proven-but-separate threads met here:

- **the flow-field spine** (Session 3: one authored field → drawn / steers / sim), and
- **the posed mannequin** (the `redraw-posed-figure` crouching hero, with its depth + OpenPose plates).

The missing piece was the one neither did: **make the character a boundary condition in the field.**

## The method (potential-flow + seeded wake — the deterministic path Loudon chose)

`field.py`, all on this Mac, ~1 s:

1. **Base field** — a laminar "wind" drift blowing left→right + a little ambient swirl (curl of a scalar
   potential, so divergence-free).
2. **Obstacle mask** — the mannequin silhouette. The depth plate has the true filled limbs but fuses with a
   bright ground plane; the OpenPose plate is the skeleton on pure black. So we use the **pose skeleton,
   dilated, as a locator** and keep only the depth silhouette inside it → the true body, floor and
   background pillars removed (12.4 % of frame).
3. **Pressure projection** — zero the velocity inside the body, then one Poisson solve (scipy sparse) so the
   fluid is divergence-free **and tangent to the body**: `∇²p = ∇·v`, Neumann (no-flux) at the body surface
   and top/bottom walls, open inlet/outlet at left/right. `v = v − ∇p`. Streamlines now bend around the
   silhouette, compress + speed up past the shoulders/hips, and stagnate on the windward chest.
4. **Wake** — a counter-rotating vortex **pair** seeded just behind the body's lee edge (curl of gaussians,
   divergence-free), so the disturbance sheds downwind instead of re-closing symmetrically. Added before the
   projection, so it too respects the body.

Everything downstream reads the resulting `flow-field.json` **untouched**, exactly as Session 3.

## The two registers (both from the untouched character-aware field)

1. **Drawn** (`legs/drawn_speedlines.py` → `01-drawn-speedlines-around-body.png`) — comic speed-lines part
   around the head/torso/crouched legs, arc underneath, squeeze between the legs, and trail into the wake.
   Streamlines that would enter the body stop at the surface; seeds never start inside it.
2. **Sim** (`legs/dust_sim.py` → `02-dust-around-body.png`) — 60 k dust particles advected by the same field:
   dust flows around the body, **piles bright on the windward (wind-facing) edge**, and **sheds into the two
   wake vortices** behind the figure. Fully vectorised (numpy), ~9 s for 1100 emission frames.
3. **Live** (`legs/particles.html`) — a self-contained canvas sim of the same field for real-time scrubbing
   (particle count / speed / turbulence / trail persistence / windward-pile toggle). Verified rendering in
   Chrome: dust fills the frame, the body is a clean void, windward pile-up flecks accrete on the left edge.
   *(served: `python3 -m http.server 8202 --directory Projects/BLUELINE/proofs/session-4-figure-flow`,
   open `/legs/particles.html`.)*

---

## VERDICT

**The spine survives the coupling.** One character-aware field, read untouched, produces both the comic
speed-lines *and* the cinema dust — and in both, the flow visibly (a) parts around the silhouette, (b)
compresses past the shoulders/hips, (c) piles on the windward side, and (d) sheds a wake behind. The
per-leg cost stayed the Session-3 shape (a seeding/format choice + a magnitude scale); the *new* cost is a
one-time **field-build** step (mask + projection), not a per-leg one. So the coupling adds a stage to the
*field author*, not to each register. **This is exactly the promotion [[The Flow Field is the Spine]] named —
"the arrow becomes the wind" — with one addition: now the wind knows the body is there.**

### Honest limits (what shot #2 should push)

- **Potential-flow wake is authored, not emergent.** The pair reads well but is placed by hand; genuine shed
  vorticity / turbulence wants the light stable-fluids option (deferred by choice this round).
- **Static in time.** Like Session 3 the field is one frozen instant; a per-beat-evolving field (dust
  actually blowing through the shot) is the next escalation, and pairs with [[Move the Ink, Don't Redraw It]]
  (the field is the geometry that makes the still move).
- **The mask is a mannequin, not the final ink figure.** Good enough to prove the physics; the real pipeline
  would derive the obstacle from the same board-record pose that conditions the render, so the *rendered*
  character and the *obstacle* character are the same silhouette by construction.
- **Sharp-corner speed spikes.** The voxelised silhouette makes a few `mag` hot-spots at limb corners
  (clamped for width/brightness); a light mask blur or a proper cut-cell boundary would smooth them.
- **Not yet fed to the render.** The dust + speed-lines are elements; the next move is compositing them as
  depth-tagged passes *behind/around* the stylized figure (the [[The 2.5D Paper Stack]] lens), and driving
  **flow-field-biased ink splatter** so the spatter follows the same lines (the blender-handdrawn Part-4 hook).

---

## Write-back (proposed — not yet committed)

- New proof bundle `proofs/session-4-figure-flow/` (this file + `field.py` + `legs/` + `renders/` + `inputs/`).
- [[The Flow Field is the Spine]]: add the character-aware result; the "two lifetimes / the arrow becomes the
  wind" section now has a concrete first proof of the body disturbing the field. Stage `sprout → growing`.
- [[flow-field-spine]] workflow doc: add a **§ obstacle** step (mask → projection → wake) as the field-author
  stage that precedes the three legs.
- Candidate next Shop Specialist only if this recurs: a `field-around-a-body` builder. Not yet — one shot.
