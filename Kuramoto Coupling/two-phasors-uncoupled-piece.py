"""
Two Phasors, Uncoupled — PIECE tier.

Same content as the 2026-05-10 Sketch and the Study: two oscillators at
1.00 Hz and 1.07 Hz with their sine traces below. The deliberate
Piece-tier additions over Study:

  • Manim LaTeX (MathTex / Tex) typesetting for the phase equations and
    the beat period — the difference that justifies the cost of dragging
    a TeX distribution onto the host.
  • The locked [[Loudon Live Design System]] type stack — Anton (display),
    Cormorant Garamond (body), Manrope (UI), JetBrains Mono (metadata).
    Where a font isn't installed, Manim's Pango falls back; named on
    purpose so the stack is documented in the source even when fallback
    swaps the glyphs.
  • Eased motion — title and equation fades use Manim's `rate_func=smooth`
    (the Bezier-easing cousin of the design system's cubic-bezier(.4,0,.2,1)).
  • Footer: `Loudon Live · Autodidact Polymaths` in mono small.
  • Graphite skin tokens, same as Study, so the Study↔Piece delta is
    purely typesetting + motion polish + signature, not palette.

Dispatched by Maker.  Specialist: Manim CE.
Project: Kuramoto Coupling.  Tier: Piece (1080p30, mastered).

Phase A of SHOP-BUILD-SESSION-2026-05-30 — the third rung of the ladder.
Render: manim -qh --media_dir _manim_media two-phasors-uncoupled-piece.py TwoPhasorsUncoupledPiece

REQUIRES LaTeX (basictex or MacTeX) on the host. Without it, Manim's Tex
pipeline fails. This is the Piece-tier installation surface.
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
    MathTex,
    Tex,
    ValueTracker,
    FadeIn,
    Create,
    always_redraw,
    smooth,
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
FG_1     = "#e8e8f0"
FG_2     = "#c8c8d8"
FG_3     = "#8a8aa0"
FG_4     = "#4a4a5a"
ACCENT   = "#e8b84a"
INFO     = "#4a8fff"

# Locked Loudon Live type stack. If a font isn't installed system-wide,
# Manim's Pango falls back to the next-available; naming it here keeps
# the stack documented in source regardless.
FONT_DISPLAY = "Anton"
FONT_BODY    = "Cormorant Garamond"
FONT_UI      = "Manrope"
FONT_MONO    = "JetBrains Mono"

config.background_color = ManimColor(BG)
config.pixel_width  = 1920
config.pixel_height = 1080
config.frame_rate   = 30


class TwoPhasorsUncoupledPiece(Scene):
    def construct(self) -> None:
        f_A = 1.00
        f_B = 1.07
        duration = 10.0
        omega_A = 2 * np.pi * f_A
        omega_B = 2 * np.pi * f_B
        # Beat period: 1 / |f_A - f_B| ≈ 14.29 s — annotated so the viewer
        # has a name for what they're watching (one full beat is just past
        # the 10 s window).
        T_beat = 1.0 / abs(f_A - f_B)

        # ── Display header (Anton — falls back to Manim default if absent) ─
        title = Text(
            "Two Phasors, Uncoupled",
            font=FONT_DISPLAY, font_size=42, color=FG_1,
        ).to_edge(UP, buff=0.30)

        # ── LaTeX phase-law equation (Piece tier's defining ingredient) ───
        eq = MathTex(
            r"\theta_A(t) = \omega_A\,t,\qquad \theta_B(t) = \omega_B\,t",
            color=FG_2,
        ).scale(0.62).next_to(title, DOWN, buff=0.18)

        # ── Phasor circles ───────────────────────────────────────────────
        radius = 0.85
        circle_A = Circle(radius=radius, color=FG_3, stroke_width=1.5).move_to([-3.6, 1.05, 0])
        circle_B = Circle(radius=radius, color=FG_3, stroke_width=1.5).move_to([ 3.6, 1.05, 0])
        center_A = Dot(circle_A.get_center(), radius=0.04, color=FG_3)
        center_B = Dot(circle_B.get_center(), radius=0.04, color=FG_3)

        # LaTeX-typeset frequency labels — the typographical reason Piece
        # carries the LaTeX dependency. Plain Text would render "omega_A"
        # or "ω_A"; only Tex gets the proper italic ω with subscript.
        label_A = MathTex(
            r"\omega_A / 2\pi = 1.00\ \mathrm{Hz}", color=ACCENT,
        ).scale(0.45).next_to(circle_A, DOWN, buff=0.22)
        label_B = MathTex(
            r"\omega_B / 2\pi = 1.07\ \mathrm{Hz}", color=INFO,
        ).scale(0.45).next_to(circle_B, DOWN, buff=0.22)

        # ── Time tracker ─────────────────────────────────────────────────
        t = ValueTracker(0.0)

        def phasor_tip(circle, omega):
            angle = omega * t.get_value()
            return circle.get_center() + radius * np.array([np.cos(angle), np.sin(angle), 0])

        def make_phasor(circle, omega, color):
            arrow = Arrow(
                start=circle.get_center(),
                end=circle.get_center() + RIGHT * radius,
                buff=0, color=color, stroke_width=5,
                max_tip_length_to_length_ratio=0.18,
            )
            arrow.add_updater(lambda m: m.put_start_and_end_on(circle.get_center(), phasor_tip(circle, omega)))
            return arrow

        phasor_A = make_phasor(circle_A, omega_A, ACCENT)
        phasor_B = make_phasor(circle_B, omega_B, INFO)

        # ── Shared sine axes (lower half) ────────────────────────────────
        axes = Axes(
            x_range=[0, duration, 1],
            y_range=[-1.2, 1.2, 1],
            x_length=11.5, y_length=2.6, tips=False,
            axis_config={"stroke_width": 1.2, "color": FG_3, "include_numbers": False},
        ).move_to([0, -1.85, 0])

        time_label = Tex(r"time $\rightarrow$", color=FG_3).scale(0.45).next_to(axes, RIGHT, buff=0.15).shift(DOWN * 0.05)

        # ── Growing traces ───────────────────────────────────────────────
        def make_trace(omega, color):
            trace = VMobject(color=color, stroke_width=3.2)
            trace.set_points_as_corners([axes.c2p(0, 0), axes.c2p(0, 0)])
            def updater(mob):
                tt = max(t.get_value(), 1e-4)
                samples = max(8, int(tt * 80))
                ts = np.linspace(0, tt, samples)
                mob.set_points_as_corners([axes.c2p(s, np.sin(omega * s)) for s in ts])
            trace.add_updater(updater)
            return trace

        trace_A = make_trace(omega_A, ACCENT)
        trace_B = make_trace(omega_B, INFO)

        sample_A = always_redraw(lambda: Dot(
            axes.c2p(t.get_value(), np.sin(omega_A * t.get_value())),
            radius=0.07, color=ACCENT))
        sample_B = always_redraw(lambda: Dot(
            axes.c2p(t.get_value(), np.sin(omega_B * t.get_value())),
            radius=0.07, color=INFO))

        proj_A = always_redraw(lambda: DashedLine(
            phasor_tip(circle_A, omega_A),
            axes.c2p(t.get_value(), np.sin(omega_A * t.get_value())),
            dash_length=0.08, color=ACCENT, stroke_width=1.0, stroke_opacity=0.45))
        proj_B = always_redraw(lambda: DashedLine(
            phasor_tip(circle_B, omega_B),
            axes.c2p(t.get_value(), np.sin(omega_B * t.get_value())),
            dash_length=0.08, color=INFO, stroke_width=1.0, stroke_opacity=0.45))

        # ── Beat-period annotation (Piece adds the named-quantity readout) ─
        # Centred in the empty band ABOVE the axes, between the two phasor
        # circles (x≈±3.6, leaving x∈[-2.75, 2.75] empty). First attempt
        # was align_to(axes, LEFT) which collided with the ω_A label;
        # second attempt was below the axes which collided with the footer;
        # this is the right home. Deposit-worthy: tight layouts on dark
        # backgrounds make every annotation a placement decision.
        beat_caption = MathTex(
            rf"T_{{\text{{beat}}}} \;=\; \tfrac{{1}}{{|f_A - f_B|}} \;\approx\; {T_beat:.2f}\ \mathrm{{s}}",
            color=FG_3,
        ).scale(0.55).next_to(axes, UP, buff=0.22)

        # ── Footer (locked house signature, mono-small) ──────────────────
        footer = Text(
            "Loudon Live · Autodidact Polymaths",
            font=FONT_MONO, font_size=14, color=FG_4,
        ).to_edge(DOWN, buff=0.18)

        # ── Compose: live-tracked stuff added directly; titled / typeset
        # elements fade in eased per the design system. ──────────────────
        self.add(
            axes, time_label, footer,
            circle_A, circle_B, center_A, center_B,
            trace_A, trace_B, proj_A, proj_B,
            phasor_A, phasor_B, sample_A, sample_B,
        )

        # Eased entrances — smooth() is Manim's Bezier-derived rate_func,
        # the closest in-library analogue to the design system's
        # cubic-bezier(.4, 0, .2, 1) at 220 ms ordinary.
        self.play(
            FadeIn(title, shift=DOWN * 0.10, rate_func=smooth),
            FadeIn(eq, shift=DOWN * 0.06, rate_func=smooth),
            FadeIn(label_A, rate_func=smooth),
            FadeIn(label_B, rate_func=smooth),
            FadeIn(beat_caption, rate_func=smooth),
            run_time=0.55,
        )

        # Main animation: same 10 s pass as Sketch/Study so the three
        # tiers are visually comparable end-to-end.
        self.play(t.animate.set_value(duration), run_time=duration, rate_func=linear)
