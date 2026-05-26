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
INTRO_PNG = BUNDLE / "_intro-card.png"
INTRO_CLIP = BUNDLE / "_intro-card.mp4"
TITLE_PNG = BUNDLE / "_title-card.png"
TITLE_CLIP = BUNDLE / "_title-card.mp4"
UNCOUPLED_NORM = BUNDLE / "_uncoupled-720p30.mp4"
PRENORM = BUNDLE / "_round-1-prenorm.mp4"
OUT = BUNDLE / "round-1-teaching-reel.mp4"
REPORT = BUNDLE / "round-1-teaching-reel.report.json"

UNCOUPLED = BUNDLE / "two-phasors-uncoupled-extended.mp4"
INTRO_NARRATION = BUNDLE / "intro-narration.wav"
UNCOUPLED_NARRATION = BUNDLE / "uncoupled-narration.wav"
TITLE_NARRATION = BUNDLE / "title-narration.wav"
OPENING_BED = BUNDLE / "opening-bed.wav"    # Stable Audio Open; sits under intro
TITLE_BED = BUNDLE / "title-bed.wav"        # Stable Audio Open; sits under title card
SYNC_ARRIVING = BUNDLE / "sync-arriving.mp4"

INTRO_LEN_SEC = 8.0
# Title card extended from 3 s → 8 s to fit the title VO (7.8 s) plus
# a brief settling beat at the end. Per Loudon's rule
# ("every section of an educational video has voiceover, including
#  title cards") the silent 3 s title card was a failure mode.
TITLE_LEN_SEC = 8.0
SAO_BED_GAIN_DB = -14.0  # SAO atmospheric beds sit -14 dB under -16 LUFS VO
TARGET_FPS = 30
TARGET_W, TARGET_H = 1280, 720
LUFS_TARGET = -16.0
TP_TARGET = -1.0


def make_intro_card() -> None:
    fig = plt.figure(figsize=(TARGET_W / 100, TARGET_H / 100),
                     dpi=100, facecolor="#0B0B10")
    ax = fig.add_subplot(111)
    ax.set_facecolor("#0B0B10")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_axis_off()
    ax.text(0.5, 0.65, "Kuramoto Coupling", ha="center", va="center",
            fontsize=56, color="#E5E7EB", family="serif")
    ax.text(0.5, 0.48,
            "How populations of oscillators find a shared rhythm.",
            ha="center", va="center", fontsize=24,
            color="#F59E0B", family="serif", style="italic")
    ax.text(0.5, 0.36,
            "From drift to lock, in one minute.",
            ha="center", va="center", fontsize=18,
            color="#6366F1", family="serif")
    fig.savefig(INTRO_PNG, dpi=100, facecolor="#0B0B10",
                edgecolor="none", bbox_inches=None, pad_inches=0)
    plt.close(fig)


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
    fig.savefig(TITLE_PNG, dpi=100, facecolor="#0B0B10",
                edgecolor="none", bbox_inches=None, pad_inches=0)
    plt.close(fig)


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, check=True)


def png_to_clip(png: Path, mp4: Path, seconds: float) -> None:
    run([
        "ffmpeg", "-y", "-loop", "1", "-i", str(png),
        "-t", f"{seconds}", "-r", str(TARGET_FPS),
        "-vf", f"scale={TARGET_W}:{TARGET_H}:flags=lanczos,format=yuv420p",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-an", str(mp4),
        "-loglevel", "error",
    ])


def normalize_uncoupled() -> None:
    """The extended uncoupled clip is already 1280x720@30 (Manim -qm), so
    this is now a pass-through copy. Kept as a step for the recipe — when
    we route in a different uncoupled source, this is where it gets
    geometry-normalized."""
    run([
        "ffmpeg", "-y", "-i", str(UNCOUPLED),
        "-vf", f"format=yuv420p,fps={TARGET_FPS}",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-an", str(UNCOUPLED_NORM),
        "-loglevel", "error",
    ])


