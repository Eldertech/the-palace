---
title: The Curve Is the Material
type: concept
pillars:
  - creation
  - tools
  - philosophy
  - practice
born: 2026-04
stage: growing
energy: very high
hook_quality: 9
beauty: 9
last_activated: 2026-04
activation_count: 1
links:
  - target: "[[Inharmonic Wavetable Synthesis]]"
    type: deepens
    label: design-refinement
  - target: "[[Wavetable Space as Torus]]"
    type: enables
    label: analytic-fuel
  - target: "[[Categorizing Inharmonicity]]"
    type: connects-to
    label: function-families
  - target: "[[Bessel Functions in Synthesis]]"
    type: connects-to
    label: one-family-among-many
  - target: "[[Piano String Inharmonicity]]"
    type: connects-to
    label: canonical-instance
forward_vector: "I want to become a concrete design specification for the Wavetable B editor — the function picker UI with parameter sliders, the analytic evaluation pathway replacing table lookups, and the morphing-in-physical-space behavior. I also want to be tested against the crystal synthesis project: are the photonic mode functions already parameterized in a way that plugs directly into this library model?"
---

# The Curve Is the Material

Every physically meaningful inharmonic spectrum is described by a mathematical function of partial number. Not a table of arbitrary values — a function with a small number of parameters. The B-coefficient formula is one. Bessel function zero positions are another. Photonic crystal dispersion relations are a third. This observation, once noticed, reorganizes the entire design of [[Inharmonic Wavetable Synthesis]].

The Wavetable B curve doesn't describe a material's inharmonicity. **It is the material's inharmonicity.** The function shape and its parameters uniquely identify a physical system. Loading a different function is loading different physics.

---

## The Insight: Natural Inharmonicity Lives in Parametric Families

Consider what "arbitrary" Wavetable B detuning would mean: partial 1 detuned by 3 cents, partial 2 by −7 cents, partial 3 by 11 cents — uncorrelated, unpredictable. No physical material behaves this way. Physical materials have mode spectra governed by their geometry and material properties, which are described by boundary-value problems whose solutions are *smooth functions* of mode number.

The stiff string's partials follow f(n) = n·f₀·√(1+B·n²) — a monotonically curving family parameterized by one number B, which encodes string diameter, tension, and material stiffness.

A circular membrane's modes land at the zeros of Bessel functions J_m(x), which are irregular but deterministic and parameterized by the mode order m.

A photonic crystal's allowed resonance frequencies follow a dispersion relation ω(k) that depends on the crystal's periodic geometry — computable, smooth, and parameterized by the crystal's structural constants.

In each case: one or two numbers, plus a function shape, completely specifies the entire inharmonic spectrum. This is the **parametric constraint** that physical reality imposes — and it turns out to be generative, not limiting.

---

## Design Implication: Function Library Over Freehand Curve

If natural inharmonic spectra live in parametric families, then the primary interface for [[Inharmonic Wavetable Synthesis]]'s Wavetable B editor should not be a freehand curve. It should be a **material physics library**: a set of named function families, each with one or two parameter sliders, and a live curve display rendering the output of the currently selected function.

The workflow becomes: choose a material family → adjust its physical parameters → hear and see the result. The flat horizontal baseline (harmonic series) is always visible. The rendered curve shows exactly what the material's physics is doing to the partial stack.

**The function library entries:**

- **String stiffness (B coefficient):** f(n) = n·f₀·√(1+B·n²). Parameter: B (stiffness coefficient). Curve: nearly flat at low partials, increasingly curved upward at high partials. Physical range: B ≈ 0.0002 (light guitar string) through B ≈ 0.004 (heavy piano bass string). B > 0.01: no real material, but sonically coherent "hyper-stiff string."

- **Circular membrane (Bessel zeros):** Partials placed at scaled zeros of J_m(x). Parameter: mode order m (integer or blended). Curve: irregular, instrument-specific clustering. The bell, cymbal, and drum family.

- **Photonic / crystal modes:** Dispersion relation from crystal band structure. Parameters: structural constants of the specific crystal geometry. Already derived for the crystal synthesis project — these plug in directly.

- **Waveguide dispersion:** Tube resonance with end corrections. Parameter: end correction coefficient. Produces gentle upward curve, close to but distinct from the B coefficient family.

- **Logarithmic stretch:** f(n) = f₀·n·(1 + α·log(n)). One parameter. Gives a slower-than-quadratic rise, occupying a different region of the space than the B coefficient.

- **Invented physics (free draw):** The escape hatch. For detuning patterns with no physical analog — sinusoidal alternation, step functions, stochastic scatter. Present as a mode, not the default. The library is the front door; free draw is the back room.

---

## The Morphing Quality Distinction

