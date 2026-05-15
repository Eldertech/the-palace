---
title: 2D Torus Wavetable Synthesizer
type: project
pillars:
  - creation
  - tools
  - philosophy
  - practice
born: 2026-04
stage: fruiting
status: active
forward_vector: "I want to become a working RNBO instrument with the seven-surface library validated, the Hopf fibration control surface implemented, and the warp tier system tested in performance — the first concrete instrument that incarnates DSP in Looping Dimensions. I want to demand a commercial-grade decision: ship as Loudon's signature device or remain a pedagogical test bed."
links:
  - target: "[[DSP in Looping Dimensions]]"
    type: couples-with
    label: incarnates
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: harnesses
  - target: "[[FOUR PILLARS]]"
    type: connects-to
    label: exercises
  - target: "[[Frequency-Time Duality]]"
    type: connects-to
    label: shares-spine
  - target: "[[2D Wavetable Catalog]]"
    type: spawned
    label: catalogues
  - target: "[[Torus Warping Catalog]]"
    type: spawned
    label: warps
  - target: "[[2D Torus Wavetable Synthesizer — Build Log]]"
    type: spawned
    label: chronicles
  - target: "[[README — RNBO Prototype]]"
    type: spawned
    label: prototypes
  - target: "[[Three Kinds of Warp]]"
    type: connects-to
    label: clarifies-mechanism
  - target: "[[Wavetable Space as Torus]]"
    type: couples-with
    label: inhabits-geometry
  - target: "[[Categorizing Inharmonicity]]"
    type: connects-to
    label: exemplifies-taxonomy
  - target: "[[Boundary-Crossing Instruments]]"
    type: mirrors
    label: harmonic-inharmonic-continuum
  - target: "[[The Shop]]"
    type: spawned
    label: asset-library
---
# 2D Torus Wavetable Synthesizer

A wavetable instrument where the wavetable is a 2D surface on a torus rather than a 1D loop, scanned at audio rate by two independent phasors. The ratio of the two scan rates is the primary inharmonicity gate. The instrument is the concrete incarnation of [[DSP in Looping Dimensions]], the proving ground for whether the principle generates musically interesting sound, and the four-pillar project that Loudon is using to test his own understanding as a synthesizer designer.

## Why This Project Exists

The seed was a specific frustration with FM synthesis. FM produces sidebands at C ± n·M — a comb whose teeth are always arithmetically related to the carrier/modulator ratio. Piano-style inharmonicity is structurally different: partials sit at fₙ = n·f₀·√(1 + B·n²), with a quadratic stretching that *accumulates* across the spectrum. FM cannot produce that accumulating deviation as a first-class control. The 2D torus wavetable can — though as [[Three Kinds of Warp]] makes precise, the load-bearing work is done by the irrational-ratio gate and the coupled-flow warps; the second dimension is the substrate that makes both available, not the mechanism by itself.

The project also serves a second function. It is the instrument that puts Loudon's accumulated synthesis intuitions on trial. If the math is right, the surface library is rich, and the implementation is honest, the result is an instrument with sonic territory that no commercial synthesizer currently occupies. If something is wrong in the design, building the instrument is how it surfaces.

## Architecture

The wavetable is a function `W(φ₁, φ₂)` on the torus T² = S¹ × S¹ — a height map with two independent angular axes. Its 2D Fourier series is:

**W(φ₁, φ₂) = Σ_{m,n} c_{mn} · e^(i(mφ₁ + nφ₂))**

The coefficients `c_{mn}` form a 2D lattice spectrum — the spectrum *of the surface itself*, distinct from the spectrum of any single output waveform.

The surface becomes audio by scanning. Two independent phasors at frequencies ω₁ and ω₂ trace a path φ₁(t) = ω₁·t, φ₂(t) = ω₂·t, and the output signal is W evaluated along that path. Substituting the Fourier expansion gives:

**output spectrum: f_{mn} = m·ω₁ + n·ω₂** for every (m,n) where c_{mn} ≠ 0

