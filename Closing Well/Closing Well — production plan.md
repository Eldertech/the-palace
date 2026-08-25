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
proven autonomous-build-contract pattern (BBS Production Plan, [[Orchestrator
Production Plan]]): phased, each phase closes one gap and ends at a verify gate, and
the earliest phase is a hand-run pilot before any automation — the same order that
worked for the [[Project Stewardship System]].

Status as of 2026-07-04: **Phases 0–5 done — the Agent is built end to end; only Phase 6 (automatic gotcha-ledger wiring) remains.** Phase 0 (this
plan) and Phase 1 (hand-run pilot — this design's own close) are complete; Phase 2
landed on `main` via the v1.15 Schema Ceremony: the `close well` trigger + the thin
[[Closing Well Ceremony]] card (recognition + dispatch). Phase 3 (the transcript
reader + the enchantment that reconstructs a session's arc cold) merged to `main`.
Phase 4 is built on branch `feature/closing-well-phase4` and **redesigned mid-build
into the moderator model** — the close reframed as a moderated panel (the Agent does
its homework, the active Claude moderates a short reflective panel with Loudon), and
the "close map" split into two layers: the **reckoning** (front of house — the four
gestures keep · hand-on · leave-a-trace · let-go) and the **backstage checklist** (the
in-spec mechanism). Both dispatch prompts were recast to this model; the moderator
design is deposited to `main` (`deposit(D-2026-07-04-MODERATOR)`, `3f544d6`). Its
verify gate passed on real, non-self-referential material (2026-07-04): homework +
reckoning ran clean on the RunPod session `e3c91c9b` with the honesty guard holding
under the hardest case (no human panel *and* no in-room witness → a correctly-stamped
provisional close, no manufactured canon), and a **blind baton-draft comparison** — the
Agent drafting a baton cold for session `f7017000`, scored against the real human-tuned
baton that session shipped — came back at near-parity on the hard parts (the why, the
tried-and-rejected negative space, the calibrations) and *more accurate* on current-state.
The design lives in [[Closing Well]] § Closing Well, Enchanted. Phase 4 is held on its
branch pending Phase 5; each phase's branch merges to `main` and retires.

## Reuse — do not rebuild

Most of the machinery already exists. The Agent is mostly *wiring*, not invention.

| Need | Already exists |
|---|---|
| baton authoring, board announcement, strict validation | [[Baton Ceremony]] (§ Announcing the Baton on the Board; `_ops/stigmergy/app/server/validator.js`) |
| canon commit, "the commit is the record" | [[Deposit Ceremony]] |
| running a page as a subagent (Path 2, no API key), health stub | `_ops/orchestrator/` |
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

### Phase 4 — The panel + the two-layer draft ✓ done
The homework → coaching → panel loop and the single gate, reframed as the moderator
model. Pass 1 (the moderator's homework + coaching handed to the active Claude); the
panel (active Claude + Loudon, the Agent never answering for a panelist); Pass 2 (the
reckoning front-of-house + the backstage checklist). The `UNFILLED`/`provisional`
honesty guard closes the confabulation trap.
*Verify gate:* passed 2026-07-04 on non-self-referential material — `e3c91c9b` (a real
build day; provisional close held clean with both panel channels absent) and a blind
baton-draft comparison on `f7017000` (near-parity with the real human baton). The next
phase continues on this branch; it merges to `main` with Phase 5.

### Phase 5 — Executors + thin dispatch ✓ done (live gate passed 2026-07-04)
Wire deposit / baton / artifact-index / board-post / commit to the existing
ceremonies, honoring canon-to-owner and baton-per-worktree; the thin dispatch
(pointer prompts, not pasted); and — per Loudon's catch that the mechanism is the
moderator's alone — **execution as a third dispatch** (a fresh backstage moderator,
not the spent working instance). *Built 2026-07-04:* `_ops/closing-well/executor.md`
(protocol + the two routing rules), `baton-executor.mjs` (the "hand on" executor —
§8-correct scaffold + `board-post.mjs`-validated announce), `dispatch.md` (the thin
waist), and `prompts/closing-well-executor.md` (the backstage execution pass).
Deposit/artifact reuse the committer directly (run from the owner tree, where its deps
live and canon lands). *Verify gate — passed:* the first live `close well` (this design's
own maker session) ran the whole flow — homework → panel → reckoning → assent → the
backstage moderator placing every assented row — landing canon on `main` (`40c8dd9`)
with the doc-drift linter clean and nothing stranded on a feature branch.

### Phase 6 — Gotcha ledger + iterate
Turn on the ledger; run several closes; let each teach one trap.
*Verify gate:* "professional" is literal — the ledger has grown from real closes.

## Risks / open decisions

- **Deposit inflation.** "deposit: none" must stay a first-class, common outcome, or the Agent manufactures canon (the tristitia failure). The triangulation + the gate are the guards.
- **Context cost of the interview.** Keep it transcript-first and gap-only; the relay must stay a rounding error against the authoring it saves. If it isn't, the design is wrong, not the tuning.
- **Channel fallbacks deferred.** Fresh-session and board-async interview paths are *deliberately unbuilt* (Loudon's call, 2026-07-03) — cross that bridge if the default (interview with the working Claude) proves insufficient.
- **Canon-to-owner mechanics.** Deposits commit to the owner/`main`; this build ran while the primary was thrashed off `main` onto another session's branch — a hazard to resolve before landing canon, per `_ops/worktree/SKILL.md` § recovery. Never commit canon blind onto whatever branch HEAD happens to be on.

## Start here

Phase 5 — executors + thin dispatch wiring, on `feature/closing-well-phase4`. Phase 4
left a validated draft flow (homework → coaching → panel → reckoning + backstage
checklist) that stops at Loudon's signature; Phase 5 makes the *approved* backstage
rows execute. Wire each species to its existing ceremony — deposit → [[Deposit
Ceremony]]; baton → [[Baton Ceremony]] (write the bundle file + announce on the owner
board via `_ops/commons/board-post.mjs`); artifact → file in the bundle + index;
then the commit — **honoring canon-to-owner** (deposits land on `main`/the owner tree,
never a feature branch) **and baton-per-worktree**. Reuse, do not rebuild: the palace
committer + commit-msg hook, `board-post.mjs`, the existing ceremonies. Second piece:
the **thin dispatch** — the ceremony card dispatches the Agent with a *pointer* to its
own prompt template on disk (the thin waist: ~15 lines cross the boundary, not an
~80-line pasted prompt), the subagent reads its own instructions. Verify gate: a signed
map executes end to end; canon lands on `main`; the baton is announced and validates;
nothing stranded on a feature branch.
