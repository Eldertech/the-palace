#!/usr/bin/env python3
"""
morph_surfaces.py
=================

Settles — by ear and by measurement — the first Open Question on the project
page: *how is morphing implemented across surfaces, crossfading the c_mn
coefficients in spectral space, or crossfading W directly in spatial space?*

Both paths are implemented here and rendered from the same surface pair, the
same scan, the same normalisation, so the only difference you hear is the
morph law itself.

    spatial   W(a) = (1-a)*A + a*B
              a straight height-map crossfade. Cheap. Where A and B disagree in
              sign the sum cancels, so the midpoint loses amplitude and — worse
              — loses *partials*: the two surfaces' lattice coefficients
              interfere destructively wherever their phases oppose.

    spectral  C(a) = |(1-a)|C_A| + a|C_B|| * exp(i * slerp(arg C_A, arg C_B, a))
              magnitudes crossfade linearly, phases take the shortest arc.
              No cancellation: a partial present in either surface stays
              present through the whole morph and simply migrates in weight.
              Costs one inverse 2D FFT per morph frame (offline, or a
              lookup-table-and-crossfade at run time — the dominant warp
              pattern from the Torus Warping Catalog).

The morph is quantised into frames; the two scan phasors run on one continuous
global clock across the whole render, so there is no phase discontinuity at a
frame boundary — only the surface under the scan changes.

Dependencies: numpy + Pillow (the RMS plot). Same house contract as the rest of
Tools/: mono 32-bit-float WAV, row-major, row index = phi2 (Y), column = phi1.

Usage
-----
    python3 morph_surfaces.py Wavetables/10_membrane.wav Wavetables/11_chladni_ghost.wav \
        --base 110 --ratio 1.6180339887 --dur 8 --frames 128 \
        --out-dir Auditions/cycle-7 --tag membrane_chladni
"""
from __future__ import annotations
import argparse
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scan_surface import (SR, load_surface, write_float_wav, fade, harmonicity)  # noqa: E402


# ---------------------------------------------------------------------------
# The two morph laws
# ---------------------------------------------------------------------------

def morph_spatial(A: np.ndarray, B: np.ndarray, a: float) -> np.ndarray:
    """Straight height-map crossfade."""
    return (1.0 - a) * A + a * B


def _shortest_arc(pa: np.ndarray, pb: np.ndarray, a: float) -> np.ndarray:
    d = (pb - pa + np.pi) % (2 * np.pi) - np.pi
    return pa + a * d


def morph_spectral(FA: np.ndarray, FB: np.ndarray, a: float) -> np.ndarray:
    """Crossfade the 2D lattice coefficients: magnitude linear, phase shortest-arc."""
    mag = (1.0 - a) * np.abs(FA) + a * np.abs(FB)
    ph = _shortest_arc(np.angle(FA), np.angle(FB), a)
    return np.fft.irfft2(mag * np.exp(1j * ph), s=(FA.shape[0], (FA.shape[1] - 1) * 2))


# ---------------------------------------------------------------------------
# Scan a frame stack on one continuous clock
# ---------------------------------------------------------------------------

def scan_frames(frames, base_hz: float, ratio: float, dur: float, sr: int = SR) -> np.ndarray:
    n = int(round(dur * sr))
    t = np.arange(n, dtype=np.float64) / sr
    rows, cols = frames[0].shape
    phi1 = (base_hz * t) % 1.0
    phi2 = (base_hz * ratio * t) % 1.0
    x, y = phi1 * cols, phi2 * rows
    x0 = np.floor(x).astype(np.int64) % cols
    y0 = np.floor(y).astype(np.int64) % rows
    x1, y1 = (x0 + 1) % cols, (y0 + 1) % rows
    fx, fy = x - np.floor(x), y - np.floor(y)

    out = np.empty(n, dtype=np.float64)
    nf = len(frames)
    bounds = np.linspace(0, n, nf + 1).astype(int)
    for k in range(nf):
        s, e = bounds[k], bounds[k + 1]
        if e <= s:
            continue
        W = frames[k]
        top = W[y0[s:e], x0[s:e]] * (1 - fx[s:e]) + W[y0[s:e], x1[s:e]] * fx[s:e]
        bot = W[y1[s:e], x0[s:e]] * (1 - fx[s:e]) + W[y1[s:e], x1[s:e]] * fx[s:e]
        out[s:e] = top * (1 - fy[s:e]) + bot * fy[s:e]
    return out


def block_rms(sig: np.ndarray, blocks: int) -> np.ndarray:
    b = np.array_split(sig, blocks)
    return np.array([float(np.sqrt(np.mean(x ** 2))) if len(x) else 0.0 for x in b])


# ---------------------------------------------------------------------------
# A dependency-light PNG plot (Pillow only — no matplotlib in this bundle)
# ---------------------------------------------------------------------------

