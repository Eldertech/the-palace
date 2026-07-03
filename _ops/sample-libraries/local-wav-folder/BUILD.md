---
title: "Local WAV Folder — build notes"
born: 2026-06-25
links:
  - target: "[[Generative Sample Libraries]]"
    type: connects-to
    label: phase-3-source-three-scaffold
forward_vector: "I am the scaffold for source three; once Loudon names a real WAV folder, I become the validation run that promotes the Interview skill to /skills/."
---

# Local WAV Folder — Phase 3, Source Three

Scaffold built cycle 18 (2026-06-25) under SOURCE-THREE grant on `gsl-steward-034`.

## What this is

`generate.py` ingests a folder of WAVs the user already has, detects each file's pitch with librosa's pYIN (voiced-frame median), maps onto MIDI notes via nearest-neighbor with split-the-difference hikey/lokey boundaries, applies the responsive-onset trim convention from `phoneme-choir/generate.py` (−45 dBFS detection, 2 ms cushion, 3 ms `ampeg_attack`), and writes an SFZ.

## Run

```
python generate.py --src /path/to/wavs --name MyInstrument --audition
```

`--audition` keeps one file per octave (the one with smallest cents-error) so a representative set can be heard before committing to the full folder. The Phase 2 hard gate — audition before batch — runs here.

## What needs Loudon

A real folder of WAVs to point `--src` at. Until then, the scaffold is unvalidated against actual material. Picking the folder unblocks: (a) the source-three validation render, (b) the Interview skill's promotion to `/skills/sample-library-interview/` (gated since cycle 9 on "one non-Kokoro, non-palace-synthesis source surviving the question tree").

## Carries forward

- The pitch-detect confidence value is computed but not yet written into the mapping report — surface in next iteration if low-confidence files start showing up as outliers.
- Crossfade-loop generation not yet implemented; only one-shot regions for now.
- Velocity layering not yet inferred from source folder; flat across the keyboard.
