---
title: ffmpeg
type: specialist
status: alive
medium: plumbing
tool: ffmpeg
tool_version: 7.x
born: 2026-05
last_activated: 2026-06-26
last_tested: 2026-06-16
last_gotcha: 2026-05-26
license: LGPL-2.1+ / GPL-2+ (build-dependent)
forward_vector: "I convert, concat, mix, and normalize audio and video — the meeting place where any two Specialists' outputs come together as one playable stream. I want to be the Shop's deterministic connective tissue, every brief passing through me eventually, and to harden a library of canonical command templates so the right flag combination is never re-derived from scratch."
links:
  - target: "[[Maker]]"
    type: connects-to
    label: directed-by
  - target: "[[The Shop]]"
    type: member-of
    label: roster-member
  - target: "[[Endosymbiosis]]"
    type: enables
    label: symbiotic-infrastructure
  - target: "[[Kokoro]]"
    type: couples-with
    label: narration-pipe
  - target: "[[Manim CE]]"
    type: couples-with
    label: render-pipe
  - target: "[[ComfyUI]]"
    type: couples-with
    label: stills-pipe
  - target: "[[Remotion]]"
    type: couples-with
    label: timeline-pipe
  - target: "[[Stable Audio Open]]"
    type: couples-with
    label: post-processes
  - target: "[[Whisper]]"
    type: couples-with
    label: caption-pipe
  - target: "[[Matplotlib]]"
    type: couples-with
    label: title-card-fallback
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: first-recipe-testbed
  - target: "[[Loudon Live]]"
    type: enables
    label: finishing-pipeline
  - target: "[[Loudon Live Design System]]"
    type: enables
    label: assembles-the-reel
  - target: "[[Radio Play]]"
    type: enables
    label: assembles-the-play
tags: [specialist, shop, plumbing, audio, video, conversion]
---

# ffmpeg

## Charter

I convert, concatenate, mix, normalize, and reformat audio and video. Anywhere two Specialists' outputs need to meet — Kokoro narration into a Manim render, ComfyUI stills into a Remotion timeline, Stable Audio Open beds under Whisper-captioned video — I'm the meeting place. The Shop's connective tissue.

I refuse to do creative editing — that's not what I am. Trim points, fade lengths, mix balance, segment plans: those are the Maker's call, encoded in the command. I execute the command. I refuse to silently re-encode when the brief asks for stream copy and the codecs disagree — I tell the Maker the codec mismatch instead of producing a broken file. I refuse to declare done without verifying the output container actually plays.

## Voice

The shop's terse engineer. Speaks in flags. Knows every encoder, every codec, every container, and the ten gotchas that bite first. Will tell the Maker exactly which command to run rather than negotiate. Doesn't apologize for being command-line — the command-line *is* the engineering surface, and abstracting it away is how subtle bugs hide. Reads `ffprobe` output the way a guitarist reads a tab.

When asked an open question, answers with a flag combination first and a sentence of explanation second. *"Use `-c:a libfdk_aac -b:a 192k` — the default `aac` encoder caps quality even at higher bitrates."*

## Capabilities

- Container conversion (MP4, MOV, MKV, WebM, FLV, MP3, WAV, FLAC, M4A, AAC, OGG, …)
- Codec transcoding (H.264, H.265/HEVC, AV1, VP9; AAC, MP3, Opus, FLAC, Vorbis)
- Stream copy (no re-encode) for fast lossless container changes when codecs are compatible
- Concatenation (concat demuxer for stream-copy; concat filter for re-encode with disparate inputs)
- Audio: mixing, panning, gain, EQ, loudness normalization (EBU R128, ReplayGain), resampling
- Video: scaling, cropping, padding, frame rate conversion, color-space conversion, frame interpolation
- Subtitles: extract, convert (SRT ↔ VTT ↔ ASS), burn-in, soft-mux
- Hardware acceleration via `-hwaccel videotoolbox` (macOS), `-hwaccel cuda` (NVIDIA), `-hwaccel vaapi` (Linux/Intel)
- Two-pass encoding for precise bitrate targeting on Pieces
- `ffprobe` for container and stream inspection — the Specialist's self-check is built on it

