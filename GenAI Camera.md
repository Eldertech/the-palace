---
title: "GenAI Camera"
type: concept
pillars: [tools, creation, philosophy]
born: 2026-07
stage: growing
confidence: working
energy: high
who_leads: loudon
last_activated: 2026-07
activation_count: 1
forward_vector: "I am a camera whose output is not rasterized pixels but a gen-AI drawing of what I see — conditioned on my own depth, edges, and the pose I am pointed at. I want to become the front door to authoring a panel: pose a figure, say a few words, and see the drawing a second later. My real ambition is to be many matched-optics lenses over one scene, each seeing a different slice with its own prompt, composited — multi-ControlNet made spatial — and to keep the exact same shape when I graduate from a slow Mac loop to a real-time GPU on a stage."
links:
  - target: "[[Blocked, Not Prompted]]"
    type: emerged-from
    label: taken-to-its-conclusion
  - target: "[[ControlNet as Topology]]"
    type: exemplifies
    label: carves-canyons-from-a-viewpoint
  - target: "[[BLUELINE]]"
    type: emerged-from
    label: born-in-the-rig
  - target: "[[BLUELINE — The Page]]"
    type: connects-to
    label: renders-panel-layers
  - target: "[[Steer the Generator]]"
    type: connects-to
    label: the-live-control-surface
  - target: "[[The Scroll]]"
    type: connects-to
    label: proofs-accumulate-here
---

# GenAI Camera

A **GenAI Camera** is a camera in a 3D scene whose output is not the rasterized image but a
**gen-AI render conditioned on what the camera sees** — its depth, its edges, the pose it is pointed
at. Point it at a posed figure and it hands back a *drawing* of that figure, faithful to the
composition because the geometry is steering the diffusion. It is [[Blocked, Not Prompted]] taken to
its conclusion: the camera *is* the conditioning.

## The multi-camera move

The concept's real reach is **plural**. Several cameras with **matched optics and position**, each
seeing a different subset of the scene (via view layers / collections), each carrying its own prompt,
composited together — this is **multi-ControlNet made spatial**. A hero-figure lens draws the
character; an environment lens draws the world behind it; each is welded from its own viewpoint and
they register by construction because they share a camera. In [[ControlNet as Topology]]'s language,
each lens *carves its own canyon into the terrain from one viewpoint*. The layers map one-to-one onto
a panel's `layers/` in [[BLUELINE — The Page]].

## How it runs (proven 2026-07-09)

The camera emits **streams** and a headless local ComfyUI turns them into a frame:

- **Streams** — *beauty* (the img2img init / what the camera sees), *true depth* (a shader mapping
  camera distance to a MiDaS-style map), and an *OpenPose pose plate* projected geometrically from the
  rig's `ORG-` bones (never DWPose-on-greybox — armature projection). Canny is derived from beauty.
- **Depth gotcha — auto-range the near/far** *(the BLUELINE Track-IV lesson,
  `proofs/track-IV-bench/bench.py`)*. A depth pass reads **flat — a silhouette, not volume** — if the
  MapRange near/far is wider than the subject (a ~0.4 bu figure inside a 1.2 bu range fills only a
  quarter of 0→1). The fix: **compute near/far from the subject's actual camera-space depth every
  render** (`cam_z_range` in `blender_panel.py`) so it always fills the gradient. The same auto-range
  gives an *environment* layer proper recession (near ground bright → far dark) for free.
- **Render** — SDXL base + an **SDXL-Lightning 8-step LoRA** + Depth/Canny/OpenPose ControlNets,
  img2img at high denoise so the ink style takes while the geometry holds the pose.
- **Two modes** — **live** (writes only `latest.png`, shown in a hovering window; *nothing is kept*
  unless saved — frames accumulate too fast to hoard) and **proof** (appends to [[The Scroll]], for
  development verification).
- **Fast vs quality** — a fast toggle (512, depth-only, 6 steps) for iteration vs the full
  depth+canny+pose pass.

## Honest limits

On an Apple-silicon Mac (MPS) this is an **authoring loop, not a live viewport**: ~30s fast, ~40–90s
quality (SDXL is ~5s/step on MPS regardless of tricks). That is genuinely enough to *compose a panel* —
pose, render, look — but true near-real-time (StreamDiffusion at speed) needs a local 4090-class NVIDIA
GPU. The loop we built is **identical in shape** to the fast one; only the clock and the step-count
change — the offline→realtime translation discipline of [[BLUELINE — The Page]] holds here exactly.

