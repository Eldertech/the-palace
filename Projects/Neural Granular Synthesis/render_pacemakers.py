#!/usr/bin/env python3
"""
Do pacemakers make the crowd sound alive? — cycle 9 of Neural Granular Synthesis.

The entry's last open question:
  "How does pacemaker cell proportion (autonomous vs. coupled) affect the
   perceptual 'liveliness' of the timbre?"

Cycle 8 found that a locked crowd is a clean, bright tone — and, once settled,
a perfectly still one. With fixed rates and no noise, a locked crowd is a
frozen phase pattern: every period is the same period. That is the most
mechanical sound the model can make.

So: make a fraction p of the 128 neurons pacemakers. A pacemaker fires at its
own natural rate and ignores the crowd; it still *counts* in the crowd's mean
field (the others hear it), it just doesn't listen back. Sweep p against
coupling K at a fixed rate spread (0.10) and measure, besides the cycle-8
timbre descriptors, two kinds of motion a listener would call life:

  pitch wobble     how much the locked core's pitch moves, in cents (std of
                   the followers' mean-field frequency, 10 ms resolution)
  loudness wobble  how much the level breathes (std/mean of 36 ms RMS frames,
                   four periods each so the waveform itself doesn't count)

Predictions going in: pacemakers only dilute the pull, so the locking edge
should move from K_c = 4*sigma/pi to K_c / (1 - p). And the wobble should come
from the pacemakers beating against the core (beats up to sigma*110 = 11 Hz).

Second, the loose end from cycle 8: on the walks the crowd locked near K 0.24
going up but released near 0.21 coming down. Real hysteresis, or just ramp
lag? Ramp K 0 -> 0.5 -> 0 at spread 0.18 at three speeds (4 s, 16 s, 64 s per
direction) over six random crowds and see whether the gap closes as the ramp
slows.

Writes:
  pacemakers.png         heatmaps over (p, K), wobble curves, the hysteresis test
  pacemaker-ladder.wav   six rungs of p at K 0.4, loudness-levelled
  pacemakers.json        every measured cell + the hysteresis numbers
"""
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy.io import wavfile

from render_timbre_map import SPIKE, SR, N, F0, BG, PANEL, INK, DIM, ACCENT, descriptors, level

HERE = Path(__file__).parent
SIGMA = 0.10
KS = np.round(np.linspace(0.0, 0.8, 17), 3)
PS = np.array([0.0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7])
WARM, REC = 0.8, 2.0
SEED = 7
DEC = 48                       # store the core's mean field at 1 kHz
LADDER_K = 0.4
LADDER_P = [0.0, 0.1, 0.2, 0.35, 0.5, 0.65]


def crowd(seed=SEED):
    rng = np.random.default_rng(seed)
    jit = rng.uniform(-1, 1, N)
    order = rng.permutation(N)          # pacemaker sets nest: p=0.2 contains p=0.1
    th0 = np.random.default_rng(seed + 1).uniform(0, 2 * np.pi, N)
    return jit, order, th0


def pace_mask(p, order):
    m = np.zeros(N, bool)
    m[order[: int(round(p * N))]] = True
    return m


