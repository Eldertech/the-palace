"""
10_phase_space_strobe.py — generate static/10_phase_space_strobe.png.

Teaching purpose: phase-space portraits of the Mathieu equation, sampled
stroboscopically — one dot per modulation period T = pi. The dot is
the state (x, x_dot) at integer multiples of T.

Stable (left): dots stay on a closed curve. The continuous-time orbit
is a complicated quasi-periodic ribbon, but stroboscopically the
period-T sampling pulls out a circle (or ellipse) — the invariant
torus of the linearized system.

Unstable (right): dots spiral outward exponentially. Each successive
period kicks the state to a state vector farther out. (For the n=1
tongue's primary parametric resonance the bifurcation is period-
doubling, so the spirals can split into two outward sub-orbits.)

This is the Poincare-section view of the same fact the multipliers
told us: stable means |rho| = 1 (pure rotation under the period map),
unstable means |rho| > 1 (an outward stretch).
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import numpy as np
import matplotlib.pyplot as plt
from mathieu_core import (PALETTE, apply_dark_style, integrate_mathieu)


def main(out_png):
    apply_dark_style(plt)

    fig, axes = plt.subplots(1, 2, figsize=(14, 7), dpi=160)

    cases = [
        # (a, q, n_periods, color, title, subtitle)
        (0.50, 0.10, 200, PALETTE["stable"], "STABLE  (outside the n=1 tongue)",
         r"$(a, q) = (0.50,\ 0.10)$"),
        (1.00, 0.30,  35, PALETTE["unstable"], "UNSTABLE  (inside the n=1 tongue)",
         r"$(a, q) = (1.00,\ 0.30)$"),
    ]

    for ax, (a, q, n_periods, col, title, sub) in zip(axes, cases):
        steps_per_period = 200
        t, x, v = integrate_mathieu(a, q, x0=0.5, v0=0.0,
                                    n_periods=n_periods,
                                    steps_per_period=steps_per_period)
        # Continuous trajectory (faint).
        ax.plot(x, v, color=PALETTE["text_dim"], lw=0.5, alpha=0.5,
                zorder=1)
        # Stroboscopic dots: every steps_per_period samples.
        strobe_x = x[::steps_per_period]
        strobe_v = v[::steps_per_period]
        n_pts = len(strobe_x)
        # Color gradient — early dots dim, late dots bright.
        for i in range(n_pts):
            alpha = 0.25 + 0.75 * (i / max(1, n_pts - 1))
            ax.plot(strobe_x[i], strobe_v[i], marker='o', ms=5.5,
                    color=col, alpha=alpha, mec=PALETTE["bg"], mew=0.5,
                    zorder=10)

        ax.axhline(0, color=PALETTE["text_dim"], lw=0.4, alpha=0.5)
        ax.axvline(0, color=PALETTE["text_dim"], lw=0.4, alpha=0.5)
        ax.set_xlabel(r"$x$", fontsize=12)
        ax.set_ylabel(r"$\dot{x}$", fontsize=12)
        ax.set_title(title + "\n" + sub, fontsize=11.5,
                     fontweight='bold', color=col, loc='left',
                     pad=10)
        ax.grid(alpha=0.15)
        # Make limits sensible for each.
        if "STABLE" in title:
            mx = max(np.max(np.abs(x)), np.max(np.abs(v))) * 1.1
            ax.set_xlim(-mx, mx); ax.set_ylim(-mx, mx)
        else:
            mx = max(np.max(np.abs(strobe_x)), np.max(np.abs(strobe_v))) * 1.05
            ax.set_xlim(-mx, mx); ax.set_ylim(-mx, mx)

    fig.suptitle("Stroboscopic Phase-Space Portraits of the Mathieu Equation",
                 fontsize=15, fontweight='bold', y=0.98)
    fig.text(0.5, 0.93,
             "one dot per modulation period T = π   —   stable means closed-curve, "
             "unstable means outward spiral",
             ha='center', color=PALETTE["text_dim"], fontsize=10,
             style='italic')

    fig.tight_layout(rect=[0, 0, 1, 0.91])
    fig.savefig(out_png, dpi=160, bbox_inches='tight',
                facecolor=PALETTE["bg"])
    print(f"wrote {out_png}")


if __name__ == "__main__":
    main(os.path.join(os.path.dirname(__file__),
                      "10_phase_space_strobe.png"))
