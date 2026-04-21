#!/usr/bin/env python3
"""
Crystal Synthesizer — Audio Demonstration
==========================================
Generates audio files demonstrating phonon resonances of the 7 Bravais lattice systems,
scaled from THz → human hearing range.

Based on the Crystal Synthesizer entry in The Palace (Loudon Stearns, 2026-02).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ABOUT THESE DECISION POINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Crystal phonons vibrate at THz — 10^12 Hz, far above human hearing.
  The physics of each lattice gives us *frequency ratios* and *spectral
  tendencies*. It does not give us absolute pitches, number of voices,
  or decay times. To make a playable instrument, we must make choices
  the physics leaves open. Each choice below is a "metaphor stretch" —
  a place where we leave pure physical fidelity and enter artistic
  territory. Changing them changes what KIND of claim the instrument is
  making about actual crystals.

  These are the most important teaching moments in this instrument.
  Every parameter marked  ◄ CHANGE ME  is a decision point.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter
import os

SAMPLE_RATE = 44100
DURATION    = 6.0
OUTPUT_DIR  = "/sessions/gallant-nice-ritchie/mnt/The Palace/Crystal Audio"


# ══════════════════════════════════════════════════════════════════════
#  DECISION POINT 1 — FREQUENCY ANCHOR
# ══════════════════════════════════════════════════════════════════════
#
#  Crystal phonons span a fixed *ratio* between lowest and highest mode.
#  The physics does not specify where that range sits in human hearing.
#  This anchor is the first and most fundamental artistic decision:
#  which part of the phonon spectrum do you hand to the listener?
#
#  'lowest_mode'   → The softest acoustic phonon (near k=0) maps to
#                    BASE_FREQ. The full spectrum spreads upward from
#                    there. High symmetry crystals (cubic) will reach
#                    higher than low symmetry ones (triclinic) for the
#                    same BASE_FREQ — the spread is determined by physics.
#
#  'zone_boundary' → The hardest phonon (zone-boundary, k=π/a) maps to
#                    MAX_FREQ. The lowest modes fall wherever they must.
#                    All crystals share a ceiling; their floors differ.
#                    Emphasizes what's *unique* about each lattice at
#                    the top of its spectrum rather than the bottom.
#
#  'centroid'      → The spectral centroid (energy-weighted mean) maps
#                    to BASE_FREQ. Centers the perceptual weight of each
#                    crystal at the same pitch class. Most useful for
#                    direct timbral comparison between lattice types.
#
FREQ_ANCHOR = 'lowest_mode'   # ◄ CHANGE ME  ('lowest_mode', 'zone_boundary', 'centroid')
BASE_FREQ   = 110.0           # Hz — the anchor frequency in human hearing
MAX_FREQ    = 10000.0         # Hz — ceiling / zone-boundary target for 'zone_boundary' mode


# ══════════════════════════════════════════════════════════════════════
#  DECISION POINT 2 — RENDERING RESOLUTION
# ══════════════════════════════════════════════════════════════════════
#
#  A real crystal has ~10^22 phonon modes — a continuous spectrum.
#  We synthesize N discrete partials from a histogram of that spectrum.
#  This is the most perceptually dramatic choice in the instrument.
#
#  Low  N (8–20)   → Clearly separated bell-like modes. Audible beating
#                    between adjacent partials as they interact. Sounds
#                    like a designed instrument — a gong or bell family.
#                    LEAST physically faithful, MOST musically legible.
#
#  Mid  N (60–120) → The balance point. Beats are present but form a
#                    shimmering texture rather than discrete pulses.
#                    The "sweeping" pitch character emerges here.
#
#  High N (300+)   → Dense partials. Beating becomes a continuous noise-
#                    like shimmer. Approaches the feel of the continuous
#                    DOS. MOST physically faithful, LEAST pitched.
#
#  Note: the beating you hear is NOT in the crystal physics — it is a
#  rendering artifact. However it reveals something physically real:
#  high modes decay first, so the character of the beats evolves over
#  time in a physically meaningful direction (high → low over sustain).
#  This is an "honest artifact" — false in detail, true in tendency.
#
N_PARTIALS = 100   # ◄ CHANGE ME  (try: 8, 20, 60, 100, 300)


# ══════════════════════════════════════════════════════════════════════
#  DECISION POINT 3 — DECAY SCALING
# ══════════════════════════════════════════════════════════════════════
#
#  Anharmonic phonon-phonon coupling causes high-frequency modes to
#  decay faster than low-frequency modes. The physics guarantees this
#  *direction* — it does not specify the *rate*. These parameters are
#  where the instrument designer's hand touches the physics.
#
#  DECAY_BASE = damping coefficient at the lowest mode (seconds⁻¹).
#               Lower = longer overall sustain. Higher = shorter.
#               Analogous to the Q-factor of a resonant system.
#
#  DECAY_EXP  = how steeply decay rate scales with frequency.
#               decay_rate = DECAY_BASE × (freq / base_freq) ^ DECAY_EXP
#
#               0.0  = all modes decay at the same rate (physically wrong
#                      but musically interesting — a sustained drone)
#               0.3  = gentle high-frequency damping (long metallic sustain)
#               0.55 = moderate damping (default — bell-like ring)
#               1.0  = strong damping (wooden, percussive, dry)
#               2.0+ = extreme — only the fundamental survives
#
DECAY_BASE = 0.7    # ◄ CHANGE ME  (try: 0.2, 0.5, 1.0, 2.0)
DECAY_EXP  = 0.55   # ◄ CHANGE ME  (try: 0.0, 0.3, 0.55, 1.0, 2.0)


# ══════════════════════════════════════════════════════════════════════
#  DECISION POINT 4 — FIDELITY CLAIM
# ══════════════════════════════════════════════════════════════════════
#
#  What is this sound claiming to be? This is the deepest metaphor
#  stretch — the explicit statement of the instrument's relationship
#  to actual crystal physics.
#
#  'ratios_only'  → Each partial is a pure sine wave at a frequency
#                   determined by the phonon DOS. The claim: "the
#                   frequency ratios between partials are physically
#                   real; everything else (decay, amplitude) is shaped
#                   by the instrument designer."
#                   Use this to isolate the spectral claim from the
#                   temporal claim.
#
#  'shaped'       → Pure sines + physically-motivated decay (see DP3).
#                   The claim: "both the spectrum and the temporal
#                   envelope reflect real physical tendencies."
#                   This is the default mode.
#
#  'continuous'   → Each partial is replaced by a narrow band of noise
#                   centered at the partial frequency (bandwidth = bin
#                   width). Eliminates the discrete beating artifact by
#                   approximating the *continuous* phonon DOS.
#                   The claim: "this approximates what you would hear if
#                   you could directly transduce THz vibrations."
#                   Most physically honest; least obviously "musical."
#
FIDELITY = 'shaped'   # ◄ CHANGE ME  ('ratios_only', 'shaped', 'continuous')


# ──────────────────────────────────────────────────────────────────────
# Everything below this line is the physics engine.
# The decision points above are the instrument. This is the mechanism.
# ──────────────────────────────────────────────────────────────────────


# ──────────────────────────────────────────────────────────────────────
# PHONON DENSITY OF STATES  (normalized frequencies in [0, 1])
# ──────────────────────────────────────────────────────────────────────

def dos_cubic(n=40):
    """
    Simple cubic: 3 equal axes, 90° angles. Highest symmetry.
    Isotropic DOS. Van Hove singularity (square-root divergence) at the
    zone boundary → many modes cluster at high frequencies.
    Hypothesis: thick, bright, rich partials — dense packing near ω_max.
    """
    k = np.linspace(0, np.pi, n)
    kx, ky, kz = np.meshgrid(k, k, k)
    omega = np.sqrt((np.sin(kx/2)**2 + np.sin(ky/2)**2 + np.sin(kz/2)**2) / 3.0)
    return omega.flatten()


def dos_tetragonal(n=40, c_ratio=1.7):
    """
    Tetragonal: 2 equal axes (a=b), 1 different (c). 90° angles.
    Two distinct mode families: ab-plane modes and c-axis modes.
    Hypothesis: slightly pinched, with directional coloration.
    """
    k = np.linspace(0, np.pi, n)
    kx, ky, kz = np.meshgrid(k, k, k)
    omega_sq = np.sin(kx/2)**2 + np.sin(ky/2)**2 + c_ratio * np.sin(kz/2)**2
    omega = np.sqrt(omega_sq / (2.0 + c_ratio))
    return omega.flatten()


def dos_orthorhombic(n=40):
    """
    Orthorhombic: 3 unequal axes, 90° angles.
    Three distinct spring constants → three mode families, wider spacing.
    Hypothesis: less dense at high freq, more separated partials.
    """
    Ka, Kb, Kc = 1.0, 0.62, 0.32
    k = np.linspace(0, np.pi, n)
    kx, ky, kz = np.meshgrid(k, k, k)
    omega_sq = Ka*np.sin(kx/2)**2 + Kb*np.sin(ky/2)**2 + Kc*np.sin(kz/2)**2
    omega = np.sqrt(omega_sq / (Ka + Kb + Kc))
    return omega.flatten()


def dos_hexagonal(n=50):
    """
    Hexagonal (e.g. quartz): triangular ab-plane, different c-axis.
    Two phonon branches with different dispersion — acoustic birefringence.
    Ordinary branch (v_o) and extraordinary branch (v_e).
    Hypothesis: doubled, shimmery — two superimposed mode families.
    """
    kr = np.linspace(0, np.pi, n)
    kz = np.linspace(0, np.pi, n)
    KR, KZ = np.meshgrid(kr, kz)
    ring_weight = KR + 1e-8   # 2D degeneracy: modes at radius kr weight by kr

    omega_o = np.sqrt(np.sin(KR/2)**2 + 0.70 * np.sin(KZ/2)**2)
    freqs_o = (omega_o / np.sqrt(1.70) * ring_weight).flatten()

    omega_e = np.sqrt(np.sin(KR/2)**2 + 1.55 * np.sin(KZ/2)**2)
    freqs_e = (omega_e / np.sqrt(2.55) * ring_weight).flatten()

    return np.concatenate([freqs_o, freqs_e])


def dos_trigonal(n=50):
    """
    Trigonal/Rhombohedral: hexagonal-like with small inter-branch coupling.
    Two branches hybridize slightly → mode repulsion, irregular gaps.
    Hypothesis: near-hexagonal shimmer with subtle asymmetry.
    """
    kr = np.linspace(0, np.pi, n)
    kz = np.linspace(0, np.pi, n)
    KR, KZ = np.meshgrid(kr, kz)
    ring_weight = KR + 1e-8

    coupling = 0.14
    base = np.sin(KR/2)**2 + np.sin(KZ/2)**2
    mix  = coupling * np.sin(KR/2) * np.sin(KZ/2)

    omega_1 = np.sqrt(np.maximum(0.88 * base + mix, 1e-10)) / np.sqrt(0.88 * 2.0)
    omega_2 = np.sqrt(np.maximum(1.12 * base - mix, 1e-10)) / np.sqrt(1.12 * 2.0)

    return np.concatenate([(omega_1 * ring_weight).flatten(),
                            (omega_2 * ring_weight).flatten()])


def dos_monoclinic(n=35):
    """
    Monoclinic: only 1 right angle (β ≈ 110°).
    Tilted axis → off-diagonal shear term in dynamical matrix → mode mixing.
    Hypothesis: complex, inharmonic — bell-like and unpredictable.
    """
    k = np.linspace(0, np.pi, n)
    kx, ky, kz = np.meshgrid(k, k, k)
    beta  = np.radians(112.0)
    shear = 0.28 * np.cos(beta) * np.sin(kx/2) * np.sin(kz/2)
    omega_sq = (0.72*np.sin(kx/2)**2 + 0.54*np.sin(ky/2)**2 +
                0.44*np.sin(kz/2)**2 + shear)
    omega = np.sqrt(np.maximum(omega_sq, 0.0)) / np.sqrt(0.72 + 0.54 + 0.44)
    return omega.flatten()


def dos_triclinic(n=28):
    """
    Triclinic: NO right angles. All shear coupling terms present.
    Every mode is unique; no degeneracies. Maximum inharmonicity.
    Hypothesis: deeply inharmonic — the most 'alien' timbre of the seven.
    """
    k = np.linspace(0, np.pi, n)
    kx, ky, kz = np.meshgrid(k, k, k)
    d11  =  0.65 * np.sin(kx/2)**2
    d22  =  0.47 * np.sin(ky/2)**2
    d33  =  0.35 * np.sin(kz/2)**2
    d_xy =  0.16 * np.cos(np.radians(82.0))  * np.sin(kx/2) * np.sin(ky/2)
    d_xz =  0.13 * np.cos(np.radians(106.0)) * np.sin(kx/2) * np.sin(kz/2)
    d_yz =  0.10 * np.cos(np.radians(97.0))  * np.sin(ky/2) * np.sin(kz/2)
    omega_sq = d11 + d22 + d33 + d_xy + d_xz + d_yz
    omega    = np.sqrt(np.maximum(omega_sq, 0.0))
    return (omega / omega.max()).flatten()


# ──────────────────────────────────────────────────────────────────────
# AUDIO SYNTHESIS
# ──────────────────────────────────────────────────────────────────────

def _bandpass_noise(rng, t, center_hz, bandwidth_hz, sample_rate):
    """Band-limited noise patch for FIDELITY='continuous' mode."""
    nyq  = sample_rate / 2.0
    low  = max(center_hz - bandwidth_hz / 2, 1.0) / nyq
    high = min(center_hz + bandwidth_hz / 2, nyq * 0.99) / nyq
    if low >= high:
        return rng.standard_normal(len(t))
    b, a   = butter(2, [low, high], btype='band')
    noise  = rng.standard_normal(len(t))
    result = lfilter(b, a, noise)
    rms    = np.sqrt(np.mean(result**2)) + 1e-12
    return result / rms


def compute_scale(freqs_norm, freq_anchor, base_freq, max_freq):
    """
    ── DECISION POINT 1 in action ──────────────────────────────────────
    Translate the anchor mode choice into a concrete Hz-per-unit scale
    factor. This is where the frequency mapping metaphor is established.
    """
    nonzero = freqs_norm[freqs_norm > 0.012]
    if nonzero.size == 0:
        return base_freq / 1.0, max_freq

    if freq_anchor == 'lowest_mode':
        # Anchor: the softest acoustic phonon = base_freq
        # The spectrum spreads upward as far as physics requires.
        scale     = base_freq / nonzero.min()
        ceiling   = max_freq

    elif freq_anchor == 'zone_boundary':
        # Anchor: the hardest phonon (zone boundary) = max_freq
        # The floor is determined by the physics of each crystal.
        scale     = max_freq / nonzero.max()
        ceiling   = max_freq

    elif freq_anchor == 'centroid':
        # Anchor: the spectral centroid (energy-weighted mean) = base_freq
        # Centers each crystal's perceived weight at the same pitch.
        centroid  = np.mean(nonzero)          # unweighted mean of DOS modes
        scale     = base_freq / centroid
        ceiling   = max_freq

    else:
        raise ValueError(f"Unknown freq_anchor: {freq_anchor!r}")

    return scale, ceiling


def synthesize_strike(
        freqs_norm,
        base_freq       = None,
        freq_anchor     = None,
        max_freq        = None,
        duration        = DURATION,
        sample_rate     = SAMPLE_RATE,
        n_bins          = None,
        decay_base      = None,
        decay_exp       = None,
        fidelity        = None,
        transient_decay = 60.0
):
    # Fall back to global decision-point parameters if not overridden
    base_freq   = base_freq   if base_freq   is not None else BASE_FREQ
    freq_anchor = freq_anchor if freq_anchor is not None else FREQ_ANCHOR
    max_freq    = max_freq    if max_freq    is not None else MAX_FREQ
    n_bins      = n_bins      if n_bins      is not None else N_PARTIALS
    decay_base  = decay_base  if decay_base  is not None else DECAY_BASE
    decay_exp   = decay_exp   if decay_exp   is not None else DECAY_EXP
    fidelity    = fidelity    if fidelity    is not None else FIDELITY

    rng = np.random.default_rng(42)
    t   = np.linspace(0, duration, int(sample_rate * duration), dtype=np.float64)

    freqs = freqs_norm[freqs_norm > 0.012]
    if freqs.size == 0:
        return np.zeros_like(t)

    # ── Apply frequency anchor (Decision Point 1) ─────────────────────
    scale, ceiling = compute_scale(freqs, freq_anchor, base_freq, max_freq)
    audio_f = freqs * scale
    mask    = (audio_f >= base_freq * 0.8) & (audio_f <= ceiling)
    audio_f = audio_f[mask]
    if audio_f.size == 0:
        return np.zeros_like(t)

    # ── Log-spaced histogram (Decision Point 2) ───────────────────────
    #
    #  Equal linear bin spacing creates partials on a perfect frequency
    #  comb → all partials beat in phase → audible rhythmic pulse.
    #  Log spacing gives equal musical intervals between partials, which
    #  breaks the synchronized beating. The number of bins (n_bins) is
    #  Decision Point 2 — it controls how "discrete" vs "continuous"
    #  the rendered sound is.
    #
    log_edges   = np.logspace(np.log10(audio_f.min() * 0.99),
                              np.log10(audio_f.max() * 1.01),
                              n_bins + 1)
    hist, edges = np.histogram(audio_f, bins=log_edges)
    centers     = np.sqrt(edges[:-1] * edges[1:])   # geometric centre per bin
    bandwidths  = edges[1:] - edges[:-1]             # Hz width of each bin

    sig_mask    = hist > 0
    partial_f   = centers[sig_mask]
    partial_bw  = bandwidths[sig_mask]
    partial_a   = hist[sig_mask].astype(np.float64)

    # Amplitude: weight by DOS × perceptual rolloff
    partial_a = partial_a / (partial_f / base_freq) ** 0.3
    partial_a /= partial_a.sum()

    audio = np.zeros_like(t)

    for freq, amp, bw in zip(partial_f, partial_a, partial_bw):

        # ── Apply decay model (Decision Point 3) ──────────────────────
        #
        #  This is where the temporal claim is made. If FIDELITY is
        #  'ratios_only', decay is flat (no frequency dependence) and
        #  the only physics claim is spectral. In 'shaped' and
        #  'continuous' modes, the frequency-dependent decay reflects
        #  the real physics of anharmonic coupling.
        #
        if fidelity == 'ratios_only':
            # Flat decay — no temporal physics claim
            decay_rate = decay_base
        else:
            # Physically motivated: high modes decay faster
            ratio      = freq / base_freq
            decay_rate = decay_base * (ratio ** decay_exp)

        env = np.exp(-decay_rate * t)

        # ── Apply fidelity mode (Decision Point 4) ────────────────────
        #
        #  This is the deepest metaphor stretch. Pure sines are the
        #  most "musical" but most discretized. Band-limited noise
        #  per partial approaches the continuous DOS — each partial
        #  becomes a smear of frequency rather than an exact pitch.
        #
        if fidelity == 'continuous':
            # Replace pure sine with band-limited noise at this frequency.
            # The bandwidth = bin width, so the noise patch covers the
            # same frequency range that the histogram bin covers.
            # This dissolves the discrete beating into a textured shimmer.
            voice = _bandpass_noise(rng, t, freq, bw, sample_rate)
        else:
            # Pure sinusoid — the "traditional" synthesis choice.
            # Discrete beating between adjacent partials is audible and
            # is an artifact of discretization, not crystal physics.
            voice = np.sin(2.0 * np.pi * freq * t)

        audio += amp * env * voice

    # Initial broadband impulse — simulates striking the crystal
    impulse = 0.12 * np.exp(-transient_decay * t) * rng.standard_normal(t.size)
    audio  += impulse

    peak = np.abs(audio).max()
    if peak > 0:
        audio = audio / peak * 0.88

    return audio


def synthesize_dispersion_demo(base_freq=110.0, duration=DURATION, sample_rate=SAMPLE_RATE):
    """
    Acoustic dispersion demo (cubic crystal):
    Each frequency component travels at a different group velocity.
    Low frequencies travel faster; zone-boundary modes travel slowest.
    This is the crystal as a temporal prism — the acoustic analog of
    a glass prism separating white light spatially by frequency.
    τ(ω) = L / v_group(ω),  v_group = dω/dk
    """
    t     = np.linspace(0, duration, int(sample_rate * duration), dtype=np.float64)
    audio = np.zeros_like(t)
    freqs = np.linspace(base_freq, base_freq * 6.5, 200)

    omega_norm = freqs / (base_freq * 6.5)
    eps        = 1e-6
    v_g_norm   = np.sqrt(np.maximum(1.0 - omega_norm**2, eps))
    tau_norm   = 1.0 / v_g_norm
    max_delay  = 1.8
    tau_s      = (tau_norm - tau_norm.min()) / (tau_norm.max() - tau_norm.min()) * max_delay

    for freq, delay in zip(freqs, tau_s):
        burst_dur    = 0.4 / (freq / base_freq) ** 0.3
        burst_centre = delay + burst_dur / 2.0
        env          = np.exp(-((t - burst_centre) / (burst_dur * 0.4)) ** 2)
        amp          = 1.0 / (freq / base_freq) ** 0.5
        audio       += amp * env * np.sin(2.0 * np.pi * freq * t)

    peak = np.abs(audio).max()
    if peak > 0:
        audio = audio / peak * 0.85
    return audio


# ──────────────────────────────────────────────────────────────────────
# CRYSTAL REGISTRY
# Each entry carries per-crystal decay overrides. These reflect the
# physical intuition that higher-symmetry crystals (cubic, hexagonal)
# have more coherent mode structures and thus longer sustain than
# lower-symmetry ones (monoclinic, triclinic). These are hypotheses —
# the numbers are not from material science tables.
# ──────────────────────────────────────────────────────────────────────

CRYSTALS = [
    dict(
        name  = "1_cubic",
        title = "Cubic (NaCl / Diamond)",
        hyp   = "thick, bright, rich — high-frequency partials densely packed near zone boundary",
        dos   = dos_cubic,
        p     = dict(decay_base=0.60, decay_exp=0.45, transient_decay=55.0),
    ),
    dict(
        name  = "2_tetragonal",
        title = "Tetragonal",
        hyp   = "slightly pinched, directional coloration — two interleaved mode families",
        dos   = dos_tetragonal,
        p     = dict(decay_base=0.80, decay_exp=0.50, transient_decay=55.0),
    ),
    dict(
        name  = "3_orthorhombic",
        title = "Orthorhombic",
        hyp   = "less dense at high freq, more separated partials — three distinct mode groups",
        dos   = dos_orthorhombic,
        p     = dict(decay_base=1.00, decay_exp=0.55, transient_decay=60.0),
    ),
    dict(
        name  = "4_hexagonal",
        title = "Hexagonal (Quartz)",
        hyp   = "birefringent — doubled, shimmery from two distinct phonon branches",
        dos   = dos_hexagonal,
        p     = dict(decay_base=0.70, decay_exp=0.48, transient_decay=50.0),
    ),
    dict(
        name  = "5_trigonal",
        title = "Trigonal / Rhombohedral",
        hyp   = "near-hexagonal shimmer with subtle irregularity from branch hybridization",
        dos   = dos_trigonal,
        p     = dict(decay_base=0.75, decay_exp=0.50, transient_decay=52.0),
    ),
    dict(
        name  = "6_monoclinic",
        title = "Monoclinic",
        hyp   = "complex, inharmonic — bell-like and unpredictable from shear coupling",
        dos   = dos_monoclinic,
        p     = dict(decay_base=1.20, decay_exp=0.62, transient_decay=65.0),
    ),
    dict(
        name  = "7_triclinic",
        title = "Triclinic (Feldspar)",
        hyp   = "deeply inharmonic, partials scattered — most alien timbre of the seven",
        dos   = dos_triclinic,
        p     = dict(decay_base=1.50, decay_exp=0.70, transient_decay=70.0),
    ),
]


# ──────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────

def save_wav(path, audio, sr=SAMPLE_RATE):
    wavfile.write(path, sr, (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16))


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"\nCrystal Synthesizer — Audio Demonstration")
    print(f"─" * 60)
    print(f"  Freq anchor : {FREQ_ANCHOR}  (base={BASE_FREQ} Hz)")
    print(f"  N partials  : {N_PARTIALS}")
    print(f"  Decay       : base={DECAY_BASE}  exp={DECAY_EXP}")
    print(f"  Fidelity    : {FIDELITY}")
    print(f"  Output      : {OUTPUT_DIR}")
    print(f"─" * 60)

    for c in CRYSTALS:
        print(f"\n{c['title']}")
        print(f"  {c['hyp']}")

        freqs = c['dos']()
        audio = synthesize_strike(freqs, **c['p'])

        path = os.path.join(OUTPUT_DIR, f"crystal_{c['name']}.wav")
        save_wav(path, audio)
        print(f"  → {os.path.basename(path)}")

    print(f"\n  [Dispersion demo]")
    disp  = synthesize_dispersion_demo(BASE_FREQ, DURATION, SAMPLE_RATE)
    dpath = os.path.join(OUTPUT_DIR, "crystal_0_dispersion_demo.wav")
    save_wav(dpath, disp)
    print(f"  → {os.path.basename(dpath)}")

    print(f"\n{'─'*60}")
    print(f"✓  8 files written.\n")
    print(f"Listening guide:")
    print(f"  Cubic       → richest, brightest, densest zone-boundary clustering")
    print(f"  Hexagonal   → birefringent shimmer: two branch families superimposed")
    print(f"  Triclinic   → most bell-like, no repeating partial structure")
    print(f"  Dispersion  → low notes arrive first, high notes last (temporal prism)")
    print(f"\nDecision point experiments to try:")
    print(f"  N_PARTIALS = 8   vs  300   — bell vs texture")
    print(f"  FIDELITY   = 'ratios_only' vs 'continuous'")
    print(f"  FREQ_ANCHOR = 'zone_boundary'  — all crystals share a ceiling")
    print(f"  DECAY_EXP  = 0.0  — remove the physical temporal envelope")


if __name__ == "__main__":
    main()
