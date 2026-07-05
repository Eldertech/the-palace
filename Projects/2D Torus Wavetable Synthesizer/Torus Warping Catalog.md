---
title: Torus Warping Catalog
type: hub
pillars:
  - tools
  - creation
  - philosophy
born: 2026-04-27
stage: growing
forward_vector: "I am the complete map of how to touch a two-dimensional wavetable surface and what each gesture produces — from front-panel phase bends to research-level reaction-diffusion. I want to become the reference that lets a player speak the language of warp composition and understand when a warp preserves structure versus when it genuinely breaks lattices."
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: emerged-from
    label: extends
  - target: "[[2D Wavetable Catalog]]"
    type: couples-with
    label: warps
  - target: "[[DSP in Looping Dimensions]]"
    type: connects-to
    label: incarnates
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: shares-bifurcation
  - target: "[[Categorizing Inharmonicity]]"
    type: connects-to
    label: navigates
  - target: "[[Frequency-Time Duality]]"
    type: connects-to
    label: shares-spine
  - target: "[[Three Kinds of Warp]]"
    type: connects-to
    label: cut-orthogonally-by
  - target: "[[2D Torus Wavetable Synthesizer — Build Log]]"
    type: connects-to
---
# Torus Warping Catalog — A Catalog of 2D Warps

![[Torus Warping Catalog — hero.png]]

> Sister catalog to [[2D Wavetable Catalog]]. The wavetable catalog answers *what surface*; this catalog answers *what to do to a surface*. Surfaces are voices; warps are the hands that reshape the voice in real time.

## Framing

The word **warp** has at least three distinct uses worth keeping straight from the start:

- **Time-warp** in DAWs (Ableton) — temporal stretching of an audio signal.
- **Phase-warp** in wavetable synths (Serum, Wavetable, Phase Plant) — distortion of an audio-rate phasor's input function.
- **Geometric warp** — a transformation of a surface or its parameterization, as in differential geometry or image processing.

This catalog is concerned with the third, in the form that reduces to the second when the surface is 1D: smooth, parameterized transformations of *how* the synthesizer's two-dimensional surface is sampled or *what* shape it has.

Three places a warp can live in this architecture:

- **Phase-space**: per-sample modification of (φ₁, φ₂) before lookup. Cheap, real-time, but constrained — *linear* phase-space warps (shears, rotations, scalings) are absorbed by the scan rates and produce nothing beyond retuning. Only **nonlinear** phase-space warps are structurally novel.
- **Coefficient-space**: modification of the c_{m,n} table directly. Always structural because it changes the surface's spectrum. Typically offline, but interpolatable for smooth control.
- **Surface-space**: modification of W as a 2D function on T². Equivalent to coefficient-space via FFT but sometimes the clearer lens.

A pattern worth flagging in advance, because it dominates implementation: **lookup-table-and-crossfade**. Precompute surfaces at a small number of parameter values; crossfade between them. Almost every warp below can be made real-time-controllable this way at modest memory cost. The exception is phase-space warps that are genuinely nonlinear in (φ₁, φ₂), which run per-sample directly.

The catalog is ordered from obvious-and-immediately-useful to complex-and-experimental. Each entry: math, knob, sonic character at neutral / moderate / extreme, compositional behavior, implementation notes.

---

## Tier 1 — Front panel

### 1. Per-axis phase bend (×2)

**Math** *(phase-space)*: φᵢ ← hᵢ(φᵢ), where hᵢ is a smooth monotone bijection of [0, 2π). Common choices: piecewise-linear with a single break (asymmetric stretch), tanh/sigmoid (smooth bend), rational (sync-like compression).

**Knob**: per-axis bend amount bᵢ ∈ [-1, 1]. Zero = identity.

**Sonic**: redistributes amplitude *along single rows or columns* of the lattice. e^(i·m·hᵢ(φᵢ)) as a function of φᵢ still has Fourier support on integers, so lattice positions don't move; only |c_{m,n}| changes within each row or column. At b=0, neutral. Moderate b: subtle brightening or darkening of one axis's contribution. Extreme b: hard sync-like timbral shift on that axis only.

**Compositional**: commutes with anything else that's separable per-axis. Doesn't commute with non-separable warps. Composes sensibly with surface drawing — bending a stiff-string curve along its own axis just reshapes its envelope.

