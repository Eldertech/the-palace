# BLUELINE · Track VI — ELEMENTAL MOTION

*Giving an individual inked frame subtle, dramatic motion — flame, time-lapse sky, smoke, dust, water — without losing the hand-drawn high-contrast B&W look.*

Started 2026-06-24. Bench: `Projects/BLUELINE/proofs/track-VI-elemental-motion/`.

---

## TL;DR — the headline finding

**Stylize once with AI, then move the ink with pure geometry.** The AI draws the ink a single time; a deterministic displacement field animates it into a seamless loop. The result is **temporally rock-solid (zero boil)** where a per-frame AI restyle flickers. This is the literal form of Loudon's standing note — *"manipulate the existing ink, slowed down"* — and it rhymes with the M3 result that **seed-lock beat per-step warp** for coherence.

- Measured loop seam: **0.0** (frame N ≡ frame 0 by construction — every temporal term is a whole number of cycles).
- Measured boil, deterministic NPR stylization: **0.15 / 255** mean frame-to-frame Δ. Per-frame AI img2img: **1.50 / 255** — the contrast is the whole argument.

Two paths, and the research names both:
1. **Warp the existing ink** (Tier A) — the deep, native path. Backbone: Halperin et al., *Endless Loops* (SIGGRAPH 2021) — periodic displacement fields + temporal smoothing.
2. **Simulate a new element, stylize it, composite it** (Tier B+C) — for cases the warp can't reach (billowing smoke, scattering dust, a medium that isn't drawn yet).

---

## The bench (reusable system, not a sequence)

```
track-VI-elemental-motion/
├── lib/
│   ├── fields.py     # per-phenomenon displacement fields; seamless by construction; + from_flow (Tier-B bridge)
│   ├── warp.py       # the ink-warp engine: mask-confined backward warp -> loop -> gif/mp4/strip/anaglyph
│   ├── comfy.py      # local SDXL driver (:8188) — txt2img (plates) + img2img (pen-flow stylize)
│   ├── stylize.py    # grayscale sim -> pen-flow ink: --mode npr (loop-stable) | ai (control); flicker metric
│   ├── compose.py    # separate -> infill(paper-white) -> animate -> recomposite (multiply = ink-on-paper)
│   └── board.py      # labeled comparison boards (Loudon Live palette)
├── gen_plates.py     # environmental pen-flow test stills, one moving element each
├── blender/
│   └── smoke_sim.py  # headless Mantaflow smoke/fire -> grayscale-on-white; --puff, upward launch
├── plates/  renders/  report-assets/
```

Every run writes a manifest (params + metrics). Method+params+assessment are recorded per phenomenon — promote the winners to [[Frame Designer]] field notes.

---

## Tier A — deterministic ink-warp (PROVEN, all five phenomena)

One pen-flow still + a feathered element mask + a displacement field → seamless loop. Motion is **masked to zero outside the element**, so there is no composite seam — the rest of the drawing holds perfectly still while one element lives.

| Phenomenon | Field | Mask | Result | Read |
|---|---|---|---|---|
| **Water** | traveling sinusoids, vertical bob, depth-scaled | bottom band | ✓ excellent | reflections ripple, foreground bigger than distance |
| **Sky** | very-low-freq large-wavelength billow + drift | top band | ✓ excellent | clouds breathe/slide, ridge locked |
| **Smoke (wispy)** | turbulent rise, lateral-biased | plume region, base-anchored | ✓ excellent | drawn curls move; candle flame flickers |
| **Flame** | fast oscillatory lick + lateral curl | full, base-anchored | ✓ excellent | woodcut flame wall licks upward, tips dance, base pinned |
| **Dust** | lateral-biased shimmer | lower band | ✓ good | wind-shimmer; best as a faint layer, not heavy ink |

**Anchor trick (flame/smoke):** a per-pixel weight that is 0 at the base of the mask and 1 at the top pins the source and frees the tips — the difference between "the whole flame slides" and "the flame licks."

