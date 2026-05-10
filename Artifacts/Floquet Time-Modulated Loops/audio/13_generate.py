"""
13_generate.py — sideband ladder audio quartet.

Four 4-second WAVs of a Mathieu-style resonator pumped at 80 Hz with
four different modulation shapes:
  13a_cosine.wav     — pure cos(2 pi f_mod t)
  13b_fm.wav         — cos-of-cos modulation, beta = 2.4 (Bessel sidebands)
  13c_square.wav     — square-wave modulation
  13d_wavetable.wav  — hand-designed asymmetric bump

Carrier (resonator natural frequency) = 220 Hz. Modulation rate = 80 Hz.
Each WAV pairs with media-12 (the visual sideband ladder picture). The
spectrogram of each WAV should show a sideband comb at 220 + n*80 Hz with
amplitudes matching the modulation's Fourier series.

Implementation note. The Stage 1 codebox~ uses pure-cosine modulation
inside the standard Mathieu form  x'' + (a - 2q cos(omega_mod t)) x = 0.
For the OTHER three shapes here we replace the cos() with a periodic
function m(t), giving x'' + (a - 2q m(t)) x = 0. This is the *general*
Floquet system — Mathieu's case is just one special m(t). The Hill
equation is the formal name for this generalization.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import numpy as np
from scipy.io import wavfile
from mathieu_core import normalize_peak


SAMPLE_RATE = 48000
DURATION_S = 4.0
CARRIER_F = 220.0
MOD_F = 80.0
Q_DEPTH = 0.30
NOISE_LEVEL = 1e-5
DAMPING_ZETA = 0.025
SAT_AMP = 8.0


def make_modulator(kind):
    if kind == "cosine":
        return lambda phase: np.cos(phase)
    if kind == "fm":
        # cos-of-cos. Beta=2.4 puts the strongest sidebands a few orders
        # out — Bessel pattern.
        beta = 2.4
        return lambda phase: np.cos(phase + beta * np.cos(phase))
    if kind == "square":
        return lambda phase: np.sign(np.sin(phase))
    if kind == "wavetable":
        # Asymmetric bump — even and odd Fourier components both nonzero.
        def fn(phase):
            p = (phase % (2*np.pi))
            return 2.0 * np.exp(-((p - np.pi) / 0.6) ** 2) + \
                   0.3 * np.cos(2*phase) - 0.6
        return fn
    raise ValueError(kind)


def render(kind):
    """Run the parametrically-pumped resonator with this modulation shape."""
    n = int(DURATION_S * SAMPLE_RATE)
    omega0 = 2.0 * np.pi * CARRIER_F / SAMPLE_RATE
    a = omega0 ** 2
    omega_mod = 2.0 * np.pi * MOD_F / SAMPLE_RATE
    delta = 2.0 * DAMPING_ZETA * omega0

    mod_fn = make_modulator(kind)
    rng = np.random.default_rng(42)

    x = 0.0; v = 0.0; phi = 0.0
    out = np.zeros(n, dtype=np.float32)
    inv_sat = 1.0 / SAT_AMP

    # Same pumping depth across all four shapes — the question is what
    # the modulation Fourier series does, not how deep the pump is.
    q = Q_DEPTH * a
    for i in range(n):
        phi += omega_mod
        m = mod_fn(phi)
        coeff = a - 2.0 * q * m
        noise = NOISE_LEVEL * rng.standard_normal()
        v = v + (-coeff * x - delta * v + noise)
        x = x + v
        x = SAT_AMP * np.tanh(x * inv_sat)
        v = SAT_AMP * np.tanh(v * inv_sat)
        out[i] = np.tanh(x)
    return out


def main(out_dir):
    cases = [
        ("13a_cosine.wav",     "cosine"),
        ("13b_fm.wav",         "fm"),
        ("13c_square.wav",     "square"),
        ("13d_wavetable.wav",  "wavetable"),
    ]
    print(f"sideband ladder audio quartet — carrier {CARRIER_F} Hz, "
          f"f_mod {MOD_F} Hz, q_depth {Q_DEPTH}")
    rendered = []
    for filename, kind in cases:
        audio = render(kind)
        peak = float(np.max(np.abs(audio)))
        print(f"  {kind:10s}  pre-norm peak={peak:.4f}")
        rendered.append((filename, audio))
    # Normalize all four by the same factor so relative loudness is
    # preserved (the four shapes have different modulation gain).
    max_peak = max(float(np.max(np.abs(a))) for _, a in rendered) + 1e-30
    target = 10 ** (-3.0 / 20.0)
    scale = target / max_peak
    for filename, audio in rendered:
        scaled = audio * scale
        path = os.path.join(out_dir, filename)
        wavfile.write(path, SAMPLE_RATE, scaled.astype(np.float32))
        print(f"  wrote {filename}")


if __name__ == "__main__":
    main(os.path.dirname(__file__))
