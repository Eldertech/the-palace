---
title: "Making a Palace Citizen — baton — citizen-rollout-remaining"
born: 2026-07-08
links:
  - target: "[[Making a Palace Citizen]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the live Move 5 citizen rollout across the boundary between batches — 22 citizens on the embodiable model, 8 interim rebuilds left. I hold the proven pipeline and the calibrations three batches taught, so the next Claude warns on cost, dispatches, and is building before it finishes reading. Catch me, finish the eight, then delete me."
session_thread: "Making a Palace Citizen/Making a Palace Citizen — context.md § Rollout tracker + Findings log (batches 1–3)"
---

# Baton: Making a Palace Citizen — finish the citizen rollout

## Move
Rebuild the remaining **8 interim-layer People entries** to the full [[Making a Palace Citizen]] standard, in register-diverse batches per heavy-run window, warning Loudon on cost before each batch.

## Why this move matters
The People neighborhood has a two-tier split: as of 2026-07-08, **22 citizens are on the embodiable model, 8 are still interim** — prose-reworked but not embodiable (no blindspot, no dossier, still `stage: mature`). Until rebuilt, those 8 **cannot be faithfully cast** in a [[Dialectic]] or [[Excellent Adventure]] — an old-template page enchants into the smooth, agreeable house voice with no fault line ([[The Blindspot Is the Surprise Fuel]]). This is the parent entry's own stated next work.

## Tried and rejected (batches 1–3 residue)
- **Full deep-research harness per citizen** — rejected as too heavy; the **lean pattern** (one Sonnet research-agent each, disjoint scratchpad files, main hand writes the entry+dossier+speech) proved sufficient and cost-sane. Keep it.
- **Writer-subagents for the entries** — not used; canon writing stayed in the main hand (quality + multi-agent write-safety). Research fans out; writing does not.
- **Regenerating faces for rebuilds** — rejected: interim entries already carry hero+icon from an earlier wave; check the bundle before spending GPU. Only genuinely *new* citizens need faces made (via the [[Hero and Avatar Maker]]). Confirmed again in batch 3 — both Cameron and Seneca already had faces.
- **The mock/real face gotcha** — `make_faces.py --mock` writes 68-byte stubs into `_renders/`; the real `generate` then *skips* those paths as "already done." Delete stubs before a real render.
- **Forcing research-agent dispatch through a stuck classifier gate** — rejected in batch 3. When Bash/Agent dispatch is intermittently blocked (the Opus/Sonnet safety classifier flapping), do NOT sit idle waiting for it to clear before writing anything. **Draft-then-verify is a legitimate fallback**: write the dossier/speech/body from the main hand's own knowledge, flag every non-definitional quote `[verify wording]`, then run a fact-check agent against the already-drafted files once dispatch clears — before anything commits to canon. Surface the departure from the normal order to Loudon explicitly (don't silently downgrade the discipline). The *guarantee* (no fabricated quote reaches canon) matters more than the *order* (research first); flag-then-verify protects the guarantee when the default order is unavailable. Validated clean in batch 3 — two fact-check passes came back with zero factual errors, only precision upgrades.

## Current state
Pipeline proven and running clean across three batches. **Done (22):** the 9 originals + batch 1 (Goldsworthy rebuild + Heidegger/Buber/McGilchrist new) + batch 2 (Fuller, Alexander, Dillard, Epictetus, Ozu) + batch 3 (Julia Cameron, Seneca). **The 8 remaining rebuilds:** Andrei Tarkovsky · Douglas Hofstadter · George Nakashima · James Turrell · Natalie Goldberg · R. Murray Schafer · Sam Maloof · Terrence Malick. Ghost-link linter: 0 errors. All committed on `main`.

## Next move
1. **Warn Loudon on cost first** (rough agent-count + token estimate; check `/usage`; offer run/trim/wait). Each batch is a heavy run — pace to the 5h window.
2. Candidate next batches (Loudon sets the final pick):
   - **Natalie Goldberg** alone or paired — keeps the women-forward arc moving; she's Cameron's writing-practice sibling (*Writing Down the Bones*, Zen-and-writing) and a natural contrast pairing (both teach daily practice, different lineage — Zen vs. recovery).
   - **Tarkovsky and/or Malick** — cinema, pairs with the already-built Ozu.
   - **Hofstadter** — cognitive science, a register the palace hasn't cast among persons yet.
   - **Nakashima · Turrell · Maloof · Schafer** — a craft/material-practice register (woodworking, light installation, furniture, soundscape) currently unrepresented among the built 22; could run as its own register-diverse batch of 4.
3. Per citizen: one Sonnet research-agent → main hand writes entry + `dossier` + `speech` + `## Voice` note → verify links → **commit that one citizen** before the next (git is the safety net on long runs).

## Calibrations from this session (batch 3, 2026-07-08)
- **Rebuilds restore FRICTION, not just add a blindspot.** Continues to hold — Cameron's and Seneca's rebuilds both needed a genuine, unresolved fault line, not a token concession.
- **Preserve genuine links from the old entry** rather than dropping them — both Cameron's and Seneca's prior `links` (Marcus Aurelius, Stoicism, Quality Manifesto, etc.) were kept and extended, not replaced.
- **No reciprocal frontmatter link required on the target side at build time.** Checked directly: Alexander's `contradicts → Deleuze` link (batch 2) has no reciprocal on Deleuze.md. Links "start with the citizen's genuine relationships; expect them to accrue through encounters" (the method card) — build one-directional, let dispatch grow the other side.
- **Voice-fidelity guards**: for living, well-recorded figures (Cameron) prefer recorded interviews over book prose for the off-the-cuff register, and go find them — a fact-check pass surfaced 4 real quotes the draft was missing. For ancient/translated figures (Seneca), name the translation veil explicitly and be ruthless about internet-misattribution — Seneca specifically is one of the most misquoted figures online; the fact-check pass confirmed one popular "quote" spurious and reclassified another as a paraphrase, not a direct line.
- **Classifier outages happen, and can be severe.** This session saw a flapping Opus classifier block Bash/Agent dispatch intermittently for an extended stretch, spanning a mid-session model switch (Opus → Sonnet). See "Tried and rejected" above for the fallback that held: draft with honest flags, verify before commit, surface the departure to Loudon rather than silently pushing through.
- **Multi-agent shared-tree discipline, validated live.** Mid-batch, another concurrent session was actively committing to `main` (retiring [[Palace Agent Infrastructure Spec]] for [[Palace Orchestrator]], touching CLAUDE.md/JEWEL.md/SCHEMA.md/`_ops/Substrate Skill.md`). Handled correctly: left those files untouched, staged only this session's own files with explicit pathspecs, checked the shared append-only blackboard's diff before committing to confirm no clobber. No collision. Worth remembering as a working example next time a shared-tree conflict is worried about in the abstract.

## Load these files first
1. `Making a Palace Citizen.md` — the standard (read before building; don't invent a shape).
2. `Making a Palace Citizen/Making a Palace Citizen — context.md` — the lab: § Rollout tracker (the live list) + Findings log (batches 1–3, the full calibration record).
3. A finished exemplar to match — `People/Donella Meadows.md`, `People/Christopher Alexander.md`, or `People/Julia Cameron.md` + its `— dossier.md` / `— speech.md`.
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
