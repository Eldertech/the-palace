# Phoneme Choir — Build Log

Built: 2026-05-03T22:10:10

## Stack
- kokoro-onnx from /Users/loudonstearns/documents/TTS/.venv
- Model: /Users/loudonstearns/documents/TTS/kokoro-v1.0.onnx
- Voices: /Users/loudonstearns/documents/TTS/voices-v1.0.bin
- Sample rate: 24000 Hz, mono

## Pipeline
1. TTS render via Kokoro per (phoneme, voice).
2. Onset detection: first sample where 5 ms windowed RMS
   exceeds -30 dBFS.
3. SFZ `offset=` set to (onset - -1 ms cushion).
4. Every region gets `ampeg_attack=0.003` (cosine fade-in)
   to suppress the mid-waveform start click.

## Counts
- 88 phonemes x 4 velocity layers = 352 WAV files
- Total render time: 84.4 s (1.41 min)
- Per-sample average: 240 ms

## Output
- `samples/`: 352 WAV files at 24 kHz mono
- `offsets.json`: per-file onset / offset / sample-rate metadata
- `phoneme_choir.sfz`: 352 regions with offset= and ampeg_attack
