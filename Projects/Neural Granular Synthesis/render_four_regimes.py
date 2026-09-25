#!/usr/bin/env python3
"""
Four raster regimes, seen and heard — cycle 6 of Neural Granular Synthesis.

Runs the ring population in kernel_lib.py through its four regimes
(drift · mean-field lock · traveling wave · chimera) and writes:

  raster-four-regimes.png   raster per regime + the local-coherence profile
                            down the ring beside it (the chimera's fingerprint)
  four-regimes.wav          ~7 s per regime, stereo. The ring IS the stereo
                            field: neuron i is panned by its ring position, so
                            a traveling wave sweeps across the speakers and a
                            chimera puts a fused tone on one side and a
                            shimmering cloud on the other.

Each spike fires one grain. Grain pitch is detuned by (1 - local coherence),
so a neuron in a locked patch sings in tune and a drifting neuron smears —
the same detune-collapse cue as synchrony-sweep.wav, made local.

Each regime is pre-rolled silently (WARM s) before recording, because a chimera
has to settle out of its seeded bump; what you hear is the steady state.
"""
import sys
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import to_rgb
from scipy.io import wavfile

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from kernel_lib import REGIMES, build

N, MEAN_HZ, DT = 128, 6.0, 0.001
WARM, REC = 30.0, 7.0
LOCAL_WIN = 0.02            # narrow enough that a twisted wave reads as locally coherent

SR, F0, DETUNE, GRAIN = 48000, 220.0, 0.018, 0.14
BG, PANEL, INK, DIM = "#0b0b0d", "#06060a", "#e7e7ea", "#8a8a93"
AMBER, INDIGO, TEAL = "#f2b134", "#6366f1", "#33e0c8"


def run(reg):
    p = build(reg, N, MEAN_HZ)
    for _ in range(int(WARM / DT)):
        p.step(DT)
    spikes, t = [], 0.0
    rg = []
    for _ in range(int(REC / DT)):
        fired = p.step(DT)
        rl = p.r_local(LOCAL_WIN) if len(fired) else None
        for i in fired:
            spikes.append((t, i, rl[i]))
        rg.append(p.r_global())
        t += DT
    return spikes, p.r_local(LOCAL_WIN), np.array(rg)


def grain_bank():
    n = int(GRAIN * SR)
    tt = np.arange(n) / SR
    env = np.sin(np.pi * np.arange(n) / n) ** 2          # Hann
    return tt, env


def render_audio(results):
    tt, env = grain_bank()
    gap = int(0.6 * SR)
    seg = int(REC * SR) + len(tt)
    out = np.zeros((2, len(results) * (seg + gap)))
    rng = np.random.default_rng(11)
    jitter = rng.uniform(-1, 1, N)
    for k, (spikes, _, _) in enumerate(results):
        base = k * (seg + gap)
        for (t, i, rloc) in spikes:
            f = F0 * (1 + DETUNE * (1 - rloc) * jitter[i])
            g = env * (np.sin(2*np.pi*f*tt) + 0.35*np.sin(4*np.pi*f*tt))
            x = i / N
            pan = 0.5 - 0.5*np.cos(2*np.pi*x)                # ring -> L..R..L
            s = base + int(t * SR)
            out[0, s:s+len(tt)] += g * np.cos(pan*np.pi/2)
            out[1, s:s+len(tt)] += g * np.sin(pan*np.pi/2)
        # each regime normalised on its own so a locked crowd isn't louder than drift
        blk = out[:, base:base+seg]
        blk /= (np.max(np.abs(blk)) + 1e-9)
        fade = int(0.15 * SR)
        blk[:, :fade] *= np.linspace(0, 1, fade)
        blk[:, -fade:] *= np.linspace(1, 0, fade)
    out = np.tanh(1.1 * out) * 0.9
    wavfile.write(HERE / "four-regimes.wav", SR, (out.T * 32767).astype(np.int16))


def mix(a, b, f):
    a, b = np.array(to_rgb(a)), np.array(to_rgb(b))
    return tuple(a + (b - a) * float(np.clip(f, 0, 1)))


def render_png(results):
    fig = plt.figure(figsize=(15, 5.4))
    fig.patch.set_facecolor(BG)
    fig.text(0.03, 0.94, "FOUR RASTER REGIMES", color=INK, fontsize=21, fontweight="bold")
    fig.text(0.03, 0.885, "One ring of 128 neurons, four ways of coupling them. Left of each pair: "
             "the raster (row = neuron, tick = spike, last 3 s). Right: local coherence down the ring.",
             color=DIM, fontsize=9.5, family="serif")
    W = 0.235
    for k, (reg, (spikes, rl, rg)) in enumerate(zip(REGIMES, results)):
        x0 = 0.03 + k * (W + 0.008)
        ax = fig.add_axes([x0, 0.19, W * 0.74, 0.62])
        ap = fig.add_axes([x0 + W * 0.76, 0.19, W * 0.18, 0.62], sharey=ax)
        for a in (ax, ap):
            a.set_facecolor(PANEL)
            a.tick_params(colors=DIM, labelsize=7)
            for s in a.spines.values():
                s.set_color("#2a2a32")
        sp = np.array([(t, i, r) for (t, i, r) in spikes if t >= REC - 3.0])
        cols = [mix(INDIGO, AMBER, r) for r in sp[:, 2]]
        ax.vlines(sp[:, 0], sp[:, 1] + 0.1, sp[:, 1] + 0.9, colors=cols, lw=0.7)
        ax.set_xlim(REC - 3.0, REC); ax.set_ylim(0, N)
        ax.set_xlabel("time (s)", color=DIM, fontsize=8)
        if k == 0:
            ax.set_ylabel("ring position (neuron)", color=DIM, fontsize=8)
        ap.fill_betweenx(np.arange(N) + 0.5, 0, rl, color=TEAL, alpha=0.8, lw=0)
        ap.set_xlim(0, 1.02); ap.set_xticks([0, 1])
        plt.setp(ap.get_yticklabels(), visible=False)
        ap.set_xlabel("local r", color=DIM, fontsize=8)
        ax.set_title(f"{reg['name']}   global r = {rg[-500:].mean():.2f}",
                     color=mix(INDIGO, AMBER, rl.mean()), fontsize=11.5,
                     fontweight="bold", loc="left", pad=8)
        ax.text(0.0, -0.16, reg["caption"], transform=ax.transAxes, color=DIM,
                fontsize=7.5, family="monospace")
    fig.text(0.985, 0.015, "Loudon Live · Autodidact Polymaths", color=DIM,
             fontsize=8, ha="right", family="monospace")
    fig.savefig(HERE / "raster-four-regimes.png", dpi=150, facecolor=BG)


if __name__ == "__main__":
    results = []
    for reg in REGIMES:
        res = run(reg)
        rl = res[1]
        print(f"{reg['name']:16s} global r={res[2][-500:].mean():.2f}  local r min/max="
              f"{rl.min():.2f}/{rl.max():.2f}  locked frac={(rl>.9).mean():.2f}  spikes={len(res[0])}")
        results.append(res)
    render_png(results)
    render_audio(results)
    print("wrote raster-four-regimes.png, four-regimes.wav")
