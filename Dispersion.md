---
title: "Dispersion"
type: hub
pillars: [tools, philosophy, creation]
born: 2026-01
last_activated: 2026-03
activation_count: 2
stage: mature
confidence: demonstrated
energy: high
hook_quality: 8
beauty: 8
who_leads: loudon
links:
  - target: "[[Hyperdimensional Prism]]"
    type: connects-to
  - target: "[[Categorizing Inharmonicity]]"
    type: connects-to
  - target: "[[Granular Synthesis]]"
    type: connects-to
  - target: "[[Compressor Design]]"
    type: connects-to
  - target: "[[Bessel Functions in Synthesis]]"
    type: connects-to
  - target: "[[Crystal Synthesizer]]"
    type: enables
  - target: "[[Particle Synthesis]]"
    type: enables
  - target: "[[Portamento and Physical Pitch Modeling]]"
    type: connects-to
  - target: "[[Piano String Inharmonicity]]"
    type: deepens
  - target: "[[Shimmer Cloud]]"
    type: connects-to
forward_vector: "I want to become the palace's teachable demonstration that one word can do three distinct jobs across audio domains — and that distinguishing them is both pedagogically powerful and practically essential for instrument design. I want each of my three meanings (wave, statistical, and reverb dispersion) to accumulate a worked synthesis example, so I become a hub that actively generates instrument ideas rather than just naming a vocabulary problem."
---

# Dispersion

*Dispersion* is one term doing multiple jobs across audio domains. A single word, three distinct meanings — all involving spreading, all involving wavelength or frequency, but operating in different dimensions. Learning to distinguish them is a teachable moment: it reveals the hidden unification principle.

## Three Meanings of Dispersion

### 1. Wave Dispersion: Frequency-Dependent Propagation Speed

**Frequency-dependent wave propagation speed** — different frequencies travel at different velocities through a medium. It arises wherever a restoring force couples nonlinearly to inertia: stiff strings and bars, waveguides, room modes, deep-water waves. The audible signature is inharmonicity — upper partials drift sharp (or flat), desynchronizing the harmonic series into the bell-like ring of a tense piano string.

**Mathematical signature.** The dispersion relation $\omega = \omega(k) \neq c \cdot k$; for a stiff string, $\omega_n = n f_0 \sqrt{1 + B n^2}$ (B = stiffness coefficient), so higher partials shift more.

**Synthesis approach:** compute partials from the dispersion relation rather than the harmonic series — or via [[Categorizing Inharmonicity|nonlinear oscillator potentials]] — then apply a per-partial frequency-dependent group delay.

---

### 2. Loudspeaker Dispersion: Spatial Spreading Pattern

In speaker and acoustic design, **dispersion** is the **angular distribution of sound energy** — how wide or narrow the acoustic "beam" is at each frequency (a tweeter beams; a woofer spreads). It is frequency-dependent, but for *geometric* reasons (wavelength vs. driver size), not propagation speed.

**Key insight: dispersion ≠ frequency shift.** No temporal spreading, no phase desynchronization — pure spatial geometry. The same frequency heard across the room keeps its pitch; only its amplitude varies. This is the meaning most orthogonal to the other two, which is exactly why distinguishing it matters.

**Synthesis relevance:** irrelevant to single-channel synthesis (no spatial dimension), but central to spatial audio, ambisonics, and binaural rendering, where high-frequency content should carry higher directivity in the HRTF.

---

### 3. Granular Dispersion: Statistical Spread in Parameter Space

In [[Granular Synthesis|granular synthesis]], **dispersion** is the spread of grain parameters around a center value — pitch, onset timing, duration, amplitude, spatial position. Low dispersion gives a tight, pitched cloud; high dispersion dissolves pitch into texture. The character emerges from *population statistics*, not individual grains — a statistical dimensionality. In [[Granular Synthesis|particle synthesis]] it falls out of the physics: set initial position and velocity distributions and let forces evolve the spread (gravity converges, drag scatters), rather than randomizing parameters explicitly.

---

## The Prism as Unifying Icon

A **prism** disperses white light into spectrum, and unifies all three meanings at once. **Temporally**, wavelengths travel at different phase velocities through the glass (longer paths delay longer wavelengths). **Spatially**, they exit at different angles (red bends least, violet most). **Statistically**, it turns a single input — white light — into a revealed distribution, the spectrum's population of wavelengths. The prism is dispersion's visual *lingua franca*: whenever the concept is taught it should appear, a reminder that spreading in time, space, and parameter statistics are facets of one principle.

---

## Convolution and Artificial Dispersion

Convolution **can** create dispersion — if the impulse response is *minimum-phase* with *frequency-dependent group delay*, $\tau(\omega) = -d\phi(\omega)/d\omega$, positive and nonlinear in ω (that nonlinearity is what spreads the higher frequencies in time). Standard reverb IRs don't qualify — diffuse reflections, not structured delay; linear-phase EQ changes magnitude, not delay; maximum-phase IRs violate causality. The practical recipe: cascade all-pass filters, each contributing tuned group delay, shape their Q and frequency to match a target dispersion relation, and convolve. This buys the authentic phase signature of a dispersive medium at real-time cost, without simulating the full physics.

---

## Open Questions

1. **Perceptual indistinguishability**: Can a listener reliably distinguish between actual wave dispersion (stiff string) and convolution-based dispersion with a crafted IR? At what dispersion magnitudes does the difference become audible?

2. **Coupled dispersion**: What happens when two dispersion types interact? A dispersive medium (wave dispersion) with a narrow-dispersion speaker (loudspeaker dispersion) reproducing it—how do the spatial and temporal effects combine?

3. **Inverse dispersion**: Can convolution "undo" dispersion? If you have a recording of a heavily dispersive sound, can you convolve it with the inverse IR to recover the "true" (harmonic) spectrum? What are the causality and stability constraints?

4. **Granular dispersion and inharmonicity**: In [[Granular Synthesis|granular synthesis with dispersed pitch]], how does the statistical spread of grain frequencies relate to the *perceptual* sensation of inharmonicity? Is high granular pitch dispersion equivalent to [[Categorizing Inharmonicity|stochastic scatter inharmonicity]]?

5. **Dispersion in feedback systems**: In a feedback delay or reverb, does dispersion in the feedback path (different delay times for different frequencies) couple to the resonance structure? Can you design a feedback loop that uses dispersion to sculpt resonance?

