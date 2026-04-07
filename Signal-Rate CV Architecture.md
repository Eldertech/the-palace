---
title: Signal-Rate CV Architecture
type: concept
pillars:
  - tools
  - creation
  - philosophy
born: 2026-03
stage: growing
confidence: working
energy: high
links:
  - target: "[[Action Potential Oscillator]]"
    type: enables
  - target: "[[Boundary-Crossing Instruments]]"
    type: mirrors
  - target: "[[FOUR PILLARS]]"
    type: connects-to
  - target: "[[Biomechanical Synthesis]]"
    type: enables
  - target: "[[Crystal Synthesizer]]"
    type: connects-to
  - target: "[[Progressive Staging]]"
    type: couples-with
    label: pedagogical-method
---

# Signal-Rate CV Architecture

The design principle that every input in the neural synthesis suite — and any module that can support it — operates at signal rate. No control-rate parameters. Every input is a CV jack. The math runs per-sample because the processes being modeled run continuously.

## Three Converging Arguments

The principle emerges from three independent lines of reasoning that arrive at the same conclusion.

**The modular synthesis argument.** In a modular synthesizer, everything is a voltage. A pitch CV, an LFO, an envelope, an audio oscillator — they are all signals, differing only in frequency and intent. A module that accepts only control-rate parameters creates a boundary in the patch: things that could be connected, can't be. Signal-rate inputs eliminate that boundary. Any output can drive any input. The architecture of the instrument disappears into the architecture of the patch.

**The biological argument.** The processes this suite models — ion channel conductances, membrane leak, synaptic drive, recovery dynamics — are continuous. They don't update at "block rate." A neuron's membrane time constant doesn't wait for a control vector to arrive before changing. Modeling these as signal-rate inputs reflects the actual temporal grain of the biology. Where the modeled quantity is biologically continuous (synaptic drive, membrane state), signal-rate modulation is faithful. Where it is biologically fixed (spike peak amplitude, channel kinetics), signal-rate modulation is an artistic extension — and should be named as such.

**The pedagogical argument.** When the math runs per-sample, the student can hear every equation directly. Patch an LFO into the leak time constant: you hear the membrane becoming leakier in real time, the ramp curving and straightening, the timbre sweeping from warm to bright. The relationship between the equation and the sound is immediate, not mediated by a UI abstraction. This directness is the [[FOUR PILLARS]] philosophy in practice — learning through making, at the speed of the underlying process.

## Practical Consequences in Gen~ / RNBO

All inputs declared as `in N` (signal-rate inlets), never `param`. Default values provided by `sig~` objects at the patcher level — patchable, replaceable, modular. Every input that appears in a denominator or as an argument to `exp()` must be guarded against zero using `max()` or `clamp()`. Transcendental functions like `exp()` run per-sample; this is acceptable on modern CPUs and the cost is paid deliberately in exchange for conceptual and modular clarity. Optimization happens later, if needed, and never at the cost of the principle.

## The Boundary It Crosses

This principle is itself a [[Boundary-Crossing Instruments]] case. It crosses the boundary between synthesis engineering convention (where control rate is the default for "slow" parameters) and neurobiology (where there is no control rate — only continuous process). The decision to model everything at signal rate is simultaneously a technical architecture choice, a biological fidelity commitment, and a pedagogical stance. The three domains reinforce rather than compete.

## Open Questions

- Where does the CPU cost become prohibitive? At what voice count or module complexity does per-sample `exp()` force a retreat to control-rate approximation — and can that boundary itself be made musically meaningful (like the biological refractory period creating a natural frequency ceiling)?
- Does this principle extend beyond the neural suite? Could it govern other [[Boundary-Crossing Instruments]] projects — the [[Crystal Synthesizer]], the [[Biomechanical Synthesis]] series?
- What is the pedagogical cost of signal-rate? Students accustomed to knobs and sliders may find "everything is a signal" conceptually harder at first. Is there a teaching sequence that makes the transition natural?
