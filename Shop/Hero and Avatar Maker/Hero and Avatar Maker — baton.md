---
title: "Hero and Avatar Maker — baton"
born: 2026-06-24
links:
  - target: "[[Hero and Avatar Maker]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the live face-rollout across a context boundary — Wave 1 (hubs+ceremonies) shipped, 4 regens queued under a new female-representation directive, Wave 2 (the connected backbone) next."
---

# Baton: the palace face rollout

## Move
Giving every important palace entry a **hero** (page backdrop) + **avatar** (icon), via the [[Hero and Avatar Maker]] pipeline. Wave 1 (28 hubs + ceremonies) is shipped. Catch this and continue: 4 regenerations, then Wave 2.

## NEW standing directive — apply to everything (from Loudon, 2026-06-24)
**Embed women / feminine energy in all imagery.** Never let a scene go male-dominated; when >1 figure, include women; lean female/androgynous for single archetypes; bring the feminine in *especially* where the concept/history is male-dominated (Stoicism, math, science, philosophy). Saved as memory `female-representation-in-imagery` and folded into the Maker's locked Art Direction. This is why the 4 below are being regenerated.

## Current state (all committed on `main`)
- **Faced so far:** 21 Projects/ + Kuramoto Coupling + Dub Lineage + 28 hubs/ceremonies (Wave 1). STIGMERGY display code (avatars + hero backdrop) is merged to main.
- **Pipeline lives in `_ops/scratch/hero-icon-proving/`:**
  - `scan_targets.py` — enumerate targets by typed-link degree + category (hubs/ceremonies/connected), flags already-faced.
  - `batch_hubs.py` — **path-aware** `generate | place | gallery | plan`; reads `prompts-hubs.json`; auto-appends `ANTI_TEXT` (the no-gibberish clause) to every prompt; generate is resumable (skips existing).
  - `prompts-hubs.json` (28 done) · `prompts-regen.json` (**the 4 regens, ready, female figures written in**) · `batch.py`+`prompts.json` (the projects batch).
- **RunPod:** serverless FLUX-dev-fp8; creds from `RunPod Images/studio/config.json`; cold start ~250s then ~15–30s/img. **Endpoint is PARKED now (workersMax=0).** ALWAYS park after a run (batch does it in `finally`, but a hard kill skips it — re-park manually; serverless auto-zeros so cost is bounded).
- **Convention:** `<bundle>/<Title> — hero.png` + `— icon.png`; hero embedded `![[<Title> — hero.png]]` after the H1.
- **Commit pattern:** owner tree (`/Users/loudonstearns/Documents/The Palace`) is on `main` and chronically dirty (~85 other-agent files). Commit **surgically per entry** — stage only that entry's 3 paths, verify branch before/after. Message: `enrich(<Entry>): hero + icon — purpose: visual identity (hand-drawn)`.

## Next move 1 — regenerate the 4 (queued, prompts ready)
**Deposit Ceremony, Palace Ceremonies, Trickster, Stoicism** — `prompts-regen.json` has them with women written in (+ Palace Ceremonies/Deposit also fix pre-fix gibberish text). Recipe:
1. `rm "_ops/scratch/hero-icon-proving/batch-hubs-out/"{deposit-ceremony,palace-ceremonies,trickster,stoicism}-{hero,icon}.png`
2. In `batch_hubs.py` set `PROMPTS = HERE / "prompts-regen.json"`, then `python3 batch_hubs.py generate` (renders 8 imgs; enable+park), then **VIEW each** (women present? no gibberish? icon bold at small size?), then `python3 batch_hubs.py place`.
3. Commit each (surgical, branch-verified): `enrich(<Entry>): regenerate hero + icon — purpose: female representation + anti-text`. Then revert `PROMPTS` to `prompts-hubs.json`.

## Next move 2 — also flawed (predate the anti-text fix), optional regen
**Loudon's Toolkit** (rendered as a generic island-city — needs the *one-metaphor* fix), **Dissolutions** (muddy). Re-distill with one strong metaphor + anti-text.

## Next move 3 — Wave 2: the connected backbone (degree ≥ 20, ~35 entries)
The genuinely structural non-hub/ceremony entries: The Shop, 2D Torus Wavetable Synthesizer, SUBSTRATE, Pages as Agents, Quality Manifesto, Boundary-Crossing Instruments, Maker, SCHEMA, Project Stewardship System, BBS Blackboard, Hyperdimensional Prism, Palace Enchantment, Frequency-Time Duality, Swarm Weave, PAIS, Lateral Access, Modes of Collaboration, Symbiotic Skills, Loudon Live, STIGMERGY, BLUELINE, Endosymbiosis, Mixture of Experts, … (run `scan_targets.py`, take degree≥20 not-yet-faced). Distill via ~6 parallel subagents — **brief them with: hand-drawn-not-CGI, style-follows-content, the female directive, hard anti-text, one-metaphor for structural entries, bold-silhouette icons.** Then generate → VIEW → place → commit → gallery.

## Reflection improvements (status)
Done: anti-text (in `batch_hubs.ANTI_TEXT`). In art-direction now: female directive, one-metaphor, bold-icon. **Not yet built:** per-hero light/dark flag so STIGMERGY's backdrop veil adapts (light-ground heroes go too faint); a vision auto-QA subagent (card-validator + eyes) to flag faux-text/mush/too-fine before deposit; wave-by-wave gallery checkpoints instead of one big blast.

## Verify discipline (don't skip)
View every render (Read the png): women present where multiple figures; no gibberish text; icon legible at 24–48px. Park the endpoint. Surgical commits, branch-verified. Gallery for Loudon's exception review.
