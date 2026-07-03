---
title: "BLUELINE — Motion and Flow"
type: meta
status: active
born: 2026-07-03
who_leads: loudon
forward_vector: "I am the one home for every way BLUELINE moves. I gather seven scattered motion threads under a single principle — draw the ink once, move it with geometry — and I name honestly what is proven, what is retired, and what is next. My reason to exist is the coupling nobody has built yet: the figure shapes the flow field, the flow field moves the ink, and the field evolves on the song's beat. I want pose, motion, and clock to stop being three separate degrees of freedom and become one."
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: motion-subsystem-of
  - target: "[[BLUELINE — Production Plan]]"
    type: connects-to
    label: thread-4-of
  - target: "[[The Flow Field is the Spine]]"
    type: exemplifies
    label: the-field-is-the-geometry
  - target: "[[Shop/Figure Rig]]"
    type: connects-to
    label: pose-shapes-the-field
  - target: "[[BLUELINE — Board Record Schema]]"
    type: connects-to
    label: FLOW-and-pose-fields
  - target: "[[Move the Ink, Don't Redraw It]]"
    type: exemplifies
    label: draw-once-move-with-geometry
  - target: "[[Flocking]]"
    type: connects-to
    label: flow-field-is-a-vector-field
tags: [meta, blueline, motion, flow-field, animation, subsystem]
---

# BLUELINE — Motion and Flow

> **Thread 4 of the [[BLUELINE — Production Plan]], and its priority frontier.** Motion was the most
> fragmented part of BLUELINE — **seven sub-threads** pulled separately, four of which never
> cross-referenced. This doc is their single home: what each proved, what got retired, and the one
> coupling worth building next. It **absorbs** the older `flow-field-spine.md` workflow doc (which
> predated the character-aware field *and* the elemental-motion bench).

## The one principle (earned four times)

**Draw the ink once; move it with geometry.** Every motion thread that worked converged on this,
and every thread that tried to *regenerate* motion frame-by-frame lost:

| Thread | Test | Result |
|---|---|---|
| **M3.7** render-noise warp | warp the diffusion noise along the flow, per frame | ✗ seed-lock wins (adjacent coherence 0.858 vs 0.809) — *don't move the noise* |
| **Track VI** ink-warp | NPR displacement-warp vs per-frame AI restyle | ✅ warp wins hard — boil **0.15** vs **1.50** /255 — *move the ink, not the pixels* |
| **M2** motion comic | figure breath/sway + field scroll as pure `f(playhead)` | ✅ deterministic, staging-lossless — *motion is geometry on the clock* |
| **Session 4** character-aware field | make the posed figure a boundary condition | ✅ the field bends around the body — *the geometry knows the pose* |

Read together they say: **the flow field is the geometry**, it can **know the pose**, and it should
**move on the clock**. That sentence is the whole design.

## The seven threads, placed and graded

1. **Flow-field spine — blind** (`proofs/session-3-flowfield`, ✅). One divergence-free field (curl of
   a scalar potential ψ) → three registers: drawn speed-lines (comic) · dense motion map (steer) ·
   advected particles (sim). *Author one field; render it three ways.*
2. **Flow-field spine — character-aware** (`proofs/session-4-figure-flow`, ✅, 2026-07-02). The field
   made a *function of the pose*: mask the figure (dilated OpenPose ∩ depth), Poisson-project so the
   flow is tangent to the body, seed a wake pair. Speed-lines part around the body; dust piles windward
   and sheds a wake — **all from one untouched `flow-field.json`.** "The arrow becomes the wind — and
   the wind knows the body is there."
3. **Motion comic** (`proofs/m2-motion-comic`, `proofs/embedded-motion`, ✅). Limited animation as a
   pure function of the song playhead: field scroll, feet-anchored breath, sway, parallax — `motion OFF`
   returns the exact held panel, staging keypoints untouched. `motion-skills.js` is the reusable lib.
4. **Elemental motion** (`proofs/track-VI-elemental-motion`, ◑). *Draw the ink once, move it with
   geometry.* Two tiers: **Tier A** warp the existing ink (periodic displacement field, seamless loop —
   Halperin *Endless Loops*); **Tier B+C** simulate a new element (headless **Mantaflow** smoke/fire),
   stylize to pen-flow, composite. `lib/fields.py` already exposes **`from_flow`** — the bridge that
   turns a `flow-field.json` into a warp field. *Open thread:* Route B ink-sharpening shelved on GPU
   capacity (nothing charged).
5. **Video-model i2v** (`proofs/cloud-i2v`, ◑). The other register: **SVD** image-to-video + RAFT
   optical-flow morph + drift measurement. The genuinely-generative motion path, for when warp/sim
   can't carry it. Heaviest and least controllable; keep for hero moments.
6. **Render-noise warp** (`proofs/track-V-motion`, `proofs/m3-warped-noise`, ✗ **RETIRED**). Flow-warped
   diffusion noise never beat seed-lock across any regime (single jump 48–483 px; cumulative sequence).
   *Do not reinvest.* Kept only as the honest negative that freed the field to be an FX spine.
