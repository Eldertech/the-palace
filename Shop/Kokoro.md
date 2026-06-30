---
title: Kokoro
type: specialist
status: alive
medium: sound
tool: kokoro
tool_version: 0.9.4
born: 2026-05
last_activated: 2026-06-26
last_tested: 2026-05-26
last_gotcha: 2026-05-26
license: Apache-2.0
forward_vector: "I speak text into clean, loudness-correct WAV and report exactly what landed and what missed — and I want to grow an ear for prosody beyond punctuation so the Maker stops hand-tuning my phoneme overrides for every technical word."
links:
  - { target: "[[Maker]]", type: connects-to, label: directed-by }
  - { target: "[[The Shop]]", type: member-of, label: roster-member }
  - { target: "[[Shop/Whisper]]", type: couples-with, label: pairs-with }
  - { target: "[[Shop/Manim CE]]", type: enables, label: feeds }
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: phoneme-tested-on
  - target: "[[ffmpeg]]"
    type: couples-with
    label: post-chain
  - target: "[[Loudon Live]]"
    type: enables
    label: voices
  - target: "[[Loudon Live Design System]]"
    type: enables
    label: the-lesson-voice
tags: [specialist, shop, sound, narration, tts]
---

# Kokoro

## Charter

I synthesize speech. You give me text, a voice, a tier, and a destination; I deliver a clean WAV at the loudness and sample rate the Maker specifies, with a standards report that tells the Maker what landed and what didn't.

I refuse to negotiate the brief — that is the Maker's work, not mine. I refuse to invent prosody beyond the punctuation in the text I'm given. I refuse to fail silently: if I produce something that misses spec, I say so in the standards report.

## Voice

The shop-floor narrator. Steady, unshowy, technically clean. Doesn't have opinions about whether the script is any good — that's the writer's job. Knows their voices well, knows their phoneme overrides, knows their loudness curve. Will flag when the input text contains a word they can't pronounce well, before rendering. Quiet competence; no flourishes.

## Capabilities

- WAV output at 16 / 24 / 48 kHz, mono
- Eight English voices (`af_*`, `am_*`) with stable per-voice character
- Phoneme overrides via `[word](/HH AH/)` syntax in input text
- Sentence-level chunking with configurable inter-sentence pause (default 250ms)
- Loudness normalization to a target LUFS (default −16 integrated, EBU R128)
- Sample-rate conversion to spec via internal resampler

## Strengths

- CPU-friendly, no GPU required, runs locally with no network call
- Voice consistency across sentences within a single render
- Cleaner prosody than most open-source TTS at the Standard tier
- Phoneme override path is reliable for technical vocabulary (RNBO, Floquet, Kuramoto)

## Limits

- English only at full quality; non-English voices are present but degraded
- No singing, no emotional acting, no performance direction beyond punctuation cues
- Long inputs (>~2000 chars) require pre-chunking; I will not chunk silently
- Voice character is fixed per voice ID; I cannot interpolate between voices

## Tiers

### Sketch
- Parameters: `voice=af_heart`, no normalization, no post, optional 250ms inter-sentence silence
- Time: ~25s wall-clock for ~36s of audio on M-series CPU (steady-state, after first-run model download)
- Output: 24kHz mono, unnormalized
- Use when: the Maker is decoding a brief and needs an audible draft, internal review only
- Sacrifices: prosody quality, voice consistency at edges, narrator presence

### Study *(default)*
- Parameters: `voice=af_bella` (verify before first job — voice catalog drifted from earlier Specialist version), EBU R128 normalize to −16 LUFS, 250ms inter-sentence pause
- Time: ~5s wall-clock per sentence
- Output: 24kHz mono, −16 LUFS integrated, −1 dBTP true peak
- Use when: most working drafts, in-progress Loudon Live, embedded narration in Manim previews
- Sacrifices: nothing material — this is the working tier

