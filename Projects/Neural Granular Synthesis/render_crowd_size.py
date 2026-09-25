#!/usr/bin/env python3
"""
How big does the crowd have to be? — cycle 7 of Neural Granular Synthesis.

The entry's open question: "What is the minimum population size for
perceptually stable timbres?" This script answers it by measurement.

Every neuron owns one grain voice with its own pitch, drawn once from a
population-wide band (a ~7-semitone spread around 330 Hz). The timbre of the
crowd is therefore a STATISTIC of the population — its spectral centroid is an
average over whoever happened to fire. Then we grow the crowd:

    N = 4, 8, 16, 32, 64, 128, 256, 512

at three couplings (drift K=0, loose K=0.2 near the locking edge, locked K=1.6, mean-field ring from
kernel_lib), and in sliding 250 ms windows we measure how much the crowd's
brightness (spectral centroid, in cents) and loudness (RMS, in dB) wobble.
Wobble below a rough just-noticeable line = a stable timbre.

Prediction from counting statistics: for independent firings the wobble falls
like 1/sqrt(N). The interesting part is what synchrony does to that law —
a locked crowd fires TOGETHER, so its members stop being independent samples.

Writes:
  crowd-size-stability.png   brightness + gappiness vs N, mini-rasters of the ladder
  crowd-size-ladder.wav      3 s per rung, drift ladder then locked ladder,
                             each rung at matched loudness (so you hear
                             steadiness grow, not volume)
  crowd-size-table.json      the measured numbers
"""
import sys, json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy.io import wavfile

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from kernel_lib import RingPopulation, ring_kernel

NS = [4, 8, 16, 32, 64, 128, 256, 512]
KS = [("DRIFT", 0.0), ("LOOSE", 0.2), ("LOCKED", 1.6)]
SEEDS = [3, 11, 29]
MEAN_HZ, SIGMA, DT = 6.0, 0.18, 0.001
WARM, REC = 6.0, 4.0
SR, GRAIN = 48000, 0.09
F_CENTER, SPREAD_ST = 330.0, 3.5          # pitch band: +-3.5 semitones (std)
WIN, HOP = 0.25, 0.125
JND_CENTS, JND_DB = 50.0, 1.0             # rough rule-of-thumb lines, not lab values
SEED = 3

BG, PANEL, INK, DIM = "#0b0b0d", "#06060a", "#e7e7ea", "#8a8a93"
COL = {"DRIFT": "#6366f1", "LOOSE": "#33e0c8", "LOCKED": "#f2b134"}


def simulate(N, K, seed=SEED):
    kern = ring_kernel(N, "uniform")
    p = RingPopulation(N, MEAN_HZ, SIGMA, kern, 0.0, K, seed=seed)
    # scramble start phases so every run begins incoherent
    p.phase = np.random.default_rng(seed + 1).uniform(0, 2*np.pi, N)
    for _ in range(int(WARM / DT)):
        p.step(DT)
    spikes, t, rg = [], 0.0, []
    for _ in range(int(REC / DT)):
        for i in p.step(DT):
            spikes.append((t, i))
        rg.append(p.r_global())
        t += DT
    return spikes, float(np.mean(rg))


def voice_pitches(N, seed=SEED):
    rng = np.random.default_rng(seed + 100)
    return F_CENTER * 2 ** (SPREAD_ST * rng.standard_normal(N) / 12)


def render(spikes, pitches):
    n = int(GRAIN * SR)
    tt = np.arange(n) / SR
    env = np.sin(np.pi * np.arange(n) / n) ** 2
    y = np.zeros(int(REC * SR) + n)
    for (t, i) in spikes:
        f = pitches[i]
        g = env * (np.sin(2*np.pi*f*tt) + 0.5*np.sin(4*np.pi*f*tt)
                   + 0.25*np.sin(6*np.pi*f*tt))
        s = int(t * SR)
        y[s:s+n] += g
    return y[:int(REC * SR)]


def headcount_wobble(spikes, pitches):
    """What the crowd 'means' before acoustics: the mean pitch (in cents) of
    the grains that fired in each window. Pure counting statistics."""
    sp = np.array(spikes)
    out = []
    for s in np.arange(0, REC - WIN, HOP):
        m = (sp[:, 0] >= s) & (sp[:, 0] < s + WIN)
        if m.sum():
            out.append(np.mean(1200 * np.log2(pitches[sp[m, 1].astype(int)])))
    return float(np.std(out))


