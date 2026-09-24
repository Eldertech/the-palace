"""Pitch verification for the AI-source probe.

Given a rendered WAV and the pitch we asked for, answer two questions:

  accuracy   how far did it land from the target? Median cents over the
             voiced frames — and the same number folded into one octave,
             so "right note, wrong octave" shows up as its own thing.
  stability  does the note hold still? How tightly the voiced frames sit
             around their own median (spread, dominance, drift).

A sampler can fix a wrong note. It cannot fix a wandering one: a render
that holds a steady pitch 40 cents flat, or an octave high, still maps
cleanly with `pitch_keycenter` + `tune`. So there are three grades:

  on_target  stable, and within max_cents_err of what we asked for
  retunable  stable, but off target — usable once remapped
  texture    not stable enough to multisample

Tracker: librosa.pyin when librosa is installed (the Mac probe venv has
it); otherwise a numpy YIN, so the grader runs anywhere numpy does.
Both search three octaves below the target and two above.
"""
from __future__ import annotations
import json
import math
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
HOP = 512
EDGE_CENTS = 15.0            # a median this close to the band edge is the tracker pinned there
# Search floor: three octaves under the target. It was two until cycle 25,
# which put the floor exactly where MusicGen's high violin takes land (two
# octaves down, steady, 100% voiced) — so the edge rule threw real notes out
# as "pinned". One more octave of room tells a note from a tracker at its floor.
FLOOR_DIV = 8.0


# ── loading ──────────────────────────────────────────────────────────────
def load_wav(path: str) -> tuple[np.ndarray, int]:
    try:
        import soundfile as sf
        y, sr = sf.read(path, always_2d=False)
    except ImportError:
        try:
            from scipy.io import wavfile
            sr, y = wavfile.read(path)
            if y.dtype.kind == "i":
                y = y / float(np.iinfo(y.dtype).max)
            elif y.dtype.kind == "u":
                y = (y.astype(np.float64) - 128.0) / 128.0
        except ImportError:
            with wave.open(path) as w:
                sr, ch = w.getframerate(), w.getnchannels()
                y = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2") / 32768.0
                if ch > 1:
                    y = y.reshape(-1, ch)
    y = np.asarray(y, dtype=np.float64)
    if y.ndim == 2:
        y = y.mean(axis=1)
    return y, int(sr)


# ── where the note is ────────────────────────────────────────────────────
def analysis_window(y: np.ndarray, sr: int, floor_db: float = -30.0,
                    skip_attack_sec: float = 0.10) -> tuple[int, int]:
    """From just after the onset to the last frame within floor_db of the
    loudest frame. Same idea as the Phoneme Choir onset trim."""
    frame = 2048
    if len(y) < frame * 2:
        return 0, len(y)
    n = 1 + (len(y) - frame) // HOP
    idx = np.arange(frame)[None, :] + HOP * np.arange(n)[:, None]
    rms = np.sqrt(np.mean(y[idx] ** 2, axis=1) + 1e-20)
    db = 20 * np.log10(rms / rms.max())
    loud = np.where(db > floor_db)[0]
    start = loud[0] * HOP + int(skip_attack_sec * sr)
    end = loud[-1] * HOP + frame
    if end - start < int(0.25 * sr):
        start = loud[0] * HOP
    return int(start), int(min(end, len(y)))


# ── trackers ─────────────────────────────────────────────────────────────
def yin_track(y: np.ndarray, sr: int, fmin: float, fmax: float,
              threshold: float = 0.15) -> np.ndarray:
    """Frame-wise YIN (de Cheveigne & Kawahara 2002). NaN = unvoiced."""
    tau_min = max(2, int(math.floor(sr / fmax)))
    tau_max = int(math.ceil(sr / fmin))
    W = max(1024, 2 * tau_max)
    need = W + tau_max + 1
    if len(y) < need:
        return np.array([])
    n_fft = 1 << int(math.ceil(math.log2(W + need)))
    taus = np.arange(tau_max + 1)
    starts = range(0, len(y) - need + 1, HOP)
    f0 = np.full(len(starts), np.nan)
    gate = 1e-3 * np.max(np.abs(y))
    for i, s in enumerate(starts):
        seg = y[s:s + need]
        x = seg[:W]
        if np.sqrt(np.mean(x * x)) < gate:
            continue
        corr = np.fft.irfft(np.conj(np.fft.rfft(x, n_fft)) * np.fft.rfft(seg, n_fft),
                            n_fft)[:tau_max + 1]
        c = np.concatenate(([0.0], np.cumsum(seg * seg)))
        d = np.dot(x, x) + (c[taus + W] - c[taus]) - 2 * corr
        d[0] = 0.0
        cmnd = np.ones_like(d)
        cmnd[1:] = d[1:] * taus[1:] / np.maximum(np.cumsum(d[1:]), 1e-12)
        below = np.where(cmnd[tau_min:tau_max + 1] < threshold)[0]
        if len(below) == 0:
            continue
        t = int(below[0]) + tau_min
        while t + 1 <= tau_max and cmnd[t + 1] < cmnd[t]:
            t += 1
        shift = 0.0
        if tau_min <= t - 1 and t + 1 <= tau_max:
            a, b, cc = cmnd[t - 1], cmnd[t], cmnd[t + 1]
            den = a - 2 * b + cc
            if abs(den) > 1e-12:
                shift = 0.5 * (a - cc) / den
        f0[i] = sr / (t + shift)
    return f0


