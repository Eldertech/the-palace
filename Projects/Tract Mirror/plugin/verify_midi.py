#!/usr/bin/env python3
"""
verify_midi.py - verification gate for the Tract Mirror MIDI performance controls
(velocity curve + assignable CC -> vowel modulation). Companion to verify_render.py
(which gates the six-vowel formant port). Both must pass.

Two renders, both produced by the REAL processor in the render harness at 48 kHz:

  * velocity_layers.wav - the SAME note at velocities 30, 70, 127 (1.2 s each,
                          un-normalised so absolute levels are meaningful). Gates
                          the perceptual velocity curve sampled at note-on:
                              amp = 0.25 + 0.75 * (vel/127)^1.5
                          The whole-note excitation scales by amp, so the steady
                          per-segment RMS must (a) strictly increase and (b) track
                          the curve's predicted level RATIOS within 20 %.

  * cc_sweep.wav        - one held note (~4 s) while CC1 ramps 0 -> 127, vowelY
                          held mid. The CC drives vowelX across the full vowel
                          plane. Gates that the sweep AUDIBLY MORPHS: F1/F2 in the
                          first / last 0.5 s must match (within 3 %) the formants
                          of param-rendered references at vowel positions (0, y)
                          and (1, y) - cc_ref_x0.wav / cc_ref_x1.wav.

Why references rather than absolute targets: the CC-driven endpoints are MORPHED
positions (not pure anchors), and voiced LPC at 110 Hz biases low-formant readout
identically for the sweep and the references. Comparing like-against-like (same
note, same voice config, same measurement chain) makes the bias cancel, so the
3 % tolerance tests the CC->vowel mapping itself, not the LPC limitation.

GATES (all must pass):
  velocity: RMS(30) < RMS(70) < RMS(127), strictly; and each measured ratio within
            20 % of the contract curve's predicted ratio.
  cc sweep: |F1_first - F1_ref0| / F1_ref0 <= 3 %   (and F2)
            |F1_last  - F1_ref1| / F1_ref1 <= 3 %   (and F2)
            cc_sweep is finite, non-silent, non-clipping.
"""

import sys
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
PLUGIN_DIR = HERE
PROJECT_DIR = PLUGIN_DIR.parent
REFERENCE_DIR = PROJECT_DIR / "reference"
RENDER_DIR = PLUGIN_DIR / "test-renders"

sys.path.insert(0, str(REFERENCE_DIR))
import kl_reference as kl  # noqa: E402

FS = 48000

# velocity curve
VELOCITIES = [30, 70, 127]
VEL_RATIO_TOL = 0.20          # 20 % on each segment-pair ratio
# cc sweep formant match
CC_TOL = 0.03                 # 3 % on F1 and F2


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


def velocity_amp(vel):
    """Contract curve, sampled at note-on: amp = 0.25 + 0.75*(vel/127)^1.5."""
    return 0.25 + 0.75 * (vel / 127.0) ** 1.5


def measure_formants_voiced(x, fs, n=3):
    """F1..Fn from voiced audio via pre-emphasised autocorrelation Levinson-Durbin.

    Used identically on the CC-sweep endpoints and the param references so the
    voiced-LPC bias cancels in the comparison. Order = 2*N (round-trip pole count).
    """
    x = np.asarray(x, dtype=float)
    x = x - np.mean(x)
    if len(x) < 8 or np.max(np.abs(x)) < 1e-9:
        return [np.nan] * n
    x = np.append(x[0], x[1:] - 0.97 * x[:-1])      # pre-emphasis
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


def gate_velocity():
    path = RENDER_DIR / "velocity_layers.wav"
    print("VELOCITY CURVE  (velocity_layers.wav)")
    print("-" * 72)
    if not path.exists():
        print(f"  MISSING {path.name}")
        return False
    x, fs = read_wav_mono(path)
    if fs != FS:
        print(f"  WRONG sample rate {fs}")
        return False
    if not np.all(np.isfinite(x)):
        print("  FAIL: non-finite samples")
        return False

    seg = int(round(1.2 * fs))
    rms = []
    for i, v in enumerate(VELOCITIES):
        a = x[i * seg:(i + 1) * seg]
        # steady window: skip the 15 ms attack + settling, stop before the release
        mid = a[int(0.25 * fs):int(0.95 * fs)]
        rms.append(float(np.sqrt(np.mean(mid ** 2))))

    pred = [velocity_amp(v) for v in VELOCITIES]

    print(f"  {'vel':>4} {'meas RMS':>12} {'pred amp':>10}")
    for v, r, p in zip(VELOCITIES, rms, pred):
        print(f"  {v:>4} {r:>12.6f} {p:>10.6f}")

    increasing = rms[0] < rms[1] < rms[2]
    print(f"  strictly increasing: {'OK' if increasing else 'FAIL'} "
          f"({rms[0]:.6f} < {rms[1]:.6f} < {rms[2]:.6f})")

    # ratio checks: each measured pair ratio within 20 % of the predicted ratio
    pairs = [(1, 0), (2, 1), (2, 0)]
    ratio_ok = True
    print(f"  {'ratio':>9} {'measured':>10} {'predicted':>10} {'err %':>8} {'pass':>6}")
    for hi, lo in pairs:
        mr = rms[hi] / rms[lo]
        pr = pred[hi] / pred[lo]
        err = abs(mr - pr) / pr
        ok = err <= VEL_RATIO_TOL
        ratio_ok = ratio_ok and ok
        name = f"v{VELOCITIES[hi]}/v{VELOCITIES[lo]}"
        print(f"  {name:>9} {mr:>10.4f} {pr:>10.4f} {err*100:>8.2f} "
              f"{'OK' if ok else 'FAIL':>6}")

    return increasing and ratio_ok


