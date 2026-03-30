---
title: "Piano String Inharmonicity"
type: concept
pillars: [creation, tools]
born: 2026-03
stage: growing
links:
  - target: "[[Harmonicity and Inharmonicity]]"
    type: connects-to
  - target: "[[Boundary-Crossing Instruments]]"
    type: deepens
  - target: "[[Frequency-Time Duality]]"
    type: connects-to
  - target: "[[Logarithmic Interface Scaling]]"
    type: connects-to
  - target: "[[Ohm's Law]]"
    type: connects-to
---
<!--This page is good, but can we make it more visual and interactive? in obsidian the link to the interaction artifact is not functional. Do some pages, like this one, need an accompanying HTML version that sits right beside it, like our ceremony context files do, but the HTML version is a more interactive and beautiful version, or maybe that is what the artifact is. here in Obsidian I can't render the JSX files natively, if they are inside of HTML can I? these dense technical/scientific pages with accompanying interactions can be really great if we design this right! -->

# Piano String Inharmonicity

The stretching of upper harmonics in stiff strings, making their partials sharp relative to integer multiples of the fundamental. This is what gives piano tone its characteristic "bell-like" quality and distinguishes it from idealized harmonic instruments.

## The Physics

In an ideal flexible string, partials occur at exact integer multiples of the fundamental: f₁, 2f₁, 3f₁, 4f₁...

Real strings have stiffness, which adds a restoring force beyond simple tension. This makes higher partials progressively sharper than the harmonic series would predict.

### The Inharmonicity Formula

**f_n = n · f₀ · √(1 + B · n²)**

Where:
- **f_n** = frequency of the nth partial
- **n** = partial number (1, 2, 3, ...)
- **f₀** = fundamental frequency
- **B** = inharmonicity coefficient

For small B (typical piano strings: B ≈ 0.0001 to 0.001), this approximates to:

**f_n ≈ n · f₀ · (1 + B · n²/2)**

So the nth partial is stretched sharp by approximately **B · n³ · f₀ / 2** Hz.

The stretching grows with the cube of the partial number — higher harmonics are progressively more out of tune.

### The Inharmonicity Coefficient

**B = (π³ · E · d⁴) / (64 · T · L²)**

Where:
- **E** = Young's modulus (material stiffness)
- **d** = string diameter
- **T** = tension
- **L** = string length

**Key insight:** B ∝ 1/T

Inharmonicity is inversely proportional to tension. This is what makes string bending affect timbre.

## String Bending and Timbre Change

When you bend a piano string (like a guitarist bends a guitar string), you increase tension. This has two effects:

1. **Fundamental frequency rises** (the note goes sharp)
   - f₀ → √k · f₀ (where k is the tension multiplier)

2. **Inharmonicity decreases** (the tone becomes purer)
   - B → B/k

As tension increases:
- Upper partials compress toward ideal harmonic positions
- The characteristic "piano-ness" diminishes
- The tone becomes cleaner, more guitar-like

This is audible on real guitars: a bent note has subtly different timbre than an unbent note at the same pitch, because the bent string has lower inharmonicity.

## Why This Is Linear Time-Invariant

**Can convolution be used to create dispersion in audio signals?**

Yes! Despite being called "dispersion," piano string inharmonicity **IS** linear and time-invariant, so it can be synthesized via convolution.

The impulse response is a sum of exponentially-decaying sinusoids at the inharmonic frequencies:

**h(t) = Σ A_n · e^(-α_n·t) · sin(2π·f_n·t + φ_n)**

Key features:
- Multiple exponentially-decaying sinusoids at inharmonic frequencies f_n
- Long duration (piano strings ring for seconds)
- Frequency-dependent decay rates: higher partials typically decay faster
- Initial amplitudes depend on striking point and hammer characteristics

This is a valid impulse response for an LTI system. Convolving any signal with this impulse response creates the inharmonic dispersion effect.

### The Confusion: Dispersion Usually Means Non-Linear

In many physical systems (shock waves, non-linear media), dispersion is amplitude-dependent and therefore non-LTI. But **stiff string dispersion is different** — it's purely geometric, arising from the relationship between wavelength and wave speed in a stiff medium. The wave equation for a stiff string has frequency-dependent phase velocity, but this is still LTI.

## Limits of the Convolution Approach

1. **Two-stage decay:** Real piano strings show fast initial decay followed by slower "aftersound" due to energy transfer between string polarizations. This requires multiple decay constants per partial.

2. **Phantom partials:** Very hard strikes can excite weak non-linear combination tones. These are amplitude-dependent and not capturable by LTI.

3. **Coupling non-linearities:** During initial attack, there's weak coupling between modes that's amplitude-dependent, though subtle.

4. **Bridge/soundboard interaction:** The termination impedance is complex and frequency-dependent, affecting which partials decay faster. This IS linear but requires careful modeling.

5. **Computational cost:** Modeling 20+ inharmonic partials with long decay times requires very long impulse responses.

For most musical applications, the LTI approach works beautifully. The non-linear effects are second-order.

## Interactive Teaching Demonstration

The string bending explorer makes inharmonicity tangible through:

1. **Fixed reference frame** — Ideal harmonic positions stay fixed in space
2. **Moving partials** — Actual inharmonic frequencies shown as deviations
3. **Real-time bending** — Slider changes tension, partials compress toward ideal
4. **Color-coded stretching** — Visual feedback on cents of deviation

The demo is designed for teaching: it shows *what is happening* (partials moving toward integer ratios) rather than just *what you hear* (timbre change).

**Pedagogical design choice:** The fixed harmonic positions make it immediately clear that inharmonicity is a *deviation from* the harmonic series, not an independent phenomenon. The partials chase the gray circles but never catch them.

The demo uses [[Logarithmic Interface Scaling]] for the bend slider, making tension changes feel symmetric around the unbent state.

## Cross-Domain Resonance

### Boundary-Crossing Connection

String bending reveals that **timbre is not constant** — it's a function of the instrument's state. The same string at different tensions has different harmonic content. This connects to [[Boundary-Crossing Instruments]]: an instrument that dissolves the category "same sound, different pitch."

The bent string is neither "the same note played differently" nor "a different note" — it's a continuous transformation where pitch and timbre couple.

### Frequency-Time Connection

Inharmonicity creates a frequency-domain pattern (stretched partials) that corresponds to a time-domain pattern (the impulse response). The two descriptions are equivalent but emphasize different aspects. See [[Frequency-Time Duality]].

## Related Concepts

- [[Harmonicity and Inharmonicity]] — General framework
- [[Boundary-Crossing Instruments]] — String bending as boundary crossing
- [[Frequency-Time Duality]] — Two views of the same phenomenon
- [[Logarithmic Interface Scaling]] — Interface pattern used in demo
- [[Ohm's Law]] — B ∝ 1/T is same inverse relationship pattern

## Artifacts

Interactive string bending demonstration: `/Artifacts/Piano String Inharmonicity/string_bending_inharmonicity.jsx`

## Open Questions & Budding Branches

- Could inharmonicity be used as a *compositional parameter*? Varying B over time to morph between piano-like and pure tones?
- What is the perceptual threshold for inharmonicity? How much B is needed before listeners hear it as "bell-like"?
- Do other boundary-crossing instruments (prepared piano, bowed strings with variable bow pressure) show similar pitch-timbre coupling?

---

*"The string does not lie. Increase tension, reduce inharmonicity. The physics is simple; the timbre is profound. What seemed like a constant — the sound of the string — was only constant because we held tension constant."*
