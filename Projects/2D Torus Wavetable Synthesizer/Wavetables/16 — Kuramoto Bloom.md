---
title: 16 — Kuramoto Bloom
born: 2026-06-06
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: connects-to
    label: instruments
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: bakes-in
forward_vector: "I am the spec for the Kuramoto Bloom surface — coupled-oscillator synchronization baked into the geometry, with file facts and musical use — so a player can load and voice this surface without re-deriving the wavetable."
---
# 16 — Kuramoto Bloom

Logic 3 (dynamical systems). The Kuramoto coupling term `sin(phi - psi)` is folded into the phase of every mode in the bloom, so straight ridges bend into S-curves and gather toward the synchronization diagonal. The bifurcation made into a surface.

![Heightmap](16_kuramoto_bloom.png)

## File

`16_kuramoto_bloom.wav` — mono, 32-bit float, 48 kHz, 1024 × 1024 = 1 048 576 samples (≈ 21.85 s). Send `rows 1024` to `2d.wave~` before playback.

## What it demonstrates

A small ring of coupled modes — `(1,1), (2,1), (1,2), (3,2), (2,3), (3,1), (1,3), (4,3), (3,4)` — each with its argument `m·phi + n·psi` displaced by `coupling · sin(phi − psi)`, plus a weak coherent backbone `0.5·cos(phi − psi)` along the lock diagonal. The result is the only catalog surface where the *phase* of every mode (not just the amplitude lattice) is shaped by dynamics. The diagonal lock-zone reads visually as a ridge running corner-to-corner; the off-diagonal modes bend around it.

## Musical use

This is the surface that puts the project's central thesis — *the harmonic-to-inharmonic boundary is a continuous geometric parameter* — into the *surface itself*, not only the scan ratio. Set X:Y = 1:1 exactly and the scan path runs along the lock diagonal: the backbone term dominates, the output is a stable phase-locked drone. Detune to 1.00:1.02 — the orbit drifts off the lock zone and the bent off-diagonal modes light up, one family at a time, as the path crosses each S-curve. The detune amount controls the rate at which you cross the bifurcation; the surface gives you the bifurcation as a place you can move through.

## Notes

Logic: dynamical systems (Logic 3) — the seventh-named-surface slot's original brief, picked from three candidates auditioned 2026-06-03 and greenlit 2026-06-05 with Loudon's instruction *"add slots and do 1 2 and 3"*. Sibling surfaces in the same expansion: [[17 — Matérn Field]] (Logic 4) and [[18 — Fisher Ridge]] (Logic 5). Together they close the five-generating-logics inventory the project's design language promised.
