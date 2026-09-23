# AI-source probe — Phase 3 source three

Can an audio model play a note we ask for, steadily enough to multisample?
Loudon's grant on `gsl-steward-037` framed the test: ask a range of
instruments for specific pitches, check each render with librosa. His grant
on `gsl-steward-040` (BOTH-PARALLEL) set the arms: Stable Audio and MusicGen,
head to head, in one report.

## Run it (on the Mac)

```
bash "Projects/Generative Sample Libraries/ai-source-probe/run-on-mac.sh"
```

It builds what it needs on first run, renders every arm, grades every
render, and opens `compare.html`. `--quick` does 8 cells per arm instead of
48; `--only <arm>` reruns one arm and keeps the others' results.

## The arms

| arm | what hears the pitch | runs in |
|---|---|---|
| `crystal` | exact — the shipped Crystal instrument (reference, not a model) | `.venvs/gsl-probe` |
| `stable_audio` | the prompt only ("…playing note C4 (pitch 261.63 Hz)…") | `_tools/stable-audio-3/.venv` |
| `musicgen_melody` | the prompt + a sine at the target as melody guide | `.venvs/musicgen` |
| `musicgen_text` | the prompt only — same model, no guide (the control) | `.venvs/musicgen` |

Every text arm hears the same prompt (`adapters/_common.py`), so the
comparison is between models and guides, not prompts. The two MusicGen arms
share one checkpoint, so the gap between them measures the guide itself.

A prediction the run can falsify: MusicGen reads its guide as a chromagram,
which knows the note but not the octave. The melody arm should land on the
right note more often than in the right octave.

`mock` (a perfect tone) and `mock_flawed` (seeded, simulated flaws) are test
arms for the grader. They never appear in the model comparison.

## The matrix

6 instruments (piano, violin, marimba, flute, bass, choir) × 4 notes
(A2, E3, C4, G5 — four different note names across the same span) ×
2 seeds = 48 cells per arm. `matrix.json` holds it.

## The grade (verify.py)

The grader tracks pitch frame by frame (librosa pyin; a numpy YIN when
librosa is absent) over the body of the note, two octaves either side of
the target. Then it asks two separate questions:

- **Does it hold still?** stable = voiced ≥ 60% ∧ spread ≤ 30¢ ∧ dominance ≥ 80%
  - stable = (share of frames that have a pitch) ≥ 60% ∧ (width of the middle half of the pitch readings) ≤ 30¢ ∧ (share of frames within ±50¢ of their median) ≥ 80%
- **Did it land where we asked?** on_target = stable ∧ |cents_err| ≤ 20¢
  - on_target = stable ∧ |distance from the note we asked for| ≤ 20¢

Three grades follow: **on target**, **retunable** (stable, but off; any
octave), **texture** (not stable). A sampler can fix a wrong note with
`pitch_keycenter` + `tune`. It cannot fix a wandering one. Every stable
render carries the SFZ values it would need.

An instrument passes on an arm when 75% of its cells are on target
(ON TARGET) or at least retunable (RETUNABLE); otherwise TEXTURE ONLY.

For a stable render the exact pitch comes from a YIN median in a ±100¢
band around the tracker's reading, because pyin alone reports on a 10-cent
grid. A whole-window autocorrelation was tried for this job and rejected:
the crystal's inharmonic partials pulled it up to 22¢ flat where pyin, YIN
and an FFT peak agreed within 2¢.

## What is checked, and on what

Checked here: all 48 `mock_flawed` cells land in the grade their simulated
flaw should earn, under both pyin and YIN; the crystal reference grades 48
of 48 on target, worst 1.85¢, under both trackers; the perfect mock reads
within 0.32¢. The dry-run page is `compare.dry-run.html`.

Not yet run anywhere: either model. The SA3 load/generate call is the one
proven in `Kuramoto Coupling/atmospheric-beds-sa3.py`; the adapter passes
steps / cfg_scale / seed only if `generate()` names them. The MusicGen
adapter follows the transformers MusicgenMelody API as documented and has
not executed. Its weights are CC-BY-NC 4.0, so any library sampled from
those two arms cannot be sold.

## Files

`run-on-mac.sh` · `probe.py` (render / verify one arm) · `verify.py` (the
grade) · `compare.py` (the head-to-head page + `compare.json`) ·
`matrix.json` · `adapters/`. Each arm leaves `renders.<arm>.jsonl`,
`results.<arm>.jsonl`, and WAVs under `samples/<arm>/`.

## After the run

The next open question is prompt shape: whether a model does better with
the pitch as a note name (`C4`), a frequency (`261.63 Hz`), or a
description (`middle C`). Run it as a small A/B on whichever arm wins.
