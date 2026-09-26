---
title: Shepard Tone Synthesizer — spec — Loudon Live sessions
born: 2026-09-25
links:
  - target: "[[Shepard Tone Synthesizer]]"
    type: connects-to
    label: sessions-for
  - target: "[[Progressive Staging]]"
    type: couples-with
    label: pedagogical-method
  - target: "[[Loudon Live]]"
    type: connects-to
  - target: "[[Signal-Rate CV Architecture]]"
    type: connects-to
  - target: "[[Portamento and Physical Pitch Modeling]]"
    type: connects-to
  - target: "[[Piano String Inharmonicity]]"
    type: connects-to
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
forward_vector: I hold the Loudon Live session design for each move in the Shepard Tone Synthesizer's plan — the two already taught-ready and the three ahead — so whoever builds a move can teach it without re-deriving the session. The plan itself lives in the scroll; I hold only what a session needs.
---

# Shepard Tone Synthesizer — spec — Loudon Live sessions

The session designs for the moves in the plan on [[Shepard Tone Synthesizer — scroll]]. The plan says what comes next and why; this says how each move is taught on [[Loudon Live]]. The first two moves are designed and have proofs behind them; the three ahead carry their scope, and each gets its full design when it comes up. The project-wide decisions (the Escher anchor, the 85/15 making-to-framing ratio, the audience) are in the scroll's Standing Orders.

**Session choices decided in April 2026**, when the arc was designed:
- The environment steps up with the sessions: Ableton Live for the illusion, vanilla Max for the mechanism, Gen~ for the glide and the timbre, RNBO for the portal.
- The illusion session uses Ableton alone — a MIDI Effect Rack of stacked Pitch devices and an AutoFilter as the Shepard bandpass. No Max.
- The illusion session opens with Meld's built-in Shepard tone, before we build our own.
- Its reflecting surface is the auditory barber pole question, with seeds (below).

*The ladder stands* (Loudon, 2026-09-25). Proofs can be made in any tool — the illusion's drone was rendered in Python and the mechanism prototyped in the browser — and the code made in one tool informs how the build is made in the next. The Max, Gen~ and RNBO builds need Loudon present, so they happen in live sessions; the steward keeps making proofs and preparing each session meanwhile.

---

## The illusion
*"Escher's Impossible Staircase in Sound" · the first move · proofs made, session not yet built · a session of about 60–75 minutes*

### Session Arc

**Experience (≈5 min)**
Open Meld. Play the Shepard tone. No framing first — the illusion does its own setup. Participants hear infinite ascent before they know what it is.

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
Return to Meld. What's the same? What does Meld do that your version doesn't yet? This becomes the natural step toward the mechanism — Meld is doing something under the hood that the MIDI Effect Rack can't.

**Reflecting Surface**
*"This is an auditory barber pole. What other visual illusions could you move into the audio domain?"*

Seeds (show these — don't explain, let participants sit with them):
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
DAW fluency only. No Max, no coding, no synthesis theory. Participants with any Ableton experience can enter directly.

### Prerequisite Resources
None required. Participants who want deeper context on psychoacoustics before the session can ask an AI: *"Explain the Shepard tone illusion — how does octave stacking and amplitude shaping create the perception of infinite pitch ascent?"*

### Materials
- [session-1-interactive.html](session-1-interactive.html) — Escher frame + mechanism visualization + Ableton build guide + reflecting surface seeds

---

---

## The mechanism
*The second move · vanilla Max · a browser prototype and rendered variants made, the Max patch not yet built*

Build the octave stacker as a Max patch and see what was invisible in the illusion: simple oscillators, one global filter. Neighbor: [[Signal-Rate CV Architecture]].

**Two design choices, granted 2026-06-05:**
- *How it climbs* → **step** (the ASCENT-FIRST and STEP-AND-SHOW grants). The first motion on top of the still drone is **discrete pitch-class steps**, not a continuous glide. The glide is held back for its own move, so this session isolates the bare fact that stepping the pitch class up by semitones already sounds like endless ascent.
- *How it wraps* → **show** (the STEP-AND-SHOW grant). The wrap seam is **briefly exposed**, not hidden. When the stack cycles back to its starting register, the teaching version lets the seam be heard and seen for a moment, so participants see the finite machine behind the infinite perception — the Escher staircase with one edge lit. (GLIDE-AND-HIDE, which would have smoothed the climb and hidden the seam, was turned down to keep the mechanism legible.) Schematic: `_ops/stigmergy/app/src/components/trickster/schematics/ShepardStage2Staircase.jsx`.

**Materials**
- [session-2-interactive.html](session-2-interactive.html) — the interactive prototype, shipped with the variant batch on 2026-06-25

---

## The glide
*The third move · Gen~ · scope only, not yet designed · first renders made 2026-09-15*

Monophonic portamento at signal rate. All the octaves glide together as one unit — the key design insight from the entry. Neighbor: [[Portamento and Physical Pitch Modeling]].

**Renders so far** (`proofs/`, 2026-09-15): glides at 120, 450 and 1200 ms, a zero-time step for comparison, an endless glissando, and one with the voices out of sync (`2026-09-15-stage3-broken-async-450ms.wav`) — where the illusion breaks, and the session's best argument for lockstep.

---

## The timbre
*The fourth move · Gen~ · scope only, not yet designed*

Per-voice bandpass filters, key-tracked, so the timbre varies across the octave stack. Neighbor: [[Piano String Inharmonicity]].

---

## The portal
*The fifth move · RNBO · scope only, not yet designed*

VST/AU export, then microtuning experiments: what happens to the illusion outside equal temperament? Neighbors: [[Kuramoto Coupling]], [[Shepard Tone Synthesizer#Theory — Octave Equivalence]].
