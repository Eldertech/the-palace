"""
Two Phasors, Uncoupled — Kuramoto Coupling, Step 1

Two oscillators rotating at 1.00 Hz and 1.07 Hz, with their sine projections
drawn together on a shared time axis below.  Sketch tier.

Dispatched by Maker.  Specialist: Manim CE.
Project: Kuramoto Coupling.  Tier: Sketch (-pql, 480p, 15fps).
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
    GREY_C,
    UP,
    DOWN,
    LEFT,
    RIGHT,
)


COLOR_A = "#6366F1"   # indigo
COLOR_B = "#F59E0B"   # amber
COLOR_AXIS = "#9CA3AF"


class TwoPhasorsUncoupled(Scene):
    def construct(self):
        f_A = 1.00          # Hz
        f_B = 1.07          # Hz
        duration = 10.0     # seconds

        omega_A = 2 * np.pi * f_A
        omega_B = 2 * np.pi * f_B

        # ── Phasor circles ───────────────────────────────────────────────
        radius = 0.85
        circle_A = Circle(radius=radius, color=COLOR_AXIS, stroke_width=1.5)
        circle_A.move_to([-3.6, 1.7, 0])
        circle_B = Circle(radius=radius, color=COLOR_AXIS, stroke_width=1.5)
        circle_B.move_to([3.6, 1.7, 0])

        center_A = Dot(circle_A.get_center(), radius=0.04, color=COLOR_AXIS)
        center_B = Dot(circle_B.get_center(), radius=0.04, color=COLOR_AXIS)

        label_A = Text("A : 1.00 Hz", font_size=22, color=COLOR_A)
        label_A.next_to(circle_A, DOWN, buff=0.25)
        label_B = Text("B : 1.07 Hz", font_size=22, color=COLOR_B)
        label_B.next_to(circle_B, DOWN, buff=0.25)

        # ── Time tracker ─────────────────────────────────────────────────
        t = ValueTracker(0.0)

        def phasor_tip(circle, omega):
            angle = omega * t.get_value()
            return circle.get_center() + radius * np.array(
                [np.cos(angle), np.sin(angle), 0]
            )

        # ── Rotating phasors ─────────────────────────────────────────────
        def make_phasor(circle, omega, color):
            arrow = Arrow(
                start=circle.get_center(),
                end=circle.get_center() + RIGHT * radius,
                buff=0,
                color=color,
                stroke_width=5,
                max_tip_length_to_length_ratio=0.18,
            )

            def updater(mob):
                mob.put_start_and_end_on(circle.get_center(), phasor_tip(circle, omega))

            arrow.add_updater(updater)
            return arrow

        phasor_A = make_phasor(circle_A, omega_A, COLOR_A)
        phasor_B = make_phasor(circle_B, omega_B, COLOR_B)

        # ── Shared sine axes (lower half) ────────────────────────────────
        axes = Axes(
            x_range=[0, duration, 1],
            y_range=[-1.2, 1.2, 1],
            x_length=11.5,
            y_length=2.6,
            tips=False,
            axis_config={
                "stroke_width": 1.2,
                "color": COLOR_AXIS,
                "include_numbers": False,
            },
        ).move_to([0, -1.7, 0])

        time_label = Text("time →", font_size=18, color=COLOR_AXIS)
        time_label.next_to(axes, RIGHT, buff=0.15).shift(DOWN * 0.05)

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

        trace_A = make_trace(omega_A, COLOR_A)
        trace_B = make_trace(omega_B, COLOR_B)

        # ── Current-sample dots on the sine ──────────────────────────────
        sample_A = always_redraw(
            lambda: Dot(
                axes.c2p(t.get_value(), np.sin(omega_A * t.get_value())),
                radius=0.07,
                color=COLOR_A,
            )
        )
        sample_B = always_redraw(
            lambda: Dot(
                axes.c2p(t.get_value(), np.sin(omega_B * t.get_value())),
                radius=0.07,
                color=COLOR_B,
            )
        )

        # ── Projection lines: phasor tip → current sample ────────────────
        proj_line_A = always_redraw(
            lambda: DashedLine(
                phasor_tip(circle_A, omega_A),
                axes.c2p(t.get_value(), np.sin(omega_A * t.get_value())),
                dash_length=0.08,
                color=COLOR_A,
                stroke_width=1.0,
                stroke_opacity=0.45,
            )
        )
        proj_line_B = always_redraw(
            lambda: DashedLine(
                phasor_tip(circle_B, omega_B),
                axes.c2p(t.get_value(), np.sin(omega_B * t.get_value())),
                dash_length=0.08,
                color=COLOR_B,
                stroke_width=1.0,
                stroke_opacity=0.45,
            )
        )

        # ── Compose ──────────────────────────────────────────────────────
        self.add(
            axes,
            time_label,
            circle_A,
            circle_B,
            center_A,
            center_B,
            label_A,
            label_B,
            trace_A,
            trace_B,
            proj_line_A,
            proj_line_B,
            phasor_A,
            phasor_B,
            sample_A,
            sample_B,
        )

        # Animate
        self.play(t.animate.set_value(duration), run_time=duration, rate_func=linear)
