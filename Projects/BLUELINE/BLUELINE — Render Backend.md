---
title: "BLUELINE — Render Backend"
type: meta
status: adopted
born: 2026-06-14
who_leads: loudon
forward_vector: "I am the render-AI half of BLUELINE, made concrete: a two-tier ComfyUI pipeline (Study=SDXL decisions, Piece=FLUX fidelity) that reads a board record and executes it, riding the Shop-wide RunPod substrate. I am not a new invention — I am the AnimaticPlanProposal merged with the palace's already-proven transport and routing. I record what was adopted, what was changed, and why."
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: render-backend-of
  - target: "[[Shop/RunPod GPU Backend]]"
    type: connects-to
    label: rides-as-substrate
  - target: "[[Shop/ComfyUI]]"
    type: connects-to
    label: executes-on
  - target: "[[Blocked, Not Prompted]]"
    type: exemplifies
    label: render-the-record-not-the-pixels
  - target: "[[BLUELINE — Board Record Schema]]"
    type: connects-to
    label: executes-the-record
tags: [meta, blueline, render, comfyui, runpod, controlnet]
---

# BLUELINE — Render Backend

![[BLUELINE — Render Backend — hero.png]]

> Source material: the **AnimaticPlanProposal** (Loudon, 2026-06-14), now living at `Projects/BLUELINE/render-backend/` (`PLAN.md`, `runner.py`, `graph_spec.md`, `models_manifest.md`, `board_template.txt`). This doc records how it folds into BLUELINE and the **three changes** the palace's existing RunPod work forces.

## The thesis (and why it's already ours)

The proposal's governing idea — **"the board record is the source of truth, not the pixels"** — is [[Blocked, Not Prompted]] restated for the render stage. Two renderers (SDXL for Study-tier decisions, FLUX for Piece-tier fidelity) read the *same* record; you never convert SDXL→FLUX, you **re-render the record**. The locked axes (angle, character, setting, emotion) live on conditioning wires, not in prompt text, which is why they survive both per-shot variation and the base swap. Tier vocabulary aligns with the Shop's existing Sketch/Study/Piece.

This is not theoretical here: a working FLUX + Union-ControlNet OpenPose graph already exists in the palace (`Shop/RunPod GPU Backend/flux-controlnet-openpose.workflow.json` + `pod-comfyui-client.py`), and the [[Shop/RunPod GPU Backend]] FLUX report empirically proved that img2img can't hold pose *and* restyle (denoise 0.62 kept the pose but the restyle came out subtle) — which is exactly *why* you re-render the record instead.

## The three changes the palace forces (do not relearn these)

**1. Merge the runner; don't fork it — and harden its transport.** The proposal's `runner.py` has the better *design* (title-contract patching by `_meta.title`, the BIBLE/board template parser, two-tier profiles). But as written it uses plain `requests` with a default user-agent and `files=` multipart upload — and the palace already learned the **RunPod proxy WAF 403s Python's default UA**, so `pod-comfyui-client.py` sends a browser UA and uploads via `curl`. The deliverable is the proposal's runner *wearing the palace client's transport* (browser UA + curl upload), not two competing clients.

**2. Split the GPU routing: Study→pod, Piece→serverless.** The proposal assumes a persistent pod for both tiers. [[Shop/RunPod GPU Backend]]'s doctrine is **serverless-first** (scale to zero, bill per second; no GPU idle on the meter — the heartbeat optimization mandate), reserving pods for long interactive iteration. Reconciled: the **Study tier is human iteration → a cheap pod is right**; the **Piece batch is programmatic and spiky → serverless wins**. Don't keep a big card on the meter for the batch.

**3. Reuse the existing FLUX workflow JSON.** The proposal says "build the Piece graph in the ComfyUI UI and export." A tested equivalent already exists (`flux-controlnet-openpose.workflow.json`, Union ControlNet, openpose, strength 0.75 / end 0.85). Start from it; add the depth channel and the title contract rather than rebuilding.

