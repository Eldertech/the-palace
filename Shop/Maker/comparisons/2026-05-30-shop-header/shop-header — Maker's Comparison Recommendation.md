---
type: meta
status: mature
links:
  - target: "[[The Shop]]"
    type: connects-to
    label: hub-header-brief
  - target: "[[Shop/Maker]]"
    type: directed-by
  - target: "[[Shop/ComfyUI]]"
    type: produced-by
  - target: "[[Shop/FLUX (Hugging Face)]]"
    type: produced-by
    label: midjourney-replacement
  - target: "[[Shop/Midjourney]]"
    type: supersedes
    label: midjourney-deprecated-too-expensive
  - target: "[[Flocking — Maker's Comparison Recommendation]]"
    type: mirrors
    label: prior-comparison-shape
tags: [meta, shop, maker, comparison, recommendation, header]
forward_vector: "I am the two-sided Comparison Phase D was meant to deliver — local-control ComfyUI vs cloud-aesthetic FLUX-Krea (the chosen Midjourney replacement). I name the call, revise the Selection Heuristic the prior single-vendor recommendation refused to update, and turn the dangling Round-1 Comparison into a closed loop."
---

# Shop Header — Maker's Comparison Recommendation

**Authored 2026-05-30** as Phase D of [`SHOP-BUILD-SESSION-2026-05-30.md`](../../../SHOP-BUILD-SESSION-2026-05-30.md), then **completed 2026-05-30 (Phase D-2)** when Loudon flagged Midjourney as too expensive and [[Shop/FLUX (Hugging Face)|FLUX-Krea via Hugging Face]] took Midjourney's slot — at which point the half-comparison became a real two-sided Comparison. This document follows the [[Flocking — Maker's Comparison Recommendation]] shape and supersedes its own first draft.

## The brief

A header for [[The Shop]] itself — the front-door entry whose forward vector is *"validated at all three tier points, proven as a coordinating foreman, defended against host-mismatch waste, systematically testable, and finished on its oldest open comparison."* Banner dimensions for a hub-entry header (12:5, 1536×640 — SDXL-trained / FLUX-friendly). No figures (the Shop is the *space and the tools*, not a person). Spirit: ordered craft discipline, focused light, master printmaker's studio at dusk.

The reproducibility-strictness rule from the [[Flocking]] shoot-out applies here: **byte-identical brief across both candidates**. Same prompt text, same seed (30), same dimensions (1536×640) — the only variable is the Specialist. Anything else and we'd be comparing two different things, not two lenses on one.

## What ran

| Specialist | Pipeline | Cost | Wall-clock | Reproducibility artifact |
|---|---|---|---|---|
| **[[Shop/ComfyUI|ComfyUI]]** (SDXL base) | local Mac MPS, seed 30, 30 steps, CFG 7.0, euler/normal, negative-prompt support | $0 (local GPU electricity) | **114.4 s** | `shop-header-workflow.json` + `shop-header.report.json` |
| **[[Shop/FLUX (Hugging Face)|FLUX-Krea]]** (`black-forest-labs/FLUX.1-Krea-dev` via HF Inference API) | cloud-hosted, seed 30, 24 steps, guidance 4.5, no negative-prompt field (folded into positive) | $0 (HF Inference free tier; would be ~$0.025/img on fal.ai FLUX-1-dev paid tier) | **2.81 s** | `render_flux.py` + `shop-header-flux.report.json` |

**40× faster wall-clock for the cloud-hosted FLUX-Krea** vs the local Mac-MPS SDXL. Both free in monetary terms for the Sketch tier (HF Inference free, local GPU is sunk cost). The cost dimension that matters in Loudon's framing — Midjourney's $10–30/month subscription — is **gone** in either direction now.

## How they read

Side-by-side at `Artifacts/Shop/Maker/comparisons/2026-05-30-shop-header/` (`shop-header-comfyui.png` and `shop-header-flux.png`).

**ComfyUI (SDXL):** technically competent workshop interior. Symmetric centred composition with mirrored windows on left and back walls. Bright, *even* lighting that reads more *afternoon* than *dusk* despite the prompt asking for dusk. Wood-tone palette, lighter overall. Reads as "a workshop in regular use" — generic.

