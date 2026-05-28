#!/usr/bin/env python3
"""
Shepard Instrument — Phase 3 source-two build script for Generative Sample Libraries.

This is the SECOND non-Kokoro source adapter (after Crystal Hexagonal). It is a
SKELETON, written for cycle 13 of the GSL steward against the
TWELVE-DRONES grant on gsl-steward-023 and the SHEPARD-DRIVES grant on
gsl-steward-020.

What is settled (granted)
-------------------------
- Stage 1 of the Shepard Tone Synthesizer = MINIMUM-ILLUSION: a static drone,
  one pitch class, 7 octaves stacked, fixed Gaussian envelope in log-frequency
  space, NO motion of any kind. This is the simplest possible Shepard tone.
- Source-two work split: SHEPARD-DRIVES. The Shepard Tone Synthesizer steward
  ships `shepard_synth.py` (canonical synthesis); GSL writes this thin adapter
  on top, mirroring the Crystal pattern (import the module unedited, drive its
  parameters per MIDI note).
- Sampling shape: TWELVE-DRONES. We render twelve static drones — one per
  chromatic pitch class C..B — and the SFZ maps each MIDI note 0..127 to the
  drone of its pitch class. Twelve files, full keyboard coverage. The drone
  itself is a 7-octave stack: the note name names the pitch class, the actual
  audio always contains a 7-octave Gaussian-enveloped Shepard cloud.

What is NOT yet on disk (the extension point this skeleton waits on)
--------------------------------------------------------------------
At the time of writing, `/Users/loudonstearns/Documents/The Palace/Shepard
Tone Synthesizer/shepard_synth.py` does NOT exist. Shepard's steward is
running in the same batch and will ship it in a subsequent cycle. This
skeleton is therefore unrunnable today on purpose — it fails fast and
loudly at the `load_shepard_synth()` step, with a message pointing at the
Shepard steward as the upstream blocker.

The interface this adapter expects (the contract Shepard ships against)
-----------------------------------------------------------------------
A single function:

    shepard_synth.synthesize_drone(
        pitch_class: int,       # 0..11, where 0=C, 1=C#, ..., 11=B
        duration: float,        # seconds (we will pass DRONE_DURATION)
        sample_rate: int,       # we will pass SAMPLE_RATE (44100)
        n_octaves: int = 7,     # the 7-octave stack (Stage 1 spec)
        center_octave: float = 4.0,  # log-frequency centroid in octave units
                                # (4.0 = around C4 = 261.6 Hz at pitch_class=0)
        envelope: str = "gaussian",  # Stage 1 fixes Gaussian; passed for clarity
        sigma_octaves: float = 1.5,  # Gaussian width in octaves; Stage 1 default
    ) -> numpy.ndarray  # mono float32 audio, length = int(duration * sample_rate)

If Shepard ships a different surface (different keyword args, different
return shape, an oscillator class instead of a function), this adapter
will need a small edit at `_call_shepard()` — exactly one function — and
nothing else changes. That is the point of isolating the call here.

Filename convention (matches crystal-instrument)
------------------------------------------------
    shepard_<PitchClass>.wav      e.g. shepard_C.wav, shepard_Cs.wav, shepard_Eb.wav

Twelve files total; pitch classes use sharp spelling by default
(C, Cs, D, Ds, E, F, Fs, G, Gs, A, As, B) to keep filenames POSIX-clean.
The interview's filename rule (no `#` in filenames) applies.

SFZ mapping
-----------
Because every MIDI note in a pitch class plays the same recording (the
drone IS the 7-octave stack; it doesn't move), we use SFZ `pitch_keytrack=0`
and place 11 regions per pitch class — one for each MIDI note that belongs
to that class across the keyboard. For pitch class C (0): MIDI notes 0,12,
24,36,48,60,72,84,96,108,120 all map to shepard_C.wav, each region's
pitch_keycenter set to the note itself so the sample plays at its recorded
pitch with no pitch-shift. Across 12 classes that is 132 regions for full
0..127 coverage with a few notes (124..127 are pitch class C# through D#)
also covered by their class.

Run (once shepard_synth.py exists)
----------------------------------
    python3 "/Users/loudonstearns/Documents/The Palace/Projects/Generative Sample Libraries/shepard-instrument/generate.py"
"""

import os
import sys
import json
import datetime
from pathlib import Path
import importlib.util

import numpy as np
from scipy.io import wavfile