def simulate(Kc, masks, jit, th0, warm, rec):
    """Kc: (cells,) coupling; masks: (cells, N) True = pacemaker."""
    cells = len(Kc)
    om = np.broadcast_to(2 * np.pi * F0 * (1 + SIGMA * jit), (cells, N))
    listen = (~masks).astype(float)
    Kabs = (Kc * 2 * np.pi * F0)[:, None] * listen
    th = np.tile(th0, (cells, 1))
    dt = 1 / SR
    nrec = int(rec * SR)
    trains = np.zeros((cells, nrec))
    rsum = np.zeros(cells)
    zcore = np.zeros((cells, nrec // DEC), complex)
    nfol = np.maximum(listen.sum(axis=1), 1)
    for step in range(int((warm + rec) * SR)):
        e = np.exp(1j * th)
        z = e.mean(axis=1, keepdims=True)
        new = th + (om + Kabs * np.imag(z * np.conj(e))) * dt
        k = step - int(warm * SR)
        if k >= 0:
            trains[:, k] = (new >= 2 * np.pi).sum(axis=1)
            rsum += np.abs(z[:, 0])
            if k % DEC == 0 and k // DEC < zcore.shape[1]:
                zcore[:, k // DEC] = (e * listen).sum(axis=1) / nfol
        th = np.mod(new, 2 * np.pi)
    return trains, rsum / nrec, zcore


def wobble(y, zc):
    # pitch: frequency of the core's mean field, 10 ms hops, std in cents
    ph = np.unwrap(np.angle(zc))
    f = np.diff(ph[::10]) / (2 * np.pi * 10 * DEC / SR)
    f = f[f > 20]
    c = 1200 * np.log2(f / np.median(f)) if len(f) > 10 else np.full(20, np.nan)
    cents = float(np.std(c))
    slow = np.convolve(c, np.ones(10) / 10, "valid")          # 100 ms average: drift you'd hear as vibrato
    slow_cents = float(np.std(slow))
    # loudness: 36 ms RMS frames (four periods at 110 Hz)
    L = int(4 * SR / F0)
    fr = np.sqrt((y[: len(y) // L * L].reshape(-1, L) ** 2).mean(axis=1))
    amp = float(fr.std() / (fr.mean() + 1e-12))
    return round(cents, 2), round(slow_cents, 2), round(amp, 4)


# ---------------------------------------------------------------- hysteresis
HYS_SIGMA, HYS_KMAX, HYS_SR = 0.18, 0.5, 9600
HYS_SPEEDS = [4.0, 16.0, 64.0]
HYS_SEEDS = range(11, 17)


def hysteresis(dur):
    seeds = list(HYS_SEEDS)
    jit = np.array([np.random.default_rng(s).uniform(-1, 1, N) for s in seeds])
    th = np.array([np.random.default_rng(s + 100).uniform(0, 2 * np.pi, N) for s in seeds])
    om = 2 * np.pi * F0 * (1 + HYS_SIGMA * jit)
    dt = 1 / HYS_SR
    n = int(dur * HYS_SR)
    Kpath = np.concatenate([np.linspace(0, HYS_KMAX, n), np.linspace(HYS_KMAX, 0, n)])
    r = np.zeros((len(seeds), 2 * n), np.float32)
    for k, K in enumerate(Kpath):
        e = np.exp(1j * th)
        z = e.mean(axis=1, keepdims=True)
        th = np.mod(th + (om + K * 2 * np.pi * F0 * np.imag(z * np.conj(e))) * dt, 2 * np.pi)
        r[:, k] = np.abs(z[:, 0])
    w = int(0.05 * HYS_SR)
    rs = np.array([np.convolve(x, np.ones(w) / w, "same") for x in r])
    up, down = [], []
    for x in rs:
        up.append(float(Kpath[:n][np.argmax(x[:n] > 0.5)]))
        down.append(float(Kpath[n:][np.nonzero(x[n:] > 0.5)[0][-1]]))
    return Kpath, rs, up, down


def main():
    jit, order, th0 = crowd()
    Kc = np.repeat(KS, len(PS))
    pc = np.tile(PS, len(KS))
    masks = np.array([pace_mask(p, order) for p in pc])
    trains, rs, zcore = simulate(Kc, masks, jit, th0, WARM, REC)
    rows, spectra = [], {}
    for c in range(len(Kc)):
        y = np.convolve(trains[c], SPIKE)[: trains.shape[1]]
        d, spec = descriptors(y, trains[c])
        pw, sw, aw = wobble(y, zcore[c])
        rcore = float(np.abs(zcore[c]).mean())
        rows.append(dict(p=float(pc[c]), K=float(Kc[c]), r=round(float(rs[c]), 3),
                         r_core=round(rcore, 3), pitch_wobble_cents=pw, slow_wobble_cents=sw,
                         loudness_wobble=aw, **d))
        spectra[(float(pc[c]), float(Kc[c]))] = spec
    for r in rows:
        if r["K"] == LADDER_K:
            print(r)

    hys = []
    for dur in HYS_SPEEDS:
        Kp, rsm, up, down = hysteresis(dur)
        hys.append(dict(ramp_s=dur, lock_up=up, release_down=down,
                        gap_mean=round(float(np.mean(up) - np.mean(down)), 4),
                        gap_sd=round(float(np.std(np.array(up) - np.array(down))), 4),
                        trace=(Kp[::40].tolist(), rsm.mean(axis=0)[::40].tolist())))
        print(f"ramp {dur:>4}s  up {np.round(up,3)}  down {np.round(down,3)}  "
              f"gap {np.mean(up)-np.mean(down):.4f}")

    # ladder
    parts, rungs = [], []
    for p in LADDER_P:
        m = pace_mask(p, order)[None]
        tr, rr, zc = simulate(np.array([LADDER_K]), m, jit, th0, 0.6, 3.6)
        y = np.convolve(tr[0], SPIKE)[: tr.shape[1]]
        pw, sw, aw = wobble(y, zc[0])
        rungs.append(dict(p=p, pitch_wobble_cents=pw, slow_wobble_cents=sw, loudness_wobble=aw, r=round(float(rr[0]), 3)))
        y = level(y)
        fade = int(0.05 * SR)
        y[:fade] *= np.linspace(0, 1, fade); y[-fade:] *= np.linspace(1, 0, fade)
        parts += [y, np.zeros(int(0.6 * SR))]
        print("rung", rungs[-1])
    out = np.tanh(np.concatenate(parts) * 2.0) * 0.8
    wavfile.write(HERE / "pacemaker-ladder.wav", SR, (out * 32767).astype(np.int16))

    (HERE / "pacemakers.json").write_text(json.dumps(
        dict(sigma=SIGMA, cells=rows, ladder_K=LADDER_K, ladder=rungs,
             hysteresis=[{k: v for k, v in h.items() if k != "trace"} for h in hys]), indent=1))
    write_png(rows, spectra, hys, rungs)


def write_png(rows, spectra, hys, rungs):
    fig = plt.figure(figsize=(15, 9.4))
    fig.patch.set_facecolor(BG)
    fig.text(0.03, 0.958, "DO PACEMAKERS MAKE THE CROWD SOUND ALIVE?", color=INK,
             fontsize=21, fontweight="bold")
    fig.text(0.03, 0.927, "128 neurons near 110 Hz, rate spread 0.10. A fraction p fire at their own rate "
             "and ignore the crowd. Dashed line: the predicted edge, K = (4·spread/π) / (1 − p).",
             color=DIM, fontsize=9.5, family="serif")

    def style(a):
        a.set_facecolor(PANEL); a.tick_params(colors=DIM, labelsize=8)
        for s in a.spines.values():
            s.set_color("#2a2a32")

    grid = lambda key: np.array([[next(r[key] for r in rows if r["p"] == p and r["K"] == k)
                                  for k in KS] for p in PS])
    panels = [("r_core", "A · CORE SYNCHRONY (the listeners)", "magma", None),
              ("clarity", "B · PITCH CLARITY", "viridis", None),
              ("pitch_wobble_cents", "C · PITCH WOBBLE, cents (locked only)", "inferno", (0, 60)),
              ("loudness_wobble", "D · LOUDNESS WOBBLE (locked only)", "inferno", (0, 0.2))]
    kc0 = 4 * SIGMA / np.pi
    for i, (key, title, cmap, lim) in enumerate(panels):
        a = fig.add_axes([0.05 + i * 0.235, 0.50, 0.19, 0.36]); style(a)
        G = grid(key).astype(float)
        if "wobble" in key:
            G[grid("r_core") < 0.6] = np.nan              # no tone, no wobble to speak of
        im = a.imshow(G, origin="lower", aspect="auto", cmap=cmap,
                      vmin=None if lim is None else lim[0], vmax=None if lim is None else lim[1],
                      extent=[KS[0] - 0.025, KS[-1] + 0.025, -0.5, len(PS) - 0.5])
        a.set_facecolor("#15151b")
        a.plot(np.minimum(kc0 / (1 - PS), 0.9), np.arange(len(PS)), "--", color="white", lw=1.4)
        a.axvline(LADDER_K, color=ACCENT, lw=0.8, alpha=0.6)
        a.set_yticks(range(len(PS))); a.set_yticklabels([f"{p:.2f}" for p in PS])
        a.set_xlim(KS[0] - 0.025, KS[-1] + 0.025)
        a.set_xlabel("coupling K", color=DIM, fontsize=9)
        if i == 0:
            a.set_ylabel("pacemaker share p", color=DIM, fontsize=9)
        a.set_title(title, color=INK, fontsize=10, loc="left", fontweight="bold")
        cb = fig.colorbar(im, ax=a, fraction=0.05, pad=0.02)
        cb.ax.tick_params(colors=DIM, labelsize=7)

    # E — at K 0.4: life rises, the tone holds, then breaks
    e = fig.add_axes([0.05, 0.07, 0.27, 0.33]); style(e)
    sub = [r for r in rows if r["K"] == LADDER_K]
    x = [r["p"] for r in sub]
    e.plot(x, [r["clarity"] for r in sub], "o-", color="#33e0c8", lw=1.4, ms=4, label="pitch clarity")
    e.plot(x, [r["harmonicity"] for r in sub], "s-", color="#6366f1", lw=1.2, ms=3.5, label="harmonicity")
    e.plot(x, [r["r_core"] for r in sub], "^-", color="#f25f5c", lw=1.2, ms=3.5, label="core synchrony")
    e2 = e.twinx(); e2.tick_params(colors=DIM, labelsize=8)
    e2.plot(x, [r["pitch_wobble_cents"] for r in sub], "D:", color=ACCENT, lw=1.4, ms=4, label="pitch wobble, all (cents)")
    e2.plot(x, [r["slow_wobble_cents"] for r in sub], "D-", color="#f7d28a", lw=1.0, ms=3, label="slow drift >100 ms (cents)")
    e.axvline(1 - kc0 / LADDER_K, color="white", ls="--", lw=1)
    e.set_ylim(0, 1.05)
    e.set_xlabel(f"pacemaker share p at K = {LADDER_K}  (dashed: predicted break)", color=DIM, fontsize=9)
    e.set_title("E · AT K 0.4: LIFE RISES, TONE HOLDS, THEN BREAKS", color=INK, fontsize=10,
                loc="left", fontweight="bold")
    h1, l1 = e.get_legend_handles_labels(); h2, l2 = e2.get_legend_handles_labels()
    e.legend(h1 + h2, l1 + l2, facecolor=PANEL, edgecolor="#2a2a32", labelcolor=INK, fontsize=7, loc="center left")

    # F — spectra of the ladder's cells
    s = fig.add_axes([0.375, 0.07, 0.27, 0.33]); style(s)
    for p, col in [(0.0, "#6366f1"), (0.2, "#33e0c8"), (0.4, ACCENT), (0.6, "#f25f5c")]:
        f, Y = spectra[(p, LADDER_K)]
        m = (f > 60) & (f < 480)
        sm = np.convolve(Y, np.ones(3) / 3, "same")
        s.plot(f[m], 10 * np.log10(sm[m] + 1e-12), color=col, lw=0.9, label=f"p = {p}")
    s.set_xlabel("frequency, Hz (fundamental and first three harmonics)", color=DIM, fontsize=9)
    s.set_ylabel("power, dB", color=DIM, fontsize=9)
    s.set_title(f"F · THE HALO AROUND EACH HARMONIC, K = {LADDER_K}", color=INK, fontsize=10,
                loc="left", fontweight="bold")
    s.legend(facecolor=PANEL, edgecolor="#2a2a32", labelcolor=INK, fontsize=8)

    # G — hysteresis: is the up/down gap real?
    g = fig.add_axes([0.72, 0.07, 0.26, 0.33]); style(g)
    cols = ["#f25f5c", ACCENT, "#33e0c8"]
    for h, c in zip(hys, cols):
        Kp, rm = map(np.array, h["trace"])
        n = len(Kp) // 2
        g.plot(Kp[:n], rm[:n], color=c, lw=1.4, label=f"{h['ramp_s']:.0f} s ramp · gap {h['gap_mean']:.3f}")
        g.plot(Kp[n:], rm[n:], color=c, lw=1.0, ls=":")
    g.axvline(4 * HYS_SIGMA / np.pi, color="white", ls="--", lw=1)
    g.set_xlim(0.1, 0.36); g.set_ylim(0, 1.02)
    g.set_xlabel("coupling K  (solid: going up · dotted: coming down)", color=DIM, fontsize=9)
    g.set_ylabel("synchrony r (6 crowds averaged)", color=DIM, fontsize=9)
    g.set_title("G · CYCLE 8'S LAG: RAMP OR MEMORY?", color=INK, fontsize=10,
                loc="left", fontweight="bold")
    g.legend(facecolor=PANEL, edgecolor="#2a2a32", labelcolor=INK, fontsize=7.5, loc="upper left")
    fig.text(0.985, 0.012, "Loudon Live · Autodidact Polymaths", color=DIM,
             fontsize=8, ha="right", family="monospace")
    fig.savefig(HERE / "pacemakers.png", dpi=150, facecolor=BG)


if __name__ == "__main__":
    main()
