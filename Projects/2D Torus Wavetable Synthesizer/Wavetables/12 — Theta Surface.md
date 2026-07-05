---
title: 12 — Theta Surface
born: 2026-04-26
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: connects-to
    label: instruments
forward_vector: "I am the spec for the Theta Surface — a theta-function landscape read as a wavetable — geometry, file facts, and musical use — so a player can load and voice this surface without re-deriving the wavetable."
---
# 12 — Theta Surface

Jacobi-theta-style surface on T^2. Modular character.

![Heightmap](12_theta_surface.png)

## File

`12_theta_surface.wav` — mono, 32-bit float, 48 kHz, 1024 × 1024 = 1048576 samples (21.845 s).
Square wavetable: send `rows 1024` to the `2d.wave~` object before playback so the Y axis is sampled as densely as X.

## What it demonstrates

W = Sum_{m,n=-6..6} q^(m^2+n^2) * cos(m*phi + n*psi) with q = 0.55. This is closely related to the heat kernel on T^2, which is the Jacobi theta function evaluated at a specific imaginary time. The spectrum has every 2D Fourier mode populated with a Gaussian-tapered amplitude — radial 1/f-style decay, isotropic on the lattice.

## Musical use

Because every (m,n) mode contributes, every integer frequency combination f_{m,n} = m*omega_1 + n*omega_2 produces audible output — densely populated spectrum. This is the surface to use when you want a complex, 'every harmonic and inharmonic is present' wash. Set X and Y to nearby frequencies (e.g. X=110, Y=109.7) and the near-rational beating pattern is rich and slow.

## Notes

Logic: direct Fourier (Logic 1) with theta-function-inspired coefficient pattern. Modular symmetry of theta is approximate here — true PSL(2,Z) action requires the complex modular parameter tau, not a single real q. A future variant that genuinely exploits the modular symmetry is a candidate for a logic-tier wavetable.
