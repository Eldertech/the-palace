#!/usr/bin/env python3
"""
kuramoto_scan.py
================

Generating Logic 3 as a *scan mode*: the two phasors stop running free and
start pulling on each other. The reference implementation for
``RNBO/torus_2d_kuramoto.codebox`` — same equations, same Euler step, so the
codebox can be checked against these renders.

The linear scan runs phi1 at w1 and phi2 at w2 and never lets them talk. Here
they are coupled near a chosen rational ratio a/b (the cable curve we want to
lock onto):

    psi       = b*phi2 - a*phi1                       (cycles; the lock phase)
    dphi1/dt  = w1 + K*sin(2*pi*psi)
    dphi2/dt  = w2 - K*sin(2*pi*psi)
    =>  dpsi/dt = Delta - (a+b)*K*sin(2*pi*psi),      Delta = b*w2 - a*w1

That is the Adler equation. Below threshold, K < K* = |Delta|/(a+b), psi keeps
slipping: the scan is quasi-periodic and the tone beats at the slip rate
sqrt(Delta^2 - ((a+b)K)^2) Hz — which slows toward zero as K nears K*, so the
beating turns into occasional hiccups. At K* the slips stop (a saddle-node
bifurcation — a snap, not a fade): the path closes into the (a,b) cable curve
and the tone is periodic at f0 = w1'/b.

Past lock, K keeps working: the locked phase settles at
sin(2*pi*psi*) = Delta / ((a+b)K), so raising K slides the closed curve
sideways across the surface. Above threshold, coupling is a timbre knob.

Dependencies: numpy + the standard library (tinyplot for the PNG).

Usage
-----
    python3 kuramoto_scan.py ../Wavetables/15_penrose_lattice.wav \\
        --base 110 --ratio 1.518181818 --lock 3 2 \\
        --out-dir ../Auditions/cycle-7 --tag penrose
"""
from __future__ import annotations
import argparse
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scan_surface import SR, load_surface, write_float_wav, fade, harmonicity  # noqa: E402
import tinyplot as tp  # noqa: E402

TWO_PI = 2.0 * math.pi


def integrate(w1: float, w2: float, a: int, b: int, K: np.ndarray, sr: int = SR):
    """Forward-Euler, one step per sample — exactly what the codebox does.
    K is a per-sample array (Hz). Returns wrapped phases phi1, phi2 and the
    unwrapped lock phase psi, plus unwrapped phi1 (to measure the true f0 —
    locking pulls w1 to w1 + Delta/(a+b), so f0 is not w1/b)."""
    n = len(K)
    phi1 = np.empty(n)
    phi2 = np.empty(n)
    psi = np.empty(n)
    un1 = np.empty(n)
    p1 = p2 = 0.0
    u1 = u2 = 0.0            # unwrapped, for psi
    dt = 1.0 / sr
    sin = math.sin
    for i in range(n):
        c = K[i] * sin(TWO_PI * (b * p2 - a * p1))
        d1 = (w1 + c) * dt
        d2 = (w2 - c) * dt
        p1 += d1
        p2 += d2
        u1 += d1
        u2 += d2
        p1 -= math.floor(p1)
        p2 -= math.floor(p2)
        phi1[i] = p1
        phi2[i] = p2
        psi[i] = b * u2 - a * u1
        un1[i] = u1
    return phi1, phi2, psi, un1


def lookup(surface: np.ndarray, phi1: np.ndarray, phi2: np.ndarray) -> np.ndarray:
    rows, cols = surface.shape
    x, y = phi1 * cols, phi2 * rows
    x0 = np.floor(x).astype(np.int64) % cols
    y0 = np.floor(y).astype(np.int64) % rows
    x1, y1 = (x0 + 1) % cols, (y0 + 1) % rows
    fx, fy = x - np.floor(x), y - np.floor(y)
    top = surface[y0, x0] * (1 - fx) + surface[y0, x1] * fx
    bot = surface[y1, x0] * (1 - fx) + surface[y1, x1] * fx
    return top * (1 - fy) + bot * fy


