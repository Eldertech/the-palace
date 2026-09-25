#!/usr/bin/env python3
"""
Where does coupling land in timbre space? — cycle 8 of Neural Granular Synthesis.

Two of the entry's open questions, answered together:
  "Does coupling strength correlate with a dimension of timbre space?"
  "Can we tune threshold variance to target specific regions of timbre space?"

Until now every crowd fired at ~6 Hz and each spike triggered a pitched grain,
so the grain carried the pitch and the crowd only carried rhythm and texture.
This cycle moves the crowd up to AUDIO RATE: 128 neurons firing around 110 Hz,
and each spike is the sound itself — a prescribed 1.6 ms action potential with
its undershoot (the Action Potential Oscillator's shape, simplified). Now the
crowd's firing rate IS the pitch, and the spike shape is the formant.

Then we sweep two population knobs over a grid:
  K      coupling (units where 1.0 = pull comparable to the firing rate)
  sigma  spread of natural firing rates, +-sigma around the mean (uniform) —
         the stand-in for threshold variance: a neuron with a lower threshold
         fires faster, so threshold spread shows up as rate spread

and measure what a listener would call the timbre:
  harmonicity    share of energy sitting on the harmonics of the crowd's pitch
  pitch clarity  height of the autocorrelation peak (0 = noise, 1 = a clean tone)
  brightness     spectral centroid
  loudness       RMS, dB

Theory line: for Kuramoto with a uniform rate spread of half-width sigma*w,
locking starts at K_c = 4*sigma/pi in these units — and for a uniform spread
the onset is abrupt, not gradual. If the timbre map shows a sharp edge along
K = 4*sigma/pi, then sigma doesn't choose a timbre by itself: it moves the
edge where coupling snaps the crowd into a tone.

Writes:
  timbre-map.png     four heatmaps over (sigma, K) with the K_c line, spectra, the K/sigma collapse, and the r trace under each walk
  timbre-walk.wav    three continuous walks, loudness-levelled (see WALKS)
  timbre-map.json    every measured cell
"""
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy.io import wavfile

HERE = Path(__file__).parent
SR = 48000
N = 128
F0 = 110.0
KS = np.round(np.linspace(0.0, 0.8, 17), 3)
SIGMAS = np.array([0.02, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40])
WARM, REC = 0.6, 1.0
SEED = 7

BG, PANEL, INK, DIM = "#0b0b0d", "#06060a", "#e7e7ea", "#8a8a93"
ACCENT = "#f2b134"


def spike_shape():
    """A prescribed action potential, 1.6 ms: fast rise, slower fall, then the
    hyperpolarizing undershoot that pulls the membrane below rest."""
    t = np.arange(int(0.0016 * SR)) / SR
    up = np.exp(-((t - 0.00035) / 0.00012) ** 2)
    down = np.exp(-((t - 0.0006) / 0.0002) ** 2)
    under = -0.28 * np.exp(-((t - 0.0011) / 0.00028) ** 2)
    s = 0.6 * up + 0.5 * down + under
    return s - s.mean()


SPIKE = spike_shape()


def omegas(sigma_arr, seed=SEED):
    """Natural rates, uniform +-sigma, same jitter pattern for every cell so
    cells differ only by the knobs."""
    jit = np.random.default_rng(seed).uniform(-1, 1, N)
    return 2 * np.pi * F0 * (1 + np.outer(sigma_arr, jit))