# ── Paths (absolute) ──────────────────────────────────────────────────
PALACE_ROOT = Path(os.environ.get("PALACE_ROOT", "/Users/loudonstearns/Documents/The Palace"))
BUILD_DIR = PALACE_ROOT / "Projects" / "Generative Sample Libraries" / "shepard-instrument"
SAMPLES_DIR = BUILD_DIR / "samples"
SFZ_PATH = BUILD_DIR / "shepard_instrument.sfz"
OFFSETS_PATH = BUILD_DIR / "offsets.json"
LOG_PATH = BUILD_DIR / "build-log.md"

# Shepard's deliverable. Two candidate homes — Shepard's steward picks one.
# The adapter probes both at load time and uses whichever exists.
SHEPARD_SYNTH_CANDIDATES = [
    PALACE_ROOT / "Shepard Tone Synthesizer" / "shepard_synth.py",
    PALACE_ROOT / "Projects" / "Shepard Tone Synthesizer" / "shepard_synth.py",
]

SAMPLE_RATE = 44100
DRONE_DURATION = 6.0  # seconds; longer than crystal because there's no decay

# ── Stage 1 (MINIMUM-ILLUSION) drone params ───────────────────────────
# These describe what Shepard's convenience wrapper produces. Cycle 13 calls
# render_pitch_class_drone() and lets Shepard's defaults stand — sigma=1.0
# octave, centroid at C4 (log2 ~= 8.03), 7-octave stack C1..C7. The constants
# below are FOR DOCUMENTATION ONLY (used in SFZ comments + build log); they
# are NOT passed through to Shepard. If a future cycle wants to override
# them, switch _call_shepard() to call render_stage1() directly.
N_OCTAVES = 7                  # 7-octave stack (Shepard's DEFAULT_OCTAVES)
ENVELOPE = "gaussian"          # fixed Gaussian (Stage 1 spec)
CENTER_OCTAVE = "C4"           # spectral centroid (Shepard's DEFAULT_CENTROID_LOG2HZ ~= log2(C4))
SIGMA_OCTAVES = 1.0            # Gaussian width in octaves (Shepard's DEFAULT_SIGMA_OCTAVES)

# ── Pitch-class table (sharps spelling; filename-clean) ───────────────
# Index = pitch class 0..11; element = (name, filename_token)
PITCH_CLASSES = [
    ( "C",  "C"),
    ("C#",  "Cs"),
    ( "D",  "D"),
    ("D#",  "Ds"),
    ( "E",  "E"),
    ( "F",  "F"),
    ("F#",  "Fs"),
    ( "G",  "G"),
    ("G#",  "Gs"),
    ( "A",  "A"),
    ("A#",  "As"),
    ( "B",  "B"),
]

# ── Onset/fade params (re-used from Phoneme Choir / Crystal) ──────────
# Shepard drones start with no transient (the envelope is steady-state in
# Stage 1), so onset detection will land near sample 0 every time. The 3 ms
# fade still suppresses any DC-edge click from the synthesis. Both fields are
# kept for parity with the crystal SFZ; they may become inert here.
ONSET_THRESHOLD_DB = -30.0
ONSET_WINDOW_MS = 5.0
CUSHION_MS = 0.0
AMPEG_ATTACK_S = 0.003
AMPEG_RELEASE_S = 0.20  # gentle release; the drone IS the note
LOOP_FALLBACK = True    # SFZ loop_mode=loop_continuous so the drone sustains


# ── Shepard module loader (the only place that depends on shepard_synth) ──
def load_shepard_synth():
    """Import shepard_synth.py from one of the candidate homes. Fail fast and
    explicitly if no candidate exists yet — this skeleton is meant to error
    cleanly in that state until the Shepard steward ships the module."""
    found = None
    for path in SHEPARD_SYNTH_CANDIDATES:
        if path.exists():
            found = path
            break
    if found is None:
        msg = (
            "shepard_synth.py not found yet. Searched:\n"
            + "\n".join(f"  - {p}" for p in SHEPARD_SYNTH_CANDIDATES)
            + "\n\nThis skeleton waits on the Shepard Tone Synthesizer steward "
              "to ship shepard_synth.py (Stage 1 = MINIMUM-ILLUSION). Cycle 13 "
              "of the GSL steward wrote everything around this call; once "
              "shepard_synth.synthesize_drone(pitch_class, duration, "
              "sample_rate, ...) exists, this script will render twelve drones "
              "and a 132-region SFZ in one pass."
        )
        raise FileNotFoundError(msg)
    spec = importlib.util.spec_from_file_location("shepard_synth", found)
    mod = importlib.util.module_from_spec(spec)
    # Python 3.14: register in sys.modules BEFORE exec — @dataclass(frozen=True)
    # at module top level fails otherwise (cls.__module__ lookup returns None).
    sys.modules["shepard_synth"] = mod
    spec.loader.exec_module(mod)
    return mod, found


