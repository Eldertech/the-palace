---
title: "Action Potential Oscillator"
type: project
pillars: [creation, tools, philosophy]
born: 2026-03
last_activated: 2026-03
activation_count: 3
stage: sprout
confidence: working
energy: high
links:
  - target: "[[Kuramoto Coupling]]"
    type: couples-with
  - target: "[[Boundary-Crossing Instruments]]"
    type: mirrors
  - target: "[[Signal-Rate CV Architecture]]"
    type: connects-to
  - target: "[[Spinoza Conatus]]"
    type: connects-to
  - target: "[[Frequency-Time Duality]]"
    type: connects-to
  - target: "[[Hyperdimensional Prism]]"
    type: connects-to
  - target: "[[Striatum]]"
    type: connects-to
  - target: "[[Neural Granular Synthesis]]"
    type: mirrors
  - target: "[[Biomechanical Synthesis]]"
    type: connects-to
  - target: "[[State Machine]]"
    type: connects-to
  - target: "[[Progressive Staging]]"
    type: emerged-from
---

<!-- CLAUDE → LOUDON: You mentioned porting to the Eventide H90. This wasn't addressed in the March 2026 session — flagging for a future conversation. The Gen~ → RNBO path may be relevant here if H90 accepts compiled RNBO output, or it may require a separate export strategy. --> <!-- H90 is a valid and new output target of RNBO, easily accomplished -->

# Action Potential Oscillator

A progressive educational series rooted in the neurobiology of the action potential — building an audio oscillator from neuronal first principles, stage by stage, where every synthesis parameter traces directly to a biological mechanism.

The central claim: **neurons are oscillators, ion channels are synthesis parameters, consciousness is timbre.**

## The Four Stages

**Stage 1 — Linear integrate-and-fire**: The membrane as capacitor. Charge-to-threshold-and-reset produces a sawtooth wave. The simplest oscillator. The identical math as analog synth ramp cores.

**Stage 2 — Leaky integrate-and-fire**: The membrane as RC circuit. Leak conductance adds exponential curvature to the charging ramp. The discrete-time leak is a one-pole lowpass filter — *the same smoothing coefficient used in compressor attack/release*. Membrane time constant τ becomes a waveshape/timbre control.

**Stage 3 — Shaped spike**: The action potential as prescribed waveform. Fast Na⁺ activation (rise) and slower K⁺ repolarization (fall) generate an asymmetric transient event. Spike duration is fixed in biology; at high oscillator frequencies it occupies increasing fractions of the cycle — a natural spectral darkening with pitch.

**Stage 4 — Hyperpolarization and refractory period**: The full MVP. After the spike, residual K⁺ conductance pulls the membrane below rest (afterhyperpolarization). The recovery from this undershoot can be overdamped (smooth), critically damped, or underdamped (ringing oscillation that adds subharmonic growl). Recovery damping is a live timbre parameter.

## Implementation Environment

The educational and development path uses **Max/MSP Gen~**, compilable through **RNBO** for export. Gen~ is chosen because it operates at the right level of abstraction: close enough to the math that every equation is visible in the code, high enough that state machines and sample-rate processing are natural. The architecture follows [[Signal-Rate CV Architecture]] — all inputs are signal-rate `in N` inlets, no `param` declarations. Every parameter is a CV jack.

The Gen~ development progresses through the four stages sequentially, each producing a complete playable oscillator. Stage 1 has 1 inlet, Stage 2 has 2, Stage 3 has 5, Stage 4 has 8. At the patcher level, `sig~` objects provide defaults; any can be replaced by LFOs, envelopes, sequencers, or other oscillators.

Faust remains a candidate for the production population-dynamics instrument (NeuroPulse), where `par(i, N, neuron(i))` provides first-class parallelism for large neuron populations. The Gen~ path and the Faust path may converge or remain complementary — the single-neuron oscillator in Gen~ feeds the educational series; the Faust population engine feeds the performance instrument.

A complete Gen~ development plan with per-sample pseudocode, input guards, testing criteria, and citation verification lives at `Artifacts/Action Potential Oscillator/neural_oscillator_dev_plan.md`.

## Implementation Status (March 2026)

Stages 1–4 are implemented and playable. Stages 1–3 were built in Gen~ modules (visual dataflow); Stage 4 moved to Gen~ codebox as a deliberate pedagogical transition — the 4-state [[State Machine]] exceeded the visual paradigm's complexity threshold. The complete Stage 4 codebox code and educational interface text (intro paragraph, 4 phase descriptions, 8 parameter descriptions with biological ranges) are archived at `Artifacts/Action Potential Oscillator/`.

Key implementation decisions documented during the build:
- **Frequency compensation**: spike and refractory durations are subtracted from the target period before computing drive current, so the `freq` input behaves as true pitch control regardless of spike_peak or refractory_ms settings.
- **V_start_actual**: a History variable captures the exact voltage at each cycle boundary rather than predicting it analytically — simpler, more accurate, and applicable across both Stage 3 and Stage 4.
- **Latch pattern**: at the spike fall → next phase transition, voltage is latched (`V = spike_v` or `V` carries through) rather than hard-reset to 0, eliminating a waveform discontinuity at the cycle boundary.

The staging method itself — each stage complete, playable, and educational before the next begins — is documented in [[Progressive Staging]].

## The Artifact

The primary research artifact is `Artifacts/Action Potential Oscillator/neuron_oscillator.html` — a self-contained interactive document with 8 Canvas-rendered visualizations (static graphs + real-time interactive controls). Fixed 20ms time windows so parameter changes are immediately legible as waveform compression/expansion. Color-coded by ion species: Na⁺ orange, K⁺ blue, spike red, resting green, leak amber, hyperpolarization purple, charge yellow.

