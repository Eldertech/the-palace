---
title: 00 — Test Diagnostic Wavetable
born: 2026-04-26
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: connects-to
    label: instruments
forward_vector: "I am the spec for the diagnostic surface — a known-answer wavetable for confirming the readout math is correct — geometry, file facts, and musical use — so a player can load and voice this surface without re-deriving the wavetable."
---
# 00 — Test Diagnostic Wavetable

The first entry in the catalog. Its only job is to confirm that the patch reads the buffer the way `2d.wave~` says it does, on both axes. Every row is designed so that *something specific about the patch becomes audibly true or false* when you scan it.

If every test below behaves as predicted, the patch is correct and you can trust everything that comes after. If a test fails, the failure mode points to a specific wiring problem.

![Heightmap](00_test_diagnostic.png)

*Heightmap: orange = positive sample, blue = negative, black = zero. Top to bottom = row 0 to row 15. The two black bands are the silence rows; the speckled band is the noise row; the increasingly-frequent striped bands at rows 7, 8, 10 are the 2×, 4×, 8× sines.*

For the row-by-row waveform plots, see [`00_test_diagnostic_full.png`](00_test_diagnostic_full.png) (heightmap + stacked-rows view).

## File

`00_test_diagnostic.wav` — mono, 32-bit float, 48 kHz, **1024 × 1024 = 1 048 576 samples** (≈ 21.85 s). Square-wavetable convention matches the rest of the catalog.

Layout: 1024 rows × 1024 samples. The same 16 anchor waveforms from the original design sit at rows 0, 64, 128, …, 960 — i.e. at exactly Y = k/16 for k = 0..15. The 63 sub-rows between each anchor pair are **linearly interpolated** between the anchor waveforms. So:

- Every "Y = k/16" test point in the test protocol below still hits its anchor with zero error — the static (Y held constant) tests behave exactly as in the original design.
- Audio-rate Y now reads as a smooth morph through the 16 anchors instead of stepping. The audible transitions between anchors are crossfades, not jumps; click artefacts at the boundaries are gone.
- The two silence anchors (rows 256 and 576) are now graceful nulls in the timbre stream — Y values near them produce attenuated mixes of the surrounding anchors rather than abrupt drops.

Patch change vs the original diagnostic: send **`rows 1024`** to `2d.wave~`, not `rows 16`. Everything else in the patch is the same.

To regenerate the image, or to render any future surface in the catalog:

```sh
python3 ../Tools/visualize_wavetable.py 00_test_diagnostic.wav --width 1024 --height 1024
```

## Patch setup (minimum)

```
[buffer~ test2d 00_test_diagnostic.wav]   ← load the file (drag it onto buffer~ or `read` message)
[2d.wave~ test2d 1024]                     ← buffer name + 1024 rows
   inlet 1 (X / phase):    phasor~ Xfreq    ← swept 0→1, repeats at Xfreq Hz
   inlet 2 (Y / row sel):  sig~ Yval        ← float 0.0..1.0 selects row
   inlet 3, 4:             leave unconnected (defaults to full file)
   outlet:                 → ezdac~ (with attenuator; signal is full-scale)
```

After `read`, send `rows 1024` to `2d.wave~` for safety, even though it's an argument.

> Crucial detail from the docs: "if the stored waveform contains multiple or partial repetitions of a waveform, the perceived pitch may not correspond exactly to the frequency of `phasor~`." This is the tell we exploit in Tests 3, 5 and 6 — a row containing 2 cycles of a sine produces a tone an octave above the phasor frequency.

## Y-position table — what each anchor sounds like

The exact Y value that selects anchor k is `Y = k / 16`. With the new 1024-row layout, this lands on row `k * 64` exactly — the anchor waveform is stored verbatim there. Values *between* integer-k Ys produce a smooth crossfade between neighbouring anchors over the 63 sub-rows in between.

