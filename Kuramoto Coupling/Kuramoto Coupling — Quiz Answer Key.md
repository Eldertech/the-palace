---
title: "Kuramoto Coupling — Quiz Answer Key"
born: 2026-03-21
links:
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: child-of
forward_vector: "I am the answer key companion for the [[Kuramoto Coupling]] quiz series — answers with context, corrections, and the moments where a wrong answer produced the deepest learning. I stay paired with the lesson series."
---

# Kuramoto Coupling — Quiz Answer Key
## Answers with Context, Corrections, and Deeper Implications

*Companion to "Kuramoto Coupling — 8-Lesson Quiz Series." Particular attention is given to where Loudon's answers needed correction or refinement — these moments are often where the deepest learning happens.*

---

## Lesson 1: The Phase Oscillator

**Q1.1** — Two phasors at 100 Hz and 100.5 Hz: how long to drift through one complete cycle of phase difference?

**Answer: 2 seconds.** The beat period is 1/|Δf| = 1/0.5 = 2 seconds. Loudon answered correctly and cleanly.

**Q1.2** — Guitar strings at 329 Hz and 330 Hz: beat frequency and connection to Δθ(t).

**Answer: 1 Hz beat frequency.** Loudon's answer was strong and included the correct physical picture of cancellation at the halfway point. His phrasing — "the difference in frequency between the oscillators is a new oscillator" — was refined during discussion: this isn't metaphorical. The phase difference φ(t) = (ω₁ - ω₂)t IS a phasor running at the beat frequency. It is the exact variable that Kuramoto coupling will act on. The entire Kuramoto model operates in this difference space. When we later write dφ/dt = Δω - K·sin(φ), that φ is the beat oscillator, and the coupling term is trying to stop it.

**Q1.3** — Why can't we use the full second-order oscillator model for Kuramoto coupling?

**Answer: Phase reduction discards amplitude dynamics, keeping only the phase.** Loudon identified the key point: stable limit cycle assumption, no damping, amplitude irrelevant. The correction added during discussion was computational: the phase reduction goes from 2N state variables (position + velocity per oscillator) to N (phase only). For 8 oscillators in gen~ at 48 kHz, this is 16 vs 8 coupled differential equations — a meaningful difference. The deeper question flagged for future work: Loudon's synthesizer may eventually *want* amplitude coupling (oscillators that lose energy when fighting to lock), which requires the Stuart-Landau extension beyond pure Kuramoto.

---

## Lesson 2: The Coupling Term

**Q2.1** — Oscillator A at θ = 1.2, B at θ = 1.5. Does A speed up or slow down?

**Answer: A speeds up, B slows down, by equal amounts.** sin(1.5 - 1.2) = sin(0.3) ≈ 0.296 (positive, so A accelerates). sin(1.2 - 1.5) = sin(-0.3) ≈ -0.296 (negative, so B decelerates). Newton's third law: equal and opposite. ✓

**Key correction:** Loudon expressed confusion about whether relative velocities should matter. This revealed an important intuition to override: in Kuramoto (first-order), there IS no velocity as a separate state variable. The coupling pushes directly on frequency (which IS velocity in phase space), not on acceleration. No momentum, no inertia, no memory. This is fundamentally different from the spring-mass systems where force → acceleration → velocity → position is a chain with inertia at every step. In Kuramoto, force → velocity directly. This is why basic Kuramoto synchronization has no overshoot or ringing. Adding the second-order extension (the swing equation from power systems) would restore inertial behavior and could be a musical design choice for "ringing" lock behavior.

**Q2.2** — Two oscillators at π apart (anti-phase). Stable or unstable?

**Answer: Unstable equilibrium.** Loudon correctly identified instability. The correction was about the *magnitude* of the force: he said "a slight change will cause a large force." The force is actually small for a small nudge (sin(π + ε) ≈ -ε). What makes it unstable is the *direction* — the small force pushes further away from anti-phase, toward in-phase. Any tiny perturbation grows. The distinction matters: unstable equilibria aren't characterized by large forces but by forces that point the wrong way.

