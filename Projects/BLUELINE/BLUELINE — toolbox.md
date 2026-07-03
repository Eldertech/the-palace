---
title: "BLUELINE — toolbox"
born: 2026-07-02
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: toolbox-of
forward_vector: "I hold every runtime BLUELINE needs and every version pinned — Blender, local and pod ComfyUI, Python, the CLIs — so a fresh agent can reproduce the pipeline without re-derivation, and so the frozen pose/motion batches can graduate from a pod to a serverless image straight from me."
---

# BLUELINE — Toolbox

The reproducible environment for BLUELINE. It spans four runtimes: **Blender** (local staging), **ComfyUI** (local authoring + pod/serverless render), **Python** (orchestration + Blender scripting), and a handful of **CLIs** (curl/git/wget/ffmpeg). The pattern is *pod = R&D, serverless = production*: Blender and local ComfyUI are the workbench; the frozen pose/motion batches are the graduation candidates. First bundle-file of type `toolbox` (SCHEMA §8).

## Runtimes / Hosts

| Runtime | Version (pinned) | Where it runs | Role |
|---|---|---|---|
| Blender | **5.1.2** (5.0+ min, for EEVEE Next / GP Line Art) | this Mac, headless (`-b --factory-startup -P`) | staging: figure rigs, stills, motion frames, pose/depth/keypoint plates |
| ComfyUI (local) | `_tools/ComfyUI` venv, port **:8189** | this Mac (MPS) | authoring & iteration render (SDXL), Blender→ink stylize seam |
| ComfyUI (pod) | image below | RunPod pod (serverless = backlog) | batch GPU render (SDXL / FLUX / InstantID) |
| `runpod/worker-comfyui` | **5.8.4-flux1-dev-fp8** | RunPod pod | base worker image (all 5 orchestrators); FLUX baked in |
| Python (orchestration) | 3.x (system/venv) | this Mac | pod lifecycle scripts |
| Python (Blender) | **3.11** (Blender-bundled) | this Mac | `bpy` staging scripts |

## Extensions / Add-ons / Nodes / Packages

| Runtime | Component | Version / commit | Source | Needed by |
|---|---|---|---|---|
| Blender | **MPFB2** (Make Parametric Figures) | **v2.0.17** (`bl_ext.user_default.mpfb`) | extension manager | figure *generation* only — native Rigify deform rig (fixed the "leg-skirt" bug) |
| Blender | **Rigify** | built-in (enable) | Blender core | IK/FK control rig (foot_ik, hand_ik, torso, chest, head, hips) |
| ComfyUI | **ComfyUI_InstantID** (ApplyInstantID, InstantIDModelLoader, InstantIDFaceAnalysis) | `git clone --depth 1` @boot | github.com/cubiq/ComfyUI_InstantID | style-lock identity / gaze |
| ComfyUI | **NoiseFromNPY** (custom, BLUELINE-authored) | `comfy_inject_node.py`, base64-injected @boot | in-repo | M3 warped-noise flow |
| ComfyUI | SetUnionControlNetType | ships with FLUX Union CN usage | Shakker-Labs | M3 / FLUX union pose |
| ComfyUI | `comfyui_controlnet_aux`, `ComfyUI_IPAdapter_plus`, `ComfyUI-PuLID-Flux`, `ComfyUI_essentials`/`was-node-suite` | Manager (planned) | render-backend | Study/Piece tiers — **not yet in proofs** |
| Python | Pillow | unpinned | pip | layer compositing (`layer_render.py`), Blender post |
| Python | numpy | unpinned | pip | blob/seam post-analysis |
| Python | certifi | unpinned (optional) | pip | SSL context (falls back to unverified if absent) |
| Python (pod) | insightface, onnxruntime (CPU) | unpinned, `pip install` @boot | pip | InstantID face embed + gaze verify |

## Assets / Models / Data

| Asset | Kind | Source | Size | Install path | Portable? |
|---|---|---|---|---|---|
| SDXL Base 1.0 | checkpoint | `huggingface.co/stabilityai/stable-diffusion-xl-base-1.0` | ~6.6GB | `models/checkpoints/` | download@boot (bake for serverless) |
| xinsir OpenPose SDXL CN | controlnet | `xinsir/controlnet-openpose-sdxl-1.0` | ~1.4GB | `models/controlnet/` | download@boot |
| xinsir Depth SDXL CN | controlnet | `xinsir/controlnet-depth-sdxl-1.0` | ~1.4GB | `models/controlnet/` | download@boot |
| xinsir Canny SDXL CN | controlnet | `xinsir/controlnet-canny-sdxl-1.0` | ~1.4GB | `models/controlnet/` | download@boot (opt: `POD_CANNY`) |
| FLUX.1-dev (fp8) | checkpoint | **baked in base image** | ~16GB | — | baked |
| FLUX ControlNet Union Pro | controlnet | `Shakker-Labs/FLUX.1-dev-ControlNet-Union-Pro` | ~1.3GB | `models/controlnet/` | **net volume** `aqm8oev4b0` (EU-RO-1, `/workspace`) or download |
| InstantID ControlNet | controlnet | `InstantX/InstantID` | ~1.4GB | `models/controlnet/` | download@boot |
| InstantID IP-Adapter | ip-adapter | `InstantX/InstantID/ip-adapter.bin` | ~1GB | `models/instantid/` | download@boot |
| Antelopev2 face detector | insightface | `MonsterMMORPG/tools/antelopev2.zip` | ~100MB | `models/insightface/models/antelopev2/` | **BLOCKING** download@boot (unzip) |

