---
title: Shepard Tone Synthesizer — Staging
born: 2026-04-21
loudon-live-status: planning
links:
  - target: "[[Shepard Tone Synthesizer]]"
    type: connects-to
    label: staging-of
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
  - target: "[[Loudon Live]]"
    type: connects-to
  - target: "[[Octave Equivalence]]"
    type: connects-to
  - target: "[[Piano String Inharmonicity]]"
    type: connects-to
  - target: "[[Portamento and Physical Pitch Modeling]]"
    type: connects-to
  - target: "[[Signal-Rate CV Architecture]]"
    type: connects-to
forward_vector: I hold the Loudon Live staging plan for the Shepard Tone Synthesizer — the progressive-revelation stage sequence pairing each synth stage with its Octave Equivalence theory section — so the parent project's steward can advance it without re-deriving the arc.
---

# Shepard Tone Synthesizer — Staging

Someone reading this file and [[Shepard Tone Synthesizer]] has everything needed to build and present every stage.

---

## Alignment Record
*Decisions reached in Phase 2 dialogue. Reference before any development session.*

| Decision | Choice |
|---|---|
| Implementation environment | Ableton Live (Stage 1) → vanilla Max (Stage 2) → Gen~ (Stages 3–4) → RNBO (Stage 5) |
| Stage 1 scope | Ableton MIDI Effect Rack with stacked Pitch devices + AutoFilter as Shepard bandpass. No Max. |
| Session arc ratio | ~85% making / ~15% framing. Framing is Escher-led. |
| Cross-domain anchor | Escher's impossible staircase — a finite system, infinite perceived motion. |
| Opening beat | Demonstrate Meld synthesizer's built-in Shepard tone *before* building custom version. |
| Reflecting surface | "This is an auditory barber pole. What other visual illusions could you move into the audio domain?" — with seeds. |
| Audience | Autodidact Polymaths — DAW-fluent music producers. No Max, no coding, no synthesis theory required for Stage 1. |
| Curriculum position | Most accessible entry point in the curriculum. Zero prerequisites. |

---

## The Arc

| Stage | Environment | Core Concept | Question answered |
|---|---|---|---|
| 1 — The Illusion | Ableton only | Octave stacking + global bandpass = infinite ascent | What is the Shepard illusion and how do you make it? |
| 2 — The Mechanism | Vanilla Max | Build the octave stacker explicitly | What was invisible in Stage 1? |
| 3 — The Glide | Gen~ | Monophonic portamento — all voices glide as a unit | Why does synchrony preserve the illusion? |
| 4 — The Timbre | Gen~ | Per-voice key-tracked filters | How does timbre vary across the octave stack? |
| 5 — The Portal | RNBO | VST/AU export, microtuning experiments | What happens to the illusion outside equal temperament? |

---

## Stage 1: The Illusion
*"Escher's Impossible Staircase in Sound"*
*[[Loudon Live]] Session — estimated 60–75 minutes*

### Session Arc

**Experience (≈5 min)**
Open Meld. Play the Shepard tone. No framing first — the illusion does its own setup. Students hear infinite ascent before they know what it is.

**The Escher Frame (≈10 min)**
Show Escher's impossible staircase (open `Projects/Shepard Tone Synthesizer/session-1-interactive.html`). Name the structural identity: a finite system, infinite perceived motion. The physical reality cycles; the perception climbs forever. Barber pole, Escher staircase, Shepard tone — same structure, different materials. The HTML visualizes the mechanism before anyone builds anything.

**Build it in Ableton (≈35–40 min)**
1. Create a MIDI Effect Rack
2. Add Pitch devices at −48, −36, −24, −12, 0, +12, +24, +36, +48 semitones (9 voices spanning 8 octaves)
3. Load any instrument (Operator or Wavetable work well — simple timbres show the illusion most clearly)
4. Add an AutoFilter after the instrument in Bandpass mode
5. Set filter center ~500–800 Hz, moderate resonance, bandwidth wide (Q ~0.5–0.7)
6. Play ascending lines. Tune the filter until the illusion appears.
7. Experiment: what happens when the filter is too narrow? Too wide? What Q makes the illusion most convincing?

