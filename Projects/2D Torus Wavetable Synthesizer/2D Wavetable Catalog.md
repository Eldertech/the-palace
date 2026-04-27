---
title: 2D Wavetable Catalog
type: hub
pillars:
  - tools
  - creation
born: 2026-04-26
stage: growing
status: active
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: connects-to
    label: catalogues
  - target: "[[2D Torus Wavetable Synthesizer — Build Log]]"
    type: connects-to
    label: chronicled-by
  - target: "[[Torus Warping Catalog]]"
    type: couples-with
    label: voices-to-hands
---
# 2D Wavetable Catalog

Catalog of 2D wavetable surfaces for [[2D Torus Wavetable Synthesizer]]. Each entry has a
`.wav` file (mono, 32-bit float, 48 kHz), a heightmap PNG preview, and a markdown index
entry describing what the surface demonstrates and how to use it musically.

Catalog convention: filenames begin with a numeric prefix that doubles as catalog order.
00 is the diagnostic; 01–09 are reserved for utility (Tier 1) wavetables; 10–19 are named
surfaces (Tier 2). All catalog entries past 00 are square (1024 × 1024) so audio-rate
Y phasors don't introduce row-stepping aliasing.

## Tier 0 — Diagnostic

- [[00 — Test Diagnostic Wavetable]] — 1024 × 1024 (rebuilt to match the catalog
  convention). Same 16 anchor waveforms as the original Stage-1 design, sitting at
  Y = k/16, with smooth crossfade between them across the 63 sub-rows in each segment.
  Static (Y held) tests behave exactly as designed; audio-rate Y reads as a smooth
  morph through all 16 anchors.

## Tier 1 — Utility (1024 × 1024)

Send `rows 1024` to `2d.wave~`. Each Tier-1 wavetable is a smooth Y-axis morph between
adjacent integer-cycle (or integer-partial) waveforms — Y now reads as a continuous
timbral parameter rather than 16 discrete steps.

- [[01 — Sine Cycle Sweep]] — Continuous cycle-count sweep, 1 → 16. Y is the harmonic-number axis.
- [[02 — Partial Stack Sweep]] — Saw partials built up smoothly, 1 → 16. Y is harmonic richness.
- [[03 — Duty Cycle Morph]] — Square (50%) tapering smoothly to a 3% pulse. Y is duty cycle.
- [[04 — Sine + Variable 3rd Harmonic]] — Fundamental plus continuously-varying 3rd harmonic. Y is depth.


## Tier 2 — Named Surfaces (1024 × 1024)

Send `rows 1024` to `2d.wave~`. Buffer length is 1024 × 1024 = 1 048 576 samples
(≈ 21.85 s at 48 kHz, ≈ 4 MB per file as 32-bit float). These six surfaces are the
project's [[2D Torus Wavetable Synthesizer]] §"Seven Surfaces" minus the unspecified
seventh slot.

- [[10 — Membrane]] — Rectangular drum-head modes summed at low order. 4-fold symmetric.
- [[11 — Chladni Ghost]] — Vibrating-plate nodal pattern, sharpened to ridges. 4-fold.
- [[12 — Theta Surface]] — Jacobi-theta-style surface on T^2. Modular character.
- [[13 — Stiff String]] — Saw whose high partials are quadratically stretched as Y rises.
- [[14 — Knot Shadow]] — (3,2) torus-knot-aligned ridges. The ratio gate made visible.
- [[15 — Penrose Lattice]] — 5-fold quasicrystal approximation via cut-and-project sum.


## Tools

- [`Tools/visualize_wavetable.py`](Tools/visualize_wavetable.py) — render any wavetable WAV
  to a PNG heightmap (or stacked-row, or both).
- [`Tools/build_catalog.py`](Tools/build_catalog.py) — regenerate every Tier-1 and Tier-2
  entry from scratch (idempotent).
- [`Tools/rebuild_diagnostic.py`](Tools/rebuild_diagnostic.py) — regenerate
  [[00 — Test Diagnostic Wavetable]] independently of the catalog.

## Status

Verified working as of 2026-04-26. Loudon's evaluation of the 1024×1024 build:
"these wavetables work well." All 11 entries play as designed; Tier 2 surfaces respond
to X:Y ratio detuning the way the project's central design fact predicts.

## Open question — Y-axis interpolation strategy

Linear sample-domain interpolation between dissimilar anchor waveforms drops RMS at the
midpoint. RMS-vs-Y plots in `Wavetables/_rms_diagnostic.png` and `_rms_tier1.png` show
the issue clearly — the diagnostic's sine → sawtooth transition is the worst case
(~10 dB midpoint drop, due to the negative ⟨sin, saw⟩ inner product); the
sine-cycle-sweep has 15 ~3 dB dips per traversal at every integer-cycle boundary. The
duty-cycle morph and 3rd-harmonic sweep are flat (correlated anchors); Tier 2 surfaces
are not affected (smooth 2D continuous functions, not anchor crossfades).

Three candidate fixes are live: equal-power crossfade, constant-RMS post-normalization,
spectral-domain interpolation. Constant-RMS is the cheapest robust answer for the
diagnostic and 01_sine_cycle_sweep when the dip becomes annoying; spectral-domain is
the right tool when we get to surfaces that interpolate between symmetry classes
(Membrane ↔ Chladni). Decision deferred — the current build is musical enough to keep
moving. See [[2D Torus Wavetable Synthesizer — Build Log]] §"The level-dip discovery"
for the math and the trade-off table.

## Forward vectors

Concrete next-step candidates this catalog suggests:

- **The Seventh Surface.** [[2D Torus Wavetable Synthesizer]] §"Seven Surfaces" leaves
  the seventh slot open; the catalog gap is itself a forcing function. Candidates: a real
  Kuramoto-bake (Logic 3); a Matérn random-field (Logic 4); a log-likelihood-of-
  statistical-model surface (Logic 5).
- **(p,q) family.** [[14 — Knot Shadow]] is the (3,2) instance. (5,2), (5,3), (7,3)
  variants are minutes each in `build_catalog.py` and would give a comparable family demo.
- **Symmetric morph stack.** Both 4-fold surfaces ([[10 — Membrane]] and
  [[11 — Chladni Ghost]]) can be crossfaded coefficient-by-coefficient — a single
  1024×1024 file whose Y axis interpolates between them. This is the natural place to
  first deploy spectral-domain interpolation.
- **RNBO prototype.** Smallest playable instance: one surface (recommended start:
  [[14 — Knot Shadow]]), two phasors, ratio knob, audible output. ~30 lines of
  `codebox~`. The catalog is the raw material; this is the conversion to a real-time
  instrument.
- **Constant-RMS rebuild of [[00 — Test Diagnostic Wavetable]] and
  [[01 — Sine Cycle Sweep]]** when the level dip becomes annoying. Cheap.
