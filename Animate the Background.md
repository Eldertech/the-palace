---
title: "Animate the Background"
type: practice
pillars: [tools, creation]
born: 2026-06
last_activated: 2026-06-26
activation_count: 2
stage: sprout
confidence: working
energy: high
links:
  - target: "[[The Flow Field is the Spine]]"
    type: exemplifies
    label: the-sim-leg-realized
  - target: "[[Blocked, Not Prompted]]"
    type: couples-with
    label: author-fg-animate-bg
  - target: "[[Adopt the Craft, Author the Seam]]"
    type: connects-to
    label: composite-is-the-seam
  - target: "[[Steer the Generator]]"
    type: connects-to
    label: take-what-it-gives-and-select
  - target: "[[BLUELINE]]"
    type: emerged-from
    label: proving-ground
  - target: "[[Frame Designer]]"
    type: connects-to
    label: a-method-in-the-roster
forward_vector: "I hold one rule — keep what you authored, animate what should breathe. I want to grow from two proofs into a Shop Specialist any frame can call, and to be tested on the hard case — the moving thing behind the figure — where my separate-and-infill steps actually earn their keep."
---

# Animate the Background

![[Animate the Background — hero.png]]

A still drawing comes alive without becoming a video: **separate the foreground from the background, give the background motion, and composite them back together.** What you authored — the hero, the camera, the staging — stays crisp and exactly where you drew it. What should breathe — sky, smoke, fire, water, a crowd — gets real motion.

This is [[Blocked, Not Prompted]] carried into time: author what matters, let the model animate what merely lives. It is the half of [[The Flow Field is the Spine]] that survives — the field the compositor *keeps*, not the one the diffusion eats. The arrow becomes the wind by **compositing**, not by steering the noise.

## The four steps

1. **Separate** — cut the foreground (figures, structure) from the background (the moving element). A figure cutout, or a general segmentation for any frame.
2. **Infill** — fill the hole behind the foreground so the background is whole. Skip this and a moving background tears at the figure's edge.
3. **Animate** — give the clean background motion. Image-to-video (SVD) seeded by the drawing itself, then an optical-flow morph (RAFT) that turns 25 generated frames into a smooth, slow, forward loop.
4. **Composite** — lay the static, authored foreground back on top, crisp.

## What's proven (BLUELINE, 2026-06)

Two frames, two shapes, both lovely — `Projects/BLUELINE/proofs/cloud-i2v/` (on the `feature/blueline-m3` branch):

- **Sky** (shot 01) — the burning-city smoke billows behind a static skyline. No foreground to separate; steps 3–4 only.
- **Fire** (shot 02) — fire and smoke live above and behind a hero who stands crisp and still, cars and street held.

The motion *engine* matters less than the division of labor. Plain SVD gives **plausible** motion (smoke rises and billows) but not **controllable direction** — measured at ~55° off the drawn wind. So for backgrounds, take what it gives and select, rather than fight it ([[Steer the Generator]]). RAFT beat the basic Farnebäck morph; a neural interpolator (FILM/RIFE) is the next rung.

## The edge still untested

Both clean proofs animated backgrounds with *no* foreground overlap — sky above the skyline, smoke above the hero's head. The hard case is the moving element *behind* the figure (the street-level fire around his legs), where **separate** and **infill** actually carry weight. That is the next test, and why this is a sprout, not yet mature.

## The N-Layer Case (Line-Art Decomposition)

*Folded in 2026-07-06 from [[Line-Art Layer Decomposition]] — the same four steps (separate → infill →
animate → composite), generalized from two layers to N, and pushed until they broke.*

The two-layer case above cuts one foreground from one background. Push further — a whole drawing taken
apart into **depth-ordered, occlusion-completed cels**, each independently movable, then recomposed — and
the same four steps still hold, but **Separate** stops being a single cutout and becomes real work:
segment every element, order who occludes whom, complete what's hidden behind each one. Proving ground:
BLUELINE shot 02 again (the man before two burning cars), pushed harder — full proof and steps at
`Projects/BLUELINE/proofs/blender-fire/renders/proof/decomposition-proof.html` and
`Projects/BLUELINE/proofs/blender-fire/LAYER-DECOMPOSITION-FINDINGS.md` (on `feature/blueline-m3`).

