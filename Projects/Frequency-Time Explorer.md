---
title: "Frequency-Time Explorer"
type: project
pillars: [creation, tools, practice]
born: 2026-04
stage: growing
status: design-complete
links:
  - target: "[[Frequency-Time Duality]]"
    type: emerged-from
    label: spawned-by
  - target: "[[Boundary-Crossing Instruments]]"
    type: enables
    label: makes-the-crossing-experiential
  - target: "[[Frequency Domain ↔ Perspective Shift]]"
    type: connects-to
    label: sibling-pedagogy
  - target: "[[DSP in Looping Dimensions]]"
    type: connects-to
    label: scaffolds-toward
  - target: "[[Loudon Live]]"
    type: enables
    label: introductory-tool
  - target: "[[Piano String Inharmonicity]]"
    type: mirrors
    label: html-page-experiment
  - target: "[[Haas Effect]]"
    type: connects-to
    label: lives-on-the-axis
  - target: "[[BBS Design System]]"
    type: connects-to
forward_vector: "I want to become the introductory tool every musician and sound designer reaches for when they first wonder what a flanger is actually doing — the single map that turns a dozen unrelated effects (slapback, echo, comb, chorus, FM, Doppler) into regions on one continuous axis. I want to be beautiful enough to share standalone and rigorous enough that learners arrive at waveguide synthesis, FM synthesis, and wavetable synthesis already prepared for the door."
---

# Frequency-Time Explorer

![[Frequency-Time Explorer — hero.png]]

A standalone web app for musicians and sound designers who are *already curious* — they've heard a flanger and wondered what it's actually doing, or noticed that a very short delay starts to color sound and don't know why. Not learners-from-zero. They have ears and tools. What they lack is the underlying frame.

The tool's job is to give them ONE mental model that unifies a dozen things they thought were unrelated. After they've used it, they reach for the same instinct when they hear a comb-filtered hi-hat as when they hear a kick drum's pitch.

It is NOT an oscilloscope, a synthesizer, or a DSP textbook. It is a **map** that you walk while listening.

## The Big Idea

A delay and a frequency are the same thing seen at different time scales — and so are a tempo, a pitch, a flutter, an echo, a slapback, a comb filter, a chorus, and a reverb. They're regions of one continuous axis.

## The Universe View

A horizontal logarithmic axis spans roughly 10 seconds → 10 microseconds (equivalently 0.1 Hz → 100 kHz), labeled in five parallel rows: period (T), frequency (1/T), BPM, pitch / MIDI note, and subdivision-at-reference-BPM. Five color-banded perceptual zones overlay the axis: sub-rhythmic, rhythmic, flutter/threshold (the 20–40 Hz transition), pitch (the audible band), and filter/coloration (delays under ~20 ms).

A playhead the learner drags along the axis. As they drag, they hear what's at that position: a click train at the corresponding rate, or — in delay context — the delay length applied to a fixed test signal.

This single visual is the spine. Every lesson in the structured walk runs along it.

Curtis Roads' time-scale taxonomy from *Microsound* (infinite, supra, macro, meso, sound object, micro, sample, subsample, infinitesimal) maps cleanly onto these zones and is offered as a **secondary** labeling layer for learners who want a published intellectual frame to attach to.

## The Structured Learning Sequence

The walk is **linear** — each movement earns the next. The free-explore mode and the calculator strip are **locked until the walk completes**. This is a pedagogical decision: by the time the conversions become available, they are *meaningful*, not abstract.

### Movement 1 — The Flip (Repetition → Pitch)

A click track at 60 BPM. Tempo dragged upward. At 60, 120, 240, 480 BPM it stays a rhythm. Around 1200 BPM (≈ 20 Hz) the rhythm dissolves into a low buzzing tone. Push further — buzz becomes pitch.

The lesson: the ear's perceptual mode flips at a specific rate threshold. Same signal, same speaker; the brain just changes how it reads it. A click train is also a harmonic series — the buzz they hear is integer multiples of the click rate. (The deeper [[DSP in Looping Dimensions]] hook lives here, kept dormant for now.)

### Movement 2 — The Echo Walk (Delay)

A single short clap fed into a delay. Delay time dragged from long to short, with a labeled stop at each perceptual zone:

2 s clear distinct echo → 500 ms rhythmic dub-like → 200 ms fast rhythmic → 100 ms slapback (Sun Records / rockabilly) → 50 ms slapback / "thickening" → 30 ms Haas zone (delay becomes spatial localization) → 15 ms precedence holds, light comb starts → 5 ms comb filtering audible as tone color → 1 ms heard purely as filter / EQ.

At each stop, two things shown: the production-world name AND the perceptual reason. The lesson: the same delay block is six different things depending on its time setting.

### Movement 3 — The Bridge (Delay IS Pitch)

The wow moment, framed as **the inevitable consequence of the math** rather than a trick.

Same delay from M2. Replace the test signal with white noise. Crank feedback. The delay sings — pitched tone. Drag the delay time: pitch tracks. A pluckable string out of a delay line.

Show the math: T (ms) ↔ f = 1000/T (Hz). 1 ms = 1000 Hz. 5 ms = 200 Hz. The reciprocal IS the unification.

Then: tap a noise burst into the delay (no continuous excitation, just one transient and feedback). Karplus-Strong — a plucked string. The simplest physical model in audio.

The lesson: the boundary between rhythm/echo and pitch/filter isn't a wall — it's the same mechanism heard with different excitation.

