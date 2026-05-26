"""
Sync Arriving — Kuramoto Coupling, Track B Step 3

Eight oscillators with slightly different natural frequencies. The coupling
constant K ramps linearly from 0 to 1.2 over the narration's duration. As K
crosses K_c, the phases pull together and the order parameter |R| climbs from
near-zero (incoherent) toward one (locked).

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
    Mobject,
    Scene,
    Text,
    UL,
    UR,
    UP,
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
K_START = 0.0
K_END = 1.2
SIM_DT = 1.0 / 120.0  # 120 Hz physics
RNG_SEED = 7

config.background_color = BG


def simulate() -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Precompute Kuramoto phases on a fixed time grid."""
    rng = np.random.default_rng(RNG_SEED)
    omegas = rng.normal(loc=0.0, scale=0.25, size=N) * 2 * np.pi  # rad/s
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
        # dθ_j/dt = ω_j + K * Im(z * e^{-iθ_j})  (= (K/N) Σ sin(θ_k − θ_j))
        psi = np.angle(z)
        dtheta = omegas + K * R[i] * np.sin(psi - theta)
        theta = theta + dtheta * SIM_DT
        thetas[i] = theta
    return times, thetas, R, Karr


TIMES, THETAS, R_VALS, K_VALS = simulate()


def at(arr: np.ndarray, t: float) -> float | np.ndarray:
    idx = min(len(TIMES) - 1, max(0, int(t / SIM_DT)))
    return arr[idx]


class SyncArriving(Scene):
    def construct(self) -> None:
        title = Text("Synchronization arriving", font_size=36, color=TEXT_DIM)
        title.to_edge(UP, buff=0.4)
        self.add(title)

        # Row of 8 oscillator dials.
        radius = 0.5
        spacing = 1.35
        row_y = 0.6
        row = VGroup()
        arrows: list[Arrow] = []
        circles: list[Circle] = []
        x_start = -((N - 1) * spacing) / 2
        for j in range(N):
            cx = x_start + j * spacing
            c = Circle(radius=radius, color=DIM, stroke_width=2).move_to([cx, row_y, 0])
            theta0 = float(THETAS[0, j])
            tip = [cx + radius * np.cos(theta0), row_y + radius * np.sin(theta0), 0]
            a = Arrow(
                start=[cx, row_y, 0], end=tip,
                color=INDIGO, stroke_width=4, buff=0,
                max_tip_length_to_length_ratio=0.35,
            )
            row.add(c, a)
            circles.append(c)
            arrows.append(a)
        self.add(row)

        # Central order parameter R vector inside a unit circle.
        R_center = np.array([0.0, -2.2, 0.0])
        R_radius = 1.1
        unit = Circle(radius=R_radius, color=DIM, stroke_width=2).move_to(R_center)
        r0 = float(R_VALS[0])
        psi0 = float(np.angle(np.exp(1j * THETAS[0]).mean()))
        r_arrow = Arrow(
            start=R_center,
            end=R_center + np.array([R_radius * r0 * np.cos(psi0),
                                     R_radius * r0 * np.sin(psi0), 0]),
            color=AMBER, stroke_width=6, buff=0,
            max_tip_length_to_length_ratio=0.25,
        )
        r_label = Text("R", font_size=22, color=TEXT_DIM).next_to(unit, UR, buff=0.15)
        self.add(unit, r_arrow, r_label)

        # HUD readouts — Pango Text (no LaTeX dependency).
        scene_clock = {"t": 0.0}

        def k_text() -> Text:
            return Text(
                f"K = {float(at(K_VALS, scene_clock['t'])):.2f}",
                font_size=22, color=AMBER,
            ).to_corner(UL, buff=0.4)

        def r_text() -> Text:
            return Text(
                f"|R| = {float(at(R_VALS, scene_clock['t'])):.2f}",
                font_size=22, color=AMBER,
            ).to_corner(UL, buff=0.4).shift(np.array([0.0, -0.4, 0.0]))

        k_hud = always_redraw(k_text)
        r_hud = always_redraw(r_text)
        kc_caption = Text(
            "K_c ≈ 0.22  (for this ω distribution)",
            font_size=16, color=DIM,
        ).to_corner(UL, buff=0.4).shift(np.array([0.0, -0.8, 0.0]))
        self.add(k_hud, r_hud, kc_caption)

        def update_all(_mob, dt: float) -> None:
            scene_clock["t"] += dt
            t = scene_clock["t"]
            thetas_now = at(THETAS, t)
            R_now = float(at(R_VALS, t))
            K_now = float(at(K_VALS, t))
            psi_now = float(np.angle(np.exp(1j * thetas_now).mean()))

            for j in range(N):
                cx = x_start + j * spacing
                start = np.array([cx, row_y, 0.0])
                tip = start + np.array([radius * np.cos(thetas_now[j]),
                                        radius * np.sin(thetas_now[j]), 0.0])
                # Color shifts from indigo (drift) to amber (locked) with R.
                col = ManimColor(INDIGO).interpolate(AMBER, min(1.0, R_now))
                arrows[j].put_start_and_end_on(start, tip)
                arrows[j].set_color(col)

            _ = K_now  # K is read by the always_redraw HUD; kept for symmetry.
            tip = R_center + np.array([R_radius * R_now * np.cos(psi_now),
                                       R_radius * R_now * np.sin(psi_now), 0.0])
            r_arrow.put_start_and_end_on(R_center, tip)

        driver = Mobject()
        driver.add_updater(update_all)
        self.add(driver)

        # Brief fade-in then hold for the full narration duration.
        self.play(FadeIn(title), Create(unit), run_time=0.5)
        self.wait(DURATION - 0.5)
