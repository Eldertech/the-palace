---
title: "Trickster Inline Assets — handoff"
born: 2026-06-06
links:
  - target: "[[STIGMERGY v1.0 — Trickster Deck — handoff]]"
    type: connects-to
    label: "continues"
  - target: "[[Handoff Ceremony]]"
    type: connects-to
    label: "governed-by"
forward_vector: "I carry the move that makes every steward-rendered asset appear on its own Trickster card with zero manual registry upkeep, handed from Cowork to Claude Code."
session_thread: "Cowork session 2026-06-06 — crystal dispersion card had no audio player"
genre: cross-surface paste-prompt (Cowork → Claude Code, palace root)
---

# Handoff: Trickster Inline Assets

## Move
Make the Trickster card render inline assets from the **message payload** (`payload.artifacts` / `artifact_path` / `kind:"choice"`) the way the message boards already do — demoting the hand-maintained `trickster-assets.js` registry to a legacy fallback — and add a steward-side guarantee that *every* file rendered in a cycle reaches the card and is referred to in its prose.

## Why this move matters
The board's whole purpose is zero friction between a steward rendering a result and Loudon hearing/seeing it and responding knowledgeably. Today that promise silently fails: the steward declares its artifacts correctly on the wire, and the card throws them away because it reads a separate hand-curated registry instead. This isn't a missing-data problem — it's two code paths for the same job that disagree. The real cost isn't the one crystal card; it's that the friction-removal goal depends on a human remembering to hand-copy asset paths by request_id forever.

## Current state (what's literally there now)
- The card on screen is `crystal-synth-steward-012`. Its `payload.artifacts` carries **all three** dispersion WAVs with captions, and the prose (`headline`/`ground`/`rationale`) refers to them ("a dry click (01)… dispersed (02)… eight-strike sweep (03)"). The steward followed `prompts/shared.md` exactly.
- The files exist: `Projects/Crystal Synthesizer/dispersion-filter/{01_dry_click,02_dispersed_click,03_dispersion_sweep}.wav` (44.1 kHz, 3.00 s — confirmed in the cycle-4 `CYCLE_BATON`).
- **6 pending Trickster RESOURCE_REQUESTs already carry inline artifacts in payload and every one is invisible on its card:** `crystal-synth-steward-012`, `gsl-steward-028`, `portamento-steward-009`, `torus-steward-010`, `gwl-steward-021`, `slime-mold-delay-steward-009`. (Verified by scanning `_ops/swarm/persistent/blackboard.jsonl`.)
- The message-board renderer (`ArtifactSlot` → `artifactsFromPayload`) already handles audio (inline `PhosphorAudio`), image, sandboxed HTML, and open-native fallback. It works. The Trickster card just never calls it with the payload.

## Root cause (exact)
Two independent inline-media paths exist and disagree:

1. **Message boards (works):** `ArtifactSlot` (`app/src/components/ArtifactSlot.jsx`) calls `artifactsFromPayload(payload)` (`app/src/lib/artifact.js:45`) — reads `payload.artifacts` / `payload.artifact_path` straight off the wire, renders each by detected type.
2. **Trickster card (broken):** `buildInbox()` (`app/src/lib/inbox.js:152`, item mapping `187–227`) **never extracts `payload.artifacts`**. `TricksterCard` (`app/src/components/trickster/TricksterCard.jsx:76`) sources assets **only** from `assetsFor(item.request_id)` — the manual registry `app/src/lib/trickster-assets.js`. The render block is `TricksterCard.jsx:238–244`.

So payload-declared artifacts are dropped at the surface where decisions are actually made.

This is the same shape as the already-solved `catchup-overrides.js` problem: native payload wins, the hand-map is a legacy fallback that ratchets to empty (`inbox.js:177–181`). Artifacts simply never got that treatment.

## Tried and rejected (this session)
- **Just add a `crystal-synth-steward-` row to the registry.** Rejected — it "fixes" one card while leaving the manual-upkeep treadmill in place, and the steward already declared the data on the wire. Treating the registry as the source of truth is the bug, not the cure.
- **Per-card registry entry as the long-term mechanism.** Rejected for the same reason; the registry should ratchet toward empty, keeping only authored `schematic` art (see Cleanup).

## The plan

### Layer 1 — Wire-through (core fix; small, reversible; ship first)
1. `app/src/lib/inbox.js` — in the item mapping (around `187–227`), add:
   - `artifacts: artifactsFromPayload(payload)` (import from `./artifact.js`).
   - `choice:` a normalized object when `payload.kind === 'choice'` (carry `prompt`, `choice_mode`, and the per-option `{id,label,artifact_path,caption}` list), else `null`.
