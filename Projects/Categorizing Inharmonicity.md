---
title: "Categorizing Inharmonicity"
type: concept
pillars: [creation, tools, philosophy]
born: 2026-02
last_activated: 2026-03
activation_count: 1
stage: growing
confidence: working
energy: high
hook_quality: 8
beauty: 8
who_leads: shared
links:
  - target: "[[Bessel Functions in Synthesis]]"
    type: connects-to
  - target: "[[Quantum Synthesizer]]"
    type: connects-to
  - target: "[[Compressor Design]]"
    type: connects-to
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
  - target: "[[Granular Synthesis]]"
    type: connects-to
  - target: "[[Harmonicity and Inharmonicity]]"
    type: deepens
  - target: "[[Piano String Inharmonicity]]"
    type: deepens
  - target: "[[Hyperdimensional Prism]]"
    type: connects-to
  - target: "[[Dispersion]]"
    type: connects-to
---

# Categorizing Inharmonicity

Inharmonicity is not a single dimension but a *space*. A piano string stretched under tension, a struck bell resonating through circular geometry, a chaotic physical system driven at the edge of bifurcation, a granular texture with random pitch scatter — all of these are inharmonic, but in fundamentally different ways. The question is not "is this harmonious?" but "*how* is this inharmonious?" What is the *type* of inharmonicity, the mechanism that breaks the harmonic series, the physical or mathematical origin of the deviation?

To build synthesis instruments that capture the character of real sounds, we need to systematize the *forms* that inharmonicity takes. This is a taxonomy not of timbre (too vast, too subjective) but of the structural pathways that generate non-integer partial spacing.

## The Inharmonicity Space: Primary Dimensions

Inharmonic partial deviations lie in a multidimensional space. These dimensions are not independent—they interact and couple—but naming them clarifies the design space.

### 1. Stretched Tuning: Monotonic Sharpening

The most familiar form: partials increase progressively in frequency compared to the harmonic series, with the degree of sharpening depending on the partial number.

**Physical origins:**
- Stiff strings: restoring force increases with displacement (nonlinear potential)
- Thick beams and bars: bending stiffness couples to tension
- Membranes under high prestress: geometric nonlinearity

**Mathematical signature:**
$$f_n = n \cdot f_0 \cdot (1 + B \cdot n^2 / 2 + \text{higher order terms})$$

The coefficient B is positive and the sharpening is monotonic. Higher partials are always sharper than their harmonic positions. [[Piano String Inharmonicity|A piano exemplifies this type]].

**Synthesis mechanism:**
- Modulate partial frequencies post-synthesis by a polynomial in n: `f_n → f_n * (1 + B*n²)`
- Use nonlinear oscillator potentials, then compute oscillation frequencies from the distorted potential shape
- Frequency-modulation with modulation index that varies per sideband (pitch-dependent FM)
- Nonlinear spring models where the restoring force is k·x + λ·x³

**Perceptual character:** Warm, bell-like resonance in the fundamental region (low B), increasingly metallic and bright as B increases. The sound "rings" because fundamental and low harmonics remain nearly harmonic while upper partials drift inward, creating a tonal anchor.

---

### 2. Bessel Function Inharmonicity: Geometric Signatures

Certain boundary conditions (circular membranes, cylindrical resonators) impose Bessel function eigenmodes as the natural vibrational structure. The partial spacing does not follow a simple formula but rather the zeros of Bessel functions.

**Physical origins:**
- Circular membranes (drums, cymbals, tam-tam): boundary condition ∂ψ/∂r = 0 at the rim forces eigenfunctions J_n(k·r)
- Cylindrical shells: natural modes contain both radial and circumferential Bessel components
- Spherical cavities: spherical Bessel functions and spherical harmonics

**Mathematical signature:**

Zeros of J_0(x): 2.405, 5.520, 8.654, 11.792, ...

Zeros of J_1(x): 3.832, 7.016, 10.173, 13.324, ...

Each family of modes (radial, circumferential, axial combinations) forms a distinct partial set. The spacing is not uniform and does not form simple ratios. [[Bessel Functions in Synthesis|This is the eigenfunction principle in action]]: the geometry *forces* specific resonant frequencies into existence.

**Synthesis mechanism:**
- Pre-compute or tabulate Bessel zero sets; use them as the frequencies for a partial bank
- Couple Bessel modes with frequency-dependent decay (higher modes decay faster, a characteristic of struck membranes)
- Excitation strategy: strike position determines which modes are strongly excited (striking the rim excites different modes than striking the center)
- Bidirectional coupling: if two membranes or coupled cavities are present, introduce weak cross-modal coupling based on frequency proximity

