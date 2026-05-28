---
title: RNBO Prototype — Verification Prep Checklist
type: meta
pillars:
  - tools
  - practice
born: 2026-05-27
stage: seed
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: emerged-from
    label: prepares-verification
  - target: "[[README — RNBO Prototype]]"
    type: connects-to
    label: companion-to
  - target: "[[2D Torus Wavetable Synthesizer — Build Log]]"
    type: connects-to
    label: documents
---
# RNBO Prototype — Verification Prep Checklist

Print-and-mark-off companion to [[README — RNBO Prototype]]. Where the README walks the build, this is the *at-the-Max-patch* sheet — a sequenced runbook with explicit pass/fail criteria so the five-step A/B against `2d.wave~` can be completed in one sitting without re-loading the project's mental model.

The acceptance criterion for the whole prototype is in one line at the bottom of the README: **the A−B difference monitor should sit at numerical-noise floor (<-100 dB) with both paths running on identical parameters and the same buffer**. Everything below is the path to getting to that line.

---

## Phase 0 — Patch assembly (do once)

Tick each as you build. None of these are tests yet — they are the preconditions every test below assumes.

- [ ] **Audio engine set to 48 kHz.** Max → DSP Status. Sample-rate mismatch between the WAV (48 kHz) and the engine is failure mode #4 from the README and the easiest to overlook.
- [ ] **Vector size set to 64 samples or smaller.** Larger vectors blur the one-sample phase comparison in test 5.
- [ ] **Parent `buffer~ tablebuf` loaded with `15_penrose_lattice.wav`** from `Projects/2D Torus Wavetable Synthesizer/Wavetables/`. Right-click the buffer → Open. Confirm header reads **1,048,576 samples, 1 channel, 48 kHz, 32-bit float**.
- [ ] **rnbo~ subpatcher contains `[buffer tablebuf @file 15_penrose_lattice.wav]`** — the RNBO-side buffer reference. The name `tablebuf` must match the codebox `peek("tablebuf", ...)` calls exactly.
- [ ] **`[codebox~]` populated** with the full contents of `torus_2d_lookup.codebox`. Verify no red error indicators on compile.
- [ ] **`[param baseHz]` and `[param ratio]` inside rnbo~** — names exactly matching the codebox `@param` declarations.
- [ ] **Parent patch has number boxes** driving both `baseHz` and `ratio` into the rnbo~ object via `set baseHz $1` / `set ratio $1` messages or direct param-message routing.
- [ ] **Reference path B: `[2d.wave~ tablebuf @rows 1024]`** wired with two `[phasor~]` objects at `baseHz` and `baseHz·ratio` respectively. Use a `[* ~]` with the ratio number for phasor 2.
- [ ] **Both paths gain-matched.** A single `[gain~]` per path, both initially at 0 dB unity. Do not normalize differently — the difference monitor in test 5 depends on raw equivalence.
- [ ] **Difference monitor wired**: `[-~]` taking A and B, into a `[meter~]` and a `[scope~]`. The scope is the live diagnostic; the meter is the pass/fail readout.
- [ ] **Phasor reset on bang.** Both `[phasor~]` objects and the codebox phasors should reset to 0 on a global bang at start. The codebox phasors live in `@state phi1` and `@state phi2`; send a `reset` message into the rnbo~ subpatcher, or wire a `[param phasereset]` if not yet exposed. (See **Failure-mode catalog → 1-sample offset** below.)

---

## Phase 1 — The five-step verification

Run these **in order**. Each test is sharper than the last. If a test fails, stop and consult the failure-mode catalog before running the next — a broken test 2 will make test 5 unreadable.

### Test 1 — Static row (`ratio = 0`)

| Setting | Value |
|---|---|
| `baseHz` | 220 |
| `ratio` | 0.0 |

- [ ] Both phasor 2's freeze at their initial value (0 if reset, otherwise wherever they sat).
- [ ] You are now playing a single row of the Penrose surface at 220 Hz.
- [ ] **Path A vs Path B: sonically indistinguishable.** Toggle the A/B selector while audio is running.
- [ ] **Difference monitor: <-100 dB.** Scope shows a flat green line.

