# Shepard Instrument — GSL Phase 3 source-two

Built cycle 13 of the Generative Sample Libraries steward
(2026-05-27) against:

- `gsl-steward-017` grant **SECOND-PALACE** — Phase 3 source-two is the
  Shepard Tone Synthesizer.
- `gsl-steward-020` grant **SHEPARD-DRIVES** — Shepard steward ships
  `shepard_synth.py`; GSL writes the thin adapter.
- `gsl-steward-023` grant **TWELVE-DRONES** — 12 static Stage-1 drones
  (one per chromatic pitch class), full keyboard coverage via SFZ.

## Status: rendered (AWAITING AUDITION)

Cycle 13 found that the Shepard steward had concurrently shipped
`shepard_synth.py` in the same batch run, so the GSL adapter went all
the way through render. Twelve drones are on disk, the 132-region SFZ
is written, and the full library loads in sforzando.

**Audition gate is still open.** Loudon must verify by ear:

1. The 7-octave Gaussian stack sounds coherent — one Shepard tone, not
   seven distinct octaves.
2. Pitch-class identities are clear when adjacent classes are played
   (C vs C# are different drones, not the same drone in slight detune).

If both pass, the library is done — Stage 1 of GSL+Shepard is shipped.
If either fails, the failure says something useful about either Stage 1
of Shepard or the adapter's parameter choices.

## What renders

- 12 WAVs at `samples/shepard_<PitchClass>.wav` — C, Cs, D, Ds, E, F,
  Fs, G, Gs, A, As, B. 6.0 s each, 44.1 kHz mono, 16-bit PCM.
- `shepard_instrument.sfz` — 132 regions across 12 `<group>` blocks.
  Every MIDI note 0..127 maps to the drone of its pitch class.
  `pitch_keytrack=0` and `loop_mode=loop_continuous` so the drone
  sustains as long as the key is held.
- `offsets.json` — per-file onset/offset map (mostly inert for
  steady-state drones; preserved for pipeline parity).
- `build-log.md` — full render record + audition checklist.

## Adapter shape

`generate.py` imports `shepard_synth.py` via `importlib` (UNEDITED) and
calls `render_pitch_class_drone(pitch_class, duration_s, sample_rate)` —
Shepard's convenience wrapper, written explicitly for this adapter per
the SHEPARD-DRIVES grant. Shepard's Stage-1 defaults are used as-is:
sigma=1.0 octave, centroid at C4 (log2 = 8.03), 7-octave stack C1..C7.

If a future cycle wants to override these (sweep sigma, move the
centroid), swap the body of `_call_shepard()` for a direct
`render_stage1(ShepardStage1Params(...))` call. That is the only
function that touches Shepard's surface.

## Pipeline reuse from Crystal / Phoneme Choir

- Onset detection (5 ms windowed RMS > −30 dBFS) + SFZ `offset=`
- 3 ms `ampeg_attack` fade-in to suppress any start-edge click
- Filename + folder convention (`<source>_<token>.wav` under
  `samples/`, instrument folder under `Projects/Generative Sample
  Libraries/`)
- Per-region `offset=` in the SFZ writer

## Python 3.14 wrinkle (fixed)

Loading `shepard_synth.py` via `importlib.util.spec_from_file_location`
failed on Python 3.14 because `@dataclass(frozen=True)` at module top
level can't resolve `cls.__module__` until the module is in
`sys.modules`. Fix: register the module in `sys.modules` BEFORE
`exec_module`. The fix is in `load_shepard_synth()` and is documented
inline.
