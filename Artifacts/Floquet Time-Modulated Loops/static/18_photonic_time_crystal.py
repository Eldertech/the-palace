"""
18_photonic_time_crystal.py — generate static/18_photonic_time_crystal.png.

Teaching purpose: a frequency bandgap diagram for a representative
photonic time crystal (PTC). A medium whose refractive index n(t) is
modulated periodically in time at GHz scales. Re-mu(omega) is the
Floquet exponent's real part as a function of natural frequency. Bands
of negative gain (decay; ordinary propagation) interspersed with bands
of positive gain (amplification; bandgap-frequency light gets pumped
from vacuum noise).

This is the SAME picture as the Strutt diagram (media-05), but viewed
in the FREQUENCY direction rather than the (a, q) parameter direction.
The bands of positive gain are the tongue intervals projected onto the
frequency axis at fixed modulation depth.

Cross-link in the caption to media-05 (Strutt diagram) and media-11
(Bloch-Floquet duality). The PTC is the operator-level realization of
this picture in the photonics community.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import numpy as np
import matplotlib.pyplot as plt
from mathieu_core import (PALETTE, apply_dark_style,
                          stability_amplitude)


def main(out_png):
    apply_dark_style(plt)

    # Compute Re(mu) along a slice of (a, q) at fixed q.  Vary the
    # natural frequency through several tongue centers a = n^2.  Re-map
    # to "frequency" axis on the GHz scale just for physical
    # suggestiveness.
    print("Computing Floquet gain along a frequency slice...")
    a_vals = np.linspace(0.05, 9.5, 360)
    q_fixed = 0.50
    gain = np.array([stability_amplitude(a, q_fixed,
                                          n_periods=18,
                                          steps_per_period=140)
                     for a in a_vals])
    omega = np.sqrt(np.maximum(a_vals, 0.0))   # natural frequency
    # Map dimensionless natural frequency to GHz for physical context.
    # arbitrary scale factor — meaning is "this lives in microwave/optical".
    GHZ = omega * 6.0

    fig, ax = plt.subplots(figsize=(13, 7), dpi=160)
    ax.plot(GHZ, gain, color=PALETTE["mod"], lw=2.0, zorder=3)
    ax.axhline(0, color=PALETTE["text_dim"], lw=0.8, alpha=0.6)

    # Shade positive-gain regions ("bandgaps that amplify").
    in_band = False; band_start = 0
    for i, g in enumerate(gain):
        if g > 0.005 and not in_band:
            band_start = GHZ[i]; in_band = True
        elif g <= 0.005 and in_band:
            ax.axvspan(band_start, GHZ[i], color=PALETTE["unstable"],
                        alpha=0.18, zorder=1)
            in_band = False
    if in_band:
        ax.axvspan(band_start, GHZ[-1], color=PALETTE["unstable"], alpha=0.18, zorder=1)

    # Annotate the n=1 tongue (around omega = 1) and n=2 (around omega = 2).
    for label, omega_target in [("n = 1\n(primary tongue)", 1.0),
                                ("n = 2", 2.0),
                                ("n = 3", 3.0)]:
        ax.annotate(label, xy=(omega_target * 6, 0.05),
                    xytext=(omega_target * 6, 0.12),
                    color=PALETTE["unstable"], fontsize=9,
                    ha='center',
                    arrowprops=dict(arrowstyle='->', color=PALETTE["unstable"],
                                    lw=0.8))

    ax.set_xlabel(r"frequency  $\omega$  (GHz, suggestive)", fontsize=11)
    ax.set_ylabel(r"effective gain  $\alpha = \mathrm{Re}(\mu)$", fontsize=11)
    ax.set_title("Photonic Time Crystal — Frequency Bandgap Structure",
                 fontsize=15, fontweight='bold', pad=14)
    ax.text(0.5, 1.018,
            "bands of positive gain (orange-shaded) amplify light at those frequencies "
            "from vacuum noise",
            transform=ax.transAxes, ha='center', va='bottom',
            color=PALETTE["text_dim"], fontsize=10, style='italic')
    ax.grid(alpha=0.15)
    ax.set_xlim(GHZ[0], GHZ[-1])

    fig.text(0.5, 0.018,
             "this is the Strutt diagram of media-05 viewed in the FREQUENCY direction, "
             "at fixed q = " + f"{q_fixed:.2f}" + ".  "
             "see also media-11 for the Bloch ↔ Floquet duality.",
             ha='center', color=PALETTE["text_dim"], fontsize=9.5, style='italic')

    fig.tight_layout(rect=[0, 0.04, 1, 0.96])
    fig.savefig(out_png, dpi=160, bbox_inches='tight',
                facecolor=PALETTE["bg"])
    print(f"wrote {out_png}")


if __name__ == "__main__":
    main(os.path.join(os.path.dirname(__file__),
                      "18_photonic_time_crystal.png"))
