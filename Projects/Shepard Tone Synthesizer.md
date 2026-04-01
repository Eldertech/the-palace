---
title: "Shepard Tone Synthesizer"
type: project
pillars: [creation, tools, philosophy]
born: 2026-02
last_activated: 2026-03
activation_count: 12
stage: sprout
confidence: working
energy: high
hook_quality: 8
beauty: 9
who_leads: loudon
links:
  - target: "[[Portamento and Physical Pitch Modeling]]"
    type: deepens
  - target: "[[Frequency-Time Duality]]"
    type: connects-to
  - target: "[[Hyperdimensional Prism]]"
    type: mirrors
  - target: "[[Granular Synthesis]]"
    type: connects-to
  - target: "[[Octave Equivalence]]"
    type: enables
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
  - target: "[[Particle Synthesis]]"
    type: connects-to
  - target: "[[Piano String Inharmonicity]]"
    type: connects-to
  - target: "[[Signal-Rate CV Architecture]]"
    type: connects-to
---

# Shepard Tone Synthesizer

A synthesizer that creates the illusion of infinite pitch ascent (or descent) within a finite frequency range. Play higher forever, yet always perceive yourself within a 2-octave window. The circling staircase of pitch.

## How Shepard Tones Work

The Shepard tone is a psychoacoustic illusion, first described by Roger Shepard in 1964. The mechanism is elegantly simple:

1. **Octave stacking**: A single pitch class (e.g., C) is played simultaneously across multiple octaves (C1, C2, C3, C4, C5, etc.).
2. **Amplitude envelope**: As the pitch class rises, the amplitude of each octave is modulated by a smooth, continuous function in *log-frequency space*.
3. **The illusion**: As you play higher pitches, upper octaves fade out while lower octaves fade in, maintaining a constant perceived "range" of about 2 octaves. The listener hears infinite ascent, but the actual frequencies cycle.

**Example**: You play C, then C#, then D. As you do:
- C1, C2, C3, C4, C5 (octave stack) are all sounding
- A bandpass filter (or amplitude envelope) is centered in the middle of the audible spectrum—say, around middle C (C4)
- C2 and C3 are in the sweet spot of the filter—audible and prominent
- C5 and C6 are fading out as you ascend
- C1 is almost inaudible

