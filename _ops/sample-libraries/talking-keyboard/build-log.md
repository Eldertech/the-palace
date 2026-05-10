# Talking Keyboard — Build Log

Built: 2026-05-02T23:28:01

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
- Total render time: 227.0 seconds (3.78 minutes)
- Per-sample average: 645 ms

## Output
- `samples/`: 352 WAV files at 24kHz mono
- `talking_keyboard.sfz`: 352 regions, A0-C8

## Acceptance test (manual, in sforzando)
- A0 quiet -> "A zero" in af_nova
- C4 mid (vel ~64) -> "C four" in af_heart
- F#5 vel ~80 -> "F sharp five" in bf_emma
- C8 loud -> "C eight" in am_michael

## Fix 2026-05-03: "A" pronunciation (two passes)
Initial render had Kokoro reading the letter "A" as the schwa "uh"
(indefinite-article form) instead of the long-A diphthong /eɪ/.

Pass 1: Patched NOTE_SPOKEN with "ay" / "ay sharp". Result: Kokoro
produced /aɪ/ ("eye" / "aye, captain") — wrong diphthong.

Pass 2: Patched NOTE_SPOKEN with "eigh" / "eigh sharp" — the "eight"
pattern minus the t. This reliably triggers /eɪ/ in Kokoro's G2P.
Picked from a 7-candidate audition (ate, ace, eigh, aye, ey, A., ay)
where "eigh" landed cleanest.
Re-rendered the 64 A0-A7 and As0-As7 files (x4 layers) in 20.8s.
Other letters parse correctly as-is and were not touched.
