---
title: "Line-Art Layer Decomposition"
type: project
status: active
pillars: [tools, creation, philosophy]
born: 2026-06
last_activated: 2026-06
activation_count: 1
stage: sprout
confidence: working
energy: high
who_leads: loudon
links:
  - target: "[[Animate the Background]]"
    type: deepens
    label: the-N-layer-generalization
  - target: "[[BLUELINE]]"
    type: emerged-from
    label: proving-ground
  - target: "[[Steer the Generator]]"
    type: connects-to
    label: rich-first-stylize-last
  - target: "[[Adopt the Craft, Author the Seam]]"
    type: connects-to
    label: work-rich-stylize-last
  - target: "[[Frame Designer]]"
    type: connects-to
    label: a-decomposition-the-roster-wants
forward_vector: "I am the search for how to take a flat ink drawing apart into living, depth-ordered layers. I want to find the reliable path past the line-art wall — and I think I have it: decompose in photoreal, stylize last. I want to harden into a general split_to_layers any frame can call, and to be compared against the parallel explorations until the most reliable method is settled."
---

# Line-Art Layer Decomposition

Take a flat ink drawing apart into **depth-ordered, occlusion-completed cels** — each independently
movable — then recompose so the drawing comes alive. The two-layer case is [[Animate the Background]]
(separate → infill → animate → composite); this is the **N-layer generalization**, and the search for
where it's reliable vs where it breaks. Proving ground: [[BLUELINE]] shot 02 (a man before two burning cars).

**Full proof + the steps:** `Projects/BLUELINE/proofs/blender-fire/renders/proof/decomposition-proof.html`
and `Projects/BLUELINE/proofs/blender-fire/LAYER-DECOMPOSITION-FINDINGS.md` (on `feature/blueline-m3`).
The nine reproducible scripts live beside them.

## The four skills (and how far each reaches)

- **Segment** — find each element. *Photo-SAM (mobile + ViT-B), GrabCut, morphology all **fail** on
  line-art objects.* The figure comes out best from our **keypoint** mask, not SAM.
- **Order** — who occludes whom. **Depth Anything V2 wins on the drawing** — recovers front-to-back
  order, hands back a clean figure silhouette for free, and depth-banding gives a free coarse 3-cel split.
- **Complete** — reconstruct the hidden parts. **LaMa** rebuilds the car/fire/street behind the figure
  (vs cv2.inpaint's blur). Texture, not exact occluded shape — that part stays open.
- **Compose** — warp & restack. The drawing's **own** fire/smoke strokes warp along the flow *measured
  from the drawing itself* (structure-tensor → up-right lean). The pen lines move; nothing is overlaid.

## The wall — and the way past it

**The hard limit: thin, see-through line-art objects (the car).** They are invisible to segmentation
(no solid region), depth (no discontinuity), colour (no fill), and morphology (no closed boundary). They
exist only as perceptually-grouped strokes — legible to a human, to no low-level signal.

**The reframe that dissolves it (Loudon's insight): decompose in PHOTOREAL, stylize last.** Don't fight
the line-art representation — convert the drawing to photoreal (FLUX + canny ControlNet, same
composition), where SAM/depth/LaMa are all trained and strong, do segmentation + infill there, then
re-apply the ink style to each clean cel. It is [[Steer the Generator]]'s **rich-first / stylize-last**
discipline carried from *rendering* into *layering*. The reliable pipeline:

> `generate/convert → photoreal · segment + depth + infill · stylize each cel to ink · warp & recompose`

## Forward vectors
- Validate the photoreal-first car on shot 02 (SAM should lock it instantly), then build the full
  per-cel stylize-back.
- Harden a general `split_to_layers(image)` + `compose_layers(layers, ops)`.
- The unsolved deep skill: amodal **shape** completion (continue occluded contours, not just texture) —
  and the line-art-native path (T-junction / Huffman-Clowes line labeling).
- Compare against the parallel exploration; settle the most reliable method.

<!-- CLAUDE → LOUDON: deposited 2026-06-25 from the layer-decomposition mastery session. Proof HTML +
findings + 9 reproducible scripts on feature/blueline-m3. The photoreal-first validation render was
in flight at deposit time; step 8 of the proof HTML updates when it lands. This generalises
[[Animate the Background]] — once split_to_layers is reliable, consider whether the two merge. -->