2. `app/src/components/trickster/TricksterCard.jsx` — replace the registry-only asset block (`238–244`) with a payload-first version:
   - If `item.artifacts.length > 0`, render via the already-imported `ArtifactSlot payload={{ artifacts: item.artifacts }}`.
   - Render `item.choice` as per-option auditions (each option's `artifact_path` through `ArtifactSlot`/`PhosphorAudio`, with its `label` as the pick).
   - Keep `assetsFor(request_id)` but use it **only as a fallback** when the payload carries nothing — mirror the `headline ?? override.headline` precedence in `inbox.js`.
   - Keep `assets.schematic` (registry) rendering regardless — schematics are authored art, not steward-rendered files (see Cleanup).
3. Optional polish: when a payload artifact set is **all-audio**, route it through `AuditionStrip` instead of N separate `ArtifactSlot` players to regain the "play all in sequence" button (`AuditionStrip.jsx` already does this; it wants `{title,blurb,tracks:[{tag,label,path}]}`).
4. Tests: update `app/tests/unit/trickster-card.test.js` and the inbox unit tests — assert a request with `payload.artifacts` renders an audio player without any registry entry; assert registry fallback still fires for a request with no payload artifacts.

**Layer 1 alone lights up the crystal card and the five others on next render, and ends per-card data entry permanently.**

### Layer 2 — Guarantee "ALL assets," not "assets the steward remembered"
Lowest friction must not depend on steward discipline.
1. `.claude/skills/palace-orchestrator/prompts/shared.md` — in the "What you can show" / voice-rule section, make declaring `artifacts[]` for every file rendered this cycle **mandatory**, not "expected."
2. Orchestrator **finalize backstop** (in the cycle-finalize step that already writes `CYCLE_BATON` — under `_ops/stigmergy/orchestrator/`): diff the project bundle for media files (audio/image/html/video/pdf by extension) modified within the cycle window; auto-inject any not already in `payload.artifacts` of the cycle's RESOURCE_REQUEST. Dedup against declared paths; filter out scripts/intermediates by extension. The crystal `CYCLE_BATON` already detects the rendered WAVs ("three WAVs confirmed real") — that detection just needs to flow into the payload.

### Layer 3 — Guarantee "referred to"
Add a lightweight finalize lint (near `app/server/validator.js` or in the orchestrator finalize): if `payload.artifacts` is non-empty but `headline`/`ground`/`rationale` never reference them (count mismatch or no mention), warn at validation time so prose and players never drift apart.

### Cleanup
Ratchet `app/src/lib/trickster-assets.js` toward empty as `catchup-overrides.js` is doing: move `audition` / `artifacts` slots to the wire; **keep the `schematic` slot registry-side** (authored diagrams, not steward-rendered files). Update the file's header comment to say so. Remove rows whose requests now self-serve from payload.

## Receiving environment (Claude Code, Mac, palace root)
- **Git locks (known gotcha).** Cowork commits to this repo leave stale `.git/*.lock` files that wedge later git ops. **First act:** `rm -f .git/HEAD.lock .git/index.lock` before any git command. Commit Mac-side from this Claude Code session.
- The STIGMERGY app is a normal Node project under `_ops/stigmergy/app/` — run its unit tests there (`npm test` / the project's test script) after Layer 1. The sandbox could not run them; you can.
- `/api/file` and `/api/open` already serve arbitrary palace-relative paths (that's how registry audio worked), so the `Projects/...` WAV paths resolve with no copy into `public/`.

## Calibrations from this session
- Ship Layer 1 on its own first (contained, reversible), then Layers 2–3. Confirmed direction in-session.
- Do **not** reach for the registry as the fix; the registry is the thing being retired.
- Keep `schematic` registry-side for now — it's the one slot that isn't a steward-rendered file.

## Decisions for Loudon (open forks — confirm or let the catcher choose)
1. Land Layer 1 alone first, or bundle it with the Layer 2 backstop?
2. Does the registry `schematic` slot stay registry-side permanently, or also move to the wire eventually?

## Load these files first
1. `_ops/stigmergy/app/src/lib/inbox.js` — the item builder to extend.
2. `_ops/stigmergy/app/src/components/trickster/TricksterCard.jsx` — the card to rewire (asset block `238–244`).
3. `_ops/stigmergy/app/src/lib/artifact.js` — `artifactsFromPayload`, `detectArtifactType`, `fileUrl` (reuse, don't reinvent).
4. `_ops/stigmergy/app/src/components/ArtifactSlot.jsx` — the working renderer to feed.
5. `_ops/stigmergy/app/src/components/trickster/AuditionStrip.jsx` — for the all-audio play-all polish.
6. `_ops/stigmergy/app/src/lib/trickster-assets.js` — the registry to demote.
7. `.claude/skills/palace-orchestrator/prompts/shared.md` — voice rule + "What you can show" (Layer 2).
8. `_ops/stigmergy/app/tests/unit/trickster-card.test.js` — tests to update.
