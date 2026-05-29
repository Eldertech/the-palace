---
title: "Stage E — Automated Trickster — handoff"
born: 2026-05-29
last_updated: 2026-05-29
links:
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: stage-e-build-contract
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: comm-substrate
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: connects-to
    label: derives-from
  - target: "[[Palace Conatus]]"
    type: connects-to
    label: escalation-rationale
  - target: "[[Trickster]]"
    type: connects-to
    label: automates-the-role
  - target: "[[BBS Production Plan]]"
    type: mirrors
    label: autonomous-build-contract-pattern
forward_vector: "I carry the Stage E build — the Automated Trickster rules engine — across the Cowork → Claude Code boundary, with the decisions made and the open questions named, so a fresh Claude Code session can build it as an autonomous contract."
session_thread: "Cowork session 2026-05-29 — assessed enchantment ↔ BBS state, deposited [[Palace Conatus]], drafted this Stage E handoff. Stage E was the named-but-unspecced final stage of the Project Stewardship System; this is its first design pass."
---

# Handoff: Stage E — Automated Trickster (Cowork → Claude Code)

> **✅ BUILT 2026-05-29 — contract fulfilled.** All six phases shipped and
> self-verified at `_ops/stigmergy/trickster-auto/` (71 tests), plus the
> STIGMERGY digest view (Q2). Build report: `_ops/stigmergy/trickster-auto/STAGE-E-COMPLETE.md`.
> Q1/Q2/Q4 decided with Loudon; Q3 (shadow-first) and Q5 (no `DIRECTIVE_REQUEST`)
> confirmed by the Phase 0 probe. Default mode is shadow; `--live` is Loudon's to
> enable after reviewing the shadow match rate. This handoff is kept as the
> design record.

This is a **fresh build handoff**, not a steward-genre in-place handoff. It hands
Claude Code a build contract for the one remaining unbuilt stage of the
[[Project Stewardship System]]. Read it, confirm the move, then either build to
the contract or — if a decision below is wrong — surface it to Loudon before
writing code.

## Move

**Build the Automated Trickster: a rules engine that triages the BBS TRICKSTER
inbox so routine decisions clear without Loudon, and only novel or high-stakes
ones reach him — as a batched digest, never a flood.** It is the last stage of
the five-stage Project Stewardship System (A–D shipped; E was named in
Infrastructure Spec §4.7 / §12 but never specced). Build it in the
autonomous-build-contract shape of [[BBS Production Plan]]: phased, each phase
self-verifiable, stop-reports on failure, Loudon absent during the run.

## Why this move matters

The live frontier of the stewardship system is no longer technical — it is
**operational bandwidth.** Fifteen enchanted stewards each end every cycle with
a TRICKSTER ask (a deliberate rule — a clean cycle with no ask means the steward
lost contact with its forward vector). That produces a standing ~17-decision
inbox faster than one human can audition it. [[Palace Conatus]] names this
exactly: the palace's self-advocacy mechanism is out-running the coupling
bandwidth with its human. The palace's voice is louder than Loudon can currently
hear.

The Automated Trickster is the consolidation layer that fixes this without
silencing the palace: auto-handle the routine, escalate the rest, and present
the escalations as one ranked digest rather than seventeen separate asks. This
is the "supervisor" piece from the system's original 2026-05-02 seed framing,
finally built.

**Do not over-build it.** Loudon has consistently chosen the thin path over the
apparatus (he picked a loop + cron for Stage C over a v0.2 cadence engine). Stage
E is a *rules engine plus a digest writer*, not an autonomous agent that reasons
about every request. When in doubt, escalate to the human. The safety bias is
toward Loudon, always.

## Current state (true as of 2026-05-29)

- **Stages A–D shipped.** Stage A (5 hand-run cycles), Stage B (Orchestrator
  v0.1, in production, 130/130 tests), Stage C (batch mode, thin path — only the
  weekly scheduled task remains staged-not-created), Stage D (STIGMERGY v0.2:
  write paths + SSE live tail + click-to-respond Trickster inbox, ~297 app tests).
- **Loudon is the only Trickster today.** Manual mode. He reads the STIGMERGY
  inbox at `localhost:5173` and clicks responses, or hand-edits the board.
