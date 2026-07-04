---
title: "Palace Orchestrator — baton"
born: 2026-07-04
links:
  - target: "[[Palace Orchestrator]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry a cold-start move on [[Palace Orchestrator]] — finish the Machinery/Content Split by relocating the orchestrator's mode files into _ops/ and slimming the skill to a true shim — across a boundary, waiting to be caught by a session that can test the live batch, and deleted once the move is picked up."
---

# Baton: Palace Orchestrator — finish the shim (relocate the mode machinery)

> **COLD START — this work has not begun.** No prior state, no tried-and-rejected;
> those sections are intentionally absent, not lost. The cargo is the framing below,
> captured while hot (the 2026-07-04 session that gave the orchestrator its canon organ).
> Un-started work drifts faster than momentum work — read the On-pickup "still live?" check
> as load-bearing.

## Move
Finish the [[Palace Orchestrator]] retrofit's deferred half: relocate the orchestrator's **mode
machinery** (`songline.md`, `permanent.md`, `runAgentCycle.md`, `batch.md`, `trickster-auto.md`,
`two-paths.md`, `prompts/`, `examples/`) out of `.claude/skills/palace-orchestrator/` and into
`_ops/orchestrator/` (or `_ops/stigmergy/orchestrator/workflows/`), rewire all paths, and slim
`SKILL.md` to a true ~50-line shim like the Concierge's — so the skill dir holds only the
harness-fired pointer and the machinery lives in `_ops/` per the Machinery/Content Split.

## Why this move matters
The 2026-07-04 retrofit did the safe, high-value core — the canon organ [[Palace Orchestrator]]
now exists in the graph and `SKILL.md` declares itself a shim pointing at it (commit `c1df7a5`).
But `SKILL.md` is still ~215 lines and the mode files still live in `.claude/skills/`, so the
Machinery/Content Split is only *named*, not *done*. This is the last 10% — and the riskiest,
which is why it was carved out: the relocation touches the **live launchd weekly batch**
(`_ops/heartbeat/run-steward-batch.sh` → `com.loudon.palace.steward-batch.plist`), the relative
paths `SKILL.md` and the mode files use to reference each other, and the `prompts/` the runbook
loads. Break a path and daily stewardship silently stops. It wants its own session precisely
because it must be tested end-to-end, not folded into other work.

## Cold start
No relocation has begun. `SKILL.md`'s header already frames the shim (done `c1df7a5`); what
remains is the physical move + path rewire + the batch test. The one real constraint discovered
already: the skill's `description` frontmatter must stay byte-identical (the harness trigger and
the batch both match on it), and the batch must be run once after the move to confirm it still
resolves the skill and cycles a steward.

## Next move
Inventory every relative path in `.claude/skills/palace-orchestrator/` (SKILL.md → mode files;
mode files → each other; runbook → `prompts/*`; any `_ops/stigmergy/orchestrator/src/cli.js`
calls, which are already `_ops`-absolute and fine). Pick the target dir (`_ops/orchestrator/`
reads cleanest). `git mv` the mode files + `prompts/` + `examples/` there, rewire references,
slim `SKILL.md` to name + description + thin-shim body pointing at [[Palace Orchestrator]] +
the relocated runbook. Then **test the batch**: `bash _ops/heartbeat/run-steward-batch.sh`
(or the orchestrator's own dry-run path) and confirm it still finds + cycles a steward. Only
commit once the batch is green.

## Load these files first
1. `.claude/skills/palace-orchestrator/SKILL.md` (the shim to slim) + its mode files
2. `Palace development/Palace Orchestrator.md` (the organ — the shim points here)
3. `.claude/skills/concierge/SKILL.md` + `_ops/concierge/` (the target shape: thin shim + `_ops/` machinery)
4. `_ops/heartbeat/run-steward-batch.sh` + `_ops/heartbeat/launchd/com.loudon.palace.steward-batch.plist` (what must not break)
5. `_ops/stigmergy/orchestrator/README.md` (the engine already in `_ops/`)

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it is still live before you commit to it. The baton is a snapshot from when it was written; the project may have moved past it. Re-read the parent entry and `git log` it since the baton's `born` date, and confirm the "Current state" the baton quotes still matches the file. If the move is already done, superseded, or no longer wanted, STOP — surface it to Loudon and do not execute. A stale baton followed silently produces drift. (Receive every baton with this skepticism; the auto-staleness heuristic is off by design — the freshness call is yours.)
3. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive Step 7 relies on.
4. Mark it caught: remove the "Active Baton" section from the parent entry; for a board-announced baton with no parent entry, post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) instead. (This baton is both — remove the pointer *and* post the REPLY.)
5. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
6. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
7. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.
