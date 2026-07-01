---
title: Figure Rig — conditioning stack and scene expansion
born: 2026-06-30
links:
  - { target: "[[Figure Rig]]", type: connects-to, label: design-note-for }
  - { target: "[[Blocked, Not Prompted]]", type: connects-to, label: generalizes }
  - { target: "[[BLUELINE]]", type: connects-to, label: character-staging-engine }
forward_vector: "I am the map from what we learned staging one figure to staging a whole BLUELINE scene — which Blender pass drives which ControlNet, at which strength, and how color, depth, and pose together let two people kiss or shake hands without the model melting them into one."
---

# Figure Rig — the conditioning stack and how it scales to scenes

The synthesis of the 2026-06-30 face/hands work, written to answer Loudon's questions. The
through-line: **we author geometry in Blender and render it as several conditioning channels;
the gen-AI restyles under those channels; and how hard each channel binds is a dial.** This is
[[Blocked, Not Prompted]] grown up — from one pose to expressions, hands, held objects, and
eventually many people touching.

## 1. Three (or four) guides, each at its own strength

We do use **OpenPose + depth + the Blender render (shaded/color) together**, and each is a
separate ControlNet with its own dials. In ComfyUI each guide is a `ControlNetApplyAdvanced`
node with three numbers that matter:

- **`strength`** (0–1) — how hard this channel binds. 0.8–1.0 = obey; 0.3–0.4 = a hint.
- **`start_percent` / `end_percent`** — *when* in the denoise it applies (0.0 = first step,
  1.0 = last). A guide with `end_percent 0.5` shapes the composition early, then lets go so the
  model freely stylizes the second half.

So "**lock hard to OpenPose, allow more variation from the shade render**" is literally:

```
openpose:  strength 0.9,  end_percent 0.9    # pose is rigid — the skeleton is law
canny(shaded): strength 0.4, end_percent 0.5 # form guides early, then the model is free
depth:     strength 0.45, end_percent 0.7    # near/far kept, loosely
```

Raise openpose, drop canny/end_percent → the figure can be anywhere the skeleton says but the
*rendering* is loose and painterly. Flip it → the shaded form is obeyed tightly (near-photoreal)
and the pose is a suggestion. **The mix is the aesthetic**, and it is four sliders, not a rebuild.

**The key finding** (guide experiment): feed **canny the SHADED render, not the flat line art.**
Flat ink loses front/back — canny picks up back-facing edges and fills eyes hollow. The shaded
render's edges sit on real lit form, so eyes/nose/brows come out solid *and* the style stays bold.
Line art is the wrong guide; shaded (or color) is right. Full data + timings: the guide experiment
grid in `renders/faces-exp/`.

## 2. Color is not for realism — it is for *separation*

For a single figure, the shaded greyscale render is enough; color adds nothing. So we spend color
where it earns its keep: as an **ID / segmentation channel**. Give each object or person a distinct
flat color in a dedicated Blender pass (figure A red, figure B blue, the glass cyan). That colored
pass is not fed as "how it should look" — it is fed as "**here is where each thing is, keep them
apart**," via:

- **Regional / area conditioning** — bind "a man in a coat" to the red region and "a woman" to the
  blue region so the model renders two people, not a blended chimera.
- **Masks for compositing** — the flat colors are perfect selection masks to cut each element out.

This is the answer to intertwined-figure melting (the classic multi-subject attention-blend): the
color-ID pass tells the model the spatial truth the prompt can't.

## 3. The ComfyUI graph, and the variables that matter

The graph is always the same shape — the intelligence is in *which Blender pass feeds which node*
and the dials:

```
CheckpointLoader ─┬─► CLIPTextEncode(+)          KSampler ─► VAEDecode ─► SaveImage
                  ├─► CLIPTextEncode(−)            ▲
                  └─► VAE                           │ latent:
   ┌─ LoadImage(shaded) ─► Canny ─► CN.canny ─┐     │   EmptyLatentImage  (txt2img, denoise 1.0)
   ├─ LoadImage(depth) ──────────► CN.depth ──┼─►(chained conditioning)   OR
   └─ LoadImage(openpose) ───────► CN.pose ───┘     │   VAEEncode(render) (img2img, denoise <1)
```

The variables to reach for, in order of impact:

1. **Which Blender pass feeds canny** — shaded/color (form) not ink (hollow). Biggest lever.
2. **Per-ControlNet `strength` + `end_percent`** — the lock-vs-loose mix (§1).
3. **txt2img vs img2img** (`EmptyLatentImage` vs `VAEEncode`) + **`denoise`** — img2img over a
   render preserves it (muted style, ~25% faster); txt2img + canny gives bold style. We use
   txt2img + canny(shaded).