def gate_cc_sweep():
    print()
    print("CC -> VOWEL SWEEP  (cc_sweep.wav vs cc_ref_x0/x1.wav)")
    print("-" * 72)
    sweep_p = RENDER_DIR / "cc_sweep.wav"
    ref0_p = RENDER_DIR / "cc_ref_x0.wav"
    ref1_p = RENDER_DIR / "cc_ref_x1.wav"
    for p in (sweep_p, ref0_p, ref1_p):
        if not p.exists():
            print(f"  MISSING {p.name}")
            return False

    cs, fs = read_wav_mono(sweep_p)
    if fs != FS:
        print(f"  WRONG sample rate {fs}")
        return False

    # sanity on the sweep audio
    finite = bool(np.all(np.isfinite(cs)))
    peak = float(np.max(np.abs(cs))) if len(cs) else 0.0
    rms = float(np.sqrt(np.mean(cs ** 2))) if len(cs) else 0.0
    non_silent = rms > 1e-4
    no_clip = peak <= 1.0 + 1e-6
    print(f"  sweep sanity: finite={finite} non_silent={non_silent} "
          f"no_clip={no_clip} (peak {peak:.3f}, rms {rms:.4f})")
    if not (finite and non_silent and no_clip):
        print("  FAIL: sweep audio sanity")
        return False

    r0, _ = read_wav_mono(ref0_p)
    r1, _ = read_wav_mono(ref1_p)

    # first / last 0.5 s of the sweep (steady inner windows away from edges)
    first = cs[int(0.20 * fs):int(0.70 * fs)]
    last = cs[int(3.30 * fs):int(3.80 * fs)]
    ref0 = r0[int(0.25 * fs):int(0.95 * fs)]
    ref1 = r1[int(0.25 * fs):int(0.95 * fs)]

    f_first = measure_formants_voiced(first, fs)
    f_last = measure_formants_voiced(last, fs)
    f_ref0 = measure_formants_voiced(ref0, fs)
    f_ref1 = measure_formants_voiced(ref1, fs)

    print(f"  {'segment':<22} {'F1':>8} {'F2':>8}")
    print(f"  {'sweep first 0.5 s':<22} {f_first[0]:>8.1f} {f_first[1]:>8.1f}")
    print(f"  {'ref vowelX=0':<22} {f_ref0[0]:>8.1f} {f_ref0[1]:>8.1f}")
    print(f"  {'sweep last 0.5 s':<22} {f_last[0]:>8.1f} {f_last[1]:>8.1f}")
    print(f"  {'ref vowelX=1':<22} {f_ref1[0]:>8.1f} {f_ref1[1]:>8.1f}")
    print()

    # the sweep MUST audibly morph: the endpoints differ from each other
    morph_f2 = abs(f_first[1] - f_last[1]) / max(f_first[1], 1.0)
    print(f"  morph check: |F2_first - F2_last| / F2_first = {morph_f2*100:.1f}% "
          f"({'OK' if morph_f2 > 0.05 else 'FAIL - no morph'})")

    print(f"  {'match':<18} {'meas':>8} {'ref':>8} {'err %':>8} {'pass':>6}")
    ok = morph_f2 > 0.05
    checks = [
        ("first F1 vs x0", f_first[0], f_ref0[0]),
        ("first F2 vs x0", f_first[1], f_ref0[1]),
        ("last  F1 vs x1", f_last[0], f_ref1[0]),
        ("last  F2 vs x1", f_last[1], f_ref1[1]),
    ]
    for name, m, e in checks:
        if not (np.isfinite(m) and np.isfinite(e) and e > 0):
            err = float("inf")
            cp = False
        else:
            err = abs(m - e) / e
            cp = err <= CC_TOL
        ok = ok and cp
        print(f"  {name:<18} {m:>8.1f} {e:>8.1f} {err*100:>8.2f} "
              f"{'OK' if cp else 'FAIL':>6}")
    return ok


def main():
    print("Tract Mirror - MIDI controls verification gate (fs = 48000)")
    print("=" * 72)
    vel_ok = gate_velocity()
    cc_ok = gate_cc_sweep()
    print("=" * 72)
    all_ok = vel_ok and cc_ok
    print(f"velocity gate: {'PASS' if vel_ok else 'FAIL'}   "
          f"cc-sweep gate: {'PASS' if cc_ok else 'FAIL'}")
    print(f"RESULT: {'ALL GREEN' if all_ok else 'GATE FAILED'}")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