## System / language deps

- **CLIs:** `curl` (pod image upload — browser-UA multipart beats the RunPod proxy WAF), `git` (clone InstantID @boot), `wget` (model downloads @boot, atomic `.part` + >size guard), `aria2c` (recommended for >10GB pulls — not yet wired), `ffmpeg` (**manual** motion assembly; use `crf≤8 -tune animation` or ProRes for B&W line-art or it macroblocks).
- **In the base image already:** ComfyUI, FLUX-fp8, CUDA, python, git, wget, curl, unzip. **Not** in it: insightface, onnxruntime (InstantID path installs them).

## Pipelines / capabilities (what this toolbox can run)

| Pipeline | Runtime(s) | Status | Entry point | Notes |
|---|---|---|---|---|
| Figure rig build | Blender + MPFB2 + Rigify (local) | frozen → **local-only** | `figure_rig_pose_studio.py`, `pose_rig_mpfb_v3.py` | MPFB2 needed only to *build*; vanilla Blender poses/renders the saved `.blend` |
| Stills / motion staging | Blender EEVEE-Next + Freestyle (local) | frozen → **local-only** | `01_stills.py`, `03_motion.py` | CPU/Metal ~2–3s/frame; toon 2-band + Freestyle ink; per-frame Perlin boil |
| Pose/depth/keypoint plates | Blender (local) | frozen → **local-only** | `render_plates_all.py` | ink_plate + depth_plate + 18-joint keypoints.json (from Rigify ORG-bones) → ControlNet inputs |
| 6-shot opening render | local ComfyUI / pod, SDXL + OpenPose[+Depth] | frozen (2 shots `pose:needs`) | `render_shot.py` | author local :8189, scale on pod |
| Layer composite + integrate | local ComfyUI, SDXL | **iterating** | `layer_render.py` | S06 reframed to POV kiss to dodge two-figure blend |
| Blender→ink stylize seam | local ComfyUI img2img (denoise ~0.95, Canny ~0.42) | **iterating** | `02_stylize.py` | pod-push variant `02b` future |
| SDXL pose library (100+) | pod, SDXL txt2img | frozen → **serverless-ready** | `sdxl_pose_render.py` (`sdxl_orchestrator`) | embarrassingly parallel — top graduation candidate |
| FLUX pose library (100+) | pod, FLUX txt2img | frozen → **serverless-ready** | `flux_pose_render.py` (`m3`/`flux_orchestrator`) | higher aesthetic ceiling; parallel |
| M3 warped-noise (3-frame) | pod, FLUX + Union CN + NoiseFromNPY | frozen (M3.6/M3.7 iterate) | `m3_pod_render.py` | only pipeline using the custom node |
| InstantID gaze rig (6 slots) | pod, SDXL + InstantID + IP-Adapter | frozen | `instantid_gaze_render.py` | insightface measurement verifies each gaze post-render |
| Study tier (serverless) | serverless, SDXL + CN + IPAdapter | **iterating (backlog)** | `serverless_runner.py` | the serverless graduation target |

## Footprint & limits

- **VRAM:** SDXL fits any pool card; FLUX-fp8 fits 24GB. Pod pool: 4090 / 3090 / A5000 / L40 / L40S / A6000 / A40.
- **Image / cold start:** base image 19–35GB; raise `boot_timeout` to ~1800s for FLUX cold pulls; amortize by many jobs per pod.
- **Blender:** CPU/Metal, no GPU rent, ~2–3s/frame — always cheaper local.
- **Payload:** pod upload via `curl` multipart (WAF); many output frames → save on pod/volume, don't inline.
- **Statefulness:** pod render scripts are per-call HTTP to ComfyUI :8188; the multi-stage Blender→stylize seam is a **client-orchestrated chain** (Mac passes intermediates), not one graph.

## Reproduce / build

- **Blender:** install 5.1.2; enable MPFB2 v2.0.17 + Rigify. (Only needed to *build* rigs; rendering saved `.blend`s needs neither.)
- **Local ComfyUI:** `_tools/ComfyUI` venv at :8189 with SDXL Base 1.0 + xinsir OpenPose/Depth CNs + Pillow.
- **Python (Mac):** `python3` + `certifi` + `Pillow` (+ `numpy` for post-analysis).
- **Pod:** the orchestrators build the env at boot — download models, `git clone` InstantID, `pip install insightface onnxruntime`. No manual step.
- **CLIs:** `brew install ffmpeg aria2` (curl/git/wget already present).
- **Serverless (the planned Piece-tier path — not a current blocker):** current pods already work for every pipeline; serverless is the *graduation* step for the spiky Piece batch (per [[BLUELINE — Render Backend]]'s Study→pod / Piece→serverless routing). When you take it: bake a worker image from the Models + Nodes tables above → push → create endpoint → submit the frozen pose/M3 workflows through the Commons endpoint coordinator. Tracked as a horizon item in [[BLUELINE — Production Plan]] §The horizon.

## Change log

| Date | Change | Rebuild / re-pin required? |
|---|---|---|
| 2026-07-02 | Initial toolbox — captured the four runtimes as-built (Blender 5.1.2 / local+pod ComfyUI / Python / CLIs). First `toolbox` bundle-file in the palace. | — |