| Anchor | Exact Y | Underlying row | Content | At X-phasor = 110 Hz, expect to hear |
|-------:|---------|---------------:|---------|---------------------------------------|
|  0  | 0.0000 |    0 | sine, 1 cycle | clean 110 Hz pure tone |
|  1  | 0.0625 |   64 | sawtooth, 1 cycle | buzzy 110 Hz with bright top |
|  2  | 0.1250 |  128 | square, 50% duty | hollow 110 Hz, odd harmonics only |
|  3  | 0.1875 |  192 | triangle | softer 110 Hz, gentle odd harmonics |
|  4  | 0.2500 |  256 | **silence** | nothing — checkpoint A |
|  5  | 0.3125 |  320 | sawtooth reversed (falling) | sounds like Anchor 1 by ear; visibly inverted on a `scope~` |
|  6  | 0.3750 |  384 | 25%-duty pulse | brighter and thinner than Anchor 2 |
|  7  | 0.4375 |  448 | sine, **2 cycles** | clean 220 Hz — one octave **up** from Anchor 0 |
|  8  | 0.5000 |  512 | sine, **4 cycles** | clean 440 Hz — two octaves up |
|  9  | 0.5625 |  576 | **silence** | nothing — checkpoint B |
| 10  | 0.6250 |  640 | sine, **8 cycles** | clean 880 Hz — three octaves up |
| 11  | 0.6875 |  704 | white noise (deterministic) | shhhhh — broadband, no pitch |
| 12  | 0.7500 |  768 | bandlimited saw (8 partials) | saw-flavoured but cleaner than Anchor 1 |
| 13  | 0.8125 |  832 | bandlimited square (8 odd partials) | square-flavoured but cleaner than Anchor 2 |
| 14  | 0.8750 |  896 | sine + 0.5 · sin(3φ) | hollow chord-like timbre, fundamental 110 Hz |
| 15  | 0.9375 |  960 | sine, 1 cycle | identical to Anchor 0 — Y-wrap reference |

## Six tests, in order

Run them in this order; later tests assume earlier ones passed.

### Test 1 — Y axis is wired and discriminating

- `phasor~` at **X = 110 Hz**, locked.
- Set `Y` by hand to each value in the table above.
- **Pass:** the sound matches the description for every row.
- **Failure modes:**
  - Same sound at every Y → Y signal is not actually reaching inlet 2.
  - Rows 4 and 9 are not silent → Y is not landing on integer-row Ys; check that you're sending `0.25` not `0.249`.
  - Anchor 4 sounds like a crossfade of Anchors 3 and 5 (low-amplitude, soft) when Y is just slightly off 0.25 → expected; the surrounding rows are interpolated mixes. At exactly Y = 0.25 you should hear silence, and the level dip is now graceful instead of abrupt.

### Test 2 — X phasor frequency tracks pitch (the basic oscillator test)

- Set **Y = 0.0000** (Anchor 0, sine).
- Sweep X-phasor frequency: 55, 110, 220, 440, 880 Hz.
- **Pass:** pitch follows phasor frequency exactly. Each doubling is a clean octave.
- **Failure modes:**
  - Pitch is doubled across the board → buffer is being read at half the expected length; check `rows 1024` and that the file is actually 1 048 576 samples.
  - Pitch is halved → opposite of above; rows are being read at twice the length.
  - Pitch follows but with audible buzz/aliasing → fine, sine row has only one harmonic; if you hear extra content, X-phasor isn't a clean ramp (check that it's `phasor~` and not `cycle~`).

### Test 3 — multi-cycle rows verify the X-axis math (the real test)

This is the diagnostic that catches off-by-one row-length errors which Tests 1 and 2 cannot.

- Hold **X-phasor = 110 Hz**.
- Set Y to each of these values in turn and confirm the pitch:

  | Y | Row | Predicted pitch |
  |---|-----|------------------|
  | 0.0000 | 0  | 110 Hz |
  | 0.4375 | 7  | **220 Hz** |
  | 0.5000 | 8  | **440 Hz** |
  | 0.6250 | 10 | **880 Hz** |

- **Pass:** four octaves climbing as you step Y, with X frequency unchanged.
- **Failure modes:**
  - Pitch *doesn't* jump → X-axis is not reading the full row; check `rows 1024` and verify buffer length is 1 048 576 samples (~21.85 s at 48 kHz).
  - Pitch jumps but to wrong intervals (e.g. minor 7ths instead of octaves) → row length is not exactly 1024; perhaps `rows 17` was sent, or the buffer length is off. Verify file size is **65592 bytes** (44 header + 16384·4 audio).

