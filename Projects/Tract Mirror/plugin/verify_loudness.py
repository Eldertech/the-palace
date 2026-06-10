#!/usr/bin/env python3
"""
verify_loudness.py - verification gate for the Tract Mirror vowel loudness
normalization (INTERFACE.md sec 2.5). Companion to verify_render.py (six-vowel
formant port) and verify_midi.py (velocity + CC). All three must pass.

The engine applies a frequency-flat, per-tract-shape make-up gain that equalises
perceived loudness across vowels (schwa = unity reference). Without it /u/ is far
louder than /e/ - true to the physics, wrong for an instrument.

The render harness produces, for ten pad positions (six anchors i e schwa u o a +
four mid-morph positions m1..m4), a sustained A2 (110 Hz) note rendered twice:

  * loud_off_<pos>.wav - normalization OFF  (the PRE-change spread)
  * loud_on_<pos>.wav  - normalization ON   (the gate)

Both are un-peak-normalised so absolute level is meaningful. We measure the steady
-segment RMS (skip the attack + settling, stop before release) and report it in
dB for every position in both modes.

GATES (all must pass):
  * spread(on)  = max(dB_on)  - min(dB_on)  <= 3.0 dB   (was ~25x ~= 28 dB before)
  * schwa: |dB_on[schwa] - dB_off[schwa]| <= 1.0 dB     (unity reference holds:
    the schwa tube IS the reference, so its level must be unchanged)
"""

import sys
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
RENDER_DIR = HERE / "test-renders"

FS = 48000
POSITIONS = ["i", "e", "schwa", "u", "o", "a", "m1", "m2", "m3", "m4"]
SPREAD_TOL_DB = 3.0
SCHWA_TOL_DB = 1.0


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


def steady_rms_db(path):
    """Steady-segment RMS in dBFS. Window 0.30..1.80 s (past the 15 ms attack +
    the ~30 ms loudness-comp settling, well inside the 2 s sustain)."""
    if not path.exists():
        return None
    x, fs = read_wav_mono(path)
    if fs != FS or not np.all(np.isfinite(x)):
        return None
    a = x[int(0.30 * fs):int(1.80 * fs)]
    if len(a) < 16:
        return None
    rms = float(np.sqrt(np.mean(a ** 2)))
    if rms <= 0:
        return -np.inf
    return 20.0 * np.log10(rms)


def main():
    print("Tract Mirror - vowel loudness normalization gate (fs = 48000)")
    print("=" * 72)

    db_off = {}
    db_on = {}
    missing = False
    for pos in POSITIONS:
        d_off = steady_rms_db(RENDER_DIR / f"loud_off_{pos}.wav")
        d_on = steady_rms_db(RENDER_DIR / f"loud_on_{pos}.wav")
        if d_off is None or d_on is None:
            print(f"  MISSING/invalid render for position '{pos}'")
            missing = True
            continue
        db_off[pos] = d_off
        db_on[pos] = d_on

    if missing:
        print("RESULT: GATE FAILED (missing renders)")
        return 1

    print(f"  {'position':<10} {'OFF dB':>10} {'ON dB':>10} {'delta dB':>10}")
    print("  " + "-" * 44)
    for pos in POSITIONS:
        print(f"  {pos:<10} {db_off[pos]:>10.2f} {db_on[pos]:>10.2f} "
              f"{db_on[pos] - db_off[pos]:>10.2f}")
    print("  " + "-" * 44)

    off_vals = np.array([db_off[p] for p in POSITIONS])
    on_vals = np.array([db_on[p] for p in POSITIONS])
    spread_off = float(off_vals.max() - off_vals.min())
    spread_on = float(on_vals.max() - on_vals.min())

    print(f"  spread OFF (before): {spread_off:6.2f} dB  "
          f"(max {off_vals.max():.2f} @ {POSITIONS[int(off_vals.argmax())]}, "
          f"min {off_vals.min():.2f} @ {POSITIONS[int(off_vals.argmin())]})")
    print(f"  spread ON  (after):  {spread_on:6.2f} dB  "
          f"(max {on_vals.max():.2f} @ {POSITIONS[int(on_vals.argmax())]}, "
          f"min {on_vals.min():.2f} @ {POSITIONS[int(on_vals.argmin())]})")

    spread_ok = spread_on <= SPREAD_TOL_DB
    schwa_delta = abs(db_on["schwa"] - db_off["schwa"])
    schwa_ok = schwa_delta <= SCHWA_TOL_DB

    print()
    print(f"  spread(on) <= {SPREAD_TOL_DB} dB : {'OK' if spread_ok else 'FAIL'} "
          f"({spread_on:.2f} dB)")
    print(f"  schwa unchanged <= {SCHWA_TOL_DB} dB : {'OK' if schwa_ok else 'FAIL'} "
          f"(|delta| {schwa_delta:.3f} dB)")

    print("=" * 72)
    all_ok = spread_ok and schwa_ok
    print(f"RESULT: {'ALL GREEN' if all_ok else 'GATE FAILED'}")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