**Cadence:** loops default to 60 frames @ 24 fps (2.5 s). "Slowed down" = lower temporal frequency, not smaller amplitude; amplitudes of ~4–7 px already read.

**Cost:** pure CPU, seconds per loop, free. No GPU, no model.

---

## Tier B — Blender Mantaflow sims (PIPELINE PROVEN; art-direction is the craft lever)

Headless `blender --background --python` bakes a sim and renders a **grayscale-on-white** stylizable substrate. End-to-end works on Blender **5.1.2**. Gotchas found and fixed (worth keeping):

- **AgX view transform crushes white→grey and kills contrast.** Set `view_settings.view_transform = "Standard"`. Without it the "white paper" renders mid-grey and nothing thresholds cleanly.
- **Blender 5.x slotted-action API:** `Action.fcurves` is gone. Don't keyframe-and-iterate-fcurves; use a `frame_change_pre` handler for time-varying flow (e.g. a density "puff").
- **Rise/buoyancy is the real work.** `quick_smoke` builds a large domain; getting a tall, beautiful plume needs `alpha`≈0.1 (low sink), `beta`≈2.0 (heat rise), an upward initial launch velocity, vorticity for curl, and enough frames. **What worked:** a discrete `--puff` (inflow stopped after ~15 frames) + an upward launch velocity + 110 frames gave a clear rising plume; continuous inflow at this domain scale barely rose. The emitter mesh must be `hide_render=True`. The medium renders faint, so lift it in the NPR levels (`--hi 0.55 --gamma 0.7`). A genuinely *beautiful* tall plume is still a tuning pass away — the path is proven, the art direction is the open work.

**Where Tier B earns its keep:** topology-changing billowing smoke, scattering dust, or any element that must exist where the drawing has none — i.e. exactly the cases warp can't do. For wispy/curling elements that ARE drawn, Tier A looks better and costs nothing.

**Bridge to Tier A (`fields.from_flow`):** a baked velocity sequence can *drive* the warp instead of a procedural field — physically-grounded motion on the drawn ink. (Capability built; demo pending a clean velocity bake.)

---

## Tier C — stylization (sim grayscale → pen-flow ink)

The question: how do you get a Blender sim into the locked look without it boiling?

- **NPR (deterministic, `--mode npr`):** levels → break the ink on a **static** procedural cold-press tooth (generated once, reused every frame) → optional drawn contour. Loop-stable: **flicker 0.15/255.** Reads as black marker + grey dry-brush on white paper. Free, instant.
- **AI img2img (`--mode ai`, control):** per-frame SDXL in the pen-flow recipe. Richer ink, but each frame is redrawn → **flicker 1.50/255** — it boils. Fixed seed helps but does not solve it.

**Conclusion:** for *motion*, the deterministic NPR substrate-lock beats per-frame AI for the same reason warp beats it — stability comes from drawing the ink once, not redrawing it 60 times. AI's role is to make the **single** still (the plate), not the frames.

---

## The recomposite pipeline (separate → infill → animate → recomposite)

The workflow specialized to ink-on-paper:

1. **Separate** the element (a mask).
2. **Infill** the hole — for BLUELINE the background is white paper, so infill = paper-white + faint grain. Nearly free. (Diffusion inpaint is the fallback when structure sits behind the element.)
3. **Animate** the element (warp the cut-out, or a stylized sim).
4. **Recomposite** — **ink-on-paper compositing IS multiply blend**: `out = base * element`. White (1) passes the base; black ink (0) darkens. No alpha needed when the element sits on white.

`compose.py` also supports `--over-warp`: multiply the inked element over a *subtly warped base loop*, so a foreground sim element and a breathing background co-move.

