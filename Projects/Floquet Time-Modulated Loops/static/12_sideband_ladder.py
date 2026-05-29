"""
12_sideband_ladder.py — generate static/12_sideband_ladder.png.

Teaching purpose: when a Floquet system is driven at frequency f and one
of its coefficients is modulated periodically with period T_mod = 1/f_mod,
the output spectrum is a comb at f + n·f_mod (n any integer) weighted
by the FOURIER SERIES coefficients c_n of the modulation waveform.

So the modulation waveform's Fourier series is the spectral envelope.

Four modulation cases, each in a column:
  1. cosine                    — c_±1 only — TWO sidebands. (Ring mod.)
  2. cosine of cosine (FM)     — c_n are Bessel functions J_n(beta).
  3. square wave               — c_n falls 1/n at odd n only.
  4. drawn wavetable           — c_n arbitrary, designer's choice.

Three rows per column:
  ROW 1: the modulation waveform m(t) over one period.
  ROW 2: |c_n|, the magnitudes of the modulation's Fourier coefficients.
  ROW 3: the resulting Floquet sideband spectrum at the loop's output —
         a comb at f + n·f_mod with the c_n magnitudes.

This is the result a student should walk away owning. The shape of
the modulation IS the spectral envelope.

Carrier f = 220 Hz, modulation f_mod = 80 Hz, so sidebands at
220 + n·80 for n = ..., -3, -2, -1, 0, +1, +2, +3, ... = 100, 140, 220,
300, 380, ...
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import numpy as np
import matplotlib.pyplot as plt
from scipy.special import jv as bessel_J
from mathieu_core import PALETTE, apply_dark_style


CARRIER_F = 220.0
MOD_F = 80.0
N_SAMPLES = 2048
T_MOD = 1.0 / MOD_F


def cosine_mod(t):
    return np.cos(2 * np.pi * MOD_F * t)


def fm_mod(t, beta=2.4):
    # cosine of cosine — the FM family. Output is itself bandlimited.
    return np.cos(2 * np.pi * MOD_F * t + beta * np.cos(2 * np.pi * MOD_F * t))


def square_mod(t):
    return np.sign(np.sin(2 * np.pi * MOD_F * t))


def wavetable_mod(t):
    # A hand-designed cosine bump on a slight offset — represents the
    # general "user-drawn" case. Asymmetric shape gives both even and
    # odd Fourier coefficients.
    phase = (2 * np.pi * MOD_F * t) % (2 * np.pi)
    bump = np.exp(-((phase - np.pi) / 0.6) ** 2)
    skew = 0.3 * np.cos(2 * (2 * np.pi * MOD_F * t))
    return 2.0 * bump + skew - 0.6


def fourier_coefficients(m_func, n_max=12):
    """Compute |c_n| of m(t) on one period via FFT."""
    N = 4096
    t = np.linspace(0, T_MOD, N, endpoint=False)
    m = m_func(t)
    M = np.fft.rfft(m) / N * 2.0   # one-sided coefficients
    M[0] /= 2.0                    # DC normalization
    return M[:n_max]


def main(out_png):
    apply_dark_style(plt)

    cases = [
        ("cosine",            cosine_mod,    PALETTE["multiplier"]),
        ("FM (cos-of-cos)",   lambda t: fm_mod(t, 2.4),
                                              PALETTE["mod"]),
        ("square",            square_mod,    PALETTE["unstable"]),
        ("drawn wavetable",   wavetable_mod, PALETTE["marginal"]),
    ]

    fig, axes = plt.subplots(3, 4, figsize=(15, 9.5), dpi=160)

    t = np.linspace(0, T_MOD, N_SAMPLES, endpoint=False)

    for col, (name, mod_fn, col_color) in enumerate(cases):
        # Row 1: modulation waveform.
        ax_w = axes[0, col]
        m = mod_fn(t)
        ax_w.plot(t * 1000, m, color=col_color, lw=1.4)
        ax_w.set_title(name, color=col_color, fontweight='bold', fontsize=11)
        ax_w.set_xlabel("t  (ms)", fontsize=9)
        if col == 0:
            ax_w.set_ylabel("m(t)", fontsize=10)
        ax_w.grid(alpha=0.15)
        ax_w.set_xlim(0, T_MOD * 1000)

        # Row 2: Fourier coefficient magnitudes (stem).
        ax_c = axes[1, col]
        coeffs = fourier_coefficients(mod_fn, n_max=10)
        ns = np.arange(len(coeffs))
        c_mags = np.abs(coeffs)
        markerline, stemlines, baseline = ax_c.stem(
            ns, c_mags, basefmt=' ', linefmt='-', markerfmt='o')
        plt.setp(stemlines, color=col_color, lw=1.4)
        plt.setp(markerline, color=col_color, mec=PALETTE["bg"], mew=0.8, ms=6)
        ax_c.set_xlabel("n  (harmonic)", fontsize=9)
        if col == 0:
            ax_c.set_ylabel(r"$|c_n|$", fontsize=10)
        ax_c.grid(alpha=0.15)
        ax_c.set_xlim(-0.5, 9.5)
        peak = max(c_mags) if max(c_mags) > 0 else 1.0
        ax_c.set_ylim(0, peak * 1.15)

        # Row 3: resulting sideband spectrum at f_carrier + n*f_mod.
        ax_s = axes[2, col]
        # Build sideband positions for n = -8..+8.
        n_range = np.arange(-8, 9)
        sb_freqs = []
        sb_mags = []
        for n in n_range:
            f = CARRIER_F + n * MOD_F
            if f < 0:
                continue
            n_abs = abs(n)
            mag = c_mags[n_abs] if n_abs < len(c_mags) else 0.0
            sb_freqs.append(f)
            sb_mags.append(mag)
        ml, sl, bl = ax_s.stem(sb_freqs, sb_mags,
                                basefmt=' ', linefmt='-', markerfmt='o')
        plt.setp(sl, color=col_color, lw=1.4)
        plt.setp(ml, color=col_color, mec=PALETTE["bg"], mew=0.8, ms=6)
        # Mark the carrier with a vertical dashed line.
        ax_s.axvline(CARRIER_F, color=PALETTE["text_dim"], ls='--', lw=0.6,
                     alpha=0.7)
        ax_s.text(CARRIER_F, peak * 1.08, "carrier f", ha='center',
                  color=PALETTE["text_dim"], fontsize=8)
        ax_s.set_xlabel("frequency  (Hz)", fontsize=9)
        if col == 0:
            ax_s.set_ylabel(f"output spectrum\n(f = {CARRIER_F:.0f} Hz,  "
                            f"f_mod = {MOD_F:.0f} Hz)", fontsize=9)
        ax_s.grid(alpha=0.15)
        ax_s.set_xlim(20, 1000)
        ax_s.set_ylim(0, peak * 1.15)

    fig.suptitle("The modulation Fourier series IS the spectral envelope",
                 fontsize=15, fontweight='bold', y=0.995)
    fig.text(0.5, 0.965,
             "four modulation shapes  ·  each shape's Fourier coefficients c_n  ·  "
             "the resulting sideband ladder at f + n·f_mod",
             ha='center', color=PALETTE["text_dim"], fontsize=10,
             style='italic')

    fig.tight_layout(rect=[0, 0, 1, 0.945])
    fig.savefig(out_png, dpi=160, bbox_inches='tight',
                facecolor=PALETTE["bg"])
    print(f"wrote {out_png}")


if __name__ == "__main__":
    main(os.path.join(os.path.dirname(__file__),
                      "12_sideband_ladder.png"))
