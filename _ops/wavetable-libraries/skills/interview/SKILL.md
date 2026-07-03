---
name: wavetable-library-interview
description: Conducts the chat-driven interview that turns a request into a deployment-ready wavetable. Trigger when the user wants to generate a wavetable for Serum/CLM, Ableton Wavetable, Surge XT .wt, or single-cycle export — sourced from palace synthesis, captured audio, AI sub-agent output, or user-provided cycles. Enforces convention agreement before rendering and audition gate before any full-batch frame render.
location: _ops/wavetable-libraries/skills/interview/
status: draft — first emission GWL cycle 12 (2026-06-23). First graduating run completed GWL cycle 13: Floquet Modes walked through the six-branch tree retroactively as a fit-test, all branches accommodated (record at `Projects/Generative Wavetable Libraries/floquet-modes/INTERVIEW.md`). Promotion to `/skills/wavetable-library-interview/` still requires one fresh, non-retroactive run.
home_project: "[[Generative Wavetable Libraries]]"
phase: 1
promotion_path: "/skills/wavetable-library-interview/ once the question tree has driven at least two distinct sources end-to-end (Crystal Bravais and Shepard CENTROID-FREQ qualify retroactively; need one fresh run through this skill before promotion)"
---

# The Generative Wavetable Library Interview Skill

The front door for any wavetable task. Ask the right questions, surface sensible defaults, and refuse to skip the two checks the sister project ([[Talking Keyboard]] / 352 files) proved are non-negotiable: agreement on conventions before any audio is written, and an audition of the smallest representative artifact before the full sweep is committed.

A wavetable is not a sample library. The question tree is different: format choice is binary-format-shaped (CLM chunk vs Ableton WAV vs Surge .wt vs single-cycle), the sweep axis is musical (what does position 0→1 *mean*?), and the verification is sensory in a different register (does the sweep *read* as intentional motion, not as artifacts?).

## When this skill should turn on

Trigger explicitly when the user says any of: "make me a wavetable", "generate a wavetable", "build a Serum table", "render a CLM wavetable", "build an Ableton wavetable", "make a single-cycle of X", "build a .wt for Surge".

Trigger implicitly when the task names a wavetable synth (Serum, Vital, Surge XT, Phase Plant, Pigments, Falcon, Ableton Wavetable), a `.wt` extension, or asks to "make X sweepable" / "turn X into a wavetable position".

Do not trigger for: full multisampled instruments (that is the sister sample-library-interview skill), one-shot single audio files with no sweep dimension, or pure synthesis research that does not target a deployable format.

## Two rules that must be enforced

Inherited unchanged from the sister project. The Talking Keyboard tuition (352 files with a pronunciation bug only listening could catch) applies equally here — a 256-frame wavetable with a phase-coherence bug or a CLM chunk error is the same failure mode at a different format.

### Rule 1 — Get agreement on names, paths, and the sweep semantic before writing any audio

Before the first WAV is written, show the user:

- One example filename in full (e.g., `crystal_bravais.wav`, `crystal_bravais_ableton.wav`)
- One example folder path in full (e.g., `Projects/Generative Wavetable Libraries/crystal-bravais/`)
- The locked **frame size** (2048 for CLM, 1024 for Ableton, power-of-2 for Surge)
- The locked **frame count** (typically 64 or 256)
- The **sweep semantic in one sentence** — what does position 0 mean, what does position 1 mean, what changes monotonically across the sweep? ("position 0 = cubic Bravais lattice partials; position 1 = triclinic" / "position 0 = spectral centroid low; position 1 = high")

Surface these as visible defaults. Get explicit yes or a tweak. Lock the agreed set into a `BUILD.md` at the project root before any rendering begins.

The sweep semantic is the question this skill exists for. A wavetable that does not have a one-sentence answer to "what is position 0→1?" is not yet specified; the Interview does not proceed without it.

### Rule 2 — Audition the smallest representative artifact before the full sweep

After conventions are agreed: render a small audition file — never the full 256-frame batch. Two patterns:

