---
title: "Logarithmic Scaling in Interface Design"
born: 2026-03-24
links:
  - target: "[[Logarithmic Interface Scaling]]"
    type: connects-to
    label: child-of
forward_vector: "I am the design guide for [[Logarithmic Interface Scaling]] — when and why to scale a control logarithmically, with the perceptual reasoning worked through. I stay the place a builder reaches for the rationale, not just the formula."
---

# Logarithmic Scaling in Interface Design

## The Problem You Discovered

When values span multiple orders of magnitude (like 0.5 to 20), a **linear slider** creates an asymmetric, frustrating experience:

**Linear scale 0.5 to 20:**
- Below 1: Takes only 2.6% of the slider (0.5 units out of 19.5 total)
- Above 1: Takes 97.4% of the slider (19 units out of 19.5 total)

This feels wrong because **multiplication and division are not symmetric operations in linear space**:
- Doubling: 1 → 2 (move right 1 unit)
- Halving: 1 → 0.5 (move left 0.5 units)
- Different distances for conceptually equivalent operations!

---

## The Solution: Logarithmic Scale

Map slider position logarithmically so that:
- Equal slider movements = equal multiplications/divisions
- 1 naturally sits in the center
- The scale feels symmetric

### The Math

**Linear to Log mapping:**
```javascript
// Convert slider position (0-100) to value
function sliderToValue(sliderPos, min, max) {
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const logValue = logMin + (sliderPos / 100) * (logMax - logMin);
  return Math.pow(10, logValue);
}

// Convert value to slider position (0-100)
function valueToSlider(value, min, max) {
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const logValue = Math.log10(value);
  return ((logValue - logMin) / (logMax - logMin)) * 100;
}
```

**Example: Range 0.1 to 10**
- Slider at 0% → value = 0.1
- Slider at 50% → value = 1.0 (center!)
- Slider at 100% → value = 10

In log space:
- log₁₀(0.1) = -1
- log₁₀(1.0) = 0
- log₁₀(10) = +1

The distances -1 to 0 and 0 to +1 are equal, so the slider is symmetric!

---

## When to Use Logarithmic Scales

### Use log scale when:

1. **Values span multiple orders of magnitude**
   - Volume: 0.001 to 1.0
   - Frequency: 20 Hz to 20,000 Hz
   - Zoom: 10% to 1000%

2. **Multiplication/division are the natural operations**
   - "Double the volume"
   - "Half the speed"
   - "10× zoom"

3. **You want symmetric behavior around a center value**
   - Brightness: 0.1× to 10×
   - Pitch shift: -2 octaves to +2 octaves
   - Gain: -20 dB to +20 dB

### Use linear scale when:

1. **Values span a small range**
   - Temperature: 20°C to 30°C
   - Opacity: 0% to 100%
   - Position: 0 to 500 pixels

2. **Addition/subtraction are the natural operations**
   - "Add 5 degrees"
   - "Move 10 pixels"

---

## Cross-Field Examples

This isn't just theory - it's how professionals design interfaces across many fields:

### 🎵 Audio (Decibels)
```
-∞ dB ←→ -40 dB ←→ -20 dB ←→ 0 dB ←→ +6 dB
Equal dB steps = equal power multipliers
```

**DAWs (Digital Audio Workstations)**: All volume faders use dB (log scale)
- Moving from -6 dB to 0 dB doubles the power
- Moving from -12 dB to -6 dB also doubles the power
- Feels symmetric because it IS in log space

### 📷 Photography (F-stops)
```
f/1.4 ←→ f/2 ←→ f/2.8 ←→ f/4 ←→ f/5.6 ←→ f/8
Each step = half the light (or double)
```

**Camera apps**: Exposure compensation uses stops (log scale)
- +1 stop = double the light
- -1 stop = half the light

### 🔬 Chemistry (pH Scale)
```
pH 1 ←→ pH 3 ←→ pH 5 ←→ pH 7 ←→ pH 9 ←→ pH 11
Each step = 100× change in concentration
```

### 🎸 Music (Pitch)
```
A220 ←→ A440 ←→ A880 ←→ A1760
Equal intervals = doubling frequency (octaves)
```

**Music software**: Pitch bend controls use log scale
- Semitone = 2^(1/12) ratio ≈ 1.0595
- Octave = 2× frequency

