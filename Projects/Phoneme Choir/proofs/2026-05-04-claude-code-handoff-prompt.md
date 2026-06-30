---
title: "Phoneme Choir — Claude Code handoff prompt"
type: proof
project: "[[Phoneme Choir]]"
date: 2026-05-04
medium: agent-prompt
target: "Claude Code session on Loudon's local machine"
links:
  - target: "[[Generative Sample Libraries]]"
    type: connects-to
  - target: "[[Talking Keyboard]]"
    type: connects-to---

# Claude Code handoff — render the Phoneme Choir Stage 0 audition

Paste this prompt into a Claude Code session at the palace root. Claude Code can drive local TTS models, write to the filesystem, and launch QuickLook / play audio for audition. Cowork can't render Kokoro or any other local TTS in its sandbox, so the build must happen in your environment.

---

## The prompt

> You are inside Loudon's palace at `/Users/loudonstearns/Documents/The Palace`. Read [[Phoneme Choir]] (`Projects/Phoneme Choir.md`) and its parent project [[Generative Sample Libraries]] (`Projects/Generative Sample Libraries.md`) before doing anything. Phoneme Choir is the canonical case for proving Kokoro's competence at sharp percussive transient utterances and for the per-file responsive-onset pipeline.
>
> **Goal of this session**: produce the Stage 0 audition artifact — the smallest sample bank that exercises every parameter of the percussive-onset pipeline, before committing to a full bank.
>
> **Constraints surfaced by [[Talking Keyboard]] retrospective (May 2026, 352-file pronunciation bug)**:
>
> 1. *Listen before batch.* Render the smallest unit that exercises every parameter. Do not commit to a full bank until the unit is auditioned.
> 2. *Pronunciation is verified by ear, not by the TTS metadata.* Kokoro will produce wrong phonemes silently. If the file is named `tk` and Kokoro pronounces it "tee kay" instead of the percussive cluster, the file is wrong.
> 3. *Filename scheme must be settled before files are written.* Re-naming 352 files after the fact was the cost. Lock the scheme first.
>
> **Audition unit (deliverable for this session)**: ten percussive utterances, each rendered at four velocity layers, totaling forty files. Choose ten phoneme types that exercise the dynamic range:
>
> - hard stops: `tk`, `pk`, `kt`
> - aspirated: `puh`, `tuh`, `kuh`
> - sibilants: `ts`, `psh`, `kshh`
> - one outlier: a vocalized consonant cluster of your choosing
>
> **Pipeline to build**:
>
> 1. Set up Kokoro (or whichever local TTS model is available — list options first; Loudon will pick) inside a Python venv. Document the Kokoro version in the audition output.
> 2. Settle filename scheme. Propose three options and ask Loudon to pick:
>    - `<phoneme>-<velocity>.wav` (e.g. `tk-pp.wav`)
>    - `<midi>-<phoneme>.wav` (e.g. `036-tk.wav`)
>    - `<phoneme>-<midi>-<velocity>.wav`
> 3. Render the 40 audition files. Save under `_ops/sample-libraries/phoneme-choir/audition-stage-0/`.
> 4. **Audition gate**: open one file per phoneme in QuickLook. Wait for Loudon's listen-and-confirm before continuing.
> 5. If audition passes, also render an inventory page: a single HTML file listing the 40 samples with embedded `<audio>` players, in a velocity × phoneme grid. Save next to the audition files.
>
> **What I want as output of this session**:
>
> - The audition stage-0 directory with 40 .wav files and one HTML inventory
> - A short post in the persistent BBS (`_ops/swarm/persistent/blackboard.jsonl`) using the spec-conformant schema, summarizing what was built and what the audition revealed
> - A note in [[Phoneme Choir]] under a new `## Stage 0 Audition` section recording the Kokoro version, the chosen filename scheme, and Loudon's audition feedback
>
> **What NOT to do**:
>
> - Do not render a full bank in this session. Audition first.
> - Do not pick a filename scheme without asking.
> - Do not skip the audition gate even if files "look right" by metadata.
> - Do not move on to per-file responsive-onset processing until the raw audition is accepted.
>
> Begin by listing local TTS options you can use on this machine, with the version of each, and present three filename scheme choices.

---

## Why this prompt is shaped this way

**It loads the project, then the lesson, then the constraint.** Phoneme Choir's whole job is to NOT repeat Talking Keyboard's pronunciation bug. The first three numbered constraints are the bug's lessons, named.

**The audition unit is small and specific.** Ten phonemes × four velocities = forty files. Small enough to listen to in one sitting. Diverse enough that any pipeline bug shows up.

**Three filename-scheme options, not free choice.** Forces a decision rather than letting the agent invent. Loudon's voice rule from the GSL pilot — *"three named options with named tradeoffs"* — applies here too.

**The audition gate is named explicitly.** Without it the agent will batch-render everything and proudly hand you the wrong thing.

**The output includes a BBS post and a page note.** Closes the documentation loop in the existing Stewardship pattern, so this session integrates with the rest of the system rather than producing a one-off folder.

## Skipped from this prompt (handle in a follow-up session)

- Per-file responsive-onset processing (the equalize-timing-via-variable-lead-in pipeline)
- The full 88-position phoneme bank
- Connection to a sampler format (Kontakt / EXS / SFZ)

These are downstream of the audition passing. Rushing past audition is exactly what produced the 352-file bug.