def track(y: np.ndarray, sr: int, target_hz: float) -> tuple[np.ndarray, str]:
    fmin = max(27.5, target_hz / FLOOR_DIV)
    fmax = min(sr / 2.0 - 100.0, target_hz * 4.0)
    try:
        import librosa
    except ImportError:
        return yin_track(y, sr, fmin, fmax), "yin-numpy"
    frame = 4096 if sr / fmin > 1024 else 2048
    f0, _, _ = librosa.pyin(y, fmin=fmin, fmax=fmax, sr=sr,
                            frame_length=frame, hop_length=HOP, fill_na=np.nan)
    return f0, f"pyin-librosa-{librosa.__version__}"


def refine_hz(y: np.ndarray, sr: int, hz_guess: float, band_cents: float = 100.0):
    """Sub-cent pitch for a steady note: YIN restricted to +-band_cents
    around the tracker's median, then the median over frames. The frame
    tracker decides *whether* the note is steady; this decides *exactly
    where* it sits, which the SFZ tune value needs (pyin alone reports on a
    10-cent grid).

    Not a whole-window autocorrelation: tried first, and on the crystal's
    inharmonic partials it read C4 17 cents flat where pyin, YIN and an FFT
    peak all agreed within 2 cents. Per-frame YIN medians do not drift that
    way."""
    lo = hz_guess * 2 ** (-band_cents / 1200)
    hi = hz_guess * 2 ** (band_cents / 1200)
    f0 = yin_track(y, sr, lo, hi)
    f0 = f0[np.isfinite(f0)] if len(f0) else f0
    if len(f0) < 5:
        return None
    return float(np.median(f0))


# ── grading ──────────────────────────────────────────────────────────────
def hz_to_midi(hz: float) -> float:
    return 69.0 + 12.0 * math.log2(hz / 440.0)


def grade(f0: np.ndarray, target_hz: float, acc: dict, refine=None) -> dict:
    n_frames = int(len(f0))
    voiced = f0[np.isfinite(f0)]
    voiced_pct = len(voiced) / max(1, n_frames)
    out = {"frames": n_frames, "voiced_pct": round(voiced_pct, 3)}
    if len(voiced) < 5:
        return {**out, "grade": "texture", "reason": "almost no steady pitch found",
                "measured_hz": None, "cents_err": None}

    cents = 1200.0 * np.log2(voiced / target_hz)
    med = float(np.median(cents))
    pc = ((med + 600.0) % 1200.0) - 600.0          # folded into one octave
    octave = int(round((med - pc) / 1200.0))
    q75, q25 = np.percentile(cents, [75, 25])
    spread = float(q75 - q25)
    dominance = float(np.mean(np.abs(cents - med) <= acc["dominance_band_cents"]))
    third = max(1, len(cents) // 3)
    drift = float(np.median(cents[-third:]) - np.median(cents[:third]))
    reasons = []
    if voiced_pct < acc["min_voiced_pct"]:
        reasons.append(f"voiced {voiced_pct:.0%} < {acc['min_voiced_pct']:.0%}")
    if spread > acc["max_spread_cents"]:
        reasons.append(f"spread {spread:.0f}c > {acc['max_spread_cents']}c")
    if dominance < acc["min_dominance"]:
        reasons.append(f"only {dominance:.0%} of frames near one pitch")
    # A median sitting on the edge of the search band is the tracker pinned
    # at its floor or ceiling, not a note: the first Mac run graded a
    # Stable Audio bass "exactly 2400c flat, 0c spread" and every key built
    # from it failed the keycheck. Same edges as track().
    edge_lo = 1200.0 * math.log2(max(27.5, target_hz / FLOOR_DIV) / target_hz)
    if med <= edge_lo + EDGE_CENTS or med >= 2400.0 - EDGE_CENTS:
        reasons.append("pinned at the edge of the pitch search, not a note")
    stable = not reasons
    refined = False
    if stable and refine is not None:
        hz = refine(float(target_hz * 2.0 ** (med / 1200.0)))
        if hz:
            med = 1200.0 * math.log2(hz / target_hz)
            pc = ((med + 600.0) % 1200.0) - 600.0
            octave = int(round((med - pc) / 1200.0))
            refined = True
    if stable and abs(med) <= acc["max_cents_err"]:
        g = "on_target"
    elif stable:
        g = "retunable"
        reasons.append(f"octave {octave:+d}" if octave else f"off by {med:+.0f}c")
    else:
        g = "texture"

    measured = float(target_hz * 2.0 ** (med / 1200.0))
    m = hz_to_midi(measured)
    key = int(round(m))
    return {**out, "grade": g, "reason": "; ".join(reasons) or "clean",
            "measured_hz": round(measured, 3), "cents_err": round(med, 2),
            "pitch_class_err": round(pc, 2), "octave_off": octave,
            "spread_cents": round(spread, 2), "dominance": round(dominance, 3),
            "drift_cents": round(drift, 2), "refined": refined,
            # what the SFZ region would say if we kept this render
            "sfz_keycenter": key, "sfz_tune": int(round(-(m - key) * 100))}


def verify(wav_path: str, target_hz: float, acceptance: dict | None = None) -> dict:
    acc = acceptance or json.loads((HERE / "matrix.json").read_text())["acceptance"]
    y, sr = load_wav(wav_path)
    a, b = analysis_window(y, sr)
    f0, method = track(y[a:b], sr, target_hz)
    return {"target_hz": float(target_hz), "method": method,
            "window_sec": [round(a / sr, 3), round(b / sr, 3)],
            **grade(np.asarray(f0, dtype=float), target_hz, acc,
                    refine=lambda hz: refine_hz(y[a:b], sr, hz))}


if __name__ == "__main__":
    import sys
    print(json.dumps(verify(sys.argv[1], float(sys.argv[2])), indent=2))
