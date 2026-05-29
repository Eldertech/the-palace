"""
20_strutt_sweep.py — a 30-second audio sweep through the Strutt diagram.

The path: park `freq` at 220 Hz, `mod_rate_ratio` at 2.0 (canonical
2:1 pumping), and sweep `q_depth` along a triangular path:
    0.00 → 0.30 over 12 seconds   (silence → ringing oscillation)
    0.30 → 0.30 hold for 6 seconds (saturated tongue interior)
    0.30 → 0.00 over 12 seconds   (decay back into silence)

The student hears the entire transition: silence-with-coloration,
the cracking-on threshold around q ≈ 0.10, ringing oscillation through
the tongue interior, the cracking-off as the decay returns the system
to silence.

This pairs with media-06 (the Strutt explorer for active interaction)
as the passive listening complement — listen once before exploring.

Output: audio/20_strutt_sweep.wav (30 s mono float32, peak −3 dBFS).
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import numpy as np
from scipy.io import wavfile
from mathieu_core import normalize_peak


SAMPLE_RATE = 48000
DURATION_S = 30.0
FREQ = 220.0
MOD_RATE_RATIO = 2.0
DAMPING_ZETA = 0.025
NOISE_LEVEL = 1e-5
SAT_AMP = 8.0


def q_path(t):
    """Triangular sweep through the n=1 tongue at fixed (a=omega0^2)."""
    if t < 12.0:
        return 0.30 * (t / 12.0)        # ramp up
    if t < 18.0:
        return 0.30                      # hold
    if t < 30.0:
        return 0.30 * (1.0 - (t - 18.0) / 12.0)  # ramp down
    return 0.0


def render():
    n = int(DURATION_S * SAMPLE_RATE)
    omega0 = 2.0 * np.pi * FREQ / SAMPLE_RATE
    a = omega0 ** 2
    omega_mod = MOD_RATE_RATIO * omega0
    delta = 2.0 * DAMPING_ZETA * omega0
    inv_sat = 1.0 / SAT_AMP

    # Precompute q for every sample (continuous sweep).
    qs = np.array([q_path(i / SAMPLE_RATE) * a for i in range(n)],
                  dtype=np.float64)

    rng = np.random.default_rng(42)
    x = 0.0; v = 0.0; phi = 0.0
    out = np.zeros(n, dtype=np.float32)

    for i in range(n):
        phi += omega_mod
        coeff = a - 2.0 * qs[i] * np.cos(phi)
        noise = NOISE_LEVEL * rng.standard_normal()
        v = v + (-coeff * x - delta * v + noise)
        x = x + v
        x = SAT_AMP * np.tanh(x * inv_sat)
        v = SAT_AMP * np.tanh(v * inv_sat)
        out[i] = np.tanh(x)
    return out


def main(out_dir):
    print(f"rendering 30-second Strutt sweep at f = {FREQ} Hz...")
    audio = render()
    pre_peak = float(np.max(np.abs(audio)))
    print(f"  pre-norm peak = {pre_peak:.4f}")
    audio_norm = normalize_peak(audio, peak_dbfs=-3.0)
    out_path = os.path.join(out_dir, "20_strutt_sweep.wav")
    wavfile.write(out_path, SAMPLE_RATE, audio_norm.astype(np.float32))
    print(f"  wrote {out_path}")


if __name__ == "__main__":
    main(os.path.dirname(__file__))
