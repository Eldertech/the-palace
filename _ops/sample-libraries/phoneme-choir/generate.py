"""
Phoneme Choir — Phase 1.x build script for Generative Sample Libraries.

Generates 88 phonemes (MIDI A0..C8) x 4 velocity layers = 352 WAVs via
Kokoro-ONNX, runs each through onset detection (-45 dBFS, 2ms cushion),
writes offsets.json, then writes the master SFZ with offset= and 3ms
ampeg_attack on every region for snappy attack with no clicks.

Run with Loudon's existing TTS venv:
    /Users/loudonstearns/documents/TTS/.venv/bin/python \\
        "/Users/loudonstearns/Documents/The Palace/_ops/sample-libraries/phoneme-choir/generate.py"

Modes:
    --audition   render only phoneme #35 (brrrahh @ MIDI 55) x 4 voices = 4 files
    --full       render all 352, then write SFZ + log (default if no flag)
    --sfz-only   skip rendering, just (re)build SFZ from existing samples + offsets
"""

import json
import sys
import time
import datetime
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

# --- Paths (absolute) ---
BUILD_DIR = Path("/Users/loudonstearns/Documents/The Palace/_ops/sample-libraries/phoneme-choir")
SAMPLES_DIR = BUILD_DIR / "samples"
SFZ_PATH = BUILD_DIR / "phoneme_choir.sfz"
OFFSETS_PATH = BUILD_DIR / "offsets.json"
LOG_PATH = BUILD_DIR / "build-log.md"

MODEL_PATH = "/Users/loudonstearns/documents/TTS/kokoro-v1.0.onnx"
VOICES_PATH = "/Users/loudonstearns/documents/TTS/voices-v1.0.bin"

# --- Phoneme catalog: 88 percussive utterances mapped onto MIDI 21..108 ---
# Pivoted 2026-05-03 from mixed-character catalog after Kokoro proved unable
# to render trills (brrrrahh -> "be-ah-rah-rah-rah" syllabified). All entries
# now favor real words with sharp transients that Kokoro says cleanly.
# (slug, spoken_text)
PHONEMES = [
    # Pops & taps (12) — MIDI 21..32
    ("pop",   "pop"),
    ("tap",   "tap"),
    ("pat",   "pat"),
    ("tip",   "tip"),
    ("top",   "top"),
    ("dot",   "dot"),
    ("dap",   "dap"),
    ("dab",   "dab"),
    ("bop",   "bop"),
    ("bub",   "bub"),
    ("dub",   "dub"),
    ("nub",   "nub"),
    # Snaps & claps (8) — MIDI 33..40
    ("snap",  "snap"),
    ("clap",  "clap"),
    ("slap",  "slap"),
    ("flap",  "flap"),
    ("trap",  "trap"),
    ("clip",  "clip"),
    ("slip",  "slip"),
    ("snip",  "snip"),
    # Drips & plops (8) — MIDI 41..48
    ("drip",  "drip"),
    ("plop",  "plop"),
    ("blip",  "blip"),
    ("blop",  "blop"),
    ("plonk", "plonk"),
    ("plink", "plink"),
    ("plunk", "plunk"),
    ("clink", "clink"),
    # Clinks & clonks (8) — MIDI 49..56
    ("clank", "clank"),
    ("clonk", "clonk"),
    ("clunk", "clunk"),
    ("clock", "clock"),
    ("click", "click"),
    ("clack", "clack"),
    ("cluck", "cluck"),
    ("knock", "knock"),
    # Knocks & thunks (8) — MIDI 57..64
    ("thunk", "thunk"),
    ("tonk",  "tonk"),
    ("tock",  "tock"),
    ("tick",  "tick"),
    ("tank",  "tank"),
    ("dink",  "dink"),
    ("dong",  "dong"),
    ("ding",  "ding"),
    # Pings & pongs (8) — MIDI 65..72
    ("ping",  "ping"),
    ("pang",  "pang"),
    ("pong",  "pong"),
    ("bang",  "bang"),
    ("bong",  "bong"),
    ("bonk",  "bonk"),
    ("bunk",  "bunk"),
    ("boom",  "boom"),
    # Bangs & booms (8) — MIDI 73..80
    ("blam",  "blam"),
    ("wham",  "wham"),
    ("bash",  "bash"),
    ("crash", "crash"),
    ("smash", "smash"),
    ("zap",   "zap"),
    ("zip",   "zip"),
    ("zoom",  "zoom"),
    # Beatbox kit syllables (8) — MIDI 81..88
    ("dum",   "dum"),
    ("dom",   "dom"),
    ("tom",   "tom"),
    ("bim",   "bim"),
    ("bom",   "bom"),
    ("kim",   "kim"),
    ("kum",   "kum"),
    ("gum",   "gum"),
    # Short barks (8) — MIDI 89..96
    ("woof",  "woof"),
    ("ruff",  "ruff"),
    ("arf",   "arf"),
    ("yip",   "yip"),
    ("yap",   "yap"),
    ("bark",  "bark"),
    ("mew",   "mew"),
    ("peep",  "peep"),
    # Sharp utterances (12) — MIDI 97..108
    ("chirp", "chirp"),
    ("oink",  "oink"),
    ("ha",    "ha!"),
    ("ho",    "ho!"),
    ("hey",   "hey!"),
    ("yo",    "yo!"),
    ("hup",   "hup!"),
    ("hut",   "hut!"),
    ("ouch",  "ouch!"),
    ("eek",   "eek!"),
    ("tsk",   "tsk!"),
    ("tut",   "tut!"),
]
assert len(PHONEMES) == 88, f"Catalog must be 88 phonemes, got {len(PHONEMES)}"

