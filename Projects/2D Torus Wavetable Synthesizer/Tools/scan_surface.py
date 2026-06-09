#!/usr/bin/env python3
"""
scan_surface.py
===============

The missing audio scanner. Turns a 2D torus wavetable surface into sound by
tracing two independent phasors across it — the exact operation the RNBO
``codebox~`` (``RNBO/torus_2d_lookup.codebox``) performs per sample, validated
here in Python first so the math is known-good before it goes under live
control.

The central design fact, incarnated:

    output sample(t) = W( phi1(t), phi2(t) )
    phi1(t) = (omega1 * t) mod 1     # the X axis (fast scan, columns)
    phi2(t) = (omega2 * t) mod 1     # the Y axis (slow scan, rows)

with toroidal **bilinear** interpolation so the wrap is seamless on both axes
(no row-stepping at the seam — the surfaces are square 1024x1024 precisely so
the Y phasor reads as densely as the X one). The reachable output spectrum is
every integer combination ``f_{mn} = m*omega1 + n*omega2`` weighted by the
surface coefficients ``c_{mn}`` — so the *ratio* omega1/omega2 is the primary
inharmonicity gate:

    rational p/q  -> path closes into a (p,q) cable curve -> periodic, harmonic
    irrational    -> Kronecker flow, never closes, fills the torus -> structured
                     inharmonic, two genuine independent fundamentals

Surface WAV layout (matches build_catalog.py / visualize_wavetable.py):
a mono 32-bit-float WAV whose ``rows * row_len`` samples lay out row-major,
row index = phi2 (Y), column = phi1 (X).

Dependencies: numpy + the Python standard library only (no scipy / soundfile).

Usage
-----
    # one held tone: Penrose surface, base 110 Hz, ratio 3/2 (a clean fifth)
    python3 scan_surface.py Wavetables/15_penrose_lattice.wav \\
        --base 110 --ratio 1.5 --dur 4 -o /tmp/penrose_fifth.wav

    # a ratio sweep: a sequence of held tones at the given ratios, each `seg`
    # seconds, short crossfades between — the harmonic->inharmonic audition
    python3 scan_surface.py Wavetables/15_penrose_lattice.wav \\
        --base 110 --sweep 1.0 1.5 2.0 1.6180339887 1.4142135624 \\
        --seg 2.5 -o /tmp/penrose_sweep.wav
"""
from __future__ import annotations
import argparse
import math
import os
import struct
import sys
from typing import List, Tuple

import numpy as np

SR = 48000


# ---------------------------------------------------------------------------
# WAV IO (32-bit float, mono) — same contract as the rest of Tools/
# ---------------------------------------------------------------------------

def read_surface_wav(path: str) -> np.ndarray:
    """Read a mono float/int WAV and return its samples as float64 in [-1, 1]."""
    with open(path, "rb") as f:
        data = f.read()
    if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
        raise ValueError(f"{path}: not a RIFF/WAVE file")
    i = 12
    fmt_code = bits = None
    samples = None
    while i + 8 <= len(data):
        cid = data[i:i + 4]
        size = struct.unpack("<I", data[i + 4:i + 8])[0]
        body = data[i + 8:i + 8 + size]
        if cid == b"fmt ":
            fmt_code, _ch, _sr, _br, _ba, bits = struct.unpack("<HHIIHH", body[:16])
        elif cid == b"data":
            if fmt_code == 3:
                samples = np.frombuffer(body, dtype="<f4").astype(np.float64)
            elif fmt_code == 1 and bits == 16:
                samples = np.frombuffer(body, dtype="<i2").astype(np.float64) / 32768.0
            elif fmt_code == 1 and bits == 32:
                samples = np.frombuffer(body, dtype="<i4").astype(np.float64) / 2147483648.0
            else:
                raise ValueError(f"{path}: unsupported fmt {fmt_code}/{bits}-bit")
        i += 8 + size + (size & 1)
    if samples is None:
        raise ValueError(f"{path}: no data chunk")
    return samples


def write_float_wav(path: str, data: np.ndarray, sr: int = SR) -> None:
    """Write mono 32-bit-float WAV (identical header to build_catalog.py)."""
    data = np.asarray(data, dtype=np.float64)
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


# ---------------------------------------------------------------------------
# The scan
# ---------------------------------------------------------------------------

def load_surface(path: str, row_len: int = 1024) -> np.ndarray:
    """Reshape the flat WAV into a (rows, row_len) surface."""
    flat = read_surface_wav(path)
    rows = flat.size // row_len
    if rows * row_len != flat.size:
        raise ValueError(
            f"{path}: {flat.size} samples is not a multiple of row_len={row_len}")
    return flat.reshape(rows, row_len)


