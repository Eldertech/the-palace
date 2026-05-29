"""
Electronic Hi-Hat — generate.py

Renders one octave (C2-B2, MIDI 36-47) of subtle hi-hat variants across
EIGHT velocity layers — length, brightness, and partial set baked into
each layer.

  L1 (vel   1-15):  tightest closed — 70 ms, band 4500-6500 Hz
  L2 (vel  16-31):  tight closed    — 110 ms, band 4200-7500 Hz
  L3 (vel  32-47):  closed/loose    — 150 ms, band 4000-8500 Hz
  L4 (vel  48-63):  loose           — 200 ms, band 3800-9500 Hz
  L5 (vel  64-79):  half-open       — 280 ms, band 3700-10500 Hz
  L6 (vel  80-95):  open            — 380 ms, band 3600-11500 Hz
  L7 (vel  96-111): bright open     — 490 ms, band 3500-13000 Hz
  L8 (vel 112-127): full open       — 600 ms, band 3500-15000 Hz

Per (note, layer) gets its own centroid-preserving partial reshuffle (96
unique partial sets total). Output: 96 files, 48 kHz / 24-bit / mono /
700 ms, peak -1 dBFS, linear amplitude decay to silence.

Sharp-transient design:
  - Noise body bandpassed and resonance-peaked, then put through the
    layer bandpass — all with a 15 ms pre-roll that is then discarded,
    so every filter is in steady state at t=0.
  - Metallic partials are scaled analytically by the layer bandpass's
    magnitude response (via freqz), avoiding any filter transient on
    the attack.
  - Linear-decay envelope applied last; no fade-ins.

The SFZ instrument selects layers by velocity range. No SFZ-level filter
or envelope velocity tracking — the sample IS the velocity result.

Usage:
    python3 generate.py                  # full batch (96 files)
    python3 generate.py --audition       # only F#2 across all 8 layers
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

import numpy as np
from scipy import signal


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SR = 48_000
DUR_S = 0.700
N_SAMPLES = int(SR * DUR_S)

LOW_MIDI = 36                # C2
HIGH_MIDI = 47               # B2
AUDITION_NOTE = 42           # F#2

# Inharmonic anchor partials and per-partial linear-decay times.
ANCHOR_PARTIALS = np.array(
    [2200.0, 3300.0, 4200.0, 5800.0, 7300.0, 9100.0, 11000.0, 13500.0]
)
PARTIAL_DECAYS = np.array(
    [0.0025, 0.0030, 0.0035, 0.0045, 0.0055, 0.0065, 0.0070, 0.0080]
)

# Base noise body shaping (constant across layers — per-layer brightness
# is set by the LAYER bandpass on top of this base).
NOISE_BP_LOW = 3500.0
NOISE_BP_HIGH = 13_000.0
NOISE_RESONANCE_GAIN_DB = 2.5
NOISE_RESONANCE_Q = 6.0

ATTACK_GAIN = 0.18
NOISE_GAIN = 1.00
TARGET_PEAK_DBFS = -1.0

# Velocity layers — 8 layers spanning velocity 1-127.
# Each layer has its own linear-decay length and bandpass (hp, lp).
LAYERS = [
    {"index": 1, "lovel":   1, "hivel":  15, "decay_s": 0.070, "hp_hz": 4500.0, "lp_hz":  6500.0},
    {"index": 2, "lovel":  16, "hivel":  31, "decay_s": 0.110, "hp_hz": 4200.0, "lp_hz":  7500.0},
    {"index": 3, "lovel":  32, "hivel":  47, "decay_s": 0.150, "hp_hz": 4000.0, "lp_hz":  8500.0},
    {"index": 4, "lovel":  48, "hivel":  63, "decay_s": 0.200, "hp_hz": 3800.0, "lp_hz":  9500.0},
    {"index": 5, "lovel":  64, "hivel":  79, "decay_s": 0.280, "hp_hz": 3700.0, "lp_hz": 10500.0},
    {"index": 6, "lovel":  80, "hivel":  95, "decay_s": 0.380, "hp_hz": 3600.0, "lp_hz": 11500.0},
    {"index": 7, "lovel":  96, "hivel": 111, "decay_s": 0.490, "hp_hz": 3500.0, "lp_hz": 13000.0},
    {"index": 8, "lovel": 112, "hivel": 127, "decay_s": 0.600, "hp_hz": 3500.0, "lp_hz": 15000.0},
]


# ---------------------------------------------------------------------------
# Variant generation — per (note, layer) centroid-preserving jitter
# ---------------------------------------------------------------------------

def variant_partials(
    midi_note: int,
    layer_index: int,
    jitter_low: float = 0.05,
    jitter_high: float = 0.15,
) -> np.ndarray:
    """Per (note, layer) partial set. Seed = midi_note * 1000 + layer_index
    so every (note, layer) gets its own jitter realisation while still
    being fully deterministic.

    Geometric mean of partials is preserved within float precision so the
    spectral centroid is identical across all 96 partial sets — only the
    internal intervals reshuffle.
    """
    rng = np.random.default_rng(seed=midi_note * 1000 + layer_index)
    n = ANCHOR_PARTIALS.size
    j_magnitudes = rng.uniform(jitter_low, jitter_high, size=n)
    j_signs = rng.choice([-1.0, 1.0], size=n)
    shifted = ANCHOR_PARTIALS * (1.0 + j_signs * j_magnitudes)
    anchor_gm = np.exp(np.mean(np.log(ANCHOR_PARTIALS)))
    shifted_gm = np.exp(np.mean(np.log(shifted)))
    return shifted * (anchor_gm / shifted_gm)


# ---------------------------------------------------------------------------
# Layer bandpass response — used analytically for per-partial gain
# ---------------------------------------------------------------------------

def layer_bp_response_at(
    freqs: np.ndarray, hp_hz: float, lp_hz: float, order: int = 2
) -> np.ndarray:
    """Magnitude response of the layer bandpass at the given frequencies.
    Computed via scipy.signal.sosfreqz against the exact same SOS we
    apply to the noise body — guaranteed match.
    """
    sos = signal.butter(order, [hp_hz, lp_hz], btype="bandpass", fs=SR, output="sos")
    w_target = 2.0 * np.pi * np.asarray(freqs) / SR
    _, h = signal.sosfreqz(sos, worN=w_target)
    return np.abs(h)


# ---------------------------------------------------------------------------
# Metallic attack — analytical per-partial gain (no filter transient)
# ---------------------------------------------------------------------------

def render_attack(
    partials: np.ndarray, midi_note: int, layer_index: int,
    hp_hz: float, lp_hz: float,
) -> np.ndarray:
    """Sum of linear-decay sinusoids. Each partial's amplitude is scaled
    analytically by the layer bandpass response at its frequency — so
    partials far outside the layer band are nearly silent, partials inside
    pass full, and edge partials roll off smoothly.
    """
    rng = np.random.default_rng(seed=midi_note + 1000 * layer_index + 1_000_000)
    t = np.arange(N_SAMPLES, dtype=np.float64) / SR
    out = np.zeros(N_SAMPLES, dtype=np.float64)

    gains = layer_bp_response_at(partials, hp_hz, lp_hz, order=2)

    for f, tau, gain in zip(partials, PARTIAL_DECAYS, gains):
        if gain < 1e-4:
            continue
        phase = rng.uniform(0.0, 2.0 * math.pi)
        envelope = np.maximum(0.0, 1.0 - t / tau)
        out += gain * envelope * np.sin(2.0 * math.pi * f * t + phase)

    return out / partials.size


# ---------------------------------------------------------------------------
# Noise body — base bandpass + resonance + layer bandpass, all pre-rolled
# ---------------------------------------------------------------------------

def biquad_peak(f0: float, q: float, gain_db: float, sr: int) -> tuple[np.ndarray, np.ndarray]:
    a_amp = 10.0 ** (gain_db / 40.0)
    w0 = 2.0 * math.pi * f0 / sr
    alpha = math.sin(w0) / (2.0 * q)
    cos_w0 = math.cos(w0)
    b0 = 1.0 + alpha * a_amp
    b1 = -2.0 * cos_w0
    b2 = 1.0 - alpha * a_amp
    a0 = 1.0 + alpha / a_amp
    a1 = -2.0 * cos_w0
    a2 = 1.0 - alpha / a_amp
    b = np.array([b0, b1, b2]) / a0
    a = np.array([1.0, a1 / a0, a2 / a0])
    return b, a


def render_noise(
    partials: np.ndarray, midi_note: int, layer_index: int,
    hp_hz: float, lp_hz: float,
) -> np.ndarray:
    """White noise → base bandpass → resonance peaks → layer bandpass.
    Pre-rolled 15 ms so every filter is in steady state at t=0.
    """
    rng = np.random.default_rng(seed=midi_note + 1000 * layer_index + 2_000_000)
    preroll_n = int(0.015 * SR)
    noise = rng.standard_normal(N_SAMPLES + preroll_n)

    sos_base = signal.butter(
        N=4, Wn=[NOISE_BP_LOW, NOISE_BP_HIGH], btype="bandpass", fs=SR, output="sos"
    )
    body = signal.sosfilt(sos_base, noise)

    for f0 in partials:
        if f0 >= SR / 2.0:
            continue
        b, a = biquad_peak(
            f0=f0, q=NOISE_RESONANCE_Q, gain_db=NOISE_RESONANCE_GAIN_DB, sr=SR
        )
        body = signal.lfilter(b, a, body)

    # Per-layer bandpass — the same SOS used analytically for the attack.
    sos_layer = signal.butter(
        N=2, Wn=[hp_hz, lp_hz], btype="bandpass", fs=SR, output="sos"
    )
    body = signal.sosfilt(sos_layer, body)

    return body[preroll_n:]


# ---------------------------------------------------------------------------
# Per (note, layer) render
# ---------------------------------------------------------------------------

def render_note_for_layer(midi_note: int, layer: dict) -> tuple[np.ndarray, np.ndarray]:
    partials = variant_partials(midi_note, layer["index"])
    attack = render_attack(
        partials, midi_note, layer["index"], layer["hp_hz"], layer["lp_hz"]
    )
    noise = render_noise(
        partials, midi_note, layer["index"], layer["hp_hz"], layer["lp_hz"]
    )

    mixed = ATTACK_GAIN * attack + NOISE_GAIN * noise

    # Layer envelope: linear from 1.0 → 0.0 over decay_s, then silent.
    t = np.arange(N_SAMPLES, dtype=np.float64) / SR
    env = np.maximum(0.0, 1.0 - t / layer["decay_s"])
    mixed = mixed * env

    # Peak normalize.
    peak = np.max(np.abs(mixed))
    if peak > 0:
        target = 10.0 ** (TARGET_PEAK_DBFS / 20.0)
        mixed = mixed * (target / peak)

    return mixed, partials


# ---------------------------------------------------------------------------
# WAV writing (24-bit PCM)
# ---------------------------------------------------------------------------

def write_wav_24bit(path: Path, audio_f64: np.ndarray, sr: int = SR) -> None:
    import wave
    max_24 = 2 ** 23 - 1
    audio_i = np.clip(audio_f64, -1.0, 1.0)
    audio_i = (audio_i * max_24).astype(np.int32)
    n = audio_i.size
    raw = np.empty((n, 3), dtype=np.uint8)
    raw[:, 0] = (audio_i & 0xFF).astype(np.uint8)
    raw[:, 1] = ((audio_i >> 8) & 0xFF).astype(np.uint8)
    raw[:, 2] = ((audio_i >> 16) & 0xFF).astype(np.uint8)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(3)
        w.setframerate(sr)
        w.writeframes(raw.tobytes())


NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def midi_to_name(midi: int) -> str:
    octave = midi // 12 - 1
    return f"{NOTE_NAMES_SHARP[midi % 12]}{octave}"


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--audition", action="store_true",
        help="Render only F#2 across all 8 layers"
    )
    parser.add_argument(
        "--out", default=str(Path(__file__).parent / "samples"),
        help="Output directory for WAV files"
    )
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    notes = [AUDITION_NOTE] if args.audition else list(range(LOW_MIDI, HIGH_MIDI + 1))
    total = len(notes) * len(LAYERS)

    print(f"Rendering {total} samples to {out_dir}")
    print(f"  {SR} Hz, {DUR_S*1000:.0f} ms, mono 24-bit")
    print(f"  anchor centroid (geom mean): "
          f"{np.exp(np.mean(np.log(ANCHOR_PARTIALS))):.1f} Hz")
    print()

    for midi in notes:
        name = midi_to_name(midi)
        for layer in LAYERS:
            audio, partials = render_note_for_layer(midi, layer)
            out_path = out_dir / f"hihat_{name}_L{layer['index']}.wav"
            write_wav_24bit(out_path, audio)
            partials_str = ",".join(f"{p:.0f}" for p in partials)
            print(
                f"  hihat_{name:<4} L{layer['index']}  "
                f"vel {layer['lovel']:>3}-{layer['hivel']:<3}  "
                f"decay={int(layer['decay_s']*1000):>3}ms  "
                f"band={int(layer['hp_hz']):>5}-{int(layer['lp_hz']):<5}Hz  "
                f"partials=[{partials_str}]"
            )

    print()
    print(f"Done. Wrote {total} files to {out_dir}")


if __name__ == "__main__":
    main()
