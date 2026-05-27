#!/usr/bin/env python3
"""
Crystal Instrument — Phase 3 full chromatic build script.

Cycle 9 of the GSL permanent steward. Loudon approved the cycle-8 audition
(8-file Hexagonal/Quartz unit) with option_id=APPROVE. This script is the
GREEN-LIGHT batch: the same adapter over Crystal Audio/crystal_synth.py,
extended to the full 88-note chromatic keyboard (A0..C8) x 2 velocity layers
= 176 WAVs. All voicing settings are unchanged from the approved audition:
    FUNDAMENTAL_GAIN = 0.30
    AMPEG_ATTACK_S   = 0.003 (3 ms)
    Hexagonal DOS, lowest_mode anchor, NOTE_DURATION = 4.0 s
The only deltas from cycle 8's generate.py:
  1. BUILD_DIR points at the project bundle under Projects/ (cycle 8 used
     _ops/sample-libraries/; cycle 8's actual output also landed under
     Projects/, matching the project-bundle convention).
  2. NOTES is the full chromatic A0..C8 (88 notes), not the 4 audition keys.
  3. SFZ writer uses lokey/hikey = MIDI note for each region (per-key zones,
     same as the audition unit — pitch_keytrack=0 keeps each sample at its
     own rendered pitch).

The original audition script (generate.py) is preserved as cycle-8 record.
"""

import os
import json
import datetime
from pathlib import Path
import importlib.util

import numpy as np
from scipy.io import wavfile

# ── Paths (absolute) ──────────────────────────────────────────────────
PALACE_ROOT = Path(os.environ.get("PALACE_ROOT", "/Users/loudonstearns/Documents/The Palace"))
BUILD_DIR = PALACE_ROOT / "Projects" / "Generative Sample Libraries" / "crystal-instrument"
SAMPLES_DIR = BUILD_DIR / "samples"
SFZ_PATH = BUILD_DIR / "crystal_instrument.sfz"
OFFSETS_PATH = BUILD_DIR / "offsets.json"
LOG_PATH = BUILD_DIR / "build-log.md"

CRYSTAL_SYNTH_PATH = PALACE_ROOT / "Crystal Audio" / "crystal_synth.py"

SAMPLE_RATE = 44100
NOTE_DURATION = 4.0   # seconds per rendered note

INSTRUMENT_NAME = "Hexagonal (Quartz)"

# ── Full chromatic keyboard A0..C8 (88 notes, MIDI 21..108) ───────────
_NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def midi_to_name(midi: int) -> str:
    """Return e.g. 'A0', 'C#4'. Sharps used (matches the Talking Keyboard / Phoneme
    Choir convention agreed in Phase 1; SFZ keyboards are sharp-spelled by default).
    """
    pitch_class = midi % 12
    octave = midi // 12 - 1
    return f"{_NOTE_NAMES_SHARP[pitch_class]}{octave}"


# NOTES list: (midi, note_name) for A0..C8
NOTES = [(m, midi_to_name(m)) for m in range(21, 109)]  # 88 notes

# Velocity layers — same as audition
VELOCITY_LAYERS = [
    {"layer": 1, "lovel": 1,  "hivel": 63,  "decay_exp": 0.40, "transient_decay": 40.0, "char": "soft strike (long shimmer)"},
    {"layer": 2, "lovel": 64, "hivel": 127, "decay_exp": 0.55, "transient_decay": 55.0, "char": "hard strike (sharper, drier)"},
]

# Adapter-level strike-tone gain — Loudon-approved (gsl-steward-012, APPROVE)
FUNDAMENTAL_GAIN = 0.30

# Onset-trim params — unchanged from audition
ONSET_THRESHOLD_DB = -30.0
ONSET_WINDOW_MS = 5.0
CUSHION_MS = -1.0
AMPEG_ATTACK_S = 0.003