4. **Canny `low/high_threshold`** — how much fine detail becomes an edge.
5. **KSampler** `seed` (lock for consistency), `steps` (~28), `cfg` (~6.5).

Cost/time reality: every approach is ~$0.001–0.0014/image; the **pod cold-boot (~$0.08–0.10)
dominates** any small batch, so batch many jobs per boot and always tear the pod down.

## 4. How this expands to BLUELINE

This *is* BLUELINE's character pipeline, now complete for a figure: pose (IK) → expression (FACS)
→ hands (finger bones) → frame the shot → render the conditioning stack → gen-AI in the locked
style. Every [[Frame Designer]] character frame gets correct anatomy from shaded-canny and a
controllable pose/style mix. The staging vocabulary ([[Blocked, Not Prompted]]) and this
conditioning stack are the two halves of "the bias is the product."

## 5. Next: hands + objects with proxy geometry (visual tagging)

The plan for held objects — stop leaning on the prompt alone, give the model *form* to hold:

- **Model a simple proxy** in Blender for each object: cylinder = glass, bent tube = snake,
  stem + disk = flower, draped plane = fabric. Pose the hand gripping it (contact is real geometry).
- **Render the proxy into the shaded + depth passes** — now the gen-AI sees the object's shape and
  where the hand wraps it, so the fingers and object relate correctly (not a prompt guess).
- **Tag it for replacement** two ways, both worth trying:
  - **Prompt-region (color-ID):** give the proxy a unique flat color; bind "a glass of water" to
    that region via regional conditioning → the gen-AI paints the real object into the proxy's place.
  - **Separate pass + composite:** render the figure and the object as separate passes, composite
    them (the proxy defines position/occlusion), then a low-denoise **integrate pass** fuses them
    into one drawing ([[Adopt the Craft, Author the Seam]] / the [[Frame Designer]] generative-
    layering method).

The proxy is a **greybox stand-in**: it carries position, scale, occlusion, and contact — the hard
spatial facts — and the gen-AI supplies the surface.

## 6. Many people in one scene — talking, and interacting

Everything above composes to multi-figure scenes, which is where authored geometry beats prompting
hardest:

- **Two people talking:** pose two rigs in the scene, each with its own OpenPose, each a distinct
  color in the ID pass. Regional conditioning binds each person's description (and later identity)
  to their color region. Depth keeps who is in front. They stay two people because the geometry says so.
- **People interacting — kissing, wrestling, shaking hands:** this is the case prompt-only *cannot*
  do (the [[Frame Designer]] field note: intertwined figures blend into one face). Blender solves it
  because **the contact is authored**: two hand rigs actually gripping for a handshake; two heads
  posed in contact for a kiss; two bodies interlocked for a grapple. The conditioning stack then
  carries the spatial truth — **multi-figure OpenPose** (both skeletons, correct laterality),
  **depth** (who is in front, where they touch), and the **color-ID pass** (which pixels are whom).
  Feed all three and the model renders two distinct people in genuine contact, not a merged blob.
  Strength dials (§1) let the contact be firm (high pose+depth) while the ink stays loose.

**The one sentence:** author the spatial truth as geometry, render it as pose + depth + color-ID,
dial how hard each binds, and let the gen-AI paint the surface — and the same rig that made one
face angry makes two people shake hands.

## Gotcha: the base mesh has no eyeballs
The MPFB base mesh ships with **empty eye sockets** — so the shaded render's canny reads "hollow
almond" and the gen-AI fills it with blank/hollow eyes (intermittently; it's a coin-flip the prompt
can't reliably win). The fix that holds: **add proxy eyeball geometry** — a sclera sphere + a dark
iris sphere per socket — so every conditioning pass (ink / shaded / color / depth) shows a real eye.
Gotcha inside the gotcha: MPFB's `joint-l-eye` / `helper-l-eye` sit **~5 cm above and forward of the
visible socket opening**, so a sphere placed at that centroid lands on the forehead; seat it with an
offset (≈ `(0, +0.010, −0.055)`) or detect the recessed socket vert. Proper MPFB eye *assets* (not
bundled here) would be the clean long-term fix. This is the same lesson as everything else: **give
the model the form, don't hope the prompt invents it.**

## Open questions
- Regional conditioning in ComfyUI: which node (Attention Couple / regional prompts / GLIGEN boxes)
  best binds a prompt to a color-ID region for the multi-figure case? (Frame Designer names candidates.)
- Identity per figure across a scene (PuLID/InstantID) bound to each color region — the next Specialist.
- The face-landmark map is still approximate (a rough point-cloud, not precise iBUG-70). It works as a
  light supporting signal under shaded-canny; a tighter map would help pure-openpose-face conditioning.