The Stage 2 interactive shows the LIF waveform with τ and drive sliders — drive below 1.0× rheobase enters subthreshold regime (neuron goes silent). The Stage 4 interactive exposes all four phases (charge, spike rise, spike fall, refractory recovery) with τ, spike peak, hyperpolarization depth, recovery damping, and frequency controls. Both show real-time Hz / MIDI note readout. The biological maximum firing rate ceiling is visualized when frequency exceeds the spike+refractory duration.

The source of truth for this artifact is the Claude project "Neural synthesizer" where iterative development happens. Palace copy is a periodic snapshot.

## Cross-Domain Isomorphisms

These are not metaphors — they are structural identities:

- **RC circuit = one-pole IIR filter = compressor envelope smoother**. Same update equation: `V[n] = V[n-1] × (1 - dt/τ) + I × dt`.
- **Ion channel gating kinetics = ADSR envelope with voltage-dependent rates**. The m, h, n gates each follow first-order kinetics toward a voltage-dependent steady state — this IS an envelope follower tracking the voltage signal.
- **The action potential phase machine = state machine oscillator**. Phase 0 (charge), 1 (rise), 2 (fall), 3 (refractory). Compilable in Gen~/RNBO using only primitive operations.
- **Refractory period = maximum frequency ceiling**. Biologically accurate: cortical fast-spiking interneurons reach ~300–600 Hz (Hu et al., 2014); specialized auditory neurons (MNTB) can reach ~1000 Hz (Bean, 2007). In the oscillator, this is a natural bandwidth limit.

## Roadmap Connections to Palace

The next stages of this project connect directly to existing palace entries:

**[[Kuramoto Coupling]]** — Two-oscillator coupling with asymmetric influence parameters ("stubbornness" / "influence"). This is the direct application of Kuramoto mathematics to neural oscillator pairs, building toward population dynamics.

**[[Boundary-Crossing Instruments]]** — The oscillator's parameters cross biological-to-sonic boundaries: τ crosses from membrane physics to waveshape, refractory period crosses from biology to frequency ceiling, recovery damping crosses from ion channel balance to harmonic content.

**[[Frequency-Time Duality]]** — The refractory period defines a minimum period and therefore a maximum frequency. The fixed spike duration creates a timbre-pitch coupling as frequency rises. These are frequency-time duality effects operating at the single-cycle scale.

## Population Dynamics

A single neuron oscillator is the building block, but the brain does not operate on single neurons. It uses populations. Population dynamics is where the interesting behavior lives.

A population of slightly different neurons — variations in leak constant τ, variations in threshold voltage, variations in channel kinetics — coupled via Kuramoto dynamics produces emergent rhythms that no single neuron contains. This is the principle of symmetry breaking through heterogeneity. A homogeneous population locks to a trivial state; a heterogeneous population diversifies.

**Raster plots** make population-level patterns visible. Plot each neuron's spike events as a dot: neuron number on the Y axis, time on the X axis. Single-neuron behavior is a vertical line of dots (regular firing). Synchronized firing appears as diagonal lines cutting across neuron indices (the population spiking in phase). Waves of activity trace as diagonal bands (a refractory wave propagating through the population). Noise or incoherence becomes a diffuse cloud. The plot reveals emergent behavior that single-neuron equations cannot show.

The connection to [[Neural Granular Synthesis]] is direct: if each neuron IS a grain, then neural population dynamics IS granular synthesis. A population of neurons with Kuramoto coupling between them is a granular synthesis engine. The emergence of harmonic locking, chimera states (some neurons synchronized, others drifting), and wave patterns are all granular phenomena. The synthesis architecture is already there in the neurobiology.

**Hodgkin-Huxley vs. simplified models** represents a design choice. The full Hodgkin-Huxley model with complete gating variable ODEs is biologically accurate but computationally expensive. The integrate-and-fire model is a simplification — it loses spike shape detail. For population synthesis purposes, the question is not accuracy but *where does the detail matter sonically*. Hypothesis: HH detail matters most for individual spike SHAPE (which determines spectral content and transient character), less for population dynamics (which operate at a statistical level where individual spike shape averages out). A population of idealized integrate-and-fire neurons coupled via Kuramoto dynamics may be sonically equivalent to a population of detailed HH neurons, because the population behavior is determined by coupling and heterogeneity, not individual spike precision.

**Faust par() primitive**: A population of N neurons in Faust is a single parallel expression: `par(i, N, neuron(i))`. The population is first-class. All N neurons execute in parallel at every sample; the Kuramoto coupling terms create the interdependencies. This is vastly different from serial iterative approaches. The parallel architecture maps naturally to audio block processing — each audio sample, all neurons update simultaneously.

## Open Questions

- When does the oscillator become Hodgkin-Huxley? Full gating variable ODE integration is the next stage — at what point does simulation become indistinguishable from the biological original?
- Stochastic channel gating (probabilistic opening/closing) adds pitch jitter and noise whose character depends on simulated channel count. What does a "noisy" neuron sound like when N=10 vs N=10,000 channels?
- ~~The Faust → VST3 plugin (NeuroPulse) is the production instrument. The HTML document is the educational artifact. Should they diverge or stay isomorphic?~~ *Resolved March 2026:* Gen~ is the educational/development environment; Faust is the production candidate for population dynamics. They serve different purposes and may diverge. The single-neuron oscillator is isomorphic across both; the population layer is where they fork.
- Consciousness as timbre — where does this metaphor break down, and is the breakdown itself interesting?
- The [[Signal-Rate CV Architecture]] principle governs this oscillator's implementation. At what population size does the per-sample cost of signal-rate everything force compromises — and can those compromises be biologically motivated?
