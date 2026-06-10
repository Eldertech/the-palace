# Tract Mirror - DSP Reference Report

Validated reference for a monophonic LPC voice synthesizer whose thesis is that
the LPC lattice filter and the Kelly-Lochbaum cylindrical-tube digital waveguide
are the same structure read from opposite ends. This document is the contract
the C++ port and the three.js GUI must honor.

## 1. What was built

| File | Role |
|---|---|
| `kl_reference.py` | Reference implementation: glottal source, Kelly-Lochbaum tract, the lattice/tube identity (Levinson step-up), state-space pole extraction, exact mirror validation. |
| `fit_vowels.py` | Area-function fitter. 64-point `exp(cosine series)` area curves optimized to Peterson-Barney male formant targets, constrained and smoothness-penalized. |
| `vowels.json` | The fit output, consumed verbatim by the GUI and C++ engine. |
| `make_renders.py` | Renders all audio (`renders/*.wav`) and images (`renders/*.png`). |
| `renders/` | 9 WAVs (44.1 kHz / 16-bit / -3 dBFS) + 7 PNGs. |

The synthesizer chain: a Rosenberg-style glottal pulse (open quotient + tension
spectral tilt) plus an aspiration-noise path, mixed by `breath`, excites a
bidirectional two-rail Kelly-Lochbaum waveguide of `N = round(fs * L / c)`
one-sample sections (L = 0.171 m, c = 343 m/s -> N = 22 at 44.1 kHz, 24 at
48 kHz). Output at the lip carries a first-difference radiation high-frequency
emphasis.

## 2. The lattice-equals-tube identity (two sentences)

The same ladder of reflection coefficients `k_i = (A_i - A_{i+1})/(A_i + A_{i+1})`
is simultaneously an LPC lattice filter and a cascade of acoustic-tube scattering
junctions, and the Levinson step-up recursion converts that one ladder into the
direct-form all-pole denominator `A(z)` whose poles are the tract's formants.
Lattice (reflection coefficients), tube (area ratios), and all-pole (`a_i`) are
three notations for one operator; `step_up(k) == a`, and the area relation
`A_{i+1}/A_i = (1-k_i)/(1+k_i)` carries it to the third notation.

This identity is demonstrated numerically three ways that all agree:
the eigenvalues of the time-domain tract's state matrix (the audio path's exact
poles), the FFT of its impulse response, and the autocorrelation-Levinson
all-pole fit to that same impulse response. The state-matrix simulation
reproduces the per-sample synthesis loop to 6.9e-18 (machine precision), so the
formants reported here are exactly the formants the audio path produces.

## 3. Formant verification table

Fit at fs = 44100 (N = 22); the same 64-point physical area curve re-verified at
fs = 48000 (N = 24) with its own N. Tolerance: F1/F2 within 5 %, F3 within 10 %.
Measured = resonant poles of the tract state matrix (`find_formants`).

| Vowel | Target F1/F2/F3 (Hz) | 44.1k measured (err %) | 48.0k measured (err %) | Pass |
|---|---|---|---|---|
| a | 730 / 1090 / 2440 | 730 / 1090 / 2441  (0.0 / 0.0 / 0.1) | 733 / 1090 / 2431  (0.4 / 0.0 / 0.4) | yes |
| e | 530 / 1840 / 2480 | 530 / 1840 / 2481  (0.0 / 0.0 / 0.0) | 529 / 1837 / 2476  (0.1 / 0.1 / 0.2) | yes |
| i | 270 / 2290 / 3010 | 270 / 2290 / 3010  (0.0 / 0.0 / 0.0) | 269 / 2283 / 3009  (0.3 / 0.3 / 0.0) | yes |
| o | 570 /  840 / 2410 | 569 /  836 / 2392  (0.3 / 0.4 / 0.8) | 573 /  848 / 2389  (0.6 / 0.9 / 0.9) | yes |
| u | 300 /  870 / 2240 | 300 /  870 / 2241  (0.0 / 0.0 / 0.0) | 301 /  870 / 2232  (0.3 / 0.0 / 0.4) | yes |
| schwa | 500 / 1500 / 2500 | 501 / 1503 / 2506  (0.2 / 0.2 / 0.2) | 500 / 1500 / 2500  (0.0 / 0.0 / 0.0) | yes |

All errors are under 1 % at both rates, well inside tolerance. The cross-rate
stability confirms the 64-point area curve is the rate-invariant object and N is
correctly derived per rate.

## 4. Sign conventions and end reflections

Two pressure-wave rails, glottis -> lips: `f[i]` forward, `b[i]` backward.
Interior junction i (between section i and i+1), one-multiply form with
`w = k_i * (f_in - b_in)`:

```
f_out (into section i+1) = f_in + w
b_out (into section i)   = b_in + w
```

`k_i = (A_i - A_{i+1})/(A_i + A_{i+1})`: entering a NARROWER tube gives k_i > 0,
a WIDER tube gives k_i < 0. This matches the LPC reflection-coefficient sign in
`step_up`.

