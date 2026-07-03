"""
Local WAV Folder — Phase 3 source three scaffold for Generative Sample Libraries.

Reads a folder of WAVs the user already has, detects each file's pitch with
librosa, maps onto MIDI notes via nearest-neighbor with split-the-difference
hikey/lokey boundaries, applies the responsive-onset trim convention from
phoneme-choir/generate.py (onset detect at -45 dBFS, 2ms cushion, 3ms
ampeg_attack), and writes an SFZ.

Usage:
    python generate.py --src /path/to/wavs --name MyInstrument [--audition]

Audition mode: render only the per-file onset analysis + SFZ for the smallest
representative set (one file per octave present in the source), so Loudon can
hear the mapping before committing to the full library.

Status: scaffold. Pitch detection path lifted from librosa.pyin; needs a real
folder to validate against. The Interview skill is the entry point; this is
the back-end the skill hands off to once source-type=local-WAV is chosen.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
import soundfile as sf

try:
    import librosa
except ImportError:
    librosa = None  # surfaced at run-time with a clear install hint


ONSET_THRESHOLD_DBFS = -45.0
ONSET_CUSHION_MS = 2.0
AMPEG_ATTACK_S = 0.003


@dataclass
class MappedSample:
    path: Path
    midi_note: int
    hz: float
    cents_error: float
    onset_sample: int
    sample_rate: int
    n_frames: int


def hz_to_midi(hz: float) -> float:
    return 69.0 + 12.0 * np.log2(hz / 440.0)


def detect_pitch_hz(y: np.ndarray, sr: int) -> tuple[float, float]:
    """Return (median_hz, confidence). Uses pYIN voiced-frame median."""
    if librosa is None:
        raise RuntimeError("librosa not installed. pip install librosa")
    f0, voiced_flag, voiced_prob = librosa.pyin(
        y,
        fmin=float(librosa.note_to_hz("A0")),
        fmax=float(librosa.note_to_hz("C8")),
        sr=sr,
    )
    voiced = f0[voiced_flag]
    if voiced.size == 0:
        return float("nan"), 0.0
    return float(np.nanmedian(voiced)), float(np.nanmean(voiced_prob[voiced_flag]))


def detect_onset_sample(
    y: np.ndarray, sr: int, threshold_dbfs: float = ONSET_THRESHOLD_DBFS
) -> int:
    """First sample whose 5ms windowed RMS crosses threshold; cushion applied later."""
    win = max(1, int(0.005 * sr))
    if y.ndim > 1:
        y = y.mean(axis=1)
    sq = y.astype(np.float64) ** 2
    # cumulative-window RMS
    cumsum = np.concatenate(([0.0], np.cumsum(sq)))
    rms = np.sqrt((cumsum[win:] - cumsum[:-win]) / win + 1e-20)
    thresh_lin = 10.0 ** (threshold_dbfs / 20.0)
    above = np.where(rms > thresh_lin)[0]
    return int(above[0]) if above.size else 0


def offset_with_cushion(onset: int, sr: int, cushion_ms: float = ONSET_CUSHION_MS) -> int:
    return max(0, onset - int(cushion_ms * sr / 1000.0))


def analyze_one(path: Path) -> MappedSample | None:
    y, sr = sf.read(str(path), always_2d=False)
    if y.size == 0:
        return None
    mono = y if y.ndim == 1 else y.mean(axis=1)
    hz, _conf = detect_pitch_hz(mono.astype(np.float32), sr)
    if not np.isfinite(hz) or hz <= 0:
        return None
    midi_f = hz_to_midi(hz)
    midi = int(round(midi_f))
    cents = (midi_f - midi) * 100.0
    onset = detect_onset_sample(mono, sr)
    return MappedSample(
        path=path,
        midi_note=midi,
        hz=hz,
        cents_error=cents,
        onset_sample=offset_with_cushion(onset, sr),
        sample_rate=sr,
        n_frames=len(mono),
    )


def assign_keyboard_regions(samples: list[MappedSample]) -> list[tuple[MappedSample, int, int]]:
    """Sort by midi_note; split-the-difference hikey/lokey between neighbors."""
    samples = sorted(samples, key=lambda s: s.midi_note)
    out: list[tuple[MappedSample, int, int]] = []
    for i, s in enumerate(samples):
        lo = 0 if i == 0 else (samples[i - 1].midi_note + s.midi_note) // 2 + 1
        hi = 127 if i == len(samples) - 1 else (s.midi_note + samples[i + 1].midi_note) // 2
        out.append((s, lo, hi))
    return out


def write_sfz(
    regions: list[tuple[MappedSample, int, int]],
    sfz_path: Path,
    samples_dir: Path,
    instrument_name: str,
) -> None:
    lines = [f"// {instrument_name} — generated from local WAV folder",
             "// Source: Phase 3 source three (librosa pitch detect → nearest-MIDI mapping)",
             "<control>",
             f"default_path={samples_dir.name}/",
             "",
             "<global>",
             f"ampeg_attack={AMPEG_ATTACK_S}",
             "",
             "<group>"]
    for s, lo, hi in regions:
        lines.append(
            f"<region> sample={s.path.name} "
            f"pitch_keycenter={s.midi_note} lokey={lo} hikey={hi} "
            f"offset={s.onset_sample}"
        )
    sfz_path.write_text("\n".join(lines) + "\n")


def main(argv: Iterable[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--src", type=Path, required=True, help="folder of WAVs to ingest")
    p.add_argument("--name", default="LocalWavInstrument")
    p.add_argument("--out", type=Path, default=Path(__file__).parent)
    p.add_argument("--audition", action="store_true",
                   help="analyze + map only; one file per octave; no copy")
    args = p.parse_args(list(argv) if argv is not None else None)

    if not args.src.is_dir():
        raise SystemExit(f"--src not a directory: {args.src}")

    wavs = sorted(args.src.glob("*.wav"))
    if not wavs:
        raise SystemExit(f"no .wav files in {args.src}")

    analyzed: list[MappedSample] = []
    for w in wavs:
        m = analyze_one(w)
        if m is not None:
            analyzed.append(m)

    if args.audition:
        # one per octave
        by_octave: dict[int, MappedSample] = {}
        for m in analyzed:
            oct_ = m.midi_note // 12
            if oct_ not in by_octave or abs(by_octave[oct_].cents_error) > abs(m.cents_error):
                by_octave[oct_] = m
        analyzed = sorted(by_octave.values(), key=lambda s: s.midi_note)

    regions = assign_keyboard_regions(analyzed)
    sfz_path = args.out / f"{args.name.lower()}.sfz"
    write_sfz(regions, sfz_path, args.src, args.name)

    report = {
        "instrument": args.name,
        "src": str(args.src),
        "n_files_in": len(wavs),
        "n_mapped": len(analyzed),
        "audition": args.audition,
        "regions": [
            {
                "file": s.path.name,
                "midi": s.midi_note,
                "hz": round(s.hz, 3),
                "cents_error": round(s.cents_error, 2),
                "lokey": lo,
                "hikey": hi,
                "onset_sample": s.onset_sample,
            }
            for s, lo, hi in regions
        ],
    }
    (args.out / f"{args.name.lower()}-mapping.json").write_text(json.dumps(report, indent=2))
    print(json.dumps({"sfz": str(sfz_path), "mapped": len(analyzed), "skipped": len(wavs) - len(analyzed)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
