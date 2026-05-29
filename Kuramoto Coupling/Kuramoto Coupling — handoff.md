---
title: "Kuramoto Coupling — handoff"
born: 2026-05-26
links:
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: "handoff-for"
  - target: "[[The Shop]]"
    type: connects-to
    label: "round-1-closeout"
  - target: "[[Maker]]"
    type: connects-to
    label: "directs-the-arc"
forward_vector: "I carry the final Round 1 move on [[Kuramoto Coupling]] — the generative media Specialists and the Midjourney↔ComfyUI Comparison — across an instance boundary. Pick me up, then archive me. Round 1 is complete when I'm consumed."
session_thread: "Cowork session 2026-05-26 (evening) — drafted assuming ComfyUI + Stable Audio Open + SDXL are installed; to be reviewed/tweaked once the live install+polish session wraps."
---

# Handoff: Kuramoto Coupling — Round 1 close-out (generative media)

## Move

Close Round 1 by giving first jobs to the generative media Specialists — ComfyUI, Stable Audio Open, Midjourney — on the Kuramoto arc, centered on the Midjourney↔ComfyUI Comparison. Assumes ComfyUI + Stable Audio Open + an SDXL checkpoint are installed.

## Why this move matters

The code-based and TTS Specialists are calibrated; the generative ones are the last gap, and they behave differently — aesthetic is entangled with the prompt and seed, not a parameter the Maker passes down. This move is also the Shop's single most-named test (cloud aesthetic ceiling vs. local palette control), the one that sharpens the Selection Heuristic "default to ComfyUI when in doubt." When this handoff is consumed, Round 1 is genuinely complete and the next horizon is Enrichment v2 wiring.

## Scope decisions (carry forward — Loudon's calls this session)

- **RNBO codebox~ smith and VCV Patch Generator are OUT.** Loudon is developing them on a separate, slower track precisely so their pace doesn't gate palace self-enrichment. Leave them `stub`. Do not pull them into this round.
- **Visual style is deliberately NOT being designed yet.** Use the de-facto Kuramoto palette (indigo `#6366F1` / amber `#F59E0B` / dark `#0B0B10`) as a *neutral default*, not a house style. The generic look is the correct state for a calibration phase. The `Style/Palace Base Palette.md` entry stays deferred until more artifacts accumulate — style emerges from evidence, not from premature locking.
- **The one guardrail that keeps "style later" cheap for generative Specialists:** log the full prompt + seed + model/checkpoint on every generative job (in the standards report AND the recipe). Code-based Specialists re-render for free on a palette swap; generative ones must be re-generated, so reproducibility is the only thing that makes a later style pass tractable. Treat all generative outputs here as disposable Sketches — do not over-invest in any single image.

## Current state (assumed post-install)

- ComfyUI `alive`, SDXL checkpoint present; Stable Audio Open `installed` (GPU). Both Mac-local by nature — they never ran in Cowork because the sandbox has no GPU; that's expected, not a gotcha.
- Midjourney is marked `alive` but `last_tested` is empty — it has **never actually run**. This handoff is its real first job.
- Round 1 to date: 9 Specialists alive/tested (Manim, p5.js, Kokoro, Matplotlib, Whisper, ffmpeg, Tone.js, Remotion, Mermaid). The narrated teaching-reel v2 polish committed just before this. Bundle holds: uncoupled clip, coupling explorer, sync-arriving animation, teaching reel, phenomena walk, narrations.

## Next move

1. **ComfyUI — first generative image** (if not already run during install shakedown). Step-3 natural-phenomena brief: *"fireflies synchronizing over a forest pond at dusk."* SDXL checkpoint, Kuramoto palette as neutral default, **fixed seed logged**. Sketch tier. Date gotchas (VRAM headroom, checkpoint path, sampler/steps/CFG), write a recipe with the full workflow JSON + seed.
2. **Midjourney — first job.** Same brief, cloud. Log the exact prompt, version/style params, and running credit total. The cloud half of the Comparison.
3. **Comparison Mode — the actual deliverable.** The Maker presents both with a *written recommendation*: does cloud aesthetic ceiling beat local palette control for palace editorial imagery, the reverse, or "both, in different briefs"? Comparison without a recommendation is just two images — the recommendation is the work, and it's what sharpens the Selection Heuristic.
4. **Stable Audio Open — first job.** Speculative brief: *"the sound of synchronization arriving"* — ~20s, scattered → coherent. This probes whether SAO can do narrative *arc* or only static texture. Promote `installed` → `alive`; date gotchas (model load, GPU mem, prompt adherence, duration control); recipe with prompt + seed.
5. **Embed** each accepted artifact into `Kuramoto Coupling.md` near the cross-domain-mirrors passage (fireflies / mycorrhizal / neuronal sync), per the Enrichment placement protocol. The SAO clip is a natural underlay for the phenomena-walk or the teaching reel's natural-phenomena segment.

## Calibrations from this session

- Mode (b) still — direct Maker briefs, not the BBS.
- Generative style is prompt-entangled, not a passed parameter — hence the log-prompt-seed-checkpoint discipline above.
- Resource rule: do **not** run two ComfyUI jobs in parallel, and do not run ComfyUI and Stable Audio Open simultaneously (both want the GPU). The Maker's entry already states the ComfyUI-parallel rule; extend it to SAO.
- Commits Mac-side. Clear stale git locks first: `rm -f .git/HEAD.lock .git/index.lock`.
- Whisper's chosen default model size from Track B carries forward — don't re-litigate it here.

## Gotchas to watch

- Does the Comparison produce a real recommendation, or just two outputs? The recommendation is the deliverable.
- Stable Audio Open duration/arc control — can you actually get "scattered → coherent," or only uniform texture? This is the open question the brief is designed to answer.
- ComfyUI / SAO GPU contention — serialize them.
- Midjourney credit consumption — report the running total when it crosses a meaningful threshold.

## Load these files first

Tier 1: `Kuramoto Coupling.md`, `Shop/Maker.md`, this handoff.
Tier 2: `Shop/ComfyUI.md`, `Shop/Midjourney.md`, `Shop/Stable Audio Open.md`.
Tier 3: `Enrichment.md` (placement protocol); the existing `phenomena-walk.mp4` and `round-1-teaching-reel.mp4` in the bundle (where the new media slots in).

## Fallback if installs are incomplete

If ComfyUI/SAO/SDXL aren't actually ready when this is picked up: run the Midjourney first job + the Comparison's cloud half, leave ComfyUI/SAO at their current status, and note the Comparison is half-done pending local install. Do not stall on it.

## Note to incoming Claude

RNBO/VCV are Loudon's parallel track — do not pull them in. Style is deliberately deferred; use the neutral Kuramoto palette and log prompts+seeds. After this handoff is consumed, Round 1 is complete; the next horizon is wiring the now-trusted Specialists into Enrichment v2 (the originating Cowork conversation holds that frame). Archive this handoff to `Kuramoto Coupling/Archive/Kuramoto Coupling — handoff — 2026-05-26-closeout.md` once the move is picked up, and remove the Active Handoff section from the entry.
