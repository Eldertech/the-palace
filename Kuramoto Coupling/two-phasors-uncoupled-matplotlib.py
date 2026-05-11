"""
Two Phasors, Uncoupled — Kuramoto Coupling, Step 1
Matplotlib fallback render.  Sketch tier.

The canonical Manim render for this scene lives at
two_phasors_uncoupled.py and renders cleanly on hosts where
manimpango can install (macOS arm64 in particular).  This script is
the sandbox-friendly Sketch — pure Matplotlib + ffmpeg, no system deps.
"""

import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib.patches import Circle as MPCircle
from matplotlib.lines import Line2D

# ── Parameters ───────────────────────────────────────────────────────────
F_A = 1.00
F_B = 1.07
DURATION = 10.0
FPS = 30                 # smoother than Manim Sketch's 15fps; Matplotlib has no cost penalty
TOTAL_FRAMES = int(DURATION * FPS) + 1

OMEGA_A = 2 * np.pi * F_A
OMEGA_B = 2 * np.pi * F_B

COLOR_A = "#6366F1"      # indigo
COLOR_B = "#F59E0B"      # amber
COLOR_AXIS = "#9CA3AF"
COLOR_BG = "#0B0B10"
COLOR_FG = "#E5E7EB"

OUT_PATH = "/sessions/cool-loving-bell/mnt/outputs/two-phasors-uncoupled.mp4"


def main():
    fig = plt.figure(figsize=(10.6, 6.0), facecolor=COLOR_BG)

    # Phasor A axis (upper-left)
    ax_a = fig.add_axes([0.04, 0.50, 0.28, 0.46])
    # Phasor B axis (upper-right)
    ax_b = fig.add_axes([0.68, 0.50, 0.28, 0.46])
    # Sine plot (lower, full width)
    ax_s = fig.add_axes([0.06, 0.10, 0.90, 0.32])

    for ax in (ax_a, ax_b):
        ax.set_xlim(-1.25, 1.25)
        ax.set_ylim(-1.25, 1.25)
        ax.set_aspect("equal")
        ax.set_facecolor(COLOR_BG)
        ax.set_xticks([])
        ax.set_yticks([])
        for s in ax.spines.values():
            s.set_visible(False)

    # Reference circles
    ax_a.add_patch(MPCircle((0, 0), 1.0, fill=False, ec=COLOR_AXIS, lw=1.0))
    ax_b.add_patch(MPCircle((0, 0), 1.0, fill=False, ec=COLOR_AXIS, lw=1.0))
    ax_a.plot([0], [0], marker="o", ms=3, color=COLOR_AXIS)
    ax_b.plot([0], [0], marker="o", ms=3, color=COLOR_AXIS)
    ax_a.text(0, -1.45, "A : 1.00 Hz", color=COLOR_A, ha="center", fontsize=12)
    ax_b.text(0, -1.45, "B : 1.07 Hz", color=COLOR_B, ha="center", fontsize=12)

    # Sine plot styling
    ax_s.set_xlim(0, DURATION)
    ax_s.set_ylim(-1.25, 1.25)
    ax_s.set_facecolor(COLOR_BG)
    ax_s.spines["top"].set_visible(False)
    ax_s.spines["right"].set_visible(False)
    ax_s.spines["bottom"].set_color(COLOR_AXIS)
    ax_s.spines["left"].set_color(COLOR_AXIS)
    ax_s.tick_params(colors=COLOR_AXIS)
    ax_s.set_xlabel("time  →", color=COLOR_AXIS)
    ax_s.axhline(0, color=COLOR_AXIS, lw=0.6, alpha=0.6)

    # Phasor arrows (drawn as Line2D with a marker for the tip)
    (phasor_a_line,) = ax_a.plot([0, 1], [0, 0], color=COLOR_A, lw=3, solid_capstyle="round")
    phasor_a_tip = ax_a.plot([1], [0], marker="o", ms=7, color=COLOR_A)[0]
    (phasor_b_line,) = ax_b.plot([0, 1], [0, 0], color=COLOR_B, lw=3, solid_capstyle="round")
    phasor_b_tip = ax_b.plot([1], [0], marker="o", ms=7, color=COLOR_B)[0]

    # Sine traces (start empty)
    (trace_a,) = ax_s.plot([], [], color=COLOR_A, lw=2.2)
    (trace_b,) = ax_s.plot([], [], color=COLOR_B, lw=2.2)
    sample_a = ax_s.plot([0], [0], marker="o", ms=7, color=COLOR_A)[0]
    sample_b = ax_s.plot([0], [0], marker="o", ms=7, color=COLOR_B)[0]

    # Pre-sample for fast frame-by-frame slicing
    ts_dense = np.linspace(0, DURATION, TOTAL_FRAMES * 4)   # 4x oversample for smooth curve
    sin_a = np.sin(OMEGA_A * ts_dense)
    sin_b = np.sin(OMEGA_B * ts_dense)

    def update(frame):
        t = frame / FPS
        # Phasor positions
        ang_a = OMEGA_A * t
        ang_b = OMEGA_B * t
        ax_a_x, ax_a_y = np.cos(ang_a), np.sin(ang_a)
        bx, by = np.cos(ang_b), np.sin(ang_b)

        phasor_a_line.set_data([0, ax_a_x], [0, ax_a_y])
        phasor_a_tip.set_data([ax_a_x], [ax_a_y])
        phasor_b_line.set_data([0, bx], [0, by])
        phasor_b_tip.set_data([bx], [by])

        # Sine traces grown to t
        cutoff = np.searchsorted(ts_dense, t, side="right")
        trace_a.set_data(ts_dense[:cutoff], sin_a[:cutoff])
        trace_b.set_data(ts_dense[:cutoff], sin_b[:cutoff])
        sample_a.set_data([t], [np.sin(OMEGA_A * t)])
        sample_b.set_data([t], [np.sin(OMEGA_B * t)])

        return (
            phasor_a_line,
            phasor_a_tip,
            phasor_b_line,
            phasor_b_tip,
            trace_a,
            trace_b,
            sample_a,
            sample_b,
        )

    anim = animation.FuncAnimation(
        fig,
        update,
        frames=TOTAL_FRAMES,
        interval=1000.0 / FPS,
        blit=False,
    )

    writer = animation.FFMpegWriter(
        fps=FPS,
        codec="libx264",
        bitrate=2400,
        extra_args=["-pix_fmt", "yuv420p"],
    )
    anim.save(OUT_PATH, writer=writer, dpi=120, savefig_kwargs={"facecolor": COLOR_BG})
    print(f"WROTE {OUT_PATH}")


if __name__ == "__main__":
    main()