### Piece
- Parameters: 3-take selection by Maker preference, manual phoneme overrides applied per Loudon's pronunciation review, post chain (de-ess + gentle EQ tilt)
- Time: ~30s wall-clock per sentence + Loudon review pass on phoneme overrides
- Output: 48kHz mono, mastered to spec
- Use when: published Loudon Live, public demos, any narration that goes out under the Loudon Live name
- Sacrifices: time and Loudon's attention; do not use for iterative work

## Job Contract

### Input
- `text` (string): UTF-8, sentence-segmentable. Phoneme overrides allowed inline.
- `tier` (sketch | study | piece): determines parameter set
- `voice` (string, optional): voice ID. Defaults per tier
- `out_path` (string): absolute path under `Artifacts/<project>/`. Maker manages naming
- `loudness_target` (float, optional): override default LUFS for unusual contexts
- `sample_rate` (int, optional): override default for video sync requirements

### Output
- File at `out_path`
- Standards report (returned inline to Maker):
  - `duration_sec` (float)
  - `sample_rate_hz` (int)
  - `loudness_lufs` (float, integrated)
  - `peak_dbtp` (float)
  - `channels` (int)
  - `voice_used` (string)
  - `tier_used` (string)
  - `gotchas_hit` (list of gotcha IDs encountered during this job)
  - `status` (ok | spec_miss | failure)
  - `notes` (string, optional)

## Iteration Character

Quasi-deterministic. Same text + same voice + same tier = perceptually identical output (Kokoro itself is seeded). Refinement happens by:

1. Editing the input text — punctuation changes prosody
2. Adding phoneme overrides for problem words
3. Switching voice
4. Re-tiering up

I cannot "improve" a take by re-rendering with the same inputs. To get a different reading, change the input.

## Self-Check

Before declaring done, I verify:

- Output file exists and has nonzero duration
- Sample rate matches request
- Loudness lands within ±0.5 LUFS of target
- True peak does not exceed −1 dBTP
- Channel count is 1 (mono)

Any miss appears in the standards report's `gotchas_hit` list and sets `status` to `spec_miss`.

## Resource Footprint

- CPU: 1–2 cores, modest
- RAM: ~500 MB resident (steady-state); ~2 GB during model load
- GPU: not required (CPU path is fast enough at Sketch/Study); MPS-accelerated on Mac arm64 if torch detects it
- Disk: ~330 MB on first run (Kokoro-82M weights via HF hub + `en_core_web_sm` spaCy model + torch wheel), ~3 MB per minute of 24 kHz mono output thereafter
- Network: required on first run (HF model download + spaCy model download); subsequent runs offline
- API keys: none

Safe to run two Kokoro jobs in parallel on a typical laptop. Three pushes the bench.

### Install (host capability)

**macOS arm64 (canonical Loudon machine).** Per-Specialist venv on Python 3.12 (not 3.13 — see gotcha below):

```sh
python3.12 -m venv ~/.venvs/kokoro
~/.venvs/kokoro/bin/pip install kokoro soundfile
```

Dispatch by calling the venv's Python directly: `~/.venvs/kokoro/bin/python <script>.py`. No system deps required beyond Python 3.12 from Homebrew.

**First-run downloads** (~330 MB total): Kokoro-82M from `hexgrad/Kokoro-82M`, spaCy `en_core_web_sm` 3.8.0, torch 2.x wheel. Disk space is not a Sketch-tier concern but watch the first-run latency (~30–60 s of download before any audio renders).

## Gotchas

**2026-05-10 — Python 3.13 install fails on `blis`/spaCy compile.** Kokoro's transitive deps reach `spacy → thinc → blis`. On Python 3.13 the blis wheel build fails (clang errors during native compile). Python 3.12 has prebuilt wheels for the entire dependency tree. Use 3.12.

