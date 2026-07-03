---
title: 1D Wavetable Scanning
type: concept
pillars:
  - creation
  - tools
born: 2026-05
stage: sprout
forward_vector: "I name the patterns the first scanner build surfaced — that the morph is a 2D linear interpolation, that frame ordering carries the axis's meaning, that exploration instruments default to drone — so the next scanner Loudon builds inherits the lessons without re-paying their cost. I want to grow a 2D-scanner sibling that joins me to [[2D Torus Wavetable Synthesizer]], and I want my single-source-of-truth pattern to spread to every paired-Specialist build that comes after."
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: mirrors
    label: lower-dimensional-cousin
  - target: "[[Shop/Web Audio Worklet]]"
    type: connects-to
    label: browser-incarnation
  - target: "[[Wavetable Scanner]]"
    type: emerged-from
    label: first-artifact
  - target: "[[Waveguide Synthesizer]]"
    type: mirrors
    label: geometry-is-the-data
tags: [synthesis, dsp, wavetable]
---

# 1D Wavetable Scanning

A 1D wavetable is a sequence of single-cycle frames stacked along one axis. The **Position** parameter scans across that axis, morphing the timbre as it moves. The synthesis gesture is the *scanning*, not the *triggering* — and that single observation changes more design decisions than it has any right to.

## The morph is a 2D linear interpolation

Per output sample, the engine does:

1. Read frame A at the current fractional phase: `a = tableA[i] + fr_phase * (tableA[i+1] − tableA[i])`.
2. Read frame B at the same fractional phase: `b = tableB[i] + fr_phase * (tableB[i+1] − tableB[i])`.
3. Blend the two reads by the fractional frame index: `out = a + fr_frame * (b − a)`.

That second blend is what makes a wavetable a wavetable. Skip it — pick the nearest frame instead — and the instrument is a *switcher*, not a *scanner*. The audible difference is the difference between zipping between sounds and morphing through them. Ableton Wavetable's Position knob is the scanner; so is Serum's. The trap is that "Position picks the frame" reads as the natural implementation if you haven't thought about it; the truth is "Position picks the *blend* between adjacent frames."

The blend is also why authoring quality matters less than ordering quality (see below). The per-sample linear blend smooths over small phase mismatches at frame boundaries — that's why frames whose start/end samples aren't at zero crossings (the AKWF *bitreduced* family, for instance) still morph cleanly. The smoothing isn't free; it dulls sharp transients between very different frames. But it's enough that you almost never hear clicks during a sweep.

## Frame ordering carries the axis's meaning

A wavetable's axis is a hidden authorial decision. Three patterns:

**Authored order.** The file's literal frame order is meaningful — the maker chose it. Drone-pad libraries often work this way; the sweep is a *journey* with intentional shape. The cost: the user has to know the maker's intent for the axis to feel like anything other than "vibe knob."

**Centroid-sorted.** Frames sorted by spectral centroid, so Position becomes a brightness knob. This is the order [[pack_wavetable.py]] produces and the one most user-facing wavetable libraries should default to — the cognitive load on the user drops to zero. The cost: the maker's intent gets erased, replaced by a uniformly-readable axis.

**TSP-ordered.** Frames ordered so adjacent frames are perceptually close, minimising morph jumps. Useful when "smooth sweep" matters more than any monotonic axis meaning. The cost: the axis no longer maps to a single perceptual dimension — Position 0 and Position 1 might both sound bright, with the middle pulling through somewhere else.

The cost of the wrong order isn't usually clicks (the per-sample blend smooths those) — it's the user's *axis intuition*. If the table is authored-order and the user expects centroid, Position feels random. The pattern that emerges: an instrument that loads arbitrary tables should expose the sort state in its HUD ("Position sweeps brightness · centroid-sorted") so the user always knows whether the spatial cue is meaningful or merely file-order.

For the six AKWF test waveforms (cheeze, aguitar, birds, vgsqu, saw, bitreduced) centroid and flatness produced *identical* orderings — both ranked the same dull→bright sequence. That's not coincidence: for single-cycle waveforms, the only way to push centroid up is to pack in more high-frequency harmonic content, which also pushes flatness up. The two features are measuring overlapping things. On libraries with weirder corners — clean high sines, dense inharmonic clusters at low frequencies — they'd disagree. For ordinary timbral material one feature is enough.

## Default gate is *drone*, not *gated*

A wavetable scanner is an *exploration* instrument, not a *voice*. The natural gesture is a sustained tone you sweep through, not a triggered note. The first [[Wavetable Scanner]] build shipped key-gated-by-default — drone hidden behind a hold-a-key gesture — and the user (Loudon) opened it, hit Engage, swept Position, heard nothing. The brief was *"play a note and scan through the frames"*; for a scanner the sustained tone is the *condition* of the gesture, not its trigger.

The fix is one knob: `gateTarget = 1` in the worklet constructor, key-gated mode exposed as a Mode toggle for the (smaller) set of users who want the voice-class behaviour. The HUD calls out which mode is active so neither default surprises.

This is the opposite of the voice-class default, where silence-until-trigger is right. The distinguishing question — *is the user exploring the timbre space, or playing a melody on this voice?* — picks the default. Both are valid; conflating them is the trap. Future exploration-class instruments inherit the drone default; future voice-class ones don't.

## Single source of truth: geometry IS the data

When a 3D visualizer renders the wavetable alongside the audio, the cursor's geometry should be **the same arithmetic on the same Float32Array** the DSP uses. Not "computed from the same parameters" — literally the same `(a + fr_frame * (b − a))` math reading the same array. The audio and the picture cannot drift because they are the same numbers.

This is the [[Waveguide Synthesizer]] pattern in miniature: geometry-is-the-data, not geometry-shows-the-data. The cost of the alternative ("compute a parallel viz-side waveform from the same params") is silent drift the moment the two sides disagree about a corner case — fractional indexing at the table boundary, mask vs modulo on the phase wrap, sign of the interpolation. The cost of the shared path is one allocation discipline (send a copy to the worklet, keep the original on the main thread — see [[Shop/Web Audio Worklet]]'s 2026-05-31 transferable-vs-retain gotcha).

When both threads need the data over its lifetime, the shared-array pattern is right. When only one thread needs it, the transferable-and-neuter pattern is right. The decision is whether the visual is *of* the data or *near* it.

## Forward vector

Drives whatever the next [[Wavetable Scanner]] iteration earns:

- An explicit "Sort by centroid" toggle that surfaces the current sort state.
- A "load N WAVs and pack them in real time" path that brings the centroid-sort computation up into the browser (port [[pack_wavetable.py]]'s resampling + analysis to JS).
- A 2D-scanner sibling that joins this concept to [[2D Torus Wavetable Synthesizer]] — Position becomes (u, v), the cursor is a point on a surface, the morph is bilinear instead of linear. Most of the design pattern lifts directly; the new question is what *the axes mean* on each dimension.

## Lost branches

The temptation to make the morph a higher-order interpolation (cubic spline, sinc) was considered and discarded for the Sketch — linear blend is what every commercial wavetable synth does and it sounds right. Higher-order interpolation has aliasing-control upsides for very small frame counts, but at typical 8-256-frame tables the linear blend's audible artifact ceiling is below the table's authoring noise. Reach for cubic only when a brief names "audibly aliasing morph" as the problem.
