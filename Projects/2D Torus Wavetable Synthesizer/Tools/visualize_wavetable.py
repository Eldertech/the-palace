#!/usr/bin/env python3
"""
visualize_wavetable.py
======================

Render a 2D wavetable WAV file as a PNG image.

The input is a mono WAV (32-bit float by default; 16/24/32-bit integer also
supported) whose samples lay out as `rows * row_len` values in time order —
exactly the format that Max's `2d.wave~` consumes. The output is a PNG
suitable for embedding in catalog index entries.

Two views are supported:

    heightmap  — each cell coloured by sample value (diverging colormap).
                 The default. Good for surface-as-terrain reading.
    stacked    — each row plotted as a waveform stripe, vertically stacked.
                 Good for reading actual waveform shapes.
    both       — heightmap above, stacked below, in one PNG.

Usage examples
--------------
    # Default heightmap, output next to input as <name>.png
    python3 visualize_wavetable.py 00_test_diagnostic.wav

    # Both views, custom output path
    python3 visualize_wavetable.py 00_test_diagnostic.wav \\
        --mode both -o test_diag_preview.png

    # Override row length (default 1024) and/or rows (default auto)
    python3 visualize_wavetable.py surface.wav --row-len 2048 --rows 32

Dependencies: numpy, Pillow.
"""
from __future__ import annotations
import argparse
import os
import struct
import sys
from typing import Callable, Optional, Tuple

import numpy as np
from PIL import Image, ImageDraw


# ---------------------------------------------------------------------------
# WAV reader (no external deps)
# ---------------------------------------------------------------------------

def read_wav_mono(path: str) -> Tuple[np.ndarray, int]:
    """Return (mono samples in [-1,+1] as float64, sample_rate)."""
    with open(path, "rb") as f:
        data = f.read()
    if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
        raise ValueError(f"{path}: not a RIFF/WAVE file")

    fmt_code = sr = ch = bits = None
    samples_bytes = None
    i = 12
    while i + 8 <= len(data):
        cid = data[i:i + 4]
        size = struct.unpack("<I", data[i + 4:i + 8])[0]
        body = data[i + 8:i + 8 + size]
        if cid == b"fmt ":
            fmt_code, ch, sr, _br, _ba, bits = struct.unpack("<HHIIHH", body[:16])
        elif cid == b"data":
            samples_bytes = body
        i += 8 + size + (size % 2)  # word-align padding

    if samples_bytes is None or fmt_code is None:
        raise ValueError(f"{path}: missing fmt or data chunk")

    if fmt_code == 3 and bits == 32:               # IEEE float
        s = np.frombuffer(samples_bytes, dtype="<f4").astype(np.float64)
    elif fmt_code == 1 and bits == 16:             # PCM int16
        s = np.frombuffer(samples_bytes, dtype="<i2").astype(np.float64) / 32768.0
    elif fmt_code == 1 and bits == 32:             # PCM int32
        s = np.frombuffer(samples_bytes, dtype="<i4").astype(np.float64) / 2147483648.0
    elif fmt_code == 1 and bits == 24:             # PCM int24, packed
        b = np.frombuffer(samples_bytes, dtype=np.uint8).reshape(-1, 3)
        v = (b[:, 0].astype(np.int32)
             | (b[:, 1].astype(np.int32) << 8)
             | (b[:, 2].astype(np.int32) << 16))
        v = np.where(v & 0x800000, v - 0x1000000, v)
        s = v.astype(np.float64) / 8388608.0
    else:
        raise ValueError(f"{path}: unsupported WAV format (fmt={fmt_code}, bits={bits})")

    if ch and ch > 1:
        s = s.reshape(-1, ch)[:, 0]   # take channel 0
    return s, sr


# ---------------------------------------------------------------------------
# Colormaps — return (H, W, 3) uint8 from a (H, W) float array in [-1, +1]
# ---------------------------------------------------------------------------

def cm_diverging(v: np.ndarray) -> np.ndarray:
    """Blue (negative) → black (zero) → orange/red (positive)."""
    v = np.clip(v, -1.0, 1.0)
    pos = np.maximum(v, 0.0)
    neg = np.maximum(-v, 0.0)
    R = (pos * 255).astype(np.uint8)
    G = (pos * 110 + neg * 60).astype(np.uint8)
    B = (neg * 255).astype(np.uint8)
    return np.stack([R, G, B], axis=-1)


def cm_gray(v: np.ndarray) -> np.ndarray:
    g = ((np.clip(v, -1.0, 1.0) + 1.0) * 127.5).astype(np.uint8)
    return np.stack([g, g, g], axis=-1)


