"""
Talking Keyboard — Phase 1 build script for Generative Sample Libraries.

Generates 88 notes (A0–C8) × 4 velocity layers = 352 spoken-note WAV files
via Kokoro-ONNX, then writes a single SFZ file mapping them across the
piano range.

Run with Loudon's existing TTS venv:
    /Users/loudonstearns/documents/TTS/.venv/bin/python \\
        "/Users/loudonstearns/Documents/The Palace/_ops/sample-libraries/talking-keyboard/generate.py"

Test mode (one note × 4 layers, ~3 sec):
    ... generate.py --test
"""

import sys
import time
import datetime
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

# --- Paths (absolute, since the script can be invoked from anywhere) ---
BUILD_DIR = Path("/Users/loudonstearns/Documents/The Palace/_ops/sample-libraries/talking-keyboard")
SAMPLES_DIR = BUILD_DIR / "samples"
SFZ_PATH = BUILD_DIR / "talking_keyboard.sfz"
LOG_PATH = BUILD_DIR / "build-log.md"

# Model files live in Loudon's existing TTS setup; reference don't copy.
MODEL_PATH = "/Users/loudonstearns/documents/TTS/kokoro-v1.0.onnx"
VOICES_PATH = "/Users/loudonstearns/documents/TTS/voices-v1.0.bin"

# --- Velocity layer config ---
# Voice character contrast: gentle female -> warm female -> British female -> bold male
VELOCITY_LAYERS = [
    {"layer": 1, "lovel": 1,   "hivel": 32,  "voice": "af_nova",    "char": "Gentle American female"},
    {"layer": 2, "lovel": 33,  "hivel": 64,  "voice": "af_heart",   "char": "Warmer American female"},
    {"layer": 3, "lovel": 65,  "hivel": 96,  "voice": "bf_emma",    "char": "British female"},
    {"layer": 4, "lovel": 97,  "hivel": 127, "voice": "am_michael", "char": "Bold American male"},
]

# Piano range: A0 (MIDI 21) through C8 (MIDI 108) inclusive = 88 notes
MIDI_LOW = 21
MIDI_HIGH = 108

# --- Note name helpers ---
# Filename-safe: 's' for sharp, no flats. Uppercase letter + s + octave digit.
NOTE_FILENAMES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"]
# Spoken: "C sharp" not "C s". Always lowercase 'sharp' as a word.
# "A" is spelled "eigh" (the "eight" pattern minus the t) so Kokoro produces
# the long-A diphthong /eɪ/ rather than "uh" (indefinite article) or "eye"
# (which "ay" / "aye" both produced). Other letters parse correctly as-is.
NOTE_SPOKEN = ["C", "C sharp", "D", "D sharp", "E", "F", "F sharp", "G", "G sharp", "eigh", "eigh sharp", "B"]
# Octave numbers spelled out for natural TTS pronunciation
OCTAVE_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]


