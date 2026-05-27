---
name: sample-library-interview
description: Conducts the chat-driven interview that turns a request into a deployment-ready sampled instrument. Trigger when the user wants to generate a sample library — palace synthesis, local WAV folder, AI audio sub-agents, web sources. Enforces convention agreement before rendering and audition cycle before any full batch.
location: _ops/sample-libraries/skills/interview/
status: active — promoted out of draft on 2026-05-27 (GSL cycle 9) after Phase 3's first non-Kokoro source (Hexagonal Crystal via Crystal Audio/crystal_synth.py) passed Loudon's ear audition (gsl-steward-012 APPROVE). Project-local home retained; promotion to user-skill space (`/skills/sample-library-interview/`) deferred to a deposit ceremony.
home_project: "[[Generative Sample Libraries]]"
phase: 2
promotion_path: "/skills/sample-library-interview/ once Phase 3 has tested the question tree against at least one non-Kokoro source"
---
 
# The Generative Sample Library Interview Skill

This skill is the front door for any sample-library task. Its job is to ask the right questions, surface sensible defaults, and refuse to skip the two checks that the Phase 1 Talking Keyboard build proved are non-negotiable: agreement on conventions before a single audio file is written, and a small audible test before the full batch runs. The Interview is a Mode of Collaboration made durable — instead of reinventing the questions every session, this file holds the question tree, the defaults, and the gates.

## When this skill should turn on

Trigger explicitly when the user says any of: "make me a sample pack", "generate an instrument", "build a multisample of X", "render an SFZ", "build a sampled <instrument>", or any phrasing that names a multisample as the deliverable.

Trigger implicitly when a task names a sampler-format output (SFZ, DecentSampler, SF2) or names palace synthesis with a phrase like "across the keyboard", "deploy to a sampler", "make playable", or "render as an instrument". Any time the work will produce a folder of WAV files plus an instrument-definition file, this skill should load.

