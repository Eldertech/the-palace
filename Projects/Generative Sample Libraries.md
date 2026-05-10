---
title: "Generative Sample Libraries"
type: project
pillars: [creation, tools, philosophy]
status: active
born: 2026-04
last_activated: 2026-05
activation_count: 3
stage: growing
confidence: working
energy: high
links:
  - target: "[[Crystal Synthesizer]]"
    type: emerged-from
    label: crystallized-from
  - target: "[[Generative Audio Devices]]"
    type: couples-with
    label: eventual-convergence
  - target: "[[Generative Preset Development]]"
    type: couples-with
    label: content-meets-configuration
  - target: "[[Generative Wavetable Libraries]]"
    type: spawned
    label: split-off
  - target: "[[Talking Keyboard]]"
    type: spawned
    label: phase-1-pilot
  - target: "[[Phoneme Choir]]"
    type: spawned
    label: phase-1.x-percussive-pilot
  - target: "[[Substrate Skill]]"
    type: connects-to
    label: stage-conditional-posture-source
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: stage-mismatch-case-study
  - target: "[[Retrospective Delay]]"
    type: connects-to
  - target: "[[Shepard Tone Synthesizer]]"
    type: deepens
    label: timbral-source
  - target: "[[Neural Granular Synthesis]]"
    type: connects-to
  - target: "[[Modes of Collaboration]]"
    type: connects-to
    label: interview-as-mode
  - target: "[[Four Pillars]]"
    type: enables
    label: pedagogical-scaffold
forward_vector: "I will become a chat-driven generator of multisampled instruments — Claude conducts the interview, draws audio from any source (palace synthesis, the web, AI sub-agents), and renders a playable sample library in any open sampler format requested."
---

# Generative Sample Libraries

A development plan for a chat-driven pipeline that turns a conversation into a playable, deployment-ready sampled instrument. The user describes the instrument they want; Claude conducts the interview to gather the choices that matter (source, range, velocity layers, destination format); Claude renders the result.

This project runs parallel to [[Generative Audio Devices]] and anticipates eventual convergence: the generative devices project builds the instrument shells; this project generates the sonic content that fills them. Wavetable equivalents live in [[Generative Wavetable Libraries]], which split off from this entry on 2026-05-02 — same philosophical backbone (palace synthesis becomes deployable artifact), different format families and tooling.

---

## Sources

The pipeline is source-agnostic. Any audio that can be brought into a Python process is fair game:

- **Palace synthesis** — the original source, born from the [[Crystal Synthesizer]] prototyping. Any palace synthesis function (`synthesize_crystal`, `shepard_partial_stack`, neural granular generators) can be called per-note and rendered into a multisample.
- **Local audio** — folders of WAV / FLAC / OGG files the user already has. Filename heuristics or pitch detection map source files onto MIDI notes.
- **Web libraries** — Creative Commons sources like freesound.org packs, with explicit user permission for downloads.
- **AI audio sub-agents** — generative audio models (Stable Audio Open, MusicGen, AudioLDM2, Kokoro for spoken-word instruments, etc.) called per-note. The interview becomes iterative: candidate → critique → regenerate, until the sound is right, then multisample.

The sub-agent path is architecturally distinct: it is a Claude calling a specialist model inside a conversation, with the user steering at each iteration. It deserves its own design pass when we build it out in Phase 3.

---

## Industry Standards Brief — Sampled Instrument Formats

Sampled instrument formats divide cleanly into open and proprietary camps, with the open camp being the practical target for generated content.

### SFZ — The Universal Open Standard

SFZ is a plain-text format that maps WAV (or FLAC, OGG) files to keyboard regions, velocity layers, and articulation round-robins. A `.sfz` file is human-readable — you can open it in any text editor and see exactly what is mapped where. Because it is royalty-free and widely supported, SFZ is the primary target for generated sample libraries.

**What an SFZ file contains:**
- `<group>` and `<region>` blocks defining key ranges (`lokey`/`hikey`), velocity ranges (`lovel`/`hivel`), and the sample file path
- Envelope parameters (attack, decay, sustain, release) as plain opcodes
- Loop points, pitch tuning, filter and amplifier modulation — all as text opcodes
- Round-robin sequencing (`seq_position`, `seq_length`) for realistic articulation

