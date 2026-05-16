---
title: Inharmonic Wavetable Synthesis
type: project
pillars:
  - creation
  - tools
  - philosophy
  - practice
born: 2026-04
stage: growing
status: active
energy: very high
hook_quality: 9
beauty: 9
who_leads: shared
links:
  - target: "[[Categorizing Inharmonicity]]"
    type: deepens
    label: instrument-form
  - target: "[[Piano String Inharmonicity]]"
    type: emerged-from
    label: trajectory-seed
  - target: "[[Harmonicity and Inharmonicity]]"
    type: emerged-from
  - target: "[[Neural Granular Synthesis]]"
    type: connects-to
    label: parallel-novel-engine
  - target: "[[Boundary-Crossing Instruments]]"
    type: connects-to
    label: harmonic-crossing
  - target: "[[Four Pillars]]"
    type: couples-with
    label: lesson-vehicle
  - target: "[[Bessel Functions in Synthesis]]"
    type: connects-to
    label: trajectory-library
  - target: "[[Dispersion]]"
    type: connects-to
  - target: "[[Wavetable Synthesis -- Research & Higher-Dimensional Design]]"
    type: deepens
    label: cube-emergence
  - target: "[[Kuramoto Coupling]]"
    type: enables
    label: bifurcation-control
  - target: "[[Crystal Synthesizer]]"
    type: mirrors
    label: phonon-vs-harmonic
  - target: "[[Wavetable Space as Torus]]"
    type: connects-to
    label: topological-reframe
  - target: "[[The Curve Is the Material]]"
    type: connects-to
    label: design-refinement
forward_vector: I want to become a working VST instrument and a Four Pillars lesson simultaneously — the synthesizer is the pedagogy, and the pedagogy is the synthesizer. The lesson teaches what harmony actually is by putting a horizontal line in front of you and showing you what happens when you bend it.
agency_profile:
  creation: I want to produce sounds that exist nowhere in current synthesis — the specific quality of a bell's physical frequency evolution applied to a pad's amplitude profile, or piano stretch dynamics applied to a vocal formant wavetable. The synthesis space this opens has not been sonically explored.
  tools: "I require: an additive synthesis engine (64–128 partials, real-time, JUCE/VST3), a Wavetable B rendering system with per-partial interpolation, a physical trajectory analysis pipeline (SMS or STFT peak-tracker to convert real instrument recordings into Wavetable B frames), and a wavetable LFO routing matrix. This is a 6–12 month serious build."
  philosophy: "I am asking: what is harmony, actually? A flat line. That answer contains everything — the physics of string stiffness, the mathematics of Bessel eigenmodes, the perceptual machinery of consonance and dissonance, and the entire tradition of instrument making. The flat line is where physics meets perception meets meaning."
  practice: The VST and the lesson must be built together. The lesson teaches better because the instrument exists. The instrument is designed better because the lesson forces clarity. These are not two projects — they are one project with two deliverable forms.
---

# Inharmonic Wavetable Synthesis

A novel synthesis architecture that uses two independent wavetables — one controlling partial amplitudes, one controlling partial frequencies — combined through an additive synthesis engine. The result is a two-dimensional timbral instrument where spectral shape and harmonic identity are independently expressive, modulatable axes. The central conceptual insight: **a flat horizontal line is the harmonic series. Every deviation from that line is inharmonicity. The shape of the deviation encodes the physics of a material.**

This entry documents the architectural conclusions reached in a design session (April 2026) and establishes the forward vector toward both a Four Pillars teaching instrument and a commercial VST.

---

## The Architecture

### Wavetable A — Amplitude Control

A standard wavetable used in a non-standard way. Rather than playing back as audio, each frame of Wavetable A is FFT-analyzed to extract per-partial amplitude values A₁, A₂, ... Aₙ. These amplitudes are fed directly into the additive synthesis engine as gain coefficients for each partial.

This means all existing wavetable content — every commercial wavetable pack, every morphed and evolved waveform, every spectral-designed single cycle — immediately becomes a library of timbral templates for this instrument. A saw-based wavetable gives you a rich, harmonically dense amplitude profile. A hollow/phase-shifted wavetable gives you a specific pattern of present and absent partials. Vocal formant wavetables give you formant regions. The amplitude axis of the instrument is instantly rich because it inherits the entire wavetable ecosystem.

