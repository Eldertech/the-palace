---
title: "ComfyUI — local-install"
born: 2026-06-16
links:
  - target: "[[ComfyUI]]"
    type: connects-to
    label: rebuild-manifest-for
forward_vector: "I am the rebuild manifest for the local Mac ComfyUI install — the one thing git cannot hold (16 GB of app + venv + weights live under the gitignored `_tools/`). My end-state: if that install dies, this file reconstructs it exactly. I stay current whenever a model, node, or version changes."
---

# ComfyUI — local install manifest

> The local install lives at **`_tools/ComfyUI/`**, which is **gitignored** (`.gitignore:26` — 16 GB of app source + venv + model weights, correctly not tracked). This manifest is how to rebuild it. It is the **local Mac** install (Apple-Silicon, MPS) used for the Session-1 conditioning keystone and BLUELINE Track IV. The **cloud (RunPod)** render set is a *separate* inventory — see [[BLUELINE — Render Backend]] / `Projects/BLUELINE/render-backend/models_manifest.md` (FLUX, not SDXL).

## Versions (pin these on rebuild)

| Component | Value |
|---|---|
| ComfyUI | **0.22.0** (git `f9f54ca`) |
| Python | 3.12.13 (in `_tools/ComfyUI/venv/`) |
| PyTorch | 2.12.0 · **MPS** backend (Apple Silicon) |
| Custom node | `comfyui_controlnet_aux` @ `e8b689a` — `github.com/Fannovel16/comfyui_controlnet_aux` |

## Models (what's on disk, ~16 GB)

| File (`_tools/ComfyUI/models/…`) | Size | Source |
|---|---|---|
| `checkpoints/sd_xl_base_1.0.safetensors` | 6.94 GB | `huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors` |
| `controlnet/controlnet-canny-sdxl.safetensors` | 2.5 GB | **xinsir** SDXL canny (`huggingface.co/xinsir/controlnet-canny-sdxl-1.0`) |
| `controlnet/controlnet-depth-sdxl.safetensors` | 2.5 GB | **xinsir** SDXL depth (`huggingface.co/xinsir/controlnet-depth-sdxl-1.0`) |
| `controlnet/controlnet-openpose-sdxl.safetensors` | 2.5 GB | **xinsir** SDXL openpose (`huggingface.co/xinsir/controlnet-openpose-sdxl-1.0`) |

The three xinsir CNs are **public / ungated** (~2.3–2.5 GB each); the local filenames are renamed from the repo's `diffusion_pytorch_model.safetensors`. Confirm base-vs-`_promax` against the xinsir repo if re-downloading. No standalone *lineart* CN exists for SDXL at this date — canny stands in (the gap surfaced in [[Shop/Blender]]'s test plan).

## Launch (the flags are not optional on MPS)

```sh
_tools/ComfyUI/venv/bin/python _tools/ComfyUI/main.py --highvram --use-split-cross-attention
```

- `main.py` is at `_tools/ComfyUI/main.py` (the README's nested path is wrong).
- **`--highvram --use-split-cross-attention`** takes 3-ControlNet SDXL from **~50 s/it → ~15 s/it** on this Mac. Without them, a single blocked fill is ~23 min. Full benchmark + the MPS perf story: `Shop/Blender/tests/gotchas-2026-06-13.md`.
- Server speaks HTTP on `:8188`; the palace client drives it via the tracked workflow JSONs (e.g. `Shop/RunPod GPU Backend/flux-controlnet-openpose.workflow.json`, and `Shop/Blender/tests/workflows/`).

## Rebuild from zero

1. `git clone github.com/comfyanonymous/ComfyUI _tools/ComfyUI` → check out `f9f54ca` (v0.22.0).
2. `python3.12 -m venv _tools/ComfyUI/venv` → `venv/bin/pip install -r _tools/ComfyUI/requirements.txt` (torch 2.12 picks MPS automatically on Apple Silicon).
3. `git clone github.com/Fannovel16/comfyui_controlnet_aux _tools/ComfyUI/custom_nodes/comfyui_controlnet_aux` @ `e8b689a` → install its `requirements.txt`.
4. Download the four models above into `models/checkpoints/` and `models/controlnet/`.
5. Launch with the flags above; smoke-test against a tracked workflow JSON.

## Related

- Operational gotchas + benchmarks: `Shop/Blender/tests/gotchas-2026-06-13.md`; the conditioning method: [[Shop/Blender/toyxyz-conditioning-recipe]].
- This Mac's MPS quirks are also in the reference memory (`reference_comfyui_mps_controlnet`).
- Cloud counterpart (RunPod, FLUX): [[Shop/RunPod GPU Backend]] + `Projects/BLUELINE/render-backend/models_manifest.md`.
