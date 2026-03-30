---
title: "Quadratic Interpolation in DSP"
type: concept
pillars: [tools, creation]
born: 2026-03
last_activated: 2026-03
activation_count: 2
stage: growing
confidence: demonstrated
energy: medium
hook_quality: 7
beauty: 7
who_leads: loudon
links:
  - target: "[[Compressor Design]]"
    type: spawned
  - target: "[[Portamento and Physical Pitch Modeling]]"
    type: connects-to
  - target: "[[Differential Equations]]"
    type: connects-to
  - target: "[[Latent Error]]"
    type: connects-to
  - target: "[[DSP Frameworks]]"
    type: connects-to
---

# Quadratic Interpolation in DSP

> Quadratic interpolation is about smooth transitions between states. You're fitting a parabola through three points where the middle point determines how curved the transition is.

## What It Is

Given three sample values (y₋₁, y₀, y₁), fit a parabola and read the value at any fractional position between them.

**The formula** (for a parabola passing through three points spaced one unit apart):

```
y(x) = y₋₁(x² - x) / 2 - y₀(x² - 1) + y₁(x² + x) / 2
```

where x ranges from 0 to 1 (0 = the y₀ point, 1 = the y₁ point).

**Why use it?**

- **Linear interpolation** assumes straight lines between samples. Coarse, audible stepping.
- **Quadratic interpolation** fits a smooth parabola. Much smoother for audio.
- **Cubic (Hermite spline)** uses four points and two derivative constraints. Even smoother. Overkill for most audio.

The key property: **Quadratic has changing slope but continuous first derivative.** The slope changes (curvature exists) but the curve never has a sharp corner. It *feels* smooth.

## Three Audio Applications

### 1. Soft Knee Compressor

The soft knee is the region between "no compression" and "full compression." Instead of a sharp corner, you want a smooth transition.

**The setup:**
- Point A: input below threshold (no compression)
- Point B: at threshold (transition midpoint)
- Point C: above threshold (full compression ratio)

**The formula:** Within the knee region, the compressor gain follows a quadratic curve:

```
gain = input + (1/R - 1) × (input - threshold + width/2)² / (2 × width)
```

This is *literally* quadratic interpolation from "no change to input" to "full compression ratio applied."

**Why it matters:** A linear knee sounds like a switch flipping. A quadratic knee sounds smooth, organic, natural. The transition is inaudible.

**Loudon's implementation:**
> "We worked together on a soft knee compressor and I was able to implement this, but I didn't have a strong intuitive sense of how the quadratic interpolation functions."

The knee *is* the interpolation. The width parameter controls how much of the input range gets smoothed.

### 2. Wavetable Synthesis

When reading from a wavetable, you rarely land exactly on a sample. You need to interpolate.

**Options:**
- **No interpolation:** Just read the nearest sample. Aliasing artifacts, harsh.
- **Linear interpolation:** Blend between two adjacent samples. Smooth but still coarse.
- **Quadratic interpolation:** Fit a parabola through three samples. Much closer to the original waveform.
- **Cubic (Hermite):** Use four samples. Even closer. But more CPU.

