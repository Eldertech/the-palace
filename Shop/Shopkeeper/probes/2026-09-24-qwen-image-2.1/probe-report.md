---
title: probe-report — Qwen-Image-2.1
born: 2026-09-24
links:
  - { target: "[[Shopkeeper]]", type: connects-to, label: probe-for }
forward_vector: "I hold what I actually tried against Qwen-Image-2.1's anonymous Space — not what the release notes claim."
---

# Probe: Qwen-Image-2.1 (Alibaba/Qwen)

**What it is:** released 2026-09-20 (4 days old at probe time). Open-source (Apache-class), 7B-param unified text-to-image generation + instruction editing model. Claims: real alpha channel for transparent output, up to 10 reference images in one pass, local edits via circle/mask annotation, identity preservation, native 2K output, day-zero support in ComfyUI/Diffusers/vLLM-Omni/SGLang. Public evals put it first among open-source image models, ahead of Nano Banana 2.0 on cited benchmarks (source: press coverage, not independently checked).

**Why it's interesting to the Shop:** if the claims hold, it's a straight upgrade path for the existing `[[Shop/ComfyUI]]` Specialist — same slot the Maker already routes to for palette-disciplined / ControlNet / offline work — not a new Specialist. Day-zero ComfyUI support means it's a *recipe* addition, not a Roster addition.

## What I tried

Anonymous Gradio call against `Qwen/Qwen-Image-2.1` (HF Space), via `gradio_client`. Found the real generation endpoint (`/generate_with_enhance`) by inspecting `view_api()` — the Space's example-facing UI is a thin wrapper over 10+ `load_example_N` calls plus this one real endpoint.

```python
c = Client('Qwen/Qwen-Image-2.1')
c.predict([], "<prompt>", False, False, None, 42, False, 1024, 1024, '', api_name='/generate_with_enhance')
```

Two consecutive attempts, ~2 minutes apart, both plain text-to-image (no reference images), fixed seed 42, 1024×1024.

## Result

**Both attempts failed identically:** `gradio_client.utils.QueueError: Queue is full! Please try again.` — the Space's anonymous queue is saturated. This is consistent with the Space's popularity (180+ likes, 4 days old, heavy press coverage this week) — not a code or API-shape problem; the endpoint accepted the call, the queue itself was full.

**I did not verify any of the claimed capabilities** — no image was generated, no alpha channel checked, no multi-reference edit attempted, no 2K output confirmed. Everything above the "What I tried" line is press/release-notes, not tested by me.

## Read

Genuinely promising on paper and worth a real look — but not probeable honestly on the free anonymous tier right now. The honest move is to hold it, not fake a verdict from the announcement. Two paths forward, neither of which this sweep should spend on unattended:
1. Retry the anonymous Space on a later sweep once initial launch traffic settles.
2. Skip the Space entirely and pull the model straight into the Mac's existing `[[Shop/ComfyUI]]` install (day-zero ComfyUI support is the whole point) — that's a real GPU job, belongs to a Maker-dispatched brief or a future Shopkeeper mac-handoff, not this sweep's budget.

**Not recommending a Specialist stub or a recipe change yet.** No evidence collected. Holding, same posture as Viggle-Animate and the video lane since 2026-06-23.
