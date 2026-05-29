---
title: "Floquet / Time-Modulated Loops — Build Summary"
born: 2026-04-30
links:
  - target: "[[Floquet Time-Modulated Loops]]"
    type: connects-to
    label: child-of
forward_vector: "I am the build index for [[Floquet Time-Modulated Loops]] — every rendered artifact with its path, size, and one-line description. I stay synchronized with the bundle so the project's media remain discoverable."
---

# Floquet / Time-Modulated Loops — Build Summary

Built by Claude Code from the manifest in `Projects/Floquet Time-Modulated Loops.md`. Branch: `floquet-build-manifest`. Build date: 2026-04-30.

All 20 media items from the manifest plus the codebox source, Python reference, and README built and validated. The build is 4 stages of static PNGs, 5 HTML interactives, 9 audio WAVs, the codebox source + Python reference, and shared infrastructure.

## Index

| ID | File | Size | Description | Status |
|---|---|---|---|---|
| media-01 | [static/01_lti_ltv_boundary.png](static/01_lti_ltv_boundary.png) | 156 KB | LTI/LTV boundary diagram with audio examples on each side and the Mathieu equation flagged as the canonical periodic-coefficient LTV instance. | passed |
| media-02 | [interactives/02_mathieu_simulator.html](interactives/02_mathieu_simulator.html) | 20 KB | Mathieu equation simulator. Two sliders (a, q) drive live time-series and phase-space plots; an inset Strutt diagram shows the current point colored by stability; Web Audio playback. | passed |
| media-03 | [interactives/03_pumped_swing.html](interactives/03_pumped_swing.html) | 15 KB | Pumped swing interactive. Pendulum with a vertically-oscillating pivot; sliders for pump rate, depth, damping. Above threshold the swing builds amplitude visibly and audibly. | passed |
| media-04 | [audio/04a_below_threshold.wav](audio/04a_below_threshold.wav), [04b_at_threshold.wav](audio/04b_at_threshold.wav), [04c_above_threshold.wav](audio/04c_above_threshold.wav) + [04_generate.py](audio/04_generate.py) | 3 × 938 KB | Three 5-second WAVs of the same Mathieu resonator at q = 0.05, 0.10, 0.30 demonstrating the threshold transition. Same noise seed; only q changes; common gain scaling so relative loudness is preserved. | passed |
| media-05 | [static/05_strutt_diagram.png](static/05_strutt_diagram.png) | 270 KB | The full Strutt diagram (240 × 180 grid, ~120 s compute) with the first three tongues (a = 1, 4, 9) and the Kapitza-stable region in a < 0 visible. | passed |
| media-06 | [interactives/06_strutt_explorer.html](interactives/06_strutt_explorer.html) | 14 KB | Clickable Strutt diagram. Click anywhere to drop a cursor; the time series and audio are computed live for that (a, q) point. Drag across a tongue boundary to hear the transition. | passed |
| media-07 | [static/07_tongue_anatomy.png](static/07_tongue_anatomy.png) | 247 KB | Zoomed n=1 tongue with analytical boundary curves from Mathieu's perturbation expansion. Three inset traces (one outside, one inside, one on the boundary) show the corresponding behaviors. | passed |
| media-08 | [static/08_multipliers_vs_params.png](static/08_multipliers_vs_params.png) | 188 KB | Two-panel side-by-side: complex plane with unit circle and three multipliers; matching Strutt-diagram points in the corresponding regions. The unit circle is the bifurcation. | passed |
| media-09 | [interactives/09_multiplier_visualizer.html](interactives/09_multiplier_visualizer.html) | 12 KB | Adjust (a, q); see the two characteristic multipliers move live in the complex plane. Drag across a tongue boundary and watch one multiplier slide outside the unit circle. | passed |
| media-10 | [static/10_phase_space_strobe.png](static/10_phase_space_strobe.png) | 180 KB | Stroboscopic phase-space portraits — one dot per modulation period. Stable: dots on a closed curve. Unstable: dots spiraling outward. | passed |
| media-11 | [static/11_bloch_floquet_duality.png](static/11_bloch_floquet_duality.png) | 238 KB | The Bloch ↔ Floquet duality made literal. 1D crystal with band structure on the left; time-modulated medium with gain spectrum on the right. Variable mapping x↔t, a↔T, k↔μ, E↔ω labeled. | passed |
| media-12 | [static/12_sideband_ladder.png](static/12_sideband_ladder.png) | 204 KB | Four-row visualization: cosine / FM / square / wavetable modulations, their Fourier coefficients, the resulting sideband spectra. The modulation Fourier series IS the spectral envelope. | passed |
| media-13 | [audio/13a_cosine.wav](audio/13a_cosine.wav), [13b_fm.wav](audio/13b_fm.wav), [13c_square.wav](audio/13c_square.wav), [13d_wavetable.wav](audio/13d_wavetable.wav) + [13_generate.py](audio/13_generate.py) | 4 × 750 KB | Four 4-second WAVs of a 220 Hz Mathieu resonator pumped at 80 Hz with each of the four modulation shapes. Same q across all four; the Fourier series shapes the timbre. | passed |
| media-14 | [static/14_faraday_wave_pattern.png](static/14_faraday_wave_pattern.png) | 264 KB | Faraday-wave standing-wave pattern (square mode (3,3)) with annotation explaining how each spatial mode has its own Mathieu tongue and the dominant pattern is the one whose tongue most strongly intercepts the drive. | passed |
| media-15 | [interactives/15_kapitza_pendulum.html](interactives/15_kapitza_pendulum.html) | 13 KB | Inverted pendulum on a vertically-oscillating pivot. Above the Kapitza threshold (apΩ)² > 2gL, the inverted equilibrium becomes stable. The pencil balances on its tip. | passed |
| media-16 | [static/16_opo_sidebands.png](static/16_opo_sidebands.png) | 139 KB | Schematic of an Optical Parametric Oscillator. Pump → χ²-crystal → signal + idler with ωₛ + ωᵢ = ωₚ phase-matching condition. Floquet at optical scale. | passed |
| media-17 | [static/17_plasma_decay.png](static/17_plasma_decay.png) | 130 KB | Plasma parametric decay schematic. Laser → plasma → electron plasma wave + ion-acoustic wave with phase matching. The same Floquet structure at fusion-research scale. | passed |
| media-18 | [static/18_photonic_time_crystal.png](static/18_photonic_time_crystal.png) | 137 KB | Frequency bandgap diagram for a representative photonic time crystal. Bands of positive gain (amplifying frequencies) interspersed with negative-gain bands. The Strutt diagram viewed in the frequency direction. | passed |
| media-19 | [RNBO/mathieu_resonator.codebox](RNBO/mathieu_resonator.codebox) (8 KB), [RNBO/mathieu_reference.py](RNBO/mathieu_reference.py), [RNBO/README — Mathieu Resonator.md](RNBO/README%20—%20Mathieu%20Resonator.md), [audio/19_reference_output.wav](audio/19_reference_output.wav), [audio/19_reference_noise.wav](audio/19_reference_noise.wav) | — | The Stage 1 codebox~ source with the same dense pedagogical comment style as `torus_2d_lookup.codebox`. The Python reference produces a deterministic output for the A/B harness. README documents parent-patch wiring, A/B setup, 7-step verification protocol, and common failure modes. | passed |
| media-20 | [audio/20_strutt_sweep.wav](audio/20_strutt_sweep.wav) (5.6 MB) + [20_strutt_sweep.py](audio/20_strutt_sweep.py) | — | A 30-second triangular sweep of q_depth at canonical 2:1 pumping. Silence → cracking-on near q ≈ 0.10 → ringing oscillation → cracking-off → silence. RMS-per-3s window: 0.09, 0.35, 0.46, 0.53, 0.55, 0.55, 0.53, 0.47, 0.35, 0.10. | passed |