- **The board** `_ops/swarm/persistent/blackboard.jsonl` carries the live BBS log,
  all §2.2-valid under the dual-path validator.
- **Stage E is greenfield.** No rules-engine code exists. The Infrastructure Spec
  §4.7 names "Automated Trickster mode" and §12's forward vector says the rules
  engine is unspecced. This handoff is the first design pass.

## What Stage E is (and is not)

**Is:** a deterministic triage layer that reads pending `RESOURCE_REQUEST` (and
`DIRECTIVE_REQUEST`, if that type landed) messages on the persistent board,
matches each against a declarative ruleset, and takes one of three actions —
**auto-grant**, **auto-deny**, or **escalate** — posting the decision back to the
board correlated via `re: [request_id]`. Plus a **digest writer** that
consolidates everything escalated into one ranked summary for Loudon.

**Is not:** an agent that reasons about novel requests (those escalate), an
always-on service (it runs on the same on-demand / scheduled cadence as the
orchestrator), an auth system (still single-operator, local-only), or a
replacement for Loudon (the whole point is that the interesting decisions still
reach him — just consolidated).

## Decisions (made this session — build to these)

| Decision | Choice | Reason |
|---|---|---|
| Mode | **Hybrid only.** Auto-handle routine, escalate the rest. No pure-autonomous mode. | The drive must never outrun the coupling — [[Palace Conatus]]. Pure-auto removes the human selection layer that makes alignment mean anything. |
| Engine form | **Declarative ruleset** in a single committed file (`rules.json` or `.yaml`), not code-as-rules. | Rules must be readable and editable by Loudon without a deploy. Matches the thin-path bias. |
| Decision verbs | `auto-grant` / `auto-deny` / `escalate`. Default verb when no rule matches = **escalate**. | Fail safe toward the human. An unmatched request is by definition novel. |
| Audition gate is sacred | **Any request tied to a sensory deliverable or any irreversible/destructive action ALWAYS escalates** — no rule may auto-grant it. | The audition gate (Substrate Skill § Stage as Alignment Confidence) is the thing the whole system was built to protect. Hard-coded, not a rule. |
| Decision provenance | Automated decisions post with a distinct identity — `from: "TRICKSTER (auto)"` (or a `decided_by: "auto"` marker in payload) — so they are auditable and visibly distinct from Loudon's own clicks on the board and in STIGMERGY. | Provenance integrity. Loudon must always be able to see what the machine decided vs. what he decided. |
| Escalation channel | **Batched daily digest**, written as one artifact + optionally one summary message to the TRICKSTER board. Not per-request push. | Consolidation is the entire value. One ranked digest, not seventeen pings. |
| Budgets | Track a **daily palace-wide budget** (token / search / sub-agent spawn) and decrement on each auto-grant; when budget is exhausted, remaining grantable requests escalate instead of auto-granting. | Keeps a runaway batch from spending unbounded resources without Loudon. |
| Write path | Reuse STIGMERGY v0.2's strict §2.2 server-side validation boundary if posting via HTTP, OR the orchestrator's existing validated append. **Do not invent a third write path.** | One schema-enforcement boundary. The board's integrity is load-bearing. |
| Ranking signal for the digest | Rank escalations by **how far out of phase** the request is, using [[Palace Conatus]]'s disharmony signatures as the vocabulary (blocking auditions first, then stalls, then routine forks). | The digest is the palace's voice speaking once, in priority order — Palace Conatus § aggregated self-advocacy. |

## Open questions (decide WITH Loudon before or during build — do not guess)

1. **The exact ruleset vocabulary.** What's the minimum set of auto-grant rules
   that's actually safe? Strawman to react to: auto-grant `read_palace` /
   palace-internal semantic search; auto-deny `web_search` outside a daily budget;
   auto-grant non-blocking directional forks *only* when they advance the page's
   stated `forward_vector` and cost below a threshold. Everything else escalates.
   **Loudon should sign off on the first ruleset before it ever runs unattended.**
