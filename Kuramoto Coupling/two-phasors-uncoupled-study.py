"""
Two Phasors, Uncoupled — STUDY tier.

Same content as the 2026-05-10 Sketch (`two-phasors-uncoupled.py`): two
oscillators at 1.00 Hz and 1.07 Hz, drawn together on a shared time axis
below. The deliberate difference: Study tier is 1920×1080@30 (the Sketch
was 480p@15) and the palette is resolved from the [[Loudon Live Design
System]] Graphite skin — bg `#0a0a0f`, axis `#8a8aa0`, primary `#e8e8f0`,
amber accent `#e8b84a` (phasor A), info blue `#4a8fff` (phasor B). The
Sketch's off-system indigo/amber palette is left intact as the historical
anchor; the Study/Piece tier ladder is what brings the visual onto the
design system.

Dispatched by Maker.  Specialist: Manim CE.
Project: Kuramoto Coupling.  Tier: Study (1080p30, working draft).

Phase A of SHOP-BUILD-SESSION-2026-05-30 — first real tier-cost data.
Render: manim -qh two-phasors-uncoupled-study.py TwoPhasorsUncoupledStudy
"""

import numpy as np
from manim import (
    Scene,
    Circle,
    Arrow,
    Dot,
    DashedLine,
    Axes,
    VMobject,
    Text,
    ValueTracker,
    always_redraw,
    linear,
    config,
    ManimColor,
    UP,
    DOWN,
    LEFT,
    RIGHT,
)


# ── Loudon Live · Graphite skin (resolved from
# _ops/loudon-live/design-system/colors_and_type.css) ─────────────────────
BG       = "#0a0a0f"
FG_1     = "#e8e8f0"   # primary
FG_3     = "#8a8aa0"   # axis / tertiary
ACCENT   = "#e8b84a"   # amber — phasor A
INFO     = "#4a8fff"   # blue  — phasor B

config.background_color = ManimColor(BG)
# Study tier holds the mechanical floor: 1920×1080@30.
config.pixel_width  = 1920
config.pixel_height = 1080
config.frame_rate   = 30


class TwoPhasorsUncoupledStudy(Scene):
    def construct(self) -> None:
        f_A = 1.00          # Hz — same close-but-detectable pair as Sketch
        f_B = 1.07          # Hz
        duration = 10.0     # seconds — same as Sketch for tier-comparability

        omega_A = 2 * np.pi * f_A
        omega_B = 2 * np.pi * f_B

        # ── Phasor circles ───────────────────────────────────────────────
        radius = 0.85
        circle_A = Circle(radius=radius, color=FG_3, stroke_width=1.5).move_to([-3.6, 1.7, 0])
        circle_B = Circle(radius=radius, color=FG_3, stroke_width=1.5).move_to([ 3.6, 1.7, 0])

        center_A = Dot(circle_A.get_center(), radius=0.04, color=FG_3)
        center_B = Dot(circle_B.get_center(), radius=0.04, color=FG_3)

        label_A = Text("A : 1.00 Hz", font_size=22, color=ACCENT).next_to(circle_A, DOWN, buff=0.25)
        label_B = Text("B : 1.07 Hz", font_size=22, color=INFO  ).next_to(circle_B, DOWN, buff=0.25)

        # ── Time tracker ─────────────────────────────────────────────────
        t = ValueTracker(0.0)

        def phasor_tip(circle, omega):
            angle = omega * t.get_value()
            return circle.get_center() + radius * np.array([np.cos(angle), np.sin(angle), 0])

        # ── Rotating phasors ─────────────────────────────────────────────
        def make_phasor(circle, omega, color):
            arrow = Arrow(
                start=circle.get_center(),
                end=circle.get_center() + RIGHT * radius,
                buff=0, color=color, stroke_width=5,
                max_tip_length_to_length_ratio=0.18,
            )
            def updater(mob):
                mob.put_start_and_end_on(circle.get_center(), phasor_tip(circle, omega))
            arrow.add_updater(updater)
            return arrow

        phasor_A = make_phasor(circle_A, omega_A, ACCENT)
        phasor_B = make_phasor(circle_B, omega_B, INFO)

        # ── Shared sine axes (lower half) ────────────────────────────────
        axes = Axes(
            x_range=[0, duration, 1],
            y_range=[-1.2, 1.2, 1],
            x_length=11.5, y_length=2.6, tips=False,
            axis_config={"stroke_width": 1.2, "color": FG_3, "include_numbers": False},
        ).move_to([0, -1.7, 0])

        time_label = Text("time →", font_size=18, color=FG_3).next_to(axes, RIGHT, buff=0.15).shift(DOWN * 0.05)

        # ── Growing traces ───────────────────────────────────────────────
        def make_trace(omega, color):
            trace = VMobject(color=color, stroke_width=3.2)
            trace.set_points_as_corners([axes.c2p(0, 0), axes.c2p(0, 0)])
            def updater(mob):
                tt = max(t.get_value(), 1e-4)
                samples = max(8, int(tt * 80))
                ts = np.linspace(0, tt, samples)
                pts = [axes.c2p(s, np.sin(omega * s)) for s in ts]
                mob.set_points_as_corners(pts)
            trace.add_updater(updater)
            return trace

        trace_A = make_trace(omega_A, ACCENT)
        trace_B = make_trace(omega_B, INFO)

        # ── Current-sample dots on the sine ──────────────────────────────
        sample_A = always_redraw(lambda: Dot(
            axes.c2p(t.get_value(), np.sin(omega_A * t.get_value())),
            radius=0.07, color=ACCENT))
        sample_B = always_redraw(lambda: Dot(
            axes.c2p(t.get_value(), np.sin(omega_B * t.get_value())),
            radius=0.07, color=INFO))

        # ── Projection lines: phasor tip → current sample ────────────────
        proj_A = always_redraw(lambda: DashedLine(
            phasor_tip(circle_A, omega_A),
            axes.c2p(t.get_value(), np.sin(omega_A * t.get_value())),
            dash_length=0.08, color=ACCENT, stroke_width=1.0, stroke_opacity=0.45))
        proj_B = always_redraw(lambda: DashedLine(
            phasor_tip(circle_B, omega_B),
            axes.c2p(t.get_value(), np.sin(omega_B * t.get_value())),
            dash_length=0.08, color=INFO, stroke_width=1.0, stroke_opacity=0.45))

        # ── Compose ──────────────────────────────────────────────────────
        self.add(
            axes, time_label,
            circle_A, circle_B, center_A, center_B, label_A, label_B,
            trace_A, trace_B, proj_A, proj_B,
            phasor_A, phasor_B, sample_A, sample_B,
        )

        self.play(t.animate.set_value(duration), run_time=duration, rate_func=linear)
