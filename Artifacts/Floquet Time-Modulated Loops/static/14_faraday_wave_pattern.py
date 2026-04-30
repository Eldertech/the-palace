"""
14_faraday_wave_pattern.py — generate static/14_faraday_wave_pattern.png.

Teaching purpose: Faraday waves. Vertically vibrate a tray of liquid;
above a critical drive amplitude, standing waves spontaneously appear
on the surface. The pattern selected — squares, hexagons, stripes,
spirals — depends on which spatial Fourier mode's Mathieu tongue most
strongly intercepts the drive.

The mathematical link: each spatial Fourier mode k of the surface
satisfies a Mathieu-like equation in time, with natural frequency
omega_k set by gravity + capillarity (the Kelvin dispersion relation),
and parametric pumping at the drive frequency Omega. The mode's
amplitude grows when Omega is in that mode's tongue; the pattern is
the dominant mode that has built up.

For this image we just SHOW one such pattern — a square standing wave
on a square domain — and label which Mathieu tongue selects it. We
don't simulate the full nonlinear pattern dynamics; this is the
illustration of the mode shape.

Cross-link in the caption: the static Chladni patterns in the
[[2D Wavetable Catalog]] and the dynamic Faraday patterns are siblings
— both are eigenmodes of a 2D wave operator, the difference being that
Chladni's are *driven* eigenmodes of a constrained plate, while Faraday's
are *parametrically pumped* eigenmodes of a free surface.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "python"))

import numpy as np
import matplotlib.pyplot as plt
from mathieu_core import PALETTE, apply_dark_style


def main(out_png):
    apply_dark_style(plt)

    # Square standing wave: psi(x, y, t) = cos(k_x * x) cos(k_y * y) cos(omega t/2)
    # with k_x = k_y = pi (one full wavelength across the domain).
    N = 240
    xx = np.linspace(0, 1, N)
    yy = np.linspace(0, 1, N)
    X, Y = np.meshgrid(xx, yy)
    # Mode (m, n) = (3, 3) — gives a clear 3x3 square pattern.
    m, n = 3, 3
    surface = np.cos(m * np.pi * X) * np.cos(n * np.pi * Y)
    # Slight tilt to evoke "wave" rather than "checkerboard".
    surface = 0.8 * surface + 0.2 * np.cos((m+1) * np.pi * X) * np.cos((n+1) * np.pi * Y)

    fig = plt.figure(figsize=(13, 7.5), dpi=160)
    gs = fig.add_gridspec(1, 2, width_ratios=[1.5, 1.0], wspace=0.25,
                          left=0.06, right=0.96, top=0.90, bottom=0.10)

    ax = fig.add_subplot(gs[0, 0])
    im = ax.imshow(surface, origin='lower', extent=[0, 1, 0, 1],
                   cmap='RdBu_r', vmin=-1, vmax=1)
    ax.set_title("Faraday standing-wave surface  (square mode (m,n) = (3,3))",
                 fontsize=12, fontweight='bold', pad=10)
    ax.set_xlabel("x  (tray length, normalized)", fontsize=10)
    ax.set_ylabel("y", fontsize=10)
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.02,
                 label="surface displacement")

    # Annotation panel on the right — explanatory text + tongue diagram sketch.
    ax2 = fig.add_subplot(gs[0, 1])
    ax2.axis('off')

    # Each row: (text, color, fontsize, weight, style).
    txt = [
        ("Mode selection by parametric resonance",
         PALETTE["text_bright"], 14, 'bold', 'normal'),
        ("", PALETTE["text"], 11, 'normal', 'normal'),
        (r"each spatial mode $\vec{k}$ has natural frequency",
         PALETTE["text"], 11, 'normal', 'normal'),
        (r"$\omega_k = \sqrt{g\,k + \sigma k^3 / \rho}$",
         PALETTE["text_bright"], 12, 'normal', 'normal'),
        (r"(gravity + capillarity dispersion relation)",
         PALETTE["text_dim"], 10, 'normal', 'italic'),
        ("", PALETTE["text"], 11, 'normal', 'normal'),
        ("each mode's amplitude obeys", PALETTE["text"], 11, 'normal', 'normal'),
        (r"$\ddot{A}_k + \omega_k^2 (1 + \epsilon \cos\Omega t)\, A_k = 0$",
         PALETTE["multiplier"], 12, 'normal', 'normal'),
        ("", PALETTE["text"], 11, 'normal', 'normal'),
        (r"$\Rightarrow$ each $k$ has its own Mathieu tongue.",
         PALETTE["text"], 11, 'normal', 'normal'),
        ("the pattern selected at drive frequency", PALETTE["text"], 11, 'normal', 'normal'),
        (r"$\Omega$ is the mode whose tongue most",
         PALETTE["text"], 11, 'normal', 'normal'),
        ("strongly intercepts that drive.", PALETTE["text"], 11, 'normal', 'normal'),
        ("", PALETTE["text"], 11, 'normal', 'normal'),
        ("primary subharmonic resonance:", PALETTE["unstable"], 11, 'bold', 'normal'),
        (r"$\Omega = 2 \omega_k\;\;$ (the n=1 tongue)",
         PALETTE["unstable"], 11, 'normal', 'normal'),
        ("the surface oscillates at HALF the drive", PALETTE["text"], 11, 'normal', 'normal'),
        ("frequency — the parametric signature.", PALETTE["text"], 11, 'normal', 'normal'),
    ]
    y = 0.95
    for text, color, sz, weight, style in txt:
        ax2.text(0.0, y, text, transform=ax2.transAxes, color=color,
                 fontsize=sz, fontweight=weight, fontstyle=style, va='top')
        y -= 0.055 if text else 0.03

    fig.suptitle("Faraday Waves  —  parametric resonance of a fluid surface",
                 fontsize=15, fontweight='bold', y=0.98)

    # Caption with cross-links.
    fig.text(0.5, 0.025,
             "the static Chladni patterns in [[2D Wavetable Catalog]] and the dynamic "
             "Faraday patterns shown here are siblings —  "
             "both are 2D eigenmodes; Chladni's are driven, Faraday's are parametrically pumped.",
             ha='center', color=PALETTE["text_dim"], fontsize=9,
             style='italic')

    fig.savefig(out_png, dpi=160, bbox_inches='tight',
                facecolor=PALETTE["bg"])
    print(f"wrote {out_png}")


if __name__ == "__main__":
    main(os.path.join(os.path.dirname(__file__),
                      "14_faraday_wave_pattern.png"))