MIDI_LOW = 21   # A0; PHONEMES[0] -> MIDI 21
MIDI_HIGH = 108 # C8; PHONEMES[87] -> MIDI 108

# --- Voice pool: 4 buckets x 3 voices = 12 voices total ---
VOICE_BUCKETS = {
    1: ["af_nova",    "af_sky",     "bf_isabella"],   # gentle / breathy
    2: ["af_heart",   "af_bella",   "bm_lewis"],      # warm
    3: ["bf_emma",    "bm_george",  "am_puck"],       # characterful / accent
    4: ["am_michael", "am_adam",    "am_fenrir"],     # bold
}

VELOCITY_LAYERS = [
    {"layer": 1, "lovel": 1,   "hivel": 32,  "char": "gentle / breathy"},
    {"layer": 2, "lovel": 33,  "hivel": 64,  "char": "warm"},
    {"layer": 3, "lovel": 65,  "hivel": 96,  "char": "characterful / accent"},
    {"layer": 4, "lovel": 97,  "hivel": 127, "char": "bold"},
]

# --- Onset detection params ---
# Threshold tightened from -45 to -30 dBFS so detection lands in the body of
# the sound, not the leading breath. Cushion flipped negative — we step 1 ms
# FORWARD past the detected onset rather than backing off. Combined effect:
# offset lands ~10-20 ms later in the file than the original conservative
# settings. The 3 ms fade-in still smooths the start.
ONSET_THRESHOLD_DB = -30.0
ONSET_WINDOW_MS = 5.0
CUSHION_MS = -1.0
AMPEG_ATTACK_S = 0.003   # 3 ms cosine fade-in to suppress click


# --- Helpers ---
def voice_for(midi: int, velocity_layer: int) -> str:
    """Select voice from bucket; cycle within bucket across notes."""
    note_idx = midi - MIDI_LOW
    bucket = VOICE_BUCKETS[velocity_layer]
    return bucket[note_idx % len(bucket)]


def slug_for(midi: int) -> str:
    return PHONEMES[midi - MIDI_LOW][0]


def text_for(midi: int) -> str:
    return PHONEMES[midi - MIDI_LOW][1]


def wav_filename(midi: int, velocity_layer: int) -> str:
    idx = midi - MIDI_LOW + 1
    voice = voice_for(midi, velocity_layer)
    return f"phon_{idx:03d}_{slug_for(midi)}_{voice}.wav"


