"""
07_tongue_anatomy.py — generate static/07_tongue_anatomy.png.

Teaching purpose: zoom into the n=1 tongue (rooted at a=1 on the q=0
axis), draw its boundary curves analytically, label the three regions
unambiguously: bounded outside, unbounded inside, marginal on the
boundary. Three small inset traces show one time-series example from
each region.

The boundaries of the n=1 tongue at small q come from Mathieu's
classical perturbation expansion. The two leading-order forms are:

    a_minus(q) = 1 - q - q^2/8 + q^3/64 - O(q^4)
    a_plus(q)  = 1 + q - q^2/8 - q^3/64 - O(q^4)

These split the (a, q) plane near a=1 into "outside the tongue"
(stable, a < a_minus or a > a_plus) and "inside" (unstable). The
boundaries themselves are MARGINAL — solutions are bounded but do
not decay.

Inside the tongue the linearized solution grows exponentially. Real
audio implementations cap that growth with saturation (tanh in
Stage 1).
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch
from mathieu_core import PALETTE, apply_dark_style, integrate_mathieu


def a_minus(q):
    return 1.0 - q - q**2/8.0 + q**3/64.0


def a_plus(q):
    return 1.0 + q - q**2/8.0 - q**3/64.0


def main(out_png):
    apply_dark_style(plt)

    fig = plt.figure(figsize=(13, 8.5), dpi=160)
    gs = fig.add_gridspec(3, 4, width_ratios=[3, 1, 1, 1],
                          hspace=0.45, wspace=0.35,
                          left=0.07, right=0.97, top=0.92, bottom=0.08)
    ax = fig.add_subplot(gs[:, 0])

    qs = np.linspace(0.0, 0.8, 400)
    aL = a_minus(qs)
    aR = a_plus(qs)

    # Fill the inside of the tongue with the unstable color.
    ax.fill_betweenx(qs, aL, aR, color=PALETTE["unstable"], alpha=0.25,
                     label="Inside — unbounded")
    # Fill outside with the stable color.
    a_full = np.linspace(0.4, 1.6, 200)
    Q, A = np.meshgrid(qs, a_full, indexing='ij')
    inside = (A > a_minus(Q)[:, None]) & (A < a_plus(Q)[:, None])
    # Background stable wash (just a tinted rect — the unstable region
    # is then redrawn on top).
    ax.axvspan(0.4, 1.6, ymin=0, ymax=1, color=PALETTE["stable"], alpha=0.05)

    # Boundary lines.
    ax.plot(aL, qs, color=PALETTE["marginal"], lw=2.0,
            label="boundary (analytical)")
    ax.plot(aR, qs, color=PALETTE["marginal"], lw=2.0)

    # Sample points: outside, inside, on-boundary.
    sample_pts = [
        (0.85, 0.30, "outside\nbounded — stable", PALETTE["stable"]),
        (1.00, 0.30, "inside\nunbounded — parametric resonance", PALETTE["unstable"]),
        (a_plus(0.30), 0.30, "boundary\nmarginal — neutrally stable",
         PALETTE["marginal"]),
    ]
    for a, q, lbl, col in sample_pts:
        ax.plot(a, q, marker='o', ms=11, mfc=col, mec=PALETTE["bg"],
                mew=2, zorder=10)
        offset_x = 0.05 if a > 1.0 else -0.32
        ax.annotate(lbl, xy=(a, q), xytext=(a + offset_x, q + 0.07),
                    color=col, fontsize=9, ha='left' if a > 1.0 else 'left',
                    zorder=11)

    # Axes & labels.
    ax.set_xlim(0.4, 1.6); ax.set_ylim(0, 0.7)
    ax.set_xlabel(r"$a$  —  squared natural frequency", fontsize=11)
    ax.set_ylabel(r"$q$  —  modulation depth", fontsize=11)
    ax.set_title("The n = 1 Tongue — Anatomy",
                 fontsize=15, fontweight='bold', pad=12)
    ax.text(0.5, 1.018,
            "boundaries from Mathieu's perturbation expansion:  "
            r"$a_\pm = 1 \pm q - q^2/8 \pm q^3/64 + O(q^4)$",
            transform=ax.transAxes, ha='center', va='bottom',
            color=PALETTE["text_dim"], fontsize=9.5, style='italic')
    ax.grid(alpha=0.15)

    # Tongue-tip annotation.
    ax.annotate("tongue rooted at\n"
                "(a, q) = (1, 0)\n"
                r"this is $\omega_0 = 1$,"
                "\nthe pumped swing",
                xy=(1.0, 0.0), xytext=(1.18, 0.1),
                color=PALETTE["text_bright"], fontsize=8.5,
                arrowprops=dict(arrowstyle='->', color=PALETTE["text_dim"],
                                lw=0.8))

    # Three inset time-series traces, stacked on the right.
    inset_axes = [fig.add_subplot(gs[i, 1:]) for i in range(3)]

    # Choose three (a, q) cleanly inside each region.
    inset_specs = [
        (0.85, 0.30, "OUTSIDE  —  bounded, stable",
         PALETTE["stable"], 30),
        (1.00, 0.30, "INSIDE  —  exponentially growing",
         PALETTE["unstable"], 8),
        (a_plus(0.30) - 0.001, 0.30,
         "ON BOUNDARY  —  marginal, neutral",
         PALETTE["marginal"], 30),
    ]
    for ax_i, (a, q, lbl, col, n_periods) in zip(inset_axes, inset_specs):
        t, x, v = integrate_mathieu(a, q, x0=1.0, v0=0.0,
                                    n_periods=n_periods,
                                    steps_per_period=300)
        # For the inside-tongue case clip to a max amplitude so the
        # plot stays readable.
        if "INSIDE" in lbl:
            x = np.clip(x, -200, 200)
        ax_i.plot(t / np.pi, x, color=col, lw=1.0)
        ax_i.set_ylabel("x(t)", fontsize=8.5)
        ax_i.set_xlabel("t / π   (modulation periods)", fontsize=8.5)
        ax_i.set_title(lbl, fontsize=9, color=col, loc='left',
                       fontweight='bold')
        ax_i.grid(alpha=0.2)
        ax_i.tick_params(labelsize=8)

    fig.savefig(out_png, dpi=160, bbox_inches='tight',
                facecolor=PALETTE["bg"])
    print(f"wrote {out_png}")


if __name__ == "__main__":
    main(os.path.join(os.path.dirname(__file__), "07_tongue_anatomy.png"))
