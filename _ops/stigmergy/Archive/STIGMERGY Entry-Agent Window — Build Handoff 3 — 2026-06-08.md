---
title: "STIGMERGY Entry-Agent Window — Build Handoff 3"
born: 2026-06-08
genre: build continuation (Claude Code, Mac)
status: ready
links:
  - target: "[[STIGMERGY Entry-Agent Window — Integration Plan]]"
    type: connects-to
    label: "handoff-for"
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: "builds-into"
forward_vector: "I carry the entry-agent companion from a green M1-complete checkpoint into M2 (bold asks → Maker/Shop) and the merge-to-main step. I am caught when a fresh Claude has the worktree green and picks up M2; then I archive."
---

# Handoff: STIGMERGY Entry-Agent Window (build 3)

> **Archived 2026-06-08 on consumption — but M2 was PARKED, not executed.** A fresh Claude read this handoff; Loudon then chose to defer M2 (Tier-B Maker/Shop dispatch) rather than pick it up — to use the Tier-A Companion more first and to let the Maker/Shop dispatch workflow mature on the TRICKSTER board, which will inform the eventual build. Live status, parked banner, and revival conditions: [[STIGMERGY Entry-Agent Window — Integration Plan]] §5. The M1 sections below remain an accurate record of what shipped.

## Move

M1 is **complete**. The Companion discusses, edits the body honestly (M1c), and
now also: renders/authors **graffiti**, narrates **adaptively** (quiet when the
edit speaks), supports **post-commit undo**, and edits the **forward vector**
(never silently). All shipped, green, on `feature/stigmergy-entry-agent`.

The remaining move is **M2 — Tier-B bold asks → Maker/Shop** (the big one;
Integration Plan §5). Plus two smaller follow-ups: the **merge-to-main step**
(fold the feature in; tidy the edits-worktree fork) and **general frontmatter
editing** (beyond the vector — type/stage/links, via `emitEntryFile`).

## Why this move matters

The honesty spine + the whole Tier-A interaction are now proven and loved. M2 is
a different shape: a bold ask ("enrich this with a cyberpunk diagram") can't be
answered in one turn — it must fan out to the **Maker** and **Shop** Specialists
as a real worker job, possibly on the Mac host, and return artifacts that land
honestly. The window becomes a **board-reader** for that job (QUEUE + PROOF over
SSE), not a request/response box. Fresh context is recommended — M2 is large.

## Current state — a clean, committed checkpoint

**Branch `feature/stigmergy-entry-agent`** in the worktree
`/Users/loudonstearns/Documents/palace-entry-agent`. **11 commits past `main`
(5fc0efb); suite green (78 files / 1157 vitest).** This session added 6 (newest
first):

1. `4880547` — set-vector: companion edits the forward vector, never silently
2. `344f5c1` — post-commit undo (honest revert) (M1d)
3. `3ad9ed3` — adaptive edit narration — stay quiet (M1d)
4. `c53d936` — companion can pin graffiti via the enforced path (M1d)
5. `3f7fac5` — graffiti renders as visible scrawls in STATE (M1d)
6. `f48db2d` — companion declines frontmatter edits honestly (the now-superseded stopgap)

(Prior checkpoint, Build Handoff 2: `dfe7f58` … `9e20bcb`.)

Working tree carries only **runtime artifacts** (`_ops/swarm/persistent/
blackboard.jsonl`, `_ops/stigmergy/.actuator-companion/`) — never commit those;
stage explicit code paths only.

### The three git surfaces (unchanged — do not conflate)

- **`main`** — the live palace. Untouched.
- **`feature/stigmergy-entry-agent`** — the *code*. Becomes real STIGMERGY only
  when merged to main (not yet done).
- **`stigmergy-edits`** (worktree `../palace-stigmergy-edits`, created lazily on
  first companion edit) — where the companion's *content* edits land,
  quarantined. **Wrinkle:** it was forked from the *feature* branch, so it is
  entangled with feature code — cherry-pick individual edit commits onto main,
  never merge the whole branch. Tidy this when wiring the merge step.

## What this session built (so the next Claude doesn't re-derive it)

All in `_ops/stigmergy/app/`:

- **Graffiti.** `EntryBody.jsx` no longer strips HTML comments — it renders them
  as visible **scrawls** (block + inline), each tagged with its form (`graffiti`
  / `claude → loudon` / `note`); Obsidian/exports still hide them (storage
  unchanged). Decided with Loudon: **all graffiti forms visible**, new marker is
  `<!-- graffiti: text -->`. `classifyGraffiti` reads form+text; empty drops.
  The companion authors them via a `graffiti` op (`armed-write.js applyOp`):
  pins at top, or after a unique `find` anchor.
- **Adaptive narration.** Prompt tells the worker to leave `reply` empty for a
  clean edit; the reap posts a reply bubble only when there is one (the edit
  marker speaks). Every turn still yields ≥1 board message (so `sending` clears).
- **Undo (post-commit).** `revertCommit` (`armed-write.js`) makes a NEW inverse
  commit (`git revert --no-edit`, 3-way so later edits survive) on the
  quarantine branch — never a silent rollback. `companionLane.undo()` +
  `POST /api/entry-agent/undo` + `postUndo` adapter; the `[undo]` control on the
  edit marker; revert PROOF on the same turn marks the original `reverted`.
