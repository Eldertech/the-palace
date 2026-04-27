---
title: Three Kinds of Warp
type: concept
pillars:
  - tools
  - creation
  - philosophy
born: 2026-04
stage: growing
confidence: working
energy: high
hook_quality: 9
beauty: 8
who_leads: shared
last_activated: 2026-04
activation_count: 1
links:
  - target: "[[Torus Warping Catalog]]"
    type: connects-to
    label: cuts-orthogonally
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: connects-to
    label: clarifies-mechanism
  - target: "[[Categorizing Inharmonicity]]"
    type: couples-with
    label: mechanisms-vs-targets
  - target: "[[Wavetable Space as Torus]]"
    type: connects-to
    label: operates-on
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: type-3-exemplar
  - target: "[[Harmonicity and Inharmonicity]]"
    type: emerged-from
    label: mechanism-decomposition
  - target: "[[Bessel Functions in Synthesis]]"
    type: connects-to
    label: lattice-exemplar
  - target: "[[Piano String Inharmonicity]]"
    type: deepens
    label: spectrum-target
  - target: "[[Embeddings as Relational Meaning]]"
    type: mirrors
    label: closure-property
  - target: "[[2D Wavetable Catalog]]"
    type: connects-to
  - target: "[[Dispersion]]"
    type: enables
    label: frequency-dependent-coupling
forward_vector: "I am the structural cut through warp space that says: a warp is defined by what it preserves and what it breaks. I want to be the entry consulted whenever someone reaches for the word 'warp' in synthesis design, so the question 'will this produce inharmonicity?' has a one-look answer instead of a per-warp re-derivation."
---

# Three Kinds of Warp

The word *warp* carries three distinct meanings in audio synthesis (DAW time-warp, oscillator phase-warp, geometric surface-warp; [[Torus Warping Catalog]] disambiguates them in its framing). Inside the third meaning — geometric warping of a wavetable's domain — there is a *further* typology that determines what spectra a warp can produce. The catalog distinguishes warps by *where they live* (phase-space, coefficient-space, surface-space). This entry distinguishes warps by *what structure they preserve and what they break*. The two cuts are orthogonal: every warp has both a location and a type.

## The 1D obstruction theorem

The starting point is a structural fact that explains why no commercial wavetable synth — Serum, Vital, Phase Plant, CZ-style phase distortion — can escape the harmonic series, no matter how exotic the warp.

**Theorem.** Let $W : S^1 \to \mathbb{R}$ be any 1D wavetable. Let $\varphi : \mathbb{R} \to \mathbb{R}$ be any phase function satisfying $\varphi(t+T) - \varphi(t) = 2\pi$ for some fixed period $T > 0$. Then $y(t) = W(\varphi(t))$ has Fourier support contained in $\{k/T : k \in \mathbb{Z}\}$.

*Proof.* $y(t+T) = W(\varphi(t+T)) = W(\varphi(t) + 2\pi) = W(\varphi(t)) = y(t)$, since $W$ is $2\pi$-periodic. So $y$ is $T$-periodic, and a $T$-periodic signal has Fourier support on $\{k/T : k \in \mathbb{Z}\}$. ∎

The theorem holds for any warp at all — position-dependent velocity, sigmoid bend, sync-window kink, asymmetric S-curve, hand-drawn lookup. Every commercial wavetable warp redistributes energy *among* the harmonic slots; none of them moves a partial *between* slots, and none of them creates a partial in between slots. The corollary is the entire game: producing inharmonicity requires breaking the period. Three structurally distinct ways to break it give three types of warp.

## The typology

