---
title: "Concierge — baton"
born: 2026-08-25
links:
  - target: "[[Concierge]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the one thread the Concierge build cannot finish by building — the live validation of two mechanisms that exist but have never been used for real — and I wait to be deleted by a session that ran them."
---

# Concierge — baton

> **Re-batoned 2026-08-25** from the partial close of `concierge-remainder-20260825T224537Z`
> (board id `concierge-remainder-20260825T225852Z`). The work-choice vector landed; live
> validation is what remains. Prior batons are in git at `4a40251` and `b37a4af`.

## Already landed — do not redo

- **The health dial** — `_ops/concierge/dial.mjs`, 2026-07-08 (`3a41694`, refined `fee1fdf`).
- **The fold into [[Closing Well]]** — 2026-08-25 (`02e949a`). The moderator is the resident
  companion taking the wheel, not a fresh enchanted instance.
- **The work-choice vector** — 2026-08-25 (`fc0b980`). The **scout** posture
  (`_ops/concierge/prompts/scout.md`) plus `_ops/concierge/return-map.mjs`, which runs the
  [[Return Ceremony]]'s whole query block and prints each probe beside the command that produced
  it. The split is load-bearing: the script gathers evidence and refuses to interpret; the posture
  judges. Wired into the skill, the README, the charter, the [[Concierge]] entry, and the Return
  card. **Do not rebuild or re-theorize this** — it needs running, not more design.

## Move — live validation, both mechanisms

Two things are built and neither has been used for real. Neither is finished by building more.

**1. The V3 close model.** "Companion takes the wheel" has exactly **one** real end-to-end run
(2026-07-04). It is canary-tested, not trusted. Watch specifically whether *holds control and
advocates* stays right or drifts — back toward interrogation on one side, over-softening into the
working Claude on the other. Both errors have happened once already. Treat each real close as
tuning data for the charter.

**2. The scout.** It has never chosen work in a real return. Its ranking rules are reasoned from
the 2026-08-25 by-hand failure, not tuned by a live work-choice. Watch two things in particular:
whether *an open handoff outranks a fresh idea* holds when the fresh idea is genuinely better, and
whether the one-move discipline survives a board with three equally live candidates. Also watch
whether it actually resists opening every baton under pressure — that restraint is the whole point,
and it lives in a prompt, not in a guardrail.

## The shape of the work

**This baton is closed by use, not by a commit.** The right session to catch it is one that was
going to return or close anyway — run the ceremony for real, then write down what the run taught.
Do not build more machinery here until a real run says what is wrong; machinery added ahead of
evidence is how the last thread of a project grows a fourth thread.

## Negative space

- **Do NOT touch BLUELINE or Palace Orchestrator.** Both are separate live batons, another Claude's
  task. Loudon's explicit call 2026-07-04: they wait.
- **Do not re-open settled ground.** Disposable-faces vs. resident companion is decided (resident);
  the close-posture is *moderator who holds control and advocates*, not verifier-who-interrogates;
  the scout's evidence/judgment split is decided. All settled in [[Concierge]], not open questions.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
*Identical in every baton. It rides along because the catching Claude loads the
baton and the entry, not this ceremony — so the catcher's obligations live where
the catcher will see them. Omit nothing here.*
A pickup has two beats: **claim** it when you catch it, **close** it when the move lands. The card stays visible in between — a claim that ages with no close is how a dropped baton (a "fumble") surfaces instead of vanishing. (A parent-entry baton that was never announced on the board has no card; skip the board posts — just remove the pointer and delete the file at close, step 8.)

**Catch it — claim:**
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it may already be done before you commit to it. The baton is a snapshot from when it was written; the project may have moved past it. Re-read the parent entry and `git log` it since the baton's `born` date, and confirm the "Current state" the baton quotes still matches the file. For a board-announced baton, `node _ops/stigmergy/pickup-handoff.mjs <id>` prints exactly this reconciliation view — every commit that touched the entry since the baton posted — and then claims the card, so run it and read the list *before* you continue. If the move is already done, superseded, or no longer wanted, STOP — do not claim it; surface to Loudon, and if it plainly landed already, close it as a reconciler (step 7). A stale baton followed silently produces drift. (The auto-staleness heuristic is off by design — the freshness call is yours.)
3. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive step 8 relies on.
4. Claim it. For a board-announced baton (it shows in `list-handoffs`), the `pickup-handoff.mjs` from step 2 has already posted the claim (`handoff_picked_up`, `lifecycle: claim`) — the card moves to **CLAIMED (in flight)**; it does *not* leave the board. Leave the "Active Baton" pointer and the baton file in place for now — they come out at close, so a fumble mid-move never erases the work.
5. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it (`node _ops/worktree/new-worktree.mjs --name <branch> --profile <p>`) if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
6. Act on the move, holding the calibrations above.

**Close it — when the move lands:**
7. Post the close. `node _ops/stigmergy/close-handoff.mjs <id | entry> --commit <hash>` retires the card — an explicit close is the *only* thing that clears it (done is never inferred). Cite the commit that landed the move: it makes the close a checkable claim, not a self-report. **Complete, or re-baton the rest:** if you finished the whole move, close plain; if you did only part, `--partial --remainder "<what's left>"` posts the leftover as a fresh `handoff_ready` so it reappears as open work. Never let "in the spirit of the original" quietly drop scope — a gap becomes a new baton, not silence.
8. Delete the baton file (git is its archive) and remove the "Active Baton" section from the parent entry. On a surface that can't delete (Cowork), remove the pointer and note "deletion pending." Steward batons are the exception — updated in place, never deleted or closed.
