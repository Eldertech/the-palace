# Surge XT .wt writer — Phase 3 format coverage (cycle 10, 2026-06-08)

## What this adds
`surge_writer.py` is the third format target for **Generative Wavetable
Libraries**, completing the major-ecosystem trio from a single source table:

| Format | File | Container | Frame size | Sample type |
|---|---|---|---|---|
| Serum / CLM | `crystal_bravais.wav` | RIFF/WAVE + `clm ` chunk | 2048 | float32 |
| Ableton Wavetable | `crystal_bravais_ableton.wav` | plain RIFF/WAVE | 1024 | int16 |
| Surge XT | `crystal_bravais.wt` | `vawt` binary | 2048 | float32 |

All three are rendered from the same `build_keyframes` → `interpolate_table`
pipeline in `generate.py`. The `.wt` file carries the identical 64×2048 float
table the Serum render uses, in Surge's native container.

## The .wt format
Surge XT's wavetable container is a 12-byte header plus raw frame-major samples:

- bytes 0–3: ASCII magic `vawt`
- bytes 4–7: uint32 LE `wave_size` — samples per single-cycle frame (must be a
  power of two; 2048 here)
- bytes 8–9: uint16 LE `wave_count` — number of frames (64 here)
- bytes 10–11: uint16 LE `flags` — bit 0 = treat as one-shot sample, bit 1 =
  samples are int16 rather than float32. We clear all flags: a plain looping
  wavetable in float32.
- bytes 12…: `wave_count × wave_size` samples, frame-major, LE float32.

`crystal_bravais.wt` is therefore `12 + 64·2048·4 = 524,300` bytes.

## Verification done at build time
- Writer self-test (`python3 surge_writer.py`): writes a known 8×2048 table,
  reads it back, confirms exact float32 round-trip, correct header fields, and
  exact file sizes for both float32 and int16 modes; int16 quantization stays
  within 1/32767. **PASS.**
- On-disk header hexdump confirms `vawt` magic, `wave_size=2048`,
  `wave_count=64`, `flags=0`.
- Round-trip of the actual Crystal Bravais table: read-back frames are
  bit-identical to the float32-cast source table.
- An `int16` mode exists for size-sensitive use (halves the file, sets flag
  bit 1) but is not the default — float32 matches the Serum render's fidelity.

## What isn't verified
The author (a text agent) cannot load the file into Surge XT. Format-correctness
is verified against the documented `vawt` layout and a lossless internal
round-trip; whether Surge *renders the sweep musically* is the same question
the Phase 1 audition already answered for the shared source table — this writer
only re-containers that accepted material, it does not change the audio.
