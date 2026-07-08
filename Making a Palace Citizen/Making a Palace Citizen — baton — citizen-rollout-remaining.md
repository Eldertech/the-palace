---
title: "Making a Palace Citizen — baton — citizen-rollout-remaining"
born: 2026-07-08
links:
  - target: "[[Making a Palace Citizen]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the live Move 5 citizen rollout across the boundary between batches — 20 citizens on the embodiable model, 10 interim rebuilds left. I hold the proven pipeline and the calibrations two batches taught, so the next Claude warns on cost, dispatches, and is building before it finishes reading. Catch me, finish the ten, then delete me."
session_thread: "Making a Palace Citizen/Making a Palace Citizen — context.md § Rollout tracker + Findings log (batches 1–2)"
---

# Baton: Making a Palace Citizen — finish the citizen rollout

## Move
Rebuild the remaining **10 interim-layer People entries** to the full [[Making a Palace Citizen]] standard, in register-diverse batches of ~4–5 per heavy-run window, warning Loudon on cost before each batch.

## Why this move matters
The People neighborhood has a two-tier split: as of 2026-07-08, **20 citizens are on the embodiable model, 10 are still interim** — prose-reworked but not embodiable (no blindspot, no dossier, still `stage: mature`). Until rebuilt, those 10 **cannot be faithfully cast** in a [[Dialectic]] or [[Excellent Adventure]] — an old-template page enchants into the smooth, agreeable house voice with no fault line ([[The Blindspot Is the Surprise Fuel]]). This is the parent entry's own stated next work.

## Tried and rejected (batches 1–2 residue)
- **Full deep-research harness per citizen** — rejected as too heavy; the **lean pattern** (one Sonnet research-agent each, disjoint scratchpad files, Opus writes the entry+dossier+speech) proved sufficient and cost-sane. Keep it.
- **Writer-subagents for the entries** — not used; canon writing stayed in the Opus main hand (quality + multi-agent write-safety). Research fans out; writing does not.
- **Regenerating faces for rebuilds** — rejected: interim entries already carry hero+icon from an earlier wave; check the bundle before spending GPU. Only genuinely *new* citizens need faces made (via the [[Hero and Avatar Maker]]).
- **The mock/real face gotcha** — `make_faces.py --mock` writes 68-byte stubs into `_renders/`; the real `generate` then *skips* those paths as "already done." Delete stubs before a real render.

## Current state
Pipeline proven and running clean. **Done (20):** the 9 originals + batch 1 (Goldsworthy rebuild + Heidegger/Buber/McGilchrist new) + batch 2 (Fuller, Alexander, Dillard, Epictetus, Ozu). **The 10 remaining rebuilds:** Andrei Tarkovsky · Douglas Hofstadter · George Nakashima · James Turrell · Julia Cameron · Natalie Goldberg · R. Murray Schafer · Sam Maloof · Seneca · Terrence Malick. Ghost-link linter: 0 errors. All committed on `main`.

## Next move
1. **Warn Loudon on cost first** (rough agent-count + token estimate; check `/usage`; offer run/trim/wait). Each batch of ~5 is a heavy run — one per 5h window.
2. Suggested **next batch is women-forward** to balance the arc (batches 1–2 skewed male): **Julia Cameron + Natalie Goldberg**, plus **Seneca** (completes the Marcus/Epictetus/Seneca Stoic trio) and **Tarkovsky or Malick** (cinema, pairs with the built Ozu). Loudon sets the final pick.
3. Per citizen: one Sonnet research-agent → Opus writes entry + `dossier` + `speech` + `## Voice` note → verify links → **commit that one citizen** before the next (git is the safety net on long runs).

## Calibrations from this session
- **Rebuilds restore FRICTION, not just add a blindspot.** Several interim entries were *flattering* (all-resonance) or *thin*; keep the genuine palace links, then wire the productive contradiction (Alexander↔Deleuze, Fuller↔Meadows, Epictetus↔Marcus).
- **Preserve genuine links from the old entry** rather than dropping them (Fuller's Kuramoto/Leverage-Points, Ozu's pillow-shot-gutter, etc.).
- **Voice-fidelity guards matter**: for near-interview-free figures (writers, filmmakers, ancients) the `speech` file must carry a hard "never write a chatty/talk-show voice" rule + the veils (translation, Arrian-transcription, print-only, film-only). Real quotes only; flag paraphrases and provenance-thin lines.
- **Fix research-flagged data issues** rather than inheriting them (softened Epictetus's leg-break legend; born_year disputes noted, not silently overwritten).
- **Respect existing files**: e.g. `The Fortress and the Threshold/zhuangzi-epictetus-confucius-on-the-self.md` before building Stoic-triad Dialectics.
- **Classifier outages happen**: if Opus agent-dispatch bounces ("temporarily unavailable"), back off on a lengthening timer and retry — the work isn't lost, the classifier just gates dispatch; read-only tools still work.

## Load these files first
1. `Making a Palace Citizen.md` — the standard (read before building; don't invent a shape).
2. `Making a Palace Citizen/Making a Palace Citizen — context.md` — the lab: § Rollout tracker (the live list) + Findings log (batches 1–2, the full calibration record).
3. A finished exemplar to match — `People/Donella Meadows.md` or any batch-2 entry (e.g. `People/Christopher Alexander.md`) + its `— dossier.md` / `— speech.md`.
4. `The Blindspot Is the Surprise Fuel.md` — why the mandatory beat exists.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
*Identical in every baton. It rides along because the catching Claude loads the
baton and the entry, not this ceremony — so the catcher's obligations live where
the catcher will see them. Omit nothing here.*
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it is still live before you commit to it. Re-read the parent entry and `git log` it since the baton's `born` date, and confirm the "Current state" list still matches the People folder (a citizen may have been built since). If the move is already done, superseded, or no longer wanted, STOP — surface it to Loudon and do not execute.
3. If this baton or its board line is still uncommitted, commit them first. That commit is the git archive.
4. Mark it caught: remove the "Active Baton" section from [[Making a Palace Citizen]], and post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id).
5. Delete the baton file (git is its archive).
6. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it.
7. Act on the move, holding the calibrations above.
