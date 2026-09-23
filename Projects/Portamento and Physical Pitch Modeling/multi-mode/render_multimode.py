#!/usr/bin/env python3
"""
Multi-mode portamento — timbre evolution during a glide.

Extends the second-order pitch model (see the home entry) from ONE frequency
trajectory to a FAMILY of coupled mode trajectories, so the glide has a
timbre that moves, not just a pitch that moves.

Three physical facts are modelled:

1. Stiff-string inharmonicity.  f_n = n * f1 * sqrt(1 + B n^2).
   B is not constant during a glide:
     - finger SLIDE (length changes, tension fixed):  B ∝ 1/L^2 ∝ f1^2
       -> shorter string, stiffer behaviour, partials SPREAD (bell-ward).
     - string BEND (length fixed, tension rises):     B ∝ 1/T ∝ 1/f1^2
       -> partials COMPRESS toward the ideal harmonic series.
   Same pitch interval, opposite timbre trajectory. That contrast is the
   teaching point of this cycle.

2. Per-mode inertia. Each mode chases its own instantaneous target through a
   first-order lag, tau_n = tau1 / sqrt(n): light high modes arrive first,
   the heavy fundamental lags. During a FAST glide the modes are briefly
   out of register with each other — audible as a timbre smear.

3. Kuramoto coupling between modes. The modes share a boundary, so their
   phase deviations from the ideal harmonic lock pull on each other:

       d(delta_n)/dt = 2*pi*(f_n - n*f1) + (K/N) * sum_m sin(delta_m - delta_n)

   K = 0 -> the modes drift apart during the glide and re-settle out of lock.
   K large -> they re-lock, and the glide keeps a fused, single-voice timbre.

Everything integrates at a 4410 Hz control rate, then instantaneous
frequencies are interpolated to audio rate and phase-accumulated.

Outputs: multi-mode/audio/*.wav  +  multi-mode/figures/*.png
"""

from __future__ import annotations

import json
from dataclasses import dataclass, asdict, field
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy.io import wavfile
from scipy.signal import spectrogram

HERE = Path(__file__).parent
AUDIO = HERE / "audio"; AUDIO.mkdir(exist_ok=True)
FIGS = HERE / "figures"; FIGS.mkdir(exist_ok=True)

SR = 44100
CR = 4410          # control rate for the coupled-mode ODE
DUR = 3.5
PREROLL = 0.35
N_MODES = 8


# ---------------------------------------------------------------- pitch model
def damped_trajectory(f0, f_target, zeta, wn, t):
    """f(t) for the second-order pitch model, f(0)=f0, f'(0)=0."""
    delta = f0 - f_target
    if abs(zeta - 1.0) < 1e-4:
        return f_target + delta * (1.0 + wn * t) * np.exp(-wn * t)
    if zeta > 1.0:
        wd = wn * np.sqrt(zeta * zeta - 1.0)
        r1, r2 = -zeta * wn + wd, -zeta * wn - wd
        B = delta / (1.0 - r2 / r1)
        A = delta - B
        return f_target + A * np.exp(r1 * t) + B * np.exp(r2 * t)
    wd = wn * np.sqrt(1.0 - zeta * zeta)
    env = np.exp(-zeta * wn * t)
    return f_target + delta * env * (
        np.cos(wd * t) + (zeta / np.sqrt(1.0 - zeta * zeta)) * np.sin(wd * t)
    )


@dataclass
class Case:
    idx: int
    name: str
    geometry: str            # "ideal" | "slide" | "bend"
    f0: float
    f_target: float
    zeta: float
    wn: float
    B_ref: float             # inharmonicity coefficient at f0
    K: float                 # Kuramoto coupling between mode phases
    tau1: float              # fundamental's mode-lag time constant (s)
    note: str = ""


def mode_targets(f1, geometry, B_ref, f0):
    """Instantaneous target frequency of each mode, shape (T, N)."""
    n = np.arange(1, N_MODES + 1)[None, :]
    f1 = f1[:, None]
    if geometry == "ideal":
        B = np.zeros_like(f1)
    elif geometry == "slide":          # fixed tension, length shrinks: B ∝ f1^2
        B = B_ref * (f1 / f0) ** 2
    elif geometry == "bend":           # fixed length, tension rises: B ∝ 1/f1^2
        B = B_ref * (f0 / f1) ** 2
    else:
        raise ValueError(geometry)
    return n * f1 * np.sqrt(1.0 + B * n * n), B[:, 0]


