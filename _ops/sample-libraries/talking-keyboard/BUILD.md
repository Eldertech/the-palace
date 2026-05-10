# Talking Keyboard — Phase 1 Build Brief

This is the build contract for Phase 1 of [[Generative Sample Libraries]] — a working SFZ multisample of spoken note names rendered via Kokoro TTS. Read this file and the **Phase 1 — End-to-End MVP** section of `Projects/Generative Sample Libraries.md` end to end before starting.

## Outcome

A loadable SFZ instrument: pressing any piano-range key plays a Kokoro voice speaking that note's name. Velocity selects which voice speaks. Drag the `.sfz` into sforzando, play the keyboard, hear the notes speak.

## Decisions (already made in the Cowork interview, 2026-05-02 — do not re-litigate)

| Parameter | Value |
|---|---|
| MIDI range | Piano: A0–C8 (MIDI 21–108), 88 notes |
| Velocity layers | 4 |
| Pronunciation form | "Note + octave" — e.g., `C4` says "C four", `C#4` says "C sharp four" |
| Sharps vs flats | Sharps (say "C sharp four", never "D flat four") |
| Library name | Talking Keyboard |
| Audio source | Kokoro TTS, running locally on macOS |

### Voice assignment

| Velocity layer | MIDI velocity range | Kokoro voice | Character |
|---|---|---|---|
| 1 (pp) | 1–32 | `af_nova` | Gentle American female |
| 2 (mp) | 33–64 | `af_heart` | Warmer American female |
| 3 (mf) | 65–96 | `bf_emma` | British female |
| 4 (ff) | 97–127 | `am_michael` | Bold American male |

If a chosen voice ID doesn't exist in the installed Kokoro version, substitute the closest-character available voice and note it in `build-log.md`. The contrast pp→ff (gentle female → bold male, with British female crossing the middle) is the load-bearing aesthetic — preserve that even if individual voice IDs change.

## File layout

```
_ops/sample-libraries/talking-keyboard/
├── BUILD.md                ← this file
├── generate.py             ← Python build script (you write this)
├── talking_keyboard.sfz    ← output SFZ (you write this)
├── samples/                ← output WAVs (352 files)
│   ├── kokoro_A0_v1.wav
│   ├── kokoro_A0_v2.wav
│   ├── ...
│   └── kokoro_C8_v4.wav
└── build-log.md            ← what got built, any substitutions, time taken
```

352 WAV files total (88 notes × 4 velocity layers).

## Filename convention

Each WAV is `kokoro_<NoteName>_v<Layer>.wav` where:

