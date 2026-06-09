#!/usr/bin/env python3
"""
Crystal Synthesizer — Anisotropic Dispersion (Beryl / Emerald, hexagonal P6/mcc)
================================================================================

The optical-acoustic bridge taken one step deeper than the diamond render.

Diamond (cycle 4) is cubic Fd-3m: ISOTROPIC. One dispersion curve serves
every direction through the lattice, so a click smears the same way no
matter which way it travels. That render proved dispersion is real — but it
could not show the OTHER half of the optical analogy, because a cubic
crystal has nothing directional to show.

Beryl is hexagonal (P6/mcc). It is ANISOTROPIC: it has an optic axis (the
c-axis, running the length of the hollow Si₆O₁₈ channels) distinct from the
basal plane (where the stiff six-membered silicate rings live). In optics
this is exactly what makes emerald BIREFRINGENT — light polarized along the
c-axis sees a different refractive index than light polarized in the basal
plane, so the crystal splits one ray into two. The same anisotropy lives in
the phonon structure: the SPEED OF SOUND, and therefore the whole DISPERSION
curve, is different along the c-axis than across the basal plane.

So the optical-acoustic bridge predicts: strike a beryl crystal and let the
click propagate ALONG the c-axis, then strike it again and let the click
propagate ACROSS the basal plane, and the two clicks should smear
DIFFERENTLY in time — because each direction has its own dispersion law.
This is acoustic birefringence meeting acoustic dispersion: the prism does
not just separate frequencies in time, it separates them by a DIFFERENT
amount depending on which way you look through the stone.

This render is the smallest unit that exercises that claim:

  beryl_dry_click.wav         the broadband strike, undispersed (control)
  beryl_c_axis.wav            same click, dispersed by the c-axis curve
                              (along the soft hollow channels — slower sound,
                               steeper dispersion, MORE smear)
  beryl_basal_plane.wav       same click, dispersed by the basal-plane curve
                              (across the stiff Si₆O₁₈ rings — faster sound,
                               shallower dispersion, LESS smear)
  beryl_birefringent_pair.wav both directions struck a beat apart, so the ear
                              hears the SAME crystal smear two different ways
                              back to back — the acoustic birefringence made
                              audible as a difference in dispersion

The two axes share ONE crystal, ONE strike, ONE filter design. They differ
only in the zone-boundary frequency that sets the dispersion curve — exactly
the way the two refractive indices of a birefringent crystal differ only in
which polarization sees them. Same physics, two projections.

Honoring the gate history: cycle 12's audition (request -012) confirmed by
ear that the dispersed energy RISES (low arrives first, high arrives late),
and cycle 5/6 (request -014) confirmed that rising is correct — "the sound
proved what we are doing is correct. Move forward with confidence." So the
rising-arrival group-delay law from the diamond render is kept unchanged
here; only the per-axis zone-boundary differs.

scipy is absent in the sandbox (noted in the cycle-4 baton), so this file is
numpy-ONLY: a 14-line canonical PCM-16 WAV writer stands in for
scipy.io.wavfile. Everything else is the diamond render's proven dispersion
core, re-parameterised per axis.

Author: Crystal Synthesizer steward, cycle 7 (2026-06-08)
Grant:  resp-mq40vt5s-idy53z — BERYL (cycle-6 request -016)
Recipe: home entry §"The Optical-Sonic Bridge" (birefringence in acoustics)
        + §"Hexagonal" (ordinary/extraordinary rays) + Crystal Sonification
        Reference §Emerald (P6/mcc, 174 branches, ring-breathing anchor).
"""

import os
import struct
import numpy as np

# ────────────────────────────────────────────────────────────────────
#  Render parameters
# ────────────────────────────────────────────────────────────────────

SR = 44100
DUR = 3.0                 # seconds per render
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# Maximum group delay imposed at the zone boundary, in seconds — the single
# "dispersion strength" knob, identical to the diamond render so the two
# crystals are comparable. Per-axis difference comes from the zone-boundary
# frequency below, NOT from this knob.
MAX_DELAY = 0.60

