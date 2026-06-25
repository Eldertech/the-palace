---
title: STIGMERGY — Weave Flag Item Type Build Plan
type: project
pillars:
  - tools
  - practice
born: 2026-06-05
last_activated: 2026-06-05
activation_count: 1
stage: seed
energy: high
forward_vector: >
  I am the executable contract that gives STIGMERGY a `weave_flag` payload
  kind, migrates the eleven backlogged Weave-flag items out of Palace To-Do
  onto the persistent board, and adds one line to the Deposit Ceremony
  so future flags land in STIGMERGY by default. I keep the move small:
  no new top-level message type, no new board, no new server endpoint —
  just a payload-kind sibling to `vector_proposal` plus a migration pass.
  A Claude Code session reading this file knows what to build, what to
  verify, when to retry, when to stop, and what to hand back. Loudon is
  absent during the run.
links:
  - target: "[[STIGMERGY — Alignment Review Build Plan]]"
    type: emerged-from
    label: build-contract-template
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: comm-substrate
  - target: "[[Weave Ceremony]]"
    type: enables
    label: new-input-channel
  - target: "[[Deposit Ceremony]]"
    type: enables
    label: new-output-channel
  - target: "[[Palace To-Do]]"
    type: connects-to
    label: migration-source
  - target: "[[BBS Design System]]"
    type: enables
    label: aesthetic-authority
  - target: "[[Drift and Consolidation]]"
    type: connects-to
    label: archive-vs-queue-bug-being-fixed
---

# STIGMERGY — Weave Flag Item Type Build Plan

![[STIGMERGY — Weave Flag Item Type Build Plan — hero.png]]

The architecture is in [[BBS Blackboard]]. The visual language is in [[BBS Design System]] — STIGMERGY uses the BBS phosphor aesthetic, **not** Loudon Live. The build-contract pattern is [[STIGMERGY — Alignment Review Build Plan]] (the most recent sibling) — match its shape: phased, each phase self-verifiable, stop-report on failure, Loudon absent during the run. The *why* is documented in the [[Drift and Consolidation]] entry's spirit: archive rows that claim past facts are honest; archive rows that try to drive future work are a category error. The Deposit Ceremony has been treating archive prose as flag input for months. This build fixes the channel.

## The move

Add a **`weave_flag` payload kind** to STIGMERGY's existing message machinery — a sibling to `vector_proposal` — and migrate eleven backlogged flag items out of Palace To-Do onto the persistent board. The flag's auto-resolve mirrors `vector_proposal`'s entry-touch hook (see `f5576de`). The Deposit Ceremony grows **one** step — at Step 7b's close, for each weave flag the deposit carries, append a `weave_flag` BROADCAST to the persistent board. That is the whole move.

## Why this hastens the alignment process

The friction case is concrete. Between 2026-04-26 (D004) and 2026-06-05 (BATCH01), four deposits wrote *Weave flags: …* prose into archive row summaries. None of those flags reached the Weave's input scan, because the Weave reads `_ops/Palace To-Do.md` (free-form markdown), not `_ops/Deposit Archive.md` (audit log). The pattern was idiomatic — and silently dead. Accelerants this build provides, in order of leverage:

1. **Machine-parseable payload.** `payload.kind === 'weave_flag'` with structured fields — `flag_type`, `source_entries`, `target_entry`, `proposed_action`, `source_deposit_id`, `rationale` — lets the Weave's input scan be `grep`-grade and the QUEUE lens render flag cards alongside vector-proposal cards using the existing renderer pipeline.
2. **Auto-resolve on entry-touch.** Reusing `reconcileQueue`'s entry-touch path means a commit touching any `source_entries[i]` closes the matching flag without manual bookkeeping. Match-rate measurement comes for free.
3. **Persistent across runs.** The blackboard's append-only JSONL is grep-cold readable; flags compound across deposits without UI dependency. Server is the validation layer, not the source of truth.
4. **One channel, two ceremonies.** Deposit emits flags; Weave consumes them. No third surface to keep in sync. The Deposit Archive returns to its honest role as audit log.

## What's decided (do not re-litigate)