### 🔍 Zoom Controls
```
10% ←→ 25% ←→ 50% ←→ 100% ←→ 200% ←→ 400%
```

**Design software (Figma, Adobe)**: Zoom uses log scale
- Each click multiplies/divides by consistent ratio
- 100% sits naturally in the center

---

## Implementation Patterns

### Pattern 1: Base-10 Logarithm (Decades)
```javascript
// For ranges spanning powers of 10
const min = 0.01;
const max = 100;
// Gives: 0.01, 0.1, 1, 10, 100
```

Good for: scientific values, general-purpose controls

### Pattern 2: Base-2 Logarithm (Octaves)
```javascript
// For ranges where doubling/halving is natural
function sliderToValue(sliderPos, centerValue, numOctaves) {
  const normalized = (sliderPos - 50) / 50; // -1 to +1
  const octaves = normalized * numOctaves;
  return centerValue * Math.pow(2, octaves);
}
```

Good for: audio, musical pitch, zoom controls

### Pattern 3: Decibels
```javascript
// For audio amplitude
function sliderToDB(sliderPos) {
  // Map 0-100 to -60 dB to +6 dB
  return (sliderPos / 100) * 66 - 60;
}

function dbToAmplitude(db) {
  return Math.pow(10, db / 20);
}
```

Good for: volume controls, gain staging

---

## Design Considerations

### Visual Indicators

**Always show scale markers** so users understand the mapping:
```
[――|――――|――――|――]
0.1    1     10
```

Not just endpoints:
```
[――――――――――――――]
0.1           10
```

### Labeling

Be explicit about the scale:
- "Volume (dB)" ← Good
- "Volume" ← Ambiguous
- "Zoom (log scale)" ← Very clear

### Handle Edge Cases

**Problem**: Log scale can't represent zero or negative values

**Solutions**:
1. Use a minimum threshold (0.001 instead of 0)
2. Add "Off" position at extreme left
3. Switch to linear near zero:
   ```javascript
   if (value < threshold) {
     // Linear ramp to zero
   } else {
     // Logarithmic
   }
   ```

---

## Alternative Approaches

### 1. Piecewise Linear
Split the range into segments with different linear scales:
```
[0-1: fine control] | [1-10: coarse control]
```
Simpler but not as elegant.

### 2. Square/Square Root
```javascript
value = min + (sliderPos² / 10000) * (max - min);
```
Provides non-linear mapping without full log behavior.

### 3. Custom Curves
```javascript
// Exponential ease
value = min + (max - min) * Math.pow(sliderPos / 100, exponent);
```
Useful for feel-based adjustments (animation easing, etc.)

---

## Testing Your Scale

**The symmetry test:**
1. Set slider to center (should be value = 1.0 or reference value)
2. Move 10% left → note the new value
3. Move 20% right from center → note the new value
4. The two values should be reciprocals (e.g., 0.5 and 2.0)

**The step test:**
1. Move slider by small increments
2. Calculate ratio of consecutive values
3. Ratios should be approximately constant

---

## Code Template

```javascript
class LogSlider {
  constructor(min, max) {
    this.logMin = Math.log10(min);
    this.logMax = Math.log10(max);
  }
  
  // Slider position (0-100) to actual value
  positionToValue(pos) {
    const t = pos / 100; // Normalize to 0-1
    const logValue = this.logMin + t * (this.logMax - this.logMin);
    return Math.pow(10, logValue);
  }
  
  // Actual value to slider position (0-100)
  valueToPosition(value) {
    const logValue = Math.log10(value);
    const t = (logValue - this.logMin) / (this.logMax - this.logMin);
    return t * 100;
  }
}

// Usage
const slider = new LogSlider(0.1, 10);
const value = slider.positionToValue(50); // Returns 1.0
const pos = slider.valueToPosition(2.0);   // Returns ~65.05
```

---

## Summary

**Use logarithmic scales when:**
- Range spans 2+ orders of magnitude
- Operations are multiplicative (×, ÷)
- You want symmetric feel around a center point

**Implementation:**
- Map slider linearly in log-space
- Show scale markers (0.1, 1, 10)
- Test for symmetry
- Label clearly

**Real-world precedent:**
- Audio: dB scales
- Photo: f-stops
- Chemistry: pH
- Music: octaves
- Design: zoom controls

This is a fundamental pattern that appears everywhere in professional software!