def _call_shepard(mod, pitch_class: int) -> np.ndarray:
    """The single dependency point. Adjust ONLY this function if Shepard ships
    a surface different from the expected one (see module docstring).

    Shepard cycle 3 (2026-05-27) actually shipped a convenience wrapper
    written explicitly 'for the GSL steward (per the SHEPARD-DRIVES grant)':
        render_pitch_class_drone(pitch_class, duration_s, sample_rate) -> np.ndarray
    The full parameter surface is on `ShepardStage1Params` / `render_stage1`,
    so cycle 13 calls the convenience function and leaves the envelope
    defaults (centroid at C4, sigma=1.0 octave, 7-octave C1..C7 stack) at
    Shepard's chosen Stage-1 values. If a later cycle wants to revise
    sigma or centroid from the GSL side, replace this body with a direct
    `render_stage1(ShepardStage1Params(...))` call.
    """
    return mod.render_pitch_class_drone(
        pitch_class=pitch_class,
        duration_s=DRONE_DURATION,
        sample_rate=SAMPLE_RATE,
    )


# ── Onset trim (parity with crystal/phoneme-choir) ────────────────────
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


def save_wav(path, audio, sr=SAMPLE_RATE):
    wavfile.write(str(path), sr, (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16))


# ── Main render ───────────────────────────────────────────────────────
def main():
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    mod, source_path = load_shepard_synth()

    print("=" * 60)
    print("Shepard Instrument generator — Stage 1 MINIMUM-ILLUSION")
    print(f"Source: {source_path} (imported, unedited)")
    print(f"Twelve drones, {N_OCTAVES}-octave Gaussian stacks, "
          f"sigma={SIGMA_OCTAVES} oct, centered at {CENTER_OCTAVE} (Shepard defaults)")
    print("=" * 60)

    offsets = {}
    for pc, (name, tok) in enumerate(PITCH_CLASSES):
        audio = _call_shepard(mod, pc)
        wav_name = f"shepard_{tok}.wav"
        wav_path = SAMPLES_DIR / wav_name
        save_wav(wav_path, audio)

        onset = detect_onset_sample(audio, SAMPLE_RATE)
        offset = offset_with_cushion(onset, SAMPLE_RATE)

        offsets[wav_name] = {
            "pitch_class": pc,
            "name": name,
            "duration_s": DRONE_DURATION,
            "sample_rate": SAMPLE_RATE,
            "total_samples": int(len(audio)),
            "onset_sample": int(onset),
            "offset_sample": int(offset),
        }
        print(f"  {wav_name:18s} pc={pc:2d} ({name:2s})  "
              f"len={len(audio)/SAMPLE_RATE:.2f}s  onset={onset*1000.0/SAMPLE_RATE:.0f}ms")

    OFFSETS_PATH.write_text(json.dumps(offsets, indent=2, sort_keys=True))
    write_sfz(offsets)
    write_log(offsets, source_path)
    print(f"\n  Output: {SAMPLES_DIR}")
    print("Done.")