- **Reuse `BROADCAST` on `WEAVE` board.** No new top-level message type. No new board. §2.2's strict validator (`server/validator.js`) already accepts `BROADCAST` + `WEAVE`; the kind discriminator lives in `payload.kind` exactly as `vector_proposal` does.
- **`payload.kind === 'weave_flag'`** is the kind discriminator. Sibling to `vector_proposal`, `handoff_ready`, `handoff_picked_up`. No subtype proliferation.
- **Auto-resolve via existing `reconcileQueue` entry-touch path.** The flag carries `source_entries: [string]` (array) — `reconcileQueue` is extended once to handle the array shape; same commit-touch logic that retires vector_proposals retires weave_flags. RESOURCE_GRANT/RESOURCE_DENY via `re: <message_id>` also closes a flag, exactly as for vector_proposal — the Weave can record decisions explicitly when entry-touch isn't the right close signal.
- **QUEUE lens render only.** No new lens, no new tab. Flags appear as cards in the existing QUEUE deck, badged `WEAVE FLAG` (color: existing `--ansi-bright-cyan` or `--phosphor-dim` — match the vector-proposal badge convention).
- **Migration is one-way and one-shot.** The 11 items move from Palace To-Do to the board in a single migration commit. Palace To-Do's `## Structural Improvements` section then gets one summary line: *"Weave flags now live on the STIGMERGY persistent board under `payload.kind: 'weave_flag'`. See [[STIGMERGY — Weave Flag Item Type Build Plan]] for the migration record."* No dual-write.
- **Deposit Ceremony grows one line, not a rewrite.** Step 7b gains: *"For each weave flag named in the deposit, append a `weave_flag` BROADCAST to the persistent board. Show Loudon the message bodies first; commit only on his approval."* The existing archive-row Weave-flags prose stays — as audit, not queue.
- **§2.2 strict validator untouched.** `weave_flag` is a payload-shape convention enforced by `queue-model.js` (the lenient renderer), not by `server/validator.js` (the strict gatekeeper). Same separation `vector_proposal` already honors.
- **No retro-migration of pre-D004 flags.** The 11 items in scope are the live ones. D-CW-02 carries no flags. SPONT4 (2026-03-28) is already migrated and resolved.

## Current state (true as of 2026-06-05)

- **`vector_proposal` is the working model.** `_ops/stigmergy/app/src/lib/queue-model.js` `buildQueue()` already handles `BROADCAST` + `payload.kind === 'vector_proposal'` (~lines 88–125). Closes via `responded` set (RESOURCE_GRANT/RESOURCE_DENY referencing the BROADCAST id) and via `reconcileQueue()` entry-touch on `payload.source_entry` (aliased to `entry` on the item — `f5576de`).
- **The 11 backlogged flags live in `_ops/Palace To-Do.md` § Structural Improvements** (`a3d5885`). They carry the prefix `**[Weave flag — <ID> <date>]**` for grep. Two from SPONT4 (lines 107, 109 — *Label enrichment pass*, *Hub-node weaving*) plus the 9 added in `a3d5885` (D004 ×1, D-CW-01 ×4, D-2026-05-27-OE ×1, BATCH01 ×3).
- **Persistent board is `_ops/swarm/persistent/blackboard.jsonl`** — append-only, §2.2-validated on POST. Read by the STIGMERGY app and by anyone with grep.
- **Deposit Ceremony lives at `_ops/Deposit Ceremony.md`.** Step 7b records the deposit *as its commit* (`Palace-Kind: deposit` + synthesis in the body; the Deposit Archive is frozen, no row appended). Weave flags post to the persistent board as `payload.kind: 'weave_flag'` BROADCASTs with `source_deposit_id` — that is where the new line lands.
- **`palaceRoot` is passed through every server handler.** Tests pass an explicit `palaceRoot` — keep that contract.
- **CSS rules (standing).** Borders evoke CP437 weights (not character-cell ASCII rules). Page fills the viewport. Long prose bodies cap at ~78ch. No emoji, no cyan-as-accent beyond the existing badges.

## Data shapes

**`weave_flag` BROADCAST message** (one per flag, §2.2-conformant):