- **Audition sweep WAV** (preferred): a short sweep through all frames at a constant pitch, mono, ~12 seconds. The user listens to whether the motion reads as intentional and whether the boundary regions glitch. Phase 1 and Phase 2 of this project both shipped audition sweep WAVs (`crystal_bravais_audition_sweep.wav`, etc.) — keep that convention.
- **Endpoint pair**: render only the first and last frame as standalone single-cycle WAVs. Useful when the sweep is short or when the user wants to hear the timbral spread without the motion. Less informative than the audition sweep for sensory verification.

Pause. Wait for an explicit "good" or "fix this". The full deployable wavetable does not render on assumed approval. "The math is right" is not "it sounds right" — the entire reason the audition gate exists is that listening catches what code review cannot.

## What questions Claude should ask

Ask in this order. Skip any branch the user has already specified explicitly.

**1. Where do the frames come from?** Pick one:
- Palace synthesis — name a synthesis function from the palace ([[Crystal Synthesizer]] phonon partial stacks, [[Shepard Tone Synthesizer]] octave stacks, [[Floquet Theory]]-derived modes, [[Inharmonic Wavetable Synthesis]] research material). Follow up: which parameter varies across the sweep, what is held fixed?
- Captured audio (single-cycle extraction) — give a folder of source WAVs. Follow up: how do we extract one clean cycle from each (zero-crossing pair, pitch-detected period, hand-marked)?
- AI audio sub-agent — name a model. Follow up: prompt template per frame, how many candidates per frame before acceptance.
- User-provided cycles — folder of already-extracted single-cycle WAVs. Follow up: are they the same length, or do we need to resample to the target frame size?
- Mathematical generator — direct function (e.g., a parameterized harmonic stack, a chaotic map, a physical-model output). Follow up: parameter name + range, whether it is monotonic in some perceptual axis.

**2. What is the sweep semantic in one sentence?** This is the rule-1 question above, asked again here so the question tree captures it. *position 0 = X; position 1 = Y; the monotonic axis between them is Z.* If the user cannot answer, work it out with them before continuing — a wavetable without this answer is not yet a wavetable.

**3. What target format(s)?** Pick one or more:
- Serum/CLM WAV — primary. 2048 samples/frame, up to 256 frames, 32-bit float, CLM RIFF chunk. Reads in Serum, Vital, Surge XT, Phase Plant, Pigments, Falcon.
- Ableton Wavetable WAV — 1024 samples/frame, 16-bit mono, no metadata chunk. Easiest. Always render this alongside CLM unless the user opts out.
- Surge XT .wt — open binary format, power-of-2 frame size. Optional; Surge also reads CLM.
- Single-cycle WAVs — one WAV per frame, useful as source material for other tools or for hardware (Korg wavestate, Eurorack).

Default offered: render CLM **and** Ableton from the same frame data. The cost is one extra file and zero extra math.

**4. How many frames?** Pick one:
- 64 — coarse sweep, good for fast motion or when each frame is computationally expensive. Phase 1 default (Crystal Bravais).
- 128 — middle ground.
- 256 — full Serum table, smooth motion. Phase 2 default (Shepard CENTROID-FREQ).
- Custom — for sources with a natural frame count (e.g., 7 Bravais systems → 7 keyframes interpolated to 64).

**5. Phase-coherence policy across frames?** Pick one:
- Zero-phase reset per frame (default) — every frame starts at zero crossing rising. Eliminates frame-boundary clicks at the cost of suppressing whatever phase information the source carries. The choice for Phase 1 (Crystal Bravais, accepted).
- Carry phase through — preserve the source's phase relationships. Use when phase IS the musical content (e.g., a chirp wavetable, or a source where partials beat against each other). Risk: audible discontinuities at frame boundaries.
- Per-frame window-and-align — windowed crossfade between adjacent frames. Heavy; use only when the first two fail audition.

**6. Frame-to-frame interpolation policy?** Pick one:
- Keyframe + linear interpolation (default) — synthesize a small number of distinct "anchor" frames, fill the rest by linear blend. What Phase 1 did with 7 Bravais keyframes → 64 frames.
- Per-frame synthesis — every frame is independently synthesized. Use when the sweep parameter varies continuously and there is no natural keyframe set.
- Spectral interpolation — interpolate in the frequency domain (amplitudes and phases of partials), then IFFT to time domain. Smoother timbral transitions than waveform-domain linear blend when partials cross.

