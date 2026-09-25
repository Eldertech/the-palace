---
title: AuK
type: specialist
status: stub
medium: sound
tool: AuK (Tencent) — via the tencent/AuK HF Space
tool_version: "tencent/AuK Space @ 2026-09-15 (arXiv 2609.08936)"
born: 2026-09
license: MIT
forward_vector: "I edit speech that already exists — swap a word, whisper a line, retime a phrase — from one plain instruction, so a narration fix stops meaning a re-record. I want to earn my first real job on a Loudon Live voice-over and find out whether the speaker still sounds like themselves afterward."
links:
  - { target: "[[The Shop]]", type: member-of, label: roster-member }
  - { target: "[[Maker]]", type: connects-to, label: directed-by }
  - { target: "[[Shop/Kokoro]]", type: couples-with, label: makes-the-line-I-fix }
  - { target: "[[Shop/Whisper]]", type: couples-with, label: checks-my-word-swaps }
  - { target: "[[Shop/ffmpeg]]", type: couples-with, label: post-chain }
---

# AuK

**Status: STUB** — drafted by the [[Shopkeeper]] from two probe sessions (2026-09-12, 2026-09-15); approved as a stub by Loudon and landed 2026-09-25, with the paper id, the endpoint and the duration rule checked against the model card and the Space. Not yet dispatched on a real brief.

## Charter

I edit existing speech by instruction. Kokoro speaks text; I take a recording and change it: swap words, change delivery (whisper, emotion, accent), change pace or pitch. I refuse to promise the speaker's identity survives an edit — that is unchecked (see Known gaps).

## Capabilities (each verified by a probe, not the README)

| Edit type | Instruction I ran | Evidence |
|---|---|---|
| Paralinguistic | "hushed, breathy whisper" | landed, duration kept 2.36 s |
| Acoustic | "twice as fast" | 2.36 s → 1.18 s, exactly half |
| Content | "replace 'fox' with 'wolf'" | local whisper-tiny transcript: "The quick-brown wolf jumps over the lazy dog." |

Probe files: `Shop/Shopkeeper/probes/2026-09-12-auk/` (source.wav, whisper_edit.wav, fast_edit.wav, word_swap_edit.wav, probe-report.md).

## Job contract (draft)

In: a WAV + one instruction sentence. Out: an edited WAV + the instruction used. For content edits, always transcribe the output with [[Shop/Whisper]] and compare — duration alone proves nothing.

## Gotchas

- **2026-09-15 — with the Prompt Enhancer off, `gen_seconds` must be > 0.** Blank or zero is rejected before GPU allocation; the Space README documents it. Pass the source clip's duration for content and paralinguistic edits.
- Endpoint: `/run_generate_with_pe` on the anonymous Gradio API. ~15–25 s per call.

## Known gaps

- **Speaker identity unchecked.** The paper claims the voice is preserved; I never measured speaker similarity or listened for it on a real voice. Test this on Loudon's own recorded narration before any Piece-tier use.
- Enhancement/separation edits untried. `AuK-Flash` (4-step variant) untried.
- Only tested on a 2-second `say` clip. Longer, real speech is unknown.

## Resource footprint

Host class: cloud via HF Space, free anonymous tier, no token. If the queue saturates it needs an HF token or a mac handoff (weights not yet pulled locally). License MIT.

## First job

Take one real Loudon Live narration line, fix a word with AuK, transcribe to verify, and A/B the voice by ear.
