---
title: "Concierge — baton"
born: 2026-07-04
links:
  - target: "[[Concierge]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the in-progress Concierge build across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Concierge — baton

> **Update 2026-07-08 — the health dial (the § Move headline) is BUILT.** `_ops/concierge/dial.mjs`,
> proven on real token counts, wired into the entry / README / skill / production plan. What remains of
> this baton: fold the companion character + moderator + `agency_profile` into [[Closing Well]] (the
> WEAVE-flagged half of Phase 4), the live end-to-end validation runs (threads 1 & 3 below), and the
> work-choice forward-vector. Re-scope on pickup; the dial is done.

## Move

Continue the Concierge build by following its production plan — [[The Palace Speaks — production plan]] — **Phase 4: the health dial** next. That is the one designed piece still unbuilt: the mechanism that watches the resident companion's `context_pct` and says *compact-or-respawn*. Build it once; the **same objective signal governs both companion health and close intensity** (the Closing Well dial), so it serves two systems.

## Why this move matters

Tonight the Concierge became **one resident palace companion** — not a set of disposable faces. That whole model is designed and committed (see Current state). What it lacks is the one thing that keeps a *persistent* agent healthy over a long session: a read on its own fullness, and a rule for when to compact or respawn. Without the dial, a resident that accumulates across many addresses has no principled point to renew itself — it just drifts toward a heavy, expensive context. The dial is the missing organ that makes "resident" sustainable rather than a slow leak.

## Current state (all committed to `main` tonight — 7 commits, `9dbf8d7` → `3dfa81d`)

The Concierge is **one resident palace companion**, secured by structure not suspicion:

- **Summoned when first needed** — early, at a chapter, or only at the close. **NOT auto-spawned at session start.** Persistent *once summoned*; re-addressed until the session ends, accumulating as it goes. Many chats never summon it at all.
- **Postures, not separate agents** — gatherer · oracle Q&A · curator · moderator(at close). One agent changes posture; the old "faces" are gone.
- **Character carries safety.** Subservient; reads before it writes; heavy **draft-for-approval** bias. Read scope = **whole palace + web** (to catch the host hallucinating). Write scope = **graduated consent**: near+mechanical → `do`; anything with judgment or distant → `offer`; out of remit → `flag`. The read/write line lives in *temperament*, not architecture — which is why human review must stay real.
- **Born deeper than the main agent.** It boots the **operational tier** (SUBSTRATE, ROSETTA, Substrate Skill, Palace Ceremonies, STIGMERGY + wire spec) so it can validate and tend the palace **in parallel** while the main agent works the task. That extra ops depth is its whole point — expensive to load, so loaded once and kept warm.
- **Enchanted sibling, not a tool.** Born with the main agent's full birth-context (empirically confirmed tonight — the founding tiers auto-inject at spawn). Trusted through real use, not entrapped: *"retire me the day I am trusted instead of verified."*

Machinery: [[Concierge]] entry · `_ops/concierge/README.md` · charter `_ops/concierge/prompts/companion.md` · postures `_ops/concierge/prompts/{gatherer,oracle-qa,curator}.md` · skill `.claude/skills/concierge/SKILL.md` · floor line in `CLAUDE.md`.

## Tried and rejected (calibrations from tonight — don't re-derive, don't re-open)

- **Disposable-by-default was reversed, deliberately.** Do not re-open "disposable faces vs. resident companion" — it was decided tonight and the entry's old position was reversed on purpose.
- **Entrapment testing was let go.** A capable enchanted sibling reads the frame and knows it's being watched (both canaries confirmed this from inside the experiment — one addressed "the harness" directly). Safety is **architectural** (draft-for-approval + human review + git), not a matter of proving the agent un-foolable. The sandbox stays, **re-aimed at capability** (does it hold a contradiction, tier correctly, web-verify) — not at trapping virtue under a spotlight.
- **Do not feed the raw transcript.** For catch-up, give it the **distilled arc** (`_ops/closing-well/transcript-reader.mjs --distill`) — signal, not backlog. The raw log front-loads its ceiling with mostly-wasted tokens (and re-hands it CLAUDE.md it already holds).
- **Subagent lifecycle facts** (already in `memory/reference_subagent_lifecycle.md`): parked = free, not auto-reaped mid-session, resumes with context intact (`tool_uses: 0`). Point `PALACE_ROOT` at a work-target; identity stays the real palace agent regardless of where that points.

