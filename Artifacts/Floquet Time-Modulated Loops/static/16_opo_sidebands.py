"""
16_opo_sidebands.py — generate static/16_opo_sidebands.png.

Teaching purpose: schematic diagram of an Optical Parametric Oscillator
(OPO).  A pump laser at frequency omega_p enters a chi^(2) nonlinear
crystal (LiNbO3, KTP, BBO, ...).  The crystal converts pump photons into
SIGNAL + IDLER photon pairs satisfying:

    omega_s + omega_i = omega_p          (energy conservation)
    k_s    + k_i    = k_p                (phase matching, momentum cons.)

Above a threshold pump intensity the OPO oscillates spontaneously,
filling the cavity with signal+idler from quantum vacuum noise.
This is parametric resonance at optical frequency.  Same Floquet
equation, twelve orders of magnitude higher in carrier frequency.

The annotation cross-links to media-12 — the OPO selects ONE pair
(omega_s, omega_i) from the full Floquet sideband ladder, the pair
that satisfies phase-matching in the crystal.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Rectangle
from mathieu_core import PALETTE, apply_dark_style


def main(out_png):
    apply_dark_style(plt)

    fig = plt.figure(figsize=(13, 7.5), dpi=160)
    ax = fig.add_subplot(111)
    ax.set_xlim(0, 13); ax.set_ylim(0, 7.5); ax.set_aspect('equal')
    ax.axis('off')

    # The crystal (a rectangle).
    crystal = FancyBboxPatch(
        (4.0, 3.0), 4.0, 1.5,
        boxstyle="round,pad=0.05,rounding_size=0.2",
        linewidth=2.0,
        edgecolor=PALETTE["multiplier"],
        facecolor=PALETTE["multiplier"], alpha=0.18)
    ax.add_patch(crystal)
    ax.text(6.0, 3.75, "χ⁽²⁾ nonlinear crystal\n(LiNbO₃, KTP, BBO)",
            ha='center', va='center', color=PALETTE["multiplier"],
            fontsize=10.5, fontweight='bold')

    # Pump beam coming in from the left.
    pump_arrow = FancyArrowPatch(
        (0.5, 3.75), (4.0, 3.75),
        arrowstyle='->,head_length=14,head_width=10',
        color=PALETTE["unstable"], lw=2.5)
    ax.add_patch(pump_arrow)
    ax.text(2.0, 4.2, "pump  ωₚ",
            ha='center', color=PALETTE["unstable"],
            fontsize=12, fontweight='bold')
    ax.text(2.0, 3.30, "(strong, single-frequency laser)",
            ha='center', color=PALETTE["text_dim"], fontsize=9, style='italic')

    # Signal and idler emerging.
    signal_arrow = FancyArrowPatch(
        (8.0, 3.75 + 0.4), (12.0, 5.5),
        arrowstyle='->,head_length=14,head_width=10',
        color=PALETTE["stable"], lw=2.0)
    ax.add_patch(signal_arrow)
    idler_arrow = FancyArrowPatch(
        (8.0, 3.75 - 0.4), (12.0, 2.0),
        arrowstyle='->,head_length=14,head_width=10',
        color=PALETTE["mod"], lw=2.0)
    ax.add_patch(idler_arrow)
    ax.text(11.5, 5.85, "signal  ωₛ", color=PALETTE["stable"],
            fontsize=12, fontweight='bold', ha='center')
    ax.text(11.5, 1.65, "idler  ωᵢ", color=PALETTE["mod"],
            fontsize=12, fontweight='bold', ha='center')

    # Conservation law inset.
    inset_box = FancyBboxPatch(
        (1.0, 5.5), 5.0, 1.5,
        boxstyle="round,pad=0.08,rounding_size=0.2",
        linewidth=1.2, edgecolor=PALETTE["marginal"],
        facecolor=PALETTE["bg_card"])
    ax.add_patch(inset_box)
    ax.text(3.5, 6.6, "the conservation law",
            ha='center', va='center', color=PALETTE["marginal"],
            fontsize=10, fontweight='bold')
    ax.text(3.5, 6.15, r"$\omega_s + \omega_i = \omega_p$",
            ha='center', va='center', color=PALETTE["text_bright"],
            fontsize=14)
    ax.text(3.5, 5.75, "energy conservation; "
                       "phase matching adds momentum constraint k_s + k_i = k_p",
            ha='center', va='center', color=PALETTE["text_dim"],
            fontsize=8, style='italic')

    # Subtitle and cross-link annotation.
    ax.text(6.5, 1.0,
            "ABOVE THRESHOLD: signal and idler grow from vacuum noise.   "
            "BELOW: nothing emerges.",
            ha='center', color=PALETTE["text"], fontsize=10.5,
            style='italic')
    ax.text(6.5, 0.5,
            "this is parametric resonance at optical scale  —  "
            "Floquet's threshold, twelve orders of magnitude higher.",
            ha='center', color=PALETTE["text_bright"], fontsize=10,
            fontweight='bold')

    fig.suptitle("The Optical Parametric Oscillator (OPO)",
                 fontsize=16, fontweight='bold', y=0.97)
    ax.text(6.5, 7.25,
            "the OPO selects ONE pair (ωₛ, ωᵢ) from the full Floquet sideband ladder",
            ha='center', color=PALETTE["text_dim"], fontsize=10, style='italic')

    # Cross-link footer.
    fig.text(0.5, 0.02,
             "see media-12 for the audio sideband ladder this is sampling from. "
             "see [[Photonic Time Crystals]] for the modern bulk-medium realization.",
             ha='center', color=PALETTE["text_dim"], fontsize=9, style='italic')

    fig.savefig(out_png, dpi=160, bbox_inches='tight',
                facecolor=PALETTE["bg"])
    print(f"wrote {out_png}")


if __name__ == "__main__":
    main(os.path.join(os.path.dirname(__file__), "16_opo_sidebands.png"))
