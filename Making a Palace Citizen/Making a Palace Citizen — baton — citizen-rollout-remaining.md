---
title: "Making a Palace Citizen — baton — citizen-rollout-remaining"
born: 2026-07-08
links:
  - target: "[[Making a Palace Citizen]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the live Move 5 citizen rollout across the boundary between batches — 25 citizens on the embodiable model, 5 interim rebuilds left. I hold the proven pipeline and the calibrations four batches taught, so the next Claude warns on cost, dispatches, and is building before it finishes reading. Catch me, finish the five, then delete me."
session_thread: "Making a Palace Citizen/Making a Palace Citizen — context.md § Rollout tracker + Findings log (batches 1–4)"
---

# Baton: Making a Palace Citizen — finish the citizen rollout

## Move
Rebuild the remaining **5 interim-layer People entries** to the full [[Making a Palace Citizen]] standard, in register-diverse batches per heavy-run window, warning Loudon on cost before each batch. This is the last stretch of Move 5.

## Why this move matters
The People neighborhood has a two-tier split: as of 2026-07-08, **25 citizens are on the embodiable model, 5 are still interim** — prose-reworked but not embodiable (no blindspot, no dossier, still `stage: mature`). Until rebuilt, those 5 **cannot be faithfully cast** in a [[Dialectic]] or [[Excellent Adventure]] — an old-template page enchants into the smooth, agreeable house voice with no fault line ([[The Blindspot Is the Surprise Fuel]]). This is the parent entry's own stated next work, and it is nearly done.

## Tried and rejected (batches 1–4 residue)
- **Full deep-research harness per citizen** — rejected as too heavy; the **lean pattern** (one Sonnet research-agent each, disjoint scratchpad files, main hand writes the entry+dossier+speech) proved sufficient and cost-sane. Keep it.
- **Writer-subagents for the entries** — not used; canon writing stayed in the main hand (quality + multi-agent write-safety). Research fans out; writing does not.
- **Regenerating faces for rebuilds** — rejected: interim entries already carry hero+icon from an earlier wave; check the bundle before spending GPU. Confirmed across four batches — every rebuild already had its faces. Only genuinely *new* citizens need faces made (via the [[Hero and Avatar Maker]]).
- **The mock/real face gotcha** — `make_faces.py --mock` writes 68-byte stubs into `_renders/`; the real `generate` then *skips* those paths as "already done." Delete stubs before a real render.
- **A separate verification-agent pass when research-first is available** — batch 4 folded it away: if the research agents fetch primary sources and return confirmed-vs-flagged provenance inline, you don't need a second verify pass. Only batch 3 (classifier down, draft-then-verify) needed the standalone fact-check agents.

## Two proven orders — pick by classifier availability
Batches 3 and 4 demonstrated both, back to back, both producing clean sourced citizens. The method is now robust to the classifier flapping:
- **Research-first (default, classifier up):** dispatch one Sonnet research-agent per citizen *with sharpened blindspot angles supplied* (so it verifies-and-sharpens rather than flatters), each writing to a disjoint scratchpad file. Then the main hand writes entry+dossier+speech from the packet. Verification rides *inside* the packet. This is batch 4 — the smoother path.
- **Draft-then-verify (fallback, classifier down/flapping):** write from the main hand's own knowledge, flag every non-definitional quote `[verify wording]`, then run a fact-check agent per citizen against the drafted files once dispatch clears — before committing. Surface the departure to Loudon explicitly. This is batch 3. The *guarantee* (no fabricated quote reaches canon) matters more than the *order*.

## Current state
Pipeline proven and running clean across four batches. **Done (25):** the 9 originals + 8 most-linked + batch 1 (Goldsworthy rebuild + Heidegger/Buber/McGilchrist new) + batch 2 (Fuller, Alexander, Dillard, Epictetus, Ozu) + batch 3 (Cameron, Seneca) + batch 4 (Turrell, Nakashima, Hofstadter). **The 5 remaining rebuilds:** Andrei Tarkovsky · Natalie Goldberg · R. Murray Schafer · Sam Maloof · Terrence Malick. Ghost-link linter: 0 errors. All committed on `main`.

## Next move
1. **Warn Loudon on cost first** (rough agent-count + token estimate; check `/usage`; offer run/trim/wait). One heavy run finishes all five, or split.
2. Candidate groupings (Loudon sets the pick):
   - **All five at once** — the clean finish, if the window allows.
   - **Natalie Goldberg + Tarkovsky + Malick** — Goldberg keeps the women-forward arc (Cameron's writing-practice sibling, Zen-and-writing); the two filmmakers pair with the built [[Yasujirō Ozu]] and deepen the material-patience cluster the Turrell/Nakashima batch opened.
   - **Sam Maloof + R. Murray Schafer** — Maloof `mirrors` the now-rebuilt [[George Nakashima]] (two wood methods — build him and that link fires in a Dialectic); Schafer brings soundscape/acoustic-ecology, a register still unrepresented.
3. Per citizen: research packet → main hand writes entry + `dossier` + `speech` + `## Voice` note → verify links → **commit that one citizen** before the next (git is the safety net on long runs).
4. **When the last one lands, this is DONE** — close the handoff with a full (non-partial) `close-handoff.mjs`, no remainder, and don't rewrite this baton. Post a final PROOF noting Move 5 complete (all interim entries rebuilt), and remove the Active Baton pointer for good.

## Calibrations from batches 1–4
- **Rebuilds restore FRICTION, not just add a blindspot** — and they *fix provenance debt*: batch 4 dropped 3 unverifiable Nakashima quotes and corrected a paraphrased Hofstadter "quote." Check the prior entry's quotes against sources; don't inherit them.
- **Preserve genuine links from the old entry** rather than dropping them (kept Nakashima's Simondon/Maloof/Compressor-Design/Found↔Made, Hofstadter's Embeddings/Alexander/Sidechain, etc.), then *add* the blindspot wiring.
- **Look for batch coherence** — batch 4's three shared one blindspot (humility-that-hides-control: Turrell/Nakashima + built Agnes Martin/Goldsworthy), which made a castable four-citizen Dialectic. Watch for the same in the final five (e.g. two filmmakers + Ozu; two woodworkers).
- **No reciprocal frontmatter link required on the target side at build time** — build one-directional, let dispatch grow the other side.
- **Voice-fidelity guards:** for living/recorded figures prefer recorded interviews and go find them; for near-interview-free figures (filmmakers, ancients) the `speech` file needs a hard "never a chatty talk-show voice" rule + the veils (translation, film-only). Real quotes only; flag paraphrases and provenance-thin lines; watch internet-misattribution (Seneca, and likely Malick/Tarkovsky who are quotable-online).
- **Classifier outages happen** — see the two-orders section. Back off on a lengthening timer if dispatch bounces; read-only tools still work.
- **Multi-agent shared tree** — another session may be committing to `main` concurrently. Stage only your own files with explicit pathspecs, check the shared blackboard's diff before committing, leave others' in-flight edits untouched. Validated live in batch 3.

## Load these files first
1. `Making a Palace Citizen.md` — the standard (read before building; don't invent a shape).
2. `Making a Palace Citizen/Making a Palace Citizen — context.md` — the lab: § Rollout tracker (the live list) + Findings log (batches 1–4, the full calibration record).
3. A finished exemplar to match — `People/George Nakashima.md`, `People/James Turrell.md`, or `People/Donella Meadows.md` + its `— dossier.md` / `— speech.md`.
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