**Expected sonic character**: a complex but strictly periodic 220 Hz timbre. Penrose at Y=0 row should read as a single-fundamental tone with structured harmonics.

**If fail**: jump to failure-mode catalog. Most likely the row-zero alignment between codebox and `2d.wave~` differs — Penrose has structure right at the origin.

### Test 2 — Static column (`baseHz` tiny, `ratio` huge)

| Setting | Value |
|---|---|
| `baseHz` | 0.5 |
| `ratio` | 1000.0 |

- [ ] Phasor 1 effectively freezes (one cycle every 2 seconds — over many seconds it does drift, but on the timescale of a few hundred milliseconds it is stationary).
- [ ] Phasor 2 plays at ~500 Hz.
- [ ] You are now playing a single column at ~500 Hz.
- [ ] **Path A vs Path B: indistinguishable.**
- [ ] **Difference monitor: <-100 dB.**

**Expected sonic character**: a clean 500 Hz tone with column-specific overtones. Drift over many seconds as the X position slowly advances — this is correct, not a bug.

**If fail**: likely cause is X/Y axis convention swapped. Codebox uses `phi1 → X (col)`, `phi2 → Y (row)`. If the column test produces *column-like* sound for one path and *row-like* for the other, swap which `phasor~` drives which `2d.wave~` inlet.

### Test 3 — Closed orbit (exact 3:2)

| Setting | Value |
|---|---|
| `baseHz` | 220 |
| `ratio` | 1.5 |