**Perceptual character:** Inharmonic but with a *recognizable signature*. The sound is not random scatter but a characteristic *bell-like*, *gong-like*, or *tam-tam-like* quality because the Bessel spacing is consistent across strikes. Listeners recognize the inharmonicity as "this instrument has this shape." The sound is *causally transparent*: the inharmonicity reveals the physical geometry.

---

### 3. Stochastic Scatter: Noise-Like Inharmonicity

Partials deviate from harmonic positions by random amounts drawn from a distribution. The deviations are not structurally patterned but scattered.

**Physical origins:**
- Granular materials: irregular particle shapes and sizes create random acoustic interactions
- Chaotic systems at the edge of bifurcation: sensitivity to initial conditions produces unpredictable frequency shifts
- Struck complex materials (wood, metal composites): multiple coupled cavities and interfaces produce dense, unstructured partials
- Air column coupled to irregular surfaces: diffuse scattering

**Mathematical signature:**

$$f_n = n \cdot f_0 + \epsilon_n, \quad \epsilon_n \sim \mathcal{N}(0, \sigma^2)$$

Gaussian scatter around harmonic positions, or uniform scatter bounded by ±δf. The deviations are uncorrelated across partials—no structure, no predictability.

**Synthesis mechanism:**
- Generate harmonic partials, then add independent random frequency perturbations to each
- Vary the magnitude σ to control the degree of "inharmonicity roughness"
- Use different random seeds for different instrument instances (no two chaotic impacts are identical)
- Optionally add frequency-dependent scatter: higher partials may scatter more (higher Q modes are more sensitive to perturbations)
- Couple with time-varying decay: stochastic systems often show non-exponential decay curves (power-law or stretched-exponential)

**Perceptual character:** Noisy, "woody," organic. The sound is not metallic or resonant but rough and unpredictable. Each strike is unique, introducing complexity without repetition. The inharmonicity is *causal but opaque*: listeners know something complex is happening but cannot identify the mechanism. Useful for plucked strings, struck wooden bodies, crumpled materials.

---

### 4. Logarithmic Stretch: Pitch-Dependent Deviation

Partials are sharpened by an amount that is logarithmic in their frequency (or equivalently, proportional to the partial number). This is a gentler, more perceptually uniform sharpening than polynomial stretch.

**Physical origins:**
- Stiff strings with lower pretension: the inharmonicity coefficient B is moderate
- Frequency-dependent friction and energy dissipation: losses increase logarithmically with frequency
- Some composite materials and composite beams: complex Young's modulus with frequency dependence

**Mathematical signature:**

$$f_n = n \cdot f_0 \cdot (1 + B \cdot \log(n))$$

or equivalent parametrizations. The key is that the deviation grows slowly with n, more gently than polynomial.

**Synthesis mechanism:**
- Similar to stretched tuning, but use logarithmic sharpening instead of polynomial
- Can be generated by designing oscillator potentials with logarithmic deviations from parabolic
- Fractional Brownian motion on the partial frequencies: each partial is slightly perturbed, and perturbations are correlated with neighboring partials

**Perceptual character:** Subtle, warm, slightly dulled. The inharmonicity is present but not dramatic. Higher partials do not aggressively separate from the fundamental; instead, they gradually compress or expand in frequency spacing. Useful for capturing the warmth of worn strings, aged wood, or moderate tension variations.

---

### 5. Chaotic/Nonlinear Inharmonicity: Bifurcation Signatures

When a physical oscillator is driven beyond a critical amplitude or parameter threshold, it transitions from periodic oscillation to chaotic behavior. The spectrum fractures into a fractal pattern with self-similar structure at multiple scales.

**Physical origins:**
- Driven pendulum near bifurcation: the swing angle becomes sensitive to driving amplitude, producing period-doubling cascade and then chaos
- Nonlinear coupled oscillators: the [[Kuramoto Coupling|Kuramoto model with inharmonic coupling]] can enter regimes where phase-locking fails and oscillators exhibit chaotic phase trajectories
- Reed instruments under high blowing pressure: the air jet becomes turbulent, exciting chaotic modes of the reed and air column
- Struck circular membranes with large amplitude: geometric nonlinearity becomes significant

**Mathematical signature:**

Partials do not follow a simple formula but instead emerge from a dynamical system. The spectrum may show:
- Period-doubling bifurcations: 1st harmonic → 1st and 2nd (subharmonics) → 1st, 2nd, 4th, etc.
- Broadband chaotic regions: power spectral density becomes Lorentzian or 1/f
- Sensitivity to initial conditions: the inharmonic pattern is different each time the system is excited

