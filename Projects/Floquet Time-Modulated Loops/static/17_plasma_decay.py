"""
17_plasma_decay.py — generate static/17_plasma_decay.png.

Teaching purpose: schematic of laser-plasma parametric decay. A
high-intensity laser at frequency omega_p drives the plasma's
electron-density oscillations. The plasma supports two natural waves
(electron plasma waves at omega_ep and ion-acoustic waves at
omega_ia). When phase matching is satisfied:

    omega_p = omega_ep + omega_ia
    k_p     = k_ep    + k_ia

the laser can decay parametrically into these two waves, dumping
energy into the plasma. This is a major obstacle in inertial-
confinement fusion experiments — the laser energy doesn't get to the
fuel target; it gets eaten by parametric decay along the way.

Same Floquet structure as the audio Mathieu Resonator, the OPO, and
the photonic time crystal. The "tongue" here lives in the laser-plasma
interaction parameter space; crossing the threshold (the laser
intensity above which decay starts) is the parametric bifurcation.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch
from mathieu_core import PALETTE, apply_dark_style


def main(out_png):
    apply_dark_style(plt)

    fig = plt.figure(figsize=(13, 7.5), dpi=160)
    ax = fig.add_subplot(111)
    ax.set_xlim(0, 13); ax.set_ylim(0, 7.5); ax.set_aspect('equal')
    ax.axis('off')

    # Plasma region (cloud-like rectangle with stippling effect).
    plasma_box = FancyBboxPatch(
        (4.0, 2.0), 5.0, 3.5,
        boxstyle="round,pad=0.05,rounding_size=0.4",
        linewidth=2.0,
        edgecolor=PALETTE["mod"],
        facecolor=PALETTE["mod"], alpha=0.10)
    ax.add_patch(plasma_box)
    # "Plasma" stippling: random ions and electrons.
    rng = np.random.default_rng(7)
    for _ in range(80):
        x = 4.2 + 4.6 * rng.random()
        y = 2.2 + 3.1 * rng.random()
        if rng.random() < 0.5:
            ax.plot(x, y, marker='o', ms=4, color=PALETTE["unstable"], alpha=0.5)
        else:
            ax.plot(x, y, marker='+', ms=5, color=PALETTE["multiplier"], alpha=0.5)
    ax.text(6.5, 5.65, "plasma medium  (ions + free electrons)",
            ha='center', color=PALETTE["mod"], fontsize=10.5, fontweight='bold')

    # Pump laser entering.
    pump_arrow = FancyArrowPatch(
        (0.5, 3.75), (4.0, 3.75),
        arrowstyle='->,head_length=14,head_width=10',
        color=PALETTE["unstable"], lw=2.5)
    ax.add_patch(pump_arrow)
    ax.text(2.0, 4.2, "laser  ωₚ",
            ha='center', color=PALETTE["unstable"],
            fontsize=12, fontweight='bold')
    ax.text(2.0, 3.30, "(high-intensity drive)",
            ha='center', color=PALETTE["text_dim"], fontsize=9, style='italic')

    # Decay products: electron plasma wave (out top), ion-acoustic wave (out bottom).
    ep_arrow = FancyArrowPatch(
        (9.0, 3.75 + 0.4), (12.5, 5.8),
        arrowstyle='->,head_length=14,head_width=10',
        color=PALETTE["stable"], lw=2.0)
    ax.add_patch(ep_arrow)
    ax.text(11.5, 6.15, "electron plasma wave  ω_ep",
            color=PALETTE["stable"], fontsize=11, fontweight='bold',
            ha='center')

    ia_arrow = FancyArrowPatch(
        (9.0, 3.75 - 0.4), (12.5, 1.7),
        arrowstyle='->,head_length=14,head_width=10',
        color=PALETTE["marginal"], lw=2.0)
    ax.add_patch(ia_arrow)
    ax.text(11.5, 1.35, "ion-acoustic wave  ω_ia",
            color=PALETTE["marginal"], fontsize=11, fontweight='bold',
            ha='center')

    # Conservation law inset.
    inset_box = FancyBboxPatch(
        (0.5, 5.5), 5.0, 1.6,
        boxstyle="round,pad=0.08,rounding_size=0.2",
        linewidth=1.2, edgecolor=PALETTE["marginal"],
        facecolor=PALETTE["bg_card"])
    ax.add_patch(inset_box)
    ax.text(3.0, 6.7, "the resonance condition",
            ha='center', va='center', color=PALETTE["marginal"],
            fontsize=10, fontweight='bold')
    ax.text(3.0, 6.25, r"$\omega_p = \omega_{\mathrm{ep}} + \omega_{\mathrm{ia}}$",
            ha='center', va='center', color=PALETTE["text_bright"],
            fontsize=14)
    ax.text(3.0, 5.80,
            r"$k_p = k_{\mathrm{ep}} + k_{\mathrm{ia}}$  (phase matching)",
            ha='center', va='center', color=PALETTE["text"], fontsize=10)

    # Bottom annotation.
    ax.text(6.5, 1.05,
            "this is one of the basic problems in inertial-confinement fusion research:",
            ha='center', color=PALETTE["text"], fontsize=10.5,
            fontweight='bold')
    ax.text(6.5, 0.65,
            "the laser energy is being eaten by parametric decay before it reaches the target.",
            ha='center', color=PALETTE["text_dim"], fontsize=10,
            style='italic')

    fig.suptitle("Plasma Parametric Decay  —  Floquet at fusion scale",
                 fontsize=16, fontweight='bold', y=0.97)
    ax.text(6.5, 7.25,
            "structurally identical to the Mathieu Resonator's threshold instability",
            ha='center', color=PALETTE["text_dim"], fontsize=10, style='italic')

    fig.savefig(out_png, dpi=160, bbox_inches='tight',
                facecolor=PALETTE["bg"])
    print(f"wrote {out_png}")


if __name__ == "__main__":
    main(os.path.join(os.path.dirname(__file__), "17_plasma_decay.png"))
