# BUILD.md — Electronic Hi-Hat

Locked-in conventions for this build. Future sessions read this first instead of re-running the Interview from scratch. See [[Generative Sample Libraries]] Phase 2 for the gates this file satisfies.

## Source

Palace synthesis — Python (`numpy` + `scipy.signal`). No external sources. Each variant is a fresh deterministic render.

## Range and mapping

- **Notes:** C2–B2 (MIDI 36–47), one octave, twelve unique samples.
- **Mapping style:** percussion (each note plays its own sample at original pitch). `pitch_keytrack=0`.
- **One sample per note.** No round-robin — samples are deterministic, repeat-takes would be bit-identical.

## Velocity model

**8 baked velocity layers per note.** Length, brightness, and partial set are baked into each layer's audio — the sample IS the velocity result. The SFZ does no envelope / filter / amplitude velocity tracking; the user's sampler is free to apply its own amplitude curve and envelope shaping on top.

| Layer | Velocity | Decay | Band (HP → LP) | Character |
|---|---|---|---|---|
| L1 | 1–15 | 70 ms | 4500–6500 Hz | tightest closed |
| L2 | 16–31 | 110 ms | 4200–7500 Hz | tight closed |
| L3 | 32–47 | 150 ms | 4000–8500 Hz | closed / loose |
| L4 | 48–63 | 200 ms | 3800–9500 Hz | loose |
| L5 | 64–79 | 280 ms | 3700–10500 Hz | half-open |
| L6 | 80–95 | 380 ms | 3600–11500 Hz | open |
| L7 | 96–111 | 490 ms | 3500–13000 Hz | bright open |
| L8 | 112–127 | 600 ms | 3500–15000 Hz | full open |

SFZ global settings: `loop_mode=one_shot`, `pitch_keytrack=0`, `ampeg_attack=0`, `amp_veltrack=0`. Each `<group>` carries `lovel`/`hivel` for its velocity slice; each `<region>` maps one (note, layer) WAV.

Sharp-transient design (preserved across all 8 layers):
- Per-layer bandpass is applied to the **noise body** via filter chain that is pre-rolled 15 ms and then trimmed — every filter is in steady state at t=0.
- The **metallic attack** partials are scaled analytically by the layer bandpass's magnitude response (via `freqz`), so each partial gets the correct per-layer gain without any filter transient on the attack.

## Sound design

Each sample is two components, summed. The mixed signal then passes through the layer's bandpass (which sets brightness) and the layer's linear-amplitude envelope (which sets length).

1. **Inharmonic metallic attack.** 8 partials between ~2.2 kHz and ~13 kHz, each with a 2.5–8 ms linear decay. Each partial's amplitude is analytically scaled by the layer bandpass's magnitude response at its frequency — so the lowest partial (~2.2 kHz) is mostly silent at L1 (band 4500–6500 Hz) but at full level at L7/L8. Mixed at low level (`ATTACK_GAIN=0.18`) — a hint of metal, not a chime.
2. **Noise body.** White noise through a 3.5–13 kHz base bandpass, then broad low-Q (Q=6) resonant peaks at the variant's partial frequencies, then the per-layer bandpass. All filters pre-rolled 15 ms and trimmed for a sharp transient at t=0.

After mixing both components, the signal is shaped by the layer's linear-decay envelope (full at t=0, zero at `decay_s`, silent for the rest of the 700 ms file) and peak-normalized to −1 dBFS.

### Variant axis (per Loudon's spec)

Anchor partial set (Hz): 2200, 3300, 4200, 5800, 7300, 9100, 11000, 13500.

Per (note, layer) — **96 distinct partial sets in total** — each partial is jittered ±5–15 % independently, then the set is rescaled so its geometric mean (a robust spectral-centroid proxy) equals the anchor's exactly (~6028.6 Hz). Result: every one of the 96 cells in the 12 × 8 grid is a unique inharmonic "chord" sharing the same average altitude — internal intervals reshuffle, family identity holds.

The noise body uses the per (note, layer) partial set to drive its resonance peaks, so each cell's "ping" and "sizzle" rhyme.

Random seed = `midi_note * 1000 + layer_index`, so renders are reproducible.

## Audio format

- 48 kHz, 24-bit signed PCM, mono.
- File length: 700 ms (covers the full open-hat tail with headroom for the envelope).
- Peak normalized to −1 dBFS per file to keep variant-to-variant level consistent.

## Filename and folder layout

```
_ops/sample-libraries/electronic-hihat/
├── BUILD.md                ← this file
├── generate.py             ← the renderer
├── electronic_hihat.sfz    ← the instrument
└── samples/                ← 96 files: hihat_<note>_L<1-8>.wav
    ├── hihat_C2_L1.wav … hihat_C2_L8.wav
    ├── hihat_C#2_L1.wav … hihat_C#2_L8.wav
    ├── …
    └── hihat_B2_L1.wav … hihat_B2_L8.wav
```

Sharps not flats. `pitch_keycenter` and `lokey`/`hikey` use MIDI numbers (36–47) for unambiguity.

## Audition cycle (Rule 2)

Before the full 96, render F#2 across all 8 layers first (`python3 generate.py --audition`) and pause for Loudon's listen. Only after explicit approval does the full batch run.

## Format

SFZ. Plays in sforzando, Surge XT, Reaper, Bitwig, sfizz.
