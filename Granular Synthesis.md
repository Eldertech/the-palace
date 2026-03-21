---
title: "Granular Synthesis"
type: concept
pillars: [creation, tools]
born: 2026-03
stage: seed
confidence: working
energy: medium
hook_quality: 7
beauty: 7
who_leads: shared
links:
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
  - target: "[[Action Potential Oscillator]]"
    type: connects-to
  - target: "[[Frequency-Time Duality]]"
    type: connects-to
  - target: "[[Boundary-Crossing Instruments]]"
    type: connects-to
---

# Granular Synthesis

The technique of building sound from large populations of small sonic events (grains) — typically short sine bursts, windowed samples, or simple waveforms — whose collective statistical behavior produces emergent timbres, textures, and spatial fields. The grain is the atom; the cloud is the material.

## Origin

Granular synthesis has deep roots in Gabor's acoustic quantum theory and Xenakis's stochastic music. In the palace, it enters through the [[Kuramoto Coupling]] work, where the question of coupling large oscillator populations to attractor spectra produced a novel hybrid architecture.

## The Granular-Additive Attractor Hybrid

Conceived during the Kuramoto lesson series (March 2026). Two layers:

**Attractor layer**: An additive synthesizer generating a harmonic spectrum — a set of partials at defined frequencies and amplitudes. This is a fixed landscape, a harmonic gravitational field. It doesn't couple to anything; it IS the potential.

**Grain layer**: A cloud of simple sine-grain oscillators, each a Kuramoto oscillator that couples to the attractor layer. The amplitude of each additive partial determines coupling strength — a loud partial is a deep well, grains nearby get captured; a quiet partial is shallow, grains drift past.

A bandpass filter sweeping across the additive spectrum dynamically reshapes the potential landscape — like dragging a magnet across a table of iron filings. Grains pile up where the filter is, scatter where it isn't.

The math for each grain:
```
dθ_grain/dt = ω_grain + Σ_k A_k · K · sin(θ_attractor_k - θ_grain)
```

Where k runs over the additive partials, A_k is the (bandpass-filtered) amplitude of partial k.

**Computationally efficient**: coupling is one-directional (N_grains × N_partials evaluations, no grain-to-grain interactions).

## Three Coupling Regimes

**Attractor-only** (no grain-to-grain coupling): Each grain independently finds its nearest attractor partial. The cloud forms neat piles. Sound: tight clusters at each active partial, like a bright additive spectrum with built-in micromotion.

**Weak grain-to-grain coupling added**: Grains near the same attractor start to phase-synchronize with each other. Each pile becomes coherent — not just a frequency cluster but a phase-locked cluster. The sonic difference: from tight chorus to reinforced partial. A second control dimension: "how clustered" vs. "how coherent within each cluster."

**Grain-to-grain only** (no attractor): Pure emergence. Grains at random frequencies with mutual coupling. With pure sines, only 1:1 locking is possible — grains spontaneously cluster into frequency groups. Add soft clipping or any nonlinearity, and harmonic locking appears. The cloud self-organizes into a harmonic series that nobody specified.

## Open Questions

- What is the minimum grain count for the attractor hybrid to produce a convincingly continuous texture?
- Can the attractor spectrum itself be derived from audio input (spectral analysis → attractor field)? This would create a "granular resynthesizer" driven by Kuramoto dynamics.
- How does grain density interact with coupling? Sparse clouds may have too few grains near any given partial for coupling to matter. Dense clouds may lock too easily, losing motion.
- Is there a chimera-state equivalent for grain clouds — some grains locked, some drifting, with the boundary self-organized?

---

*This entry is a seed. The concept spans decades of music technology; these notes capture the palace's specific angle — granular synthesis as a population of coupled oscillators, not just a texture generator.*
