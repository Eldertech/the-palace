---
title: "The Metaphor Stretch"
type: concept
pillars: [creation, tools, philosophy, practice]
born: 2026-04
last_activated: 2026-04
activation_count: 1
stage: sprout
confidence: working
energy: high
links:
  - target: "[[Crystal Synthesizer]]"
    type: connects-to
    label: first-taxonomy
  - target: "[[Boundary-Crossing Instruments]]"
    type: connects-to
    label: names-the-gap
  - target: "[[Dispersion]]"
    type: connects-to
---

# The Metaphor Stretch

Every boundary-crossing instrument reaches a moment where the source physics gives you ratios and tendencies — but not a playable instrument. This moment — the gap between physical description and musical agency — is The Metaphor Stretch.

The physics is never silent at this point. It still constrains. But what it constrains is *shape* and *tendency*, not absolute pitch, not number of voices, not decay time. The instrument designer must make choices the physics leaves open. Those choices are not failures of fidelity — they are the act of instrument building. The stretch is not a compromise; it is the threshold.

This is where the most important teaching moments live. The moment a student understands that the physics gave us the ratios but *we* gave it a home — that is the moment they understand what instrument design actually is.

## Confirmed Instances

**Neural Oscillator** — Action potential algorithms produce phase relationships and firing patterns but not stable fundamental pitches. To make the instrument playable, the action potential algorithm was modified to accept a pitch parameter. The modification is the stretch: physics of neural firing → instrument with a defined note.

**[[Crystal Synthesizer]]** — Phonon physics gives frequency ratios across seven lattice systems, and the direction of decay (high modes decay faster than low modes). It does not give absolute pitches, number of synthesis voices, or specific decay rates. Four stretch points were formally identified and built into the instrument code as explicit Decision Points:

1. **Frequency Anchor** — The physics gives ratios; we choose where to land them in human hearing. Three modes: `lowest_mode` (softest acoustic phonon = base pitch), `zone_boundary` (hardest phonon = ceiling), `centroid` (energy center = base pitch). Each makes a different claim about what aspect of the crystal the listener is perceiving.

2. **Rendering Resolution** — A real crystal has ~10²² phonon modes — a continuous spectrum. We synthesize N discrete partials from a histogram of that spectrum. N ranges from 8 (bell-like instrument, discrete modes, audible beating) to 300+ (dense texture approaching the continuous DOS). The number is entirely ours to choose. The physics does not specify it.

3. **Decay Scaling** — Anharmonic phonon-phonon coupling guarantees that high-frequency modes decay faster than low-frequency modes. The physics guarantees this *direction*; it does not specify the *rate*. The decay exponent is where the instrument designer's hand touches the physics.

4. **Fidelity Claim** — Pure sines, shaped decay, or band-limited noise per partial (approaching the continuous DOS). Each makes a different claim about what the sound represents. This is the deepest stretch: the explicit statement of what the instrument is.

## The Honest Artifact

At Decision Point 2, an interesting case arises: the beating between discrete partials is a rendering artifact — the specific beat rates are determined by bin count, not by the crystal. But the *direction* of the effect (a descending sweep of pitch character over sustain) is physically real — high modes do decay first in struck resonators. This is an *honest artifact*: wrong in detail, true in tendency.

The honest artifact is likely a recurring feature of the stretch zone. When you discretize a continuous physical process, the discretization introduces its own character. If that character points in the same direction as the physics, it may be more honest than its technical incorrectness implies. This deserves its own entry when enough instances accumulate across instruments.

## The Pedagogical Gold

These stretch points are the most important moments in teaching boundary-crossing instruments — precisely because they require the student to make a decision and own it. The decision is not arbitrary (the physics constrains it) but it is not determined (the physics does not resolve it). The lesson: *physics gives you the shape; you give it a home.*

Making Decision Points explicit in code — as named, commented, labeled parameters at the top of the file, above the physics engine — is the act of teaching that instrument. The code becomes the lesson plan. Students change one parameter, re-render, listen. The consequence is immediate and audible.

This is the same structure as the best physical modeling synthesis teaching: not "here is how FM synthesis works" but "here is the one parameter that crosses from physics into music — turn it and listen."

## Forward Vectors

- Formalize the taxonomy of stretch types across all boundary-crossing instruments. Are Frequency Anchor, Rendering Resolution, Decay Scaling, and Fidelity Claim the four categories? Or are these Crystal Synthesizer specifics that map onto a more general schema?
- Test whether the Neural Oscillator's pitch modification can be described using the same four-category taxonomy — or whether it reveals a fifth type
- Build a lesson structure that walks students through each Decision Point sequentially, beginning with the most audible (Resolution) and ending with the most conceptual (Fidelity Claim)
- The honest artifact deserves its own entry once enough examples exist across instruments
- What does the stretch look like for the [[Hyperdimensional Prism]]? That instrument crosses dimensional rather than frequency boundaries — does the same taxonomy apply?
