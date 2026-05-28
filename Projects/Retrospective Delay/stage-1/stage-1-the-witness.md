---
title: "Retrospective Delay — Stage 1: The Witness"
project: "[[Retrospective Delay]]"
stage_index: 1
stage_label: "The Witness"
loudon-live-status: drafting
stage: seed
tier_vocabulary: { sketch: Sketch, study: Study, piece: Piece }
last-updated: 2026-05-27
links:
  - target: "[[Retrospective Delay]]"
    type: spawned
    label: stage-1-draft
  - target: "[[Retrospective Delay — Staging]]"
    type: deepens
    label: fills-in-stage-1
  - target: "[[Progressive Staging]]"
    type: couples-with
    label: pedagogical-method
  - target: "[[Compressor Design]]"
    type: connects-to
    label: cross-domain-buffer
  - target: "[[Frequency-Time Duality]]"
    type: deepens
    label: time-as-spatial
  - target: "[[The Shop]]"
    type: connects-to
    label: mockup-imagery-spec
forward_vector: "I want to be the smallest complete Retrospective Delay — a working M4L Audio Effect that teaches the always-recording circular buffer as a witness and ends with one knob. No character animation, no Dub Lineage framing yet. The student leaves with something they can play, and with a mental model of buffer-as-witness that the later stages will extend, never replace."
---

# Stage 1 — The Witness

*BUFFER-MECHANISM-FIRST. Vanilla Max/MSP wrapped as a Max for Live Audio Effect. ~75 minutes. Making / Framing ratio 70/30.*

This is the **smallest possible Retrospective Delay** that still does the surprising thing: a one-measure circular buffer that is **always recording**, with one gain knob that decides whether the past one measure ago re-enters the present. No character animation (Stage 4 builds that). No Dub Lineage framing (Stage 2 onward opens that). No Gen~ migration yet (Stage 3 reveals it). The student leaves Stage 1 with a finished M4L Audio Effect and one clean mental model: **the buffer is the constant witness; the knob is your choice about whether to listen to it.**

## What This Stage Is and Isn't

**Is:** A complete, playable, useful M4L Audio Effect. A finished thing. A teaching moment about the circular buffer as a primitive. A device that does something the student has never had before — phrase-level temporal recall at a beat-aligned interval — and does it with one parameter.

**Isn't:** The full Retrospective Delay. There is no character animation. There is no séance framing (the gain knob exists, but it is the *gain knob*, not "the conduit to the ectoplasm"). There is no Gen~ port. There is no VST export. There is no cross-fade at the loop boundary (a single faint click at the measure boundary is acceptable for Stage 1 — Stage 2 makes it musical). The instrument is monaural in Stage 1; stereo widens later.

These omissions are intentional. Stage 1 isolates the **buffer-mechanism teaching moment** so the student feels what a circular buffer with a delayed read tap actually *is*, without that feeling being mixed with character-design feelings or cultural-framing feelings. Stage 2 layers performance gestures and the séance metaphor on top. Stage 3 reveals what was always happening at sample rate. Stage 4 gives the device a face. Stage 5 sets it free.

## Forward Vector For This Stage

I want a student who has built basic Max patches (`phasor~`, `buffer~`, a couple of objects between them) to leave a single 75-minute session with:

1. A working M4L Audio Effect on disk, loaded in Ableton, doing the right thing.
2. The mental model that a circular buffer is a witness — always recording, not gated by anything the student does.
3. The mental model that the read head is a fixed lag behind the write head — *the past played back in present time*.
4. The instinct that the gain knob is **not an effect strength control**; it is a *decision about whether the past is audible*.
5. One concrete question they take into Stage 2: *what would I want to do with this if it had performance gestures?*

If they leave with even one of those four mental models clean, Stage 1 worked.

## Session Arc — 75 minutes

| Block | Duration | Activity |
|-------|---------:|----------|
| Frame | 15 min | Setup the question; introduce the buffer-as-witness mental model |
| Make | 45 min | Build the patch in vanilla Max; wrap as M4L Audio Effect; save |
| Reveal | 10 min | Play into the device; hear the ghost; observe the always-recording behavior |
| Reflect | 5 min | One question; one hand-off thought toward Stage 2 |

### Frame (15 min)

Open with one question to the student: *what if your instrument was always listening, without being asked, and you could choose when to summon what it heard?* Let that sit briefly.

