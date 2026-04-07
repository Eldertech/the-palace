---
title: Retrospective Delay — Staging
project: "[[Retrospective Delay]]"
loudon-live-status: planning
stage: seed
last-updated: 2026-04
links:
  - target: "[[Progressive Staging]]"
    type: couples-with
    label: pedagogical-method
---

## Alignment Record
*Decisions reached April 2026. Reference before any development session.*

**Implementation environment:** Vanilla Max/MSP → Max for Live Audio Effect (Stages 1–2), then Gen~ subpatcher within M4L (Stage 3), then JSUI interface layer (Stage 4), then RNBO codebox~ → VST/AU + H90 export (Stage 5).

**Stage count:** 5

**Migration philosophy:** Two deliberate moments of productive friction are built into the arc. First migration: vanilla Max → Gen~ (Stage 3). Second migration: Gen~ → RNBO (Stage 5). Both are pedagogical events, not technical chores. The friction is the lesson.

**Stage 3 framing:** "This is what was always happening inside the vanilla Max patch — Gen~ just makes it visible." Not "you've seen this before in the compressor." The compressor's circular buffer appears as a cross-domain reveal inside Stage 3, not as the primary frame.

**Session arc ratio:** Stages 1–2 and 4: ~70/30 making/framing. Stages 3 and 5: ~50/50, because the conceptual shift needs room.

**Audience entry assumptions:** Students can build basic Max/MSP patches — `phasor~`, `buffer~`, `plugin~`/`plugout~`. The M4L device format is covered in Stage 1's prerequisite resources if needed.

**Curriculum relationship:** Parallel to [[Compressor Design]], which uses a FILO circular buffer at ~11ms (sub-perceptual, RMS envelope). Same primitive, radically different time scale, completely different musical behavior. No dependency either direction — they reinforce each other, they don't scaffold each other. See `curriculum-map.md`.

---

## Stage 1 — "The Witness"
*Vanilla Max/MSP → Max for Live Audio Effect*
*~75 minutes | Making/Framing: 70/30*

### Session Arc

**Frame (15–20 min):** Open with the question: what if your instrument was always listening, and you could summon what it heard? Introduce the circular buffer as a witness — something that holds the last measure of everything without being asked. Introduce the phasor-as-clock: not a stepped counter, not random, but a continuous sweep from 0 to 1 that maps perfectly onto a buffer's length. Students leave the framing with one clear mental model: *the buffer is always full. You're choosing when to listen to it.*

**Make (40–45 min):** Build in vanilla Max. `buffer~` → `poke~` driven by `phasor~` for the write head. A second `phasor~` at the same rate, offset by a fixed half-note, drives `wave~` for the read head. Wrap in `plugin~`/`plugout~`, save as M4L Audio Effect. No gain control. No parameters. Just: the buffer witnesses, the read head plays back one measure ago.

**Reveal (10 min):** Students play into the device. The moment of recognition — hearing the whole phrase come back as a monolithic block, not as echoes. Not "echo echo echo." A ghost.

### Cross-Domain Moment
The circular buffer is the same mechanism as the CPU's ring buffer, an audio driver's I/O buffer, and the compressor's envelope detector. Same structure at three radically different time scales. What changes isn't the mechanism — it's how much time it holds. At 11ms: compression. At 1 second: memory.

### Reflecting Surface
*"What does it feel like to hear yourself one measure ago while you're still playing? Does it change what you play next?"*

### Hilaritas Checklist
- [x] Real thing to make — a working M4L Audio Effect that does something they've never had before
- [x] Tool that extends — phrase memory as a new performance dimension
- [x] Cross-domain moment — the buffer as universal primitive across time scales
- [x] Reflecting surface — the question changes how they play in the next session

### Prerequisites
Basic Max/MSP fluency: `phasor~`, `buffer~`, `plugin~`/`plugout~`. Students who need the M4L Audio Effect format can use:
> *"Explain how Max for Live Audio Effects receive and output audio using plugin~ and plugout~. I'm comfortable with Max/MSP patching but new to the M4L device format."*

### Materials
- `Artifacts/Retrospective Delay/session-1-implementation.md` — full patch spec with object list, connections, and key calculations

