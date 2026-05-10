---
title: Curriculum Map
type: meta
pillars:
  - practice
  - tools
  - creation
born: 2026-04
last_activated: 2026-04
stage: sprout
links:
  - target: "[[FOUR PILLARS]]"
    type: connects-to
  - target: "[[Progressive Staging]]"
    type: couples-with
  - target: "[[Hilaritas Generator]]"
    type: enables
---

# Curriculum Map

Cross-project scaffolding intelligence for the [[Loudon Live]] curriculum. This file tracks which projects build on which, where good entry points are, and where gaps exist.

Updated whenever a project is staged. Read by the `project-stage-builder` skill during Phase 1 audit.

---

## Entry Points (No Prerequisites)

Projects appropriate for Autodidact Polymaths with no assumed DSP or synthesis knowledge beyond DAW fluency.

| Project | Stage | Why it works as an entry |
|---|---|---|
| [[Crystal Synthesizer]] Stage 1 | Staged 2026-04 | Requires only basic Max/MSP fluency and additive synthesis exposure. Physics framing is HTML-led — no prerequisites. Hook quality 9. |
| [[Retrospective Delay]] Stage 1 | Staged 2026-04 | Requires basic Max/MSP fluency and M4L Audio Effect format. Conceptually immediate — students hear the result in minutes. Hook quality 9. |
| [[Shepard Tone Synthesizer]] Stage 1 | Staged 2026-04 | **Zero prerequisites — not even Max.** Ableton MIDI Effect Rack only. Perceptually immediate. Most accessible entry in the curriculum. Hook quality 8. |

---

## Project Dependencies

Which projects benefit from prior exposure to another project.

### Retrospective Delay (5-stage arc)

```
Stage 1 — Circular buffer in vanilla Max → M4L device     [entry point]
    └── Stage 2 — Gain knob + lag param + performance polish
            └── Stage 3 — Port to Gen~ (productive friction #1)
                    └── Stage 4 — JSUI animated interface
                            └── Stage 5 — RNBO → VST/AU + H90 export
```

| Stage | Prerequisite [[Loudon Live]] | Prerequisite Knowledge | Introduces |
|---|---|---|---|
| 1 — The Witness | None | Basic Max/MSP, M4L Audio Effect format | Circular buffer, phasor-as-clock, phrase memory |
| 2 — The Séance | Stage 1 | Stage 1 patch | Gain gesture, lag parameterization, loop crossfade |
| 3 — The Grammar Behind the Spell | Stage 2 | Stage 1–2 patch built | Gen~ migration, signal-rate vs. event-rate |
| 4 — The Face | Stage 2 | Basic JavaScript helpful | JSUI, playful interface design |
| 5 — The Portal | Stage 3 | Gen~ patch from Stage 3 | RNBO codebox~, VST/AU export, H90 export |

**Parallel relationship:** [[Compressor Design]] and [[Retrospective Delay]] both use a circular buffer as their core mechanism. Same primitive, radically different time scales: ~11ms (sub-perceptual, amplitude envelope) vs. ~1 sec (phrase memory, fully perceptual). No dependency in either direction — they reinforce each other. Students who do both recognize the same shape at two scales; that recognition should be named explicitly in Stage 3 of Retrospective Delay.

---

### Crystal Synthesizer (5-stage arc)

```
Stage 1 — Monophonic Gen~ synth in Max          [entry point — no prerequisite]
    └── Stage 2 — Polyphonic + RNBO → H90 / Faust
            └── Stage 3 — Modal Crystal + interface begins
                    └── Stage 4 — Dispersion Filter + VST + crystal visualization
                            └── Stage 5 — Full physical model + crystallographic database
```

| Stage | Prerequisite [[Loudon Live]] | Prerequisite Knowledge | Introduces |
|---|---|---|---|
| 1 — Monophonic Gen~ synth | None | Basic Max, additive synthesis | Gen~ oscillator banks, crystal partials, hypothesis-testing pedagogy |
| 2 — Polyphonic + Portability | Stage 1 | Gen~ (from Stage 1) | RNBO, voice allocation, H90 + Faust export |
| 3 — Modal Crystal | Stage 2 | RNBO (from Stage 2) | Resonant filters, modal decay, Q-factor, performance gesture |
| 4 — Dispersion Filter + VST | Stage 3 | Modal synthesis | Frequency-dependent delay, VST dev, crystal UI |
| 5 — Full Physical Model | Stage 4 | All prior stages | Crystallographic databases, full physical simulation |

---

## Thematic Arcs

Projects that group naturally into multi-session curriculum arcs.

### Oscillator Biology Arc
Suggested order for students interested in neuroscience ↔ synthesis:
- *To be staged*