When you reach a higher octave (say, you've transposed up by an octave within the pitch class), the *perception* is that you jumped up an octave—but you haven't left the 2-octave window. It's circular. Keep ascending forever; arrive nowhere.

## The Synthesizer Architecture

This is Loudon's design, optimized for Max/MSP and DAW workflows:

```
Monophonic Pitch Control (with portamento)
  ↓
Octave Voice Stack (all 128 MIDI octaves, or a subset)
  ↓
Per-Voice Synthesis
  - Individual oscillator per voice
  - Per-voice filter (key-tracked to that voice's octave)
  - Per-voice envelope (optional, for articulation)
  ↓
Sum all voices → summed audio
  ↓
Global Shepard Filter (fixed frequency, NOT key-tracked)
  ↓
Output
```

**Key insight**: The architecture separates *timbre control* (per-voice filters, key-tracked) from *illusion creation* (global Shepard filter, fixed frequency).

### Monophonic Control

At the top: a single note at a time, with **portamento** (pitch glide). This is traditional monophonic behavior—the performer plays one pitch, the synth glides smoothly to the next.

### Octave Voice Stack

The monophonic pitch is immediately duplicated across all octaves. In Ableton, this is easy: a MIDI Effect Rack with Pitch devices that transpose the incoming note by +12, +24, -12, -24, etc. A single incoming C4 becomes C1, C2, C3, C4, C5, C6, etc.

In Max/MSP or Max for Live, you can:
- Perform the octave stacking in the MIDI layer (before synthesis)
- Perform it in the synthesis layer itself (compute all octaves from a single oscillator)
- Use a combination: MIDI preprocessor + synth

**Why before synthesis?** Because all octaves of a *single pitch* need to be in sync. Portamento applies to all octaves as a unit. This keeps the illusion coherent.

### Per-Voice Filtering

Each voice (each octave) has its own **bandpass filter**. The filter's cutoff frequency is **key-tracked relative to that voice's octave**. For example:
- Voice at C2: filter cutoff 1000 Hz above C2's fundamental
- Voice at C4: filter cutoff 1000 Hz above C4's fundamental
- Voice at C6: filter cutoff 1000 Hz above C6's fundamental

This creates **timbre variation across the octave stack**. Lower octaves sound duller (filter is lower in absolute frequency). Higher octaves sound brighter. The harmonic content is consistent *relative to each octave*, even as the absolute frequencies diverge.

This is the "per-note" timbre control Loudon described—shaping the harmonic signature of each oscillator independently.

### Global Shepard Filter

After summing all the voices, a **fixed-frequency bandpass filter** creates the Shepard tone effect. This filter is *not* key-tracked. It sits at a constant frequency (e.g., centered at 1000 Hz with a 2-octave bandwidth).

As you play ascending pitch classes, the octaves that pass through this filter change. The perception: infinite ascent within a static frequency window.

**The filter parameters matter**:
- **Center frequency**: Where in the spectrum you want the "bright zone" of the Shepard tone
- **Bandwidth (Q)**: A 2-octave window is typical (about 1.4 × center frequency)
- **Envelope shape**: Smooth (Gaussian or raised-cosine) to avoid discontinuities as voices cross the filter boundary

## Portamento in a Polyphonic Shepard

This is a subtle but important design question. The synth has *multiple oscillators* (all octaves), yet the *control* is monophonic (one pitch at a time). How does portamento interact with this?

**The challenge**: Traditional portamento is voice-by-voice. In a polyphonic synth, each voice glides independently, creating overlapping glides. In the Shepard context, if each octave glides separately, the octave stack becomes asynchronous—some voices are ahead, some behind. The illusion breaks.

**The solution**: Implement **monophonic-style portamento even though there are multiple voices**. This means:
- Only one "fundamental" pitch at a time (enforced by the MIDI layer)
- All octaves glide *together as a unit* to the next fundamental pitch
- New notes retrigger the glide

In Ableton: Use a single MIDI note with Portamento enabled. The octave stacking happens downstream, so all copies glide together.

In Max/MSP: Use a `glissando` or portamento algorithm that moves a single `pitch` value smoothly. Pass this pitch through the octave stacker, which generates all octaves. All octaves inherit the glide.

**Practical effect**: When you play C4 then D4 with a 500ms glide, the entire C4 octave stack glides smoothly to the D4 octave stack over 500ms. Perceptually, it feels like a single, rich, gliding voice across multiple octaves.

## Pedagogical Value

This design teaches three foundational synthesis concepts simultaneously:

1. **Note priority and control**: How to manage multiple voices from a single monophonic input
2. **Pitch interpolation (glide/portamento)**: How smooth motion between pitches feels and behaves polyphonically
3. **Voice management and timbre**: Per-voice filtering and how each voice contributes to the global sound

It also reinforces an important psychoacoustic insight: the Shepard tone proves that human perception of pitch isn't absolute, but *relative*. Context and frequency content matter as much as fundamental frequency.

## Design Challenges

1. **Filter tuning**: The global Shepard filter must be "just right." Too narrow and you hear discrete octave jumps. Too wide and the illusion dissolves into a muddy unison.

2. **Discontinuities at octave boundaries**: When a voice crosses the Shepard filter boundary (fading in or out), there can be audible artifacts if the crossfade isn't smooth. The amplitude envelope must be continuous in log-frequency space.

3. **Per-voice filter tracking**: How should the per-voice filters behave at extreme octaves? At very low octaves, a key-tracked filter might go subsonic. At very high octaves, it might be above audible range. Should there be limits or saturation?

4. **Portamento timing across octaves**: With a large octave stack (C1 through C8), do all octaves arrive at the target pitch simultaneously, or does the glide duration feel slightly different for lower vs. higher voices? Testing required.

5. **CPU efficiency**: Synthesizing all 128 MIDI octaves is expensive. In practice, you might limit to 6–8 octaves around the "bright zone" of the Shepard filter, then compute fewer octaves farther away (since they're nearly inaudible anyway).

## Open Questions

1. **What are the best amplitude functions for the global Shepard filter?** Gaussian, raised-cosine, triangular—each has different sonic characteristics. Experimentation needed.

2. **Should the per-voice filters be adjustable by the performer?** Currently, they're fixed (relative to each voice's octave). Could the performer modulate cutoff or resonance globally?

3. **Can the octave stack be compressed dynamically?** Instead of always computing C1–C8, could the synth expand or contract the octave range based on the performed fundamental? This might improve CPU efficiency and allow more artistic control.

4. **Interaction with effects**: How does the Shepard synth behave with reverb, delay, or other effects downstream? The illusion might become ambiguous if delayed copies are too prominent.

5. **Microtuning**: The Shepard effect relies on octave equivalence, which is assumed in equal temperament. What happens in other tuning systems? Could this be extended to other interval cycles (fifths, thirds)?

## Relationship to Hyperdimensional Prism

The Shepard tone is, in a sense, a **closed manifold**. It's a circuit: ascend forever and arrive back where you started. Like a prism that reflects light in on itself, the Shepard synth creates infinite motion through a finite perceptual space. The pitch dimension loops back on itself; paradox becomes texture.