**Tested lesson — infill is ground-dependent.** White-paper infill + multiply only work on a **white-ground** plate (BLUELINE's usual case). On a dark-ground plate (the candle, a dark wash behind the drawn plume) white infill punches a glaring hole *and* multiply can't show inked smoke on dark (multiply only darkens). Fixes shipped: `--infill diffuse` (bleed the surrounding color into the hole) for dark grounds; and for added elements prefer white-ground plates (the chimney) so the element drops straight in. Net rule: **author plates with white space where motion will live** — then "infill" is free and the composite is a one-line multiply.

---

## The 2.5D paper stack — two routes to the layers (A vs B)

The real architecture (Loudon): a frame is **sheets of inked paper, cut sharp, stacked with
air between them**, each with its own subtle motion. The cut must **ride the black line** — a
hard alpha edge hidden inside the ink stroke (black meets black). Seams are then hidden by
**occlusion**, not feathering: a static foreground silhouette simply covers the moving sheet
behind it. Tooling: `lib/layers.py` (extraction + keying) + `lib/stack.py` (alpha-over
compositor, per-sheet field, parallax). Test scene: the sky/ridge plate — the exact case
where my band-mask bled cloud drift into the ridge.

**Route A — separate & infill** (`route_separate.py`): cut the ridge out of the finished
drawing, whiten behind it, stack drifting sky behind a static ridge.
- The naive luminance threshold **failed** (grabbed 63% — dark hill *and* dark cloud ink are
  both "dark"). The fix is **content-aware**: a filled mass is *densely* dark; linework is
  *sparse*. Threshold local dark-**density**, not darkness → hill survives, clouds drop, and
  the 0.5 contour lands on the silhouette (a black line) so the cut hides. Cover → 38%, clean.
- Result: clouds drift, ridge pin-static, **no bleed.** The band-mask failure, fixed.

**Route B — generate as layers** (`route_generate.py`): render the ridge and the clouds as
two separate SDXL passes; key each to alpha; stack.
- Alpha is **clean by construction** — nothing was ever occluded, no extraction, no infill.
- But the two independent passes **don't cohere**: the "ridge silhouette" prompt drifted into
  a full figure-scene, and stacked against independently-generated clouds the layers *fight* —
  two drawings, not one. Motion works; the picture is muddy.

**The verdict — they're duals.**

| | Route A · separate | Route B · generate |
|---|---|---|
| Coherence (one picture) | **free** (it *is* one drawing) | **the work** — passes drift in composition/style/registration |
| The cut (clean alpha) | **the work** — content-aware extraction (density now; SAM+snap-to-ink for hard scenes) + infill behind | **free** (clean by construction) |
| Works on an existing frame? | **yes** | no (only new frames) |
| Occlusion holes need inpaint? | yes (free on white ground) | no |

**Choose by what you hold.** Already have the finished frame → **Route A**, with ink-aware
extraction. Making the frame → **Route B**, but *only with shared conditioning* — the same
control image / depth / seed across passes so the sheets compose as one — which is exactly the
[[Frame Designer]] "generative layering under shared context" plan. Naive independent
generation gives clean mattes and an incoherent picture; shared conditioning is what earns
Route B its coherence. A makes coherence free and the cut hard; B makes the cut free and
coherence hard.

## v2 — pushing both routes on ControlNet (RunPod)

Both routes were hardened with the palace's proven ControlNet infra.

**Route A v2 — inpaint behind the foreground (LOCAL SDXL, in ink).** Route A's weak spot was
infill: white-paper only works on a white ground. On the water plate (a dark, structured ground
where foreground trees occlude the lake), `comfy.inpaint` (SDXL `VAEEncodeForInpaint`) fills the
hole with coherent **water + far shore in ink** instead of punching a white hole — so the trees
become a static front sheet over independently-rippling water. Runs locally, free, keeps the
pen-flow look. The cut still rides the trees' black edge. ✓

**The RunPod recipe (hard-won, now recorded).** Getting ControlNet on the GPU has one correct path:
- `worker-comfyui` is a *serverless* image; ComfyUI only reaches the proxy when launched right
  **and** the ControlNet model is actually present. A from-scratch "download SDXL + CN to the
  container disk" pod boots but never exposed ComfyUI — and the serverless endpoint has the
  union *node* but an **empty ControlNet list** (`'flux-union-pro.safetensors' not in []`): the
  model lives on the **network volume**, which serverless doesn't mount.
- **The working recipe (from M3):** create the pod with `networkVolumeId` (blueline-models,
  holds `flux-union-pro`) mounted at `/workspace`, symlink the CN into ComfyUI, launch FLUX.
  Verified here: ComfyUI up ~125s, `union_cn=True`. `lib/pod.py` now encodes exactly this, with
  the 500-leak recovery and **guaranteed teardown** (the `--cleanup` runs even on render failure
  — no leaked GPU). Transport gotchas that bit: the proxy WAF 403s a bare user-agent — send a
  **browser UA on the curl upload too**, and use `-sS` (not `-s`, which hides the error).

**Route B v2 — generate-as-layers under SHARED conditioning (FLUX union + local re-ink).** Both
the clouds pass and the ridge pass condition on the **same authored depth map + the same seed**,
so the sheets register as one scene (naive B's drift, fixed), then each layer is **re-inked
locally with SDXL** for the pen-flow look (FLUX's ControlNet coherence + SDXL's ink).

**Result: it cohered.** The hill landed at **38–39%** in every pass (matching Route A's 38.4%) —
the shared depth map placed it identically. The FLUX stack reads as **one scene** (a dark ridge
with clouds billowing *behind* it), where naive B's independent passes fought. Tunable edge: at
re-ink denoise 0.55–0.6 the ink reads wash-like rather than crisp line — a lineart ControlNet or
higher denoise would sharpen it. **Shared conditioning is what earns generate-as-layers its
coherence** — exactly the [[Frame Designer]] "generative layering under shared context" plan,
now proven on the GPU. (Cost: ~$0.20, pod up ~8 min, torn down.)

**Both routes now work.** The dual holds but both sides are tractable: **A** = coherence-free,
and the cut + infill are now solved locally (density extraction + SDXL inpaint), in ink, free —
best when you already have the frame. **B** = clean-alpha-free, and coherence is now solved by
the shared authored control — best when generating new frames, at the cost of a ControlNet pass +
a re-ink. Author plates (or depth maps) with white space where motion lives, and either route
delivers the breathing paper stack.

## The decision map — which technique per phenomenon

```
Is the element already drawn, and does it keep its topology (just displaces)?
  ├─ YES → WARP THE INK (Tier A). Free, loop-perfect, native. [water, sky, wispy smoke, flame, gentle dust]
  └─ NO  → does it billow / scatter / not-exist-yet?
            └─ SIMULATE (Tier B) → STYLIZE NPR (Tier C) → RECOMPOSITE (multiply).
               [billowing smoke, heavy dust, explosions, a medium the drawing lacks]
Want physically-grounded motion on drawn ink? → bake velocity (Tier B) → drive warp via fields.from_flow.
Never: per-frame AI restyle for the motion itself — it boils. AI makes the still, geometry makes the motion.
```

---

## Open craft levers (next)

- **Sim art-direction:** dial Mantaflow to a genuinely beautiful tall plume / fire; it's tuning, not a blocker.
- **Velocity→warp bridge demo:** bake a fluid/smoke velocity pass, drive `from_flow`, compare to procedural.
- **Real element masks:** threshold/segment the plume vs. crude bands (cv2/SAM on RunPod; cv2 isn't local).
- **FLIP water + particle dust + volumetric time-lapse sky** sims for suite completeness (warp already covers their look).
- **Parallax (3D cinemagraphy):** add depth-driven parallax for camera-ish moves (Li et al., *3D Cinemagraphy*).

## References
- Halperin et al., *Endless Loops: Detecting and Animating Periodic Patterns in Still Images*, SIGGRAPH 2021.
- Li et al., *3D Cinemagraphy from a Single Image*, CVPR 2023.
- *Sketch-Guided Motion Diffusion for Stylized Cinemagraph Synthesis*, arXiv 2412.00638.
- AniDoc / LVCD — lineart video diffusion (the RunPod AI-video path, if pursued).