### Crystal Synthesizer Arc (Physics → Sound → Instrument → Ground Truth)
The scientific method made audible. Hypothesis → build → test → deepen → verify.
- [[Crystal Synthesizer]] Stages 1–5

### Shepard Tone Arc (Illusion → Mechanism → Signal Rate → Export)
The auditory impossible staircase, built from scratch across 5 stages.
- [[Shepard Tone Synthesizer]] Stages 1–5

**Note:** Stage 1 is the curriculum's most accessible entry point — Ableton only, no Max. The arc also seeds a separate **Auditory Illusions series** (Risset rhythm, continuity illusion, auditory streaming, aliasing) — to be developed as a standalone multi-session curriculum track.

### Inharmonicity Arc
Suggested order for students interested in physical modeling and timbre design:
- *To be staged*

### Granular & Particle Arc
Suggested order for students interested in cloud-based synthesis:
- *To be staged*

### Effects & Processing Arc
Suggested order for students interested in signal processing design:
- [[Compressor Design]] — dynamics, circular buffer at ~11ms, Gen~
- [[Retrospective Delay]] — phrase memory, circular buffer at ~1 sec, vanilla Max → Gen~ → RNBO

These two projects share the circular buffer primitive and can be done in either order. Together they form a natural pair: "The Living Signal" arc — the same mechanism operating at the amplitude scale and the phrase scale.

---

## Unstaged Projects

All current Projects/ entries awaiting staging. Sorted roughly by estimated accessibility (most accessible first — subject to revision as staging begins).

| Project | Stage | Energy | Natural Audience Entry |
|---|---|---|---|
| Compressor Design | mature | high | DAW-fluent; math-light entry |
| Retrospective Delay | growing | high | **Staged 2026-04** — see [[Retrospective Delay — Staging]] |
| Portamento and Physical Pitch Modeling | growing | high | DAW-fluent; physical intuition |
| Metric Modulation | growing | high | Musician-fluent |
| Shepard Tone Synthesizer | sprout | high | **Staged 2026-04** — see [[Shepard Tone Synthesizer — Staging]] |
| Meadows and Music — Leverage Points | sprout | — | Philosophy-first entry |
| Meadows and Music — Origin and Process | sprout | — | Philosophy-first entry |
| Action Potential Oscillator | sprout | high | Requires Stage 1 bio framing |
| Categorizing Inharmonicity | growing | high | Benefits from Compressor + APO |
| Granular Synthesis | — | — | TBD |
| Neural Granular Synthesis | growing | — | Benefits from APO |
| Particle Synthesis | growing | — | Benefits from Granular |
| Shimmer Cloud | seed | medium | Benefits from Granular + Particle |
| Biomechanical Synthesis | growing | — | Benefits from APO |
| Piano String Inharmonicity | growing | — | Benefits from Categorizing Inharmonicity |
| Wallpaper Groups | growing | high | Math-fluent entry |
| Crystal Synthesizer | sprout | high | **Staged 2026-04** — see [[Crystal Synthesizer — Staging]] |
| Quantum Synthesizer | growing | — | Benefits from Crystal + Bessel |
| Bessel Functions in Synthesis | growing | — | Math bridge; benefits from FM foundation |
| Preset Oracle | mature | — | Conceptual; less making-heavy |

---

## Identified Gaps

Knowledge students keep needing that no current project provides. Candidates for new foundation projects.

| Gap | Needed by | Candidate session |
|---|---|---|
| **Gen~ Foundations** | Crystal Synth Stage 1+ (and any future DSP project) | "Gen~ for Sound Designers" — standalone session, no physics, just patching |
| **RNBO Fundamentals** | Crystal Synth Stage 2+ | "RNBO: One Patch, Many Instruments" — portability as primary pedagogical hook |
| **Modal Synthesis** | Crystal Synth Stage 3 | Stageable from [[Bessel Functions in Synthesis]] palace entry |
| **DSP-to-hardware export** | Crystal Synth Stage 2+ | Covered in RNBO Fundamentals gap above |
| **M4L Audio Effect format** | Retrospective Delay Stage 1 | "Your First M4L Device" — minimal device, one parameter, plugin~/plugout~ |
| **JSUI Drawing Fundamentals** | Retrospective Delay Stage 4 | Could be a standalone session or a short pre-read; JSUI's drawing API isn't covered in any current project |

---

## Notes

- "Accessible" means: a music producer with DAW fluency and curiosity can enter with a clear on-ramp, even if the subject is technically deep.
- Projects are not strictly sequential — the arcs above are suggestions, not requirements. Cross-arc connections are often the richest.
- This map is a living document. Each staging session should update it.