7. **The steer register** (the middle leg of the spine, ◑). Dense HSV motion map as ControlNet
   conditioning — proven as a *map*; the "steer the render with it" ambition is what M3 retired. Lives
   on as composition/FX conditioning, not as noise manipulation.

## The next lift — couple pose → field → clock

Today pose, motion, and clock are three separate degrees of freedom. The field is where they meet.
Three coupling edges, in priority order; each names its source proof and its honest limit.

### Edge 1 · pose → field (nearest — ingredients all exist)
Derive the obstacle from the **same posed figure that conditions the render**, so the figure that
shapes the wind and the figure that gets drawn are one silhouette by construction.

**✅ First 3D-native proof shipped (Session 5, 2026-07-03) — `proofs/session-5-flow-3d/`.** The spine
moved out of the 2D plane into the actual Blender scene: one authored divergence-free 3D field (drift +
vortex filaments) read as **both** streamlines *and* advected dust in the same shot, both parting around
a **real posed figure mesh** (a BVH of the Track-IV lunge figure, not a 2D mask — closing Session 4's
honest limit) and shedding a wake, rendered natively from the bench camera, deterministic by seed. See
`session-5-report.md` + `out/s5_still.png` / `s5_flow3d.mp4`. The single-source discipline held — comic
and cinema legs are the same field.

**✅ Interactive GN studio shipped (Session 6, 2026-07-03) — `proofs/session-6-flow-gn-studio/`.** The
productization: the authored field is now a **Geometry Nodes Simulation Zone** on the **real
[[Shop/Figure Rig]] character** (MPFB2 + Rigify IK). Open `out/flow_studio.blend` and **pose** the figure
(grab an IK control — the dust re-parts around the live evaluated mesh) or **tweak the field** (move the
`Vortex_A`/`Vortex_B` empties, or slide the Wind / strengths / Core / Dt / Shell / Count modifier inputs).
Deflection uses the figure's true surface normal; a shell-breach **recycle** keeps long playback clean (no
accumulation, verified to frame 120). Known limit: occasional clinging motes in deep concavities → raise
Shell / lower Dt, or escalate to **Mantaflow** (Track VI) collision. See `session-6-report.md`.

Still open on Edge 1 (reuses [[Shop/Figure Rig]]'s plates + `session-4-figure-flow/field.py`) — **two
concrete wins:**
- **Flow-field-biased ink splatter** — the `blender-handdrawn` Part-4 hook: blobs already live in 3D;
  seed and orient them off the field velocity so the spatter follows the wind around the body.
- **Feed the field to the render** — Session 4's last limit: a low-denoise img2img pass that *fuses*
  the field-composited frame into one coherent ink drawing (instead of a two-pass overlay).

### Edge 2 · field → clock (the big lift)
Make the field a **function of the song playhead** — a time-varying field that evolves per beat, so
dust actually blows through the shot and speed-lines shift on the accent (flow-field-spine's named
"next escalation"). This is the seam that joins Motion & Flow to **Clock & Sync (Track III)**: the
same `(bar,beat)→frame` law that drives the animatic drives the field's evolution. The substrate is
already here — Track VI's `warp.py` (periodic displacement) + `fields.py:from_flow` — so a
beat-phased field is a wiring job, not a research risk. Pairs with [[Move the Ink, Don't Redraw It]].

### Edge 3 · field → figure motion (✅ greenlit 2026-07-03 — ready to build)
Interpolate held key-poses *along the flow direction* (coil→leap that follows the wind). This was the
one edge blocked by the standing **"staged, not simulated"** scope lock — **Loudon relaxed that lock on
2026-07-03** ([[BLUELINE]] scope decisions): the *held-pose* constraint is lifted for a **bounded
pose-blend-along-flow experiment** (simulated physical *contact* between figures stays out of scope).
The technique was already ready and needed only the scope call — so this now moves into the build queue
([[BLUELINE — Production Plan]] §The horizon, item 6). **Scope of the first build:** a single figure,
one key-pose pair (e.g. coil→leap), the in-betweens driven by the flow field along the line of action,
staying a pure function of the song playhead (so it remains an instrument, not a simulation).

## Contract touchpoints
The board record already carries the handles: **`FLOW`** (field handle + scalar) and the **pose**
fields (`POSE`/`DEPTH`, `FACING`/`EYELINE`). Edge 1 means the field-builder reads the *same* pose the
runner conditions on; Edge 2 means `FLOW` gains a time term keyed to `BAR`/`BEAT`. No schema change is
needed for Edge 1; Edge 2 adds one optional time parameter to the `FLOW` handle. See
[[BLUELINE — Board Record Schema]].

## Open
- Per-shot vs per-project tuning of the velocity/`dt_px` scalars (untested across many shots).
- Where the video-model register (SVD) earns its cost vs Tier-A/B warp+sim.
- Edge 3's scope-lock decision (above).