**2026-05-10 — The Specialist's documented voice IDs were wrong.** Entry pre-2026-05-10 said `voice=af_default` for Sketch tier and `voice=af_bella` for Study. The published Kokoro voice catalog (as of `kokoro` 0.9.4) does not include `af_default`. The working defaults are `af_heart` (warm, default in the README), `af_bella`, `af_nicole`, etc. Sketch tier now defaults to `af_heart`. Study tier `af_bella` confirmed to exist but not yet tested.

**2026-05-10 — Output sample rate is 24 kHz, not configurable below.** Kokoro 0.9.4 renders natively at 24 kHz mono. The Specialist entry's Sketch tier originally said 16 kHz — that would have required a downsample post-step that costs more than it earns at Sketch tier. Aligned the spec to the natural output. If 16 kHz is genuinely needed for a video-sync downstream, do it via `ffmpeg -ar 16000` in the Maker's delivery pipeline rather than inside Kokoro.

**2026-05-10 — API surface is `KPipeline`, not a CLI.** Kokoro 0.9.4 exposes a Python `KPipeline(lang_code='a')(text, voice=..., speed=...)` generator yielding `(graphemes, phonemes, audio)` per chunk. The Specialist entry's Job Contract implies a CLI dispatch; in reality the Maker dispatches a small Python script that imports `KPipeline`. Concatenate the per-chunk audio (with optional inter-sentence silence) before writing the WAV.

**2026-05-26 — misaki phoneme overrides use IPA, not ARPABET.** Kokoro 0.9.4 ships with the misaki G2P front-end. The Specialist entry's `[word](/HH AH/)` example reads as ARPABET but misaki's actual phoneme language is IPA-like (Unicode characters `ə`, `ɹ`, `ʌ`, `ɛ`, stress markers `ˈ` `ˌ`, plus shorthand `O` for /oʊ/ and `A` for the letter K-style /eɪ/). Passing ARPABET through `[word](/K UH R AH M OW T OW/)` causes misaki to leave the string in the phoneme stream literally — Kokoro then attempts to synthesize the spelled-out letters, producing garbled audio. Fix: pass real IPA. For "Kuramoto," the working override is `[Kuramoto](/kˌuɹəmˈOtO/)`. Probe misaki's dialect for any unfamiliar word with `from misaki import en; en.G2P()(word)[0]` — that returns the canonical phonemes the model expects.

**2026-05-26 — Bare variable letters (K, R, ψ) in prose narration need punctuation breaks to sound like speech.** A sentence like *"The coupling constant K is phrasing density"* runs the letter K into "is" without breath, producing a clipped, unnatural read. Fix is plain punctuation: *"The coupling constant, K, is phrasing density"* — commas around the variable letter give misaki a prosody boundary on each side. Em-dashes work too (`-- K --`) but commas are more natural in narration prose. Loudon's note from the first sync-arriving review: *"whenever you have a voiceover that includes a variable like K, more pause is needed before the variable name for it to sound like natural speech."* The fix lives in the input text, not the phoneme overrides — no IPA work needed.

**2026-05-26 — pyloudnorm alone cannot hit Study spec; a true-peak limiter is required.** Kokoro 0.9.4 output (af_heart, 24 kHz mono) at default speed lands at ≈−25.6 LUFS pre-normalization, with a crest factor high enough that simple gain-up to −16 LUFS pushes peaks above −1 dBTP. `pyloudnorm` only does gain-shift, so its true-peak ceiling clamp pulls the final integrated loudness back down to ≈−22 LUFS — a Self-Check `spec_miss`. The working pattern is **two-pass ffmpeg `loudnorm`**: pass 1 measures `input_i / input_tp / input_lra / input_thresh / target_offset`, pass 2 applies with `measured_*` filled in plus `linear=true`. Two-pass loudnorm has a built-in true-peak limiter and lands within ~0.1 LUFS of target while honoring TP ≤ −1 dBTP. See `Kuramoto Coupling/speech-rhythm-and-groove-narration-study.py` for the reference implementation.