Do not trigger for one-off audio generation (a single WAV file or sound design pass that doesn't get mapped across pitch). One audio file is not a sample library, and forcing a multisample interview onto it adds friction with no payoff.

This skill loads first. It runs the conversation. It hands off to source-specific work — Phase 3 sources, Phase 4 destinations — only after both gates have passed.

## Two rules that must be enforced

Both came from the Phase 1 Talking Keyboard build, where 352 files shipped with a Kokoro pronunciation bug — the letter "A" pronounced as "uh" instead of "ay" — that only listening could catch. Both rules are non-negotiable. The Interview's job is to make these catches automatic.

### Rule 1 — Get agreement on names and paths before writing any audio

Before the first audio file is written, show the user a sample of what the output will look like:
- One example filename, in full (e.g., `kokoro_C3_nova.wav`)
- One example folder path, in full (e.g., `_ops/sample-libraries/talking-keyboard/samples/`)
- One example region or sample block from the instrument definition (an SFZ `<region>` line, or a DecentSampler `<sample>` element)

Surface these as visible defaults the user can override, never as silent assumptions. Get an explicit yes or a tweak. If the user tweaks any of them, write the locked-in choices into a `BUILD.md` at the project root before any rendering begins, so the next session inherits the conventions instead of re-asking.

The defaults the Interview proposes are listed below in the "Filename and folder rules" section. The Interview never assumes them — it shows them, asks, and waits.

### Rule 2 — Render and listen to a small test before doing the full batch

After conventions are agreed and before the full batch runs, render the smallest unit that exercises every voice, every source, and every parameter the user picked. Examples of what "smallest unit" means in practice:

- Talking-Keyboard-style (4 voices, 88 notes): render the 4 voices on a single note (C4) — 4 files. If the voices sound right on one note, the same code path will render correctly on the other 87.
- Tonal sustain (1 voice, multiple velocity layers, multiple sample points): render every velocity layer on the lowest sample point and the highest sample point — covers timbral range and velocity differentiation in 4–8 files instead of dozens.
- Percussion or one-shots (per-note distinct sources): render 3–5 representative samples that span the timbral spread of the kit — kick, snare, closed hat, open hat, cymbal — not the whole kit.

Pause. Wait for an explicit "good" or "fix this" from the user. The full batch does not run on assumed approval, and "looks correct" is not "sounds correct" — code review and spec review can never substitute for listening. If the user says "fix this", iterate the smallest unit again. Never jump to the full batch as part of a fix; a regression in the small render will be a regression in the large one, multiplied.

This is the only verification path for sensory deliverables. Phase 1 cost: 352 files rendered with the "uh" pronunciation before the bug was caught. The audition cycle is here to make that cost a one-time tuition payment, not a recurring expense.

## What questions Claude should ask

Ask the branches in this order. Skip any branch the user has already specified explicitly.

**1. Where does the audio come from?** Pick one:
- Palace synthesis — name a synthesis function from the palace ([[Crystal Synthesizer]], [[Shepard Tone Synthesizer]], neural granular generators). Follow up: which synthesis parameters vary per note, which stay fixed.
- Local WAV folder — give a folder path. Follow up: are filenames structured (e.g., `instrument_C3.wav`) so we can read pitch from them, or do we need pitch detection (librosa / aubio) on the audio itself?
- AI audio sub-agent — name a model (Kokoro for spoken-word, Stable Audio Open / MusicGen / AudioLDM2 for tonal). Follow up: what prompt template per note, and how many candidates per note before we accept (the iterative critique loop lives here).
- Web library — name a source (freesound.org pack, a Creative Commons collection). Follow up: license check, explicit user permission to download.

**2. What range of notes?** Pick one:
- Full piano A0–C8 (default for tonal instruments, 88 notes).
- Custom range — give low note and high note (e.g., C2–C6 for a bass-baritone vocal sample).
- Percussion mapping — specific MIDI notes get specific samples; no melodic mapping. Provide the mapping table (e.g., C1 = kick, D1 = snare, F#1 = closed hat).

**3. How many velocity layers?** Pick one:
- 1 — uniform velocity. Fastest to render. Good for sources with one consistent timbre.
- 2 — soft and loud. Standard for tonal instruments.
- 4 — pp / mp / mf / ff. Phase 1 default; suitable when each velocity calls a different voice or recording.
- Custom — give the count and the velocity boundaries.

**4. One voice or many?** Pick one:
- Single voice — one timbre across the whole keyboard.
- Round-robin — multiple takes per note, alternating on repeated hits, adds naturalism. Skip when the source is deterministic (synthesized math): identical takes defeat the point.
- Velocity-mapped voices — Phase 1 pattern: each velocity range plays a different voice. Soft = `af_nova`, mid = `bf_emma`, loud = `am_michael`, etc.

**5. Should notes loop?** Pick one:
- No loop — one-shots, percussion, TTS-driven instruments. Note plays through once and stops.
- Sustain loop — synthesized tones and instruments that hold. Sample includes a loop point pair; sampler holds the note as long as the key is held.
- Crossfade loop — hard-to-loop sources. Record longer than needed; the SFZ defines a crossfaded loop region in a clean middle section.

**6. What format is the output?** Pick one:
- SFZ — default. Plain text, universal, opens in sforzando, Surge XT, Reaper, Bitwig, sfizz.
- DecentSampler — XML, free distribution player, ideal for student delivery.
- SF2 — generated via ConvertWithMoss conversion from SFZ; not direct generation.
- Kontakt NKI — out of scope. Authoring requires paid licensing.

After the six branches: confirm the answers back to the user as a summary, then run Rule 1 (convention preview), then Rule 2 (audition render), then the full batch.

## Default choices to offer

When the user says "give me a sensible default" or doesn't have an opinion, offer one of these starting points and confirm before proceeding:

- **Tonal sustaining instrument** (a synth lead, a string-like sound, a held tone): 6 sample points across the keyboard, 2 velocity layers (soft / loud), sustain or crossfade loops depending on whether the source loops cleanly, SFZ format.
- **Percussion or one-shots**: every note unique (no pitch shifting between notes), 1 velocity layer, no loop, SFZ format.
- **TTS-driven instrument** (Talking Keyboard pattern): every MIDI note unique, 4 velocity layers mapped to 4 distinct voices, no loop, SFZ format.
- **Palace-synthesis tonal**: start with 6 sample points and audition. If the timbre stretches gracefully across pitch, drop to 4. If it warps audibly between sample points, raise to 12 or every-other-note. Resampling fidelity is a sensory question — the audition catches it.

These are starting points, not commands. The Interview surfaces them; the user picks or overrides; the choice is recorded in `BUILD.md`.

## How to spread samples across the keyboard

The principle: density should match how much the timbre changes with pitch.

- High density (every note, or every few notes): acoustic instruments, anything with formants (voice, brass, woodwinds), anything where the user notices "it sounds wrong" when one sample stretches more than a fourth or fifth. Recording every note is expensive but removes the question.
- Low density (4–6 sample points across the keyboard): synthesized tones, mathematical sources, sources whose timbre is consistent across pitch by construction.
- Audition as arbiter: when in doubt, render the proposed density's smallest unit and listen at the boundary regions where one sample stops and the next begins. If the transition is audible, raise density.

Tuning verification: render a sample, check the fundamental frequency matches the labeled note. A tuner plugin or a quick FFT inside Python (`numpy.fft.rfft` plus peak detection) catches off-by-an-octave or off-by-a-semitone errors before the SFZ ships.

Loop verification: listen for clicks at the loop point (fix with zero-crossing alignment of `loop_start` and `loop_end`), listen for spectral discontinuities (fix with a longer crossfade or a different loop region). For SFZ: `loop_mode=loop_continuous` for sustained tones; `loop_mode=no_loop` for one-shots and percussion.

Round-robin: optional realism layer, useful when the source is non-deterministic (recordings of an acoustic instrument, AI audio with stochastic regeneration). Rotate through 2–4 takes per region using `seq_position` and `seq_length`. Skip for synthesized sources where every render is bit-identical — round-robin without variation only adds load times.

## Filename and folder rules to surface as defaults

These are the defaults the Interview shows under Rule 1. The Interview always asks before locking them in.

- **Filename scheme**: `<source>_<note>_<voice>.wav` for multi-voice instruments (e.g., `kokoro_C3_nova.wav`). `<source>_<note>.wav` for single-voice instruments. For percussion: use the part name instead of the note (e.g., `kit_kick.wav`).
- **Note naming**: sharps not flats (C#3, not Db3). Matches standard MIDI note name strings and avoids enharmonic-equivalent ambiguity.
- **Folder layout**: WAVs at `_ops/sample-libraries/<project-name>/samples/`. Instrument definition at `_ops/sample-libraries/<project-name>/<project-name>.sfz` (or `.dspreset`). `BUILD.md` and `generate.py` at the project root alongside the instrument file.
- **Voice naming**: when the source provides voice IDs (Kokoro's `af_nova`, `am_michael`, etc.), use them verbatim. When voices are user-named, use descriptive lowercase identifiers the user supplies.
- **Sample rate**: match the source's native rate when possible. Phase 1 default: 24kHz mono (Kokoro's native rate). Palace-synthesis sources may warrant 48kHz; web libraries and AI models may be 44.1kHz or 48kHz — use what the source produces, don't resample unnecessarily.
- **Bit depth**: 16-bit PCM default. Move to 24-bit when the source has dynamic range that 16-bit clipping or noise would damage (palace synthesis with wide level swings, professionally-recorded acoustic sources).
- **BUILD.md**: every project gets a `BUILD.md` at its root that records the locked-in conventions for this build (source, range, velocity layers, voice scheme, loop policy, format, all the file-and-folder choices). Future sessions read this first and inherit the conventions instead of re-running the Interview from scratch.

## When this skill graduates to auto-loading

Right now this skill is project-local at `_ops/sample-libraries/skills/interview/`. It does not auto-load. Claude must be pointed at the file, or must recognize a sample-library task and load this skill explicitly. The reasoning for staying project-local: the question tree has only been exercised against one source (Kokoro TTS) and might be Kokoro-shaped in ways that won't fit a synthesized tonal source or a recorded acoustic source.

Graduation criterion: Phase 3 of [[Generative Sample Libraries]] has tested the question tree against at least one non-Kokoro source — palace synthesis (the [[Crystal Synthesizer]] is the natural first candidate), a local WAV folder, or an AI audio model that isn't TTS. The test passes when the Interview produces a working multisample on that source without major restructuring of the question tree or the defaults.

Graduation move: copy this file to `/skills/sample-library-interview/SKILL.md` so Claude auto-loads it whenever any sample-library task starts. Update the `location` field, change `status` to `promoted`, and add a `promoted_from` field pointing back to the project-local origin. Leave the project-local copy as a redirect stub, or delete it once the promoted version is verified.

Until graduation: stay project-local. Generality is earned across multiple sources, not asserted in advance.

## Cross-References

- **[[Generative Sample Libraries]]** — the home project; Phase 2 spec and the two hard gates live there.
- **[[Talking Keyboard]]** — Phase 1 case study; the pronunciation bug is the reason both gates exist.
- **[[Substrate Skill]]** § Stage as Alignment Confidence — the principle that sensory deliverables require an audition gate.
- **[[Project Stewardship System]]** § Stage A — Piloted — the Stewardship cycle that produced this skill.
- **[[Modes of Collaboration]]** — the Interview is itself a Mode of Collaboration; this skill makes it durable.