- [ ] Both phasors advance at integer-related rates. The scan path closes on the torus after 2 cycles of phasor 1 / 3 cycles of phasor 2.
- [ ] Output is perfectly periodic at the GCD frequency of 110 Hz (the orbit's fundamental).
- [ ] **`[scope~]` shows a stable repeating waveform** at 110 Hz with audible content up through the Nyquist.
- [ ] **Path A vs Path B: indistinguishable.**
- [ ] **Difference monitor: <-100 dB.**

**Expected sonic character**: a closed, stable tone — *not* shimmery, *not* drifting. This is the harmonic regime; the spectrum will look like a harmonic comb at multiples of 110 Hz, weighted by the surface's c_{m,n} on the (2, 3) lattice direction.

**If fail**: usually a 1-sample phase offset between paths. The scope will show two repeating waveforms in time-locked register but with a tiny constant offset that lights up the difference meter. Add an explicit phasor-reset bang to both paths at audio-on.

### Test 4 — Kronecker shimmer (irrational detune)

| Setting | Value |
|---|---|
| `baseHz` | 220 |
| `ratio` | 1.500625 |

- [ ] Both phasors advance at rates whose ratio is irrational to machine precision. The scan path **never closes** — over many minutes it densely covers the torus.
- [ ] Output is quasi-periodic with two independent fundamentals.
- [ ] **Sonic character: slow-drift shimmer.** This is the project's central design fact made audible.
- [ ] Spectrum analyzer (`fft.spectroscope~` or similar) shows partials at frequencies `(m + 1.500625·n) · 220 Hz` for every (m,n) where the Penrose surface has non-zero coefficient. The partial pattern is **inharmonic but structured** — not noise, not detuned harmonic, something genuinely new.
- [ ] **Path A vs Path B: still indistinguishable.** The shimmer pattern from both paths should be identical to the same phase precision.

**This is the project's thesis test.** If 1–3 pass and 4 also passes, the math is right and the architecture delivers what the home entry promises.

### Test 5 — Difference monitor (the acceptance criterion)

Run all four prior tests with the difference monitor active. The bar is unambiguous:

- [ ] **A−B sits below -100 dB across all four test settings.** Scope shows a flat green line at zero. Meter peaks remain in the noise floor across an extended run (≥ 30 seconds at the irrational ratio of test 4, which is when subtle drift would surface).

**If the difference monitor fails at any test**, debug in the order below. Do **not** add warps until this passes.

---

## Failure-mode catalog (debug order)

When the difference monitor is not silent, work this list top-to-bottom. The order is empirical — the upper entries are the most common, the lower entries are the rarer-but-harder.

1. **X/Y axis convention swapped.** Easiest to verify with test 2 (static column). If path A's column sound matches path B's row sound, swap the `phasor~` inlets on `2d.wave~`. The codebox convention is fixed by the file (phi1 = X = col, phi2 = Y = row).

2. **`peek` channel index.** The codebox uses `peek("tablebuf", idx, 0)` — channel 0. Penrose is mono, so this is correct. If the wavetable were stereo, channel 0 vs 1 would matter.

3. **One-sample phase offset between paths.** `2d.wave~` and `codebox~ @state phi` may initialize phasors with different rules. Symptom: tests 1–3 sound right but the difference meter is at -40 to -60 dB rather than -100 dB. Fix: explicit phasor reset on a bang at audio-on, applied identically to both paths.

4. **Sample-rate mismatch.** The wavetable is 48 kHz; if the engine is running at 44.1 kHz the `samplerate` term in the codebox is correct (it queries the engine), but the buffer's natural periodicity in the X direction (1024 samples = one column) will be misaligned with how `2d.wave~` interprets the buffer. Set engine to 48 kHz.

5. **`peek` index out of range.** SURFACE_LEN should be exactly 1,048,576 (1024·1024). If the buffer is a different size (e.g., 1023·1024 or stereo doubling), `idx11 = y1 · SURFACE_W + x1` can step off the end. Verify the buffer header reads 1,048,576 samples.

6. **Bilinear vs `2d.wave~`'s default interpolation.** The codebox uses bilinear; `2d.wave~` default is also bilinear, but if the `@interp` attribute has been changed (cubic, spline) the difference will not be zero. Force `@interp linear` on `2d.wave~`.

7. **Buffer-binding silently failed.** If `peek("tablebuf", ...)` returns 0 always, path A is silence and the difference monitor reads exactly path B's level. Symptom: path A meter shows -∞ dB while path B meters normally. Check the `[buffer tablebuf @file ...]` inside the rnbo~ subpatcher is present and named exactly `tablebuf`.

8. **Buffer-load race at startup.** The first second after `[ezdac~]` activates, the buffer may not be loaded yet. Cleanly: wait 2 seconds after audio-on before reading the difference monitor.

---

## What success unlocks

When the difference monitor is silent across all four tests, the codebox math is validated and the warp catalog earns its turn. The next move is the [[Tier-1 Warp Snippets]] companion — phase bend (#1), variable-rate phase shear (#6), self-displacement (#12) — three warps that need no precomputation and add to this same codebox file as drop-in extensions. See that document for the canonical snippets.

After Tier-1 warps audition cleanly, the lookup-table-and-crossfade infrastructure earns its build slot, which then unlocks the bulk of Tier 1 / Tier 2 in one pass: shear (#2), isotropic diffusion (#3), anisotropic diffusion (#4), rotation (#5), spectral masks (#7).

## Open questions surfaced in the prep

These are not blockers for verification, but they are the questions the verification process is most likely to surface:

- **Do all seven surfaces pass verification, or just Penrose?** Penrose is the hardest surface to lookup cleanly (densest spectrum, sharpest features), so passing on Penrose is the strongest test — but a per-surface confirmation run after Penrose passes would be inexpensive (just swap the buffer file and rerun tests 3 and 4).
- **At what ratio precision does the Kronecker shimmer become inaudible?** Test 4 uses 1.500625 — the audible shimmer rate is determined by how close that is to 3:2. A future experiment: sweep `ratio` slowly from 1.5 through 1.500625 to 1.51 and listen to the shimmer onset.
- **Does the buffer-load race at startup affect the difference monitor in a reproducible way?** Worth measuring once so it's documented.
