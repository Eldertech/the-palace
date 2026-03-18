---
title: "Action Potential Oscillator"
type: project
pillars: [creation, tools, philosophy]
born: 2026-03
last_activated: 2026-03
activation_count: 1
stage: sprout
links:
  - target: "[[Kuramoto Coupling]]"
    type: enables
  - target: "[[Boundary-Crossing Instruments]]"
    type: mirrors
  - target: "[[Spinoza Conatus]]"
    type: connects-to
  - target: "[[Frequency-Time Duality]]"
    type: connects-to
  - target: "[[Hyperdimensional Prism]]"
    type: connects-to
---

# Action Potential Oscillator

A progressive educational series rooted in the neurobiology of the action potential — building an audio oscillator from neuronal first principles, stage by stage, where every synthesis parameter traces directly to a biological mechanism.

The central claim: **neurons are oscillators, ion channels are synthesis parameters, consciousness is timbre.**

## The Four Stages

**Stage 1 — Linear integrate-and-fire**: The membrane as capacitor. Charge-to-threshold-and-reset produces a sawtooth wave. The simplest oscillator. The identical math as analog synth ramp cores.

**Stage 2 — Leaky integrate-and-fire**: The membrane as RC circuit. Leak conductance adds exponential curvature to the charging ramp. The discrete-time leak is a one-pole lowpass filter — *the same smoothing coefficient used in compressor attack/release*. Membrane time constant τ becomes a waveshape/timbre control.

**Stage 3 — Shaped spike**: The action potential as prescribed waveform. Fast Na⁺ activation (rise) and slower K⁺ repolarization (fall) generate an asymmetric transient event. Spike duration is fixed in biology; at high oscillator frequencies it occupies increasing fractions of the cycle — a natural spectral darkening with pitch.

**Stage 4 — Hyperpolarization and refractory period**: The full MVP. After the spike, residual K⁺ conductance pulls the membrane below rest (afterhyperpolarization). The recovery from this undershoot can be overdamped (smooth), critically damped, or underdamped (ringing oscillation that adds subharmonic growl). Recovery damping is a live timbre parameter.

## The Artifact

`neuron_oscillator.html` — a research document with embedded interactive visualizations. Fixed time windows (not rescaled) so parameter changes are immediately legible. Color-coded by ion species: Na⁺ orange, K⁺ blue, spike red, resting green, leak amber, hyperpolarization purple, charge yellow.

## Cross-Domain Isomorphisms

These are not metaphors — they are structural identities:

- **RC circuit = one-pole IIR filter = compressor envelope smoother**. Same update equation: `V[n] = V[n-1] × (1 - dt/τ) + I × dt`.
- **Ion channel gating kinetics = ADSR envelope with voltage-dependent rates**. The m, h, n gates each follow first-order kinetics toward a voltage-dependent steady state — this IS an envelope follower tracking the voltage signal.
- **The action potential phase machine = state machine oscillator**. Phase 0 (charge), 1 (rise), 2 (fall), 3 (refractory). Compilable in Gen~/RNBO using only primitive operations.
- **Refractory period = maximum frequency ceiling**. Biologically accurate: fast-spiking interneurons top out at ~1000 Hz. In the oscillator, this is a natural bandwidth limit.

## Roadmap Connections to Palace

The next stages of this project connect directly to existing palace entries:

**[[Kuramoto Coupling]]** — Two-oscillator coupling with asymmetric influence parameters ("stubbornness" / "influence"). This is the direct application of Kuramoto mathematics to neural oscillator pairs, building toward population dynamics.

**[[Boundary-Crossing Instruments]]** — The oscillator's parameters cross biological-to-sonic boundaries: τ crosses from membrane physics to waveshape, refractory period crosses from biology to frequency ceiling, recovery damping crosses from ion channel balance to harmonic content.

**[[Frequency-Time Duality]]** — The refractory period defines a minimum period and therefore a maximum frequency. The fixed spike duration creates a timbre-pitch coupling as frequency rises. These are frequency-time duality effects operating at the single-cycle scale.

## Open Questions

- When does the oscillator become Hodgkin-Huxley? Full gating variable ODE integration is the next stage — at what point does simulation become indistinguishable from the biological original?
- Stochastic channel gating (probabilistic opening/closing) adds pitch jitter and noise whose character depends on simulated channel count. What does a "noisy" neuron sound like when N=10 vs N=10,000 channels?
- The Faust → VST3 plugin (NeuroPulse) is the production instrument. The HTML document is the educational artifact. Should they diverge or stay isomorphic?
- Consciousness as timbre — where does this metaphor break down, and is the breakdown itself interesting?