**Compare to Meld (≈10 min)**
Return to Meld. What's the same? What does Meld do that your version doesn't yet? This becomes the natural forward vector toward Stage 2 — Meld's implementation is doing something under the hood that the MIDI Effect Rack can't.

**Reflecting Surface**
*"This is an auditory barber pole. What other visual illusions could you move into the audio domain?"*

Seeds (show these — don't explain, let students sit with them):
- **Risset's accelerating rhythm** — tempo that climbs forever without arriving (the Shepard tone in the time domain)
- **Digital aliasing as wagon wheel** — frequencies above Nyquist fold back and appear lower, just as spoked wheels appear to spin backward when undersampled
- **The continuity illusion** — a tone that "continues" through noise that covers it, like a Kanizsa triangle edge the brain draws in
- **Auditory streaming** — the same sequence of tones heard as one melody or two depending on attention (Rubin's vase in sound)

### Hilaritas Checklist
- [x] Real thing to make — a working Ableton rack that produces the Shepard illusion
- [x] Tool that extends — MIDI Effect Rack pitch stacking is at the edge of most producers' Ableton toolkit
- [x] Cross-domain moment — Escher's staircase as sound; finite system, infinite perception
- [x] Reflecting surface — auditory barber pole question with four seeds

### Prerequisites
DAW fluency only. No Max, no coding, no synthesis theory. Students with any Ableton experience can enter directly.

### Prerequisite Resources
None required. Students who want deeper context on psychoacoustics before the session can ask an AI: *"Explain the Shepard tone illusion — how does octave stacking and amplitude shaping create the perception of infinite pitch ascent?"*

### Materials
- [session-1-interactive.html](Shepard%20Tone%20Synthesizer/session-1-interactive.html) — Escher frame + mechanism visualization + Ableton build guide + reflecting surface seeds

---

## Stages 2–5
*To be developed in subsequent staging sessions.*

### Stage 2: The Mechanism (Vanilla Max)
Build the octave stacker as a Max patch — see what was invisible in Stage 1. Simple oscillators, global filter. Palace connection: [[Signal-Rate CV Architecture]].

**Two design knobs settled (granted 2026-06-05):**
- *How it climbs* → **STEP** (ASCENT-FIRST + STEP-AND-SHOW grants). The first motion added on top of the Stage 1 drone is **discrete pitch-class steps**, not a continuous glide. The glide is deliberately held back for Stage 3 ("The Glide"), so Stage 2 isolates the bare fact that stepping the pitch class up by semitones produces apparent endless ascent.
- *How it wraps* → **SHOW** (STEP-AND-SHOW grant). The wrap seam is **briefly exposed**, not hidden. When the stack cycles back to its starting register, the teaching version lets the seam be momentarily audible/visible so students see the finite mechanism behind the infinite perception — the Escher staircase with one edge lit. (The alternative, GLIDE-AND-HIDE, would have smoothed the climb and concealed the seam; rejected so the mechanism stays legible.) Schematic: `_ops/stigmergy/app/src/components/trickster/schematics/ShepardStage2Staircase.jsx`.

### Stage 3: The Glide (Gen~)
Monophonic portamento at signal rate. All octaves glide together as a unit — the key design insight from the entry. Palace connection: [[Portamento and Physical Pitch Modeling]].

### Stage 4: The Timbre (Gen~)
Per-voice bandpass filters, key-tracked. Timbre varies across the octave stack. Palace connection: [[Piano String Inharmonicity]].

### Stage 5: The Portal (RNBO)
VST/AU export. Microtuning experiments — what happens to the illusion outside equal temperament? Palace connection: [[Kuramoto Coupling]], [[Octave Equivalence]].