After the six branches: confirm the answers back, run Rule 1 (convention preview + sweep semantic confirmation), run Rule 2 (audition render), then the full deployable render.

## Defaults to offer

When the user says "give me a sensible default":

- **Palace-synthesis wavetable**: CLM + Ableton output, 64 frames, zero-phase reset, keyframe + linear interpolation, audition sweep WAV at A2 (~110 Hz, ~12 seconds). The Crystal Bravais pattern.
- **Shepard / harmonic-stack wavetable**: CLM + Ableton output, 256 frames, zero-phase reset, per-frame synthesis (the sweep parameter is continuous), audition sweep WAV at A2. The Shepard CENTROID-FREQ pattern.
- **Captured-audio wavetable**: extract one clean cycle per source WAV via pitch-detected period, resample to 2048 (CLM) or 1024 (Ableton), 64 frames if ≤64 sources else cluster into 64 representative cycles. Zero-phase reset because captured sources rarely have phase relationships worth preserving across frames.

## Filename and folder rules to surface as defaults

- **Project root**: `Projects/Generative Wavetable Libraries/<project-name>/` (Phase 1 / Phase 2 convention; matches the entry's bundle).
- **Filename scheme**: `<project-name>.wav` (CLM format), `<project-name>_ableton.wav` (Ableton format), `<project-name>_audition_sweep.wav` (audition file), `<project-name>.wt` (Surge if requested). Single-cycle exports go into a `single-cycle/` subdir as `<project-name>_frame_<NNN>.wav`.
- **BUILD.md**: every project gets one at the root. Records the source, sweep semantic in one sentence, frame size, frame count, phase policy, interpolation policy, target formats, and audition outcome. Future sessions inherit these instead of re-running the Interview.
- **Sample rate**: 44100 Hz default. 48000 only when matching a downstream session.
- **Bit depth**: 32-bit float for CLM (Serum's recommended depth, preserves headroom across the sweep). 16-bit PCM for Ableton (Ableton's spec).
- **CLM chunk**: written via Python `struct` packing after the `fmt ` and `data` chunks. Pending verification against a known-good Serum reference WAV — Loudon pointed at `/Library/Audio/Presets/Xfer Records/Serum 2 Presets/Tables/Analog`. The Interview should ask if verification has happened before claiming CLM compatibility on a fresh table.

## How to spread frames across the sweep

The principle: frame density should match how much the spectrum changes across the sweep axis.

- High density (128–256 frames): continuous parameters with no natural keyframes (Shepard CENTROID-FREQ pattern). Each frame is one step along a smooth curve.
- Low density (16–64 frames, interpolated to 64+): discrete source set (Crystal Bravais pattern — 7 lattice systems interpolated). The keyframes are the meaningful positions; interpolation fills the rest.
- Audition as arbiter: render the proposed density's audition sweep and listen at any internal transitions. If a transition reads as a step instead of a glide, raise density or switch to spectral interpolation.

Tuning verification: each frame at the target frame size should be one full cycle. A frame that is half a cycle or two cycles produces an octave error when the synth plays it. Quick check: FFT a single frame, find the fundamental, confirm it sits at exactly bin 1 (one cycle = fundamental period = full frame).

## When this skill graduates to auto-loading

Project-local now. Graduation criterion: the question tree has driven at least two distinct sources end-to-end through this skill (not retroactively — Crystal Bravais and Shepard CENTROID-FREQ predate the skill). A fresh run through a new source — a [[Floquet Theory]] mode set, a captured-audio extraction, or an AI-audio sub-agent — that produces a working wavetable without restructuring the question tree, earns the move to `/skills/wavetable-library-interview/`.

## Cross-References

- **[[Generative Wavetable Libraries]]** — the home project; Phase 1 (Crystal Bravais) and Phase 2 (Shepard CENTROID-FREQ) shipped and accepted.
- **[[Generative Sample Libraries]]** — sister project. The sample-library-interview skill is the sibling whose two-gates discipline this skill inherits.
- **[[Talking Keyboard]]** — the 352-file tuition payment that justifies both gates.
- **[[Substrate Skill]]** § Stage as Alignment Confidence — render the smallest unit, gate the batch on its acceptance.
- **[[Modes of Collaboration]]** — the Interview is itself a Mode of Collaboration made durable in skill form.
