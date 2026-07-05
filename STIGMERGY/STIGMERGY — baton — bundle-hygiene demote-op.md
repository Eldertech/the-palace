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

## On pickup
1. **Freshness check.** Confirm `_ops/swarm/lint-bundle-hygiene.py` still reports the E1 you're wiring (`python3 _ops/swarm/lint-bundle-hygiene.py`), and that the 9-file seam still matches the app (it moves fast). Re-scout if the QUEUE/weave code has been restructured.
2. Get Loudon's go — he held this on purpose.
3. Design the `demote-bundle` op first (step 2 above) — it's the crux; the rest is mechanical mirroring.
4. Work in your own worktree; do not touch the `topology-*` files (another thread's WIP as of 2026-07-05).
5. Delete this baton on completion (git is the archive); update `[[STIGMERGY]]`'s Active Baton pointer.
