---
title: Figure Rig — face-hands-openpose design
born: 2026-06-30
links:
  - { target: "[[Figure Rig]]", type: connects-to, label: design-note-for }
forward_vector: "I am the design note that decides how Figure Rig grows hands, a face, and a cleaner OpenPose path — written so the next build can act without re-deriving the trade-offs."
---

# Figure Rig — extending to face + hands, and how we draw OpenPose

Loudon's three questions, answered with what the rig and the library actually give us
(checked on the live MPFB2 `default` rig, 2026-06-30).

## 1. Hands — already riggable, low effort

OpenPose's **hand format is 21 keypoints per hand**: the wrist + 4 points down each of the
5 fingers. The MPFB `default` rig already carries **38 finger bones** —
`finger1-1.L … finger5-3.L` (5 fingers × 3 joints) plus metacarpals, both sides. That is a
*direct* map:

- wrist keypoint = `wrist.L` head (already in the body skeleton)
- finger *n* keypoints = heads of `fingerN-1.L`, `fingerN-2.L`, `fingerN-3.L`, + the tail of `fingerN-3.L` for the tip

So extending to hands is: project those bone positions to 2D (the exact code path we already
use for the 18 body keypoints) and draw them with **`draw_handpose`** — which lives in the
*same* `comfyui_controlnet_aux` library we already call for the body. No new dependency, no new
model. The cost is just authoring the 21-point index map per hand and adding finger keypoints
to `keypoints.json`. **Verdict: do this first — it's almost free, and the rig was built for it.**

## 2. Face — partly riggable, the rest from mesh landmarks

OpenPose's **face format is 70 keypoints** (jaw line, eyebrows, nose bridge + base, both eyes,
the mouth). The rig gives us only the gross pieces: a `head` bone, a `jaw` bone, and `eye.L` /
`eye.R`. That is enough for *facing* (which we already derive) and eye direction, but not the
full 70-point mask.

The full face comes from the **mesh, not the rig**. MPFB's base mesh has a *fixed topology*
(always 19,158 verts), so a given face landmark is *always the same vertex index*. The plan:

- Identify ~70 vertex indices once (jaw rim, brow line, nose, eye rings, lip rim) — a one-time
  lookup on the base mesh, reusable for every body since topology never changes.
- Project those verts (post-deform, post-expression) → 70 face keypoints → **`draw_facepose`**
  (again, same library).
- Bonus: because they're *mesh* points, they move correctly when you add face **shape keys**
  (a smile, a frown), so the face plate can carry expression later — something bones alone can't.

**Verdict: medium effort, high payoff for close-ups.** The one-time vertex-index map is the
only real work. "OpenFace" in the request = OpenPose's face module (70 pts) / DWPose's face — not
the separate OpenFace behavior-analysis tool; the relevant target is the 70-point face skeleton.

## 3. Should OpenPose be *baked into the rig as a toggle-able layer* instead of a script?

This is the sharpest question. The instinct is right that the current cross-step is clumsy —
today we render ink + depth in Blender, then hop to the ComfyUI venv to run `draw_openpose.py`
(a separate Python with `cv2` + the controlnet library). Two answers, and they split by *purpose*:

**For the conditioning plate (what the model reads): keep the library draw — do NOT bake geometry.**
The whole reason our OpenPose works is that we draw it with the *exact* `draw_bodypose` the
ControlNet preprocessor uses, so the plate is **pixel-identical to what the model was trained on**
(line widths, the oval limb polygons, the specific RGB per limb, the anti-aliasing). If we instead
build colored cylinders/spheres parented to the rig and *render* them, we'd get an *approximation*
of that look — close, maybe, but the trained model is sensitive to exactly these cues, and "close"
silently costs conditioning strength. Baking geometry trades away the one property that makes the
plate trustworthy.

**The real fix for the clumsy hop: vendor the draw, don't bake the geometry.** `draw_bodypose` /
`draw_handpose` / `draw_facepose` are small, near-pure functions (numpy + a little cv2). Two ways
to run them *inside* the Blender process so it's one pass, no venv hop:
- pip `opencv-python` into Blender's bundled Python and import the three draw functions, or
- reimplement the ~200 lines with PIL (no cv2) — then Blender draws the canonical plate itself.

Either keeps **pixel-identity** *and* gives the single-step ergonomics Loudon wants ("pose →
render all plates, done"), with no second tool.

**For live posing feedback: yes, add a rig-tied OpenPose overlay you can toggle.** Build the
colored skeleton as **Grease Pencil or constrained geometry** in its own collection, following
the rig live, so while you pose you *see* the COCO-18 skeleton in the viewport and can flip it on/
off. This is the "toggle a layer" experience — but as a *WYSIWYG aid*, not the final conditioning
output. Best of both: you author against the skeleton you'll condition on, and the shipped plate
is still library-exact.

So: **overlay for the eyes, vendored-draw for the file.** Don't render approximated skeleton
geometry as the conditioning image.

## 4. OpenPose extensions that already do face + hands

- **`openpose_full` / DWPose.** The modern preprocessor (DWPose, in `controlnet_aux`) outputs
  **body + hands + face** in one OpenPose-format image. The community "openpose_full" is exactly
  body+hand+face stacked — which is what our extended `keypoints.json` + the three `draw_*`
  functions would produce *from the rig* (cleaner than detecting from a render, because we author
  the truth instead of inferring it).
- **The ControlNet model already accepts it.** We use **xinsir's `controlnet-openpose-sdxl`**,
  which was trained on the *full* skeleton including hand and face keypoints. So feeding a richer
  skeleton (body+hands+face) **improves hands and gaze in the output at no extra model cost** —
  the model is already listening for those channels; we just haven't been drawing them.

### Integration plan (concrete next build)
1. **Hands now**: add finger keypoints (from finger bones) → `draw_handpose` into the same plate. Low risk.
2. **Face next**: build the one-time 70-vertex landmark map on the base mesh → `draw_facepose`. Enables gaze + (with shape keys) expression.
3. **Vendor the draw** into Blender's Python (PIL reimpl or pip cv2) so `pose → all plates` is one pass — kills the venv hop while keeping pixel-identity.
4. **Add a Grease-Pencil OpenPose overlay** tied to the rig for live, toggle-able viewport feedback.
5. Keep the **xinsir full-skeleton ControlNet** — it already reads body+hands+face.

Net: the rig already has the bones for hands; the mesh already has the verts for the face; the
library already has the draw functions; the model already reads the full skeleton. The extension
is mostly *wiring what exists*, not inventing new machinery — and the one thing to protect through
all of it is pixel-identity of the drawn plate to the preprocessor.
