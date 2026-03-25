---
title: Logarithmic Interface Scaling
type: concept
pillars:
  - tools
  - philosophy
born: 2026-03
stage: growing
links:
  - target: "[[FOUR PILLARS]]"
    type: connects-to
  - target: "[[Boundary-Crossing Instruments]]"
    type: mirrors
  - target: "[[Ohm's Law]]"
    type: enables
  - target: "[[Piano String Inharmonicity]]"
    type: enables
---

# Logarithmic Interface Scaling

A fundamental interface design pattern for controls (sliders, faders, knobs) that manipulate values spanning multiple orders of magnitude. The pattern makes multiplication and division feel symmetric by mapping the control position logarithmically, so equal physical movements represent equal ratios rather than equal additions.

## The Interface Design Problem

When designing a slider to control values from 0.1 to 10 (or 0.5 to 20), a linear mapping creates an asymmetric, frustrating experience:

**Linear slider mapping (0.5 to 20):**
- Below 1: cramped into 2.6% of slider space
- Above 1: sprawled across 97.4% of slider space
- Doubling (1 → 2) and halving (1 → 0.5) require different physical distances
- Fine control is impossible at the low end; excessive at the high end

Users feel this asymmetry immediately. The control fights against the natural operations (multiply by 2, divide by 2) and makes the reference value (typically 1.0) sit awkwardly off-center.

## The Logarithmic Mapping Solution

Map control position logarithmically so that:
- Equal physical movements = equal multiplications/divisions
- The reference value (1.0) naturally sits at the center
- The control feels symmetric and balanced
- Precision is distributed evenly across the range in ratio terms

### Implementation: Position to Value

```python
import math

def slider_to_value(position, min_val, max_val):
    """Convert slider position (0-100) to actual value using log mapping"""
    # Work in log space
    log_min = math.log10(min_val)
    log_max = math.log10(max_val)
    
    # Interpolate position in log space
    t = position / 100.0
    log_value = log_min + t * (log_max - log_min)
    
    # Convert back to linear space
    return 10 ** log_value
```

### Implementation: Value to Position

```python
def value_to_slider(value, min_val, max_val):
    """Convert actual value to slider position (0-100) using log mapping"""
    # Convert value to log space
    log_min = math.log10(min_val)
    log_max = math.log10(max_val)
    log_value = math.log10(value)
    
    # Find normalized position in log space
    t = (log_value - log_min) / (log_max - log_min)
    
    # Map to 0-100 slider range
    return t * 100.0
```

**Example with range 0.1 to 10:**
- Slider at 0% → Value 0.1
- Slider at 50% → Value 1.0 (center!)
- Slider at 100% → Value 10

The key: in log space, distances are equal (log₁₀(0.1) = -1, log₁₀(1.0) = 0, log₁₀(10) = +1), making the slider symmetric.

## When to Use This Pattern

### Use logarithmic interface scaling when:

1. **Control range spans 2+ orders of magnitude**
   - Volume: 0.001 to 1.0
   - Frequency: 20 Hz to 20,000 Hz  
   - Zoom: 10% to 1000%

2. **User operations are multiplicative**
   - "Double the volume"
   - "Half the speed"
   - "10× zoom"

3. **Symmetric feel around a reference value is desired**
   - Brightness: 0.1× to 10× (reference = 1.0)
   - Pitch shift: -2 octaves to +2 octaves (reference = 0)
   - Gain: -20 dB to +20 dB (reference = 0 dB)

### Use linear interface scaling when:

1. **Control range is small (less than 2× range)**
   - Temperature: 20°C to 30°C
   - Opacity: 0% to 100%
   - Position: 0 to 500 pixels

2. **User operations are additive**
   - "Add 5 degrees"
   - "Move 10 pixels to the right"

## Professional Interface Examples

This pattern appears in controls across every technical domain:

### Audio Engineering: Volume Faders (dB)
Every DAW volume fader uses logarithmic mapping to decibels. Moving the fader equal distances always changes power by the same ratio:
- -12 dB to -6 dB: doubles power
- -6 dB to 0 dB: doubles power again

### Photography: Exposure Controls (F-stops)
Camera exposure compensation wheels use logarithmic stops:
- Each click = same light ratio (2× or 0.5×)
- +1 stop = double the light
- -1 stop = half the light

### Chemistry: pH Meters
pH scale interfaces (though often just numeric entry) map logarithmically:
- Each unit = 10× change in hydrogen ion concentration
- Equal movements = equal ratio changes

### Music Software: Pitch Controls (Octaves/Semitones)
Pitch bend wheels and transpose controls use log mapping:
- Equal physical movement = equal frequency ratios
- 12 semitones = octave = 2× frequency

### Design Software: Zoom Controls
Zoom sliders in Figma, Photoshop, etc. use logarithmic scaling:
- Each click or slider movement = consistent zoom ratio
- 100% naturally sits in the middle
- 10% to 1000% range feels balanced

## Interface Design Best Practices

### Visual Indicators Are Essential

Always show scale markers so users understand the mapping:

```
Good:
[――|――――|――――|――]
0.1    1     10

Bad (ambiguous):
[――――――――――――――]
0.1           10
```

Users need to see where key values (especially the reference point) live on the control.

### Label Clearly

Make the scale explicit in the label:
- "Volume (dB)" — Clear
- "Zoom (log scale)" — Very clear
- "Volume" — Ambiguous

### Edge Case: Zero and Negative Values

**Problem:** Logarithms cannot represent zero or negative values.

**Interface solutions:**
1. **Threshold approach:** Use minimum value like 0.001 instead of true zero
2. **"Off" position:** Discrete position at extreme left represents zero/off
3. **Piecewise mapping:** Linear ramp near zero, logarithmic elsewhere
4. **Bidirectional log:** For controls centered at zero (like pan, pitch shift), use symmetric log mapping above and below zero

### Testing Your Control Implementation

**The symmetry test:**
1. Set control to center (should output reference value, typically 1.0)
2. Move control 10% left → record value A
3. Move control 20% right from center → record value B
4. A and B should be reciprocals (e.g., A = 0.79, B = 1.26 where 0.79 × 1.26 ≈ 1.0)

**The constant ratio test:**
1. Move control by small equal increments
2. Calculate ratio of consecutive output values
3. Ratios should be approximately constant

## Forward Vector: Inverse Relationships

**Important insight:** Inverse relationships are linear in log-space.

When a parameter follows an inverse relationship like **B ∝ 1/T** (such as inharmonicity coefficient inversely proportional to string tension), logarithmic interface scaling is the natural choice:

```
B = k/T
log(B) = log(k) - log(T)
```

On a log-log plot, this becomes a straight line with slope -1. For interface design, this means:
- Controls for inverse relationships feel natural with log scaling
- String bending controls (changing tension)
- Frequency = 1/Period relationships
- Resistance = 1/Conductance mappings

Examples: [[Piano String Inharmonicity]] (B ∝ 1/T), filter frequency controls, delay time vs tempo sync.

## Related Concepts

- [[Ohm's Law]] — Interactive demo using this pattern
- [[Piano String Inharmonicity]] — Application to string physics controls
- [[Boundary-Crossing Instruments]] — Same pattern across domains
- [[FOUR PILLARS]] — Tools pillar: universal interface design principle

## Artifacts

- Python implementation with pseudocode: `/Artifacts/Logarithmic Interface Scaling/log_slider_python_pseudocode.md`
- Comprehensive design guide: `/Artifacts/Logarithmic Interface Scaling/logarithmic_scaling_guide.md`

---

*"Equal movements, equal multipliers. This is the shape of control. The interface disappears when the mapping matches the operation."*