Introduce the **circular buffer** with no audio context first. Draw it on a whiteboard or screen as a closed loop of N cells. Say: at every audio sample, one cell is overwritten. The write head sweeps around the loop at a constant rate. After N samples, the head returns to where it started and begins overwriting the oldest material. **The buffer is always full, and always being rewritten.** The buffer is not a recording you start. It is a witness that does not stop.

Now add the audio interpretation. If the loop holds one measure of audio at the current tempo, then the buffer at any instant contains *exactly the last measure of everything that was played into it*. The "past" is not in storage. The past is in the witness, and it is being erased in real time as the present is played.

Introduce the **read head** — a second tap into the same buffer, sitting at a fixed offset behind the write head. If the write head is at position $w$ and the read head is at position $w - L$ (modulo buffer length), then the read head is playing back what was written $L$ samples ago. If $L$ equals a half-note in samples, the read head is the **past, half a note ago, played back at present time**.

Close the frame with the **always-recording rule** stated cleanly: *there is no arming, no record button, no gate. The buffer is the constant witness. The performer's only choice is whether to listen to what the witness heard.*

### Make (45 min)

The vanilla Max patch in plain prose, before any code. The audio enters through `plugin~`. It is written into a `buffer~` of length one-measure-of-samples by a `poke~` whose write position is driven by a `phasor~` ramped from 0 to buffer-length at the rate of one cycle per measure. A second `phasor~` runs at the same rate, offset by a fixed lag (a half-note in samples), and drives a `wave~` (or `peek~` followed by interpolation) that plays back the buffer's contents at that lagged position. The read head's output is multiplied by a **gain** value sourced from a single `live.dial` parameter exposed to the M4L UI. The result is summed back with the dry input via `plugout~`.

#### Object-by-Object Patch Spec

```
[plugin~ 1 2]
   |
   +─── [poke~ ret-delay-buffer 1 1] ─── driven by [phasor~ measure-rate] * [buffer-length-samples]
   |
   |    [phasor~ measure-rate]
   |       |
   |       +── [+~ lag-samples] ── [wrap~ 0 buffer-length-samples] ── [wave~ ret-delay-buffer]
   |                                                                       |
   |                                                                       +── [*~ gain] ──┐
   |                                                                                       |
   +───────────────────────────────────────────────────────────────────────────────────────+
                                                                                           |
                                                                          [plugout~ 1 2] ──┘
[buffer~ ret-delay-buffer <buffer-length-samples> 1]
[live.dial gain @range 0 1 @init 0]
```

Or as a flat object list:

- `plugin~ 1 2` — Live's audio I/O, two channels in, two channels out (Stage 1 is monaural — duplicate left to both outputs at `plugout~`).
- `buffer~ ret-delay-buffer <N> 1` — circular buffer, one channel, N samples long, where N = `samplerate * (60 / live.bpm) * 4` for a one-measure 4/4 buffer.
- `phasor~ <measure-rate>` — write head clock, where `measure-rate = live.bpm / 60 / 4` Hz for one cycle per 4/4 measure.
- `*~ <buffer-length-samples>` — scale the phasor's 0..1 ramp to 0..N sample positions.
- `poke~ ret-delay-buffer 1 1` — write the input sample at the current write position.
- A second `phasor~` at the same `measure-rate`, output offset by the read-head lag in normalized units (`lag-samples / buffer-length-samples`), wrapped to [0, 1), then scaled.
- `wave~ ret-delay-buffer` — read the buffer at the read-head position with interpolation.
- `*~ <gain>` — multiply the read head's output by the gain knob's value.
- `+~` — sum the dry input and the gain-scaled read head.
- `plugout~ 1 2` — Live audio output.
- `live.dial gain` — single parameter exposed to the M4L UI; range 0..1, initial 0, scripting name `gain`.

#### Key Calculations

- **Buffer length in samples (one measure 4/4):**
  $N = f_s \cdot \dfrac{60}{\text{BPM}} \cdot 4 \quad \text{(samples)} = \text{sample-rate} \cdot \dfrac{60}{\text{tempo in BPM}} \cdot 4$

  At 48 kHz and 120 BPM, $N = 48000 \cdot 0.5 \cdot 4 = 96{,}000$ samples = 2.0 seconds.

- **Read-head lag in samples (half note default):**
  $L = \dfrac{N}{2} \quad \text{(samples)} = \dfrac{\text{buffer-length-samples}}{2}$

  At 48 kHz and 120 BPM, $L = 48{,}000$ samples = 1.0 second.

