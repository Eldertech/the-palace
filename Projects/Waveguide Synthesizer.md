---
title: Waveguide Synthesizer
type: project
pillars:
  - creation
  - tools
  - philosophy
  - practice
born: 2026-05
stage: seed
status: active
forward_vector: "I want to become a playable browser instrument whose interface IS the physics — a string you can see vibrate, pluck, and damp, with the traveling wave on screen being the same delay-line state you hear. I want to prove that a digital waveguide rendered in 3D teaches the synthesis better than any knob panel could, and to demand the question every Loudon Live instrument eventually demands: does this earn a stage, or is it a test bed?"
links:
  - target: "[[The Shop]]"
    type: connects-to
    label: first-3d-brief
  - target: "[[Three.js]]"
    type: couples-with
    label: renders-interface
  - target: "[[Tone.js]]"
    type: connects-to
    label: web-audio-host
  - target: "[[RNBO codebox~ smith]]"
    type: connects-to
    label: native-engine-alternative
  - target: "[[DSP in Looping Dimensions]]"
    type: connects-to
    label: shares-spine
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: mirrors
    label: sibling-instrument
  - target: "[[Categorizing Inharmonicity]]"
    type: connects-to
    label: positions-in-taxonomy
  - target: "[[Boundary-Crossing Instruments]]"
    type: connects-to
    label: harmonic-inharmonic-continuum
  - target: "[[Frequency-Time Duality]]"
    type: connects-to
    label: delay-is-spectrum
  - target: "[[Particle Synthesis]]"
    type: connects-to
---

# Waveguide Synthesizer

![[Waveguide Synthesizer — hero.png]]

A physical-modeling synthesizer built on **digital waveguides** — the synthesis method that models sound as traveling waves on a medium (a string, a tube, a membrane) rather than as oscillators and filters. The instrument's web interface is a **3D rendering of the waveguide itself**: you see the wave propagate along the string, reflect at the terminations, and lose energy to damping — and what you see is not a visualization bolted onto the sound, it is the same delay-line state that produces the sound, drawn in space.

## Why This Project Exists

Most synthesizers hide their mechanism behind a panel of knobs. A waveguide instrument doesn't have to, because its core data structure is *already spatial*. A digital waveguide is a pair of delay lines carrying a left-going and a right-going wave; the sum at any point is the string's displacement there. That array of displacements is, literally, the shape of the vibrating string. So the honest interface for a waveguide is the string — render the delay-line contents as the y-positions of a 3D mesh and the viewer is watching the synthesis happen, not a decoration of it.

This is the palace's **physics-as-interface** instinct, the same one that drives [[Particle Synthesis]] (grains as particles you can see move) — but cleaner, because the waveguide's spatial state is exact, not a metaphor. It pairs naturally with [[Frequency-Time Duality]]: the delay-line length *is* the pitch, and the loop filter *is* the spectral envelope, so manipulating the visible string is manipulating the spectrum directly.

It also sits as a sibling to the [[2D Torus Wavetable Synthesizer]] — both are instruments that incarnate a DSP idea you can hold in your head geometrically. Where the torus instrument explores inharmonicity through irrational scan-rate ratios, the waveguide explores it through dispersion and termination filtering. Together they stake out two corners of the [[Categorizing Inharmonicity]] taxonomy.

## The DSP: Digital Waveguide

The foundation, in increasing order of richness:

1. **Karplus-Strong (the seed case).** A single delay line of length proportional to the period, fed back through a one-pole lowpass and a gain (`< 1`). Excite the delay with a burst of noise (the pluck); the loop filter rounds off high frequencies faster than low ones, so the tone decays from bright to dark exactly as a plucked string does. Frequency = sample_rate / delay_length; brightness and decay = the loop filter and the feedback gain. This is the whole instrument in about twenty lines, and it's the Sketch tier.

2. **The full bidirectional waveguide.** Two delay lines — right-going and left-going wave components — with reflection at each termination (a sign flip and a filter). The string displacement at position `n` is the sum of the two delay lines at `n`. This is the version whose internal state renders directly as the visible string, and it's where the 3D interface earns itself. Termination filters become the bridge and the nut; their reflection coefficients become controls you can feel.

3. **Dispersion and richer media (the reach).** An allpass filter in the loop makes high frequencies travel at a different speed than low ones — the physical origin of the stretched, inharmonic partials of stiff strings and struck bars (the same dispersion physics [[Categorizing Inharmonicity]] catalogues). Tubes, bowed excitation, and branching waveguides (a body resonator) are later extensions.

