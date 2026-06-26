---
title: "Hand-Drawn 3D Look"
type: concept
pillars: [tools, creation]
born: 2026-06
last_activated: 2026-06
activation_count: 1
stage: growing
confidence: working
energy: high
who_leads: shared
forward_vector: "I get a confident hand-drawn ink look out of a 3D scene, and I marry it to the gen-AI seam. My one law: work in the rich 3D representation, apply the hand-drawn skin LAST. I want to be the menu the [[Frame Designer]] reads — every treatment, what emotion it serves, where it fails — so a frame's look is chosen, not improvised. I am hunting the redraw on a moving figure (I only proved it on architecture), Grease Pencil Line Art as the modern Freestyle, and the day my motion atmosphere and my ink remnants are driven by one flow field. My through-line keeps wanting to obsolete itself: the cleaner Blender draws, the less the gen-AI seam has to do."
links:
  - target: "[[BLUELINE]]"
    type: emerged-from
    label: proving-ground
  - target: "[[Adopt the Craft, Author the Seam]]"
    type: exemplifies
    label: skin-last
  - target: "[[Steer the Generator]]"
    type: connects-to
    label: redraw-not-filter
  - target: "[[Shop/Blender]]"
    type: connects-to
    label: npr-surface
  - target: "[[Shop/ComfyUI]]"
    type: connects-to
    label: the-seam
  - target: "[[Frame Designer]]"
    type: connects-to
    label: dispatched-by
  - target: "[[Remnants in Depth]]"
    type: couples-with
    label: contains
---

# Hand-Drawn 3D Look

How to get a **confident, hand-drawn pen-and-ink look out of a 3D scene** — and how to hand it to a gen-AI model without losing the drawing. The whole approach hangs on one through-line, inherited from [[Adopt the Craft, Author the Seam]]: **work in the rich 3D representation, apply the hand-drawn skin last.** Proven in [[BLUELINE]] against a locked pen-and-ink-noir style; written as the menu the [[Frame Designer]] dispatches from.

## What Blender draws for free
[[Shop/Blender|Blender]] hands you **line, flat value, and exact composition** in ~2 seconds a frame, fully deterministic:
- **Freestyle ink.** The dial that matters is *confidence*. `SKETCHY` chaining + heavy noise reads **tentative** — searching, doubled strokes. `PLAIN` single strokes + a Bézier-smooth modifier + an angle-driven **calligraphy** pen (thin→thick) + only a trace of wobble reads **confident** — a decisive hand. Same scene, opposite feeling, one config away.
- **EEVEE toon.** Shader-to-RGB into a 2-band constant ramp = flat spotted blacks / paper white. The *value* half.

The one trap: Blender 5's default AgX view transform greys the paper — force **Standard** or your white space comes out muddy.

What Blender does *not* draw for free: the **gestural redraw and the ink-blob/splatter texture**. A renderer doesn't invent organic mark-making. That's the seam's job — and [[Remnants in Depth]]'s.

## The seam is a redraw, not a filter
Feed the Blender plate to img2img ([[Shop/ComfyUI]], SDXL + Canny). The denoise/ControlNet balance decides everything:
- **Low denoise (~0.7) just hands your 3D render back.** The locked style's own negative prompt (*"3d render, smooth shading"*) fights you and a timid denoise can't win.
- **High denoise (~0.95) + Canny loosened to ~0.4** lets the model *redraw the medium* in ink while the loose Canny only *guides* composition. The Blender plate becomes a **composition seed, not an appearance**. This is [[Steer the Generator]] applied frame-by-frame.

Two findings worth keeping. **Variation across seeds is high** — one fixed plate, N seeds, and the inking swings from light line-sketch to splatter-bomb while the structure stays locked: the engine for *generate-many, pick the emotional register*. And **over time** (camera moving, each frame redrawn) the composition stays coherent but the line *boils* — and for a hand-drawn look that boil is closer to a feature than a defect. A figure (not just architecture) needs a pose/depth anchor to survive the redraw — the one place this is still unproven.

## Motion is atmosphere
Water, clouds, smoke, and fire render hand-drawn through the same toon+ink path, procedural (no Mantaflow bake) so they re-render identically. A per-frame **boil** (re-seeding the Freestyle line noise "on twos") makes the ink waver like traditional animation. These are *elements* staged **behind** the figures, and because every frame is a pure function of the playhead they sync to the song.

## Ink that lives in 3D
The splatter need not stay flat. [[Remnants in Depth]] lifts ink blobs into 3D space as camera-facing billboards, so they parallax with the camera — the most striking move in the kit.

## Choose the look — don't improvise it
The point of holding all of this is **range**. A scene's emotion should pick the treatment: dread → brush-heavy noir + thunderhead; heroic → confident calligraphic, low canted angle; chaos → the 3D blob field + storm + splatter redraw; dream → searching line. The full **when-best / when-poor** matrix lives with the proofs (`Projects/BLUELINE/proofs/blender-handdrawn/APPROACHES.md`); the [[Frame Designer]] should render the cheap treatments side-by-side and present a small labelled board to choose from.

## Forward Vectors
- **Prove the redraw on a moving figure** — pose + depth anchors, not just buildings.
- **Grease Pencil Line Art** — the modern Freestyle successor; editable strokes, art-directable.
- **One flow field for everything** — motion atmosphere and ink remnants driven by the same [[The Flow Field is the Spine|field]].
- **Refine the weak motion tiles** — the low-angle cloud framing and fire-tongues both need a pass.
- **Obsolete myself, gracefully** — the better Blender draws confident ink, the lighter the seam's load. Watch where the seam stops being needed.