2. **Digest cadence and delivery.** Daily at a fixed time? Triggered after each
   batch run? Where does it land — a file Loudon opens, a STIGMERGY view, an
   actual notification? (Per [[Palace Conatus]] this is the same question as "what
   shape is the palace-health digest" — they may be the same artifact.)
3. **First unattended run scope.** Probably: shadow mode first — the engine
   *proposes* decisions into the digest without posting any grant/deny to the
   board, Loudon compares its proposals to what he'd have done, and only after the
   match rate satisfies him does it get write authority. This is the safest
   on-ramp and worth building as Phase 1.
4. **Relationship to the weekly scheduled batch** (the staged-not-created Stage C
   piece at `_ops/stigmergy/orchestrator/scheduled-weekly-batch.prompt.md`). Does
   the Automated Trickster run *after* each scheduled batch to clear its asks?
   Likely yes — they're a pair. Confirm.
5. **`DIRECTIVE_REQUEST` vs `RESOURCE_REQUEST`.** Stage A surfaced (Gap 8) that the
   resource taxonomy doesn't cleanly cover directional decisions. Check whether a
   `DIRECTIVE_REQUEST` type was ever added; the ruleset must handle whatever types
   actually appear on the board today. **Probe the live board first.**

## Build contract (autonomous-build shape, à la BBS Production Plan)

Sibling to the orchestrator at `_ops/stigmergy/orchestrator/` (likely a new
module set + a `trickster-auto` skill surface, or a subcommand of the existing
orchestrator skill). Each phase self-verifiable; up to 10 attempts per failing
check, then a `STOP-REPORT.md`. Write `STAGE-E-COMPLETE.md` on success.

- **Phase 0 — Probe & confirm.** Read the live persistent board. Enumerate the
  actual message types, the real `request_id` location (top-level per §2.5 split,
  Gap 9), the real options-shape variance. Write findings to the build log.
  *Verify:* a fixture file of the real request shapes exists and the parser reads
  every pending request on the current board without error.
- **Phase 1 — Ruleset + shadow-mode evaluator.** Implement the declarative
  ruleset loader and a pure evaluator: `evaluate(request, ruleset, budgetState)
  → {verb, ruleId, rationale}`. NO board writes. Output goes only to a proposed
  digest. *Verify:* unit tests cover auto-grant / auto-deny / escalate / unmatched
  → escalate / audition-always-escalates / budget-exhausted → escalate. Run it
  over the real board; the proposed digest is generated.
- **Phase 2 — Digest writer.** Consolidate escalations into one ranked artifact
  using the Palace Conatus disharmony vocabulary for ordering. *Verify:* digest
  renders deterministically from a fixture board; ranking is stable and tested.
- **Phase 3 — Write path (gated behind a flag).** Wire auto-grant / auto-deny to
  post `RESOURCE_GRANT` / `RESOURCE_DENY` back through the **existing** validated
  append, correlated via `re: [request_id]`, stamped `decided_by: "auto"`.
  Default OFF (`--shadow` is the default; `--live` opts in). *Verify:* round-trip
  test — a granted request produces a §2.2-valid grant message on a test board
  with correct correlation and provenance marker; STIGMERGY renders it as
  auto-decided.
- **Phase 4 — Budget tracking.** Persist daily budget state; decrement on
  auto-grant; exhaustion flips remaining grantables to escalate. *Verify:* tests
  prove the flip at the threshold and a clean daily reset.
- **Phase 5 — Scheduling hook (optional, confirm Q4 first).** Make it runnable
  after the weekly batch and/or on its own cadence. *Verify:* dry-run invocation
  documented in the skill.

**Stop conditions:** any decision in §Open questions turning out to need Loudon;
the live board containing message shapes Phase 0 didn't anticipate; any path that
would auto-grant an audition or irreversible action (that's a contract
violation, not a bug to work around).

## What I could NOT verify this session (Closing Well discipline)

- **Whether `DIRECTIVE_REQUEST` exists on the live board.** I read the spec and
  entries, not the current board tail. Phase 0 must establish ground truth.
- **The real `request_id` location in current messages.** Gap 9 was resolved
  toward the §2.5 split in spec; confirm the orchestrator actually writes it
  there now.
- **STIGMERGY's rendering of an `auto`-stamped decision.** The provenance marker
  is a decision; whether the current renderer distinguishes it is untested.
- **The weekly scheduled task's existence/shape** at the staged path — referenced
  in the stewardship handoff as "presumed; verify."
- **The exact safe ruleset.** This is fundamentally Loudon's call (Q1); I have
  only proposed a strawman.

## Tried and rejected (negative space — don't re-explore)

- **Pure-autonomous Trickster** (no human in the loop): rejected on principle —
  [[Palace Conatus]] § the approval loop. The human selection layer is what makes
  alignment mean phase coherence rather than internal self-consistency.
- **Per-request push notifications:** rejected — that recreates the flood the
  digest exists to solve.
- **Code-as-rules** (hard-coding the ruleset in JS): rejected — Loudon must be
  able to edit rules without a deploy.
- **A third board write path:** rejected — reuse the one validated boundary.
- **Building the v0.2 cadence/lifecycle apparatus** as part of this: rejected —
  same reason Loudon rejected it for the orchestrator. Thin path.

## Load these files first

1. **This handoff.**
2. [[Project Stewardship System]] § Status + § Implementation Plan (Stage E) — the
   umbrella; Stage E is its last unbuilt stage.
3. [[Palace Conatus]] — the *why*: the disharmony vocabulary, the escalation
   rationale, the digest-as-the-palace's-voice framing, the approval-loop caution.
4. [[Palace Agent Infrastructure Spec]] §2.2 (message schema), §2.5 (request_id
   split), §2.6 (Trickster inbox), §4.7 / §12 (Automated Trickster — the
   unspecced stub this builds out), and the permission protocol (RESOURCE_REQUEST
   / RESOURCE_GRANT / RESOURCE_DENY, the `blocking` flag).
5. [[BBS Blackboard]] § The Permission Protocol + § The Trickster Decision Inbox.
6. [[BBS Production Plan]] § Autonomous Build Contract — the phased-build pattern
   to mirror.
7. `_ops/swarm/persistent/blackboard.jsonl` — the live board. **Read the tail
   first (Phase 0).**
8. `.claude/skills/palace-orchestrator/` (SKILL.md, batch.md, prompts/shared.md,
   prompts/steward.md) — the orchestrator workflow this sits beside.
9. `_ops/stigmergy/app/` — the STIGMERGY v0.2 write path + validation boundary to
   reuse.

## Receiving environment (Cowork → Claude Code)

- **git works normally Mac-side** — commit + push clean. (Note: Cowork-side commits
  leave stale `.git/*.lock` files; this build should be committed from Claude Code
  on the Mac. If you inherit a wedged repo, `rm -f .git/HEAD.lock .git/index.lock`
  first.)
- **The orchestrator skill** invokes natively; Stage E likely extends it.
- **STIGMERGY:** `cd _ops/stigmergy/app && npm run dev` → `localhost:5173`.
- **Tests:** `npx vitest run` in `_ops/stigmergy/orchestrator` and `.../app`.
- **Node** is the stack; match the orchestrator's existing module + test
  conventions (pure cores exported and unit-tested, per the Stage B helpers).

## Resumption protocol (incoming Claude)

1. Read this handoff, then [[Palace Conatus]], then the Infrastructure Spec
   sections in the load list.
2. State the move back in one sentence. If you can't, ask Loudon.
3. **Run Phase 0 before anything else** — probe the live board; do not build the
   ruleset against assumed message shapes.
4. Take the §Open questions to Loudon as a short batch *before* writing the
   ruleset (Q1 especially — the safe ruleset is his call).
5. Default to shadow mode for the first real run. Earn write authority by matching
   Loudon's own decisions.
6. Honor the contract's hard rule: **never auto-grant an audition or an
   irreversible action.** That's a stop condition, not a workaround target.

## See also

- [[Project Stewardship System]] — the umbrella; § What's Open lists "Automated
  Trickster rule shape" as the open design question this closes.
- [[Palace Conatus]] — the organism-scale rationale for why escalation, not
  automation, is the goal.
- [[BBS Blackboard]] — the comm substrate and permission protocol.
- [[Trickster]] — the role being partially automated; the threshold between the
  human and the autonomous agents.
