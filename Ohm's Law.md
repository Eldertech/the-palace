---
title: Ohm's Law
type: concept
pillars:
  - tools
  - philosophy
born: 2026-03
stage: mature
links:
  - target: "[[Logarithmic Interface Scaling]]"
    type: connects-to
  - target: "[[FOUR PILLARS]]"
    type: connects-to
  - target: "[[Modes of Collaboration]]"
    type: connects-to
  - target: "[[Piano String Inharmonicity]]"
    type: connects-to
  - target: "[[Boundary-Crossing Instruments]]"
    type: mirrors
    label: reframing-inverse-relationships
forward_vector: "I want to become the palace's exemplar for cross-domain structural isomorphism — the entry that shows students how a single equation (V=IR) appears identically in electrical, hydraulic, thermal, and acoustic domains, making each domain more legible through the others. I want to grow a section connecting Ohm's Law specifically to Loudon's DSP work: resistance as filter Q, current as signal flow, voltage as amplitude — making the electronics metaphor operative in synthesis."
---

# Ohm's Law

**V = I × R**

The fundamental relationship between voltage, current, and resistance in electrical circuits. A model system for building intuition about how variables relate in simple equations — particularly equations where one variable is in the denominator.

## The Equation

```
V = I × R

Where:
V = Voltage (volts) — electrical potential difference
I = Current (amperes) — flow of charge
R = Resistance (ohms) — opposition to flow
```

Equivalently: **I = V / R** or **R = V / I**

## Cross-Domain Understanding

The same relationship pattern appears across many fields:

### Water Flow
- **V** (Voltage) = Height difference (pressure)
- **I** (Current) = Flow rate (liters/second)
- **R** (Resistance) = Pipe narrowness / obstacles

Higher pressure → more flow. More obstacles → less flow.

### Light
- **V** (Voltage) = Light source strength
- **I** (Current) = Photon flux (photons/second)
- **R** (Resistance) = Medium opacity

Brighter source → more photons. Opaque medium → fewer photons.

### Sound
- **V** (Voltage) = Acoustic pressure
- **I** (Current) = Particle velocity
- **R** (Resistance) = Acoustic impedance

Higher pressure → faster particle motion. Dense medium → more resistance.

### Physical Labor
- **V** (Voltage) = Applied force
- **I** (Current) = Work rate (boxes moved/time)
- **R** (Resistance) = Box weight / friction

More force → more work done. Heavier boxes → less throughput.

## Interactive Learning Tool
<!-- Link to the html -->
The interactive Ohm's Law explorer makes variable relationships tangible through:

1. **Lock mechanism** — Choose which variable stays constant (like a real experiment)
2. **Logarithmic sliders** — Equal movements represent equal multiplications (see [[Logarithmic Interface Scaling]])
3. **Live equation display** — Watch V = I × R update with actual values
4. **Unified precision** — All values show 4 decimal places for direct comparison

The tool serves dual purpose: building Loudon's understanding + teaching instrument for others.

**Pedagogical insight:** An interactive demo is complete when the creator can teach confidently with it. This requires both the interactive element and a carefully designed teaching document.

## The Lock Mechanism Pattern

When three variables are constrained by one equation, you have **two degrees of freedom**:
- Lock one variable → adjust another → third changes automatically
- This mirrors real experimental practice: "holding temperature constant while varying pressure"

The lock buttons work as radio buttons (only one locked at a time), making the constraint explicit in the interface.

## Related Concepts

- [[Logarithmic Interface Scaling]] — Why the sliders use log scale
- [[FOUR PILLARS]] — Tools pillar: interface design for learning
- [[Modes of Collaboration]] — Interactive exploration mode
- [[Piano String Inharmonicity]] — Another application of inverse relationships

## Artifacts

Interactive Ohm's Law explorer with lock mechanism: `Ohm's Law/ohms_law_intuition.jsx`

---

*"The numerator and denominator have opposite characters — one gives, the other takes away. Learning to feel this opposition is learning to see through equations."*