Arbitrary Wavetable B curve interpolation (frame to frame) blends two curve shapes mathematically. The intermediate states may correspond to no coherent physical model.

Function parameter interpolation stays within the physical family. Morphing B from 0.001 to 0.003 traverses the space of real stiff-string materials continuously. Every point in the morph is a physically realizable string.

Function type interpolation — blending between the B-coefficient curve shape and a Bessel-zero profile — moves through **hybrid-physics space**: materials that don't exist but whose inharmonic structure is the weighted sum of two real physical models. The morph passes through states that feel physically motivated even when they correspond to no actual material. This is qualitatively different from arbitrary curve blending: it's a path through physics space, not through curve space.

---

## Analytic Efficiency

If detunings are evaluated analytically rather than looked up in a table:

- **Memory:** function parameters only — a handful of floats per voice, compared to 64 frames × N partial slots for a sampled Wavetable B.
- **Computation per partial per buffer:** one formula evaluation. For B coefficient: n · f₀ · √(1 + B·n²) — three multiplications, one square root. For Bessel zeros: one small table lookup (the zero positions, perhaps 20 values total).
- **Modulation:** B is modulated at audio or LFO rate with one scalar. All N partial frequencies update coherently from that single value.

This analytic path is also the key that unlocks the T³ / path-following synthesis approach described in [[Wavetable Space as Torus]]: an analytically defined detuning function means the T³ scalar field can be evaluated on-the-fly rather than precomputed. The memory-vs-computation trade-off that made the 3D table impractical collapses when the function is analytic.

---

## Cross-Domain Resonances

### [[Spectroscopy]] and Molecular Mode Families

Molecular absorption spectra — infrared, Raman, NMR — are not arbitrary peaks. They are governed by the molecular Hamiltonian, and the allowed transition frequencies follow specific functional forms: the quantum harmonic oscillator (evenly spaced), the Morse potential (anharmonic, converging series), or coupled-mode models. Spectroscopists navigate parameter space (bond strength, reduced mass, anharmonicity constant) to identify materials. This is structurally identical to the synthesis function library: a family of curves, each parameterized by physical constants, each corresponding to a specific material identity.

### [[Phonon Dispersion]] in Crystal Lattices

The vibrational modes of a crystal lattice (phonons) are described by dispersion relations ω(k) — exactly the structure of the inharmonic synthesis function. The Debye model gives one functional form; the Einstein model gives another; real crystals require the full dynamical matrix. The crystal synthesis project's photonic modes are the optical analog of acoustic phonons. Both live in this library.

### Architecture and Structural Resonance

A building's resonant frequencies are a function of its geometry. Tall buildings, bridges, and shells all have mode spectra described by their structural equations. Inharmonic synthesis and structural engineering are both asking: given this material and geometry, what mode frequencies does it produce? The function library is the answer in both domains.

---

## The Constraint Is Generative

Limiting Wavetable B to physically motivated function families does not reduce the instrument's expressivity. It *focuses* it. The B coefficient can be pushed well beyond any real material's range — hyper-stiff strings with B = 0.1 produce inharmonic spectra nothing physical ever generates, but the curve shape is coherent and the sound is navigable. Bessel modes can be blended and scaled beyond physical membrane behavior. The physical functions are a foundation, not a ceiling.

What the constraint eliminates is *incoherent* detuning — the arbitrary scatter of per-partial values that corresponds to no physical principle and no navigable parameter. Real synthesis interest lives in the structured regions of the detuning space, which are exactly the regions the function library covers. The free-draw escape hatch preserves access to incoherent territory for when incoherence is the artistic goal.

---

## Open Questions

- Are the photonic mode functions from the crystal synthesis project already in a form that parameterizes cleanly into this library? If so, those entries in the library are already done.
- Is there a unified functional form that smoothly interpolates between the B-coefficient family and the Bessel-zero family — a "string-to-bell morph function" with one interpolation parameter? This would collapse two library entries into one family with a wider parameter range.
- What does the Sethares tuning-timbre relationship ([[Harmonicity and Inharmonicity]]) look like when expressed in terms of function families rather than arbitrary partial frequencies? Are there specific function types that produce naturally consonant intervals in specific tuning systems?
- Can the function library concept extend to Wavetable A (the amplitude axis)? Are natural timbral amplitude envelopes also described by a small set of parametric functions? If so, both axes of [[Inharmonic Wavetable Synthesis]] are navigable parameter spaces rather than arbitrary curves.

---

*Physical materials don't choose their mode spectra arbitrarily. Every bell, string, membrane, and crystal produces partials according to its geometry and physics — a few numbers, a function shape, and the entire spectrum is determined. The Wavetable B curve is that function made visible. To design a sound is to choose a physics.*
