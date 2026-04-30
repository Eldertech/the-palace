"""
11_bloch_floquet_duality.py — generate static/11_bloch_floquet_duality.png.

Teaching purpose: the central duality made visual.

LEFT panel — BLOCH IN SPACE.
A 1D crystal. Periodic potential with period a (lattice constant).
Wavefunction psi(x) = exp(i k x) * u(x), where u(x + a) = u(x). Below
the wavefunction overlay we plot the band structure E(k) — the
allowed energies as a function of crystal momentum k. Bandgaps shaded.

RIGHT panel — FLOQUET IN TIME.
A time-modulated medium. Periodic coefficient with period T. State
x(t) = exp(mu * t) * p(t), where p(t + T) = p(t). Below the signal
overlay we plot the gain spectrum alpha(omega) — the real part of
the Floquet exponent as a function of natural frequency. Tongue
intervals shaded.

The two panels are explicit mirrors. Annotations link each spatial
concept to its temporal twin:
  x  <->  t
  a  <->  T
  k  <->  mu
  E  <->  omega
  bandgap (forbidden energy)  <->  tongue (amplifying frequency)

The duality is more than analogy — Bloch's theorem and Floquet's
theorem are the SAME theorem applied to dual independent variables
(space vs. time). Crystals are Bloch in space; time-modulated systems
are Floquet in time. This is also the operator-level realization of
[[Frequency-Time Duality]] in the palace.

Implementation: the spatial band structure is sketched with a clean
empty-lattice approximation (parabolic free-electron bands folded into
the first Brillouin zone, with small-perturbation gaps at zone
boundaries). The temporal gain structure is computed from a real
Mathieu-equation evaluation along a slice — varying a (= omega_0^2)
at fixed q and reading off Re(mu).
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch
from mathieu_core import (PALETTE, apply_dark_style,
                          stability_amplitude)


def floquet_gain_along_a(q=0.30, a_vals=None):
    """Re(mu) as a function of a along a fixed-q slice."""
    if a_vals is None:
        a_vals = np.linspace(0.01, 5.0, 220)
    gain = np.zeros_like(a_vals)
    for i, a in enumerate(a_vals):
        gain[i] = stability_amplitude(a, q, n_periods=20,
                                       steps_per_period=160)
    return a_vals, gain


def empty_lattice_bands(k_vals, n_bands=4):
    """Free-electron bands folded into the first Brillouin zone, with
    a small periodic potential gap at zone boundaries."""
    # Brillouin zone: k in [-pi, pi]. Folded free-electron bands are
    # E_n(k) = (k + 2*pi*m)^2 for integer m, with gaps at k = ±pi.
    # We just give each band a small 0.6 gap at the zone boundary by
    # mixing the two crossing parabolas.
    eps_gap = 0.6
    bands = []
    for n in range(n_bands):
        m = (n + 1) // 2 * (-1 if n % 2 else 1)
        ek = (k_vals + 2.0 * np.pi * m) ** 2
        bands.append(ek)
    bands = np.array(bands)
    # Sort and add a small repulsion at zone boundaries.
    bands.sort(axis=0)
    # Repulsion: at k = ±pi, push bands apart.
    boundary_factor = (np.cos(k_vals)) ** 2
    for n in range(1, n_bands - 1, 2):
        bands[n]   -= 0.5 * eps_gap * (1 - boundary_factor)
        bands[n+1] += 0.5 * eps_gap * (1 - boundary_factor)
    return bands


def main(out_png):
    apply_dark_style(plt)

    fig = plt.figure(figsize=(14.5, 9.5), dpi=160)
    gs = fig.add_gridspec(3, 2, height_ratios=[1.4, 1.0, 1.6],
                          hspace=0.5, wspace=0.30,
                          left=0.07, right=0.97, top=0.92, bottom=0.07)

    # =============== LEFT COLUMN (BLOCH / SPACE) ===============
    ax_lat = fig.add_subplot(gs[0, 0])  # crystal lattice
    ax_wf  = fig.add_subplot(gs[1, 0])  # wavefunction
    ax_bs  = fig.add_subplot(gs[2, 0])  # band structure

    # Crystal lattice: row of atoms.
    ax_lat.set_xlim(-0.5, 6.5); ax_lat.set_ylim(-1, 1)
    ax_lat.axis('off')
    ax_lat.text(0, 0.85, "Bloch in space — 1D crystal",
                fontsize=12, color=PALETTE["multiplier"],
                fontweight='bold')
    for i in range(7):
        ax_lat.plot(i, 0, marker='o', ms=24, mfc=PALETTE["multiplier"],
                    mec=PALETTE["bg"], mew=2)
    # Lattice constant arrow.
    ax_lat.annotate("", xy=(2, -0.6), xytext=(1, -0.6),
                    arrowprops=dict(arrowstyle='<->', color=PALETTE["text_bright"], lw=1.5))
    ax_lat.text(1.5, -0.85, r"lattice constant  $a$",
                ha='center', color=PALETTE["text_bright"], fontsize=10)

    # Wavefunction: psi = exp(ikx) * u(x).
    ax_wf.axis('off')
    ax_wf.text(0, 1.05, r"$\psi(x) = e^{ikx}\, u(x)\quad\;\, u(x+a) = u(x)$",
               fontsize=12, color=PALETTE["text_bright"])
    xx = np.linspace(0, 6, 600)
    u = 0.45 * (1 + 0.55 * np.cos(2*np.pi*xx)) * np.cos(2*np.pi*xx + 0.3)
    plane = np.cos(0.7 * 2 * np.pi * xx)
    psi_real = u * plane
    ax_wf.plot(xx, psi_real, color=PALETTE["multiplier"], lw=1.4)
    # The envelope (u): light overlay
    ax_wf.plot(xx, np.abs(u) * np.sign(plane), color=PALETTE["text_dim"],
               lw=0.6, alpha=0.5)
    ax_wf.set_xlim(0, 6); ax_wf.set_ylim(-1, 1)

    # Band structure E(k).
    k_vals = np.linspace(-np.pi, np.pi, 400)
    bands = empty_lattice_bands(k_vals, 4)
    bands /= bands.max()  # normalize for plot clarity
    for i, b in enumerate(bands):
        ax_bs.plot(k_vals, b, color=PALETTE["multiplier"], lw=1.6)
    # Bandgap regions — find energy intervals not covered by any band.
    # Use a coarse y-grid to find bandgaps.
    yg = np.linspace(0, 1.0, 600)
    is_gap = np.ones_like(yg, dtype=bool)
    for b in bands:
        for y_idx, y in enumerate(yg):
            if (b.min() <= y) and (b.max() >= y) and is_gap[y_idx]:
                if np.any(np.abs(b - y) < 0.005) or (np.min(b) <= y <= np.max(b)):
                    # Better check — energy is inside a band's range.
                    if np.any((b >= y - 0.003) & (b <= y + 0.003)):
                        is_gap[y_idx] = False
    # Highlight gaps as green-yellow horizontal bands.
    in_gap = False; gap_start = 0
    for i, g in enumerate(is_gap):
        if g and not in_gap:
            gap_start = yg[i]; in_gap = True
        elif not g and in_gap:
            ax_bs.axhspan(gap_start, yg[i], color=PALETTE["marginal"],
                          alpha=0.18)
            in_gap = False
    if in_gap:
        ax_bs.axhspan(gap_start, yg[-1], color=PALETTE["marginal"], alpha=0.18)
    ax_bs.set_xlim(-np.pi, np.pi); ax_bs.set_ylim(0, 1.0)
    ax_bs.set_xlabel(r"crystal momentum  $k$  (Brillouin zone)", fontsize=10)
    ax_bs.set_ylabel(r"energy  $E(k)$", fontsize=10)
    ax_bs.set_xticks([-np.pi, 0, np.pi])
    ax_bs.set_xticklabels([r"$-\pi/a$", "0", r"$\pi/a$"])
    ax_bs.set_title("band structure  —  bandgaps shaded yellow",
                    fontsize=10, color=PALETTE["text_bright"], pad=4)
    ax_bs.grid(alpha=0.15)

    # =============== RIGHT COLUMN (FLOQUET / TIME) ===============
    ax_clk = fig.add_subplot(gs[0, 1])
    ax_sg  = fig.add_subplot(gs[1, 1])
    ax_gn  = fig.add_subplot(gs[2, 1])

    # Clock-icon row: time-modulated coefficient.
    ax_clk.set_xlim(-0.5, 6.5); ax_clk.set_ylim(-1, 1)
    ax_clk.axis('off')
    ax_clk.text(0, 0.85, "Floquet in time — time-modulated medium",
                fontsize=12, color=PALETTE["mod"], fontweight='bold')
    for i in range(7):
        # Clock face
        ax_clk.plot(i, 0, marker='o', ms=24, mfc=PALETTE["mod"],
                    mec=PALETTE["bg"], mew=2)
        # Hand
        angle = (i % 4) * np.pi / 2 + 0.4
        ax_clk.plot([i, i + 0.18*np.cos(angle)], [0, 0.18*np.sin(angle)],
                    color=PALETTE["bg"], lw=2)
    ax_clk.annotate("", xy=(2, -0.6), xytext=(1, -0.6),
                    arrowprops=dict(arrowstyle='<->', color=PALETTE["text_bright"], lw=1.5))
    ax_clk.text(1.5, -0.85, r"modulation period  $T$",
                ha='center', color=PALETTE["text_bright"], fontsize=10)

    # Signal: x = exp(mu t) p(t).
    ax_sg.axis('off')
    ax_sg.text(0, 1.05, r"$x(t) = e^{\mu t}\, p(t)\quad\;\, p(t+T) = p(t)$",
               fontsize=12, color=PALETTE["text_bright"])
    tt = np.linspace(0, 6, 600)
    p = 0.45 * (1 + 0.55 * np.cos(2*np.pi*tt)) * np.cos(2*np.pi*tt + 0.3)
    growth = np.exp(0.10 * tt)
    sig = p * growth
    sig = sig / np.max(np.abs(sig)) * 0.95
    ax_sg.plot(tt, sig, color=PALETTE["mod"], lw=1.4)
    ax_sg.plot(tt, np.abs(growth)/np.max(growth), color=PALETTE["unstable"],
               lw=0.8, alpha=0.7, linestyle='--')
    ax_sg.set_xlim(0, 6); ax_sg.set_ylim(-1, 1)

    # Gain spectrum alpha(omega) along a slice through (a, q) at q=0.3.
    print("Computing Floquet gain along a slice...")
    a_vals, gain = floquet_gain_along_a(q=0.30,
                                        a_vals=np.linspace(0.05, 4.5, 180))
    omega = np.sqrt(np.maximum(a_vals, 0))  # natural frequency from a = omega^2
    ax_gn.plot(omega, gain, color=PALETTE["mod"], lw=1.6)
    # Tongue intervals: where gain > small threshold.
    mask = gain > 0.005
    in_tongue = False; t_start = 0
    for i, g in enumerate(mask):
        if g and not in_tongue:
            t_start = omega[i]; in_tongue = True
        elif not g and in_tongue:
            ax_gn.axvspan(t_start, omega[i], color=PALETTE["unstable"],
                          alpha=0.18)
            in_tongue = False
    if in_tongue:
        ax_gn.axvspan(t_start, omega[-1], color=PALETTE["unstable"], alpha=0.18)
    ax_gn.axhline(0, color=PALETTE["text_dim"], lw=0.6, alpha=0.6)
    ax_gn.set_xlim(omega[0], omega[-1])
    ax_gn.set_xlabel(r"natural frequency  $\omega = \sqrt{a}$", fontsize=10)
    ax_gn.set_ylabel(r"gain  $\alpha = \mathrm{Re}(\mu)$", fontsize=10)
    ax_gn.set_title("gain spectrum  —  tongues shaded orange",
                    fontsize=10, color=PALETTE["text_bright"], pad=4)
    ax_gn.grid(alpha=0.15)

    # ============== Center duality annotations ==============
    fig.suptitle("Bloch in space, Floquet in time — the same theorem in dual variables",
                 fontsize=16, fontweight='bold', y=0.985)

    # Variable mapping legend at bottom.
    fig.text(0.5, 0.005,
             r"$x \leftrightarrow t\quad\quad a \leftrightarrow T\quad\quad "
             r"k \leftrightarrow \mu\quad\quad E \leftrightarrow \omega\quad\quad$"
             r"bandgap (forbidden energy)  $\leftrightarrow$  tongue (amplifying frequency)",
             ha='center', fontsize=10.5, color=PALETTE["marginal"])

    fig.savefig(out_png, dpi=160, bbox_inches='tight',
                facecolor=PALETTE["bg"])
    print(f"wrote {out_png}")


if __name__ == "__main__":
    main(os.path.join(os.path.dirname(__file__),
                      "11_bloch_floquet_duality.png"))
