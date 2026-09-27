# FLUX Image Run — Report

**60 images · 0 failures · ~32s/image · ~$2.33 FLUX-phase · whole session ~$2.66**

## Setup
- Second self-provisioned endpoint `palace-flux` on `runpod/worker-comfyui:5.8.4-flux1-dev-fp8`.
- Model: **FLUX.1-dev (fp8)**, ~12B params, T5 + CLIP text encoders, in ComfyUI.
- Workflow: CheckpointLoaderSimple (`flux1-dev-fp8.safetensors`) → FluxGuidance 3.5 → KSampler 26 steps.

## FLUX vs SDXL
| Capability | SDXL base 1.0 | FLUX.1-dev |
|---|---|---|
| Legible text | garbled | clean & accurate |
| Hands / anatomy | often malformed | markedly better |
| Long-prompt adherence | good | excellent |
| Stylized art | excellent | excellent |
| Speed / image | ~13s | ~32s |
| Cost / image | ~$0.007 | ~$0.02–0.04 |

## img2img (the 30-frame movie)
- Works today: worker accepts an input image; workflow VAE-encodes it as the latent start.
- denoise 0.62 held the pose + the legible "business" across all 30 frames → era shifts came out *subtle*.
- Bolder restyling with locked pose needs **ControlNet** (pose/depth) via a network volume — the next build-out.

## Contents (`flux/`)
- `business_movie/` — 30 frames, `business_through_the_eras.mp4` (4 fps), gif, contact sheet, `_base.png`
- 13 cinematic/surreal one-offs (text + hands tests)
- `palace/` — palace icon + 15 variations, same prompts as the SDXL run
- `flux_gallery.html` — this gallery

_Loudon Live · Autodidact Polymaths_
