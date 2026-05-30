"""
Phase B coordinated pipeline — Manim scene.

This scene is GATED on narration.json (Whisper's word-timestamp output).
At construct() time it asserts the JSON exists and is well-formed; if
the gate fails the renderer will not proceed past the first frame.
This is the second of two gates the pipeline enforces (the orchestrator
gates Manim's *invocation* on the JSON's presence; this gates Manim's
*construction* on the JSON's *validity*). Without both, Manim could
race ahead and emit a silent stub.

Visual cues fire on word timestamps from the JSON:
  "phasors"    → two phasor circles appear
  "frequencies"→ frequency labels appear
  "drift"      → sine traces start growing
  "sum"        → sum trace + label appear
  "beat"       → beat envelope highlight
  "Listen"     → final caption

Whisper's transcription may differ in spelling (it heard "phasors" as
"phasers" on the test pass) — the cue lookup is lowercase + prefix
fuzzy + skip-punctuation, and missing cues fail loud.

Dispatched by Maker.  Specialists: Kokoro + Whisper + Manim CE.  Tier: Study.
"""

from __future__ import annotations

import json
import re
import wave
from pathlib import Path

import numpy as np
from manim import (
    Scene,
    Circle,
    Arrow,
    Dot,
    Axes,
    VMobject,
    Text,
    FadeIn,
    ValueTracker,
    always_redraw,
    smooth,
    config,
    ManimColor,
    UP,
    DOWN,
    LEFT,
    RIGHT,
)


# ── Graphite skin tokens (same as Phase A) ───────────────────────────────
BG       = "#0a0a0f"
FG_1     = "#e8e8f0"
FG_2     = "#c8c8d8"
FG_3     = "#8a8aa0"
FG_4     = "#4a4a5a"
ACCENT   = "#e8b84a"
INFO     = "#4a8fff"
SUM_HUE  = "#b07cff"

config.background_color = ManimColor(BG)
config.pixel_width  = 1920
config.pixel_height = 1080
config.frame_rate   = 30


# ── Gate: load + validate the Whisper JSON before anything is built ──────
BUNDLE = Path(__file__).parent
WORDS_JSON = BUNDLE / "narration.json"
NARRATION_WAV = BUNDLE / "narration.wav"

# Words the scene needs to find in the JSON. The cue map intentionally
# names the visual that fires on each. Missing any of them is a HARD
# gate failure — the scene will not render a degraded version.
REQUIRED_CUES = ["phasors", "frequencies", "drift", "sum", "beat", "listen"]


def _norm(word: str) -> str:
    """Lowercase, strip whitespace/punctuation, for fuzzy word matching."""
    return re.sub(r"[^a-z]", "", word.lower())


def gate_load_words(json_path: Path) -> tuple[list[dict], float]:
    """Read + validate narration.json. Raises with a Maker-readable message
    on any failure. Returns (words, clip_duration_sec)."""
    if not json_path.exists():
        raise FileNotFoundError(
            f"[gate] narration.json missing at {json_path}. "
            "Manim must not run before Whisper finishes — re-dispatch the orchestrator."
        )
    data = json.loads(json_path.read_text())
    segments = data.get("segments", [])
    if not segments:
        raise ValueError("[gate] narration.json has no segments — Whisper emitted nothing.")
    words: list[dict] = []
    for seg in segments:
        for w in seg.get("words", []):
            words.append(w)
    if not words:
        raise ValueError("[gate] narration.json has segments but no word-level timestamps.")
    # Monotonic check.
    starts = [w["start"] for w in words]
    if starts != sorted(starts):
        raise ValueError("[gate] word timings are non-monotonic — Whisper output is corrupted.")
    # Clip duration is the AUDIO file's real length, not Whisper's last
    # segment end — Kokoro's tail silence routinely extends past the last
    # transcribed word, and using the segment end as the render length
    # made the first Phase B mux drop the final '.wav' tail (the video
    # ended at 9.90 s and `-shortest` truncated 10.55 s of audio).
    if not NARRATION_WAV.exists():
        raise FileNotFoundError(f"[gate] narration.wav missing at {NARRATION_WAV}")
    with wave.open(str(NARRATION_WAV), "rb") as w:
        clip_dur = w.getnframes() / w.getframerate()
    last_end = words[-1]["end"]
    if last_end > clip_dur + 0.05:
        raise ValueError(
            f"[gate] last word ends at {last_end:.2f}s past WAV duration {clip_dur:.2f}s."
        )
    return words, float(clip_dur)