**Q2.3** — How is Kuramoto coupling different from a PLL?

**Answer: In PLL, one reference is static; in Kuramoto, both oscillators move to the shared mean.** Loudon's answer went beyond the question with an excellent original observation: "I wonder if we can think of PLL as a special 2-oscillator case of a family of asymmetric Kuramoto systems where one oscillator ignores the influence of others, but still influences the other." This is exactly right and is a sophisticated insight. A PLL is Kuramoto where one oscillator has infinite inertia — K_ji = 0 while K_ij > 0. Kuramoto's contribution was asking: what happens when that asymmetry is removed? The answer — spontaneous self-organization without a conductor — is the core result.

**Q2.4** — Why does dividing by N matter?

**Answer: Without 1/N, coupling force scales with oscillator count, making K non-portable.** Loudon's answer was correct. The precision added: the 1/N normalization makes K mean "coupling strength per oscillator pair" regardless of ensemble size. A patch tuned to the phase transition with 8 oscillators would be over-coupled and rigidly locked with 16 without this normalization.

---

## Lesson 3: The Order Parameter

**Q3.1** — Four oscillators at θ₁ = 0, θ₂ = 0.1, θ₃ = 0.2, θ₄ = π. Estimate r.

**Answer: r ≈ 0.5**

**Key correction:** Loudon estimated r ≈ 0.75, reasoning that the oscillators at 0 and π would "balance out to π/2" and then average with the cluster. This revealed a critical misconception about vector averaging on the circle. Oscillators at 0 and π point in opposite directions — they don't average to a midpoint, they cancel completely. Their combined contribution to the centroid is (1,0) + (-1,0) = (0,0). This leaves only oscillators 2 and 3 contributing, but divided by total N=4, giving r ≈ 0.5.

**The deeper lesson:** The order parameter is a vector average, not a scalar average. This is identical to destructive interference in audio: two sine waves in anti-phase don't produce half-amplitude, they cancel. Loudon's audio intuition about phase cancellation applies directly here and should be trusted over scalar averaging instincts. Practical implication: a population split into two phase-locked clusters on opposite sides shows r ≈ 0 even though there's highly organized — organized *opposition*. Low r doesn't always mean chaos.

**Q3.2** — What happens to coupling force when r = 0?

**Answer: Coupling force vanishes.** The coupling is K·r·sin(ψ - θᵢ), so r = 0 kills it regardless of K. Loudon's answer was correct and his physical picture ("pulled in all directions simultaneously and equally") was accurate. The refinement: for finite N (like 8 oscillators), r is never exactly zero — small fluctuations always exist, and these fluctuations seed the phase transition when K crosses the critical threshold.

**Q3.3** — Why does positive feedback suggest a phase transition?

**Answer: The self-reinforcing loop creates a threshold below which feedback can't overcome disorder, and above which it suddenly can.** Loudon identified the positive feedback correctly ("success to the successful"). The correction clarified the distinction between positive feedback (which gives acceleration) and a phase transition (which has a critical threshold with qualitatively different behavior on either side). Below Kc, the feedback exists but is too weak — disorder tears down any coherence that fluctuations build. Above Kc, the feedback overpowers disorder and r jumps to a macroscopic value. The canonical physical analogy is ferromagnetism: atomic magnetic moments (oscillators) have thermal disorder (frequency spread) fighting against exchange coupling (K). The Curie temperature is Kc. The synthesizer's coupling knob is the inverse of temperature in a magnet.

---

## Lesson 4: The Critical Coupling

**Q4.1** — Kc for 8 oscillators with ±5 Hz spread (σ ≈ 2.9 Hz)?