# The anisotropy. A hexagonal crystal has two characteristic sound speeds.
# The zone-boundary frequency ω_max is proportional to sqrt(force-constant /
# mass) along a direction, so a SOFTER direction (lower force constant) has a
# LOWER zone boundary — its dispersion curve bends down into the audible band
# sooner, so more of the click's energy lives on the flattening part of the
# curve and the smear is GREATER.
#
#   c-axis   — propagation along the hollow Si₆O₁₈ channels. The channels are
#              the soft direction of beryl (empty or water-filled tubes, weak
#              restoring force). Lower zone boundary → steeper effective
#              dispersion → MORE temporal smear. This is the "extraordinary"
#              ray of the acoustic analogy.
#   basal    — propagation across the plane of the stiff six-membered silicate
#              rings. The rings are the stiff direction (strong Si-O bonds).
#              Higher zone boundary → shallower dispersion → LESS smear. The
#              "ordinary" ray.
#
# The ratio is set near beryl's optical birefringence magnitude (Δn ≈ 0.006
# is small for beryl; acoustic anisotropy of the elastic constants is far
# larger — c33/c11 differs by tens of percent in beryl). We use a clearly
# audible 0.62 : 1.00 split so the two smears are unmistakably different by
# ear while staying physically motivated by the soft-channel / stiff-ring
# structure.
NYQUIST_FRAC_C_AXIS = 0.42     # soft channels → low zone boundary → MORE smear
NYQUIST_FRAC_BASAL  = 0.68     # stiff rings   → high zone boundary → LESS smear


# ────────────────────────────────────────────────────────────────────
#  The dispersion physics  (unchanged core from the diamond render)
# ────────────────────────────────────────────────────────────────────

def group_delay_curve(freqs, nyquist_frac, strength=1.0, nyquist=SR / 2):
    """Group delay τ(f) from the 1-D chain relation ω(k)=ω_max·|sin(ka/2)|.

    `nyquist_frac` places the zone boundary ω_max = nyquist_frac·Nyquist.
    A LOWER nyquist_frac (softer direction) bends the curve into the audible
    band sooner → larger (1−v_g) over the band → more smear.

    Low frequencies (zone center, v_g≈1) get ~zero delay and are the time
    reference; high frequencies (zone boundary, v_g→0) get the maximum delay,
    so the click disperses UPWARD in time — the rising-arrival law Loudon
    confirmed correct by ear in cycles 5/6. Bounded by (1−v_g) so the band
    smears smoothly instead of brick-walling.
    """
    omega_max = nyquist_frac * nyquist
    s = np.clip(freqs / omega_max, 0.0, 1.0)        # ω/ω_max = sin(ka/2)
    v_g = np.sqrt(np.maximum(1.0 - s ** 2, 0.0))    # group velocity ∝ cos(ka/2)
    raw = 1.0 - v_g                                 # deviation from constant speed
    return strength * MAX_DELAY * raw


def apply_dispersion(signal, nyquist_frac, strength=1.0, sr=SR):
    """Flat-magnitude, dispersive all-pass phase response for one axis.
    Magnitude untouched (dispersion re-times energy, it does not attenuate);
    phase is the running integral of the group delay, Φ(f)=−2π∫₀ᶠτ df'."""
    n = len(signal)
    spectrum = np.fft.rfft(signal)
    freqs = np.fft.rfftfreq(n, d=1.0 / sr)
    tau = group_delay_curve(freqs, nyquist_frac, strength=strength)
    df = freqs[1] - freqs[0] if len(freqs) > 1 else 1.0
    phase = -2.0 * np.pi * np.cumsum(tau) * df
    out = np.fft.irfft(spectrum * np.exp(1j * phase), n=n)
    return out


# ────────────────────────────────────────────────────────────────────
#  Excitation, envelope, WAV I/O  (numpy-only; no scipy)
# ────────────────────────────────────────────────────────────────────

def broadband_click(dur=DUR, sr=SR, seed=7):
    """A few-millisecond burst of band-limited noise shaped by a fast
    exponential — the 'strike' that excites every phonon mode at once,
    placed at the file start so the dispersed tail has room to ring out."""
    n = int(dur * sr)
    rng = np.random.default_rng(seed)
    audio = np.zeros(n)
    burst_len = int(0.004 * sr)               # 4 ms strike
    burst = rng.uniform(-1, 1, burst_len)
    burst *= np.exp(-np.linspace(0, 6, burst_len))
    audio[:burst_len] = burst
    return audio


def normalize(audio, peak=0.85):
    p = np.max(np.abs(audio))
    return audio if p < 1e-9 else audio * (peak / p)


def write_wav(path, audio, sr=SR):
    """Canonical 16-bit mono PCM WAV writer — stands in for scipy.io.wavfile
    so this render needs numpy only."""
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
    print(f"  wrote {os.path.basename(path)}  "
          f"(n={len(audio)}, peak={np.max(np.abs(audio)):.3f})")


# ────────────────────────────────────────────────────────────────────
#  Measurement — prove the two axes smear by DIFFERENT amounts
# ────────────────────────────────────────────────────────────────────

def _hilbert_envelope(x):
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


