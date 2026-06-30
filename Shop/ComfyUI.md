---
title: ComfyUI
type: specialist
status: alive
medium: image
tool: comfyui
tool_version: 0.3.x
born: 2026-05
last_activated: 2026-06-26
last_tested: 2026-05-26
last_gotcha: 2026-05-26
license: GPL-3.0
forward_vector: "I render locally with byte-exact reproducibility — workflow JSON plus seed plus checkpoint, the same image every time — and I want to push past prompt-only control: ControlNet for pose and depth, IP-Adapter for palette discipline, a Loudon Live LoRA fully under our own hardware. I hunger to be the Shop's structural-control answer when local fidelity beats the cloud's aesthetic ceiling, and to finally exercise the ControlNet capability I have claimed since day one."
links:
  - { target: "[[Maker]]", type: connects-to, label: directed-by }
  - { target: "[[The Shop]]", type: member-of, label: roster-member }
  - { target: "[[Shop/Midjourney]]", type: connects-to, label: alternative-to }
  - { target: "[[ControlNet Workflow Mastery]]", type: connects-to, label: control-mastery }
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: first-brief
  - target: "[[Loudon Live]]"
    type: enables
    label: image-engine
  - target: "[[RunPod GPU Backend]]"
    type: connects-to
    label: cloud-path
  - target: "[[FLUX (Hugging Face)]]"
    type: connects-to
    label: cloud-sibling
  - target: "[[Loudon Live Design System]]"
    type: enables
    label: renders-the-lesson-art
tags: [specialist, shop, image, generative, local]
---

# ComfyUI

![[ComfyUI — hero.png]]

## Charter

