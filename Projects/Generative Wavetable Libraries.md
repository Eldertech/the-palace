---
title: "Generative Wavetable Libraries"
type: project
pillars: [creation, tools, philosophy]
status: active
born: 2026-05
last_activated: 2026-05
stage: growing
confidence: working
energy: medium
links:
  - target: "[[Generative Sample Libraries]]"
    type: emerged-from
    label: migrated-from
  - target: "[[Generative Sample Libraries]]"
    type: couples-with
    label: parallel-deployment
  - target: "[[Wavetable Synthesis -- Research & Higher-Dimensional Design]]"
    type: mirrors
    label: wavetable-space
  - target: "[[Inharmonic Wavetable Synthesis]]"
    type: connects-to
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: connects-to
    label: 2d-form
  - target: "[[Crystal Synthesizer]]"
    type: connects-to
    label: phonon-source
  - target: "[[Shepard Tone Synthesizer]]"
    type: deepens
    label: timbral-source
  - target: "[[Generative Audio Devices]]"
    type: couples-with
  - target: "[[Floquet Theory]]"
    type: connects-to
    label: time-periodic-modulation
forward_vector: "I will become a chat-driven generator of wavetables — Claude conducts the interview, sources partial structures from anywhere (palace synthesis, AI sub-agents, captured audio), and renders deployable wavetables in Serum/CLM, Ableton, Surge XT, and single-cycle formats."
---

# Generative Wavetable Libraries

A chat-driven pipeline for producing custom wavetables and single-cycle waveforms, deployable across the major wavetable synth ecosystems. Sister project to [[Generative Sample Libraries]] — same backbone (palace synthesis becomes deployable artifact, conversational interview, source-agnostic intake), different format family, different tooling, different musical use.

This entry was born 2026-05-02 by migration: the wavetable material previously housed inside [[Generative Sample Libraries]] split off into its own home when GSL refocused on multisampled instruments only. The two projects share philosophical backbone but diverge enough in format work, mathematics of frame generation, and use case that one entry was conflating them.

---

## Industry Standards Brief — Wavetable Formats

Wavetable synthesis stores one full cycle of a waveform at each table "frame" — the synth sweeps through frames to create motion. The key parameters across all formats are frame size (samples per cycle) and frame count (number of positions in the table).

### Serum/CLM Format — The Universal Wavetable Standard

The de facto standard. A WAV file with a custom `clm ` chunk that identifies it as a wavetable and specifies the frame size. The CLM chunk is a 4-byte identifier + 4-byte size + ASCII metadata string containing:

```
<!-" + cycle_size + " " + interp_mode + " " + vendor + " -">
```

**Specifications:**
- 2048 samples per frame (fixed for Serum compatibility)
- Up to 256 frames per wavetable
- A full 256-frame table: 524,288 samples
- 32-bit float recommended for quality
- The CLM chunk is written after the `fmt ` and `data` chunks in standard WAV RIFF structure

**Reads CLM format:** Serum, Vital, Surge XT, Phase Plant, Arturia Pigments, UVI Falcon, and most modern wavetable synths.

**Verdict:** Primary wavetable target. The CLM chunk is about 30 bytes of binary metadata prepended to a standard WAV — entirely generatable from Python using `struct`.

---

### Ableton Wavetable Synth — Simple WAV

Ableton's Wavetable synth accepts user wavetables dragged into the oscillator visualization area.

**Specifications:**
- Mono WAV, 16-bit
- 1024 samples per frame
- Reads up to 256 frames (first few seconds of audio)
- No metadata chunk required — frame boundaries are implicit

**Verdict:** The easiest format to generate: a plain WAV with 1024-sample cycles concatenated. No special encoding. Secondary target for any wavetable we generate.

---

### Surge XT .wt — Open Binary Format

A lightweight binary format used by Surge XT. Frame size must be a power of 2 (64, 128, 256, 512, 1024, 2048). Documented in the Surge GitHub repository (`surgedata/wavetables/wt fileformat.txt`).

