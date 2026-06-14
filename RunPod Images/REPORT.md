# RunPod Image Run — Report

**38 images · 0 failures · ~526s total GPU compute · ~$0.32 all-in**

## Technology
- **Endpoint:** self-provisioned RunPod *serverless* endpoint `g5lgw0mk4mnds7` (`palace-comfyui`), scale-to-zero.
- **Worker image:** `runpod/worker-comfyui:5.8.4-sdxl` (ComfyUI + SDXL base 1.0 baked in).
- **Model / sampling:** Stable Diffusion XL base 1.0, `dpmpp_2m` / `karras`, 32–36 steps, CFG 7.0–7.5.
- **GPU pool:** 24–48 GB cards; jobs served mainly by **RTX A4500 (20 GB)**, EU-RO-1. Up to 5 parallel workers.
- **Driver:** `runpod_specialist.py` over HTTPS (submit → poll → decode base64 → save).

## Time
- Total GPU execution: **526s** (~8.8 min), avg **13.8s/image**.
- Latency was dominated by one-time **cold starts** (≈19 GB image pull): median delay ~44s, longest several minutes.
- Warm throughput: ~13s/image; 15-image batches cleared in ~1 min wall-clock on 5 workers.

## Cost
- Whole session (incl. provisioning churn): **~$0.32**.
- 38 delivered images: **~$0.27** → **~$0.007/image**.
- Idle endpoint = $0 (scale-to-zero); egress free.

## Snag & fix
- FLUX-schnell worker image = full-precision weights (~24 GB) → OOM on 24 GB cards → worker took no jobs.
- Fix: switch to lighter **SDXL** image; match worker VRAM footprint to GPU pool; don't recycle workers mid image-pull.

## Contents
- `Palace Icon.png` — the hero icon
- `irish_castle.png`, `norse_goddess.png`, `space_whale_blackhole.png` — cinematic studies
- `posters/` — 4 Jovian-moon travel posters
- `variations/` — 15 palace-icon variations
- `landscapes/` — 15 American landscapes in 15 art styles
- `index.html` — the gallery website (open in a browser)

_Loudon Live · Autodidact Polymaths_