def cm_viridis(v: np.ndarray) -> np.ndarray:
    """Polynomial approximation of matplotlib's viridis (good enough for catalogs)."""
    t = (np.clip(v, -1.0, 1.0) + 1.0) * 0.5
    R = np.clip(0.267 + t * (-0.6 + t * (3.4 + t * (-3.1))), 0, 1)
    G = np.clip(0.005 + t * (1.40 + t * (-0.55)), 0, 1)
    B = np.clip(0.329 + t * (1.30 + t * (-2.6 + t * 1.30)), 0, 1)
    return (np.stack([R, G, B], axis=-1) * 255).astype(np.uint8)


COLORMAPS: dict[str, Callable[[np.ndarray], np.ndarray]] = {
    "diverging": cm_diverging,
    "gray": cm_gray,
    "viridis": cm_viridis,
}


# ---------------------------------------------------------------------------
# Renderers
# ---------------------------------------------------------------------------

def render_heightmap(table: np.ndarray, cmap: Callable, target: Tuple[int, int]) -> Image.Image:
    """One pixel per cell, then nearest-neighbour upscale to `target`."""
    rgb = cmap(table)
    img = Image.fromarray(rgb, mode="RGB")
    return img.resize(target, resample=Image.NEAREST)


def render_stacked(table: np.ndarray, width: int, row_height: int = 48) -> Image.Image:
    rows, cols = table.shape
    pad = 2
    h = (row_height + pad) * rows + pad
    img = Image.new("RGB", (width, h), (252, 252, 253))
    draw = ImageDraw.Draw(img)
    xs = np.linspace(0, width - 1, cols).astype(int)
    for r in range(rows):
        y0 = pad + r * (row_height + pad)
        y1 = y0 + row_height
        ymid = (y0 + y1) // 2
        if r % 2 == 0:
            draw.rectangle([0, y0, width, y1], fill=(244, 246, 250))
        # zero baseline
        draw.line([(0, ymid), (width - 1, ymid)], fill=(200, 204, 212), width=1)
        ys = (ymid - table[r] * (row_height * 0.45)).astype(int)
        pts = list(zip(xs.tolist(), ys.tolist()))
        if len(pts) > 1:
            draw.line(pts, fill=(28, 36, 90), width=2)
        # row tag
        draw.text((6, y0 + 2), f"row {r:02d}  Y={r/rows:.4f}", fill=(60, 60, 70))
    return img


def render_both(table: np.ndarray, cmap: Callable, width: int) -> Image.Image:
    rows, _ = table.shape
    hm_h = max(rows * 10, 160)
    hm = render_heightmap(table, cmap, (width, hm_h))
    st = render_stacked(table, width)
    gap = 6
    h = hm.size[1] + gap + st.size[1]
    out = Image.new("RGB", (width, h), (255, 255, 255))
    out.paste(hm, (0, 0))
    out.paste(st, (0, hm.size[1] + gap))
    return out


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: Optional[list[str]] = None) -> int:
    p = argparse.ArgumentParser(description="Render a 2D wavetable WAV as a PNG image.")
    p.add_argument("input", help="Input WAV file (mono).")
    p.add_argument("-o", "--output", help="Output PNG (default: <input>.png).")
    p.add_argument("--row-len", type=int, default=1024,
                   help="Samples per wavetable row (default 1024).")
    p.add_argument("--rows", type=int, default=None,
                   help="Number of rows (default: auto = total_samples / row_len).")
    p.add_argument("--mode", choices=("heightmap", "stacked", "both"),
                   default="heightmap")
    p.add_argument("--colormap", choices=tuple(COLORMAPS), default="diverging")
    p.add_argument("--width", type=int, default=1024,
                   help="Output width in pixels (default 1024).")
    p.add_argument("--height", type=int, default=None,
                   help="Heightmap pixel height (default scales with row count).")
    args = p.parse_args(argv)

    samples, sr = read_wav_mono(args.input)
    total = len(samples)
    rows = args.rows or total // args.row_len
    if rows * args.row_len > total:
        print(f"error: {args.input} has {total} samples but rows*row_len = {rows*args.row_len}",
              file=sys.stderr)
        return 2
    if rows * args.row_len < total:
        print(f"warn: trimming {total - rows*args.row_len} trailing samples", file=sys.stderr)
    table = samples[:rows * args.row_len].reshape(rows, args.row_len)

    cmap = COLORMAPS[args.colormap]

    if args.mode == "heightmap":
        # Default height: scale rows up to a readable size, but clamp so we
        # never produce absurdly tall images for big square wavetables.
        h = args.height or max(min(rows * 24, args.width), 256)
        img = render_heightmap(table, cmap, (args.width, h))
    elif args.mode == "stacked":
        img = render_stacked(table, args.width)
    else:
        img = render_both(table, cmap, args.width)

    out = args.output or os.path.splitext(args.input)[0] + ".png"
    img.save(out, optimize=True)
    print(f"wrote {out}  ({img.size[0]}x{img.size[1]}, "
          f"{rows} rows × {args.row_len} samples, sr={sr} Hz)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
