#!/usr/bin/env python3
"""
build_seventh_candidates.py — render the three candidate seventh surfaces.

The catalog's six named surfaces (Membrane, Chladni, Theta, Stiff String,
Knot Shadow, Penrose) cover three of the five generating logics: direct
Fourier coefficient design, operator algebra, and physical modeling. The
seventh-surface slot is the forcing function for the three logics NOT yet
incarnated — dynamical systems (Kuramoto), random fields (Matern), and
information geometry (Fisher). This script renders one candidate per logic
so the slot-7 choice can be made by eye, not by name.

Each surface is 1024x1024, torus-periodic, normalized to the catalog's
convention (global peak -> ~0.98), written as a 32-bit float mono WAV (the
surface itself, loadable into 2d.wave~ with `rows 1024`) plus a grayscale
heightmap PNG. Dependency-light: numpy + Pillow only (matches the catalog
tools; no scipy).
"""
from __future__ import annotations
import os
import struct

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
OUT_DIR = os.path.join(PROJ, "Wavetables", "seventh-surface-candidates")
SR = 48000
SQ = 1024


def write_float_wav(path: str, data: np.ndarray, sr: int) -> None:
    n = len(data)
    fmt_chunk = struct.pack("<HHIIHH", 3, 1, sr, sr * 4, 4, 32)
    fact_chunk = struct.pack("<I", n)
    body = data.astype("<f4").tobytes()
    riff_size = 4 + (8 + len(fmt_chunk)) + (8 + len(fact_chunk)) + (8 + len(body))
    with open(path, "wb") as f:
        f.write(b"RIFF"); f.write(struct.pack("<I", riff_size)); f.write(b"WAVE")
        f.write(b"fmt "); f.write(struct.pack("<I", len(fmt_chunk))); f.write(fmt_chunk)
        f.write(b"fact"); f.write(struct.pack("<I", len(fact_chunk))); f.write(fact_chunk)
        f.write(b"data"); f.write(struct.pack("<I", len(body))); f.write(body)


def grid(rows, row_len):
    phi = np.linspace(0.0, 2 * np.pi, row_len, endpoint=False)
    psi = np.linspace(0.0, 2 * np.pi, rows, endpoint=False)
    PHI, PSI = np.meshgrid(phi, psi)
    return PHI, PSI


def normalize_global(table, headroom=0.02):
    peak = float(np.max(np.abs(table)))
    return table if peak <= 0 else table * ((1.0 - headroom) / peak)


def save_heightmap(table, path):
    """Grayscale heightmap: surface value -> brightness, full dynamic range."""
    lo, hi = float(table.min()), float(table.max())
    span = (hi - lo) or 1.0
    img = ((table - lo) / span * 255.0).clip(0, 255).astype(np.uint8)
    # downsample to 512 for a lighter preview PNG
    im = Image.fromarray(img, mode="L")
    im = im.resize((512, 512), Image.LANCZOS)
    im.save(path)


# --------------------------------------------------------------------------
# Logic 3 — Dynamical systems (Kuramoto). A surface that carries the
# coupling term sin(phi - psi) inside the phase of every mode, so straight
# ridges bend into S-curves and gather toward the synchronization diagonal.
# The "bloom" is a small ring of harmonics phase-warped by the coupling.
# --------------------------------------------------------------------------
def kuramoto_bloom(rows, row_len, coupling=1.6):
    PHI, PSI = grid(rows, row_len)
    lock = coupling * np.sin(PHI - PSI)      # the Kuramoto coupling term
    W = np.zeros_like(PHI)
    # a ring of coupled modes; amplitudes taper so the bloom stays readable
    modes = [(1, 1, 1.00), (2, 1, 0.55), (1, 2, 0.55),
             (3, 2, 0.40), (2, 3, 0.40), (3, 1, 0.28), (1, 3, 0.28),
             (4, 3, 0.20), (3, 4, 0.20)]
    for m, n, amp in modes:
        W += amp * np.cos(m * PHI + n * PSI + lock)
    # weak coherent backbone along the lock diagonal (the synchronized state)
    W += 0.5 * np.cos(PHI - PSI)
    return normalize_global(W)


