"""
04_generate.py — three short WAVs of the same Mathieu resonator at the
same `a` but with `q` at three values: well below threshold, just at
threshold, and well above. The audio difference is dramatic.

Output:
  04a_below_threshold.wav   q far below the n=1 tongue
  04b_at_threshold.wav      q approaching the threshold from below
  04c_above_threshold.wav   q well inside the n=1 tongue

The integrator is the same symplectic-Euler scheme used in the Stage 1
codebox~ source, run in numpy at 48 kHz mono, 5 s per condition.

Why three values of q only? The audible bifurcation is the lesson.
Hearing the silence-with-coloration / cracking-on / ringing oscillation
sequence is the experience the tongue makes available.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import numpy as np
from scipy.io import wavfile
from mathieu_core import audio_mathieu, normalize_peak


SAMPLE_RATE = 48000
DURATION_S = 5.0
FREQ_HZ = 220.0          # natural frequency of the resonator
MOD_RATE_RATIO = 2.0     # canonical Mathieu pumping at 2·ω₀

CONDITIONS = [
    ("04a_below_threshold.wav",   0.05),
    ("04b_at_threshold.wav",      0.10),
    ("04c_above_threshold.wav",   0.30),
]

# Tuning: the threshold q for parametric instability with damping
# zeta is approximately q_c ≈ 4·zeta for canonical 2:1 pumping, so
# zeta = 0.025 places threshold near q ≈ 0.10. Below threshold the
# system is dominated by the noise floor of the input; above threshold
# the parametric pump amplifies the noise into ringing oscillation.
DAMPING_ZETA = 0.025
NOISE_LEVEL = 1e-5


def main(out_dir):
    print(f"generating Mathieu resonator triple at f = {FREQ_HZ} Hz, "
          f"mod ratio = {MOD_RATE_RATIO}, sample rate = {SAMPLE_RATE} Hz")
    print(f"damping zeta = {DAMPING_ZETA}  noise level = {NOISE_LEVEL}")
    # Render all three first so we can find the loudest peak across
    # the set, then scale every WAV by the same factor. This way the
    # listener actually hears the relative loudness — quiet, building,
    # full-on — rather than every WAV peak-normalized to the same dBFS.
    rendered = []
    for filename, q in CONDITIONS:
        audio = audio_mathieu(
            freq_hz=FREQ_HZ, q_depth=q,
            mod_rate_ratio=MOD_RATE_RATIO,
            duration_s=DURATION_S,
            sample_rate=SAMPLE_RATE,
            noise_level=NOISE_LEVEL, seed=42,
            damping_zeta=DAMPING_ZETA,
        )
        rendered.append((filename, q, audio))

    max_peak_set = max(float(np.max(np.abs(a))) for _, _, a in rendered) + 1e-30
    target = 10.0 ** (-3.0 / 20.0)
    scale = target / max_peak_set

    for filename, q, audio in rendered:
        scaled = audio * scale
        peak_post = float(np.max(np.abs(scaled)))
        rms_post = float(np.sqrt(np.mean(scaled.astype(np.float64) ** 2)))
        path = os.path.join(out_dir, filename)
        wavfile.write(path, SAMPLE_RATE, scaled.astype(np.float32))
        print(f"  q={q:0.3f}  scaled peak={peak_post:0.4f} rms={rms_post:0.4f}"
              f"   wrote {filename}")


if __name__ == "__main__":
    out = os.path.dirname(__file__)
    main(out)