```json
{
  "schema_version": "1.0",
  "id": "msg-<nanoid>",
  "ts": "2026-06-05T13:45:00.000Z",
  "session_id": "deposit-BATCH01",
  "from": "deposit-ceremony",
  "to": "weave-ceremony",
  "type": "BROADCAST",
  "board": "WEAVE",
  "health": { "score": "green", "load": 0.1, "drift": 0 },
  "payload": {
    "kind": "weave_flag",
    "flag_type": "backlink_audit",
    "source_deposit_id": "BATCH01",
    "source_entries": ["Floquet Theory", "Kuramoto Coupling"],
    "target_entry": "Phase Reduction",
    "proposed_action": "Add couples-with link from each hub to Phase Reduction with label `bridge-via-PRC`.",
    "rationale": "Phase Reduction names the bridge between the two existing hubs (PRC as Floquet eigenvector data; Kuramoto as the phase-reduced shadow of a population of limit cycles). Both hubs deserve inbound links."
  }
}
```

Field semantics:
- `flag_type` ∈ `backlink_audit | missing_connection_audit | section_expansion | hub_candidate | mirror_link_sweep | standard_reference`. Open enum; new types are added by Deposit Ceremony authors as needed. Renderer falls back to "Weave Flag" if unknown.
- `source_entries`: array of entry titles (wikilink-free; the renderer wraps `[[…]]`). Touching any one of them closes the flag via entry-touch reconciliation.
- `target_entry`: optional. The entry the flag is asking the Weave to *do something to*. Distinct from `source_entries` because flags are sometimes "audit X for missing links to Y" — X is source, Y is target.
- `proposed_action`: short prose, the human-language ask. The card LEADS with this.
- `rationale`: longer prose, the why.

**Queue item shape** (built by `queue-model.js` `buildQueue()`):

```js
{
  id: m.id,
  sourceId: m.id,
  kind: 'weave_flag',
  from: m.from,
  ts: m.ts,
  board: m.board,
  sessionId: m.session_id,
  flag_type: payload.flag_type,
  source_deposit_id: payload.source_deposit_id,
  source_entries: payload.source_entries,    // array
  target_entry: payload.target_entry,
  ask: payload.proposed_action,
  summary: payload.proposed_action,
  rationale: payload.rationale,
  entry: payload.source_entries[0],          // primary entry for entry-touch
  entries: payload.source_entries,           // full array for multi-entry touch
  stale_if: 'a commit touches any of source_entries, OR a RESOURCE_GRANT/RESOURCE_DENY answers this message',
  pointer: { type: 'board', target: 'WEAVE' },
  resolved: { done: false, reason: null, commit: null },
  blocking: false,
  health: m.health,
  raw: m,
}
```

## Phases

Five phases. Each is self-verifiable. On failure, write a stop-report to `_ops/stigmergy/app/WEAVE-FLAG-STOP-REPORT.md` naming the phase, the failed assertion, and the smallest reproduction. Do not skip phases on green; do not proceed past a stop-report.

### Phase 1 — Extend `queue-model.js` to recognize `weave_flag`

**Scope.** Add a `weave_flag` branch to `buildQueue()` mirroring the `vector_proposal` branch. Extend `reconcileQueue()` to honor an array `entries` field for entry-touch matching (it already handles the single `entry` field). Touch `synthesizeProposalAsk` if a card-ask fallback is needed when `proposed_action` is absent.

**Done when.**
- New unit tests in `_ops/stigmergy/app/tests/unit/queue-model.test.js` cover: (a) a single `weave_flag` BROADCAST surfaces as a queue item with `kind: 'weave_flag'`; (b) a commit touching any of `source_entries` closes it via `reconcileQueue`; (c) a RESOURCE_GRANT referencing the BROADCAST `id` closes it; (d) the existing `vector_proposal` tests still pass.
- `npm test -- queue-model` green.

### Phase 2 — Extend `QueueItem.jsx` to render `weave_flag` cards