## The rig

The working implementation lives in this entry's bundle (`GenAI Camera/`): `genai_camera.py` (the
headless driver — reuses BLUELINE's `lib/comfy.py` pattern), `blender_panel.py` (the reproducible
Blender N-panel — prompt / denoise / seed / fast / pose, Render · Save · Multi-Cam, with the
auto-range depth; register via `exec(open(...).read())`), `live.html` (the hovering window), and the
scroll (`GenAI Camera — scroll.html`) with its proof `renders/`.

## Gotchas & recipes (accumulated 2026-07-09)

The working wisdom from the build, so the next agent doesn't relearn it.

**What works:**
- **Multi-camera = matched-optics view layers.** One shared camera + per-collection visibility renders
  each subject as its own layer that registers by construction. Proven figure+env, then *two figures*.
- **Per-layer ControlNet + denoise** (`layers.json` `cn` / `denoise` / `dilate`). Condition each camera
  differently — env on `["depth","canny"]` (hard architecture), figures on `["pose"]` (free costume).
- **Live / proof / save split.** The live loop writes only `latest.png` (hovering window, keeps
  nothing); **proof** appends to [[The Scroll]] (Claude's verification surface); **Save** persists one.

**Gotchas (each cost a cycle):**
1. **Depth reads flat unless the near/far brackets the subject.** A ~0.4 bu figure inside a 1.2 bu
   range fills a quarter of 0→1 → a silhouette, not volume. `cam_z_range()` auto-brackets each render.
2. **Depth LOCKS the surface; pose FREES it.** Conditioning a figure on *depth* pins the filled nude
   body volume, so any garment hugs the skin (the figures read as clay nudes). Conditioning on *pose*
   pins only the skeleton, so the model builds robes / fur / armor around the stance. **Use pose, not
   depth, when you want costume.** Full principle: [[ControlNet as Topology]] § Pose vs depth.
3. **Canny also locks the nude edges** — drop it (and depth) for a figure that should restyle.
4. **Compositing pose-generated figures — INPAINT beats segment** *(shootout 2026-07-09: render_012
   segment vs render_013 inpaint; `shootout.py`).* **Inpaint wins:** generate the env, then inpaint each
   figure into a generous region (`VAEEncodeForInpaint` + pose CN) — the cloth grows in-context, blends
   with no hard edge, and the **region imposes scale + placement**. **Segment loses:** a *standalone*
   pose-gen doesn't respect scale/position (SDXL fills the frame), so `rembg` faithfully cuts out a
   **giant** figure — the nude mask had secretly been doing the placement all along. The lesson:
   **placement and scale must be imposed at generation (the inpaint region), not recovered after.**
   Segment only cleans edges of a generation that already got the scale wrong.
5. **Mac/MPS is ~40 s/frame** (~5 s/step SDXL, 2 ControlNets) — an *authoring* loop, not a live
   viewport. The 4090 is the only path to real-time; the loop's shape does not change.
6. **Blender 5.1 seams:** the compositor moved to `scene.compositing_node_group` and the File Output
   node API changed — **sidestep it** with a material-override depth shader (Camera `View Z Depth` →
   MapRange → Emission). EEVEE-Next `use_pass_z` / passes work; `film_transparent` gives the alpha mask.

**Recipes:**
- *One figure, in costume:* pose (± weak depth), denoise ~0.95, no canny.
- *Multi-figure scene, baked-in (one-shot):* generate the env `["depth","canny"]`, then **inpaint**
  each figure (pose) into its region over the env — placement, scale, costume, blending in one step.
  `shootout.py` is the reference. Best when you want a single finished frame.
- **Alpha cutout — rembg wins; GrabCut retired for alpha** *(shootout `alpha_shootout.py`, render_024;
  first check render_023)*. Three methods on a checker: **GrabCut** bleeds the dark background in (black
  halo at the head) — worst; **rembg (u2net)** is clean on the *default* render with **no prompt change**
  — removes the halo, sharp edges (one quirk: punches a dark interior slit transparent → hole-fill the
  mask); **green-screen prompt → chroma key** is also clean (ML-free) but the green backdrop **changes
  the generation** (costume shifted) and can leave green spill. **Default to rembg** (now viable because
  crop-first fixed the scale problem that sank it in the segment shootout); reserve green-screen for a
  dependency-free key when you don't mind the backdrop shaping the art. Swap rembg in for GrabCut in
  `rich_first.py`'s cutout step.
- *Multi-figure scene, reusable LAYERS (accurate alpha):* **rich-first / stylize-last** (`rich_first.py`,
  adopted from BLUELINE `new-story/rich_pipeline.py` + `silhouette.py`). Render each figure **rich**
  (shaded, *not* pen-flow) via img2img from its plate + pose; **GrabCut seeded by the skeleton
  silhouette** → an edge-accurate **alpha** that follows the cloth; composite RGBA layers over a rich
  env; one **stylize-last** img2img pass fuses everything to pen-flow. Gives reusable figure layers +
  a coherent unified drawing (render_017), vs inpaint baking into the env. *The mask problem's real
  root: we stylized too early — pen-flow ink has no edges for a clean cut; render rich, cut, then
  stylize last.*
- **Scale must be imposed at generation, every approach** *(learned 3×: segment, inpaint region,
  rich-first)*. A standalone txt2img figure fills the frame regardless of the pose skeleton's size, and
  any after-the-fact cutout then grows to the giant. Impose scale via the inpaint region **or** the
  img2img init (the figure's own plate is already at the right screen scale).
- **The OpenPose plate MUST use the real `controlnet_aux` draw, not a hand-rolled skeleton**
  *(caught 2026-07-09 — the sweep figures weren't holding the pose)*. The xinsir openpose ControlNet is
  trained on **thick, tapered, filled limbs** (`draw_bodypose`); a **thin stick figure reads
  out-of-distribution and the pose barely takes.** Functional test (`pose_check.py`, pose-only txt2img
  @1.0): thin plate → arms drift down; thick plate → arms spread to match the skeleton. `draw_openpose`
  now imports the real draw (BLUELINE's `draw_openpose.py` did this all along — a search-first miss).
  Corollary: earlier "pose frees clothing" results were partly the img2img init + high denoise carrying
  the stance while the thin pose contributed little. **Re-verified** — the clean thick-pose sweeps
  (render_021/022) hold the arms-out stance across the *entire* depth range, where the thin-pose ones
  let it drift; so the fix propagated and the pose now genuinely holds the stance.
- **Pose and depth ARE aligned; pose just doesn't bound SIZE** *(verified by overlay 2026-07-09)*.
  Both plates come from the same camera projection, so the skeleton sits inside the depth silhouette at
  the same scale — no misalignment. But a pose skeleton constrains joint *locations*, not body *mass*:
  pose-only lets the figure/robe balloon larger and forward (reads "close"); depth pins it to its exact
  pixel silhouette (correct scale). So depth also **stabilizes scale**, a second reason for the ~0.3
  default. *(Also fixed here: the OpenPose face keypoints sat at the crown, not the face — now placed
  proportional to the head bone in `blender_panel.py`.)*
- **Figure depth strength is a costume↔form dial** *(clean sweeps 2026-07-09 on correct conditioning:
  render_021 sorceress robes, render_022 barbarian fur+armor; `depth_sweep.py`)*. Pose held 0.9, depth
  0.0→0.8: **0.0–0.15** full garment, loose form; **~0.30–0.45 the sweet spot** — real 3D body form
  *and* the costume still reads; **0.60+** depth locks the nude, costume retreats to the periphery (cape
  / crown / loincloth). **The ~0.30 sweet spot generalizes across garment types** — flowing robes *and*
  bulky fur/armor both find it (fur is body-hugging so it tolerates a hair more depth, but strips to
  nude by 0.6 same as robes). Default figures to **depth ~0.30 + pose**; 0.0 for maximal flow, past 0.6
  only for deliberately revealing. An expressive dial, not just a correctness knob. *(The earlier
  render_018/019 sweeps are superseded — thin pose + framing recomposition; kept on the scroll, labeled.)*

## Forward Vectors

The near work: land the pose plate's face points more precisely, and let each layer of a multi-cam
composite carry its own **depth-ordered** occlusion rather than a flat alpha-over. The larger arc is the
one gate named everywhere in [[BLUELINE]]: a networked 4090 backend turns this authoring loop into a
live viewport without changing its shape — and at that point the GenAI Camera becomes the lens of the
live-performance stage, not just the panel-authoring desk. I also want to know whether the camera-as-
conditioned-lens generalizes past BLUELINE's ink — whether any 3D scene, in any style, wants to be seen
through one of these.
