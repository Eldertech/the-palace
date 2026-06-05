#!/usr/bin/env python3
"""
Crystal Synthesizer — Dispersion Filter (Option 3)
==================================================

The second half of the optical-acoustic bridge, made audible.

Birefringence (cycle 2) put TWO acoustic indices into the frequency
domain — paired partials beating. Dispersion is the other optical
analogy, and it lives in the TIME domain: in a dispersive medium every
frequency travels at its own group velocity, so a broadband impulse does
not stay a single click — it SMEARS, each frequency component arriving at
its own moment. An optical prism separates white light in SPACE by
frequency; an acoustic dispersion crystal separates a broadband click in
TIME by frequency. Same physics, different observational projection.

The dispersion relation
-----------------------
For a 1-D monatomic chain (the simplest crystal model, and the textbook
case in the home entry):

    ω(k) = ω_max · | sin(k·a / 2) |

  ω_max  = 2·sqrt(K/m)   zone-boundary frequency (spring K, mass m)
  k      = wavenumber, 0 … π/a across the first Brillouin zone
  a      = lattice spacing

Group velocity — the speed a wave PACKET (and thus energy, and thus the
audible click's energy at that frequency) actually travels — is the slope
of that curve:

    v_g(k) = dω/dk = ω_max · (a/2) · cos(k·a / 2)

Near the zone CENTER (k→0, low frequency) the curve is steep: v_g is
large, low frequencies arrive FIRST. Near the zone BOUNDARY (k→π/a, high
frequency) the curve FLATTENS: v_g → 0, high frequencies crawl and arrive
LATE. A click therefore disperses into a downward-then-piling chirp — the
acoustic prism.

The filter
----------
We turn that into a linear filter by assigning each audio frequency f a
group DELAY τ(f) inversely proportional to its group velocity, then
applying the corresponding all-pass phase response Φ(f) = −2π ∫ τ df in
the frequency domain. Magnitude is left flat — dispersion changes WHEN
each frequency arrives, not HOW LOUD it is. That flat-magnitude /
bent-phase signature is exactly what distinguishes dispersion from
ordinary filtering, and it is the whole point: the partials do not change
amplitude, they shift in time.

Smallest-unit render plan (this file)
-------------------------------------
ONE crystal (diamond, cubic Fd-3m — the cleanest, most isotropic
dispersion curve of the palette), ONE excitation (a broadband click),
THREE renders that exercise every parameter of the filter:

  01_dry_click.wav          the broadband impulse, undispersed (the control)
  02_dispersed_click.wav    same click through the diamond dispersion filter
  03_dispersion_sweep.wav   dispersion strength ramped 0→max over the file,
                            so you hear the click melt from a tick into a
                            tuned, frequency-swept ring — the prism opening

Author: Crystal Synthesizer steward, cycle 4 (2026-06-04)
Grant:  resp-mpv8921g-1igsuc — DISPERSION-FILTER (cycle-1 request -006)
Recipe: home entry §"The Optical-Sonic Bridge" + §"Option 3: Dispersion
        Filter"; dispersion relation from §"Crystals as Resonators".
"""

import os
import numpy as np
from scipy.io import wavfile

# ────────────────────────────────────────────────────────────────────
#  Render parameters
# ────────────────────────────────────────────────────────────────────

SR = 44100
DUR = 3.0                 # seconds per render
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# Diamond is cubic (Fd-3m): isotropic, so one dispersion curve serves
# all directions. We map the crystal's first Brillouin zone onto the
# AUDIBLE band. The zone-boundary frequency ω_max maps to NYQUIST_FRAC
# of Nyquist so the whole audible spectrum lives inside one zone and we
# see the full curvature of the dispersion relation across the click's
# bandwidth.
NYQUIST_FRAC = 0.60        # zone boundary sits at 0.60 × Nyquist (~13.2 kHz),
                           # low enough that the curve's bend reaches down into
                           # the audible mids where the click's energy lives —
                           # so the smear is heard across the whole band, not
                           # just in the top octave

# Maximum group delay imposed at the zone boundary, in seconds. This is
# the single "dispersion strength" knob — how stretched in time the
# highest frequencies get relative to the lowest. 0.45 s is well within
# the 3 s window and makes the smear unmistakable to the ear without
# wrapping past the file end.
MAX_DELAY = 0.60


