#!/usr/bin/env python3
"""
verify_word.py - verification gate for Tract Mirror Word mode (INTERFACE.md sec 6).
Companion to verify_render.py, verify_midi.py, verify_loudness.py. All must pass.

Word mode: type a word, scan a fader through it, and the synth sings the vowels.
The word "you" maps y->i, o->o, u->u, so its path is the three anchors i, o, u.

The render harness sets the word via the REAL state-injection path (setWord, which
republishes the path to the audio thread - not a test-only shortcut), holds a note,
and steps the wordScan PARAMETER to the plateau centre of each path segment, writing
one WAV per segment:

  * word_you_<seg>.wav   - the word scanned to segment <seg>'s plateau
  * word_ref_<seg>.wav   - a param render at that segment's exact anchor pad coords

F1/F2 are measured identically on both (voiced-LPC at 110 Hz) so the bias cancels;
the scanned plateau must match its anchor reference within 3 %.

State round-trip: word "you" @ the u-plateau is saved, restored into a FRESH
processor instance, and rendered (word_you_u_restored.wav). The restored render
must drive the path identically - we check F1/F2 match AND a tight sample checksum
against word_you_u.wav.

GATES (all must pass):
  * each segment: |F1 - F1_ref|/F1_ref <= 3 %  and  |F2 - F2_ref|/F2_ref <= 3 %
  * round-trip: restored F1/F2 within 0.5 % of the original AND mean-abs sample
    difference < 1e-4 (the renders are deterministic, so they should be near-identical)
"""

import sys
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
PROJECT_DIR = HERE.parent
REFERENCE_DIR = PROJECT_DIR / "reference"
RENDER_DIR = HERE / "test-renders"

sys.path.insert(0, str(REFERENCE_DIR))
import kl_reference as kl  # noqa: E402

FS = 48000
SEG_TOL = 0.03          # 3 % on F1, F2 vs anchor reference
RT_FORMANT_TOL = 0.005  # 0.5 % on restored vs original
RT_SAMPLE_TOL = 1e-4    # mean-abs sample difference for the round-trip

SEGMENTS = ["i", "o", "u"]   # path of the word "you"


def read_wav_mono(path):
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


def measure_formants_voiced(x, fs, n=2):
    """Same voiced-LPC chain as verify_midi.py so the bias cancels in comparisons."""
    x = np.asarray(x, dtype=float)
    x = x - np.mean(x)
    if len(x) < 8 or np.max(np.abs(x)) < 1e-9:
        return [np.nan] * n
    x = np.append(x[0], x[1:] - 0.97 * x[:-1])
    x = x * np.hanning(len(x))
    order = 2 * kl.n_sections(fs)
    r = np.array([np.dot(x[: len(x) - lag], x[lag:]) for lag in range(order + 1)])
    if r[0] <= 0:
        return [np.nan] * n
    a, _k = kl.levinson_durbin(r, order)
    roots = np.roots(np.concatenate([[1.0], -a]))
    out = []
    for p in roots:
        if np.abs(p) >= 1.0 or np.imag(p) <= 0:
            continue
        f = np.angle(p) / (2.0 * np.pi) * fs
        if 90.0 < f < 0.46 * fs:
            out.append(f)
    out.sort()
    while len(out) < n:
        out.append(np.nan)
    return out[:n]


def steady(path):
    x, fs = read_wav_mono(path)
    # steady inner window past the attack/settling, before the release tail
    return x[int(0.40 * fs):int(1.30 * fs)], fs, x


def gate_segments():
    print("WORD 'you'  path i,o,u  (scanned plateau vs anchor reference)")
    print("-" * 72)
    print(f"  {'seg':<5} {'F1':>8} {'F1ref':>8} {'e%':>6}   {'F2':>8} {'F2ref':>8} {'e%':>6}  {'pass':>5}")
    ok = True
    for seg in SEGMENTS:
        sp = RENDER_DIR / f"word_you_{seg}.wav"
        rp = RENDER_DIR / f"word_ref_{seg}.wav"
        if not sp.exists() or not rp.exists():
            print(f"  {seg:<5}  MISSING {sp.name} / {rp.name}")
            return False
        sw, fs, _ = steady(sp)
        rw, _, _ = steady(rp)
        fseg = measure_formants_voiced(sw, fs)
        fref = measure_formants_voiced(rw, fs)
        e1 = abs(fseg[0] - fref[0]) / fref[0] if np.isfinite(fseg[0]) and fref[0] else float("inf")
        e2 = abs(fseg[1] - fref[1]) / fref[1] if np.isfinite(fseg[1]) and fref[1] else float("inf")
        seg_ok = e1 <= SEG_TOL and e2 <= SEG_TOL
        ok = ok and seg_ok
        print(f"  {seg:<5} {fseg[0]:>8.1f} {fref[0]:>8.1f} {e1*100:>6.2f}   "
              f"{fseg[1]:>8.1f} {fref[1]:>8.1f} {e2*100:>6.2f}  {'OK' if seg_ok else 'FAIL':>5}")
    return ok


def gate_round_trip():
    print()
    print("STATE ROUND-TRIP  (save 'you'@u, restore into fresh instance)")
    print("-" * 72)
    orig_p = RENDER_DIR / "word_you_u.wav"
    rest_p = RENDER_DIR / "word_you_u_restored.wav"
    if not orig_p.exists() or not rest_p.exists():
        print(f"  MISSING {orig_p.name} / {rest_p.name}")
        return False
    ow, fs, ofull = steady(orig_p)
    rw, _, rfull = steady(rest_p)
    fo = measure_formants_voiced(ow, fs)
    fr = measure_formants_voiced(rw, fs)
    e1 = abs(fr[0] - fo[0]) / fo[0] if np.isfinite(fr[0]) and fo[0] else float("inf")
    e2 = abs(fr[1] - fo[1]) / fo[1] if np.isfinite(fr[1]) and fo[1] else float("inf")
    n = min(len(ofull), len(rfull))
    mad = float(np.mean(np.abs(ofull[:n] - rfull[:n]))) if n else float("inf")
    fmt_ok = e1 <= RT_FORMANT_TOL and e2 <= RT_FORMANT_TOL
    samp_ok = mad < RT_SAMPLE_TOL
    print(f"  original  F1 {fo[0]:>7.1f}  F2 {fo[1]:>7.1f}")
    print(f"  restored  F1 {fr[0]:>7.1f}  F2 {fr[1]:>7.1f}   (e {e1*100:.3f}% / {e2*100:.3f}%)")
    print(f"  formants within {RT_FORMANT_TOL*100:.1f}% : {'OK' if fmt_ok else 'FAIL'}")
    print(f"  mean-abs sample diff: {mad:.2e}  (< {RT_SAMPLE_TOL:.0e}) : {'OK' if samp_ok else 'FAIL'}")
    return fmt_ok and samp_ok


def main():
    print("Tract Mirror - Word mode verification gate (fs = 48000)")
    print("=" * 72)
    seg_ok = gate_segments()
    rt_ok = gate_round_trip()
    print("=" * 72)
    all_ok = seg_ok and rt_ok
    print(f"segment gate: {'PASS' if seg_ok else 'FAIL'}   "
          f"round-trip: {'PASS' if rt_ok else 'FAIL'}")
    print(f"RESULT: {'ALL GREEN' if all_ok else 'GATE FAILED'}")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
