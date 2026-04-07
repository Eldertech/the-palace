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
---

# Dispersion

*Dispersion* is one term doing multiple jobs across audio domains. A single word, three distinct meanings — all involving spreading, all involving wavelength or frequency, but operating in different dimensions. Learning to distinguish them is a teachable moment: it reveals the hidden unification principle.

## Three Meanings of Dispersion

### 1. Wave Dispersion: Frequency-Dependent Propagation Speed

In physics and acoustics, **dispersion** means **frequency-dependent wave propagation speed**. Different frequencies travel at different velocities through a medium.

**Physical origins:**
- Stiff strings and bars: restoring force couples to inertia nonlinearly; higher frequencies experience different effective stiffness
- Waveguides (transmission lines, pipes): frequency-dependent boundary impedance effects
- Room modes: acoustic propagation speed varies with frequency due to material absorption and resonance
- Ocean waves: water depth determines wave speed; long waves travel faster than short waves

**Perceptual consequence:**
- Waveform stretches and spreads over distance (dispersion in the literal sense: things scatter)
- Phase relationships change over time; harmonically related frequencies *desynchronize*
- The characteristic **metallic, inharmonic sound** of a stiff piano string: the fundamental and low partials remain nearly harmonic, but upper partials arrive slightly early (or late, depending on the medium's stiffness signature), creating the bell-like ring
- In extreme cases (like deep-water ocean waves), frequency shifting can occur — the waveform's center frequency shifts as it travels

**Where it happens:**
- Piano strings under high tension (stiff string regime)
- Guitar strings (slight effect, less dramatic than piano)
- Bell metal and struck membranes (moderate to high stiffness)
- Room modes and acoustic propagation
- Transmission lines and waveguides (electrical analogs: frequency-dependent propagation)

**Mathematical signature:**

The wave equation becomes:
$$\omega = \omega(k) \neq c \cdot k$$

For a stiff string, the dispersion relation is:
$$\omega_n = n \cdot f_0 \sqrt{1 + B \cdot n^2}$$

where B is the stiffness coefficient. Higher partials (larger n) have higher relative frequency shifts.

**Synthesis approach:**
- Compute partial frequencies from a frequency-dependent dispersion relation, not the harmonic series
- Use [[Categorizing Inharmonicity|nonlinear oscillator potentials]] to generate inharmonic partials naturally
- Apply frequency-dependent delay: each partial gets a group delay proportional to its frequency (inverse relationship: lower frequencies delayed more, or vice versa depending on the medium)

---

### 2. Loudspeaker Dispersion: Spatial Spreading Pattern

In speaker and acoustic design, **dispersion** refers to the **angular distribution of sound energy**—how the acoustic field spreads through space.

**What it describes:**
- How wide or narrow the acoustic "beam" is at different frequencies
- A tweeter with narrow dispersion: high frequencies radiate in a tight cone (high directivity)
- A woofer with wide dispersion: low frequencies spread broadly into the room (omnidirectional character)
- This is *frequency-dependent* but for geometric reasons, not propagation speed

**Key insight: Dispersion ≠ frequency shift**
- No temporal spreading of waveforms
- No phase desynchronization between frequencies
- Pure spatial geometry: different frequencies have different "directivity patterns"
- The *same frequency* heard in different parts of the room may have slightly different amplitude, but the frequency itself does not change

**Physical origin:**
- Wavelength determines diffraction: when wavelength >> source size, waves bend around the source (omnidirectional). When wavelength << source size, waves beam forward.
- A horn or dome tweeter is small → high-frequency wavelengths are small relative to driver size → strong beaming
- A woofer cone is large → low-frequency wavelengths are large relative to driver size → spreading

**Synthesis consequence:**
- Irrelevant for single-channel audio synthesis (no spatial dimension yet)
- Critical for spatial audio, ambisonics, and binaural rendering
- Modeling speaker dispersion in auralization: high-frequency content should have higher directivity in the Head-Related Transfer Function (HRTF)

**Design practice:**
- Asymmetric crossovers to match driver dispersion: delay high-frequency channels so they arrive phase-coherent with lows despite different directivity
- Wide-dispersion tweeters for near-field monitoring and small rooms
- Narrow-dispersion designs for far-field precision

---

### 3. Granular Dispersion: Statistical Spread in Parameter Space

In [[Granular Synthesis|granular synthesis]], **dispersion** refers to the **spread or variance of grain parameters around a center value**.

**Parameters that can be dispersed:**
- Pitch: grains centered on 440 Hz with dispersion ±50 cents (random variation around target)
- Timing: grain onsets dispersed around a regular beat with jitter
- Duration: grain envelope lengths vary across a distribution
- Amplitude: grain loudness varies with noise (Gaussian, uniform, or custom distribution)
- Spatial position: grains scatter across a stereo field or 3D space

**Perceptual consequence:**
- Low dispersion: tight, coherent cloud with clear pitch and temporal character
- High dispersion: granular texture, cloud-like ambiguity, loss of sense of "pitch" in favor of "timbre"
- Dispersion creates *statistical dimensionality*: the character of the sound comes not from individual grain properties but from the emergent population statistics

**Connection to particle systems:**
[[Granular Synthesis|In particle synthesis]], dispersion is implemented naturally: set initial position and velocity distributions, let physics unfold. A dispersed cloud of particles under gravity will converge; under repulsion or drag, they will spread. The dispersion evolves over time as a consequence of forces, not by explicit parameter randomization.

---

## The Prism as Unifying Icon

A **prism** disperses white light into spectrum: a beam of mixed frequencies enters, refracts at frequency-dependent angles (because refractive index *n* depends on wavelength), and exits as a fanned array of colors.

**The prism unifies all three meanings:**

1. **Temporal dispersion** (wave propagation): Light of different wavelengths travels at different speeds through glass (different phase velocities). The path length through the prism delays longer wavelengths more than shorter ones. Time and frequency are entangled.

2. **Spatial dispersion** (speaker/beam spread): The refracted beams exit the prism at different angles. Red (long wavelength) bends less; violet (short wavelength) bends more. The spectrum is spatially spread.

3. **Statistical dispersion** (parameter spread): The prism transforms a single input (white light of unknown composition) into a distribution (a spectrum). You cannot see individual frequencies in white light; the prism reveals the underlying *population of wavelengths* as a visible spread.

The prism is the visual *lingua franca* of dispersion. When teaching dispersion in any context, the prism should appear: as a reminder that spreading in time, space, and parameter statistics are facets of a single underlying principle.

---

## Convolution and Artificial Dispersion

**Can convolution create dispersion?**

The answer is **yes, but with constraints**. Convolution with an impulse response (IR) that is **minimum-phase** and has **frequency-dependent group delay** can simulate dispersive propagation.

**What works:**
- An IR derived from a real dispersive medium (e.g., recorded sound traveling through stiff strings or dispersive waveguides)
- A synthetic IR built from cascaded all-pass filters tuned to create frequency-dependent group delay
- A minimum-phase IR (one with no zeros in the right half-plane): guarantees causality and stability

**What doesn't work:**
- Standard reverb impulse responses (even "bright" ones): these are not minimum-phase in the dispersive sense. They add diffuse reflections, not structured frequency-dependent delay.
- Linear phase EQ: creates frequency-dependent *magnitude* changes, not group delay.
- A maximum-phase IR: creates pre-emphasis (the effect precedes the cause), violating causality

**The technical requirement:**

For convolution to create authentic wave dispersion, the frequency-dependent group delay must be:
$$\tau(\omega) = -\frac{d\phi(\omega)}{d\omega}$$

where φ(ω) is the phase response. This must be *positive* and *nonlinear* in ω to create the characteristic temporal spreading of higher frequencies.

**Practical synthesis approach:**
- Generate a time-domain IR by cascading all-pass filters: each all-pass has zero group delay at DC and all-pass group delay at its tuned frequency. Cascade them to build a frequency-dependent profile.
- Convolve incoming audio with this IR.
- Adjust all-pass Q and frequency to match the target dispersion relation (e.g., the stiffness profile of a real instrument).

This approach is computationally efficient for real-time synthesis and creates the *authentic phase signature* of a dispersive medium without simulating the full physics.

---

## Open Questions

1. **Perceptual indistinguishability**: Can a listener reliably distinguish between actual wave dispersion (stiff string) and convolution-based dispersion with a crafted IR? At what dispersion magnitudes does the difference become audible?

2. **Coupled dispersion**: What happens when two dispersion types interact? A dispersive medium (wave dispersion) with a narrow-dispersion speaker (loudspeaker dispersion) reproducing it—how do the spatial and temporal effects combine?

3. **Inverse dispersion**: Can convolution "undo" dispersion? If you have a recording of a heavily dispersive sound, can you convolve it with the inverse IR to recover the "true" (harmonic) spectrum? What are the causality and stability constraints?

4. **Granular dispersion and inharmonicity**: In [[Granular Synthesis|granular synthesis with dispersed pitch]], how does the statistical spread of grain frequencies relate to the *perceptual* sensation of inharmonicity? Is high granular pitch dispersion equivalent to [[Categorizing Inharmonicity|stochastic scatter inharmonicity]]?

5. **Dispersion in feedback systems**: In a feedback delay or reverb, does dispersion in the feedback path (different delay times for different frequencies) couple to the resonance structure? Can you design a feedback loop that uses dispersion to sculpt resonance?

