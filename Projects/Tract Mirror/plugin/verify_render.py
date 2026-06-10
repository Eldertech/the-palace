#!/usr/bin/env python3
"""
verify_render.py - verification gate for the Tract Mirror C++ port.

Validates that the C++ engine reproduces the validated Python reference tract by
measuring F1/F2/F3 of each harness vowel and comparing against the canonical
formants_measured_48k_hz in reference/vowels.json.

Two signals per vowel, both rendered by the REAL processor in the harness:

  * render_<vowel>.wav   - the full AUDIO path (Rosenberg source -> KL tract ->
                           lip-radiation first difference). Used for the SANITY
                           gates (non-silence, finite, non-clipping) and as the
                           listening artifact.

  * analysis_<vowel>.wav - the tract IMPULSE RESPONSE on the same morphed areas,
                           radiation OFF (raw transmitted pressure). This is the
                           reference ANALYSIS path (REPORT sec 4 / sec 6 item 7:
                           formant readout uses the pole/analysis path, not the
                           radiated spectrum). Its spectral peaks ARE the exact
                           tract poles. Used for the FORMANT gate.

Why two signals: voiced LPC on a 110 Hz tone cannot resolve low formants - F1 of
/i/ (270 Hz) and /u/ (300 Hz) falls between the 2nd and 3rd harmonics of a 110 Hz
fundamental, so the harmonic comb under-samples the envelope. This is a property
of the signal, not the synthesis: the Python REFERENCE audio fails the same 3 %
gate under voiced LPC by 15-30 %. The reference itself measures formants from the
tract poles (find_formants / the impulse-response Levinson fit), never from
voiced audio. The analysis IR recovers the canonical numbers to ~0 % because it
is exactly that path, driven through the C++ engine's own tract loop.

Formant method: reuse the reference autocorrelation -> Levinson-Durbin all-pole
fit (kl_reference.levinson_durbin) on the steady IR, take the resonant poles
(roots of A(z) inside the unit circle), sorted by frequency - identical to
kl_reference.tract_transfer_function's measurement chain.

GATE (all six vowels must pass):
  * F1 within 3 %, F2 within 3 %, F3 within 6 %  (on analysis_<vowel>.wav)
  * AUDIO render is non-silent, finite (no NaN/Inf), and non-clipping (|x|<=1)
"""

import sys
import json
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
PLUGIN_DIR = HERE
PROJECT_DIR = PLUGIN_DIR.parent
REFERENCE_DIR = PROJECT_DIR / "reference"
RENDER_DIR = PLUGIN_DIR / "test-renders"

# Import the reference Levinson-Durbin (same recursion that built vowels.json).
sys.path.insert(0, str(REFERENCE_DIR))
import kl_reference as kl  # noqa: E402

FS = 48000
TOL_F1 = 0.03
TOL_F2 = 0.03
TOL_F3 = 0.06

VOWELS = ["a", "e", "i", "o", "u", "schwa"]


def read_wav_mono(path):
    """Read a WAV (mono or stereo, 16/24/32-bit PCM) as float64 in [-1, 1]."""
    with wave.open(str(path), "rb") as w:
        n_channels = w.getnchannels()
        sampwidth = w.getsampwidth()
        fs = w.getframerate()
        n_frames = w.getnframes()
        raw = w.readframes(n_frames)

    if sampwidth == 2:
        data = np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0
    elif sampwidth == 3:
        a = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 3).astype(np.int32)
        vals = a[:, 0] | (a[:, 1] << 8) | (a[:, 2] << 16)
        vals = np.where(vals & 0x800000, vals - 0x1000000, vals)
        data = vals.astype(np.float64) / 8388608.0
    elif sampwidth == 4:
        data = np.frombuffer(raw, dtype="<i4").astype(np.float64) / 2147483648.0
    else:
        raise ValueError(f"unsupported sample width {sampwidth}")

    if n_channels > 1:
        data = data.reshape(-1, n_channels)[:, 0]
    return data, fs