**Implementation**: phase-space; one nonlinear function lookup per sample per axis. The cheapest entry in the catalog. Free in Gen~/RNBO.

*Note*: this is **not** an inharmonicity-generating warp — lattice positions are fixed, only amplitudes redistribute. It earns its Tier 1 spot for being the control players already expect to find.

---

### 2. Coefficient-space lattice shear

**Math** *(coefficient-space, integer s)*: c'_{m,n} = c_{m-sn, n}. The lattice is rearranged: a coefficient at (k, n) now sits at (k+sn, n).

**Math** *(continuous s)*: smooth interpolation between integer-shear surfaces. Surfaces W(s) at s ∈ {…, -1, 0, 1, 2, …} are precomputed; intermediate s is a crossfade.

**Knob**: shear amount s ∈ [-2, 2], real-valued.

**Sonic**: at s=0, neutral. At s=1, energy at (0, n) moves to (n, n) — pure ω₂-axis content gains an n·ω₁ component per partial. A harmonic comb on the n-axis (partials at n·ω₂) becomes an inharmonic comb (partials at n·ω₁ + n·ω₂ = n·(ω₁+ω₂)). At extreme s, the entire spectrum is "tipped" diagonally. **This is the headline 2D-native warp**: a single knob that bends harmonic structure into inharmonic structure continuously.

*Architectural note worth keeping*: phase-space shear (φ₁, φ₂) → (φ₁, φ₂ + s·φ₁) is **absorbed by the scan rates** — algebraically identical to scanning with rate (ω₂ + s·ω₁) instead of ω₂. To make shear a structural warp rather than a retuning, it must operate on the surface, not on the phases. Same lesson applies to all linear phase-space warps.

**Compositional**: shears compose by addition of amounts (s₁ then s₂ = single shear of s₁+s₂). Doesn't commute with rotations or non-separable surface operations.

**Implementation**: precompute surfaces at s ∈ {-2, -1, 0, 1, 2}, crossfade. Memory: 5×N² floats (typically N=512 or 1024). Lookup cost: bilinear-interpolate two tables and crossfade — about 16 multiplies per sample. Tractable.

---

### 3. Isotropic lattice diffusion

**Math** *(coefficient-space)*: c_{m,n}(t) = c_{m,n}(0) · exp(-t·(m² + n²))

**Math** *(surface-space)*: ∂W/∂t = ∇²W on T² — standard heat equation.

**Knob**: time t ∈ [0, ~5], log curve.

**Sonic**: t=0 neutral; small t softens the high-(m,n) corners of the lattice — a low-pass on partial complexity. Moderate t: pronounced spectral blur, removing sharp inharmonic features. Large t: surface approaches its mean value (DC).

**Compositional**: commutes with itself (semigroup property — diffusion for t₁ then t₂ equals diffusion for t₁+t₂). Commutes with any other multiplicative mask on the lattice. Doesn't commute with shears or rotations.

**Implementation**: precompute pre-diffused surfaces at log-spaced t values, crossfade. The semigroup makes this well-behaved under modulation: small t increments correspond to small audible changes.

---

## Tier 2 — Performance controls

### 4. Anisotropic lattice diffusion

**Math** *(coefficient-space)*:

c_{m,n}(t, θ, r) = c_{m,n}(0) · exp(-t · (α∥ · k∥² + α⊥ · k⊥²))

where k∥ = m·cos(θ) + n·sin(θ), k⊥ = -m·sin(θ) + n·cos(θ), and α∥/α⊥ = r is the anisotropy ratio.

**Knobs**: time t, angle θ ∈ [0, π), anisotropy r ∈ [0, ∞]. Three knobs but musically two-and-a-half — angle and "softness" (combined t and r) read as the expressive axes.

**Sonic**: directional low-pass on the lattice. Aim along (1, 0): soften the ω₁-harmonic spine, leave ω₂-harmonics bright. Aim diagonally: soften combination partials only. r near 1: behaves like isotropic diffusion. r → ∞: pure 1D smoothing along one direction in the lattice — *some* lattice content survives indefinitely while *other* content is rapidly suppressed. Likely the most expressive sculpting tool in the catalog for shaping the harmonic/inharmonic balance.