def render(surface, w1, w2, a, b, K, sr=SR):
    phi1, phi2, psi, un1 = integrate(w1, w2, a, b, K, sr)
    return lookup(surface, phi1, phi2), psi, un1


def harm_at(sig, un1, b, c, win, sr=SR):
    """Harmonicity of a `win`-second window centred on sample c, against the
    f0 the phasors actually ran at in that window (mean phi1 rate / b)."""
    h = int(win * sr / 2)
    s, e = max(c - h, 0), min(c + h, len(sig) - 1)
    f0 = (un1[e] - un1[s]) / ((e - s) / sr) / b
    w = sig[s:e]
    # demean: a locked curve sits at its own average height on the surface, and
    # that DC would otherwise count as off-comb energy
    return harmonicity(w - w.mean(), f0, sr)


def dc_block(x, sr=SR, fc=10.0):
    """One-pole DC blocker — the codebox needs the same, because the locked
    curve's average height moves as K moves."""
    r = 1.0 - TWO_PI * fc / sr
    y = np.empty_like(x)
    xp = yp = 0.0
    for i, v in enumerate(x):
        yp = v - xp + r * yp
        xp = v
        y[i] = yp
    return y


def blocks(sig, psi, un1, K, b, nb, sr=SR):
    """Per-block: K, slip rate (Hz), lock order R = |<exp(2 pi i psi)>|, and
    harmonicity over a 1-second window centred on the block (0.25 s blocks are
    too short to resolve a 55 Hz comb)."""
    out = []
    for s in np.array_split(np.arange(len(sig)), nb):
        dur = len(s) / sr
        slip = (psi[s[-1]] - psi[s[0]]) / dur
        R = abs(np.mean(np.exp(1j * TWO_PI * psi[s])))
        out.append((float(K[s].mean()), abs(slip), float(R),
                    harm_at(sig, un1, b, int(s.mean()), 1.0, sr)))
    return out


def plot(rows, kstar, path, title):
    W, H = 1100, 520
    L, R_, T, B = 90, 30, 60, 70
    img = np.zeros((H, W, 3), np.uint8)
    img[:] = (14, 14, 18)
    grid, fg = (40, 40, 48), (150, 150, 160)
    ks = np.array([r[0] for r in rows])
    kmax = ks.max()

    def X(k):
        return L + (W - L - R_) * k / kmax

    def Y(v):
        return T + (H - T - B) * (1 - v)
    for v in (0, 0.25, 0.5, 0.75, 1.0):
        tp.line(img, (L, Y(v)), (W - R_, Y(v)), grid)
        tp.text(img, 20, int(Y(v)) - 6, f"{v:.2f}", fg)
    xk = X(kstar)
    for yy in range(T, H - B, 6):
        tp.line(img, (xk, yy), (xk, yy + 3), (200, 90, 90), 2)
    tp.text(img, int(xk) + 8, T + 6, "K* LOCK", (220, 110, 110))
    slip = np.array([r[1] for r in rows])
    series = [
        ([r[2] for r in rows], (120, 190, 255), "LOCK ORDER R"),
        ([r[3] for r in rows], (240, 190, 80), "HARMONICITY"),
        (list(slip / max(slip.max(), 1e-9)), (150, 220, 150), f"SLIP RATE (MAX {slip.max():.1f} HZ)"),
    ]
    for i, (vals, col, lab) in enumerate(series):
        tp.polyline(img, [(X(k), Y(v)) for k, v in zip(ks, vals)], col, 2)
        tp.text(img, W - 420, T + 10 + 22 * i, lab, col)
    tp.text(img, L, 20, title, (220, 220, 230))
    tp.text(img, L, H - 40, f"COUPLING K 0 TO {kmax:.2f} HZ", fg)
    tp.write_png(path, img)