Morphing through frames of Wavetable A — whether by envelope, LFO, or performance control — continuously evolves the spectral shape of the output without affecting the frequency positions of the partials.

### Wavetable B — Inharmonicity Control

The key architectural innovation. Wavetable B is interpreted not as audio but as a **per-partial frequency mapping function**.

**Reading convention:** Within a single frame of Wavetable B, position on the X-axis corresponds to partial number (partial 1 through partial N). The Y-axis value at each position is interpreted as the frequency deviation of that partial from its ideal harmonic position, expressed in cents.

**The harmonic baseline:** A perfectly flat horizontal line at Y=0 means every partial sits at its exact harmonic frequency. There is no inharmonicity. The additive engine produces a perfectly harmonic tone whose spectral shape is determined entirely by Wavetable A.

**Inharmonicity as curve shape:** Any deviation from that flat line introduces inharmonicity. An upward-bowing curve — one where the Y value increases with partial number — represents the physically common case where higher partials are progressively sharper than their harmonic positions. This is the shape of piano string inharmonicity (the B coefficient formula), of guitar string stiffness, of most metallic bars under tension. A step-function pattern locating partials at Bessel function zeros gives bell and cymbal inharmonicity. A random scatter pattern gives stochastic inharmonicity as catalogued in [[Categorizing Inharmonicity]].

**Wavetable frames as temporal evolution:** Multiple frames of Wavetable B represent the inharmonicity function at different moments in time. A frame early in the wavetable might show a strongly curved profile (high inharmonicity — the piano at attack, the bell mid-ring). Later frames might show the curve relaxing toward the flat harmonic baseline. Scanning through these frames with a gate-triggered envelope reproduces the temporal evolution of real physical inharmonicity: the instrument "settling" from an inharmonic attack into a more harmonic sustain, exactly as a piano note does.

### The B Depth Scalar

A single global multiplier applied to all Wavetable B deviations simultaneously. B=0 bypasses Wavetable B entirely — the output is purely harmonic wavetable synthesis. B=1 applies the loaded profile at full physical scale. B>1 exaggerates the inharmonicity beyond what any real instrument produces. B can be an LFO target, an envelope target, a MIDI expression or MPE target, a macro knob.

This scalar is the most expressive single control in the instrument. A slow LFO on B causes the sound to breathe between harmonic and inharmonic, exactly as some physical systems behave when driven near a resonance threshold.

### The Additive Synthesis Engine

At audio rate, for each of N partials (64–128 in practice):

1. Read amplitude Aₙ from current position in Wavetable A
2. Read frequency deviation Δfₙ (in cents) from position n in the current frame of Wavetable B
3. Compute partial frequency: fₙ = n · f₀ · 2^(B · Δfₙ / 1200)
4. Advance phase of partial n by fₙ/fs
5. Output: Aₙ · sin(φₙ)

Sum all N outputs. This is the audio signal.

The FFT analysis of Wavetable A is computed per-buffer (not per-sample) whenever the wavetable position changes significantly. Wavetable B is read as a lookup table per-partial per-buffer. Both are lightweight operations compared to the oscillator bank itself.

---

## What This Sounds Like

**The settling piano:** Load a bright harmonically rich wavetable into A (saw-based, many strong partials). Load a multi-frame Wavetable B whose early frames show a strongly upward-bowing curve (B ≈ 0.002 at partial 20) and whose later frames gradually flatten toward zero over 500ms. Trigger with a gate. The attack has a slightly metallic, slightly "wrong" quality — familiar but not quite piano, not quite bell. Over the first half-second, the beating between near-harmonic partials settles into clarity. The sound develops a sense of physical arrival. It is recognizably the character of piano decay without being a piano sample.

**The alien bell choir:** Load a thin, hollow wavetable into A — only partials 1, 3, 5 strongly present, the rest near-silent. Set Wavetable B to a static frame with Bessel J₀ zero positions: partials placed at ratios 1.0, 2.29, 3.60, 4.90 ... rather than 1, 2, 3, 4. Hold B=1 statically with no frame scanning. The result sounds bell-like in character — that specific "wrong" clustering of partials that means struck metal — but the spectral shape (hollow, odd-harmonic emphasis) gives it a different identity from any real bell. Chords built on this timbre are startling: intervals that should be consonant are not, and intervals that should clash have unexpected clarity. This is [[Harmonicity and Inharmonicity]]'s frustrated coupling made audible.

