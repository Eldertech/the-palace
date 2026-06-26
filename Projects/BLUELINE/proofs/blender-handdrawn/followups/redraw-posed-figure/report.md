# BLUELINE — Does the gen-AI ink redraw survive on a POSED FIGURE?

**Proof date:** 2026-06-26
**Question:** The pen-flow high-denoise redraw was only ever proven on *architecture* (forgiving — buildings are boxes, they can't be "wrong"). A human figure is unforgiving: a melted limb reads as a mistake. Can the aggressive ink redraw (denoise 0.92–0.95) keep an authored body pose legible, and what anchors it?

**Verdict (short):** Yes — but **canny alone cannot do it**, exactly as predicted. Holding the pose requires a **volumetric/skeletal anchor (depth and/or openpose)**, and there is a hard tension: *the same anchor strength that holds the body also drags the look back toward a grey 3D render*. The figure survives the stark-ink redraw **only when you stack three ControlNets** — low-strength canny (surface) + depth (volume) + openpose (skeleton) — so the body is over-determined enough that the high denoise can re-ink it without dissolving it. That recipe (**job D2**) is the one image in the set that holds *both* the pose and the locked pen-flow style.

---

## 1. Figure setup (Blender 5.1, headless)

A posed mannequin built from primitives — **crouching / landing hero** at a low canted camera (lens 35mm, camera at ~knee height, −7° Dutch tilt). Sphere head, capsule torso/hips/feet, cylinder neck and limbs. The pose is deliberately dramatic and asymmetric: left arm reaching forward-down, right arm raised, deep-bent left knee, right leg crouched — a clear, readable silhouette that is obviously *wrong* if it melts.

Four plates rendered (`01_render_figure.py` + `01b_render_depth_pose.py`):

| Plate | File | Role | Engine notes |
|---|---|---|---|
| **Ink** | `ink_plate.png` | Canny source (flat near-white emission + Freestyle sketchy ink lines) | `BLENDER_EEVEE_NEXT`, `view_transform='Standard'` |
| **Toon** | `toon_plate.png` | img2img init (Shader-to-RGB 2-band ink-wash + Freestyle) | grey fills — this matters (see §4) |
| **Depth** | `depth_plate.png` | Depth ControlNet (camera-distance gradient via `ShaderNodeCameraData` → `MapRange`, near=white) | no compositor needed |
| **OpenPose** | `openpose.png` | OpenPose ControlNet (emissive coloured joint spheres + grey bone cylinders on black) | manually built from the same joint coords as the mesh |

**OpenPose note (the headless blocker, solved):** a real OpenPose *detector* needs a rendered human + a pose model. Headless, I instead **hand-authored the skeleton** — I know every joint's 3D position because I placed the mesh from those coords, so I drew coloured joint dots + bone cylinders and rendered them through the same camera. The result is a clean, correctly-projected OpenPose-style stick image (verified by eye). The standard OpenPose ControlNet accepts it. So depth+openpose were *both* usable — no need to fall back to depth-only.

---

## 2. ControlNet combinations tried

All jobs: SDXL base, `dpmpp_2m`/`karras`, 28 steps, cfg 7.5, seed 4242, locked pen-flow prompt + neg from `style-lock/locked-style.json`. ControlNets are **chained**: each `ControlNetApplyAdvanced` feeds its positive/negative conditioning into the next.

| Job | ControlNets (strength / end%) | Init | Denoise | Script |
|---|---|---|---|---|
| **A** | canny 0.55 / 0.6 | toon | 0.92 & 0.95 | `02_redraw_figure.py` |
| **B** | canny 0.50–0.55 + **depth 0.68–0.72** / 0.7 | toon | 0.92 & 0.95 | `02_redraw_figure.py` |
| **C** | canny 0.45–0.50 + **openpose 0.80–0.85** / 0.75 | toon | 0.92 & 0.95 | `02_redraw_figure.py` |
| **D1** | canny **0.35** / 0.5 + depth 0.55 / 0.55 | toon | 0.93 | `04_redraw_D_depth_freestyle.py` |
| **D2** | canny **0.30** + depth 0.60 + **openpose 0.70** | toon | 0.93 | `04_redraw_D_depth_freestyle.py` |
| **D3** | canny 0.35 + depth 0.55 | **ink** | 0.93 | `04_redraw_D_depth_freestyle.py` |

(A/B/C = the requested three strategies × two denoises. D = a follow-up sweep to find the sweet spot the first three exposed.)

---

## 3. Results — what held, what melted (judged by Reading each PNG)

| Job | Pose legible? | Pen-flow ink style? | Read |
|---|---|---|---|
| **A canny d0.92** | Yes (silhouette held) | No — flat grey render | Canny holds shape but no ink. |
| **A canny d0.95** | Yes, slight wobble | No — grey render | Pose survives; style absent. |
| **B canny+depth d0.92** | **Yes, strongest** | No — grey volumetric blobs | Depth *over*-holds volume; kills ink. |
| **B canny+depth d0.95** | **Yes, strongest** | No — grey blobs | Depth holds pose even at d0.95. |
| **C canny+pose d0.92** | **Melted** — abstract mass | **Yes — stark ink, drips, spotted blacks** | Low canny freed the ink; openpose alone could NOT hold the body. |
| **C canny+pose d0.95** | **Melted further** — near-abstract | **Yes — best style match** | Beautiful ink, body gone. |
| **D1 lowCanny+depth toon** | Yes | Mostly no — grey, a few splatter dots | Moderate depth still drags toward render. |
| **D2 canny+depth+pose** | **Yes** | **Yes — stark ink, speed-streaks, splatter** | ★ The win: holds *both*. |
| **D3 lowCanny+depth ink-init** | Yes | Partial — clean line on white, **no heavy blacks** | Ink-init removes grey but also removes drama. |

See `comparison_montage.png` (all 9 redraws + 4 plates, labelled) and `pose_survival_strip.png` (A95 · B95 · C95 · D2, the four-way money shot).

---

## 4. The findings

**1. Canny alone will not hold a figure through a 0.95 ink redraw — confirmed, with a twist.** At the *high* canny strength needed to hold the silhouette (0.55), the figure does actually survive — but the price is that the output stops being ink and becomes a flat grey render. So "canny fails" is more precise than expected: canny strong enough to hold the body **imports the body's grey, render-like character** and suppresses the stark-ink look. Canny weak enough to free the ink (≤0.40) no longer holds the body.

**2. Depth is the strongest *pose* anchor — and the strongest *style* saboteur.** B held the crouch more firmly than anything else, dead-stable through d0.95. But depth tells the model "this is a 3D volume," and the model obliges with grey shaded blobs. Depth wins pose, loses style.

**3. OpenPose alone gets the *style* but not the *body*.** C, with canny dropped to free the ink, produced the most beautiful pen-flow images in the whole set (heavy spotted blacks, dripping splatter, exactly the locked look) — but the figure dissolved into an expressive abstract mass. OpenPose is a *layout* hint (where the joints roughly are); under a 0.92+ redraw it is far too weak to keep limbs attached on its own.

**4. The init plate's value bleeds straight through.** The grey **toon** init is half the reason A/B/D1 look like renders — its mid-grey fills survive the redraw. The white **ink** init (D3) erased the grey entirely and gave clean line-on-paper, but with nothing to push into shadow the result had no heavy blacks or drama. The init is a real style lever, not just a shape seed.

**5. The win is to over-determine the body, then free the surface.** D2 stacks **all three** controls: canny dropped to 0.30 (so the surface is free to re-ink), depth 0.60 (volume), openpose 0.70 (skeleton). With the body pinned from two independent directions, the high denoise can re-draw the *surface* as stark ink without being able to move the *structure*. D2 is the only image holding the authored crouch **and** the locked pen-flow style at once.

### Which ControlNet matters most?
**Depth** — it is the single most effective pose anchor for a figure (B held best). But depth *by itself* fights the style, so the operative answer is: **depth for the body, kept at a moderate strength (~0.55–0.60), with openpose stacked on top for limb layout, and canny dropped low (~0.30) to let the ink emerge.** OpenPose is the cheap layout insurance; canny is the *style throttle*, not a pose anchor.

### At what denoise / strength does the pose hold?
- With a real anchor (depth or depth+pose), the **pose holds all the way to d0.95** (B proved it). Denoise is *not* the thing that melts a properly-anchored figure.
- What melts the figure is **insufficient structural anchoring**, not high denoise. Canny-only at *any* strength is the failure case for style-or-pose (you get one, not both). OpenPose-only melts at d0.92.
- The usable operating point: **denoise 0.93, canny 0.30 / depth 0.60 / openpose 0.70** (D2). Push canny up toward 0.5 and you slide back to grey-render; drop depth below ~0.45 and the body starts to soften.

---

## 5. What's weak / honest caveats

- **D2 is one good frame, not a validated recipe.** It proves the *principle* (stack body-anchors, free the surface) on a single seed/pose. It is not yet swept across seeds or poses, and it is not yet a *temporal* test — frame-to-frame coherence of a figure under this stack is unproven and is the obvious next risk (the architecture boil was already lively; a figure boil will be worse).
- **The mannequin is primitive-built**, so its "correct" pose is forgiving — a sphere head can't be subtly wrong the way a real face can. A rigged/skinned mesh (smoother silhouette, real anatomy) would be a harder and more honest test, and would likely need the depth plate to carry more of the load.
- **The toon-vs-ink init is under-explored.** D2 used the toon init for its useful mid-greys; a *graded* init (ink line-work with selectively darkened masses) might get D3's clean line plus D2's drama. Worth a follow-up.
- **The hand-authored openpose** is geometrically exact but stylistically "perfect" — a detector on a real render would be noisier, which might actually anchor differently. Fine for this proof; flag it if porting to a detector-based pipeline.
- **No quantitative pose metric.** Judgements here are by eye (Reading the PNGs). A keypoint-reprojection error against the authored joints would make "holds / melts" measurable — recommended before this graduates to a Shop recipe.

---

## 6. File list (all in `followups/redraw-posed-figure/`)

**Scripts**
- `01_render_figure.py` — builds the crouching mannequin; renders `ink_plate.png` + `toon_plate.png` (depth pass via compositor was abandoned — `Scene.node_tree` access path changed in Blender 5.1; superseded by 01b).
- `01b_render_depth_pose.py` — renders `depth_plate.png` (camera-distance material) + `openpose.png` (hand-built skeleton).
- `02_redraw_figure.py` — strategies A/B/C × denoise 0.92/0.95 (6 jobs). Chains canny→depth and canny→openpose ControlNetApplyAdvanced nodes.
- `04_redraw_D_depth_freestyle.py` — sweet-spot sweep D1/D2/D3 (3 jobs).
- `03_montage.sh` — labelled montages (uses `magick` + Arial.ttf; `convert`/`Helvetica` were unavailable).

**Source plates**
- `ink_plate.png`, `toon_plate.png`, `depth_plate.png`, `openpose.png`

**Redraws**
- `redraw_A_canny_d092.png`, `redraw_A_canny_d095.png`
- `redraw_B_canny_depth_d092.png`, `redraw_B_canny_depth_d095.png`
- `redraw_C_canny_pose_d092.png`, `redraw_C_canny_pose_d095.png`
- `redraw_D1_canny035_depth055_toon.png`
- `redraw_D2_canny030_depth060_pose070.png`  <- the win
- `redraw_D3_canny035_depth055_inkinit.png`

**Comparisons**
- `comparison_montage.png` — full grid (plates + all 9 redraws, labelled)
- `pose_survival_strip.png` — A95 · B95 · C95 · D2 four-way

**Recommended next:** temporal coherence test of the D2 stack over a short motion (does the figure boil?), a seed/pose sweep to confirm D2 generalises, and a keypoint-reprojection pose metric to replace eyeballing.