---

## Stage 2 — "The Séance"
*Vanilla Max, Performance-Ready*
*~75 minutes | Making/Framing: 80/20*

### Session Arc

**Frame (10 min):** The single-knob instrument. What does it mean to design around one gesture? The gain knob isn't adjusting an effect — it's controlling whether the past exists. Introduce the séance metaphor: performer as medium, buffer as ectoplasm, gain as conduit. At 0, the ghost is dormant. At 1, the ghost has full presence.

**Make (45–50 min):** Add the gain knob (multiplied onto the write amplitude). Parameterize the lag — quarter note, half note, whole note options via `pattr` or a radio toggle. Add a short crossfade at the loop boundary using overlapping phasors to prevent the click. Basic UI cleanup — nothing theatrical yet, just something that doesn't look like a default patch.

**Performance (15 min):** Live improvisation. Loudon performs first, showing the core technique: play a phrase, let silence trigger the summoning, layer new material over the ghost. Then students play.

### Cross-Domain Moment
Silence as the most powerful gesture. The performer does less to get more — the device rewards restraint. This inverts the usual relationship between input and output. Connect to [[Trickster]]: the subversive move is doing nothing. The crossfade isn't decoration — it's a musical decision. The seam between measures is audible, and how you handle it shapes the device's character.

### Reflecting Surface
*"When was the ghost helpful, and when did it fight you? What does it mean that silence is your most expressive gesture with this device?"*

### Hilaritas Checklist
- [x] Real thing to make — the device is now fully performable
- [x] Tool that extends — the séance gesture as a new improvisational technique
- [x] Cross-domain moment — silence as input, restraint as power, the Trickster move
- [x] Reflecting surface — reframes how they think about playing

### Prerequisites
Stage 1 complete. The gain knob and lag parameterization build directly on the Stage 1 patch.

### Materials
- *To be developed after Stage 1 delivery*

---

## Stage 3 — "The Grammar Behind the Spell"
*Port to Gen~*
*~90 minutes | Making/Framing: 50/50*

### Session Arc

**Frame (25 min):** Open with: "Everything the vanilla Max patch was doing, it was always doing at signal rate. Gen~ doesn't change the behavior — it removes the translation layer." Show the two patches side by side. In vanilla Max, `phasor~` → `poke~` → `peek~` involves Max's scheduler translating intentions into sample-rate operations. In Gen~, you write at sample rate directly. The patcher topology IS the algorithm, with no abstraction layer between intention and audio.

**Make (45 min):** Port the DSP core into a `gen~` subpatcher. `phasor` works identically. `buffer`, `poke`, `peek` all exist at sample rate. The structure maps 1:1 — but students feel the difference in how they think about what they're doing. Every object in the gen~ patcher is a sample-rate operation. There is no ambiguity.

**Reveal (15 min):** Show the compressor's circular buffer side by side. Same mechanism: phasor clock, write head, read head. Window is 500 samples — 11ms. Ask: "What's different?" The structure is identical. What's different is how much time it holds. At 11ms: invisible, heard as the compressor's character. At 44,100 samples (1 second): the buffer is the whole instrument.

### Cross-Domain Moment
"This is what was always happening." Gen~ reveals that Max was always doing signal-rate processing behind a message-passing interface. Connects to [[Frequency-Time Duality]] — the buffer makes time tangible, and Gen~ makes the mechanism visible. The migration is an act of seeing, not of learning something new. The compressor's buffer is the same shape, 100× smaller — same primitive, wildly different behavior.

### Reflecting Surface
*"What did you understand about the vanilla Max patch after you built it in Gen~ that you didn't understand before? What was always there, invisible?"*

### Hilaritas Checklist
- [x] Real thing to make — the same device, now in Gen~, ready for RNBO migration
- [x] Tool that extends — Gen~ as a thinking environment, not just a faster Max
- [x] Cross-domain moment — the compressor's 11ms buffer next to the delay's 1-second buffer
- [x] Reflecting surface — a question about what seeing reveals, not just what was built

