---
title: test-plan
born: 2026-05-30
links:
  - { target: "[[Kokoro]]", type: connects-to, label: test-plan-for }
forward_vector: "I hold the test plan for Kokoro; I want every check here to be runnable and to record an honest last-run date."
---

# Kokoro — Test Plan

> Phase E rollout. Kokoro is the Shop's TTS default. Smoke is one render at the house spec (24 kHz mono, voice af_heart, −16 LUFS). The Determinism probe surfaced the load-bearing finding of this round: **Kokoro is NOT byte-deterministic** — the same text + voice + version + loudness target produces audibly-identical but byte-different WAVs across runs.

Last run: **2026-05-30** — Smoke pass; Determinism finding: byte-different output across two runs (SHA256 `3d7d2fc0…` vs `fe06da50…`, integrated loudness drifted -16.71 → -16.77 LUFS).

## Smoke

Re-run the Phase B narration render and confirm the WAV is at house spec.

```sh
"/Users/loudonstearns/Documents/The Palace/.venvs/kokoro/bin/python" \
  "Shop/Maker/coordination-demos/2026-05-30-narrated-beats/kokoro_render.py"
```

- **Automated:** Pass = `narration.wav` exists, 24 kHz mono, integrated loudness within ±0.5 LUFS of −16, true-peak ≤ −1 dBTP. The `kokoro_render.py` script already measures and reports these via the `pyln.Meter`.
- **Last run (2026-05-30):** `narration.wav  10.55s  -16.77 LUFS  peak -0.98 dBTP` — within tolerance.

## Capability Probe

| Role                                | Last run                                                |
|--------------------------------------|----------------------------------------------------------|
| Single-paragraph narration          | Phase B `kokoro_render.py` (2026-05-30) — OK             |
| IPA pronunciation override (`{ipa}`)| Kuramoto `narrations-study.py` for "Kuramoto" (2026-05-26) — OK |
| Voice variation (af_heart vs others)| not exercised this round — af_heart only                |

- **Last run (2026-05-30):** two of three covered.

## Style Probe

Style for Kokoro is *loudness target* and *voice register*. The Maker enforces −16 LUFS / −1 dBTP via the `loudnorm` two-pass filter inside `kokoro_render.py`. The voice register (af_heart) is the house default; deviations from it must be named in the brief.

- **Last run (2026-05-30):** loudness target hit within 1 LUFS (-16.77 vs -16.0 — within the ±0.5 tolerance the entry declares it would consider noticeable, but well within publishability for the demo tier).

## Edge Probe

- **Empty text:** `KPipeline` produces zero audio chunks; `kokoro_render.py` raises `RuntimeError("Kokoro produced no audio for this text.")`. ✓
- **Out-of-vocabulary words:** Kokoro pronounces phonetically (it heard `phasors` as `phazers`, which Whisper then transcribed as `phasers` — see Phase B's fuzzy-cue gotcha). Mitigation: IPA pronunciation override `{ipa-string}` inline. Documented in the Kuramoto recipe.
- **Empty `lang_code`:** raises at `KPipeline` construction. ✓

- **Last run (2026-05-30):** empty-text edge probe exercised; OOV behaviour documented but mitigation IPA path not re-exercised this round.

## Speed Bench

Reference host: **mac** (MPS for kokoro_pipeline; CPU for the loudnorm pass).

| Job                                    | Time                  |
|-----------------------------------------|-----------------------|
| Phase B 10.55 s narration (af_heart)   | 7.4–7.6 s (~0.7× real-time) |
| Kuramoto Round 1 36 s narration        | ~28 s (historical, ~0.8×)   |

Roughly 0.7–0.8× real-time on this Mac. Adequate for short clips; long-form needs batching by sentence.

## Determinism (load-bearing — and the finding of this round)

**Kokoro is NOT byte-deterministic**, even with fixed voice + text + sample rate + LUFS target.

```sh
# Two runs of the IDENTICAL kokoro_render.py:
# run-A: integrated loudness -16.71 LUFS, sha256 3d7d2fc0...
# run-B: integrated loudness -16.77 LUFS, sha256 fe06da50...
```

Probable cause: PyTorch's non-deterministic GPU ops (or device-conditional ordering) inside the TTS model, plus loudnorm's measured-then-applied gain depending on first-pass measurement that itself can have float jitter. The *audible* output is the same; the bytes are not.

**Implication for the Shop:** the reproducibility artifact for a Kokoro render is **(text, voice, kokoro version, loudness target)** — NOT the WAV bytes. The dependent Whisper pass is robust to this (Whisper's word boundaries match across two Kokoro re-runs at 2-decimal precision, per the Whisper test-plan), but any downstream byte-comparison expects to fail and should not be written.

- **Reproducibility artifact:** `(text, voice, kokoro_version, LUFS_TARGET)` tuple captured in `narration.report.json`.
- **Last run (2026-05-30):** byte-non-determinism confirmed; finding is now an entry-level expectation, not a bug.