def texture_floor(y, seed=0):
    """Steady noise with the SAME long-term spectrum as y (phases scrambled):
    a sound with no crowd behind it at all. Whatever wobble it shows is the
    fizz of the texture itself, the floor no head-count can go below."""
    Y = np.fft.rfft(y)
    ph = np.exp(2j * np.pi * np.random.default_rng(seed).uniform(size=len(Y)))
    return np.fft.irfft(np.abs(Y) * ph, len(y))


def gappiness(y):
    """Can you hear individual grains? Envelope in 10 ms frames, std/mean.
    A sparse crowd is all holes and bumps (high); a fused texture sits at the
    steady-noise value (~0.5); a locked crowd pulses on the beat (high again)."""
    f = int(0.01 * SR)
    e = np.sqrt(np.mean(y[: len(y) // f * f].reshape(-1, f) ** 2, axis=1))
    return float(np.std(e) / (np.mean(e) + 1e-12))


def wobble(y):
    w, h = int(WIN * SR), int(HOP * SR)
    win = np.hanning(w)
    freqs = np.fft.rfftfreq(w, 1 / SR)
    cents, dbs = [], []
    for s in range(0, len(y) - w, h):
        seg = y[s:s+w]
        rms = np.sqrt(np.mean(seg ** 2)) + 1e-12
        mag = np.abs(np.fft.rfft(seg * win))
        c = (freqs * mag).sum() / (mag.sum() + 1e-12)
        dbs.append(20 * np.log10(rms))
        cents.append(1200 * np.log2(max(c, 1.0)))
    return float(np.std(cents)), float(np.std(dbs))


def main():
    rows, audio, rasters = [], {}, {}
    for name, K in KS:
        for N in NS:
            acc = []
            for sd in SEEDS:
                spikes, r = simulate(N, K, sd)
                pit = voice_pitches(N, sd)
                y = render(spikes, pit)
                wc, wd = wobble(y)
                fc, fd = wobble(texture_floor(y, sd))
                fl = texture_floor(y, sd)
                acc.append((r, len(spikes) / REC, wc, wd, headcount_wobble(spikes, pit), fc, fd,
                            gappiness(y), gappiness(fl)))
                if sd == SEEDS[0]:
                    audio[(name, N)] = y
                    rasters[(name, N)] = spikes
            r, gps, wc, wd, hc, fc, fd, gp, gf = np.mean(acc, axis=0)
            rows.append(dict(coupling=name, K=K, N=N, r=round(r, 3),
                             grains_per_s=round(gps, 1),
                             centroid_wobble_cents=round(wc, 1),
                             loudness_wobble_db=round(wd, 2),
                             headcount_wobble_cents=round(hc, 1),
                             texture_floor_cents=round(fc, 1),
                             texture_floor_db=round(fd, 2),
                             gappiness=round(gp, 3), floor_gap=round(gf, 3)))
            print(f"{name:6s} N={N:4d} r={r:.2f}  heard: {wc:5.1f}c {wd:4.2f}dB  "
                  f"headcount: {hc:5.1f}c  floor: {fc:5.1f}c  gap: {gp:.2f} (floor {gf:.2f})  grains/s={gps:.0f}")
    (HERE / "crowd-size-table.json").write_text(json.dumps(rows, indent=1))
    write_wav(audio)
    write_png(rows, rasters)


def write_wav(audio):
    gap = np.zeros(int(0.35 * SR))
    fade = int(0.08 * SR)
    parts = []
    for name in ("DRIFT", "LOCKED"):
        for N in NS:
            y = audio[(name, N)][: int(3.0 * SR)].copy()
            y /= np.sqrt(np.mean(y ** 2)) + 1e-12      # matched RMS per rung
            y *= 0.12
            y[:fade] *= np.linspace(0, 1, fade)
            y[-fade:] *= np.linspace(1, 0, fade)
            parts += [y, gap]
        parts.append(np.zeros(int(1.0 * SR)))
    out = np.tanh(np.concatenate(parts) * 1.5) * 0.9
    wavfile.write(HERE / "crowd-size-ladder.wav", SR, (out * 32767).astype(np.int16))


def write_png(rows, rasters):
    fig = plt.figure(figsize=(15, 8.2))
    fig.patch.set_facecolor(BG)
    fig.text(0.03, 0.955, "HOW BIG DOES THE CROWD HAVE TO BE?", color=INK,
             fontsize=21, fontweight="bold")
    fig.text(0.03, 0.92, "Each neuron fires its own 90 ms grain at its own pitch. Grow the crowd from 4 "
             "to 512 and measure two things: does the brightness settle, and can you still hear individuals?",
             color=DIM, fontsize=9.5, family="serif")

    def style(a):
        a.set_facecolor(PANEL)
        a.tick_params(colors=DIM, labelsize=8)
        for s in a.spines.values():
            s.set_color("#2a2a32")

    def col(name, key):
        return [r[key] for r in rows if r["coupling"] == name]

    # A — brightness: what the crowd means vs what you hear vs the noise floor
    a = fig.add_axes([0.05, 0.47, 0.42, 0.39]); style(a)
    a.fill_between(NS, np.array(col("DRIFT", "texture_floor_cents")) * 0.9,
                   np.array(col("DRIFT", "texture_floor_cents")) * 1.1,
                   color=DIM, alpha=0.25, lw=0, label="texture floor (steady noise, same spectrum)")
    for name in ("DRIFT", "LOCKED"):
        a.plot(NS, col(name, "centroid_wobble_cents"), "o-", color=COL[name], lw=2, ms=5,
               label=f"{name}: brightness you hear")
        a.plot(NS, col(name, "headcount_wobble_cents"), "s--", color=COL[name], lw=1.2, ms=4,
               alpha=0.8, label=f"{name}: mean pitch of who fired")
    h0 = col("DRIFT", "headcount_wobble_cents")[0]
    a.plot(NS, [h0 * np.sqrt(NS[0] / n) for n in NS], ":", color=INK, lw=1, label="1/sqrt(N)")
    a.set_xscale("log", base=2); a.set_yscale("log")
    a.set_xticks(NS); a.set_xticklabels([str(n) for n in NS])
    a.set_xlabel("crowd size N (neurons)", color=DIM, fontsize=9)
    a.set_ylabel("wobble, cents (std over 250 ms windows)", color=DIM, fontsize=9)
    a.set_title("A · BRIGHTNESS SETTLES EARLY", color=INK, fontsize=12, loc="left", fontweight="bold")
    a.legend(facecolor=PANEL, edgecolor="#2a2a32", labelcolor=INK, fontsize=7, loc="lower left")

    # B — gappiness: can you hear individual grains?
    b = fig.add_axes([0.54, 0.47, 0.42, 0.39]); style(b)
    b.fill_between(NS, np.array(col("DRIFT", "floor_gap")) * 0.93,
                   np.array(col("DRIFT", "floor_gap")) * 1.07, color=DIM, alpha=0.25, lw=0,
                   label="steady-noise floor")
    for name, _ in KS:
        b.plot(NS, col(name, "gappiness"), "o-", color=COL[name], lw=2, ms=5, label=name)
    b.set_xscale("log", base=2); b.set_yscale("log")
    b.set_xticks(NS); b.set_xticklabels([str(n) for n in NS])
    b.set_xlabel("crowd size N (neurons)", color=DIM, fontsize=9)
    b.set_ylabel("gappiness (10 ms envelope, std / mean)", color=DIM, fontsize=9)
    b.set_title("B · SYNCHRONY KEEPS THE CROWD GRAINY", color=INK, fontsize=12, loc="left",
                fontweight="bold")
    b.legend(facecolor=PANEL, edgecolor="#2a2a32", labelcolor=INK, fontsize=8)

    show = [8, 32, 128, 512]
    for k, N in enumerate(show):
        for m, name in enumerate(("DRIFT", "LOCKED")):
            ax = fig.add_axes([0.05 + k * 0.235, 0.05 + (1 - m) * 0.15, 0.215, 0.125])
            style(ax)
            sp = np.array(rasters[(name, N)])
            sp = sp[sp[:, 0] < 2.0]
            ax.vlines(sp[:, 0], sp[:, 1] + 0.1, sp[:, 1] + 0.9, colors=COL[name],
                      lw=0.9 if N <= 32 else 0.4)
            ax.set_xlim(0, 2); ax.set_ylim(0, N)
            ax.set_yticks([]); ax.set_xticks([] if m == 0 else [0, 1, 2])
            ax.text(0.01, 0.95, f"{name}  N={N}", transform=ax.transAxes, va="top",
                    color=INK, fontsize=8, family="monospace",
                    bbox=dict(facecolor=PANEL, edgecolor="none", pad=1))
    fig.text(0.985, 0.012, "Loudon Live · Autodidact Polymaths", color=DIM,
             fontsize=8, ha="right", family="monospace")
    fig.savefig(HERE / "crowd-size-stability.png", dpi=150, facecolor=BG)


if __name__ == "__main__":
    main()
