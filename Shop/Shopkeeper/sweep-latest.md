---
title: sweep-latest
born: 2026-06-23
links:
  - { target: "[[Shopkeeper]]", type: connects-to, label: sweep-record-for }
forward_vector: "I hold the most recent Shopkeeper discovery sweep, overwritten each run; I want to keep surfacing the worthy few for Loudon's attention."
---

# Shopkeeper — Latest Sweep

**Run:** 2026-09-12, morning steward cadence (shadow). Overwritten each run. (Prior run: 2026-06-23 — long gap, no runs between.)

**One-line:** Pending commission was already executed last run (Image-to-3D Smith stub, still awaiting Loudon's four decisions — see below). Discovery sweep found one real candidate: **AuK** (Tencent), a unified speech-generation-and-editing model — probed two instruction types, both landed cleanly. Not ready to promote to a Specialist yet; needs a second pass.

---

## Commission status (checked first, per protocol)

`next-run-commission.md` shows **Status: EXECUTED 2026-06-23.** Nothing to run this cycle. Reminder — Loudon's five decisions from that run are still open (see `Shop/Shopkeeper/probes/2026-06-23-image-to-3d-shootout/comparison-report.md` and the 2026-06-23 sweep log in git history): approve/revise the Image-to-3D Smith stub, confirm Hi3DGen vs Hunyuan3D-2 as primary, decide on TripoSplat's own entry, designate a first real job, and read licenses. Not re-litigating; just flagging that this file can be deleted once he's reviewed, per its own note.

## Discovery sweep

### Candidate: AuK (tencent/AuK) — worth a second look, not yet a Specialist

Unified speech generation + instruction-guided editing (content, paralinguistic, acoustic, enhancement/separation) from one natural-language interface. 212-upvote paper (arXiv 2609.08936), trending 2026-09-08. Full probe: `Shop/Shopkeeper/probes/2026-09-12-auk/probe-report.md`.

**What I actually tried (not just read the README):**
- Generated a real source clip locally (`say` on macOS, 2.36s).
- Leg 1: instructed it to whisper the line → succeeded, duration preserved as expected for a paralinguistic edit.
- Leg 2: instructed "twice as fast" → output landed at exactly 1.18s, half the source. That's the evidence that convinced me — a quantitative instruction followed precisely, first try, no cherry-picking (only two calls made total).

**Why it's a real gap:** the Roster has Kokoro for TTS but nothing that edits *existing* speech by instruction — no home for "retime this line," "make it a whisper," "fix the emotion" in post-production narration work.

**Why I'm not proposing a stub yet:** two legs isn't the full picture — content-editing (word swap) and enhancement/separation are untested, and I haven't read the license. Recommend a second probe pass before any deposit decision, same discipline as the Image-to-3D shoot-out.

### Triaged out (trending scan)

- **Trending this cycle was heavily NSFW-LoRA spam** (custom Wan2.2/MiniMax-H3 clone Spaces with crude titles) — noting this because it's a real shift in the Spaces trending signal, not a Roster gap. Filtered out entirely; nothing there for the Shop.
- **YuE2-3B** (m-a-p) — long-form music generation, successor to YuE (already known/logged). Not a new door; the Shop's music-gen gap isn't stocked yet but this doesn't change the calculus from prior sweeps. Hold.
- **Wan2.2 / LTX-2.5 / MiniMax-H3** — image/text-to-video, same lane flagged 2026-06-23 as needing mac-side GPU probing. Unchanged; still holding for mac-side session.
- **Marigold V2** (monocular depth via diffusion transformers) — noticed because `GenAI Camera/` has active depth/pose work in progress (untracked keypoints/composite files in the working tree). Didn't probe — out of scope for a discovery sweep to touch an active project's files; flagging as a "might be worth Loudon's own look" rather than a Shop candidate.
- 3D-representations-guide, HF Viewer, Microduck sim — educational/robotics demos, no Shop-relevant door.

### Roster maintenance (light pass)

- No new status drift found. Stable Audio 3 flag from 2026-06-23 still open (dated gotcha not yet added to [[Stable Audio Open]] — small task, doing it now would be scope creep on a discovery sweep; leaving it named here so it doesn't get lost twice).
- Never-run test suites: unchanged, standing gap (Maker's own test plan still TODO).

---

## Run accounting

**Token/cost budget:** HF MCP scan (cheap) + one Space probed, 2 anonymous Gradio calls, local `say` for the test clip. No GPU, no paid tier. In line with "discovery should cost a fraction of a brief."

**Files written this run:**
- `Shop/Shopkeeper/probes/2026-09-12-auk/probe-report.md`
- `Shop/Shopkeeper/probes/2026-09-12-auk/{source,whisper_edit,fast_edit}.wav`
- `Shop/Shopkeeper/sweep-latest.md` (this file)
- TRICKSTER board note (see below)
