# Phase B — Narrated Beats: the Maker's first gated coordinated pipeline

**Authored 2026-05-30**, as Phase B of [`SHOP-BUILD-SESSION-2026-05-30.md`](../../../SHOP-BUILD-SESSION-2026-05-30.md). The four-Specialist dispatch the [[Shop/Maker|Maker]] anticipated in its Charter but had only run *ad hoc* until now (sync-arriving.py, Kuramoto Round 1). This is the formalisation: a coordinated pipeline where one Specialist's output gates the next's input, with the gate enforced at *two* layers — orchestrator AND scene module.

## The four-Specialist dispatch

```
[brief] ─→ Kokoro ──→ narration.wav        gate: file exists, mono, ≥ 16 kHz
              ↓
           Whisper ──→ narration.json      gate: file exists, segments + words,
              ↓                                   monotonic timings, all
              ↓                                   REQUIRED_CUES present
              ↓
            Manim  ──→ NarratedBeats.mp4   gate: scene module re-validates JSON
              ↓                                   at construct() — second gate;
              ↓                                   render aborts if JSON missing
              ↓                                   or malformed, never a degraded
              ↓                                   stub
            ffmpeg ──→ narrated-beats.mp4  final muxed clip
```

The brief: a 10-second narration about beat frequency — *"Two phasors. Slightly different frequencies. As they drift in and out of phase, their sum produces a beat — a slow pulse built from their tiny difference. Listen."* — animated so each visual cue (phasor circles, frequency labels, drift trace, sum trace, beat pulse, listen caption) fires on the exact Whisper-timestamped word it names.

## How to re-run

```sh
cd "Artifacts/Shop/Maker/coordination-demos/2026-05-30-narrated-beats"
python3 pipeline.py
```

The orchestrator dispatches each Specialist in turn, runs its gate, and refuses to advance on a gate fail. End-to-end on the canonical Mac:

| step      | wall-clock |
|-----------|-----------:|
| kokoro    | 7.6 s      |
| whisper   | 4.5 s      |
| manim     | 5.5 s      |
| mux       | 0.2 s      |
| **TOTAL** | **17.7 s** |

The `pipeline.report.json` sidecar captures these numbers per run and is what the Maker reads back as the standards report.

## The two gates, in detail

### Gate 1 — orchestrator (`pipeline.py`)

The orchestrator runs each step **synchronously** and checks the *file artifact* the previous step promised before invoking the next:

| Gate           | Checks                                                                                  |
|----------------|------------------------------------------------------------------------------------------|
| `gate_wav`     | WAV exists; sample rate ≥ 16 kHz; mono.                                                  |
| `gate_words`   | JSON exists; ≥ 1 segment with words; timings monotonic; last word ≤ WAV duration + 50 ms; **all `REQUIRED_CUES` matchable** (equality / prefix / SequenceMatcher ratio ≥ 0.78 — tolerates Whisper's phonetic wobble; the first run gate-failed on `'phasors'` because Whisper heard Kokoro's `phasors` as `phasers`; the difflib path fixed it without weakening the gate). |
| `gate_mp4`     | Silent MP4 exists; file size ≥ 100 kB (catches early-aborted renders).                   |

A gate fail aborts the pipeline with `SystemExit` and a Maker-readable diagnostic message — no degraded artifact ever ships.

### Gate 2 — scene module (`scene.py`)

The orchestrator could be bypassed (someone runs `manim scene.py ...` directly). The scene module guards against that by re-validating the JSON **at module import time**, BEFORE any Manim machinery starts:

```python
# scene.py — module level, runs on `import` (before construct() is even reached)
WORDS, CLIP_DUR = gate_load_words(WORDS_JSON)
CUES = {name: cue_time(WORDS, name) for name in REQUIRED_CUES}
```

A missing or malformed JSON raises at import; Manim's scene loader catches the exception and reports it cleanly without producing any partial output.

### Proof the gates hold

Two failure modes were exercised at build time:

1. **JSON deleted.** Direct `manim scene.py NarratedBeats` → `FileNotFoundError: [gate] narration.json missing … Manim must not run before Whisper finishes`. No frames produced.
2. **JSON corrupted** (segments retained, `words` array stripped — simulating a Whisper invocation that forgot `--word_timestamps True`). → `ValueError: [gate] narration.json has segments but no word-level timestamps`. No frames produced.

Both failed at *module-import time*, before the renderer initialised. This is the structural guarantee the Maker's foreman role rests on: Manim cannot speculatively render against missing or stale upstream output.

## Bundle contents

| file                       | what                                                                       |
|----------------------------|----------------------------------------------------------------------------|
| `pipeline.py`              | orchestrator with the four-step dispatch + three gates                     |
| `kokoro_render.py`         | Kokoro narration step (runs in `.venvs/kokoro/`, voice af_heart, −16 LUFS) |
| `scene.py`                 | Manim scene; reads + validates `narration.json` at module import           |
| `narration.txt`            | the narration script (cue-mapped via `REQUIRED_CUES`)                      |
| `narration.wav`            | Kokoro output, 24 kHz mono, −16.71 LUFS / −0.98 dBTP                       |
| `narration.report.json`    | Kokoro's loudness sidecar                                                  |
| `narration.json`           | Whisper word-level transcription                                           |
| `frame-beat-cue.png`       | extracted frame at t ≈ 6.2 s, on the "beat" cue (the visual fingerprint)   |
| `narrated-beats.mp4`       | final muxed clip — 1080p30, 24 kHz mono AAC, 10.53 s                       |
| `pipeline.report.json`     | per-run timing report (overwritten on each pipeline.py run)                |
| `_manim_media/`            | Manim's working dir (silent NarratedBeats.mp4 lives at videos/scene/1080p30/) |

## Findings (the deposits)

1. **Fuzzy-cue matching beats narration-rewriting.** Kokoro's TTS produces phonetically-honest output that Whisper then transcribes phonetically — `phasors` → `phasers`. Strict-equality gates fail on a *correct* pipeline; the SequenceMatcher ratio path (threshold 0.78) tolerates the wobble while still gate-failing on genuinely missing words. The closest-match diagnostic in the gate's error message (`closest matches: ['phasers', 'phase', 'phasers,', ...]`) makes the *fix* obvious instead of mysterious.
2. **Use the AUDIO file's duration, not Whisper's last-segment end, for clip length.** Kokoro emits trailing silence past the last transcribed word; Whisper's last-segment end is the transcription boundary, not the audio boundary. The first Phase B mux ended at 9.90 s and `-shortest` truncated 0.65 s of audio. Fix in `scene.py`: probe `narration.wav` with `wave.open(...)` and use that as `CLIP_DUR`. This is a Maker-level discipline: when two Specialists disagree about "how long is this clip", trust the *artifact*, not the *annotation*.
3. **Two gates beat one.** Orchestrator-only gating is fine until someone bypasses the orchestrator. Module-import-time gating in the scene means there is **no path** to a Manim render that doesn't first read and validate the Whisper output. The cost is a re-read on every render (cheap); the benefit is the gate is structural, not procedural.
4. **End-to-end coordination ran in under 20 s.** Kokoro + Whisper + Manim + ffmpeg on the canonical Mac, gates and all. This sets a real baseline for cost: a Maker-coordinated narrated math clip is a *Sketch-tier-budget* deliverable, not a Piece-tier one. Future coordination demos can be confident the gate machinery isn't the cost driver.
