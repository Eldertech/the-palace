---
title: "Semantic Delay"
type: project
pillars: [creation, tools, philosophy]
born: 2026-03
stage: growing
status: active
links:
  - target: "[[Kuramoto Coupling]]"
    type: couples-with
  - target: "[[Dub Lineage]]"
    type: emerged-from
  - target: "[[Boundary-Crossing Instruments]]"
    type: connects-to
  - target: "[[Frequency-Time Duality]]"
    type: mirrors
  - target: "[[Spinoza Conatus]]"
    type: deepens
  - target: "[[Semantic Delay — Phase 1 Plan Review 2026-04-20]]"
    type: connects-to
    label: research-pass
forward_vector: "I want to become a working live performance instrument, not just a speculative architecture. As of 2026-04-20, my immediate phase is the voice-swap delay: SoulX-Singer-SVC is the primitive (audio→audio singing voice conversion, no lyrics required, no LLM in the loop yet), and the target form factor is a VST3 plugin operating as a phrase-delay return effect inside a DAW. The architecture is a thin C++ plugin paired with an out-of-process Python inference daemon — the daemon's RPC surface is the stable contract that all subsequent work plugs into. Latency is musical, not monitoring: seconds of phrase-delay, not zero-latency monitoring. The LLM-driven semantic transform (Whisper → spirit → re-synthesis) returns in Phase 2, when SVS mode joins SVC mode and the spirit pantheon becomes a routing choice between two models with different text-transform logic upstream. The two-stage pool-then-select rhythmic coupling re-enters at Stage 4 of the Phase 1 plan, expressed as user-controllable F0 conditioning on the SVC call."
---

# Semantic Delay

Delay as transformation, not repetition. A live performance effect and VST plugin that intercepts vocal audio, transmogrifies the _meaning_ of the words through a neural language model, and returns it as synthesized speech—semantically mutated, rhythmically coupled, and delayed.

## Architecture (full vision, Phase 2)

Three-stage pipeline. This is the eventual full architecture — Phase 1 (see below) implements only the voice swap and skips the LLM transform entirely. The LLM rejoins the chain at Phase 2 / Stage 8 of the revised plan.

1. **Speech-to-text (Whisper)** → transcribes input audio in real-time
2. **Semantic transform (LLM)** → mutates meaning according to a spirit's mode
3. **Text-to-speech (Bark, XTTS, or Piper)** → re-synthesizes as audio with configurable voice character

The unit is a beat-up tape machine haunted by trickster spirits collected on their travels around the world. Each spirit is a radio button—a transformation mode with its own logic:

- **Anansi** (West African/Caribbean spider): rewrites narratives, shifts perspective, reveals hidden subtext
- **Eshu/Elegba** (Yoruba): intercepts at the crossroads; rewrites through mistranslation and miscommunication
- **Huehuecoyotl** (Aztec): god of music and dance; naturally embodies rhythmic coupling between speech and song
- **Duppy** (Jamaican/Caribbean): the ghost in the machine; haunts with memory of past recordings
- **Loki** (Norse): chaos and shapeshifting; inverts, parodies, subverts
- **Kitsune** (Japanese): illusion and misdirection; foxfire and sleight of meaning
- **Coyote** (Native American): foolish wisdom; makes profound sound ridiculous, ridiculous sound profound

## Rhythmic Coupling: Two-Stage Pool-Then-Select

The semantic delay respects the constraint of rhythm. When the input phrase "has a soul"—a syllable count, stress pattern, duration—we honor it in transformation:

**Stage A: Pool Generation**
Analyze input phrase's rhythmic profile (syllable count, stress distribution, temporal span). Generate a candidate pool of semantically valid alternatives that fit that same rhythmic envelope. As coupling relaxes, pool expands to include near-misses and syncopations—the system tolerates increasing rhythmic deviation.

**Stage B: Spirit Selection**
The activated spirit selects from the pool according to its semantic mode. This is [[Kuramoto Coupling]]: speech rhythm and musical meter as two oscillators phase-locking. The coupling strength is the constraint; the spirit is the selectivity function.

Huehuecoyotl is the natural voice for this mode—a spirit whose essence is the marriage of music and language, already dwelling in the space where rhythm and meaning become indistinguishable.

## Connotation Reverb Variant