**Type 1 — cycle-shape warps.** Reparameterize the inside of one cycle without changing the cycle itself: $g : S^1 \to S^1$ with $g(\varphi + 2\pi) = g(\varphi) + 2\pi$, i.e., a degree-1 self-map of the circle. *Preserves the harmonic lattice; redistributes amplitudes within it.* Every commercial wavetable warp lives here. On the torus, per-axis phase bend (#1 in the warp catalog) and most coefficient masks (#7) are type-1 in their respective axes. Useful for timbre. Structurally cannot produce inharmonicity. The theorem above is what guarantees this.

**Type 2 — period-breaking by ratio.** Introduce a second incommensurate clock. The signal becomes quasi-periodic, not periodic, and the spectrum sits on a 2-generator lattice $\{m\omega_1 + n\omega_2 : m,n \in \mathbb{Z}\}$ that is dense in $\mathbb{R}$ for irrational $\omega_1/\omega_2$. *Removes the global cycle altogether.* This is the irrational-ratio gate that [[2D Torus Wavetable Synthesizer]] names as the primary inharmonicity gate. It is not really a *warp* in the colloquial sense — it is the operation that makes a 1D wavetable into something other than a 1D wavetable. The closest 1D cousin is detuning two oscillators against each other, but two summed sinusoids do not have the multiplicative coupling that a 2D table-readout provides, so detuning produces beating rather than a coherent inharmonic line spectrum.

**Type 3 — period-breaking by coupling.** Let the rates depend on position: $d\varphi_i/dt = \omega_i + f_i(\varphi_1, \varphi_2)$. Below the synchronization threshold the rotation numbers shift away from the bare $\omega_i$ in ways determined by the coupling functions; above threshold they lock. *Bends the lattice itself* — partials migrate off the rational $\{m\omega_1 + n\omega_2\}$ grid and onto curved manifolds of frequencies determined by $f_1, f_2$. The Kuramoto coupling $f_1 = K\sin(\varphi_2 - \varphi_1)$ is the canonical instance — see [[Kuramoto Coupling]]. Phase-portrait warps (#11), variable-rate phase shear (#6), and self-displacement (#12) in the warp catalog are all type-3 instances under this lens.

## The runner metaphor

> Commercial warping is a runner varying pace within a lap.
>
> Type-1 torus warping is two runners, each varying pace within their own lap.
>
> Type-2 torus warping is two runners on tracks of incommensurate length, so they never finish a lap together.
>
> Type-3 torus warping is those same two runners, but they're watching each other and pacing off each other.

The lap structure is exactly what the harmonic series enforces. Commercial wavetable warping reshapes within the lap; type-1 generalizes that to two laps. Type-2 unsyncs the laps so there is no longer a global "they finished the race together" event. Type-3 lets the laps influence each other so the rates themselves become emergent rather than fixed inputs.

## Where piano-style stretching lives

The piano spectrum $f_n = n f_0 \sqrt{1 + B n^2}$ for generic $B$ is not on any rational lattice — see [[Piano String Inharmonicity]] for the physics, [[Categorizing Inharmonicity]] for the broader typology of inharmonicity targets this is one example of.

Type 1 alone cannot reach it (preserves the lattice, theorem above). Type 2 alone gives a 2-generator lattice that is *dense* in $\mathbb{R}$, so prominent partials can be placed near piano-stretched positions by choosing surface coefficients accordingly — this is what the "Stiff String" surface in [[2D Wavetable Catalog]] does, and it is approximation rather than exact reproduction. Type 3 gives complementary access: rather than placing energy at lattice points near piano positions, it bends the lattice itself via the coupling functions, so the partials migrate continuously as the coupling parameters change.

In practice the instrument wants both — type-2 for clean approximate-piano presets, type-3 when $B$ should behave as a continuous bifurcation parameter that genuinely deforms the spectrum's geometry rather than reweighting fixed slots. FM, by contrast, has neither: the modulator+carrier structure is type-1 in disguise (Bessel sidebands sit on a finitely-generated lattice — see [[Bessel Functions in Synthesis]]), and FM's parameters do not provide a continuous knob that touches the lattice generators in the way $B$ would need.

## Why the typology matters for the project

The asymmetry stated in [[2D Torus Wavetable Synthesizer]]'s §"Why This Project Exists" — *FM cannot produce that accumulating deviation as a first-class control. The 2D torus wavetable can.* — is structurally true, but the load-bearing work is done by **type-2 ratio gating + type-3 coupled flows**, not by the second dimension by itself. A constant-velocity scan of any 2D surface still produces a finitely-generated lattice spectrum (rank 2 instead of FM's rank ≤ K+1, but still lattice-bound). The 2D-ness is what *makes type-2 and type-3 available* — you need a second clock for type-2's incommensurability or type-3's coupling to have anywhere to act — but the 2D-ness is the substrate, not the mechanism. Naming this cleanly is what allows the project's design language to stay honest about which architectural commitments are doing which jobs.

A useful design heuristic that falls out: if a warp idea can be expressed as *"reshape what one phasor does within its cycle, independently per axis"*, it is type-1 — sonically interesting but mechanically harmonic. If the idea requires a *second incommensurate clock*, it is type-2. If the idea requires *one phasor's rate to depend on the other phasor's position*, it is type-3 and the bifurcation diagram of the resulting flow is the geometric object to study.

## Cross-Domain Resonance

- **The lattice obstruction is a closure property.** Any operation that preserves $T$-periodicity preserves the harmonic lattice. The escape requires breaking $T$-periodicity, and the three types are the three structurally distinct ways to do that on a 2-clock system. This is the same shape of argument as [[Embeddings as Relational Meaning]]'s observation that closure under operations determines what a structure can express.
- **Type-3 is where Kuramoto lives.** The synchronization threshold in [[Kuramoto Coupling]] is precisely the boundary between locked (effectively type-1, harmonic on the locked period) and drifting (effectively type-2, with the drift trajectory determined by coupling) regimes. The bifurcation between these is the most musical instance of the typology in action.
- **The all-pass cascade in [[Categorizing Inharmonicity]]'s phase-accumulation type is type-3 in disguise.** Frequency-dependent phase delay in a feedback loop is a coupling between frequency and phase, which is what type-3 names. The all-pass-reverb tail and the Kuramoto-coupled torus scan are the same structural mechanism in different clothing — a useful echo to chase later.

## Open Questions

- **Is there a type-4?** A single coupled-ODE flow on a higher-dimensional torus $T^k$ has analogous lattice/coupling/locking structure; whether the typology extends or re-collapses there is open. [[Wavetable Space as Torus]] gestures at $T^3$ and beyond; the obvious next step is to ask whether $T^3$ adds a structurally novel type or just enriches type-2 and type-3.
- **Does the typology map onto perception?** Do listeners hear type-1 and type-2 as different categories of timbral motion, or do the perceptual boundaries cut differently? An A/B comparison between a type-1 amplitude-redistributing warp and a type-2 ratio-detuning warp at matched perceptual depth would test this.
- **Type-3 audit of the warp catalog.** Variable-rate phase shear (#6), self-displacement (#12), and phase-portrait warps (#11) are tentatively type-3 under this lens, but the catalog's amplitude/sonic descriptions don't compute their long-time average rotation numbers. Some of them may turn out to be type-1-in-disguise once integrated. Worth a careful pass.
- **Composition of types.** Type-1 ∘ type-2 = type-2 (the inner cycle reshape doesn't undo the period break). Type-1 ∘ type-3 = type-3. Type-2 ∘ type-3 = type-3 with modified coupling. But the algebra of compositions across multiple warps within each type is not worked out — this is the language-of-warps question the catalog's closing flagged.

## Lost Branches

- **The all-pass / type-3 connection.** Worth a dedicated entry once the warp catalog's type-3 audit is done. The all-pass-reverb-tail mechanism is mathematically the same as a type-3 coupled flow restricted to phase rather than amplitude, and saying so cleanly might unify two regions of the palace.
- **Beyond two generators.** Three or more incommensurate clocks generalize type 2 to a $k$-generator dense lattice. The cut-and-project framing in [[Wavetable Space as Torus]] suggests the natural mathematical home for this; the synthesis-engineering home is unexplored.

---

*Lattices are what cycles produce. Inharmonicity is what cycles cannot produce. The typology of warps is the typology of how cycles get broken.*