This is the central design fact. The reachable output frequencies are *every integer combination* of the two scan rates, weighted by the surface coefficients.

The ratio ω₁/ω₂ is the primary inharmonicity gate:

- **Rational ratio (p/q in lowest terms):** the scan path closes into a (p,q) cable curve on the torus. Every output frequency is a rational multiple of a common fundamental ω₂/q. The signal is periodic, the spectrum harmonic.
- **Irrational ratio:** the scan path is a Kronecker flow — it never closes, and over time it covers the torus densely. The signal is quasi-periodic with two genuine independent fundamentals. The spectrum is inharmonic in a structured way determined entirely by the surface.

Detuning the ratio off rational opens a closed orbit into an ergodic trajectory. This unifies, under one geometric control, what was previously a scattered collection of techniques: chorus, detune, sub-oscillator stacking, octave doubling, ring modulation, and inharmonic shimmer. (Ring modulation is the special case where only c_{1,1} and c_{1,-1} are nonzero — a single point in this design space.)

A second inharmonicity layer comes from physical modeling. The piano stiffness coefficient B can be applied as a position-dependent velocity warping on the scan path itself, so accumulated quadratic stretching enters at the geometric level rather than as a post-processing EQ.

(Disambiguation: "wavetable" here is used in its oscillator sense — the surface is read to produce a signal. Wavetables can also be used as filters, via waveshaping or spectral morphing; that's a separate and worthwhile direction, flagged below as a lost branch.)

## The Seven Surfaces — Design Language

The wavetable surface *is* the instrument's voice. Each surface is a different physical or mathematical world made audible. The current library:

1. **Membrane** — acoustic-physical eigenmodes of a 2D drum head. Natural 4-fold symmetry; modal partial structure with familiar percussion-spectrum character.
2. **Chladni Ghost** — designed around the nodal patterns of vibrating plates. 4-fold symmetric. Sharp ridges and valleys that produce strong partials at lattice points.
3. **Theta Surface** — built from Jacobi theta functions. Modular (PSL(2,Z)) symmetry. Number-theoretic spectrum with naturally rich and unusual partial relationships.
4. **Stiff String** — geometric encoding of the piano-stiffness B coefficient as accumulated stretching on the surface. The closest direct mapping from physical-instrument inharmonicity to surface design.
5. **Knot Shadows** — surfaces whose features align with (p,q) cable trajectories. When scanned at the matching rational ratio, the closed knot path traces the feature; detuning opens the knot into quasi-periodic territory.
6. **Penrose Interference Lattice** — quasicrystal-flavored surface with golden-ratio spacing. Genuine 5-fold local symmetry that no periodic lattice can host. Built via cut-and-project from a higher-dimensional periodic structure.
7. *Seventh surface to be reconfirmed from source conversations and added or replaced.* The library is open — these seven are seeds, not a closed set.

A symmetric morph stack across these surfaces is constrained by point group: surfaces sharing a common symmetry can crossfade cleanly; surfaces with different symmetry classes (e.g., Theta's modular symmetry vs. Membrane's 4-fold) need a different morph treatment. This constraint is itself a useful design tool.

## The Five Generating Logics — Authoring Methods

The seven surfaces are instances. The five logics are the *methods* by which surfaces get authored. They are stackable layers, not competing alternatives.

1. **Direct Fourier coefficient design.** Sculpt c_{mn} explicitly. Best for surfaces specified spectrally rather than spatially (Theta Surface, Stiff String, Penrose Interference Lattice).
2. **Operator algebra.** Define W as the eigenfunction of a differential operator on the torus. Laplace-Beltrami gives standard 2D Fourier modes; anisotropic diffusion breaks axis symmetry; nonlinear operators (p-Laplacian) yield non-sinusoidal eigenfunctions with natural harmonic richness; Dirac operator yields spinor-valued eigenfunctions topologically entangled with the torus. Generating question: *what differential equation does this instrument obey?*
3. **Dynamical systems (Kuramoto).** Replace the linear scan with coupled oscillator dynamics: dφ₁/dt = ω₁ + K·sin(φ₂ − φ₁), dφ₂/dt = ω₂ + K·sin(φ₁ − φ₂). Below the synchronization threshold (K < Δω/2): quasi-periodic. Above threshold: phase-locked, harmonic. The transition is a *bifurcation* — a snap, not a fade. The harmonic↔inharmonic move becomes a phase transition. See [[Kuramoto Coupling]].
4. **Random fields.** W is a realization of a random field with specified covariance K(φ₁−φ₁', φ₂−φ₂'). Designs spectral *statistics* rather than content. Each note triggers a fresh realization with the same character — mimicking how real acoustic instruments work. Matérn covariance for warm-smooth surfaces; power-law for 1/f spectral statistics matching natural music statistics.
5. **Information geometry.** W is the log-likelihood of a statistical model. The torus is a statistical manifold with the Fisher information metric. Geodesics are paths of maximum statistical efficiency. The most radical departure from physical intuition; the natural bridge to AI-driven synthesis.

## Warps — A Second Surface Library

The seven surfaces are *what the instrument is*; the warps are *what the player does to it while playing*. Together they form two orthogonal libraries: a library of voices (surfaces) and a library of hands (warps that reshape voices in real time). The full warp library is in [[Torus Warping Catalog]] — fifteen entries from per-axis phase bend (Tier 1, three lines of codebox) to Hopf-fibration parameterization (Tier 4, speculative).

Two architectural lessons from the warp catalog have already shaped the implementation path:

- **Linear phase-space warps are absorbed by scan rates.** Shear and rotation in (φ₁, φ₂) coordinates produce nothing beyond retuning. To make these structural they must operate on the surface itself. This isn't a limitation — it's the architecture telling you exactly where each kind of expressivity belongs.
- **The lookup-table-and-crossfade pattern dominates.** Most warps split cleanly into "offline coefficient-space transformation, online crossfade" and "online phase math." The split is the implementation taxonomy that matters.

Warps land *after* the RNBO prototype is alive — first the surface plays cleanly, then the per-sample Tier-1 warps (phase bend, variable-rate phase shear, self-displacement) earn their seat, then the lookup-table-and-crossfade infrastructure gets built once and the rest of Tier 1/Tier 2 unlock together.

## Hopf Fibration as Control Surface (Next-Steps Territory)

The Hopf fibration S³ → S² is not a waveform generator. Its role is as a control topology. The Kuramoto bifurcation surface in (K, Δω) parameter space has topological structure that maps naturally onto S² — and the linked-fiber structure of the Hopf bundle gives a control space where moving "around" S² produces continuous but globally non-trivial phase and ratio changes. Linked fibers ≈ linked timbral identities. The geometry doesn't automatically deliver musical legibility; the mapping from S² to synthesis parameters has to be deliberately constructed. Flagged as a high-value step once the core instrument is built and a performance interface is needed.

## Implementation Path

Loudon is fluent in the relevant tools; nothing here demands new infrastructure.

- **Max/MSP:** the surface as a `jit.matrix`, two `phasor~` objects driving sample-and-interpolate lookup. The simplest working prototype path.
- **RNBO / `codebox~`:** the scan as 20 lines of codebox; the surface loaded as a buffer. Produces an exportable Max for Live device, VST3, or AU.
- **Gen~:** the scan plus Kuramoto dynamics together — explicit coupled-ODE integration (Euler or RK4) is straightforward in Gen~. This is the path if the Kuramoto layer is wanted from day one.

Resolution and interpolation are open: 512×512 vs 1024×1024 surfaces; bilinear vs bicubic vs spectral interpolation. To be settled empirically once prototyping starts.

## Four Pillars Design Plan

This project genuinely activates all four pillars, which is what makes it the right project to anchor a [[Loudon Live]] cycle around.

- **Creation.** Build the instrument. Compose with it. Develop the surface library to ten, twenty, fifty surfaces. Make recordings that demonstrate the territory.
- **Tools.** The build itself — Max/MSP/RNBO/Gen~ implementation, surface authoring tools, a UI that exposes the design language without burying users in topology. A potential commercial release as the test of whether the tool is legible to others.
- **Philosophy.** The instrument is a physical argument that *the boundary between harmonic and inharmonic is a continuous geometric parameter, not a categorical line.* It also concretely tests Spinozist intuitions: the surface is the substance, the output waveforms are modes, the scan ratio is the affection. Whether that framing illuminates anything for an audience is itself a teachable question.
- **Practice.** The discipline of designing surfaces, listening for what each one wants, and refining the relationship between mathematical structure and sonic identity. Specific-to-general pedagogy: this instrument is a concrete entry point to 2D Fourier analysis, torus geometry, quasi-periodicity, bifurcation theory, and quasicrystal mathematics. It teaches while it sounds.

## Open Questions

- How is the morphing implemented across surfaces — crossfading c_{mn} coefficients in spectral space, or crossfading W directly in spatial space? They give different transition sonics.
- Should the Kuramoto trajectory replace the linear scan, or augment it as an alternative scan mode? K as a morph parameter between regimes is a third option.
- Surface resolution and interpolation scheme — to be settled empirically.
- How does the UI expose the design language? Direct Fourier coefficient editing, surface painting, parametric presets, or some combination?
- How does the Hopf control surface get mapped to musically legible parameters? The mapping is the work, not the formula.

## Lost Branches

Paths opened across the source conversations and not folded into this project (each is a candidate future entry):

- **Wavetable as filter.** Waveshaping, spectral morphing, time-varying multiband filtering driven by wavetables. A genuinely underexplored region of mainstream tools.
- **4D hyperprism / multi-parameter-per-frequency optics analogy.** Wavelength → 2D position; frequency → multi-parameter filter control (cutoff + Q + gain simultaneously).
- **The Crystal — learned-manifold synthesis.** Treat the surface as a learned latent slice of a much higher-dimensional trained manifold. Differentiable-DSP / DDSP territory.
- **Persistence homology of audio** and **synchrosqueezing reassignment.** Analytical / inverse-problem frontier. Adjacent.
- **Convolution kernels that scan T^N alongside audio.** The convolutional sibling of this synthesizer, flagged in [[DSP in Looping Dimensions]].

## Status (2026-04-27)

The instrument is at the *catalog-and-listen* phase, with the warp framework now folded in as planning material for what comes after the prototype. The math is real on disk; Loudon has confirmed the wavetables sound like they were promised to; each surface is reading as a *family* of sounds rather than a single voice — which is exactly the architectural promise paying out. Concretely:

- **Diagnostic verified.** [[00 — Test Diagnostic Wavetable]] passes the Stage-1 patch tests; the 1024×1024 rebuild kept anchor positions exact at Y = k/16.
- **Catalog built and verified.** [[2D Wavetable Catalog]] holds 11 entries: a 16-anchor diagnostic, four utility wavetables, and six named surfaces (Membrane, Chladni Ghost, Theta, Stiff String, Knot Shadow, Penrose). The seventh surface slot is open. All entries are 1024×1024 (square — Y axis is sampled as densely as X so audio-rate Y phasors don't introduce row-stepping aliasing). Loudon's evaluation: "these wavetables work well."
- **Warp framework documented.** [[Torus Warping Catalog]] folds in the fifteen-warp design space developed in conversation — three places a warp can live (phase / coefficient / surface), four tiers of complexity, and the architectural lessons that fall out (linear phase-space warps are scan-rate-absorbed; lookup-table-and-crossfade is the dominant pattern). Companion to [[2D Wavetable Catalog]] — surfaces are voices, warps are hands.
- **Tools are in `Tools/`.** `visualize_wavetable.py` renders any well-formed wavetable WAV as a heightmap or stacked-rows PNG. `build_catalog.py` regenerates every catalog entry idempotently. `rebuild_diagnostic.py` regenerates the diagnostic. All three are dependency-light Python (numpy + Pillow).
- **Loudon's read.** Each surface feels like a family of sounds, not a single voice. The next moves on the table are: an RNBO prototype to confirm the math under live control alongside Max's `2d.wave~`; then more exotic territory — 3D wavetables on T³ and surface-to-surface morphing.

For the chronological build history (decisions, what was tried, what changed) see [[2D Torus Wavetable Synthesizer — Build Log]].

## Open Decisions

- **Y-axis interpolation strategy.** Linear sample-domain interpolation between dissimilar anchor waveforms drops RMS at the midpoint — up to ~3 dB for orthogonal anchors, ~10 dB for the worst negatively-correlated case (sine → rising sawtooth in the diagnostic). Affects [[00 — Test Diagnostic Wavetable]] and [[01 — Sine Cycle Sweep]] meaningfully; does not affect duty-cycle / 3rd-harmonic morphs (correlated anchors) or the Tier-2 surfaces (smooth 2D continuous functions). Three candidate fixes are live: equal-power crossfade, constant-RMS post-normalization, spectral-domain interpolation. Constant-RMS is the cheapest robust answer; spectral-domain is the right tool for cross-symmetry surface morphs (Membrane ↔ Chladni). Decision deferred — the current build is musical enough to keep moving.
- **The seventh surface.** §"Seven Surfaces" above enumerates six explicitly and leaves the seventh open. The catalog gap is itself a forcing function for resolving it.
- **RNBO prototype validation.** The codebox~ source is written (`RNBO/torus_2d_lookup.codebox`) — Penrose surface, base + ratio params, bilinear lookup via `peek`. Awaiting Loudon to assemble the parent Max patch and run the five-step verification protocol in [[README — RNBO Prototype]]. Acceptance criterion: A−B difference monitor at numerical-noise floor.

## Forward Vectors

- **RNBO prototype validation** — the immediate next move. Source written 2026-04-27 in `RNBO/torus_2d_lookup.codebox`: starting surface [[15 — Penrose Lattice]], `baseHz` + `ratio` params, bilinear lookup via `peek("tablebuf", row*1024+col, 0)`. Awaiting Loudon to assemble the parent Max patch (parallel `2d.wave~` for direct A/B) and run the five-step verification protocol in [[README — RNBO Prototype]]. The conversion of the catalog from raw material to a real-time instrument hinges on the difference monitor going silent.
- **Per-sample Tier-1 warps** — once the prototype plays cleanly, the cheapest warps to add are the ones that need no precomputation: per-axis phase bend (#1), variable-rate phase shear (#6), self-displacement (#12). A few lines each in codebox~.
- **Lookup-table-and-crossfade infrastructure** — built once, unlocks the rest of Tier 1 and Tier 2: shear (#2), isotropic diffusion (#3), anisotropic diffusion (#4), rotation (#5), spectral masks (#7).
- **Develop the surface library beyond seven** — the goal is a meaningful catalog that demonstrates the design language across symmetry classes and generating logics. Each surface so far has read as a family of sounds, which makes "more surfaces" a high-leverage move.
- **Compose a test piece using only the prototype.** The piece is the proof — if the instrument doesn't yield music, the design needs rethinking, not refinement.
- **Decide whether this becomes a commercial release.** If yes: UI design, surface preset curation, naming, pricing. The commercial question is a teaching constraint, not just a business one — it forces the design to become legible to others.
- **The exotic frontier.** Once the 2D instrument is alive: the third looping dimension (T³, with surfaces becoming volumes and the scan a 3-vector through them); morphing 2D wavetables (smooth interpolation between catalog surfaces, with the symmetry-class problem becoming a research direction in itself); Hopf as performance control; and the convolutional siblings.

---

> *"What we call music is only what falls between the cracks of the harmonic series."*
> *"The torus is my favorite surface. It has no inside or outside, no privileged point, no hierarchy. It is the surface of music."*
> *"In nature, the laws are not so much obeyed as they are disclosed."* — Spinoza