def midi_to_filename_stem(midi: int) -> str:
    """E.g. 60 -> 'C4', 61 -> 'Cs4', 21 -> 'A0', 108 -> 'C8'."""
    octave = (midi // 12) - 1   # MIDI 0 = C-1, MIDI 12 = C0, MIDI 60 = C4
    pitch_class = midi % 12
    return f"{NOTE_FILENAMES[pitch_class]}{octave}"


def midi_to_spoken_text(midi: int) -> str:
    """E.g. 60 -> 'C four', 61 -> 'C sharp four', 21 -> 'A zero'."""
    octave = (midi // 12) - 1
    pitch_class = midi % 12
    note_word = NOTE_SPOKEN[pitch_class]
    if 0 <= octave < len(OCTAVE_WORDS):
        octave_word = OCTAVE_WORDS[octave]
    else:
        octave_word = str(octave)  # negative octaves fall through to digits
    return f"{note_word} {octave_word}"


def generate_all(test_mode: bool = False) -> float:
    """Generate every (note, velocity_layer) WAV. Returns elapsed seconds."""
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading Kokoro ONNX model from {MODEL_PATH}...", flush=True)
    kokoro = Kokoro(MODEL_PATH, VOICES_PATH)
    print("Model loaded.", flush=True)

    midi_high = MIDI_LOW if test_mode else MIDI_HIGH
    note_count = midi_high - MIDI_LOW + 1
    total = note_count * len(VELOCITY_LAYERS)
    done = 0
    start = time.time()

    for midi in range(MIDI_LOW, midi_high + 1):
        stem = midi_to_filename_stem(midi)
        text = midi_to_spoken_text(midi)

        for layer in VELOCITY_LAYERS:
            wav_name = f"kokoro_{stem}_v{layer['layer']}.wav"
            wav_path = SAMPLES_DIR / wav_name

            samples, sample_rate = kokoro.create(
                text,
                voice=layer["voice"],
                speed=1.0,
                lang="en-us",
            )
            sf.write(str(wav_path), samples, sample_rate)
            done += 1

            # Progress every 20 files, plus at start and end
            if done <= 4 or done % 20 == 0 or done == total:
                elapsed = time.time() - start
                rate = done / elapsed if elapsed > 0 else 0
                eta = (total - done) / rate if rate > 0 else 0
                print(
                    f"  [{done}/{total}] {wav_name}  "
                    f"({elapsed:.0f}s elapsed, ~{eta:.0f}s remaining)",
                    flush=True,
                )

    return time.time() - start


def write_sfz() -> None:
    """Write the master SFZ mapping all 352 regions."""
    lines = [
        "// Talking Keyboard — Phase 1 of Generative Sample Libraries",
        "// 88 notes (A0=21 .. C8=108) x 4 velocity layers = 352 regions",
        "// Source: Kokoro-ONNX TTS, voices-v1.0.bin",
        "//",
        "// Velocity layers:",
    ]
    for L in VELOCITY_LAYERS:
        lines.append(
            f"//   v{L['layer']} (vel {L['lovel']:>3}-{L['hivel']:>3}): "
            f"{L['voice']} ({L['char']})"
        )
    lines.append("")
    lines.append("<group>")
    lines.append("  ampeg_attack=0.001 ampeg_release=0.05")
    lines.append("")

    for midi in range(MIDI_LOW, MIDI_HIGH + 1):
        stem = midi_to_filename_stem(midi)
        for L in VELOCITY_LAYERS:
            wav_name = f"kokoro_{stem}_v{L['layer']}.wav"
            lines.append(
                f"<region> sample=samples/{wav_name} "
                f"lokey={midi} hikey={midi} pitch_keycenter={midi} "
                f"lovel={L['lovel']} hivel={L['hivel']}"
            )

    SFZ_PATH.write_text("\n".join(lines) + "\n")
    print(f"Wrote SFZ: {SFZ_PATH}")


def write_log(elapsed_seconds: float) -> None:
    """Write a retrospective build log."""
    log = f"""# Talking Keyboard — Build Log

Built: {datetime.datetime.now().isoformat(timespec='seconds')}

## Stack
- kokoro-onnx (>=0.5.0) from Loudon's TTS venv
- Model: /Users/loudonstearns/documents/TTS/kokoro-v1.0.onnx
- Voices: /Users/loudonstearns/documents/TTS/voices-v1.0.bin (54-voice bundle)
- Sample rate: 24000 Hz, mono
- Python venv: /Users/loudonstearns/documents/TTS/.venv

## Voice assignment (no substitutions; all four voices present in bundle)
| Layer | Velocity | Voice | Character |
|---|---|---|---|
| v1 | 1-32   | af_nova    | Gentle American female |
| v2 | 33-64  | af_heart   | Warmer American female |
| v3 | 65-96  | bf_emma    | British female |
| v4 | 97-127 | am_michael | Bold American male |

## Counts
- 88 notes (A0-C8) x 4 layers = 352 WAV files
- Total render time: {elapsed_seconds:.1f} seconds ({elapsed_seconds/60:.2f} minutes)
- Per-sample average: {elapsed_seconds/352*1000:.0f} ms

## Output
- `samples/`: 352 WAV files at 24kHz mono
- `talking_keyboard.sfz`: 352 regions, A0-C8

## Acceptance test (manual, in sforzando)
- A0 quiet -> "A zero" in af_nova
- C4 mid (vel ~64) -> "C four" in af_heart
- F#5 vel ~80 -> "F sharp five" in bf_emma
- C8 loud -> "C eight" in am_michael
"""
    LOG_PATH.write_text(log)
    print(f"Wrote build log: {LOG_PATH}")


if __name__ == "__main__":
    print("=" * 60)
    print("Talking Keyboard - Phase 1 generator")
    print("=" * 60)
    test_mode = "--test" in sys.argv
    if test_mode:
        print("[TEST MODE] One note (A0) x 4 velocity layers")
        elapsed = generate_all(test_mode=True)
        print(f"Test render took {elapsed:.1f}s. Skipping SFZ + log.")
        print("Inspect samples/ for the four kokoro_A0_v1..4.wav files.")
    else:
        elapsed = generate_all(test_mode=False)
        write_sfz()
        write_log(elapsed)
    print("Done.")
