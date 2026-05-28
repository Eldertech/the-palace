---
title: "Retrospective Delay — Stage 1 Patch Spec"
project: "[[Retrospective Delay]]"
stage_index: 1
type: spec
last-updated: 2026-05-27
links:
  - target: "[[Retrospective Delay]]"
    type: spawned
    label: stage-1-implementation
  - target: "[[stage-1-the-witness|Stage 1 — The Witness]]"
    type: deepens
    label: implementation-detail
---

# Stage 1 — Patch Spec (Vanilla Max → M4L Audio Effect)

This is the working spec the **Make** block of [[stage-1-the-witness|Stage 1]] builds against. Object-by-object, connection-by-connection, with the key calculations isolated so the instructor can re-derive them with the student at the board.

## Top-Level Patch

```
[plugin~ 1 2]
   |
   +─── audio in (mono, take left only) ──> [poke~ ret-delay-buffer 1 1]
   |
   |                                                            ^
   |                                                            |
   |                                  [phasor~ measure-rate] ── *N ──┘  (write phase)
   |
   |    [phasor~ measure-rate] ── [+~ lag-fraction] ── [wrap~ 0. 1.] ── *N ── [wave~ ret-delay-buffer]
   |                                                                                       |
   |                                                                                       |
   |                                                                                  [*~ gain]
   |                                                                                       |
   +─────── dry path ──────────────────────────────────────────────────────────── [+~] ────┤
                                                                                           |
                                                                                  [plugout~ 1 2]

[buffer~ ret-delay-buffer <buffer-length-samples> 1]
[live.dial gain @range 0. 1. @init 0. @scriptingname gain]
```

## Object List

| Object | Args | Role |
|--------|------|------|
| `plugin~ 1 2` | one channel in, two channels out (mono in, stereo dupe out) | Live audio I/O |
| `buffer~ ret-delay-buffer N 1` | name, length-in-samples, channels | The circular witness |
| `phasor~ measure-rate` | freq | Write head clock (0→1 once per measure) |
| `*~ N` | N = buffer length samples | Scales write phasor to sample-index range |
| `poke~ ret-delay-buffer 1 1` | buffer name, channel, value-input-mode | Writes input sample at write index |
| `phasor~ measure-rate` (second) | same freq | Read head clock |
| `+~ lag-fraction` | lag/N | Offsets read phasor behind write phasor |
| `wrap~ 0. 1.` | range | Keeps phase in [0,1) after offset |
| `*~ N` | N | Scales read phasor to sample-index range |
| `wave~ ret-delay-buffer` | buffer name; interp on | Plays buffer at given sample index |
| `*~ gain` | signal arg from `live.dial` | Multiplies read tap by gain knob |
| `+~` | — | Sums dry input + wet read tap |
| `plugout~ 1 2` | mono in, stereo out (duplicate) | Live audio output |
| `live.dial gain` | range 0..1, init 0, scriptingname `gain` | The sole performer-facing parameter |

## Key Calculations

Stage 1 fixes tempo handling to one-measure-of-4/4 at the current Live tempo.

**Buffer length in samples:**

$N = f_s \cdot \dfrac{60}{\text{BPM}} \cdot 4$
*sample-rate $\cdot$ seconds-per-beat $\cdot$ beats-per-measure*

At 48 kHz, 120 BPM: $N = 48000 \cdot 0.5 \cdot 4 = 96{,}000$ samples ≈ 2.0 s.

**Write-phasor frequency (cycles per second):**

$f_{\text{measure}} = \dfrac{\text{BPM}}{60 \cdot 4}$
*tempo-in-BPM over (seconds-per-minute times beats-per-measure)*

At 120 BPM 4/4: $f_{\text{measure}} = 0.5$ Hz.

**Read-head lag in samples (half-note default):**

$L = \dfrac{N}{2}$
*buffer-length-samples divided by two*

**Read-phasor normalized offset:**

$\phi_{\text{read}}(t) = \big(\phi_{\text{write}}(t) - \tfrac{L}{N}\big) \bmod 1$
*read-phase equals write-phase minus lag-as-fraction-of-buffer, taken modulo one*

The same equations in named-variable English (palace dual-form rule):

- *Buffer length in samples = sample-rate × (60 / tempo) × beats-per-measure*
- *Write-phasor frequency in hertz = tempo / (60 × beats-per-measure)*
- *Read lag in samples = buffer length in samples / 2*
- *Read phase = (write phase − read lag ÷ buffer length) modulo 1*

## BPM Sourcing

The patch must read Live's current tempo, not assume 120 BPM. The cleanest path is `live.thisdevice` → `live.api/path live_set` → query `tempo` → bang on device-load and on tempo change, recompute `N` and rebuild `buffer~` with the new size. For Stage 1 simplicity we **freeze the buffer size at device load** and document the tempo-change rebuild as a Stage 2 affordance.

If the student is in a session whose tempo changes mid-set, Stage 1 will sound wrong after the change — that is acceptable; it is on the *Open Questions* list for Stage 2.

## The Three Verification Checks

The **Reveal** block uses these in order:

1. **Gain at 0 — no ghost.** Play a chord; release. Silence afterward. Witness is recording, conduit is closed.
2. **Gain at 0.5, play one measure, then silence.** Previous measure plays back at half volume, half a note later than played.
3. **Gain at 1, sustain a chord for two measures, then drop to silence.** Chord echoes once at full level; on the next loop it has been overwritten by the next measure of input.

Each check is a calibration on a different aspect of *always-recording*: (1) gain-as-conduit, (2) lag-as-temporal-shift, (3) overwriting-as-erasure.

## File Layout

Final deliverables produced by this stage:

```
~/Music/Ableton/User Library/Presets/Audio Effects/Max Audio Effect/
   Retrospective Delay — Stage 1.amxd        ← the device, saved from Max
```

Adjacent in palace:

```
Projects/Retrospective Delay/stage-1/
   stage-1-the-witness.md     ← the session-arc draft
   patch-spec.md              ← this file
   mockup-imagery-brief.md    ← the Shop brief
```
