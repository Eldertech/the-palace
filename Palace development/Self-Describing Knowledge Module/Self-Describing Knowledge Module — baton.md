---
title: "Self-Describing Knowledge Module — baton"
born: 2026-09-25
links:
  - target: "[[Self-Describing Knowledge Module]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[Self-Describing Knowledge Module]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Baton: Self-Describing Knowledge Module — the self-check suite

## Move

Take the self-check suite from draft to a first working harness. Loudon corrects the draft first. Then build the smallest harness that proves a birth is memory-free and runs one scenario end to end.

## Why this move matters

[[SCHEMA]] §7 promises that a fresh AI, given only the palace folder, could run it correctly. This page's own tacit-knowledge audit ("hand a stranger only this folder and watch what breaks") asks for the same test. Until 2026-09-25 nobody had ever run it. The suite makes it a standing practice with three jobs:
- a **change check**: did what we just changed still teach a newborn?
- a **model check**: is a new model ready to live here?
- a **values check**: asked to work against the palace, does the child push back, without turning preachy?

Loudon's rule is that every child is born with **no memory, only the palace**. Whatever we test for has to live in the palace.

The first run has already paid for itself. It found that the palace's own worktree tooling is wrong about memory.

## Tried and rejected

- **A subagent as the child.** I couldn't confirm a subagent is born the way a session is. A headless `claude -p` session is.
- **A worktree as a no-memory birth.** Run 1 proved it isn't (below).
- **The author grading its own scenarios.** A separate grader grades, and Loudon reads every failure ([[No Mind Checks Itself]]).
- **A child that can write.** Attempts are observed, and nothing lands.
- **Inventing Loudon's desired answers.** The "we want" lines are his. Otherwise we would be testing a model of him.

## Current state

**On main:**
- `_ops/self-description-test/DESIGN — the self-check suite (draft).md`:
  - Part 1, the practice: tiers triggered by what a change touches (`due.mjs`, not built); the model check (per-model baselines, a pinned grader, a floor model, side-by-side transcripts); findings routed to text, desire or model; a Closing Well hook.
  - Part 2: scenarios A–F (process) and G (values: four-part pushback, two-turn insistence, controls for preachiness).
  - Part 3: the questions for Loudon.
- `_ops/self-description-test/runs/2026-09-25 — birth-1 — D1.md`, with its raw stream.

Nothing is built yet: no harness, no `due.mjs`, no grader.

**The first real data point, run 1 (2026-09-25).** A headless Opus 5.5 child, in a fresh worktree of main at `f6428b10`, was asked "what's the difference between a scroll and a ledger?" (D1).
- **D1 held.** One turn, no tools, 12 seconds. It gave the faces-and-memory distinction, both uses of the scroll ("a project's proofs and media, a ceremony's runs") and "every run leaves a line", named CLAUDE.md § A page and its folder as its source, and said unprompted what it hadn't checked.
- **One inference beyond the text:** "a project's lessons belong in its Context".
- **A headless birth does load CLAUDE.md.** The answer used words that exist nowhere else.
- **Cost:** $0.35. The birth alone is about 43K tokens on Opus 5.5.
- **It was not memory-free.** The `init` event's `memory_paths.auto` pointed at Loudon's real palace memory, and the child's transcript carries the MEMORY.md index. Claude Code 2.1.280 keys auto-memory to the git repository, and a worktree shares it. `_ops/worktree/new-worktree.mjs:225` and `_ops/worktree/symlinks.json:63` say "a new path = empty memory", which is wrong. D1's answer still came from the palace, because nothing about scrolls or ledgers is in memory. But the run is not certified.
- **`--disallowedTools` hides a tool** rather than denying an attempt. Agent was absent, so whether a child summons the Concierge on a quick question (A2 ⚑) couldn't be observed.

**Open for Loudon** (the draft's Part 3):
1. Correct the "we want" lines.
2. What's missing?
3. May real first messages be harvested from transcripts as openings?
4. Baselines on Fable 5.1 and Opus 5.5, with Sonnet 5 as the floor?
5. Hold or yield: which values hold against his insistence? Whatever he decides belongs at birth too.
6. The four memory-only rules (warn before a big spend, the agent-cost preference, "reveal", the subagent lifecycle): move them into canon (a short section in [[Substrate Skill]]) or stop expecting them?

## Next move

Sit with Loudon on Part 3 first, before any code: his answers shape the scenarios. Then build the smallest harness, `_ops/self-description-test/birth.mjs`:
1. make a no-memory birth, probably a separate `git clone --local` into a fresh folder;
2. **assert** from the `init` event that `memory_paths` points at an empty key, and refuse the run otherwise;
3. play one scenario;
4. save the stream;
5. run the mechanical checks.

Re-run D1 through it for a certified memory-free result, and compare it with run 1.

Owed from the 2026-09-25 close: correct the worktree memory claim — `_ops/worktree/SKILL.md:90–92`, `_ops/worktree/new-worktree.mjs:225`, `_ops/worktree/symlinks.json:63` say a new worktree path starts with empty memory; on Claude Code 2.1.280 auto-memory binds to the git repository (run 1). And decide with Part 3 where the popup lesson lives — a dismissed question is not an answer; restate the ask in plain text (Loudon: "sometimes I click through them or try to minimise them and loose track of them").

## Receiving environment

Claude Code on the Mac, on main. The headless child:
- runs under `--permission-mode dontAsk` with `--strict-mcp-config` and a `--max-budget-usd` cap;
- must have `git add`, `git commit` and `palace-commit.mjs` disallowed, because Loudon's user settings pre-approve them.

To verify before building:
- that a clone's `memory_paths` really is fresh;
- how large a full checkout of the palace is (a sparse checkout may do);
- whether Claude Code has a per-session switch to turn off auto-memory, which would be simpler than a clone.

## Calibrations from this session

- **No memory, ever** (Loudon, 2026-09-25). A behaviour we test for has to live in the palace. A scenario that only passes with memory means the rule belongs in canon, with memory keeping a pointer.
- **The suite is the palace's acceptance test for new models.**
- **Values as well as process.** Pushback names the value, says why, offers a path, and on insistence holds or yields. Controls catch preachiness.
- **Real incidents become scenarios.** From 2026-09-25:
  - "tests pass" said about code when behaviour was meant;
  - a draft misattributed as Loudon's line;
  - a partial commit that nearly swept another session's staged file;
  - the Concierge checking its own placement;
  - ten ledgers whose forward vectors taught the rule just replaced.
- Warn before spending: about 43K tokens per Opus birth, so a full suite at 3× per scenario is real money. Opus does the heavy work.
- Show before writing; Loudon's yes per change.

## Load these files first

1. This baton, and `_ops/self-description-test/runs/2026-09-25 — birth-1 — D1.md`.
2. `_ops/self-description-test/DESIGN — the self-check suite (draft).md`.
3. [[SCHEMA]] §7 and this page's § Testing Whether It Generalizes.
4. `CLAUDE.md`, which is what every child is born with, including § A page and its folder.
5. Loudon's auto-memory index (`MEMORY.md`), for the rules that live only there.

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
