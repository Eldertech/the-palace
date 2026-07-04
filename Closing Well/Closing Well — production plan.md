---
title: "Closing Well — production plan"
born: 2026-07-03
links:
  - target: "[[Closing Well]]"
    type: connects-to
    label: build-contract-for
forward_vector: "I am the phased build contract that turns the Closing Well Agent from design into running infrastructure. I am done when `close well` runs end to end and can be archived."
---

# Closing Well — production plan

The build contract that makes the Closing Well Agent real. Modeled on the palace's
proven autonomous-build-contract pattern ([[BBS Production Plan]], [[Orchestrator
Production Plan]]): phased, each phase closes one gap and ends at a verify gate, and
the earliest phase is a hand-run pilot before any automation — the same order that
worked for the [[Project Stewardship System]].

Status as of 2026-07-03: **Phases 0–3 done; Phase 4 is next.** Phase 0 (this
plan) and Phase 1 (hand-run pilot — this design's own close) are complete; Phase 2
landed on `main` via the v1.15 Schema Ceremony: the `close well` trigger + the thin
[[Closing Well Ceremony]] card (recognition + dispatch). Phase 3 (the transcript
reader + the enchantment that reconstructs a session's arc cold) is built on branch
`feature/closing-well-phase3` — machinery in `_ops/closing-well/`; its verify gate
passed (a cold Sonnet subagent faithfully reconstructed this build session's own arc
from the distilled transcript alone). The design lives in [[Closing Well]] § Closing
Well, Enchanted. Each phase's feature branch merges to `main` and retires; further
phases branch fresh from `main`.

## Reuse — do not rebuild

Most of the machinery already exists. The Agent is mostly *wiring*, not invention.

| Need | Already exists |
|---|---|
| baton authoring, board announcement, strict validation | [[Baton Ceremony]] (§ Announcing the Baton on the Board; `_ops/stigmergy/app/server/validator.js`) |
| canon commit, "the commit is the record" | [[Deposit Ceremony]] |
| running a page as a subagent (Path 2, no API key), health stub | `.claude/skills/palace-orchestrator/` |
| the append-only board, `handoff_ready`/`handoff_picked_up` | [[STIGMERGY]] |
| deposits-to-owner, batons-per-worktree, one-write-path | `_ops/worktree/SKILL.md` § Ceremonies in a worktree |
| surfacing deposit candidates from a session | [[Harvest Ceremony]] |
| the explainer diagrams (atom · baton · steward · sequence) | built inline 2026-07-03; candidate bundle artifacts |

## Components to build

1. **`close well` trigger + ceremony card** — a thin `_ops/` card (recognition + dispatch only); add the trigger row to CLAUDE.md's ceremony table.
2. **The Agent enchantment** — the dispatch that runs [[Closing Well]] as a subagent with its spec, sensibility, and gotcha ledger streamed in. Extends the orchestrator skill.
3. **Transcript reader** — locate and read the current session transcript from the transcript dir; analyze its arc.
4. **Close-map format** — the schema for the typed map (deposit/baton/artifact rows) and how it renders as the single show-before-write gate.
5. **Interview protocol** — the "gaps a cold reader can't fill" list back to the main loop; main asks Loudon; distilled answers return (Agent + SendMessage). No fallback channels yet (deferred by decision).
6. **Executors** — on approval: deposit edits, baton file, artifacts + index, `handoff_ready` post, commit — each delegating to the existing ceremony, with worktree/canon-to-owner rules honored.
7. **Gotcha ledger** — `Closing Well — gotchas.md` in this bundle; the Agent appends one trap per close.

## Phases

### Phase 1 — Hand-run pilot ✓ done
Run the whole flow **by hand** on one real session, no automation — exactly how
Stewardship's Stage A de-risked its build. A fresh reader (or Loudon) reads a
finished transcript, drafts a close map by hand, runs the one-gate review, and
executes with the existing ceremonies. **Candidate pilot: this very session's
close** (closing well the design of closing well).
*Verify gate:* a real close map produced and signed; format proven or revised;
first gotchas recorded. Output scopes Phase 2.

### Phase 2 — Trigger + ceremony card ✓ done
Write the thin `close well` card; add the CLAUDE.md trigger row. Recognition only.
*Verify gate:* saying "close well" reliably dispatches; a passing mention does not.
*Landed 2026-07-03 (v1.15 Schema Ceremony):* [[Closing Well Ceremony]] card +
CLAUDE.md trigger row + Palace Ceremonies row; `lint-doc-drift.py` clean (trigger
coverage confirmed — the card's `Trigger:` phrases are all present in the table).
The next phase branches fresh from `main`.

### Phase 3 — Enchantment + transcript reader ✓ done
Dispatch [[Closing Well]] as a subagent that reads the session transcript and returns
an arc analysis.
*Verify gate:* the Agent, cold, reconstructs the session arc from the transcript alone.
*Landed 2026-07-03 (branch `feature/closing-well-phase3`):* machinery in
`_ops/closing-well/` — `transcript-reader.mjs` (resolve + mechanical distill; a
`origin.kind == 'human'` discriminator so it never grabs a running subagent's own
transcript) and `prompts/closing-well-agent.md` (the enchantment → structured arc
analysis, ending in the "gaps a cold reader can't fill" list that seeds Phase 4's
interview). `README.md` documents the dispatch. **Gate passed:** a cold Sonnet
subagent reconstructed this very build session's arc faithfully — caught the
stale-baton pivot, the guardrail catch, the narrow scoping; honestly flagged the
transcript's truncation as `(inferred)`; refused to manufacture canon. The next
phase branches fresh from `main`.

### Phase 4 — Close-map + interview protocol
The gap-list loop and the single gate.
*Verify gate:* on a real session the Agent returns a gap list, the main loop asks
Loudon, answers fold into a signed map — measured relay cost stays small.

### Phase 5 — Executors
Wire deposit / baton / artifact-index / board-post / commit to the existing
ceremonies, honoring canon-to-owner and baton-per-worktree.
*Verify gate:* a signed map executes end to end; canon lands on `main`; the baton
is announced and valid; nothing stranded on a feature branch.

### Phase 6 — Gotcha ledger + iterate
Turn on the ledger; run several closes; let each teach one trap.
*Verify gate:* "professional" is literal — the ledger has grown from real closes.

## Risks / open decisions

- **Deposit inflation.** "deposit: none" must stay a first-class, common outcome, or the Agent manufactures canon (the tristitia failure). The triangulation + the gate are the guards.
- **Context cost of the interview.** Keep it transcript-first and gap-only; the relay must stay a rounding error against the authoring it saves. If it isn't, the design is wrong, not the tuning.
- **Channel fallbacks deferred.** Fresh-session and board-async interview paths are *deliberately unbuilt* (Loudon's call, 2026-07-03) — cross that bridge if the default (interview with the working Claude) proves insufficient.
- **Canon-to-owner mechanics.** Deposits commit to the owner/`main`; this build ran while the primary was thrashed off `main` onto another session's branch — a hazard to resolve before landing canon, per `_ops/worktree/SKILL.md` § recovery. Never commit canon blind onto whatever branch HEAD happens to be on.

## Start here

Phase 4 — close-map + interview. Phase 3 left the seam already cut: the arc analysis
ends with a "gaps a cold reader can't fill" list, which *is* the interview's question
set. Phase 4 wires that list into the one-gate loop (Agent hands the gaps to the main
loop → main asks Loudon and the working Claude → distilled answers return → the Agent
drafts the typed close map with its `status` column) and stops at Loudon's signature.
Branch fresh from `main`; reuse `_ops/closing-well/transcript-reader.mjs` and the
enchantment prompt — extend the prompt's return schema from arc-analysis to close-map,
don't rebuild the reader.
