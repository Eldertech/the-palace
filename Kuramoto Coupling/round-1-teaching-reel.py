"""
Round 1 Teaching Reel — Kuramoto Coupling

Concats the two-phasors-uncoupled Manim clip + a Matplotlib title-card slide
+ the sync-arriving narrated animation into a single end-to-end teaching reel.
Audio: silent under the first two clips, then the Kokoro Study narration under
sync-arriving. Final reel is loudnorm-passed for an EBU R128 −16 LUFS target,
which is a no-op on the silent prefix and a check on the narrated tail.

Dispatched by Maker.  Specialist: ffmpeg.  Tier: Study.
Project: Kuramoto Coupling.  Note: the interactive two-phasor coupling explorer
(p5.js HTML) is *not* in this reel — interactive content doesn't reduce to
linear video without a screen-record pass. The title card points the viewer at
the explorer for that step.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

import matplotlib.pyplot as plt


BUNDLE = Path(__file__).parent
TITLE_PNG = BUNDLE / "_title-card.png"
TITLE_CLIP = BUNDLE / "_title-card.mp4"
UNCOUPLED_NORM = BUNDLE / "_uncoupled-720p30.mp4"
PRENORM = BUNDLE / "_round-1-prenorm.mp4"
OUT = BUNDLE / "round-1-teaching-reel.mp4"
REPORT = BUNDLE / "round-1-teaching-reel.report.json"

UNCOUPLED = BUNDLE / "two-phasors-uncoupled-manim.mp4"
SYNC_ARRIVING = BUNDLE / "sync-arriving.mp4"

TITLE_LEN_SEC = 3.0
TARGET_FPS = 30
TARGET_W, TARGET_H = 1280, 720
LUFS_TARGET = -16.0
TP_TARGET = -1.0


def make_title_card() -> None:
    fig = plt.figure(figsize=(TARGET_W / 100, TARGET_H / 100),
                     dpi=100, facecolor="#0B0B10")
    ax = fig.add_subplot(111)
    ax.set_facecolor("#0B0B10")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_axis_off()
    ax.text(0.5, 0.62, "Now couple them.", ha="center", va="center",
            fontsize=46, color="#E5E7EB", family="serif")
    ax.text(0.5, 0.45,
            "K rises from 0 across the next 36 seconds.",
            ha="center", va="center", fontsize=22,
            color="#F59E0B", family="serif", style="italic")
    ax.text(0.5, 0.34,
            "Watch the order parameter |R| climb.",
            ha="center", va="center", fontsize=18,
            color="#6366F1", family="serif")
    ax.text(0.5, 0.12,
            "Drag the K slider in the interactive explorer for the in-between.",
            ha="center", va="center", fontsize=14,
            color="#71717A", family="serif")
    fig.savefig(TITLE_PNG, dpi=100, facecolor="#0B0B10",
                edgecolor="none", bbox_inches=None, pad_inches=0)
    plt.close(fig)


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, check=True)


def png_to_clip() -> None:
    run([
        "ffmpeg", "-y", "-loop", "1", "-i", str(TITLE_PNG),
        "-t", str(TITLE_LEN_SEC), "-r", str(TARGET_FPS),
        "-vf", f"scale={TARGET_W}:{TARGET_H}:flags=lanczos,format=yuv420p",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-an", str(TITLE_CLIP),
        "-loglevel", "error",
    ])


def normalize_uncoupled() -> None:
    """Scale 854x480@15 → 1280x720@30 with letterbox padding to match
    sync-arriving's geometry exactly. concat demuxer requires identical
    streams."""
    run([
        "ffmpeg", "-y", "-i", str(UNCOUPLED),
        "-vf",
        (f"scale={TARGET_W}:{TARGET_H}:force_original_aspect_ratio=decrease:flags=lanczos,"
         f"pad={TARGET_W}:{TARGET_H}:(ow-iw)/2:(oh-ih)/2:color=#0B0B10,"
         f"fps={TARGET_FPS},format=yuv420p"),
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-an", str(UNCOUPLED_NORM),
        "-loglevel", "error",
    ])


def concat_with_audio() -> None:
    """concat filter (re-encode) is required because the three clips
    arrive with mismatched audio presence — uncoupled and title are
    silent, sync-arriving carries the narration. Generate silent audio
    tracks for the silent clips and concat all three."""
    uncoupled_dur = float(ffprobe_duration(UNCOUPLED_NORM))
    sync_dur = float(ffprobe_duration(SYNC_ARRIVING))
    # Two separate silent sources — reusing a single [N:a] inside concat
    # plays the full source each time it appears (real ffmpeg gotcha; the
    # filter doesn't trim to match the paired video segment's length).
    run([
        "ffmpeg", "-y",
        "-i", str(UNCOUPLED_NORM),
        "-i", str(TITLE_CLIP),
        "-i", str(SYNC_ARRIVING),
        "-f", "lavfi", "-t", str(uncoupled_dur),
        "-i", "anullsrc=channel_layout=mono:sample_rate=24000",
        "-f", "lavfi", "-t", str(TITLE_LEN_SEC),
        "-i", "anullsrc=channel_layout=mono:sample_rate=24000",
        "-filter_complex",
        ("[0:v][3:a][1:v][4:a][2:v][2:a]"
         "concat=n=3:v=1:a=1[v][a]"),
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        str(PRENORM),
        "-loglevel", "error",
    ])
    return uncoupled_dur, sync_dur, uncoupled_dur + TITLE_LEN_SEC


def loudnorm_two_pass() -> tuple[float, float]:
    """Two-pass loudnorm on the concatenated output."""
    pass1 = run([
        "ffmpeg", "-hide_banner", "-nostats", "-i", str(PRENORM),
        "-af", (f"loudnorm=I={LUFS_TARGET}:TP={TP_TARGET}:LRA=11:"
                "print_format=json"),
        "-f", "null", "-",
    ])
    match = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", pass1.stderr, re.DOTALL)
    if not match:
        raise RuntimeError("loudnorm pass-1 did not emit JSON stats")
    stats = json.loads(match.group(0))
    run([
        "ffmpeg", "-y", "-i", str(PRENORM),
        "-af", (
            f"loudnorm=I={LUFS_TARGET}:TP={TP_TARGET}:LRA=11:"
            f"measured_I={stats['input_i']}:"
            f"measured_TP={stats['input_tp']}:"
            f"measured_LRA={stats['input_lra']}:"
            f"measured_thresh={stats['input_thresh']}:"
            f"offset={stats['target_offset']}:"
            "linear=true:print_format=summary"
        ),
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        str(OUT),
        "-loglevel", "error",
    ])
    return float(stats["input_i"]), float(stats["input_tp"])


def ffprobe_duration(path: Path) -> str:
    p = run([
        "ffprobe", "-v", "error", "-show_entries",
        "format=duration", "-of", "csv=p=0", str(path),
    ])
    return p.stdout.strip()


def ffprobe_streams(path: Path) -> dict:
    p = run([
        "ffprobe", "-v", "error",
        "-show_streams", "-show_format",
        "-of", "json", str(path),
    ])
    return json.loads(p.stdout)


def main() -> int:
    if not UNCOUPLED.exists() or not SYNC_ARRIVING.exists():
        print(f"missing input: {UNCOUPLED.exists()=} {SYNC_ARRIVING.exists()=}",
              file=sys.stderr)
        return 1
    make_title_card()
    png_to_clip()
    normalize_uncoupled()
    uncoupled_dur, sync_dur, silent_total = concat_with_audio()
    pre_lufs, pre_tp = loudnorm_two_pass()

    final = ffprobe_streams(OUT)
    duration = float(final["format"]["duration"])
    video_stream = next(s for s in final["streams"] if s["codec_type"] == "video")
    audio_stream = next(s for s in final["streams"] if s["codec_type"] == "audio")

    expected = uncoupled_dur + TITLE_LEN_SEC + sync_dur
    duration_miss = abs(duration - expected) > 0.5
    status = "spec_miss" if duration_miss else "ok"

    report = {
        "duration_sec": round(duration, 3),
        "expected_duration_sec": round(expected, 3),
        "container": "mp4",
        "video_codec": video_stream["codec_name"],
        "resolution": f"{video_stream['width']}x{video_stream['height']}",
        "frame_rate": video_stream["r_frame_rate"],
        "audio_codec": audio_stream["codec_name"],
        "audio_bitrate_kbps": int(audio_stream.get("bit_rate", 0)) // 1000,
        "sample_rate_hz": int(audio_stream["sample_rate"]),
        "channels": int(audio_stream["channels"]),
        "loudness_lufs_pre": round(pre_lufs, 2),
        "loudness_target_lufs": LUFS_TARGET,
        "peak_dbtp_pre": round(pre_tp, 2),
        "tier_used": "study",
        "gotchas_hit": [],
        "status": status,
        "notes": (
            f"uncoupled={uncoupled_dur:.2f}s + title={TITLE_LEN_SEC}s + "
            f"sync={sync_dur:.2f}s = {expected:.2f}s; actual={duration:.2f}s"
        ),
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
