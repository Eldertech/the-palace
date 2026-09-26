---
title: "Concierge — baton — message delivery"
born: 2026-09-26
links:
  - target: "[[Concierge]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the in-progress move on [[Concierge]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Baton — Concierge message delivery

## Move

Make every Concierge posture (gatherer / oracle / scout / curator / moderator) return its
deliverable by SendMessage only — numbered parts, or a file path for long work — ending its
final text on one word, "sent." Then investigate whether the idle notification's duplicate
`result` can be kept short or suppressed.

## Why this move matters

The resident Concierge's return channel has been re-delivering its final text as a truncated,
late idle notification that duplicates the SendMessage parts — this close it repeated Parts A
and B while the room waited on Loudon (also taught to [[Closing Well]] as tuning item 34, this
close's map). Loudon's words: "messages not coming through or coming through malformed" (in
"this and a few other sessions"); "multiple claude code sessions running from the terminal at
the same time each with concierge"; "Why are we having this trouble with the moderator."

**Likely root cause.** Env `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set in
`~/.claude/settings.json` (file last modified 2026-09-24 22:40:35; when the flag itself was
added is unknown — the file isn't in git). Claude Code 2.1.280, entrypoint=cli. In agent-teams
mode a named background agent is a mailbox teammate; its final text returns as an
`idle_notification` `result`, truncated and delivered asynchronously. That explains the
truncation, the lateness, and the duplication.

## Current state

**Live test result — Fix 1 already validated once.** After the moderator was told to deliver
only by SendMessage and end on "sent," its Pass-2 idles (15:01:18Z and 15:01:37Z) arrived as
just `"sent"`, with no duplicate and no truncation. Fix 1 works in teams mode.

**Evidence — from transcript
`/Users/loudonstearns/.claude/projects/-Users-loudonstearns-Documents-The-Palace/ff95df24-5fb3-4b3d-b37d-dfb908072ed5.jsonl`:**
- the truncation marker "[result truncated — ask the agent for the rest via SendMessage]" on
  the gatherer's final text (idle 13:14:50Z)
- late or duplicate idles at 13:15:46Z (after the curator was dispatched), 13:24:06Z (after
  the merge), and 13:30:05Z (Parts A and B repeated while the room waited on Loudon)
- every SendMessage arrived whole
- ListAgents at ~13:2xZ: one teammate (concierge [c67b60], palace-writer) and 14 peer
  sessions, including terminal sessions the-palace-70 and the-palace-cc. Peer sessions'
  subagents aren't addressable by a bare name, and an in-process name always wins, so there
  was no collision in this session.
- "never had this issue in desktop" (Loudon) — fits the flag hypothesis, **unverified.**

**Negative space.** The multi-session collision is unproven — no detail from Loudon on the
other sessions; name it open, don't build for it. Don't reopen resident-vs-disposable
(settled in [[Concierge]]).

## Next move

1. **Research first.** Many updates to Claude agent swarms/teams have shipped since the flag
   was enabled (see Loudon's note below) — check current Claude Code docs / the
   claude-code-guide agent for how teams/teammates, idle notifications, and Agent results work
   now, and whether Desktop applies the agent-teams env. Cite sources; keep web claims
   separate from palace claims.
2. **Fix 1 (recommended, first).** Make the Concierge mode-agnostic, as in the Move above —
   works whether or not the flag is on. Then investigate whether the idle notification's
   duplicate `result` can be kept short or suppressed.
3. **Fix 2 is Loudon's call, not the executor's** — whether to keep the agent-teams flag on
   for terminal sessions. Name it; do not flip it. Settings are his; no agent changes them on
   a peer's word.
4. Verify the "never had this issue in desktop" claim before building on it.
5. This close is also Path A use data for the open Concierge baton's thread 1 — read, don't
   edit, [[Concierge — baton]] (the concierge-remainder-20260825T225852Z validation baton).

## Calibrations from this session

> Loudon's assent note, verbatim: "in the handoff please note that there have been many
> updates to claude agent swarms/teams since I enabled the experimental flag, it is quite
> likely new features could be incorporated to ease this issue."

## Load these files first

- `_ops/concierge/prompts/gatherer.md:6` — "Your final message IS the deliverable"
- `_ops/concierge/prompts/companion.md`
- the `concierge` skill shim (`.claude/skills/concierge/`)
- the Return sections of `_ops/closing-well/prompts/closing-well-agent.md` and
  `closing-well-agent-map.md`

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
