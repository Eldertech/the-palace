"""
08_multipliers_vs_params.py — generate static/08_multipliers_vs_params.png.

Teaching purpose: two side-by-side panels.

Left panel: the complex plane of characteristic multipliers, with the
unit circle drawn. Three points placed:
   - inside the unit circle  → STABLE
   - outside the unit circle → UNSTABLE (tongue interior)
   - on the unit circle      → MARGINAL (tongue boundary)

Right panel: the Strutt diagram with three matching points placed in
the corresponding regions. Color coding makes the linkage between the
two panels unambiguous.

The point: the unit circle in the multiplier plane is the bifurcation.
The Strutt diagram is the same fact, drawn in parameter space.

For the Mathieu equation (a Hamiltonian system, det(M) = 1) the two
multipliers are reciprocals: rho_1 * rho_2 = 1. So a "stable" point
in the multiplier plane has BOTH multipliers on the unit circle as
a complex-conjugate pair. An "unstable" point has them as a real
reciprocal pair, one inside and one outside the circle. We use the
larger-magnitude one as our representative point.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch
from mathieu_core import (PALETTE, apply_dark_style,
                          characteristic_multipliers, strutt_grid)


def main(out_png):
    apply_dark_style(plt)

    # Three (a, q) sample points — same convention as media-07.
    sample_pts = [
        (1.50, 0.30, "STABLE",   PALETTE["stable"],     "outside the n=1 tongue"),
        (1.00, 0.30, "UNSTABLE", PALETTE["unstable"],   "inside the n=1 tongue"),
        (1.30, 0.30, "MARGINAL", PALETTE["marginal"],   "near the tongue boundary"),
    ]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 7.2), dpi=160,
                                    gridspec_kw={"width_ratios": [1, 1.2]})

    # ---- Left panel: complex plane with unit circle. ----
    circle = Circle((0, 0), 1.0, fill=False, lw=1.6,
                    edgecolor=PALETTE["multiplier"])
    ax1.add_patch(circle)
    # Grid.
    ax1.axhline(0, color=PALETTE["text_dim"], lw=0.6)
    ax1.axvline(0, color=PALETTE["text_dim"], lw=0.6)

    multipliers_used = []
    for a, q, label, col, _ in sample_pts:
        rhos = characteristic_multipliers(a, q, steps_per_period=2000)
        # Use the larger-magnitude one as the canonical point.
        rho = max(rhos, key=lambda r: abs(r))
        multipliers_used.append(rho)
        x = float(np.real(rho)); y = float(np.imag(rho))
        ax1.plot(x, y, marker='o', ms=14, mfc=col, mec=PALETTE["bg"], mew=2,
                 zorder=10, label=f"{label}  ρ = {x:.2f}{'+' if y>=0 else ''}{y:.2f}i")

    # The unit circle is the bifurcation.
    ax1.set_xlim(-2.5, 2.5); ax1.set_ylim(-2.5, 2.5)
    ax1.set_aspect('equal')
    ax1.set_xlabel("Re(ρ)", fontsize=11)
    ax1.set_ylabel("Im(ρ)", fontsize=11)
    ax1.set_title("Characteristic multipliers in the complex plane",
                  fontsize=12, fontweight='bold')
    ax1.grid(alpha=0.15)
    ax1.legend(fontsize=8, loc='lower left',
               facecolor=PALETTE["bg_card"], edgecolor=PALETTE["border"],
               labelcolor=PALETTE["text_bright"])

    # Annotate the unit circle.
    ax1.text(0, -1.18, "|ρ| = 1   the bifurcation",
             ha='center', va='top', color=PALETTE["multiplier"],
             fontsize=10, style='italic')

    # ---- Right panel: Strutt diagram with three matching points. ----
    print("Computing coarse Strutt grid for right panel...")
    a_vals, q_vals, grid = strutt_grid(
        a_range=(0.0, 4.0), q_range=(0.0, 1.0),
        a_steps=120, q_steps=80,
        n_periods=20, steps_per_period=140,
    )
    g = np.clip(grid, -0.05, 0.4)
    from matplotlib.colors import LinearSegmentedColormap
    cmap = LinearSegmentedColormap.from_list("strutt", [
        (0.00, PALETTE["stable"]),
        (0.30, PALETTE["stable"]),
        (0.42, PALETTE["marginal"]),
        (0.55, PALETTE["unstable"]),
        (1.00, "#7a1a0a")])
    ax2.imshow(g, origin='lower',
               extent=[a_vals[0], a_vals[-1], q_vals[0], q_vals[-1]],
               aspect='auto', cmap=cmap, vmin=-0.05, vmax=0.4,
               interpolation='bilinear')
    ax2.set_xlabel(r"$a$", fontsize=11)
    ax2.set_ylabel(r"$q$", fontsize=11)
    ax2.set_title("Same three points in (a, q) parameter space",
                  fontsize=12, fontweight='bold')

    for (a, q, label, col, sub), rho in zip(sample_pts, multipliers_used):
        ax2.plot(a, q, marker='o', ms=14, mfc=col, mec=PALETTE["bg"],
                 mew=2, zorder=10)
        ax2.annotate(f"{label}\n{sub}", xy=(a, q),
                     xytext=(a + 0.05, q + 0.12 if label != "MARGINAL" else q - 0.18),
                     color=col, fontsize=9,
                     arrowprops=dict(arrowstyle='->', color=col, lw=0.8))

    fig.suptitle("The unit circle is the bifurcation",
                 fontsize=16, fontweight='bold', y=0.99)
    fig.text(0.5, 0.95,
             "left: complex plane.   right: parameter plane.   "
             "same color = same point, two views.",
             ha='center', color=PALETTE["text_dim"], fontsize=10,
             style='italic')

    fig.tight_layout(rect=[0, 0, 1, 0.93])
    fig.savefig(out_png, dpi=160, bbox_inches='tight',
                facecolor=PALETTE["bg"])
    print(f"wrote {out_png}")


if __name__ == "__main__":
    main(os.path.join(os.path.dirname(__file__),
                      "08_multipliers_vs_params.png"))
