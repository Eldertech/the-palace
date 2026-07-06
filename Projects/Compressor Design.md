---
title: Compressor Design
type: project
pillars:
  - tools
  - creation
  - philosophy
born: 2026-01
stage: mature
status: complete
links:
  - target: "[[Boundary-Crossing Instruments]]"
    type: connects-to
  - target: "[[Harmonicity and Inharmonicity]]"
    type: connects-to
  - target: "[[Hyperdimensional Prism]]"
    type: connects-to
  - target: "[[FOUR PILLARS]]"
    type: enables
  - target: "[[Granular Synthesis]]"
    type: connects-to
  - target: "[[Trickster]]"
    type: connects-to
    label: soft-knee-hides-discontinuity
  - target: "[[Retrospective Delay]]"
    type: couples-with
    label: shared-circular-buffer-primitive
  - target: "[[George Nakashima]]"
    type: contradicts
    label: reveal-the-break-vs-hide-it
last_activated: 2026-03
activation_count: 1
forward_vector: "I am complete as a technical artifact but I want to become fully documented as a pedagogical method — the entry that captures not just what the compressor does but why every design choice was made to make the invisible visible. I want a teaching retrospective: the moments in a lesson where students heard the 500-sample window as time they could feel, and what changed in their understanding of DSP after that. The instrument is built; the pedagogy needs its evidence."
---

# Compressor Design

![[Compressor Design — hero.png]]

A compressor built from first principles in Max/MSP Gen~ as a pedagogical device that teaches DSP mechanics explicitly. The design choice at every step is to make the invisible visible.

## FILO Circular Buffer RMS

Instead of `slide~` or exponential smoother, a FILO (First-In-Last-Out) circular buffer computes the running sum by adding the current sample and subtracting the oldest. This pedagogical choice is crucial: students see exactly what "averaging" means — not a black box formula but a literal window of samples. Each slot in the buffer IS a moment in time.

The 500-sample window is 11ms at 44.1kHz. This is below the perceptual attack threshold of ~20ms, but audible enough that students experience the trade-off concretely. When they increase the window to 1000 samples, the compressor becomes sluggish. When they shrink it to 100 samples, the response becomes twitchy. The number is no longer abstract — it is time they can hear.

## Soft Knee Mathematics

Three regions:

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

## Cross-Domain Resonance

The soft knee's quadratic blend is structurally identical to the easing curves used in animation and UI design. A designer and a DSP engineer are solving the same mathematical problem: how to smoothly transition between two states without introducing artifacts. This connection, once seen, cannot be unseen. It appears in [[Boundary-Crossing Instruments]] — the recognition that signal flow and information flow are the same topology, expressed in different materials.


