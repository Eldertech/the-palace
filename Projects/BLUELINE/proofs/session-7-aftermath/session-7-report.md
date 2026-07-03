# BLUELINE Session 7 — THE AFTERMATH FRAME: the still remembers the motion

**Date:** 2026-07-03 · Mac-side Blender 5.1.2, local, no GPU rent.
**Thread:** Motion & Flow — a **new capability**: the dramatic still as the *record of a motion*.

**The idea.** Many BLUELINE frames are the **moment after** a dramatic movement: a sword has just
struck a wooden column, and the frame shows shards spraying, the air torn along the swing, the figure
in follow-through. Nothing in the frame moves, yet the frame **is** the swing — the viewer runs the
motion backwards from the debris. Comics call this **closure**; it is the single most powerful thing
the medium does, and it is native to BLUELINE's comic register ([[Graphic Storytelling]]).

**The proof.** `out/s7_aftermath.png` (+ `out/aftermath.blend`). A sword-into-column aftermath frame
where **every element is derived from ONE authored motion** — the swing arc (windup → impact),
advanced to "now" — and rendered on the real MPFB2/Rigify figure.

## The principle — one motion, four registers

The swing is authored once as a **quadratic bezier arc** (WINDUP → MIDARC → CONTACT). Everything else
is a function of that arc and of `TNOW` (frames since impact):

| Layer | Derived from the arc how |
|---|---|
| **Follow-through pose** | the figure reaches to the arc's end; the sword is attached to the **actual** posed right-hand position (read back from the rig — no IK guessing) |
| **Swing wake** (dust) | parcels emitted along the arc, each spread by its **time-since-passage** (`age`) — tight & recent near impact, dissipated near the windup: *the air the blade tore through* |
| **Impact shards** | wood chunks ejected from the contact with velocity = **blade direction** + radial spray + gravity, flown **ballistically** to `TNOW` — mid-flight, tumbling |
| **Speed-lines** | tapered streaks trailing the blade tip **up the arc** it just travelled |

This is the flow-field spine's single-source discipline **extended into time**: the source is no longer
a static field but a *motion*, and the comic registers (speed-lines, dust) and the cinema registers
(shards, follow-through) stay in register because they share the one trajectory. *The arrow doesn't
just become the wind — the arrow's whole history becomes the frame.*

## Why it belongs to the plan

- It's the natural completion of **Edge 1 → Edge 2 (field → clock).** Sessions 5/6 gave a field the
  figure disturbs *ambiently*; here the figure's **own motion is the source**, and because the impact
  lands on a beat, every effect is a function of `(now − impact_time)` — which *is* the clock coupling.
  The aftermath frame is the thing that makes Edge 2 concrete and dramatic.
- It reuses the whole stack: the [[Shop/Figure Rig]] (posed), Session 5/6's particle machinery (the
  wake), and points straight at **Track VI** for the productized versions (Mantaflow dust burst,
  rigid-body / Cell-Fracture shards, "move the ink" speed-line stylization).

## Deposit-worthy concept

This earns a concept entry — proposed name **[[The Aftermath Frame]]** (aka *the still remembers the
motion*): the dramatic still as the time-integral of an authored motion (pose + wake + ejecta + smear),
the reader supplying closure. Flagged here as a ghost for a Deposit Ceremony.

## Honest limits (what a next pass should push)

- **All effects are procedural/ballistic + numpy-baked** — the faithful, deterministic first proof.
  Productization: **Track VI Mantaflow** for a real emergent dust burst, **rigid bodies / Cell Fracture**
  for shards that actually break *from* the column (here they eject from the contact; the column isn't
  fractured), and the GN studio (Session 6) to carry the wake.
- **The pose is a rough follow-through** — the sword is attached to the real hand (robust), but the grip
  and stance want hand-tuning; a saved swing pose on the Figure Rig is the clean version.
- **Clay render, not stylized.** The BLUELINE payoff is this composite fused to pen-flow ink (Steer the
  Generator's img2img) with the shards/speed-lines as ink marks — the next step, and where it becomes a
  real board.
- **Speed-lines cluster** at the blade tip; fanning them along the slash and stylizing as ink is the
  comic-register refinement.

## Files
- `build_aftermath.py` — the whole proof (arc · pose+sword · column · shards · wake · speed-lines · camera).
- `out/s7_aftermath.png` — the aftermath frame. `out/aftermath.blend` — open to move the arc / re-pose / retime.
