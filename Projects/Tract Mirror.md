---
title: Tract Mirror
type: project
pillars:
  - creation
  - tools
  - philosophy
born: 2026-06
stage: seed
status: active
summary: "A monophonic LPC voice-synthesizer VST whose 3D interface renders the Kelly-Lochbaum cylindrical tube segments that ARE the lattice filter — the LPC/waveguide mirror made playable inside a DAW."
forward_vector: "I want to be the first palace instrument that leaves the browser and stands inside Ableton — a vocal tract you can see, where every cylinder on screen is a scattering junction you can hear, proving the mirrors link between LPC and waveguide synthesis as a playable fact rather than a prose claim. I want to sing vowels before I learn to speak, and then to learn to speak by listening (the v2 analysis engine)."
links:
  - target: "[[Linear Predictive Coding]]"
    type: emerged-from
    label: mirror-made-playable
  - target: "[[Waveguide Synthesizer]]"
    type: mirrors
    label: the-tube-to-its-string
  - target: "[[Three.js]]"
    type: couples-with
    label: renders-interface
  - target: "[[Boundary-Crossing Instruments]]"
    type: connects-to
    label: source-filter-as-one-machine
  - target: "[[Tract Mirror — build plan — JUCE VST]]"
    type: connects-to
---

# Tract Mirror

![[Tract Mirror — hero.png]]

A **monophonic LPC voice synthesizer** shipped as a VST3/AU plugin (JUCE 8), whose interface is a **3D rendering of the cylindrical waveguide segments** of a Kelly-Lochbaum vocal tract. The thesis is the `mirrors` link from [[Linear Predictive Coding]] to [[Waveguide Synthesizer]], executed: the LPC lattice filter's reflection coefficients *are* the impedance mismatches between successive tube segments. The tubes on screen are not a visualization of the filter — they **are** the filter, drawn in space. Morphing a vowel reshapes the tract; reshaping the tract recomputes the scattering junctions; nothing is decoration.

Where the [[Waveguide Synthesizer]] renders the string body of this mathematics in the browser, Tract Mirror renders the tube body — and steps out of the browser into Ableton Live, the palace's first native plugin.

## Architecture (decided 2026-06-09)

- **JUCE 8 + WebView GUI** — C++ DSP core; the GUI is a WKWebView running three.js, so every interim mockup artifact is a step toward the real interface.
- **Vowel morph tables (v1)** — area functions for /a e i o u ə/ fitted by optimizer to Peterson–Barney formant targets, morphed via XY pad; glottal pulse + aspiration noise excitation. A record-and-analyze engine (sing into it, replay your own tract shapes) is the v2 vector.
- **Verified in Ableton Live 12**, VST3 + AU.
- The 64-point **area function is the single source of truth** (`vowels.json`): the Python reference, the web artifacts, and the C++ engine all derive their reflection coefficients from the same physical tube shapes.

Build state, phase log, and all artifacts live in the bundle: [[Tract Mirror — build plan — JUCE VST]].