# --------------------------------------------------------------------------
# Logic 4 — Random fields (Matern). Spectral synthesis on the integer torus
# lattice: Fourier coefficients with random phase and amplitude sqrt(S(k)),
# S the Matern power spectral density. nu sets smoothness, ell the length
# scale. Hermitian symmetry -> a real, warm-smooth field. Seeded.
# --------------------------------------------------------------------------
def matern_field(rows, row_len, nu=1.5, ell=0.55, M=48, seed=20260606):
    rng = np.random.default_rng(seed)
    m = np.fft.fftfreq(row_len, d=1.0 / row_len)
    n = np.fft.fftfreq(rows, d=1.0 / rows)
    MM, NN = np.meshgrid(m, n)
    k2 = MM ** 2 + NN ** 2
    # 2D Matern PSD: (2 nu / ell^2 + 4 pi^2 |k|^2)^-(nu + 1)
    S = (2.0 * nu / ell ** 2 + 4.0 * np.pi ** 2 * k2) ** (-(nu + 1.0))
    S[k2 > M * M] = 0.0          # bandlimit so the field stays torus-clean
    amp = np.sqrt(S)
    white = rng.standard_normal((rows, row_len)) + 1j * rng.standard_normal((rows, row_len))
    spec = amp * white
    field = np.fft.ifft2(spec).real
    return normalize_global(field)


# --------------------------------------------------------------------------
# Logic 5 — Information geometry. The surface IS a statistical model's
# log-likelihood: a log-sum-exp of von Mises components on T^2. The ridges
# are the high-Fisher-information seams where neighboring modes hand off.
# --------------------------------------------------------------------------
def fisher_ridge(rows, row_len, kappa=2.2):
    PHI, PSI = grid(rows, row_len)
    # five von Mises components placed around the torus (the "data modes")
    centers = [(0.6, 0.6), (2.4, 1.1), (4.7, 2.0),
               (1.3, 4.4), (5.2, 5.0)]
    weights = [1.0, 0.8, 0.9, 0.7, 0.85]
    comps = []
    for (a, b), w in zip(centers, weights):
        comps.append(np.log(w) + kappa * (np.cos(PHI - a) + np.cos(PSI - b)))
    stack = np.stack(comps, axis=0)
    loglik = np.log(np.sum(np.exp(stack - stack.max(0)), axis=0)) + stack.max(0)
    return normalize_global(loglik)


CANDIDATES = [
    ("16cand_kuramoto_bloom", "KURAMOTO-BLOOM", kuramoto_bloom,
     "Logic 3 (dynamical systems). The Kuramoto coupling term sin(phi-psi) "
     "is folded into the phase of every mode; ridges bend and gather toward "
     "the synchronization diagonal. The bifurcation made into a surface."),
    ("16cand_matern_field", "MATERN-FIELD", matern_field,
     "Logic 4 (random fields). A seeded realization of a Matern Gaussian "
     "field synthesized on the integer torus lattice. Warm, smooth, "
     "statistically specified rather than hand-drawn."),
    ("16cand_fisher_ridge", "FISHER-RIDGE", fisher_ridge,
     "Logic 5 (information geometry). The surface is the log-likelihood of "
     "a five-mode von Mises mixture on T^2; the ridges are the high-Fisher "
     "seams where neighboring modes hand off."),
]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for slug, opt_id, fn, blurb in CANDIDATES:
        table = fn(SQ, SQ)
        wav = os.path.join(OUT_DIR, slug + ".wav")
        png = os.path.join(OUT_DIR, slug + ".png")
        write_float_wav(wav, table.reshape(-1), SR)
        save_heightmap(table, png)
        rms = float(np.sqrt(np.mean(table ** 2)))
        peak = float(np.max(np.abs(table)))
        print(f"{opt_id:16s} peak={peak:.3f} rms={rms:.3f}  -> {slug}.wav / .png")
    print("done ->", OUT_DIR)


if __name__ == "__main__":
    main()