**The harmonic drift texture:** Set Wavetable A to a slowly morphing pad sequence (a multi-frame wavetable scanning across a chord-like spectral evolution). Set Wavetable B to a different slowly morphing wavetable — not a physical trajectory but an abstract shape. Route a slow LFO to the scan position of B, independent from A's envelope scan. The amplitude envelope of each partial evolves on one timeline; the frequency positions of those partials drift on a separate timeline. The result is texturally alive in a way that neither pure wavetable synthesis nor static additive synthesis achieves: the spectral shape continuously shifts, and the harmonic identity continuously shifts, and they are out of phase with each other, creating a beating, breathing, complex evolving timbre that no real instrument produces but that feels physically motivated.

**The wavetable LFO inharmonicity:** Route a secondary wavetable oscillator — running at 0.5 Hz, loaded with a smooth custom curve — to the B depth scalar. At the LFO's peak, B=1.5 (hyperinharmonic, beating throughout the partial stack). At its trough, B=0 (perfectly harmonic, clean). Sustained chords played through this pass through phases of clarity and complex shimmering roughness on a slow cycle. The timbral narrative is: consonance → roughness → consonance. This is a compositional texture, not just a sound design effect.

**Crystal morph:** Set Wavetable B to frames derived from analysis of a crystal singing bowl. Early frames: partials clustered at bowl vibrational mode ratios (irrational, widely spaced). Later frames: gradual drift toward harmonic positions (physically impossible for a real bowl, but synthetically available). Apply with a long 3-second scan. The result is a sound that begins with the unmistakable "glassy" quality of crystal — that specific inharmonic spacing — and over three seconds becomes a pure harmonic tone. A physical object's identity dissolves into mathematical ideality. Deeply uncanny. Deeply musical.

---

## What This Looks Like

The primary display is the **Wavetable B editor** — a graph where X is partial number and Y is cents deviation. The harmonic baseline is a bold horizontal line at Y=0, always visible, always anchoring the display. The current frame of Wavetable B is drawn as a colored curve above or below this line. Adjacent frames are ghosted slightly to show the temporal trajectory. Dragging the curve upward bends partials sharp; downward bends them flat; a smooth upward bow from left to right is piano character; a step-jump pattern is bell character; randomized jitter is stochastic scatter.

Below the Wavetable B graph: a frame scanner with an independent envelope and LFO routing. Above: the Wavetable A display in its standard waveform or spectral view.

The UI teaches as you use it. You cannot look at the flat horizontal line and miss its meaning. The pedagogy is structural, not instructional.

---

## The Cube Architecture: Higher-Dimensional Framing, Unison, and Spatial Partials

### The 3D Space

When τ_A and τ_B run independently, the full state of the synthesis engine lives inside a 3D cube:

- **τ_A** (0→1): position in Wavetable A's frame sequence — the amplitude axis
- **τ_B** (0→1): position in Wavetable B's frame sequence — the inharmonicity axis
- **n** (1→N): partial number — the vertical axis

At any given (τ_A, τ_B) position, the instrument's complete spectral state is an **inner line** — a cross-section through the cube running along the partial-number axis. Along this line, each partial carries two inherited values: its amplitude (from the amplitude wall, determined by τ_A) and its frequency deviation (from the inharmonicity wall, determined by τ_B).

The two cube faces have distinct, legible structure. The **τ_A × n face** (the amplitude membrane) is a landscape of ridges and valleys encoding how the harmonic envelope evolves through frames — a saw-based wavetable looks like a mountain range with peaks at every partial; a formant wavetable has two or three prominent ridges with deep valleys between. The **τ_B × n face** (the inharmonicity membrane) is the settling landscape: early frames bow strongly upward at the high-partial end, late frames flatten toward zero. The piano trajectory is a wave of flattening sweeping from high partials toward low over the note's lifetime.

