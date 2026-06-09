#!/usr/bin/env python3
"""
Surge XT .wt wavetable writer + reader.

The .wt format is the native binary wavetable container for Surge XT,
documented in the Surge repository (resources/data/wavetables and the
`wt fileformat.txt` notes). It is deliberately tiny — a 12-byte header
plus raw interleaved frame samples.

Header layout (little-endian):

  Offset  Bytes  Field        Meaning
  ------  -----  -----------  ----------------------------------------------
       0      4  magic        ASCII b"vawt"  (Surge's wavetable magic)
       4      4  wave_size    uint32 — samples per single-cycle frame.
                              Must be a power of two (64..4096 in practice;
                              2048 is the common high-res choice).
       8      2  wave_count   uint16 — number of frames in the table.
      10      2  flags        uint16 — bitfield:
                                bit 0 (0x01) wt_is_sample (treat as one-shot
                                              sample, not a looping table)
                                bit 1 (0x02) wt_int16 (samples are int16,
                                              not float32)
                                bit 2 (0x04) wt_int16_used_as_uint16
                                            (legacy; not used here)
      12     ..  data         wave_count * wave_size samples, frame-major,
                              float32 LE by default (or int16 LE if bit 1 set)

This writer defaults to float32 frames (the high-quality path) and clears
all flag bits — a plain looping wavetable, the same content the Serum/CLM
and Ableton writers emit, just in Surge's container.
"""

from __future__ import annotations
import struct
import numpy as np
from pathlib import Path

WT_MAGIC = b"vawt"
FLAG_IS_SAMPLE = 0x01
FLAG_INT16 = 0x02


def write_wt(frames: np.ndarray, path, use_int16: bool = False) -> int:
    """
    Write a wavetable in Surge XT .wt format.

    frames : (n_frames, wave_size) float array. wave_size should be a power
             of two for Surge to treat it as a wavetable.
    use_int16 : if True, store samples as int16 (smaller file, lower fidelity)
                and set the wt_int16 flag. Default False = float32.
    """
    frames = np.asarray(frames)
    if frames.ndim != 2:
        raise ValueError(f"frames must be 2D (n_frames, wave_size); got {frames.shape}")
    n_frames, wave_size = frames.shape
    if wave_size & (wave_size - 1) != 0:
        raise ValueError(f"wave_size {wave_size} is not a power of two; "
                         "Surge requires power-of-two frame sizes.")
    if not (1 <= n_frames <= 0xFFFF):
        raise ValueError(f"wave_count {n_frames} out of uint16 range")

    flags = 0
    if use_int16:
        flags |= FLAG_INT16
        clipped = np.clip(frames, -1.0, 1.0)
        body = np.round(clipped * 32767.0).astype("<i2").tobytes()
    else:
        clipped = np.clip(frames, -1.0, 1.0).astype("<f4")
        body = clipped.tobytes()

    header = WT_MAGIC + struct.pack("<IHH", wave_size, n_frames, flags)
    raw = header + body
    Path(path).write_bytes(raw)
    return len(raw)


def read_wt(path):
    """Parse a .wt file -> (frames, metadata). For the round-trip self-test."""
    raw = Path(path).read_bytes()
    if raw[:4] != WT_MAGIC:
        raise ValueError(f"not a Surge .wt file (magic={raw[:4]!r})")
    wave_size, wave_count, flags = struct.unpack("<IHH", raw[4:12])
    body = raw[12:]
    if flags & FLAG_INT16:
        samples = np.frombuffer(body, dtype="<i2").astype(np.float32) / 32767.0
    else:
        samples = np.frombuffer(body, dtype="<f4").astype(np.float32)
    frames = samples.reshape(wave_count, wave_size)
    meta = dict(wave_size=wave_size, wave_count=wave_count, flags=flags,
                is_sample=bool(flags & FLAG_IS_SAMPLE),
                int16=bool(flags & FLAG_INT16),
                total_samples=samples.size, header_bytes=12, file_bytes=len(raw))
    return frames, meta


if __name__ == "__main__":
    # Self-test: build a tiny known table, round-trip it, check exact equality
    # of the header fields and near-equality of the samples.
    print("--- Surge .wt writer self-test ---")
    rng = np.random.default_rng(7)
    test = rng.uniform(-1, 1, size=(8, 2048)).astype(np.float32)

    nbytes = write_wt(test, "/tmp/_wt_selftest_f32.wt", use_int16=False)
    frames, meta = read_wt("/tmp/_wt_selftest_f32.wt")
    print(f"  float32: wrote {nbytes} B; header says "
          f"wave_size={meta['wave_size']} wave_count={meta['wave_count']} "
          f"flags={meta['flags']}")
    expected = 12 + 8 * 2048 * 4
    ok_size = (nbytes == expected)
    ok_hdr = (meta['wave_size'] == 2048 and meta['wave_count'] == 8 and meta['flags'] == 0)
    ok_data = np.array_equal(frames, test)  # float32 is lossless round-trip
    print(f"    size {nbytes}=={expected}? {ok_size}  header? {ok_hdr}  "
          f"data exact? {ok_data}")

    nbytes16 = write_wt(test, "/tmp/_wt_selftest_i16.wt", use_int16=True)
    frames16, meta16 = read_wt("/tmp/_wt_selftest_i16.wt")
    expected16 = 12 + 8 * 2048 * 2
    max_err = float(np.max(np.abs(frames16 - test)))
    print(f"  int16:   wrote {nbytes16} B; flags={meta16['flags']} (int16 bit set? "
          f"{meta16['int16']}); size=={expected16}? {nbytes16==expected16}; "
          f"max quantization err {max_err:.2e} (<= 1/32767 ~ 3.05e-5 expected)")

    all_ok = ok_size and ok_hdr and ok_data and (meta16['flags']==FLAG_INT16) and (nbytes16==expected16) and (max_err <= 1.0/32767 + 1e-9)
    print(f"  RESULT: {'PASS' if all_ok else 'FAIL'}")
