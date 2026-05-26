"""
Narrations — Kuramoto Coupling, Round 1 v2

Two Study-tier narrations for the teaching reel:

1. uncoupled-narration.wav — voiced over the two-phasors-uncoupled clip.
   New for v2: gives the silent intro a voice so the reel doesn't open
   silent and have voiceover kick in mid-piece.

2. speech-rhythm-and-groove-narration-study.wav — voiced over the
   sync-arriving Manim animation. v2 changes vs. v1:
   - "Kuramoto" gets a misaki IPA phoneme override (was reading as
     "keromoto"; corrected to /kˌuɹəmˈOtO/).
   - The bare-variable "K" gets a comma on each side so the TTS
     emits a natural pause before and after speaking the letter
     (was running through "constant K is" without breath).

Both are normalized to −16 LUFS / −1 dBTP via two-pass ffmpeg loudnorm.

Dispatched by Maker.  Specialist: Kokoro.  Tier: Study.  Voice: af_heart.
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from kokoro import KPipeline


BUNDLE = Path(__file__).parent
VOICE = "af_heart"
SAMPLE_RATE = 24_000
INTER_CHUNK_SILENCE_SEC = 0.25
LUFS_TARGET = -16.0
LUFS_TOLERANCE = 0.5
TRUE_PEAK_CEILING_DBTP = -1.0
TIER = "study"


@dataclass(frozen=True)
class Job:
    slug: str
    text: str


JOBS = (
    Job(
        slug="uncoupled-narration",
        text=(
            "Two oscillators with slightly different natural frequencies. "
            "One at exactly one hertz, the other at one point oh seven. "
            "No coupling between them — the coupling constant, K, equals zero. "
            "They begin in phase, drift apart, and never re-align."
        ),
    ),
    Job(
        slug="speech-rhythm-and-groove-narration-study",
        text=(
            "When a speaker's phrases fall into a groove with a listener's attention cycles, "
            "comprehension increases and the interaction feels effortless. "
            "This is [Kuramoto](/kˌuɹəmˈOtO/) coupling. "
            "The listener's attention has a natural frequency, "
            "related to working memory refresh rate, "
            "approximately four to eight hertz in the theta band, "
            "and a well-paced speaker entrains to it. "
            "In music, groove is the condition where the rhythmic information density "
            "matches the listener's coupled attention oscillators. "
            "A drummer who drags or rushes is detuning the coupling. "
            "The coupling constant, K, is phrasing density and rhythmic clarity."
        ),
    ),
)


def render(text: str) -> np.ndarray:
    pipeline = KPipeline(lang_code="a")
    silence = np.zeros(int(SAMPLE_RATE * INTER_CHUNK_SILENCE_SEC), dtype=np.float32)
    chunks: list[np.ndarray] = []
    for _grapheme, _phoneme, audio in pipeline(text, voice=VOICE, speed=1.0):
        if hasattr(audio, "detach"):
            audio = audio.detach().cpu().numpy()
        chunks.append(np.asarray(audio, dtype=np.float32))
        chunks.append(silence)
    if chunks and chunks[-1] is silence:
        chunks.pop()
    return np.concatenate(chunks)


def true_peak_dbtp(waveform: np.ndarray) -> float:
    oversampled = np.interp(
        np.linspace(0, len(waveform) - 1, num=len(waveform) * 4),
        np.arange(len(waveform)), waveform,
    )
    peak = float(np.max(np.abs(oversampled)))
    return -np.inf if peak <= 0.0 else 20.0 * np.log10(peak)


def normalize(waveform: np.ndarray) -> tuple[np.ndarray, float, float]:
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg not on PATH")
    meter = pyln.Meter(SAMPLE_RATE)
    pre = float(meter.integrated_loudness(waveform))
    with tempfile.TemporaryDirectory() as td:
        src = Path(td) / "src.wav"
        dst = Path(td) / "dst.wav"
        sf.write(src, waveform, SAMPLE_RATE, subtype="PCM_24")
        p1 = subprocess.run([
            "ffmpeg", "-hide_banner", "-nostats", "-i", str(src),
            "-af", f"loudnorm=I={LUFS_TARGET}:TP={TRUE_PEAK_CEILING_DBTP}:LRA=11:print_format=json",
            "-f", "null", "-",
        ], capture_output=True, text=True, check=True)
        m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p1.stderr, re.DOTALL)
        if not m:
            raise RuntimeError("loudnorm pass-1 did not emit JSON stats")
        stats = json.loads(m.group(0))
        subprocess.run([
            "ffmpeg", "-y", "-hide_banner", "-nostats", "-i", str(src),
            "-af", (
                f"loudnorm=I={LUFS_TARGET}:TP={TRUE_PEAK_CEILING_DBTP}:LRA=11:"
                f"measured_I={stats['input_i']}:"
                f"measured_TP={stats['input_tp']}:"
                f"measured_LRA={stats['input_lra']}:"
                f"measured_thresh={stats['input_thresh']}:"
                f"offset={stats['target_offset']}:"
                "linear=true:print_format=summary"
            ),
            "-ar", str(SAMPLE_RATE), "-ac", "1", "-c:a", "pcm_s16le", str(dst),
        ], capture_output=True, text=True, check=True)
        normalized, _ = sf.read(dst, dtype="float32")
    post = float(meter.integrated_loudness(normalized))
    return normalized.astype(np.float32), pre, post


def main() -> int:
    reports = []
    for job in JOBS:
        wav = render(job.text)
        normalized, pre_lufs, post_lufs = normalize(wav)
        out = BUNDLE / f"{job.slug}.wav"
        sf.write(out, normalized, SAMPLE_RATE, subtype="PCM_16")

        dur = len(normalized) / SAMPLE_RATE
        tp = true_peak_dbtp(normalized)
        loudness_miss = abs(post_lufs - LUFS_TARGET) > LUFS_TOLERANCE
        peak_miss = tp > TRUE_PEAK_CEILING_DBTP + 0.1
        status = "spec_miss" if (loudness_miss or peak_miss) else "ok"

        report = {
            "slug": job.slug,
            "duration_sec": round(dur, 3),
            "sample_rate_hz": SAMPLE_RATE,
            "channels": 1,
            "voice_used": VOICE,
            "tier_used": TIER,
            "loudness_lufs_pre": round(pre_lufs, 2),
            "loudness_lufs": round(post_lufs, 2),
            "peak_dbtp": round(tp, 2),
            "status": status,
        }
        (BUNDLE / f"{job.slug}.report.json").write_text(json.dumps(report, indent=2) + "\n")
        reports.append(report)
        print(f"{job.slug}: {dur:.2f}s, {post_lufs:+.2f} LUFS, {tp:+.2f} dBTP, {status}")
    return 0 if all(r["status"] == "ok" for r in reports) else 1


if __name__ == "__main__":
    sys.exit(main())