**What N-layer separation actually needs:**

- **Segment** — find each element. Photo-SAM (mobile + ViT-B), GrabCut, and morphology all **fail** on
  line-art objects; the figure comes out best from a **keypoint** mask, not SAM.
- **Order** — who occludes whom. **Depth Anything V2** wins on the drawing itself — recovers
  front-to-back order, hands back a clean figure silhouette for free, and depth-banding gives a free
  coarse 3-cel split.
- **Complete** — reconstruct the hidden parts (the Infill step, at N-layer scale). **LaMa** rebuilds the
  car/fire/street behind the figure far better than `cv2.inpaint`'s blur — though it completes texture,
  not exact occluded *shape*; that stays open.
- **Compose** — warp and restack. The drawing's own fire/smoke strokes warp along flow measured *from the
  drawing itself* (structure-tensor → up-right lean) — the pen lines move, nothing is overlaid.

**The wall: thin, see-through line-art objects.** A car drawn in pure line has no solid region (invisible
to segmentation), no discontinuity (invisible to depth), no fill (invisible to colour), no closed boundary
(invisible to morphology). It exists only as perceptually-grouped strokes — legible to a human eye, to no
low-level signal tested.

**The way past it — convert-first, stylize-last.** Don't fight the line-art representation: convert the
drawing (SDXL/FLUX + canny ControlNet, same composition) to a domain where SAM, depth, and LaMa are
trained and strong, segment and infill *there*, then re-apply the ink style to each clean cel last. This
is [[Steer the Generator]]'s rich-first / stylize-last discipline, carried from *rendering* into
*layering*. Validated 2026-06-25 across three new scenes (burning city, rooftop leap, impact crouch): both
photoreal and flat-cel conversions make SAM segment cleanly where raw line-art gave garbage — so
convert-first generalises past the one proving shot. The better intermediate turned out to be **flat
cel-shaded**, not photoreal: solid flat regions give more distinct object segments (44/47 vs 30/26), are
separable even by a no-model colour-quantize, and are a smaller stylistic round-trip back to ink. The
reliable pipeline:

> `convert to flat-cel · segment + depth + infill · stylize each cel to ink · warp & recompose`

**A noted tension, not resolved: convert-first vs. segment-first.** The two-layer proofs above never
needed to leave the drawing's own representation — a figure cutout plus SVD/RAFT worked directly on the
line art. The N-layer case hit a wall the two-layer case never found, because line-art objects with no
fill and no closed boundary (the car) are exactly the case a single foreground cutout doesn't have to
solve. Convert-first is the discipline that dissolves the N-layer wall; it is not proven necessary for the
two-layer case, and forcing every job through a stylize-round-trip when a direct cutout already works
would be waste. Hold both: segment-first (direct, cheaper) where the elements are solid enough to grab;
convert-first (a domain change, then stylize back) where they aren't. Which side a given frame falls on is
itself still an open call, not a solved rule.

**Open ends carried forward:** hardening a general `split_to_layers(image)` / `compose_layers(layers,
ops)` pair any frame can call; the unsolved deep skill of amodal **shape** completion (continuing occluded
contours, not just texture) and the line-art-native alternative (T-junction / Huffman-Clowes line
labeling); and comparing this pipeline against parallel explorations once it's exercised on more than one
shot.

<!-- CLAUDE → LOUDON: deposited 2026-06-24 from the cloud-I2V session. Proofs + the reusable scripts (crop → SVD orchestrator → RAFT morph → composite) live in Projects/BLUELINE/proofs/cloud-i2v/ on feature/blueline-m3; they'll land on main with the branch. When the hard separation case is proven and the recipe stabilises across a few frames, this graduates toward a Shop Specialist (parallel to how flow-field-spine is graduating). -->
