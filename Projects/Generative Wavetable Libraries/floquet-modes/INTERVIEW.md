---
title: "Floquet Modes — Interview record"
born: 2026-06-23
links:
  - target: "[[Generative Wavetable Libraries]]"
    type: connects-to
    label: graduating-run-of
  - target: "[[_ops/wavetable-libraries/skills/interview/SKILL]]"
    type: connects-to
    label: graduating-run-of
  - target: "[[Crystal Synthesizer]]"
    type: connects-to
  - target: "[[Floquet Theory]]"
    type: connects-to
forward_vector: "I am the first end-to-end pass of the wavetable-Interview question tree against a real source. I exist to prove the skill fits a built artifact before it is asked to drive a new one."
---

# Floquet Modes — Interview record

The wavetable-Interview skill's **first graduating run**. The Floquet Modes bundle was built in cycle 6 (gwl-steward-024 NEW-SOURCE) and accepted in cycle 8. This record retroactively walks the bundle through the skill's six-branch question tree as a fit-test: every answer is something the bundle already commits to, expressed in the skill's vocabulary. If the tree cannot accommodate the answers, the tree is wrong. It accommodates all six.

## Rule 1 — Convention preview

- **Bundle path:** `Projects/Generative Wavetable Libraries/floquet-modes/`
- **Output filenames:** `floquet_modes.wav` (CLM), `floquet_modes_ableton.wav` (Ableton), `floquet_modes_audition_sweep.wav` (audition)
- **Frame layout:** 64 frames × 2048 samples (CLM) / 64 × 1024 (Ableton); CLM chunk payload `<!>2048 01000000 wavetable (www.xferrecords.com)`
- **Sweep spine (one sentence):** *pure sine → dense Bessel sideband comb; one held note blooms from sine to buzz as Position scans 0 → 1, with three carrier nulls at the Bessel zeros (β ≈ 2.40, 5.52, 8.65 → frames ~16, ~40, ~60).*

Loudon confirmed acceptance in cycle 8 (gwl-steward-029, *"they all work very well, propose a major build"*). The convention preview passes retroactively.

## Rule 2 — Audition before batch

`floquet_modes_audition_sweep.wav` — 8 seconds at 110 Hz, Position scanned 0 → 1. Loudon listened, accepted, *then* the full CLM + Ableton tables shipped as deployable. Audition-before-batch discipline held.

## The six branches

**1 · Source.** Palace synthesis — [[Floquet Theory]]. Frame parameter: dimensionless modulation depth `β`. Held fixed: carrier at the fundamental (h=1), sidebands one-sided upward (chosen to keep perceived pitch stable; the two-sided variant was logged as future work in BUILD.md). Sideband amplitudes follow `|J_k(β)|` — synthesized directly rather than integrating the Mathieu ODE (which diverges in instability tongues). This is the honest-caveat tradeoff in the bundle's BUILD.md, made legible.

**2 · Sweep spine.** *Pure sine → dense Bessel sideband comb.* Position 0 is a bare fundamental (β=0, J₀=1, all higher J_k=0). Position 1 is a bright Bessel cluster. The monotonic axis is **modulation depth**, expressed in centroid harmonic as 1.00 → 6.65 and significant partials as 1 → 14. The spine has a characteristic feature — **carrier nulls** at the Bessel zeros — that distinguishes its motion from Crystal Bravais (symmetry walk) and Shepard CENTROID-FREQ (smooth centroid cloud).

**3 · Format.** Serum/CLM + Ableton Wavetable (the default offered by the skill). CLM written via the shared `clm_writer.py` from the crystal-bravais bundle (byte-verified, not re-implemented — per the skill's default). Surge `.wt` deferred; single-cycle exports not requested.

**4 · Frame count.** 64 — the skill's default. Plenty of resolution to land the three carrier nulls on distinguishable frame positions (~16, ~40, ~60) without paying for 256 frames where the smooth Bessel curve does not warrant it.

**5 · Phase policy.** ZERO_PHASE_RESET. The GWL convention from cycle 4 (gwl-steward-004). Matches Crystal Bravais and Shepard CENTROID-FREQ. The Bessel sideband stack has no inter-frame phase content worth preserving.

**6 · Audition pitch.** 110 Hz (A2) — the skill's default. Low enough to hear the upper sidebands; short enough cycle period that 64 frames at 8 seconds give every frame audible dwell.

## Fit verdict

Every answer slots cleanly. No branch needed restructuring to describe Floquet. The spine question (branch 2) earned its rank as the rule-1 sweep semantic — without it the Floquet build would be a Bessel curiosity, not an instrument. The default suggestions (CLM + Ableton, 64 frames, zero-phase reset, 110 Hz audition) matched what the bundle had already chosen by hand in cycle 6, which is what "the skill captures the working pattern" should look like.

## What this run leaves for the next

- The fit-test was retroactive — the bundle predated the skill. **The skill's promotion to `/skills/wavetable-library-interview/` requires at least one fresh source driven through the question tree from scratch.** Natural candidates: an AKWF-imported wavetable (exercises branches 1.b + the captured-audio default), or a fresh [[Crystal Synthesizer]] variant (different lattice family).
- The CLM-writer verification against the Serum reference folder (`/Library/Audio/Presets/Xfer Records/Serum 2 Presets/Tables/Analog`) is still pending — flagged in the skill text and in this bundle's BUILD.md. A separate cycle.
- The two-sided / period-doubling Floquet variant (perceived pitch glides down ~3 octaves over the sweep, wrong for a wavetable but right for something else) is the natural Floquet-II bundle when a fresh run is wanted.
