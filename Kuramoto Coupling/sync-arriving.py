"""
Sync Arriving — Kuramoto Coupling, Track B Step 3

Eight oscillators with slightly different natural frequencies. K ramps from 0
to K_END over the narration. K_c is computed analytically from the Gaussian ω
distribution; K_END is chosen at ~3× K_c so the population transitions from
drift to lock visibly within the 36 s. Order parameter |R| climbs from near-
zero toward one as the phases pull together.

Dispatched by Maker.  Specialist: Manim CE.  Tier: Study (720p30).
Audio sync: pre-rendered Kokoro Study narration + Whisper word timings.
Render is silent; ffmpeg-muxed afterward.  Duration: 36.475s = exact narration.

Palette matches the Kuramoto arc: indigo (#6366F1), amber (#F59E0B),
dark background (#0B0B10).
"""

from __future__ import annotations

import numpy as np
from manim import (
    Arrow,
    Circle,
    Create,
    FadeIn,
    ManimColor,
    Scene,
    Text,
    UL,
    UR,
    UP,
    ValueTracker,
    VGroup,
    always_redraw,
    config,
)


INDIGO = ManimColor("#6366F1")
AMBER = ManimColor("#F59E0B")
DIM = ManimColor("#3F3F46")
TEXT_DIM = ManimColor("#E5E7EB")
BG = ManimColor("#0B0B10")

DURATION = 36.475
N = 8
SIGMA = 0.30                       # rad/s — std-dev of natural frequencies
K_C = 2.0 * SIGMA * np.sqrt(2.0 / np.pi)   # analytic K_c for a Gaussian g(ω)
K_START = 0.0
K_END = 3.0 * K_C                  # ≈ 0.48 × 3 ≈ 1.43 — comfortably above K_c
SIM_DT = 1.0 / 120.0
RNG_SEED = 7

config.background_color = BG


def simulate() -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Precompute Kuramoto phases on a fixed time grid."""
    rng = np.random.default_rng(RNG_SEED)
    omegas = rng.normal(loc=0.0, scale=SIGMA, size=N)   # rad/s
    theta = rng.uniform(0.0, 2 * np.pi, size=N)
    steps = int(np.ceil(DURATION / SIM_DT)) + 1
    times = np.linspace(0.0, steps * SIM_DT, steps)
    thetas = np.empty((steps, N))
    R = np.empty(steps)
    Karr = np.empty(steps)
    for i, t in enumerate(times):
        K = K_START + (K_END - K_START) * min(1.0, t / DURATION)
        Karr[i] = K
        z = np.exp(1j * theta).mean()
        R[i] = np.abs(z)
        psi = np.angle(z)
        dtheta = omegas + K * R[i] * np.sin(psi - theta)
        theta = theta + dtheta * SIM_DT
        thetas[i] = theta
    return times, thetas, R, Karr


TIMES, THETAS, R_VALS, K_VALS = simulate()


def at(arr: np.ndarray, t: float):
    idx = min(len(TIMES) - 1, max(0, int(t / SIM_DT)))
    return arr[idx]


class SyncArriving(Scene):
    def construct(self) -> None:
        title = Text("Synchronization arriving", font_size=36, color=TEXT_DIM)
        title.to_edge(UP, buff=0.4)
        self.add(title)

        # Scene clock — incremented by an updater so closures can read live time.
        clock = ValueTracker(0.0)
        clock.add_updater(lambda m, dt: m.increment_value(dt))
        self.add(clock)

        # Row of N oscillator dials. Each arrow is an always_redraw factory so
        # the renderer actually picks up its phase changes; mutating-in-place
        # via Arrow.put_start_and_end_on() inside a foreign updater does NOT
        # propagate to the scene's render path in Manim CE 0.20.1.
        radius = 0.5
        spacing = 1.35
        row_y = 0.6
        x_start = -((N - 1) * spacing) / 2

        circles = VGroup(*[
            Circle(radius=radius, color=DIM, stroke_width=2)
                .move_to([x_start + j * spacing, row_y, 0])
            for j in range(N)
        ])
        self.add(circles)

        def make_arrow(j: int):
            def factory() -> Arrow:
                t = float(clock.get_value())
                theta_j = float(at(THETAS, t)[j])
                R_now = float(at(R_VALS, t))
                cx = x_start + j * spacing
                start = np.array([cx, row_y, 0.0])
                tip = start + np.array([
                    radius * np.cos(theta_j),
                    radius * np.sin(theta_j),
                    0.0,
                ])
                col = ManimColor(INDIGO).interpolate(AMBER, min(1.0, R_now))
                return Arrow(
                    start=start, end=tip,
                    color=col, stroke_width=4, buff=0,
                    max_tip_length_to_length_ratio=0.35,
                )
            return factory

        arrows = VGroup(*[always_redraw(make_arrow(j)) for j in range(N)])
        self.add(arrows)

        # Central order parameter R vector inside a unit circle.
        R_center = np.array([0.0, -2.2, 0.0])
        R_radius = 1.1
        unit = Circle(radius=R_radius, color=DIM, stroke_width=2).move_to(R_center)
        r_label = Text("R", font_size=22, color=TEXT_DIM).next_to(unit, UR, buff=0.15)
        self.add(unit, r_label)

        def r_vector_factory() -> Arrow:
            t = float(clock.get_value())
            R_now = float(at(R_VALS, t))
            psi_now = float(np.angle(np.exp(1j * at(THETAS, t)).mean()))
            tip = R_center + np.array([
                R_radius * R_now * np.cos(psi_now),
                R_radius * R_now * np.sin(psi_now),
                0.0,
            ])
            return Arrow(
                start=R_center, end=tip,
                color=AMBER, stroke_width=6, buff=0,
                max_tip_length_to_length_ratio=0.25,
            )

        self.add(always_redraw(r_vector_factory))

        # HUD readouts.
        def k_text() -> Text:
            K_now = float(at(K_VALS, clock.get_value()))
            return Text(f"K = {K_now:.2f}", font_size=22, color=AMBER) \
                .to_corner(UL, buff=0.4)

        def r_text() -> Text:
            R_now = float(at(R_VALS, clock.get_value()))
            return Text(f"|R| = {R_now:.2f}", font_size=22, color=AMBER) \
                .to_corner(UL, buff=0.4).shift(np.array([0.0, -0.4, 0.0]))

        kc_caption = Text(
            f"K_c ≈ {K_C:.2f}  (Gaussian ω, σ = {SIGMA:.2f} rad/s)",
            font_size=16, color=DIM,
        ).to_corner(UL, buff=0.4).shift(np.array([0.0, -0.8, 0.0]))

        self.add(always_redraw(k_text), always_redraw(r_text), kc_caption)

        self.play(FadeIn(title), Create(unit), run_time=0.5)
        self.wait(DURATION - 0.5)