def plot_rms(curves, labels, path, title, w=1100, h=520):
    from PIL import Image, ImageDraw
    img = Image.new("RGB", (w, h), (14, 14, 18))
    d = ImageDraw.Draw(img)
    l, r, tp, bt = 90, w - 30, 60, 70
    colors = [(230, 190, 90), (120, 200, 255), (200, 120, 200)]
    top_db, bot_db = 0.0, -18.0

    def yy(db):
        return tp + (top_db - db) / (top_db - bot_db) * (h - tp - bt)

    for db in range(0, -19, -3):
        y = yy(db)
        d.line([(l, y), (r, y)], fill=(48, 48, 56))
        d.text((l - 48, y - 6), f"{db:>3d} dB", fill=(150, 150, 160))
    for i, frac in enumerate(np.linspace(0, 1, 6)):
        x = l + frac * (r - l)
        d.line([(x, tp), (x, h - bt)], fill=(36, 36, 44))
        d.text((x - 12, h - bt + 10), f"a={frac:.1f}", fill=(150, 150, 160))
    d.text((l, 22), title, fill=(235, 235, 240))

    for ci, (c, lab) in enumerate(zip(curves, labels)):
        ref = max(float(np.max(c)), 1e-12)
        db = 20 * np.log10(np.maximum(c, 1e-12) / ref)
        pts = [(l + i / (len(db) - 1) * (r - l), yy(max(min(v, top_db), bot_db)))
               for i, v in enumerate(db)]
        d.line(pts, fill=colors[ci % 3], width=3)
        d.text((r - 330, tp + 8 + ci * 20), f"— {lab}  (min {db.min():.1f} dB)",
               fill=colors[ci % 3])
    d.text((l, h - 26), "each curve normalised to its own maximum; the dip is the "
                        "mid-morph loss", fill=(120, 120, 130))
    img.save(path)


def main(argv=None):
    p = argparse.ArgumentParser(description="Morph two torus surfaces, spatially and spectrally.")
    p.add_argument("surface_a")
    p.add_argument("surface_b")
    p.add_argument("--base", type=float, default=110.0)
    p.add_argument("--ratio", type=float, default=1.6180339887)
    p.add_argument("--dur", type=float, default=8.0)
    p.add_argument("--frames", type=int, default=128)
    p.add_argument("--row-len", type=int, default=1024)
    p.add_argument("--out-dir", required=True)
    p.add_argument("--tag", required=True)
    a = p.parse_args(argv)

    os.makedirs(a.out_dir, exist_ok=True)
    A = load_surface(a.surface_a, a.row_len)
    B = load_surface(a.surface_b, a.row_len)
    FA, FB = np.fft.rfft2(A), np.fft.rfft2(B)
    alphas = np.linspace(0.0, 1.0, a.frames)

    print(f"morphing {os.path.basename(a.surface_a)} -> {os.path.basename(a.surface_b)} "
          f"({a.frames} frames)", file=sys.stderr)
    sig_sp = scan_frames([morph_spatial(A, B, x) for x in alphas], a.base, a.ratio, a.dur)
    sig_sc = scan_frames([morph_spectral(FA, FB, x) for x in alphas], a.base, a.ratio, a.dur)

    # one common gain for both renders — the amplitude difference is the finding
    g = 0.9 / max(np.max(np.abs(sig_sp)), np.max(np.abs(sig_sc)))
    out_sp = os.path.join(a.out_dir, f"{a.tag}_morph_spatial.wav")
    out_sc = os.path.join(a.out_dir, f"{a.tag}_morph_spectral.wav")
    write_float_wav(out_sp, fade(sig_sp * g, 15.0))
    write_float_wav(out_sc, fade(sig_sc * g, 15.0))

    nb = 96
    r_sp, r_sc = block_rms(sig_sp, nb), block_rms(sig_sc, nb)
    png = os.path.join(a.out_dir, f"{a.tag}_morph_rms.png")
    plot_rms([r_sp, r_sc], ["spatial (height-map crossfade)", "spectral (c_mn crossfade)"],
             png, f"mid-morph amplitude · {a.tag.replace('_', ' -> ')} · base {a.base:g} Hz, ratio {a.ratio:.6g}")

    def dip(c):
        return 20 * np.log10(c[len(c) // 2] / max(c.max(), 1e-12))
    mid = len(alphas) // 2
    mid_sp = morph_spatial(A, B, 0.5)
    print(f"  spatial  mid-morph dip: {dip(r_sp):+.2f} dB", file=sys.stderr)
    print(f"  spectral mid-morph dip: {dip(r_sc):+.2f} dB", file=sys.stderr)
    for nm, s in (("spatial", sig_sp), ("spectral", sig_sc)):
        h = harmonicity(s[len(s) // 2 - SR // 2: len(s) // 2 + SR // 2], a.base)
        print(f"  {nm:8s} mid-morph harmonicity: {h:.3f}", file=sys.stderr)
    print(f"wrote {out_sp}\nwrote {out_sc}\nwrote {png}", file=sys.stderr)
    _ = (mid, mid_sp)


if __name__ == "__main__":
    main()