### Prerequisites
Stages 1 and 2 complete — the Gen~ migration only lands if students built the vanilla version first. Students who need Gen~ orientation can use:
> *"Introduce me to gen~ in Max/MSP. I've built patches using phasor~, buffer~, poke~, and peek~. I want to understand how gen~ is different and when to use it."*

### Materials
- *To be developed after Stage 2 delivery*

---

## Stage 4 — "The Face"
*JSUI Animated Interface*
*~80 minutes | Making/Framing: 70/30*

### Session Arc

**Frame (15–20 min):** Playful Interface Design as philosophy. The interface is not decoration — it completes the instrument. A knob you *want* to touch is different from a knob you *have* to touch. Introduce the character concept: a spiritualist guide that has three distinct states — dormant (gain 0), awakening (gain rising), triumphant (gain peak). The character isn't labeling the knob. The character *is* the knob's meaning, made visible.

**Make (45 min):** Build the JSUI drawing code. Three character states mapped to gain value ranges. Students choose their own character — Loudon's cat/spiritualist guide is the example, not the requirement. JSUI approach (real-time vector drawing) rather than extracted animation frames, for portability and teachability.

**Reveal (15 min):** Play the device with the character watching. See if the performance changes.

### Cross-Domain Moment
A UI designer and a DSP engineer are solving the same problem: how does the system communicate its internal state to the person interacting with it? The character is an expressive version of a meter. Meters show state. Characters *embody* state. The difference is emotional bandwidth. Connect to [[Playful Interface Design]].

### Reflecting Surface
*"Did you turn the knob differently when the character was watching? What does that say about the relationship between interface and intention?"*

### Hilaritas Checklist
- [x] Real thing to make — an instrument that's theatrical to operate
- [x] Tool that extends — JSUI as a new creative surface
- [x] Cross-domain moment — interface design and DSP as the same problem of communicating state
- [x] Reflecting surface — a question that gets immediately tested in performance

### Prerequisites
Stage 2 complete (the device needs to be performable before the interface is worth building). Basic JavaScript helpful but not required — JSUI's drawing API is learnable within the session.

### Materials
- *To be developed after Stage 3 delivery*

---

## Stage 5 — "The Portal"
*RNBO → VST/AU + H90 Export*
*~90 minutes | Making/Framing: 50/50*

### Session Arc

**Frame (20–25 min):** RNBO's position in the ecosystem — not a replacement for Gen~, but a bridge. The export pipeline: what does it mean for a device to escape its container? Introduce the two targets: the H90 (hardware, embedded, no DAW) and VST/AU (software, DAW-agnostic, no Max). Both are the same algorithm running in radically different contexts. What travels: the DSP, the parameter names, the patch behavior. What stays behind: the JSUI interface, the M4L-specific context.

**Make (45 min):** Port Gen~ → RNBO codebox~. The signal-rate paradigm is already established from Stage 3 — this migration is conceptually smoother than Stage 3's. Syntax differs but architecture is identical. Export VST/AU. Export to H90.

**Reveal (15 min):** Load the VST in a different DAW. Load the RNBO patch on the H90. The device is free.

### Cross-Domain Moment
[[Boundary-Crossing Instruments]] — the device's identity persists across containers. What makes it "the Retrospective Delay" is not the platform. It's the algorithm and the gesture. The séance can happen in Ableton, in Logic, in hardware, in a plugin chain you didn't design.

### Reflecting Surface
*"You built something that now lives outside Max. Does it feel like the same instrument? What traveled with it, and what stayed behind?"*

### Hilaritas Checklist
- [x] Real thing to make — a deployable VST and an H90 patch
- [x] Tool that extends — the RNBO export pipeline as creative infrastructure
- [x] Cross-domain moment — identity persisting across containers, the instrument as algorithm not application
- [x] Reflecting surface — a question about what an instrument actually is

### Prerequisites
Stage 3 complete. Basic familiarity with RNBO helpful — students who need orientation can use:
> *"Introduce me to RNBO in Max/MSP. I've built a working patch in gen~. I want to understand how RNBO differs from gen~ and how to use it to export as a VST and to hardware targets like the Eventide H90."*

### Materials
- *To be developed after Stage 4 delivery*
