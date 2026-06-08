#!/usr/bin/env python3
"""
Render a three-regime raster-plot still for Neural Granular Synthesis.

Simulates the same mean-field Kuramoto population the interactive HTML runs
(dθᵢ/dt = ωᵢ + K·r·sin(ψ − θᵢ)), at three coupling strengths, and draws the
three canonical raster signatures side by side:

    drift (scatter, r→0) · critical (partial, r~0.5) · lock (stripes, r→1)

The order parameter r·e^{iψ} = (1/N) Σ e^{iθ} is computed live and printed on
each panel. Palette = Loudon Live Graphite skin. Output: raster-three-regimes.png
"""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import to_rgb

# ---- Graphite skin palette ----
BG     = "#0b0b0d"
PANEL  = "#06060a"
INK    = "#e7e7ea"
DIM    = "#8a8a93"
AMBER  = "#f2b134"
INDIGO = "#6366f1"
TEAL   = "#33e0c8"

rng = np.random.default_rng(7)

N      = 56          # neurons (rows)
T      = 6.0         # seconds
DT     = 0.002       # sim step
MEANF  = 6.0         # mean firing rate (Hz)
SIGMA  = 0.18        # threshold/rate spread

def simulate(K):
    """Return (spike_times list per neuron, r_trace, t_trace)."""
    phase = rng.uniform(0, 2*np.pi, N)
    jitter = rng.uniform(-1, 1, N)
    omega = 2*np.pi*np.maximum(0.2, MEANF*(1 + (0.10 + 0.9*SIGMA)*jitter))
    # Coupling is nondimensionalized against the mean angular frequency so the
    # K knob lives in its natural musical 0–2 range: K·Kscale·r·sin(ψ−θ). With
    # Kscale = mean(ω), K≈1 makes the pull comparable to the oscillation rate,
    # and K_c (the lock-on) sits a little below 1 for this spread.
    Kscale = float(np.mean(omega))
    spikes = [[] for _ in range(N)]
    r_trace, t_trace = [], []
    t = 0.0
    steps = int(T/DT)
    for _ in range(steps):
        z = np.exp(1j*phase)
        mean = z.mean()
        r = abs(mean); psi = np.angle(mean)
        new = phase + (omega + K*Kscale*r*np.sin(psi - phase))*DT
        wrapped = new >= 2*np.pi
        for i in np.nonzero(wrapped)[0]:
            spikes[i].append(t)
        phase = np.mod(new, 2*np.pi)
        r_trace.append(r); t_trace.append(t)
        t += DT
    return spikes, np.array(r_trace), np.array(t_trace)

def mix(a, b, f):
    a = np.array(to_rgb(a)); b = np.array(to_rgb(b))
    return tuple(a + (b-a)*float(np.clip(f, 0, 1)))

regimes = [
    ("DRIFT",    0.00, "K = 0 · scatter · r → 0"),
    ("CRITICAL", 0.25, "K ≈ K_c · partial · r ~ 0.5"),
    ("LOCK",     1.60, "K >> K_c · vertical stripes · r → 1"),
]

fig, axes = plt.subplots(1, 3, figsize=(13.5, 4.6))
fig.patch.set_facecolor(BG)
fig.subplots_adjust(left=0.045, right=0.985, top=0.80, bottom=0.13, wspace=0.14)

fig.text(0.045, 0.945, "THE RASTER PLOT", color=INK, fontsize=21,
         fontweight="bold", family="sans-serif", ha="left")
fig.text(0.045, 0.885,
         "Neural Granular Synthesis — population coherence across three coupling regimes. "
         "Each row is one neuron; each tick is a spike. Synchrony index r printed per panel.",
         color=DIM, fontsize=9.5, ha="left", family="serif")

for ax, (name, K, caption) in zip(axes, regimes):
    spikes, r_trace, t_trace = simulate(K)
    r_final = float(np.mean(r_trace[-200:]))
    col = mix(INDIGO, AMBER, r_final)
    ax.set_facecolor(PANEL)
    for i in range(N):
        ts = np.array(spikes[i])
        if ts.size:
            ax.vlines(ts, i+0.12, i+0.88, color=col, lw=0.9)
    ax.set_xlim(0, T); ax.set_ylim(0, N)
    ax.set_xlabel("time (s)", color=DIM, fontsize=8)
    ax.tick_params(colors=DIM, labelsize=7)
    for s in ax.spines.values():
        s.set_color("#2a2a32")
    if ax is axes[0]:
        ax.set_ylabel("neuron index", color=DIM, fontsize=8)
    # r trace overlaid in bottom 22% of the panel
    y0 = 0; yspan = N*0.22
    ax.plot(t_trace, y0 + r_trace*yspan, color=TEAL, lw=1.3, alpha=0.9)
    ax.axhline(y0 + 0.3*yspan, color=DIM, lw=0.6, ls=(0,(3,3)), alpha=0.5)
    # panel title + live r
    ax.set_title(f"{name}   r = {r_final:.2f}", color=col, fontsize=13,
                 fontweight="bold", pad=8, loc="left")
    ax.text(0.99, 0.965, caption, transform=ax.transAxes, ha="right", va="top",
            color=DIM, fontsize=8.0, family="monospace")

fig.text(0.985, 0.022, "Loudon Live · Autodidact Polymaths",
         color=DIM, fontsize=8, ha="right", family="monospace")

out = "Projects/Neural Granular Synthesis/raster-three-regimes.png"
fig.savefig(out, dpi=150, facecolor=BG)
print("wrote", out)
