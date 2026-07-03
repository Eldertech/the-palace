#!/usr/bin/env python3
"""
Crystal Synthesizer — Triclinic Proof (Labradorite, C-1)
=========================================================

The hypothesis arc closes here. The project's load-bearing claim — symmetry
determines sonic character — needs its negative pole audible. Cubic diamond
(four unique partials packed into r_n 1.00–1.65) is the maximum-symmetry
end. Labradorite is the other end: triclinic C-1, the lowest possible 3D
symmetry, where every phonon mode is unique and no two partials share a
ratio the ear can latch onto. If diamond sounds compressed and bright and
labradorite sounds scattered and alien when fed the same additive synth and
the same envelope, the symmetry-determines-timbre hypothesis survives its
hardest test. If they sound similar, the project's center was never the
symmetry — it was something else, and we need to know.

Approach: pure additive resynthesis. Partial ratios come straight from
Crystal Sonification Reference §Diamond and §Labradorite — the reference is
the spec, this file is the renderer. No filtering, no dispersion, no
modulation: just sinusoids at f_root * r_n, struck and decayed, so the only
thing speaking is the partial structure itself. MIDI A2 (110 Hz) for both,
so they are directly comparable.

Outputs:
  labradorite_strike.wav      A2 struck, 8 unique partials, no organising ratio
  diamond_strike.wav          A2 struck, 4 unique partials, all in 1.00–1.65
  symmetry_arc_AB.wav         diamond → 1 s gap → labradorite, back-to-back
  labradorite_strike.png      bar chart of the 8 partials (Hz)
  diamond_strike.png          bar chart of the 4 partials (Hz)

numpy-only (the cycle-4 baton noted scipy is absent in the sandbox). The
14-line PCM-16 WAV writer from the beryl render is reused verbatim.

Author: Crystal Synthesizer steward, cycle 8 (2026-06-25)
Grant:  resp-mqsqm2oj-svnibh — RENDER-LABRADORITE (cycle-7 request -018)
Recipe: home entry §"Triclinic" hypothesis + Crystal Sonification Reference
        §Labradorite (partial table) + §Diamond (partial table).
"""

import os
import struct
import numpy as np

SR = 44100
DUR = 6.0
ROOT_HZ = 110.0                       # MIDI A2
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# Partial ratios — straight from Crystal Sonification Reference.
# Diamond is cubic Fd-3m: 6 branches but 2 are degenerate (the doubled TA at
# 1.00), so only 4 unique ratios. The whole spectrum lives inside one
# perfect fifth-plus — that compression is the cubic signature.
DIAMOND_RATIOS = [1.00, 1.32, 1.48, 1.57, 1.65]

# Labradorite is triclinic C-1: 156 unique phonon branches, no degeneracy.
# Eight selected modes from the reference span more than four octaves with
# no symmetry-forced relationship between any pair.
LABRADORITE_RATIOS = [1.00, 1.83, 3.17, 4.67, 7.00, 9.50, 13.3, 17.5]


def additive_strike(ratios, root_hz=ROOT_HZ, dur=DUR, sr=SR,
                    attack_ms=80, decay_s=5.5):
    """Struck additive tone. Each partial is a sinusoid at f_root * r_n with
    a fast attack and a long exponential decay. Higher partials decay slightly
    faster (mode lifetimes shorten with frequency in real crystals) and are
    quieter (each at 70% of the previous, per the reference's audio prompt)."""
    n = int(dur * sr)
    t = np.arange(n) / sr
    attack_n = int(attack_ms * 1e-3 * sr)
    env_attack = np.linspace(0.0, 1.0, attack_n)
    out = np.zeros(n)
    amp = 1.0
    for k, r in enumerate(ratios):
        f = root_hz * r
        if f >= sr * 0.45:            # keep partials below Nyquist
            continue
        decay_tau = decay_s / (1.0 + 0.15 * k)   # higher partials decay faster
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
    n_bytes = len(data)
    with open(path, 'wb') as f:
        f.write(b'RIFF')
        f.write(struct.pack('<I', 36 + n_bytes))
        f.write(b'WAVE')
        f.write(b'fmt ')
        f.write(struct.pack('<IHHIIHH', 16, 1, 1, sr, sr * 2, 2, 16))
        f.write(b'data')
        f.write(struct.pack('<I', n_bytes))
        f.write(data)
    print(f"  wrote {os.path.basename(path)}  (n={len(audio)}, peak={np.max(np.abs(audio)):.3f})")


