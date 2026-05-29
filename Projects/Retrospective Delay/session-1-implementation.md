# Retrospective Delay — Stage 1 Implementation
## "The Witness" — Vanilla Max/MSP → M4L Audio Effect

**Goal:** A working M4L Audio Effect that records one measure continuously and plays back what you played, one half-note ago. No gain control. No parameters. Just the mechanism.

---

## Key Calculations

**Buffer size in samples:**
```
buffer_size_samples = (60 / BPM) × beats_per_measure × sample_rate
```
At 120 BPM, 4/4, 44100 Hz: `(60/120) × 4 × 44100 = 88,200 samples`

**This is a problem.** Max's `buffer~` has a fixed size set at creation time. BPM can change. The cleanest Stage 1 solution is to over-provision the buffer (e.g., 4 seconds = 176,400 samples at 44.1kHz) and let the phasor determine how much of it gets used.

**Better:** Use `plugsync~` to get the M4L transport's measure-length phasor directly. This synchronizes to Live's tempo automatically and handles tempo changes. This is the approach used below.

---

## M4L Transport Sync

`plugsync~` outputs several synchronized phasors. The one we want:

- **Outlet 3** (0-indexed): a `0→1` phasor that sweeps once per measure, phase-locked to Live's transport. This is our write head clock.

No BPM math needed. The phasor sweeps 0→1 over exactly one measure, regardless of tempo.

---

## Object List

| Object | Arguments | Purpose |
|---|---|---|
| `plugin~` | *(none)* | Receive audio from Live track (Left inlet = audio in) |
| `plugsync~` | *(none)* | Get transport phasors. Outlet 3 = measure phasor |
| `buffer~` | `delay_buf 4000` | 4-second buffer (over-provisioned). Name: `delay_buf` |
| `poke~` | `delay_buf` | Write audio to buffer at index driven by write head |
| `wave~` | `delay_buf` | Read audio from buffer using normalized 0–1 index |
| `!-` | `0.5` | Subtract write phasor from 0.5 to create read head offset |
| `%~` | `1.` | Wrap read phasor into 0–1 range (handles negative values) |
| `plugout~` | *(none)* | Send audio back to Live |

---

## Signal Flow

```
[plugin~]
    |
    | (audio signal)
    |
[poke~ delay_buf]  ←——— [plugsync~] outlet 3 (write phasor 0→1)
                               |
                               | (same phasor)
                               ↓
                         [!- 0.5]       ← subtract: creates half-note lag
                               |
                         [%~ 1.]        ← wrap negative values back into 0–1
                               |
                         [wave~ delay_buf]  ← reads from buffer
                               |
                         [plugout~]
```

**What `!- 0.5` does:** If the write head is at position 0.7, the read head is at `0.5 - 0.7 = -0.2`. After wrapping with `%~ 1.`, that becomes `0.8`. The read head is 0.5 of a measure behind the write head — exactly a half note.

**Why `%~` and not `wrap~`:** Both work. `%~` is more explicit about what's happening: modulo 1 wraps the phase back into range. Either is correct.

---

## `poke~` Index Scaling

`poke~` takes a **sample index** (integer), not a normalized 0–1 value. You need to scale the phasor by the buffer size in samples.

`wave~` takes a **normalized 0–1 value** directly — no scaling needed.

So the full connection for the write head is:

```
[plugsync~] outlet 3
    |
    | (phasor 0→1)
    ↓
[* 176400]           ← scale to buffer size in samples (4 sec × 44100)
    |
    ↓
[poke~ delay_buf]   ← inlet 1 = audio, inlet 2 = index
```

Audio from `plugin~` goes to `poke~` inlet 1. The scaled index goes to inlet 2.

For `wave~`, the read phasor (after `!- 0.5` and `%~ 1.`) connects directly — no scaling.

---

## Complete Patch (Text Description)

```
[plugin~] → left inlet of [poke~ delay_buf]

[plugsync~]:
  outlet 3 → [* 176400] → right inlet of [poke~ delay_buf]
  outlet 3 → [!- 0.5] → [%~ 1.] → [wave~ delay_buf] → [plugout~]
```

That's the entire patch. Eight objects. One measure of temporal memory.

---

## M4L Wrapping Notes

1. Save as an **Audio Effect** device (`.amxd`), not a MIDI Effect or Instrument
2. `plugin~` / `plugout~` work automatically in M4L Audio Effects — no additional configuration
3. `plugsync~` only works inside a live M4L device with transport running — test with Live's transport started
4. The device passes audio dry + wet simultaneously (wet = the delayed phrase). In Stage 2 you'll add gain control to blend them. For Stage 1, output is wet only — just the ghost.

---

## Teaching Notes

**The moment to linger on:** The phasor sweep is continuous and endless. The buffer is always full. This is not a loop that starts when you press record — it's a window into the recent past that's always open. The read head is always listening to one-measure-ago. Even if you're not playing, it's playing back whatever was in the buffer last.

**Anticipated confusion:** Students will expect to hear their input immediately. They won't — they'll hear themselves from one half-note ago. If they play a phrase, stop, and wait, the ghost will continue. This is the moment of surprise. Don't rush past it.

**The crossfade problem:** At Stage 1, there will be a click at the loop boundary (every measure, when the phasor wraps from 1 back to 0). This is intentional — name it, acknowledge it, and tell students it gets solved in Stage 2. It's a real DSP artifact and students should hear it and understand what causes it.

---

## What Stage 2 Adds

- Gain knob → multiplied onto `plugin~` signal before `poke~` (controls write amplitude, which determines ghost presence)
- Lag parameter → replaces the hardcoded `0.5` in `!- 0.5` with a `pattr`-connected number
- Loop crossfade → a second phasor slightly offset, windowed with a raised cosine, blended at the boundary
