"""
01_lti_ltv_boundary.py — generate static/01_lti_ltv_boundary.png.

Teaching purpose: place the LTI / LTV boundary in front of a student
visually, before any equations. A two-region diagram with classic
audio devices on each side.

LTI — Linear, Time-Invariant — the special case most of audio
engineering quietly assumes. Coefficients of the difference equation
are constants. Behavior at any future time is identical to behavior
now, just shifted. Everything has one transfer function H(omega) and
that function tells you everything.

LTV — Linear, Time-Varying — coefficients change with time. The system
is still linear (doubling input doubles output), but the input-to-output
map is no longer diagonal in the frequency basis. Energy at one
frequency can show up at a different frequency. The transfer-function
shorthand collapses; we need a richer object — the monodromy matrix
for the periodic case, or a Volterra series for the general case.

The Mathieu equation sits inside LTV as the canonical instance of
"linear with PERIODIC coefficients." Everything we do in this project
lives there.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from mathieu_core import PALETTE, apply_dark_style


def main(out_png):
    apply_dark_style(plt)
    fig, ax = plt.subplots(figsize=(11, 7), dpi=160)

    # Two regions, side by side, with a vertical boundary line.
    # The "boundary" is the wall most of audio engineering doesn't name.
    ax.set_xlim(0, 12); ax.set_ylim(0, 7); ax.set_aspect('equal')
    ax.axis('off')

    # LTI region (left) — a soft green wash.
    lti_box = patches.FancyBboxPatch(
        (0.4, 0.6), 5.2, 5.8,
        boxstyle="round,pad=0.05,rounding_size=0.25",
        linewidth=2, edgecolor=PALETTE["stable"],
        facecolor=PALETTE["stable"], alpha=0.07)
    ax.add_patch(lti_box)
    # LTV region (right) — a warm orange wash.
    ltv_box = patches.FancyBboxPatch(
        (6.4, 0.6), 5.2, 5.8,
        boxstyle="round,pad=0.05,rounding_size=0.25",
        linewidth=2, edgecolor=PALETTE["unstable"],
        facecolor=PALETTE["unstable"], alpha=0.07)
    ax.add_patch(ltv_box)

    # The wall.
    ax.plot([6.0, 6.0], [0.6, 6.4], color=PALETTE["marginal"],
            lw=2.2, linestyle=(0, (8, 4)))
    ax.text(6.0, 6.6, "the wall most of audio engineering pretends\n"
                       "doesn't exist  —  the LTI / LTV boundary",
            ha='center', va='bottom', color=PALETTE["marginal"],
            fontsize=9, style='italic')

    # Region titles.
    ax.text(3.0, 5.95, "LTI",
            ha='center', va='center', color=PALETTE["stable"],
            fontsize=28, fontweight='bold', family='monospace')
    ax.text(3.0, 5.45,
            "Linear, Time-Invariant\n"
            "coefficients constant in time\n"
            "one transfer function H(ω) is the whole story",
            ha='center', va='center', color=PALETTE["text"], fontsize=9.5)

    ax.text(9.0, 5.95, "LTV",
            ha='center', va='center', color=PALETTE["unstable"],
            fontsize=28, fontweight='bold', family='monospace')
    ax.text(9.0, 5.45,
            "Linear, Time-Varying\n"
            "coefficients change in time\n"
            "energy at f can come out at f±n·f_mod",
            ha='center', va='center', color=PALETTE["text"], fontsize=9.5)

    # LTI examples.
    lti_examples = [
        ("Comb filter", 1.6, 4.4),
        ("Biquad lowpass", 4.4, 4.4),
        ("FIR convolution", 1.6, 3.6),
        ("Static IIR delay line", 4.4, 3.6),
        ("Schroeder reverb", 1.6, 2.8),
        ("Linkwitz-Riley crossover", 4.4, 2.8),
    ]
    for label, x, y in lti_examples:
        ax.text(x, y, label, ha='center', va='center',
                color=PALETTE["text_bright"], fontsize=9,
                bbox=dict(boxstyle="round,pad=0.35",
                          facecolor=PALETTE["bg_card"],
                          edgecolor=PALETTE["stable"], lw=1))

    # LTV examples.
    ltv_examples = [
        ("Ring modulator", 7.6, 4.4),
        ("FM oscillator", 10.4, 4.4),
        ("Pumped Karplus-Strong", 7.6, 3.6),
        ("Tremolo / vibrato (audio-rate)", 10.4, 3.6),
        ("Optical parametric oscillator", 7.6, 2.8),
        ("Photonic time crystal", 10.4, 2.8),
    ]
    for label, x, y in ltv_examples:
        ax.text(x, y, label, ha='center', va='center',
                color=PALETTE["text_bright"], fontsize=9,
                bbox=dict(boxstyle="round,pad=0.35",
                          facecolor=PALETTE["bg_card"],
                          edgecolor=PALETTE["unstable"], lw=1))

    # Mathieu callout — the canonical instance of periodic LTV.
    ax.text(9.0, 1.7,
            r"$\ddot{x} + (a - 2q\,\cos 2t)\,x = 0$",
            ha='center', va='center', color=PALETTE["marginal"],
            fontsize=15, fontweight='bold')
    ax.text(9.0, 1.05,
            "the Mathieu equation\n"
            "canonical periodic-coefficient LTV system\n"
            "this project's anchor",
            ha='center', va='top', color=PALETTE["marginal"],
            fontsize=9, style='italic')

    # LTI canonical equation for symmetry.
    ax.text(3.0, 1.7,
            r"$\ddot{x} + 2\zeta\omega_0\,\dot{x} + \omega_0^2\, x = F(t)$",
            ha='center', va='center', color=PALETTE["stable"],
            fontsize=14, fontweight='bold')
    ax.text(3.0, 1.05,
            "the damped driven oscillator\n"
            "every coefficient constant\n"
            "one transfer function says everything",
            ha='center', va='top', color=PALETTE["stable"],
            fontsize=9, style='italic')

    # Title and subtitle.
    fig.suptitle("Linear, Time-Invariant   vs.   Linear, Time-Varying",
                 fontsize=17, fontweight='bold',
                 color=PALETTE["text_bright"], y=0.97)
    ax.text(6.0, 6.95,
            "the LTI / LTV boundary, with audio examples on each side",
            ha='center', va='top', color=PALETTE["text_dim"],
            fontsize=10, style='italic')

    fig.savefig(out_png, dpi=160, bbox_inches='tight',
                facecolor=PALETTE["bg"])
    print(f"wrote {out_png}")


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "01_lti_ltv_boundary.png")
    main(out)