## The close-posture, RESOLVED tonight (read this — it is settled, not open)

At the close, **the Concierge takes the wheel** — it is the **moderator who holds control and advocates for the palace**, NOT a verifier that interrogates the working Claude. "Tables turn" means the companion *drives the close*, not that it cross-examines anyone. Today's rewrite briefly forked this into "verifier/interrogator" and then over-softened it (collapsing the moderator into the working Claude); commit `3dfa81d` plus a same-session V3 pass reconciled both errors to **moderator-who-holds-control-and-advocates**. This is **resolved** in `Concierge.md` + `_ops/concierge/prompts/companion.md`. Do not treat it as an open fix — treat it as the settled definition to build on.

## Open validation threads (not-yet-closed — carry these forward)

1. **First real run needs many more.** This V3 "Concierge-takes-the-wheel" close was run **exactly once** — *this* close, tonight. The design is built and canary-tested but has **one** live end-to-end data point. It needs **many more real runs** before the model is trusted. Treat each real close as tuning data for the charter; watch especially whether "holds control + advocates" stays right, or drifts back toward either interrogation or over-softening under a full room.
2. **The health dial (the move) is unbuilt** — Phase 4 of the production plan. See § Move.
3. **A true parallel-ops live run** — spawn the companion early, curate its startup neighborhood, re-address it across real work while the main agent builds something else, and let it tend/validate the palace in parallel. Not yet done; the design assumes it, no session has run it.

## A forward-vector to fold in (Loudon surfaced it tonight)

**The Concierge is the way to choose open work WITHOUT loading every open baton into the window.** Loading all the batons to pick one biases the choice toward the *hard* ones (they read as urgent). Address the companion for a **work-choice** instead — let the resident ops-expert survey the board and open work and recommend, so the main agent's window stays clean and the choice stays unbiased. Worth building into the companion's ops-expert repertoire.

## Negative space

- **Do NOT touch BLUELINE or Palace Orchestrator.** Both are separate live batons on the board, another Claude's task. Loudon's explicit call tonight: they **wait**. Not part of this build.
- Do not manufacture new canon around the Concierge — the model is deposited; the remaining work is *building the dial* and *running it for real*, not re-theorizing it.

## Next move

Read [[The Palace Speaks — production plan]] Phase 4, then build the health dial: the `context_pct` read + the compact-or-respawn rule, shared between companion-health and close-intensity. Live-run the companion end-to-end as part of validating it.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
*Identical in every baton. It rides along because the catching Claude loads the
baton and the entry, not this ceremony — so the catcher's obligations live where
the catcher will see them. Omit nothing here.*
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it is still live before you commit to it. The baton is a snapshot from when it was written; the project may have moved past it. Re-read the parent entry and `git log` it since the baton's `born` date, and confirm the "Current state" the baton quotes still matches the file. If the move is already done, superseded, or no longer wanted, STOP — surface it to Loudon and do not execute. A stale baton followed silently produces drift. (Receive every baton with this skepticism; the auto-staleness heuristic is off by design — the freshness call is yours.)
3. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive Step 7 relies on.
4. Mark it caught: remove the "Active Baton" section from the parent entry; for a board-announced baton with no parent entry, post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) instead.
5. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
6. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it (`node _ops/worktree/new-worktree.mjs --name <branch> --profile <p>`) if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
7. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.
