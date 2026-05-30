# Whisper — Test Plan

> Phase E rollout. Whisper is the Shop's speech-to-text and word-timing Specialist. Its Phase B coordination role (gating Manim on word-level timestamps) makes the Determinism probe load-bearing: a Maker-coordinated narrated render is only honest if the same WAV → same word timings on re-run.

Last run: **2026-05-30** — Smoke + Determinism both pass (text + word boundaries identical at 2-decimal precision across two runs of the same WAV).

## Smoke

Transcribe a known WAV; confirm the expected words appear.

```sh
whisper "Artifacts/Shop/Maker/coordination-demos/2026-05-30-narrated-beats/narration.wav" \
  --model base --output_format json --word_timestamps True \
  --output_dir /tmp --language English
```

- **Automated:** Pass = `/tmp/narration.json` exists with non-empty `segments[].words[]` and contains the cue words `frequencies`, `drift`, `sum`, `beat`, `Listen` (fuzzy match).
- **Last run (2026-05-30):** 27 words, all cue words present, OK.

## Capability Probe

Whisper's three Shop roles:

| Role                                   | Last run                                          |
|-----------------------------------------|----------------------------------------------------|
| Plain transcription (`--output_format txt`) | Smoke covers it (2026-05-30) — OK              |
| Word-level timestamps (`--word_timestamps True`) | Phase B gated pipeline (2026-05-30) — OK    |
| Multi-language autodetect              | not exercised — Shop work is English-only         |

- **Last run (2026-05-30):** two of three exercised; multi-language unverified by design.

## Style Probe

Whisper has no aesthetic surface. The "style" question for transcription is *correctness*, not register, and that's the Smoke/Capability domain. **N/A** for Style.

## Edge Probe

- **Non-audio input** (video without an audio track, or a JPEG): exits non-zero with `Error opening output file -. Error opening output files: Invalid argument` (verified 2026-05-30 on a silent video-only MP4). Not the cleanest error message; the failure surfaces loudly but the cause requires interpretation.
- **Silent WAV** (all zeros): produces an empty `segments[]`. Quiet — the orchestrator must check `len(segments) > 0` if a non-empty result is required (the Phase B gate does this).
- **Wrong sample rate** (8 kHz narrow-band): Whisper resamples internally; transcription quality drops but doesn't fail.

- **Last run (2026-05-30):** non-audio probe verified; silent-WAV behaviour documented but not exercised.

## Speed Bench

Reference host: **mac** (CPU; no MPS support in the homebrew openai-whisper). Model: `base`.

| Audio                              | Time      |
|-------------------------------------|-----------|
| Phase B narration, 10.55 s          | ~4.5–5.5 s |
| Kuramoto sync-arriving, 36 s        | ~15–20 s (historical, see Kokoro recipes) |

Roughly 0.4–0.5× real-time on CPU base model. Adequate for the Shop's narration lengths (< 1 min typical); larger models (`small`, `medium`) cost proportionally more.

## Determinism (load-bearing)

Whisper inference is deterministic given (same WAV, same model weights, same language hint, same temperature 0). The FP16/FP32 warning on CPU does **not** affect text output. Word boundaries are stable at 2-decimal precision; sub-frame jitter at the 3rd decimal is possible across runs (small float-precision differences inside the alignment pass).

- **Reproducibility artifact:** WAV file + model name (`base`) + language flag.
- **Last run (2026-05-30):** two back-to-back runs on `narration.wav` produced identical text and identical word boundaries (rounded to 2 decimals); 27 words both runs.

```py
A = json.load(open('run-A.json')); B = json.load(open('run-B.json'))
wa = [(w['word'], round(w['start'],2), round(w['end'],2)) for s in A['segments'] for w in s['words']]
wb = [(w['word'], round(w['start'],2), round(w['end'],2)) for s in B['segments'] for w in s['words']]
assert wa == wb  # True 2026-05-30
```