- **Measure rate (write phasor frequency):**
  $f_{\text{measure}} = \dfrac{\text{BPM}}{60 \cdot 4} \quad \text{(Hz)} = \dfrac{\text{tempo in BPM}}{60 \cdot \text{beats per measure}}$

  At 120 BPM in 4/4, $f_{\text{measure}} = 120 / 240 = 0.5$ Hz.

- **Read-head phasor offset (normalized 0..1):**
  $\phi_{\text{read}} = \phi_{\text{write}} - \dfrac{L}{N} \quad \pmod{1}$
  $\quad = \text{write-phase} - \text{lag-as-fraction-of-buffer} \quad (\text{modulo 1})$

Show both forms when the equations land — symbols and named-variable English side by side (palace rule: equations always show their worded form too).

#### Stage 1 Defaults — What Is Fixed

| Parameter | Stage 1 default | Why fixed in Stage 1 | Where it becomes variable |
|-----------|-----------------|----------------------|---------------------------|
| Buffer length | One measure (4/4) | A measure is the smallest unit that gives a phrase recall; multi-measure choices muddy the witness mental model | Stage 2 — parameterize as quarter/half/whole-note multiples |
| Read-head lag | Half-note behind write head | Half-note is the most musically obvious lag; the student hears displacement clearly | Stage 2 — quarter / half / whole-note radio toggle |
| Channel count | Monaural (input duplicated at output) | Stereo widens the mechanism for no Stage-1 learning gain | Stage 2 or Stage 4 — depending on character-pose stereo cues |
| Crossfade at measure boundary | None — the click is acceptable | The click teaches the student that the buffer loops; hiding it before they hear it is pedagogically dishonest | Stage 2 — overlapping phasor crossfade |
| Channel count exposed to UI | Just `gain` | One parameter is the whole instrument | Stage 2 adds lag selection; Stage 4 adds the character |

#### Save and Verify

Save the patch as `Retrospective Delay — Stage 1.amxd` in the student's M4L user library. In a fresh Ableton project, load the device on a track with a metronome and a dry MIDI instrument. Verify with three quick checks:

1. **Gain at 0 — no ghost.** Play a chord. Wait. Silence afterward. The witness is hearing, but the conduit is closed.
2. **Gain at 0.5, play one measure, then silence.** The previous measure plays back at half volume, exactly half a note later than it was played.
3. **Gain at 1, sustain a chord for two measures, then drop to silence.** The chord echoes a measure, then re-echoes (the buffer ate its own tail), then fades as the overwriting reaches it. The student hears how the buffer is overwritten by their own playing.

### Reveal (10 min)

Hand the student the device. Let them play. The point of this block is **not** to teach a performance gesture (Stage 2 does that). The point is the moment of recognition: *the device is monolithic in its playback*. The ghost is not echo-echo-echo. It is one phrase, played back as one block of audio, half a note late. The student should feel the difference between this and any tap-based delay they have used.

Hold space here. Do not rush past the moment. If the student says *"this is just a delay,"* ask them to set up the same effect in Ableton's Echo and demonstrate. They will find they cannot — Echo is taps; this is a phrase. The distinction is the teaching.

### Reflect (5 min)

One question, asked once: *"How is this device different from any delay you've used before?"*

Then one forward-pointing thought: *"In Stage 2, this same buffer will become an instrument — we'll parameterize the lag, smooth the loop boundary, and start to play silence as a gesture. But the witness mental model stays. Nothing we add will change what's underneath."*

## Cross-Domain Moment

The circular buffer is the same mechanism that runs inside the CPU's ring buffer, an audio driver's I/O buffer, and the compressor's envelope detector. The same primitive. **What changes across those contexts is not the mechanism — it is how much time it holds.**

| Context | Buffer length | What it does |
|---------|--------------:|--------------|
| Audio driver I/O ring | 256 samples (~5 ms) | Holds samples between hardware interrupt and software callback. Invisible. |
| Compressor envelope | ~500 samples (~11 ms) | Holds the recent past for RMS estimation. Heard as the compressor's *character*. |
| Stage 1 buffer | 96,000 samples (~2 s) | Holds the recent past for phrase recall. Heard as the *instrument itself*. |

