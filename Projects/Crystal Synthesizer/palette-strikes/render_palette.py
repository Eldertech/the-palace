#!/usr/bin/env python3
"""
Crystal Synthesizer — Palette Strikes (the five remaining minerals)
===================================================================

Cycle 8 rendered the two poles of the symmetry arc: diamond (cubic, four
partials inside one fifth-plus) and labradorite (triclinic, eight partials
across four octaves). Loudon's grant on -021 was FILL-PALETTE: render the
five minerals in between — ruby, amethyst, fluorite, emerald, topaz — with
the *same* additive engine, the *same* envelope, the *same* root (A2), so
the only variable across all eight is the partial ratio table. That is what
makes the set a controlled experiment rather than eight nice sounds.

The synthesis code is lifted verbatim from triclinic-proof/render_labradorite.py
(same attack, same per-partial decay shortening, same 0.70 amplitude roll-off,
same deterministic per-partial phase seed) precisely so the comparison holds.
Ratios come straight from Crystal Sonification Reference § each mineral.

Outputs (in this folder):
  ruby_strike.wav       trigonal R-3c   · 7 modes · the 1.10/1.14 doublet
  amethyst_strike.wav   trigonal P3121  · 9 modes · three families, wide gap
  fluorite_strike.wav   cubic Fm-3m     · 6 modes · the ionic gap
  emerald_strike.wav    hexagonal P6/mcc· 7 modes · ring breath at 1.68
  topaz_strike.wav      orthorhombic Pbnm·8 modes · evenly distributed
  palette_tour.wav      all eight, in symmetry order, 0.6 s apart
  <mineral>_strike.svg  log-axis partial plot per mineral (menu visuals)

numpy-only (no scipy, no matplotlib in the sandbox).

Author: Crystal Synthesizer steward, cycle 10 (2026-09-15)
Grant:  resp-mqszz12v-vj1akr — FILL-PALETTE (cycle-8 request -021)
"""

import os
import sys
import struct
import numpy as np

SR = 44100
DUR = 6.0
ROOT_HZ = 110.0
OUT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJ_DIR = os.path.dirname(OUT_DIR)

# --- the palette, in ascending order of symmetry-breaking -------------------
# (name, space group, ratios, colour, one-line signature)
PALETTE = [
    ("Diamond",     "cubic Fd-3m",        [1.00, 1.32, 1.48, 1.57, 1.65],
     "#7fb8ff", "four unique partials inside 1.65 — maximum compression"),
    ("Fluorite",    "cubic Fm-3m",        [1.00, 1.00, 1.35, 1.47, 1.69, 2.48],
     "#b28bff", "five low modes, then silence, then one lone LO at 2.48"),
    ("Emerald",     "hexagonal P6/mcc",   [1.00, 1.23, 1.47, 1.68, 2.13, 2.30, 3.33],
     "#5fd39b", "ring-breathing mode at 1.68 is the heartbeat"),
    ("Ruby",        "trigonal R-3c",      [1.00, 1.10, 1.14, 1.19, 1.52, 1.70, 1.98],
     "#ff6b6b", "the 1.10/1.14 near-doublet beats — 'the rubiness'"),
    ("Amethyst",    "trigonal P3121",     [1.00, 1.62, 2.07, 2.77, 3.13, 3.63, 5.45, 6.21, 8.32],
     "#c08bff", "three families, a soft mode at 1.62, a gap at 3.6→5.5"),
    ("Topaz",       "orthorhombic Pbnm",  [1.00, 1.45, 1.91, 2.37, 2.96, 3.68, 4.80, 6.05],
     "#ffd166", "eight modes spread evenly — no cluster, no gap"),
    ("Labradorite", "triclinic C-1",      [1.00, 1.83, 3.17, 4.67, 7.00, 9.50, 13.3, 17.5],
     "#ffb867", "four octaves of partials with no organising ratio"),
]
NEW_THIS_CYCLE = {"Fluorite", "Emerald", "Ruby", "Amethyst", "Topaz"}


def additive_strike(ratios, root_hz=ROOT_HZ, dur=DUR, sr=SR,
                    attack_ms=80, decay_s=5.5):
    """Verbatim from render_labradorite.py — do not 'improve' it. The whole
    point of the palette is that every mineral meets the identical engine."""
    n = int(dur * sr)
    t = np.arange(n) / sr
    attack_n = int(attack_ms * 1e-3 * sr)
    env_attack = np.linspace(0.0, 1.0, attack_n)
    out = np.zeros(n)
    amp = 1.0
    for k, r in enumerate(ratios):
        f = root_hz * r
        if f >= sr * 0.45:
            continue
        decay_tau = decay_s / (1.0 + 0.15 * k)
        env = np.exp(-t / decay_tau)
        env[:attack_n] *= env_attack
        phase = 2.0 * np.pi * np.random.default_rng(7 + k).uniform(0, 1)
        out += amp * env * np.sin(2 * np.pi * f * t + phase)
        amp *= 0.70
    return out


