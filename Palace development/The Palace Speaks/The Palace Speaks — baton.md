---
title: "The Palace Speaks — baton"
born: 2026-07-04
links:
  - target: "[[The Palace Speaks]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[The Palace Speaks]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Baton: The Palace Speaks — Phase 1 of the interlocutor migration

## Move
Start Phase 1 of the interlocutor migration ([[The Palace Speaks]]): resolve the three forks, draft the thin router — and treat the dial's context-fullness input as an *unsolved* problem.

## Why this move matters
The values and roadmap are canon; the concrete design that makes Phase 1 buildable is written nowhere — it lives only in session `0a216cbf`. Without this baton it is re-derived or lost.

## Tried and rejected / still-live
The opening audit surfaced seven real risks in Closing-Well-as-it-stands; the conversation then pivoted to values/character and never returned. Paused, not resolved — carry forward as live:
- the intensity dial is not built
- the transcript resolver could grab the wrong session (use bare `--resolve`; gotcha #10)
- the canon-execution (deposit/baton) path is barely tested
- transcript "thinking" is redacted → the cold read is capped; reconstruct from text + actions only
- the species set (deposit/baton/artifact) doesn't cleanly hold flag/check/vector rows

## Current state
Written/canon this session: The Palace Speaks (`6601d31`), its production plan (`a0ce827`), 3 WEAVE flags (`61e7e77`).

Only in conversation (this baton's real cargo):
- **Register-split fix** for `_ops/closing-well/prompts/closing-well-agent.md`: the moderator's Pass-1 output must code-switch — **protocol register** to the working Claude (dense; declare the full *static* repertoire — don't assume it's known; state process, capabilities, target postconditions, and the tone-switch it imposes) and **human register** only for the panel/gate.
- **Three faces as a weight ladder:** oracle (read-only, answers) → steward (1-hop do/offer/flag) → moderator (full close). Oracle is the safe first migration (read-only; both modes trivially open).
- **Moderator character + `agency_profile`** (drafted this session): care ×3 (palace / Loudon / the relieved agent), curious⟂conservative, protective, git-principled, aware⟂bounded — the do/offer/flag tiers *fall out of* the character, not imposed. Fold into [[Closing Well]] (per the posted WEAVE flag).

## Next move
Resolve the three forks, then draft the thin router (recognition + routing only):
- **Fork A — router name/home:** broaden beyond "Closing Well" to a steward-on-call (Closing Well becomes the moderator-face practice page) vs. keep legacy-narrow. *Leaning broaden.*
- **Fork B — oracle dispatch:** Claude Code skill (discoverable, frictionless) vs. floor-text. *Leaning skill.*
- **Fork C — floor budget:** how many always-loaded lines? *Leaning ≤~15: identity + ladder + triage + taxonomy pointer.*

## The dial finding (new, load-bearing)
An AI is not a reliable judge of its own context fullness — proven this session (the active Claude asserted "context full" when it wasn't). The dial's effort-scaling therefore cannot run on the active Claude's self-report. Wire it to an objective signal — STIGMERGY `health.context_pct` (orchestrator-measured) or a transcript token/turn estimate — before building the dial.

## Calibrations from this session
- "deposit: none" is first-class — the day's canon landed mid-flight; the close's real work was this baton, not new canon (gotcha #6).
- Loudon names entries; propose, don't impose.
- Don't assert unverified state as fact (the context-fullness slip).

## Load these files first
1. `Palace development/The Palace Speaks.md` + `Palace development/The Palace Speaks/The Palace Speaks — production plan.md` (the roadmap; Phase 1 = start here)
2. `_ops/closing-well/prompts/closing-well-agent.md` (where the register-split fix lands)
3. `Closing Well.md` + the 3 WEAVE flags on the persistent board (the character/faces fold-in)
4. session `0a216cbf` via `_ops/closing-well/transcript-reader.mjs` for full design detail

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it is still live before you commit to it. The baton is a snapshot from when it was written; the project may have moved past it. Re-read the parent entry and `git log` it since the baton's `born` date, and confirm the "Current state" the baton quotes still matches the file. If the move is already done, superseded, or no longer wanted, STOP — surface it to Loudon and do not execute. A stale baton followed silently produces drift. (Receive every baton with this skepticism; the auto-staleness heuristic is off by design — the freshness call is yours.)
3. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive Step 7 relies on.
4. Mark it caught: remove the "Active Baton" section from the parent entry; for a board-announced baton with no parent entry, post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) instead.
5. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
6. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
7. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.
