---
title: "Talking Keyboard"
type: project
pillars: [creation, tools]
status: complete
born: 2026-05
last_activated: 2026-05
stage: sprout
confidence: working
energy: medium
links:
  - target: "[[Generative Sample Libraries]]"
    type: emerged-from
    label: phase-1-pilot
  - target: "[[Generative Sample Libraries]]"
    type: spawned
    label: lessons-feedback
  - target: "[[Phoneme Choir]]"
    type: mirrors
    label: sister-build
  - target: "[[Substrate Skill]]"
    type: connects-to
    label: ai-polish-trap-evidence
  - target: "[[Modes of Collaboration]]"
    type: connects-to
    label: build-session-instance
  - target: "[[FOUR PILLARS]]"
    type: connects-to
    label: autodidact-keyboard
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: stage-mismatch-evidence
forward_vector: "I will keep teaching the SFZ-region-to-phoneme map as the friendliest entry into Generative Sample Libraries synthesis — a Kokoro-rendered piano range where each note speaks its own name, four velocity-mapped voices for instant audible verification, and a Stage 4 Loudon Live demo as the next test of whether anyone but me plays me."
---

# Talking Keyboard

A piano-range SFZ multisample (88 notes, A0–C8) where each note speaks its own MIDI note name through Kokoro-ONNX TTS, with four velocity layers mapped to four distinct voices. Pressing C4 at low velocity says "C four" in `af_nova`'s gentle voice; at high velocity, `am_michael`'s bold voice. Pressing F#5 at mid velocity says "F sharp five" in `bf_emma`'s British female voice.

Phase 1 of [[Generative Sample Libraries]]; first realized deliverable of that project. Built 2026-05-02 as the proof-of-concept for the chat-driven sample library pipeline.

## Why This Instrument First

The Talking Keyboard was chosen as the Phase 1 pilot because it skips the hardest parts of conventional multisampling — loop point detection, tuning verification across the keyboard, pitch-shifting consistency — while exercising the rest of the pipeline (per-note synthesis, velocity layering, voice variety, SFZ region generation, deployment to a free sampler). It also gave instant audible verification: any mapping bug is obvious in the first second of play, because you press a key and hear what note the instrument claims it is.

## Stack

- **Source**: Kokoro-ONNX TTS, running locally in Loudon's TTS environment at `/Users/loudonstearns/documents/TTS/`
- **Voices**: `af_nova` (pp), `af_heart` (mp), `bf_emma` (mf), `am_michael` (ff)
- **Range**: A0–C8 (88 notes × 4 velocity layers = 352 WAV files)
- **Format**: 24kHz mono WAV, plain SFZ (one region per note×velocity), 16-bit PCM
- **Player**: sforzando (free, all platforms)

## Build Location

All build artifacts at `_ops/sample-libraries/talking-keyboard/`:

- `BUILD.md` — build contract / brief
- `generate.py` — the Python script (uses kokoro-onnx, soundfile)
- `samples/` — 352 generated WAV files
- `talking_keyboard.sfz` — the SFZ deliverable
- `build-log.md` — retrospective render log

Loadable directly: drag `talking_keyboard.sfz` into sforzando.

## The Pronunciation Lesson

The first full render had a subtle but obvious bug: Kokoro pronounced the letter "A" as the indefinite article ("uh") rather than the letter name ("ay"). Code review couldn't catch this — the spec said "speak the letter A" and the script did exactly that. Spec review couldn't catch it either. Only listening caught it.

The fix iterated through three spellings of the spoken-A: literal `"A"` (pronounced "uh"), then `"ay"` / `"aye"` (pronounced "eye"), finally `"eigh"` — borrowing the spelling pattern from "eight" minus the t — which produces the long-A diphthong `/eɪ/` that Kokoro pronounces correctly. The resolved spelling lives in `generate.py`'s `NOTE_SPOKEN` array.

This experience seeded the Phase 2 hard gates in [[Generative Sample Libraries]] (convention agreement + audition cycle before full batch) and contributed the canonical case to the Stage as Alignment Confidence section in [[Substrate Skill]].

## Future Variants

Not on a roadmap — noted as natural extensions if the use case arises:

- Solfège variant: "Do, Re, Mi" instead of letter names
- Italian / French / other-language variant: "Do quattro" / "Do quatre"
- Just-pitch-class variant: notes only, no octave (more compact, but loses positional verification)
- Different voice schemes (more layers, different cultural mix, child voices for higher octaves)
- DecentSampler version for student delivery in a free plugin

## Palace Connections

- **[[Generative Sample Libraries]]** — parent project; Phase 1 deliverable; the project's Phase 2 hard gates were motivated by this build's lesson
- **[[Substrate Skill]]** — Stage as Alignment Confidence section cites this build as the canonical case for the AI-polish trap and the audition gate
- **[[Modes of Collaboration]]** — concrete instance of the Build Session mode, including its iteration deficit when the audition step is skipped
- **[[Four Pillars]]** — a teaching keyboard naming itself as it plays sits inside the autodidact thread (a student could learn note names by ear from this instrument)
- **[[Project Stewardship System]]** — the recursive-stage-mismatch evidence: project was `growing`-stage, deliverable was `seed`-stage, alignment skipped at the deliverable level

## Open Questions

- Does the SFZ instrument feel useful for actual learning (e.g., a student naming notes by ear), or is it a curiosity?
- Should we ship a DecentSampler version for student use (Phase 4 of the parent project)?
- Is there value in a "prove-the-pipeline" instrument variant for each new source type the parent project adds (one for local-WAV-folder, one for AI-sub-agent, etc.) — making each Phase 3 sub-phase its own audible proof?
