---
title: test-plan
born: 2026-05-30
links:
  - { target: "[[Stable Audio Open]]", type: connects-to, label: test-plan-for }
forward_vector: "I hold the test plan for Stable Audio Open; I want every check here to be runnable and to record an honest last-run date."
---

# Stable Audio Open — Test Plan

> Phase E rollout. Stable Audio Open is the Shop's generative-audio Specialist (atmospheric beds, SFX, narrative-arc short clips). Like ComfyUI, it's GPU-bound and non-deterministic in the byte sense; the reproducibility artifact is prompt + seed + checkpoint, not WAV bytes. Smoke for this round leans on the 2026-05-26 Kuramoto Round 1 beds (`opening-bed.wav`, `title-bed.wav`) rather than spinning the GPU pipeline for ceremony.

Last run: **2026-05-30** — Smoke pass via existing artifact verification (Kuramoto Round 1 beds intact + their report JSONs); live re-run deferred to next Stable Audio brief.

## Smoke

**Existing-artifact verification:**

```sh
test -f "Kuramoto Coupling/opening-bed.wav" \
  && test -f "Kuramoto Coupling/opening-bed.report.json" \
  && jq -e '.prompt and .seed != null' "Kuramoto Coupling/opening-bed.report.json"
```

**Live re-run** (when Stable Audio pipeline is active):

```sh
# (cd _tools/stable-audio-3 && .venv/bin/python … prompt + seed → out.wav)
# Compare audibly to the saved bed; byte-comparison is not the test.
```

- **Automated (cheap):** existing-artifact check above.
- **Last run (2026-05-30):** Kuramoto Round 1 opening-bed.wav and title-bed.wav both present with their report JSONs.

## Capability Probe

| Capability                             | Last run                                       |
|-----------------------------------------|-------------------------------------------------|
| Short atmospheric bed (~20 s)          | `opening-bed.wav` (2026-05-26) — OK             |
| Title-card sting                        | `title-bed.wav` (2026-05-26) — OK              |
| Narrative arc (scattered → coherent)   | Round 1 brief — outcome was uniform texture not narrative arc; documented as the standing open question on the entry |
| Long-form (> 30 s)                      | not exercised — entry notes long-form is unstable |

- **Last run (2026-05-30):** two of four covered; narrative-arc capability *failed* its first job and is the documented limit.

## Style Probe

Style is prompt-entangled (same as ComfyUI). The Shop discipline: log full prompt + seed + checkpoint in the standards JSON; eye/ear-check the result against the brief's intent.

- **Manual:** ear-check the bed against the brief.
- **Last run (2026-05-30):** Kuramoto Round 1 beds passed ear-check during the round; not re-listened this round.

## Edge Probe

- **Prompt drift across long durations**: Stable Audio Open loses prompt coherence past ~30 s. Documented entry limit, not a runtime crash.
- **GPU contention with ComfyUI**: hard rule — Maker resource scheduling forbids parallel ComfyUI + Stable Audio jobs.
- **Missing checkpoint**: clean error on load.

- **Last run (2026-05-30):** edge probes documented; not re-exercised.

## Speed Bench

Reference host: **mac** (MPS GPU). Per Kuramoto Round 1 reports: ~20 s of generated audio takes 1–2 minutes wall-clock depending on model size and steps. Stable Audio is the slowest Specialist per second of output in the Shop; budget accordingly.

## Determinism

Non-deterministic at the byte level (same as ComfyUI — GPU sampling jitter). Reproducibility artifact is prompt + seed + checkpoint + sampler params, captured in the standards JSON.

- **Reproducibility artifact:** `opening-bed.report.json` (and equivalent for future beds).
- **Last run (2026-05-30):** reproducibility packages intact; byte-determinism not asserted.
