#!/usr/bin/env python3
"""
BLUELINE Track III — THE CLOCK: the (bar,beat) → frame determinism recipe.

The fixed-tempo decision made sync deterministic arithmetic, not elastic alignment.
This module is that arithmetic, and the test below proves the guarantee the
[[BLUELINE — Board Record Schema]] states:

    choose FPS and TEMPO so FRAMES_PER_BEAT is an integer
    → every (bar,beat) maps to an EXACT integer frame → beats land on whole frames.

No Ableton needed — this is pure math; the live transport just supplies (bar,beat).

  frames_per_beat = fps * 60 / tempo          # seconds_per_beat = 60/tempo
  total_beats     = (bar-1)*beats_per_bar + (beat-1)
  frame           = total_beats * frames_per_beat
"""
from fractions import Fraction

def frames_per_beat(tempo, fps):
    """Exact rational frames-per-beat. Integer iff tempo divides fps*60."""
    return Fraction(fps * 60, tempo)

def is_deterministic(tempo, fps):
    return frames_per_beat(tempo, fps).denominator == 1

def bar_beat_to_frame(bar, beat, tempo, fps, beats_per_bar=4):
    """(bar,beat) 1-indexed → frame. Returns (frame_float, is_whole)."""
    total_beats = Fraction(bar - 1) * beats_per_bar + (Fraction(str(beat)) - 1)
    frame = total_beats * frames_per_beat(tempo, fps)
    return float(frame), (frame.denominator == 1)

def suggest_fps(tempo, fps_candidates=(24, 25, 30, 48, 50, 60)):
    """Which standard fps make this tempo deterministic, and the resulting FPB."""
    return [(f, int(frames_per_beat(tempo, f))) for f in fps_candidates if is_deterministic(tempo, f)]

_NOTE = {1: "quarter (beat)", 2: "8th", 4: "16th", 8: "32nd", 16: "64th"}

def smallest_subdivision_whole(tempo, fps):
    """Finest beat-subdivision that still lands on whole frames. Returns (subdivs_per_beat, note_name):
    FPB divisible by N → 1/N-of-a-beat lands whole (N=2 → 8th note, N=4 → 16th, ...)."""
    fpb = frames_per_beat(tempo, fps)
    if fpb.denominator != 1:
        return 0, "none"
    fpb = int(fpb)
    for n in (16, 8, 4, 2, 1):
        if fpb % n == 0:
            return n, _NOTE[n]
    return 1, _NOTE[1]

# ---------------------------------------------------------------- self-test
if __name__ == "__main__":
    print("=== Track III — clock determinism test ===\n")

    # A VALID locked pair (the recipe's guarantee should hold)
    GOOD = (120, 24)   # 120 BPM, 24 fps → 12 frames/beat
    BAD  = (128, 24)   # the Board-Record-Schema's flagged case → 11.25 frames/beat

    for label, (tempo, fps) in [("GOOD", GOOD), ("BAD ", BAD)]:
        fpb = frames_per_beat(tempo, fps)
        print(f"{label}  {tempo} BPM @ {fps} fps  →  frames_per_beat = {fpb} "
              f"({'INTEGER ✓ deterministic' if fpb.denominator==1 else 'NON-INTEGER ✗ drifts'})")
    print()

    # Prove: for GOOD, every on-beat across 64 bars lands on a whole frame; for BAD it doesn't.
    for label, (tempo, fps) in [("GOOD", GOOD), ("BAD ", BAD)]:
        whole = drift = 0
        max_resid = 0.0
        for bar in range(1, 65):
            for beat in (1, 2, 3, 4):
                fr, ok = bar_beat_to_frame(bar, beat, tempo, fps)
                if ok: whole += 1
                else:
                    drift += 1
                    max_resid = max(max_resid, abs(fr - round(fr)))
        print(f"{label}  256 on-beats over 64 bars: {whole} land on whole frames, "
              f"{drift} drift (max residual {max_resid:.3f} frame)")
    print()

    # The subdivision corollary + fps suggestions
    _n, _note = smallest_subdivision_whole(*GOOD)
    print(f"GOOD: finest whole-frame subdivision = 1/{_n}-of-a-beat = {_note} note "
          f"(FPB={int(frames_per_beat(*GOOD))}; 16th=3 frames, 8th=6, beat=12 — all whole)")
    print(f"fps that make 120 BPM deterministic: {suggest_fps(120)}")
    print(f"fps that make 140 BPM deterministic: {suggest_fps(140)}")
    print(f"fps that make 128 BPM deterministic: {suggest_fps(128) or 'NONE of the standard fps'}")

    # Hard assertion (the guarantee)
    assert all(bar_beat_to_frame(b, bt, *GOOD)[1] for b in range(1, 200) for bt in (1,2,3,4)), \
        "GOOD pair must put every on-beat on a whole frame"
    assert any(not bar_beat_to_frame(b, bt, *BAD)[1] for b in range(1, 5) for bt in (1,2,3,4)), \
        "BAD pair must drift off whole frames"
    print("\nASSERTIONS PASS — the determinism guarantee holds for the locked pair, fails for the bad one.")
    print("CLOCK_TEST_DONE")