def normalize(audio, peak=0.85):
    p = float(np.max(np.abs(audio)))
    return audio if p < 1e-9 else audio * (peak / p)


def write_wav(path, audio, sr=SR):
    int16 = np.int16(np.clip(audio, -1.0, 1.0) * 32767)
    data = int16.tobytes()
    with open(path, 'wb') as f:
        f.write(b'RIFF'); f.write(struct.pack('<I', 36 + len(data))); f.write(b'WAVE')
        f.write(b'fmt '); f.write(struct.pack('<IHHIIHH', 16, 1, 1, sr, sr * 2, 2, 16))
        f.write(b'data'); f.write(struct.pack('<I', len(data))); f.write(data)
    print(f"  wrote {os.path.basename(path)}  (n={len(audio)}, peak={np.max(np.abs(audio)):.3f})")


def plot_partials_svg(ratios, label, color, path, root_hz=ROOT_HZ):
    W, H, pad_l, pad_r, pad_t, pad_b = 880, 200, 40, 20, 36, 44
    f_lo, f_hi = 80.0, 22050.0
    def x(f):
        return pad_l + (np.log10(f) - np.log10(f_lo)) / (np.log10(f_hi) - np.log10(f_lo)) * (W - pad_l - pad_r)
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
             f'style="background:#0f0f0f;font-family:Manrope,system-ui,sans-serif">']
    parts.append(f'<text x="{pad_l}" y="22" fill="#e6e6e6" font-size="14" font-weight="600">'
                 f'{label} — {len(ratios)} partials over A2 (110 Hz)</text>')
    for f_grid in (100, 1000, 10000):
        gx = x(f_grid)
        parts.append(f'<line x1="{gx:.1f}" y1="{pad_t}" x2="{gx:.1f}" y2="{H-pad_b}" stroke="#2a2a2a" stroke-width="1"/>')
        parts.append(f'<text x="{gx:.1f}" y="{H-pad_b+18}" fill="#888" font-size="11" text-anchor="middle">{f_grid} Hz</text>')
    for r in ratios:
        f = root_hz * r
        if f > f_hi:
            continue
        cx = x(f)
        parts.append(f'<line x1="{cx:.1f}" y1="{pad_t+18}" x2="{cx:.1f}" y2="{H-pad_b}" stroke="{color}" stroke-width="2.2"/>')
        parts.append(f'<circle cx="{cx:.1f}" cy="{pad_t+18}" r="4" fill="{color}"/>')
        parts.append(f'<text x="{cx:.1f}" y="{pad_t+12}" fill="#e6e6e6" font-size="10" text-anchor="middle">{r:g}</text>')
    parts.append('</svg>')
    with open(path, 'w') as f:
        f.write("".join(parts))
    print(f"  wrote {os.path.basename(path)}")


def spectral_centroid(audio, sr=SR):
    """Brightness proxy, measured on the first second of the strike."""
    seg = audio[:sr] * np.hanning(sr)
    mag = np.abs(np.fft.rfft(seg))
    freqs = np.fft.rfftfreq(sr, 1 / sr)
    return float((mag * freqs).sum() / max(mag.sum(), 1e-12))


def main():
    print("Crystal Synthesizer — palette strikes (FILL-PALETTE)")
    print(f"  root: A2 = {ROOT_HZ:.1f} Hz · identical engine across all minerals\n")

    rendered = {}
    for name, sg, ratios, color, sig in PALETTE:
        audio = normalize(additive_strike(ratios))
        rendered[name] = audio
        if name in NEW_THIS_CYCLE:
            slug = name.lower()
            write_wav(os.path.join(OUT_DIR, f"{slug}_strike.wav"), audio)
            plot_partials_svg(ratios, f"{name} ({sg})", color,
                              os.path.join(OUT_DIR, f"{slug}_strike.svg"))

    gap = np.zeros(int(0.6 * SR))
    tour = []
    for name, *_ in PALETTE:
        tour.append(rendered[name][:int(3.2 * SR)])
        tour.append(gap)
    write_wav(os.path.join(OUT_DIR, "palette_tour.wav"), normalize(np.concatenate(tour)))

    print("\n  mineral       span (r_max)   octaves   partials   centroid (Hz)")
    for name, sg, ratios, color, sig in PALETTE:
        span = max(ratios) / min(ratios)
        c = spectral_centroid(rendered[name])
        print(f"  {name:<13} {span:>7.2f}x     {np.log2(span):>5.2f}     {len(ratios):>5d}     {c:>8.1f}")
    print("\n  Monotonic-brightness check (does lower symmetry mean brighter?):")
    cents = [spectral_centroid(rendered[n]) for n, *_ in PALETTE]
    print("   ", " < ".join(f"{n}" for n, *_ in PALETTE))
    print("   ", [round(c) for c in cents])
    print("    monotonic:", all(a < b for a, b in zip(cents, cents[1:])))


if __name__ == "__main__":
    main()
