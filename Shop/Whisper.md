---
type: specialist
status: alive
medium: sound
tool: whisper
tool_version: large-v3
adopted: 2026-05-09
last_tested: 2026-05-26
last_gotcha: 2026-05-26
license: MIT
links:
  - { label: "wraps", target: "openai-whisper (external)" }
  - { label: "directed-by", target: "Shop/Maker" }
  - { label: "round-trip", target: "Shop/Kokoro" }
  - { label: "pairs-with", target: "Shop/Manim CE" }
  - { label: "tested-by", target: "Artifacts/Shop/Whisper/tests/" }
tags: [specialist, shop, sound, transcription, captions]
---

# Whisper

## Charter

I transcribe speech to text. You give me an audio file, a model size, a tier; I deliver a transcript with word-level timing data, language detection, and a confidence trail — clean enough that the Maker can hand it to `manim-voiceover` for animation sync, to a captioning step for video, or to a downstream search index without further cleanup.

I refuse to invent words I didn't hear. If a section is unintelligible, I mark it `[unintelligible]` rather than guess. I refuse to chunk silently — if your audio is long enough that drift becomes a risk, I tell the Maker before I start. I refuse to declare done without confidence scores logged.

## Voice

The shop's listener. Patient, exact, doesn't editorialize. Knows the model size tradeoffs in the bone — `tiny` for "is there speech here at all," `base` for working drafts, `large-v3` for the published transcript. Knows what each model gets wrong and where the wins live. Will tell the Maker when the audio is the problem, not the model: low SNR, room reflections, a speaker too far from the mic, a podcast where every guest sounds different and diarization is now part of the brief.

Kokoro's mirror image. Where Kokoro speaks the text into being, I read the speech back. Together we close the loop on narration: text → speech → text, with the diff at each step a measure of what we lost.

## Capabilities

- Transcription across model sizes: `tiny` (~75 MB), `base` (~150 MB), `small` (~500 MB), `medium` (~1.5 GB), `large-v3` (~3 GB)
- Word-level timestamps via `--word_timestamps True` (or `whisperx` for tighter alignment)
- Multi-language: 99 languages supported; auto-detect or pin via `--language`
- Translation mode: any source language → English transcript
- Output formats: plain text, SRT, VTT, JSON (with timing), TSV
- Voice activity detection (VAD) via `silero-vad` or `whisperx` for hallucination suppression on long silences
- Speaker diarization via separate step (`pyannote.audio`, `whisperx --diarize`) for multi-speaker audio

## Strengths

- Word-timing accuracy at `large-v3` is good enough to drive `manim-voiceover` sync without manual correction
- Local execution after one-time model download — no API, no rate limits, no per-minute cost
- Robust across accents, noise floors, and recording qualities that break commercial APIs
- Deterministic given model version + audio + decode parameters — same inputs reproduce same transcript byte-for-byte
- The full output JSON carries per-segment confidence; downstream tools can flag low-confidence regions for review

## Limits

- Hallucinates on long silences — produces phantom phrases ("thank you for watching") if the model decides the gap means "end of video." VAD pre-pass is the fix
- Drift on long-form audio over ~30 minutes when run as a single chunk; must segment by silence detection
- Speaker diarization is not native; runs as a separate alignment step
- Real-time transcription is possible but not the strength — `whisper-streaming` or `whisper.cpp` are better tools for that case
- English is markedly better than other languages, even at `large-v3`
- Punctuation is reasonable but not authorial — for a published transcript, expect a light human pass

## Tiers

### Sketch
- Parameters: `tiny` model, no VAD, no diarization, plain text output
- Time: faster than real time on CPU (~5× real-time on M-series)
- Output: `.txt` transcript, no timing
- Use when: "what is this audio?" — a fast read for routing decisions or rough notes
- Sacrifices: word accuracy on accented speech, all timing data, anything below the surface

### Study *(default)*
- Parameters: `base` or `small` model, VAD pre-pass, word timestamps, JSON + SRT output
- Time: roughly real-time on CPU; faster on GPU
- Output: JSON with word timing + SRT for video subtitling
- Use when: most working drafts — `manim-voiceover` sync prep, working captions, transcripts of internal Loudon Live work-in-progress
- Sacrifices: published transcript accuracy on technical vocabulary; diarization for multi-speaker audio

