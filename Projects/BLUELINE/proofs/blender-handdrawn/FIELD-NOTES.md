---
title: BLUELINE — Blender hand-drawn look + genAI seam (field notes)
born: 2026-06-25
links:
  - target: "[[Frame Designer]]"
    type: connects-to
    label: staging-research
  - target: "[[BLUELINE]]"
    type: connects-to
    label: proving-ground
forward_vector: "I am a research proof: can Blender render the locked pen-flow look directly, and does that composite more cheaply with the genAI seam than rendering from scratch? I want my findings to harden into a Frame Designer staging method."
---

# BLUELINE — Blender hand-drawn look, and the genAI seam

**Question (Loudon, 2026-06-25):** can we use Blender's hand-drawn rendering tricks to (a) make stills/motion *close to our pen-flow style*, (b) **composite more easily with the genAI img2img** than rendering from scratch, and (c) make **hand-drawn motion — clouds, fire, water** — useful for BLUELINE?

All artifacts here are rendered on this Mac: **Blender 5.1.2 headless** + local **ComfyUI (SDXL base + canny/depth/openpose ControlNets)**. Scripts in `scripts/`. *What worked here* — hedged, like the Frame Designer notes.

---

## Part 1 — Blender can draw pen-and-ink directly (stills)

The locked style is *"modern pen & ink, loose gestural linework, sweeping flow lines, scattered ink blobs, stark B&W, rough paper, lots of white space."* Two Blender techniques get **close** on the line/shape half of that, in **~2 seconds a frame, fully deterministic**:

**A · Freestyle sketchy ink** (`blender/city_ink.png`, `figure_ink.png`). The win is the *waver*. Recipe (`scripts/01_stills.py → configure_freestyle`):
- Line set: silhouette + crease + border + external-contour + material-boundary. `crease_angle ≈ 125°` so only real corners draw.
- `chaining = SKETCHY`, `rounds = 3` → multiple overlapping strokes (the hand-drawn doubling).
- Geometry modifiers stacked: **Spatial Noise** (amp 4.5, scale 18, oct 2) + **Perlin 1D** (amp 3, freq 8) → the organic wobble that reads as a pen, not a vector.
- Thickness: **Calligraphy** modifier (min 0.6 / max 4.5, 45°) → ink-pen pressure along the stroke.
- Flat near-white **emission** fill + white world → the render is *ink lines on paper*. **Set view transform to `Standard`** — Blender 5's default AgX greys the paper out (the bug that bit on the first pass).

**B · EEVEE toon ink-wash** (`city_toon.png`, `figure_toon.png`). Diffuse → **Shader-to-RGB** → 2-band **ColorRamp** (interp `CONSTANT`: ink-shadow `0.05`, paper `0.97`) → Emission. A darker world reads as a stormy noir sky. The same Freestyle lines ride on top. This is the *value* half — flat spotted blacks.

**Not yet shown but the right next tool: Grease Pencil "Line Art" modifier** (Blender 4.x+). It converts the same geometry into *editable* GP strokes you can hit with GP Noise/Thickness modifiers and a textured-ink brush material — strokes you can also offset by hand. Freestyle is faster to script; GP Line Art is more art-directable and is where the ecosystem is heading.

**Verdict (stills):** Blender nails **line + flat value + composition**. What it does *not* give for free is the **gestural redraw and ink-blob/splatter texture** of the locked look — that's organic mark-making a renderer doesn't invent. That's exactly the gap the genAI seam is for (Part 3).

---

## Part 2 — Hand-drawn motion: water, clouds, fire/smoke

`scripts/03_motion.py`, 24 frames each @ 12fps (`motion/*.mp4`). All headless-procedural — **no Mantaflow bake** — so they re-render deterministically.

- **Water** (`motion/water.mp4`) — **Ocean modifier** (res 9, choppiness 0.9, wind 14), `time` keyframed 1→4.2. Toon ramp + Freestyle crests at `crease_angle 138°` so only wave-tops ink. Reads as rolling **sumi-e ink swell**. Cheapest, most convincing of the three.
- **Clouds** (`motion/clouds.mp4`) — displaced ico-spheres, toon-banded, drifting left + bobbing, Freestyle contour. Clean **ink-outline billows**.
- **Smoke / fire** (`motion/smoke.mp4`) — a rising column of churning displaced blobs, sine-wobbled upward. Reads as an **ink plume**. Honest limit: a primitive-stack plume is the weakest fake — *real* fire/smoke wants a small **Mantaflow** bake rendered through the same toon ramp; the look transfers, the motion gets believable.

