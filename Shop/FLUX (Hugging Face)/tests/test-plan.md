---
title: test-plan
born: 2026-05-30
links:
  - { target: "[[FLUX (Hugging Face)]]", type: connects-to, label: test-plan-for }
forward_vector: "I hold the Smoke / Capability / Style / Edge / Speed / Determinism probes for the FLUX (Hugging Face) Specialist so each claim can be re-run and re-confirmed."
---

# FLUX (Hugging Face) — Test Plan

> Phase E follow-up. FLUX (Hugging Face) took [[Shop/Midjourney|Midjourney]]'s slot 2026-05-30 (Phase D-2). Smoke is one `text_to_image` call against `black-forest-labs/FLUX.1-Krea-dev` at the founding-job's parameters. Determinism is the load-bearing question — the Selection Heuristic revision rests on FLUX-Krea being a *reliable* second lens, not a stochastic one.

Last run: **2026-05-30** — Smoke pass via the Phase D-2 founding job (~3 s, 573 KB PNG at exact requested dimensions, seed honoured, banner aspect rendered cleanly).

## Smoke

```py
from huggingface_hub import InferenceClient
client = InferenceClient(model="black-forest-labs/FLUX.1-Krea-dev")
img = client.text_to_image(
    prompt="a master printmaker's workshop seen from a slightly elevated angle at dusk, "
           "ordered work surfaces and presses arrayed in disciplined geometry, warm amber "
           "light pouring through tall industrial windows, dust motes catching the light, "
           "dark exposed timber beams, deep shadows in the corners, painterly cinematic "
           "atmosphere, oil painting quality, no people",
    seed=30, width=1536, height=640, guidance_scale=4.5, num_inference_steps=24,
)
img.save("/tmp/flux-smoke.png")
```

- **Automated:** Pass = PNG saved, dimensions match (1536×640 or rounded to 16-px multiple), file size > 100 KB.
- **Last run (2026-05-30):** 573 KB PNG at 1536×640, ~3 s wall-clock, OK. Visible content matches the brief (workshop interior, dusk, amber light).

## Capability Probe

| Capability                                         | Last run                                              |
|-----------------------------------------------------|--------------------------------------------------------|
| Banner-aspect (12:5, 1536×640) generation          | Phase D-2 Shop header — OK                             |
| Mood-faithful prompt rendering (dusk, dust motes, light shafts) | Phase D-2 Shop header — OK; visible in result |
| Fixed-seed reproducibility                          | not byte-checked this round (HF Inference shared-pool may have sub-bit jitter); deferred |
| Negative-prompt-via-positive ("no people")          | Phase D-2 — OK, no figures rendered                   |
| FLUX.1-dev (base) for stylised registers            | not exercised — claim unverified; entry forward-vector item |
| FLUX.1-schnell (fast) for cheap exploration         | not exercised — claim unverified                       |

- **Last run (2026-05-30):** three of six covered by the founding job.

## Style Probe

FLUX-Krea is Krea AI's photorealism tuning over FLUX.1-dev — so "style" for it means *how faithfully it lights and textures the brief's mood*. The Phase D-2 Shop header was the first style probe: the brief asked for "dusk," "warm amber light pouring," "dust motes catching the light," "painterly cinematic." Krea-dev delivered all four visibly; SDXL on the same prompt flattened the dusk to even afternoon light and produced no dust motes.

- **Manual:** the Maker's eye-check against the prompt's mood-specific words.
- **Last run (2026-05-30):** founding job passed the eye-check by a clear margin over the SDXL counterpart.

## Edge Probe

- **Network failure** (HF Inference unreachable): `InferenceClient.text_to_image` raises a connection error. ✓
- **Missing auth** (no `~/.cache/huggingface/token` and no `HF_TOKEN` env): raises an auth error. ✓
- **Prompt > 70 words** (FLUX-Krea space description recommends ≤ 70): no hard cap — extra words are silently truncated or ignored by the encoder. Not a crash, but worth keeping prompts disciplined.
- **`randomize_seed=true` via the `dynamic_space` interface footgun**: the MCP-Space variant defaults to randomising; direct `InferenceClient.text_to_image` honours the seed as passed. Documented in entry gotchas.
- **Rate-limit hit** on HF free tier: returns an HTTP 429; needs back-off. Not exercised this round.

- **Last run (2026-05-30):** network + auth failure modes documented from API contract; not formally exercised this round.

## Speed Bench

Reference host: **mac** (network-bound; the actual compute is HF's GPUs).

| Job                                  | Wall-clock |
|---------------------------------------|-----------|
| Sketch — 1536×640, 24 steps, guidance 4.5 | **~3 s** (Phase D-2 founding job) |
| Study — same, but 3-seed sweep        | ~9–15 s estimated |
| Piece — same, 5–8 seeds + selection   | ~30–60 s estimated |

For comparison: the same brief / same dimensions through local ComfyUI SDXL on Mac MPS took **114 s** — FLUX-Krea via HF is **~40× faster** wall-clock, at the cost of network dependency.

## Determinism (load-bearing)

The Selection Heuristic revision depends on FLUX-Krea being a *reliable* second lens. The reproducibility contract is (model, prompt, seed, width, height, guidance_scale, num_inference_steps) — the standards JSON captures all of these. Byte-determinism across two HF Inference calls is *not* asserted here; HF's shared inference pool may introduce sub-bit jitter (FP precision differences across hardware). What IS asserted: *visually identical* output at the same parameters.

- **Reproducibility artifact:** the full standards JSON (per Phase D-2's `shop-header-flux.report.json`), pinning model name + every parameter.
- **Last run (2026-05-30):** byte-determinism not exercised; deferred to the first job that depends on byte-equality (none yet — generative-image jobs in the Shop are pinned by parameters, not by hash).

## Notes

- This Specialist's Charter explicitly inherits the *brief shape* Midjourney was chosen for, without inheriting Midjourney's tool-specific syntax (Discord, `--ar`, `--sref`, `--no`, credit accounting). The Maker's prompts that used to land via Midjourney route here verbatim, modulo folding any `--no` clauses into the positive prompt.
- **Cost:** free at Shop volumes on HF Inference free tier. Watch for throttling if a single session exceeds ~50 calls; fall back to fal.ai paid FLUX (~$0.025/img) or back to local ComfyUI SDXL only if both fail.
