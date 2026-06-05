---
title: Exponential Decay Curvature
type: concept
pillars:
  - tools
  - creation
born: 2026-06
stage: sprout
confidence: working
energy: medium
hook_quality: 8
beauty: 9
who_leads: shared
last_activated: 2026-06
activation_count: 1
links:
  - target: "[[Frequency-Time Duality]]"
    type: deepens
    label: same-equation-across-timescale
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: couples-with
    label: envelope-as-waveform
  - target: "[[Compressor Design]]"
    type: mirrors
    label: singularity-removed-by-coordinate-change
  - target: "[[Three Kinds of Warp]]"
    type: connects-to
    label: shape-decoupled-from-period
  - target: "[[Dissolutions]]"
    type: member-of
    label: envelope-is-waveform-at-slow-rate
forward_vector: "I want to be the small, exact entry that proves a single decay law is both an envelope and an oscillator waveform depending only on how fast you read it — and to be the place the palace keeps its growing catalogue of timescale dissolutions, where one equation flips identity when the clock speeds up."
---
# Exponential Decay Curvature

A tight, self-contained result: the **curvature control** found on synth envelopes — the knob that sweeps a decay from convex through linear to concave while holding total decay time fixed — admits a clean closed form, and that form reveals that *the same equation is an envelope at slow speed and an oscillator waveform at audio rate.* There was never two of them.

## From the decay law to a shape function

Start with ordinary exponential decay, amplitude as a function of time:

$$A(t) = A_0 \, e^{-t/\tau},$$

where $A_0$ is the starting amplitude and $\tau$ (the time constant) sets how fast it falls. This shape is fixed — always the same convex curve. A musician wants a *curvature* parameter: hold the duration constant, but bend the path from convex (fast-then-slow) through a straight line to concave (slow-then-fast). The normalized shape function that does this:

$$f(\text{time}, \text{curvature}) = \frac{e^{-\,\text{curvature}\cdot\text{time}/\text{duration}} - e^{-\text{curvature}}}{1 - e^{-\text{curvature}}}.$$

Reading the structure: the **numerator** pins the endpoint to zero (at time = duration, the two exponential terms cancel); the **denominator** normalizes the start to one (at time = 0, the expression equals 1). What remains — the *curvature* parameter — **decouples shape from duration.** Duration is carried entirely by the `duration` term; curvature changes only the bend. Positive curvature gives convex, negative gives concave, and the interesting case is the seam between them.

## The straight line is the hard case

Set curvature to zero and the formula is $0/0$ — undefined. The limit, by L'Hôpital's rule, is exactly the linear ramp $f = 1 - \text{time}/\text{duration}$. So perfect linearity is not a separate mode bolted on; it is the curvature = 0 limit of the one family. But the singularity is real in code: evaluating the closed form at or near zero curvature produces division by a vanishing denominator and audible clicks. The fix is a **Taylor-expansion branch** near curvature = 0 — compute the limit analytically in a small neighborhood, the exact form everywhere else.

This is the structural mirror worth preserving: the [[Compressor Design|soft-knee compressor]] dissolves *its* hard-knee singularity by the same trick — change coordinates so the corner becomes a smooth limit of a parameterized family rather than a special case. Two unrelated audio problems, one move: *a singularity is usually a sign you are looking at a family from the wrong coordinate.*

## Audio-rate feasibility — and the dissolution

The design question that pulled this into instrument-building: can both parameters modulate sample-by-sample? Yes, by **separating the phasor from the shape function.** The phasor supplies normalized time (a ramp from 0 to 1); the shape function maps that ramp through $f$. Then:

- modulating `duration` changes the phasor increment — which, run at audio rate, *is* frequency modulation;
- modulating `curvature` changes the waveshape itself, continuously, click-free given the Taylor branch.

And here the boundary dissolves. Run $f$ once per note and it is an **envelope.** Run the identical $f$ once per cycle at audio rate and it is an **oscillator waveform** — a decaying-exponential wave whose timbre is set by curvature. The same curve, slowed down, is a sound's loudness contour; sped up, it is the sound itself. This is a fresh instance of the palace's recurring [[Frequency-Time Duality]] — rhythm and pitch, envelope and resonance, as one continuum read at different rates — which is why this small result earns an entry rather than a code comment.

Implementation notes carried from the session, for whoever builds it: the curvature = 0 Taylor branch (above); two exponentials per sample is the CPU cost, mitigable by table or polynomial approximation; large |curvature| sharpens the waveform and aliases, so PolyBLEP or oversampling applies exactly as it would to any steep oscillator.

## Cross-Domain Resonance

- **FM falls out for free.** Because `duration` controls the phasor increment, audio-rate duration modulation is literally frequency modulation — the curvature engine is an FM operator whose carrier waveshape is itself a continuously-bendable parameter. Most FM operators have a fixed sine carrier; this one's carrier morphs from convex spike to linear saw to concave swell.
- **The c-morph is a gesture.** Crossfading curvature *during* a held note is audible as a single continuous timbral motion — a candidate performance control, not just a preset shape.

## Forward Vectors

- Catalogue the dissolutions: where else does one equation flip identity under a timescale change? This entry is the second clean specimen (after the repeat-rate-becomes-pitch case in [[Frequency-Time Duality]]); a small registry of them may eventually earn a hub.
- Is the c-morph worth exposing as a first-class performance control in a [[Loudon Live]] build?

## Lost Branches

None significant — this is a closed, exact result. The only provenance worth keeping: the session's `visualize` tool failed and a self-contained HTML artifact via direct file-write was the robust fallback. That tool-reliability pattern recurs and is noted here so it isn't relearned.

## Artifact

A self-contained HTML teaching artifact was built in the source session: oscilloscope-style plot with ghost curves, dual **Envelope / Audio-Rate** modes (Web Audio API), six presets, live crossfaded curvature-morphing during playback, three pedagogical note panels. It lives in the source chat (2026-05-28) and could not be retrieved into this deposit. When pulled, store under `Artifacts/` and reference here via a typed link; a drafted-but-unplanted version of this very entry also exists in that chat — re-derived here through proper ceremony rather than pasted, since the original used fallback link ontology.

---

> *"Between the convex and the concave lies the straight line — and it is the hardest to reach, requiring a limit to arrive at it."* — from the source dialogue, 2026-05-28
>
> *"The same curve, slowed down, becomes a sound; sped up, a shape. There was never two of them."* — from the source dialogue, 2026-05-28