In the current architecture each wall extrudes straight through the cube in its perpendicular direction — the amplitude doesn't vary with τ_B and the inharmonicity doesn't vary with τ_A. The interior has no emergent structure beyond the product of the two walls. The interesting structure emerges from the **path** through the (τ_A, τ_B) floor: a diagonal or curved trajectory through that floor encounters combinations that axis-aligned scanning cannot produce. Physical instrument analysis would ultimately populate the full interior with correlated values — a piano's partial amplitudes and frequency deviations are not independent processes but two projections of a single struck string — making the cube genuinely interior-rich rather than a product structure.

### The Glowing Line UI

The inner line maps directly to a primary visual display:

- The line runs **horizontally across the box**, partial number left to right
- Its **lateral deviation from center** is the inharmonicity profile — the flat line at center is the harmonic series, always visible as reference; any curve away from it is a physical material's signature
- Its **brightness and thickness along its length** is the amplitude profile — glowing where partials are loud, dim where they're quiet

The dancing of the line during a note tells the physical story in real time: a piano attack begins bright throughout and curved upward at the high-partial end; over the sustain the curve relaxes toward the flat line and the high-partial glow dims first (upper partials decay faster). The note's life is a dance. The two distorted cube walls are the landscapes the line is slicing through — when τ_A changes, brightness shifts; when τ_B changes, curvature shifts. The walls are context; the line is the current state.

This is the Wavetable B editor described above, but now understood as a live cross-section of a 3D space rather than a standalone curve display. The pedagogy is still structural: you cannot look at the flat horizontal line and miss its meaning.

### Unison as a Bundle of Lines

Spreading unison voices along the τ_B axis produces multiple lines inside the box, and the geometry of the Wavetable B curve gives the spread a physically motivated, partial-dependent character.

Because any physically grounded inharmonicity function (the B coefficient, Bessel spacings, string stiffness models) is shallow near partial 1 and steepens toward higher partials, voices spread along τ_B will remain nearly coincident at low partials — the curve is nearly flat there, so adjacent τ_B positions give nearly identical deviations — and fan apart at high partials, where the slope is steep and small τ_B differences produce large frequency divergence.

**The bundle braids tightly at the left and fans outward at the right.** This is exactly the behavior of a real string ensemble playing unison: the fundamental is nearly locked across players; it is the upper partial beating that produces the shimmer and life of ensemble sound. The physical accuracy emerges geometrically from the curve's shape rather than being designed in.

Spreading voices along τ_A gives a different, complementary quality: each voice at a slightly different timbral moment in the amplitude evolution, producing spectral chorus without pitch spread. The two unison axes are perceptually and geometrically distinct and can be used independently or together.

Warping functions applied to either wall — non-uniform mappings of the frame axis that stretch or compress regions — allow the cube to become expressive geometry rather than a neutral container. A warp that slows the high-partial region of the τ_B wall makes the inharmonicity settling linger longer at the top of the spectrum, like a bell that sustains its metallic high-partial character while its lower harmonics settle toward harmonic clarity.

### Wavetable C: Per-Partial Panning

The architecture extends naturally to a third independent membrane: **Wavetable C**, encoding per-partial stereo pan position.

**Reading convention:** Within a single frame of Wavetable C, position on the X-axis is partial number (partial 1 through partial N). The Y-axis value at each position is that partial's pan position, from −1 (full left) to +1 (full right). A flat horizontal line at Y=0 means every partial is centered.

**The spatial signature of real instruments:** Physical instruments are not point sources. Different resonant modes radiate from different parts of the instrument body. A piano's strings span the soundboard from bass-left to treble-right; its partials have a slight spatial spread that follows the instrument's geometry. A marimba bar's modes radiate somewhat differently at different ends. Wavetable C can encode these spatial signatures as frame sequences, with temporal evolution of the pan profile just as Wavetable B encodes temporal evolution of inharmonicity.

**Useful pan profiles:** A gentle gradient from −0.3 at partial 1 to +0.3 at partial N spreads the harmonic series gradually across the stereo field, giving an airy, physically plausible width without randomness. A profile that mirrors the Wavetable B inharmonicity curve — wider where partials are more inharmonic — makes spatial spread and pitch spread track together, reinforcing both perceptually. A Wavetable C that evolves from scattered frames to centered frames encodes a sound that focuses spatially as it sustains.