**Compositional**: anisotropic diffusions only commute when their angles agree. Otherwise the order matters. Commutes with isotropic diffusion (which is the r=1 limit).

**Implementation**: same lookup-table strategy as iso diffusion, indexed by (t, θ, r). Three-axis crossfade. Memory: 5×8×3 ≈ 120 surfaces of N². Worth the budget for the expressive payoff.

---

### 5. Coefficient-space rotation (with bilinear splat)

**Math**: rotate lattice points by θ — (m, n) → (m·cos θ - n·sin θ, m·sin θ + n·cos θ) — landing at fractional positions. Distribute each coefficient to its four nearest integer-lattice neighbors via bilinear weights.

**Knob**: angle θ ∈ [0, π/2] (further is symmetric).

**Sonic**: at θ=0, identity. As θ increases, coefficients hop discretely between nearest-neighbor lattice positions; the bilinear splat smooths the transitions. The result is a continuous *redistribution* of energy — distinct from phase-space rotation, which is absorbed by scan rates as in the shear case. At irrational fractions of π (θ near π/8 or π/3), rotation produces dense, near-uniformly-redistributed lattice content from sparse origin lattice content — turns a stiff-string spectrum into a fog.

**Compositional**: rotations compose by addition of angles (modulo splat noise). Doesn't commute with shear — the order of rotation and shear gives different lattice geometries. This is the SL(2,ℤ) story compressed into a continuous pair of knobs (which sets up entry #8).

**Implementation**: precompute-and-crossfade. Splatting happens at precompute time.

---

### 6. Variable-rate phase shear

**Math** *(phase-space, nonlinear)*: (φ₁, φ₂) → (φ₁, φ₂ + s(φ₁)·φ₁), where s is a 2π-periodic function — a "shear schedule."

**Knob (basic)**: amplitude of s variation. Zero = uniform shear (absorbed by scan rates, neutral). Nonzero = genuinely structural.

**Knob (deep)**: the shape of s(φ₁) becomes its own 1D design surface — sinusoidal, sawtooth, quasi-random, hand-drawn.

**Sonic**: each pass through the lattice is sheared by a *different* amount depending on where φ₁ is. Generates rich sidebands around each existing partial — equivalent to FM-like spectral expansion, but with the surface's geometry as the carrier. Small amplitude: subtle thickening of partials. Large amplitude: dense sideband forests organized by the shape of s.

This is one of the warps that doesn't reduce to anything in Serum's vocabulary: it's a phase warp on one axis whose *amount* depends on the other axis. There's no second axis in 1D, so this gesture has no 1D analog.

**Compositional**: nonlinear in phase, doesn't commute with anything except identity.

**Implementation**: per-sample, one lookup of s(φ₁) and one MAC. Cheap. The shear schedule is a 1D table.

---

### 7. Spectral masks toward physical models

**Math** *(coefficient-space)*: c'_{m,n} = M_{m,n}(p) · c_{m,n}, where M is a structured mask shaped by parameter p.

**Mask families**:
- *Stiffness*: emphasize coefficients near (m, m·B(m)) where B(m) = m·√(1 + B·m²) — the inharmonicity formula for stiff strings. Amplitude falls off with distance from the curve.
- *Plate*: emphasize (m, n) on m² + n² = const — circular ridge (the dispersion relation of a thin plate).
- *Fibonacci / Penrose*: emphasize (F_k, F_{k+1}) ratios or 5-fold quasi-crystalline projections.

**Knob**: mask strength α ∈ [0, 1]. c'_{m,n} = ((1-α) + α·M_{m,n}) · c_{m,n}.

**Sonic**: at α=0, the surface plays as designed. At α=1, the surface is "filtered through" the physical model's ideal spectrum — a stiffness mask turns any surface stiff-string-shaped. Between, you hear continuous transition between the surface's native inharmonicity and the model's. **The catalog's most direct connection between abstract surface design and physical-model synthesis.**

**Compositional**: masks commute with each other (multiplication is commutative). Don't commute with shears or rotations.

**Implementation**: each mask precomputed; multiply per-coefficient at parameter changes. For modulated α, lookup-and-crossfade between the unmasked and fully-masked surfaces.

---

## Tier 3 — Composition / studio

### 8. SL(2,ℤ) modular family

