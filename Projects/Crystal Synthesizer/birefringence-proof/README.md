# Birefringence Proof — Ruby (R-3c trigonal)

The smallest test of the Crystal Synthesizer's optical-acoustic claim.

Built 2026-05-27 under TRICKSTER grant `resp-mpopik57-w02up5`
(option `PROVE-BIREFRINGENCE`, request `crystal-synth-steward-003`).

Recipe: [[Crystal Sonification Reference]] § Ruby — 7 Raman-active
modes, two symmetry families:

- **A1g** (2 modes, polarized along c-axis) → *extraordinary*
- **Eg**  (5 modes, polarized in basal plane) → *ordinary*

The near-doublet at r_n 1.10 / 1.14 is the acoustic signature of the
two polarizations almost-but-not-quite coinciding. At f₀ = 220 Hz
(A3) those modes land at **242.0 Hz** and **250.8 Hz** — a difference
of 8.80 Hz, which beats as a slow tremolo squarely in the natural-
chorus range.

## The five files

| # | File | What to listen for |
|---|------|---|
| 01 | `01_ordinary_only.wav` | 5 Eg modes alone. Coherent timbre, **no** shimmer in the low register. This is ruby with only one acoustic index. |
| 02 | `02_extraordinary_only.wav` | 2 A1g modes alone. Sparse two-tone register. Most of ruby's color lives in the ordinary family. |
| 03 | `03_birefringent_sum.wav` | All 7 modes summed. **The 8.8 Hz beat appears.** Empirically verified: the 235–260 Hz band envelope modulates from 0.004 to 0.283 at 8.89 Hz. This is the birefringence made audible. |
| 04 | `04_velocity_split_stereo.wav` | Extraordinary family detuned upward by 1.5 % (the declared metaphor stretch — real ruby is ~few %) and panned right. The two acoustic indices in two ears. Sum to mono and the beats appear, slightly faster. |
| 05 | `05_birefringence_arc.wav` | Single 14 s listening journey. 4 s ordinary alone → 4 s extraordinary alone → 6 s sum. **The structural argument: neither polarization in isolation shimmers; the shimmer emerges from their interference.** |

## Why this is the proof

The Crystal Synthesizer's [[Crystal Synthesizer|forward vector]] says it
will become a synthesizer that makes audible the *optical* properties
of crystals. The body lists birefringence as the central claim — and
ruby is the textbook case (the same crystal that gives you two
refractive indices in optics gives you two phonon velocities in
acoustics). Until now the page asserted this; these five files turn
the assertion into an artifact you can play.

The mathematics of why it must be so:

  Two phonons at frequencies f₁ and f₂ summed produce instantaneous
  amplitude proportional to:

      | cos(2π(f₁ − f₂)t / 2) |       (the slow beat envelope)
      × cos(2π(f₁ + f₂)t / 2)         (the fast carrier)

  In words: the slow beat frequency is the difference between the
  two partial frequencies, and the fast carrier sits at their mean.

  For ruby's birefringent doublet, f₁ − f₂ = 220 × (1.14 − 1.10)
                                          = 220 × 0.04
                                          = 8.80 Hz.

The beat is not a synthesis artifact. It is the symmetry of the
crystal speaking through the synth.

## What the next cycle could ask

- Does the velocity-split stereo image hold up on speakers, or only
  in headphones? (Real ruby would render both polarizations to both
  ears in any physical recording — the L/R split is a teaching device,
  not a model. Worth making the metaphor stretch explicit in the page.)
- Should we now do the same proof for emerald (hexagonal, P6/mcc, much
  richer mode structure — 174 phonon branches, the ring-breathing mode
  at r ≈ 1.68)? Birefringence is a hexagonal/trigonal family property
  in optics; if it transfers acoustically across the family, that's a
  much stronger claim than ruby alone.
- The dispersion-filter direction (DISPERSION-FILTER option from the
  cycle-1 ask) is still open — birefringence is one optical analogy
  audible; dispersion is the other half of the bridge.

## How to render again

```sh
cd "Projects/Crystal Synthesizer/birefringence-proof"
python3 render_birefringence.py
```

Dependencies: numpy, scipy. Sample rate 44.1 kHz, 16-bit PCM.
