---
title: 03 — Duty Cycle Morph
type: meta
pillars:
  - tools
  - creation
born: 2026-04-26
stage: sprout
status: active
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: connects-to
    label: instruments
---
# 03 — Duty Cycle Morph

Square (50%) tapering smoothly to a 3% pulse. Y is duty cycle.

![Heightmap](03_duty_cycle_morph.png)

## File

`03_duty_cycle_morph.wav` — mono, 32-bit float, 48 kHz, 1024 × 1024 = 1048576 samples (21.845 s).
Square wavetable: send `rows 1024` to the `2d.wave~` object before playback so the Y axis is sampled as densely as X.

## What it demonstrates

Square wave with duty cycle smoothly tapering from 50% (row 0) to 3% (row 1023). The Y axis is pulse width.

## Musical use

PWM via Y modulation. A slow Y phasor (~0.2–2 Hz) gives classic PWM motion. An audio-rate Y phasor modulates the duty cycle thousands of times per second, growing whole new sideband families on the spectrum. This is the cleanest Tier-1 demo of audio-rate Y as a useful musical move rather than just a noise source — the square wave's only nonzero Fourier coefficients are at odd m, so the (m, n) spectrum is particularly clean and readable.

## Notes

Every row has a hard square-wave edge — these will alias if pushed high. For musical use the upper rows (narrow pulses) want a low-pass filter behind them.