def run_case(c: Case):
    n_ctrl = int(round(CR * DUR))
    n_pre = int(round(CR * PREROLL))
    t_slide = np.arange(n_ctrl - n_pre) / CR
    f1 = np.concatenate([
        np.full(n_pre, c.f0),
        damped_trajectory(c.f0, c.f_target, c.zeta, c.wn, t_slide),
    ])
    f_tgt, B_t = mode_targets(f1, c.geometry, c.B_ref, c.f0)

    n = np.arange(1, N_MODES + 1)
    tau = c.tau1 / np.sqrt(n)                      # higher modes track faster
    dt = 1.0 / CR

    # (2) per-mode first-order lag toward the instantaneous target
    f_act = np.empty_like(f_tgt)
    f_act[0] = f_tgt[0]
    a = np.exp(-dt / tau)
    for i in range(1, n_ctrl):
        f_act[i] = a * f_act[i - 1] + (1 - a) * f_tgt[i]

    # (3) Kuramoto coupling on phase deviation from the ideal harmonic lock
    delta = np.zeros(N_MODES)
    dev = np.empty_like(f_act)
    f_eff = np.empty_like(f_act)
    for i in range(n_ctrl):
        drive = 2 * np.pi * (f_act[i] - n * f_act[i, 0] if False else f_act[i] - n * f1[i])
        if c.K > 0:
            pull = (c.K / N_MODES) * np.sum(
                np.sin(delta[None, :] - delta[:, None]), axis=1)
        else:
            pull = 0.0
        ddelta = drive + pull
        delta = delta + ddelta * dt
        dev[i] = delta
        # coupling acts back on the audible frequency of each mode
        f_eff[i] = n * f1[i] + ddelta / (2 * np.pi)

    # ---- audio: interpolate control-rate frequencies to audio rate
    n_aud = int(round(SR * DUR))
    t_a = np.arange(n_aud) / SR
    t_c = np.arange(n_ctrl) / CR
    amp = 1.0 / (n ** 1.25)
    out = np.zeros(n_aud)
    for k in range(N_MODES):
        f_a = np.interp(t_a, t_c, f_eff[:, k])
        ph = 2 * np.pi * np.cumsum(f_a) / SR
        out += amp[k] * np.sin(ph)

    fade = int(0.012 * SR)
    w = np.ones(n_aud)
    w[:fade] = np.linspace(0, 1, fade)
    w[-fade:] = np.linspace(1, 0, fade)
    out *= w
    out = out / np.max(np.abs(out)) * 0.707

    # ---- timbre metrics
    centroid = np.sum(f_eff * amp[None, :], axis=1) / np.sum(amp)
    # inharmonicity in cents: how far mode 6 sits from 6*f1
    ih_cents = 1200 * np.log2(np.maximum(f_eff[:, 5], 1e-6) / (6 * f1))
    return dict(f1=f1, f_eff=f_eff, f_tgt=f_tgt, B=B_t, dev=dev,
                centroid=centroid, ih_cents=ih_cents, t=t_c,
                audio=out.astype(np.float32))


CASES = [
    Case(1, "ideal-harmonic-control", "ideal", 196.0, 392.0, 1.0, 9.0,
         B_ref=0.0, K=0.0, tau1=0.004,
         note="Control. No stiffness, no lag worth hearing — pitch moves, timbre does not."),
    Case(2, "slide-up-the-neck", "slide", 196.0, 392.0, 1.0, 9.0,
         B_ref=0.0009, K=0.0, tau1=0.05,
         note="Finger slides toward the bridge at fixed tension. B grows as f1^2, partials spread — the tone walks toward a bell."),
    Case(3, "bend-into-tune", "bend", 196.0, 392.0, 1.0, 9.0,
         B_ref=0.0009, K=0.0, tau1=0.05,
         note="Same octave, raised by tension instead of length. B falls, partials compress toward the ideal series — the tone walks toward a pure string."),
    Case(4, "fast-glide-uncoupled", "slide", 196.0, 392.0, 0.55, 30.0,
         B_ref=0.0009, K=0.0, tau1=0.09,
         note="Fast underdamped glide, modes uncoupled. They lag by different amounts and arrive out of register — audible smear through the overshoot."),
    Case(5, "fast-glide-locked", "slide", 196.0, 392.0, 0.55, 30.0,
         B_ref=0.0009, K=9.0, tau1=0.09,
         note="Identical glide with Kuramoto coupling K=9. The modes pull each other back into lock and the tone stays fused through the same overshoot."),
]


