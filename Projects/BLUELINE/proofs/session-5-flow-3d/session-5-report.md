# BLUELINE Session 5 — the flow field goes 3D, in Blender, around a POSED figure

**Date:** 2026-07-03 · Mac-side Blender 5.1.2 (headless), local, no GPU rent.
**Thread:** Motion & Flow · Edge 1 (pose → field), moved into **3D space** in the same scene the
Figure & Pose thread lives in. Builds on [[The Flow Field is the Spine]] + Session 4 (character-aware
2D field) + the Track-IV bench (posed figures).

**Question:** Session 3/4 authored the field in the **2D plane**. Can the *same single-source spine*
live in **3D**, coupled to a **real posed figure mesh** — so particles and streamlines part around
the actual body (not a 2D mannequin *mask*), from the shot's own camera, deterministically?

See `out/s5_still.png` (hero) and `out/s5_flow3d.mp4` / `.gif` (60 frames of it moving).

## Method (`session5_flow3d.py`, ~6 s still / ~3 min for the 60-frame seq)

Run on a Track-IV bench blend (`IV-A` = sword-draw lunge × worm's-eye) — reusing its **posed body,
camera, and light**:

1. **Obstacle = the real posed figure.** The metaball `Body` is evaluated to a mesh and wrapped in a
   `BVHTree`; every flow query does `bvh.find_nearest`. This is the point: the obstacle is the *3D
   figure that would be rendered*, closing Session 4's honest limit (there the obstacle was a 2D
   depth-mask of a mannequin). Swapping in the full [[Shop/Figure Rig]] MPFB2 mesh is a one-line change
   (same BVH interface).
2. **One authored, divergence-free 3D field.** `v(p) = drift + Σ gᵢ·(aᵢ × r⊥)/(|r⊥|²+coreᵢ²)` — a
   uniform wind plus a few **vortex filaments** (the 3D form of Session 3/4's curl-of-potential; each
   term is a curl, so the field is divergence-free). The wind is **aligned to the camera** (blows
   screen left→right at the body's depth) so the parting reads from *this* shot. Vortices are placed in
   the camera frame: a tight **wake** just downwind of the body, a windward eddy, a low cross-swirl.
3. **Read the one field two ways in the same 3D scene (single-source):**
   - **Particles** (sim / cinema leg): a curtain seeded upwind at the body's depth, advected through
     the field (numpy, fixed `rng(SEED)`), **deflected** near the body (cancel the into-surface velocity
     component + push off the shell) so they flow *around* it; recycled downwind. Baked to Blender geo.
   - **Streamlines** (drawn / comic leg): integrated through the *same* field from a screen-vertical seed
     grid, deflected by the same BVH, built as beveled curves.
4. **Native Blender render** from the bench camera (EEVEE, the blend's own Sun) — figure matte grey,
   flow dark on a light world.

## VERDICT — the spine survives the move to 3D

**One authored 3D field, read as both streamlines and particles, visibly (a) sweeps in, (b) parts
around the torso, (c) sheds a tight wake vortex downwind, and (d) carries the dust through — in true
3D, around the real posed figure, from the shot's camera.** The single-source discipline held: the
comic leg (streamlines) and the cinema leg (dust) are the *same field*, so they stay in register by
construction. **Determinism:** a printed particle-sum fingerprint is identical on re-run for a given
`SEED` — it stays an instrument (a pure function of seed+frame), not a simulation you re-roll.

This is Edge 1 done **3D-native**, and it retires two of Session 4's honest limits at once: the
obstacle is now the real figure (not a mask), and the field/particles live in the render scene (not a
2D composite bolted on afterward).

## Honest limits (what a next pass should push)

- **The advection engine is Python (numpy), baked to geometry.** That's the faithful single-source
  proof (same math as Session 4's `dust_sim`, lifted to 3D + real-mesh deflection). The **productization
  path is native**: a **Geometry Nodes Simulation Zone** (author the field as a node group, advect a
  point cloud, obstacle via `Geometry Proximity` — art-directable in the viewport), with **Mantaflow**
  (Track VI's engine) as the escalation for *emergent* smoke/dust and a genuinely shed wake.
- **The wake is authored** (a placed vortex), not emergent — same caveat as Session 4. Mantaflow closes it.
- **The obstacle is the bench metaball body**, not the full Figure Rig mesh — good enough to prove the
  physics; the real pipeline derives it from the same board-record pose that conditions the render.
- **Not yet stylized or fed to the render.** The next move is compositing these as depth-tagged passes
  behind/around the stylized figure and a low-denoise img2img fuse to pen-flow ink (Edge 1's
  "feed-the-field-to-render"), and **flow-field-biased ink splatter** (blender-handdrawn Part-4 hook).
- **Not yet clock-driven** — the sim is frame-parameterized but not pinned to the song playhead; that is
  **Edge 2 (field → clock)**, which this sets up directly (the sim becomes a keyed function of the beat).

## Files
- `session5_flow3d.py` — the whole proof (field · advection · BVH deflection · streamlines · render).
- `out/s5_still.png` — hero still. `out/s5_flow3d.mp4` / `out/s5_flow3d.gif` — 60-frame motion.
- Launches on any Track-IV bench blend; defaults to `IV-A`.
