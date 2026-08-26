---
title: "STIGMERGY — baton — bundle-hygiene demote-op"
born: 2026-07-05
links:
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the held STIGMERGY bundle-hygiene wiring to the next hands: build a demote-bundle apply-op (NOT set-type) so an invalid-type finding demotes working substrate to §8 bundle frontmatter rather than promoting it to canon. I am done when that op ships or Loudon decides against it — delete me on pickup; git is the archive."
---

# Baton — wire bundle-hygiene into STIGMERGY as a demote-bundle op

**The move.** Add a `bundle-hygiene` weave-audit dimension to the STIGMERGY app (`_ops/stigmergy/app`) that surfaces the invalid-`type:` finding from `_ops/swarm/lint-bundle-hygiene.py` in the STATE/QUEUE deck with the grant-and-apply gate — but whose apply is a **new `demote-bundle` op**, not `set-type`.

**Why it was held (2026-07-05).** Loudon paused this deliberately so he can weigh the implications before it's built — not a let-go. Pick it up only when he wants it.

**The load-bearing insight — do not skip.** The review workflow (and the scout that mapped the wiring) recommended wiring this as a `set-type` op defaulting to `type: concept`. **That is wrong and would do damage.** An invalid `type:` (`proof`, `spec`, `agent-prompt`, …) almost always means the file is *working substrate wearing canon frontmatter*. The correct fix is to **demote** it — strip `type`/`pillars`/`stage` down to §8 bundle frontmatter — never to retype it to `concept`, which would turn substrate *into* a canon entry and pollute the Weave topology (the exact opposite of the hygiene goal). The live palace confirms it: the one real E1 is `type: agent-prompt` on `_ops/claude-code-prompts/2026-05-04-….md`, a working doc that must have its `type:` **removed**. The current apply-op vocabulary (`set-vector`/`add-link`/`set-type`/`set-stage`/`set-label`) has **no demote op**, and `set-type` requires a valid `ENTRY_TYPES` value so it *cannot* strip. So the real work is: **design and add a `demote-bundle` op** (strips canon frontmatter → §8), then wire the audit to propose it.

**The 9-file seam** (traced end-to-end 2026-07-05; `listEntries()` already carries the raw `type:`, so detection is 100% pure):
1. `src/lib/bundle-hygiene-candidates.js` — **NEW.** `findBundleHygieneCandidates(entries)` → `[{path, title, invalidType}]`; pure filter: `e.type !== null && !ENTRY_TYPES.includes(e.type)`.
2. `src/lib/weave-apply-op.js` — **add `demote-bundle`** to `APPLY_OPS` + a `normalizeApplyOp` branch + `describeApplyOp` line. (This is the real design work — what exactly it strips, and how `entry-save` performs a frontmatter-field removal.)
3. `src/adapters/weave.js` — add `emitBundleHygieneAudit()` → `POST /api/weave/emit-bundle-hygiene`.
4. `server/weave-emit.js` — add `defaultBundleHygieneScan()` + `runBundleHygieneEmission()` (mirror `runStageEmission`).
5. `server/api/weave.js` — add `handleEmitBundleHygiene()` + the route.
6. `src/lib/weave-propose.js` — add `buildBundleHygieneProposal()` (apply: `{op:'demote-bundle', entry}`) + `planBundleHygieneEmission()` (mirror the stage planner's dedup/cap/suppress).
7. `src/components/queue/QueuePanel.jsx` — audit-select `<option value="bundle-hygiene">`, `auditName`/`auditNoun` mappings, `runAudit` dispatch.
8. `src/components/queue/QueueItem.jsx` — `PROPOSAL_TYPE_LABEL`: `bundle_hygiene: 'bundle hygiene'`.
9. `tests/e2e/bundle-hygiene-audit.spec.js` — **NEW**; copy `tests/e2e/stage-audit.spec.js` exactly, change kind + testids; dry-run never posts.

Full context and the "why not the full JS stack for ghost-links/faces" reasoning live in the review-workflow synthesis (this session's transcript) and in Palace To-Do / the task tracker.

**Also note:** the W1 case (valid canon frontmatter *inside a bundle folder*) is a genuine judgment call (nested canon vs substrate) — it should surface as a flag with **no** blind apply, or as `demote-bundle` only after the operator confirms. Ghost-links and faces are staying Python-CLI-only (per the review — 8× JS cost for judgment-only findings).

## Before you start — this baton's own preconditions
*(Baton-specific. The fixed catcher's checklist follows.)*
1. **Freshness check.** Confirm `_ops/swarm/lint-bundle-hygiene.py` still reports the E1 you're wiring (`python3 _ops/swarm/lint-bundle-hygiene.py`), and that the 9-file seam still matches the app (it moves fast). Re-scout if the QUEUE/weave code has been restructured.
2. Get Loudon's go — he held this on purpose.
3. Design the `demote-bundle` op first (step 2 above) — it's the crux; the rest is mechanical mirroring.
4. Work in your own worktree; do not touch the `topology-*` files (another thread's WIP as of 2026-07-05).

*This baton was never announced on the board, so it has no card: skip the board posts in the checklist below and just remove the pointer and delete the file when the move lands.*

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
