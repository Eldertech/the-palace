---
title: "Compressor Design"
type: project
pillars: [tools, creation, philosophy]
born: 2026-01
stage: growing
status: complete
links:
  - target: "[[Boundary-Crossing Instruments]]"
    type: connects-to
  - target: "[[Harmonicity and Inharmonicity]]"
    type: connects-to
  - target: "[[Hyperdimensional Prism]]"
    type: connects-to
  - target: "[[Four Pillars]]"
    type: enables
  - target: "[[Granular Synthesis]]"
    type: connects-to
last_activated: 2026-03
activation_count: 1
---

# Compressor Design

A compressor built from first principles in Max/MSP Gen~ as a pedagogical device that teaches DSP mechanics explicitly. The design choice at every step is to make the invisible visible.

## FILO Circular Buffer RMS

Instead of `slide~` or exponential smoother, a FILO (First-In-Last-Out) circular buffer computes the running sum by adding the current sample and subtracting the oldest. This pedagogical choice is crucial: students see exactly what "averaging" means — not a black box formula but a literal window of samples. Each slot in the buffer IS a moment in time.

The 500-sample window is 11ms at 44.1kHz. This is below the perceptual attack threshold of ~20ms, but audible enough that students experience the trade-off concretely. When they increase the window to 1000 samples, the compressor becomes sluggish. When they shrink it to 100 samples, the response becomes twitchy. The number is no longer abstract — it is time they can hear.

## Soft Knee Mathematics

The soft knee is where the compressor becomes a teaching instrument. Three regions:

**Below threshold** (input < threshold - W/2): no compression, gain = input

**Above threshold** (input > threshold + W/2): full compression, gain = threshold + (input - threshold) / R

**In the knee** (the width W around threshold): quadratic interpolation blending the two regimes

The formula inside the knee reveals the underlying mechanics:

```
output = input + (1/R - 1) × (input - threshold + W/2)² / (2W)
```

The quadratic is not arbitrary. A sharp discontinuity in the gain curve is infinitely broadband in the frequency domain. The smooth quadratic transition has bounded Fourier content. The compressor's "character" — what makes it sound like itself — IS its frequency domain shape.

**Edge cases that reveal DSP maturity:**

- W=0 (hard knee): requires a branch condition. Students learn why conditionals exist.
- R=∞ (infinite compression = limiter): approaches a step function. Division by large numbers approaches zero.
- R=0 (infinite expansion): produces division by zero. Catches beginners who assume all gain reduction is positive.
- Fractional R < 1 (expansion): produces *negative gain reduction* — amplification instead. Expanders are compressors inverted, not a separate algorithm.

Each edge case is a teaching moment. By the time a student implements all four, they have internalized the topology.

## All-Pass Filters and Inharmonicity

The connection to [[Hyperdimensional Prism]] emerged in late February: all-pass filters shift phase without changing amplitude. Seemingly neutral. But a network of all-pass filters in a feedback path creates frequency-dependent phase accumulation. Different frequencies accumulate different total phase shift per round trip. This changes the period of resonance for each frequency independently, stretching or compressing the partial spacing.

An all-pass-based reverb tail is an inharmonic synthesizer in disguise.

This insight cascaded into the kaleidoscope interface concept: modulation and rotation as core functions, prism inside a kaleidoscope, natural connections to [[Harmonicity and Inharmonicity]], crystal formation, wallpaper group symmetry. The interface IS the physics. There is no distinction between the control surface and the signal processing — they are the same shape, made visible.

## Cross-Domain Resonance

The soft knee's quadratic blend is structurally identical to the easing curves used in animation and UI design. A designer and a DSP engineer are solving the same mathematical problem: how to smoothly transition between two states without introducing artifacts. This connection, once seen, cannot be unseen. It appears in [[Boundary-Crossing Instruments]] — the recognition that signal flow and information flow are the same topology, expressed in different materials.

The Gen~ implementation serves [[Four Pillars]]: the Tools pillar through explicit DSP; the Creation pillar through the artifact itself; the Philosophy pillar through the questions each edge case raises about discretization, feedback, and nonlinearity; the Practice pillar through the discipline of pedagogical clarity.