**Math**: SL(2,ℤ) is the group of integer 2×2 matrices with determinant 1. Each element acts on T² as a linear map (mod 2π) and on ℤ² as a permutation. Continuous parameterization via the upper half-plane ℍ: a complex parameter τ ∈ ℍ with the modular group acting on τ by Möbius transformations. Each fundamental domain corresponds to a distinct lattice geometry.

**Knob**: position τ in ℍ — two real parameters.

**Sonic**: at integer-matrix τ values, exact lattice permutations. The two generators are the shear T(τ) = τ + 1 and the inversion S(τ) = -1/τ (a "lattice swap" exchanging ω₁ and ω₂ axes). Between integer matrices: smooth interpolations through ℍ. Approaching the cusp at τ → i∞ produces "modular collapse" — the lattice degenerates and partials condense.

**Compositional**: respects the group structure — composition of warps = matrix multiplication. The modular group's algebra becomes the algebra of warp composition. Particularly clean for sequencing: a path on ℍ traces a chain of related warps.

**Implementation**: parameterize as a continuous 2×2 real matrix interpolating between integer matrices. Pure linear phase-space action is absorbed by scan rates, so this needs to be realized in coefficient-space — precompute surfaces at integer-matrix τ values, crossfade along a path through ℍ. Memory grows quickly if you want many fundamental domains; in practice, 5-7 is plenty.

---

### 9. Lattice convolution kernels

**Math** *(coefficient-space)*: c'_{m,n} = Σ_{p,q} K_{p,q} · c_{m-p, n-q}, where K is a small 2D kernel.

**Kernel families**:
- *Edge detection* (Laplacian, Sobel): emphasizes isolated coefficients, suppresses smooth regions.
- *Ridge enhancement* (oriented Gabor, structure tensor): boosts coefficients along chosen directions.
- *Embossing* (asymmetric Sobel): introduces directional bias — partials become "shadowed."
- *Sharpening* (unsharp mask): high-pass on the lattice — emphasizes high-(m,n) detail.

**Knobs**: kernel parameters (size, orientation, gain).

**Sonic**: image-processing vocabulary translated to spectrum. Edge detection on a smooth diffuse surface returns a brittle, sparse spectrum. Ridge enhancement on a Penrose surface emphasizes the quasi-periodic ridges. Embossing produces stereo-like asymmetry between mirrored partials.

The image-processing framing makes this category open-ended — every standard image filter is a candidate.

**Compositional**: convolutions commute with each other. Convolution-then-shear ≠ shear-then-convolution.

**Implementation**: small (3×3 or 5×5) direct convolution at parameter changes. For modulated kernels, lookup-and-crossfade between precomputed convolved surfaces.

---

### 10. Reaction-diffusion evolution

**Math**: run a 2-component RD system on T² with the surface as initial condition. Gray-Scott:

∂u/∂t = D_u·∇²u - u·v² + F·(1 - u)

∂v/∂t = D_v·∇²v + u·v² - (F + k)·v

Take u(t) (or some combination of u and v) as the surface after time t.

**Knob**: time t — most musical. Deeper access: F, k (the Gray-Scott parameters that select pattern type — spots, stripes, labyrinths, oscillations, mitosis).

**Sonic**: the surface evolves through its own developmental biology. RD has preferred wavelengths, so certain spatial frequencies are amplified and others suppressed. Different (F, k) regimes give qualitatively different spectral outcomes from the same initial surface. The "playback rate" knob t walks the surface through pattern formation in real time.

**Compositional**: fully nonlinear; commutes with nothing except identity.

**Implementation**: precompute surface at log-spaced t values for chosen (F, k). RD on a 256×256 grid runs in real time on modern CPUs but is overkill for parameter modulation; precompute is the path. (F, k) modulation requires a 3D table — bigger memory hit.

---

### 11. Phase-portrait warps

**Math**: define a vector field (φ̇₁, φ̇₂) = (P(φ₁, φ₂), Q(φ₁, φ₂)) on T². Integrate for time τ to get a flow Φ_τ. Replace surface lookup at (φ₁, φ₂) with lookup at Φ_τ(φ₁, φ₂).

**Vector field families**:
- *Saddle*: (P, Q) = (sin(φ₁), -sin(φ₂)) — exponential stretch along one axis, compress along the other.
- *Spiral*: rotation + radial flow.
- *Bifurcation*: parameterized fields whose qualitative dynamics change as a parameter sweeps through critical values.