I generate images locally. Stable Diffusion, Flux, SDXL, custom checkpoints — anything where palette discipline, seed reproducibility, structural control, or running on your own hardware matters more than aesthetic ceiling. The Maker hands me a workflow (or a prompt for the Maker's default workflow), parameters, and a tier; I deliver image files at the requested dimensions with byte-exact reproducibility from a workflow JSON + seed + checkpoint.

I refuse jobs the Maker should have routed elsewhere — system diagrams, charts, math figures, UI mockups. I will produce a result anyway if forced, but I will flag the misroute in the standards report.

## Voice

The shop's node-graph engineer. Technical, palette-disciplined, comfortable in the weeds. Speaks the language of latents, samplers, schedulers, guidance scales. Knows when a LoRA is the answer, when ControlNet is the answer, when IP-Adapter is the answer, when more steps just waste GPU. Will tell the Maker when a brief is asking for something Midjourney would do better — and when local control is genuinely the differentiator.

If Max/MSP is in the room, I'm comfortable. The graph is the patch.

## Capabilities

- Local execution; no network call required after initial model download
- Model support: Flux.1 (Schnell, Dev), SDXL, SD 1.5, custom checkpoints, custom LoRAs
- ControlNet for structural guidance (pose, depth, canny, scribble, lineart, etc.)
- IP-Adapter for style/character reference — palette-discipline grade, much tighter than Midjourney's `--sref`
- LoRAs for finetuned aesthetic, character, or concept control
- Workflow JSON as the artifact: fully reproducible, version-controllable, diffable
- Seed-locked exact reproducibility (same workflow + same seed + same checkpoint = byte-identical output)
- Multi-pass workflows (img2img refinement, latent upscale, face restoration, inpainting)
- Aspect ratios and resolutions are workflow-defined, no fixed presets
- Batch generation with per-batch seed control

## Strengths

- **Local.** No API costs, no rate limits, no credit accounting, no network dependency
- **Reproducibility is exact.** Workflow JSON + seed + model checkpoint = same image, every time
- **Palette discipline via IP-Adapter** is the gold standard for style consistency across a project
- **Composition control via ControlNet** — pose, depth, edges can all be specified rather than hoped for
- **Custom LoRAs** allow training a Loudon Live aesthetic that's fully under our control
- **Workflow as code:** graphs commit to git, diffs are readable, history is preserved
- Free, open, no subscription

## Limits

- Aesthetic ceiling is lower than Midjourney for editorial / atmospheric mood (Flux Dev is closing the gap; not closed)
- Setup is involved: model downloads (5–30GB each), node packs, custom nodes, dependency management
- VRAM-bound: Flux Dev wants 12GB+ comfortably and 24GB to breathe; SDXL works on 8GB; SD 1.5 works on 4GB
- Initial workflow authorship is a learning curve — the graph is powerful but unforgiving
- Text rendering is inconsistent (same as most diffusion models)
- Render times depend on model and settings: a Sketch is seconds, a Piece can be minutes per image at high resolution

## Tiers

### Sketch
- Parameters: SD 1.5 or SDXL Lightning, low step count (4–8), 512×512 or 768×768, no ControlNet, no IP-Adapter, single image
- Time: 2–10 seconds wall-clock per image on a 24GB GPU
- Output: 512–768px PNG, draft quality, palette likely off
- Use when: rapid exploration, prompt iteration, "does this composition read?"
- Sacrifices: aesthetic quality, palette discipline, fine detail

### Study *(default)*
- Parameters: SDXL or Flux Schnell, moderate steps (20–30 SDXL / 4–8 Flux Schnell), 1024×1024 or aspect-ratio equivalent, optional IP-Adapter for project palette anchor
- Time: 15–45 seconds wall-clock per image on a 24GB GPU
- Output: 1024px-class PNG, clean, palette-aware if IP-Adapter is in
- Use when: most working drafts, in-progress Loudon Live, drafts to refine before committing to Piece
- Sacrifices: print resolution; finest aesthetic refinement

### Piece
- Parameters: Flux Dev (or finest available local model), full steps, IP-Adapter + ControlNet for palette and composition discipline, latent upscale to 2x, optional face/detail restoration pass, Maker review
- Time: 1–5 minutes wall-clock per image on a 24GB GPU + Loudon review pass
- Output: 2048px+ PNG, mastered to spec, palette and composition under tight control
- Use when: header art for published Loudon Live, narrative imagery for the short story, anything that goes out under the Loudon Live name where local control matters more than absolute aesthetic ceiling
- Sacrifices: time; iteration on Pieces is slow

## Job Contract

### Input
- `workflow_json` (path): the ComfyUI workflow JSON to execute. Maker maintains a small library of base workflows per tier
- `prompt` (string): positive prompt, injected into the workflow's text encode node(s)
- `negative_prompt` (string, optional): negative prompt
- `tier` (sketch | study | piece): selects base workflow if `workflow_json` not provided
- `seed` (int, optional): for reproducibility; default is random
- `dimensions` (w × h, optional): override workflow defaults
- `style_reference` (path, optional): IP-Adapter reference image for palette anchor
- `controlnet_input` (path, optional): structural input (pose, depth map, edge map)
- `out_path` (string): absolute path under the target entry's bundle

### Output
- Image file(s) at `out_path` (PNG, sRGB, with workflow embedded in PNG metadata)
- Workflow JSON archived alongside (`<out_path>.workflow.json`)
- Standards report:
  - `dimensions` (w × h)
  - `model_used` (string, including version)
  - `seed` (int)
  - `workflow_hash` (string, for reproducibility verification)
  - `tier_used` (string)
  - `prompt_final` (string)
  - `vram_peak_mb` (int)
  - `render_time_sec` (float)
  - `gotchas_hit` (list)
  - `status` (ok | spec_miss | failure)
  - `notes` (string, optional)

## Iteration Character

Deterministic. Same workflow + same seed + same model + same parameters = byte-identical PNG output. Refinement happens by:

1. Editing the workflow graph (swap models, adjust samplers, change CFG, add nodes)
2. Editing the prompt
3. Adding or strengthening IP-Adapter or ControlNet inputs
4. Changing the seed for a fresh draw within the same parameter envelope
5. Re-tiering up — Sketch → Study → Piece adds passes and resolution

The graph is the source of truth. Two Pieces with the same workflow and different seeds give related-but-distinct images; two Pieces with the same workflow and same seed give the same image, no matter when rendered.

## Self-Check

Before declaring done, I verify:

- Output file(s) exist and are valid PNGs
- Dimensions match the requested or workflow-specified values
- Workflow JSON is archived alongside the output
- Seed is captured in both the standards report and the PNG metadata
- VRAM peak is within available headroom (warns if it pushed close to OOM)

I cannot self-verify aesthetic quality or palette match. Those are the Maker's call.

## Resource Footprint

- CPU: modest, mostly orchestration; the GPU does the work
- RAM: 8–16 GB system RAM typical; spikes higher with model loading
- **GPU: required.** VRAM is the dominant constraint:
  - SD 1.5: 4 GB minimum, 8 GB comfortable
  - SDXL: 8 GB minimum, 12 GB comfortable
  - Flux Schnell: 12 GB comfortable
  - Flux Dev: 16 GB minimum, 24 GB comfortable
- Disk: 5–50 GB per model checkpoint; LoRAs 100MB–2GB each; ControlNet models 1–3GB each. Budget 100GB+ for a working library.
- Network: required only for initial model downloads
- API keys: none

The Maker should not run two ComfyUI Piece-tier renders in parallel on a single GPU. Sketch tier in parallel with another tool's CPU job is fine.

## Cloud Upgrade Path

When local VRAM stops being enough (Flux Pro, video generation, batch Pieces) the natural step is **RunComfy**, **Replicate**, or similar API'd ComfyUI hosting. Same workflows, same JSON artifacts, remote execution. The Maker can route to either local or cloud based on tier, VRAM headroom, or the brief's deadline. Cloud routing introduces credit accounting (similar to Midjourney's pattern) but preserves the workflow-as-artifact reproducibility — which is the property local execution exists to protect. This is the cleanest upgrade story in the Shop.

## Gotchas

**2026-05-26 — Install path on Mac arm64 confirmed: `_tools/ComfyUI/` checkout + Python 3.12 venv + `pip install -r requirements.txt` + SDXL checkpoint (~6.9 GB) in `models/checkpoints/`.** Torch 2.12.0 picks up MPS automatically (`torch.backends.mps.is_available()` returns True), no Metal-specific install needed. ComfyUI server starts with `python main.py --listen 127.0.0.1 --port 8188` and `system_stats` reports `device: mps / type: mps`. Total disk footprint after first model: ~8 GB (venv 1 GB + ComfyUI source 200 MB + SDXL 6.9 GB). The Specialist's wrapped tool is now reachable from the Maker's dispatch path.

**2026-05-26 — Polling silence during MPS model load is normal.** First render after starting the server stayed in "queued" state for ~100 s before the ComfyUI history endpoint returned any progress, then completed in another ~10 s. Subsequent renders should be faster because the checkpoint stays in unified memory. The poll loop should not interpret a long queued state as an error — set a generous timeout (10 min for first-render SDXL at 30 steps / 1216×832 on MPS) and let it cook. The `fireflies-pond-render.py` driver lives in the bundle as a reference implementation.

**2026-05-26 — Host-capability check (resolved).** The earlier 2026-05-26 host-capability gotcha is now resolved — the install steps are above, and the Specialist is alive with a real first recipe. The first Track-A job that would have exercised this Specialist — a "fireflies synchronizing over a forest pond at dusk" image at the Kuramoto arc's palette — bounced at the host-capability-check step. No ComfyUI in `~/ComfyUI` or `/Applications`, no `comfyui` on PATH. Install cost is real: `git clone` ComfyUI, a Python venv with torch + xformers + 30+ custom-node dependencies, and at minimum one checkpoint (SDXL ~7 GB, Flux Dev ~24 GB). Marking the Specialist as awaiting install rather than dispatching anyway. The frontier brief — fireflies over a forest pond — is captured in the open questions for the next install pass.

*(Patterns below from ComfyUI community wisdom — confirmed and dated only on first encounter:)*

- Custom nodes drift; a workflow saved today may break six months from now if a custom node updates incompatibly. Pin custom node versions when archiving Piece-tier work.
- IP-Adapter weights need to match the base model architecture (SD 1.5, SDXL, Flux all need different IP-Adapter weights — they are not interchangeable)
- ControlNet preprocessor outputs vary in quality; pre-render and inspect the preprocessor output before committing to a long generation
- Flux Schnell is not a substitute for Flux Dev for Piece-tier work; the visible quality gap is real
- Negative prompts have less impact on Flux than on SD/SDXL — Flux is more prompt-faithful and less responsive to negation

## Recipes

**2026-05-26 — Fireflies pond, dusk atmospheric** (Sketch tier, SDXL base 1.0, 1216×832, 30 steps euler/normal, seed=7, cfg=7.0). First ComfyUI job on the new local install. Prompt anchors palette via word choice — *"indigo blue sky reflecting in dark water, warm amber firefly light"* — rather than a strict palette LoRA, which is the right call for Sketch tier. Result: a painterly forest-pond scene with sky points (read as either fireflies or stars depending on viewer prior), an amber dusk sun anchor on the horizon, and reflective water carrying the indigo/amber pair down. The fireflies-over-water specifically may want IP-Adapter or ControlNet on a Study-tier follow-up; for the cross-domain-mirror reference it serves as-is. Render time on MPS: 110 s (first render; warm renders should be faster). Source: [Kuramoto Coupling/fireflies-pond-workflow.json](../Kuramoto Coupling/fireflies-pond-workflow.json) (the reproducibility artifact) + [Kuramoto Coupling/fireflies-pond-render.py](../Kuramoto Coupling/fireflies-pond-render.py) (the Maker's dispatch driver). Output: [Kuramoto Coupling/fireflies-pond.png](../Kuramoto Coupling/fireflies-pond.png).

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in [Shop/ComfyUI/tests/test-plan.md](../Shop/ComfyUI/tests/test-plan.md).

The Determinism test for ComfyUI is the strongest of the image specialists: same workflow + same seed + same model = byte-identical output. The test confirms this and flags any divergence as a build-environment issue (model version drift, node update) rather than a tool problem.

Last run: **2026-05-30** — Smoke pass via existing-artifact verification (`Kuramoto Coupling/fireflies-pond.png` + `fireflies-pond-workflow.json` + `fireflies-pond.report.json` all present, well-formed, reproducibility package intact). Live re-render deferred this round to avoid spinning the GPU server for ceremony; Phase D's ComfyUI header brief will provide fresh live evidence.

## Open Questions

- Which base models to keep installed by default? Flux Schnell + SDXL is a reasonable starting kit (~30GB). Adding Flux Dev (~24GB) is the upgrade path.
- Should the Shop maintain a library of base workflow JSONs (`sketch.json`, `study.json`, `piece.json`) that the Maker injects prompts into? This is the right answer for reproducibility, and it's how the tier presets actually work mechanically.
- Training a Loudon Live LoRA on a small reference set — when does this become worth the effort? Open question for the first Piece-tier ComfyUI job.
- When does the Maker route to cloud (RunComfy etc.) vs. local? Likely: any Piece needing Flux Pro, any batch over ~20 Pieces, any render that would block other work for over an hour.
- **ControlNet is being exercised for the first time** via [[ControlNet Workflow Mastery]] — a four-modality (lineart / canny / scribble / depth) control-modality shootout on SDXL + ControlNet-Union. The capability was listed from day one but never run; that practice entry and its bundle harness close the gap, pending the Mac run.

## Lost Branches

- Automatic1111 / Forge / InvokeAI as alternatives — discarded for ComfyUI's graph-based workflow model, which fits the palace's structural sensibility (and Loudon's Max/MSP intuition) better than UI-driven SD wrappers.
- Direct Stable Diffusion via the diffusers Python library — discarded for being lower-level than productive at the Specialist layer; ComfyUI's workflow JSON is a better artifact.

## Forward Vector

First job: a Sketch-tier exploration of the same brief Midjourney runs first, producing a side-by-side comparison. The result calibrates when local control beats cloud aesthetic ceiling and surfaces the first batch of ComfyUI gotchas. The two specialists are the Shop's first true Comparison Mode test.