**Scope.** Add a `WEAVE FLAG` badge variant; render `flag_type`, `source_deposit_id`, `source_entries` (as wikilinks via `inline-prose.jsx`), `target_entry`, `proposed_action` (lead), `rationale` (collapsed by default — same disclosure pattern as `vector_proposal`'s long rationale). No new colors; reuse `--phosphor-dim` for the badge, `--ansi-bright-cyan` for `target_entry` if rendered as a destination.

**Done when.**
- A new e2e test in `tests/e2e/queue-deck.spec.js` posts a `weave_flag` BROADCAST via the existing POST `/api/persistent` endpoint and asserts the card renders in the QUEUE lens with the badge, ask, and source_deposit_id visible. Use the existing `?file=` fixture mechanism — no new test infrastructure.
- Visual screenshot saved to `_ops/stigmergy/app/screenshots/weave-flag-v1.0/queue-deck-with-flag.png`. Honor BBS-aesthetic rules: borders are CSS, not character cells.
- `npm run e2e -- queue-deck` green.

### Phase 3 — Migrate 11 Palace To-Do items onto the persistent board

**Scope.** Read `_ops/Palace To-Do.md`, parse the 11 `**[Weave flag — …]**` items, generate one `weave_flag` BROADCAST per item, append to `_ops/swarm/persistent/blackboard.jsonl` via direct file write (this is a one-time migration; no need to round-trip through the HTTP endpoint). Then edit Palace To-Do to remove the 11 items and replace them with one summary line under `## Structural Improvements`:

> *Weave flags now live on the STIGMERGY persistent board under `payload.kind: 'weave_flag'`. See [[STIGMERGY — Weave Flag Item Type Build Plan]] for the migration record. The Weave Ceremony reads them via its normal input scan.*

The 11 items in scope (preserve `source_deposit_id` and `flag_type` from the Palace To-Do prose):

1. **SPONT4 / `flag_type: section_expansion`** — Label enrichment pass (line 107 source).
2. **SPONT4 / `flag_type: missing_connection_audit`** — Hub-node weaving for Resonant Link Labels / Lossy Compression with Intent Alignment / Generative Compression (line 109 source).
3. **D004 / `flag_type: missing_connection_audit`** — 2D Torus / DSP in Looping Dimensions audit across 5 entries.
4. **D-CW-01 / `flag_type: section_expansion`** — Expand Maker's Delivery section.
5. **D-CW-01 / `flag_type: standard_reference`** — Reference Closing Well as a standard from The Shop.
6. **D-CW-01 / `flag_type: section_expansion`** — Add a punchlist to every Specialist's Self-Check.
7. **D-CW-01 / `flag_type: section_expansion`** — Grow a default punchlist scaffold in Substrate Skill.
8. **D-2026-05-27-OE / `flag_type: missing_connection_audit`** — Audit Enrichment / Brian Eno / BBS Blackboard / Synthesis ↔ Emergence.
9. **BATCH01 / `flag_type: backlink_audit`** — Backlinks into Floquet Theory + Kuramoto Coupling pointing at Phase Reduction.
10. **BATCH01 / `flag_type: mirror_link_sweep`** — Mirror/same-object link audit across the dissolution cluster (9 entries).
11. **BATCH01 / `flag_type: hub_candidate`** — "Dissolutions" / "One Object, Two Doorways" hub candidacy.

**Done when.**
- All 11 messages validate against `server/validator.js` (run the validator directly on each message before appending — fail closed if any error).
- `_ops/swarm/persistent/blackboard.jsonl` line count grew by exactly 11.
- Palace To-Do no longer contains any `**[Weave flag — …]**` items; one summary line replaces the block.
- A QUEUE deck refresh shows 11 new `weave_flag` cards.

### Phase 4 — Update the Deposit Ceremony

**Scope.** Edit `_ops/Deposit Ceremony.md` to add one bullet under Step 7b:

> *For each weave flag named in the deposit, append a `weave_flag` BROADCAST to the persistent board (`_ops/swarm/persistent/blackboard.jsonl`). The payload follows [[STIGMERGY — Weave Flag Item Type Build Plan]] § Data shapes. Show Loudon the message bodies first; commit only on his approval. The archive row's `Weave flags:` prose stays — as audit, not queue.*

Add a small section reference in the existing **Completion Signal** list (Step 7's checklist) — a sixth condition: *"Weave flags, if any, written to the persistent board."*

**Done when.**
- Deposit Ceremony parses cleanly (no broken wikilinks; existing structure preserved).
- A unit test (or grep assertion in CI, if one exists) confirms the new bullet contains the literal string `payload.kind` so future ceremony edits don't silently drop the contract.

### Phase 5 — Verification + handback

**Scope.** Run the full STIGMERGY test suite. Confirm zero regressions. Generate `_ops/stigmergy/app/WEAVE-FLAG-V1.0-COMPLETE.md` with: per-phase results, screenshot paths, message-count diff for `blackboard.jsonl`, the 11 message ids written, and any deferred items (e.g. *future flag_types observed in the wild that may earn dedicated renderers*).

**Done when.**
- `npm test` green (full suite, not just queue-model).
- `npm run e2e` green.
- WEAVE-FLAG-V1.0-COMPLETE.md exists and is honest about what was built and what was deferred.
- One git commit per phase, conventional subject: `ops(stigmergy): weave_flag — Phase N — <summary>`. Migration commit (Phase 3) carries the Palace-Kind trailer `migration` if the commit-spec hook recognizes it.

## Migration target list (canonical record)

The 11 items are tabulated in Phase 3 above. If any item's interpretation is ambiguous when the builder reads it, the builder writes the message *as it reads the Palace To-Do prose* and notes the ambiguity in WEAVE-FLAG-V1.0-COMPLETE.md's deferred section. Do not invent fields; do not lose information.

## Verification gates (cross-phase invariants)

- **§2.2 strict validation** on every message before it touches `blackboard.jsonl`. Fail closed.
- **Idempotency**: re-running Phase 3 must not double-write. The migration is one-shot; the builder checks `blackboard.jsonl` for any existing `payload.kind === 'weave_flag'` messages before starting and exits if found.
- **No silent drops**: every Palace To-Do item must map to exactly one message. If parsing fails on an item, write a stop-report.
- **`vector_proposal` untouched**: the existing render and auto-resolve behavior for vector_proposal cards must be byte-identical pre/post this build. The existing e2e tests cover this; check them green.

## Stop conditions, retry, handback

- **Stop and write a stop-report** on: §2.2 validator rejection during Phase 3; any unit/e2e regression; ambiguous Palace To-Do item that cannot be parsed without guessing.
- **Retry budget**: 2 fix iterations per phase before stopping. The Alignment Review build closed in ~4 total iterations; this is a smaller surface.
- **Handback**: WEAVE-FLAG-V1.0-COMPLETE.md is the handback document. Branch the work onto `stigmergy-v1.0-weave-flag` off `stigmergy-v1.0-frontend-rebuild`. Do not push to remote; await Loudon's smoke-test.

## Forward Vectors

- **`weave_flag` analytics in the Weave Ceremony.** Once flags accumulate, the Weave can read `_ops/swarm/persistent/blackboard.jsonl`, filter `payload.kind === 'weave_flag'`, and report match-rate per `source_deposit_id` (how many flags from each deposit have been resolved) and per `flag_type` (which kinds of flags get acted on fastest). Defer to a v1.1.
- **A weave_flag → vector_proposal upgrade path.** If a Weave session deepens a flag into a concrete forward-vector edit, it can post a sibling `vector_proposal` referencing the flag's message id — the existing close-via-`re:` logic resolves both. Build the convention into the Weave Ceremony when a third flag earns this treatment.
- **Hide resolved flags by default in QUEUE.** Same as `vector_proposal`. If not already in `queue-model.js`'s render filter, add to v1.1.

## Lost Branches

- A `weave_flag` SSE topic (`/api/weave-flags/stream`) — premature; the QUEUE lens already covers live updates via the persistent SSE.
- A `flag_type` schema-enforcement table — open enum is correct for now; only ratify members that recur across ≥3 deposits.
- Auto-creating a sibling `vector_proposal` when a flag is resolved-by-commit with no `re:` — saves a step, but conflates audit (what the Weave decided) with proposal (what to do next). Hold for after the first real Weave cycle that consumes these.

---

> *"A board that never claims past facts cannot lie about them."* — from [[Drift and Consolidation]]
>
> *"The Deposit Archive was being asked to carry a load it was never shaped to carry. STIGMERGY was being held back from one it was shaped exactly for."* — from the source dialogue, 2026-06-05