**Knob**: integration time τ, plus the parameters of the field.

**Sonic**: stretches the surface along the flow lines. Saddle warp creates dramatic anisotropic stretching — partials in some directions extend dramatically while in others compress. Bifurcation warps produce qualitative timbral changes at critical parameter values: a knob you turn and the timbre snaps from one regime to another. This is one of the few warps that natively supports *discontinuous* timbral motion as an expressive feature.

**Compositional**: depends on whether the vector fields commute (Lie bracket). Generically non-commutative.

**Implementation**: per-sample integration is too expensive. Precompute the warp lookup as a 2D map (where does each (φ₁, φ₂) end up after time τ) for chosen parameters; interpolate.

---

### 12. Self-displacement (surface as its own vector field)

**Math** *(phase-space, nonlinear)*: (φ₁, φ₂) → (φ₁ + ε·D₁(φ₁, φ₂), φ₂ + ε·D₂(φ₁, φ₂)), where D = (D₁, D₂) is a 2D field derived from the surface itself. Two natural choices:

- D = ∇W (gradient of the surface) — biases trajectory toward extrema.
- D = (∂W/∂φ₂, -∂W/∂φ₁) (rotated gradient, divergence-free) — preserves area; stirs without compressing.

**Knob**: displacement amplitude ε.

**Sonic**: the surface modulates *its own* sampling. Where the surface is steep, the trajectory accelerates; where flat, it idles. Result: dense self-similar spectral content — partials surrounded by halos of sidebands shaped by the local surface geometry. With rotated gradient, the warp preserves some symmetries; with raw gradient, it strongly biases toward extrema. ε small: subtle texturing. ε large: spectrum becomes a fractal-like cloud anchored to the original lattice. This is the catalog's most surface-dependent warp — two surfaces produce qualitatively different self-displacements.

**Compositional**: nonlinear, non-commutative, deeply entangled with the specific surface.

**Implementation**: phase-space, two lookups of D per sample. The displacement field can be precomputed alongside the surface (one extra 2D table). Cheap.

---

## Tier 4 — Research

### 13. Persistent-homology pruning

**Math**: compute the persistent homology of W: T² → ℝ. Each topological feature (peak, saddle, basin) has a (birth, death) pair under sublevel-set filtration. Persistence = death - birth. Prune features below threshold p.

Equivalently for the spectrum: treat |c_{m,n}|² as a 2D scalar field and prune by topological persistence of its peaks.

**Knob**: persistence threshold p ∈ [0, max persistence].

**Sonic**: structurally meaningful pruning — *not* amplitude thresholding. A small but topologically isolated peak (a thin spike in the spectrum) survives high p; a large but topologically connected blob (a smooth region) collapses early. The result is a surface that retains its skeletal structure while losing texture. At maximum p, only the most persistent feature survives — a single dominant partial.

A subtlety: as p crosses a feature's death value, the surface jumps. For modulation purposes, smooth between adjacent threshold settings rather than sliding p continuously through deaths.

**Compositional**: nonlinear; commutes with itself, doesn't commute with most other warps.

**Implementation**: persistent homology is computationally expensive (worst case O(n³) for filtration) but trivially offline-friendly. Precompute pruned surfaces at chosen p values. The deeper research direction: using *persistence diagrams themselves* as a control space — every diagram is a multiset of points in the plane, which is itself a structure you could map gestures onto.

---

### 14. Recursive / fractal warps

**Math**: pick a warp f with parameters p. Define f^N = f ∘ f ∘ ... ∘ f (N times). The recursion-depth knob is N, smoothed by interpolating between integer N values.

**Knob**: recursion depth N (continuous), warp parameters p.

**Sonic**: many warps, when iterated, converge to attractors (fixed surfaces) or diverge to fractal structure.
- Diffusion is contractive — converges to DC.
- Reaction-diffusion has multiple attractors (steady patterns); fractal between them.
- SL(2,ℤ) actions are non-contractive but typically ergodic on T².
- Iterating self-displacement produces fractal halos.

The recursion-depth knob is a continuous walk into self-similar territory — the surface gains structure at multiple scales as N grows.

**Compositional**: fractal warps respect the underlying warp's compositional structure to a degree, but iteration generally breaks commutativity badly.