**Excitation** is its own design surface: pluck (noise burst, position-dependent), strike (impulse), bow (a nonlinear friction loop), breath (filtered noise into a tube). Excitation *position* along the string is a control the 3D interface expresses spatially — you pluck where you click.

## The Audio Engine: In-Browser AudioWorklet

The DSP runs in the browser, in an **AudioWorklet** — a real audio-rate (48 kHz) processor on the audio thread, not the main thread. This keeps the instrument self-contained and deployable as a single artifact, matching the web interface. The decision (2026-05-30 intake) was in-browser over a native Max/RNBO engine because the whole point is a *web instrument* you can open and play; the [[RNBO codebox~ smith]] path stays on the table as a higher-fidelity native alternative if the browser ceiling ever binds, and [[Tone.js]] hosts the surrounding audio graph (output, metering, any effects) around the custom waveguide node.

**The visualization bridge** is the one real architectural subtlety: the worklet runs at audio rate, but the screen only needs ~60 Hz. So the worklet downsamples the delay-line state to ~100–200 points and ships it to the main thread — via `SharedArrayBuffer` where cross-origin isolation headers allow it, falling back to `postMessage` where they don't (the standalone/artifact case). [[Three.js]] reads the latest state each frame and writes it into the string mesh's vertex positions. Never read audio-rate buffers per frame; downsample in the worklet first. (This is recorded as a Three.js gotcha.)

## The Interface: 3D Waveguide, Visible

Rendered by [[Three.js]] (R3F + drei default; raw r128 for a single-file artifact). The string is a `BufferGeometry` line/tube whose vertices are driven imperatively in the render loop from the worklet's state — the canonical hot-path discipline (no per-frame React state). What the viewer does:

- **Pluck** by clicking a point on the string — excitation position is spatial and literal
- **See** the wave travel, reflect at the bridge/nut, and decay
- **Tune** pitch (delay length), brightness/decay (loop filter + gain), inharmonicity (dispersion allpass), and termination character (reflection filters)
- **Orbit** the scene to read the wave from any angle

The teaching claim the project is built to prove: a learner who watches the wave reflect and lose its highs *understands* why a plucked string decays bright-to-dark in a way no decay-knob ever conveys.

## Tiers Toward Loudon Live

- **Sketch** — Karplus-Strong worklet + a single visible string in raw Three.js, pluck + pitch, proof the see-it-hear-it loop reads. One session.
- **Study** — full bidirectional waveguide, R3F controls for the full parameter set, design-system skin, smooth on desktop, the visualization bridge working via postMessage. The real working instrument.
- **Piece** — dispersion + excitation variety, GPU-tested, mobile-considered, a Loudon Live teaching arc around it (the string as a lesson in traveling waves), recipe + perf note. Stage-ready.

## Cross-Domain Resonance

- The delay line as the unit of memory connects to [[DSP in Looping Dimensions]] — a waveguide is a loop whose length is a pitch.
- Termination reflection ↔ wave physics ↔ optics: the same boundary-condition math that reflects a wave at a fixed string end reflects light at a refractive boundary (the [[Particle Synthesis]] prism thread).
- Dispersion here is the *same physics* the [[2D Torus Wavetable Synthesizer]] and [[Categorizing Inharmonicity]] treat from other angles — three instruments triangulating one phenomenon.

## Open Questions

- How far does the browser AudioWorklet ceiling go before [[RNBO codebox~ smith]] native export earns the swap? Polyphony and dispersion-filter count are the likely pressure points.
- Does the 3D string actually teach better than a 2D oscilloscope-style view, or is the third dimension paying its way only for the orbit/branching-body cases? An honest comparison ([[The Shop]] Comparison Mode: Three.js 3D vs. a p5.js 2D string) would settle it.
- Polyphony model: one worklet with N strings, or N worklet nodes? Affects both audio and how many meshes the render loop drives.
- Where does this sit relative to the [[2D Torus Wavetable Synthesizer]] as a Loudon signature device — sibling, successor, or a different audience entirely?

## Forward Vector

First move: a Shop brief to the Maker routing [[Three.js]] (interface) + an AudioWorklet waveguide (engine), Sketch tier — the Karplus-Strong see-it-hear-it loop. That single artifact proves the bridge, gives Three.js its first real job (stub→alive), and tells us whether the physics-visible interface delivers the teaching punch the whole project is a bet on. Everything else stages off that proof.
