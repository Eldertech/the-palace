# Crystal Bravais wavetable — Phase 1 build notes

## What this is
The first listenable proof for **Generative Wavetable Libraries** Phase 1. A
single wavetable whose position sweeps the seven Bravais crystal lattice
systems, most-symmetric to least-symmetric:

`cubic → hexagonal → tetragonal → rhombohedral → orthorhombic → monoclinic → triclinic`

Seven synthesized single-cycle keyframes are interpolated up to a **64-frame**
table and written in **two** formats from one run:

- `crystal_bravais_ableton.wav` — Ableton Wavetable fallback: mono 16-bit PCM,
  **1024 samples/frame**, no vendor metadata chunk.
- `crystal_bravais.wav` — Serum / CLM format (cycle 6, 2026-05-27): mono
  32-bit float, **2048 samples/frame**, with a `clm ` ASCII payload.
  Reads in Serum, Vital, Surge XT, Pigments, Phase Plant, UVI Falcon.

Run: `python3 generate.py` (numpy only; written against numpy 2.2). The CLM
writer lives in `clm_writer.py`; running it directly as a script runs a
byte-for-byte self-test against the reference fixture.

## The zero-phase-reset choice
Loudon's answer to `gwl-steward-004` was **`zero_phase_reset`**. Every frame is
synthesized starting from phase 0 — all partials are pure sines phase-locked to
the fundamental. No phase is carried from one frame to the next. The payoff is
clean, predictable position sweeps with no phase-drift smearing between adjacent
frames. The cost: the morph is purely spectral, which can read as "tame." If it
does, the next move is to expose a `carry_phase_through` variant rather than
replace this one.

## The simplified partial model (honest caveat)
This is **not** a physically rigorous lattice/phonon model. It is a deliberate
sketch that maps lattice **symmetry** to **timbre** along four knobs per system:

- **n_partials** — high symmetry = sparse, pure spectrum (cubic = 3 partials);
  low symmetry = dense, busy spectrum (triclinic = 36).
- **rolloff** — amplitude decay exponent; higher symmetry rolls off faster
  toward a near-sine, lower symmetry stays brighter/buzzier.
- **detune_cents** — inharmonic detune applied to upper partials, scaled by
  partial index (fundamental never detuned, so pitch stays anchored). Cubic = 0
  (perfectly harmonic); triclinic rings most inharmonically.
- **odd_bias** — gently favours odd harmonics as symmetry drops (hollower tone),
  loosely standing in for lost mirror planes/axes.

The ordering follows decreasing point-group symmetry — that is the spine of the
sweep. The numbers are tuned for an audibly **intentional** progression, not for
crystallographic correctness. Treat it as a first proof.

## The CLM / Serum writer (added cycle 6)
On 2026-05-27 Loudon resolved `gwl-steward-009` with `POINT-AT-WAV`, naming
the Serum 2 factory wavetable folder at
`/Library/Audio/Presets/Xfer Records/Serum 2 Presets/Tables/Analog/`. The
fixture `Basic Shapes.wav` was copied into
`Projects/Generative Wavetable Libraries/_reference/` and the binary
layout reverse-engineered from there:

- `RIFF / WAVE` container
- 28-byte `JUNK` alignment pad (zero bytes)
- `fmt ` chunk, audio_format=3 (IEEE float), 1 ch, 44100 Hz, 32-bit
- `clm ` chunk, 48 bytes ASCII:
  `<!>2048 01000000 wavetable (www.xferrecords.com)`
- `data` chunk, little-endian float32

`clm_writer.py` reproduces this byte-for-byte. Its `__main__` parses the
reference, re-writes it via the writer, and diffs — at cycle 6 build time
this **passes** (rebuilt file identical to the 57480-byte original).

## Verification done at build time
- Both WAVs exist, non-empty.
- Ableton fallback: 64 × 1024 = 65,536 samples; mono; 16-bit; 44100 Hz.
- Serum/CLM: 64 × 2048 = 131,072 samples; mono; float32; 44100 Hz;
  chunk order `JUNK / fmt / clm / data` matching the Serum factory.
- The CLM writer is verified byte-for-byte against `Basic Shapes.wav`.
- The author (a text agent) **cannot hear** either file. Whether the sweep
  reads as intentional musical motion is exactly what the audition gate is
  for.