def detect_onset_sample(audio: np.ndarray, sample_rate: int) -> int:
    """First sample where windowed RMS exceeds threshold.

    Returns 0 if entire file is below threshold (silent — shouldn't happen).
    """
    audio = np.asarray(audio, dtype=np.float64)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)

    window = max(1, int(sample_rate * ONSET_WINDOW_MS / 1000.0))
    threshold_amp = 10 ** (ONSET_THRESHOLD_DB / 20.0)

    sq = audio * audio
    # Cumulative sum trick for rolling RMS
    csum = np.concatenate([[0.0], np.cumsum(sq)])
    rms = np.sqrt((csum[window:] - csum[:-window]) / window)
    above = np.argmax(rms > threshold_amp)
    if above == 0 and rms[0] <= threshold_amp:
        return 0
    return int(above)


def offset_with_cushion(onset: int, sample_rate: int) -> int:
    """Apply CUSHION_MS to detected onset.
    Positive cushion = back off (start before onset).
    Negative cushion = step forward (start after onset, deeper into sound).
    """
    cushion_samples = int(sample_rate * CUSHION_MS / 1000.0)
    return max(0, onset - cushion_samples)


# --- Render driver ---
def render_files(midi_range, label: str):
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading Kokoro from {MODEL_PATH}...", flush=True)
    kokoro = Kokoro(MODEL_PATH, VOICES_PATH)
    print("Model loaded.", flush=True)

    offsets = {}
    if OFFSETS_PATH.exists():
        offsets = json.loads(OFFSETS_PATH.read_text())

    total = len(midi_range) * len(VELOCITY_LAYERS)
    done = 0
    start = time.time()

    for midi in midi_range:
        text = text_for(midi)
        for L in VELOCITY_LAYERS:
            wav_name = wav_filename(midi, L["layer"])
            wav_path = SAMPLES_DIR / wav_name
            voice = voice_for(midi, L["layer"])

            samples, sample_rate = kokoro.create(
                text, voice=voice, speed=1.0, lang="en-us",
            )
            sf.write(str(wav_path), samples, sample_rate)

            onset = detect_onset_sample(samples, sample_rate)
            offset = offset_with_cushion(onset, sample_rate)
            offsets[wav_name] = {
                "onset_sample": int(onset),
                "offset_sample": int(offset),
                "sample_rate": int(sample_rate),
                "total_samples": int(len(samples)),
            }

            done += 1
            if done <= 4 or done % 20 == 0 or done == total:
                elapsed = time.time() - start
                rate = done / elapsed if elapsed > 0 else 0
                eta = (total - done) / rate if rate > 0 else 0
                onset_ms = onset * 1000.0 / sample_rate
                print(
                    f"  [{done}/{total}] {wav_name}  "
                    f"onset={onset_ms:.0f}ms  "
                    f"({elapsed:.0f}s, eta {eta:.0f}s)",
                    flush=True,
                )

    OFFSETS_PATH.write_text(json.dumps(offsets, indent=2, sort_keys=True))
    elapsed = time.time() - start
    print(f"\n{label}: rendered {total} files in {elapsed:.1f}s "
          f"({elapsed/total*1000:.0f} ms/file).", flush=True)
    print(f"Offsets written to {OFFSETS_PATH}.", flush=True)
    return elapsed