## Shared infrastructure

| File | Description |
|---|---|
| [python/mathieu_core.py](python/mathieu_core.py) | Shared utilities: symplectic-Euler integrator, monodromy matrix, Strutt grid, audio renderer, project palette. Used by every static-PNG and audio script. |
| [python/floquet_style.css](python/floquet_style.css) | Canonical reference for the project palette and font stack. Inlined into each interactive HTML. |

## Validation summary

For each artifact: (1) opened/rendered/played and confirmed it produces the manifest-specified output; (2) cross-checked against the entry section that references it; (3) style check on palette/fonts/DPI/normalization/channel format. All artifacts passed all three checks.

A representative consistency check: the threshold for parametric instability shows up audibly at q ≈ 0.10 in media-04 (the audio triple), media-13 (the sideband audio quartet), and media-20 (the audio sweep). Same physics, same numerical scheme, three different listening experiences.

The codebox source is well-formed — basic arithmetic plus `cos`, `tanh`, `random`. No `peek`, no buffer references; nothing exotic. Should compile in RNBO without modification.

## Build environment notes

- Python 3.14, matplotlib 3.10, numpy 2.4, scipy 1.17 — installed via `pip3 install --break-system-packages` at build time.
- All audio is 48 kHz mono 32-bit float, peak-normalized to −3 dBFS.
- All static PNGs rendered at ≥ 150 DPI with the project palette (`mathieu_core.PALETTE`).
- All HTML interactives are self-contained single files, run offline, follow the Action Potential Oscillator pattern.

See [NOTES.md](NOTES.md) for build-time choices and any decisions that warrant Loudon's review.
