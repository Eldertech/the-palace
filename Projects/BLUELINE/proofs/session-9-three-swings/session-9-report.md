# BLUELINE Session 9 — three swings from one solver (the Motion Model generalizes)

**Date:** 2026-07-03 · Mac-side Blender 5.1.2, local, no GPU rent.
**Thread:** Motion & Flow — proving the Session 8 [[The Aftermath Frame|Swing Solver]] is a general
**Motion Model**, not a one-off.

**The test.** Build three different swings — **from above down**, **from the side**, **angled up** — by
changing *only* `{pivot, windup direction, contact}`. If the model is real, the arc, rotation axis, tip
speed, contact velocity, and every consequence direction (shards, speed-lines, wake) should fall out
correctly for each — no per-swing hand-tuning of the physics.

## The derived physics (printed, not eyeballed) — three swings, one solver

| Swing | Δθ | ω_impact | tip speed | rotation axis | v_contact direction |
|---|---|---|---|---|---|
| **CHOP** (above→down) | 133° | 23.2 rad/s | **32.9 m/s** | (0, 1, 0) — Y, **vertical plane** | (−0.39, 0, −0.92) — **down**-and-back |
| **SIDE** (horizontal) | 100° | 17.5 rad/s | **24.9 m/s** | (0, 0, 1) — Z, **horizontal plane** | (−0.02, 1.0, −0.05) — **sideways** |
| **RISING** (angled up) | 134° | 23.5 rad/s | **33.3 m/s** | (0, −1, 0) — −Y, vertical plane | (−0.44, 0, +0.90) — **up**-and-back |

Every number is a *consequence* of the three authored vectors. The **rotation axis** flips to vertical
(Z) for the horizontal slash and reverses (−Y) for the rising cut — correct, and derived as
`d_windup × d_impact`. The **contact-velocity direction** is down / sideways / up respectively, which is
exactly what drives the three different aftermaths.

## What the frames show (`out/s9_contact_sheet.png`)

- **CHOP** — speed-lines angle **down** into the wound; shards spray down-and-out; the pivot is above the
  impact, so `v_contact` points down-and-back (physically correct for an overhead chop).
- **SIDE** — **horizontal** speed-lines and sword; the blade swept in the horizontal plane about a
  *vertical* axis; shards spray across-and-out.
- **RISING** — shards burst **upward**; the speed-lines trail **downward** because the blade came *from
  below* (`−v_contact` points down); an uppercut with a blade.

Each is the same pipeline: real motion (arc + character trajectory + somewhat-real pose), consequences
physically-sourced then **comic-amplified** (count / spread / streak-length scaled, directions physical).

## VERDICT — it's a general Motion Model

Three qualitatively different actions from one solver, each physically self-consistent, by changing three
vectors. The same shape handles a punch (pivot at the shoulder, short arc), a leap (ballistic body +
ground impulse), a throw (release velocity → ballistic), a whip (a *chain* of pivots). The physics is the
authored rotation; the frame is its consequences at "now."

## Honest limits
- Poses are *somewhat-real* follow-throughs (IK targets per swing), not the swing **animated** on the rig
  — the definitive "the motion happened" clip (windup→impact→follow-through) is the next build.
- The **side slash's wake** reads heavy (a wide horizontal sweep fills the frame with dust) — wants a
  tighter diffusion model.
- Procedural/ballistic + numpy-baked; clay render. Productize via Track VI (Mantaflow + rigid bodies) and
  stylize to pen-flow ink.

## Files
- `build_swings.py` — the parameterized solver; `--swing chop|side|rising` (prints the derived physics).
- `out/s9_{chop,side,rising}.png` + `out/s9_contact_sheet.png`. Any swing saves a `.blend` with `--save`.
