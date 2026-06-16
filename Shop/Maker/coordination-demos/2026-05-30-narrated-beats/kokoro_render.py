"""
Kokoro narration render for the Phase B gated coordination demo.

Reads narration.txt → emits narration.wav at 24 kHz mono, normalised to
−16 LUFS / −1 dBTP. Voice: af_heart (same as the Kuramoto Round 1
narrations). The pipeline orchestrator dispatches this under the kokoro
venv (`.venvs/kokoro/bin/python kokoro_render.py`).

Output is the contract this script promises: a single readable
narration.wav at the loudness target, with a narration.report.json
sibling holding the measured loudness. The pipeline gate downstream
checks for the WAV's existence before letting Whisper run.
"""

from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from kokoro import KPipeline


BUNDLE = Path(__file__).parent
TEXT_PATH = BUNDLE / "narration.txt"
WAV_PATH = BUNDLE / "narration.wav"
REPORT_PATH = BUNDLE / "narration.report.json"

VOICE = "af_heart"
SAMPLE_RATE = 24_000
LUFS_TARGET = -16.0
TRUE_PEAK_CEILING_DBTP = -1.0


def kokoro_speak(text: str) -> np.ndarray:
    """Run Kokoro on the text, return a single mono float32 array."""
    pipeline = KPipeline(lang_code="a")  # American English
    chunks: list[np.ndarray] = []
    for _, _, audio in pipeline(text, voice=VOICE, speed=1.0, split_pattern=r"\n+"):
        if audio is None:
            continue
        a = np.asarray(audio, dtype=np.float32)
        if a.ndim > 1:
            a = a.mean(axis=1)
        chunks.append(a)
        # 250 ms inter-chunk silence — matches the Kuramoto narrations.
        chunks.append(np.zeros(int(SAMPLE_RATE * 0.25), dtype=np.float32))
    if not chunks:
        raise RuntimeError("Kokoro produced no audio for this text.")
    # Drop the trailing silence so the clip ends on the voice.
    return np.concatenate(chunks[:-1] if len(chunks) > 1 else chunks)


def loudnorm(audio: np.ndarray) -> tuple[np.ndarray, float, float]:
    """Two-pass loudnorm to −16 LUFS / −1 dBTP via ffmpeg, since pyloudnorm
    alone doesn't enforce true-peak ceiling. Returns (audio, lufs, peak_dbtp)."""
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        raw_wav = tmp / "raw.wav"
        norm_wav = tmp / "norm.wav"
        sf.write(raw_wav, audio, SAMPLE_RATE, subtype="PCM_16")
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(raw_wav),
                "-af", f"loudnorm=I={LUFS_TARGET}:TP={TRUE_PEAK_CEILING_DBTP}:LRA=11:print_format=json",
                "-ar", str(SAMPLE_RATE), "-ac", "1",
                str(norm_wav),
            ],
            check=True, capture_output=True,
        )
        normalised, sr = sf.read(norm_wav)
        if sr != SAMPLE_RATE:
            raise RuntimeError(f"ffmpeg dropped sample rate to {sr}; expected {SAMPLE_RATE}")
    meter = pyln.Meter(SAMPLE_RATE)
    lufs = float(meter.integrated_loudness(normalised))
    peak = float(20.0 * np.log10(np.max(np.abs(normalised)) + 1e-12))
    return normalised.astype(np.float32), lufs, peak


def main() -> None:
    text = TEXT_PATH.read_text().strip()
    audio = kokoro_speak(text)
    audio, lufs, peak = loudnorm(audio)
    sf.write(WAV_PATH, audio, SAMPLE_RATE, subtype="PCM_16")
    duration = len(audio) / SAMPLE_RATE
    REPORT_PATH.write_text(json.dumps({
        "voice": VOICE,
        "sample_rate": SAMPLE_RATE,
        "duration_sec": round(duration, 3),
        "integrated_lufs": round(lufs, 2),
        "true_peak_dbtp": round(peak, 2),
        "lufs_target": LUFS_TARGET,
        "true_peak_ceiling_dbtp": TRUE_PEAK_CEILING_DBTP,
        "text": text,
    }, indent=2))
    print(f"[kokoro] {WAV_PATH.name}  {duration:.2f}s  {lufs:.2f} LUFS  peak {peak:.2f} dBTP")


if __name__ == "__main__":
    main()