**Key SFZ opcodes for our work:**
```
<region> sample=ruby_C3.wav lokey=C3 hikey=B3 pitch_keycenter=C3
         loop_mode=loop_continuous loop_start=4096 loop_end=44100
         ampeg_attack=0.001 ampeg_decay=1.2 ampeg_sustain=80 ampeg_release=2.0
```

**SFZ players and hosts (all free or built-in):**
- sforzando (free, standalone + VST, by Plogue) — the reference implementation
- ARIA Engine (underlying sforzando)
- Surge XT — built-in SFZ support
- LinuxSampler — open source, high-performance
- sfizz — open source SFZ library (LGPLv2)
- Many DAWs natively: Reaper, Bitwig

**Verdict:** SFZ is our primary format target. It is text-based, meaning we generate it as a string from Python — no binary encoding needed. The audio files are plain WAV.

---

### DecentSampler — The Best Distribution Format

DecentSampler (`.dspreset` / `.dslibrary`) is the ideal format for distributing instruments to a general audience. The player is free across all platforms (VST, VST3, AU, AAX, CLAP, standalone) and the format is XML — fully human-readable and programmatically generatable.

A `.dslibrary` file is simply a ZIP containing the `.dspreset` XML and the WAV files. The format supports UI skinning, custom controls, and groups — you can ship a complete instrument with a designed interface.

**Key XML structure:**
```xml
<DecentSampler>
  <ui width="812" height="375">
    <tab name="main">
      <labeled-knob label="Attack" type="float" minValue="0" maxValue="4" value="0.01"/>
    </tab>
  </ui>
  <groups>
    <group>
      <sample path="Samples/ruby_C3.wav" rootNote="60" loNote="57" hiNote="62"
              loVel="0" hiVel="127" loopStart="4096" loopEnd="44100"/>
    </group>
  </groups>
</DecentSampler>
```

**Verdict:** DecentSampler is our secondary target and the format for instruments intended for student use. It pairs perfectly with the [[Four Pillars]] educational model — generate an instrument bank and students can load it immediately in a free plugin.

---

### SoundFont SF2 — Legacy but Universal

SF2 is a monolithic binary format (RIFF architecture) that packages audio and synthesis parameters in a single file. It is older (early 1990s, E-mu Systems) but universally supported — every DAW, hardware sampler, and mobile synth app reads SF2.

The format includes loop points, envelopes, LFOs, and MIDI key mapping baked in. It is more complex to generate (binary RIFF structure) but Python libraries exist for reading and writing it. ConvertWithMoss can convert between SFZ and SF2, so generating SFZ first and converting is a viable path.

**Verdict:** SF2 via conversion from SFZ, not direct generation — at least initially.

---

### Kontakt NKI — Proprietary, Not a Target

Kontakt NKI is Native Instruments' proprietary format. Authoring requires the paid full version of Kontakt. While Kontakt is the industry standard for professional sample libraries, it is not a viable target for programmatic generation without licensing commitments. We note it for completeness but do not target it.

---

### ConvertWithMoss — The Universal Converter

ConvertWithMoss (open source, Java, free) converts between: WAV folders, SFZ, SoundFont 2, NKI (read-only), Bitwig Multisample, Korg wavestate/modwave, and more. With Maschine support added in 2025. This tool means that generating SFZ correctly gives us a conversion path to nearly every other format.

---

## Capability Assessment

### What I Can Generate Now

**Audio:**
- WAV files from Python (numpy + scipy.io.wavfile): proven in [[Crystal Synthesizer]] prototyping
- Any bit depth (16/24/32-bit float), any sample rate
- Stereo or mono
- Mathematical synthesis of any complexity: additive partials, FM, physical models, filtered noise

**Sampled instrument metadata:**
- SFZ: it is plain text. I can generate a complete SFZ instrument as a Python string, covering key mapping, velocity layers, loop points, envelopes
- DecentSampler XML: standard XML generation, well-documented API
- SF2: via ConvertWithMoss conversion from SFZ (indirect path)

**Loop point detection:**
- Automatic zero-crossing loop point detection: findable in numpy, requires a small utility function
- Crossfade loop generation: math is straightforward, needs implementation

