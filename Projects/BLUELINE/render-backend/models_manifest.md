# Models & custom nodes manifest

Everything installs to the **network volume** under `/workspace/ComfyUI/...` so it
persists across pod restarts. Paths below are relative to `/workspace/ComfyUI`.

> Gated downloads: **FLUX.1-dev** requires accepting Black Forest Labs' license on Hugging
> Face and an HF token (`huggingface-cli login`). PuLID-Flux weights and InsightFace models
> download on first run of their nodes. Exact repo names drift — verify before pulling.

## Custom nodes (ComfyUI Manager → Install, then restart)

| node pack | used for |
|-----------|----------|
| `comfyui_controlnet_aux` | DWPose, Depth-Anything-v2 preprocessors |
| `ComfyUI_IPAdapter_plus` | FaceID identity (Study tier) |
| `ComfyUI-PuLID-Flux` (or PuLID-Flux II / nunchaku for 4-bit) | identity (Piece tier) |
| `ComfyUI_essentials` / `was-node-suite` | misc utility nodes |

## Study tier (SDXL) — ~15 GB

| file | dest |
|------|------|
| house-style SDXL checkpoint (Juggernaut XL, or your pick) | `models/checkpoints/` |
| SDXL OpenPose ControlNet (e.g. xinsir) | `models/controlnet/` |
| SDXL Depth ControlNet (or xinsir Union SDXL) | `models/controlnet/` |
| IP-Adapter FaceID (SDXL) + LoRA | `models/ipadapter/` |
| InsightFace `antelopev2` (auto on first FaceID run) | `models/insightface/` |

## Piece tier (FLUX) — ~50–60 GB

| file | dest |
|------|------|
| `flux1-dev.safetensors` (or fp8 / GGUF quant for ≤24 GB) | `models/unet/` |
| `t5xxl_fp16.safetensors` + `clip_l.safetensors` | `models/clip/` |
| `ae.safetensors` (FLUX VAE) | `models/vae/` |
| FLUX ControlNet — Flux Tools Depth, and/or ControlNet Union Pro (InstantX) | `models/controlnet/` |
| PuLID-Flux model + EVA-CLIP (auto on first run) | per node default |
| FLUX style LoRA (your house-style twin, once trained) | `models/loras/` |

## Volume sizing

- Study only: **≈40 GB** volume.
- Both tiers on one volume: **≈110 GB** (FLUX weights dominate). Cheaper to keep a
  Study-only volume for iteration and a separate FLUX volume you attach for the Piece batch.

## Example downloads (run on the pod)

```bash
cd /workspace/ComfyUI
huggingface-cli login   # needed for gated FLUX.1-dev

# SDXL checkpoint (example slug — substitute your house style)
wget -O models/checkpoints/juggernautXL.safetensors "<checkpoint url>"

# FLUX core
huggingface-cli download black-forest-labs/FLUX.1-dev flux1-dev.safetensors \
  --local-dir models/unet
huggingface-cli download black-forest-labs/FLUX.1-dev ae.safetensors \
  --local-dir models/vae
huggingface-cli download comfyanonymous/flux_text_encoders \
  t5xxl_fp16.safetensors clip_l.safetensors --local-dir models/clip
```

Once these are on the volume, build the two graphs per `graph_spec.md`, export them to
`graphs/`, and run the test ladder in `PLAN.md`.