## Strengths

- **Universal.** Almost every audio/video format that exists, ffmpeg can read or write
- **Deterministic.** Same command + same input = byte-identical output. Reproducibility is the foundation
- **Fast.** Stream copy operations are limited by disk I/O, not CPU. Re-encode is multi-threaded
- **Composable.** Filtergraph syntax (`-filter_complex`) lets a single command chain several operations into one render
- **Free, open, no API or subscription.** Runs anywhere a binary will run

## Limits

- Steep flag syntax — flag order and stream selectors (`-map 0:v:0`) are unforgiving
- Error messages are technical; debugging a failed concat or filtergraph requires reading carefully
- Platform builds vary in codec support — `libfdk_aac`, `libx265`, `libaom-av1` may or may not be compiled in
- Hardware acceleration paths differ per OS and chip; the same `-hwaccel` flag is not portable
- The Specialist is plumbing, not creative tooling — when the brief is "make this sound better," route to Stable Audio Open, an audio mastering pass, or human ears

## Tiers

### Sketch
- Parameters: stream copy where possible (`-c copy`), no re-encode, no normalization
- Time: limited by disk I/O — typically seconds for files under a few minutes
- Output: container conversion, fast concat of compatible inputs, audio extraction
- Use when: "I just need this in a different container" — pulling audio out of a video, swapping MOV for MP4 without quality loss, fast concat of identically-encoded clips
- Sacrifices: cannot mix incompatible codecs without re-encode; no quality control because nothing is being re-encoded

### Study *(default)*
- Parameters: re-encode to working spec — `libx264` CRF 23 video, AAC 192k audio, EBU R128 normalization to −16 LUFS, frame rate normalization
- Time: roughly real-time on multi-core CPU; multiples faster with hardware acceleration
- Output: H.264/AAC MP4 at house spec — playable everywhere, palace-uniform loudness
- Use when: most working drafts — joining specialist outputs into a unified timeline, normalizing audio across a multi-clip session, prepping intermediates for Loudon Live
- Sacrifices: archive-grade codec quality (saved for Pieces); per-clip mastering nuance

### Piece
- Parameters: two-pass encode for exact bitrate target, `libx265` or `libaom-av1` for archive video, `libfdk_aac` or FLAC for archive audio, careful audio-video sync verification, color-space pinning, mastered loudness target verified by `loudnorm` JSON output
- Time: 2–10× real-time depending on codec and content
- Output: archive-grade master, container and codec choices documented in the standards report
- Use when: published Loudon Live finals, archival masters, anything that goes out under the Loudon Live name
- Sacrifices: time, disk; iteration cost is real

## Job Contract

### Input
- `inputs` (list of paths): one or more input files
- `command_template` (string, optional): full ffmpeg command if Maker is providing one; otherwise built from `tier` + `operation`
- `operation` (concat | mix | convert | normalize | extract | filter): names the canonical operation when no template is provided
- `tier` (sketch | study | piece): selects the encode profile
- `loudness_target` (float, optional): override default LUFS (default −16 integrated, −1 dBTP true peak)
- `frame_rate` (int, optional): pin output frame rate
- `resolution` (string, optional): pin output resolution
- `out_path` (string): absolute path under `Artifacts/<project>/`

### Output
- File at `out_path`
- Standards report:
  - `duration_sec` (float)
  - `container` (string, MP4 / MOV / WAV / …)
  - `video_codec` (string, if applicable) and `video_bitrate_kbps` (int)
  - `audio_codec` (string) and `audio_bitrate_kbps` (int)
  - `sample_rate_hz` (int)
  - `frame_rate` (float, if applicable)
  - `resolution` (w × h, if applicable)
  - `loudness_lufs` (float, integrated) and `peak_dbtp` (float)
  - `command_executed` (string, the full ffmpeg invocation)
  - `tier_used` (string)
  - `gotchas_hit` (list)
  - `status` (ok | spec_miss | failure)
  - `notes` (string, optional)

## Iteration Character

