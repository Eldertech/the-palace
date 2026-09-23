"""
Semantic Delay — Stage 4: the rhythmic/melodic coupling layer
=============================================================

Stage 4 of the Phase 1 plan, made concrete: the phrase's own F0 contour becomes
the `target_f0` for every spirit's `convert` call, and **one knob** — the
coupling coefficient K — decides how tightly each returned tap tracks it.

The knob is Kuramoto's, read in the log-pitch domain. Each tap is an oscillator
with its own natural pitch behaviour (a centre, a drift, a vibrato — the
spirit's `conatus`, its striving to sing as itself). The original phrase is the
other oscillator. Per frame:

    p[n+1] = p[n] + alpha * ( K*(target[n] - p[n]) + (1-K)*(free[n] - p[n]) )

At **K = 1** the tap is phase-locked: it sings the original melody exactly, and
the effect is pure voice-swap. At **K = 0** it is free-running: the spirit
ignores the source and sings its own line over the source's rhythm. Between
them the tap hears the melody as a suggestion — the near-misses and syncopations
the home entry asks for. As K relaxes, a scale-quantizer also fades in with
weight (1-K): a loosely coupled spirit doesn't just drift, it drifts *onto a
grid*, which is what keeps the relaxed settings musical instead of merely sour.

Voicing is never invented: an unvoiced source frame stays 0.0 Hz out, matching
the SVC F0 convention (Hz floats, 0.0 = unvoiced).
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from f0 import f0_to_midi, midi_to_f0

# Minor pentatonic on A — the grid a relaxed spirit falls onto.
DEFAULT_SCALE = (0, 3, 5, 7, 10)


@dataclass
class Spirit:
    """A tap's own voice: where it naturally sits and how it naturally moves."""
    name: str
    center_midi: float = 50.0
    vibrato_hz: float = 4.5
    vibrato_semitones: float = 0.35
    drift_semitones: float = 1.5     # slow random walk amplitude
    seed: int = 0
    scale: tuple = field(default=DEFAULT_SCALE)
    scale_root_midi: int = 45        # A2


def free_contour(spirit: Spirit, n_frames: int, hop_sec: float) -> np.ndarray:
    """The spirit's own line if nobody sang to it — MIDI floats."""
    rng = np.random.default_rng(spirit.seed)
    t = np.arange(n_frames, dtype=np.float64) * hop_sec
    vib = spirit.vibrato_semitones * np.sin(2 * np.pi * spirit.vibrato_hz * t)
    # Slow random walk, smoothed, normalised to the drift amplitude.
    walk = np.cumsum(rng.standard_normal(n_frames))
    if n_frames > 1 and np.ptp(walk) > 0:
        walk = walk - walk.mean()
        walk = walk / (np.max(np.abs(walk)) + 1e-9) * spirit.drift_semitones
    return spirit.center_midi + vib + walk


def _quantize_to_scale(midi: np.ndarray, spirit: Spirit) -> np.ndarray:
    """Snap each MIDI value to the nearest scale degree (any octave)."""
    scale = np.array(spirit.scale, dtype=np.float64)
    rel = midi - spirit.scale_root_midi
    octave = np.floor(rel / 12.0)
    pc = rel - octave * 12.0
    # nearest degree, considering the wrap to the next octave's root
    cands = np.concatenate([scale, scale + 12.0])
    idx = np.argmin(np.abs(pc[:, None] - cands[None, :]), axis=1)
    return spirit.scale_root_midi + octave * 12.0 + cands[idx]


def couple(
    target_f0: np.ndarray,
    spirit: Spirit,
    K: float,
    *,
    hop_sec: float = 0.010,
    alpha: float = 0.35,
) -> np.ndarray:
    """Return the tap's F0 (Hz, 0.0 unvoiced) for coupling strength K in [0,1]."""
    K = float(np.clip(K, 0.0, 1.0))
    tgt = f0_to_midi(target_f0)                  # NaN where unvoiced
    n = len(tgt)
    free = free_contour(spirit, n, hop_sec)

    # Coasting target: hold the last voiced pitch through unvoiced gaps so the
    # oscillator has something to lock to instead of snapping to the centre.
    coast = np.copy(tgt)
    last = spirit.center_midi
    for i in range(n):
        if np.isfinite(coast[i]):
            last = coast[i]
        else:
            coast[i] = last

    p = np.empty(n, dtype=np.float64)
    state = coast[0] if n else spirit.center_midi
    for i in range(n):
        state += alpha * (K * (coast[i] - state) + (1.0 - K) * (free[i] - state))
        p[i] = state

    if K < 1.0:
        q = _quantize_to_scale(p, spirit)
        w = 1.0 - K                               # grid fades in as coupling relaxes
        p = (1.0 - w) * p + w * q

    p[~np.isfinite(tgt)] = np.nan                 # never invent voicing
    return midi_to_f0(p)


def coupling_error_semitones(target_f0: np.ndarray, tap_f0: np.ndarray) -> float:
    """Mean |tap - target| in semitones over frames voiced in both. The measure
    the knob is supposed to move: it should rise monotonically as K falls."""
    a, b = f0_to_midi(target_f0), f0_to_midi(tap_f0)
    m = np.isfinite(a) & np.isfinite(b)
    if not np.any(m):
        return 0.0
    return float(np.mean(np.abs(a[m] - b[m])))


def render_contour(
    f0_hz: np.ndarray,
    hop_samples: int,
    sample_rate: int,
    envelope: np.ndarray | None = None,
    *,
    n_harmonics: int = 8,
    gain: float = 0.22,
) -> np.ndarray:
    """Sonify an F0 contour as a buzzy harmonic tone — the *audition* voice.

    This is not the SVC model; it is a stand-in timbre so the coupling knob can
    be heard in the sandbox, where torch does not run. Once Stage 1.5 wires the
    real model Mac-side, the same contour goes out as `target_f0` and the
    timbre arrives from the spirit's prompt wav instead.
    """
    n = len(f0_hz) * hop_samples
    idx = np.minimum(np.arange(n) // hop_samples, len(f0_hz) - 1)
    f_s = np.asarray(f0_hz, dtype=np.float64)[idx]
    voiced = (f_s > 0).astype(np.float64)
    # Smooth the sample-rate frequency track so frame steps do not click.
    k = max(1, hop_samples // 2)
    kern = np.ones(k) / k
    f_s = np.convolve(np.where(f_s > 0, f_s, np.nan_to_num(f_s)), kern, mode="same")
    voiced_s = np.convolve(voiced, kern, mode="same")

    phase = 2 * np.pi * np.cumsum(f_s) / sample_rate
    out = np.zeros(n, dtype=np.float64)
    for h in range(1, n_harmonics + 1):
        out += np.sin(h * phase) / (h ** 1.4)
    out *= voiced_s * gain

    if envelope is not None:
        env = np.interp(np.linspace(0, 1, n), np.linspace(0, 1, len(envelope)), envelope)
        out *= env / (np.max(env) + 1e-9)
    return out.astype(np.float32)


def amplitude_envelope(audio: np.ndarray, hop_samples: int) -> np.ndarray:
    """Per-frame RMS of the source — the rhythm the spirits must keep."""
    n_frames = max(1, len(audio) // hop_samples)
    frames = np.asarray(audio[: n_frames * hop_samples], dtype=np.float64).reshape(n_frames, hop_samples)
    return np.sqrt(np.mean(frames ** 2, axis=1))