**The "boil."** A `frame_change_pre` handler re-seeds the Perlin line noise every 2 frames ("on twos"), so the ink **wavers frame-to-frame** like traditional hand-drawn animation instead of sitting frozen. Measured: **5–11% of pixels change between consecutive frames** (drift + boil). A `boil OFF` switch (don't register the handler) freezes it back to a steady line.

**Why this matters for BLUELINE:** these are *elements*, not whole frames — atmosphere (rising smoke over the burning street, a roiling sea under the pier) that you composite **behind** the authored figures. They obey the same determinism rule as the board record: every frame is a pure function of the playhead, so they sync to the song and re-render identically. This is the "manipulate the existing ink, slowed down" motion direction met **at the source** — the lines themselves move, nothing is overlaid.

---

## Part 3 — The genAI seam (Blender → img2img → pen-flow)

Local **SDXL-base + Canny ControlNet**, init = a Blender render. The denoise/ControlNet
balance decides everything (`atlas/atlas_denoise_lesson.png`):

| Setting | Result | Read |
|---|---|---|
| denoise **0.72**, canny 0.85 (`city_from_toon`) | reconstructs the grey toon render, ~no ink | **fail** — render is preserved, medium unchanged |
| denoise **0.80**, canny 0.80, line init (`city_from_line`) | clean thin lines, loses the sketchy waver | **fail** — under-redraws |
| denoise **0.90**, canny 0.55 (`city_push_d90_cn50`) | half-toon, some ink edges + smoke | partial |
| **denoise 0.95, canny 0.42 / end 0.50** (`city_push_d95_cn40`) | **vanishing-point street, ink buildings, sweeping speed-lines, scattered splatter, white paper** | **win** — reaches pen-flow |
| denoise 0.88, canny 0.50, line init (`city_push_inkinit_d88`) | sparse scratchy ink + blobs, white space | win (cruder) |

**The lesson:** the Blender render must be treated as a **composition seed, not an appearance**.
You reach the locked ink look only when you let the model *redraw the medium* — high denoise
(0.9–0.95) with Canny **loosened to ~0.4** so structure guides but doesn't lock — and front-load
the ink medium in the prompt. This is the *"render rich, stylize last, denoise ~0.8+"* doctrine
from the Frame Designer notes, confirmed locally. Two hedges: (1) at denoise 0.95 the canny still
held the corridor but a *figure* would need a **pose/depth ControlNet** to survive the redraw
(canny alone won't hold a body) — same "anchor what must survive" rule; (2) **SDXL-base is not the
ideal ink model.** It *can* reach pen-flow but inconsistently; the RunPod ink checkpoint (or a
pen-flow LoRA) would hit it reliably at lower denoise, keeping more of the authored staging.

**MPS cost:** single Canny ControlNet img2img ≈ 100–130 s/frame at 832×1040 on this Mac; the
high-denoise jobs drifted to ~300 s under memory pressure. Fine for stills, **too slow for motion**
locally — motion stylization belongs on RunPod.

---

## Recommendation for BLUELINE

1. **Use Blender Freestyle/toon as the staging surface, not just for OpenPose+depth.** It already
   emits a render that is *most of the way* to pen-flow (line + value + exact composition) in
   ~2 s/frame, deterministic. Add it to the [[Frame Designer]] staging leg as a fourth output
   alongside pose/depth/canny: a **"draft ink"** pass.
2. **The seam is real but it's a *redraw*, not a *filter*.** Feed the Blender render as init at
   **denoise ≥0.9 + loose Canny (~0.4) + pose/depth anchors**, on the **tuned ink model**, not to
   preserve the render but to seed composition and let the model ink it. Don't expect a low-denoise
   "stylize" to work — that just returns your 3D render.
3. **Hand-drawn motion = atmosphere elements, composited behind figures.** Water (Ocean modifier)
   is the immediate keeper; clouds are easy; fire/smoke wants a small Mantaflow bake through the
   same toon ramp. Render them with the **Freestyle boil** so they read hand-drawn, and because
   every frame is a pure function of the playhead they **sync to the song** and re-render identically
   — this is the *"manipulate the existing ink"* motion direction satisfied at the source.
4. **Open question for Loudon:** is the Blender Freestyle ink *itself* close enough to ship as a
   register (it's cleaner/more controllable but lacks the organic blob texture), or is it strictly
   a seed for the genAI ink pass? The answer decides whether this becomes a standalone look or only
   a staging input.

---

## Part 4 — ink blobs/splatter that live in 3D (for parallax)

Loudon's question: the gen-AI pass adds blob/splatter as a *flat* 2D effect — could we
instead put ink blobs **in 3D space around the scene** so they parallax when the camera
moves? Yes. The method has three steps, all proven here:

1. **Analyze** (`scripts/blob_analyze.py`) — threshold a pen-flow frame, connected-component
   the ink marks, and *separate compact blobs from linework* (by area, extent, circularity,
   aspect). Measured signature of our locked blobs: **median diameter ~7px, circularity
   median ~1.0 with a p10 of 0.42** — mostly round specks plus a ragged/spiky tail. Cut the
   real blobs to an alpha library (`blob-library/blob_*.png`).
2. **Recreate** (`scripts/blob_synth.py`) — synthesize **high-res** blobs matching that
   signature: a Fourier-boundary body (raggedness driven by the measured circularity) +
   satellite droplets + a directional 'thrown' spatter tail. Crisp at any scale — the fix for
   upscaled low-res mattes pixelating. (`blob-library/synth/`.) This is the answer to *recreate
   the style/intensity/shape/character*: the analysis sets the knobs, the synth makes infinite
   non-repeating ink.
3. **Place + parallax** (`scripts/blob_swarm.py`) — scatter the blobs as **camera-facing alpha
   billboards** (COPY_ROTATION to camera, so they always read as flat ink, never as 3D cards)
   across a **depth shell**: a dense strike-cluster with a size-gradient at the impact point,
   a depth field spanning camera-near→far, and a few big foreground masses. **Excluded from
   Freestyle** via a collection-limited lineset, so only the *scene* gets outlined and the
   blobs stay pure ink. Truck the camera → real parallax (`blobspace.mp4`): big foreground
   blobs sweep, far specks barely move; buildings occlude blobs at their depth (proof they're
   genuinely in 3D).

**Why billboards, not 3D geometry.** A real 3D ink-glob (metaball) seen off-axis looks like a
ball, breaking the flat-ink read. A camera-facing card keeps the mark flat *and* gives it a 3D
position — flatness + parallax, the best of both.

**The "squares" were TWO bugs** (got the first one wrong twice — distinguish by *where* the square shows):
1. **Freestyle line-visibility square — only where a blob is over background lines** (invisible on white paper, which is why white-bg crops missed it). The real cause: even excluded from line *generation*, the alpha-billboard **square quads** still act as **occluders** in Freestyle's visibility pass, so it culls the building edges hidden behind each plane's transparent corners — a white rectangle erasing the linework. **No EEVEE material setting fixes this** (DITHERED and BLENDED both fail — it's the Freestyle pass, not EEVEE compositing). **Fix (two parts): (a)** render the city (Freestyle) and the blobs in SEPARATE view layers — Freestyle only sees the buildings → complete lines — then recombine by **Z-depth** (gate the blob layer with `cityDepth > blobDepth` into an AlphaOver Factor) so buildings still occlude blobs. **(b)** the isolated blob material must be **`DITHERED` clip** (not `BLENDED`): DITHERED *discards* the transparent fragments, so the plane's own square edge never shows; BLENDED leaves a faint grey plane-edge rectangle. Both parts are needed.
2. **Codec macroblock-square — everywhere during playback.** H.264 at crf 17 rings DCT blocks on sharp black-on-white. **Fix: crf ≤8 + `-tune animation`, or ProRes `.mov`.**
Always verify a blob sitting *over a line*, not on white. (Blender 5.1 compositor = `scene.compositing_node_group`; Math = `ShaderNodeMath`; AlphaOver sockets `Background/Foreground/Factor`.)

**Two hooks worth building next:**
- **Flow-field-biased emission** — drive blob density/direction off BLUELINE's flow field so
  splatter *follows the motion lines* (the spine reused at a new resolution).
- **Seam integration as a comp layer.** Render the blob field as its own depth-tagged pass and
  composite it **over** the stylized plate (not into the gen-AI redraw), so blobs keep their
  authored character and parallax while the model only inks the figures. Pure-black tuning +
  per-blob boil are one-liners.

## Part 5 — seam: how much it varies, and what happens over time

**Variation across seeds is high; structure is locked** (`stylized/variation/`, 8 seeds, one
fixed plate at d0.95/canny0.42). Canny holds the corridor + vanishing point in every seed, but
the *inking* swings wildly: light line-sketch → heavy spotted-black → full splatter-bomb, and the
figure appears/vanishes. This is the engine for **generate-many, pick the emotional register**.

**Temporal (camera moving through the scene, each frame stylized, fixed seed)** (`temporal/`).
Two readings, both true:
- *Composition is coherent* — Canny holds the buildings/figure as the camera dollies; the gestalt
  tracks smoothly.
- *The line rendering boils* — each frame is independently redrawn, so every line shifts a little.
  Frame-to-frame pixel change measures ~95% (vs 17% for the clean Blender input), but that number
  **overstates** it: sparse black-on-white flips a huge pixel fraction for a 1px line move.
- **Verdict:** per-frame img2img = composition-coherent + a *hand-drawn boiling line*. For BLUELINE
  that boil is closer to a feature than a defect. To *reduce* it (if a beat wants stability): lower
  denoise, AnimateDiff/video-diffusion, or temporal latent blending. To *embrace* it: it's already
  the traditional-animation boil, for free.

## The "white square around the ink blob" — two distinct bugs

Distinguish by *where* the square shows (I got this wrong twice, 2026-06-25):

1. **Freestyle line-visibility square** — only where a blob sits in front of background lines (invisible on plain white). Camera-facing alpha-billboard blobs are full square quads; even excluded from Freestyle line *generation*, Freestyle still treats them as **occluders** and culls the building lines behind the transparent part of each plane → a white rectangle around every blob. **No EEVEE material setting fixes it** (DITHERED / BLENDED both fail — it's the Freestyle visibility pass, not compositing). Fix: render the line geometry and the alpha billboards in **separate view layers** (Freestyle sees only the line geometry, never culled), then recombine by **Z-depth** — gate the blob layer with `(cityDepth > blobDepth)` fed into an AlphaOver `Factor` so buildings still occlude blobs. Verify on a blob over a line, never on white.
2. **Codec macroblock square** — everywhere during motion playback. H.264 at normal crf (~17) rings 8×8 DCT blocks on sharp black-on-white edges. Fix: `-crf 6..8 -preset veryslow -tune animation`, or ship **ProRes** (`-c:v prores_ks -profile:v 3 -pix_fmt yuv422p10le`, `.mov`). Crisp GIF: tiny palette + `paletteuse=dither=none`.

**Blender 5.1 compositor API** (changed from 4.x): no `scene.node_tree`; build `bpy.data.node_groups.new(name,'CompositorNodeTree')` + `tree.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')` + a `NodeGroupOutput`, and assign it to `scene.compositing_node_group`. Math node is `ShaderNodeMath` (not `CompositorNodeMath`); `CompositorNodeAlphaOver` sockets are **Background / Foreground / Factor**; the RLayers depth output is `Depth`.

## File index
- `blender/` — 4 stills (city/figure × ink/toon)
- `motion/` — `water|clouds|smoke` frame folders + `.mp4` + `.gif`
- `stylized/` — img2img results (Blender init → pen-flow attempts)
- `atlas/` — `atlas_stills.png`, `atlas_motion.png`, seam comparison
- `scripts/` — `01_stills.py`, `02_stylize.py`, `02b_stylize_push.py`, `03_motion.py` (all re-runnable)
