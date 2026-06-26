# Line-Art Layer Decomposition — Findings & Extents

**BLUELINE · shot 02 (hero-on-sedan) · 2026-06-25**
Goal: take a flat ink drawing apart into **depth-ordered, occlusion-completed cels**, each independently
manipulable, then recompose so the drawing comes alive. The 2-layer case (Animate the Background:
separate → infill → animate → composite) generalizes to **N cels**. This documents how far each
technique actually reaches, and where the wall is.

All artifacts under `Projects/BLUELINE/proofs/blender-fire/` (branch `feature/blueline-m3`).

---

## The four skills

1. **Segment** — find each element.
2. **Order** — who occludes whom (depth).
3. **Complete** — reconstruct the hidden parts (amodal).
4. **Compose** — warp & restack the cels.

---

## What we tried, and how far it reaches

### 1 · Segment
| method | result | why |
|---|---|---|
| **MobileSAM** (box / point) | **✗ on line-art objects** | car points grabbed the *building / sky*; person box worse than our keypoint mask |
| **SAM ViT-B** (box / point) | **✗ on the car** | stronger model, same failure — representational mismatch, not tuning |
| **SAM-auto** | over-segments | dozens of fragments; needs a grouping step |
| **GrabCut** (classical, color) | partial (~52% of the car box, rough) | color-based; car interior = paper = bg, so it grabs only the darker lower region |
| **morph close+fill / convex hull** | over-fill (100% / 99% of box) | the ink connects into one blob; no clean car boundary exists at pixel level |
| **keypoint silhouette** (person) | **✓ best for the figure** | capsules ∩ dark ink, using the known pose — the drawing's structure beats generic segmentation |

**Why photo-segmenters fail on line art:** SAM/GrabCut learned that an object is a *solid region of
consistent texture*. A line-art car is *mostly the same paper as everything around it* — it exists only
as sparse outline strokes — so there is no region to grab and the model snaps to the nearest big tonal
block. This is a representation mismatch, not a parameter to tune.

### 2 · Order — **the surprise win**
**Depth Anything V2** (HF transformers, ~100 MB, runs on MPS) — **✓ works on the drawing.**
- Recovered a sensible front-to-back order: `street 4.21 · person 3.60 → cars/buildings 0.45–0.76 → fire/smoke 0.36 · sky 0.02` (higher = closer).
- **Bonus:** a clean **person silhouette** falls out as a byproduct → a *second independent route* to the figure (besides keypoints).
- **Depth-banding** (percentile thresholds) gives a **free 3-cel coarse split**: FRONT person+street / MID cars+buildings / BACK fire+sky — no segmentation at all.
- **Limit:** thin line-art objects (the car) have **no depth discontinuity** → invisible to depth too.

### 3 · Complete (amodal)
- **LaMa** (simple-lama-inpainting) — **✓ for texture.** Removes the man and *reconstructs* the car / fire /
  street behind him plausibly (vs `cv2.inpaint`'s blur, which the eye rejects). A faint torso ghost remains.
- **Limit:** LaMa fills *texture*, not the exact occluded *shape/lines*. Continuing occluded contours
  (true amodal shape inference) is unproven here — the deeper skill.

### 4 · Compose — the payoff (working)
- **Ink-warp** — **✓.** Warp the drawing's *own* fire/smoke strokes along a flame flow (rise + lick + the
  image-measured up-right lean), masked to the plume, hero held static on top, slow + deep, seamlessly
  looped. The pen lines come alive. (`ink_flames.py`)
- **Image-derived physics** — structure-tensor analysis of the drawn smoke → a lean-by-height profile
  (`analyze_smoke.py` → `smoke_physics.json`, mean lean 0.63 right) → drives the warp. *The image's own
  physics controls the model.*
- Note: a Blender particle/curve flame composited *over* the drawing was the **wrong layer** — the goal
  is to move the *existing ink*, not overlay new fire. The Blender detour's keeper is the physics analysis.

---

## The hard limit (headline)

**Thin line-art objects on matching ground — the car — are the failure boundary of automatic
decomposition.** They are invisible to *photo-segmentation* (no solid region), *depth* (no
discontinuity), *color* (no fill), and *morphology* (no closed boundary). They exist only as
**perceptually-grouped outline strokes** — legible to a human reading the drawing, to no low-level signal.

Cracking them needs one of:
- **(a) human authoring** — a hand-drawn mask (the human does the perceptual grouping);
- **(b) a semantically-aware model** — a comic/manga-trained segmenter, not photo-SAM;
- **(c) line-structure / T-junction labeling** — trace and close the *specific* object contour (Gestalt /
  Huffman-Clowes line labeling). Theoretically right, unproven here, and the next deep dive.

---

## Toolkit-per-element (what actually works today)

| element | best tool | extent |
|---|---|---|
| person / figures | keypoints **or** depth silhouette | ✓ clean (two routes) |
| sky / buildings / ground | depth bands | ✓ coarse, depth-ordered |
| fire / smoke | region mask + flow analysis + ink-warp | ✓ animatable |
| occluded background (behind a figure) | LaMa infill | ✓ texture (not exact shape) |
| depth ordering | Depth Anything V2 | ✓ |
| **thin line-art object (car)** | **— (authoring / semantic model)** | **✗ the wall** |

## Working pipeline (today)
`depth-band → refine person (keypoints/depth) + fire (region+analysis) → LaMa-infill behind the front
cels → warp the fire cel → recompose.` Cars/buildings ride as a held MID band; a clean *car cel* needs
authoring until a line-structure or comic-trained method lands.

## Open directions
- T-junction / line-labeling for line-art objects (the rigorous car path).
- A comic/manga-trained segmenter vs photo-SAM.
- Amodal **shape** completion (continue occluded contours, not just texture).
- Depth-driven per-band parallax.
- Generalize to any frame — the `split_to_layers(image)` function.

## Tools assembled (reproducible)
`ultralytics` (SAM/MobileSAM/ViT-B) · `transformers` Depth-Anything-V2 · `simple-lama-inpainting` (LaMa)
· `opencv` (structure tensor, GrabCut, morphology, warp) — all in the ComfyUI venv, no GPU service needed.
Scripts: `layers_compare.py`, `car_test.py`/`car_test2.py`, `car_lines.py`, `depth_test.py`,
`depth_bands.py`, `analyze_smoke.py`, `lama_infill.py`, `ink_flames.py`.
