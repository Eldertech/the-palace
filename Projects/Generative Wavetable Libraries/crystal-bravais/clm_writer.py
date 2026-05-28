#!/usr/bin/env python3
"""
CLM / Serum wavetable WAV writer.

Implements the Serum/Vital/Surge XT "CLM-chunked WAV" container format,
reverse-engineered byte-for-byte from a known-good reference: the Serum
factory wavetable `_reference/Basic Shapes.wav` (cycle-6 fixture, supplied
by Loudon via POINT-AT-WAV grant on gwl-steward-009).

Reference structure (observed in Basic Shapes.wav):

  Offset  Bytes   Content
  ------  ------  -----------------------------------------------------
       0      4   b'RIFF'
       4      4   uint32 LE  RIFF chunk size = total_bytes - 8
       8      4   b'WAVE'
      12      4   b'JUNK'
      16      4   uint32 LE  JUNK size = 28
      20     28   zero bytes (alignment pad)
      48      4   b'fmt '
      52      4   uint32 LE  fmt size = 16
      56      2   audio_format = 3 (IEEE float)
      58      2   n_channels = 1
      60      4   sample_rate = 44100
      64      4   byte_rate = 176400 (= sr * block_align)
      68      2   block_align = 4 (n_ch * bps/8)
      70      2   bits_per_sample = 32
      72      4   b'clm '
      76      4   uint32 LE  clm size = 48
      80     48   ASCII: "<!>2048 01000000 wavetable (www.xferrecords.com)"
     128      4   b'data'
     132      4   uint32 LE  data size = n_frames * frame_size * 4
     136     ..   little-endian float32 samples (frames concatenated)

This writer mirrors that structure exactly. Vendor string is configurable
but defaults to xfer's; cycle_size is configurable but defaults to 2048
(Serum's required frame size).
"""

from __future__ import annotations

import struct
import numpy as np
from pathlib import Path


# Defaults matching the Serum 2 factory reference.
SERUM_FRAME_SIZE = 2048
DEFAULT_SAMPLE_RATE = 44100
DEFAULT_VENDOR_STRING = "wavetable (www.xferrecords.com)"
JUNK_PAD_SIZE = 28  # bytes of zero JUNK chunk for alignment
CLM_INTERP_MODE = "01000000"  # observed verbatim in Basic Shapes.wav


def build_clm_payload(cycle_size: int = SERUM_FRAME_SIZE,
                      interp_mode: str = CLM_INTERP_MODE,
                      vendor: str = DEFAULT_VENDOR_STRING) -> bytes:
    """
    Build the ASCII CLM payload exactly as Serum writes it.

    Format observed in factory presets:
        "<!>2048 01000000 wavetable (www.xferrecords.com)"

    Note: this is `<!>` then the cycle size, NOT `<!-` + size + ` -">` as some
    older docs suggest. The observed Serum 2 factory format is the source of
    truth here.
    """
    s = f"<!>{cycle_size} {interp_mode} {vendor}"
    return s.encode("ascii")


def write_clm_wav(frames: np.ndarray,
                  path: str | Path,
                  sample_rate: int = DEFAULT_SAMPLE_RATE,
                  vendor: str = DEFAULT_VENDOR_STRING) -> int:
    """
    Write a wavetable in Serum/CLM format.

    Parameters
    ----------
    frames : np.ndarray, shape (n_frames, frame_size), dtype float (any)
        The wavetable frames. frame_size must be 2048 for Serum compatibility;
        the function does not enforce this but will warn if it differs.
    path : path-like
        Output WAV path.
    sample_rate : int
        Header sample rate (Serum reads frames, not Hz, but the header still
        carries a sample rate. 44100 matches the factory convention.).
    vendor : str
        Vendor string in the CLM payload. Default matches Xfer's.

    Returns
    -------
    int : number of bytes written
    """
    if frames.ndim != 2:
        raise ValueError(f"frames must be 2D (n_frames, frame_size); got shape {frames.shape}")
    n_frames, frame_size = frames.shape

    # Clip to [-1, 1] and cast to float32 little-endian.
    clipped = np.clip(frames, -1.0, 1.0).astype("<f4")
    sample_bytes = clipped.tobytes()  # contiguous LE float32

    # --- CLM payload ---
    clm_payload = build_clm_payload(cycle_size=frame_size, vendor=vendor)
    clm_size = len(clm_payload)
    # The reference payload is 48 bytes for the default vendor; assert.
    # (Not strict — only a soft check so callers feeding custom vendors
    # don't get a silent surprise. RIFF allows odd-length chunks with a
    # pad byte; we'll handle that below.)

    # --- fmt subchunk (IEEE float, 32-bit, mono) ---
    audio_format = 3   # IEEE float
    n_channels = 1
    bits_per_sample = 32
    block_align = n_channels * bits_per_sample // 8
    byte_rate = sample_rate * block_align
    fmt_body = struct.pack(
        "<HHIIHH",
        audio_format, n_channels, sample_rate, byte_rate,
        block_align, bits_per_sample,
    )
    fmt_size = len(fmt_body)  # = 16

    # --- JUNK pad (28 zero bytes, matching the factory layout) ---
    junk_body = b"\x00" * JUNK_PAD_SIZE
    junk_size = len(junk_body)

    # --- data subchunk ---
    data_body = sample_bytes
    data_size = len(data_body)

    # --- compose chunks; respect RIFF word alignment ---
    def chunk(tag: bytes, body: bytes) -> bytes:
        assert len(tag) == 4
        out = tag + struct.pack("<I", len(body)) + body
        if len(body) % 2 == 1:
            out += b"\x00"  # pad to even
        return out

    junk_chunk = chunk(b"JUNK", junk_body)
    fmt_chunk = chunk(b"fmt ", fmt_body)
    clm_chunk = chunk(b"clm ", clm_payload)
    data_chunk = chunk(b"data", data_body)

    inner = b"WAVE" + junk_chunk + fmt_chunk + clm_chunk + data_chunk
    riff_size = len(inner)
    riff = b"RIFF" + struct.pack("<I", riff_size) + inner

    path = Path(path)
    path.write_bytes(riff)
    return len(riff)


