# BLUELINE Session 10 — real impact deformation + arc speed-lines

**Date:** 2026-07-03 · Mac-side Blender 5.1.2, local, no GPU rent.
**Thread:** Motion & Flow — closing two honest gaps in the [[The Aftermath Frame|aftermath/swing]] work.

## Two gaps Loudon caught

**1. There was no impact deformation at all.** Sessions 7–9 left the column a *static, undeformed
cylinder* and spawned shards separately — debris flew off a log that stayed whole, with no wound where
the shards came from. Physically inconsistent.

**2. The speed-lines were straight, and touched the blade.** They were drawn as straight streaks back
from the contact; they should be **arcs of the swing** and should **not touch the swinging object**.

## How impact deformation is calculated now

**The wound is the blade's swept volume, removed from the column.** A widened copy of the blade (the
*kerf* — blade length + 0.7 m so it passes through, cross-section 0.11 × 0.05 m) is **boolean-subtracted**
(EXACT solver) from the column. The column *loses material exactly where the blade passed* — a real
gash, visible on the near face. The **shards now emerge from that gash** (seeded along the slit, not from
a point), so the wound and the debris are consistent: the wood flew off *from the cut*. Shard velocities
still derive from the physical contact velocity `v_c` (from the swing solver).

- **Method:** boolean DIFFERENCE of the kerf; deterministic, reliable, art-directable.
- **The physical-max version (next):** **Cell Fracture** — pre-shatter the column, and the chunks the
  blade passes through *detach* and become the shards. Then mass is conserved by construction (the shards
  literally *are* the removed material) and you get real splinter geometry + radiating cracks. The boolean
  kerf here is the reliable first step; Cell Fracture is the productization (with rigid-body tumble).

## How the speed-lines work now

Each line **traces a point on the blade swept along the derived arc** — `PIVOT + blade_dir(u)·r` for a
few radii `r` across the blade span — so it is **curved: it follows the motion**. It runs over the
*recent* swing only, `u ∈ [0.70, 0.93]`, and **`U1 = 0.93 < 1.0`**, so it **stops short of the blade**
(which sits at `u = 1.0`): a clean, deliberate gap between the lines and the object they trail. Tapered
thin at the trailing end, thicker toward the (gapped) blade end. This is the classic manga swing-arc,
and it's now *derived from the same rotation* as everything else — change the swing and the arcs re-curve.

## VERDICT

The frame is now physically consistent at the impact: the column is cut, the shards come from the cut,
and the motion lines are arcs of the actual swing that respect the blade. Same split holds — the motion
and the wound geometry are real; the debris count / spread / streak-length are comic-amplified.

## Honest limits
- **Boolean slit, not a splintered wedge.** A real chop opens a V-notch with lifted splinters and cracks;
  the kerf is a clean slot. Cell Fracture (above) gives the splinters and conserves mass.
- Shards are still *spawned* to match the wound, not the *literal* removed mesh (that's Cell Fracture).
- Ballistic + numpy-baked; clay render. Stylize to pen-flow ink next; IK-animate the full swing.

## Files
- `build_impact.py` — the swing solver + the boolean wound + arc speed-lines (`--swing chop|side|rising`).
- `out/s10_impact.png` — the frame. `out/impact.blend` — open to inspect the wound (the `s8_kerf` boolean object).
