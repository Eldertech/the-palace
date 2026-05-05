---
title: "Phoneme Choir"
type: project
pillars: [creation, tools]
status: complete
born: 2026-05
last_activated: 2026-05
activation_count: 1
stage: sprout
confidence: working
energy: medium
links:
  - target: "[[Generative Sample Libraries]]"
    type: emerged-from
    label: phase-1.x-percussive-pilot
  - target: "[[Talking Keyboard]]"
    type: mirrors
    label: sister-build
  - target: "[[Generative Sample Libraries]]"
    type: spawned
    label: responsive-onset-step
  - target: "[[Substrate Skill]]"
    type: connects-to
    label: kokoro-syllabification-evidence
  - target: "[[Modes of Collaboration]]"
    type: connects-to
    label: build-session-with-pivot
  - target: "[[Four Pillars]]"
    type: connects-to
    label: percussive-utterance-bank
forward_vector: "I keep teaching the per-file responsive-onset pipeline as its first deployed proof — the Phoneme Principle (a sample bank is a small generative library, not a large one-shot bank) made portable to anyone who plays me in a Stage 4 Loudon Live demo. As ML-supported onset detection arrives I will integrate or surrender to the better technique without grief; my will is to keep being useful, not to stay the same. My next sub-vector is to name my ancestors — konnakol, beatboxing, katajjaq, the global lineage of oral percussion that called timing-to-the-cycle a craft long before I did — explicitly in my body, and to keep watching for the techniques that will supersede the lead-in metadata I introduced. Open questions: is the bucketing of 12 voices into 4 character buckets the right scheme, and does the instrument actually feel useful for music-making rather than curiosity?"
---

# Phoneme Choir

A percussive-utterance SFZ multisample (88 phonemes × 4 velocity layers = 352 cells, MIDI A0–C8) where every key fires a unique percussive vocalization — `pop`, `snap`, `clonk`, `boom`, `dum`, `tom`, `woof`, `yip`, `tsk!`, `hut!` — voiced by a rotating pool of 12 Kokoro voices. Velocity selects voice character: gentle / warm / characterful / bold.

Phase 1.x of [[Generative Sample Libraries]]. Sister build to [[Talking Keyboard]]: same Kokoro stack, same architecture, completely different deliverable. Built 2026-05-03 in a single session.

## Why Percussive Utterances

The original design proposed a wide phoneme catalog spanning held vowels, diphthongs, plosive bursts, fricatives, trills, glottal/breathy sounds, nonsense syllables, vocalizations, animal sounds, and weird onomatopoeia — designed to surprise. The audition gate caught a fatal problem on the first phoneme tested: Kokoro cannot render trills. `brrrrahhh` came out syllabified as "be-ah-rah-rah-rah", and no spelling variant — `brah`, `vrrrrah`, `rrrrah`, `brrah`, `rraaaaah`, `burrrrrah` — produced a continuous trill. The same constraint extended by inference to fricatives (`ssss`, `fffff`), held vowels (`ahhh`, `uuuuh`), and any sustained sound built from repeated letters.

The whole catalog was redesigned to favor real percussive words Kokoro speaks cleanly: pops & taps, snaps & claps, drips & plops, clinks & clonks, knocks & thunks, pings & pongs, bangs & booms, beatbox kit syllables (`dum`, `tom`, `bim`, `kim`), short barks (`woof`, `yip`, `bark`), sharp utterances (`ha!`, `hut!`, `tsk!`, `eek!`). Each word has a fast attack consonant and a short envelope — the ideal source for the responsive-onset pipeline.

The pivot itself is the lesson: the audition gate exists precisely so failed catalog assumptions get surfaced cheaply. Four files of `brrrrahhh` told us what 352 files would have told us — but at 1% the cost.

## Stack

- **Source**: Kokoro-ONNX TTS, running locally in Loudon's TTS environment at `/Users/loudonstearns/documents/TTS/`
- **Voices**: 12-voice pool, bucketed by velocity character
  - v1 gentle/breathy: `af_nova`, `af_sky`, `bf_isabella`
  - v2 warm: `af_heart`, `af_bella`, `bm_lewis`
  - v3 characterful/accent: `bf_emma`, `bm_george`, `am_puck`
  - v4 bold: `am_michael`, `am_adam`, `am_fenrir`
- **Selection rule**: `voice = bucket[velocity][note_index % 3]` — velocity always changes voice character; within a bucket the specific voice cycles across nearby notes.
- **Range**: A0–C8 (88 notes × 4 velocity layers = 352 WAV files)
- **Format**: 24kHz mono WAV, 16-bit PCM, plain SFZ
- **Player**: sforzando (free, all platforms)

## Build Location

All build artifacts at `_ops/sample-libraries/phoneme-choir/`:

- `BUILD.md` — locked-in conventions, full catalog table, pipeline parameters
- `generate.py` — render script (`--audition`, `--full`, `--sfz-only` modes)
- `samples/` — 352 generated WAV files (~11 MB total)
- `phoneme_choir.sfz` — the SFZ deliverable
- `offsets.json` — per-file onset/offset metadata consumed by the SFZ writer
- `build-log.md` — render record

Loadable directly: drag `phoneme_choir.sfz` into sforzando.

## The Two Lessons