def cue_time(words: list[dict], target: str, threshold: float = 0.78) -> float:
    """Find the start time of the first word matching `target` (fuzzy).
    Equality / prefix / SequenceMatcher ratio — same matcher as pipeline.py
    so the two gates agree. Hard-fails if absent."""
    from difflib import SequenceMatcher
    needle = _norm(target)
    for w in words:
        wn = _norm(w["word"])
        if wn == needle or wn.startswith(needle) or needle.startswith(wn):
            return float(w["start"])
        if SequenceMatcher(None, wn, needle).ratio() >= threshold:
            return float(w["start"])
    raise ValueError(
        f"[gate] cue word '{target}' not found in narration.json — "
        f"the narration drifted from the cue map; either revise narration.txt or REQUIRED_CUES."
    )


# ── Module-level gate eval: surfaces failure BEFORE Manim renders a frame.
WORDS, CLIP_DUR = gate_load_words(WORDS_JSON)
CUES = {name: cue_time(WORDS, name) for name in REQUIRED_CUES}


class NarratedBeats(Scene):
    def construct(self) -> None:
        # ── Geometry (deferred — only the axes appear at t=0) ────────────
        f_A = 1.00
        f_B = 1.07
        omega_A = 2 * np.pi * f_A
        omega_B = 2 * np.pi * f_B

        radius = 0.85
        circle_A = Circle(radius=radius, color=FG_3, stroke_width=1.5).move_to([-3.6, 1.4, 0])
        circle_B = Circle(radius=radius, color=FG_3, stroke_width=1.5).move_to([ 3.6, 1.4, 0])
        center_A = Dot(circle_A.get_center(), radius=0.04, color=FG_3)
        center_B = Dot(circle_B.get_center(), radius=0.04, color=FG_3)
        phasor_group = [circle_A, circle_B, center_A, center_B]

        label_A = Text("A : 1.00 Hz", font_size=22, color=ACCENT).next_to(circle_A, DOWN, buff=0.22)
        label_B = Text("B : 1.07 Hz", font_size=22, color=INFO  ).next_to(circle_B, DOWN, buff=0.22)

        # Time tracker — drives both phasor rotation and trace growth.
        # Starts at 0; advanced only after the "drift" cue fires.
        t = ValueTracker(0.0)
        drift_start_time = [None]  # set by the drift cue; before that, traces stay frozen

        def trace_t() -> float:
            """Simulated time since drift began, or 0 if drift hasn't fired."""
            if drift_start_time[0] is None:
                return 0.0
            return max(0.0, self.renderer.time - drift_start_time[0])

        def phasor_tip(circle, omega):
            angle = omega * trace_t()
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

        # Shared sine axes
        axes = Axes(
            x_range=[0, CLIP_DUR, 1],
            y_range=[-2.4, 2.4, 1],
            x_length=11.5, y_length=2.6, tips=False,
            axis_config={"stroke_width": 1.2, "color": FG_3, "include_numbers": False},
        ).move_to([0, -1.7, 0])
        time_label = Text("time →", font_size=18, color=FG_3).next_to(axes, RIGHT, buff=0.15).shift(DOWN * 0.05)

        def make_trace(omega, color, amp=1.0):
            trace = VMobject(color=color, stroke_width=3.2)
            trace.set_points_as_corners([axes.c2p(0, 0), axes.c2p(0, 0)])
            def updater(mob):
                tt = trace_t()
                if tt <= 1e-4:
                    mob.set_points_as_corners([axes.c2p(0, 0), axes.c2p(0, 0)])
                    return
                samples = max(8, int(tt * 80))
                ts = np.linspace(0, tt, samples)
                mob.set_points_as_corners([axes.c2p(s, amp * np.sin(omega * s)) for s in ts])
            trace.add_updater(updater)
            return trace

        trace_A = make_trace(omega_A, ACCENT)
        trace_B = make_trace(omega_B, INFO)

        # Sum trace: sin(ωA t) + sin(ωB t) — shows the beat envelope.
        def make_sum_trace():
            trace = VMobject(color=SUM_HUE, stroke_width=3.6)
            trace.set_points_as_corners([axes.c2p(0, 0), axes.c2p(0, 0)])
            def updater(mob):
                tt = trace_t()
                if tt <= 1e-4:
                    mob.set_points_as_corners([axes.c2p(0, 0), axes.c2p(0, 0)])
                    return
                samples = max(8, int(tt * 80))
                ts = np.linspace(0, tt, samples)
                mob.set_points_as_corners([
                    axes.c2p(s, np.sin(omega_A * s) + np.sin(omega_B * s))
                    for s in ts
                ])
            trace.add_updater(updater)
            return trace

        sum_trace = make_sum_trace()
        sum_label = Text("sum : sin(ω_A t) + sin(ω_B t)", font_size=18, color=SUM_HUE).next_to(axes, UP, buff=0.18).align_to(axes, LEFT)

        listen_caption = Text("listen for the beat", font_size=36, color=ACCENT).to_edge(DOWN, buff=0.65)
        footer = Text("Loudon Live · Autodidact Polymaths", font="JetBrains Mono", font_size=14, color=FG_4).to_edge(DOWN, buff=0.18)

        # ── Always-visible scaffold: just the axes + footer at t=0 ───────
        self.add(axes, time_label, footer)

        # ── Cue dispatcher: schedule each visual at its Whisper timestamp ─
        # The renderer's scene clock is exact; we wait *delta* between cues
        # to land each visual at its cue_time within ±1 frame (33ms @ 30fps).
        schedule = [
            ("phasors",     CUES["phasors"],     lambda: self.play(
                FadeIn(circle_A, rate_func=smooth), FadeIn(circle_B, rate_func=smooth),
                FadeIn(center_A, rate_func=smooth), FadeIn(center_B, rate_func=smooth),
                FadeIn(phasor_A, rate_func=smooth), FadeIn(phasor_B, rate_func=smooth),
                run_time=0.40,
            )),
            ("frequencies", CUES["frequencies"], lambda: self.play(
                FadeIn(label_A, rate_func=smooth), FadeIn(label_B, rate_func=smooth),
                run_time=0.30,
            )),
            ("drift",       CUES["drift"],       lambda: (
                # Trigger trace growth by recording the scene time the drift cue fired.
                drift_start_time.__setitem__(0, self.renderer.time),
                self.add(trace_A, trace_B),
                self.wait(0.01),
            )),
            ("sum",         CUES["sum"],         lambda: self.play(
                FadeIn(sum_trace, rate_func=smooth), FadeIn(sum_label, rate_func=smooth),
                run_time=0.30,
            )),
            ("beat",        CUES["beat"],        lambda: self.play(
                # Pulse the sum trace once on the word "beat" — the visual onomatopoeia.
                sum_trace.animate.set_stroke(width=5.6), run_time=0.20,
            )),
            ("listen",      CUES["listen"],      lambda: self.play(
                FadeIn(listen_caption, rate_func=smooth), run_time=0.30,
            )),
        ]

        prev_t = 0.0
        for name, t_cue, action in schedule:
            delta = t_cue - prev_t
            if delta > 1e-3:
                self.wait(delta)
            action()
            prev_t = self.renderer.time

        # Tail: hold to exact clip duration so ffmpeg-mux lines up.
        tail = max(0.0, CLIP_DUR - self.renderer.time)
        if tail > 0.0:
            self.wait(tail)