def save_wav(buf, path):
    wavfile.write(str(path), SR, np.int16(np.clip(buf, -1, 1) * 32767))


def figure(results):
    fig, axes = plt.subplots(3, len(CASES), figsize=(4.0 * len(CASES), 9.5), dpi=105)
    for j, (c, r) in enumerate(zip(CASES, results)):
        ax = axes[0, j]
        for k in range(N_MODES):
            ax.plot(r["t"], r["f_eff"][:, k], lw=1.0)
        ax.set_title(f"{c.idx}. {c.name}", fontsize=10)
        ax.set_ylim(0, 3600); ax.set_ylabel("partials (Hz)" if j == 0 else "")

        ax = axes[1, j]
        ax.plot(r["t"], r["ih_cents"], color="#c1440e", lw=1.4)
        ax.axhline(0, color="#888", lw=0.7)
        ax.set_ylim(-20, 200)
        ax.set_ylabel("6th partial vs 6·f1 (cents)" if j == 0 else "")

        ax = axes[2, j]
        ax.plot(r["t"], r["centroid"], color="#1f4e79", lw=1.4)
        ax.set_ylim(150, 1200)
        ax.set_xlabel("time (s)")
        ax.set_ylabel("spectral centroid (Hz)" if j == 0 else "")
    fig.suptitle("Multi-mode portamento — the timbre moves with the pitch", fontsize=13)
    fig.tight_layout(rect=(0, 0, 1, 0.97))
    p = FIGS / "timbre-evolution.png"
    fig.savefig(p); plt.close(fig)
    return p


def spec_ab(results):
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.4), dpi=110)
    for ax, idx, title in ((axes[0], 3, "4. uncoupled — modes drift out of register"),
                           (axes[1], 4, "5. K=9 — modes re-lock, tone stays fused")):
        f, t, S = spectrogram(results[idx]["audio"].astype(float), fs=SR,
                              nperseg=2048, noverlap=1792, window="hann")
        db = 10 * np.log10(S + 1e-12); db = np.clip(db, db.max() - 62, db.max())
        m = (f >= 100) & (f <= 3600)
        ax.pcolormesh(t, f[m], db[m], shading="auto", cmap="magma")
        ax.set_title(title, fontsize=10); ax.set_xlabel("time (s)")
    axes[0].set_ylabel("frequency (Hz)")
    fig.tight_layout()
    p = FIGS / "coupling-ab-spectrogram.png"
    fig.savefig(p); plt.close(fig)
    return p


def main():
    results = []
    manifest = []
    for c in CASES:
        r = run_case(c)
        results.append(r)
        wav = AUDIO / f"{c.idx:02d}-{c.name}.wav"
        save_wav(r["audio"], wav)
        manifest.append(dict(
            **{k: v for k, v in asdict(c).items()},
            wav=str(wav.relative_to(HERE)),
            final_inharmonicity_cents=round(float(r["ih_cents"][-1]), 2),
            start_inharmonicity_cents=round(float(r["ih_cents"][0]), 2),
            centroid_start_hz=round(float(r["centroid"][0]), 1),
            centroid_end_hz=round(float(r["centroid"][-1]), 1),
            max_mode_deviation_cents=round(float(np.max(np.abs(
                1200 * np.log2(np.maximum(r["f_eff"], 1e-6) /
                               np.maximum(r["f_tgt"], 1e-6))))), 2),
            peak_lock_error_cents=round(float(np.max(np.abs(r["ih_cents"]))), 2),
        ))
        print(f"{c.idx}. {c.name}: inharm {manifest[-1]['start_inharmonicity_cents']} -> "
              f"{manifest[-1]['final_inharmonicity_cents']} cents, "
              f"centroid {manifest[-1]['centroid_start_hz']} -> {manifest[-1]['centroid_end_hz']} Hz, "
              f"peak mode lag {manifest[-1]['max_mode_deviation_cents']} cents, "
              f"peak lock error {manifest[-1]['peak_lock_error_cents']} cents")
    p1 = figure(results); p2 = spec_ab(results)
    (HERE / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print("figures:", p1.name, p2.name)


if __name__ == "__main__":
    main()
