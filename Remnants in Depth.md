---
title: "Remnants in Depth"
type: practice
pillars: [tools, creation]
born: 2026-06
last_activated: 2026-06
activation_count: 1
stage: growing
confidence: working
energy: high
who_leads: shared
forward_vector: "I take a flat artistic mark — an ink blob, a splatter, a chalk smudge — and give it a place in 3D space, so it parallaxes when the camera moves while still reading as flat drawn ink. I want any Shop worker to read me once and lift their own remnants into depth without re-deriving the two-layer trick. I am hunting the generalization past ink (paint, torn paper, halftone, charcoal) and the day my billboard density is driven by [[The Flow Field is the Spine]] so the splatter follows the motion instead of scattering at random. My open question: when does a remnant want to be a billboard, and when does it want to be real geometry?"
links:
  - target: "[[BLUELINE]]"
    type: emerged-from
    label: blob-field
  - target: "[[Hand-Drawn 3D Look]]"
    type: couples-with
    label: lives-inside
  - target: "[[Frame Designer]]"
    type: connects-to
    label: render-method
  - target: "[[Shop/Blender]]"
    type: connects-to
    label: billboard-rig
  - target: "[[Adopt the Craft, Author the Seam]]"
    type: exemplifies
    label: author-the-placement
  - target: "[[The Flow Field is the Spine]]"
    type: connects-to
    label: density-could-follow-the-field
---

# Remnants in Depth

A 2D artistic mark — an ink blob, a splatter, a chalk smudge — is flat. It belongs to the *paper*, not the *world*. This is the method for giving such a mark a **position in 3D space** so it gains real parallax when the camera moves — near marks sweep across frame, far marks barely drift, scene geometry occludes the ones genuinely behind it — while it never stops reading as flat, hand-drawn ink. Born lifting [[BLUELINE]]'s ink splatter off the page; written so the next Shop worker can do it with any mark, not just blobs.

## The trick: billboards, not geometry
A real 3D ink-glob (a metaball) seen off-axis looks like a *ball* — it breaks the flat-ink read. A **camera-facing card** (a plane with a `COPY_ROTATION` constraint to the camera) keeps the mark flat *and* gives it a 3D position. Flatness and parallax at once. That choice is the whole idea; everything else is making it clean.

## The three steps
1. **Analyze** — threshold a reference frame, connected-component the marks, and separate the *compact* remnants (blobs, splatter) from the *linework* by area / circularity / extent. Measure the character: size distribution, roundness, the spiky-satellite tail. (`blob_analyze.py`.)
2. **Recreate** — synthesize **high-resolution** marks to that measured signature: a body whose raggedness is driven by the measured circularity, plus satellite droplets and a directional thrown-spatter tail. High-res is the point — upscaled low-res cutouts pixelate into literal squares. (`blob_synth.py`.) This is the answer to *recreate the character*: the analysis sets the knobs, the synth makes infinite non-repeating ink.
3. **Place** — scatter the marks as billboards across a **depth shell**: a dense strike-cluster with a size-gradient at an impact point, a depth field spanning camera-near to far, a few big foreground masses. Sample sizes from the measured distribution; flip and rotate for variety. (`blob_swarm.py`.)

## The clean composite (the hard-won part)
Putting flat alpha-billboards in front of [[Hand-Drawn 3D Look|hand-drawn]] linework produced a stubborn **white-square** artifact, and it took two distinct fixes:
- **Two view layers.** [[Shop/Blender|Freestyle]] computes which edges are *visible*, and it treats each billboard's full square quad as an occluder — so it culls the building lines hidden behind the transparent corners. Render the line geometry and the remnants in **separate view layers** (Freestyle only ever sees the geometry → complete lines), then recombine by **Z-depth** (gate the remnant layer with `cityDepth > remnantDepth` into an Alpha Over factor) so geometry still occludes the marks behind it.
- **`DITHERED` clip material.** The billboard's own square edge faintly shows if the material *blends* the quad. In its own layer it must be a `DITHERED` alpha clip, which *discards* the transparent fragments entirely. Neither fix alone is enough.

(Blender 5.x specifics that cost iterations: the compositor is `scene.compositing_node_group`, the Math node is `ShaderNodeMath`, Alpha Over sockets are `Background / Foreground / Factor`. And always verify a mark sitting *over a line*, never on white — the square is invisible on blank paper.)

## Life — marks that appear and vanish
Each billboard can carry a short scale-life: pop in fast (ink landing), hold, fade out, staggered across the shot. With the camera move and a per-frame line boil, the result is *unusual movement inside the frame* — ink being thrown, drying, and lifting while the scene parallaxes around it.

## Generalize past ink
Nothing here is blob-specific. The same analyze → recreate → place → composite chain lifts **any 2D artistic remnant** into depth — paint flecks, torn-paper edges, halftone dots, charcoal dust, screen-print misregistration. Swap the reference, the synth grammar follows. That is why this is a `practice`, not a one-frame recipe.

## Forward Vectors
- **Flow-field-biased density** — drive placement and throw-direction off [[The Flow Field is the Spine]] so remnants *follow the motion*, not scatter at random. The first build after deposit.
- **Seam as a comp layer** — render the remnant field as its own depth-tagged pass and composite it *over* a gen-AI-redrawn plate, so the model never touches the marks.
- **Promote the three scripts into [[The Shop]]** as named Specialists/recipes, so a worker dispatches them instead of copying code.
- **Answer the open question** — billboard vs. real geometry: a big foreground ink mass might tolerate (or want) genuine dimensionality. Where is the line?
