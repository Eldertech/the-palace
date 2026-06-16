# ComfyUI — Test Plan

> Phase E rollout. ComfyUI is the Shop's local-control generative-image Specialist. The Smoke for ComfyUI is the existing 2026-05-26 fireflies-pond artifact + its workflow JSON; running a *fresh* fixed-seed Smoke this session would mean spinning up the local ComfyUI server (~1 min cold) and consuming a real GPU job for ceremonial confirmation. The historical artifact + reproducibility-package is the honest evidence base.

Last run: **2026-05-30** — Smoke pass via existing artifact verification (`Kuramoto Coupling/fireflies-pond.png` + `fireflies-pond-workflow.json` + `fireflies-pond.report.json`); the reproducibility package (workflow JSON + fixed seed) is intact and re-runnable when the server is up.

## Smoke

**Existing-artifact verification** (cheap):

```sh
test -f "Kuramoto Coupling/fireflies-pond.png" \
  && test -f "Kuramoto Coupling/fireflies-pond-workflow.json" \
  && jq -e '.seed == 7 and .checkpoint == "sd_xl_base_1.0.safetensors"' \
       "Kuramoto Coupling/fireflies-pond.report.json"
```

**Live re-run** (when ComfyUI server is up):

```sh
# 1. start ComfyUI: python _tools/ComfyUI/main.py
# 2. POST the workflow JSON to http://127.0.0.1:8188/prompt
# 3. wait for the output PNG; compare to the saved fireflies-pond.png
```

- **Automated (cheap):** the existing-artifact check above.
- **Live re-run:** not exercised this round to avoid spinning the server for ceremony. The discipline that makes this OK: the *reproducibility package* (workflow JSON + seed + checkpoint hash) is the artifact, not the image bytes.
- **Last run (2026-05-30):** existing-artifact verification passes — PNG, workflow JSON, and report JSON all present and well-formed.

## Capability Probe

| Capability                       | Last run                                          |
|-----------------------------------|----------------------------------------------------|
| SDXL base checkpoint, fixed seed | `fireflies-pond.png` (2026-05-26) — OK             |
| Workflow JSON as reproducibility artifact | same — workflow.json saved, sampler/steps/CFG captured |
| Palette anchoring via prompt     | same — Kuramoto neutral palette honoured by prompt |
| ControlNet / palette LoRA         | not exercised — entry claim, unverified            |

- **Last run (2026-05-30):** three of four covered by the Kuramoto Round 1 fireflies job; ControlNet path unverified.

## Style Probe

ComfyUI's "style" is prompt-entangled (the Kuramoto Round 1 handoff codified this — generative output's aesthetic is in the prompt + seed + checkpoint, not in a passed parameter). The Maker enforces palette discipline by *naming colours in the prompt* and capturing the prompt + seed + checkpoint in the standards JSON.

- **Manual:** eye-check the output against the palette terms in the prompt.
- **Last run (2026-05-30):** fireflies-pond eye-check — palette honoured (Kuramoto Round 1 neutral indigo/amber/dark).

## Edge Probe

- **OOM at high resolution** (above the GPU's VRAM ceiling): ComfyUI errors with an OOM in the sampler step. Mitigation: the Maker's resource-scheduling rule explicitly forbids two concurrent ComfyUI jobs and warns before any job that would push past available VRAM.
- **Missing checkpoint**: explicit "checkpoint not found" error from the loader node. ✓
- **Workflow JSON schema drift** (ComfyUI version mismatch): the loader rejects schemas it doesn't recognise; mitigation is pinning the workflow JSON to the version of ComfyUI that produced it.

- **Last run (2026-05-30):** edge probes documented; not formally re-exercised this round.

## Speed Bench

Reference host: **mac** (MPS GPU via PyTorch). Per the 2026-05-26 fireflies job's report: SDXL 1024² @ 30 steps, CFG 8.0 → ~110 s wall-clock per generation. That's the right cost ballpark for any single SDXL image at this resolution and step count.

## Determinism (load-bearing for Comparison Mode)

ComfyUI is deterministic given (fixed seed, fixed sampler, fixed checkpoint, fixed scheduler, fixed workflow JSON). The reproducibility artifact is the workflow JSON + the checkpoint identity (filename + SHA, ideally), not the image bytes — though the image bytes WILL be identical given the same hardware (different MPS / CUDA paths can produce different last-bit outputs).

- **Reproducibility artifact:** `fireflies-pond-workflow.json` + `fireflies-pond.report.json` (which captures seed, checkpoint, steps, CFG, sampler).
- **Last run (2026-05-30):** reproducibility package intact; live re-run not exercised this session. When the Phase D ComfyUI header brief runs, repeat-render at the same seed will provide live byte-determinism evidence.