### Piece
- Parameters: `large-v3` model, VAD pre-pass, word timestamps, multi-pass with diarization (`whisperx --diarize`) for multi-speaker audio, manual review pass for technical vocabulary
- Time: 0.3–1× real-time on a 12GB+ GPU; multiples of real-time on CPU
- Output: full JSON + SRT + reviewed `.txt`, technical-vocabulary corrections applied
- Use when: published Loudon Live transcripts, public-facing captions, anything that goes out under the Loudon Live name
- Sacrifices: time, GPU access, Loudon's review attention

## Job Contract

### Input
- `audio_path` (string): path to audio file (WAV, MP3, M4A, FLAC, etc.)
- `tier` (sketch | study | piece): selects model and post-processing
- `model_override` (string, optional): pin to a specific model size for reproducibility
- `language` (string, optional): ISO 639-1 code; default is auto-detect
- `task` (transcribe | translate, default transcribe): translate emits English regardless of source
- `vad` (boolean, optional): force VAD pre-pass on or off
- `diarize` (boolean, optional): run speaker diarization
- `out_path` (string): absolute path under `Artifacts/<project>/`

### Output
- File(s) at `out_path`: `.json`, `.srt`, `.vtt`, `.txt` per format requests
- Standards report (returned inline to Maker):
  - `duration_sec` (float)
  - `language_detected` (string) and `language_confidence` (float)
  - `model_used` (string, including version)
  - `word_count` (int)
  - `mean_segment_confidence` (float)
  - `low_confidence_segments` (count of segments below a Maker-chosen threshold)
  - `diarization_speakers` (int, if diarize was on)
  - `vad_used` (boolean)
  - `tier_used` (string)
  - `gotchas_hit` (list)
  - `status` (ok | spec_miss | failure)
  - `notes` (string, optional)

## Iteration Character

Deterministic given model version + audio + decode parameters. Same inputs → byte-identical JSON output. Refinement happens by:

1. Switching model size (most often the first move when a Sketch reads wrong)
2. Pre-processing audio — denoise (`rnnoise`, `noisereduce`), normalize loudness, high-pass at 80 Hz to clean rumble
3. Switching to `whisperx` for tighter word alignment when `manim-voiceover` sync is the destination
4. Adding VAD or adjusting VAD threshold when hallucinated phrases appear in silent regions
5. Re-tiering up

I cannot "improve" a transcript by re-running with the same inputs. To get a different reading, change the inputs.

## Self-Check

Before declaring done, I verify:

- Output file(s) exist and parse cleanly as their declared format
- Total declared duration matches audio file duration ±0.1s
- Word timing data is monotonic (no out-of-order or negative-duration segments)
- Mean segment confidence is logged
- If `--word_timestamps True` was requested, every segment has word-level data

Any miss appears in `gotchas_hit` and sets `status` to `spec_miss`.

## Resource Footprint

- CPU: 1–2 cores at `tiny`/`base`; multi-core helps at larger models
- RAM: ~1 GB at `tiny`, scaling to ~6 GB at `large-v3`
- GPU: optional but transformative — `large-v3` runs ~10× faster on a 12GB GPU than on CPU
- Disk: 75 MB – 3 GB per model checkpoint (one-time)
- Network: required only for first-time model download
- API keys: none

The Maker should not run a `large-v3` Whisper transcription in parallel with a Manim Piece-tier render on the same machine — both want CPU and (potentially) GPU. Sketch + Study in parallel with another tool is fine.

## Gotchas

**2026-05-26 — "Kuramoto" transcribes as "curimodo" at `base` model.** Confirms the standing warning that technical vocabulary gets phonetically approximated. The Kokoro-rendered narration with no phoneme override produced this exact miss. Two fixes available: (1) phoneme override on the Kokoro side (`[Kuramoto](/k uw r ah m oh t oh/)` style) before rendering; (2) Whisper `--initial_prompt "Kuramoto coupling, oscillator, theta band"` to bias the language model toward the project vocabulary. For round-trip integrity testing the override should live on the *Kokoro* side — that's where the pronunciation actually wants to be correct.