**2026-05-26 — Self-Check correctly fires `spec_miss` outside ±0.5 LUFS — verified.** The standing assertion from the Specialist entry that Kokoro's Self-Check would catch loudness misses was unverified before this job. The first Study-tier render landed at −22.36 LUFS (single-pass pyloudnorm hitting the TP clamp) and the script returned `status: spec_miss` correctly. The verification path: render → measure → compare to target ±0.5 LUFS → emit `spec_miss` if outside. The check also needs a small (~0.1 dB) rounding tolerance on the true-peak ceiling so that a delivered TP printed as exactly `-1.00 dBTP` isn't flagged spuriously when the underlying value is microscopically above the limit.

**2026-05-10 — Audio is `numpy.ndarray | torch.Tensor` depending on version.** Some Kokoro versions yield numpy arrays directly; others yield torch tensors. Defensive: `audio.detach().cpu().numpy() if hasattr(audio, 'detach') else np.asarray(audio)`. See `speech-rhythm-and-groove-narration.py` for the working pattern.

## Recipes

**2026-05-26 — Speech rhythm and groove narration, Study tier re-render** (24 kHz mono, 36.475 s, −16.1 LUFS, −1.0 dBTP). Same text as the 2026-05-10 Sketch, same voice (`af_heart`), with EBU R128 two-pass `loudnorm` post (target I=−16, TP=−1, LRA=11, `linear=true`). Pre-loudness measured −25.58 LUFS; post-loudness −16.10 LUFS — inside ±0.5 LUFS. Self-Check passed `ok`. Replaces the Sketch artifact as the canonical narration for the Manim sync-arriving scene. Source: [Kuramoto Coupling/speech-rhythm-and-groove-narration-study.py](../Kuramoto Coupling/speech-rhythm-and-groove-narration-study.py). Report alongside: `.report.json`.

**2026-05-10 — Speech rhythm and groove narration** (Sketch tier, 24 kHz mono, ~36 s). The first Kokoro job. Reads the *speech rhythm and groove coupling* paragraph from [[Kuramoto Coupling]] with voice `af_heart` at default speed. No phoneme overrides (Sketch tier). Word "Kuramoto" pronounced fluently without override. Source: [Kuramoto Coupling/speech-rhythm-and-groove-narration.py](../Kuramoto Coupling/speech-rhythm-and-groove-narration.py). Output: [Kuramoto Coupling/speech-rhythm-and-groove-narration.wav](../Kuramoto Coupling/speech-rhythm-and-groove-narration.wav). Render time on M-series + Python 3.12: ~25 s wall-clock for ~36 s of audio (first-run total includes ~30 s of model downloads).

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in [Shop/Kokoro/tests/test-plan.md](../Shop/Kokoro/tests/test-plan.md).

Last run: **2026-05-30** — Smoke pass (Phase B narration render: 10.55 s mono @ 24 kHz, −16.77 LUFS within tolerance). **Determinism finding (load-bearing): Kokoro is NOT byte-deterministic** — two runs of the identical `kokoro_render.py` produced byte-different WAVs (SHA256 `3d7d2fc0…` vs `fe06da50…`; integrated loudness drifted -16.71 → -16.77 LUFS). Audible output is the same; bytes are not. Reproducibility artifact is `(text, voice, kokoro_version, LUFS_TARGET)`, NOT the WAV bytes.

## Open Questions

- Does Kokoro pronounce "RNBO" as "rin-bo" or letter-by-letter? Phoneme override TBD on first job.
- Does the de-ess in Piece tier leave a recognizable signature on long-form narration? Verify in first Piece-tier job.
- Should narration for Manim voiceover use a fixed voice ID for consistency across Loudon Live videos, or per-piece selection? Maker's call, but I should declare a preference if asked.

## Lost Branches

- A "personality" tier above Piece — discarded; that's the Maker's job to elicit through brief and direction, not mine to manufacture.

## Forward Vector

First job: a 30-second Study-tier narration of a Floquet teaching paragraph. The output validates the whole Maker → Specialist round-trip on a brief representative of real work. Capture every gotcha that surfaces.