### Test 4 — Y phasor at LFO rate reveals the row sequence

- **X = 220 Hz** (`phasor~`).
- **Y = `phasor~` at 0.5 Hz** (a 2-second sweep).
- **Pass:** every two seconds you should hear the catalog above sweep past in order: sine → saw → square → triangle → silence → reverse-saw → 25 % pulse → octave-up sine → two-octave-up sine → silence → three-octave-up sine → noise → bandlimited saw → bandlimited square → two-tone → sine. Then it repeats.
- **Failure modes:**
  - Sequence is reversed → Y phasor is inverted (`phasor~` running negative or 1 → 0).
  - Sequence is jumbled / glitchy → Y is being quantised somewhere (e.g. an `int` or a `change` object in the path).
  - The two silences merge into one continuous mid-section → Y-axis interpolation is so wide that you're losing row-level resolution, or rows count is wrong.

### Test 5 — both phasors at audio rate (the actual instrument)

This is the first test that touches the project's real territory: harmonic vs inharmonic via the ratio of two scan rates.

- Run **both** axes from `phasor~` at audio rate.
- **5a — closed orbit, 1:1.** X = 220 Hz, Y = 220 Hz. The Y axis re-scans the full table every X cycle. The signal is **periodic at 220 Hz**, the spectrum is harmonic, and you'll hear a single complex pitch with a strong rhythmic identity (the table sweep itself becomes a waveform shape).
- **5b — closed orbit, 1:2.** X = 220, Y = 110. Periodic at 110 Hz. Lower fundamental; harmonic.
- **5c — open orbit, slight detune.** X = 220, Y = 220.137. Listen for the timbre to **stop being periodic** — it shimmers, drifts, never settles. This is the Kronecker flow on T². It is the sound that the whole project is built around. If Test 5c gives you that ergodic shimmer instead of a periodic tone, the patch is sonically validated.
- **Failure modes for 5c:** if the sound stays perfectly periodic, your Y phasor is being internally locked to your X phasor (e.g. they share a sync clock somewhere) — the two phasor objects must be **independent**.

### Test 6 — phase polarity (optional, scope-based)

- **Y = 0.0625** (Anchor 1, sawtooth).
- Watch on `scope~` (or `capture~`): you should see a ramp from −1 to +1, snap, repeat.
- **Y = 0.3125** (Anchor 5, reversed sawtooth): same scope, ramp from +1 to −1, snap, repeat.
- This tells you whether X reads the row low-index → high-index (it should) and confirms phase orientation for any future asymmetric surface.

## Quick diagnostic table — if a test fails, look here

| Symptom | Most likely cause |
|---------|--------------------|
| Pitch is one octave high everywhere | `rows` set to half what it should be (512 instead of 1024), or buffer mis-loaded as half-length |
| Pitch is one octave low everywhere | `rows` doubled (2048 instead of 1024) |
| Y has no effect | inlet 2 not connected, or signal is not in 0..1 |
| Y has effect but anchors are smeared | Y signal is changing too fast for "stationary" tests (drive Y from `sig~ <constant>` for static tests, not from a number-box-ramped phasor) |
| Anchor 4 / Anchor 9 are not silent at exact Y = 0.25 / 0.5625 | Y is landing slightly off the anchor row; sweep slowly across the value and confirm the level dips to zero at the centre |
| Tests 3 and 5 disagree (Test 3 passes, Test 5 doesn't shimmer) | The two phasors are not independent — one is driving or sync'ing the other |
| File won't load into `buffer~` | The WAV is 32-bit float (fmt code 3); old `buffer~` versions occasionally need explicit `read` rather than drag-drop |

## What this wavetable is *not*

It's a diagnostic, not a musical surface. Once Tests 1–5 pass, this file's job is done. The musical surfaces — Membrane, Chladni, Theta, Stiff String, Knot Shadow, Penrose, the seventh — come in Stage 3. They will all assume the patch built and verified here.