# ────────────────────────────────────────────────────────────────────
#  The dispersion physics
# ────────────────────────────────────────────────────────────────────

def group_delay_curve(freqs, strength=1.0, nyquist=SR / 2):
    """Group delay τ(f) derived from the 1-D monatomic-chain dispersion
    relation ω(k) = ω_max·|sin(ka/2)|.

    We invert the relation to get k(ω) for each audio frequency, then
    read the group velocity v_g(k) = cos(ka/2) off the curve, and set the
    delay inversely proportional to it. Low frequencies (zone center,
    v_g large) → near-zero delay; high frequencies (zone boundary, v_g→0)
    → maximal delay. The result is a click that disperses upward in time.

    strength scales the whole delay profile (the dispersion knob).
    Returns τ in seconds, same shape as `freqs`.
    """
    omega_max = NYQUIST_FRAC * nyquist
    # Normalised position inside the zone: ω/ω_max = sin(ka/2) ∈ [0,1].
    # Clip so frequencies above the zone boundary saturate at the edge.
    s = np.clip(freqs / omega_max, 0.0, 1.0)
    # k a / 2 = arcsin(s); group velocity ∝ cos(ka/2) = sqrt(1 - s²).
    v_g = np.sqrt(np.maximum(1.0 - s ** 2, 0.0))
    # Delay ∝ the DEVIATION of the dispersion curve from the linear
    # (non-dispersive) line: (1 − v_g). At the zone center v_g = 1 and
    # the delay is zero — low frequencies are the time reference. Toward
    # the zone boundary v_g → 0 and the delay rises to its maximum. This
    # is the dispersion BY DEFINITION (how far the medium departs from a
    # constant sound speed) and it stays FINITE everywhere, unlike the
    # 1/v_g group-delay singularity, which piles all high frequencies at
    # one huge delay and brick-walls rather than disperses. The shape is
    # the same — flattening curve → growing delay — but bounded, so the
    # whole audible band smears smoothly instead of saturating.
    raw = 1.0 - v_g
    return strength * MAX_DELAY * raw


def apply_dispersion(signal, strength=1.0, sr=SR):
    """Apply a flat-magnitude, dispersive all-pass phase response to a
    mono signal.

    The phase at each bin is Φ(f) = −2π · ∫₀ᶠ τ(f') df'  (cumulative,
    because group delay is −dΦ/dω, so the phase is the running integral
    of the delay). Magnitude is untouched: dispersion re-times energy, it
    does not attenuate it.
    """
    n = len(signal)
    spectrum = np.fft.rfft(signal)
    freqs = np.fft.rfftfreq(n, d=1.0 / sr)

    tau = group_delay_curve(freqs, strength=strength)

    # Integrate group delay → phase. df is the bin spacing.
    df = freqs[1] - freqs[0] if len(freqs) > 1 else 1.0
    phase = -2.0 * np.pi * np.cumsum(tau) * df

    dispersed = spectrum * np.exp(1j * phase)
    out = np.fft.irfft(dispersed, n=n)
    return out


# ────────────────────────────────────────────────────────────────────
#  Excitation + envelope
# ────────────────────────────────────────────────────────────────────

def broadband_click(dur=DUR, sr=SR, seed=7):
    """A short broadband excitation — the 'strike' that excites every
    phonon mode at once. A few-millisecond burst of band-limited noise
    shaped by a fast exponential, placed near the start so the dispersed
    tail has room to ring out across the whole file."""
    n = int(dur * sr)
    t = np.arange(n) / sr
    rng = np.random.default_rng(seed)
    audio = np.zeros(n)
    burst_len = int(0.004 * sr)            # 4 ms strike
    burst = rng.uniform(-1, 1, burst_len)
    burst *= np.exp(-np.linspace(0, 6, burst_len))   # fast decay
    audio[:burst_len] = burst
    return audio


def normalize(audio, peak=0.85):
    p = np.max(np.abs(audio))
    return audio if p < 1e-9 else audio * (peak / p)


def write_wav(path, audio, sr=SR):
    int16 = np.int16(np.clip(audio, -1.0, 1.0) * 32767)
    wavfile.write(path, sr, int16)
    print(f"  wrote {os.path.basename(path)}  "
          f"(n={len(audio)}, peak={np.max(np.abs(audio)):.3f})")