# --- SFZ writer ---
def write_sfz():
    if not OFFSETS_PATH.exists():
        raise FileNotFoundError(f"{OFFSETS_PATH} missing — run render first.")
    offsets = json.loads(OFFSETS_PATH.read_text())

    lines = [
        "// Phoneme Choir — Phase 1.x of Generative Sample Libraries",
        "// 88 phonemes (MIDI 21..108) x 4 velocity layers = 352 regions",
        "// Source: Kokoro-ONNX TTS, voices-v1.0.bin",
        "//",
        "// Velocity layers (voice character):",
    ]
    for L in VELOCITY_LAYERS:
        lines.append(
            f"//   v{L['layer']} (vel {L['lovel']:>3}-{L['hivel']:>3}): "
            f"{L['char']}  -- voices: {', '.join(VOICE_BUCKETS[L['layer']])}"
        )
    lines.append("//")
    lines.append(f"// Onset trim: -{abs(ONSET_THRESHOLD_DB):.0f} dBFS, "
                 f"{CUSHION_MS:.0f} ms cushion. Fade-in: "
                 f"{AMPEG_ATTACK_S*1000:.0f} ms.")
    lines.append("")
    lines.append("<group>")
    lines.append(f"  ampeg_attack={AMPEG_ATTACK_S} ampeg_release=0.05")
    lines.append("")

    missing = []
    for midi in range(MIDI_LOW, MIDI_HIGH + 1):
        for L in VELOCITY_LAYERS:
            wav_name = wav_filename(midi, L["layer"])
            info = offsets.get(wav_name)
            if not info:
                missing.append(wav_name)
                continue
            lines.append(
                f"<region> sample=samples/{wav_name} "
                f"lokey={midi} hikey={midi} pitch_keycenter={midi} "
                f"lovel={L['lovel']} hivel={L['hivel']} "
                f"offset={info['offset_sample']}"
            )

    SFZ_PATH.write_text("\n".join(lines) + "\n")
    print(f"Wrote SFZ: {SFZ_PATH}")
    if missing:
        print(f"WARNING: {len(missing)} regions skipped (no offset entry):")
        for m in missing[:10]:
            print(f"  {m}")
        if len(missing) > 10:
            print(f"  ... and {len(missing)-10} more")


def write_log(elapsed_seconds: float):
    log = f"""# Phoneme Choir — Build Log

Built: {datetime.datetime.now().isoformat(timespec='seconds')}

## Stack
- kokoro-onnx from /Users/loudonstearns/documents/TTS/.venv
- Model: {MODEL_PATH}
- Voices: {VOICES_PATH}
- Sample rate: 24000 Hz, mono

## Pipeline
1. TTS render via Kokoro per (phoneme, voice).
2. Onset detection: first sample where {ONSET_WINDOW_MS:.0f} ms windowed RMS
   exceeds {ONSET_THRESHOLD_DB:.0f} dBFS.
3. SFZ `offset=` set to (onset - {CUSHION_MS:.0f} ms cushion).
4. Every region gets `ampeg_attack={AMPEG_ATTACK_S}` (cosine fade-in)
   to suppress the mid-waveform start click.

## Counts
- 88 phonemes x 4 velocity layers = 352 WAV files
- Total render time: {elapsed_seconds:.1f} s ({elapsed_seconds/60:.2f} min)
- Per-sample average: {elapsed_seconds/352*1000:.0f} ms

## Output
- `samples/`: 352 WAV files at 24 kHz mono
- `offsets.json`: per-file onset / offset / sample-rate metadata
- `phoneme_choir.sfz`: 352 regions with offset= and ampeg_attack
"""
    LOG_PATH.write_text(log)
    print(f"Wrote build log: {LOG_PATH}")


# --- Main ---
if __name__ == "__main__":
    print("=" * 60)
    print("Phoneme Choir generator")
    print("=" * 60)

    if "--sfz-only" in sys.argv:
        write_sfz()
        sys.exit(0)

    if "--audition" in sys.argv:
        # "knock" -> MIDI 56 (G#3); sharp K transient = great test for
        # both onset detection and click suppression on a percussive source.
        audition_midi = 56
        assert slug_for(audition_midi) == "knock", \
            f"audition slot moved: MIDI 56 = {slug_for(audition_midi)}"
        print(f"[AUDITION] MIDI {audition_midi} = {slug_for(audition_midi)} "
              f"x {len(VELOCITY_LAYERS)} velocity-voices")
        elapsed = render_files([audition_midi], "AUDITION")
        print(f"\nInspect samples/ for the 4 phon_036_knock_*.wav files.")
        print("Listen, then approve before --full.")
        sys.exit(0)

    # Default: full render + SFZ + log
    elapsed = render_files(range(MIDI_LOW, MIDI_HIGH + 1), "FULL")
    write_sfz()
    write_log(elapsed)
    print("Done.")