**Answer: Kc ≈ 1.6 × 2.9 ≈ 4.64 rad/s.** Loudon was uncertain about whether the calculation was really just multiplication, but it is — the elegance of the Kuramoto result. Doubling the spread doubles Kc: the relationship is perfectly linear. The nuance added: K doesn't need to be as large as the maximum detuning because the mean field K·r grows self-consistently as oscillators join the locked cluster, starting from center outward.

**Q4.2** — Why do center-frequency oscillators lock first?

**Answer: Smallest detuning relative to the emerging group frequency.** Loudon answered correctly and then immediately leapt to the design implication — using waveform shape to create multiple coupling centers. His observation that a saw wave provides a natural 1/n harmonic hierarchy for coupling strength is a genuine design principle, arrived at here from the mathematics rather than from intuition alone. This converges with the earlier Path B/C discussion.

**Q4.3** — Square-root scaling and knob sensitivity near Kc.

**Answer: This is both a feature and an engineering challenge.** Loudon's answer was exceptional and went well beyond the question, proposing four distinct engineering solutions: (1) high-resolution control mapping near Kc, (2) rate-limiting K changes through temporal filtering, (3) modifying the coupling function to saturate before full locking (replacing sin with tanh-compressed variant), and (4) deliberately engineering residual micro-oscillation near the locked state as a musical feature. Solution 3 is a genuine modification to the Kuramoto physics. Solution 4 connects to phase diffusion near synchronization in finite-N systems and is essentially engineering "analog feel" from first principles. The caution offered: the sensitivity near Kc is also where expressivity lives (like a bowed string near Helmholtz threshold or a vocalist at falsetto break). Engineering should tame the uncontrollable without eliminating the sensitivity itself.

**Q4.4** — Locking condition |ωᵢ - ω̄| ≤ K·r vs. PLL capture range.

**Answer: Similar mechanism, but Kuramoto's capture range is dynamic.** Loudon identified the core difference (fixed reference vs. mutual coupling). The key addition: in Kuramoto, r depends on how many oscillators are already locked, creating history dependence and **hysteresis**. Sweeping K up, synchronization snaps in at one threshold; sweeping down, it persists longer before breaking. This asymmetry is musically exploitable.

---

## Lesson 5: The Two-Oscillator Case

**Q5.1** — Minimum K for 440/442 Hz locking, and locked frequency.

**Answer: K > |Δω| ≈ 12.57 rad/s. Locked frequency = 441 Hz.** Loudon answered correctly on both points and added the correct observation that the phase offset shrinks toward zero as K increases further.

**Q5.2** — Beating pattern at K = 10 with Δω ≈ 12.57.

**Answer: Asymmetric beating — long lingering near unison, quick rush through anti-phase.** Loudon's description was qualitatively right but was describing K *just below* Δω rather than K = 10 which is meaningfully below. The sharpened picture: at K = 10, dφ/dt varies between 2.57 rad/s (near alignment, where coupling brakes hard) and 22.57 rad/s (opposite side, where coupling adds to the drift). The listener hears a lopsided rhythm: hang... hang... *whoosh*... hang... hang... *whoosh*. As K increases toward 12.57, the "hang" phase gets indefinitely longer while the "whoosh" stays similar. This uneven beating is musically distinct and could be deliberately used as a "struggling to lock" texture.

**Q5.3** — Sound of two sine waves at π/2 phase offset.

