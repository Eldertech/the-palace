---
title: DSP in Looping Dimensions
type: concept
pillars:
  - tools
  - philosophy
born: 2026-04
stage: sprout
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: couples-with
    label: incarnated-by
  - target: "[[Frequency-Time Duality]]"
    type: mirrors
    label: rhymes-with
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: bifurcates-into
  - target: "[[Wallpaper Groups]]"
    type: connects-to
    label: shares-symmetry
---
# DSP in Looping Dimensions

A unifying principle that explains why a wide range of seemingly distinct DSP techniques all share the same hard limit and the same path past it.

## The Principle in Plain Language

Each looping dimension you add to a DSP system contributes one independent fundamental frequency.

- **One loop** ⇒ one fundamental and its integer multiples — a harmonic series.
- **N loops at irrational ratios** ⇒ N independent fundamentals, plus every integer combination of them — a *lattice* of partials rather than a single harmonic series.
- **Rational ratios between loops** collapse the lattice back down — the system "phase-locks" and the spectrum reduces to a harmonic series at the common subdivision.

This is why standard wavetables are stuck producing harmonic spectra, why a single-tap circular delay only resonates at integer multiples of its loop period, and why classic Karplus-Strong only generates harmonic partials. They all share the same constraint: one loop, rank-1 spectrum. They all share the same escape: more loops, irrationally related.

(The mathematical name for the lattice of reachable frequencies is a *rank-N Z-module* — the set of all integer combinations m·ω₁ + n·ω₂ + … of N base frequencies. Whatever name you prefer, the operational fact is the same: each new looping dimension adds one independent fundamental, and the reachable spectrum is every integer combination of those fundamentals.)

## Three Operational Frames

The principle shows up in three distinct DSP frames. They look unrelated until you notice they're the same fact.

**Frame 1 — Scanning.** A 1D wavetable is a single loop scanned by one phasor; output is harmonic. A 2D wavetable on a torus is two loops scanned by two phasors; output spectrum is on a 2D lattice. A 3D wavetable on T³ is three loops, three phasors, 3D lattice. The [[2D Torus Wavetable Synthesizer]] is the concrete incarnation. Standard wavetables can only ever produce harmonic spectra because they have only one looping dimension to scan.

**Frame 2 — Kernel design.** A standard comb filter `h(t) = δ(t) + a·δ(t − T)` has spectral peaks at integer multiples of 1/T — strictly harmonic; circular convolution wearing a feedback costume. *Two* coupled combs with periods T₁ and T₂ at irrational ratio place their combined peaks on a 2D frequency lattice — exactly the same spectral signature as toroidal scanning, reached from a totally different operational direction. Generalize: N coupled delay lines with mutually irrational delay ratios produce impulse responses whose spectral support is on an N-dimensional lattice. Each delay line is one looping dimension. (Disambiguation: "comb filter" here means the delay-line filter with periodic spectral peaks, distinct from a "comb" of additive partials and from incoherent-summation combing artifacts.)

**Frame 3 — Feedback.** Karplus-Strong is recursive convolution with one delay loop and a smoothing filter — one looping dimension, harmonic output. Replace the single loop with N coupled loops at irrational ratios with cross-mixing between them, and you get a quasi-periodic plucked-string algorithm whose normal modes lie on an N-dimensional lattice. Above a critical coupling threshold the loops phase-lock and the spectrum collapses to harmonic; below threshold it opens up to full quasi-periodic richness. The plucked string transitions between bell-like and string-like as a [[Kuramoto Coupling]] bifurcation, not a smooth morph.

The deepest move — flagged as future territory — combines these: a kernel that itself lives on a higher-dimensional looping space, scanned at audio rate alongside the input. This shatters linear time-invariant convolution the same way higher-dimensional wavetables shattered the harmonic limit of single-loop wavetables.

## The Honest Limit

Adding looping dimensions is a *strict* expansion, but it is bounded.

The spectrum reachable by N loops at irrational ratios is always a discrete, finitely-generated lattice in frequency space. It can be made arbitrarily rich by adding dimensions, by choosing maximally irrational ratios (golden, silver, plastic), and by designing the lattice coefficients to taste — but it remains *discrete and lattice-structured*.

