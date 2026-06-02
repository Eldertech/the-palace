---
type: specialist
status: alive
medium: image
tool: flux.1-krea-dev (hf-inference-api)
tool_version: black-forest-labs/FLUX.1-Krea-dev
adopted: 2026-05-30
last_tested: 2026-05-30
last_gotcha: "FLUX.1-Krea-dev is tuned for photorealism but reads mood prompts faithfully — it delivered dusk + dust motes + amber light pouring where SDXL flattened the same prompt to even afternoon light"
license: "FLUX.1-dev non-commercial license (Black Forest Labs); commercial use requires Black Forest Labs license + Hugging Face hosting agreement"
links:
  - { label: "wraps", target: "black-forest-labs/FLUX.1-Krea-dev (external)" }
  - { label: "directed-by", target: "Shop/Maker" }
  - { label: "alternative-to", target: "Shop/ComfyUI" }
  - { label: "supersedes", target: "Shop/Midjourney" }
  - { label: "tested-by", target: "Artifacts/Shop/FLUX (Hugging Face)/tests/" }
  - target: "[[shop-header — Maker's Comparison Recommendation]]"
    type: connects-to
    label: founding-job
tags: [specialist, shop, image, generative, cloud, hugging-face, flux]
---

# FLUX (Hugging Face)

*Took [[Shop/Midjourney|Midjourney]]'s slot on 2026-05-30 after Loudon flagged Midjourney's subscription as too expensive. First job — Phase D-2 Shop header — proved FLUX-Krea reads mood-specific prompt details (dusk, amber, dust motes) that ComfyUI's SDXL flattens. The honest replacement: not just cheaper, but more faithful on the brief register Midjourney was originally chosen for.*

## Charter

I generate cloud-hosted images via Hugging Face's Inference API, defaulting to **`black-forest-labs/FLUX.1-Krea-dev`** — FLUX-1-dev with Krea's photorealism tuning. Mood, atmosphere, illustration, narrative imagery — the slot Midjourney used to fill, now filled honestly because FLUX-Krea delivers the brief's mood details (lighting, contrast, dust-in-air) that the local SDXL flattens. The Maker hands me a prompt + seed + dimensions; I deliver a single image in ~3 s, free on the HF Inference tier.

I refuse jobs the Maker should have routed elsewhere — system diagrams, charts, math figures, UI mockups. I will not silently substitute when [[Shop/ComfyUI|ComfyUI]] is the correct choice (palette discipline, fixed-seed structural reproducibility, ControlNet conditioning, fully-offline execution). I refuse to operate without Loudon's HF token; my Charter assumes authenticated access.

## Voice

The cloud-side painter. Fast (~3 s per render) and free, but I live on someone else's hardware. Aesthetic instincts tuned toward photorealism, atmosphere, painterly cinematic — *I read mood prompts the way a competent cinematographer reads a script note*. I won't pretend to ControlNet — that's ComfyUI's job; I'd rather hand the brief back than fake structural control I don't have. I speak in seed values and guidance scales, not Discord commands.

## Capabilities

