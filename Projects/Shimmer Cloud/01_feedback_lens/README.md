# Model 01 — Feedback Lens

The first model. A single moving pitch-shifter in a feedback loop. The aesthetic ancestor is the Eventide H3000 shimmer reverb algorithm.

## What it is

One lens that:

1. Hears the dry signal
2. Pitch-shifts it (by default +12 semitones, octave up)
3. Lowpass-filters the shifted copy (so feedback doesn't run away into ultrasonic content)
4. Applies a slow chorus drift (the "moving" of the moving lens)
5. Delays it slightly (~45 ms)
6. Sends it back into the loop, attenuated by `feedback` gain
7. The next "generation" is the feedback signal pitched up *again*, drifted *differently*, etc.

After ~6 generations, the feedback decays below audibility. Each generation arrives at a slightly different time and a slightly different pitch (a per-generation random detune of a few cents prevents clean octave-locking). The result is a stacked, drifting shimmer tail.

## Files

| File | What |
|---|---|
| `dry.wav` | Kokoro TTS of *"the prism, and the cloud."* (24kHz mono) |
| `wet.wav` | Result of running `lens.py` on `dry.wav` with default parameters (dry + wet mixed) |
| `lens.py` | The implementation. `moving_lens()` is the function. Defaults give classic shimmer at ~+12 with 6 generations. |

## How to run

```bash
cd 01_feedback_lens
python3 lens.py
```

## Why it's saved here

This model was the working assumption when the project began — "shimmer reverb as prism" was treated as approximately one thing. Listening to its output makes the assumption audible and lets later models be heard against it for contrast.

## Where this model breaks down as "prism"

The pitch shift is **frequency-independent**. Every spectral component of the input gets shifted by the same ratio per generation. A real prism disperses different frequencies by different amounts — that doesn't happen here. So this model is structurally chorus-like, not prism-like, even though the perceived effect ("shimmer") is real and useful. See the top-level README and Model 03 for the prism-honest version.
