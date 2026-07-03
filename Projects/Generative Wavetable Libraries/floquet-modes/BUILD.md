# Floquet Modes wavetable — Phase 2 NEW-SOURCE build notes

## What this is
The second algorithmic source proof for **Generative Wavetable Libraries**, and
the answer to the `gwl-steward-024` grant (**NEW-SOURCE**, 2026-06-09). A single
wavetable whose Position knob sweeps the **modulation depth** of a time-periodic
(parametric / Mathieu) oscillator — the idea named by the entry's
`[[Floquet Theory]]` link, label *time-periodic-modulation*.

`cubic → triclinic` was crystal-bravais' spine; here the spine is
`pure sine → dense sideband comb`. Position 0 is a bare fundamental; Position 1
is a bright Bessel sideband cluster. One held note blooms from sine to buzz.

Run: `python3 generate_floquet.py` (numpy + scipy). Audition:
`python3 render_audition.py` → `floquet_modes_audition_sweep.wav` (8 s @ 110 Hz,
Position scanned 0→1).

## The Floquet sideband model (honest caveat)
This is **not** a stiff numerical integration of the Mathieu equation — near an
instability tongue the ODE diverges and will not normalize into a clean single
cycle. Instead the **Floquet sideband spectrum** is synthesized directly. A
Floquet solution in a stable band has the form

    x(t) = e^{i·ν·t} · Σ_k c_k e^{i·k·ω_pump·t}

— a carrier at the Floquet exponent plus sidebands spaced by the pump. For a
parametric drive the sideband amplitudes follow the Bessel envelope `J_k(β)` (the
classical FM/parametric sideband law). Using `|J_k(β)|` gives a clean,
normalizable, monotonically-enriching cycle that reduces to a pure sine at β=0
(J₀=1, all higher J_k=0). Faithful to the Floquet picture — sidebands from
time-periodic modulation — without the ODE's numerical fragility.

**Carrier anchored at the fundamental (h=1), sidebands one-sided upward.** This
keeps the perceived **pitch stable** across the sweep. The more exotic variant —
carrier mid-spectrum with two-sided sidebands — lets the lower sidebands fill in
toward DC as β grows, which glides the perceived pitch down ~3 octaves over the
sweep. Wrong for a wavetable (Position should change *timbre* at constant pitch),
so that two-sided / period-doubling-tongue variant is **logged as future work**.

## The characteristic signature: carrier nulls
Because the fundamental's amplitude is `|J₀(β)|`, it **nulls to near-zero** at the
Bessel zeros (β ≈ 2.40, 5.52, 8.65 → Positions ~16, ~40, ~60). At those points the
tone goes momentarily hollow before the brightness returns. This is the authentic
FM/parametric "carrier null" — a real feature of time-periodic modulation, not a
defect. It is what makes this sweep distinct from crystal-bravais (a symmetry
walk) and shepard-centroid (a smooth spectral-centroid cloud).

## Verification done at build time
- Both WAVs exist, non-empty, correct sizes.
- Ableton fallback: 64 × 1024 = 65,536 samples; mono 16-bit; 44100 Hz.
- Serum/CLM: chunk order `JUNK / fmt / clm / data`; `clm ` payload
  `<!>2048 01000000 wavetable (www.xferrecords.com)`; data 524,288 bytes
  (= 64 × 2048 × 4); written by the byte-verified `clm_writer.py`.
- Spectrum progression (Ableton table): centroid harmonic **1.00 → 6.65**;
  significant partials **1 → 14**; effectively monotonic — max single-step
  centroid drop 0.05, zero frames dropping more than that (the sub-0.05 ripple is
  the inherent Bessel oscillation, audible as the carrier-null character above).
- Phase policy: ZERO_PHASE_RESET (matches crystal-bravais / gwl-steward-004).
- The author (a text agent) **cannot hear** the file. Whether the bloom + carrier
  nulls read as intentional musical motion is what `floquet_modes_audition_sweep.wav`
  is for — Loudon's ears.

## Files in this bundle
- `generate_floquet.py` — the generator (reuses `../crystal-bravais/clm_writer.py`).
- `render_audition.py` — real wavetable playback of the table as a sweep.
- `floquet_modes.wav` — Serum / CLM (also Vital, Surge XT, Pigments, Phase Plant, Falcon).
- `floquet_modes_ableton.wav` — Ableton Wavetable fallback.
- `floquet_modes_audition_sweep.wav` — the listenable proof.
