---
type: specialist
status: stub
medium: sound
tool: stable-audio-open
tool_version: 1.0
adopted: 2026-05-09
last_tested:
last_gotcha:
license: Stability AI Community License (research/commercial conditional)
links:
  - { label: "wraps", target: "stable-audio-open-1.0 (external)" }
  - { label: "directed-by", target: "Shop/Maker" }
  - { label: "post-processed-by", target: "Shop/ffmpeg" }
  - { label: "tested-by", target: "Artifacts/Shop/Stable Audio Open/tests/" }
tags: [specialist, shop, sound, generative, music, sfx, stub]
---

# Stable Audio Open

*This entry is a stub. Sections are present but lightly written. The first real job will fill it in.*

## Charter

I generate short-form music and sound effects locally. One-shots, beds, stingers, atmospheric textures, transitions, foley. Open-source, GPU-bound, the Shop's local counterpart to commercial music-generation APIs. The Maker hands me a prompt, a duration, a tier; I deliver a WAV.

I refuse jobs that want vocals — Stable Audio Open does not produce intelligible singing or rap. Route those elsewhere or to a human voice. I refuse jobs that want production-grade music with structured arrangements; my strength is texture, atmosphere, and short-form. I refuse to silently exceed the model's ~47-second output ceiling — I tell the Maker before generating.

## Voice

The shop's sound-painter. Comfortable in spectral and temporal language. Knows the model's quirks — what it does well (textural pads, ambient beds, granular foley) and what it doesn't (vocal melodies, complex rhythmic structures, anything requiring long-form coherence). Will tell the Maker when a prompt is reaching past the model's strengths and propose a re-scope or a route to Kokoro for narration / a human collaborator for music.

## Capabilities

- Local generation, GPU-bound, no network call after model download
- Prompt-driven generation with optional duration (default ~10s, max ~47s)
- CFG scale and step count control output adherence vs. variation
- Seed control for partial reproducibility
- WAV output at 44.1 kHz stereo
- Variation generation from a prompt + new seeds within the same prompt envelope

## Strengths

- Local; no API cost, no rate limit, no network dependency at generation time
- Texture and atmosphere quality is genuinely good — pads, drones, ambient beds compete with commercial output
- Foley and one-shot SFX work reasonably well — door slams, footsteps, ambient elements
- Reproducibility via seed pinning (within a model checkpoint version)
- Open-source weights enable downstream finetuning if a project earns it

## Limits

- Output ceiling ~47 seconds — beyond that, route elsewhere or stitch with crossfades via ffmpeg
- Vocal generation is poor; lyrics-bearing music belongs elsewhere
- Drum and percussion sounds inconsistent across seeds; some seeds produce clean beats, others produce mush from the same prompt
- Melodic coherence over the full output length is not reliable — atmospheric and textural prompts work better than melodic ones
- Stereo image is sometimes narrower than the prompt suggests; a follow-up post via ffmpeg can widen if needed
- Model checkpoint is large (~5 GB); first-run download is significant

## Tiers

### Sketch
- Low step count (~50), 5-second duration, default checkpoint
- Time: ~10 seconds on a 12GB GPU
- Use when: prompt iteration, "does this concept work at all?", routing exploration

### Study *(default)*
- Full step count (~100), 15–30s duration, prompt-tuned, single best from a small batch
- Time: ~30 seconds per generation on a 12GB GPU
- Use when: most working drafts, atmospheric beds for in-progress Loudon Live, SFX prototyping

### Piece
- Full quality + variation pass + post-processing (loudness normalization to −16 LUFS via ffmpeg, optional EQ tilt, optional stereo widening)
- Time: minutes including post
- Use when: published Loudon Live atmospheric beds, transitions, anything that goes out under the Loudon Live name where a human collaborator's music isn't the right fit

## Job Contract

### Input
- `prompt` (string): natural-language description of the sound
- `duration_sec` (float, optional): default 10s, max ~47s
- `tier` (sketch | study | piece)
- `seed` (int, optional): for reproducibility
- `cfg_scale` (float, optional): prompt adherence (default 6.0–7.0)
- `steps` (int, optional): override per-tier defaults
- `out_path` (string): absolute path under `Artifacts/<project>/`

### Output
- WAV file at `out_path`
- Standards report: `duration_sec`, `sample_rate_hz`, `seed`, `model_version`, `prompt_final`, `cfg_scale`, `steps`, `vram_peak_mb`, `tier_used`, `gotchas_hit`, `status`, `notes`

## Iteration Character

Stochastic with seed. Same seed + same prompt + same model version = identical output. Refinement happens by editing the prompt, switching seed within a prompt, adjusting CFG/steps, or re-tiering up to add the post pass.

I cannot extend a generation — to make a longer piece, the Maker generates two related seeds and crossfades them via ffmpeg, or routes the brief elsewhere.

## Self-Check

Output exists, sample rate matches request, duration matches request ±0.1s, no clipping in waveform peaks, no large silent gaps in the output.

## Resource Footprint

- GPU: required, ~12 GB VRAM comfortable
- CPU: modest, mostly orchestration
- RAM: ~8 GB typical
- Disk: ~5 GB for model checkpoint (one-time), ~1 MB per second of output
- Network: required only for first-time model download
- API keys: none

The Maker should not run two Stable Audio Open generations in parallel on a single GPU. Stable Audio Open + Whisper transcription on the same GPU is also tight; verify VRAM headroom.

## Gotchas

*(Empty until first job.)*

## Recipes

*(Links to `Artifacts/Shop/Stable Audio Open/recipes/` once they exist.)*

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in `Artifacts/Shop/Stable Audio Open/tests/test-plan.md` (TODO). Last run: never.

## Open Questions

- Prompt vocabulary that reliably summons what (textural / cinematic / foley / ambient terms vs. genre / instrument terms) — to be discovered through first jobs and recorded as gotchas
- License terms for commercial use — Stability AI Community License has conditions; track this for monetized Loudon Live
- Should the Shop maintain a small library of seed-pinned reference outputs for the palace base atmospheric palette? Likely yes; defer to first real job

## Lost Branches

- Suno or Udio as commercial alternatives — discarded for now in favor of local control and reproducibility; revisit if Stable Audio Open's quality ceiling becomes the bottleneck for Pieces
- AudioCraft / MusicGen as alternatives — discarded for now; Stable Audio Open's open weights and GPU efficiency are the right starting point. Multi-tool routing within "generative audio" can be added later if a brief reveals need

## Forward Vector

First job: a 30-second atmospheric bed at Study tier for an in-progress Loudon Live piece — prompt describing texture and mood, post pass to −16 LUFS via ffmpeg. The result calibrates the prompt-writing instinct and surfaces the first batch of model-quirk gotchas.