**Unison with τ_C spread:** Combined with τ_B spread, the upper harmonics of a unison voice fan out in both pitch deviation and pan position simultaneously. The braided-to-fanned bundle of lines becomes a genuinely 3D structure inside the display box: lines braid tightly at low partials and diverge in both lateral deviation (inharmonicity) and depth (pan) at high partials. The box is now a spatial-spectral map — low partials float near center-front, high partials curve outward and recede into the stereo field.

**Visual encoding:** In the box display, pan position encodes as each point's **depth into the box**. The inner line becomes a genuine 3D curve: its left-right deviation is inharmonicity, its depth is pan position, its brightness is amplitude. A bundle of unison lines becomes a 3D braid, fanning in two directions simultaneously at the high-partial end.

**Implementation:** Wavetable C is architecturally identical to Wavetable B — a 2D membrane of frames × partials, with a C Depth scalar, envelope and LFO routing, and a frame scanner. Per-partial stereo panning routes each partial's output to a stereo pair with gains (cos(θ_n · π/2), sin(θ_n · π/2)) where θ_n ∈ [−1, +1] is the pan value from Wavetable C. This adds two multiplications per partial per sample — negligible computation.

**The C Depth scalar** mirrors B Depth: C=0 collapses all partials to center, C=1 applies the full spatial profile, C>1 exaggerates spread. A slow LFO on C makes the stereo image breathe between focused and wide independently from amplitude and inharmonicity evolution.

---

## Wavetable LFOs as Inharmonicity Modulators

The "wavetable LFO" concept deserves its own development. A wavetable LFO is an LFO whose shape is itself drawn from a wavetable — instead of sine/triangle/saw, the LFO follows the curve of an arbitrary stored waveform. When routed to the B depth scalar, the LFO shape controls the *rhythm* of inharmonic variation: slow rise and sharp fall, complex multi-peak patterns, stochastic-feeling irregular pulses drawn from granular wavetables.

More powerfully: a separate wavetable LFO routed to the Wavetable B frame scan position makes the *type* of inharmonicity oscillate over time. At LFO phase 0°, you're in the early (high-inharmonicity) frames; at 180°, in the late (near-harmonic) frames; the LFO drives the physical trajectory not as a one-shot event but as a continuous cycle. The instrument perpetually re-enters its own attack character.

The most extreme version: route a wavetable LFO running at audio rate (30–200 Hz) to the B depth scalar. This is now frequency modulation — but FM with per-partial amplitude control. The inharmonic sidebands are generated by the FM relationship, but their relative amplitudes are shaped independently by Wavetable A. This is a region where the instrument becomes a hybrid FM/additive engine with physically informed sideband structure. Uncharted synthesis territory.

---

## Physical Trajectory Library

The Wavetable B format enables a library of pre-analyzed physical instrument trajectories. Each library entry is a set of Wavetable B frames derived from SMS analysis of a real instrument recording. The frames capture the temporal inharmonicity evolution of that instrument at a specific pitch and dynamic.

Proposed first library entries:
- **Piano (Bass)** — strong upward bow, B ≈ 0.001–0.002, settling over ~200ms
- **Piano (Treble)** — higher B, faster settling, sharper high-partial stretch
- **Tubular Bell** — Bessel-adjacent positions, minimal temporal evolution
- **Vibraphone** — near-harmonic, gentle positive stretch, slow beating
- **Crystal Bowl** — irregular spacing, very slow phase drift
- **Guitar (Acoustic)** — moderate stretch, rapid settling in attack
- **Clave / Wood Block** — stochastic scatter type, single transient frame

Each entry can be loaded into Wavetable B and applied to any Wavetable A timbre. The piano trajectory applied to a vocal formant wavetable. The crystal bowl trajectory applied to a saw-based timbre. The bell trajectory applied to a bass pad. Every combination is a new instrument.

---

## Commercial Landscape Positioning

**Vital** (Matt Tytel, free/paid): Vital does spectral oscillator warping at the harmonic level, including an inharmonic stretch mode that shifts partial spacing globally. It operates by transforming the wavetable before playback, not by running a true additive engine. It does not have per-partial independent frequency control, no physical trajectory library, no dual-wavetable paradigm. Vital is the closest adjacent tool and the most likely comparison in user conversations. The distinction to communicate: Vital warps the wavetable; this instrument routes amplitude and frequency through independent wavetables into a full additive engine. Different mechanism, different expressive surface.