def band_arrival_ms(audio, center, width, sr=SR):
    """Arrival time (ms) of one Gaussian-isolated band, read off the
    Hilbert-envelope peak. Smooth window so no brick-wall ringing pollutes
    the timing."""
    n = len(audio)
    spec = np.fft.rfft(audio)
    freqs = np.fft.rfftfreq(n, 1 / sr)
    t = np.arange(n) / sr
    win = np.exp(-0.5 * ((freqs - center) / width) ** 2)
    band = np.fft.irfft(spec * win, n=n)
    env = _hilbert_envelope(band)
    return 1000.0 * float(t[int(np.argmax(env))])


def dispersion_profile(audio, sr=SR):
    """Arrival-time profile across the audible band. We probe several bands
    from low to high. The acoustic-birefringence proof does NOT live in the
    very top band (both axes saturate to MAX_DELAY there, because 12 kHz is
    above the c-axis zone boundary) — it lives in the MIDS, where one curve
    has already bent and the other has not. So we read a mid band (~5 kHz)
    where the two dispersion laws genuinely diverge, alongside the low
    reference and the saturated top."""
    bands = [(1000, 400), (3000, 700), (5000, 900), (8000, 1200)]
    return [band_arrival_ms(audio, c, w, sr) for c, w in bands], [c for c, _ in bands]


# ────────────────────────────────────────────────────────────────────
#  The four renders
# ────────────────────────────────────────────────────────────────────

def render_birefringent_pair(c_axis, basal):
    """Both axes back to back: the c-axis smear, a short gap, then the basal
    smear — so the ear hears the SAME crystal and SAME strike disperse two
    different amounts depending on propagation direction. The audible
    difference IS the acoustic birefringence."""
    gap = int(0.25 * SR)
    out = np.zeros(len(c_axis) + gap + len(basal))
    out[:len(c_axis)] += c_axis
    out[len(c_axis) + gap:] += basal
    return normalize(out)


def main():
    print("Crystal Synthesizer — Anisotropic Dispersion (Beryl, hexagonal P6/mcc)")
    print(f"  c-axis   zone boundary = {NYQUIST_FRAC_C_AXIS*SR/2:6.0f} Hz "
          f"({NYQUIST_FRAC_C_AXIS:.2f} × Nyquist) — soft channels, MORE smear")
    print(f"  basal    zone boundary = {NYQUIST_FRAC_BASAL*SR/2:6.0f} Hz "
          f"({NYQUIST_FRAC_BASAL:.2f} × Nyquist) — stiff rings,   LESS smear")
    print(f"  max group delay at boundary = {MAX_DELAY*1000:.0f} ms (shared)")
    print()

    click = broadband_click()
    write_wav(os.path.join(OUT_DIR, 'beryl_dry_click.wav'), normalize(click))

    c_axis = apply_dispersion(click, NYQUIST_FRAC_C_AXIS, strength=1.0)
    basal  = apply_dispersion(click, NYQUIST_FRAC_BASAL,  strength=1.0)
    c_axis_n = normalize(c_axis)
    basal_n  = normalize(basal)
    write_wav(os.path.join(OUT_DIR, 'beryl_c_axis.wav'), c_axis_n)
    write_wav(os.path.join(OUT_DIR, 'beryl_basal_plane.wav'), basal_n)

    pair = render_birefringent_pair(c_axis_n, basal_n)
    write_wav(os.path.join(OUT_DIR, 'beryl_birefringent_pair.wav'), pair)

    print()
    prof_c, centers = dispersion_profile(c_axis)
    prof_b, _       = dispersion_profile(basal)
    print("Arrival time (ms) per band — the dispersion law, read across the band:")
    print(f"  band (Hz):   " + " ".join(f"{c:7d}" for c in centers))
    print(f"  c-axis:      " + " ".join(f"{v:7.1f}" for v in prof_c))
    print(f"  basal plane: " + " ".join(f"{v:7.1f}" for v in prof_b))
    print(f"  c − basal:   " + " ".join(f"{a-b:7.1f}" for a, b in zip(prof_c, prof_b)))
    print()
    # The proof lives in the mid band (~5 kHz, index 2): the c-axis curve has
    # already bent (its 9.3 kHz zone boundary is near), the basal curve has
    # not (its 15 kHz boundary is far), so the c-axis click's 5 kHz energy
    # arrives LATER than the basal click's 5 kHz energy — same crystal, same
    # strike, two dispersion laws.
    mid_c, mid_b = prof_c[2], prof_b[2]
    print(f"  At 5 kHz the c-axis energy arrives {mid_c-mid_b:.1f} ms LATER than")
    print( "  the basal-plane energy — acoustic birefringence: one crystal,")
    print( "  two dispersion laws, set purely by propagation direction.")


if __name__ == '__main__':
    main()