- **Forward-vector editing (the real bug fix).** `set-vector` op edits the
  `forward_vector` line **surgically** (replace one line in the verbatim
  frontmatter — no re-emit, no field re-order, churn-free). **Never silent:**
  carries `vectorChange{from,to}` → PROOF `vector_change` → a prominent amber
  flag on the marker (old struck → new), still undoable. Other frontmatter stays
  discuss-only. *This superseded the stopgap (`f48db2d`); the prompt's capability
  boundary was rewritten in the same commit, so there is no stale stopgap text.*

## Decisions made this session (don't reopen without reason)

- **All graffiti forms render visible** in STIGMERGY (not just a new marker).
  New companion marker: `<!-- graffiti: text -->`. Formalizing the graffiti
  *standard* into the palace remains a separate queued to-do.
- **Forward-vector churn policy: surgical line replacement, not `emitEntryFile`.**
  Re-emit reorders fields to canonical order → noisy diffs on entries not already
  canonical. Surgical touches one line. (General frontmatter editing, when built,
  *can* re-emit — and may want a one-time canonicalization pass.)
- **set-vector scope is forward_vector only** — the field the bug was about, and
  the one with the "never rewrite silently" rule.
- **Undo is post-commit revert.** There is no pre-commit "pending" UI yet (that
  pairs with the optimistic-pending milestone); quarantine already means nothing
  is live until cherry-picked, so a revert is the honest undo today.

## Next move (M2)

Integration Plan §5 M2 is the spec. In short: an **intent classifier** (capable
model, asymmetric safe-default = Tier A when unsure) returns `{tier, op}`; a
Tier-B ask posts a **job** to the board as the Companion; the **actuator** spawns
a worker running a **Maker** brief (intake → tiers → Host Capability Check →
Specialist dispatch); the window becomes a **board-reader** (QUEUE card +
`BROADCAST`/`PROOF` over SSE). Heavy Specialists (ComfyUI/Manim/Remotion/FLUX)
route to the **Mac host** — degrade gracefully, never silent-fail. Genuine Maker
forks post a `blocking` `RESOURCE_REQUEST` with `options` to TRICKSTER, surfaced
in-window as option chips. **Reuse §2.2 — no new verbs.**

Smaller, independent follow-ups: **merge-to-main** (and detangle the edits
worktree) · **general frontmatter editing** (type/stage/links via `emitEntryFile`).

## Receiving environment (capability deltas that bite)

- **Commit per slice; never `git add -A`** (N-writer repo). Stage explicit code
  paths; leave `blackboard.jsonl` + `.actuator-companion/` uncommitted. Keep
  subjects **≤72 chars** (the commit-msg hook only annotates; mine ran long
  twice and I amended).
- **The prompt is a backtick template literal** (`companion-prompt.js`) — do NOT
  put literal backticks in the prompt text (I broke the build once doing exactly
  this; escape as `\`` or rephrase).
- **Opus worker.** Real `claude -p` turns take tens of seconds. Don't fire real
  workers in checks — **the real-Opus loop is Loudon's gate.** The stub
  (`tests/fixtures/stub-companion-worker.mjs`) drives turns in tests; it now
  takes `--edit-op` (append/graffiti/set-vector/…) and `--edit-text`.
- **Edits quarantine to `stigmergy-edits`** via `armed-write.js`; they never
  touch the live entry the dev server reads — so a companion edit/graffiti/
  vector change does NOT show in the live STATE view until merged. That is why
  the marker *reports* rather than mutates the body.
- **Live verification:** screenshots come back **black** (CRT/phosphor) — use
  **DOM `preview_eval`** assertions. Run the worktree dev server on a **free
  port** (it's a single Vite process; backend is `blackboardMiddleware`). Add a
  temporary config to the main palace's `.claude/launch.json` — e.g.
  `{name:"stigmergy-worktree", runtimeArgs:["--prefix","<worktree>/_ops/stigmergy/app","run","dev","--","--port","5191","--strictPort"], port:5191}` —
  `preview_start` it, then **revert launch.json after** (I did). 5173/5186 are
  often Loudon's. The live flag/undo/graffiti-author paths need a real
  worker-created edit to exercise end-to-end (Loudon's gate); structure is
  unit-tested via `renderToStaticMarkup` and integration-tested via the stub.

## To drive it live yourself (Loudon)

Run the worktree dev server on a free port and toggle `[~] agent` on an entry's
STATE view, then ask it to "leave a graffiti note", "tighten this", or "sharpen
my forward vector" — watch the marker, the flag, and `[undo]`. The edits land on
`stigmergy-edits`; cherry-pick the keepers onto main.

## Load these files first

1. `Palace development/STIGMERGY Entry-Agent Window — Integration Plan v0.1.md`
   (§3–§5 — M2 is the move; the §4 reflow row is superseded by the floating box)
2. this handoff
3. Worktree code: `app/server/armed-write.js`, `app/server/companion-lane.js`,
   `app/server/companion-prompt.js`, `app/server/api/entry-agent.js`,
   `app/src/components/state/EntryAgentWindow.jsx`,
   `app/src/components/state/EntryBody.jsx` (all under `_ops/stigmergy/`)
4. `STIGMERGY.md` + `Palace Agent Infrastructure Spec` (wire, decks, boards) —
   M2 leans hardest on these.

---

*Loudon Live · Autodidact Polymaths*