def scan(surface: np.ndarray, base_hz: float, ratio: float,
         dur: float, sr: int = SR) -> np.ndarray:
    """
    Trace two phasors across the surface and return the bilinearly-interpolated
    output signal. phi1 (X, columns) runs at base_hz; phi2 (Y, rows) runs at
    base_hz * ratio. Both are normalised cycle phases in [0, 1).
    """
    rows, cols = surface.shape
    n = int(round(dur * sr))
    t = np.arange(n, dtype=np.float64) / sr

    phi1 = (base_hz * t) % 1.0            # X / columns / omega1
    phi2 = (base_hz * ratio * t) % 1.0    # Y / rows    / omega2

    x = phi1 * cols
    y = phi2 * rows
    x0 = np.floor(x).astype(np.int64) % cols
    y0 = np.floor(y).astype(np.int64) % rows
    x1 = (x0 + 1) % cols
    y1 = (y0 + 1) % rows
    fx = x - np.floor(x)
    fy = y - np.floor(y)

    v00 = surface[y0, x0]
    v01 = surface[y0, x1]
    v10 = surface[y1, x0]
    v11 = surface[y1, x1]
    top = v00 * (1 - fx) + v01 * fx
    bot = v10 * (1 - fx) + v11 * fx
    return top * (1 - fy) + bot * fy


def normalize(sig: np.ndarray, peak: float = 0.9) -> np.ndarray:
    m = np.max(np.abs(sig))
    return sig * (peak / m) if m > 0 else sig


def fade(sig: np.ndarray, ms: float = 8.0, sr: int = SR) -> np.ndarray:
    k = min(int(sr * ms / 1000.0), len(sig) // 2)
    if k <= 0:
        return sig
    env = np.ones_like(sig)
    ramp = np.linspace(0.0, 1.0, k)
    env[:k] = ramp
    env[-k:] = ramp[::-1]
    return sig * env


def sweep(surface: np.ndarray, base_hz: float, ratios: List[float],
          seg: float, sr: int = SR) -> Tuple[np.ndarray, List[Tuple[float, float]]]:
    """Concatenate held tones at each ratio with short fades. Returns the
    signal plus a list of (start_sec, ratio) marks for the catalog note."""
    segs = []
    marks = []
    cursor = 0.0
    for r in ratios:
        s = fade(normalize(scan(surface, base_hz, r, seg, sr)), 12.0, sr)
        marks.append((cursor, r))
        segs.append(s)
        cursor += len(s) / sr
    return np.concatenate(segs), marks


# ---------------------------------------------------------------------------
# Spectral order parameter — how "harmonic" did the tone come out?
# ---------------------------------------------------------------------------

def harmonicity(sig: np.ndarray, base_hz: float, sr: int = SR) -> float:
    """
    Fraction of spectral energy that sits within +-3% of an integer multiple of
    base_hz. ~1.0 = locked harmonic; toward 0 = energy strewn off the harmonic
    comb (structured inharmonic). A coarse but honest read on the ratio gate.
    """
    w = np.hanning(len(sig))
    spec = np.abs(np.fft.rfft(sig * w)) ** 2
    freqs = np.fft.rfftfreq(len(sig), 1.0 / sr)
    total = spec.sum()
    if total <= 0:
        return 0.0
    harm_mask = np.zeros_like(freqs, dtype=bool)
    k = 1
    while k * base_hz < sr / 2:
        harm_mask |= np.abs(freqs - k * base_hz) < 0.03 * base_hz
        k += 1
    return float(spec[harm_mask].sum() / total)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv=None):
    p = argparse.ArgumentParser(description="Scan a 2D torus wavetable into audio.")
    p.add_argument("surface", help="surface WAV (1024x1024 float, row-major)")
    p.add_argument("-o", "--out", required=True, help="output WAV path")
    p.add_argument("--base", type=float, default=110.0, help="omega1 base Hz")
    p.add_argument("--ratio", type=float, default=1.5, help="omega2/omega1 (single tone)")
    p.add_argument("--dur", type=float, default=4.0, help="single-tone duration (s)")
    p.add_argument("--sweep", type=float, nargs="+", default=None,
                   help="list of ratios -> a sequence of held tones")
    p.add_argument("--seg", type=float, default=2.5, help="seconds per sweep segment")
    p.add_argument("--row-len", type=int, default=1024)
    p.add_argument("--report", action="store_true",
                   help="print a harmonicity reading per tone")
    args = p.parse_args(argv)

    surface = load_surface(args.surface, args.row_len)
    print(f"surface: {os.path.basename(args.surface)}  shape={surface.shape}", file=sys.stderr)

    if args.sweep:
        sig, marks = sweep(surface, args.base, args.sweep, args.seg)
        if args.report:
            for (start, r) in marks:
                seg_sig = fade(normalize(scan(surface, args.base, r, args.seg)), 12.0)
                h = harmonicity(seg_sig, args.base)
                kind = "harmonic" if h > 0.85 else ("mixed" if h > 0.5 else "inharmonic")
                print(f"  t={start:5.1f}s  ratio={r:<12.7g}  harmonicity={h:.3f}  [{kind}]",
                      file=sys.stderr)
    else:
        sig = fade(normalize(scan(surface, args.base, args.ratio, args.dur)), 12.0)
        if args.report:
            h = harmonicity(sig, args.base)
            print(f"  ratio={args.ratio:.7g}  harmonicity={h:.3f}", file=sys.stderr)

    write_float_wav(args.out, normalize(sig, 0.9))
    print(f"wrote {args.out}  ({len(sig)/SR:.2f}s)", file=sys.stderr)


if __name__ == "__main__":
    main()
