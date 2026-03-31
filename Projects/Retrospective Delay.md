---
title: "Retrospective Delay"
type: project
pillars: [creation, tools]
born: 2026-01
last_activated: 2026-03
activation_count: 8
stage: growing
confidence: demonstrated
energy: high
hook_quality: 9
beauty: 8
who_leads: loudon
links:
  - target: "[[Semantic Delay]]"
    type: connects-to
  - target: "[[Trickster]]"
    type: mirrors
  - target: "[[Playful Interface Design]]"
    type: connects-to
  - target: "[[Granular Synthesis]]"
    type: connects-to
  - target: "[[JSUI]]"
    type: enables
  - target: "[[Frequency-Time Duality]]"
    type: deepens
  - target: "[[Boundary-Crossing Instruments]]"
    type: connects-to
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
---

# Retrospective Delay

A circular buffer delay that plays back entire phrases—not individual taps, but temporal ghosts of what you just performed. When you play silence, the last phrase repeats, summoning memory back into the present.

## The Core Architecture

The device operates on a **1-measure circular buffer** that is **always recording**. No arming, no gate—the buffer is the constant witness.

**The write head**: A phasor (0→1 ramped at tempo) clocks continuously through the measure, writing every incoming sample into sequential buffer positions. The phasor loops: the buffer always contains exactly the last measure of audio.

**The read head**: Trails behind the write head by a configurable lag—typically a half note (but parameterized). This lag determines how far back in time the output looks. The read head plays back the entire phrase from the past.

**The gain knob**: The only parameter exposed to the performer. This multiplies the write amplitude, controlling how loudly the *past phrase* re-enters the mix. Gain 0 = silence (the past is gone). Gain rising = the ghost emerges.

The elegance: as you play new material into the measure, it *overwrites* the oldest material in the buffer. The past phrase is played back while being gradually erased by the present.

## How It Differs From Standard Delay

Most delay plugins operate on **individual taps**—discrete read points at fixed intervals (quarter note, eighth note, etc.). Each tap is independent; multiple taps stack in the mix.

Retrospective Delay thinks in **phrases**. The output is a *monolithic block of audio*—the entire last measure, playing as one coherent unit. It's not "echo, echo, echo" (taps). It's "here's what you just did, replayed."

Standard delay with feedback creates rhythmic artifacts; this becomes muddy if you don't calibrate the decay. Retrospective Delay has built-in clarity: feedback is natural and musical because each new measure overwrites the oldest audio.

**Contrast with Semantic Delay**: If Semantic Delay delays individual *words* and substitutes conceptually adjacent meanings, Retrospective Delay delays entire *phrases* at the beat level. One operates on meaning; the other on temporal continuity.

## The Ghost Metaphor

The device is a séance. The performer is a spiritualist medium. The circular buffer is the ectoplasm—the substance through which ghosts materialize. When the gain knob rises, the performer *summons* the last phrase back from the dead.

The gain acts as a conduit. At 0, the ghost is dormant. As the knob rises, ectoplasm swirls, the ghost gains presence, becomes audible, visible (metaphorically). The performer doesn't summon *words* or *concepts*—they summon *presence*, a full-bodied echo of what they just sang or played.

This is a gift device, made for a friend who is a DJ. The séance metaphor invites play, humor, ritual. The interface should visually reinforce this: spirits emerging, crystal balls glowing, the DJ as medium.

## Interface Design Philosophy

The interface changes **dramatically** as the main knob turns. Not subtly—not a smooth color gradient. The character should *move*, *react*, *pose* in response to the knob position.

**Character concept**: A cartoonish cat or spiritualist guide that shifts its pose, energy, and expression as the gain rises. At gain 0: the character is bored, dormant, sleeping. At gain rising: the cat becomes animated, reaching, grasping, pulling something from an unseen realm. At gain peak: the character is fully engaged, surrounded by swirling ectoplasm, stars in eyes, arms outstretched in triumph.

The interface is not subtle. It is *playful*, *funny*, *dramatic*. It invites the performer to turn the knob just to watch the character move.

**Technical implementation**: Either discrete animation frames (extracted from AI video using Leonardo.ai) or JSUI drawing code that morphs the character's pose based on the knob value. Each approach has tradeoffs: frames are easier to author but require pre-generated assets; JSUI is more flexible but requires real-time drawing.

## Open Questions

1. **Feedback architecture**: How many measures should the buffer hold? One measure (as designed) creates a tight loop. Two measures give more temporal breathing room. Should this be parameterized or fixed?

2. **Fade-in/fade-out**: Does the retrospective phrase fade in smoothly, or does it enter abruptly? Smooth fades are more musical; abrupt entry is more disruptive (which might be desired for certain genres).

3. **Polyphonic behavior**: If the performer plays multiple simultaneous phrases (stacked melodies), does the device capture and replay the entire mix, or individual voices? Current design captures the mix.

4. **Cross-fade between measures**: When the buffer loops (one measure becomes the next), is there a discontinuity at the boundary, or a smooth cross-fade? A subtle cross-fade preserves continuity.

5. **Post-phrase automation**: Loudon mentioned the possibility of *automatically* applying effects to the replayed phrase—reverb, saturation, filtering—triggered by the gain knob rising. This couples the device more tightly to effects chains and invites experimentation.

6. **Max for Live vs. VST**: The device currently works in Max/MSP. Porting to Max for Live (Ableton) is straightforward. VST/AU wrapping requires separate build infrastructure. What's the target platform?

## Relationship to Granular Synthesis

The retrospective phrase can be thought of as a single *grain* at the measure timescale. Granular synthesis typically deals with sub-second grains (10ms–100ms), densely layered. This is granular in the same conceptual sense: a chunk of audio (the grain) is triggered and modulated by a parameter (the gain). The "granule" happens to be one measure long instead of milliseconds.

## Forward Vectors
- Implement variable-speed phrase playback — the temporal ghost plays back at different rates, creating pitch-shifted memory
- Connect temporal looping to [[Dub Lineage]] production philosophy explicitly in the interface
- Explore phrase-detection intelligence: can the delay learn where musical phrases begin and end?