**Verdict:** Worth supporting eventually, particularly given the palace's existing RNBO/Surge XT workflow. Low priority for now since Surge XT also reads CLM WAV files.

---

### Single-Cycle Waveforms

At the simplest end: a single WAV file containing exactly one cycle of a waveform. Used in many hardware instruments (Korg wavestate, modwave, Ensoniq-style hardware), Eurorack oscillators, and as source material for building full wavetables. Synthesized [[Crystal Synthesizer]] modes produce ideal source material for this.

---

## Capability Assessment

### What I Can Generate Now

- **Frame synthesis from any cycle-generating function**: Python `numpy` produces any cycle of any complexity
- **Ableton Wavetable**: simplest case, plain concatenated WAV
- **Single-cycle WAV**: trivial
- **Frame interpolation between source partial structures**: straightforward array math

### What Requires Development

- **CLM chunk binary packing**: documented but requires careful binary `struct` writing. First implementation needs verification against a known-good Serum wavetable.
- **Surge XT .wt binary format**: documented in the Surge repo; needs implementation.
- **Phase coherence across frames**: sweeping a wavetable produces audible artifacts if frame phases are not aligned. Needs handling for arbitrary source cycles.

---

## Development Plan

### Phase 1 — Crystal Bravais Wavetable

**Goal:** Migrated from the original GSL plan. Build a wavetable that traverses the seven Bravais crystal lattice systems — cubic to triclinic — as a single sweepable parameter.

**The deep insight made audible:** Sweeping a wavetable position becomes a traversal through crystallographic symmetry space. This is the phonon dispersion parameter space made performable with a single knob.

**What we build:**
- Frame generator: for each crystal lattice direction (the 7 Bravais systems), synthesize one full cycle of the combined phonon partial spectrum
- Frame interpolation: between crystal directions, interpolate smoothly to create a 64- or 256-frame wavetable that travels through crystal space
- CLM chunk writer: Python `struct` packing to produce valid Serum-format WAV
- Ableton fallback: same frames written as plain 1024-sample WAV (no CLM chunk)

**Output:** `crystal_bravais.wav` (Serum/Vital/Surge XT) and `crystal_bravais_ableton.wav`. Each synth's wavetable position sweeps through all 7 lattice systems.

---

### Phase 2 — Multi-Source Wavetables

Generalize the source: any palace synthesis ([[Shepard Tone Synthesizer]] partial stacks, neural granular cycles, etc.), AI-audio sub-agent output, or user-provided cycle audio can become a wavetable through the same pipeline.

---

### Phase 3 — Format Coverage

- Serum/CLM: from Phase 1
- Ableton: from Phase 1
- Surge XT .wt: binary writer
- Single-cycle exports for hardware

---

### Phase 4 — Convergence with Sample Libraries

Eventually, an instrument is generated from a single conversation that produces both a sample library and a wavetable from the same source synthesis. At that point [[Generative Sample Libraries]] and this project functionally re-merge for at least the conversational layer.

---

## Palace Connections

- **[[Generative Sample Libraries]]** — sister project; same backbone, different format family
- **[[Wavetable Synthesis -- Research & Higher-Dimensional Design]]** — the theoretical home for wavetable-space concepts
- **[[Inharmonic Wavetable Synthesis]]** — adjacent palace research on inharmonic wavetable design
- **[[2D Torus Wavetable Synthesizer]]** — adjacent project exploring 2D wavetable forms
- **[[Crystal Synthesizer]]** — phonon partial structures as wavetable source
- **[[Shepard Tone Synthesizer]]** — Shepard partial stack as a perpetual-motion wavetable

---

## Open Questions

- Do wavetable frames synthesized from crystal partial ratios produce musically interesting motion when swept? Or does the spectral structure need additional processing (windowing, phase coherence) to read as intentional?
- What is the right phase-coherence policy across frames — per-frame zero-phase reset, or carry phase through?
- The [[2D Torus Wavetable Synthesizer]] work is active and adjacent. Does this project subsume that, parallel it, or feed it?
