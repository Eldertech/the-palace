---
title: sweep-latest
born: 2026-06-23
links:
  - { target: "[[Shopkeeper]]", type: connects-to, label: sweep-record-for }
forward_vector: "I hold the most recent Shopkeeper discovery sweep, overwritten each run; I want to keep surfacing the worthy few for Loudon's attention."
---

# Shopkeeper — Latest Sweep

**Run:** 2026-09-15, morning steward cadence (shadow). Overwritten each run. (Prior run: 2026-09-12.)

**One-line:** No pending commission this cycle (the Image-to-3D commission finished 2026-06-23; still awaiting Loudon's decisions from that run, unchanged). Closed the loop on last sweep's open item: **AuK (Tencent)** now has all three edit types confirmed with objective evidence and a clean MIT license read. **Recommending it for a stub-level Specialist entry** — bringing the dossier, not depositing it myself.

---

## Commission status (checked first, per protocol)

`next-run-commission.md` unchanged: **Status: EXECUTED 2026-06-23.** Nothing to run this cycle. Loudon's five decisions from that run are still open (Image-to-3D Smith stub review, Hi3DGen vs Hunyuan3D-2, TripoSplat's own entry, first real job, license read) — not re-litigating, flagging again so it doesn't get lost.

## Discovery sweep

### Candidate: AuK (tencent/AuK) — recommend for stub deposit

Second pass on the candidate flagged 2026-09-12. Full probe: `Shop/Shopkeeper/probes/2026-09-12-auk/probe-report.md`.

**What changed this pass:**
- Ran the content-editing leg left untested last time — instructed a word swap ("fox" → "wolf") on the same source clip, explicit duration (the Space requires one with Prompt Enhancer off, confirmed by a first hard error that matched the README's documented behavior exactly).
- **Verified by transcript, not just duration** — ran `whisper --model tiny` locally (free, no GPU) on the output: *"The quick-brown wolf jumps over the lazy dog."* Exact swap, everything else untouched. This is stronger evidence than the first pass's duration-only checks (which only proved timing, not content).
- **Read the license**: MIT, plain, no community-license catch. Clear for Piece-tier or published use.

**Why it clears the bar now:** three distinct edit types (paralinguistic, acoustic, content) each confirmed by objective evidence across two sessions, anonymous and tokenless, clean license. Fills a real Roster gap — Kokoro does TTS, nothing edits *existing* speech by instruction (retime a line, whisper a phrase, fix a word) for post-production narration work.

**What's still open** (doesn't block a stub, would matter before a real brief): enhancement/separation leg untested; speaker-identity fidelity unconfirmed by ear or metric; `AuK-Flash` (4.5x faster distilled variant) untried.

**My read:** I'd bet a real Sketch-tier post-production brief on this today. See the candidate dossier below and the board note for Loudon's call.

### New trending scan (HF Spaces + papers, this cycle)

- **Viggle-Animate** (Viggle) — puts a character still into a driving video via 4-step repaint-and-render, no pose/segmentation/masks. Genuinely interesting motion-domain capability, but **not probed**: the model needs ZeroGPU `xlarge` (96GB VAT) and the Space's own README says a free account's day "does not go far here" — PRO gets only 40 min of it. No honest cheap probe exists on the anonymous tier. Flagging as a mac-handoff-or-PRO candidate for a future pass, same as the Wan2.2/LTX-2.5/MiniMax-H3 video lane already holding since 2026-06-23.
- **H3 Acceleration Arena**, **Qwen-Image-Edit LoRA Spaces**, **AI Notes**, **Fruit Fly Simulation**, **MiniCPM5-2B WebGPU Pi** — scanned, none open a Shop-relevant door (comparison tooling, note-taking, tech demos, coding agent). Composted.
- **Trending papers** this cycle skew heavily agentic/LLM-infrastructure (Atria Dawn, ZGCM-1, RSIAgent, Apodex) — outside the Shop's sound/image/motion/interactive scope, not evaluated as Shop candidates.
- **YuE2-3B, Wan2.2/LTX-2.5/MiniMax-H3, Marigold V2, NSFW-LoRA trending spam** — all unchanged from 2026-09-12's read; holding, no new information.

### Roster maintenance (light pass)

- No new status drift found.
- Stable Audio 3 dated-gotcha flag from 2026-06-23 still open — small task, still named here rather than actioned, so it isn't lost twice.
- Never-run test suites: unchanged, standing gap.

---

## Run accounting

**Token/cost budget:** HF MCP trending scan (cheap) + 1 Gradio call on an already-probed Space + local `whisper --tiny` transcription (free, CPU, no GPU). No new GPU spend, no paid tier. In line with "discovery should cost a fraction of a brief."

**Files written this run:**
- `Shop/Shopkeeper/probes/2026-09-12-auk/probe-report.md` (appended second-pass section)
- `Shop/Shopkeeper/probes/2026-09-12-auk/word_swap_edit.wav`
- `Shop/Shopkeeper/sweep-latest.md` (this file)
- TRICKSTER board note (see below)
