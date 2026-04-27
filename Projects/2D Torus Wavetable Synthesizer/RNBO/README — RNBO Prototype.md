---
title: RNBO Prototype — Build & Test Walkthrough
type: meta
pillars:
  - tools
  - practice
born: 2026-04-27
stage: seed
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: emerged-from
    label: prototypes
  - target: "[[2D Torus Wavetable Synthesizer — Build Log]]"
    type: connects-to
    label: documents
  - target: "[[Torus Warping Catalog]]"
    type: enables
    label: precedes
---
# RNBO Prototype — Build & Test Walkthrough

Companion to `torus_2d_lookup.codebox`. This is the smallest playable instance of the [[2D Torus Wavetable Synthesizer]] — one surface, two phasors, one ratio knob, audible output — built explicitly as an A/B test against Max's built-in `2d.wave~` so the codebox math can be validated surface-by-surface before any warps are added.

Starting surface: [[15 — Penrose Lattice]]. Penrose is the most demanding surface in the catalog (dense quasi-crystalline lookup with 5-fold local symmetry); if codebox handles it cleanly, it'll handle anything.

## Files

- `torus_2d_lookup.codebox` — the codebox~ source. Open this in any text editor or paste into a `codebox~` object inside an `rnbo~` subpatcher. Read the comments at the top before wiring.

## Step-by-step build

**1. Open Max. Create a new patch.**

**2. Build the source side (one buffer, two phasors, params).**

Add the following objects to the parent Max patch:

- `[buffer~ tablebuf 15_penrose_lattice.wav]`
  Drop the wav file from `Wavetables/15_penrose_lattice.wav` into the patcher folder, or use a `replace` message to point at an absolute path. The buffer should report `1048576 samples, 1 channel, 48000 Hz`.

- `[number~] -> [phasor~]` (this is your X-axis driver — call it `phasor1`)
- `[number~] -> [* ratio] -> [phasor~]` (Y-axis — `phasor2`)

  The two phasors will need to be held to the same source; easiest is one `[number~]` for `baseHz`, sent both directly to phasor1 and through `[* ~]` controlled by a `ratio` number to phasor2.

- A `[live.dial]` or `[number]` for `baseHz` (range 20–2000, default 220)
- A `[live.dial]` or `[number]` for `ratio` (range 0.1–4.0, default 1.500625)

**3. Build path A — the codebox version (the thing being tested).**

- Drop an `[rnbo~]` object. Open it.
- Inside the rnbo~ subpatcher, add:
  - `[buffer tablebuf @file 15_penrose_lattice.wav]` — RNBO's buffer reference operator (this is what makes the buffer name visible to `peek` from inside the codebox~). Confirm it shows the same sample count as the parent `buffer~`.
  - `[param baseHz]` and `[param ratio]` (matching what the parent patch will send)
  - `[codebox~]` — open it and paste the contents of `torus_2d_lookup.codebox`.
  - `[out~ 1]` — wire the codebox~ outlet to it.
- Close the rnbo~. From the parent patch, send `set baseHz` and `set ratio` messages into rnbo~ from your number boxes (connect via `[s baseHz]` / `[r baseHz]` pairs or direct cords).

**4. Build path B — the reference `2d.wave~`.**

- `[2d.wave~ tablebuf]` with attribute `@rows 1024`
- Wire `phasor1 -> 2d.wave~ left inlet` (X), `phasor2 -> 2d.wave~ right inlet` (Y)
- Output of `2d.wave~` goes into output B.

**5. A/B harness.**

- Two `[gain~]` objects for level matching.
- A `[selector~ 2 1]` or a simple toggle/crossfader for instant A/B.
- Optional difference monitor: `[-~]` between A and B, into a `[meter~]` and a `[scope~]`. If the codebox math is correct, the difference signal should be at numerical-noise floor (under -100 dB, looks like flat green on the meter).

**6. Connect to `[ezdac~]` or `[dac~ 1 2]` and turn on audio.**

## Verification protocol

Run these in order. Each one is a sharper test than the last.

1. **Static row test.** Set `ratio = 0`. The phasor2 output freezes; you're playing a single row of the surface at `baseHz`. Should sound like a fixed, complex but periodic timbre. Path A and path B should be sonically indistinguishable.

2. **Static column test.** Set `baseHz = 0.5` Hz, `ratio = 1000`. Phasor1 effectively freezes; you're playing a single column at `~500 Hz`. Same sound from both paths.

3. **Closed-orbit test.** `baseHz = 220`, `ratio = 1.5` (exact 3:2). The scan path closes on the torus; the signal should be perfectly periodic at the GCD frequency (110 Hz here). `[scope~]` should show a stable repeating waveform. Both paths identical.

4. **Kronecker shimmer test.** `baseHz = 220`, `ratio = 1.500625`. Tiny irrational detune off 3:2. The path no longer closes; you should hear the characteristic slow-drift shimmer. A spectrum analyzer should show partials at every `(m + 1.500625·n) · 220 Hz` where the surface has non-zero coefficient at `(m, n)`. This is the central design fact of the project, audible.

5. **Difference monitor.** With both paths active and parameters identical, the A−B signal should be at numerical-noise floor. If it isn't, debug in this order:
   - X/Y axis convention swapped between paths.
   - `peek` channel index wrong (should be 0 for our mono buffers).
   - One-sample phase offset between codebox and `2d.wave~` (they may initialize phasors differently — try resetting both phasors to 0 with a bang at start).
   - Sample-rate mismatch between WAV (48 kHz) and DSP. Set the audio engine to 48 kHz to match.

## What success looks like

- Tests 1-4 produce identical-sounding output from both paths.
- Test 5 difference signal is silent.
- Test 4 demonstrates the shimmer characteristic of the irrational ratio gate — the project's core thesis, now audible on demand.

Once these pass, the codebox~ is validated and the warp catalog is ready to deploy. The natural first warp is **per-axis phase bend** (Tier 1, entry #1 in [[Torus Warping Catalog]]) — three lines of codebox to add a `tanh` curve on each phasor before the lookup, exposing two new params (`bendX`, `bendY`).

## What to do if `peek` doesn't resolve

If `peek("tablebuf", ...)` fails to compile or always returns 0, the most likely causes:

- The `[buffer]` operator inside the rnbo~ subpatcher isn't named `tablebuf`, or the buffer reference inside RNBO uses a different name than the outer `[buffer~]`. Match them exactly.
- RNBO's buffer reference operator may need a different syntax in your version. Open the codebox docs page from the rnbo~ help (right-click → Help) and confirm the buffer-access operator name.
- An alternative buffer-access operator in RNBO codebox is `wave(bufname, position_normalized, channel)` — takes 0..1 phase instead of integer index. If `peek` doesn't work, swap to `wave` and provide the four corner positions as `(x0+0.5)/SURFACE_W`, etc.

If you hit a wall at the buffer-binding step, screenshot the rnbo~ subpatcher and we'll debug from there.

## Forward

Once the prototype validates, the build order from [[Torus Warping Catalog]] §"Forward vector" is:

1. Per-sample Tier-1 warps that need no precomputation: phase bend (#1), variable-rate phase shear (#6), self-displacement (#12). Days of work, not weeks.
2. The lookup-and-crossfade infrastructure (one offline Python tool, one runtime crossfader) — unlocks shear (#2), iso diffusion (#3), aniso diffusion (#4), rotation (#5), spectral masks (#7) all at once.
3. Tier 3 and beyond — composition / studio territory. After the player has hands.

The exotic frontiers Loudon flagged (T³ wavetables, surface-to-surface morphing) are downstream of step 2 — they reuse the same crossfade infrastructure.
