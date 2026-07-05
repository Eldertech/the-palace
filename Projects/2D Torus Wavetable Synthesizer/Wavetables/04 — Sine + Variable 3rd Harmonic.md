---
title: 04 — Sine + Variable 3rd Harmonic
born: 2026-04-26
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: connects-to
    label: instruments
forward_vector: "I am the spec for the Sine + Variable 3rd Harmonic surface — a controlled third-harmonic bloom — geometry, file facts, and musical use — so a player can load and voice this surface without re-deriving the wavetable."
---
# 04 — Sine + Variable 3rd Harmonic

Fundamental plus continuously-varying 3rd harmonic. Y is depth.

![Heightmap](04_sine_plus_3rd_sweep.png)

## File

`04_sine_plus_3rd_sweep.wav` — mono, 32-bit float, 48 kHz, 1024 × 1024 = 1048576 samples (21.845 s).
Square wavetable: send `rows 1024` to the `2d.wave~` object before playback so the Y axis is sampled as densely as X.

## What it demonstrates

Row k = sin(phi) + (k/1023)*sin(3*phi), normalised per row. Pure sine at the top of the surface, sine + equal-amplitude 3rd harmonic at the bottom. Y is the modulator depth axis — the simplest possible 'FM-like' move without using FM.

## Musical use

A small but legible test of the project's central idea: by *changing the surface shape* via Y rather than modulating frequency, we get a spectral move that FM cannot produce as a first-class control. With Y as another phasor, every X cycle sees the surface's full Y range — the perceived timbre depends on the X:Y ratio.

## Notes

Useful baseline against which to compare the Tier-2 surfaces: any Tier-2 surface should feel *richer* than this one. If it doesn't, the surface design isn't using the additional dimensions it has access to.
