"""
05_strutt_diagram.py — generate static/05_strutt_diagram.png.

Teaching purpose: the canonical Strutt diagram (sometimes Ince–Strutt
diagram). For each (a, q) point in parameter space, integrate the
Mathieu equation forward many periods and decide: does the amplitude
grow, or stay bounded? Color the plane accordingly. The result is the
"tongue" structure rooted at a = 1, 4, 9, ..., n^2 on the q = 0 axis.

The first tongue (rooted at a=1) is the primary parametric resonance
— the swing tongue. The Kapitza stable region (a < 0 stabilized by
sufficient q) appears in the negative-a half-plane; we extend the plot
that direction far enough to show it.

Implementation: direct numerical integration on a 240x180 grid. For
each grid point we run 30 modulation periods of symplectic Euler from
(x, v) = (1, 0) and compare final-period peak amplitude to first-period
peak amplitude. The log-ratio per period is a stand-in for the largest
Floquet exponent's real part — positive means unstable, near-zero means
bounded.

Compute time on a typical laptop: ~30–60 seconds. Reported at the
end of the run.
"""

import sys, os, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import FancyArrowPatch
from mathieu_core import PALETTE, apply_dark_style, strutt_grid


def main(out_png):
    apply_dark_style(plt)

    print("Computing Strutt diagram on a 240x180 grid...")
    t0 = time.time()
    a_vals, q_vals, grid = strutt_grid(
        a_range=(-2.0, 10.0),
        q_range=(0.0, 2.5),
        a_steps=240, q_steps=180,
        n_periods=25, steps_per_period=160,
    )
    elapsed = time.time() - t0
    print(f"compute time: {elapsed:.1f} s")

    # The grid holds log-ratio per period. Clip extreme values so the
    # color scale stays readable, then map: negative/zero -> stable
    # (green), positive -> unstable (orange-red), border -> marginal.
    g = np.clip(grid, -0.05, 0.4)

    cmap = LinearSegmentedColormap.from_list(
        "strutt", [
            (0.00, PALETTE["stable"]),
            (0.30, PALETTE["stable"]),
            (0.40, PALETTE["marginal"]),
            (0.50, PALETTE["unstable"]),
            (1.00, "#7a1a0a"),
        ])

    fig, ax = plt.subplots(figsize=(13, 8.5), dpi=160)
    im = ax.imshow(g, origin='lower',
                   extent=[a_vals[0], a_vals[-1], q_vals[0], q_vals[-1]],
                   aspect='auto', cmap=cmap, vmin=-0.05, vmax=0.4,
                   interpolation='bilinear')

    cbar = fig.colorbar(im, ax=ax, fraction=0.04, pad=0.02)
    cbar.set_label("growth rate per period  (log-ratio of amplitude)",
                   color=PALETTE["text_bright"], fontsize=10)
    cbar.ax.yaxis.set_tick_params(color=PALETTE["text"])
    plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color=PALETTE["text"])

    ax.set_xlabel(r"$a$  —  squared natural frequency  ($a = \omega_0^2$)",
                  fontsize=12)
    ax.set_ylabel(r"$q$  —  modulation depth", fontsize=12)
    ax.set_title("The Strutt Diagram",
                 fontsize=18, fontweight='bold', pad=14)
    ax.text(0.5, 1.013,
            "stability of the Mathieu equation in (a, q) parameter space",
            transform=ax.transAxes, ha='center', va='bottom',
            color=PALETTE["text_dim"], fontsize=10, style='italic')

    ax.axhline(0, color=PALETTE["text_dim"], lw=0.8, alpha=0.6)
    ax.axvline(0, color=PALETTE["text_dim"], lw=0.6, alpha=0.4)

    # Tongue annotations. Each tongue is rooted at a = n^2 on q = 0.
    tongue_labels = [
        (1,  "n = 1   primary parametric resonance\n"
             "(the swing tongue) — pump at 2·ω₀"),
        (4,  "n = 2   secondary"),
        (9,  "n = 3   tertiary"),
    ]
    for n_root, txt in tongue_labels:
        ax.plot(n_root, 0, marker='o', ms=7, mfc=PALETTE["marginal"],
                mec=PALETTE["bg"])
        ax.annotate(txt, xy=(n_root, 0), xytext=(n_root + 0.4, 1.2 + 0.4*(n_root//4)),
                    color=PALETTE["text_bright"], fontsize=9.5,
                    arrowprops=dict(arrowstyle='-', color=PALETTE["marginal"],
                                    lw=0.8, alpha=0.7))

    # Kapitza stable annotation.
    ax.annotate("Kapitza stable region\n"
                "inverted pendulum stabilized by\n"
                "fast-enough vertical pivot oscillation",
                xy=(-1.0, 1.6), xytext=(-1.9, 2.05),
                color=PALETTE["multiplier"], fontsize=9.5,
                arrowprops=dict(arrowstyle='->', color=PALETTE["multiplier"],
                                lw=1.0, alpha=0.85))

    # q = 0 axis annotation.
    ax.annotate("q = 0 axis  —  no modulation,\n"
                "every (a, 0) is a simple harmonic oscillator",
                xy=(6.5, 0.0), xytext=(5.5, -0.18),
                color=PALETTE["text_dim"], fontsize=8.5,
                ha='center', annotation_clip=False)

    # Sub-caption.
    ax.text(0.02, -0.12,
            f"computed by direct symplectic-Euler integration on a "
            f"{len(a_vals)}×{len(q_vals)} grid,  "
            f"{elapsed:.1f} s wall time on the build host",
            transform=ax.transAxes, ha='left',
            color=PALETTE["text_dim"], fontsize=8, style='italic')

    fig.tight_layout(rect=[0, 0.03, 1, 0.96])
    fig.savefig(out_png, dpi=160, bbox_inches='tight',
                facecolor=PALETTE["bg"])
    print(f"wrote {out_png}")


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "05_strutt_diagram.png")
    main(out)