What lives outside this expansion:

- **Truly aperiodic, broadband noise.** A continuous spectrum cannot be reached from any finite-rank lattice.
- **Genuine transients.** A click or impulse contains energy at every frequency — outside any discrete lattice.
- **Stochastic textures** with continuous spectral support.

These require additional layers — random-field generating logics, transient injection, hybrid architectures. The looping-dimensions principle covers the periodic-and-quasi-periodic territory completely, and stops there.

## Frontier Beyond the Torus

T^N is the simplest non-trivial looping space: N independent circles, flat product geometry. Other looping geometries open territory that no torus can reach.

- **Higher-genus surfaces.** A torus has genus 1 (one hole). A genus-g surface has g handles and 2g independent fundamental cycles. The natural eigenfunctions are no longer clean exponentials — they're irregularly spaced, with their own statistical regularities (Bohigas-Giannoni-Schmit conjecture). The spectrum is naturally inharmonic in a structured way: *the timbre of a topological shape*, made literal.
- **Hyperbolic surfaces.** The eigenfunctions become Maass forms, deeply tied to number theory. Selberg trace formula links spectral statistics to the lengths of closed geodesics. An instrument voiced on a hyperbolic surface has a partial structure that literally reflects the surface's geodesic geometry.
- **Quasicrystal lattices.** Project a 5D or 6D periodic structure into 3D. The result has discrete Fourier spectrum (so it's not noise) but no periodicity at any rational ratio (so it's strictly inharmonic). Five-fold and icosahedral symmetries become available — symmetries that *cannot exist* in periodic crystals.
- **Lie groups as looping spaces.** SU(2) is topologically S³ — diffeomorphic to the 3-sphere, fundamentally distinct from T³. Its natural Fourier basis (Peter-Weyl theorem) is matrix elements of irreducible representations indexed by spin j = 0, 1/2, 1, 3/2, …. Scanning is *non-abelian* — multiplying by group elements rather than adding angles. Spinor-valued wavetables become possible.

These are flagged as territory, not yet entered.

## Cross-Domain Resonance

The discrete lattice spectrum on a T³ wavetable is not a niche audio object. It is the central object in several sciences:

- **Crystallography.** A crystal *is* a triply periodic function in 3D space. Its 3D Fourier spectrum is the Brillouin zone; the discrete amplitude points are Bragg peaks. X-ray diffraction is a 3D Fourier transform. Phonons live in the same Brillouin zone with a dispersion relation. Loading a crystal's structure factor into a 3D wavetable and scanning it produces *the timbre of that mineral*.
- **MRI / k-space.** k-space is the 3D Fourier domain. MRI samples the lattice coefficients directly via gradient-encoded RF pulses, then inverse-FFTs to recover the volumetric image. The two design surfaces (spatial and spectral) connected by 3D FFT are exactly the two domains an MRI physicist toggles between.
- **Cosmology.** The 3D matter density field of the universe is decomposed into Fourier modes with power spectrum P(k). Auralizing observed cosmological large-scale structure as a 3D wavetable is mechanically straightforward.

The synthesizer is, in the most direct possible sense, a way of making crystals audible.

## Forward Vectors

- This entry is deliberately compressed. Each operational frame and each frontier could grow into its own entry. The first natural fork: a `Higher-Dimensional Convolution` entry once a future session pushes on the kernel-design frame past sketch.
- The principle wants a specific cross-domain resonance with [[Frequency-Time Duality]] worked out — both are "two operational frames, one underlying fact" insights, and the rhyme between them deserves an explicit articulation.
- The Lie-group / non-abelian frontier is the most exotic territory named here. It earns its own entry once a session genuinely enters it rather than only naming it.
- Flag for the next [[2D Torus Wavetable Synthesizer]] working session: the principle is now persistent here, and the synth project no longer has to carry the conceptual scaffolding inside its own page.

---

> *"God made the integers; all else is the work of man."* — Leopold Kronecker
> *(and the irony that his most famous theorem is about what the irrationals do that the integers cannot)*
> *"The world is essentially nonlinear; we have only been linearizing it because the mathematics was tractable."* — paraphrase of Norbert Wiener
