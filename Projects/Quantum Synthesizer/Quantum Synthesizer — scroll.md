---
title: "Quantum Synthesizer — scroll"
born: 2026-09-23
links:
  - target: "[[Quantum Synthesizer]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am Quantum Synthesizer's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# Quantum Synthesizer — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[Quantum Synthesizer]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-23T04:36:43.543Z from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — steer the project in **Standing Orders** below, never here._

- **Status:** active · **Stage:** dormant · **Steward:** cycle 4 · last ran 2026-06-25 (90 days ago)
- **Waiting on you:** nothing
- **Ready to advance:** no unread answers
- **Last shipped:** 2026-06-23 (91 days ago) — Audio side has its first proof. Where does the next cycle land — the visual side, or more potentials? (`quantum-synth-004`)
- **Last commit touching this project:** 2026-09-03 `1b67a68` — edit(close-2026-09-02): the counter-discipline gets its proof; the deposit sheds what it grew
- **Signal:** ⚠ the last cycle posted nothing (one barren cycle — the lane will retry before calling it stalled)
- **Drift:** no consolidation marker on the entry — nothing to measure against.

### Where this stands

The forward_vector wants the claim proved through audio AND video, not only prose. The audio leg just landed (msg above). My lean for cycle 4 is the visual side: an animation showing V(x) morphing from parabolic to quartic-bent, the eigenfunctions φₙ(x) redrawing as the well bends, and the partial ratios on a side panel — synced to the A/B WAV. That closes the dual-channel rule for one full claim before widening. The alternative is to deepen audio first: render Morse, double-well, and asymmetric-well potentials so the timbral atlas exists before any video work. Reasonable; just leaves the eye unfed for another cycle. I will proceed with VIDEO-NEXT if you don't steer.

### Open asks

_None — nothing is waiting on you._

### Answered, not yet consumed

_None._

### Decided

- `quantum-synth-004` — directional_steer → GRANTED — option_id=VIDEO-NEXT (2026-06-25)

<!-- scroll:now:end -->

## Standing Orders

<!-- scroll:orders:start -->
_Loudon's standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="quantum-synth-004" -->
### 2026-06-23 — cycle 3 — Audio side has its first proof. Where does the next cycle land — the visual side, or more potentials?
> shipped audio A/B · my lean: VIDEO-NEXT (vector asks for both ear and eye) · non-blocking

The forward_vector wants the claim proved through audio AND video, not only prose. The audio leg just landed (msg above). My lean for cycle 4 is the visual side: an animation showing V(x) morphing from parabolic to quartic-bent, the eigenfunctions φₙ(x) redrawing as the well bends, and the partial ratios on a side panel — synced to the A/B WAV. That closes the dual-channel rule for one full claim before widening. The alternative is to deepen audio first: render Morse, double-well, and asymmetric-well potentials so the timbral atlas exists before any video work. Reasonable; just leaves the eye unfed for another cycle. I will proceed with VIDEO-NEXT if you don't steer.

**Artifacts:**
- [schrodinger-AB-harmonic-then-anharmonic.wav](Projects/Quantum Synthesizer/proofs/schrodinger-AB-harmonic-then-anharmonic.wav)
- [quartic-bent-anharmonic-bell.wav](Projects/Quantum Synthesizer/proofs/quartic-bent-anharmonic-bell.wav)
- [parabolic-harmonic-clean-tone.wav](Projects/Quantum Synthesizer/proofs/parabolic-harmonic-clean-tone.wav)
<sub>`quantum-synth-004` · RESOURCE_REQUEST on TRICKSTER</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="quantum-synth-003" -->
### 2026-06-23 — cycle 3 — First audio proof: same eigensolver, two potential wells, two timbres — the geometry of confinement IS the spectrum.
> shipped · three WAVs from a 1D Schrödinger eigensolve · A/B harmonic vs anharmonic

Quantum Synthesizer — the project's claim is that the Schrödinger equation is an audio synthesis engine, not a metaphor for one. Last cycle the first proof landed on disk and never made it to the board; here it is. A finite-difference 1D Hamiltonian (numpy.linalg.eigvalsh, no scipy) is diagonalized for two potentials. A parabolic well gives equally-spaced eigenvalues — the harmonic series — and a clean pitched tone fundamental G3. A quartic-bent well stretches the upper levels apart and the same additive resynthesis produces a struck-metal bell. Same solver, same resynthesis, only V(x) changes. That is the whole argument, now audible.

**Artifacts:**
- [A — parabolic well · clean pitched tone · the harmonic series, heard.](Projects/Quantum Synthesizer/proofs/parabolic-harmonic-clean-tone.wav)
- [B — quartic-bent well · struck-metal bell · stretched partials from the same solver.](Projects/Quantum Synthesizer/proofs/quartic-bent-anharmonic-bell.wav)
- [A→B back-to-back · the only change between them is V(x).](Projects/Quantum Synthesizer/proofs/schrodinger-AB-harmonic-then-anharmonic.wav)
- [the script — finite-difference Hamiltonian, eigvalsh, additive resynthesis (stdlib wave).](Projects/Quantum Synthesizer/proofs/schrodinger_ab_synth.py)

_first 6 normalized partial ratios (gap E_n − E_0 over gap E_1 − E_0)_
| n | A — parabolic | B — quartic-bent | interpretation |
| --- | --- | --- | --- |
| 1 | 1.00 | 1.00 | fundamental — pinned |
| 2 | 2.00 | 2.18 | B sharps upward |
| 3 | 3.00 | 3.52 | stretch grows with n |
| 4 | 4.00 | 5.00 | bell-like inharmonicity |
| 5 | 5.00 | 6.59 | — |
| 6 | 6.00 | 8.27 | — |
<sub>`quantum-synth-003` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->
<!-- scroll:making:end -->
