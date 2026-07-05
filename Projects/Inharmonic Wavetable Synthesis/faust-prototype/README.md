---
title: Inharmonic Wavetable Synthesis — Faust Prototype README
born: 2026-05
links:
  - target: "[[Inharmonic Wavetable Synthesis]]"
    type: emerged-from
    label: phase-0-toehold
forward_vector: "I am the Faust prototype README for Inharmonic Wavetable Synthesis — the phase-0 toehold build notes the project owns."
---

# Faust prototype — Phase 0 toehold

This directory holds the **smallest engine that exercises both wavetables**
(Wavetable A → amplitudes, Wavetable B → cents deviations) on a single held
note. Its job is to prove the architecture *sounds* right before any VST
commitment.

The granted directional decision (cycle 1 → cycle 2, 2026-05-27) was
**PROTOTYPE-IN-FAUST** with the note *"Lets dig into faust! I am excited to
see it in action."*

## What it is

- 32 partials, real-time additive synthesis
- 4 hard-coded Wavetable-A amplitude profiles (saw / square / hollow / vocal-A)
- 5 Wavetable-B inharmonicity profiles (flat / piano stretch / Bessel zeros /
  stochastic scatter / inverse stretch)
- A B-Depth knob — *the single most expressive control in the instrument*
- A settle-time knob that drives a frame scan from EARLY (full inharmonicity)
  to LATE (relaxed toward flat). This is the "settling piano" gesture from the
  main `.md` spec, §What This Sounds Like.
- ADSR amplitude envelope
- Mono → stereo split (Wavetable C / per-partial panning is the next
  architectural extension — not in this prototype yet).

## What it deliberately is NOT

- No FFT analysis of Wavetable A (amplitudes are precomputed for 4 timbres
  so the dual-wavetable idea can be heard without an offline pipeline).
- No multi-frame Wavetable B interpolation beyond the two-frame EARLY/LATE
  crossfade. Full N-frame scanning is the next iteration.
- No polyphony — one voice, one held note.
- No Wavetable C (per-partial panning) — see `Inharmonic Wavetable
  Synthesis.md` §Wavetable C.
- No SMS-derived physical-trajectory presets — those are the medium-term path
  (item 2 of "Forward Path").

This is a Phase-0 audition tool, not a release candidate.

## Run it (zero local install)

Faust isn't installed in this environment, so the fastest path to hearing it
is the **Faust Web IDE**:

1. Open https://faustide.grame.fr/
2. File → Open → upload `inharmonic_wavetable.dsp`
3. Hit the play button (top-right). The IDE compiles to WebAssembly in a few
   seconds and gives you knobs + a gate button.
4. Hold the **gate** button while sweeping the controls listed in the
   **Audition checklist** below.

If you want it locally later: `brew install faust` then `faust2caqt
inharmonic_wavetable.dsp` (CoreAudio standalone) or `faust2vst3
inharmonic_wavetable.dsp` (VST3 export — the recommended path per
`DSP Frameworks.md`).

## Audition checklist (5 listening passes)

Run these in order. Each pass isolates one architectural claim.

### Pass 1 — Flatness is harmony

- WT-A: `saw`
- WT-B: `flat (harmonic)`
- B-depth: anything
- **Expected:** A clean harmonic-series saw-like tone. No beating, no
  metallic ring. This is the baseline; the instrument should sound utterly
  ordinary here. That ordinariness is the proof — *zero deviation = harmonic*.

### Pass 2 — Piano character emerges from the curve, not from samples

- WT-A: `saw`
- WT-B: `piano stretch (B-coeff)`
- B-depth: start at 0, sweep up to 1.0
- Settle time: 0.8 s (default)
- Trigger gate, hold.
- **Expected:** Attack has a slightly metallic upper-partial sharpness; over
  the first ~800 ms the high partials relax into harmonic clarity. The
  character is *piano-like* without being a piano sample. The B-coefficient
  formula from `Piano String Inharmonicity.md` is doing audible work.

### Pass 3 — Bessel zeros = bell character

- WT-A: `hollow / triangle-ish` (thin spectrum)
- WT-B: `bessel zeros (bell)`
- B-depth: 1.0
- Settle time: 5.0 s (so the bell barely settles)
- **Expected:** Recognizably bell/struck-metal in character — *not* a real
  bell, but unmistakably in that family. Try playing a chord (hold note,
  re-trigger at different pitches) and hear the unexpected dissonances —
  this is the Sethares tuning-timbre relationship made audible.

### Pass 4 — Stochastic scatter = wood-block / clave family

- WT-A: `vocal-A formant`
- WT-B: `stochastic scatter`
- B-depth: sweep 0 → 2.0 → back
- Settle time: 0.3 s (fast settle to flat)
- **Expected:** At B=0 it's a vocal-A "ah" formant. As B climbs, the formant
  fractures into noise-like clusters; at the top it sounds nearly unpitched.
  Then the settle envelope pulls it back toward "ah" over 300 ms. The
  vocal-formant timbre is COMPLETELY DIFFERENT from sustain to attack — same
  Wavetable A, totally different identity. This is the dual-wavetable
  payoff.

### Pass 5 — Inverse stretch (the impossible material)

- WT-A: `saw`
- WT-B: `inverse stretch`
- B-depth: 1.0
- **Expected:** A timbre that bends the wrong way — lower partials sharp,
  upper partials flat. No real instrument does this; the curve is a
  speculative material. The instrument *can* play materials that don't exist.

## What to listen for across passes

The architectural claim is: **the curve shape IS the material's identity**.
Across all five passes, Wavetable A barely changes (or changes once per
pass). What's transforming the perceived material is the *shape of the
Wavetable B curve*. If passes 2, 3, 4, 5 sound like different families of
physical objects — even though only the inharmonicity profile changed — the
architecture is verified.

## After the audition — three forks

Once the audition is complete, the natural next moves are:

1. **Multi-frame WT-B scanning** — replace the two-frame EARLY/LATE
   crossfade with a real N-frame scanner. This unlocks the physical
   trajectory library: every settling-piano frame from a real recording.
2. **FFT-driven Wavetable A** — replace the four hard-coded amplitude
   profiles with FFT analysis of a user-loaded single-cycle waveform.
   This unlocks the "every commercial wavetable instantly becomes a
   timbral template" claim from the spec.
3. **Wavetable C (per-partial pan)** — add the third membrane. The maths
   is identical to WT-B; the listening payoff is the braided-to-fanned
   3D bundle described in `Inharmonic Wavetable Synthesis.md`
   §Wavetable C.

The cycle-2 ask names these as the next-cycle fork.
