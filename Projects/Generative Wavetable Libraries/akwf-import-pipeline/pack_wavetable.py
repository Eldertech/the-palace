#!/usr/bin/env python3
"""
pack_wavetable.py
=================

Build an Ableton-compatible wavetable from a folder of single-cycle waveforms,
ordered dull-to-bright by spectral centroid.

A "single-cycle waveform" is a short WAV file (typically a few hundred to a
few thousand samples) containing exactly one period of a periodic sound. When
Wavetable's Position knob sweeps from 0 to 1, it morphs through the frames in
the file from first to last. By ordering frames from darkest to brightest, we
give the Position parameter an intuitive meaning: "turn up the brightness."

Usage
-----
    python3 pack_wavetable.py <input_folder>
    python3 pack_wavetable.py <input_folder> --output-dir /path/to/out
    python3 pack_wavetable.py <input_folder> --cycle-length 2048

Dependencies
------------
    pip install numpy scipy
"""

import argparse
import sys
from math import gcd
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Ableton Wavetable's internal frame size is 1024 samples. If we match it,
# the import requires no extra interpolation and the displayed waveform in
# the oscillator matches what we computed here exactly.
DEFAULT_CYCLE_LENGTH = 1024

# Output sample rate. Wavetable reinterprets the audio as a sequence of
# fixed-size frames regardless of the declared sample rate, so the exact
# number here is largely cosmetic — 44.1 kHz is the audio-world default
# and keeps the file readable in any DAW or audio editor.
OUTPUT_SR = 44100

# Most filesystems cap filenames at ~255 chars. Large folders would blow
# past that once we concatenate every stem, so we truncate past this limit
# and append a summary suffix instead.
MAX_FILENAME_CHARS = 200


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------

def read_mono_float(path: Path) -> np.ndarray:
    """Read a WAV file and return its samples as mono float32 in [-1, 1].

    scipy.io.wavfile returns integers for integer-PCM WAVs and floats for
    float WAVs. We normalize everything to float32 in the [-1, 1] range so
    the rest of the pipeline can work in a consistent numeric domain.
    """
    _sr, data = wavfile.read(path)

    # Collapse stereo/multichannel to mono by averaging all channels.
    # Single-cycle libraries are usually mono already, but this makes the
    # script robust to odd inputs.
    if data.ndim > 1:
        data = data.mean(axis=1)

    # Convert to float32 [-1, 1] based on the source integer type.
    # The divisor is the max magnitude of the integer format.
    if data.dtype == np.int16:
        data = data.astype(np.float32) / 32768.0
    elif data.dtype == np.int32:
        data = data.astype(np.float32) / 2147483648.0
    elif data.dtype == np.uint8:
        # 8-bit WAVs are unsigned, centered at 128.
        data = (data.astype(np.float32) - 128.0) / 128.0
    else:
        # Already floating point; coerce to float32 for consistency.
        data = data.astype(np.float32)

    return data


# ---------------------------------------------------------------------------
# Resampling: from arbitrary-length cycle to target-length cycle
# ---------------------------------------------------------------------------

def resample_cycle(cycle: np.ndarray, target_len: int) -> np.ndarray:
    """Resample a single-cycle waveform to `target_len` samples.

    The subtle part here is the "tile three, keep the middle" pattern:

        [cycle][cycle][cycle] -> resample -> take middle third

    Why? scipy's resample_poly uses a finite-impulse-response (FIR) filter.
    Like all FIR filters, it produces transient artifacts at its edges,
    where the filter kernel would need to see samples that don't exist.
    For an ordinary audio clip we accept those edge artifacts. But a
    single-cycle waveform is meant to loop — the last sample should connect
    smoothly back to the first — so edge artifacts would corrupt the loop
    join.

    Tiling three copies in a row presents the filter with a genuinely
    periodic signal. The edge artifacts now land on the outer two copies,
    which we throw away. The middle copy is clean and perfectly periodic.
    """
    tiled = np.concatenate([cycle, cycle, cycle])

    # resample_poly(x, up, down) upsamples by `up`, then downsamples by `down`.
    # To turn a signal of length `3 * len(cycle)` into length `3 * target_len`
    # we want: new_len / old_len = up / down = target_len / len(cycle).
    up = target_len * 3
    down = len(tiled)  # == len(cycle) * 3

    # Reduce up and down by their GCD. resample_poly's internal FIR filter
    # scales with max(up, down), so shrinking the ratio makes this faster
    # without changing the mathematical result.
    g = gcd(up, down)
    up //= g
    down //= g

    resampled_tiled = resample_poly(tiled, up, down)

    # Return the clean middle cycle.
    return resampled_tiled[target_len:2 * target_len]


# ---------------------------------------------------------------------------
# Feature extraction: spectral centroid (perceptual "brightness")
# ---------------------------------------------------------------------------