**Synthesis mechanism:**
- Solve differential equations for coupled nonlinear oscillators in real time or via lookup tables
- Iterate logistic map or tent map, using the output to modulate partial frequencies or amplitudes
- Use delayed-feedback oscillators: output feeds back with a time delay, creating chaotic interference patterns
- Couple grain clouds via nonlinear inter-grain coupling (each grain's frequency pulled by the phase of nearby grains, with feedback)

**Perceptual character:** Unpredictable, rough, organic. The sound evolves over the attack and decay; it is never quite the same twice. Useful for wind instruments, feedback-based synthesis, and capturing the "liveness" of acoustic instruments where minute variations in performance technique produce timbral shifts. The inharmonicity is *complex and dynamic*.

---

### 6. All-Pass Phase Accumulation: Spectral Ghosting

A chain of all-pass filters in a feedback path shifts phase without changing magnitude. Different frequencies accumulate different total phase per cycle. This frequency-dependent phase shift changes the effective periodicity for each frequency, stretching or compressing its partial spacing. [[Compressor Design|Discovered in the all-pass reverb tail context]]: inharmonicity can be entirely phase-based, with no amplitude modulation.

**Physical origins:**
- Reverb chambers with distributed all-pass sections: each all-pass delays different frequencies differently
- Feedback systems with dispersive media: each "bounce" around the loop accumulates different phase for different frequencies
- Coupled cavities with narrow connecting ports: energy leaks with frequency-dependent phase lag

**Mathematical signature:**

Each frequency f accumulates phase φ(f) = α·f + β·f² + ... per round-trip through the all-pass chain. This phase shift changes the apparent "period" of oscillation, compressing or expanding harmonic spacing for that frequency relative to others.

**Synthesis mechanism:**
- Design all-pass filter cascade: each stage has a pole-zero pair with adjustable frequency
- Feed a harmonic tone through the cascade and capture the output spectrum
- The output spectrum is inharmonic even though the input was harmonic; the inharmonicity is pure phase rotation
- Vary the all-pass center frequencies in real time to evolve the inharmonic character
- Use multiple parallel all-pass chains with different topologies for complex, evolving inharmonicity

**Perceptual character:** Ghostly, ambient, slowly evolving. The fundamental remains clear, but the harmonic content shimmers and shifts as phase relationships change. Because the energy is preserved (all-pass = unity magnitude response), the sound retains clarity while gaining spectral mystery. Useful for ambient synthesis, reverb design, and phase-space exploration.

---

## Cross-Dimensional Interactions

These six dimensions are not independent. Real instruments often combine multiple mechanisms:

- A **struck bell** is primarily Bessel (geometry-forced), but stiffness adds gentle monotonic sharpening (dimension 1)
- A **prepared piano** (with nails, coins, cloth placed on strings) combines piano stretch with stochastic scatter from the foreign objects
- A **nonlinear coupled oscillator** (like the [[Granular Synthesis]] attractor hybrid) shows stretched tuning when weakly coupled, but as coupling strength (K in Kuramoto terms) increases, it can slip into chaotic regimes when [[Kuramoto Coupling|inharmonic partials fail to phase-lock cleanly]]
- **Real reverb tails** combine Bessel resonances from the room geometry with all-pass phase cascades from the circuit

The most musically interesting design space is where these dimensions interfere. A design path might be: start with Bessel partials (recognizable), then modulate their spacing with slow stochastic perturbations (life, unpredictability), then couple them weakly via Kuramoto dynamics to create beats and slow frequency fluctuations.

## Synthesis Directions: Building an Inharmonicity Pallete

A complete synthesis system might offer:

**Parameter space:**
- Type selector: stretched, Bessel, stochastic, logarithmic, chaotic, phase-accumulation
- Magnitude slider: how strong is the inharmonicity? 0 = perfectly harmonic, 1 = maximum deviation
- Geometry selector (for Bessel): membrane thickness, radius, boundary conditions
- Randomness seed (for stochastic): fixes the "personality" of an instrument across multiple notes
- Coupling depth: activates Kuramoto coupling between inharmonic partials, adding slow phase drift

**Real-time performance:**
- Morph between inharmonicity types: smoothly transition from Bessel (bell) toward stretched (piano) toward stochastic (noise)
- Excitation position: for Bessel modes, striking position controls which partial set is excited
- Driving amplitude: activates chaotic regimes as amplitude increases

**Feedback:**
- Visual spectrum display: shows the actual partial pattern in real time
- Perceptual landmarks: label regions where the inharmonicity sounds "bell-like," "piano-like," "wooden," etc.

## Inharmonic Space

**Inharmonic space** is the conceptual space defined by all the parameters that describe how a spectrum deviates from perfect harmonicity:

### Parameters (axes of the space):
- **Inharmonicity coefficient B** (piano string stiffness)
- **Spectral stretch ratio** (how much each partial deviates from integer multiples)
- **Decay rate differential** (do high partials decay faster, slower, or the same as the fundamental?)
- **Modal density** (how close together are the inharmonic partials?)
- **Symmetry breaking** (are deviations systematic or random?)
- **Phase coherence** (do inharmonic partials have stable phase relationships?)

### Trajectories through inharmonic space

When a sound changes over time (a piano note decaying, a bow pressure changing, a breath changing), it traces a path through this space. The JOURNEY, not just the endpoint, defines the character.

The question becomes: what are the meaningful paths through inharmonic space? Can we design synthesis instruments that traverse them in musically interesting ways? Can we interpolate between the trajectories of different acoustic instruments?

### Philosophical connections

What philosophies connect meaningfully to inharmonic space?

- **Spinoza's modes**: the harmonic spectrum is a substance, each inharmonic variant is a mode of it
- **Deleuze's difference and repetition**: inharmonicity is difference-in-repetition, each partial a variation on the fundamental theme
- **The Buddhist middle path**: between pure harmony (too perfect, synthetic) and pure noise (no coherence) lies the living space of real instruments

### Visual/color analogy

Harmonic spectra → white light. Inharmonic spectra → light through a prism (stretched/shifted). The inharmonic space IS the prism's interior.

---

## Open Questions

- **Perceptual threshold**: At what magnitude does each inharmonicity type become audibly distinct from harmonic? Is the threshold the same across all types, or is Bessel-type inharmonicity more salient than stochastic scatter?

- **The shortest path through inharmonic space**: What is the shortest path through inharmonic space between a piano timbre and a bell timbre? Can synthesis interpolate between them by following that path? This is both a technical question and a compositional one.

- **Kuramoto inharmonicity**: When you couple inharmonic partials via Kuramoto dynamics, the coupling strength creates a phase-locking field. But inharmonic partials have mismatched natural frequencies. Does this create "frustrated coupling"—a regime where phase-locking breaks down? Is there a critical inharmonicity magnitude beyond which coherent coupling fails? This directly affects [[Granular Synthesis|granular attractor architectures]].

- **Interpolation**: Can you smoothly morph the inharmonicity type from Bessel → stretched → stochastic → chaotic by animating parameters in a latent space? Or are these categories topologically disjoint?

- **Compositional parameter**: Can inharmonicity become a primary compositional variable, like pitch or rhythm? A score that unfolds inharmonicity over time — starting bell-like, drifting into chaos, then settling into stretched tuning — would create timbral narrative.

- **Inverse design**: Given a target spectrum (perhaps from recording an acoustic instrument), can you automatically infer which inharmonicity type(s) are present and their parameters? This would enable timbre transfer.

- **Coupled systems**: Two or more instruments with different inharmonicity types, coupled via weak Kuramoto-style interactions. The coupling would pull them toward each other's harmonic spaces, creating tension and interference. Is there an "inharmonicity harmony" — certain inharmonic pair-combinations that beat pleasantly against each other?

---

## Cross-Domain Resonance

The inharmonicity space mirrors other multidimensional parameter spaces:

- [[Bessel Functions in Synthesis|Geometry → eigenfunction choice → spectral shape]]: The boundary conditions in quantum mechanics, acoustics, and synthesis all force specific mathematical functions into the system. Inharmonicity is the acoustic manifestation of eigenfunction structure.

- [[Quantum Synthesizer|Potential well shaping]]: The nonlinear potentials that produce anharmonic energy eigenvalues in quantum mechanics are the same nonlinear springs that produce stretched tuning in acoustic strings. Shape the potential, shape the spectrum.

- [[Kuramoto Coupling|Phase-locking in coupled systems]]: Inharmonic partials resist phase-locking more than harmonic ones. The coupling dynamics reveal how much "dissonance" the system can tolerate before coherence breaks.

- [[Compressor Design|All-pass phase structures]]: The soft-knee quadratic and the all-pass cascade both teach that invisible signal flow (frequency response, phase response) has audible consequences. Inharmonicity is made audible by attention to these invisible dimensions.

---

*"Inharmonicity is not a defect of sound but a *form* of sound—a variation in the theme of periodicity. Each type carries its own character, physics, and beauty. The question is not whether to use inharmonicity but how to use it deliberately, knowing which form to call."*