## Resolved open questions (the three bodies of work answer each other)

- **Per-channel vs Union ControlNet** — *closed*: per-channel for **SDXL** (BLUELINE Session 1 proved), Union for **FLUX** (RunPod walk-cycle proved). The proposal adopts exactly this split.
- **Pose source** — *closed*: emit the OpenPose skeleton **geometrically** (Blender armature projection, or the procedural COCO-18 draw in `walkcycle-pose-generator.py`); **never run DWPose on a greybox proxy** (returns black). The proposal's "feed a hand-drawn skeleton and bypass the preprocessor" is the required path, not an option.
- **Edge channel** — add a canny channel (SDXL has no strong standalone lineart CN at this date) and an `EDGE` entry to the title contract; emit `lineart.png` as an artifact but feed canny on SDXL.

## What it adds that BLUELINE lacked

- **Measurable consistency** — the proposal's `assess.py` (not yet built): identity drift (InsightFace cosine vs the character sheet — *free*, InsightFace is already loaded for PuLID), composition adherence (depth re-extracted from the render vs the control depth), style coherence (CLIP across a scene). This becomes the palace-wide **measurement ruler** (see the Production Plan, Track II).
- **Identity across the base swap, concretely** — FaceID (Study) → PuLID-Flux (Piece). The mechanism for the M4 "same face in two registers" risk.
- **The node-title contract** — clean integration glue between Blender's output and the runner (see [[BLUELINE — Board Record Schema]]).

## What it still lacks (and where it's solved)

It is a **stills** pipeline with **no clock**. Motion/temporal coherence is the flow-field spine's job (Production Plan Track V; closes RunPod's #1 untested horizon). Beat-locked timing is the Ableton substrate's job (Track III). Both sit *on top of* this render backend.

## Orchestrator inventory (consolidation, 2026-07-03)

BLUELINE grew ~13 pod scripts across proof folders. **The canonical render/orchestration layer is
`render-backend/` — `runner.py` (node-title patching), `pod_runner.py` (multi-agent-safe pod lifecycle),
`serverless_runner.py` (Piece tier)** — riding `_ops/runpod/agent_ns.py` (per-agent slug) and
`_ops/commons/{reaper,lease,endpoint}.py`. **New render work uses this; do not fork a new orchestrator.**

The per-proof orchestrators are **frozen spikes** — kept for reproducibility, not for reuse. An audit of
their multi-agent safety (do they namespace their pod + reap their own slug?):

| Script | Creates pods? | Multi-agent safe? |
|---|---|---|
| `render-backend/pod_runner.py` · `serverless_runner.py` | pod / serverless | ✅ **canonical** — use these |
| `m3-warped-noise/{sdxl_,flux_,m3_}orchestrator.py`, `m3*_pod_render.py` | pod | ✅ slug + reap |
| `new-story/pose_pod_orchestrator.py`, `balloon_pod_orchestrator.py` | pod | ✅ slug + reap |
| `style-lock/instantid_orchestrator.py` | pod | ✅ slug + reap |
| `new-story/{pod_backend,balloon_pod_render}.py` | no (transport/render helper) | n/a — driven by a safe orchestrator |
| `cloud-i2v/svd_orchestrator.py` (+ `svd_render.py`) | pod | ✅ slug + reap (retrofit 2026-07-03 — RunpodPodProvider + `reap --self`) |

Rule (from [[Shop/RunPod GPU Backend]]'s hard-won playbook + [[The Commons]]): any pod-creating script
must name its pod `blueline-…-<slug>` (`agent_ns.py`), recover-by-name on a flaky create, and
`commons reap --self` after every run — success or failure. Serverless-endpoint tools are inherently
multi-agent-safe (shared managed infra, not a single-tenant pod).

## Placement note

RunPod is **Shop-wide substrate**, built first for the Image-to-3D commission — BLUELINE *rides* it, does not own it. Any `host-capability.json` change must move in lockstep with the Maker Roster (per `Shop/RunPod GPU Backend/backend-design.md`).