def concat_with_audio() -> tuple[float, float, float, float]:
    """Builds the reel video AND its audio bed in four segments:

      [intro card]  INTRO_LEN     : intro VO + opening SAO bed
      [uncoupled]   uncoupled_dur : uncoupled VO  (no bed; bed moved to intro
                                                    per Loudon 2026-05-26 v5)
      [title card]  TITLE_LEN     : title VO + title SAO bed
      [sync]        sync_dur      : sync-arriving video + its built-in VO

    SAO beds are optional — if their WAVs aren't present, the script falls
    back to silent audio there. VO is always present, never optional — per
    the "every section has voiceover" rule.
    """
    uncoupled_dur = float(ffprobe_duration(UNCOUPLED_NORM))
    sync_dur = float(ffprobe_duration(SYNC_ARRIVING))
    intro_narr_dur = float(ffprobe_duration(INTRO_NARRATION))
    uncoupled_narr_dur = float(ffprobe_duration(UNCOUPLED_NARRATION))
    title_narr_dur = float(ffprobe_duration(TITLE_NARRATION))

    pad_intro_tail = max(0.0, INTRO_LEN_SEC - intro_narr_dur)
    pad_uncoupled_tail = max(0.0, uncoupled_dur - uncoupled_narr_dur)
    pad_title_tail = max(0.0, TITLE_LEN_SEC - title_narr_dur)

    has_opening_bed = OPENING_BED.exists()
    has_title_bed = TITLE_BED.exists()

    # Fixed inputs (always 10):
    inputs: list[str] = [
        "-i", str(INTRO_CLIP),           # 0: intro video
        "-i", str(UNCOUPLED_NORM),       # 1: uncoupled video
        "-i", str(TITLE_CLIP),           # 2: title video
        "-i", str(SYNC_ARRIVING),        # 3: sync video+audio
        "-i", str(INTRO_NARRATION),      # 4: intro VO
        "-i", str(UNCOUPLED_NARRATION),  # 5: uncoupled VO
        "-i", str(TITLE_NARRATION),      # 6: title VO
        "-f", "lavfi", "-t", f"{pad_intro_tail:.3f}",
        "-i", "anullsrc=channel_layout=mono:sample_rate=48000",  # 7: intro tail
        "-f", "lavfi", "-t", f"{pad_uncoupled_tail:.3f}",
        "-i", "anullsrc=channel_layout=mono:sample_rate=48000",  # 8: uncoupled tail
        "-f", "lavfi", "-t", f"{pad_title_tail:.3f}",
        "-i", "anullsrc=channel_layout=mono:sample_rate=48000",  # 9: title tail
    ]
    next_input_idx = 10
    bed_inputs_idx_opening = None
    bed_inputs_idx_title = None
    if has_opening_bed:
        bed_inputs_idx_opening = next_input_idx
        inputs += ["-i", str(OPENING_BED)]
        next_input_idx += 1
    if has_title_bed:
        bed_inputs_idx_title = next_input_idx
        inputs += ["-i", str(TITLE_BED)]
        next_input_idx += 1

    bed_gain_amp = 10 ** (SAO_BED_GAIN_DB / 20)

    filter_parts = [
        "[4:a][7:a]concat=n=2:v=0:a=1[i_vo]",  # intro VO + silent tail
        "[5:a][8:a]concat=n=2:v=0:a=1[u_vo]",  # uncoupled VO + silent tail
        "[6:a][9:a]concat=n=2:v=0:a=1[t_vo]",  # title VO + silent tail
    ]

    intro_audio_label = "[i_vo]"
    if bed_inputs_idx_opening is not None:
        filter_parts.append(
            f"[{bed_inputs_idx_opening}:a]volume={bed_gain_amp:.4f},apad=whole_dur={INTRO_LEN_SEC:.3f}[o_bed_padded]"
        )
        filter_parts.append("[i_vo][o_bed_padded]amix=inputs=2:duration=first:normalize=0[i_mix]")
        intro_audio_label = "[i_mix]"

    title_audio_label = "[t_vo]"
    if bed_inputs_idx_title is not None:
        filter_parts.append(
            f"[{bed_inputs_idx_title}:a]volume={bed_gain_amp:.4f},apad=whole_dur={TITLE_LEN_SEC:.3f}[t_bed_padded]"
        )
        filter_parts.append("[t_vo][t_bed_padded]amix=inputs=2:duration=first:normalize=0[t_mix]")
        title_audio_label = "[t_mix]"

    filter_parts.append(
        f"[0:v]{intro_audio_label}[1:v][u_vo][2:v]{title_audio_label}[3:v][3:a]"
        "concat=n=4:v=1:a=1[v][a]"
    )
    filter_complex = ";".join(filter_parts)

    run([
        "ffmpeg", "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        str(PRENORM),
        "-loglevel", "error",
    ])
    return INTRO_LEN_SEC, uncoupled_dur, sync_dur, INTRO_LEN_SEC + uncoupled_dur + TITLE_LEN_SEC


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
    make_intro_card()
    make_title_card()
    png_to_clip(INTRO_PNG, INTRO_CLIP, INTRO_LEN_SEC)
    png_to_clip(TITLE_PNG, TITLE_CLIP, TITLE_LEN_SEC)
    normalize_uncoupled()
    intro_dur, uncoupled_dur, sync_dur, silent_total = concat_with_audio()
    pre_lufs, pre_tp = loudnorm_two_pass()

    final = ffprobe_streams(OUT)
    duration = float(final["format"]["duration"])
    video_stream = next(s for s in final["streams"] if s["codec_type"] == "video")
    audio_stream = next(s for s in final["streams"] if s["codec_type"] == "audio")

    expected = intro_dur + uncoupled_dur + TITLE_LEN_SEC + sync_dur
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
            f"intro={intro_dur:.2f}s + uncoupled={uncoupled_dur:.2f}s + "
            f"title={TITLE_LEN_SEC}s + sync={sync_dur:.2f}s = "
            f"{expected:.2f}s; actual={duration:.2f}s"
        ),
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