**Zebra 3** (u-he): Has a full additive engine with up to 1024 partials capable of inharmonic configurations. No wavetable-as-amplitude-control-signal paradigm, no physical trajectory concept, no Wavetable B construct. Zebra's additive engine is more powerful in partial count; this instrument is more expressive in the dimensional separation of amplitude from frequency and in the physical grounding of inharmonic profiles.

**Serum, Phase Plant, Massive X**: Pure wavetable and modular wavetable architectures. No additive engines, no inharmonic partial control. Different category.

**Physical modeling instruments (Pianoteq, AAS, Chromaphone)**: Simulate the physics directly. More acoustically accurate at their specific target sounds but less flexible as a general creative tool. Cannot apply bell physics to vocal wavetable content or piano trajectories to pad timbres.

**This instrument's position**: Occupies the gap between the expressive flexibility of wavetable synthesis and the physical groundedness of modal/acoustic modeling. It is a sound design instrument whose parameters have physical meaning, making it learnable and navigable rather than arbitrary. Its natural audience is sound designers working in cinematic, ambient, and experimental electronic music who want timbral complexity that feels motivated rather than random. Secondary audience: educators and learners who want a hands-on demonstration of what harmony actually is.

---

## Four Pillars Lesson Design

The instrument is intrinsically pedagogical. The lesson writes itself from the architecture.

**The hook**: "What is harmony?" A flat line. Put that on screen, let students draw curves away from it, and make the synthesizer play those curves. In twenty minutes, students understand the B coefficient formula, the Railsback stretch, Bessel eigenmodes, and Sethares' tuning-timbre relationship — not because they read about them, but because they heard the answer to "what happens if I bend this curve in this specific way."

**Creation pillar**: Build a sound that starts metallic and settles into harmony. The assignment: design a Wavetable B trajectory that tells a physical story. Inspired by what instrument? What does settling sound like to you?

**Tools pillar**: FFT analysis, additive synthesis, the connection between waveform shape and spectral content (Wavetable A as teaching vehicle), the SMS analysis pipeline that creates the physical trajectory library (real recording → Wavetable B frames).

**Philosophy pillar**: Sethares' tuning-timbre relationship — if you change the inharmonicity of your instrument, you change the intervals that sound consonant. The instrument's physics implies its scale. What does it mean that harmony is context-dependent? That a bell doesn't want equal temperament?

**Practice pillar**: Use Wavetable B as a compositional parameter. Design a piece whose timbral narrative is the journey from the bell's inharmonic character to the string's near-harmonic character over several minutes. Inharmonicity as a large-scale formal element, not just a sound design detail.

---

## Technical Feasibility

The architecture is feasible on standard contemporary DAW hardware without exotic optimization.

**Core computation**: An additive synthesis engine with N partials requires N phase accumulators and N wavetable lookups per sample. At N=64 partials and 44.1 kHz sample rate: approximately 2.8 million oscillator updates per second. With SIMD (AVX2, 8 floats in parallel), this reduces to ~350K vector operations/sec. A single voice on a modern CPU uses roughly 1–2% of one core.

**Polyphony**: 16 voices at 64 partials = ~45 million oscillator updates/second, well within one core's capacity. 32 voices at 128 partials is feasible with careful SIMD optimization, still leaving headroom for other processing.

**Wavetable A FFT analysis**: Computed once per wavetable position change (not per-sample). A 2048-sample FFT takes ~1ms on current hardware and can be deferred to a background thread. Not a real-time bottleneck.

**Wavetable B lookup**: Per-partial, per-buffer. Two array lookups and a linear interpolation per partial per buffer — negligible computation, similar to reading a standard modulation source.

**Memory footprint**: Wavetable A at standard 256 frames × 2048 samples × 4 bytes = 2MB per wavetable. Wavetable B at 64 frames × 128 partial slots × 4 bytes = 32KB per trajectory. The entire physical trajectory library could fit in under 1MB.

**Reference**: Zebra 3 runs 1024 additive partials in commercial real-time release. 64–128 partials is very conservative by that benchmark.