# ────────────────────────────────────────────────────────────────────
#  Measurement — prove the smear is real, not asserted
# ────────────────────────────────────────────────────────────────────

def _hilbert_envelope(x):
    """Analytic-signal magnitude envelope, FFT-based (no scipy.signal
    dependency needed). Gives the smooth energy outline of a band so its
    arrival time can be read off a clean peak rather than a noisy
    waveform."""
    n = len(x)
    X = np.fft.fft(x)
    h = np.zeros(n)
    if n % 2 == 0:
        h[0] = h[n // 2] = 1
        h[1:n // 2] = 2
    else:
        h[0] = 1
        h[1:(n + 1) // 2] = 2
    return np.abs(np.fft.ifft(X * h))


def measure_spread(audio, sr=SR):
    """Report the arrival time (in ms) of the low band (~1 kHz) and the
    high band (~12 kHz) of the signal's energy. We isolate each band with
    a SMOOTH Gaussian window in frequency (no brick-wall ringing to
    pollute the timing), take the Hilbert envelope, and read the peak.
    If dispersion is real, the high band's peak lands LATER than the low
    band's — high frequencies arrive after low ones."""
    n = len(audio)
    spec = np.fft.rfft(audio)
    freqs = np.fft.rfftfreq(n, 1 / sr)
    t = np.arange(n) / sr

    def band_peak_ms(center, width):
        win = np.exp(-0.5 * ((freqs - center) / width) ** 2)
        band = np.fft.irfft(spec * win, n=n)
        env = _hilbert_envelope(band)
        return 1000.0 * float(t[int(np.argmax(env))])

    return band_peak_ms(1000, 400), band_peak_ms(12000, 2000)


# ────────────────────────────────────────────────────────────────────
#  The three renders
# ────────────────────────────────────────────────────────────────────

def render_dry():
    click = broadband_click()
    out = normalize(click)
    write_wav(os.path.join(OUT_DIR, '01_dry_click.wav'), out)
    return click


def render_dispersed(click):
    out = apply_dispersion(click, strength=1.0)
    out = normalize(out)
    write_wav(os.path.join(OUT_DIR, '02_dispersed_click.wav'), out)
    return out


def render_sweep(click):
    """Dispersion strength ramped 0 → 1 across the file, rendered as a
    series of overlapping dispersed copies of the click struck at
    successive moments — so you hear the prism OPEN: the click melts from
    a dry tick into a long frequency-swept ring."""
    n = len(click)
    out = np.zeros(n)
    n_strikes = 8
    for i in range(n_strikes):
        strength = i / (n_strikes - 1)
        offset = int((i / n_strikes) * 0.6 * n)   # spread strikes over first 60%
        seg = apply_dispersion(broadband_click(seed=100 + i), strength=strength)
        end = min(n, offset + len(seg))
        out[offset:end] += seg[:end - offset]
    out = normalize(out)
    write_wav(os.path.join(OUT_DIR, '03_dispersion_sweep.wav'), out)
    return out


def main():
    print("Crystal Synthesizer — Dispersion Filter (Diamond, cubic Fd-3m)")
    print(f"  zone boundary = {NYQUIST_FRAC*SR/2:.0f} Hz "
          f"({NYQUIST_FRAC:.2f} × Nyquist)")
    print(f"  max group delay at boundary = {MAX_DELAY*1000:.0f} ms")
    print()
    click = render_dry()
    dispersed = render_dispersed(click)
    render_sweep(click)
    print()
    lo_dry, hi_dry = measure_spread(click)
    lo_disp, hi_disp = measure_spread(dispersed)
    print("Temporal centroid of energy (ms) — proof the smear is real:")
    print(f"  dry click:        low band {lo_dry:6.1f} ms | "
          f"high band {hi_dry:6.1f} ms | spread {hi_dry-lo_dry:6.1f} ms")
    print(f"  dispersed click:  low band {lo_disp:6.1f} ms | "
          f"high band {hi_disp:6.1f} ms | spread {hi_disp-lo_disp:6.1f} ms")
    print()
    print("If dispersion is real, the dispersed high band arrives much")
    print("later than its low band — the click has smeared in time the")
    print("way a prism smears light in space.")


if __name__ == '__main__':
    main()