This is the cross-domain moment for Stage 1: *the same mechanism becomes a different instrument at every time scale*. The teaching is light here — Stage 3 returns to it with full force when the student migrates to Gen~ and sees the compressor's buffer side by side with this one.

## Reflecting Surface

> *How is this device different from any delay you've used before? And what does it mean that the device is **always** recording, whether you asked it to or not?*

The second half of the question is the hand-off. Stage 2 builds on the answer.

## Hilaritas Checklist

- [x] **Real thing to make** — a working M4L Audio Effect, loadable in Ableton, doing something the student hasn't had before.
- [x] **Tool that extends** — phrase memory at the measure level as a new primitive in the student's vocabulary.
- [x] **Cross-domain moment** — the buffer-as-universal-primitive table; same mechanism, three time scales.
- [x] **Reflecting surface** — the device's *always-on* nature reframes what an effect can be; the question lands and hangs.

## Prerequisites

The student must be fluent in `phasor~`, `buffer~`, `poke~`, `wave~` (or `peek~`), and `plugin~`/`plugout~`. If the M4L Audio Effect device format is unfamiliar, give them this prerequisite prompt and have them spend ~15 minutes with another Claude before the session:

> *"Explain how Max for Live Audio Effects receive and output audio using plugin~ and plugout~. I'm comfortable with Max/MSP patching but new to the M4L device format. Walk me through the smallest possible M4L audio effect patch end-to-end."*

The session does not include this orientation in its 75 minutes.

## Materials

- This document — the Stage 1 framing, session arc, and reveal.
- `Projects/Retrospective Delay/stage-1/patch-spec.md` — the implementation spec (object list, connections, key calculations, defaults, the three verification checks). The Make block is built directly from it.
- `Projects/Retrospective Delay/stage-1/mockup-imagery-brief.md` — the Shop brief for the lesson's mockup interfaces and imagery (Maker's job: route through Specialists; this cycle SPECS the brief, does not dispatch).
- Anchor patch on disk: `Retrospective Delay — Stage 1.amxd` — to be authored by Loudon in a making session.

## Open Questions Surfaced By This Draft

1. **Where does the "always recording" idea live in the M4L UI surface?** The patch is always recording the moment it's loaded on the track. Should the device show this somehow — a faint indicator, a continuously-updating waveform of the last measure, anything? Or does showing it weaken the *witness* metaphor (the witness should not be visible; that's why it's a witness)? I lean toward *no indicator in Stage 1* — let the student feel the always-on nature through use, not through a UI affordance. But this is the kind of choice Stage 4 (the character) will revisit.
2. **Does the Stage 1 patch use `wave~` or `peek~`?** `wave~` interpolates; `peek~` does not. At one-measure buffer lengths, the difference is inaudible to most ears — but `peek~` is more transparent pedagogically (one sample, one lookup). I lean `wave~` with linear interpolation set explicitly, so the student sees the interpolation flag and understands what it does. This is small but worth surfacing.
3. **Should the prerequisite Max objects be reviewed in-session?** I scoped the prerequisites as homework. But 15 minutes of in-session `phasor~`/`buffer~` review would push the Make block from 45 min to 30 min, which is a tight build for new students. Loudon's call.
4. **Does Stage 1 land if the student has never written a beat-synchronous patch?** The measure-rate calculation assumes the student is comfortable with sample-rate-to-tempo conversion. If not, the Frame block needs to expand by ~5 min, which compresses the Make.

## Connection to Progressive Staging (PARALLEL-WEAVE)

Per the cycle-1 grant of `retrospective-delay-steward-004`, this stage does not drive edits to [[Progressive Staging]] and Progressive Staging does not drive this stage. We flag the relationship here for a future Weave to consider:

- The "additive complexity, never retroactive" principle is honored — Stage 2's gain-and-lag parameterization wraps Stage 1 cleanly; you can set the lag to fixed half-note and recover Stage 1 exactly.
- The "each stage teaches one concept" principle is honored — this stage teaches *always-recording circular buffer with one-knob gain*. Character animation, séance framing, Gen~ port are all explicitly deferred.
- The "implementation paradigm can shift at a stage boundary" principle hits at Stage 3 (Gen~). Stage 1 lives entirely in vanilla Max.

A future Weave may want to fold "stage isolates one mental-model module, not just one parameter" into Progressive Staging — Stage 1 isolates a mental model (witness, always-on, phrase-not-tap), not a parameter count.
