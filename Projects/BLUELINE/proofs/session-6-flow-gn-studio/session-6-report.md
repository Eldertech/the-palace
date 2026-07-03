# BLUELINE Session 6 — the Geometry-Nodes FLOW STUDIO on the real Figure Rig

**Date:** 2026-07-03 · Mac-side Blender 5.1.2, local, no GPU rent.
**Thread:** Motion & Flow · Edge 1 (pose → field), made **interactive and native**. Wires Session 5's
authored 3D flow field into **Geometry Nodes**, on the **real [[Shop/Figure Rig]] character** (MPFB2 +
Rigify IK), so it can be posed and the field tweaked by hand.

**Deliverable:** `out/flow_studio.blend` — open it and work. Plus `out/s6_still.png` (hero) and
`out/s6_flow_studio.mp4` (default motion). Built by `build_flow_studio.py` (headless, reproducible).

## How to use it

1. **Pose the figure.** Select `FigureRig` (the 376-bone Rigify IK rig), grab a control — `foot_ik` /
   `hand_ik` / `torso` / `chest` / `head` — and move it. Scrub the timeline: the dust **re-parts around
   the new pose** (the obstacle is the *live evaluated* `FigureBody` mesh via Geometry Proximity, so a
   re-pose updates the collision with zero extra steps).
2. **Tweak the field.** Two ways:
   - **In the viewport:** move the `Vortex_A` / `Vortex_B` empties — they are the swirl centres.
   - **On the modifier:** select `FlowDust`, open the **Flow3D** Geometry Nodes modifier, and slide the
     exposed inputs — **Wind** (direction+strength), **Vortex A/B Strength**, **Core** (swirl tightness),
     **Dt** (step size), **Shell** (body standoff), **Count**, **Domain Min/Max**, **Dust Size**.
3. **Play.** The dust advects through the field each frame; it stays a pure function of the frame (a
   fixed field + fixed scatter seed → reproducible), so it's an instrument, not a re-rolled sim.

## How it's built (the Geometry Nodes tree)

One `BluelineFlow3D` node group on a `FlowDust` object:
- **Scatter** `Count` points across the domain box (deterministic — `Random Value` seeded by index).
- **Simulation Zone** (the stateful advection): each step samples the **authored field** at each point —
  `Wind + Σ vortexᵢ`, where each vortex is `g·cross(ẑ, r⊥)/(|r⊥|²+core²)` read from the moveable empties
  (Object Info) — a divergence-free field, the GN form of Session 5's math.
- **Deflection:** sample the figure's **true surface normal** (`Sample Nearest Surface`) and cancel the
  velocity component *into* the surface, so flow slides around the body.
- **Recycle:** any particle that breaches the `Shell` is teleported to a fresh **upwind inlet slab** — so
  the vast majority deflect around, and the few that would penetrate never accumulate on the body (this
  is what keeps a long playback clean — verified at frame 120).
- **Instance** a small ico per point → the dust, with a dark material, rendered natively from the
  studio's camera + lights.

## VERDICT — an interactive, native, poseable flow studio

The flow field is now **authored in Geometry Nodes, tweakable live, coupled to the real posed Figure
Rig**. Posing the Rigify rig re-shapes the obstacle; moving the vortex empties / modifier sliders
reshapes the field; both update in the viewport. This is the productization Session 5 named — Edge 1
moved from a headless proof into a hand-editable tool on Loudon's familiar posing surface.

## Honest limits

- **Occasional clinging motes in deep concavities** (between thighs, armpits) where the nearest-surface
  normal is ambiguous — a known hard case for stateless particle–mesh collision. The recycle keeps it
  from *accumulating*; raising **Shell** or lowering **Dt** reduces it. The clean-emergent answer is
  **Mantaflow** (Track VI) with the figure as a collision object — the escalation when a shot needs it.
- **Dust only (no streamlines yet).** Session 5's second register (streamlines) isn't in the interactive
  tree; adding it is a Repeat-Zone field-line trace (next pass).
- **Not yet stylized or clock-driven.** Feeding the passes to the pen-flow render (Edge 1's img2img fuse)
  and pinning the field's evolution to the song playhead (**Edge 2, field → clock**) are the next lifts —
  the Simulation Zone is already frame-parameterized, so Edge 2 is close.
- **The figure is the studio's default MPFB2 body** in its rest pose; pose it (or append a different
  body) — the obstacle interface is the same.

## Files
- `build_flow_studio.py` — builds the whole studio headless (reproducible; run on `figure_rig_studio.blend`).
- `out/flow_studio.blend` — **the deliverable** (open, pose, tweak). `out/s6_still.png` · `out/s6_flow_studio.mp4`.