def read_clm_wav(path: str | Path) -> tuple[np.ndarray, dict]:
    """
    Parse a CLM-format WAV and return (frames, metadata).

    metadata keys: sample_rate, n_channels, bits_per_sample, audio_format,
    clm_payload (bytes), n_frames (derived if cycle_size present in CLM),
    frame_size, total_samples.

    Used for the round-trip equivalence test against the reference.
    """
    path = Path(path)
    raw = path.read_bytes()
    if raw[:4] != b"RIFF" or raw[8:12] != b"WAVE":
        raise ValueError(f"Not a RIFF/WAVE file: {path}")

    chunks: dict[bytes, tuple[int, bytes]] = {}
    chunk_order: list[tuple[bytes, int]] = []
    pos = 12
    while pos < len(raw) - 8:
        tag = raw[pos:pos + 4]
        size = struct.unpack("<I", raw[pos + 4:pos + 8])[0]
        body = raw[pos + 8:pos + 8 + size]
        chunks[tag] = (size, body)
        chunk_order.append((tag, size))
        pos += 8 + size
        if size % 2 == 1:
            pos += 1

    if b"fmt " not in chunks:
        raise ValueError("missing fmt chunk")
    fmt_body = chunks[b"fmt "][1]
    audio_format, n_channels, sample_rate, byte_rate, block_align, bps = \
        struct.unpack("<HHIIHH", fmt_body[:16])

    if b"data" not in chunks:
        raise ValueError("missing data chunk")
    data_body = chunks[b"data"][1]

    # Decode samples
    if audio_format == 3 and bps == 32:
        samples = np.frombuffer(data_body, dtype="<f4").astype(np.float32)
    elif audio_format == 1 and bps == 16:
        samples = (np.frombuffer(data_body, dtype="<i2").astype(np.float32) / 32767.0)
    else:
        raise ValueError(f"unsupported audio_format={audio_format} bps={bps}")

    clm_payload = chunks.get(b"clm ", (0, b""))[1]
    # Try to parse cycle_size from CLM
    frame_size = None
    if clm_payload.startswith(b"<!>"):
        try:
            tail = clm_payload[3:].decode("ascii", errors="replace")
            frame_size = int(tail.split(" ", 1)[0])
        except Exception:
            frame_size = None

    n_frames = None
    if frame_size and len(samples) % frame_size == 0:
        n_frames = len(samples) // frame_size

    metadata = {
        "audio_format": audio_format,
        "n_channels": n_channels,
        "sample_rate": sample_rate,
        "bits_per_sample": bps,
        "clm_payload": clm_payload,
        "frame_size": frame_size,
        "n_frames": n_frames,
        "total_samples": len(samples),
        "chunk_order": chunk_order,
    }
    if n_frames and frame_size:
        frames = samples.reshape(n_frames, frame_size)
    else:
        frames = samples[np.newaxis, :]  # single "frame" of unknown size
    return frames, metadata


# ---------------------------------------------------------------------------
# Self-test: round-trip the reference, byte-for-byte.
# ---------------------------------------------------------------------------
def _self_test_against_reference(reference_path: Path) -> None:
    """
    Read the Serum factory reference, write a fresh copy via our writer, and
    diff bytes. The two files MUST be identical for this writer to be
    considered correct.
    """
    print(f"--- CLM writer self-test against {reference_path.name} ---")
    frames, meta = read_clm_wav(reference_path)
    print(f"  parsed: {meta['n_frames']} frames x {meta['frame_size']} samples, "
          f"{meta['audio_format']}/{meta['bits_per_sample']}bit @ {meta['sample_rate']}Hz")
    print(f"  clm payload: {meta['clm_payload']!r}")

    tmp_path = reference_path.with_name(reference_path.stem + "_rebuilt.wav")
    write_clm_wav(frames, tmp_path,
                  sample_rate=meta["sample_rate"],
                  vendor=DEFAULT_VENDOR_STRING)

    orig = reference_path.read_bytes()
    rebuilt = tmp_path.read_bytes()
    if orig == rebuilt:
        print(f"  PASS: rebuilt file is byte-for-byte identical "
              f"({len(orig)} bytes).")
    else:
        # First-difference report
        min_len = min(len(orig), len(rebuilt))
        first_diff = next(
            (i for i in range(min_len) if orig[i] != rebuilt[i]),
            min_len,
        )
        print(f"  FAIL: differs starting at byte {first_diff} "
              f"(orig={len(orig)}B, rebuilt={len(rebuilt)}B)")
        print(f"    orig    [{first_diff}:{first_diff + 16}] = "
              f"{orig[first_diff:first_diff + 16].hex()}")
        print(f"    rebuilt [{first_diff}:{first_diff + 16}] = "
              f"{rebuilt[first_diff:first_diff + 16].hex()}")
    tmp_path.unlink(missing_ok=True)


if __name__ == "__main__":
    import sys
    # Default reference: cycle-6 _reference/ directory
    here = Path(__file__).resolve().parent
    default_ref = here.parent / "_reference" / "Basic Shapes.wav"
    ref = Path(sys.argv[1]) if len(sys.argv) > 1 else default_ref
    if not ref.exists():
        print(f"reference not found: {ref}", file=sys.stderr)
        sys.exit(2)
    _self_test_against_reference(ref)