def measure_formants_from_ir(ir, fs, n_formants=3):
    """F1..Fn via autocorrelation Levinson-Durbin on the tract impulse response.

    Mirrors kl_reference.tract_transfer_function's measurement chain: build the
    autocorrelation up to lag = lpc_order (= 2N, the round-trip pole count of an
    N-section closed-open tube), run levinson_durbin to get the all-pole
    denominator, then take the resonant poles (roots of A(z) inside the unit
    circle, one of each conjugate pair) sorted by frequency. Using the
    polynomial ROOTS (not FFT bins) avoids quantization, matching the exactness
    of the reference eigen-pole readout.
    """
    x = np.asarray(ir, dtype=float)
    # analysis on the steady response (skip nothing - the IR IS the steady tract
    # response; we just window to bound the autocorrelation)
    N = kl.n_sections(fs)
    lpc_order = 2 * N

    r = np.array([np.dot(x[: len(x) - lag], x[lag:]) for lag in range(lpc_order + 1)])
    if r[0] <= 0:
        return np.array([np.nan] * n_formants)
    a, _k = kl.levinson_durbin(r, lpc_order)

    denom = np.concatenate([[1.0], -a])     # A(z) = 1 - a_1 z^-1 - ... (subtractive)
    roots = np.roots(denom)

    formants = []
    for p in roots:
        if np.abs(p) >= 1.0:
            continue
        if np.imag(p) <= 0:
            continue                          # one of each conjugate pair
        f = np.angle(p) / (2.0 * np.pi) * fs
        if 90.0 < f < 0.46 * fs:
            formants.append(f)
    formants.sort()
    freqs = list(formants[:n_formants])
    while len(freqs) < n_formants:
        freqs.append(np.nan)
    return np.array(freqs)


def main():
    with open(REFERENCE_DIR / "vowels.json") as f:
        ref = json.load(f)

    print("Tract Mirror - render verification gate (fs = 48000)")
    print("=" * 88)
    print(f"{'vowel':<6} {'formant':<8} {'measured':>10} {'expected':>10} "
          f"{'err %':>8} {'tol %':>7} {'pass':>6}")
    print("-" * 88)

    all_pass = True

    for v in VOWELS:
        audio_path = RENDER_DIR / f"render_{v}.wav"
        ir_path = RENDER_DIR / f"analysis_{v}.wav"

        if not audio_path.exists() or not ir_path.exists():
            print(f"{v:<6}  MISSING render(s): {audio_path.name} / {ir_path.name}")
            all_pass = False
            continue

        # ---- sanity gates on the AUDIO render ----------------------------------
        audio, fs_a = read_wav_mono(audio_path)
        if fs_a != FS:
            print(f"{v:<6}  WRONG sample rate {fs_a} (expected {FS})")
            all_pass = False
            continue

        finite = bool(np.all(np.isfinite(audio)))
        peak = float(np.max(np.abs(audio))) if len(audio) else 0.0
        rms = float(np.sqrt(np.mean(audio ** 2))) if len(audio) else 0.0
        non_silent = rms > 1e-4
        no_clip = peak <= 1.0 + 1e-6

        if not finite:
            print(f"{v:<6}  FAIL: audio non-finite (NaN/Inf)")
            all_pass = False
        if not non_silent:
            print(f"{v:<6}  FAIL: audio silent (rms {rms:.2e})")
            all_pass = False
        if not no_clip:
            print(f"{v:<6}  FAIL: audio clipping (peak {peak:.4f})")
            all_pass = False

        # ---- formant gate on the ANALYSIS IR -----------------------------------
        ir, fs_i = read_wav_mono(ir_path)
        if fs_i != FS:
            print(f"{v:<6}  WRONG analysis sample rate {fs_i}")
            all_pass = False
            continue

        ir_finite = bool(np.all(np.isfinite(ir)))
        if not ir_finite:
            print(f"{v:<6}  FAIL: analysis IR non-finite")
            all_pass = False

        measured = measure_formants_from_ir(ir, fs_i, n_formants=3)
        expected = np.array(ref["vowels"][v]["formants_measured_48k_hz"], dtype=float)
        tols = [TOL_F1, TOL_F2, TOL_F3]

        vowel_pass = finite and non_silent and no_clip and ir_finite
        for i, (label, tol) in enumerate(zip(["F1", "F2", "F3"], tols)):
            m = measured[i]
            e = expected[i]
            if not np.isfinite(m):
                err = float("inf")
                fp = False
            else:
                err = abs(m - e) / e
                fp = err <= tol
            vowel_pass = vowel_pass and fp
            print(f"{v:<6} {label:<8} {m:>10.1f} {e:>10.1f} {err*100:>8.2f} "
                  f"{tol*100:>7.1f} {'OK' if fp else 'FAIL':>6}")

        if not vowel_pass:
            all_pass = False
        print("-" * 88)

    print("=" * 88)
    print("sanity: audio renders checked finite / non-silent / non-clipping above")
    print(f"RESULT: {'ALL GREEN' if all_pass else 'GATE FAILED'}")
    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
