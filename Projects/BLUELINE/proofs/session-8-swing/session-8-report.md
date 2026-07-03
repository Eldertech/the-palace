# BLUELINE Session 8 — the SWING SOLVER: real motion, amplified consequences

**Date:** 2026-07-03 · Mac-side Blender 5.1.2, local, no GPU rent.
**Thread:** Motion & Flow — the physical method behind [[The Aftermath Frame]].

**The problem with Session 7.** The aftermath frame was faked: a hand-authored bezier arc through three
eyeballed points, and hand-tuned shard velocities. It looked plausible but nothing was *derived* — the
tip speed, the contact direction, the debris velocities were all just numbers picked by eye. A bezier is
a *shape*; a swing is a *rotation*. The difference is the whole physics.

## The method — a swing is a rotation; author ω(t), derive the rest

You author only the rotational state; **everything else is derived**:

| Authored | Derived |
|---|---|
| **Pivot** `p` (chest/shoulder for a chop) | the **arc** — blade direction `= rot(θ(u))·d_windup` |
| **Axis / plane** `n̂` (`= d_wind × d_imp`) | **velocity of any point** `v(r) = ω·n̂ × (r − p)` |
| **Angular trajectory** `θ(u)=Δθ·u^k` (peak ω at impact) | **tip speed** `= ω·R`, **contact velocity** `v_c = ω·n̂ × (r_c − p)` |
| **Blade** (rigid, grip→tip) | **impact energy** `½ I ω²` → the debris budget |

**Derived physics of this chop (printed every run — not eyeballed):**
`Δθ = 133° · ω_impact = 23.2 rad/s · tip speed = 32.9 m/s · |v_contact| = 20.2 m/s · dir = (−0.39, 0, −0.92)`.
A **32.9 m/s tip** is a genuine hard-chop speed; the contact velocity points **down-and-back**, which is
*correct* for an overhead chop — the pivot is above the impact, so past horizontal the blade sweeps down
and back under the shoulder. That single vector `v_c` is the physical source of every consequence.

## The split (per Loudon): real motion, amplified consequences

- **Real:** the swing **arc** and the derived velocities; the character's **trajectory** and a
  *somewhat-real* follow-through pose (hands on the grip, lunge, lean).
- **Amplified (comics are super-physical):** the **shards** and **wake** take their *direction and
  relative speeds* from the real `v_c`, but a **comic gain** scales the count, the spray cone, and the
  streak length — never the motion. So the debris is physically-sourced and dramatically outsized.
  - **Shards** burst along `v_c` + the wound's outward normal, wide cone, framed displacement.
  - **Speed-lines** trail the true incoming direction `−v_c`, tapered, length ∝ speed.
  - **Wake** dust seeded along the *derived* swept path, kicked by the real blade velocity.

## VERDICT — the motion is now correct, and it drives the frame

The frame is no longer authored directly; it is the **physics of an authored rotation, sampled at
'now'**. Change the swing (`PIVOT`, `R_TIP`, `T_IMPACT`, `ACCEL_K`, the windup direction) and the tip
speed, contact velocity, arc, and every consequence update together — because they all derive from the
one rotation. This is the reusable **Motion Model**: the same shape (pivots + trajectory + speed
profile → derived velocities → forward-sim to the closure frame) handles a punch, a leap, a throw, a
whip. Determinism holds (`θ(u)` is authored), so it stays an instrument and lands on the beat (Edge 2).

## Honest limits (what a next pass should push)

- **The pose is a follow-through approximation**, not yet the swing *animated* on the rig. The clean
  version is to **IK-animate the full swing** (windup→impact→follow-through), read the rig's real
  per-frame velocities, and render it — a short clip that *shows* the arc that produced the still. That's
  the definitive "the motion actually happened" proof; deferred here for reliability.
- **Consequences are procedural/ballistic + numpy-baked.** Productize via **Track VI** (Mantaflow burst,
  rigid-body / Cell-Fracture shards that break *from* the column) and the GN studio for the wake.
- **Clay render.** The BLUELINE payoff is fusing this to pen-flow ink so the shards + speed-lines become
  ink marks (Steer the Generator's img2img).
- **The wake still scatters** a little into the sky; tighter diffusion + a real vortex-shed model is the
  physical upgrade.

## Files
- `build_swing.py` — the swing solver (kinematic model · derived velocities · IK follow-through · amplified consequences), prints the derived physics.
- `out/s8_swing.png` — the frame. `out/swing.blend` — open to change the swing and watch the numbers move.