**FLUX-Krea:** dramatic golden-hour lighting with visible *shafts* of amber light angling through tall industrial windows. Volumetric atmosphere — dust motes are visible in the light. Stronger contrast, deeper shadow detail. Cinematic depth — rows of desks recede into darkness on the right. Reads as "an old craft hall at dusk, just before the work resumes" — *the specific mood the prompt asked for*.

The honest sentence: **FLUX-Krea delivered the brief's mood details (dusk, amber light pouring, dust motes, painterly cinematic) that ComfyUI's SDXL flattened**. Both are technically clean; only one was *on brief*.

## The Selection Heuristic gets revised

The pre-Comparison heuristic read:

> *"Mood, atmospheric, narrative imagery → Midjourney for highest aesthetic ceiling, ComfyUI when palette discipline, seed reproducibility, structural control (ControlNet), or local execution matters more than ceiling. **Default to ComfyUI when in doubt — local-first is the house preference.**"*

The "default to ComfyUI when in doubt" line was load-bearing for the Shop's local-first ethos. The Phase D ComfyUI-only first pass declined to revise it (single-vendor evidence). With Phase D-2's FLUX-Krea half in hand, the evidence is now two-sided and unambiguous on this brief register:

**Revised heuristic** (now also lives in [[Shop/Maker|Maker]] Selection Heuristics):

> *"Mood, atmospheric, narrative imagery → **FLUX-Krea via Hugging Face** when the brief leans on lighting / atmosphere / mood that the prompt names (FLUX renders prompt-specified mood details that SDXL flattens). **ComfyUI (SDXL)** when palette discipline, fixed-seed structural reproducibility, ControlNet / LoRA conditioning, or fully-offline execution matters more than mood fidelity. **No more 'default to ComfyUI when in doubt'** — the default is now brief-shape-dependent, not local-first-by-reflex."*

The local-first reflex was correct when Midjourney's cost (and Discord-only API) made cloud generation feel like a tax. With FLUX-Krea free on HF Inference, the tax is gone, and the heuristic should match what the evidence shows about *fit*, not what was previously the cheapest reflex.

## My recommendation for this specific brief

**Ship the FLUX-Krea render** (`shop-header-flux.png`) as the working header for [[The Shop]]. It hit the brief; SDXL didn't. Keep the ComfyUI render in the bundle as the comparison anchor and as the reproducibility-discipline reference (workflow JSON, fixed seed, local-control proof).

Promotion to Piece: a second FLUX seed (seed 31) for composition variance, and the existing prompt is already inside FLUX's 60–70-word window — no rewrite needed. ~3 s of compute per variant.

## What this taught about Comparisons (now closed properly)

The Phase D-1 half-comparison turned out to be a *generative* state, not a stalled one. It made the missing half *legible as missing*, which is what put Loudon in a position to flag Midjourney's cost the next moment and propose a substitute. The substitute (FLUX-Krea) was already on the candidate list (in the broader gen-AI landscape), but without the half-comparison's named-missing-half framing, swapping it in would have felt like a side question. With the framing in place, it was the obvious next move.

Lesson for future Comparisons: a missing-half recommendation document is not a placeholder. It's the artifact that converts "we never got to it" into "the deferred half has a defined shape," and that shape is what makes substitution decisions tractable.

## Roster + frontmatter implications

- [[Shop/Midjourney|Midjourney]]: **stub → deprecated** (`status: deprecated`, `superseded_by: Shop/FLUX (Hugging Face)`). Kept as a knowledge entry so the lineage is readable.
- [[Shop/FLUX (Hugging Face)|FLUX (Hugging Face)]]: **new entry, status: alive** — Phase D-2 is its first real job, and this Comparison Recommendation is its founding gotcha set.
- [[Shop/Maker|Maker]] Selection Heuristics: revised per above.
- [[Shop/Maker|Maker]] Roster: was 14 alive + 2 stub; now 14 alive + 1 alive (FLUX) + 1 stub (RNBO codebox~ smith) + 1 deprecated (Midjourney) = **15 alive, 1 stub, 1 deprecated**.
- `Artifacts/Shop/host-capability.json`: Midjourney's manifest entry updated to `status: deprecated`; new entry for `FLUX (Hugging Face)` (cloud host, requires `HF_TOKEN` cached or env-set).
