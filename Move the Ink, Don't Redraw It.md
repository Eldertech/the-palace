---
title: Move the Ink, Don't Redraw It
type: concept
pillars:
  - tools
  - creation
  - practice
born: 2026-06
stage: growing
last_activated: 2026-06-26
activation_count: 2
forward_vector: "I want to keep proving that motion belongs to geometry, not to the regenerator — to hand the frame maker a way to make any drawn thing breathe without it boiling, and to find the honest line where my one-still rule must finally yield to a fresh draw."
links:
  - target: "[[The 2.5D Paper Stack]]"
    type: couples-with
    label: breathes-via
  - target: "[[BLUELINE]]"
    type: connects-to
    label: proved-in
  - target: "[[Frame Designer]]"
    type: enables
    label: motion-primitive-for
  - target: "[[Sam Maloof]]"
    type: contradicts
    label: repetition-teaches-the-hand-boils-the-model
---

# Move the Ink, Don't Redraw It

![[Move the Ink, Don't Redraw It — hero.png]]

To make an inked thing move without losing the hand-drawn look, **draw it once and move it with geometry.** The AI (or the hand) makes the still; a deterministic field animates it. The slogan: **AI makes the still; geometry makes the motion.**

## Why redrawing fails

Ask an image model to restyle every frame and the look *boils* — each frame is drawn slightly differently, so the ink crawls and shimmers between frames. Warp a *single* inked still instead, and the motion is exact: if the displacement field returns to its start, frame N equals frame 0 by construction — a seamless loop, no boil.

Measured on the same moving smoke, frame-to-frame change:

- deterministic warp / NPR substrate — **0.15 / 255**
- per-frame AI restyle — **1.50 / 255** (~10× worse, and that figure flatters the AI)

## The same rule, the substrate too

The stability move on the stylize side is the same one: when turning a sim into ink, the procedural paper tooth is generated **once** and reused on every frame. A static substrate cannot boil. The lesson generalizes — at every layer where stability matters, fix the thing once, don't remake it each step. AI for the inked still, AI for the paper grain — never AI for the frame-to-frame motion.

## How it shows up

This is the per-sheet motion primitive for [[The 2.5D Paper Stack]] — how each sheet breathes. Displacement fields warp the drawn ink: ripple for water, an upward lick (base pinned, tips free) for flame, a low slow billow for cloud. The drawing's own lines move; nothing is regenerated.

## The honest edge

It only covers **displacement** — motion where the thing keeps its shape and just moves. When the topology changes — smoke billowing into new shapes, dust scattering, a thing appearing that wasn't drawn — there is no stable ink to push, and you must simulate or generate fresh. That boundary is where a redraw earns itself, and naming it is half the value.

A second boundary, finer: **physically-grounded** motion is available — drive the warp from a baked sim's velocity field instead of a procedural one — but as of 2026-06 it doesn't clearly beat procedural. The velocity-driven version reads more organic (the ink deforms along the sim's actual shape, not a synthetic wave) but currently carries a faint loop seam and a geometry mismatch when the sim and the plate have different aspects. Two specific fixes would change that: render the sim at the plate's aspect ratio, and integrate the flow into a periodic field instead of cross-fading frames. Until those land, procedural fields are the simpler win; the physically-grounded path is *available* and worth reaching for when a shot demands sim-accurate motion, not as a default.

## Ancestry

It is *"manipulate the existing ink, slowed down"* made literal, and it rhymes with the [[BLUELINE]] M3 finding that a locked seed beat per-step warp for consistency — the same lesson twice: stability comes from fixing the thing once, not remaking it each step. The academic backbone is *Endless Loops* (Halperin et al., SIGGRAPH 2021) — periodic displacement fields with temporal smoothing.

---

## Forward Vectors

- **Keep proving it.** Apply the one-still rule to each new element and sheet; the win compounds as the [[Frame Designer]]'s default for any drawn motion.
- **Find where it yields.** Map the displacement / topology-change boundary precisely — the catalogue of cases where you must stop moving ink and start making it.
- **Open question:** can a *physically-grounded* field (a baked simulation velocity) drive the warp better than a procedural one — real motion on drawn ink? The bridge is built; the proof is owed.