**The manifesto:** Quadratic is the sweet spot for wavetable synthesis. You get smooth waveforms without the cost of cubic. Especially important when oscillators are modulated (the read position changes, so you're always interpolating).

### 3. Pitch Detection via Parabolic Interpolation on FFT Peaks

An FFT gives you frequency content binned into discrete frequency buckets. If a peak doesn't land exactly on a bin, the true frequency is somewhere between bins.

**Standard approach:** The peak frequency is wherever the magnitude is highest. But this is quantized to bin resolution.

**Parabolic refinement:** Fit a parabola through three adjacent bins (centered on the peak bin) and find the true peak between bins.

```
True peak frequency ≈ bin_frequency + (bin_resolution / 2) ×
                       (magnitude[bin-1] - magnitude[bin+1]) /
                       (2×magnitude[bin] - magnitude[bin-1] - magnitude[bin+1])
```

**Result:** Sub-bin frequency resolution. You can detect vibrato, microtonal pitch, or slight tuning errors with much higher precision.

## Bézier Curves: The Generalization

Quadratic interpolation is a special case of Bézier curves.

**The hierarchy:**
- **Linear Bézier** (2 control points) = Linear interpolation
- **Quadratic Bézier** (3 control points) = Quadratic interpolation
- **Cubic Bézier** (4 control points) = What designers use in graphics software
- **Higher order** = Rarely needed in audio

**Quadratic Bézier formula:**
```
B(t) = (1-t)² × P₀ + 2(1-t)t × P₁ + t² × P₂
```

where:
- P₀ = start point
- P₁ = control point (determines curve shape; doesn't have to be *on* the curve)
- P₂ = end point
- t = parameter from 0 to 1

**The magic of the control point:** P₁ isn't necessarily on the curve. Instead, it "pulls" the curve toward itself, controlling the curvature. Move P₁ up and the curve bows upward. Move it down and it bows downward.

In the soft knee compressor:
- P₀ = start of knee (below threshold)
- P₁ = control point (determines how much the curve bulges)
- P₂ = end of knee (full compression ratio)

Increasing the width of the knee = moving P₁ farther from the straight-line path from P₀ to P₂.

## The Organic Imprecision Argument

From Loudon's conversation:

> "I feel like the overshoot and settle that happens with PID is organic and natural, feels like a consciousness observing and reacting. All the other methods have a precision that I don't find in real places."

This is a profound observation.

**Quadratic interpolation** is perfectly smooth. No ripple, no overshoot, no settling time.

**PID control** (a different smoothing method, based on differential equations) can overshoot, ring, and settle. It mimics a system *reacting* to error, finding equilibrium.

**Which is more musical?**

Loudon suggests: sometimes the PID's organic ringing is more alive than the mathematically-perfect quadratic curve. The overshoot feels like the system is *thinking*.

This connects to [[Latent Error]]: is using the "wrong" interpolation method a latent design error, or is it a creative choice that adds character?

**Tension:** As digital audio practitioners, we're taught that precision = quality. But in acoustic systems, imprecision (thermal noise, mechanical compliance, damping) is everywhere. Maybe more imprecision feels *right* because it's closer to how physical systems sound.

## Related Concepts

**[[Portamento and Physical Pitch Modeling]]** — Pitch movement during a glide is a choice of interpolation function. Linear, exponential, or quadratic? Each sounds different and maps onto different physical models.

**[[Differential Equations]]** — Smooth interpolation functions are solutions to differential equations. A quadratic ramp is approximating an exponential approach. A critically damped oscillator is approximating a quadratic approach to equilibrium.

**[[Compressor Design]]** — The soft knee is the primary application in this palace. But the thinking extends: all smooth transitions in audio design benefit from thinking about interpolation.

## Open Questions

1. **Cubic vs. quadratic in oscillators:** Most oscillator implementations use cubic (Hermite spline) for wavetable lookup. Is the extra cost justified for audio, or is quadratic sufficient?

2. **Real-time Bézier curves:** Can you compute Bézier curves in real-time for control signals that have moving targets? (Yes, but what's the cost?)

3. **Interpolation and aliasing:** Quadratic interpolation *reduces* aliasing compared to linear, but can it introduce new artifacts? How does it interact with band-limited synthesis?

4. **The philosophy of smoothness:** What makes a transition sound "smooth" to the human ear? Is it the lack of discontinuity in the first derivative (continuity of slope)? The second derivative? Or something about the shape that mimics natural resonant decay?

5. **Emulation vs. inspiration:** When emulating analog synthesizers in software, should we use the mathematically correct curve (quadratic for an RC filter), or the actual curve the analog circuit produces (might have nonlinearities)? When does approximation become falsification?