def write_sfz(offsets):
    """Map every MIDI note 0..127 to its pitch-class drone. pitch_keytrack=0
    so the sample plays at its recorded pitch; pitch_keycenter equals the
    MIDI note (so any future per-region pitch shift would be a no-op against
    its own center).
    """
    lines = [
        "// Shepard Instrument — Phase 3 source-two of Generative Sample Libraries",
        "// Stage 1 MINIMUM-ILLUSION: 12 static drones, one per pitch class.",
        "// Each MIDI note 0..127 maps to the drone of its pitch class.",
        f"// Every recording is a {N_OCTAVES}-octave Gaussian-enveloped stack",
        f"// (sigma={SIGMA_OCTAVES} oct, centered at {CENTER_OCTAVE}; Shepard's Stage-1 defaults).",
        "// Source: shepard_synth.py from the Shepard Tone Synthesizer page.",
        "//",
        "// NB: pitch_keytrack=0 — the drone IS the note's pitch class; we do not",
        "// transpose the sample across the keyboard. Loop continuous so the",
        "// drone sustains as long as the key is held.",
        "",
        "<control>",
        "default_path=samples/",
        "",
        "<global>",
        ("loop_mode=loop_continuous" if LOOP_FALLBACK else "loop_mode=one_shot"),
        "pitch_keytrack=0",
        f"ampeg_attack={AMPEG_ATTACK_S} ampeg_release={AMPEG_RELEASE_S}",
        "amp_veltrack=0",
        "",
    ]
    # one <group> per pitch class, with one <region> per MIDI note in that class
    for pc, (name, tok) in enumerate(PITCH_CLASSES):
        wav_name = f"shepard_{tok}.wav"
        info = offsets[wav_name]
        lines.append(f"// Pitch class {name} (pc={pc}): {wav_name}")
        lines.append("<group>")
        midi_notes = [n for n in range(0, 128) if n % 12 == pc]
        for midi in midi_notes:
            lines.append(
                f"<region> sample={wav_name} "
                f"lokey={midi} hikey={midi} pitch_keycenter={midi} "
                f"offset={info['offset_sample']}"
            )
        lines.append("")
    SFZ_PATH.write_text("\n".join(lines) + "\n")
    print(f"Wrote SFZ: {SFZ_PATH}")


def write_log(offsets, source_path):
    rows = "\n".join(
        f"| {v['name']} | {v['pitch_class']} | {k} | {v['onset_sample']} | "
        f"{v['offset_sample']} |"
        for k, v in sorted(offsets.items(), key=lambda kv: kv[1]['pitch_class'])
    )
    log = f"""# Shepard Instrument — Build Log (Phase 3 source-two)

Built: {datetime.datetime.now().isoformat(timespec='seconds')}

## What this proves
Phase 3 source-two for GSL — the Interview pipeline now runs against a
SECOND non-Kokoro source: the Shepard Tone Synthesizer's MINIMUM-ILLUSION
Stage 1. Demonstrates GSL-as-adapter against an external palace
synthesizer module written by a sibling steward (the SHEPARD-DRIVES split).

## Source adapter
- `shepard_synth.py` imported via importlib from `{source_path}`; not modified.
- Single call surface: `render_pitch_class_drone(pitch_class, duration_s,
  sample_rate)` — Shepard's convenience wrapper written for the GSL adapter
  per the SHEPARD-DRIVES grant. Full parameter access via
  `render_stage1(ShepardStage1Params(...))` if a future cycle needs it.
- Stage 1 parameters: Shepard's Stage-1 defaults — 7-octave Gaussian stack
  (C1..C7), sigma={SIGMA_OCTAVES} oct, centroid at {CENTER_OCTAVE}. No motion.

## Sample library shape (TWELVE-DRONES grant)
- 12 WAVs (one per chromatic pitch class C..B), {DRONE_DURATION} s each, {SAMPLE_RATE} Hz mono.
- Filename convention: `shepard_<PitchClass>.wav` with sharps as `s` (Cs, Ds, ...).
- SFZ maps every MIDI note 0..127 to the drone of its pitch class (132 regions).
- `pitch_keytrack=0` and `loop_mode=loop_continuous` so the drone sustains.

## Reused from Phoneme Choir / Crystal
- Onset detection ({ONSET_WINDOW_MS:.0f} ms windowed RMS > {ONSET_THRESHOLD_DB:.0f} dBFS),
  SFZ `offset=`, {AMPEG_ATTACK_S*1000:.0f} ms ampeg_attack fade-in.
  (Likely inert for steady-state drones; kept for pipeline parity.)

## Files
| Name | Pitch class | Filename | onset_sample | offset_sample |
|---|---|---|---|---|
{rows}

## What a human still has to judge (the audition gate)
The 12 drones MUST be auditioned before any cross-keyboard playback. Two
questions only the ear can answer for a Stage 1 drone:
1. Does the 7-octave Gaussian stack sound coherent — one tone, not seven?
2. Are the pitch-class identities clear when adjacent classes are played?

The full 132-region SFZ ships in the same pass because there is no per-note
rendering — the audition unit IS the full library. There is only one batch.
"""
    LOG_PATH.write_text(log)
    print(f"Wrote build log: {LOG_PATH}")


if __name__ == "__main__":
    main()