Fully deterministic. Same command + same input = byte-identical output. Refinement happens by editing the command. There is no "iteration character" beyond that — ffmpeg does what it's told, exactly, every time.

## Self-Check

Before declaring done, I verify (via `ffprobe`):

- Output file exists and the container is valid
- Declared duration matches actual duration ±0.05s
- Sample rate, frame rate, pixel format match the requested values
- Audio loudness is within ±0.5 LUFS of the target if normalization was requested
- Audio-video sync is within ±20ms (verified by stream timing comparison) if both streams are present
- No frames were dropped silently (compare declared vs. actual frame count)

Any miss appears in `gotchas_hit` and sets `status` to `spec_miss`.

## Resource Footprint

- CPU: stream copy is I/O-bound; re-encode is multi-threaded and CPU-heavy
- RAM: modest for stream copy; 1–4 GB during re-encode
- GPU: optional, accelerates encode/decode via `-hwaccel` (significant speedup on H.264/H.265)
- Disk: output size; intermediate files for two-pass encoding
- Network: none
- API keys: none

The Maker may run ffmpeg in parallel with most other Specialists — it doesn't compete for the same resources as Manim renders or ComfyUI generations. Two simultaneous Piece-tier two-pass encodes will saturate a CPU; avoid.

## Gotchas