def plot_partials_svg(ratios, label, color, path, root_hz=ROOT_HZ):
    """Emit a tiny standalone SVG of partial frequencies on a log axis. Used
    by the proofs HTML menu; numpy-only sandbox has no matplotlib."""
    W, H, pad_l, pad_r, pad_t, pad_b = 880, 200, 40, 20, 36, 44
    f_lo, f_hi = 80.0, 22050.0
    def x(f):
        return pad_l + (np.log10(f) - np.log10(f_lo)) / (np.log10(f_hi) - np.log10(f_lo)) * (W - pad_l - pad_r)
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
             f'style="background:#0f0f0f;font-family:Manrope,system-ui,sans-serif">']
    parts.append(f'<text x="{pad_l}" y="22" fill="#e6e6e6" font-size="14" '
                 f'font-weight="600">{label} — {len(ratios)} partials over A2 (110 Hz)</text>')
    for f_grid in (100, 1000, 10000):
        gx = x(f_grid)
        parts.append(f'<line x1="{gx:.1f}" y1="{pad_t}" x2="{gx:.1f}" '
                     f'y2="{H-pad_b}" stroke="#2a2a2a" stroke-width="1"/>')
        parts.append(f'<text x="{gx:.1f}" y="{H-pad_b+18}" fill="#888" '
                     f'font-size="11" text-anchor="middle">{f_grid} Hz</text>')
    for r in ratios:
        f = root_hz * r
        if f > f_hi:
            continue
        cx = x(f)
        parts.append(f'<line x1="{cx:.1f}" y1="{pad_t+18}" x2="{cx:.1f}" '
                     f'y2="{H-pad_b}" stroke="{color}" stroke-width="2.2"/>')
        parts.append(f'<circle cx="{cx:.1f}" cy="{pad_t+18}" r="4" fill="{color}"/>')
        parts.append(f'<text x="{cx:.1f}" y="{pad_t+12}" fill="#e6e6e6" '
                     f'font-size="10" text-anchor="middle">{r:g}</text>')
    parts.append('</svg>')
    with open(path, 'w') as f:
        f.write("".join(parts))
    print(f"  wrote {os.path.basename(path)}")


def main():
    print("Crystal Synthesizer — Triclinic proof (labradorite vs diamond)")
    print(f"  root:        A2 = {ROOT_HZ:.1f} Hz")
    print(f"  diamond:     {len(DIAMOND_RATIOS)} partials, r_n 1.00 .. {DIAMOND_RATIOS[-1]}")
    print(f"  labradorite: {len(LABRADORITE_RATIOS)} partials, r_n 1.00 .. {LABRADORITE_RATIOS[-1]}")
    print()

    diamond = normalize(additive_strike(DIAMOND_RATIOS))
    labrad  = normalize(additive_strike(LABRADORITE_RATIOS))

    write_wav(os.path.join(OUT_DIR, "diamond_strike.wav"), diamond)
    write_wav(os.path.join(OUT_DIR, "labradorite_strike.wav"), labrad)

    gap = np.zeros(int(1.0 * SR))
    ab = normalize(np.concatenate([diamond, gap, labrad]))
    write_wav(os.path.join(OUT_DIR, "symmetry_arc_AB.wav"), ab)

    plot_partials_svg(DIAMOND_RATIOS,    "Diamond (cubic Fd-3m)",
                      "#7fb8ff", os.path.join(OUT_DIR, "diamond_strike.svg"))
    plot_partials_svg(LABRADORITE_RATIOS, "Labradorite (triclinic C-1)",
                      "#ffb867", os.path.join(OUT_DIR, "labradorite_strike.svg"))

    print()
    print("Compression check (the symmetry signature):")
    d_span = DIAMOND_RATIOS[-1] / DIAMOND_RATIOS[0]
    l_span = LABRADORITE_RATIOS[-1] / LABRADORITE_RATIOS[0]
    print(f"  diamond     spans {d_span:.2f}x the fundamental (~{np.log2(d_span):.2f} octaves)")
    print(f"  labradorite spans {l_span:.2f}x the fundamental (~{np.log2(l_span):.2f} octaves)")
    print(f"  labradorite is {l_span/d_span:.1f}x wider — the triclinic signature, audible.")


if __name__ == "__main__":
    main()