def spectral_centroid(cycle: np.ndarray, sample_rate: int) -> float:
    """Compute the energy-weighted mean frequency of a waveform, in Hz.

    Intuition
    ---------
    Take the magnitude spectrum and treat it as a 1-D mass distribution
    along the frequency axis. The centroid is the center of mass.

      * A dull sound (sine, soft pad) has all its energy near 0 Hz ->
        the center of mass sits low -> small centroid value.
      * A bright sound (saw, square with harmonics, bit-crushed anything)
        has energy spread across high harmonics -> the center of mass sits
        higher -> large centroid value.

    Centroid correlates strongly with perceptual "brightness" and is the
    canonical one-number brightness feature in MIR (music information
    retrieval).

    Formula
    -------
                    sum_k  freq[k] * |X[k]|
        centroid = ------------------------
                    sum_k          |X[k]|

    where X[k] is the k-th bin of the FFT, and freq[k] is that bin's
    frequency in Hz.
    """
    # Remove DC (the zero-frequency component): a constant offset carries
    # no pitch/brightness information and would bias the centroid toward 0.
    signal = cycle - cycle.mean()

    # np.fft.rfft returns only the non-redundant half of the spectrum
    # (from 0 Hz up through Nyquist). For real-valued inputs the upper
    # half is a mirror image of the lower half, so rfft saves work.
    magnitudes = np.abs(np.fft.rfft(signal))

    # np.fft.rfftfreq gives the frequency (in Hz) of each bin in the rfft.
    # d = 1 / sample_rate is the time between samples.
    freqs = np.fft.rfftfreq(len(signal), d=1.0 / sample_rate)

    total_energy = magnitudes.sum()
    if total_energy == 0:
        # A silent cycle has no defined centroid; return 0 as a sentinel.
        return 0.0

    return float((freqs * magnitudes).sum() / total_energy)


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def build_wavetable(input_folder: Path,
                    output_dir: Path,
                    cycle_length: int) -> Path:
    """Read every .wav in a folder, sort by centroid, write one combined WAV."""

    # Collect every .wav (case-insensitive) and sort alphabetically. The
    # alphabetical pre-sort just gives us deterministic output when two
    # files happen to share a centroid — the centroid sort below is stable.
    wav_paths = sorted(
        p for p in input_folder.iterdir()
        if p.is_file() and p.suffix.lower() == ".wav"
    )

    if not wav_paths:
        raise SystemExit(f"No .wav files found in {input_folder}")

    print(f"Found {len(wav_paths)} WAV files in {input_folder}\n")
    print(f"{'centroid (Hz)':>16}  filename")
    print(f"{'-' * 16}  {'-' * 40}")

    # Load, resample, and analyse every cycle up front. We store tuples of
    # (centroid, stem, cycle) so a single sort call orders everything at once.
    records = []
    for p in wav_paths:
        raw = read_mono_float(p)
        cycle = resample_cycle(raw, cycle_length)
        centroid = spectral_centroid(cycle, OUTPUT_SR)
        records.append((centroid, p.stem, cycle))
        print(f"{centroid:>16.1f}  {p.name}")

    # Sort ascending by centroid: darkest frame first, brightest frame last.
    # Python's sort is stable, so files with equal centroids keep their
    # alphabetical relative order.
    records.sort(key=lambda r: r[0])

    ordered_stems = [stem for _, stem, _ in records]
    ordered_cycles = [cycle for _, _, cycle in records]

    print("\nFinal frame order (dull -> bright):")
    for i, stem in enumerate(ordered_stems):
        print(f"  frame {i:>3}: {stem}")

    # Concatenate every cycle end-to-end. Ableton reads a 2048-sample file
    # as 2 frames of 1024, a 4096-sample file as 4 frames, and so on. No
    # header flag is needed — the frame count is inferred from total length.
    wavetable = np.concatenate(ordered_cycles).astype(np.float32)

    # JOINT normalization: scale ONCE across the whole table so each frame's
    # loudness relative to its neighbors is preserved. If we normalized each
    # frame independently, quiet frames would get boosted and loud frames
    # squashed — the Position morph would feel like a level ride instead of
    # a timbral sweep.
    peak = float(np.max(np.abs(wavetable)))
    if peak > 0:
        # Leave a hair of headroom so anything that re-quantizes to int
        # downstream doesn't clip.
        wavetable *= 0.99 / peak

    # Build the output filename by joining every input stem with underscores.
    # If the joined name is monstrously long, truncate and append a summary
    # suffix instead of producing a filename the OS will reject.
    joined = "_".join(ordered_stems)
    if len(joined) > MAX_FILENAME_CHARS:
        joined = joined[:MAX_FILENAME_CHARS] + f"__{len(ordered_cycles)}frames"
    out_name = f"{joined}.wav"
    out_path = output_dir / out_name

    # Make sure the output directory exists.
    output_dir.mkdir(parents=True, exist_ok=True)

    # scipy.io.wavfile writes float numpy arrays as 32-bit float WAVs.
    # Float WAVs preserve the full dynamic range of our processing without
    # an int-quantization step, which matters for wavetables because small
    # amplitude changes near zero can be perceptible during a morph.
    wavfile.write(out_path, OUTPUT_SR, wavetable.astype(np.float32))

    print(f"\nWrote {len(ordered_cycles)}-frame wavetable ({cycle_length} samples/frame):")
    print(f"  {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser(
        description="Pack a folder of single-cycle WAVs into a centroid-sorted wavetable."
    )
    parser.add_argument(
        "input_folder", type=Path,
        help="Folder containing single-cycle .wav files."
    )
    parser.add_argument(
        "--output-dir", type=Path, default=Path.cwd(),
        help="Where to write the combined wavetable (default: current directory)."
    )
    parser.add_argument(
        "--cycle-length", type=int, default=DEFAULT_CYCLE_LENGTH,
        help=f"Samples per frame in the output (default: {DEFAULT_CYCLE_LENGTH})."
    )
    args = parser.parse_args()

    if not args.input_folder.is_dir():
        sys.exit(f"Not a folder: {args.input_folder}")

    build_wavetable(args.input_folder, args.output_dir, args.cycle_length)


if __name__ == "__main__":
    main()
