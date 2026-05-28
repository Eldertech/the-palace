#!/usr/bin/env python3
"""
Curated Ear Set — 12 portamento examples + spectrograms.

Each example is a frequency trajectory f(t) produced by the second-order
damped-oscillator pitch model from the home entry:

    f'' + 2*zeta*wn*f' + wn^2 * (f - f_target) = 0

A short sine carrier (with optional harmonics for multi-modal cases) is
generated whose instantaneous frequency follows f(t). Each clip is saved
as a 16-bit mono WAV plus a matplotlib spectrogram PNG.

The set covers all three regimes (overdamped, critically damped,
underdamped) plus a small "complex multi-modal" subset where individual
modes follow their own zeta/wn (inharmonic string, bell). Students hear
twelve examples in random order and identify (a) the damping regime and
(b) what physical system would produce that trajectory.

Audio: 44.1 kHz, mono, 16-bit. Clip length ~3 s. Pre-roll ~0.25 s of
the starting frequency lets the ear establish f0 before the slide.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, asdict, field
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy.io import wavfile
from scipy.signal import spectrogram

HERE = Path(__file__).parent
AUDIO_DIR = HERE / "audio"
SPEC_DIR = HERE / "spectrograms"
AUDIO_DIR.mkdir(exist_ok=True)
SPEC_DIR.mkdir(exist_ok=True)

SR = 44100  # Hz
CLIP_DUR = 3.0  # seconds total
PREROLL = 0.25  # seconds at f0 before the slide begins


@dataclass
class Example:
    """One curated portamento example."""

    idx: int
    name: str
    regime: str  # "overdamped" | "critically_damped" | "underdamped"
    physical_system: str  # e.g. "vocal slide", "guitar bend"
    f0: float  # Hz, starting pitch
    f_target: float  # Hz, target pitch
    zeta: float  # damping ratio
    wn: float  # natural frequency (rad/s) of the pitch-control system
    harmonics: list[tuple[float, float, float]] = field(default_factory=list)
    # Each harmonic is (relative_freq_multiplier, amplitude, mode_inharmonicity)
    # When mode_inharmonicity != 1.0, that mode follows a slightly different
    # zeta/wn proportional to the multiplier — simulates multi-modal coupling.
    teaching_note: str = ""


def damped_trajectory(f0: float, f_target: float, zeta: float, wn: float,
                      t: np.ndarray) -> np.ndarray:
    """Return f(t) as the response of a second-order damped oscillator
    to a step from f0 toward f_target. Closed-form per regime."""
    delta = f0 - f_target  # initial displacement
    if abs(zeta - 1.0) < 1e-4:
        # critically damped
        out = f_target + delta * (1.0 + wn * t) * np.exp(-wn * t)
    elif zeta > 1.0:
        # overdamped: linear combination of two real exponentials
        wd = wn * np.sqrt(zeta * zeta - 1.0)
        r1 = -zeta * wn + wd
        r2 = -zeta * wn - wd
        # initial conditions: f(0)=f0, f'(0)=0
        a = delta * (-r2) / (r2 - r1) * -1.0
        # algebra: f(t) - f_t = A*exp(r1 t) + B*exp(r2 t)
        # at t=0: A + B = delta; A*r1 + B*r2 = 0 => A = -B*r2/r1
        # so -B r2/r1 + B = delta => B (1 - r2/r1) = delta
        B = delta / (1.0 - r2 / r1)
        A = delta - B
        out = f_target + A * np.exp(r1 * t) + B * np.exp(r2 * t)
    else:
        # underdamped
        wd = wn * np.sqrt(1.0 - zeta * zeta)
        env = np.exp(-zeta * wn * t)
        out = f_target + delta * env * (
            np.cos(wd * t) + (zeta / np.sqrt(1.0 - zeta * zeta)) * np.sin(wd * t)
        )
    return out


def synthesize(ex: Example) -> np.ndarray:
    """Return a mono float32 buffer for the example."""
    n_total = int(round(SR * CLIP_DUR))
    n_pre = int(round(SR * PREROLL))
    t_slide = np.arange(n_total - n_pre) / SR
    f_slide = damped_trajectory(ex.f0, ex.f_target, ex.zeta, ex.wn, t_slide)
    # build a constant-f0 pre-roll then the slide
    f_pre = np.full(n_pre, ex.f0, dtype=np.float64)
    f_t = np.concatenate([f_pre, f_slide])

    # accumulate phase from instantaneous frequency
    out = np.zeros(n_total, dtype=np.float64)

    # fundamental
    phase = 2 * np.pi * np.cumsum(f_t) / SR
    out += 0.6 * np.sin(phase)

    # harmonics (and optional inharmonic coupled glides)
    for mult, amp, inharm in ex.harmonics:
        if abs(inharm - 1.0) < 1e-6:
            f_h = f_t * mult
        else:
            # this mode follows its own damped trajectory with shifted
            # zeta and wn — simulates inharmonic mode coupling
            zeta_h = ex.zeta * inharm
            wn_h = ex.wn * inharm
            f_pre_h = np.full(n_pre, ex.f0 * mult, dtype=np.float64)
            f_slide_h = damped_trajectory(
                ex.f0 * mult, ex.f_target * mult, zeta_h, wn_h, t_slide
            )
            f_h = np.concatenate([f_pre_h, f_slide_h])
        phase_h = 2 * np.pi * np.cumsum(f_h) / SR
        out += amp * np.sin(phase_h)

    # short fade in/out so the clip doesn't click in the player
    fade = int(0.01 * SR)
    win = np.ones(n_total)
    win[:fade] = np.linspace(0.0, 1.0, fade)
    win[-fade:] = np.linspace(1.0, 0.0, fade)
    out = out * win

    # normalize to -3 dBFS so the loudest clip is comfortable
    peak = np.max(np.abs(out))
    if peak > 0:
        out = out / peak * 0.707
    return out.astype(np.float32)


def save_wav(buf: np.ndarray, path: Path) -> None:
    int16 = np.int16(np.clip(buf, -1.0, 1.0) * 32767)
    wavfile.write(str(path), SR, int16)


def save_spectrogram(buf: np.ndarray, ex: Example, path: Path) -> None:
    """STFT spectrogram — visible ridge and (when underdamped) the ripple."""
    f, t, Sxx = spectrogram(
        buf.astype(np.float64),
        fs=SR,
        nperseg=2048,
        noverlap=1792,
        window="hann",
        scaling="spectrum",
    )
    # log magnitude
    eps = 1e-12
    db = 10 * np.log10(Sxx + eps)
    db = np.clip(db, db.max() - 60, db.max())

    # restrict frequency view to a comfortable window around the slide
    f_lo = max(20.0, min(ex.f0, ex.f_target) * 0.6)
    f_hi = max(ex.f0, ex.f_target) * 5.5
    mask = (f >= f_lo) & (f <= f_hi)

    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=110)
    ax.pcolormesh(t, f[mask], db[mask], shading="auto", cmap="viridis")
    ax.set_xlabel("time (s)")
    ax.set_ylabel("frequency (Hz)")
    ax.set_title(f"#{ex.idx:02d} — {ex.name}\n(regime hidden in quiz mode)")
    ax.set_ylim(f_lo, f_hi)
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)


# --------------------------------------------------------------------------
# The curated 12-example set
# --------------------------------------------------------------------------

EXAMPLES: list[Example] = [
    Example(
        idx=1,
        name="trombone slide, slow and surrendering",
        regime="overdamped",
        physical_system="trombone — heavy slide, long air column, brass damps overshoot",
        f0=220.0, f_target=329.63, zeta=1.6, wn=10.0,
        harmonics=[(2.0, 0.25, 1.0), (3.0, 0.15, 1.0), (4.0, 0.08, 1.0)],
        teaching_note="Smooth exponential approach — no overshoot, no ripple. Listen for the lack of arrival 'thump'.",
    ),
    Example(
        idx=2,
        name="theremin glide, hand drifting through space",
        regime="overdamped",
        physical_system="theremin — capacitive coupling, no mechanical inertia, glide rate set by hand motion",
        f0=440.0, f_target=660.0, zeta=1.3, wn=7.5,
        harmonics=[(2.0, 0.12, 1.0)],
        teaching_note="Heavy overdamping. The pitch sneaks up on the target. Theremins almost always sound this way.",
    ),
    Example(
        idx=3,
        name="cello slow portamento between long notes",
        regime="overdamped",
        physical_system="cello — bowed string, finger slides slowly with steady bow",
        f0=174.61, f_target=261.63, zeta=1.4, wn=12.0,
        harmonics=[(2.0, 0.4, 1.0), (3.0, 0.22, 1.0), (4.0, 0.12, 1.0), (5.0, 0.06, 1.0)],
        teaching_note="String harmonics ride the smooth glide. No overshoot — the bow stabilizes the trajectory.",
    ),
    Example(
        idx=4,
        name="lap steel sustained slide",
        regime="overdamped",
        physical_system="pedal/lap steel — heavy bar, slow controlled finger motion",
        f0=196.0, f_target=246.94, zeta=2.0, wn=8.0,
        harmonics=[(2.0, 0.3, 1.0), (3.0, 0.18, 1.0), (4.0, 0.10, 1.0)],
        teaching_note="Even heavier damping than the cello — clearly languid, surrender-like.",
    ),
    Example(
        idx=5,
        name="purposeful synth glide",
        regime="critically_damped",
        physical_system="synthesizer — engineered glide circuit tuned for fastest no-overshoot arrival",
        f0=220.0, f_target=440.0, zeta=1.0, wn=20.0,
        harmonics=[(2.0, 0.2, 1.0), (3.0, 0.1, 1.0)],
        teaching_note="Arrives decisively and stops. No ringing, no lag. Classic Moog-style portamento.",
    ),
    Example(
        idx=6,
        name="trained singer landing on the note",
        regime="critically_damped",
        physical_system="trained vocalist — disciplined laryngeal control, arrives without overshoot",
        f0=261.63, f_target=392.0, zeta=1.0, wn=18.0,
        harmonics=[(2.0, 0.45, 1.0), (3.0, 0.28, 1.0), (4.0, 0.18, 1.0), (5.0, 0.10, 1.0), (6.0, 0.05, 1.0)],
        teaching_note="A controlled vocal arrival — no perceptible overshoot. Compare to example #10 (untrained singer).",
    ),
    Example(
        idx=7,
        name="kalimba tine settling after pluck",
        regime="critically_damped",
        physical_system="kalimba — tine has high stiffness and clamped boundary, settles fast",
        f0=523.25, f_target=659.25, zeta=1.0, wn=35.0,
        harmonics=[(2.0, 0.15, 1.0), (3.0, 0.07, 1.0)],
        teaching_note="The settling time is very short — a quick decisive arrival, almost like a plucked attack.",
    ),
    Example(
        idx=8,
        name="acoustic guitar string bend, controlled release",
        regime="critically_damped",
        physical_system="guitar — bend released with discipline, string tension settles fast",
        f0=330.0, f_target=247.0, zeta=1.0, wn=22.0,
        harmonics=[(2.0, 0.3, 1.0), (3.0, 0.18, 1.0), (4.0, 0.10, 1.0)],
        teaching_note="Downward critically-damped — same regime, different direction. Listen for the lack of ring-back.",
    ),
    Example(
        idx=9,
        name="bell strike, retuned by a transient blow",
        regime="underdamped",
        physical_system="bell — light strike that detunes; resonance rings around target",
        f0=587.33, f_target=440.0, zeta=0.18, wn=14.0,
        harmonics=[(2.43, 0.5, 0.95), (3.86, 0.3, 0.92), (5.5, 0.18, 0.88)],
        teaching_note="Underdamped + inharmonic. The pitch rings BELOW target and bounces back — hear the wobble.",
    ),
    Example(
        idx=10,
        name="untrained singer overshooting from below",
        regime="underdamped",
        physical_system="untrained vocalist — laryngeal muscle ramp overshoots; settles slightly flat then sharp",
        f0=220.0, f_target=329.63, zeta=0.3, wn=12.0,
        harmonics=[(2.0, 0.45, 1.0), (3.0, 0.28, 1.0), (4.0, 0.18, 1.0), (5.0, 0.10, 1.0)],
        teaching_note="Audible overshoot above the target, then settle. This is the *characteristic* aliveness of an untrained voice.",
    ),
    Example(
        idx=11,
        name="electric guitar fast bend with finger vibrato",
        regime="underdamped",
        physical_system="guitar — fast bend, string tension overshoots, finger relaxes back",
        f0=440.0, f_target=523.25, zeta=0.25, wn=16.0,
        harmonics=[(2.0, 0.35, 1.0), (3.0, 0.22, 1.0), (4.0, 0.14, 1.0), (5.0, 0.08, 1.0)],
        teaching_note="Listen for the sharp arrival then return — this is the 'cry' character of an expressive bend.",
    ),
    Example(
        idx=12,
        name="prepared piano string — complex inharmonic settling",
        regime="underdamped",
        physical_system="prepared piano — object on string changes mode geometry, each mode rings at its own rate",
        f0=146.83, f_target=220.0, zeta=0.4, wn=10.0,
        harmonics=[(2.1, 0.5, 0.85), (3.4, 0.3, 0.72), (4.8, 0.2, 0.60), (6.3, 0.12, 0.50)],
        teaching_note="Multi-modal: each harmonic settles at its own zeta/wn. The TIMBRE changes during the glide.",
    ),
]


def file_slug(ex: Example) -> str:
    return f"{ex.idx:02d}-{ex.regime.replace('_', '-')}"


def main() -> None:
    manifest = []
    for ex in EXAMPLES:
        slug = file_slug(ex)
        wav_path = AUDIO_DIR / f"{slug}.wav"
        spec_path = SPEC_DIR / f"{slug}.png"
        buf = synthesize(ex)
        save_wav(buf, wav_path)
        save_spectrogram(buf, ex, spec_path)
        manifest.append({
            "idx": ex.idx,
            "slug": slug,
            "wav": f"audio/{slug}.wav",
            "spectrogram": f"spectrograms/{slug}.png",
            "regime": ex.regime,
            "name": ex.name,
            "physical_system": ex.physical_system,
            "f0_hz": ex.f0,
            "f_target_hz": ex.f_target,
            "zeta": ex.zeta,
            "wn_rad_per_s": ex.wn,
            "harmonics": ex.harmonics,
            "teaching_note": ex.teaching_note,
        })
        print(f"  rendered #{ex.idx:02d} [{ex.regime}] -> {wav_path.name}")

    manifest_path = HERE / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump({
            "set": "curated-ear-set",
            "project": "Portamento and Physical Pitch Modeling",
            "generator": "render.py",
            "examples": manifest,
            "sample_rate_hz": SR,
            "clip_duration_s": CLIP_DUR,
        }, f, indent=2)
    print(f"\nmanifest written to {manifest_path}")


if __name__ == "__main__":
    main()
