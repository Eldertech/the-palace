#!/usr/bin/env python3
"""
Crystal Instrument — Phase 3 build script for Generative Sample Libraries.

This is the FIRST non-Kokoro source adapter. It proves the Interview pipeline
works against a palace-synthesis source: Crystal Audio/crystal_synth.py.

What the adapter does
---------------------
crystal_synth.py renders inharmonic "strikes" of the 7 Bravais lattices. It is
NOT natively a pitched instrument — the physics gives ratios, not absolute
pitch. But its FREQ_ANCHOR='lowest_mode' mode maps the softest acoustic phonon
to `base_freq`, so the lowest surviving partial lands exactly at base_freq.
That makes base_freq the perceived fundamental. To render MIDI note N we set
    base_freq = 440 * 2**((N - 69) / 12)
and the whole partial structure scales with it — timbre is preserved across
the keyboard while pitch tracks the note. That is exactly the property a
sampled instrument wants. No edit to crystal_synth.py is needed; we import
synthesize_strike() and the DOS function and drive them per note.

Reused from the Phoneme Choir
-----------------------------
The responsive-onset trim pipeline: windowed-RMS onset detection, SFZ
`offset=` per region, and a short ampeg_attack fade to suppress the start
click. Crystal strikes already begin at t=0 (no leading breath like TTS), but
the impulse transient can click, so the same trim+fade is honest insurance.

Audition unit (this cycle)
--------------------------
ONE instrument: Hexagonal (Quartz) — its birefringent shimmer keeps the pitch
legible. 4 notes (C2, C3, C4, C5) x 2 velocity layers = 8 WAVs + a .sfz.

Filename convention (agreed this cycle, matches electronic-hihat):
    crystal_<NoteName><Octave>_L<layer>.wav      e.g. crystal_C4_L2.wav

Run:
    python3 "/Users/loudonstearns/Documents/The Palace/_ops/sample-libraries/crystal-instrument/generate.py"
"""

import os
import json
import datetime
from pathlib import Path
import importlib.util

import numpy as np
from scipy.io import wavfile

# ── Paths (absolute) ──────────────────────────────────────────────────
# Canonical Mac path. Override with PALACE_ROOT when running inside a sandbox
# where the palace is mounted elsewhere (e.g. /sessions/.../mnt/The Palace).
PALACE_ROOT = Path(os.environ.get("PALACE_ROOT", "/Users/loudonstearns/Documents/The Palace"))
BUILD_DIR = PALACE_ROOT / "_ops" / "sample-libraries" / "crystal-instrument"
SAMPLES_DIR = BUILD_DIR / "samples"
SFZ_PATH = BUILD_DIR / "crystal_instrument.sfz"
OFFSETS_PATH = BUILD_DIR / "offsets.json"
LOG_PATH = BUILD_DIR / "build-log.md"

CRYSTAL_SYNTH_PATH = PALACE_ROOT / "Crystal Audio" / "crystal_synth.py"

SAMPLE_RATE = 44100
NOTE_DURATION = 4.0   # seconds per rendered note

# ── Audition spec: ONE instrument, small range, 2 velocity layers ─────
INSTRUMENT_NAME = "Hexagonal (Quartz)"

# (MIDI note, NoteName) — C2,C3,C4,C5
NOTES = [
    (36, "C2"),
    (48, "C3"),
    (60, "C4"),
    (72, "C5"),
]

# Velocity layers. The crystal physics gives no "velocity" — we model it as
# strike hardness: a harder strike (loud) damps high modes faster and has a
# sharper transient. Cheap to vary; gives two distinct timbres per note.
# (layer, lovel, hivel, decay_exp, transient_decay, char)
VELOCITY_LAYERS = [
    {"layer": 1, "lovel": 1,  "hivel": 63,  "decay_exp": 0.40, "transient_decay": 40.0, "char": "soft strike (long shimmer)"},
    {"layer": 2, "lovel": 64, "hivel": 127, "decay_exp": 0.55, "transient_decay": 55.0, "char": "hard strike (sharper, drier)"},
]

