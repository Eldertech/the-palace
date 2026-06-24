---
title: "Hero and Avatar Maker — baton"
born: 2026-06-24
links:
  - target: "[[Hero and Avatar Maker]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the live face-rollout across a context boundary — Wave 1 (hubs+ceremonies) shipped, the 4 female-rep regens + the 2 flawed re-distills committed, Wave 2 (43-entry connected backbone) rendering now; next is view→place→commit Wave 2, then Wave 3 (degree 8–19)."
---

# Baton: the palace face rollout

## Move
Giving every important palace entry a **hero** (page backdrop) + **avatar** (icon), via the [[Hero and Avatar Maker]] pipeline. Wave 1 (28 hubs + ceremonies) shipped; the 4 female-rep regens + 2 flawed re-distills are committed; **Wave 2 (43-entry backbone) is rendering now.**

## Session progress (2026-06-24, second pickup)
- ✅ **4 female-rep regens committed** — Deposit Ceremony (2f03b12), Palace Ceremonies (bba6526), Trickster (b352b63), Stoicism (89899cc). All viewed: women present, no gibberish, bold icons.
- ✅ **2 flawed re-distills committed** — Loudon's Toolkit (c218b67, one-metaphor *river watershed* replacing the generic island) + Dissolutions (938b2ca, *woman between two archways, same orb in both*). Prompts in `prompts-regen2.json`.
- ✅ **Wave 2 COMMITTED as-is** (Loudon's call: ship all, mark exceptions from the gallery) — 43 entries / 86 imgs, 8 commits (`a7ca673`→`61c9288` by group + `3a4b236` Modes). `prompts-wave2.json` (7 subagent group files in `wave2/`). All 86 rendered (ok=86 fail=0), endpoint parked, `PROMPTS` reverted to `prompts-hubs.json`.
- 🔎 **QA done** — 7 Sonnet visual-QA critics (`wave2/qa-*.json`), annotated gallery at `_ops/scratch/hero-icon-proving/batch-hubs-out/wave2-gallery.html`. 11 clean pass, 32 flagged; I spot-checked and calibrated: **QA reliable on text + metaphor, OVER-strict on "CGI"** (STIGMERGY/Excellent Adventure are fine).

### Wave 2 exception fix-list (next move — regen these, hero/icon as noted)
Calibrated MUST-FIX (real failures vs locked art direction):
- **Readable letters in image** (hard fail): SCHEMA (icon edge-text), Pages as Agents (icon "Edward Gorey"), Generative Audio Devices (icon letters + hero=gramophone), Boundary-Crossing (icon).
- **Concept miss / wrong metaphor**: 2D Torus (reads as eye not torus), PAIS (literal house), Palace Map (literal world-map + male + text), Loudon Live (icon=crosshair not Lissajous), Frequency-Time Duality (icon + missing female + edge text), Categorizing Inharmonicity, Lateral Access, Threshold Conatus (icon=enso), Generative Sample Libraries (hero=spectrum not herbarium).
- **Female-miss** (Loudon directive): Biomechanical Synthesis (male figure), Excellent Adventure (icon=two monks), Palace Map (male navigator), Three Kinds of Warp (male runners).
- **Genuinely glossy CGI**: Progressive Staging (hero), Endosymbiosis (icon), Substrate Skill (icon), Piano String Inharmonicity (icon), BBS Design System (both).

ACCEPT / borderline (QA over-flagged — likely leave): STIGMERGY, Excellent Adventure hero, Enchanted Worker (muted not CGI); BBS Blackboard/Bessel/Modes of Collab/Floquet/BLUELINE (faint corner marks on veiled heroes); SUBSTRATE/Swarm Weave/DSP-Looping/Flocking (slightly fine icons). **Loudon to confirm from the gallery.**

Fix recipe: build `prompts-wave2-fix.json` with corrected prompts (strengthen ANTI_TEXT with "no signature/watermark/edge-label"; add anti-gloss "flat, matte, visible paper grain, no specular, no smooth gradients" to CGI ones; explicit "a woman" for female-misses; clearer single image for metaphor-misses). Delete ONLY the failing png(s) per entry, `generate` (resumable re-renders just those), re-QA, `place`, commit.

## NEW standing directive — apply to everything (from Loudon, 2026-06-24)
**Embed women / feminine energy in all imagery.** Never let a scene go male-dominated; when >1 figure, include women; lean female/androgynous for single archetypes; bring the feminine in *especially* where the concept/history is male-dominated (Stoicism, math, science, philosophy). Saved as memory `female-representation-in-imagery` and folded into the Maker's locked Art Direction. This is why the 4 below are being regenerated.

## Current state (all committed on `main`)
- **Faced so far:** 21 Projects/ + Kuramoto Coupling + Dub Lineage + 28 hubs/ceremonies (Wave 1). STIGMERGY display code (avatars + hero backdrop) is merged to main.
- **Pipeline lives in `_ops/scratch/hero-icon-proving/`:**
  - `scan_targets.py` — enumerate targets by typed-link degree + category (hubs/ceremonies/connected), flags already-faced.
  - `batch_hubs.py` — **path-aware** `generate | place | gallery | plan`; reads `prompts-hubs.json`; auto-appends `ANTI_TEXT` (the no-gibberish clause) to every prompt; generate is resumable (skips existing).
  - `prompts-hubs.json` (28 done) · `prompts-regen.json` (**the 4 regens, ready, female figures written in**) · `batch.py`+`prompts.json` (the projects batch).
- **RunPod:** serverless FLUX-dev-fp8; creds from `RunPod Images/studio/config.json`; cold start ~250s then ~15–30s/img. ALWAYS park after a run (batch does it in `finally`, but a hard kill skips it — re-park manually; serverless auto-zeros so cost is bounded).
  - **WEDGE GOTCHA (hit 2026-06-24):** if `workersMax=0` while jobs are queued, NO worker boots and every job sits the full 900s timeout then cancels — a batch can silently burn ~30 min doing nothing. Symptom: repeated "still IN_QUEUE after ~246s … timed out; cancelling". Fix: kill the wedged proc, `PATCH workersMax=1` + `POST /v2/<ep>/purge-queue`, relaunch (generate is resumable). Run only ONE batch at a time — overlapping `finally` blocks can re-zero workersMax mid-run. Health check: `GET https://api.runpod.ai/v2/<ep>/health` (use certifi SSL ctx).
- **Convention:** `<bundle>/<Title> — hero.png` + `— icon.png`; hero embedded `![[<Title> — hero.png]]` after the H1.
  - **`place` gotchas (hit Wave 2):** (1) it finds the H1 via `line.startswith("# ")` — a **leading tab/indent** on the H1 (e.g. SCHEMA.md) makes it silently skip the embed; add manually. (2) **macOS case-insensitive FS**: a bundle whose name only differs in case from an existing dir merges into it — e.g. `Modes of Collaboration/` landed inside the pre-existing `Modes of collaboration/`; `git add` with the capital-case path then stages nothing. Commit from the real on-disk path. (Embeds resolve by filename, so display is unaffected.)
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
