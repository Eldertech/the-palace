---
title: Dispersion Table
type: concept
pillars:
  - tools
  - creation
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
    label: warp-axis-is-dispersion-axis
  - target: "[[DSP in Looping Dimensions]]"
    type: deepens
    label: phase-space-reading
  - target: "[[Three Kinds of Warp]]"
    type: couples-with
    label: same-escape-different-handle
  - target: "[[Dispersion]]"
    type: connects-to
    label: tabulates
  - target: "[[Waveguide Synthesizer]]"
    type: emerged-from
    label: loop-round-trip-condition
forward_vector: "I want to be the entry that makes 'store phase-response curves, not waveforms' an obvious move rather than a leap — the surface where a single warp knob selects which inharmonic mode-structure a resonator will admit. I want to spawn a Wavetable Oscillator entry that finally states the lossless-loop identity plainly, and to earn a place as a first-class control axis in the synth interface."
---
# Dispersion Table

A generalization of the wavetable concept arrived at by pushing it onto the phase-response axis: **instead of storing waveforms, store phase-response curves.** A 2D array of phase-response curves becomes a navigable family of inharmonic mode structures, and a single "warp" knob selects which curve the loop's round-trip enforces — therefore which inharmonic partial structure the resonator admits.

This is Loudon's generalization, not a textbook result. It emerged in dialogue by treating two things normally taught as separate — the scanned wavetable and the lossless waveguide loop — as one object, then asking what the *other* axis of that object could store.

## The identity it rests on

The load-bearing fact underneath the whole entry: **a wavetable oscillator is a lossless waveguide loop.** A delay line fed back on itself with unity gain is mathematically identical to scanning a stored cycle. The loop's contents *are* the wavetable; the loop length *is* the period. Two synthesis paradigms normally taught as separate collapse into one object — see [[Waveguide Synthesizer]] for the physics scaffolding (D'Alembert's traveling-wave solution, the delay-line architecture, Karplus-Strong as the lossy case).

Once the loop and the table are the same thing, a question opens that has no analog in ordinary wavetable thinking: *the loop has a filter in it.* A real (lossy, dispersive) waveguide loop applies, on each round trip, a filter with both a magnitude response (governs brightness and decay) and a **phase response** (governs which frequencies satisfy the round-trip resonance condition, and therefore where the partials actually land). The magnitude response is the part wavetable synthesis already exploits. The phase response is the unclaimed axis.

## The round-trip phase condition

A frequency $f$ resonates in a loop of round-trip delay $\tau$ when its total accumulated phase is an integer multiple of $2\pi$:

$$2\pi f \tau + \theta(f) = 2\pi k, \quad k \in \mathbb{Z},$$

where total accumulated phase equals (the bare delay phase $2\pi f \tau$) plus (the loop filter's phase response $\theta(f)$). When the phase response is zero — the ideal lossless loop — this reduces to $f = k/\tau$: a clean harmonic series, exactly the rank-1 spectrum that [[DSP in Looping Dimensions]] says one loop is stuck producing.

But when $\theta(f)$ is **frequency-dependent and nonlinear**, the resonances shift off the integer grid. Low partials and high partials no longer satisfy the round-trip condition at integer multiples — they migrate to wherever the *combined* phase hits a multiple of $2\pi$. That migration is precisely dispersion: frequency-dependent phase velocity, the physics that stretches a real piano's partials per $f_n = n f_0 \sqrt{1 + B n^2}$. See [[Dispersion]] for the phenomenon in full; this entry is the move that makes it a *stored, navigable* control surface rather than a fixed physical property of a medium.

## From one curve to a table

A single phase-response curve gives one inharmonic mode structure. The generalization is to store a **2D array of phase-response curves** and interpolate between them, exactly as a wavetable interpolates between stored cycles:

- a **position axis** selecting loop-filter *magnitude* character (brightness, decay rate);
- a **warp axis** selecting loop-filter *phase* character (the dispersion curve, and therefore the inharmonic partial structure).

This maps the project's 2D torus architecture directly onto a waveguide with two meaningful axes. The warp axis of the [[2D Torus Wavetable Synthesizer]] *is* the dispersion axis of a tabulated waveguide — the same control under two descriptions, which is why the link to the torus is a `mirrors`, not a mere `connects-to`.

The pedagogical spine for the entry's eventual teaching artifact, stated as a ladder: *what a wavetable is → what a filter's phase response is → the round-trip phase condition for loop resonance → how storing phase-response curves in a 2D array creates a navigable family of inharmonic mode structures.* The complete loop, including the FFT-based phase warp, was worked out as pseudocode in the source session and should be reconstructed into a `Dispersion Table — sketch` bundle file when the artifact is retrieved.

## Where it sits in the warp typology

[[Three Kinds of Warp]] cuts warp space by *what a warp preserves and breaks*. The dispersion table is a clean instance of breaking the harmonic lattice **by bending it** — partials migrate off the rational $\{k/\tau\}$ grid onto a curve determined by $\theta(f)$. That is structurally the type-3 register (period-breaking by a frequency-dependent rate) read in the frequency domain rather than the phase domain. The warp catalog distinguishes warps by *where they live*; this entry shows the phase-response curve is *where the warp is stored*. The two cuts are orthogonal and both apply: a dispersion table is a coefficient-space object (it stores phase curves) that performs a lattice-bending warp.

## Cross-Domain Resonance

- **Allpass filters are the practical engine.** A cascade of second-order allpass sections, log-spaced across the band, is the canonical way to realize a designed nonlinear phase response with flat magnitude — pure dispersion with no coloration. Pole radius controls how sharply the phase bends, which is the audible warp from *pure* (no dispersion, harmonic) through *piano* (mild stretch) to *bell/gong* (strong inharmonic spread). This is the same allpass mechanism that [[Three Kinds of Warp]] flags as a type-3-in-disguise in reverb tails — a useful echo to chase.
- **The dispersion table is a phase-only sibling of the magnitude-only wavetable.** A wavetable stores what a spectrum *weighs*; a dispersion table stores where a spectrum *sits*. Together they span the complex frequency response of the loop filter: magnitude on one axis, phase on the other.

## Forward Vectors

- Does the waveguide-loop ↔ Hopf-fibration speculation from the source session survive contact with the math, or is it poetic over-reach? Flag, don't yet document — it overlaps the frontier tail already named in [[DSP in Looping Dimensions]] and the Floquet/synthetic-dimensions cluster.
- Can the dispersion table become a first-class control surface in the synth interface, alongside the surface / lattice / trajectory / spectrum quartet? This is the concrete project ask.
- Is there a clean RNBO `codebox~` implementation of the FFT-phase-warp loop for a [[Loudon Live]] build? The allpass-cascade realization is the more real-time-friendly path; the FFT-phase-warp is the teaching-clear one.
- This entry wants a plain [[Wavetable Oscillator]] entry to point its identity claim at — currently the lossless-loop-is-a-wavetable fact lives inside other entries rather than having its own home.

## Lost Branches

- The full waveguide-synthesis scaffolding (scattering junctions, 2D waveguide meshes, the LPC vocal-tract kinship) belongs to [[Waveguide Synthesizer]] and the forthcoming [[Linear Predictive Coding]] entry — link rather than re-document.
- The frontier tail (topological waveguides, Floquet time-modulation, synthetic dimensions) overlaps the existing Floquet entries — link, don't duplicate.

---

> *"The string knows nothing of harmonics; it only knows how to come back to itself."* — from the source dialogue, 2026-06-01
>
> *"A wavetable is a loop that forgot it was traveling."* — from the source dialogue, 2026-06-01
