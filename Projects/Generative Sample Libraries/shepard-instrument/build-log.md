# Shepard Instrument — Build Log (Phase 3 source-two)

Built: 2026-05-27T20:00:29

## What this proves
Phase 3 source-two for GSL — the Interview pipeline now runs against a
SECOND non-Kokoro source: the Shepard Tone Synthesizer's MINIMUM-ILLUSION
Stage 1. Demonstrates GSL-as-adapter against an external palace
synthesizer module written by a sibling steward (the SHEPARD-DRIVES split).

## Source adapter
- `shepard_synth.py` imported via importlib from `/Users/loudonstearns/Documents/The Palace/Projects/Shepard Tone Synthesizer/shepard_synth.py`; not modified.
- Single call surface: `render_pitch_class_drone(pitch_class, duration_s,
  sample_rate)` — Shepard's convenience wrapper written for the GSL adapter
  per the SHEPARD-DRIVES grant. Full parameter access via
  `render_stage1(ShepardStage1Params(...))` if a future cycle needs it.
- Stage 1 parameters: Shepard's Stage-1 defaults — 7-octave Gaussian stack
  (C1..C7), sigma=1.0 oct, centroid at C4. No motion.

## Sample library shape (TWELVE-DRONES grant)
- 12 WAVs (one per chromatic pitch class C..B), 6.0 s each, 44100 Hz mono.
- Filename convention: `shepard_<PitchClass>.wav` with sharps as `s` (Cs, Ds, ...).
- SFZ maps every MIDI note 0..127 to the drone of its pitch class (132 regions).
- `pitch_keytrack=0` and `loop_mode=loop_continuous` so the drone sustains.

## Reused from Phoneme Choir / Crystal
- Onset detection (5 ms windowed RMS > -30 dBFS),
  SFZ `offset=`, 3 ms ampeg_attack fade-in.
  (Likely inert for steady-state drones; kept for pipeline parity.)

## Files
| Name | Pitch class | Filename | onset_sample | offset_sample |
|---|---|---|---|---|
| C | 0 | shepard_C.wav | 38 | 38 |
| C# | 1 | shepard_Cs.wav | 48 | 48 |
| D | 2 | shepard_D.wav | 38 | 38 |
| D# | 3 | shepard_Ds.wav | 27 | 27 |
| E | 4 | shepard_E.wav | 18 | 18 |
| F | 5 | shepard_F.wav | 9 | 9 |
| F# | 6 | shepard_Fs.wav | 3 | 3 |
| G | 7 | shepard_G.wav | 14 | 14 |
| G# | 8 | shepard_Gs.wav | 11 | 11 |
| A | 9 | shepard_A.wav | 5 | 5 |
| A# | 10 | shepard_As.wav | 1 | 1 |
| B | 11 | shepard_B.wav | 4 | 4 |

## What a human still has to judge (the audition gate)
The 12 drones MUST be auditioned before any cross-keyboard playback. Two
questions only the ear can answer for a Stage 1 drone:
1. Does the 7-octave Gaussian stack sound coherent — one tone, not seven?
2. Are the pitch-class identities clear when adjacent classes are played?

The full 128-region SFZ (every MIDI note 0..127 → its pitch-class drone)
ships in the same pass because there is no per-note rendering — the audition
unit IS the full library. There is only one batch.

## Loop-point fix (GSL cycle 15, 2026-06-04)
The original SFZ declared `loop_mode=loop_continuous` but gave NO
`loop_start`/`loop_end`, so sforzando looped the WHOLE 6 s file. Analysis of
the renders this cycle found the synthesis applies a short fade-in at sample 0
(first 30 ms ramps from ~-39 dBFS up to the ~-11 dBFS steady body) but no
matching fade-out — so a whole-file loop wraps the loud tail straight onto the
quiet fade-in once per loop: an audible amplitude pump / tick every 6 s on any
held key. That breaks the one thing Stage 1 has to sell — a drone that
sustains forever and seamlessly.

Fix: each region now carries an explicit interior `loop_start`/`loop_end`
chosen at matched rising zero-crossings inside the steady body (~1.0 s in, a
~0.38–0.46 s window). Measured seam quality across all twelve: slope mismatch
~0 (max 6e-5), envelope discontinuity < 0.07 dB (worst F# at -0.064 dB) —
inaudible. F and F# were re-optimized for value-at-crossing as well. Per-file
loop points recorded in `loop_points.json`. Note count is 128, not the 132 the
original log claimed (the 0..127 → pitch-class mapping yields 8×11 + 4×10 = 128
regions); corrected here.
