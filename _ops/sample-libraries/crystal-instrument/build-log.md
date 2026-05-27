# Crystal Instrument — Build Log (Phase 3 audition)

Built: 2026-05-27T12:19:58

## What this proves
The Interview pipeline now runs against a NON-Kokoro source: palace synthesis
(Hexagonal (Quartz)) from `Crystal Audio/crystal_synth.py`. The adapter imports
`synthesize_strike()` unedited and drives `base_freq` per MIDI note. This
unblocks promotion of the Interview skill out of draft.

## Source adapter
- `crystal_synth.py` imported via importlib; not modified.
- FREQ_ANCHOR='lowest_mode' -> lowest phonon lands exactly at base_freq.
- base_freq = 440 * 2**((midi-69)/12).
- Hexagonal DOS + registry decay_base; per-layer decay_exp / transient_decay
  model strike hardness as the "velocity" axis (physics gives no velocity).
- Strike-tone voicing (adapter only, gain=0.3): the raw hexagonal
  strike is a dense inharmonic bell whose loudest energy sits ~240-300 cents
  above its lowest partial, so it has no clear perceived pitch. A quiet
  fundamental (+octave) at base_freq is mixed in with the crystal's decay,
  giving a strike tone that matches the played note. This is an instrument-
  voicing choice in the adapter; crystal_synth.py is untouched.

## Reused from Phoneme Choir
- Onset detection (5 ms windowed RMS > -30 dBFS),
  SFZ `offset=`, 3 ms ampeg_attack fade.

## Audition unit
- 4 notes (C2,C3,C4,C5) x 2 velocity layers = 8 WAVs, 44100 Hz mono, 4 s.
- Filename convention: `crystal_<NoteName><Octave>_L<layer>.wav`

## Pitch verification (FFT peak in +/- band around target)
| Note | MIDI | Target Hz | Measured Hz | Cents error |
|---|---|---|---|---|
| C2 | 36 | 65.406 | 65.333 | -1.9 |
| C2 | 36 | 65.406 | 65.333 | -1.9 |
| C3 | 48 | 130.813 | 130.667 | -1.9 |
| C3 | 48 | 130.813 | 130.667 | -1.9 |
| C4 | 60 | 261.626 | 261.333 | -1.9 |
| C4 | 60 | 261.626 | 261.333 | -1.9 |
| C5 | 72 | 523.251 | 523.333 | +0.3 |
| C5 | 72 | 523.251 | 523.333 | +0.3 |

Worst |cents error| = 1.9.

## What a human still has to judge (the audition gate)
Timbre quality, whether the pitch *reads* as that note to the ear (inharmonic
partials can muddy perceived pitch), and whether the soft/hard layers feel like
the same instrument. The full keyboard batch waits on Loudon's ear.