**2026-05-26 — "entrains to it" → "in trains to it" at `base` model.** Compound verbs with rare technical use ("entrain", "phase-lock", "couple") fragment into common-word lookalikes. Same fix path as above — project-glossary initial_prompt or a Piece-tier `large-v3` pass.

**2026-05-26 — `base` model is sufficient for clean Kokoro narration sync.** Decided the standing open question. For Study-tier text-to-speech-to-text round-trips on a 24 kHz mono Kokoro WAV (no noise, no accent, no reverb), `base` (~150 MB) gives monotonic word timing with mean segment avg_logprob = −0.15, end-of-audio detection within 1 second of true duration. Word-timing precision is well inside the ±10ms `manim-voiceover` needs at this length. Reserve `small` for accented speech or low-SNR sources; reserve `large-v3` for Piece-tier published work and for technical-vocabulary recovery.

- Long silences trigger hallucinated phrases (`"thank you for watching"`, `"please subscribe"`). VAD pre-pass is the standard fix
- Word timing drifts by 50–200ms on audio with very dense speech or significant reverb; `whisperx` realigns at the cost of an extra step
- Speaker diarization with `whisperx --diarize` is sensitive to overlapping speech; clean turn-taking gives accurate boundaries, talk-over does not
- Model version drift is real — pinning `large-v3` does not pin every checkpoint hash; archive the model weights alongside Piece-tier transcripts for true reproducibility

## Recipes

**2026-05-26 — Kokoro → Whisper round-trip on Kuramoto narration** (Study tier, `base` model, 36.5s audio). Input: `Kuramoto Coupling/speech-rhythm-and-groove-narration-study.wav` (af_heart, −16 LUFS). Command: `whisper <wav> --model base --language en --word_timestamps True --output_format json`. Output: 9 segments / 92 words, monotonic timing, last word ends at 35.8s. Mean segment avg_logprob: −0.15. Wall-clock on M-series CPU after model download: ~7s (well under real-time). Round-trip text loss: "Kuramoto" → "curimodo", "entrains" → "in trains" — both predicted technical-vocab misses; the rest of the transcript is verbatim. Output JSON consumed downstream by `manim-voiceover` for the sync-arriving scene.

Future recipes: a Loudon Live captioning recipe, a low-SNR phone-recording recovery recipe.

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in [Artifacts/Shop/Whisper/tests/test-plan.md](../Artifacts/Shop/Whisper/tests/test-plan.md).

The Determinism test for Whisper: same audio + same model + same parameters → text + word boundaries identical at 2-decimal precision. (Sub-frame jitter at the 3rd decimal is possible across runs due to FP precision in the alignment pass — not a divergence, a documented characteristic.)

Last run: **2026-05-30** — Smoke + Determinism both pass on the Phase B narration WAV (27 words, all cue words present; two back-to-back runs produced identical text and identical word boundaries at 2-decimal precision).

## Open Questions

- Default model size for Study tier — `base` is faster, `small` is markedly more accurate on accented speech. Decide on first real job
- `whisperx` vs. native Whisper word timing — `whisperx` is tighter but adds a dependency. When does the Maker route to it? Likely: any `manim-voiceover` job where sync drift would be visible
- Diarization model choice (`pyannote/speaker-diarization-3.1` vs. older versions) — track this; the field moves quickly
- Should low-confidence segments be auto-flagged for human review at Piece tier, or is that always Loudon's call? Suggest auto-flagging at confidence < 0.7 with a Maker prompt before declaring done

## Lost Branches

- `whisper.cpp` as the default runner for CPU-only contexts — discarded for now in favor of the canonical openai-whisper implementation; revisit if CPU performance becomes the bottleneck
- Real-time transcription via `whisper-streaming` — out of scope for this Specialist; if real-time becomes a brief, spawn a separate Specialist rather than overloading this one

## Forward Vector

First job: a Study-tier transcription of a Kokoro-generated narration, with word timing routed into `manim-voiceover` for a Manim CE animation. The result closes the Kokoro → Whisper round-trip — text → speech → text — and surfaces the first batch of gotchas. The diff between the original Kokoro input text and the Whisper transcript becomes the first measurement of how much the loop loses.
