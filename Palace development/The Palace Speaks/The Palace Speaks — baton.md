---
title: "The Palace Speaks — baton"
born: 2026-07-04
links:
  - target: "[[The Palace Speaks]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the interlocutor migration forward from a finished Phase 2 into Phase 3 — the steward, the first face that writes — with this session's calibrations, waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Baton: The Palace Speaks — Phase 3, the steward face

> **Continuation baton** (not cold-start): it carries heavy accumulated state — Phases 1–2
> are built and live. The mission has real momentum; this hands the next session its place in it.

## Move
Build **Phase 3 — the steward face**: the Concierge's first face that *writes*. 1-hop
neighborhood tending of the entries a session touched, in three tiers — **do** (reversible),
**offer** (human-gated), **flag** (non-acting).

## Why this move matters
Phases 1–2 gave the palace a **read-only** interlocutor — you can address it (find, ask) and it
answers from a disposable window, citing files, never touching the graph. The steward crosses the
real line: it is the first face that *mutates canon*. That is why it comes third (risk-ascending)
and why its guards matter more than any read-only face's. Get the do/offer/flag tiers and their
guards right and the palace can be *tended* by address, not just queried.

## Current state (what is built and live)
- **Phase 1 — [[Concierge]]** (`Palace development/Concierge.md`), a canon `meta` organ: the
  addressable front door, an agent that dons masks, dispatched fresh per request. Context-offload
  is its headline benefit.
- **Phase 2 — the oracle face, complete and committed:** the **gatherer**
  (`_ops/concierge/prompts/gatherer.md` → a file-cited index) and **Q&A**
  (`prompts/oracle-qa.md` → a cited answer), plus the **address verb** — the `concierge` skill
  (`.claude/skills/concierge/SKILL.md`) triages a plain-language address to a face. Both gatherer
  and Q&A passed live verify gates.
- **The build method** (from [[Skills Are Enchantable Pages]]): every face = a **canon page +
  a thin `.claude/skills` shim**. The steward follows this — do not build it as loose machinery.
- **The dispatch pattern** (Path 2): the Agent tool + transcript-reader for context + a prompt in
  `_ops/concierge/prompts/`. Reuse it.

## Calibrations from this session (not in the plan)
- **Read-only faces under-search unless pushed** — the oracle Q&A first missed its bullseye entry;
  the fix forced "open the home entry before synthesizing." The steward's *do/offer/flag* needs the
  same rigor: find the true 1-hop neighborhood before acting, don't act on a partial read.
- **The steward writes → the honesty guards are load-bearing here**, not optional: *show before
  write* travels with it; `do` must be truly reversible; `offer` truly waits for Loudon; `flag`
  never acts. Bound it to one hop — overreach past the touched neighborhood is the failure mode.
- **Context-offload still holds** — keep the steward a disposable dispatch; the mess stays in its
  window.
- **The dial** (moderator effort vs. room-fullness, Phase 4) is still unsolved: wire it to an
  *objective* context signal (`health.context_pct` / transcript estimate), never the active
  Claude's self-report. Not this phase, but don't let it leak in.

## Next move
Read the files below. Design the steward as a **canon organ + shim**, with the do/offer/flag tiers
and each tier's guard spelled out; then build one prompt (`_ops/concierge/prompts/steward.md`) and
**live-test it on a real 1-hop neighborhood** (the entries this-or-a-recent session touched),
checking it never reaches past one hop and that `offer` genuinely gates on Loudon.

## Load these files first
1. `Palace development/The Palace Speaks/The Palace Speaks — production plan.md` § Phase 3
2. `Palace development/Concierge.md` (the organ + the roster) + `_ops/concierge/README.md` (dispatch)
3. `_ops/concierge/prompts/gatherer.md` + `oracle-qa.md` (the read-only pattern to extend)
4. `Palace development/Skills Are Enchantable Pages.md` (the canon-page + shim build method)

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it is still live before you commit to it. The baton is a snapshot from when it was written; the project may have moved past it. Re-read the parent entry and `git log` it since the baton's `born` date, and confirm the "Current state" the baton quotes still matches the file. If the move is already done, superseded, or no longer wanted, STOP — surface it to Loudon and do not execute. A stale baton followed silently produces drift. (Receive every baton with this skepticism; the auto-staleness heuristic is off by design — the freshness call is yours.)
3. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive Step 7 relies on.
4. Mark it caught: remove the "Active Baton" section from the parent entry; for a board-announced baton with no parent entry, post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) instead. (This baton is both — remove the pointer *and* post the REPLY.)
5. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
6. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
7. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.
