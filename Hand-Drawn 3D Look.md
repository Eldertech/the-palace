---
title: "Hand-Drawn 3D Look"
type: concept
pillars: [tools, creation]
born: 2026-06
last_activated: 2026-06
activation_count: 2
stage: growing
confidence: working
energy: high
who_leads: shared
forward_vector: "I get a confident hand-drawn ink look out of a 3D scene, and I marry it to the gen-AI seam. My one law: work in the rich 3D representation, apply the hand-drawn skin LAST. I want to be the menu the [[Frame Designer]] reads — every treatment, what emotion it serves, where it fails — so a frame's look is chosen, not improvised. I have proven the redraw survives on a posed figure (over-anchor it: canny + depth + openpose) and settled Freestyle-vs-Grease-Pencil; now I hunt a nice rigged mannequin to pose instead of cylinders, and the day my motion atmosphere and ink remnants ride one flow field. My through-line keeps wanting to obsolete itself: the cleaner Blender draws, the less the gen-AI seam has to do."
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
  - target: "[[The Flow Field is the Spine]]"
    type: connects-to
    label: one-field-for-everything
---

# Hand-Drawn 3D Look

How to get a **confident, hand-drawn pen-and-ink look out of a 3D scene** — and how to hand it to a gen-AI model without losing the drawing. The whole approach hangs on one through-line, inherited from [[Adopt the Craft, Author the Seam]]: **work in the rich 3D representation, apply the hand-drawn skin last.** Proven in [[BLUELINE]] against a locked pen-and-ink-noir style; written as the menu the [[Frame Designer]] dispatches from.

## What Blender draws for free
[[Shop/Blender|Blender]] hands you **line, flat value, and exact composition** in ~2 seconds a frame, fully deterministic:
- **Freestyle ink.** The dial that matters is *confidence*. `SKETCHY` chaining + heavy noise reads **tentative** — searching, doubled strokes. `PLAIN` single strokes + a Bézier-smooth modifier + an angle-driven **calligraphy** pen (thin→thick) + only a trace of wobble reads **confident** — a decisive hand. Same scene, opposite feeling, one config away.
- **EEVEE toon.** Shader-to-RGB into a 2-band constant ramp = flat spotted blacks / paper white. The *value* half.
- **Line engine — Freestyle or Grease Pencil.** Freestyle gives the richest calligraphic ink for a *hero still* (angle-driven weight, true ink pressure). Grease Pencil **Line Art** (the modern Blender 4.x+ successor) gives **editable, warpable strokes** — better for *motion* (the strokes can be deformed frame-to-frame) and as a lighter, cleaner *seam input*. Pick by whether the frame holds still or moves. *(Verified 2026-06-25; GP renders thinner — it's a different tool, not a replacement.)*

The one trap: Blender 5's default AgX view transform greys the paper — force **Standard** or your white space comes out muddy.

What Blender does *not* draw for free: the **gestural redraw and the ink-blob/splatter texture**. A renderer doesn't invent organic mark-making. That's the seam's job — and [[Remnants in Depth]]'s.

## The seam is a redraw, not a filter
Feed the Blender plate to img2img ([[Shop/ComfyUI]], SDXL + Canny). The denoise/ControlNet balance decides everything:
- **Low denoise (~0.7) just hands your 3D render back.** The locked style's own negative prompt (*"3d render, smooth shading"*) fights you and a timid denoise can't win.
- **High denoise (~0.95) + Canny loosened to ~0.4** lets the model *redraw the medium* in ink while the loose Canny only *guides* composition. The Blender plate becomes a **composition seed, not an appearance**. This is [[Steer the Generator]] applied frame-by-frame.

Two findings worth keeping. **Variation across seeds is high** — one fixed plate, N seeds, and the inking swings from light line-sketch to splatter-bomb while the structure stays locked: the engine for *generate-many, pick the emotional register*. And **over time** (camera moving, each frame redrawn) the composition stays coherent but the line *boils* — and for a hand-drawn look that boil is closer to a feature than a defect.

**The redraw survives on a figure — by over-anchoring** *(proven 2026-06-25)*. Architecture is forgiving; a figure melts under an aggressive redraw unless its structure is pinned from more than one direction. The recipe: stack **canny 0.30 (a style throttle, freeing the surface to re-ink) + depth 0.60 (volume) + openpose 0.70 (skeleton)**. The deep lesson: *what melts a figure is under-anchoring, not high denoise* — properly anchored, a figure holds its authored pose all the way to denoise 0.95. Depth is the strongest *pose* anchor but the strongest *style* saboteur; openpose alone is too weak; the three together are the recipe. (Open: a temporal/boil test on a *moving* figure, and a real rigged body — see Forward Vectors.)

## Motion is atmosphere
Water, clouds, smoke, and fire render hand-drawn through the same toon+ink path, procedural (no Mantaflow bake) so they re-render identically. A per-frame **boil** (re-seeding the Freestyle line noise "on twos") makes the ink waver like traditional animation. These are *elements* staged **behind** the figures, and because every frame is a pure function of the playhead they sync to the song.

## Ink that lives in 3D
The splatter need not stay flat. [[Remnants in Depth]] lifts ink blobs into 3D space as camera-facing billboards, so they parallax with the camera — the most striking move in the kit. And it composes two ways with the seam: **bake** the blobs into the plate before the redraw (the model absorbs them into one cohesive drawing — no parallax, no control) or keep them a **comp layer** over the gen-AI-inked plate (exact authored shapes + real parallax, occluded by the inked buildings via a depth pass). *The comp-layer wins in motion, where parallax dominates and the texture seam recedes* — both proven 2026-06-25.

## Choose the look — don't improvise it
The point of holding all of this is **range**. A scene's emotion should pick the treatment: dread → brush-heavy noir + thunderhead; heroic → confident calligraphic, low canted angle; chaos → the 3D blob field + storm + splatter redraw; dream → searching line. The full **when-best / when-poor** matrix lives with the proofs (`Projects/BLUELINE/proofs/blender-handdrawn/APPROACHES.md`); the [[Frame Designer]] should render the cheap treatments side-by-side and present a small labelled board to choose from.

## Forward Vectors
- **A moving figure next** — the redraw now survives a *static* posed figure (over-anchor: canny + depth + openpose); prove it through the temporal boil on a figure in motion.
- **Master a rigged mannequin** — the rig is now a real capability: [[Shop/Figure Rig]] poses an FK rig and emits ink + depth + a **canonical** OpenPose (drawn by the actual ControlNet library), proven end-to-end through the D2 redraw. The remaining gap is the **mesh** — it's still capsules; skin a real humanoid that **shows where the face points** onto this exact rig. *This is the live hunt.*
- **One flow field for everything** — flow-field-biased *spatter* is proven (it streaks along the motion, not just clusters); extend the same [[The Flow Field is the Spine|field]] to the motion atmosphere so weather and ink move together.
- **Refine the weak motion tiles** — the camera/geometry bugs are diagnosed and fixed (fire's seismograph was the camera-Z sitting level with the cone tips; the cloud was outside the FOV), but the cloud's value and the flame's organic shape still want a pass.
- **Obsolete myself, gracefully** — the cleaner Blender draws confident ink, the lighter the seam's load. Watch where the seam stops being needed.
