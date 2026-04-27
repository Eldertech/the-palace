---
title: "What Claim Does Scientific Sonification Make?"
type: question
pillars: [philosophy, creation, tools]
born: 2026-04
last_activated: 2026-04
activation_count: 1
stage: seed
forward_vector: "I hold open the question of honesty that sonification cannot avoid: does this rendering claim to simulate, to approximate, or to compose? I want to mature when the Crystal Synthesizer is performed, forcing an explicit choice about what the listener is invited to hear and what the physics actually guarantees."
links:
  - target: "[[Crystal Synthesizer]]"
    type: emerged-from
  - target: "[[The Metaphor Stretch]]"
    type: emerged-from
    label: child-of-stretch
---

# What Claim Does Scientific Sonification Make?

When a physical model is rendered as sound, what is it claiming about the physical system it derives from?

This question arrived at the end of the first [[Crystal Synthesizer]] audio session. The phonon dispersion relations were computed correctly. The audio files existed. And then the question surfaced: *what is this actually saying about crystals?*

The physics was not in question. The claim was.

## The Three Paths

Three possible positions were named. None was chosen. The question remains open.

**Path 1 — Lean into discrete**
Accept that the instrument is derived from physics but is not a simulation of it. The discrete partials are a bell-like instrument whose partial *structure* comes from crystal symmetry. The claim: "These frequency ratios are real. The rest is composition." Analogous to how a gamelan instrument is not a simulation of bronze physics — it is *shaped* by it. This path is the most musically honest about what it is, and the least scientifically ambitious about what it claims.

**Path 2 — Approach continuous**
Replace discrete sine partials with band-limited noise patches, one per phonon DOS bin. Reduce the gap between N synthesis voices and 10²² phonon modes. The claim: "This approximates what you would hear if you could directly transduce THz vibrations into audio." More physically honest about the continuous nature of the DOS; less obviously musical; the beating artifact dissolves into texture. This path is the most scientifically ambitious and the hardest to perform.

**Path 3 — Separate the claims explicitly**
Make two versions, or two modes, with a clear label on each: one that is maximally faithful (*this is what the dispersion relation contains*), one that is musically shaped (*this is a composition derived from that physics*). Name the difference in the instrument's documentation and performance practice. This path is the most epistemologically honest — it refuses to collapse the distinction — and may be the most teachable.

## Why This Matters

The answer shapes everything about how the [[Crystal Synthesizer]] is presented, taught, and extended:

- A lesson built around Path 1 teaches **instrument design** — how physical constraints generate musical possibility
- A lesson built around Path 2 teaches **scientific visualization** — how physical systems can be made perceptible
- A lesson built around Path 3 teaches **epistemology** — how to be honest about what a creative act is claiming

The question is not about whether the physics is correct. The phonon DOS calculations are as accurate as the discretization allows. The question is about the *claim* the rendering makes — what the listener is being invited to hear.

## The Honest Artifact Complication

The discrete-beating sweep (heard in the mid-resolution renders) complicates all three paths. The sweep is wrong in detail (specific beat rates are from bin count, not physics) but right in tendency (high modes decay first). If Path 2 eliminates the artifact by approaching continuity, it also eliminates a feature that honestly points toward real physics. Path 1 keeps the artifact but calls it composition. Path 3 could keep it in the "shaped" mode and remove it in the "faithful" mode.

## Forward Vectors

- This question matures when the Crystal Synthesizer is performed or taught for the first time — performance forces a choice
- Does the answer differ by audience? The claim made to scientists differs from the claim made to musicians differs from the claim made to students
- Can all three paths coexist in the same instrument as selectable modes? (The `FIDELITY` parameter in the code is an early sketch of this)
- What do existing scientific sonification practitioners say? This may be a harvest target — who has thought carefully about this question in the field?
- Does this question have a counterpart in scientific visualization? ("What does a false-color astronomical image claim?")