**Answer: A single sine wave at √2 amplitude, growing to 2× amplitude as offset approaches zero.** Loudon correctly identified that the level increases with decreasing offset. The refinement: sin(θ) + sin(θ + π/2) = √2·sin(θ + π/4), so the gain change from barely-locked to fully-locked is about 3 dB. For pure sines, no timbral change occurs (sum of same-frequency sines is always a sine). But for non-sinusoidal waveforms (like Loudon's nerve-impulse oscillators), the phase offset meaningfully changes the composite waveshape — the journey from π/2 to 0 offset would be a genuine timbral evolution, not just volume.

**Q5.4** — Coupling term for 2:1 locking of 440 Hz and 879 Hz.

**Answer:**
```
dθ₁/dt = ω₁ + K·sin(θ₂ - 2θ₁)
dθ₂/dt = ω₂ + K·sin(2θ₁ - θ₂)
```
**Effective detuning: 2(440) - 879 = 1 Hz ≈ 6.28 rad/s.**

Loudon had the right physical intuition ("the coupling term needs a 2 multiplied by the frequency of 440") but hadn't yet formalized it mathematically. The key insight made concrete: the detuning isn't between the raw frequencies (879 - 440 = 439), it's between ω₂ and the harmonic target 2ω₁ (880 - 879 = 1 Hz). The system projects onto the harmonic relationship and measures the gap. For general n:m locking, the effective detuning is |nω₂ - mω₁|.

---

## Additional Discussion: The Quarter-Cycle Meditation

Between Lessons 5 and 6, Loudon asked why π/2 is the critical phase offset — "why not 1/2 cycle or 1/3?" This produced an extended exploration connecting the quarter-cycle to the point where sin(φ) = 1 (maximum coupling force), and then tracing this across multiple domains: swing-pushing (maximum energy transfer at π/2 offset between force and position), driven oscillator resonance (force leads displacement by π/2 at resonance), reactive circuits (current leads/lags voltage by π/2 in pure capacitors/inductors), tidal friction (tidal bulge offset from the Moon), and quadrature signals in radio (I/Q as maximally independent sinusoidal signals).

The unifying principle: **π/2 is where a sinusoidal interaction achieves maximum exchange, maximum effort, maximum energy transfer, maximum independence.** In Kuramoto, oscillators locked at π/2 offset are under maximum strain — the coupling is working as hard as it can. The quarter-cycle is the sound of maximum effort.

---

## Additional Discussion: Emergent vs. Explicit Harmonic Locking

A pivotal exchange occurred when Loudon noticed a discrepancy between his expectation (emergent harmonic locking as a natural consequence of coupling) and the lesson document's presentation (explicit ratio terms as engineered coupling). This surfaced three design paths:

**Path A — Explicit ratio terms.** Code sin(nθⱼ - mθᵢ) for each desired ratio. Precise, controllable, computationally predictable.

**Path B — Nonlinear waveform coupling.** Couple oscillator *outputs* rather than phases. Harmonic content of the waveform automatically generates all n:m coupling terms at strengths determined by spectral content. A sawtooth provides strong octave coupling (1/n harmonic rolloff), progressively weaker for higher ratios.

**Path C — Generalized coupling function.** Use a periodic function h(φ) instead of pure sin(φ). The Fourier content of h determines which ratios lock. Waveform shape = coupling function shape = harmonic hierarchy.

**The key insight:** Kuramoto coupling is a fine-tuning mechanism, not a generative one. It resolves "approximately" into "exactly" but can't create relationships from nothing.

## Additional Discussion: Inharmonic Coupling and Frustration

Loudon's question about inharmonic partials (stretched piano, bowed cymbal) produced an original analysis: inharmonic partials create **frustrated coupling** — incommensurate forces on a single degree of freedom. Because all partials of a single oscillator are enslaved to the fundamental's phase (the nth partial at ratio rₙ is at rₙθ, not at an independent phase), external oscillators locking to different inharmonic partials pull the fundamental in contradictory directions.

The asymmetry Loudon identified: inharmonic oscillators work well as high-inertia masters (external oscillators happily lock to whichever actual partial is nearest) but break down as low-inertia participants (contradictory back-forces create sustained frustration, not just noise). This has direct design implications for the neurological synthesizer architecture.

---

## Lessons 6, 7, 8: Not Yet Quizzed

The lesson document continues with frequency distributions (Lesson 6), extensions and limits (Lesson 7), and implementation synthesis (Lesson 8). These quizzes remain available for future sessions.

---

*"The purpose of a quiz is not to test knowledge but to create the specific conditions under which knowledge crystallizes."*