Instead of discrete delays, run semantic transformation as a continuous smear—a reverb, but for meaning. Each "reflection" (each convolution tap) shifts slightly in emotional valence, abstraction, or semantic drift. A short "room" keeps words close to their original meaning; a long "hall" lets them drift into metaphor, abstraction, opposition, and oblivion.

## Lineage

This device belongs to the dub tradition: King Tubby excavated and remixed; Lee Scratch Perry at the Black Ark (burning the studio as a necromantic ritual). The Semantic Delay is archaeological, spiritual, and deliberately destructive in its transformation. It is not correction. It is haunting.

[[Spinoza Conatus]] animates the spirit selection—each spirit has its own impulse, its own striving-to-persist in transforming meaning according to its nature.

## Cross-Domain Resonance

- **Derrida's différance**: meaning perpetually deferred through infinite chains of signifiers
- **Burroughs' cut-up**: randomized recombination; the dissolution of authorial control
- **Alvin Lucier's "I Am Sitting in a Room"**: degradation through iterative playback; emergence through constraint
- **Neural Resonance Theory (Anirudh Patel)**: speech rhythm and musical meter as coupled oscillators
- **The speech-to-song illusion**: the boundary between language and music is permeable and context-dependent

## Technical Stack

### Phase 1 (current, 2026-04-20)
- **Core model**: [SoulX-Singer-SVC](https://huggingface.co/Soul-AILab/SoulX-Singer) — zero-shot singing voice conversion finetuned from SoulX-Singer (flow-matching, F5-TTS family, Apache-2.0). Audio-to-audio, no lyrics, no MIDI. Accepts target wav + target F0 (`.npy`, Hz floats, `0.0` for unvoiced) + prompt wav + prompt F0, returns converted wav.
- **F0 extraction**: RMVPE (bundled in `Soul-AILab/SoulX-Singer-Preprocess`).
- **Inference daemon**: Python, long-lived, loads model once, exposes `convert(audio, sr, prompt_id, options)` RPC over local TCP (length-prefixed binary frames). Maintains a registry of pre-warmed prompt wavs with cached F0.
- **Plugin host**: JUCE → VST3/AU. Audio callback is strictly fast-path: VAD, phrase segmentation, lock-free ring buffers, scheduled playback. Worker/message thread handles all daemon IPC. No PyTorch in plugin process.
- **Phrase segmentation**: webrtcvad or silero-vad.

### Phase 2 (deferred — LLM transform re-enters)
- **Transcription**: Whisper (en) / Paraformer (zh) — reused from SoulX preprocess bundle.
- **Semantic transform**: constrained LLM, spirit-specific system prompts.
- **Re-synthesis**: SoulX-Singer **SVS** mode (not SVC) — takes transformed lyrics + original F0 contour as melody guide + reference singer wav → returns sung audio with new words, preserved melody, new voice.
- **Rhythmic coupling (Kuramoto)**: realized as F0-contour conditioning + syllable-count / duration constraint on the LLM output so the pool-then-select architecture becomes a concrete data-shaping step, not a separate subsystem.

### Hard constraints inherited from the VST form factor
- **No GPU inference in the audio thread, ever.** Enforced by the two-process split.
- **Plugin reports 0 samples of latency to the DAW.** The delay is the effect — don't try to hide it with PDC.
- **Sample-rate conversion lives in the daemon**, so the plugin always sees host rate (44.1/48k); SoulX-Singer-SVC emits at model rate (24k, F5-TTS convention).

## The Naming Problem

The instrument's name is unsettled, and the unsettling itself is productive.

Two naming poles have emerged:

**"Semantic Delay"** is technically accurate and conveys function clearly. It tells a newcomer exactly what the device does: a delay effect that operates on meaning rather than on waveforms. The clarity is its strength and its limitation. The tone is academic, clinical—precise but without magnetism. It works well in documentation and technical communication but lacks the hooks that make a name stick in memory and culture.

**"Duppy Machine"** carries mythological weight and cultural resonance. It places the instrument squarely in the dub tradition—ghosts in the machine, King Tubby and Lee Scratch Perry's necromantic studio practices. It evokes trickster spirit and the full heritage of Caribbean sound magic. But it requires cultural knowledge to land. A listener unfamiliar with Jamaican folklore or dub history won't understand why a semantic transformation device is called a "machine haunted by a ghost." It is a hook that needs teaching before it works.

This is the classic tension: **accessibility vs. resonance**. The name that teaches needs to be learned. The name that teaches itself offers no depth.

But the ideal name operates on two levels simultaneously. Trickster names work this way—they seem playful or mysterious until you pull the thread and discover the mythology. The surface reading is accessible; the deep reading earns its depth for those who seek it. "Duppy Machine" could work this way if paired with a subtitle that makes the function clear: **"Duppy Machine: a semantic delay."** Or: **"Duppy: voice haunting through semantic transformation."**

Alternatively, the search itself is generative. Every candidate name reveals something about what the instrument is FOR:

- Names that emphasize **repetition with difference** (Echo, Phantom, Whisper) suggest the musical side—the rhythmic coupling and ghostly transformation.
- Names that emphasize **semantic transformation** (Mutator, Morphic, Transducer) appeal to the speech/meaning side.
- Names that emphasize **spirit/trickster** (Trickster, Shapeshifter, Crossroads) anchor in mythology and cultural tradition.
- Names that emphasize **haunting/presence** (Phantom, Specter, Echo) evoke the dub lineage and existential weight.

The naming choice is itself a choice about the instrument's primary audience and first affordance:

- Is this FOR musicians who want a rhythmically coupled effect in their DAW? → name emphasizes rhythm and delay
- Is this FOR vocalists and spoken-word artists? → name emphasizes transformation and voice
- Is this FOR people interested in AI-driven creative tools? → name emphasizes the semantic layer
- Is this FOR people steeped in dub and trickster philosophy? → name emphasizes spirit and lineage

Each choice is valid. The answer might not be a single name but a **design decision about which door to open first**.

## Phase 1 Plan — SVC + VST (2026-04-20)

This is the concrete near-term build plan, established in conversation with Loudon on 2026-04-20. Future Claude: pick up from wherever the most recent stage stands.

<!-- CLAUDE → LOUDON: A research pass against this plan (SVC landscape, architecture precedents, flow-matching latency numbers, prior art) lives at [[Semantic Delay — Phase 1 Plan Review 2026-04-20]]. It proposes five small edits to this section — Mac+VST3 scope, Stage 0 pass/fail threshold, Unix domain sockets instead of TCP, training-data license check, and a YingMusic-SVC / seed-vc bake-off as named contingency. Left for you to fold in. -->

### The decision to lead with SVC, not SVS

SoulX-Singer ships in two variants. The base model is **SVS** (singing voice synthesis): it takes lyrics + MIDI or lyrics + F0 contour + reference singer, and synthesizes sung audio. The preprocess chain for its input is heavy — vocal separation, dereverb, RMVPE, ASR (Paraformer / Parakeet), note transcription (ROSVOT), optional manual MIDI editing. **SVC** (released 2026-03-16, `model-svc.pt`, also at `Soul-AILab/SoulX-Singer`) is finetuned from the base and accepts audio-to-audio directly: target wav + target F0 + prompt wav + prompt F0 → converted wav. No lyrics required. No MIDI. No transcription. No phoneme alignment.

For the "keep the words, change the voice" affordance this project wants as Phase 1, SVC is the correct primitive. Lyrics transcription and MIDI extraction fully disappear from the critical path. They come back only in Phase 2 when the LLM transform rejoins and we need SVS mode to synthesize *new* lyrics on the same melody.

### The architectural forcing function: why two processes

A VST plugin lives inside a DAW's real-time audio callback. That callback runs every few milliseconds, must not block, cannot do GPU inference, cannot call Python, cannot do network I/O. SoulX-Singer-SVC is a flow-matching model in the F5-TTS size class — several hundred MB of weights, multi-step sampling, GPU-bound, seconds per phrase. It cannot live in the audio callback. There is no version of this architecture where model and callback share a process at the same latency budget.

So the system is always two pieces:

1. **Thin audio plugin** (JUCE / CLAP / iPlug2). Handles DAW contract: audio I/O, parameters, preset state, transport sync. Does fast local work only: VAD, phrase segmentation, lock-free ring buffers, scheduled playback of already-rendered audio.
2. **Out-of-process inference daemon** (Python, PyTorch, SoulX-Singer-SVC loaded once at startup). Plugin talks to it over local IPC.

Every subsequent decision is downstream of this split. Committing to it early means the daemon's RPC surface *is* the VST's backend — all pre-plugin work is directly reusable.

A consequence worth naming and not fighting: **in-plugin zero-latency monitoring is off the table with this model class.** The plugin is a phrase-delay return effect. Put it on a send, dial in a delay time in seconds, get back a voice-swapped repeat. This framing is musically honest and is exactly where Semantic Delay wanted to live anyway (the dub lineage was never about zero latency).

### Staged build

- **Stage 0 — SVC smoke test.** ✅ *Completed 2026-04-20 on M1 Max (36 GB unified memory).* Clone `github.com/Soul-AILab/SoulX-Singer`, run `bash example/infer_svc.sh` on bundled assets, then on Loudon's own singing with a chosen reference singer. Measure cold-load time, per-phrase wall-clock at 2/4/8s phrases on available GPU, quality across reference singers. Output: one number — wall-clock seconds per second of input audio. Everything else scales from that.

  **Stage 0 findings (2026-04-20):**
  - **Hardware:** M1 Max, 36 GB unified memory. Dev env: `~/miniconda3/envs/soulx` (Python 3.11), repo at `~/Documents/soulx/SoulX-Singer/`.
  - **Model loaded:** 698M parameters. Cold-load time: ~17 s on Apple Silicon NVMe.
  - **RTF (PyTorch 2.2.0, MPS):** 85 s wall-clock for 51.5 s audio → **RTF ≈ 1.65**. Tested again on PyTorch 2.11.0: RTF ≈ 1.77 (no improvement — DiT steps are the bottleneck, not STFT). Pinned back to 2.2.0.
  - **Against threshold:** RTF 1.65 exceeds the plan review's RTF ≤ 0.75 pass/fail line. M1 Max was not in the plan's estimate table; expected performance is ~20–30% below M2 Max (RTF 0.5–1.0), which makes RTF 1.65 roughly consistent with M1 Max hardware ceiling. The A/B bake-off threshold is technically triggered. However, RTF 1.65 on a 4 s phrase = ~6.5 s compute time — still musically workable for a phrase-delay set to ≥8 s. Quality check on the generated audio is the deciding gate before activating the A/B.
  - **MPS patches required (all applied, in repo):**
    1. F0 `.npy` arrays must be cast `.float()` before `.to("mps")` — MPS does not support float64.
    2. Vocoder pinned to CPU via `.cpu()` at the call site in `soulxsinger/models/soulxsinger_svc.py:330` — MPS does not support complex arithmetic (`1j * y` in the istFFT head).
    3. `PYTORCH_ENABLE_MPS_FALLBACK=1` required as env var — several ops still fall back to CPU without it.
  - **Quality:** Generated audio produced at `example/generated/music_svc/generated.wav`. Listening quality check pending — this is the next gate before Stage 1.
  - **Next action:** Listen to the generated output. If quality passes, proceed to Stage 1 (inference daemon) accepting ≥8 s as the honest minimum delay time. If quality is poor, activate YingMusic-SVC / seed-vc A/B bake-off per plan review contingency.
- **Stage 1 — Inference daemon.** Wrap SoulX-Singer-SVC as a long-lived Python process. Load model once. Expose `convert(audio_bytes, sr, prompt_id, options) → audio_bytes`. Maintain registry of loaded prompt wavs with precomputed F0. Run RMVPE on target audio internally. Return at known SR (probably 24k). Local TCP, length-prefixed binary frames. This daemon *is* the VST's future backend — version the RPC from v0.1.
- **Stage 2 — Standalone instrument.** Python GUI/CLI: open mic, run VAD for phrase segmentation, call daemon, play result after user-set delay. First moment the instrument is playable. No DAW yet. Iterate on segmentation feel and latency here, in Python, fast.
- **Stage 3 — Multi-tap, multi-voice delay.** Extend Stage 2: N delay taps, each with its own reference singer, tap time, gain. Spirit pantheon becomes audible, not speculative. Write the mixing step allocation-free, block-based — it ports to C++ at Stage 5.
- **Stage 4 — Rhythmic coupling layer.** Use the original phrase's F0 contour as the target_f0 for each SVC call, with optional quantization toward user-supplied tempo / pitch grid. This is [[Kuramoto Coupling]] expressed concretely: the re-voiced tap tracks the original melody by default; relaxing the coupling coefficient lets F0 smooth, quantize, or drift.
- **Stage 5 — First VST prototype.** Recommend **JUCE** (broadest DAW support, most mature). Stereo I/O. VAD + segmentation in audio thread (allocation-free). Lock-free ring buffer across thread boundary. Message thread ships phrases to daemon, receives converted audio. Scheduled playback buffer timed against `AudioPlayHead` + user-set delay. Parameters: delay time, feedback, dry/wet, reference-singer selector. Report plugin latency as **0**; don't try to hide the delay with PDC. Neutone SDK shares the right mental model but SoulX is too large / non-streaming for Neutone's constraints — use the pattern, not the SDK.
- **Stage 6 — DAW transport sync.** Read host BPM and playhead. Align delay taps to musical time (dotted-eighth, quarter, half-bar, bar — classic dub). Sample-accurate scheduling.
- **Stage 7 — Packaging decision.** Three options, easiest → hardest: (a) user installs daemon separately (clean, worst UX); (b) bundle Python runtime with installer (2–5 GB, moderate effort, good UX); (c) ONNX-export model to C++ runtime (likely impractical for F5-family flow-matching today — research project, not an engineering step). Ship (a) first; revisit (b) if/when commercializing.
- **Stage 8 — LLM transform re-enters.** Tap captured phrase → Whisper/Paraformer → LLM spirit transform → re-synthesize via SoulX-Singer **SVS** mode using original F0 contour as melody guide. SVC stays for "keep words, change voice" spirits; SVS returns for "change words, change voice" spirits. Full spirit pantheon is earned: each spirit is a routing choice between the two models with different text-transform logic upstream.

### Cross-cutting decisions named now so they don't bite later

- **Daemon RPC is the stable contract.** Version from v0.1. Don't let VST work and Python work drift.
- **Sample-rate policy.** Daemon outputs at host rate — all resampling inside the daemon, never the plugin.
- **Prompt assets are first-class.** Reference singer wavs are the instrument's palette. Daemon accepts them dynamically, caches F0, exposes them as an enumerated list to the plugin. This list is also where "spirits" get their voices.
- **No GPU inference in the audio thread, ever.** All async, all worker-thread, all lock-free queues across the boundary. This rule keeps the plugin from crashing Pro Tools during a session.

### Useful external references (verified 2026-04-20)

- SoulX-Singer model: https://huggingface.co/Soul-AILab/SoulX-Singer (weights include both `model.pt` for SVS and `model-svc.pt` for SVC)
- SoulX-Singer preprocessing models: https://huggingface.co/Soul-AILab/SoulX-Singer-Preprocess
- SoulX-Singer GitHub: https://github.com/Soul-AILab/SoulX-Singer
- Paper: https://arxiv.org/abs/2602.07803
- License: Apache-2.0
- F0 format in SVS melody mode: `"f0"` field in target metadata JSON, space-separated Hz floats, `0.0` = unvoiced
- F0 format in SVC mode: 1-D numpy `.npy` array, same Hz-with-0-unvoiced convention
- Model sample rate: 24 kHz (F5-TTS convention; verify at Stage 0)

### Immediate next action

~~Stage 0 smoke test~~ ✅ Complete — see Stage 0 findings above.

**Current:** Listen to `~/Documents/soulx/SoulX-Singer/example/generated/music_svc/generated.wav`. If quality passes, move to Stage 1 (inference daemon). If quality is poor, activate YingMusic-SVC / seed-vc A/B bake-off. Either way, the minimum honest delay time for Stage 5 is **≥8 s** given M1 Max RTF of 1.65.

## Status

Currently `active`. **Stage 0 complete as of 2026-04-20.** Awaiting quality check on generated audio before Stage 1.

Missing artifacts from foundational conversation (2026-03-06):

1. **Spirit Compendium** — deep cultural research on 12–15 trickster spirits with specific myths, archetypal resonances, and technical mappings to transform modes
2. **Technical Blueprint** — high-level DSP architecture with progressive lesson plan (Faust basics → rhythmic analysis → pool generation → coupling → spirit selection)

Both documents were generated in a prior session and are stored separately; location to be recovered.

The Technical Blueprint item above is partially superseded by the Phase 1 Plan section — that plan is the current concrete architecture. The Spirit Compendium item is unchanged and still outstanding.
