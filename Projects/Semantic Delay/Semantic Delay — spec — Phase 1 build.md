---
title: Semantic Delay — spec — Phase 1 build
born: 2026-09-25
links:
  - target: "[[Semantic Delay]]"
    type: connects-to
    label: build-detail-for
forward_vector: "I hold the build detail for each move still ahead in Semantic Delay's plan, as it was agreed with Loudon on 2026-04-20, with the old stage numbers the code, tests and handoffs still use. The plan itself lives in the scroll; I hold only what a builder needs to do a move without re-deriving it."
---

# Semantic Delay — spec — Phase 1 build

The build detail for the moves in the plan on [[Semantic Delay — scroll]]. The plan says what comes next and in what order; this says how each move is built. The text of each move is the staged build agreed with Loudon on 2026-04-20, carried over unchanged from the entry except where a note says otherwise. The old stage numbers are kept here, and only here, because the code, the tests and the handoff files are named by them. Why the build is shaped this way (voice conversion first, two processes, the delay as the effect) stays in [[Semantic Delay]] § Phase 1 Plan, along with what the first stage found.

---

## Put the real model behind the helper
*Stage 1, the inference daemon. The steward split off the model wiring as "Stage 1.5".*

Wrap SoulX-Singer-SVC as a long-lived Python process. Load model once. Expose `convert(audio_bytes, sr, prompt_id, options) → audio_bytes`. Maintain registry of loaded prompt wavs with precomputed F0. Run RMVPE on target audio internally. Return at known SR (probably 24k). Local TCP, length-prefixed binary frames. This daemon *is* the VST's future backend — version the RPC from v0.1.

> Note: the daemon was built on a Unix domain socket rather than TCP, as [[Semantic Delay — Phase 1 Plan Review 2026-04-20]] proposed; TCP is held back for a daemon on another machine (`daemon/RPC-v0.1.md`). The contract, skeleton and conformance tests are built with the model stubbed out. Wiring the real model is the punchlist in `daemon/Stage 1.5 — Wire the Model — Mac handoff — 2026-06-08.md`.

## Let each echo follow the melody, or wander
*Stage 4, the rhythmic coupling layer. Code so far: `standalone/coupling.py`, `standalone/f0.py`.*

Use the original phrase's F0 contour as the target_f0 for each SVC call, with optional quantization toward user-supplied tempo / pitch grid. This is [[Kuramoto Coupling]] expressed concretely: the re-voiced tap tracks the original melody by default; relaxing the coupling coefficient lets F0 smooth, quantize, or drift.

## Build the first plugin
*Stage 5, the first VST prototype.*

Recommend **JUCE** (broadest DAW support, most mature). Stereo I/O. VAD + segmentation in audio thread (allocation-free). Lock-free ring buffer across thread boundary. Message thread ships phrases to daemon, receives converted audio. Scheduled playback buffer timed against `AudioPlayHead` + user-set delay. Parameters: delay time, feedback, dry/wet, reference-singer selector. Report plugin latency as **0**; don't try to hide the delay with PDC. Neutone SDK shares the right mental model but SoulX is too large / non-streaming for Neutone's constraints — use the pattern, not the SDK.

## Lock the echoes to the song's tempo
*Stage 6, DAW transport sync.*

Read host BPM and playhead. Align delay taps to musical time (dotted-eighth, quarter, half-bar, bar — classic dub). Sample-accurate scheduling.

## Package it
*Stage 7, the packaging decision.*

Three options, easiest → hardest: (a) user installs daemon separately (clean, worst UX); (b) bundle Python runtime with installer (2–5 GB, moderate effort, good UX); (c) ONNX-export model to C++ runtime (likely impractical for F5-family flow-matching today — research project, not an engineering step). Ship (a) first; revisit (b) if/when commercializing.

## Bring the words back
*Stage 8, the LLM transform re-enters. The start of Phase 2.*

Tap captured phrase → Whisper/Paraformer → LLM spirit transform → re-synthesize via SoulX-Singer **SVS** mode using original F0 contour as melody guide. SVC stays for "keep words, change voice" spirits; SVS returns for "change words, change voice" spirits. Full spirit pantheon is earned: each spirit is a routing choice between the two models with different text-transform logic upstream.

---

## Built ahead of the model

Two stages were built before the real model was wired, against the stubbed daemon. Their agreed text is kept here because the code is named by them.

- **Stage 2 — Standalone instrument.** Python GUI/CLI: open mic, run VAD for phrase segmentation, call daemon, play result after user-set delay. First moment the instrument is playable. No DAW yet. Iterate on segmentation feel and latency here, in Python, fast. *Built: `standalone/instrument.py`, `segmenter.py`, `delay_engine.py`, `audio_io.py`, tested by `test_stage2_offline.py`.*
- **Stage 3 — Multi-tap, multi-voice delay.** Extend Stage 2: N delay taps, each with its own reference singer, tap time, gain. Spirit pantheon becomes audible, not speculative. Write the mixing step allocation-free, block-based — it ports to C++ at Stage 5. *Wiring built: `standalone/demo_multi_voice_taps.py`. It becomes audible once the real model is in.*