def run_grid():
    """Simulate every (sigma, K) cell at once: arrays of shape (cells, N)."""
    sig = np.repeat(SIGMAS, len(KS))
    kk = np.tile(KS, len(SIGMAS))
    om = omegas(sig)
    Kabs = (kk * om.mean(axis=1))[:, None]
    th = np.random.default_rng(SEED + 1).uniform(0, 2 * np.pi, om.shape)
    dt = 1 / SR
    nrec = int(REC * SR)
    trains = np.zeros((len(sig), nrec))
    rs = np.zeros(len(sig))
    for step in range(int((WARM + REC) * SR)):
        z = np.exp(1j * th).mean(axis=1, keepdims=True)
        new = th + (om + Kabs * np.imag(z * np.exp(-1j * th))) * dt
        k = step - int(WARM * SR)
        if k >= 0:
            trains[:, k] = (new >= 2 * np.pi).sum(axis=1)
            rs += np.abs(z[:, 0])
        th = np.mod(new, 2 * np.pi)
    return sig, kk, trains, rs / nrec


def to_audio(train):
    return np.convolve(train, SPIKE)[: len(train)]


def descriptors(y, train):
    win = np.hanning(len(y))
    Y = np.abs(np.fft.rfft(y * win)) ** 2
    f = np.fft.rfftfreq(len(y), 1 / SR)
    band = f < 6000
    # the crowd's pitch: strongest peak of the spike-train spectrum near F0
    T = np.abs(np.fft.rfft((train - train.mean()) * win)) ** 2
    near = (f > F0 * 0.55) & (f < F0 * 1.45)
    fp = f[near][np.argmax(T[near])]
    on = np.zeros_like(band)
    for h in range(1, int(6000 / fp) + 1):
        on |= np.abs(f - h * fp) < 3.0          # +-3 Hz: a sharp line, not a smear
    harm = Y[band & on].sum() / (Y[band].sum() + 1e-20)
    # pitch clarity: normalized autocorrelation peak in 60–400 Hz lag range
    ac = np.fft.irfft(np.abs(np.fft.rfft(y, 2 * len(y))) ** 2)[: len(y)]
    ac /= ac[0] + 1e-20
    lo, hi = int(SR / 400), int(SR / 60)
    clarity = float(ac[lo:hi].max())
    cent = (f[band] * Y[band]).sum() / (Y[band].sum() + 1e-20)
    rms = 20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-12)
    return dict(pitch_hz=round(float(fp), 1), harmonicity=round(float(harm), 3),
                clarity=round(clarity, 3), centroid_hz=round(float(cent), 0),
                loudness_db=round(float(rms), 1)), (f, Y)


# ---------------------------------------------------------------- audio walks
WALKS = [
    ("K 0 -> 0.6 at sigma 0.18 (edge at K_c = 0.23)", 12.0,
     lambda u: (0.6 * u, 0.18)),
    ("sigma 0.02 -> 0.45 at K 0.3 (edge at sigma = 0.24)", 12.0,
     lambda u: (0.3, 0.02 + 0.43 * u)),
    ("K 0.6 -> 0 at sigma 0.18 (the way back down)", 10.0,
     lambda u: (0.6 * (1 - u), 0.18)),
]


def walk(fn, dur, seed=SEED):
    jit = np.random.default_rng(seed).uniform(-1, 1, N)
    th = np.random.default_rng(seed + 1).uniform(0, 2 * np.pi, N)
    dt = 1 / SR
    n = int(dur * SR)
    train, rtrace = np.zeros(n), np.zeros(n)
    for k in range(n):
        K, s = fn(k / (n - 1))
        om = 2 * np.pi * F0 * (1 + s * jit)
        z = np.exp(1j * th).mean()
        new = th + (om + K * om.mean() * np.imag(z * np.exp(-1j * th))) * dt
        train[k] = (new >= 2 * np.pi).sum()
        rtrace[k] = abs(z)
        th = np.mod(new, 2 * np.pi)
    return train, rtrace


def level(y):
    """Slow loudness leveller (400 ms RMS follower) so the walk is heard as a
    change of timbre, not the ~sqrt(N) jump in loudness when the crowd locks."""
    e = np.sqrt(np.convolve(y ** 2, np.ones(int(0.4 * SR)) / int(0.4 * SR), "same")) + 1e-9
    return y / e * 0.1