def load_crystal_synth():
    spec = importlib.util.spec_from_file_location("crystal_synth", CRYSTAL_SYNTH_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def midi_to_hz(midi: int) -> float:
    return 440.0 * 2.0 ** ((midi - 69) / 12.0)


def detect_onset_sample(audio: np.ndarray, sample_rate: int) -> int:
    audio = np.asarray(audio, dtype=np.float64)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    window = max(1, int(sample_rate * ONSET_WINDOW_MS / 1000.0))
    threshold_amp = 10 ** (ONSET_THRESHOLD_DB / 20.0)
    sq = audio * audio
    csum = np.concatenate([[0.0], np.cumsum(sq)])
    rms = np.sqrt((csum[window:] - csum[:-window]) / window)
    above = np.argmax(rms > threshold_amp)
    if above == 0 and rms[0] <= threshold_amp:
        return 0
    return int(above)


def offset_with_cushion(onset: int, sample_rate: int) -> int:
    cushion_samples = int(sample_rate * CUSHION_MS / 1000.0)
    return max(0, onset - cushion_samples)


def estimate_fundamental(audio: np.ndarray, sample_rate: int, expected_hz: float) -> float:
    audio = np.asarray(audio, dtype=np.float64)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    n = min(len(audio), int(sample_rate * 1.5))
    seg = audio[:n] * np.hanning(n)
    spec = np.abs(np.fft.rfft(seg))
    freqs = np.fft.rfftfreq(n, 1.0 / sample_rate)
    lo, hi = expected_hz * 0.75, expected_hz * 1.5
    band = (freqs >= lo) & (freqs <= hi)
    if not band.any():
        return float("nan")
    idx = np.argmax(spec[band])
    return float(freqs[band][idx])


def add_strike_tone(crystal, base_freq, sample_rate, decay_base, gain):
    if gain <= 0:
        return crystal
    t = np.linspace(0, len(crystal) / sample_rate, len(crystal), endpoint=False)
    env = np.exp(-decay_base * t)
    fund = gain * env * (
        np.sin(2.0 * np.pi * base_freq * t)
        + 0.5 * np.sin(2.0 * np.pi * 2.0 * base_freq * t)
    )
    mix = crystal + fund
    peak = np.abs(mix).max()
    if peak > 0:
        mix = mix / peak * 0.88
    return mix


def save_wav(path, audio, sr=SAMPLE_RATE):
    wavfile.write(str(path), sr, (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16))


def main():
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    cs = load_crystal_synth()

    hex_entry = next(c for c in cs.CRYSTALS if c["name"] == "4_hexagonal")
    freqs_norm = hex_entry["dos"]()
    decay_base = hex_entry["p"]["decay_base"]

    print("=" * 60)
    print(f"Crystal Instrument FULL CHROMATIC — {INSTRUMENT_NAME}")
    print(f"Source: {CRYSTAL_SYNTH_PATH.name} (imported, unedited)")
    print(f"Range: {NOTES[0][1]} (MIDI {NOTES[0][0]}) .. {NOTES[-1][1]} (MIDI {NOTES[-1][0]}) — {len(NOTES)} notes")
    print(f"Layers: {len(VELOCITY_LAYERS)}  Total WAVs: {len(NOTES) * len(VELOCITY_LAYERS)}")
    print("=" * 60)

    offsets = {}
    cents_errors = []
    rendered = 0
    total = len(NOTES) * len(VELOCITY_LAYERS)

    for midi, note_name in NOTES:
        base_freq = midi_to_hz(midi)
        for L in VELOCITY_LAYERS:
            audio = cs.synthesize_strike(
                freqs_norm,
                base_freq=base_freq,
                freq_anchor="lowest_mode",
                max_freq=18000.0,
                duration=NOTE_DURATION,
                sample_rate=SAMPLE_RATE,
                n_bins=100,
                decay_base=decay_base,
                decay_exp=L["decay_exp"],
                fidelity="shaped",
                transient_decay=L["transient_decay"],
            )

            audio = add_strike_tone(
                audio, base_freq, SAMPLE_RATE, decay_base, FUNDAMENTAL_GAIN
            )

            wav_name = f"crystal_{note_name}_L{L['layer']}.wav"
            wav_path = SAMPLES_DIR / wav_name
            save_wav(wav_path, audio)

            onset = detect_onset_sample(audio, SAMPLE_RATE)
            offset = offset_with_cushion(onset, SAMPLE_RATE)
            est_f = estimate_fundamental(audio, SAMPLE_RATE, base_freq)
            cents = 1200.0 * np.log2(est_f / base_freq) if est_f == est_f else float("nan")
            cents_errors.append(abs(cents))

            offsets[wav_name] = {
                "midi": midi,
                "note": note_name,
                "target_hz": round(base_freq, 3),
                "measured_hz": round(est_f, 3),
                "cents_error": round(cents, 1),
                "onset_sample": int(onset),
                "offset_sample": int(offset),
                "sample_rate": SAMPLE_RATE,
                "total_samples": int(len(audio)),
            }

            rendered += 1
            if rendered % 20 == 0 or rendered == total:
                print(f"  [{rendered:3d}/{total}] {wav_name:24s} target={base_freq:8.2f}Hz "
                      f"measured={est_f:8.2f}Hz err={cents:+6.1f}c")

    OFFSETS_PATH.write_text(json.dumps(offsets, indent=2, sort_keys=True))
    write_sfz(offsets)
    write_log(offsets, cents_errors)

    worst = max(cents_errors)
    mean_err = float(np.mean(cents_errors))
    print(f"\n  Pitch check: worst |error| = {worst:.1f} cents, mean = {mean_err:.1f} cents across {len(offsets)} files.")
    print(f"  Output: {SAMPLES_DIR}")
    print("Done.")


def write_sfz(offsets):
    lines = [
        "// Crystal Instrument — Phase 3 of Generative Sample Libraries",
        f"// First non-Kokoro source: {INSTRUMENT_NAME} from Crystal Audio/crystal_synth.py",
        f"// FULL CHROMATIC: {len(NOTES)} notes ({NOTES[0][1]}..{NOTES[-1][1]}) "
        f"x {len(VELOCITY_LAYERS)} velocity layers = {len(NOTES) * len(VELOCITY_LAYERS)} regions.",
        "//",
        "// Pitch: base_freq set per MIDI note; FREQ_ANCHOR='lowest_mode' anchors",
        "// the lowest phonon at base_freq, and a quiet strike tone (adapter-level)",
        "// makes that the perceived pitch. pitch_keytrack=0: each region plays its",
        "// own pre-pitched sample.",
        f"// Onset trim: -{abs(ONSET_THRESHOLD_DB):.0f} dBFS, {CUSHION_MS:.0f} ms cushion. "
        f"Fade-in: {AMPEG_ATTACK_S*1000:.0f} ms.",
        f"// Strike-tone gain (adapter): {FUNDAMENTAL_GAIN} — approved on gsl-steward-012.",
        "",
        "<control>",
        "default_path=samples/",
        "",
        "<global>",
        "loop_mode=one_shot",
        "pitch_keytrack=0",
        f"ampeg_attack={AMPEG_ATTACK_S} ampeg_release=0.1",
        "amp_veltrack=0",
        "",
    ]
    for L in VELOCITY_LAYERS:
        lines.append(f"// Layer {L['layer']} (vel {L['lovel']}-{L['hivel']}): {L['char']}")
        lines.append("<group>")
        lines.append(f"  lovel={L['lovel']} hivel={L['hivel']}")
        for midi, note_name in NOTES:
            wav_name = f"crystal_{note_name}_L{L['layer']}.wav"
            info = offsets[wav_name]
            lines.append(
                f"<region> sample={wav_name} "
                f"lokey={midi} hikey={midi} pitch_keycenter={midi} "
                f"offset={info['offset_sample']}"
            )
        lines.append("")
    SFZ_PATH.write_text("\n".join(lines) + "\n")
    print(f"Wrote SFZ: {SFZ_PATH}")


def write_log(offsets, cents_errors):
    # show a few rows at the extremes plus middle
    sorted_items = sorted(offsets.items(), key=lambda kv: (kv[1]["midi"], kv[0]))
    sample_rows = sorted_items[:4] + sorted_items[len(sorted_items)//2:len(sorted_items)//2 + 4] + sorted_items[-4:]
    rows = "\n".join(
        f"| {v['note']} | {v['midi']} | {v['target_hz']} | {v['measured_hz']} | {v['cents_error']:+} |"
        for k, v in sample_rows
    )
    worst = max(cents_errors)
    mean_err = float(np.mean(cents_errors))
    log = f"""# Crystal Instrument — Build Log (Phase 3 full chromatic)

Built: {datetime.datetime.now().isoformat(timespec='seconds')}

## What this ships
The full chromatic Hexagonal (Quartz) instrument — {len(NOTES)} notes ({NOTES[0][1]}..{NOTES[-1][1]})
x {len(VELOCITY_LAYERS)} velocity layers = {len(NOTES) * len(VELOCITY_LAYERS)} WAVs + a single
multi-region SFZ. All settings carried forward unchanged from the cycle-8
audition unit, which Loudon approved with `option_id=APPROVE` on
`gsl-steward-012`.

## Source adapter (unchanged from audition)
- `crystal_synth.py` imported via importlib; not modified.
- FREQ_ANCHOR='lowest_mode' -> lowest phonon lands exactly at base_freq.
- base_freq = 440 * 2**((midi-69)/12).
- Hexagonal DOS + registry decay_base; per-layer decay_exp / transient_decay
  model strike hardness as the "velocity" axis.
- Strike-tone voicing (adapter only, gain={FUNDAMENTAL_GAIN}): a quiet
  fundamental+octave at base_freq is mixed in with the crystal's decay so
  the bell has a clear strike tone matching the played note. APPROVED by
  Loudon on gsl-steward-012.

## Reused from Phoneme Choir
- Onset detection ({ONSET_WINDOW_MS:.0f} ms windowed RMS > {ONSET_THRESHOLD_DB:.0f} dBFS),
  SFZ `offset=`, {AMPEG_ATTACK_S*1000:.0f} ms ampeg_attack fade.

## Output
- {len(NOTES) * len(VELOCITY_LAYERS)} WAVs, {SAMPLE_RATE} Hz mono 16-bit, {NOTE_DURATION:.0f} s.
- Filename convention: `crystal_<NoteName><Octave>_L<layer>.wav` (sharps).
- SFZ: `crystal_instrument.sfz` — per-key regions, two velocity groups.

## Pitch verification (FFT peak around target — sample rows)
| Note | MIDI | Target Hz | Measured Hz | Cents error |
|---|---|---|---|---|
{rows}

Worst |cents error| across all {len(offsets)} files = {worst:.1f}. Mean |error| = {mean_err:.1f}.

(Full pitch report lives in `offsets.json`.)

## What changed from cycle 8 (the audition)
- NOTES expanded from 4 (C2,C3,C4,C5) to 88 (A0..C8).
- SFZ extended to {len(NOTES) * len(VELOCITY_LAYERS)} regions across the same two groups.
- All voicing parameters (FUNDAMENTAL_GAIN, decay_exp, transient_decay,
  AMPEG_ATTACK_S, ONSET thresholds) identical to the audition build.
- BUILD_DIR now correctly points to the project bundle at
  `Projects/Generative Sample Libraries/crystal-instrument/` (cycle 8's
  generate.py had a stale `_ops/sample-libraries/` path even though its
  artifacts landed under Projects/).
"""
    LOG_PATH.write_text(log)
    print(f"Wrote build log: {LOG_PATH}")


if __name__ == "__main__":
    main()
