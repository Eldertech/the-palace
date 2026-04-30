"""
mathieu_reference.py — Python reference implementation of the Stage 1
Mathieu resonator. The codebox~ source `mathieu_resonator.codebox`
must produce sample-identical output (to floating-point tolerance)
when given the same parameters and the same stored noise sequence.

This file is the AUTHORITATIVE numerical reference. Any disagreement
between codebox and this file is a codebox bug — the math here IS the
specification.

The code mirrors the codebox tick line by line. Read the comments in
both files together; they should resolve any ambiguity.

Output:
   audio/19_reference_output.wav  — 4 seconds, fixed parameters
   (freq=220, q_depth=0.30, mod_rate_ratio=2.0, gain=0.5,
    noise_level=0.001, damping_zeta=0.025)
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import numpy as np
from scipy.io import wavfile
from mathieu_core import normalize_peak


# ----- The reference parameters. Match these exactly in the codebox. -----
SAMPLE_RATE = 48000
DURATION_S = 4.0

FREQ = 220.0
Q_DEPTH = 0.30
MOD_RATE_RATIO = 2.0
GAIN = 0.5
NOISE_LEVEL = 0.001
DAMPING_ZETA = 0.025

SAT_AMP = 8.0
INV_SAT = 1.0 / SAT_AMP
TWO_PI = 2.0 * np.pi


def make_noise_buffer(n_samples, seed=42):
    """Reproducible noise buffer. The codebox A/B harness should use
    this same buffer (loaded into a Max [buffer~]) instead of live
    [noise~] for the sample-identical test."""
    rng = np.random.default_rng(seed)
    return (rng.random(n_samples) * 2.0 - 1.0).astype(np.float32)


def render(noise=None):
    """Run the resonator at the reference parameters."""
    n = int(DURATION_S * SAMPLE_RATE)
    if noise is None:
        noise = make_noise_buffer(n)
    assert len(noise) >= n

    omega_0 = TWO_PI * FREQ / SAMPLE_RATE
    a = omega_0 ** 2
    q = Q_DEPTH * a
    omega_mod = MOD_RATE_RATIO * omega_0

    x = 0.0
    v = 0.0
    phi = 0.0
    out = np.zeros(n, dtype=np.float32)

    for i in range(n):
        # Modulation phase advance.
        phi += omega_mod
        if phi >= TWO_PI:
            phi -= TWO_PI
        m = np.cos(phi)

        # Time-varying coefficient.
        coeff = a - 2.0 * q * m

        # Damping + noise + symplectic Euler.
        damping_term = 2.0 * DAMPING_ZETA * omega_0 * v
        n_in = NOISE_LEVEL * float(noise[i])
        v_new = v + (-coeff * x - damping_term + n_in)
        x_new = x + v_new

        # State soft-clip.
        x = SAT_AMP * np.tanh(x_new * INV_SAT)
        v = SAT_AMP * np.tanh(v_new * INV_SAT)

        # Output.
        out[i] = np.tanh(x) * GAIN

    return out


def main(out_dir):
    audio = render()
    pre_peak = float(np.max(np.abs(audio)))
    print(f"reference render: pre-norm peak = {pre_peak:.4f}")
    audio_norm = normalize_peak(audio, peak_dbfs=-3.0)
    out_path = os.path.join(out_dir, "..", "audio",
                            "19_reference_output.wav")
    out_path = os.path.abspath(out_path)
    wavfile.write(out_path, SAMPLE_RATE, audio_norm.astype(np.float32))
    print(f"wrote {out_path}")
    # Also save the noise buffer used so the codebox harness can load
    # it into a Max [buffer~].
    noise = make_noise_buffer(len(audio))
    noise_path = os.path.abspath(os.path.join(out_dir, "..", "audio",
                                              "19_reference_noise.wav"))
    wavfile.write(noise_path, SAMPLE_RATE, noise.astype(np.float32))
    print(f"wrote {noise_path}  (the deterministic noise buffer)")


if __name__ == "__main__":
    main(os.path.dirname(os.path.abspath(__file__)))
