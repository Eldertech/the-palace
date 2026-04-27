#!/usr/bin/env python3
"""
rebuild_diagnostic.py — regenerate 00_test_diagnostic.wav at 1024×1024.

Same 16 anchor waveforms as the original Stage-1 diagnostic, but with smooth
linear interpolation between adjacent anchors filling in the 64 sub-rows
between each anchor pair. Anchor k sits at row k * 64, which is Y = k/16,
so every "Y = k/16" test point in the existing instructions still hits the
anchor exactly.

Why interpolate rather than replicate: at audio-rate Y, replication produces
sharp boundaries between regions and clicks at the transitions. Linear
interpolation produces a smooth morph through all 16 anchors per Y cycle,
which is what we actually want to hear.
"""
from __future__ import annotations
import os
import struct
import subprocess

import numpy as np


PROJ = "/sessions/optimistic-eager-bell/mnt/The Palace/Projects/2D Torus Wavetable Synthesizer"
WT_DIR = f"{PROJ}/Wavetables"
TOOLS_DIR = f"{PROJ}/Tools"
SR = 48000
ROW_LEN = 1024
N_ROWS = 1024
N_ANCHORS = 16
SUB_ROWS = N_ROWS // N_ANCHORS  # 64


def write_float_wav(path: str, data: np.ndarray, sr: int) -> None:
    n = len(data)
    fmt_chunk = struct.pack("<HHIIHH", 3, 1, sr, sr * 4, 4, 32)
    fact_chunk = struct.pack("<I", n)
    body = data.astype("<f4").tobytes()
    riff_size = 4 + (8 + len(fmt_chunk)) + (8 + len(fact_chunk)) + (8 + len(body))
    with open(path, "wb") as f:
        f.write(b"RIFF")
        f.write(struct.pack("<I", riff_size))
        f.write(b"WAVE")
        f.write(b"fmt ")
        f.write(struct.pack("<I", len(fmt_chunk)))
        f.write(fmt_chunk)
        f.write(b"fact")
        f.write(struct.pack("<I", len(fact_chunk)))
        f.write(fact_chunk)
        f.write(b"data")
        f.write(struct.pack("<I", len(body)))
        f.write(body)


def build_anchors() -> list[np.ndarray]:
    phi = np.linspace(0.0, 2.0 * np.pi, ROW_LEN, endpoint=False)
    x = phi / (2.0 * np.pi)
    rng = np.random.default_rng(seed=20260426)

    anchors = [None] * N_ANCHORS
    anchors[0]  = np.sin(phi)                                    # sine 1x
    anchors[1]  = 2.0 * x - 1.0                                  # sawtooth rising
    anchors[2]  = np.where(x < 0.5, 1.0, -1.0)                   # square 50%
    anchors[3]  = 1.0 - 4.0 * np.abs(x - 0.5)                    # triangle
    anchors[4]  = np.zeros_like(phi)                             # silence
    anchors[5]  = 1.0 - 2.0 * x                                  # sawtooth reversed
    anchors[6]  = np.where(x < 0.25, 1.0, -1.0)                  # 25% pulse
    anchors[7]  = np.sin(2.0 * phi)                              # sine 2x
    anchors[8]  = np.sin(4.0 * phi)                              # sine 4x
    anchors[9]  = np.zeros_like(phi)                             # silence
    anchors[10] = np.sin(8.0 * phi)                              # sine 8x

    noise = rng.standard_normal(ROW_LEN)
    anchors[11] = noise / np.max(np.abs(noise))                  # white noise

    saw = np.zeros(ROW_LEN)
    for k in range(1, 9):
        saw += np.sin(k * phi) / k
    anchors[12] = saw / np.max(np.abs(saw))                      # bandlimited saw (8 partials)

    sq = np.zeros(ROW_LEN)
    for k in range(1, 16, 2):
        sq += np.sin(k * phi) / k
    anchors[13] = sq / np.max(np.abs(sq))                        # bandlimited square

    tt = np.sin(phi) + 0.5 * np.sin(3.0 * phi)
    anchors[14] = tt / np.max(np.abs(tt))                        # two-tone

    anchors[15] = np.sin(phi)                                    # sine 1x — wrap reference

    # Each anchor peaks at ±1 (except silence rows)
    for i, w in enumerate(anchors):
        peak = float(np.max(np.abs(w)))
        if peak > 0.0:
            anchors[i] = w / peak
    return anchors


def build_table(anchors: list[np.ndarray]) -> np.ndarray:
    """Linearly interpolate between adjacent anchors over SUB_ROWS sub-rows
    each. Wraps from anchor 15 back to anchor 0 for the last segment."""
    table = np.empty((N_ROWS, ROW_LEN))
    for r in range(N_ROWS):
        anchor_lo = (r // SUB_ROWS) % N_ANCHORS
        anchor_hi = (anchor_lo + 1) % N_ANCHORS
        t = (r % SUB_ROWS) / SUB_ROWS
        table[r] = (1.0 - t) * anchors[anchor_lo] + t * anchors[anchor_hi]
    return table


def main() -> int:
    anchors = build_anchors()
    table = build_table(anchors)

    # Sanity verification against the original test design — anchor positions
    # must hit exactly when Y = k/16.
    print("Anchor placement check:")
    for k in range(N_ANCHORS):
        r = k * SUB_ROWS
        peak = float(np.max(np.abs(table[r] - anchors[k])))
        print(f"  anchor {k:2d}  row {r:4d}  Y={k/N_ANCHORS:.4f}  err={peak:.2e}")

    audio = table.flatten().astype(np.float32)
    wav_path = f"{WT_DIR}/00_test_diagnostic.wav"
    write_float_wav(wav_path, audio, SR)
    print(f"wrote {wav_path}: {len(audio)} samples, {os.path.getsize(wav_path)} bytes")

    # Render heightmap (square 1024×1024 PNG)
    visualizer = f"{TOOLS_DIR}/visualize_wavetable.py"
    png_path = f"{WT_DIR}/00_test_diagnostic.png"
    subprocess.run(
        ["python3", visualizer, wav_path, "-o", png_path,
         "--row-len", str(ROW_LEN),
         "--width", "1024", "--height", "1024"],
        check=True,
    )

    # Stacked rows would now be 1024 rows tall and unreadable; we've kept the
    # original 16-row stacked PNG (00_test_diagnostic_full.png) as the per-row
    # waveform reference, and it remains valid because the 1024-row table is
    # built from those exact 16 anchor shapes.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
