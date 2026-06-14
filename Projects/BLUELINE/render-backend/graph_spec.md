# Graph build sheets

You build each graph **once** in the ComfyUI UI, set the node **Titles** below, then
`Save (API Format)` to `graphs/sdxl_study.api.json` and `graphs/flux_piece.api.json`.
The runner keys on titles, so as long as the titles match, you can rewire freely.

The titled nodes both graphs must expose:

```
POSITIVE  NEG  POSE  DEPTH  IDREF  SAMPLER  SAVE
```

ControlNet strengths and guidance windows are set here and **locked** — they are not
per-board. Per board you only change: the two control images, the identity ref, the
positive text, and the seed.

---

## graphs/sdxl_study.api.json  (Study tier — fast decisions)

**Load**
- `Load Checkpoint` → your house-style SDXL finetune (e.g. Juggernaut XL or an
  illustration-leaning SDXL). One node provides MODEL / CLIP / VAE.

**Conditioning (text)**
- `CLIPTextEncode` **title = POSITIVE**
- `CLIPTextEncode` **title = NEG**

**Angle axis — ControlNet (set strengths here)**
- `LoadImage` **title = POSE** → `DWPreprocessor` (or feed a hand-drawn skeleton directly
  and bypass the preprocessor) → `ControlNetLoader` (SDXL OpenPose, e.g. xinsir) →
  `ControlNetApplyAdvanced`  strength **0.75**, start 0.0, end 0.7
- `LoadImage` **title = DEPTH** → `DepthAnythingV2Preprocessor` (or feed a depth map
  directly) → `ControlNetLoader` (SDXL Depth) → `ControlNetApplyAdvanced`
  strength **0.55**, start 0.0, end 0.7
- When stacking both, keep each ≤ ~0.6 so they don't fight.

**Character axis — identity**
- `LoadImage` **title = IDREF** → `IPAdapterUnifiedLoader` (FACEID preset) →
  `IPAdapterFaceID` weight **0.8** → into MODEL.
- (Later, for leads: add a `LoraLoader` for the trained SDXL character LoRA and drop
  FaceID weight, or run both.)

**Style axis** — either a `LoraLoader` (style LoRA) in the MODEL/CLIP chain, or rely on
the checkpoint. STYLE_LOCK text is already in every POSITIVE.

**Sample / save**
- `KSampler` **title = SAMPLER**  cfg **6.5**, steps **30**, dpmpp_2m / karras
- `VAEDecode` → `SaveImage` **title = SAVE**

Note: SDXL runs a real cfg, so NEG bites. Resolution 1344×768 for 16:9.

---

## graphs/flux_piece.api.json  (Piece tier — high fidelity, re-drives the record)

The Piece graph re-renders the *same* control source from the board (pose skeleton +
depth map are base-agnostic PNGs) using FLUX's own ControlNets, and re-derives identity
on the FLUX side with PuLID-Flux. It does **not** consume the SDXL pixels.

**Load**
- `UNETLoader` (flux1-dev, or an fp8 / 4-bit quant for ≤24 GB) +
  `DualCLIPLoader` (t5xxl + clip_l) + `VAELoader` (ae). Optional `LoraLoader` = FLUX style
  LoRA (the twin of your SDXL style).

**Conditioning (text)**
- `CLIPTextEncode` **title = POSITIVE**
- `CLIPTextEncode` **title = NEG** (FLUX runs ~cfg 1, so NEG is nearly inert — keep the
  node so the contract holds, but don't rely on it)
- `FluxGuidance` **3.5**

**Angle axis — FLUX ControlNet**
- `LoadImage` **title = DEPTH** → FLUX Depth ControlNet (official Flux Tools Depth, or
  ControlNet Union Pro by InstantX with `SetUnionControlNetType = depth`) →
  `ControlNetApplyAdvanced` strength **0.55**, end 0.7
- `LoadImage` **title = POSE** → Union Pro `SetUnionControlNetType = openpose` →
  apply strength **0.7** (Union Pro is compute-heavy; keep resolution modest)

**Character axis — PuLID-Flux (identity survives the base swap)**
- `LoadImage` **title = IDREF** → PuLID-Flux pipeline (InsightFace + EVA-CLIP face encode)
  → identity injection into MODEL. Tune the identity-vs-prompt factor toward identity for
  faithful character, looser for more prompt freedom. Use a medium-portrait reference, not
  an extreme close-up.

**Sample / save**
- Sampling chain (`RandomNoise` / `KSamplerSelect` / `BasicScheduler` /
  `SamplerCustomAdvanced`, or a plain `KSampler`): title the node that carries the seed
  **SAMPLER**. The runner patches `noise_seed` or `seed`, whichever exists.
  steps **25**, euler / simple.
- `VAEDecode` → `SaveImage` **title = SAVE**

**Optional img2img variant** (instead of full re-drive): VAEDecode the approved SDXL board
to pixels, `VAEEncode` with the **FLUX** VAE (latent spaces differ — pixel handoff, never
latent), feed as init at denoise **0.45–0.65**, ControlNet + PuLID still on. Higher denoise
= FLUX reinterprets more; keep the locks on or blocking drifts.

---

## Why titles, not IDs

Every `Save (API Format)` can renumber nodes. Titles you set by hand are stored in
`_meta.title` and survive re-export, so the runner stays valid even as you iterate on the
graph. Keep the seven titles above stable and everything else is yours to change.