def main(argv=None):
    p = argparse.ArgumentParser(description="Kuramoto-coupled scan of a torus surface.")
    p.add_argument("surface")
    p.add_argument("--base", type=float, default=110.0, help="w1, Hz")
    p.add_argument("--ratio", type=float, default=1.518181818, help="w2/w1 before coupling")
    p.add_argument("--lock", type=int, nargs=2, default=(3, 2), metavar=("A", "B"),
                   help="lock target ratio a/b")
    p.add_argument("--ramp", type=float, default=14.0, help="K-ramp seconds")
    p.add_argument("--kmax", type=float, default=2.0, help="K ceiling as a multiple of K*")
    p.add_argument("--hold", type=float, default=4.0, help="seconds per regime in the triptych")
    p.add_argument("--out-dir", required=True)
    p.add_argument("--tag", required=True)
    p.add_argument("--row-len", type=int, default=1024)
    a = p.parse_args(argv)

    S = load_surface(a.surface, a.row_len)
    A, B = a.lock
    w1, w2 = a.base, a.base * a.ratio
    delta = B * w2 - A * w1
    kstar = abs(delta) / (A + B)
    print(f"lock {A}/{B}: Delta = {delta:.3f} Hz, K* = {kstar:.3f} Hz, "
          f"f0 when locked = {w1 / B:.2f} Hz", file=sys.stderr)
    os.makedirs(a.out_dir, exist_ok=True)

    # 1 — the ramp: K from 0 to kmax*K*, straight line
    n = int(a.ramp * SR)
    K = np.linspace(0.0, a.kmax * kstar, n)
    sig, psi, un1 = render(S, w1, w2, A, B, K)
    audio = dc_block(sig)
    g = 0.9 / np.max(np.abs(audio))
    ramp_path = os.path.join(a.out_dir, f"{a.tag}_kuramoto_ramp.wav")
    write_float_wav(ramp_path, fade(audio * g, 15.0))
    rows = blocks(sig, psi, un1, K, B, 56)
    png = os.path.join(a.out_dir, f"{a.tag}_kuramoto_ramp.png")
    plot(rows, kstar, png, f"{a.tag.upper()} . RATIO {a.ratio:.5f} PULLED TO {A}/{B} . K* {kstar:.2f} HZ")

    # 2 — the triptych: free / just under threshold / locked
    regimes = [("free", 0.0), ("hover", 0.97), ("locked", 1.6)]
    parts, report = [], []
    m = int(a.hold * SR)
    for name, mult in regimes:
        Kc = np.full(m, mult * kstar)
        s, ps, u = render(S, w1, w2, A, B, Kc)
        tail = slice(m // 2, m)
        slip = abs(ps[m - 1] - ps[m // 2]) / (a.hold / 2)
        R = abs(np.mean(np.exp(1j * TWO_PI * ps[tail])))
        h = harm_at(s, u, B, (3 * m) // 4, a.hold / 2)
        report.append((name, mult * kstar, slip, R, h))
        d = dc_block(s)
        parts.append(fade(d / np.max(np.abs(d)) * 0.9, 20.0))
    tri_path = os.path.join(a.out_dir, f"{a.tag}_kuramoto_three_regimes.wav")
    write_float_wav(tri_path, np.concatenate(parts))

    print("ramp blocks (K, slip Hz, R, harmonicity):", file=sys.stderr)
    for r in rows[::7]:
        print(f"  K {r[0]:.3f}  slip {r[1]:.2f}  R {r[2]:.3f}  harm {r[3]:.3f}", file=sys.stderr)
    print("three regimes (second half of each hold):", file=sys.stderr)
    for name, k, slip, R, h in report:
        pred = math.sqrt(max(delta ** 2 - ((A + B) * k) ** 2, 0.0))
        print(f"  {name:6s} K {k:.3f}  slip {slip:.3f} Hz (Adler predicts {pred:.3f})  "
              f"R {R:.3f}  harm {h:.3f}", file=sys.stderr)
    print(f"wrote {ramp_path}\nwrote {png}\nwrote {tri_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