- Glottal end (section 0, near-closed): high impedance, positive reflection.
  `new_f[0] = glottal_reflection * b[0] + excitation`, with
  `glottal_reflection = +0.97`. Excitation is ADDED into the forward rail here.
- Lip end (section N-1, open): low impedance (pressure release), negative
  reflection. `new_b[N-1] = lip_reflection * lowpass(f[N-1])`, with
  `lip_reflection = -0.9`. A one-pole lowpass on the reflected wave models
  frequency-dependent radiation loss.
- Per-junction loss: every junction output is multiplied by
  `junction_loss = 0.996` for guaranteed bounded output with near-unity end
  reflections; it mildly widens formant bandwidths (physically realistic).
- Output / radiation: the transmitted lip signal `(1 + lip_reflection)*f[N-1]`
  with a first-difference (+6 dB/oct) radiation emphasis for AUDIO. For FORMANT
  ANALYSIS the first difference is turned OFF (it adds a DC zero that does not
  move the poles but tilts the spectrum steeply enough to bury F1); analysis
  reads the raw transmitted pressure, whose spectral peaks are the true poles.

A uniform tube reproduces the closed-open quarter-wave resonances exactly:
501 / 1503 / 2506 Hz at 44.1 kHz (theory: odd-and-even round-trip series on
fs/(4N) ~ 500 / 1500 / 2500). This is the canonical check that both end signs
are right.

## 5. Observed k-coefficient ranges

Interior reflection coefficients across all six fitted vowels (at 44.1 kHz,
22 sections): k in [-0.558, +0.444], all comfortably inside (-1, 1).
Terminations: glottis ladder reflection +0.97, lip pressure-wave reflection
-0.90. The waveguide is passive and stable for every shipped vowel; the junction
loss 0.996 plus sub-unity interior k guarantees a bounded state matrix (all poles
inside the unit circle, confirmed by the eigenvalue extraction).

## 6. What the C++ port must not get wrong

1. The two end signs are the classic bug. Glottis reflection is POSITIVE
   (+0.97), lip reflection is NEGATIVE (-0.9). Swapping or sign-flipping either
   end turns the quarter-wave tube into the wrong resonator. Validate against the
   uniform-tube 501/1503/2506 Hz check before trusting any vowel.
2. Excitation enters the FORWARD rail at the glottis, added after the glottal
   reflection (`new_f[0] = glottal_reflection*b[0] + excitation`), not mixed into
   the backward rail.
3. `k_i = (A_i - A_{i+1})/(A_i + A_{i+1})` with sections ordered glottis -> lips.
   Reversing the area array silently mirrors the tube and moves formants.
4. Never interpolate reflection coefficients directly. For morphing/vowel blends,
   interpolate AREAS in the LOG domain, resample to N sections, THEN recompute k.
   Interpolating k directly can leave the stable region and corresponds to no
   physical tube.
5. N is rate-dependent: `N = round(fs * L / c)`. The 64-point area curve in
   vowels.json is the invariant; resample it to N (log-domain) per rate. Do not
   bake in N = 22.
6. Per-junction loss (0.996) is required for stability, not decoration. With
   loss = 1.0 and end reflections at +-0.97 / -0.9 the system sits on the unit
   circle and rings without bound.
7. Radiation first-difference belongs on the AUDIO output only. It is +6 dB/oct
   and adds a DC zero. Do not apply it inside the analysis/pole path, or F1
   measurement is biased (the GUI formant readout should use the pole/eigen path,
   not the radiated spectrum).
8. The radiation lowpass on the reflected lip wave (`radiation_lowpass`, default
   0.75 one-pole) is part of the AUDIO model and is OFF in the analysis state
   matrix. Keep that split, or audio and displayed formants drift apart.
9. Audio gain staging: raw tract output is small (peak ~0.02 for a 110 Hz pulse
   train); normalize at the end (-3 dBFS here). Do not assume unity-scale output.
10. Levinson convention: `a_i` are in the SUBTRACTIVE form
    `y[n] = x[n] + sum a_i y[n-i]`, so the freqz/IIR denominator is
    `[1, -a_1, ..., -a_p]`. Match this sign or the synthesis filter inverts.

## 7. Verification gates (all green)

- Every vowel within tolerance at BOTH 44.1 kHz and 48 kHz: PASS (errors < 1 %).
- All 9 WAVs finite, non-silent, no clipping, normalized to -3 dBFS: PASS.
- Spectrogram formant energy visibly on the overlaid target lines: PASS
  (see renders/spectrogram_*.png; /i/ and /a/ are the clearest demonstrations).
- State-matrix vs. per-sample synthesis loop divergence: 6.9e-18 (machine eps).
- Mirror agreement (eigen-poles / impulse-FFT / Levinson all-pole): peaks match.
- Uniform-tube closed-open resonances exact (501 / 1503 / 2506 Hz).

Run `python3 kl_reference.py` for the identity smoke test, `python3 fit_vowels.py`
to refit and rewrite vowels.json, and `python3 make_renders.py` to regenerate all
renders.
