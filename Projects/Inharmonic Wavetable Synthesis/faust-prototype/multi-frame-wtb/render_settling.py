#!/usr/bin/env python3
"""Render the multi-frame Wavetable-B scanner in pure numpy.

Cycle 7 of the Inharmonic Wavetable Synthesis steward. Cycle 6 built the
N-frame scanner as Faust (wtb_scanner.dsp) but Faust is not installed here,
so the settling trajectory had never actually been heard. This renderer is
the offline twin: it reads the same piano-settling.wtb.json frame table the
.dsp embeds and synthesizes it with a per-sample phase accumulator, so the
frequency of every partial genuinely moves while the note rings.

Engine, per partial n (1-based):
    f_n(t) = n * f0 * 2^(Bdepth * cents_n(scan(t)) / 1200)
    phase_n(t) = 2*pi * cumsum(f_n / fs)
    out(t) = sum_n A_n(t) * sin(phase_n(t))
"""
import json, math, wave, struct, pathlib
import numpy as np

HERE = pathlib.Path(__file__).parent
FS = 48000
F0 = 110.0          # A2 — same root the Crystal Synthesizer proofs use
DUR = 3.0
NP = 32

d = json.load(open(HERE / "piano-settling.wtb.json"))
FRAMES = np.array(d["frames"], dtype=np.float64)      # (16, 32) cents
NF = FRAMES.shape[0]

n = np.arange(1, NP + 1, dtype=np.float64)


def wtA_saw():
    """Wavetable A, saw-ish: 1/n amplitudes."""
    return 1.0 / n


def amp_env(t):
    """Per-partial amplitude: shared attack, upper partials decay faster —
    a plain physical reading of a struck string."""
    atk = np.clip(t / 0.004, 0, 1)
    tau = 2.4 / (1.0 + 0.11 * (n - 1))                # seconds, per partial
    return atk[None, :] * np.exp(-t[None, :] / tau[:, None])


def scan_cents(t, mode):
    """Scan position through the frame table -> per-partial cents, per sample."""
    if mode == "settle":
        pos = np.clip(t / 1.6, 0, 1) ** 0.6           # sweep attack -> settled
    elif mode == "frozen":
        pos = np.zeros_like(t)                        # stuck at the attack frame
    elif mode == "flat":
        return np.zeros((NP, t.size))
    else:
        raise ValueError(mode)
    fi = pos * (NF - 1)
    lo = np.floor(fi).astype(int)
    hi = np.minimum(lo + 1, NF - 1)
    fr = (fi - lo)[None, :]
    return FRAMES[lo].T * (1 - fr) + FRAMES[hi].T * fr


def render(mode, bdepth=1.0, dur=DUR):
    t = np.arange(int(FS * dur)) / FS
    cents = scan_cents(t, mode)                       # (NP, T)
    f = n[:, None] * F0 * np.power(2.0, bdepth * cents / 1200.0)
    f = np.minimum(f, FS * 0.45)                      # antialias guard
    ph = 2 * np.pi * np.cumsum(f / FS, axis=1)
    y = (wtA_saw()[:, None] * amp_env(t) * np.sin(ph)).sum(axis=0)
    return y


def write_wav(path, y, peak=0.89):
    y = y / (np.max(np.abs(y)) + 1e-12) * peak
    data = (y * 32767).astype("<i2").tobytes()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(FS)
        w.writeframes(data)
    print(f"wrote {path.name}  {len(y)/FS:.2f}s")


if __name__ == "__main__":
    gap = np.zeros(int(FS * 0.45))
    flat = render("flat")
    settle = render("settle")
    frozen = render("frozen")
    write_wav(HERE / "settling-flat-baseline.wav", flat)
    write_wav(HERE / "settling-piano.wav", settle)
    write_wav(HERE / "settling-frozen-attack.wav", frozen)
    write_wav(HERE / "settling-piano-plausible.wav", render("settle", bdepth=0.25))
    write_wav(HERE / "settling-ABC.wav",
              np.concatenate([flat, gap, settle, gap, frozen]))
    # reported numbers
    print("frame 0  partial 32 :", round(FRAMES[0, -1], 1), "cents")
    print("frame 15 partial 32 :", round(FRAMES[-1, -1], 1), "cents")
    print("partial 32 f at attack :", round(32 * F0 * 2 ** (FRAMES[0, -1] / 1200), 1), "Hz vs harmonic", 32 * F0)
