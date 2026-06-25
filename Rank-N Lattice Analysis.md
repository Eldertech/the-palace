---
title: Rank-N Lattice Analysis
type: concept
pillars:
  - tools
born: 2026-06
stage: sprout
confidence: working
energy: high
hook_quality: 9
beauty: 9
who_leads: shared
last_activated: 2026-06
activation_count: 1
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: mirrors
    label: analysis-is-synthesis-read-backward
  - target: "[[DSP in Looping Dimensions]]"
    type: deepens
    label: measures-the-rank-the-principle-posits
  - target: "[[Chebyshev is Fourier]]"
    type: connects-to
    label: choose-your-basis
  - target: "[[Categorizing Inharmonicity]]"
    type: connects-to
    label: rank-as-an-inharmonicity-coordinate
  - target: "[[Dissolutions]]"
    type: member-of
    label: minimal-spectrum-of-the-stored-field
forward_vector: "I want to make the synthesizer its own oscilloscope — one stored field that is simultaneously what was heard and what will be played. I want to unify pitch detection, modal analysis, and harmonicity measurement as one operation at different ranks, and to prototype the analyzer→synth round-trip as a single tool."
---
# Rank-N Lattice Analysis

![[Rank-N Lattice Analysis — hero.png]]

The analysis-side complement to [[DSP in Looping Dimensions]]: if N looping dimensions at irrational ratios *generate* a rank-N lattice spectrum, then **fitting the minimal generating spectrum of a recorded sound — and measuring its rank — is the inverse operation.** Harmonicity becomes the rank-1 special case. The synthesizer becomes its own oscilloscope. Analysis and synthesis become two readings of one artifact.

## Rank as a measured property

Standard Fourier analysis treats the harmonic series as the implicit basis: it asks "how much energy at each integer multiple of $f_0$?" and everything that doesn't fit is residual. **Rank-N lattice analysis changes the basis to the minimal generating spectrum** — it asks "what is the smallest set of base frequencies $\{\omega_1, \dots, \omega_N\}$ whose integer combinations $m\omega_1 + n\omega_2 + \cdots$ account for this sound's partials?" — and crucially, **the rank N itself is a measured quantity**, a property of the source rather than an assumption imposed on it.

- A pure harmonic tone fits with $N = 1$: every partial is an integer multiple of one fundamental. Harmonicity is rank-1.
- A stiff piano string, a struck bar, a bell needs $N \geq 2$: its partials require two or more incommensurate generators.
- A dense inharmonic texture has high rank.

This single reframe **unifies operations normally taught as separate**: piano partial-stretch extraction, modal analysis of resonant bodies, and cepstral pitch detection are all *the same operation* — lattice fitting — at different ranks, constraints, and signal classes. Pitch detection is rank-1 lattice fitting with a tight harmonic constraint; modal analysis is unconstrained lattice fitting; harmonicity measurement is reading off whether the fitted rank is 1.

## The synth as its own oscilloscope

Here is the move that makes it more than an analysis technique. The object the analyzer produces — a surface volume $W$ together with its generating frequencies $\{\omega_i\}$ — is *exactly the object the [[2D Torus Wavetable Synthesizer]] plays.* So:

1. Play a real instrument into the analyzer.
2. Watch the lattice fit converge — the rank settling, the generators locking onto the partial structure.
3. Play the synth with that exact lattice.

One artifact is simultaneously **what was heard** (the analysis of the input) and **what will be played back** (the synthesis surface). Analysis and synthesis are not two tools chained together; they are one stored field read in two directions — *the synthesizer scanned forward is the oscilloscope read backward.* This is why the link to the torus synthesizer is a `mirrors`: the duality is structural identity, the same single-substance instinct that runs through the [[Volterra Kernels and the Torus]] and [[Dispersion Table]] entries (a stored field; the reading mechanism is the genre).

## Cross-Domain Resonance

- **Choose-your-basis, measured.** Where [[Chebyshev is Fourier]] shows two bases turning out identical, rank-N analysis shows the *act of choosing the basis* becoming a measurement: pick the generating lattice that minimizes residual, and its rank is data about the source. Fourier is the special case where you fix the basis to rank-1 harmonics in advance and call everything else residual.
- **Rank as an inharmonicity coordinate.** [[Categorizing Inharmonicity]] catalogues inharmonicity targets; rank is a natural axis on that catalogue — *how many incommensurate generators does this timbre require?* — turning a qualitative taxonomy into a measurable one.

## Note on the T³ material

The source session also extended the torus to **T³** — three simultaneous harmonicity gates ($\omega_1{:}\omega_2$, $\omega_2{:}\omega_3$, $\omega_1{:}\omega_3$), with regime structure determined by which pairs lock (closed cable-knot / dense sub-torus / full-cube dense), and computational limits where trilinear interpolation and memory bandwidth bite before CPU does. If that T³ regime taxonomy already lives in [[DSP in Looping Dimensions]], it should be *linked, not duplicated* — the genuinely novel, uncaptured pieces here are the **analysis side** (rank-N fitting; synth-as-oscilloscope) and the strategic framing split into the companion entry [[Infeasible DSP Now Shippable]].

## Forward Vectors

- Prototype the analyzer → synth round-trip as a single tool: record, watch the lattice converge, play it back.
- Invent control vocabularies for high-dimensional instrument spaces — the recurring "hardest problem" named in the companion entry.
- Does measured rank correlate with perceived inharmonicity, or do listeners hear something the rank doesn't capture? An empirical question.

## Lost Branches

- The pure-T³ regime taxonomy, if already in [[DSP in Looping Dimensions]] — link, don't re-document.

## Artifact

None generated — a conceptual / mental-model session (2026-04-26). The closing quote block from this session is excellent and is reused below.

---

> *"Mathematics is the art of giving the same name to different things."* — Henri Poincaré
>
> *"The instruments of the future will not be designed; they will be discovered."* — Iannis Xenakis (compressed from a 1970 lecture)
>
> *"What makes the desert beautiful is that somewhere it hides a well."* — Antoine de Saint-Exupéry, *Le Petit Prince*