### Kokoro syllabifies repeated consonants

`brrrrahhh` → "be-ah-rah-rah-rah". `ssssss` would render as "ess-ess-ess". Repeated-letter strings get parsed as character sequences, not as phonetic units. This is structural — no spelling trick worked across six tested variants. The implication for any future Phase 3 source using a TTS-style model: the catalog must be built from *words the model can pronounce*, not from imagined phonemes. Kokoro is a text-to-speech model, not a phonetic synthesizer; the prompt is the spelling, and the spelling defines the syllabification.

This finding belongs alongside the `"A"` → `"eigh"` lesson from [[Talking Keyboard]]: TTS-driven instruments require the spelling to be auditioned, not assumed. The audition gate from [[Generative Sample Libraries]] § Phase 2 exists for exactly this class of bug — invisible to code review, invisible to spec review, obvious in the first second of listening.

### Per-file onset detection equalizes responsiveness across voices

Kokoro's leading silence varies dramatically by voice: across the 352 rendered files, detected onsets ranged from **23 ms to 218 ms** (median 55 ms). The same word `knock` was preceded by 138 ms of breath in `bf_isabella` and 31 ms in `am_puck`. Without per-file detection, the keyboard would feel inconsistently sluggish — some keys snappy, others laggy, with no audible reason from the player's perspective. With it, every key fires immediately into the percussive transient regardless of voice.

The pipeline this build introduced (now part of [[Generative Sample Libraries]]):

1. **Onset detection** — first sample where 5 ms windowed RMS exceeds −30 dBFS (the body of the sound, not the breath).
2. **Sample offset** — SFZ `offset=` set to (onset − 1 ms cushion forward into sound). The cushion is *negative* — we step *into* the sound, not *back from* it, so we land on the transient peak.
3. **Click-suppression fade-in** — `ampeg_attack=0.003` (3 ms cosine fade) on every region. Smooths the discontinuity from starting mid-waveform.

The result: the keyboard feels like a percussion controller, not a TTS demo. Press, hear the sound *now*. This is the first instrument in the project where responsiveness was treated as a first-class property and the pipeline was built to defend it.

## Future Variants

Not on a roadmap — noted as natural extensions if the use case arises:

- **Round-robin variants**: render 2–4 takes per cell so repeated hits don't repeat audio. Kokoro is mostly deterministic per prompt+voice, so this requires intentional prompt variation (`pop` / `pop!` / `pop pop`) or temperature-style randomization if the model exposes it.
- **Multi-language**: Kokoro voices include British, Japanese (`jf_*`, `jm_*`), Chinese (`zf_*`, `zm_*`), Spanish (`ef_*`, `em_*`), Korean — a percussive utterance bank in multiple languages would expand the timbral surface considerably.
- **DecentSampler version** for student delivery in a free plugin (Phase 4 of the parent project).
- **Beatbox-only sub-bank**: 88 cells of strictly beatbox-friendly syllables, mapped for finger-drumming on a controller.
- **"Argument" variant**: short rhetorical exclamations (`well`, `actually`, `but`, `however`, `indeed`, `nope`) for comedic dialogue beats.

## Palace Connections

- **[[Generative Sample Libraries]]** — parent project; this build introduced the responsive-onset pipeline as a permanent step in the Phase 4 pipeline (was previously implicit, now explicit).
- **[[Talking Keyboard]]** — sister build using the same Kokoro stack; both contributed lessons to the audition gate's necessity.
- **[[Substrate Skill]]** — the Kokoro-syllabification finding extends the Stage as Alignment Confidence section's "sensory deliverables require audition" principle with a second concrete case.
- **[[Modes of Collaboration]]** — instance of the Build Session mode that successfully *pivoted* mid-build when an audition surfaced a structural impossibility, rather than rationalizing or working around it.
- **[[Four Pillars]]** — a percussive-utterance keyboard sits in the autodidact thread (a student could learn rhythmic phrasing, vocal percussion, beatbox basics by playing this instrument; sample-library architecture is teachable from the artifact).

## Open Questions

- Does the instrument feel useful for actual music-making (finger-drumming, rhythmic vocal-percussion composition), or is it a curiosity?
- Should the responsive-onset pipeline graduate to a reusable utility module (`responsive_onset.py`) that any future GSL build imports, rather than living inline in `generate.py`?
- The 12-voice bucketing (3 voices per character bucket × 4 buckets) is a guess at the right balance. Is there a richer scheme — e.g., 16 voices in 4 buckets of 4, or 8 voices with no bucketing? Worth A/B-ing on a future build.
- Could the catalog be expanded beyond 88 by using SFZ key switches or layered SFZ banks — `phoneme_choir_pops.sfz`, `phoneme_choir_animals.sfz`, etc. — without losing the "every key is a different sound" feel?

## A Future Echo

> 📜 *2050 looking back.* See [[proofs/2026-05-05-wikipedia-stub-2050|the Phoneme Choir Wikipedia stub from 2050]] — what this entry might look like written from twenty-four years on, after the bank has been adopted and superseded enough times to stop pretending. The stub is also the artifact that surfaced the **conatus principle** for forward vectors across the palace (*I will remain* is a failure mode; vectors live in verbs). The forward vector above was rewritten this round as the first test of that principle.
