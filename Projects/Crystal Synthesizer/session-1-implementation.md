---
title: "Crystal Synthesizer — Stage 1 Implementation"
born: 2026-04-21
links:
  - target: "[[Crystal Synthesizer]]"
    type: connects-to
    label: child-of
forward_vector: "I am the Stage 1 Gen~ patch architecture for [[Crystal Synthesizer]] — the monophonic partial selector, its pseudocode and mode-ratio tables. I stay faithful to the built patch so a future session can rebuild or extend it."
---

# Crystal Synthesizer — Stage 1 Implementation
## Monophonic Crystal Partial Selector in Gen~ / Max

**Session goal:** a playable monophonic synthesizer in Max whose partial structure is determined by a selected Bravais lattice system. Students build it, hear it, and test the timbral hypotheses.

---

## Architecture Overview

```
[Max patch]
  └── [kbd / MIDI input] → pitch (MIDI note) → frequency (Hz)
  └── [lattice selector] → ratio set → partial frequencies
  └── [Gen~ crystal oscillator] → audio
  └── [ADSR envelope] → amplitude
  └── [dac~]
```

Three distinct layers:
1. **Lattice selector** — chooses a ratio set (in Max, outside Gen~)
2. **Gen~ crystal oscillator** — additive bank using those ratios
3. **Max wrapper** — keyboard input, envelope, output

---

## Layer 1: Lattice Ratio Tables

These are the normalized phonon mode frequency ratios for each Bravais lattice system, scaled to audio. The first partial is always 1.0 (the fundamental). All other partials are multiples of the fundamental.

**Important:** these are the *hypotheses*. The actual sound may differ. That's the point.

| Lattice | Ratios | Source note |
|---|---|---|
| Cubic | 1.00, 1.19, 1.41, 1.63, 1.89, 2.00 | Isotropic — same in all directions. Modes cluster near zone boundary (×2). |
| Tetragonal | 1.00, 1.28, 1.41, 1.70, 1.85, 2.00 | Two-axis symmetry break. c-axis modes separate from a/b-axis modes. |
| Orthorhombic | 1.00, 1.33, 1.58, 1.78, 2.00 | Three unequal axes. Fewer modes, more separation. |
| Hexagonal | 1.00, 1.15, 1.41, 1.55, 1.73, 2.00 | Birefringent — two mode velocities. Doubled partial character. |
| Trigonal | 1.00, 1.20, 1.44, 1.62, 1.85 | Near-hexagonal with small perturbations. |
| Monoclinic | 1.00, 1.37, 1.71, 1.94, 2.23, 2.61 | One perpendicular axis. Inharmonic — no simple pattern. |
| Triclinic | 1.00, 1.43, 1.89, 2.38, 2.91, 3.47 | No perpendicular axes. Every partial independent. Widest spread. |

In Max, store these as `coll` entries or as a `dict`. The lattice selector (a `umenu` or number box) indexes into the table and sends the ratio set to Gen~.

---

## Layer 2: Gen~ Crystal Oscillator

### What goes inside Gen~

The Gen~ patch receives:
- `fundamental` — the base frequency in Hz (from MIDI note → `mtof`)
- `ratio_1` through `ratio_6` — the partial ratios for the selected lattice
- `amp_1` through `amp_6` — partial amplitudes (start with equal amplitude; refine later)
- `gate` — amplitude envelope gate (0/1)

### Pseudocode

```
// Gen~ codebox pseudocode — Crystal Oscillator Bank

in1 = fundamental;       // Hz
in2..in7 = ratios[1..6]; // partial multipliers
in8..in13 = amps[1..6];  // partial amplitudes
in14 = gate;             // envelope gate

// Generate each partial
p1 = cycle(in1 * in2) * in8;
p2 = cycle(in1 * in3) * in9;
p3 = cycle(in1 * in4) * in10;
p4 = cycle(in1 * in5) * in11;
p5 = cycle(in1 * in6) * in12;
p6 = cycle(in1 * in7) * in13;

// Mix and normalize
mix = (p1 + p2 + p3 + p4 + p5 + p6) * 0.16;

out1 = mix * gate;
```

### Amplitude weighting