**Implementation**: precompute iterates at N = 1, 2, 4, 8, ... (log-spaced). Interpolate between. Contractive warps terminate; divergent ones cap at a maximum depth.

---

### 15. Hopf-fibration parameterization

**Math**: the Hopf fibration S³ → S² gives a 2-sphere of structurally related warp parameterizations. Each point on S² indexes a 1-parameter family on S³, integrated to give a warp. The T² analog uses Heisenberg-group-like structure: a circle bundle over T² with an algebra related to the discrete Heisenberg group.

**Knob**: position on S² (two angles θ, φ).

**Sonic**: a 2-sphere of warps sharing a common topological core. Antipodal points = topological "opposites" in a precise sense; great circles = "rotations" of warps into each other. Compositional algebra is tied to the Hopf invariant.

**Compositional**: the Hopf fibration's topology constrains warp combinations. A rich and underexplored algebra.

**Implementation**: deep research direction. The most concrete realization is to define a generating warp f(p) parameterized by p ∈ S² and precompute on a sphere-grid. Mostly speculative — included as a marker for the kind of structure the architecture *could* support, given a year and the right collaborator.

---

## Two architectural lessons worth holding onto

**Linear phase-space warps are absorbed by scan rates.** Shear and rotation in (φ₁, φ₂) coordinates produce nothing beyond retuning. To make these structural, they must operate on the surface itself. This isn't a limitation — it's the architecture telling you exactly where each kind of expressivity belongs. Inter-partial structure is a property of the surface, not a property of how you walk through it.

**The lookup-table-and-crossfade pattern dominates.** Almost every entry in this catalog is implementable via precomputed surface tables and crossfade interpolation, at modest memory cost. The exceptions — separable phase bend, variable-rate phase shear, self-displacement — are the warps that are nonlinear in (φ₁, φ₂) directly, and those run per-sample. The split between "offline structure, online crossfade" and "online phase math" is the implementation taxonomy that matters most.

The deepest unresolved question the catalog points at: what *language* does the player learn when these warps become composable? The Tier 3+ entries bring whole mathematical structures into the instrument — SL(2,ℤ), reaction-diffusion attractors, persistent diagrams — and the algebra of warp composition is itself a designable element. The catalog is a map of where those structures live; the language is for the player to grow.

---

## Where this connects

This catalog presupposes the surfaces in [[2D Wavetable Catalog]] as raw material. It also lives in the same conceptual neighbourhood as [[Categorizing Inharmonicity]] — the catalog provides *moves* through inharmonicity space, not just *positions* in it. The Kuramoto bifurcation in [[Kuramoto Coupling]] is structurally a phase-portrait warp (entry #11) with a particularly clean physical interpretation — the synchronization transition is the phase-space bifurcation made audible. The architecture itself, [[DSP in Looping Dimensions]], is what makes 2D-native warps possible at all; in 1D these reduce to the phase warps of conventional wavetable synths.

## Forward vector

The warps land *after* the RNBO prototype is alive, not before. The build order is:

1. Get one surface and two phasors playing in RNBO codebox~. No warps. Confirm the math sounds the way the equations promise. (See [[2D Torus Wavetable Synthesizer — Build Log]] §"State at handoff".)
2. Add the cheapest Tier-1 warps that run per-sample: per-axis phase bend (#1), variable-rate phase shear (#6), self-displacement (#12). These need no precomputation infrastructure — they're a few lines each in codebox~.
3. Build the lookup-table-and-crossfade infrastructure once, and the rest of Tier 1 / Tier 2 unlock together: shear (#2), isotropic diffusion (#3), anisotropic diffusion (#4), rotation (#5), spectral masks (#7).
4. Tier 3+ earns its turn when the language of warp composition becomes the question the player is asking.

## Closing quotes

> "Geometry is the study of those properties of a space that are invariant under a given group of transformations."  
> — Felix Klein, *Erlangen Program* (1872)

> "The limits of my language mean the limits of my world."  
> — Ludwig Wittgenstein, *Tractatus Logico-Philosophicus*, 5.6

> "What hands can the instrument grow to reshape the curves while it plays?"  
> — the brief itself

> "The surface is what is sayable; the scan is the act of saying."  
> — from the dialogue