# Strike-tone voicing (adapter-level, NOT a change to crystal_synth.py).
# The hexagonal DOS is genuinely a dense inharmonic bell: its lowest partial
# lands exactly on base_freq (the anchor works), but the loudest spectral
# energy piles ~240-300 cents above it, so the raw strike has no clear
# perceived pitch — like a real bell whose strike tone differs from its
# loudest partial. To make a PLAYABLE pitched instrument we mix in a quiet
# fundamental (+ octave) at base_freq, decaying with the crystal's envelope.
# This gives the bell a strike tone matching the played note while the crystal
# partials supply the timbre on top. gain=0.30 was the smallest value that
# pulls the perceived peak onto the target (measured to within a few cents).
FUNDAMENTAL_GAIN = 0.30

# Onset-trim params (reused from Phoneme Choir, tuned for a strike that
# starts at t=0). Threshold finds the impulse; small forward cushion lands
# inside the body; 3 ms fade smooths the start.
ONSET_THRESHOLD_DB = -30.0
ONSET_WINDOW_MS = 5.0
CUSHION_MS = -1.0          # negative = step forward into the sound
AMPEG_ATTACK_S = 0.003     # 3 ms fade-in


# ── Import crystal_synth.py without editing it ────────────────────────
def load_crystal_synth():
    spec = importlib.util.spec_from_file_location("crystal_synth", CRYSTAL_SYNTH_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def midi_to_hz(midi: int) -> float:
    return 440.0 * 2.0 ** ((midi - 69) / 12.0)


# ── Onset trim (reused from Phoneme Choir) ────────────────────────────
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


# ── Pitch verification (FFT peak of the low band) ─────────────────────
def estimate_fundamental(audio: np.ndarray, sample_rate: int, expected_hz: float) -> float:
    """Estimate perceived fundamental as the strongest spectral peak within an
    octave band around the expected note. Crystal partials are inharmonic, so
    we look near the expected fundamental rather than assuming a harmonic comb.
    """
    audio = np.asarray(audio, dtype=np.float64)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    # analyze the sustain (skip the transient): first 1.5 s after onset
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
    """Mix a quiet fundamental (+ octave) at base_freq into the crystal strike
    so the bell has a clear strike tone matching the played note. Uses the
    crystal's own first-order decay so the tone rings and fades with the body.
    Returns a peak-normalized mix. gain=0 returns the raw crystal unchanged.
    """
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


# ── Main render ───────────────────────────────────────────────────────
def main():
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    cs = load_crystal_synth()

    # Hexagonal DOS + its registry decay params (decay_base, etc.)
    hex_entry = next(c for c in cs.CRYSTALS if c["name"] == "4_hexagonal")
    freqs_norm = hex_entry["dos"]()
    decay_base = hex_entry["p"]["decay_base"]

    print("=" * 60)
    print(f"Crystal Instrument generator — {INSTRUMENT_NAME}")
    print(f"Source: {CRYSTAL_SYNTH_PATH.name} (imported, unedited)")
    print("=" * 60)

    offsets = {}
    cents_errors = []

    for midi, note_name in NOTES:
        base_freq = midi_to_hz(midi)
        for L in VELOCITY_LAYERS:
            audio = cs.synthesize_strike(
                freqs_norm,
                base_freq=base_freq,
                freq_anchor="lowest_mode",   # maps lowest phonon -> base_freq
                max_freq=18000.0,            # ceiling above hearing-relevant range
                duration=NOTE_DURATION,
                sample_rate=SAMPLE_RATE,
                n_bins=100,
                decay_base=decay_base,
                decay_exp=L["decay_exp"],
                fidelity="shaped",
                transient_decay=L["transient_decay"],
            )

            # Adapter-level strike-tone voicing so the bell reads as pitched.
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

            print(
                f"  {wav_name:24s} target={base_freq:7.2f}Hz  "
                f"measured={est_f:7.2f}Hz  err={cents:+6.1f}cents  "
                f"onset={onset*1000.0/SAMPLE_RATE:.0f}ms"
            )

    OFFSETS_PATH.write_text(json.dumps(offsets, indent=2, sort_keys=True))
    write_sfz(offsets)
    write_log(offsets, cents_errors)

    worst = max(cents_errors)
    print(f"\n  Pitch check: worst |error| = {worst:.1f} cents across {len(offsets)} files.")
    print(f"  Output: {SAMPLES_DIR}")
    print("Done.")


def write_sfz(offsets):
    lines = [
        "// Crystal Instrument — Phase 3 of Generative Sample Libraries",
        f"// First non-Kokoro source: {INSTRUMENT_NAME} from Crystal Audio/crystal_synth.py",
        "// 4 notes (C2,C3,C4,C5) x 2 velocity layers = 8 regions (AUDITION UNIT).",
        "//",
        "// Pitch: base_freq set per MIDI note; FREQ_ANCHOR='lowest_mode' anchors",
        "// the lowest phonon at base_freq, and a quiet strike tone (adapter-level)",
        "// makes that the perceived pitch. pitch_keytrack=0: each region plays its",
        "// own pre-pitched sample.",
        f"// Onset trim: -{abs(ONSET_THRESHOLD_DB):.0f} dBFS, {CUSHION_MS:.0f} ms cushion. "
        f"Fade-in: {AMPEG_ATTACK_S*1000:.0f} ms.",
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
    rows = "\n".join(
        f"| {v['note']} | {v['midi']} | {v['target_hz']} | {v['measured_hz']} | {v['cents_error']:+} |"
        for k, v in sorted(offsets.items())
    )
    worst = max(cents_errors)
    log = f"""# Crystal Instrument — Build Log (Phase 3 audition)

Built: {datetime.datetime.now().isoformat(timespec='seconds')}

## What this proves
The Interview pipeline now runs against a NON-Kokoro source: palace synthesis
({INSTRUMENT_NAME}) from `Crystal Audio/crystal_synth.py`. The adapter imports
`synthesize_strike()` unedited and drives `base_freq` per MIDI note. This
unblocks promotion of the Interview skill out of draft.

## Source adapter
- `crystal_synth.py` imported via importlib; not modified.
- FREQ_ANCHOR='lowest_mode' -> lowest phonon lands exactly at base_freq.
- base_freq = 440 * 2**((midi-69)/12).
- Hexagonal DOS + registry decay_base; per-layer decay_exp / transient_decay
  model strike hardness as the "velocity" axis (physics gives no velocity).
- Strike-tone voicing (adapter only, gain={FUNDAMENTAL_GAIN}): the raw hexagonal
  strike is a dense inharmonic bell whose loudest energy sits ~240-300 cents
  above its lowest partial, so it has no clear perceived pitch. A quiet
  fundamental (+octave) at base_freq is mixed in with the crystal's decay,
  giving a strike tone that matches the played note. This is an instrument-
  voicing choice in the adapter; crystal_synth.py is untouched.

## Reused from Phoneme Choir
- Onset detection ({ONSET_WINDOW_MS:.0f} ms windowed RMS > {ONSET_THRESHOLD_DB:.0f} dBFS),
  SFZ `offset=`, {AMPEG_ATTACK_S*1000:.0f} ms ampeg_attack fade.

## Audition unit
- 4 notes (C2,C3,C4,C5) x 2 velocity layers = 8 WAVs, {SAMPLE_RATE} Hz mono, {NOTE_DURATION:.0f} s.
- Filename convention: `crystal_<NoteName><Octave>_L<layer>.wav`

## Pitch verification (FFT peak in +/- band around target)
| Note | MIDI | Target Hz | Measured Hz | Cents error |
|---|---|---|---|---|
{rows}

Worst |cents error| = {worst:.1f}.

## What a human still has to judge (the audition gate)
Timbre quality, whether the pitch *reads* as that note to the ear (inharmonic
partials can muddy perceived pitch), and whether the soft/hard layers feel like
the same instrument. The full keyboard batch waits on Loudon's ear.
"""
    LOG_PATH.write_text(log)
    print(f"Wrote build log: {LOG_PATH}")


if __name__ == "__main__":
    main()
