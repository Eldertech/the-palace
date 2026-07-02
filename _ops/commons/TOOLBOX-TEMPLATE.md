---
title: "{{Project}} — toolbox"
born: {{YYYY-MM-DD}}
links:
  - target: "[[{{Project}}]]"
    type: connects-to
    label: toolbox-of
forward_vector: "I hold every runtime {{Project}} needs and every version pinned, so a fresh agent (or a fresh machine) can reproduce its tooling without re-derivation — and so any stage that stops changing can graduate from a local app or a pod to a serverless image straight from me."
---

# {{Project}} — Toolbox

<!-- The project's REPRODUCIBLE ENVIRONMENT MANIFEST: every runtime it needs and
every version pinned — whether that runtime is a local app (Blender, Ableton), a
language runtime (a Python venv, Node), a rented RunPod pod, or a serverless worker
image. One place that answers "what does it take to run this project's tooling, and
how do I reproduce it?" — local and remote alike. Lives in the project's entry
bundle. Bundle-file type `toolbox` (SCHEMA §8). Keep it machine-actionable — for the
serverless case the Commons provider is meant to read it to build/deploy an image.
See [[The Commons]]. Delete sections that don't apply; a pure-local project has no
"serverless" rows and that's fine. -->

## Runtimes / Hosts

<!-- The environments the work runs IN, each PINNED. A project usually has several
(e.g. Blender for staging + a serverless ComfyUI image for render + a Python venv
for orchestration). "Where it runs": this Mac / RunPod pod / serverless / other. -->

| Runtime | Version (pinned) | Where it runs | Role |
|---|---|---|---|
| {{Blender}} | {{4.2.1}} | this Mac | {{staging: pose/depth extraction}} |
| {{Ableton Live + Max}} | {{12.0.5 / Max 8.6}} | this Mac | {{audio}} |
| {{Python (venv)}} | {{3.12}} | this Mac | {{orchestration scripts}} |
| {{runpod/worker-comfyui}} | {{5.8.4-flux1-dev-fp8}} | pod / serverless | {{render}} |

## Extensions / Add-ons / Nodes / Packages

<!-- What's added to each runtime, PINNED. Blender addons, ComfyUI custom nodes,
Max/RNBO packages, Ableton devices/plugins, pip packages. Name which pipeline needs
each, so you know what a removal would break. -->

| Runtime | Component | Version / commit | Source | Needed by |
|---|---|---|---|---|
| {{Blender}} | {{MPFB2}} | {{version}} | {{repo}} | {{figure staging}} |
| {{ComfyUI}} | {{ComfyUI_InstantID}} | {{commit}} | {{github.com/cubiq/…}} | {{identity pipeline}} |
| {{Python}} | {{requests}} | {{pin}} | pip | {{transport}} |

## Assets / Models / Data

<!-- Heavy data the runtimes LOAD. For remote runtimes: "baked" (in the image) vs
"volume" (on a network volume). For local: an asset library / sample pack path. -->

| Asset | Kind | Source | Size | Install path | Portable? |
|---|---|---|---|---|---|
| {{sd_xl_base_1.0}} | checkpoint | {{https://…}} | {{~6.6GB}} | `models/checkpoints/` | baked |
| {{blueline-models volume}} | net volume | RunPod {{id/region}} | — | `/workspace` | volume |

## System / language deps

<!-- Language runtimes and CLIs the pipelines assume: Python/Node versions, ffmpeg,
curl, git, aria2c, CUDA, brew formulae. Note which are in a base image vs must be
installed. -->

- {{Python 3.12; ffmpeg (crf≤8 -tune animation for B&W line-art); curl; git; …}}

## Pipelines / capabilities (what this toolbox can run)

<!-- THE HEART OF THE FILE. Each pipeline the toolbox runs, its runtime(s), and —
the load-bearing column — its portability status: FROZEN (stable → can graduate to
serverless / is reproducible) vs ITERATING (still changing → local/pod-only for now).
Graduating a stage is a status flip here, backed by its entry point. -->

| Pipeline | Runtime(s) | Status | Entry point / workflow | Notes |
|---|---|---|---|---|
| {{pose-locked frame render}} | ComfyUI (pod→serverless) | frozen → serverless-ready | {{render_shot.py / graph.json}} | {{parallel per-frame}} |
| {{Blender pose staging}} | Blender (local) | frozen → local-only | {{staging script}} | {{inherently local}} |
| {{line-art decomposition}} | ComfyUI (pod) | iterating → pod-only | {{—}} | {{multi-stage; still tuning}} |

## Footprint & limits

- **VRAM / image size (remote):** {{fits 24GB? image GB → cold-start cost}}
- **Disk / RAM (local):** {{Blender/Ableton project weight}}
- **Per-job runtime:** {{ballpark}}
- **Payload strategy (remote):** {{inline base64 for single small outputs; storage/URLs for many frames or video}}
- **Statefulness:** {{single-graph jobs, or a client-orchestrated chain for multi-stage pipelines}}

## Reproduce / build

<!-- Per runtime: how to recreate it. Local app → "install X version + these addons".
venv → the install command / lockfile. Serverless → build the worker image (Models +
Nodes above) → push → create endpoint. Later: a pointer to the Commons serverless
provider + a `commons` command. -->

- **{{Blender}}:** {{install 4.2.1; enable MPFB2 + the palace MCP addon}}
- **{{Python}}:** {{python3.12 -m venv; pip install -r requirements.txt}}
- **{{Serverless image}}:** {{extend base with Models+Nodes → build → push → create endpoint}}

## Change log

<!-- Pins + rebuilds are expensive — track every environment change and whether it
forced a rebuild / re-pin. -->

| Date | Change | Rebuild / re-pin required? |
|---|---|---|
| {{YYYY-MM-DD}} | {{initial toolbox}} | — |