**External sources:**
- Local WAV folder reading: standard Python file handling
- Pitch detection for unlabeled samples: via librosa or aubio
- Calling local AI audio models from Python: via their respective packages (kokoro, audiocraft, etc.)

### What Requires Development

**SMPL chunk for WAV loop points:** Most professional samplers expect loop point data in the WAV file's `smpl` chunk, not just in the SFZ/DecentSampler XML. Writing a `smpl` chunk requires binary RIFF packing — doable in Python `struct`, needs implementation and testing.

**Automatic mapping heuristics:** Deciding how many samples across the keyboard (velocity layers, round-robins, key zones) and where to place them requires judgment. We need to build opinionated defaults and make them configurable — Phase 2 codifies this as the Interview skill.

**Quality testing pipeline:** Generating audio is one thing; generating audio that sounds right when stretched across the keyboard by a sampler requires attention to tuning (fundamental frequency accuracy), loop transparency, and timbral consistency across note ranges.

**The Interview as a real artifact:** What questions does Claude need to ask to produce a great instrument? The defaults and decision tree need codifying as a reusable skill rather than reinvented per session.

---

## Development Plan

### Phase 1 — End-to-End MVP: One Chat → One SFZ Instrument ✓ Complete (2026-05-02)

**Goal:** Prove the complete loop, smallest case. A conversation produces a working SFZ instrument loadable in sforzando.

**Pilot built:** [[Talking Keyboard]] — see that entry for the full artifact record. Source = Kokoro-ONNX TTS calling each MIDI note name as audio; four voices map to four velocity layers. Chosen because it eliminates the hardest bits (loop detection, tuning verification, pitch-shifting across keyboard) and gives instant audible verification — you press a note and hear its name spoken, so any mapping error is obvious in the first second.

**What was built:**
- Working directory at `_ops/sample-libraries/talking-keyboard/` (BUILD.md, generate.py, samples/, talking_keyboard.sfz, build-log.md)
- Python script using `kokoro-onnx` from Loudon's existing TTS venv at `/Users/loudonstearns/documents/TTS/`
- SFZ generator: one region per (note × velocity layer), 352 regions total
- Batch runner that rendered all 352 WAVs in ~2 minutes

**Output shipped:** `talking_keyboard.sfz` + `samples/` (352 WAV files, 24kHz mono, ~16 MB total). Loads in sforzando. Each note speaks its own name. Velocity selects voice.