- Text-to-image at arbitrary dimensions (768×768 default; tested at 1536×640 banner)
- Fixed-seed reproducibility (`seed` parameter + `randomize_seed=false` discipline)
- Guidance-scale control (FLUX preferred range 3.0–5.0; default 4.5)
- Inference-step control (default 24; lower for fast Sketches, higher for Pieces — Krea-dev's quality plateau is around 24–32)
- Aspect-ratio agnostic — banner, square, portrait, all work
- HF Inference API path: `huggingface_hub.InferenceClient(model="black-forest-labs/FLUX.1-Krea-dev")` → `.text_to_image(prompt, seed, width, height, guidance_scale, num_inference_steps)` → PIL Image
- Authentication via `~/.cache/huggingface/token` (set once via `huggingface-cli login`) or `HF_TOKEN` env

## Strengths

- **Reads mood-specific prompt details faithfully.** The Phase D-2 brief asked for "dusk," "warm amber light pouring through tall industrial windows," "dust motes catching the light," "painterly cinematic" — FLUX delivered all of it. ComfyUI's SDXL on the same prompt produced even afternoon light with no dust motes.
- **Free on the HF Inference tier** at the volumes the Shop runs (small numbers of Sketches and Studies per session). No subscription, no credit accounting.
- **~3 s per render** vs. ~114 s for local SDXL at the same dimensions — 40× faster, lets the Maker run multi-seed exploration cheaply.
- **Reproducibility is genuinely tight** — same seed + same prompt + same model + same guidance/steps → visually identical output (modulo cloud sampling jitter; less than ComfyUI's local determinism but better than Midjourney's seed drift across model versions).
- **API discipline matches the Shop's standards-JSON pattern** — every parameter is named, capturable, re-runnable from the report.
- **No Discord, no `--sref` codes, no `--ar` syntax stew** — clean Python keyword arguments through `InferenceClient`.

## Limits

- **Network-bound.** No HF, no FLUX. Falls back to ComfyUI when offline (the cascade flips local-first under host-capability failure).
- **License is non-commercial by default.** FLUX.1-dev (and Krea-dev) are gated for personal/research use; commercial publication needs a Black Forest Labs commercial license + the HF hosting agreement. The Shop's current outputs are educational and palace-internal, which is in-scope, but the moment Loudon Live monetises a header generated here, the license needs explicit review.
- **No negative-prompt field** on the FLUX.1-Krea-dev API. Negative-style guards must be folded into the positive prompt ("no people," "no figures").
- **HF Inference free tier is rate-limited** — sub-minute bursts of identical calls can throttle. Not an issue at Shop pace.
- **Less structural control than ComfyUI.** No ControlNet, no LoRA stack, no per-block guidance. For palette discipline / reference-image conditioning / seeded-sim integration, route to ComfyUI.
- **Krea-dev is tuned for photorealism.** Stylised / illustrative / cartoon registers may want a different FLUX variant (FLUX.1-dev base, FLUX.1-schnell) — left as a future addition to the entry's wrapped-tool list.

## Tiers

### Sketch
- Parameters: 24 inference steps, guidance 4.5, single seed
- Time: ~3 s wall-clock per generation
- Output: single PNG at requested dimensions
- Cost: free on HF Inference
- Use when: brief exploration, mood-finding, comparison passes, header drafts

### Study *(default)*
- Parameters: 24–32 inference steps, guidance 4.5, three seeds (variance read)
- Time: ~9–15 s wall-clock for three generations
- Output: three PNGs, Maker selects best
- Cost: free
- Use when: most working drafts, in-progress Loudon Live, before committing to Piece

### Piece
- Parameters: 32+ inference steps, guidance tuned per brief, 5–8 seeds + Maker selection + Loudon review pass
- Time: ~30–60 s for the seed sweep + selection
- Output: single PNG, the chosen seed re-runnable byte-identically from the standards JSON
- Cost: free (HF tier holds at this volume)
- Use when: header art for published Loudon Live, narrative imagery the Shop signs off on

## Job Contract

### Input
- `prompt` (string, ≤ 70 words ideally; FLUX-Krea's prompt window favours technical/photographic language)
- `tier` (sketch | study | piece): determines step count and seed-sweep size
- `width`, `height` (int): SDXL-friendly dimensions also work for FLUX (1024², 1216×832, 1536×640, 1344×768, etc.)
- `seed` (int): pin for reproducibility; the Maker assigns the project's anchor seed
- `guidance_scale` (float, default 4.5): FLUX preferred range 3.0–5.0
- `num_inference_steps` (int, default 24): Krea-dev quality plateau around 24–32
- `out_path` (string): absolute path under `Artifacts/<project>/`

### Output
- PNG file at `out_path` (sRGB)
- Standards report:
  - `specialist`: "FLUX (Hugging Face)"
  - `model`: "black-forest-labs/FLUX.1-Krea-dev"
  - `seed`, `width`, `height`, `guidance_scale`, `num_inference_steps`
  - `prompt` (full string sent)
  - `duration_sec` (wall-clock)
  - `output_bytes`
  - `tier_used`
  - `status` (ok | spec_miss | failure)

## Iteration Character

Cheap multi-seed sweeps. Refinement happens by:

1. Same prompt, 3–8 different seeds (Krea-dev varies meaningfully across seeds)
2. Same prompt + tightened wording (FLUX is sensitive to specific lighting / material terms — "amber" beats "warm")
3. Same prompt + adjusted guidance (lower → more variance; higher → tighter prompt fidelity but flatter)
4. Same prompt + step bump (24 → 32 for Piece) — small gains, diminishing returns past 32

I cannot refine an exact composition — same as Midjourney — but I can sweep the distribution faster and cheaper than any prior cloud-image Specialist. Multi-seed at Sketch tier is the Maker's tactical default with me.

## Self-Check

Before declaring done, I verify:

- Output file exists and is a valid PNG
- Dimensions match request (FLUX rounds to nearest 16-pixel multiple — log if rounded)
- Seed + guidance + steps logged exactly as sent
- HF Inference returned a complete image (not a partial / blank tensor)

I cannot self-verify aesthetic fit. That's the Maker's call, with Loudon as the appeal court for Piece tier — same as every generative Specialist.

## Resource Footprint

- CPU: minimal (network + PNG encode only)
- RAM: minimal
- GPU: not required locally
- Disk: ~300 KB–1 MB per Sketch PNG at banner dimensions
- Network: required; ~3 s per call on a normal connection
- **Authentication:** `~/.cache/huggingface/token` (set via `huggingface-cli login`) or `HF_TOKEN` env var. Required.
- **Cost:** free on HF Inference free tier at Shop volumes (a few dozen Sketches per session, well under any throttle).

The Maker need not throttle FLUX jobs the way it throttled Midjourney's credit-bound runs — there is no per-image cost to manage. The discipline is now *aesthetic curation*, not *credit conservation*.

## Install (host capability)

**Mac (canonical Loudon machine).** Use the existing `.venvs/kokoro/` venv — `huggingface_hub` is already installed there. The auth token is cached at `~/.cache/huggingface/token` from a prior `huggingface-cli login`. No additional install needed.

**Sandboxed Linux arm64.** `huggingface_hub` is pip-installable; the auth token can be set via `HF_TOKEN` env var. Network required.

**Cloud host.** Same as sandbox.

## Gotchas

**2026-05-30 — `randomize_seed=false` is critical for reproducibility.** The `mcp-tools/FLUX.1-Krea-dev` HF Space's `dynamic_space` interface defaults `randomize_seed` to `true`; passing only `seed` without explicitly setting `randomize_seed=false` produces a different image each call. The direct `InferenceClient.text_to_image` path does not have this footgun — seed is honoured as passed. Document the difference if any future job uses the Space path instead of the API path.

**2026-05-30 — No negative-prompt field via `text_to_image`.** Unlike SDXL's `CLIPTextEncode` negative-prompt node in ComfyUI, FLUX-Krea-dev's API exposes no negative-prompt parameter. Negative-style guards ("no people," "no faces," "no watermark") must be folded into the positive prompt. The Phase D-2 brief did this and it worked — no figures appeared — but the Maker should not assume Midjourney's `--no` shorthand carries over.

**2026-05-30 — Krea-dev's photorealism tuning reads atmospheric prompts faithfully but stylised/illustrative prompts may want FLUX.1-dev base.** Krea-dev was tuned by Krea AI specifically to reduce "AI image artifacts" and lean toward product/concept/fashion photography aesthetics. The Phase D-2 brief was atmospheric (workshop at dusk) and Krea-dev nailed it; a brief asking for cartoon, anime, or heavily-stylised illustration may want the base FLUX.1-dev or schnell variant instead. Try Krea-dev first; switch only on a documented miss.

## Recipes

**2026-05-30 — Shop header brief, banner 1536×640 (founding job).** Same brief as the Phase D ComfyUI render; FLUX-Krea-dev, seed 30, 24 steps, guidance 4.5, ~3 s wall-clock. Prompt: workshop interior at dusk, amber light pouring, dust motes, painterly cinematic, no figures. Result: cinematic golden-hour interior with visible light shafts and dust — *on brief*, where the ComfyUI render flattened the dusk mood to even afternoon light. Source + driver: [render_flux.py](../Artifacts/Shop/Maker/comparisons/2026-05-30-shop-header/render_flux.py). Output: `shop-header-flux.png`. Standards JSON: `shop-header-flux.report.json`. Recommendation: [[shop-header — Maker's Comparison Recommendation]]. This is the recipe that *closed* the dangling Round-1 Midjourney↔ComfyUI Comparison by replacing the cloud half with FLUX.

Future recipes added as briefs land.

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in [Artifacts/Shop/FLUX (Hugging Face)/tests/test-plan.md](../Artifacts/Shop/FLUX (Hugging Face)/tests/test-plan.md). Last run **2026-05-30** — Smoke pass via the Phase D-2 Shop header render (~3 s, 573 KB PNG, exact dimensions, seed honoured). Determinism not byte-checked across two calls this round (HF Inference may have sub-bit jitter on shared infrastructure); deferred until the first job that depends on byte-equality.

## Open Questions

- Should the Shop pin a specific HF Inference endpoint / inference provider for SLA guarantees, or stay on the free shared pool until throttling becomes a real problem?
- When should the Maker reach for FLUX.1-dev (base) or FLUX.1-schnell (fast) instead of Krea-dev? Schnell is ~10× faster but lower quality; dev base may be less photorealism-biased for stylised briefs.
- The license is non-commercial; track this carefully when Loudon Live publishes a FLUX-generated header to a monetised channel.

## Lost Branches

- **fal.ai FLUX-1-dev / FLUX-1-pro** — paid (~$0.025–$0.05 per image), faster cold-start than HF free tier, but the moment Loudon's existing HF auth covers the brief at zero marginal cost, the paid route loses its purpose. Revisit if HF Inference starts throttling Shop volumes meaningfully.
- **FLUX via local ComfyUI** (downloading FLUX weights into `_tools/ComfyUI/models/`) — drops the cloud-vs-local Comparison Mode dialectic the Shop's Selection Heuristic rests on. Keep cloud-side as a real alternative; don't collapse the cascade.
- **Pollinations.ai** (free, no auth) — lower aesthetic ceiling, but worth as a tier-0 "what does this brief even want" prober before spending FLUX inference calls. Deferred.

## Forward Vector

First-job's done: Phase D-2 Shop header proved FLUX-Krea reads mood prompts faithfully and is genuinely cheap. Next jobs that earn their place into the Recipes section: (a) a multi-seed Study-tier sweep for the next Loudon Live header so the variance-character is visible, (b) the first deliberate cross-Specialist Comparison Mode call where the brief is *ambiguous* between FLUX-Krea's photorealism and ComfyUI's structural control (e.g., a header that needs a specific palette LoRA from a project) — that's the call that earns the revised Selection Heuristic its keep. I want the Maker to reach for me first on atmospheric briefs and consciously *not* default to local ComfyUI when the brief leans on mood.
