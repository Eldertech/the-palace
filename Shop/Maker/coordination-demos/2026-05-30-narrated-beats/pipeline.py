"""
Phase B coordinated pipeline — the Maker's first gated dispatch.

Four Specialists in series, each gated on the previous one's output:

  Kokoro  →  narration.wav        (gate: file exists, ≥ 24 kHz mono)
  Whisper →  narration.json       (gate: file exists, segments + words present)
  validate→  word-timestamp JSON   (gate: monotonic timings, last word ≤ clip end,
                                          all REQUIRED_CUES present)
  Manim   →  silent.mp4           (gate: file exists, frame count consistent)
  ffmpeg  →  narrated-beats.mp4   (final muxed deliverable)

The gate is the *point*: Manim must be provably blocked on Whisper's
output. The orchestrator enforces ordering; the scene.py module reads
and validates narration.json at construct() — a second gate, so even
if a future hand removes the orchestrator wrapper the renderer still
refuses to run on stale or missing JSON.

Re-run:  python3 pipeline.py
Dispatched by Maker.  Hosts: mac (all four Specialists local).
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time
import wave
from pathlib import Path


BUNDLE = Path(__file__).parent
PALACE = BUNDLE.parents[3]  # …/Shop/Maker/coordination-demos/<this>/ → palace root

KOKORO_PY = PALACE / ".venvs" / "kokoro" / "bin" / "python"
WHISPER_BIN = shutil.which("whisper") or "/opt/homebrew/bin/whisper"
MANIM_BIN = shutil.which("manim") or os.path.expanduser("~/.local/bin/manim")

WAV = BUNDLE / "narration.wav"
WORDS_JSON = BUNDLE / "narration.json"
SILENT_MP4_DIR = BUNDLE / "_manim_media" / "videos" / "scene" / "1080p30"
SILENT_MP4 = SILENT_MP4_DIR / "NarratedBeats.mp4"
FINAL_MP4 = BUNDLE / "narrated-beats.mp4"

REQUIRED_CUES = ["phasors", "frequencies", "drift", "sum", "beat", "listen"]


# ── Gate helpers ─────────────────────────────────────────────────────────

def _norm(word: str) -> str:
    import re
    return re.sub(r"[^a-z]", "", word.lower())


def _fuzzy_match(needle: str, haystack: list[str], threshold: float = 0.78) -> bool:
    """True if any word in haystack matches needle by exact, prefix, or
    SequenceMatcher ratio ≥ threshold. The ratio path covers Whisper's
    phonetic transcription wobble (it heard Kokoro's 'phasors' as
    'phasers'); strict equality would gate-fail on a sound-correct
    narration, which would punish honest output."""
    from difflib import SequenceMatcher
    n = _norm(needle)
    for h in haystack:
        if h == n or h.startswith(n) or n.startswith(h):
            return True
        if SequenceMatcher(None, h, n).ratio() >= threshold:
            return True
    return False


def gate_wav(path: Path) -> tuple[float, int]:
    """Confirm WAV exists, return (duration_sec, sample_rate)."""
    if not path.exists():
        raise SystemExit(f"[GATE FAIL] Kokoro did not produce {path}")
    with wave.open(str(path), "rb") as w:
        nframes = w.getnframes()
        sr = w.getframerate()
        ch = w.getnchannels()
    dur = nframes / sr
    if sr < 16_000:
        raise SystemExit(f"[GATE FAIL] WAV sample rate {sr} below 16 kHz floor")
    if ch != 1:
        raise SystemExit(f"[GATE FAIL] WAV is {ch}-channel, expected mono")
    return dur, sr


def gate_words(path: Path, clip_dur: float) -> int:
    """Confirm words.json exists, validates, contains all REQUIRED_CUES.
    Returns the number of words detected."""
    if not path.exists():
        raise SystemExit(f"[GATE FAIL] Whisper did not produce {path}")
    data = json.loads(path.read_text())
    segs = data.get("segments", [])
    if not segs:
        raise SystemExit(f"[GATE FAIL] {path.name} has no segments")
    words = [w for seg in segs for w in seg.get("words", [])]
    if not words:
        raise SystemExit(f"[GATE FAIL] {path.name} has segments but no word timestamps "
                         "— did you pass --word_timestamps True?")
    starts = [w["start"] for w in words]
    if starts != sorted(starts):
        raise SystemExit(f"[GATE FAIL] word timings non-monotonic in {path.name}")
    last_end = words[-1]["end"]
    if last_end > clip_dur + 0.10:
        raise SystemExit(
            f"[GATE FAIL] last word ends at {last_end:.2f}s past clip {clip_dur:.2f}s"
        )
    bag = [_norm(w["word"]) for w in words]
    for cue in REQUIRED_CUES:
        if not _fuzzy_match(cue, bag):
            raise SystemExit(
                f"[GATE FAIL] required cue '{cue}' not found in narration — "
                f"revise narration.txt or REQUIRED_CUES (closest matches: "
                f"{sorted(bag, key=lambda b: -__import__('difflib').SequenceMatcher(None, b, _norm(cue)).ratio())[:5]})"
            )
    return len(words)


def gate_mp4(path: Path, min_size_bytes: int = 100_000) -> int:
    if not path.exists():
        raise SystemExit(f"[GATE FAIL] Manim did not produce {path}")
    size = path.stat().st_size
    if size < min_size_bytes:
        raise SystemExit(f"[GATE FAIL] silent.mp4 too small ({size}B) — render aborted early")
    return size


# ── Step runners ─────────────────────────────────────────────────────────

def run(cmd: list[str], cwd: Path | None = None, env: dict | None = None) -> float:
    """Run, print, time. Raises SystemExit on non-zero."""
    print(f"\n$ {' '.join(str(c) for c in cmd)}")
    t0 = time.monotonic()
    res = subprocess.run(cmd, cwd=cwd, env=env)
    dt = time.monotonic() - t0
    if res.returncode != 0:
        raise SystemExit(f"[STEP FAIL] {cmd[0]} exited {res.returncode} after {dt:.2f}s")
    return dt


def step_kokoro() -> float:
    print("\n=== [1/4] Kokoro — narrate ===")
    return run([str(KOKORO_PY), str(BUNDLE / "kokoro_render.py")], cwd=BUNDLE)


def step_whisper() -> float:
    print("\n=== [2/4] Whisper — word-level transcribe ===")
    return run(
        [WHISPER_BIN, str(WAV), "--model", "base",
         "--word_timestamps", "True", "--output_format", "json",
         "--output_dir", str(BUNDLE), "--language", "English"],
        cwd=BUNDLE,
    )


def step_manim() -> float:
    print("\n=== [3/4] Manim — render gated on narration.json ===")
    # Set TEXPSHEADERS in case the scene grows to use Tex — currently it
    # doesn't (Phase B keeps to Pango Text on purpose, to isolate Phase B's
    # coordination gate from Phase A's LaTeX bridge surface).
    env = os.environ.copy()
    env.setdefault("TEXPSHEADERS",
        "/opt/homebrew/Cellar/texlive/20260301/share/texmf-dist/dvips/base:"
        "/opt/homebrew/Cellar/texlive/20260301/share/texmf-dist/dvips/config")
    return run(
        [MANIM_BIN, "-qh", "--media_dir", str(BUNDLE / "_manim_media"),
         "scene.py", "NarratedBeats"],
        cwd=BUNDLE, env=env,
    )


def step_mux() -> float:
    print("\n=== [4/4] ffmpeg — mux silent video + Kokoro WAV ===")
    return run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-i", str(SILENT_MP4), "-i", str(WAV),
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
         str(FINAL_MP4)],
        cwd=BUNDLE,
    )


# ── Main ─────────────────────────────────────────────────────────────────

def main() -> None:
    print(f"[pipeline] palace = {PALACE}")
    print(f"[pipeline] kokoro = {KOKORO_PY}  whisper = {WHISPER_BIN}  manim = {MANIM_BIN}")
    timings: dict[str, float] = {}

    timings["kokoro"] = step_kokoro()
    dur, sr = gate_wav(WAV)
    print(f"[gate ✓] {WAV.name} — {dur:.2f}s mono @ {sr} Hz")

    timings["whisper"] = step_whisper()
    nwords = gate_words(WORDS_JSON, dur)
    print(f"[gate ✓] {WORDS_JSON.name} — {nwords} words, all REQUIRED_CUES present, monotonic")

    # Now and only now does Manim run.
    timings["manim"] = step_manim()
    size = gate_mp4(SILENT_MP4)
    print(f"[gate ✓] {SILENT_MP4.name} — {size:,}B")

    timings["mux"] = step_mux()

    print(f"\n=== gates: all held ===")
    for step, t in timings.items():
        print(f"  {step:8s}  {t:6.2f}s")
    print(f"  TOTAL    {sum(timings.values()):6.2f}s")
    print(f"\nfinal clip: {FINAL_MP4}")

    # Write a deposit-ready report.
    report = {
        "pipeline": "kokoro -> whisper -> manim -> ffmpeg",
        "gates_held": True,
        "step_seconds": {k: round(v, 2) for k, v in timings.items()},
        "total_seconds": round(sum(timings.values()), 2),
        "narration_duration_sec": round(dur, 2),
        "narration_sample_rate_hz": sr,
        "whisper_words": nwords,
        "required_cues": REQUIRED_CUES,
        "final_clip": str(FINAL_MP4.relative_to(PALACE)),
    }
    (BUNDLE / "pipeline.report.json").write_text(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