**Phase 1 value (realized):** Proved the conversational interview pattern, the AI sub-agent source pattern (Claude orchestrating Kokoro running locally on Loudon's Mac), and SFZ generation in one minimal artifact. Subsequent phases generalize from here.

**Phase 1 lesson — what motivates Phase 2's hard gates:** The first full render shipped with a pronunciation bug — Kokoro pronounced the letter "A" as the indefinite article ("uh") rather than the letter name ("ay"). Neither code review nor spec review caught it; only listening did. The bug was inaudible to inspection but obvious in the first second of play. Loudon caught it after the full 352 files had already rendered, and fixed it in Claude Code by iterating the spelling through `"A"` → `"ay"` → `"eigh"` (the long-A diphthong). The lesson — *for sensory deliverables, audition is the only verification* — is now baked into Phase 2 as a hard gate, and into [[Substrate Skill]] § Stage as Alignment Confidence as a general rule. The full retrospective lives in [[Talking Keyboard]].

---

### Phase 2 — The Interview as a Real Artifact ✓ Complete (2026-05-04)

**Goal:** Codify the questions Claude asks, the defaults Claude proposes, and the gates that prevent jumping past sensory verification.

**Skill shipped:** [the Interview skill](obsidian://open?vault=The%20Palace&file=_ops/sample-libraries/skills/interview/SKILL.md) at `_ops/sample-libraries/skills/interview/SKILL.md` — eight sections covering when the skill triggers, the two non-negotiable rules, the question tree, the default presets, keyboard-spread heuristics, filename and folder conventions, and the graduation criterion for promotion to the user-skill space. Drafted by the GSL Steward (Stage A pilot of [[Project Stewardship System]]) across four cycles between 2026-05-03 and 2026-05-04: cycle 1 settled the home, cycle 2 drafted the outline, cycle 3 filled in the section bodies, cycle 4 re-issued the audition request after the BBS reset, cycle 5 deposited Phase 2 closure back to this page after Loudon granted option (a) on `gsl-steward-005`.

**Promotion criterion (carried into Phase 3):** the skill stays project-local until Phase 3 validates the question tree against at least one non-Kokoro source — palace synthesis, a local WAV folder, or an AI audio sub-agent that isn't TTS. Graduation moves the file to `/skills/sample-library-interview/SKILL.md` so it auto-loads on every sample-library task.

**Hard gates the Interview enforces (not optional, not suggestions):**

1. **Convention agreement before any rendering.** Before the first audio file is written, the interview produces a *sample of the output* — one filename, one path layout, one regions-block of SFZ — and gets explicit user yes-or-tweak. The interview is responsible for surfacing conventions, not assuming them. Filename schemes, sharps-vs-flats, voice assignment names, output paths — all decided up front, in writing, with visible defaults that the user can override.

2. **Audition cycle before full batch.** The interview ends with: render the smallest unit that exercises every voice, source, and parameter combination. Pause. Wait for explicit user "good" or "fix this." Only after acceptance does the full batch proceed. This is not a courtesy — it is the only verification path for sensory deliverables (TTS pronunciation, timbral character, motion easing, anything where correctness is experienced rather than inspected).

**Why both gates are mandatory:** The Phase 1 Talking Keyboard build (May 2026) demonstrated the cost. We had a working test mode that produced four valid WAVs — but we treated *files exist* as *files are right* and committed to the full 352-file batch without auditioning the test output. Kokoro pronounced the letter "A" as the indefinite article ("uh") rather than the letter name; the bug was inaudible to code review and invisible to spec review, but obvious in the first second of listening. Only sensory verification catches sensory bugs. The audition cycle exists specifically to make this catch automatic. See also [[Substrate Skill]] § Stage as Alignment Confidence for the underlying principle.

**Why this is Phase 2 and not later:** Without it, the interview reinvents itself every session and Claude's questions drift in quality. Codifying early means the next instrument benefits from everything learned in Phase 1. This is also where the [[Modes of Collaboration]] entry's open question — can modes be combined deliberately — gets a concrete test: the Build Session enters through the Interview.

---

### Phase 3 — Multi-Source

**Goal:** Source-agnostic generation across the four named source types.

**Front door:** every Phase 3 source first runs through [the Interview skill](obsidian://open?vault=The%20Palace&file=_ops/sample-libraries/skills/interview/SKILL.md) shipped in Phase 2. The question tree, the default presets, and the two hard gates are the mandatory entry path; Phase 3's per-source work is what the skill hands off to after both gates pass.

**What we build (one source per sub-phase, in priority order):**
- *Local WAV folder*: read filenames or detect pitch with librosa, map onto keyboard, generate SFZ. The simplest external source after palace synthesis.
- *Palace synthesis*: wire up the existing `Crystal Audio/crystal_synth.py` and any other palace synthesis modules, generalize the interview to ask about synthesis parameters.
- *AI audio sub-agents*: call generative audio models from inside the interview loop, with iterative critique-regenerate before committing to multisample.
- *Web libraries*: download with explicit user permission, then process as local audio.

The AI sub-agent path is the architecturally interesting one — it is where the conversational layer turns reflexive (Claude in dialogue with another model, mediated by Loudon's taste).

---

### Phase 4 — Multi-Destination

**Goal:** Render to whichever open sampler format the user names.

**What we build:**
- DecentSampler `.dspreset` / `.dslibrary` generator — XML + ZIP packaging
- SF2 conversion path via ConvertWithMoss (already a CLI; wrap as Python subprocess call)
- SMPL chunk writer for embedded loop points in WAV
- Loop quality verifier (detect clicks, spectral discontinuities)
- Crossfade loop generator for tonal sources that don't loop cleanly

Kontakt NKI explicitly out of scope: proprietary format, requires paid licensing for authoring.

---

### Pipeline addition (2026-05-03, from the [[Phoneme Choir]] build) — Responsive-Onset Trim

A new step now sits between rendering and SFZ writing: **per-file onset detection + sample-offset opcode + click-suppression fade-in**. Motivation: TTS sources (and AI audio sub-agents generally) emit variable amounts of leading silence and breath per voice — Phoneme Choir's render saw onsets ranging from 23 ms to 218 ms across 352 files for the same word in different voices. Without per-file trim, the resulting instrument feels inconsistently sluggish, with no audible reason from the player's perspective.

The step:

1. **Onset detection** — first sample where 5 ms windowed RMS exceeds a threshold (default −30 dBFS for the body of the sound, not the breath).
2. **Sample offset** — SFZ `offset=N` set to (onset − cushion). Cushion may be negative (forward into the sound) when the source's transient is sharp enough to land directly on rather than just before.
3. **Click-suppression fade-in** — `ampeg_attack=0.003` (3 ms cosine fade) on every region. Smooths the discontinuity from starting mid-waveform.

This is now the default for every TTS-source build and a recommended default for any source with variable lead-in (AI audio sub-agents, web library samples with inconsistent edits). Reference implementation: `_ops/sample-libraries/phoneme-choir/generate.py` — `detect_onset_sample()`, `offset_with_cushion()`, and the SFZ writer's per-region `offset=` and `ampeg_attack=` opcodes. Open question carried forward in [[Phoneme Choir]]: should this become a reusable utility module (`responsive_onset.py`) imported by every GSL build, rather than copy-pasted inline?

---

### Phase 5 — Convergence with Generative Audio Devices (Future)

This phase is acknowledged but not planned. The [[Generative Audio Devices]] project will eventually build the plugin shells — the instruments that play back sample banks. The current project generates the content those shells will use. The convergence point: a single act of generation produces both the shell and its content; the instrument emerges whole.

**Keep separate until:** Phase 4 of this project is complete and the multi-format pipeline is real. At that point, revisit both projects for formal convergence planning.

---

## Format Priority Matrix

| Format | Generation Effort | Destinations |
|---|---|---|
| SFZ | Low (plain text) | sforzando, Surge XT, Reaper, Bitwig, sfizz |
| DecentSampler | Low (XML) | Free DS plugin (all DAWs) |
| SF2 | Medium (via ConvertWithMoss) | Universal — every DAW and hardware |
| Kontakt NKI | Not feasible | — |

Wavetable formats moved to [[Generative Wavetable Libraries]] on 2026-05-02.

---

## Palace Connections

- **[[Crystal Synthesizer]]** — first real palace-synthesis source the pipeline integrates with; phonon mode synthesis becomes the sample source
- **[[Shepard Tone Synthesizer]]** — Shepard tones become a perpetual-tone sustain instrument when multisampled
- **[[Neural Granular Synthesis]]** — neural synthesis audio becomes a granular sample bank
- **[[Generative Audio Devices]]** — eventual convergence: this project generates the content; that project generates the shells
- **[[Generative Wavetable Libraries]]** — sister project carrying the wavetable thread; same backbone, different format family
- **[[Talking Keyboard]]** — Phase 1 pilot; canonical case for the audition-cycle hard gate
- **[[Phoneme Choir]]** — Phase 1.x percussive pilot; canonical case for the responsive-onset pipeline step and for Kokoro's syllabification constraint
- **[[Modes of Collaboration]]** — the interview pattern in this project is itself a Mode of Collaboration; Phase 2 makes it durable
- **[[Four Pillars]]** — student-deployable instruments via DecentSampler align with the pedagogical scaffold

---

## Open Questions

- What is the minimum number of samples across the keyboard before a multisample instrument sounds natural? Depends on timbre consistency: more for sources whose timbre shifts strongly with pitch, fewer for sources whose timbre stretches well.
- For AI-audio sub-agents specifically: does Claude critique the candidate audio before regenerating, or does Loudon? Probably Loudon-led with Claude offering analysis. Worth testing both in Phase 3.
- When we generate sample libraries for student use, what is the right licensing model? Original synthesis is owned outright. Sampled or AI-generated content has more complex provenance.
- ~~Where does the Interview skill (Phase 2) live in the palace's skill ecosystem?~~ **Settled 2026-05-03:** project-local at `_ops/sample-libraries/skills/interview/SKILL.md`. Promotion to user-skill space deferred until Phase 3 multi-source validation (see Phase 2 § Home).
