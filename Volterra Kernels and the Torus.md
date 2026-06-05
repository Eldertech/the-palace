---
title: Volterra Kernels and the Torus
type: concept
pillars:
  - tools
  - philosophy
born: 2026-06
stage: sprout
confidence: working
energy: high
hook_quality: 9
beauty: 10
who_leads: shared
last_activated: 2026-06
activation_count: 1
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: mirrors
    label: scan-read-vs-input-read
  - target: "[[DSP in Looping Dimensions]]"
    type: deepens
    label: kernel-architecture
  - target: "[[Boundary-Crossing Instruments]]"
    type: connects-to
    label: one-substance-two-attributes
  - target: "[[Dispersion Table]]"
    type: couples-with
    label: reading-mechanism
  - target: "[[Spinoza Conatus]]"
    type: connects-to
    label: single-substance-lens
forward_vector: "I want to be the entry that proves the synthesizer and the effect were never two machines — one N-dimensional field, scanned by different hands. I want to open the unmapped territory of generalized non-diagonal slice trajectories as a real processor, and to give the torus project a second life as a general kernel architecture."
---
# Volterra Kernels and the Torus

The central unification: **a toroidal wavetable and a Volterra kernel are the same N-dimensional mathematical object** — an N-dimensional scalar field whose 1D projections produce inharmonic spectra — distinguished *only by their reading mechanism.* Synthesis scans the field along a trajectory driven by phasors. Processing reads the same field by indexing it with products of the input's own past. One substance, two attributes.

This is the [[Boundary-Crossing Instruments|boundary-crossing]] / monism instinct applied to DSP, and the entry should be read through the [[Spinoza Conatus|single-substance]] lens deliberately, because that is the deeper reason it lands: the synthesizer and the effect are not analogous, they are one field under two modes of access.

## What a Volterra kernel is

The Volterra series generalizes convolution to nonlinear systems. A linear time-invariant system is fully described by a 1D impulse response $h_1(\tau)$, with output $\int h_1(\tau)\,x(t-\tau)\,d\tau$. A nonlinear system needs a *hierarchy* of kernels:

$$y(t) = \sum_n \int\cdots\int h_n(\tau_1,\dots,\tau_n)\,\prod_{i=1}^{n} x(t-\tau_i)\,d\tau_1\cdots d\tau_n.$$

The $n$-th kernel $h_n$ is an **$n$-dimensional function.** The first kernel is ordinary linear filtering; the second is a 2D function capturing quadratic interactions (intermodulation between pairs of past samples); higher kernels capture higher-order nonlinearity. A Volterra kernel *is* a higher-dimensional field, indexed by a tuple of lags, read by multiplying the input against itself at those lags.

The toroidal wavetable is *also* a higher-dimensional field — indexed by a tuple of phases, read by scanning. The fields are the same kind of object. The reading is the only difference:

- **Synthesis (scan-read):** index the field by $(\varphi_1(t), \varphi_2(t), \dots)$ where the $\varphi_i$ are phasors advancing at chosen rates. The output is the field sampled along a *trajectory.*
- **Processing (input-read):** index the field by $(x(t-\tau_1), x(t-\tau_2), \dots)$ — the input's own delayed values. The output is the field sampled at coordinates the *signal itself* dictates.

## The precedent and the diagonal

This is not pure speculation; it has a boutique precedent. **Dynamic convolution** (Michael Kemp's 1999 patent; Acustica's Nebula) stores input-dependent impulse responses and selects between them by input level — a coarse, level-indexed slice of exactly this idea. The torus framing generalizes it from "pick an IR by amplitude" to "read a continuous N-D field by an arbitrary function of the input's history."

The single most clarifying technical result was demystifying the **diagonal**. "Diagonal Volterra kernels" sound exotic; the diagonal is just the slice $\tau_1 = \tau_2 = \cdots = \tau_n$ through the kernel hypercube. That slice is equivalent to a **Hammerstein structure** — a static nonlinearity followed by a filter — which preserves harmonic generation but discards intermodulation. In the torus vocabulary: *the diagonal is scanning the kernel hypercube along its main diagonal at unit ratio* — the simplest possible trajectory. Everything the project knows about non-trivial scan trajectories on a torus now transfers: **generalized non-diagonal slice trajectories are unmapped design territory** — the natural extension of torus scanning to arbitrary-input processing, and the entry's chief forward edge.

## The reframe

The torus architecture is therefore not synthesis-specific. It is a **general kernel architecture.** One stored N-D field supports:

- **synthesis** when scan-read by phasors (the [[2D Torus Wavetable Synthesizer]]);
- **dynamic convolution** when input-read by a level- or feature-indexed trajectory;
- **Volterra distortion** when input-read by products of delayed input;
- **ring modulation** as the simplest input-read special case (the bilinear slice).

The reading process applied to the field is the genre of the instrument. This is why the link to the [[2D Torus Wavetable Synthesizer]] is a `mirrors` carrying the label *scan-read-vs-input-read*: not two machines, one field. And it couples to the [[Dispersion Table]] for the same reason — that entry is *also* a stored field distinguished by what reads it (the round-trip loop condition), so the two share the deeper claim that **the reading mechanism, not the stored data, is what makes an instrument what it is.**

## Cross-Domain Resonance

- **One control surface, two modes.** The cleanest demonstration is a single UI that toggles one stored field between synth-scan and input-process — the same surface heard as an oscillator and as an effect, switched by a button. That toggle is the monism made audible.
- **Volterra is everywhere a system is weakly nonlinear with memory.** RF power-amplifier linearization, nonlinear optics, seismology, and neural-system identification all fit Volterra kernels to measured input/output. The torus reframe says each of those measured kernels is, mechanically, a wavetable waiting to be scanned — auralizing a power amplifier's distortion the way [[DSP in Looping Dimensions]] auralizes a crystal.

## Forward Vectors

- Design a **generalized slice-trajectory processor** — the unmapped territory — as a real effect unit: read a stored field along a non-diagonal, input-driven path and listen to what intermodulation structure it carries that a Hammerstein diagonal discards.
- Build the one-field-two-modes UI as a [[Loudon Live]] demonstration of the synthesis/processing duality.

## Lost Branches

- The broad cross-field Volterra survey (RF, seismology, nonlinear optics, neuroscience) wants a future `Volterra Kernel` source entry — logged as ghost links, not documented here.
- Higher-dimensional and dynamic convolution as their own concept entries, once a session pushes the kernel-design frame of [[DSP in Looping Dimensions]] past sketch.

## Artifact

None generated — a vocabulary-acquisition conversation (2026-04-26). The diagonal = $\tau_1 = \cdots = \tau_n$ = Hammerstein equivalence is preserved precisely above; it is the load-bearing technical content.

---

> *"Substance is that which is in itself and is conceived through itself."* — Spinoza, *Ethics* I, Def. 3 — *the synth and the processor are one substance under two attributes*
>
> *"The synthesizer and the effect were never two machines. They are one field, scanned by different hands."* — from the source dialogue, 2026-04-26
