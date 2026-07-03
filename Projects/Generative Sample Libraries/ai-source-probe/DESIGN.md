# AI-source probe — Phase 3 source three

Grant on `gsl-steward-037` re-directed source three from a local WAV folder
to an **AI-audio-LLM probe**: generate a range of instruments at specified
pitches, verify each against `librosa` pitch detection, and report the
cents-error matrix. The point is not to ship an instrument — it is to find
out **which audio LLM, at which prompt shape, actually honors a pitch
target well enough to multisample.**

## The pipeline (one function per stage)

1. `render(instrument, target_hz, seed, adapter) -> wav_path` — one WAV per
   (instrument × target_hz × adapter × seed). Adapter is pluggable.
2. `verify(wav_path, target_hz) -> {measured_hz, cents_err, voiced_pct,
   confidence}` — librosa `pyin` over the sustained portion (post-onset
   trim, mid-30% window), aggregated by voiced-mean.
3. `matrix_run(instruments, pitches, adapters, seeds) -> results.jsonl` —
   the sweep.
4. `report(results.jsonl) -> report.html` — inline audio players +
   cents-error heatmap.

## The matrix (v0)

Instruments: `piano, violin, marimba, flute, bass, choir`  (6)
Pitches: `A2 (110), A3 (220), A4 (440), A5 (880)`  (4)
Adapters: whichever Loudon greenlights on `gsl-steward-038`.
Seeds: 2 per cell (to see stochastic spread).

= 6 × 4 × 2 = 48 renders per adapter. At SA3 `sketch` tier that is
~8 minutes on the local GPU. Cheap enough to iterate.

## Acceptance rule (informed by the Talking Keyboard lesson)

An adapter/instrument pair is "usable for multisampling" only if:
- `|cents_err|` ≤ **20** on ≥ **75%** of cells, AND
- `voiced_pct` ≥ **60%** on those cells.

Below that bar it's fine for texture, not for pitched multisamples. This
is the audition gate the Phase 2 Interview skill will point at when a
future job picks an AI-sub-agent source.

## Adapters

- `mock` — synthesized sine + light noise at `target_hz`. Not a real LLM;
  its only job is to prove the verify + report pipeline works end-to-end
  before any GPU cost is spent.
- `stable_audio` — Stable Audio Open (SA3), the local Shop Specialist
  (`Shop/Stable Audio Open.md`, `status: alive`). Prompt shape TBD; v0
  uses `"{instrument} playing a sustained note at pitch {note_name}, solo,
  clean, no reverb"`. **Prompt shape is the actual object under study.**
- `musicgen` (stub) — Meta MusicGen-melody, which accepts a melodic
  conditioning signal (a sine at target_hz) — the hypothesis is that
  melody conditioning outperforms text-only pitch specification.
- `audioldm2` (stub) — text-conditioned diffusion; sanity check against
  SA3.

## Open forks Loudon owns

- Which adapter to wire up first (see `gsl-steward-038`).
- Whether the prompt should name the pitch as a **note name** (`A4`), a
  **Hertz value** (`440 Hz`), a **solfège** (`la`), or a **descriptor**
  (`middle A`). This is the first sub-experiment once one adapter is
  live — probably a small A/B on one instrument.
