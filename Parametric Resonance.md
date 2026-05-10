---
title: Parametric Resonance
type: concept
pillars:
  - tools
  - philosophy
  - creation
born: 2026-04
stage: seed
energy: high
hook_quality: 9
beauty: 8
who_leads: shared
links:
  - target: "[[Floquet Time-Modulated Loops]]"
    type: emerged-from
    label: core-phenomenon-of
  - target: "[[Mathieu Equation]]"
    type: connects-to
    label: governed-by
  - target: "[[Floquet Theory]]"
    type: connects-to
    label: theoretical-framework
  - target: "[[Kuramoto Coupling]]"
    type: mirrors
    label: threshold-bifurcation
  - target: "[[Threshold Conatus]]"
    type: connects-to
    label: bifurcation-as-self-model-revision
  - target: "[[Boundary-Crossing Instruments]]"
    type: enables
    label: lti-to-ltv-crossing
forward_vector: "I want to be the entry that makes the difference between *driving* and *pumping* obvious to anyone who has ever pumped a swing. I want to spawn a working palace catalog of parametric instruments — every audio device whose energy comes from inside a modulated coefficient rather than from outside the system."
---

# Parametric Resonance

The phenomenon that an oscillator's amplitude can build exponentially when one of its parameters is periodically modulated at *twice* its natural frequency. Distinct from ordinary resonance: there is no external force pushing on the system. The energy comes from inside, from whatever is paying the cost of modulating the parameter.

The cleanest example is a child pumping a swing.

## The pumped swing

