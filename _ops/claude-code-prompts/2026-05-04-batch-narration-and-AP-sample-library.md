---
title: "Claude Code batch — narrated catalogs + Action Potential sample library"
date: 2026-05-04
target: "Claude Code session at /Users/loudonstearns/Documents/The Palace"
projects:
  - "[[Crystal Synthesizer]]"
  - "[[Quantum Synthesizer]]"
  - "[[Portamento and Physical Pitch Modeling]]"
  - "[[Action Potential Oscillator]]"
  - "[[Generative Sample Libraries]]"
prerequisite: "Local TTS available (Kokoro preferred; alternative acceptable if documented)"
links:
  - target: "[[Phoneme Choir]]"
    type: connects-to
  - target: "[[Project Stewardship System]]"
    type: connects-to
  - target: "[[Talking Keyboard]]"
    type: connects-to---

# Claude Code batch handoff — four narration tasks + one sample library build

Cowork rendered the audio for these projects but cannot run Kokoro or any local TTS. Loudon's preference is Kokoro for consistency with [[Phoneme Choir]] and [[Talking Keyboard]]. This single Claude Code session handles all four narration tasks plus a generative sample library build.

---

## The prompt

> You are inside Loudon's palace at `/Users/loudonstearns/Documents/The Palace`. Read [[Generative Sample Libraries]] (`Projects/Generative Sample Libraries.md`) and [[Project Stewardship System]] (`Palace development/Project Stewardship System.md`) for the audition-gate discipline before starting. Then complete the five tasks below, in order.
>
> **Cross-cutting constraints (from the Talking Keyboard 352-file pronunciation bug)**:
>
> 1. *Listen before batch.* For any task with N renders, render ONE first. Stop. Open it in QuickLook. Confirm pronunciation by ear. THEN proceed to the rest.
> 2. *Filename schemes settled before files written.* Don't rename 50 files later.
> 3. *Default to Kokoro.* If unavailable, list alternatives and ask Loudon to pick before falling back.
>
> **Common setup**:
>
> Set up Kokoro in a Python venv at `_ops/tts/venv/`. Document the version. Confirm it's working with one test render of the phrase "calcite, ordinary index 1.486" before any of the project tasks.
>
> ---
>
> ### Task 1 — Crystal Synthesizer narrated catalog
>
> Read `Projects/Crystal Synthesizer.md` to understand the project. The existing audio proof (`Projects/Crystal Synthesizer/proofs/2026-05-04-calcite-vs-quartz.wav`) is just two unlabeled crystals. Loudon's request: *"a catalog of crystals all being narrated by an AI voice."*
>
> Render a catalog audio file with this structure, repeated for at least 6 crystals:
>
> 1. Spoken: "[Crystal name]. [Optical property summary]." (e.g., "Calcite. Ordinary index one point four eight six. Extraordinary one point six five eight. Strong birefringence.")
> 2. 0.5s pause
> 3. The crystal's audio rendering (4 seconds — copy the synthesis pattern from the existing proof, with the crystal's own n_o / n_e values)
> 4. 1s pause before next crystal
>
> Six crystals to include:
>
> | crystal | n_o | n_e | optical character |
> |---|---|---|---|
> | Calcite | 1.486 | 1.658 | strong negative birefringence |
> | Quartz | 1.544 | 1.553 | mild positive birefringence |
> | Sapphire | 1.768 | 1.760 | mild negative birefringence |
> | Tourmaline | 1.640 | 1.620 | strong dichroism |
> | Iceland spar | 1.486 | 1.658 | (calcite, but historically named — narrate the history) |
> | Beryl | 1.567 | 1.572 | mild positive |
>
> Save to `Projects/Crystal Synthesizer/proofs/2026-05-05-narrated-catalog.wav`.
>
> Audition gate: render the first crystal's full sequence (narration + audio + pause), confirm with Loudon, then complete the rest.
>
> ---
>
> ### Task 2 — Quantum Synthesizer narration
>
> The existing audio (`Projects/Quantum Synthesizer/proofs/2026-05-04-three-potentials.wav`) plays three potentials without context. Loudon's request: *"audio narration of what these are and how they relate to quantum synthesis."*
>
> Add narration BEFORE each potential. Three sequences:
>
> 1. Narration: "Quantum harmonic oscillator. Evenly spaced energy levels. Equal harmonic series." → existing audio of harmonic oscillator
> 2. Narration: "Square well potential. Energy proportional to n squared. Stretched, inharmonic." → existing audio of square well
> 3. Narration: "Coulomb-asymptotic. Energy levels converge. Compressed, almost linear." → existing audio of Coulomb potential
>
> Source the existing rendered audio from the v1 proof (it has all three potentials concatenated). Cut into three sections, prepend narration to each.
>
> Save to `Projects/Quantum Synthesizer/proofs/2026-05-05-narrated-three-potentials.wav`.
>
> ---
>
> ### Task 3 — Portamento narration
>
> The existing audio (`Projects/Portamento and Physical Pitch Modeling/proofs/2026-05-04-three-glides.wav`) plays three glides without context. Loudon's request: *"hear this with an AI narration, simply a few words."*
>
> Add SHORT narration before each glide:
>
> 1. "Linear glide. Toy model." → existing linear glide
> 2. "Overdamped. Slide whistle." → existing overdamped glide
> 3. "Underdamped. Voice and string." → existing underdamped glide
>
> Save to `Projects/Portamento and Physical Pitch Modeling/proofs/2026-05-05-narrated-glides.wav`.
>
> ---
>
> ### Task 4 — Action Potential Oscillator → Generative Sample Library (the big one)
>
> Loudon's request after listening to the action potential oscillator audio: *"This is a great oscillator, lets build a Generative Sampled library out of it."*
>
> Read `Projects/Action Potential Oscillator/proofs/2026-05-04-spike-oscillator.wav` and the source script (look in the proofs directory for the .py file or reconstruct from the FitzHugh-Nagumo math in the project entry).
>
> Build a multisampled instrument:
>
> - **Pitch range**: full 88-note piano range. Render every note (or every 4 notes with sampler interpolation — your call, document the choice).
> - **Velocity layers**: 4 layers, each driven by a different value of the FitzHugh-Nagumo input current I. Soft (I=0.45, near the bifurcation) → loud (I=0.85, fully spiking with overshoot).
> - **Length**: each sample = 4 seconds with a clean release tail.
> - **Filename scheme**: pick from these three options and ask Loudon before committing:
>   - `apo-<midi>-<vel>.wav` (e.g. `apo-060-mf.wav`)
>   - `<midi>_<vel>.wav` (e.g. `060_mf.wav`)
>   - `apo_n<midi>_v<vel>.wav` (verbose)
> - **Output format**: render to .wav. Then generate an SFZ file describing the mapping. SFZ is open and works in Sforzando, Decent Sampler, Logic, Ableton (via plugin), and many DAWs.
>
> Audition gate (mandatory): render velocity layer 3 of MIDI 60 first. Stop. Confirm with Loudon. THEN render the rest.
>
> Save to `_ops/sample-libraries/action-potential-oscillator/` with subdirectories `samples/` and `metadata/` (for the SFZ + manifest).
>
> Post a BBS message in `_ops/swarm/persistent/blackboard.jsonl` summarizing what was built and what the audition revealed.
>
> Update `Projects/Action Potential Oscillator.md` with a new `## Generative Sample Library v0` section recording the choices made, the audition outcome, and the path to the library.
>
> ---
>
> ### What I want as output of this whole session
>
> 1. Three narrated catalog files (Crystal, Quantum, Portamento)
> 2. One sample library (Action Potential, ~88 × 4 = 352 files plus SFZ + manifest)
> 3. One BBS post per task summarizing what happened
> 4. Page-edits to each project recording the proofs
>
> ### What NOT to do
>
> - Don't render full batches without auditioning first
> - Don't pick filename schemes without asking
> - Don't skip the page-edit / BBS post — those close the loop
> - If Kokoro hits a pronunciation bug (e.g. "n_o" pronounced as "no" instead of "n sub o"), STOP and ask Loudon how to handle. Use phonetic spellings (`en oh`, `en ee`) rather than mathematical notation.
>
> Begin by setting up Kokoro and rendering one test phrase. Report success/failure before proceeding to Task 1.

---

## Why this prompt is shaped this way

**It is one prompt, not five.** All four narration tasks share the same Kokoro setup, voice, audition discipline, and BBS-post pattern. Repeating the boilerplate four times would be 4× the cost. Bundling lets the agent reuse the venv and TTS warm-up.

**Audition gate is named at every task boundary.** The Talking Keyboard pronunciation bug shipped 352 files because the audition was implicit. Here it's explicit: render one, stop, confirm, continue.

**Filename scheme is "ask, don't invent."** Same lesson, same fix.

**Mathematical notation is flagged.** Kokoro will mispronounce "n_o" as "no" instead of "n sub o" or "en oh." This bug specifically caused real friction in past sessions. The prompt names the trap.

**Sample library is its own audition gate.** 352 files is precisely the size of the Talking Keyboard pronunciation bug. The audition for this batch must be explicit.

## What's intentionally NOT in this prompt

- Detailed FitzHugh-Nagumo math — the agent can reconstruct from the project entry
- The exact crystal optical property formulas — the existing v1 script has them
- The SFZ format spec — the agent can fetch it from the SFZ project documentation

These are deferred because including them would inflate the prompt without reducing the agent's actual choices. The agent has a workspace and can read.
