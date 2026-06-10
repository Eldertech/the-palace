"""
make_renders.py - Audio examples and images for Tract Mirror.

Consumes vowels.json (produced by fit_vowels.py) and renders, into renders/:
  - vowel_{a,e,i,o,u,schwa}.wav  : sustained 110 Hz (A2), 2.0 s
  - morph_a_i_u.wav              : 6 s, area function morphs a->i->u (log domain)
  - melody_demo.wav              : ~10 s monophonic melody, portamento + vibrato
  - breath_only.wav              : 3 s noise-excited whisper, vowel morph
  - spectrogram_{vowel}.png      : with formant targets overlaid
  - tube_profiles.png            : all six area functions as tube silhouettes

All WAVs: 44.1 kHz, 16-bit, normalized to -3 dBFS, no clipping, no NaN.
No emoji anywhere.
"""

import json
import numpy as np
from scipy.io import wavfile
from scipy.signal import spectrogram

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

import kl_reference as kl


FS = 44100
TARGET_DBFS = -3.0
TARGET_PEAK = 10.0 ** (TARGET_DBFS / 20.0)   # ~0.708

VOWEL_ORDER = ["a", "e", "i", "o", "u", "schwa"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_vowels(path="vowels.json"):
    with open(path) as f:
        return json.load(f)


def normalize(y, peak=TARGET_PEAK):
    """Scale so the absolute peak equals `peak` (-3 dBFS). Guard silence."""
    y = np.asarray(y, dtype=float)
    m = np.max(np.abs(y))
    if m < 1e-12:
        return y
    return y * (peak / m)


def to_int16(y):
    """Convert float [-1,1] to int16 with clip guard."""
    y = np.clip(y, -1.0, 1.0)
    return (y * 32767.0).astype(np.int16)


def write_wav(path, y, fs=FS):
    y = normalize(y)
    assert np.all(np.isfinite(y)), f"{path}: non-finite samples"
    assert np.max(np.abs(y)) <= 1.0 + 1e-9, f"{path}: clipping"
    assert np.max(np.abs(y)) > 1e-6, f"{path}: silent"
    wavfile.write(path, fs, to_int16(y))
    return y


def fade(y, fs=FS, ms=15.0):
    """Apply a short raised-cosine fade in/out to avoid clicks."""
    n = int(fs * ms / 1000.0)
    if 2 * n >= len(y):
        return y
    w = 0.5 * (1 - np.cos(np.pi * np.arange(n) / n))
    y = y.copy()
    y[:n] *= w
    y[-n:] *= w[::-1]
    return y


def make_tract(area_cp, fs=FS, **kw):
    N = kl.n_sections(fs)
    areas = kl.resample_area(area_cp, N)
    return kl.KellyLochbaumTract(areas, fs, **kw), areas


# ---------------------------------------------------------------------------
# Sustained vowels
# ---------------------------------------------------------------------------

def render_sustained_vowel(area_cp, f0=110.0, dur=2.0, fs=FS, breath=0.0,
                           tension=0.55, open_quotient=0.6):
    n = int(dur * fs)
    # gentle vibrato so the sustained tone is not sterile
    t = np.arange(n) / fs
    vib = f0 * (1.0 + 0.006 * np.sin(2 * np.pi * 5.0 * t))
    exc = kl.glottal_source(n, fs, vib, open_quotient=open_quotient,
                            tension=tension, breath=breath,
                            rng=np.random.default_rng(42))
    tract, _ = make_tract(area_cp, fs)
    y = tract.process(exc, radiation=True)
    return fade(y, fs)


# ---------------------------------------------------------------------------
# Morph a -> i -> u (interpolate AREAS in log domain, recompute k each block)
# ---------------------------------------------------------------------------

def render_morph(areas_seq, f0=110.0, dur=6.0, fs=FS, breath=0.0,
                 block=256, tension=0.55):
    """areas_seq: list of 64-point area curves to morph through, evenly spaced
    across the duration. The area function is interpolated in the LOG domain,
    resampled to N sections, and the reflection coefficients are recomputed
    every `block` samples. Reflection coefficients are NEVER interpolated
    directly - only areas are (log domain), then k is recomputed."""
    n = int(dur * fs)
    t = np.arange(n) / fs
    vib = f0 * (1.0 + 0.006 * np.sin(2 * np.pi * 5.0 * t))
    exc = kl.glottal_source(n, fs, vib, tension=tension, breath=breath,
                            rng=np.random.default_rng(7))
    N = kl.n_sections(fs)
    tract = kl.KellyLochbaumTract(kl.resample_area(areas_seq[0], N), fs)
    log_curves = [np.log(np.asarray(a, dtype=float)) for a in areas_seq]
    S = len(areas_seq) - 1   # number of morph segments
    y = np.empty(n)
    for start in range(0, n, block):
        end = min(start + block, n)
        frac = start / max(n - 1, 1)             # 0..1 across whole clip
        pos = frac * S                            # which segment + sub-frac
        seg = min(int(pos), S - 1)
        a = pos - seg
        log_area_cp = (1 - a) * log_curves[seg] + a * log_curves[seg + 1]
        area_cp = np.exp(log_area_cp)
        tract.set_areas(kl.resample_area(area_cp, N))   # recompute k from areas
        for i in range(start, end):
            y[i] = tract.step(exc[i], radiation=True)
    return fade(y, fs)


# ---------------------------------------------------------------------------
# Melody demo (the money demo): portamento, vibrato, vowel per phrase
# ---------------------------------------------------------------------------

def midi_to_hz(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def render_melody(vowel_areas, fs=FS):
    """~10 s monophonic melody. Each phrase has its own vowel; pitch glides with
    portamento between notes and carries a gentle, slightly delayed vibrato.
    Built as a single continuous excitation/tract pass so portamento is real
    (the area function and f0 evolve continuously)."""
    # (midi, beats, vowel) - a small singable phrase, A natural minor-ish.
    # Two arcs: a rising opening, then a descending answer, ~10 s total.
    notes = [
        (57, 1.0, "a"),   # A3
        (60, 1.0, "a"),   # C4
        (62, 1.0, "e"),   # D4
        (64, 1.5, "e"),   # E4
        (62, 0.5, "i"),   # D4
        (60, 1.0, "i"),   # C4
        (64, 1.0, "o"),   # E4
        (67, 1.5, "o"),   # G4
        (65, 0.5, "u"),   # F4
        (64, 1.0, "u"),   # E4
        (62, 1.0, "e"),   # D4
        (67, 1.5, "i"),   # G4 (a reach up)
        (65, 0.5, "i"),   # F4
        (64, 1.0, "o"),   # E4
        (60, 1.0, "a"),   # C4
        (57, 2.5, "a"),   # A3 (resolve, held)
    ]
    bpm = 100.0
    spb = 60.0 / bpm
    # Build per-sample f0 (with portamento) and a per-sample vowel-blend index.
    seg_samps = [int(round(b * spb * fs)) for (_, b, _) in notes]
    total = sum(seg_samps)
    f0_target = np.empty(total)
    vowel_idx = np.empty(total, dtype=int)
    pos = 0
    for (m, b, v), ns in zip(notes, seg_samps):
        f0_target[pos:pos + ns] = midi_to_hz(m)
        vowel_idx[pos:pos + ns] = VOWEL_ORDER.index(v)
        pos += ns
    # Portamento: one-pole glide toward target pitch (in log-Hz for musicality).
    glide = np.empty(total)
    g = np.log(f0_target[0])
    coef = np.exp(-1.0 / (0.045 * fs))   # ~45 ms glide time constant
    log_t = np.log(f0_target)
    for i in range(total):
        g = coef * g + (1 - coef) * log_t[i]
        glide[i] = g
    f0 = np.exp(glide)
    # Vibrato: gentle, onset-delayed within each note is complex; use a global
    # smooth 5.5 Hz vibrato that deepens slightly over sustained passages.
    t = np.arange(total) / fs
    vib_depth = 0.010
    f0 = f0 * (1.0 + vib_depth * np.sin(2 * np.pi * 5.5 * t))

    exc = kl.glottal_source(total, fs, f0, open_quotient=0.62, tension=0.6,
                            breath=0.04, rng=np.random.default_rng(11))

    # Continuous vowel area morph: blend toward the current note's vowel with a
    # short smoothing so vowel changes are not instantaneous (legato vowels).
    N = kl.n_sections(fs)
    log_curves = {v: np.log(np.asarray(vowel_areas[v], dtype=float))
                  for v in VOWEL_ORDER}
    tract = kl.KellyLochbaumTract(
        kl.resample_area(np.exp(log_curves[VOWEL_ORDER[vowel_idx[0]]]), N), fs)

    block = 128
    smooth_coef = np.exp(-1.0 / (0.040 * fs))   # 40 ms vowel glide
    cur_log = log_curves[VOWEL_ORDER[vowel_idx[0]]].copy()
    y = np.empty(total)
    for start in range(0, total, block):
        end = min(start + block, total)
        tgt_log = log_curves[VOWEL_ORDER[vowel_idx[start]]]
        # exponential approach across the block
        steps = end - start
        cur_log = (smooth_coef ** steps) * cur_log + \
                  (1 - smooth_coef ** steps) * tgt_log
        tract.set_areas(kl.resample_area(np.exp(cur_log), N))
        for i in range(start, end):
            y[i] = tract.step(exc[i], radiation=True)
    # light tremolo-free amplitude envelope: small fade per note boundary to
    # avoid zipper noise is unnecessary since vowel/pitch glide; just fade ends.
    return fade(y, fs, ms=25.0)


# ---------------------------------------------------------------------------
# Breath-only whisper (noise-excited), morph between two vowels
# ---------------------------------------------------------------------------

def render_breath(area_a, area_b, dur=3.0, fs=FS):
    return render_morph([area_a, area_b], f0=130.0, dur=dur, fs=fs,
                        breath=1.0, block=256)


# ---------------------------------------------------------------------------
# Images
# ---------------------------------------------------------------------------

def render_spectrogram(path, y, targets, title, fs=FS):
    f, tt, Sxx = spectrogram(y, fs=fs, nperseg=2048, noverlap=1536,
                             window="hann")
    Sdb = 10 * np.log10(Sxx + 1e-12)
    fig, ax = plt.subplots(figsize=(8, 4.5))
    fmax = 5000
    fmask = f <= fmax
    im = ax.pcolormesh(tt, f[fmask], Sdb[fmask], shading="auto", cmap="magma",
                       vmin=Sdb[fmask].max() - 70, vmax=Sdb[fmask].max())
    for i, ft in enumerate(targets):
        ax.axhline(ft, color="cyan", lw=1.2, ls="--", alpha=0.9)
        ax.text(tt[-1] * 0.99, ft + 40, f"F{i+1}={ft} Hz", color="cyan",
                ha="right", va="bottom", fontsize=8)
    ax.set_ylim(0, fmax)
    ax.set_xlabel("Time (s)")
    ax.set_ylabel("Frequency (Hz)")
    ax.set_title(title)
    fig.colorbar(im, ax=ax, label="Power (dB)")
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)


def render_tube_profiles(path, vowels):
    fig, axes = plt.subplots(2, 3, figsize=(13, 6.5))
    x = np.linspace(0, 1, len(next(iter(vowels.values()))["area_cm2"]))
    for ax, name in zip(axes.flat, VOWEL_ORDER):
        area = np.array(vowels[name]["area_cm2"])
        radius = np.sqrt(area / np.pi)   # cm
        ax.fill_between(x, radius, -radius, color="#3a6ea5", alpha=0.85)
        ax.plot(x, radius, color="#13315c", lw=1.0)
        ax.plot(x, -radius, color="#13315c", lw=1.0)
        ax.set_title(f"/{name}/", fontsize=12)
        ax.set_ylim(-2.2, 2.2)
        ax.set_xlim(0, 1)
        ax.set_yticks([])
        ax.text(0.02, -2.05, "glottis", fontsize=7, color="gray")
        ax.text(0.98, -2.05, "lips", fontsize=7, color="gray", ha="right")
    fig.suptitle("Tract Mirror - vowel area functions as tube silhouettes "
                 "(radius = sqrt(A/pi))", fontsize=12)
    fig.tight_layout(rect=[0, 0, 1, 0.96])
    fig.savefig(path, dpi=120)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    data = load_vowels()
    vowels = data["vowels"]
    areas = {v: np.array(vowels[v]["area_cm2"]) for v in VOWEL_ORDER}

    rd = "renders/"
    checks = []

    # Sustained vowels
    for v in VOWEL_ORDER:
        y = render_sustained_vowel(areas[v])
        y = write_wav(rd + f"vowel_{v}.wav", y)
        checks.append((f"vowel_{v}.wav", y))
        print(f"wrote vowel_{v}.wav  peak={np.max(np.abs(y)):.3f}")

    # Morph a -> i -> u
    ym = render_morph([areas["a"], areas["i"], areas["u"]], dur=6.0)
    ym = write_wav(rd + "morph_a_i_u.wav", ym)
    checks.append(("morph_a_i_u.wav", ym))
    print(f"wrote morph_a_i_u.wav  peak={np.max(np.abs(ym)):.3f}")

    # Melody demo
    ymel = render_melody(areas)
    ymel = write_wav(rd + "melody_demo.wav", ymel)
    checks.append(("melody_demo.wav", ymel))
    print(f"wrote melody_demo.wav  peak={np.max(np.abs(ymel)):.3f} "
          f"dur={len(ymel)/FS:.1f}s")

    # Breath-only whisper morph (o -> i)
    yb = render_breath(areas["o"], areas["i"], dur=3.0)
    yb = write_wav(rd + "breath_only.wav", yb)
    checks.append(("breath_only.wav", yb))
    print(f"wrote breath_only.wav  peak={np.max(np.abs(yb)):.3f}")

    # Spectrograms
    for v in VOWEL_ORDER:
        y = render_sustained_vowel(areas[v], dur=1.5)
        targets = vowels[v]["formant_targets_hz"]
        render_spectrogram(rd + f"spectrogram_{v}.png", y, targets,
                           f"Tract Mirror  /{v}/  (targets overlaid)")
        print(f"wrote spectrogram_{v}.png")

    # Tube profiles
    render_tube_profiles(rd + "tube_profiles.png", vowels)
    print("wrote tube_profiles.png")

    # Verification gate on audio
    print("\n" + "=" * 60)
    print("AUDIO VERIFICATION GATE")
    all_ok = True
    for name, y in checks:
        finite = bool(np.all(np.isfinite(y)))
        peak = float(np.max(np.abs(y)))
        nonsilent = peak > 1e-3
        noclip = peak <= 1.0
        ok = finite and nonsilent and noclip
        all_ok = all_ok and ok
        print(f"  {name:20s} finite={finite} nonsilent={nonsilent} "
              f"noclip={noclip} peak={peak:.3f}")
    print(f"  ALL AUDIO OK: {all_ok}")
    return all_ok


if __name__ == "__main__":
    ok = main()
    raise SystemExit(0 if ok else 1)