**Implementation path**: JUCE framework for VST3/AU/AAX. A DSP kernel in C++ with SIMD intrinsics for the oscillator bank. Wavetable management (A and B) using standard wavetable interpolation. The physical trajectory analysis pipeline (recording → SMS → Wavetable B frames) can be a separate offline tool, delivering library files in a compact binary format. Estimated development timeline for a release-quality instrument: 6–12 months with focused effort.

**Apple Silicon note**: The M-series efficiency architecture is particularly favorable for this workload — sustained parallel computation without cache thrashing. Apple Silicon can run 128-partial 32-voice engines with significant headroom.

---

## Cross-Domain Resonance

- **[[Categorizing Inharmonicity]]**: This project is the instrument implementation of that taxonomy. The six inharmonicity types (stretched, Bessel, stochastic, logarithmic, chaotic, phase-accumulation) map directly onto Wavetable B curve shapes and library presets.

- **[[Piano String Inharmonicity]]**: The B coefficient formula — f_n = n·f₀·√(1+B·n²) — is the mathematical description of one specific Wavetable B curve family. The interactive piano demo that entry imagines is this instrument's natural pedagogical artifact.

- **[[Harmonicity and Inharmonicity]]**: The frustrated coupling insight lives here sonically. Play an inharmonic timbre (Bessel profile, B=1) in standard equal temperament — the instrument produces exactly the frustrated coupling described in that entry. The user hears it, not just reads it.

- **[[Neural Granular Synthesis]]**: Both projects open new synthesis territory by combining two historically separate paradigms. Neural Granular: population statistics + granular cloud. This project: wavetable amplitude + additive frequency. The approach — find a novel combination of existing paradigms and ask what it sounds like — is shared.

- **[[Boundary-Crossing Instruments]]**: An instrument that continuously crosses the harmonic/inharmonic boundary as a primary expressive act. The boundary is the instrument.

- **[[Bessel Functions in Synthesis]]**: Bessel zero positions are a first-class Wavetable B preset. The geometry of circular membranes — drum, bell, cymbal — is directly available as a timbral character. Shape the boundary conditions; hear the eigenfunction.

---

## Open Questions

- What is the perceptual threshold below which Wavetable B deviations are inaudible? Is there a minimum cents deviation per partial before the inharmonic character registers? This matters for how fine the resolution of Wavetable B needs to be.

- Can Wavetable B frames be derived from arbitrary audio recordings using SMS analysis, or does the source need to be a clean pitched tone? Unpitched sources (claves, cymbals) have ambiguous fundamental reference frames — how do you define "harmonic deviation" for a sound with no clear fundamental?

- What happens to the Sethares tuning-timbre relationship when Wavetable B is in motion (scanning frames)? If the inharmonicity profile is time-varying, the "consonant scale" is also time-varying. Is there a compositional use for a scale that shifts over the course of a note?

- Is there a Wavetable B profile that produces beating patterns isomorphic to Kuramoto frustration — where adjacent partials fight each other? [[Harmonicity and Inharmonicity]] describes this physically; can this instrument make it audible and controllable?

- Can the audio-rate wavetable LFO on B depth be tamed into a musically useful FM-like mode, or does it produce mostly incoherent noise at moderate depths?

---

## Forward Path

**Immediate next steps:**
1. Build a prototype additive synthesis engine (Pure Data, Max/MSP, or Faust) with manual Wavetable B input — prove the sound concept before committing to VST development
2. Analyze 3–5 real instrument recordings through an SMS pipeline to generate first physical trajectory library entries
3. Design the Wavetable B editor UI — the flat horizontal line display is the instrument's identity marker

**Medium-term:**
4. JUCE implementation of the synthesis engine with SIMD optimization
5. Four Pillars lesson design — the lesson and the instrument development should inform each other

**Long-term:**
6. Commercial VST release with physical trajectory library and Wavetable B editor
7. Companion Four Pillars course module

---

*"The flat line is the harmonic series. It is also the simplest question in synthesis: what happens when you bend it? Every real instrument in the world is an answer to that question, written in the physics of a specific material. This instrument lets you read those answers — and write new ones that no material has ever given."*

> *[[twelve-word-compression|Every material bends the flat line differently. That bending is the instrument.]]*