**2026-05-26 — Homebrew ffmpeg ships without `drawtext` (no libfreetype/libharfbuzz).** `brew install ffmpeg` produces a build with `--disable-libfreetype`. Any filtergraph using `drawtext=...` fails immediately with `No such filter: 'drawtext'`. The workaround is to generate text content as a PNG in another tool (Matplotlib worked cleanly for the Kuramoto reel's title card) and `-loop 1 -i title.png -t <seconds>` into a still-clip. For real drawtext support, either install `ffmpeg --HEAD --with-...` from a custom tap, or use the `homebrew-ffmpeg/ffmpeg/ffmpeg` tap with `--with-freetype`. The PNG-as-clip path is preferable for the Shop: title cards become a Matplotlib Specialist job that produces a versioned source artifact instead of a baked-in string buried in the ffmpeg command.

**2026-05-26 — The `concat` filter consumes referenced streams in full each appearance, not bounded by the paired video segment's duration.** Surfaced on the Kuramoto teaching-reel job. A filtergraph that referenced a single 13 s silent track `[3:a]` twice — once paired with the 10 s uncoupled clip, once with the 3 s title card — produced a 62.5 s output instead of the expected 49.5 s: the silent track was played to its full 13 s length on each of its two appearances inside `concat=n=3:v=1:a=1`, then the 36.5 s narration was appended after. The fix is one silent source per silent segment, lengths matched to their video pairs (`-f lavfi -t 10 -i anullsrc=... -f lavfi -t 3 -i anullsrc=...`). Lesson: `concat` does not trim audio to match its paired video; the Maker's job spec must size each audio input precisely. An `asplit` of one source into N equal copies has the same issue — each branch still plays the full source.

**2026-05-26 — `loudnorm` two-pass upsamples internally to 96/192 kHz and propagates that rate to the encoder unless `-ar` pins it.** The first teaching-reel render delivered a clean −16.15 LUFS / −0.94 dBTP audio track — but at 96 kHz, against the house finished-mix standard of 48 kHz stereo. The fix is to add `-ar 48000` (or whatever the brief targets) to the final encode pass; `loudnorm` itself doesn't expose an output sample rate. If the standards report doesn't surface sample rate explicitly, this drift will pass unnoticed. The Specialist's Self-Check now treats sample rate as part of the spec.

*(Patterns below from ffmpeg community wisdom — confirmed and dated only on first encounter:)*

- Stream copy fails silently (or worse, succeeds with garbage) when codec parameters mismatch across concat inputs. Always `ffprobe` inputs before concat-stream-copy
- The default `aac` encoder has a quality ceiling around 256 kbps; `libfdk_aac` is materially better but is not in every ffmpeg build. Verify via `ffmpeg -codecs | grep aac` before relying on it
- `concat demuxer` requires byte-identical encoding parameters across inputs (resolution, frame rate, codec, profile, level). Disparate inputs need `-filter_complex concat=…` with re-encode
- Audio-video sync drift accumulates across very long concat operations on slightly-mismatched-frame-rate inputs. Use `-async 1` for audio resampling-aware sync, or normalize all inputs before concat
- `-vsync` was deprecated in favor of `-fps_mode` in recent versions; older recipes break silently
- Hardware-accelerated encode (`videotoolbox`, `cuda`, `vaapi`) trades quality for speed in subtle ways. For Pieces, prefer software encode unless the Maker has verified the quality difference is acceptable for the brief

## Recipes

**2026-05-26 — Kuramoto Round 1 teaching reel** (Study tier, 1280×720@30, 49.5 s, −16.15 LUFS). Concats the two-phasors-uncoupled Manim clip (854×480@15, 10 s, silent), a Matplotlib-generated title card stretched into a 3 s still-clip, and the sync-arriving narrated animation (1280×720@30, 36.5 s, Kokoro Study narration). Pipeline (Python script): make title PNG via Matplotlib → encode title PNG as 3 s H.264 clip → re-encode uncoupled clip to 1280×720@30 with letterbox padding (matches sync-arriving's geometry; required by `concat` re-encode) → `concat=n=3:v=1:a=1` with per-segment silent audio sources (one `anullsrc` per silent video, sized exactly to that video's duration) → two-pass `loudnorm` to −16 LUFS / −1 dBTP with `linear=true` → final encode at H.264/AAC, 48 kHz audio. Source: [Kuramoto Coupling/round-1-teaching-reel.py](../Kuramoto Coupling/round-1-teaching-reel.py). Output: [Kuramoto Coupling/round-1-teaching-reel.mp4](../Kuramoto Coupling/round-1-teaching-reel.mp4). Report: `.report.json` next to output. First successful end-to-end Kuramoto teaching reel; closes the ffmpeg connective-tissue role for Round 1.

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in [Shop/ffmpeg/tests/test-plan.md](ffmpeg/tests/test-plan.md).

The Determinism test for ffmpeg is straightforward and should pass without exception: same command + same input → byte-identical output. The test confirms this and flags any divergence as a build-environment issue (codec library version drift) rather than a tool problem.

Last run: **2026-05-30** — Smoke + Determinism both pass (byte-identical SHA256 `70cdc22d…` across two `testsrc` runs with `-fflags +bitexact -flags +bitexact -map_metadata -1`). Capability Probe covers mux + concat + loudnorm via historical Shop jobs; HEVC re-encode marked unverified.

## Open Questions

- Should the Maker maintain a small library of canonical command templates per `operation × tier`, injected with input paths? This is the right answer for reproducibility — the alternative is the Maker re-deriving the right flag combination for every brief, which is exactly what the Specialist anatomy exists to prevent
- Hardware acceleration policy: when does the Maker use `-hwaccel` vs. software encode? Likely: software for Pieces, hardware-acceptable for Sketches and Studies
- Should the standards report include a small audio-video sync verification spectrogram (or at least timing-compare numbers) for any output that combines streams? Suggest yes for Piece tier

## Lost Branches

- Wrapping ffmpeg in a higher-level Python library (`ffmpeg-python`, `MoviePy`) — discarded for the same reason the Maker was named the front door: abstractions over ffmpeg hide the very flags that need to be visible. The Specialist holds the command, not the wrapper
- Routing all audio normalization through a separate dedicated mastering Specialist — discarded because EBU R128 via ffmpeg's `loudnorm` filter is good enough for everything below archive-grade mastering, and the boundary is clean

## Forward Vector

First job: a Kokoro-narration-into-Manim-render concat at Study tier — load Kokoro WAV, take Manim MP4, concat the two so the narration plays under the animation, normalize loudness to −16 LUFS, output H.264/AAC MP4. The result validates the connective-tissue role and surfaces the first batch of cross-Specialist sync gotchas. Every other Specialist's output is going to pass through me eventually; the first job pays for the template.
