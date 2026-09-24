---
title: sweep-latest
born: 2026-06-23
links:
  - { target: "[[Shopkeeper]]", type: connects-to, label: sweep-record-for }
forward_vector: "I hold the most recent Shopkeeper discovery sweep, overwritten each run; I want to keep surfacing the worthy few for Loudon's attention."
---

# Shopkeeper — Latest Sweep

**Run:** 2026-09-24, morning steward cadence (shadow). Overwritten each run. (Prior run: 2026-09-15.)

**One-line:** No pending commission this cycle (unchanged since 2026-06-23). One real candidate this pass — **Qwen-Image-2.1** — but the probe hit a saturated anonymous queue twice; holding, not recommending, until it's actually verified. AuK's stub-deposit recommendation from 2026-09-15 is still open, unreviewed.

---

## Commission status (checked first, per protocol)

`next-run-commission.md` unchanged: **Status: EXECUTED 2026-06-23.** Nothing to run this cycle. Loudon's five decisions from that run, and the 2026-09-15 AuK stub-deposit recommendation, are still open — not re-litigating, flagging again so they don't get lost.

## Discovery sweep

### Candidate: Qwen-Image-2.1 (Alibaba/Qwen) — held, not verified

Released 2026-09-20, four days before this sweep. Unified text-to-image generation + instruction-based editing, 7B params, real alpha channel, up to 10 reference images, native 2K, day-zero ComfyUI/Diffusers support. If real, this is a recipe upgrade for the existing `[[Shop/ComfyUI]]` Specialist, not a new Roster entry — worth a look for exactly that reason.

**I did not verify it.** Two anonymous Gradio calls against the official Space, ~2 minutes apart, both hit `QueueError: Queue is full` — the Space's free tier is saturated (unsurprising for a 4-day-old, heavily covered release). No image generated, no claim checked. Full probe: `Shop/Shopkeeper/probes/2026-09-24-qwen-image-2.1/probe-report.md`.

**My read:** genuinely promising on paper, not dossier-worthy yet — I refuse to recommend a tool I haven't run. Two honest paths, neither spent this sweep: retry the anonymous Space once initial launch traffic settles, or (better, since the payoff is ComfyUI-native) pull it straight into the Mac's ComfyUI install on a future mac-handoff pass rather than fighting a free-tier queue.

### New trending scan (HF Spaces + papers, this cycle)

- **Qwen-Image-2.1** — see above, the only new signal this cycle worth a probe attempt.
- **MiniMax-H3-Turbo-LoRA, Z-Image-Turbo, Omni-Image-Editor, Wan2.2 14B fast preview** — all trending, all functionally unchanged from prior sweeps' reads (video/image gen already covered by existing Roster routes or already-held candidates). Composted.
- **Qwen-Image-Edit-2511 LoRA collections** — LoRA add-ons on the *previous* Qwen-Image generation, superseded by 2.1 itself; not evaluated separately.
- Google shipped six new Flow production tools (Mondo Sónico, CaptionCast, ThumbnailForge, others) 2026-09-23 and Adobe shipped in-timeline generative audio/video to Premiere 2026-09-08 — both proprietary, closed-platform, outside what the Shop stocks (open/tokenless-first). Noted, not candidates.
- **Trending papers** this cycle: no sound/image/motion/interactive standouts surfaced in the scan; general web search skewed toward the platform releases above rather than open research.

### Roster maintenance (light pass)

- No new status drift found.
- Stable Audio 3 dated-gotcha flag (open since 2026-06-23) still unactioned — small task, named again so it isn't lost twice.
- Never-run test suites: unchanged, standing gap.
- Viggle-Animate (flagged 2026-09-15, needs ZeroGPU xlarge, no honest free probe) — unchanged, still holding.

---

## Run accounting

**Token/cost budget:** one HF Hub search call + one hf_repo_details lookup (both free/cheap) + two anonymous Gradio calls that failed fast on queue saturation (no compute spent, no paid tier touched) + web search for release context. No GPU spend. In line with "discovery should cost a fraction of a brief."

**Files written this run:**
- `Shop/Shopkeeper/probes/2026-09-24-qwen-image-2.1/probe-report.md`
- `Shop/Shopkeeper/sweep-latest.md` (this file)
- TRICKSTER board note (see below)
