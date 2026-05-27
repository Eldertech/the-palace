# Crystal Instrument — Build Log (Phase 3 full chromatic)

Built: 2026-05-27T12:52:48

## What this ships
The full chromatic Hexagonal (Quartz) instrument — 88 notes (A0..C8)
x 2 velocity layers = 176 WAVs + a single
multi-region SFZ. All settings carried forward unchanged from the cycle-8
audition unit, which Loudon approved with `option_id=APPROVE` on
`gsl-steward-012`.

## Source adapter (unchanged from audition)
- `crystal_synth.py` imported via importlib; not modified.
- FREQ_ANCHOR='lowest_mode' -> lowest phonon lands exactly at base_freq.
- base_freq = 440 * 2**((midi-69)/12).
- Hexagonal DOS + registry decay_base; per-layer decay_exp / transient_decay
  model strike hardness as the "velocity" axis.
- Strike-tone voicing (adapter only, gain=0.3): a quiet
  fundamental+octave at base_freq is mixed in with the crystal's decay so
  the bell has a clear strike tone matching the played note. APPROVED by
  Loudon on gsl-steward-012.

## Reused from Phoneme Choir
- Onset detection (5 ms windowed RMS > -30 dBFS),
  SFZ `offset=`, 3 ms ampeg_attack fade.

## Output
- 176 WAVs, 44100 Hz mono 16-bit, 4 s.
- Filename convention: `crystal_<NoteName><Octave>_L<layer>.wav` (sharps).
- SFZ: `crystal_instrument.sfz` — per-key regions, two velocity groups.

## Pitch verification (FFT peak around target — sample rows)
| Note | MIDI | Target Hz | Measured Hz | Cents error |
|---|---|---|---|---|
| A0 | 21 | 27.5 | 27.333 | -10.5 |
| A0 | 21 | 27.5 | 27.333 | -10.5 |
| A#0 | 22 | 29.135 | 29.333 | +11.7 |
| A#0 | 22 | 29.135 | 29.333 | +11.7 |
| F4 | 65 | 349.228 | 349.333 | +0.5 |
| F4 | 65 | 349.228 | 349.333 | +0.5 |
| F#4 | 66 | 369.994 | 370.0 | +0.0 |
| F#4 | 66 | 369.994 | 370.0 | +0.0 |
| B7 | 107 | 3951.066 | 3951.333 | +0.1 |
| B7 | 107 | 3951.066 | 3951.333 | +0.1 |
| C8 | 108 | 4186.009 | 4186.0 | -0.0 |
| C8 | 108 | 4186.009 | 4186.0 | -0.0 |

Worst |cents error| across all 176 files = 12.7. Mean |error| = 2.0.

(Full pitch report lives in `offsets.json`.)

## What changed from cycle 8 (the audition)
- NOTES expanded from 4 (C2,C3,C4,C5) to 88 (A0..C8).
- SFZ extended to 176 regions across the same two groups.
- All voicing parameters (FUNDAMENTAL_GAIN, decay_exp, transient_decay,
  AMPEG_ATTACK_S, ONSET thresholds) identical to the audition build.
- BUILD_DIR now correctly points to the project bundle at
  `Projects/Generative Sample Libraries/crystal-instrument/` (cycle 8's
  generate.py had a stale `_ops/sample-libraries/` path even though its
  artifacts landed under Projects/).