def main():
    sig, kk, trains, rs = run_grid()
    rows, spectra = [], {}
    for c in range(len(sig)):
        y = to_audio(trains[c])
        d, spec = descriptors(y, trains[c])
        rows.append(dict(sigma=float(sig[c]), K=float(kk[c]), r=round(float(rs[c]), 3), **d))
        spectra[(round(float(sig[c]), 2), float(kk[c]))] = spec
    (HERE / "timbre-map.json").write_text(json.dumps(rows, indent=1))
    for r in rows:
        if r["sigma"] in (0.1, 0.2, 0.3) and r["K"] in (0.0, 0.1, 0.2, 0.25, 0.3, 0.4, 0.6, 0.8):
            print(r)

    parts, traces = [], []
    for label, dur, fn in WALKS:
        tr, rt = walk(fn, dur)
        y = level(to_audio(tr))
        fade = int(0.05 * SR)
        y[:fade] *= np.linspace(0, 1, fade); y[-fade:] *= np.linspace(1, 0, fade)
        parts += [y, np.zeros(int(0.8 * SR))]
        traces.append((label, dur, rt))
        print(label, "r at 5% steps:", np.round(rt[:: len(rt) // 20][:21], 2))
    out = np.tanh(np.concatenate(parts) * 2.0) * 0.8
    wavfile.write(HERE / "timbre-walk.wav", SR, (out * 32767).astype(np.int16))
    write_png(rows, spectra, traces)


def write_png(rows, spectra, traces):
    fig = plt.figure(figsize=(15, 9.4))
    fig.patch.set_facecolor(BG)
    fig.text(0.03, 0.958, "WHERE DOES COUPLING LAND IN TIMBRE SPACE?", color=INK,
             fontsize=21, fontweight="bold")
    fig.text(0.03, 0.927, "128 neurons firing near 110 Hz; every spike is the sound. "
             "Sweep coupling K against the spread of firing rates and measure the timbre. "
             "Dashed line: where theory says locking begins, K = 4·spread/π.",
             color=DIM, fontsize=9.5, family="serif")

    def style(a):
        a.set_facecolor(PANEL); a.tick_params(colors=DIM, labelsize=8)
        for s in a.spines.values():
            s.set_color("#2a2a32")

    grid = lambda key: np.array([[next(r[key] for r in rows if r["sigma"] == s and r["K"] == k)
                                  for k in KS] for s in SIGMAS])
    panels = [("r", "A · SYNCHRONY r", "magma"),
              ("harmonicity", "B · HARMONICITY (energy on harmonics)", "viridis"),
              ("clarity", "C · PITCH CLARITY (autocorrelation)", "viridis"),
              ("centroid_hz", "D · BRIGHTNESS (centroid, Hz)", "cividis")]
    for i, (key, title, cmap) in enumerate(panels):
        a = fig.add_axes([0.05 + i * 0.235, 0.50, 0.19, 0.36]); style(a)
        G = grid(key)
        im = a.imshow(G, origin="lower", aspect="auto", cmap=cmap,
                      extent=[KS[0] - 0.025, KS[-1] + 0.025, -0.5, len(SIGMAS) - 0.5])
        kc = 4 * SIGMAS / np.pi
        a.plot(kc, np.arange(len(SIGMAS)), "--", color="white", lw=1.4)
        a.set_yticks(range(len(SIGMAS))); a.set_yticklabels([f"{s:.2f}" for s in SIGMAS])
        a.set_xlim(KS[0] - 0.025, KS[-1] + 0.025)
        a.set_xlabel("coupling K", color=DIM, fontsize=9)
        if i == 0:
            a.set_ylabel("rate spread ± (threshold variance)", color=DIM, fontsize=9)
        a.set_title(title, color=INK, fontsize=10, loc="left", fontweight="bold")
        cb = fig.colorbar(im, ax=a, fraction=0.05, pad=0.02)
        cb.ax.tick_params(colors=DIM, labelsize=7)

    # E — spectra across the edge at sigma 0.20 (K_c = 0.25)
    e = fig.add_axes([0.05, 0.07, 0.27, 0.33]); style(e)
    for K, col in [(0.0, "#6366f1"), (0.2, "#33e0c8"), (0.3, ACCENT), (0.8, "#f25f5c")]:
        f, Y = spectra[(0.2, K)]
        m = f < 2500
        sm = np.convolve(Y, np.ones(9) / 9, "same")
        e.plot(f[m], 10 * np.log10(sm[m] + 1e-12), color=col, lw=0.9, label=f"K = {K}")
    e.set_xlabel("frequency, Hz", color=DIM, fontsize=9)
    e.set_ylabel("power, dB", color=DIM, fontsize=9)
    e.set_title("E · SPREAD 0.20 CROSSING ITS EDGE (K ≈ 0.25)", color=INK,
                fontsize=10, loc="left", fontweight="bold")
    e.legend(facecolor=PANEL, edgecolor="#2a2a32", labelcolor=INK, fontsize=8)

    # F — the collapse: every spread on one curve when plotted against K / spread
    c = fig.add_axes([0.375, 0.07, 0.27, 0.33]); style(c)
    c2 = c.twinx(); c2.tick_params(colors=DIM, labelsize=8)
    cm = plt.get_cmap("plasma")
    for j, s in enumerate(SIGMAS[1:]):
        sub = [r for r in rows if r["sigma"] == s]
        x = [r["K"] / s for r in sub]
        col = cm(0.1 + 0.8 * j / (len(SIGMAS) - 2))
        c.plot(x, [r["r"] for r in sub], "o-", color=col, ms=3, lw=1, label=f"spread {s:.2f}")
        c2.plot(x, [r["centroid_hz"] for r in sub], "s:", color=col, ms=2.5, lw=0.8)
    c.axvline(4 / np.pi, color="white", ls="--", lw=1)
    c.set_xlim(0, 8); c.set_ylim(0, 1.02)
    c.set_xlabel("K / spread   (dashed: 4/π, the locking edge)", color=DIM, fontsize=9)
    c.set_ylabel("synchrony r  (solid)", color=DIM, fontsize=9)
    c2.set_ylabel("brightness, Hz  (dotted)", color=DIM, fontsize=9)
    c.set_title("F · ONE CURVE: ONLY K / SPREAD MATTERS", color=INK, fontsize=10,
                loc="left", fontweight="bold")
    c.legend(facecolor=PANEL, edgecolor="#2a2a32", labelcolor=INK, fontsize=6.5, loc="center right", ncol=2)

    # G — the r trace under each audio walk
    fw = fig.add_axes([0.72, 0.07, 0.26, 0.33]); style(fw)
    cols = ["#33e0c8", ACCENT, "#f25f5c"]
    t0 = 0.0
    for (label, dur, rt), c in zip(traces, cols):
        t = t0 + np.arange(len(rt)) / SR
        sm = np.convolve(rt, np.ones(int(0.05 * SR)) / int(0.05 * SR), "same")   # 50 ms
        fw.plot(t[::200], sm[::200], color=c, lw=1.6, label=label)
        t0 += dur + 0.8
    fw.set_ylim(0, 1.02)
    fw.set_xlabel("seconds into timbre-walk.wav", color=DIM, fontsize=9)
    fw.set_ylabel("synchrony r", color=DIM, fontsize=9)
    fw.set_title("G · r UNDER EACH WALK YOU HEAR", color=INK, fontsize=10,
                 loc="left", fontweight="bold")
    fw.legend(facecolor=PANEL, edgecolor="#2a2a32", labelcolor=INK, fontsize=7.5,
              loc="upper left")
    fig.text(0.985, 0.012, "Loudon Live · Autodidact Polymaths", color=DIM,
             fontsize=8, ha="right", family="monospace")
    fig.savefig(HERE / "timbre-map.png", dpi=150, facecolor=BG)


if __name__ == "__main__":
    main()
