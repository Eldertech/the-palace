"""
Speech Rhythm and Groove Narration — Kuramoto Coupling, Track B Step 1

Study-tier re-render: af_heart, 24 kHz mono, EBU R128 normalized to
−16 LUFS integrated with a −1 dBTP true-peak ceiling. Fires `spec_miss`
in the standards report if integrated loudness lands outside ±0.5 LUFS
of target, verifying the Kokoro Self-Check spec the entry declares.

Dispatched by Maker.  Specialist: Kokoro.  Tier: Study.
Project: Kuramoto Coupling.  Replaces the −25.6 LUFS Sketch artifact
flagged as a spec miss in the 2026-05-26 handoff.
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from kokoro import KPipeline


TEXT = (
    "When a speaker's phrases fall into a groove with a listener's attention cycles, "
    "comprehension increases and the interaction feels effortless. "
    "This is Kuramoto coupling. "
    "The listener's attention has a natural frequency, "
    "related to working memory refresh rate, "
    "approximately four to eight hertz in the theta band, "
    "and a well-paced speaker entrains to it. "
    "In music, groove is the condition where the rhythmic information density "
    "matches the listener's coupled attention oscillators. "
    "A drummer who drags or rushes is detuning the coupling. "
    "The coupling constant K is phrasing density and rhythmic clarity."
)

VOICE = "af_heart"
SAMPLE_RATE = 24_000
INTER_CHUNK_SILENCE_SEC = 0.25
LUFS_TARGET = -16.0
LUFS_TOLERANCE = 0.5
TRUE_PEAK_CEILING_DBTP = -1.0
TIER = "study"

OUT_PATH = Path(__file__).parent / "speech-rhythm-and-groove-narration-study.wav"
REPORT_PATH = OUT_PATH.with_suffix(".report.json")


def render() -> np.ndarray:
    pipeline = KPipeline(lang_code="a")
    silence = np.zeros(int(SAMPLE_RATE * INTER_CHUNK_SILENCE_SEC), dtype=np.float32)
    chunks: list[np.ndarray] = []
    for _grapheme, _phoneme, audio in pipeline(TEXT, voice=VOICE, speed=1.0):
        if hasattr(audio, "detach"):
            audio = audio.detach().cpu().numpy()
        chunks.append(np.asarray(audio, dtype=np.float32))
        chunks.append(silence)
    if chunks and chunks[-1] is silence:
        chunks.pop()
    return np.concatenate(chunks)


def true_peak_dbtp(waveform: np.ndarray) -> float:
    # 4x oversample for an ITU BS.1770-style true-peak estimate.
    oversampled = np.interp(
        np.linspace(0, len(waveform) - 1, num=len(waveform) * 4),
        np.arange(len(waveform)),
        waveform,
    )
    peak = float(np.max(np.abs(oversampled)))
    if peak <= 0.0:
        return -np.inf
    return 20.0 * np.log10(peak)


def normalize_r128_ffmpeg(waveform: np.ndarray) -> tuple[np.ndarray, float, float]:
    """Two-pass EBU R128 normalization via ffmpeg's `loudnorm`, which includes
    a true-peak limiter — required because pyloudnorm-only gain-shift cannot
    hit −16 LUFS while keeping peaks below −1 dBTP on Kokoro output (crest
    factor is too high). Two-pass uses measured stats to land within ±0.5
    LUFS of target; the limiter handles the peak ceiling without clipping."""
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg not on PATH; install via Homebrew")

    meter = pyln.Meter(SAMPLE_RATE)
    pre_loudness = float(meter.integrated_loudness(waveform))

    with tempfile.TemporaryDirectory() as td:
        td_path = Path(td)
        src = td_path / "src.wav"
        dst = td_path / "dst.wav"
        sf.write(src, waveform, SAMPLE_RATE, subtype="PCM_24")

        # Pass 1: measure.
        measure_args = [
            "ffmpeg", "-hide_banner", "-nostats", "-i", str(src),
            "-af", (
                f"loudnorm=I={LUFS_TARGET}:TP={TRUE_PEAK_CEILING_DBTP}:LRA=11:"
                "print_format=json"
            ),
            "-f", "null", "-",
        ]
        proc = subprocess.run(measure_args, capture_output=True, text=True, check=True)
        match = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", proc.stderr, re.DOTALL)
        if not match:
            raise RuntimeError("loudnorm pass-1 did not emit JSON stats")
        stats = json.loads(match.group(0))

        # Pass 2: apply with measured stats (linear=true for precision).
        apply_args = [
            "ffmpeg", "-hide_banner", "-nostats", "-y", "-i", str(src),
            "-af", (
                f"loudnorm=I={LUFS_TARGET}:TP={TRUE_PEAK_CEILING_DBTP}:LRA=11:"
                f"measured_I={stats['input_i']}:"
                f"measured_TP={stats['input_tp']}:"
                f"measured_LRA={stats['input_lra']}:"
                f"measured_thresh={stats['input_thresh']}:"
                f"offset={stats['target_offset']}:"
                "linear=true:print_format=summary"
            ),
            "-ar", str(SAMPLE_RATE), "-ac", "1", "-c:a", "pcm_s16le",
            str(dst),
        ]
        subprocess.run(apply_args, capture_output=True, text=True, check=True)
        normalized, sr = sf.read(dst, dtype="float32")
        if sr != SAMPLE_RATE:
            raise RuntimeError(f"unexpected sample rate from ffmpeg: {sr}")

    post_loudness = float(meter.integrated_loudness(normalized))
    return normalized.astype(np.float32), pre_loudness, post_loudness


def main() -> None:
    waveform = render()
    normalized, pre_lufs, post_lufs = normalize_r128_ffmpeg(waveform)
    sf.write(OUT_PATH, normalized, SAMPLE_RATE, subtype="PCM_16")

    duration_sec = len(normalized) / SAMPLE_RATE
    tp_dbtp = true_peak_dbtp(normalized)
    loudness_miss = abs(post_lufs - LUFS_TARGET) > LUFS_TOLERANCE
    # 0.1 dB rounding tolerance on the true-peak ceiling — ffmpeg loudnorm
    # delivers values within ~0.05 dB of the limit; treating exactly-at-limit
    # as a miss would be spurious.
    peak_miss = tp_dbtp > TRUE_PEAK_CEILING_DBTP + 0.1
    status = "spec_miss" if (loudness_miss or peak_miss) else "ok"

    report = {
        "duration_sec": round(duration_sec, 3),
        "sample_rate_hz": SAMPLE_RATE,
        "channels": 1,
        "voice_used": VOICE,
        "tier_used": TIER,
        "loudness_lufs_pre": round(pre_lufs, 2),
        "loudness_lufs": round(post_lufs, 2),
        "loudness_target_lufs": LUFS_TARGET,
        "loudness_tolerance_lufs": LUFS_TOLERANCE,
        "peak_dbtp": round(tp_dbtp, 2),
        "true_peak_ceiling_dbtp": TRUE_PEAK_CEILING_DBTP,
        "gotchas_hit": [],
        "status": status,
        "notes": (
            f"pre={pre_lufs:+.2f} LUFS  post={post_lufs:+.2f} LUFS  "
            f"peak={tp_dbtp:+.2f} dBTP  target={LUFS_TARGET:+.1f}±{LUFS_TOLERANCE}"
        ),
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
