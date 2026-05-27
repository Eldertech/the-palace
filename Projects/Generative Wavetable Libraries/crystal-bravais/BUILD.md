# Crystal Bravais wavetable — Phase 1 build notes

## What this is
The first listenable proof for **Generative Wavetable Libraries** Phase 1. A
single wavetable whose position sweeps the seven Bravais crystal lattice
systems, most-symmetric to least-symmetric:

`cubic → hexagonal → tetragonal → rhombohedral → orthorhombic → monoclinic → triclinic`

Seven synthesized single-cycle keyframes are interpolated up to a **64-frame**
table and written as the **Ableton-Wavetable fallback format**: mono 16-bit PCM,
**1024 samples/frame**, no vendor metadata chunk. Output: `crystal_bravais_ableton.wav`.

Run: `python3 generate.py` (numpy only; written against numpy 2.2).

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

## What is on hold
The **Serum / CLM binary writer is NOT built here.** It stays on hold until a
known-good reference Serum WAV is confirmed on the Mac (so the `clm ` chunk
layout can be matched against a real file rather than guessed). This proof
deliberately ships only the Ableton fallback so there is something to listen to
now.

## Verification done at build time
- WAV exists, non-empty.
- Sample count = 64 × 1024 = 65,536; mono; 16-bit; 44100 Hz.
- The author (a text agent) **cannot hear** the file. Whether the sweep reads as
  intentional musical motion is exactly what the audition gate is for.