### Movement 4 — The Modulation Dimension (and where it leads)

The structural elegance of M4: it **recreates Movement 1's perceptual flip on a different axis**. The same 20 Hz threshold appears in two places — once on the signal axis (M1), once on the modulation axis (M4). That's the recursion that proves the duality is fundamental, not a coincidence.

The modulation walk:

- 0.1 Hz LFO modulating a 10 ms delay, ±5 ms — **flanger** (the swooping comb)
- 1 Hz, ±2 ms — **chorus** (the thickening they already know)
- 5 Hz, small depth — **vibrato of the comb peaks**
- 15 Hz — wobble starts to lose its identity as a separate event
- **~20 Hz threshold crossed** — modulation rate enters the audio band, sidebands appear
- 100 Hz, 500 Hz, 1 kHz modulator on a tiny delay — **FM synthesis**: bell tones, DX7 territory, sidebands at carrier ± modulator and harmonics

Then the second physical interpretation. Modulating delay time = changing path length = relative velocity = **Doppler shift**. The flanger is a Doppler shift you can hear because the comb teeth slide. The vibrato is Doppler from a small periodic motion. The FM tone is Doppler from a source moving so fast its motion is itself audible.

The lesson, stated explicitly: the same 20 Hz threshold rules everything. Cross it on the signal axis and rhythm becomes pitch. Cross it on the modulation axis and wobble becomes timbre. The duality is recursive — every dimension you can put on this axis has the same perceptual zones.

### Movement 5 — Free Explore, with three doorways

The structured walk completes. Full universe view unlocks. The calculator strip across the bottom always reads the cursor's five reciprocal values. The learner can switch the test signal (click / noise burst / sine / sample), toggle the operation (delay-on-signal vs. repetition-rate vs. modulation-rate), save and recall positions.

At the end of free-explore, the tool offers three explicit "you've now earned this" doorways, each grounded in something the learner has already touched:

1. **Waveguides → physical modeling.** They've already built Karplus-Strong in M3. Add a tunable damping filter in the feedback path: a string with material properties. Two coupled delay lines with cross-mixing: a physical instrument with a body. *"You've held a delay line that pretends to be a string. The next step is letting it pretend to be a flute, a drum, a bowed cello. That field is called waveguide / physical modeling synthesis."*

2. **FM synthesis → operator algebra.** Sidebands appeared in M4. *"The bell tone you just made with one carrier and one modulator is a 2-operator FM patch. The DX7 had 6 operators arranged in 32 algorithms. Each algorithm is a different routing of carriers and modulators. That's the territory."*

3. **Wavetable synthesis → spectral design.** A cyclic loop scanned at audio rate IS this same axis interpreted as a closed loop. Wavetable length T at sample rate fs gives f = fs/T — the same reciprocal that ran through the whole tool. *"You've been treating the axis as open. Close it into a loop, scan it cyclically, and you've built a wavetable oscillator. From here the territory opens to [[DSP in Looping Dimensions]] — what happens when you scan loops in higher dimensions."*

## Tool Architecture

Web app, single page, browser-only, audio via Web Audio API. **Standalone** — not embedded in Obsidian. The universe view is the persistent UI element across the top of the page. A movement player below shows current movement, narration, and movement-scoped controls. A calculator strip across the bottom (locked until M5) reads the cursor's five reciprocal values whenever active. Visual register: typography-driven, monochrome with a single accent color for the playhead, no chrome that screams "tutorial widget" — beautiful enough to share for its own sake.

## Open Questions

- What's the canonical visual register? Reference to existing artifact styles in the palace would help — does this borrow from the [[BBS Design System]] palette, or sit in its own visual world?
- What sample rate does the audio engine target? 48 kHz is enough for the audible band; 96 kHz gives cleaner short-delay behavior under modulation.
- For the upload-your-own-sample feature in M5: file size cap, accepted audio formats?
- Mobile/tablet support — desktop only or responsive across devices? A touch-dragged playhead is actually more pleasant than a mouse one for the walk.
- Should the tool record the learner's traversal (which positions they paused at, what they saved) for later teaching analysis? This is more a [[Loudon Live]] question than a tool question.
- Where does the URL live? loudon.live? A subdomain? Static deployment somewhere friendly (Cloudflare Pages, Vercel, etc.)?

## Design Provenance

Designed 2026-04-30 in dialogue with Claude. Five-movement structure with linear walk and locked-until-M5 free explore. M4 modulation extended to FM and Doppler at Loudon's direction (the move that closed the design). Three forward doorways at end of M5: waveguides, FM synthesis, wavetable synthesis. Standalone web app form. Beautiful enough to share standalone.

## Forward Vectors

- **The build itself** — design is complete, audio engine and visual prototype are next. Build phase wants a separate session.
- **Doppler shift as palace concept** — the M4 framing introduces it as a load-bearing analogy that probably wants its own page once the build session names it more.
- **The 20 Hz perceptual threshold** as its own concept entry — it appears twice in this design, runs through [[Frequency-Time Duality]], anchors *Microsound*, and shows up in neuroscience-of-perception literature. May want its own page rather than living scattered in body text.
- **First-rung tool for [[Loudon Live]]** — `Projects/Curriculum Map.md` should reflect FTE as the introductory pedagogy artifact, scaffolding into the three doorways.
- **First test of the "HTML version of a palace page" question** raised in [[Piano String Inharmonicity]] graffiti — though FTE is being built standalone, the techniques and Web Audio scaffolding will inform that broader question.