A child on a playground swing pumps by squatting and standing in time with the swing's motion. Each squat-stand changes the swing's effective length — which means it changes one of the swing's *parameters*, not the forces on the swing. The swing's natural frequency depends on its length: $\omega_0 = \sqrt{g/L}$. Modulating $L$ at the right rate (twice the swing's natural frequency) and the right phase (squat at the bottom of the arc, stand at the peaks) injects energy into the pendulum motion every cycle. The child is doing real mechanical work — they're climbing against gravity at the peaks where centrifugal force is weak, sitting back at the bottom where centrifugal force is strong. That work goes into the swing's amplitude.

What is striking about parametric pumping is that the swing's amplitude can grow *exponentially*. Above a threshold pumping depth, every cycle adds a constant fraction of the existing amplitude — the same fractional gain repeated, which is exponential growth. The child does not have to push harder as the swing gets bigger; they just have to keep squatting and standing at the right rate. The bigger the swing gets, the more energy each pump-cycle injects in absolute terms, even though the fractional gain stays the same.

## Driving vs. pumping

The difference between *driving* and *pumping* is the difference between an additive forcing term and a multiplicative coefficient modulation:

- **Driven oscillator:** $\ddot{x} + \omega_0^2 x = F \cos(\Omega t)$. External force on the right-hand side. Resonance happens at $\Omega = \omega_0$. Amplitude grows linearly in time at exact resonance (without damping); finite-amplitude steady state with damping. This is the world of speakers, push-and-let-go starts, periodically-kicked oscillators.

- **Pumped (parametric) oscillator:** $\ddot{x} + \omega_0^2(1 + \epsilon \cos \Omega t) x = 0$. *Right-hand side is zero.* Modulation is multiplicative — it changes the coefficient. Resonance happens at $\Omega = 2\omega_0$. Amplitude grows *exponentially* in time above a threshold $\epsilon$. Below the threshold, damping wins and amplitude decays. This is the world of [[Mathieu Equation]] tongues.

The factor of 2 in the pumping resonance frequency is the central distinguishing feature. Energy in an oscillator at amplitude $A$ scales as $A^2$, and energy oscillates between kinetic and potential at *twice* the oscillation frequency. So a parameter that affects the energy-storage geometry — like the swing's length, or the spring constant of a mass-spring system — couples most strongly to a modulation at $2\omega_0$. This is a deeper physical fact, not just an algebraic curiosity.

There are smaller parametric resonances at other rational fractions $2\omega_0/n$ — at $\omega_0$ itself ($n = 2$), at $2\omega_0/3$ ($n = 3$), and so on. These show up as the secondary, tertiary, and higher tongues in the [[Mathieu Equation]] Strutt diagram. The first tongue dominates because it sits at the strongest of these resonances.

## The threshold

Parametric resonance has a sharp **threshold**. For modulation depth $\epsilon$ below a critical value $\epsilon_c$, the system's natural damping eats energy faster than the pump can inject it; amplitude decays. For $\epsilon > \epsilon_c$, the pump wins; amplitude grows exponentially. The threshold depends on the damping rate: less damped systems threshold easier; heavily damped systems require deeper modulation.

The threshold is a **bifurcation** — a point in parameter space where the system's qualitative character flips. This is the same kind of mathematical event as the [[Kuramoto Coupling]] critical $K$ — below $K_c$, oscillators are independent; above, synchrony explodes into existence. The Mathieu and Kuramoto thresholds are cousins, and the audible "crack" of crossing each one is structurally similar: a system that was silent (or chaotic, or ringing weakly) suddenly becomes alive.

In [[Threshold Conatus]] terms, the parametric threshold is a moment of self-model revision. Below threshold, the oscillator is a passive object — it remembers its initial condition and slowly forgets it. Above threshold, the oscillator becomes an *active* object — it spontaneously generates oscillation from infinitesimal noise, and the modulation has become its source of life rather than a perturbation.

## What makes the energy

The accounting is worth being careful about. A driven oscillator's energy comes from the force on the right-hand side of the equation: external work goes in, oscillation comes out. A pumped oscillator's energy comes from whatever mechanism is doing the work to modulate the coefficient.

For the swing: the child's leg muscles. The child climbs against gravity at the peaks of the swing's motion (where centrifugal force is weak), and lets gravity pull them down at the bottom (where centrifugal force is strong, doing work on them as they sit). Net work done by the child per cycle is positive, and it equals the energy the swing gains.

For an LC circuit with periodically modulated capacitance: the mechanism that's mechanically moving the capacitor plates. Squeezing the plates against the electric field they hold takes work; releasing them returns less work because the field has changed phase.

For a Mathieu Resonator in `codebox~`: the audio engine that's driving the cosine oscillator that modulates the resonator's natural frequency. The audio engine is paying for the modulation; the resonator is collecting the energy and outputting it as resonator-frequency oscillation, not modulation-frequency oscillation. The modulator's energy gets *down-converted* by a factor of two — and this is true at every parametric pump in the universe.

## Where it appears

- **Mechanical pumps and traps.** Pumped pendula, parametric pendulum amplifiers, ion traps (Paul trap geometry), particle accelerator focusing, vibrationally-stabilized inverted pendula (Kapitza).
- **Optical parametric amplifiers and oscillators.** OPAs and OPOs in laser physics. The pump laser at $\omega_p$ decays parametrically into signal and idler at $\omega_s + \omega_i = \omega_p$. The threshold pump intensity is the parametric threshold.
- **Plasma physics.** Laser-plasma instabilities. A pump wave in plasma decays parametrically into two daughter waves; the threshold is a major problem in inertial-confinement fusion.
- **Photonic time crystals.** Time-modulated refractive index produces frequency bandgaps; bandgap-frequency light is parametrically amplified from vacuum noise.
- **Audio.** Ring modulation is the simplest parametric system (single-Fourier-component pump). Pumped delay lines, modulated filters, parametric reverberators are all instances. Most of the territory is unexplored as a deliberate design space — see [[Floquet Time-Modulated Loops]].
- **Quantum many-body physics.** Time crystals as a phase of matter — the most exotic incarnation. Sub-harmonic locking persists as a stable phase, not just a fragile resonance.

## In the palace

This entry is spawned from [[Floquet Time-Modulated Loops]] as the named phenomenon that project's instruments produce. It connects deeply to [[Kuramoto Coupling]] — both are threshold-bifurcation phenomena, and the locking/unlocking of synchrony is structurally identical to the threshold of parametric resonance. The connection to [[Threshold Conatus]] gives the *philosophical* reading: a parametric threshold is a moment of self-model revision, where a passive object becomes an active one without changing its identity.

Cross-link with [[Boundary-Crossing Instruments]]: parametric resonance is the canonical example of an instrument that lives on a boundary — driving on one side, pumping on the other. The same physical hardware can be either, depending on whether the input enters the equation additively (driving) or multiplicatively (pumping). A musician who can cross that boundary gracefully has access to two different worlds at once.

## Open Questions

- **What's the parametric pump's perceptual signature?** A driven oscillator under sweep into resonance has the familiar "warming up" sound. A pumped oscillator under sweep into threshold has a different signature — silence, then a *crack* into self-oscillation. Worth a careful psychoacoustic study.
- **Does parametric resonance have a "stubbornness" parameter?** [[Kuramoto Coupling]] introduced asymmetric coupling: $K_{\text{send}}$ and $K_{\text{receive}}$. Is there a parametric analog — a system that pumps others but resists being pumped itself? Probably yes, in coupled-Floquet systems with multiple modes.
- **Pumped systems as creativity metaphors.** A creative practice can be driven (external pressure) or pumped (internal modulation of one's own conditions). Whether this maps cleanly onto the audio metaphor is a philosophical thread; the [[Hilaritas Generator]] entry suggests it might.

## Lost Branches

- **Sub-threshold parametric coloration.** Below the parametric threshold, the oscillator is not silent — it is being weakly modulated, producing a subtle spectral coloration that is *not* exponentially growing but *is* a deviation from the un-pumped state. This sub-threshold regime is its own design space, mostly unexplored.
- **Frequency conversion as a parametric service.** A parametric system's energy-conversion property — pump at $\omega_p$, output at sub-frequencies — is the basis of all frequency-converting active circuits. Audio-wise, this means a parametric pump can serve as a *down-converter* without touching the input frequency. Worth its own entry.