- **`<NoteName>`**: uppercase letter + lowercase `s` for sharp + octave digit. Sharps only (no flats). Filename-safe.
  - Sequence: `A0, As0, B0, C1, Cs1, D1, Ds1, E1, F1, Fs1, G1, Gs1, A1, As1, B1, C2, ...` ending at `C8`
  - Examples: `A0`, `As0`, `B0`, `C1`, `Cs4` (= C#4), `Ds5` (= D#5)
- **`<Layer>`**: `1` (pp) through `4` (ff)

Examples:
- `kokoro_A0_v1.wav` — A0 spoken by `af_nova`
- `kokoro_Cs4_v4.wav` — C#4 (= MIDI 61) spoken by `am_michael`
- `kokoro_C8_v2.wav` — C8 (= MIDI 108) spoken by `af_heart`

## Spoken text per note

The string passed to Kokoro for `Cs4` is `"C sharp four"`. For `A0` it's `"A zero"`. For `B7` it's `"B seven"`. Always:

- Note letter spelled as the letter (no phonetic spelling)
- Sharp spoken as the word "sharp"
- Octave spoken as English number: zero, one, two, three, four, five, six, seven, eight

Octave numbering follows MIDI standard:
- C-1 = MIDI 0, C0 = MIDI 12, C1 = MIDI 24, C2 = MIDI 36, **C4 = MIDI 60 (middle C)**, C5 = MIDI 72, C6 = MIDI 84, C7 = MIDI 96, **C8 = MIDI 108 (highest note in our range)**
- A0 = MIDI 21 is our lowest

## Tech stack (uses Loudon's existing setup at `/Users/loudonstearns/documents/TTS/`)

- **Python**: TTS venv at `/Users/loudonstearns/documents/TTS/.venv/` (Python ≥3.12)
- **Kokoro**: `kokoro-onnx>=0.5.0` (already installed in TTS venv) — note this is the **ONNX variant**, not the `kokoro` PyPI package; different API
- **Model files (referenced, not copied)**:
  - `/Users/loudonstearns/documents/TTS/kokoro-v1.0.onnx` (~325 MB)
  - `/Users/loudonstearns/documents/TTS/voices-v1.0.bin` (~28 MB, 54 voices including the four we need)
- **WAV writing**: `soundfile` (already in TTS venv)
- **Sample rate**: 24000 Hz, mono (Kokoro-ONNX's native output)
- **Bit depth**: whatever soundfile defaults to from float32 input. Sforzando reads it.

**API pattern** (from `hello.py`):
```python
from kokoro_onnx import Kokoro
import soundfile as sf
kokoro = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
samples, sample_rate = kokoro.create(text, voice="af_nova", speed=1.0, lang="en-us")
sf.write("out.wav", samples, sample_rate)
```

**Invocation** (from anywhere):
```
/Users/loudonstearns/documents/TTS/.venv/bin/python \
    "/Users/loudonstearns/Documents/The Palace/_ops/sample-libraries/talking-keyboard/generate.py"
```

Add `--test` to render only the first note × 4 layers (smoke test).

## SFZ structure

Plain text. One `<region>` per (note × velocity layer). Example region:

```
<region> sample=samples/kokoro_C4_v3.wav lokey=60 hikey=60 pitch_keycenter=60 lovel=65 hivel=96
```

Rules per region:
- `lokey=hikey=<midi_note>` — exact-note assignment, no pitch-shifting across the keyboard
- `pitch_keycenter=<midi_note>` — disables sample retuning by sforzando
- `lovel/hivel` — velocity layer split (1–32, 33–64, 65–96, 97–127)
- **No** `loop_mode` — these are one-shots
- **No** `ampeg_*` envelope opcodes — let the sample play full natural envelope
- **No** `volume` — let MIDI velocity drive amplitude via sforzando's default behavior

A single `<group>` wrapping all regions is fine but optional. 352 regions total.

## Acceptance test

Drop `talking_keyboard.sfz` into sforzando. Play these specific test cases:

| Test | Expected |
|---|---|
| A0, low velocity (~16) | Hear "A zero" in `af_nova`'s voice |
| A0, max velocity (127) | Hear "A zero" in `am_michael`'s voice |
| C4, mid velocity (~64) | Hear "C four" in `af_heart`'s voice |
| F#5, vel 80 | Hear "F sharp five" in `bf_emma`'s voice |
| C8, vel 100 | Hear "C eight" in `am_michael`'s voice |

If any note is silent, mismapped, or speaks the wrong name → bug. Fix before declaring Phase 1 complete.

## Build log expectations

Append `build-log.md` capturing:
- Python and Kokoro versions used
- Whether `espeak-ng` install was needed
- Time taken for full batch render
- Any voice ID substitutions and why
- Any errors encountered and resolutions
- File size of `samples/` directory (sanity check: ~15–30 MB total)

## Stop conditions

Pause and write a stop-report (in `build-log.md`) and stop execution if:
- Kokoro install fails on Homebrew Python 3.11 and 3.12
- A voice ID can't be resolved and no clear substitute exists
- Sample render times out repeatedly on a specific note
- Architecture ambiguity emerges (something this brief doesn't say)

Otherwise: run to completion, write `build-log.md` with the final summary, and stop.

## State at handoff (2026-05-02, Cowork → Claude Code)

The Cowork session set everything up but handed off the long-running render to Claude Code (osascript adds per-call overhead unsuitable for ~2 min batch jobs). What's already verified:

- Build directory created
- `generate.py` written
- `--test` mode run successfully: 4 valid WAVs (kokoro_A0_v1..4.wav) in `samples/`, 1.3 seconds total. Output format confirmed: 16-bit PCM WAV, 24000 Hz mono.
- All four required voices (af_nova, af_heart, bf_emma, am_michael) present in `voices-v1.0.bin`

What remains:

- Run the full batch (no `--test` flag): renders 352 WAVs, writes `talking_keyboard.sfz`, writes `build-log.md`. Expected ~2 minutes based on test rate (0.33s/file).
- Verify: 352 files in `samples/`, valid SFZ structure, build-log written.
- Hand back to Loudon for sforzando smoke test.

## Sister context

The body of `Projects/Generative Sample Libraries.md` contains the project-level Phase 1 description and the broader pipeline. The interview that produced these decisions happened in a Cowork session on 2026-05-02.

When Phase 1 ships, the next move (Phase 2 — codifying the Interview as a real skill) returns to Cowork.