Start with equal weights (0.16 each for 6 partials). Later refinement: weight by mode density — partials near zone boundary (high ratio) are often less energetic. A simple inverse-ratio weighting:

```
amp_n = 1.0 / ratio_n
```

This is speculative too — test it.

### Phase initialization

For a clean monophonic instrument, reset all oscillator phases on note-on. In Gen~:

```
// On gate rise (0→1):
// Reset all cycle~ phases to 0
```

In Max, send a `bang` to a `phasor~` reset or use `param` with a reset trigger.

---

## Layer 3: Max Wrapper

### Signal flow

```
[kslider] or [notein]
    |
[mtof~]  →  fundamental (Hz)  →  [gen~ crystal_osc]  →  [*~ envelope]  →  [dac~]
    |
[adsr~]  →  envelope (0–1)    ↗
    |
[trigger] → gate signal
```

### Lattice selector

```
[umenu]  ←  items: Cubic / Tetragonal / Orthorhombic / Hexagonal / Trigonal / Monoclinic / Triclinic
    |
[coll crystal_ratios]  →  unpacks ratio list  →  [prepend ratio_1] etc.  →  [gen~ crystal_osc]
```

### ADSR suggestion (starting point — adjust by ear)

| Parameter | Value | Rationale |
|---|---|---|
| Attack | 5–20ms | Fast enough to feel percussive for crystal strikes |
| Decay | 200–800ms | The decay IS the phonon lifetime — this is musically significant |
| Sustain | 0.3–0.7 | Held tone for keyboard playing |
| Release | 300–600ms | Tail reflects anharmonic mode decay |

The decay parameter is especially worth exploring — longer decay will reveal partial beating between inharmonic modes (most obvious in Monoclinic and Triclinic). This is physical behavior, not an artifact.

---

## Stage 1 Build Sequence (in-session order)

1. **Single partial** — build Gen~ with one `cycle~` at the fundamental frequency. Get audio flowing. Verify MIDI → frequency → sound.

2. **Two partials, cubic** — add a second `cycle~` at `fundamental × 1.41` (the cubic third mode). Hear the interval. Is it what you expected?

3. **Full cubic bank** — add all 6 cubic partials. Adjust amplitudes. This is the first hypothesis test: does it sound thick, bright, rich?

4. **Swap to triclinic** — change the ratio set. Hear the shift. Compare directly. Does triclinic feel more chaotic?

5. **Add the ADSR** — gate the output. Now it's a playable instrument. Explore decay times — longer decay reveals partial interactions.

6. **Test all 7 lattice systems** — play the same pitch through each. Take notes. Which hypotheses held? Which didn't?

7. **Reflect** — the question on the interactive artifact. Open discussion.

---

## Known Unknowns (for student investigation)

- **Amplitude weighting:** equal amplitudes is the starting point, not the answer. Real phonon modes have density-dependent amplitudes. How does weighting by `1/ratio` change the sound?
- **Octave duplication:** some lattice tables have a ratio at or near 2.0. Should that partial be treated as an octave partial (same perceptual root) or as an independent mode? Test both.
- **Triclinic prediction:** the "deeply inharmonic, chaotic" hypothesis is the least certain. It's derived from the spectral analogy, not from measurement. This is the most interesting hypothesis to test.
- **The birefringent case:** hexagonal is predicted to have a "doubled" character. In Stage 1 we implement a single ratio set. A more faithful model would be two interleaved sets (one per propagation velocity). Flag this as the natural transition to Stage 2 complexity.

---

## Transition to Stage 2

Stage 1 ends with a working monophonic Max synthesizer. Stage 2 makes it polyphonic and wraps it in RNBO for export. The natural bridge question: "this synthesizer sounds interesting — but it can only play one note at a time, and it only lives in Max. What would it take to make it an instrument that travels?"

That's the portability question, and it opens the RNBO conversation.

---

## Files

| File | Location | Description |
|---|---|---|
| `session-1-interactive.html` | `Projects/Crystal Synthesizer/` | HTML framing artifact for stream |
| `session-1-implementation.md` | `Projects/Crystal Synthesizer/` | This file — patch architecture |
| `Crystal Synthesizer — Staging.md` | `Projects/` | Full staging record |
