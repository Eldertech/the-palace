---
title: BBS Production Plan v0.2
type: project
status: pending
pillars:
  - tools
  - practice
born: 2026-05
last_activated: 2026-05-04
activation_count: 1
stage: seed
energy: high
forward_vector: >
  I want to become the autonomous build contract that turns STIGMERGY v0.1 from
  a read-only viewer into an operational board. Every v0.1.x polish item lands.
  Every v0.2 design-system finding is resolved. Write paths (Trickster posting)
  and read paths (live tail) come online. Schema enforcement becomes strict on
  every write. A Claude Code session reading this file knows what to build,
  what to verify, when to retry, when to stop, and what to hand back when v0.2
  is ready for human review. Loudon is absent during the run.
links:
  - target: "[[BBS Production Plan]]"
    type: emerged-from
    label: v0.1-template
  - target: "[[BBS Blackboard]]"
    type: enables
    label: operational-form
  - target: "[[BBS Design System]]"
    type: enables
    label: cleanup-pass
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: connects-to
    label: derives-from
  - target: "[[Palace To-Do]]"
    type: connects-to
  - target: "[[Substrate]]"
    type: connects-to
    label: technical-substrate
---

# BBS Production Plan v0.2

The architecture is in [[BBS Blackboard]]. The visual language is in [[BBS Design System]]. The infrastructure foundation is in [[Palace Agent Infrastructure Spec]]. The v0.1 plan at [[BBS Production Plan]] is the template — read it for the autonomous-build pattern. This document is the bridge: the executable contract that turns v0.1 (visible board) into v0.2 (operational board).

It exists because as of 2026-05-04, three things accumulated that need bundling: (1) v0.1.x polish items surfaced during Loudon's first smoke-test that have not been swept; (2) the v0.2 design-system findings that the production plan's read-only rule prevented from being addressed during v0.1; (3) the operational features (write path, live tail) that the v0.1 plan explicitly deferred. The phases below are checkboxes, not narrative. The decisions are made here. A Claude Code session reads this file, runs the phases, and stops only on a stop condition or after Phase 6 success.

## Context (2026-05-02 to 2026-05-04)

- **2026-05-02:** v0.1 closed `OVERALL: pass` after autonomous build. Branch `stigmergy-v0.1`. Six phases, 81 tests, 16 visual-validator-vetted screenshots. Five real findings flagged for v0.2.
- **2026-05-04 (smoke-test pass):** Loudon ran the dev server. Login screen removed (annoying during testing, never needed). `Rule` and `Box` primitives rewritten to CSS borders styled to evoke CP437 weight (`3px double` / `1px solid`) — the prior 78-character fixed-width rule overflowed dynamic columns. Outer 110ch board-screen cap removed; page now fills viewport. Phase 1/3/4/5/6 visual-validator checklists updated to match.
- **2026-05-04 (first songline run):** `songline-2026-05-04-001` traversed Cooperation Yields Agency → Kuramoto Coupling → Hilaritas Generator. Loudon directed deletion of the prior 113 schema-noncompliant lines on the persistent board; the songline produced 14 messages of clean §2.2-conformant data. Verdict: phase-locked, not annotated. **Critical operational finding: zero RESOURCE_REQUESTs across the run.** Click-to-respond on the Trickster inbox is real but is NOT the centerpiece feature — live tail proved to be the more frequently exercised need (Loudon hit Reload after each agent).

## Decisions (2026-05-04)

| Decision | Choice | Reason |
|---|---|---|
| Scope of v0.2 | Operational board: write paths + live tail + foundation cleanup (v0.1.x polish + design-system v0.2) | Bundles all known polish, makes the board usable end-to-end without manual file editing. Cleanup runs first so write-path features land on a clean foundation. |
| Frontend stack | Vite + React (unchanged from v0.1) | Already in place; no rewrite needed. |
| Push mechanism for live tail | Server-Sent Events (SSE) | One-way push, native browser `EventSource` API, simpler than WebSocket. Re-uses the existing Vite middleware host. WebSocket considered and rejected: bidirectional we don't need; the writes go through the separate POST endpoint. |
| Click-to-respond writes | Server-side POST endpoint validates §2.2 strictly, then appends to file. UI shows preview JSON, requires explicit confirm-click before submitting. | Single-operator, local-only, no auth needed. The confirm-step protects against accidental sends. The server-side validation is the load-bearing schema enforcement boundary. |
| Persistent blackboard schema policy | Strict §2.2 enforcement on every write. No `messageVersion: "audit-result"` variant. Historical data was deleted 2026-05-04 per Loudon's instruction. | Loudon's directive: "Delete the unclean historical data, strict schema adherence from here on out." Going forward, the spec is the spec. |
| Design-system source-of-truth | The app at `_ops/stigmergy/app/` is canonical; the design system gets updated to match. | The v0.1.x rendering changes and the songline reveals already moved the truth into the app. The design system needs to catch up — specifically the character-cell border rule, which the app retired and the design system still mandates. |
| Render of unrecognized message types | Neutral phosphor with a `[unknown type: X]` metadata line. Do NOT crash. Do NOT silently coerce. | Forward-compatibility for future spec extensions. |
| Persistent vs session boards | Both readable; both writable via POST. The `/api/sessions/:id` endpoint accepts POSTs that append to that session's `blackboard.jsonl`. | The orchestrator (separate project) will write to session boards. STIGMERGY should not be the gatekeeper. |

## What v0.2 Is and Is Not

**v0.2 is** an operational version of the BBS terminal. The Trickster inbox becomes interactive — click a response option, preview the auto-generated §2.2-conformant JSON, hit confirm, the response appears on the board. New messages from any source (manual file edit, the orchestrator if running, `curl` against the POST endpoint) appear in the UI without Reload via SSE. The design system has been brought into alignment with the app's actual rendering. The v0.1.x polish items are landed.

**v0.2 is not** the orchestrator from §3 of the Infrastructure Spec (still its own project), an authentication system (still single-operator, local-only), an always-on service (still on-demand `npm run dev`), the persistent-board promotion ceremony from §2.8 of the Infrastructure Spec (coordinator-side concern, orthogonal), or a Trickster-action surface for non-RESOURCE_REQUEST message types in v0.2 — Trickster broadcasts and other manual posts can still be done by file edit (the file-is-truth rule continues to hold; the UI is just a faster path for the common case).

## Autonomous Build Contract

Same four commitments as v0.1. Read [[BBS Production Plan]] § Autonomous Build Contract for the full statement. Summary:

1. **Every phase is self-verifiable.** `npm run check:phase-N` exits 0 on pass. No subjective acceptance criteria.
2. **Visual quality is reviewed by a vision-capable subagent.** `visual-validator` receives screenshots + a checklist per phase boundary; pass/fail with reasoned justifications.
3. **Failures iterate up to a budget, then stop.** Up to ten attempts per failing check. Stop-reports arrive with full context.
4. **Loudon is absent until v0.2 is declared complete.** No phase-by-phase approvals. The session writes `V0.2-COMPLETE.md` on success or `STOP-REPORT.md` on a stop condition.

## Directory Layout (Delta from v0.1)

The v0.1 directory layout at `_ops/stigmergy/app/` is preserved. v0.2 adds:

```
_ops/stigmergy/app/
├── server/
│   ├── middleware.js              ← extended: GET endpoints unchanged; ADD POST + SSE
│   ├── validator.js               ← NEW: §2.2 strict schema validator (server-side)
│   └── append.js                  ← NEW: atomic append helper for .jsonl writes
├── src/
│   ├── adapters/
│   │   ├── blackboard.js          ← extended: ADD postMessage, subscribeLive
│   │   └── live-tail.js           ← NEW: EventSource wrapper, reconnect logic
│   ├── components/
│   │   ├── TricksterInbox.jsx     ← extended: response options become real buttons
│   │   ├── ResponseModal.jsx      ← NEW: preview + confirm flow for click-to-respond
│   │   ├── CommandBar.jsx         ← extended: hotkey buttons show active-state highlight
│   │   ├── MessageList.jsx        ← extended: live-update, FLAG render parity, no center-justify
│   │   └── primitives.jsx         ← unchanged from v0.1.x
│   ├── lib/
│   │   ├── live-feed.js           ← NEW: merge incoming SSE messages into the visible list
│   │   └── response-builder.js    ← NEW: build §2.2-conformant RESOURCE_GRANT/DENY from inbox state
│   └── styles/
│       └── tokens.css             ← unchanged
├── tests/
│   ├── unit/
│   │   ├── validator.test.js      ← NEW
│   │   ├── live-feed.test.js      ← NEW
│   │   └── response-builder.test.js ← NEW
│   ├── integration/
│   │   ├── post-middleware.test.js  ← NEW
│   │   └── sse-middleware.test.js   ← NEW
│   ├── e2e/
│   │   ├── click-to-respond.spec.js ← NEW
│   │   ├── live-tail.spec.js        ← NEW
│   │   ├── command-bar-active.spec.js ← NEW (the v0.1.x bottom-bar item)
│   │   └── (existing v0.1 specs all still must pass)
│   └── checklists/
│       ├── phase-1.md             ← REWRITTEN (login refs removed; centering rule added)
│       ├── phase-3.md             ← MINOR (no-center-justify for SYSTEM messages)
│       ├── phase-5.md             ← MAJOR (click-to-respond now interactive)
│       ├── phase-6.md             ← REWRITTEN (login refs removed; live-tail items added)
│       └── (other phases minor)
└── V0.2-COMPLETE.md               ← written on Phase 6 success
```

The `_ops/stigmergy/design-system/` directory is NO LONGER read-only for this build. v0.2 explicitly updates the design-system to match the app — see Phase 1.

## Schema Enforcement (Server-Side, NEW)

Every write to the blackboard goes through `server/validator.js` before reaching the file. The validator implements Infrastructure Spec §2.2 STRICT:

- All required fields present: `schema_version`, `id`, `ts`, `session_id`, `from`, `to`, `type`, `board`, `health`, `payload`
- `schema_version` exactly `"1.0"`
- `ts` parses as ISO 8601 with timezone (Z suffix or explicit offset)
- `type` is one of: `BROADCAST`, `FLAG`, `REPLY`, `PROOF`, `RESOURCE_REQUEST`, `RESOURCE_GRANT`, `RESOURCE_DENY`, `QUERY`, `SESSION_INIT`, `SESSION_CLOSE`, `PAGE_UPDATE`, `HEALTH_NOTICE`
- `board` is one of: `GENERAL`, `FLAGS`, `WEAVE`, `SYSTEM`, `TRICKSTER`, `BRANCHES`
- `health` is an object with `context_pct` (number, 0-1), `stop_reason` (string), `iteration` (positive integer), `tokens_this_call` (non-negative integer), `model` (string), `score` (`green` | `yellow` | `red`)
- `payload` is an object (any shape — payload schema is per-`type` and not enforced beyond being an object)

Rejection mode: HTTP 400 with a JSON body listing every failed check. The UI surfaces the validation failures inline (the response is held; nothing is appended). The server NEVER coerces, NEVER fills in missing fields. The client is responsible for producing valid messages; the server is the enforcement boundary.

The `messageVersion: "audit-result"` historical variant is explicitly NOT supported. If any tooling tries to write that shape, it gets a 400. This is load-bearing: it prevents schema drift from re-emerging.

## Test Strategy (Delta from v0.1)

Same three-layer structure as v0.1 (unit Vitest, integration Vitest+supertest, e2e Playwright). v0.2 adds:

**Unit additions:**
| File | Coverage |
|---|---|
| `validator.test.js` | Every required field has a test for present/missing/wrong-type. Every enum has a test for valid/invalid values. Edge cases: BOM, trailing whitespace, null payload, deeply nested payload. |
| `live-feed.test.js` | Incoming SSE event merges into the message array; deduplicates by `id`; preserves sort order; handles out-of-order arrival. |
| `response-builder.test.js` | Given a pending RESOURCE_REQUEST and a chosen response option, builds a §2.2-conformant RESOURCE_GRANT/DENY with correct `re:` correlation. |

**Integration additions:**
| File | Coverage |
|---|---|
| `post-middleware.test.js` | POST /api/persistent: valid 200 + line appended; invalid 400 + nothing written; malformed JSON 400; oversized payload (>64KB) 413. POST /api/sessions/:id: same suite. Concurrent writes (5 parallel POSTs): all 5 lines appear, no truncation, no interleaving. |
| `sse-middleware.test.js` | GET /api/persistent/stream: SSE handshake; new lines appended to file produce SSE events; client reconnect after disconnect re-sends recent messages (per `Last-Event-ID` header); old clients (no `Last-Event-ID`) get current state only. |

**E2E additions:**
| File | Coverage |
|---|---|
| `click-to-respond.spec.js` | TRICKSTER tab with a pending request → click "Grant - limited" → preview modal shows correctly-formed JSON → click confirm → request disappears from inbox; new RESOURCE_GRANT visible on TRICKSTER board. |
| `live-tail.spec.js` | Page open, no Reload → external write to `blackboard.jsonl` → new message appears in UI within 2 seconds. Same for SSE reconnect after dev-server restart. |
| `command-bar-active.spec.js` | Click `[2]FLAGS` (or press `2`) → bottom bar `[2]FLAGS` button is now in the inverted/active state, matching the top channel-tab inversion. |

**Visual validation:** Same protocol as v0.1. New checklists for the click-to-respond flow and the live-tail behavior.

## Phases

### Phase 1 — Foundation Cleanup

Goal: bring the v0.1.x polish items and the v0.2 design-system findings into the codebase. v0.2 features land on a clean foundation.

**v0.1.x polish (4 items):**
- [ ] Bottom command-bar buttons in `CommandBar.jsx` show inverted/active state when their hotkey-board is the active board. Mirrors the top `ChannelTabs.jsx` inversion behavior. Hotkey `[1]` → GENERAL active state; `[2]` → FLAGS; etc. `[R]ELOAD`, `[V]ISUAL`, `[Q]UIT` are not category-keyed and do not get an active state.
- [ ] Phase-1 and Phase-6 visual-validator checklists rewritten — items referencing the (removed) login screen rewritten or marked `n/a-by-default`. Specifically: phase-1 #12, #13, #17 (motion); phase-6 #1, #2.
- [ ] No center-justification anywhere in message bodies. Currently SYSTEM-board messages render center-justified per phase-3 #15's "centered" treatment. Update `MessageList.jsx`: SYSTEM messages stay dim and visually-distinct via color/spacing, NOT via center alignment. Update phase-3 checklist #15 accordingly.
- [ ] FLAG message rendering parity. FLAGs use `payload.claim` + `target_entries` + `confidence` and currently render less cleanly than BROADCASTs (which use `payload.content` and render as prose). Make FLAG render: `claim` as the headline body; `target_entries` as a small dim-cyan metadata line ("→ entry-name, entry-name, entry-name"); `confidence` as a colored tag (green/yellow/red for high/medium/low).

**Design-system v0.2 cleanup (6 findings):**
- [ ] Replace corrupt `_ops/stigmergy/design-system/fonts/IBMPlexMono-Regular.woff2` and `IBMPlexMono-SemiBold.woff2` with real woff2 files. The v0.1 build worked around this by putting real fonts in `app/public/fonts/`; the design system itself still has the broken stubs. Source: `@fontsource/ibm-plex-mono@5.0.13`.
- [ ] `_ops/stigmergy/design-system/assets/welcome_screen.txt` — the file is no longer rendered (login screen removed) but still violates the design system's STIGMERGY name rule and the no-em-dashes rule. EITHER: fix it (replace "BLACKBOARD" → "STIGMERGY", replace `——` → `--`); OR delete it. Recommendation: fix it for consistency, even if unused.
- [ ] Document the type-on duration scaling pattern. The design-system's `--dur-type: 20ms/char` produces a 25-second animation on long banners. Add a separate `--dur-type-banner: 2ms/char` token, document the difference in the design-system README.
- [ ] Box primitive in `_ops/stigmergy/design-system/ui_kits/blackboard/primitives.jsx`: align with the app's `Box` (CSS borders all four sides, no character-cell top/bottom, no joint mismatch). The reference implementation should match the canonical implementation.
- [ ] Border-rendering rule revision. The README at `_ops/stigmergy/design-system/README.md` § Layout, § Cards still says "ASCII box borders built from CP437 characters... not CSS borders." Update to: "Borders use CSS styled to evoke CP437 weights — `3px double var(--phosphor-dim)` for primary containers, `1px solid var(--phosphor-dim)` for nested cards and rules. Character-cell rendering (`╔═╗ ║ ╚═╝`) is the deprecated prior approach; do not reintroduce it." Update the SKILL.md cross-reference.
- [ ] Welcome-banner asset cleanup. The login removal made `welcome_screen.txt` orphaned. Either delete or repurpose as a "splash" surface (deferred — leave fixed-but-unused).

**Verify (Phase 1):** `npm run check:phase-1` runs the v0.1.x polish checks (`command-bar-active.spec.js`, the existing `polish.spec.js` extended for no-center-justify and FLAG render parity), captures `screenshots/phase-1-v0.2/{general,flags,system,trickster}.png`, dispatches `visual-validator` against the rewritten `tests/checklists/phase-1.md`. The design-system files are checked by file inspection (font binary magic bytes, README rule text presence).

### Phase 2 — Write Path

Goal: a working POST endpoint with strict schema enforcement.

- [ ] `server/validator.js` implements §2.2 strict validation per the Schema Enforcement section above. 100% test coverage on the validator (`tests/unit/validator.test.js`).
- [ ] `server/append.js` provides an atomic-append helper. Uses `fs.appendFile` with `flag: 'a'`, ensures the line ends with `\n`, handles concurrent writes serially (queue per file path, or rely on OS-level append atomicity for sub-PIPE_BUF writes).
- [ ] `server/middleware.js` extended with:
  - `POST /api/persistent` — body is one §2.2-conformant message object. Returns 200 + the persisted line on success, 400 + `{errors: [...]}` on validation failure.
  - `POST /api/sessions/:id` — same contract, scoped to that session's `blackboard.jsonl`. If the session directory doesn't exist, create it.
- [ ] `src/adapters/blackboard.js` extended with `postMessage(message, target)` where `target` is `'persistent'` or `{ session: id }`. Returns the persisted message on success or throws an `InvalidMessageError` carrying the validation errors.
- [ ] `src/lib/response-builder.js` builds a response message from a pending RESOURCE_REQUEST + a chosen response option. Output is §2.2-conformant; `re:` correlation set; `from:` is `TRICKSTER`; `to:` is the original requester; `health.model:` is the model that ran the click-to-respond UI (likely `claude-opus-4-7` since this runs in a Loudon-driven session — but could also be a hard-coded `loudon-trickster` value since this isn't a model-generated message; spec is silent on human-originated messages, default to `loudon-trickster` as the model identifier).
- [ ] No UI changes yet — Phase 2 is plumbing only.

**Verify (Phase 2):** `npm run check:phase-2` runs `validator.test.js` + `post-middleware.test.js` + `response-builder.test.js`. All green required. No screenshots — no UI changes this phase. The validator's behavior on the live `songline-2026-05-04-001` data is part of the integration test (it must accept all 14 lines of that session's data, since they were generated to be §2.2-conformant).

### Phase 3 — Read Path

Goal: a working SSE endpoint and client subscription.

- [ ] `server/middleware.js` extended with `GET /api/persistent/stream` — Server-Sent Events. Initial response: `text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`. Watches `_ops/swarm/persistent/blackboard.jsonl` for changes (via `fs.watch` or chokidar). Each new line emits an `event: message\ndata: <json>\n\n` frame. Supports `Last-Event-ID` header for reconnection — sends any messages with `id > Last-Event-ID` on connect.
- [ ] Same for `GET /api/sessions/:id/stream`.
- [ ] `src/adapters/live-tail.js` wraps `EventSource` with reconnect-on-error and exponential backoff. Yields incoming messages to a subscriber callback.
- [ ] `src/lib/live-feed.js` — given a current message array and an incoming SSE message, returns a new array with the message merged in (deduplicated by `id`, sorted by `ts`).
- [ ] No UI changes yet — Phase 3 is plumbing only.

**Verify (Phase 3):** `npm run check:phase-3` runs `live-feed.test.js` + `sse-middleware.test.js`. All green required.

### Phase 4 — Click-to-Respond UI

Goal: the Trickster inbox becomes interactive.

- [ ] `TricksterInbox.jsx` updated: response options are real buttons (`<Button>` from primitives), not static list items. Each button has a hotkey-style label.
- [ ] `ResponseModal.jsx` (new): when a response button is clicked, this modal opens. Shows: the request being responded to (compact summary), the auto-generated response JSON (full preview, monospace, syntax-highlighted with `--phosphor`/`--phosphor-dim` tokens), a [CONFIRM] button, a [CANCEL] button. Confirm posts via `postMessage`; on success, modal closes; on failure, shows the validation errors inline and stays open.
- [ ] The "EDIT _ops/swarm/persistent/blackboard.jsonl TO RESPOND" caption is REMOVED — it's no longer the canonical path. (The file edit path still works, of course; it's just no longer the primary affordance.)
- [ ] After a successful click-to-respond, the inbox auto-refreshes — the request that was just responded to disappears from the pending list.

**Verify (Phase 4):** `npm run check:phase-4` runs `click-to-respond.spec.js` + the existing `inbox.spec.js` (now adapted for interactive buttons). Captures `screenshots/phase-4-v0.2/{inbox-pending, inbox-modal-preview, inbox-after-respond}.png`. Dispatches `visual-validator` against an updated `tests/checklists/phase-5.md` (Phase 5 in the v0.1 numbering covered the inbox; v0.2 keeps it there).

### Phase 5 — Live Tail Integration

Goal: the message list auto-updates without Reload.

- [ ] `App.jsx` subscribes to `live-tail.js` on mount. Incoming messages flow through `live-feed.js` to merge into the visible message array.
- [ ] StatusBar `RELOAD` button stays present (manual refresh is still useful) but its meaning shifts: it's a full re-fetch, not the only way to see new messages.
- [ ] A small "live" indicator in the status bar shows the SSE connection state: green dot for connected, amber for reconnecting, red for failed (similar to the existing `uplink ok` element). Actually — REPLACE the existing `uplink ok` text with a real connection state indicator: `LIVE`, `RECONNECTING`, `OFFLINE`.
- [ ] When a new FLAG message arrives, the FLAGS tab badge increments visibly even if the active tab is something else.
- [ ] When a new RESOURCE_REQUEST arrives on TRICKSTER, the TRICKSTER tab `(N PENDING)` badge increments visibly even if the active tab is something else.

**Verify (Phase 5):** `npm run check:phase-5` runs `live-tail.spec.js`. Captures `screenshots/phase-5-v0.2/{live-connected, live-message-arrived, live-reconnecting}.png`. Dispatches `visual-validator` against a new `tests/checklists/phase-5-v0.2.md`.

### Phase 6 — Polish + Validator Sweep + V0.2-COMPLETE.md

Goal: every checklist passes, every test is green, the spell remains unbroken.

- [ ] `npm run check:all` exits 0 — cumulative gate.
- [ ] All v0.1 e2e specs still pass (no regression in any prior behavior).
- [ ] All visual-validator checklists pass on a fresh capture.
- [ ] `_ops/stigmergy/app/README.md` updated to document the new endpoints (`POST /api/persistent`, `POST /api/sessions/:id`, `GET /api/persistent/stream`, `GET /api/sessions/:id/stream`) and the click-to-respond flow.
- [ ] `_ops/stigmergy/design-system/README.md` reflects the border-rendering rule revision and the type-on duration scaling pattern.
- [ ] `V0.2-COMPLETE.md` written at `_ops/stigmergy/app/`. Contains: every check that ran, every fix applied (drawn from `build-log.jsonl`), all screenshots, deferred-to-v0.3 items discovered during the build, any decisions Claude Code made that Loudon should review.

**Verify (Phase 6):** `npm run check:phase-6` runs the full e2e suite, the full unit/integration suite, and `check:all`. Captures the comprehensive screenshot set. `visual-validator` passes the rewritten Phase 6 checklist.

**On Phase 6 success:** branch `stigmergy-v0.2` ready for Loudon's smoke-test. Stop.

## Subagent Decomposition

Same roles as v0.1 (read [[BBS Production Plan]] § Subagent Decomposition for the full table). Parallelism rules unchanged. New scoped roles for v0.2:

| Subagent | Role | Invoked when |
|---|---|---|
| `polish-sweeper` | Apply v0.1.x polish items + design-system v0.2 findings as targeted edits | Phase 1 only |
| `validator-author` | Implement the strict §2.2 validator with full test coverage | Phase 2 only |
| `sse-builder` | Implement the SSE endpoint + reconnect logic + `Last-Event-ID` handling | Phase 3 only |
| `modal-builder` | Implement `ResponseModal.jsx` with preview/confirm flow | Phase 4 only |
| `live-integrator` | Wire the EventSource subscription into the App, add live-state indicator, badge increments | Phase 5 only |

All other roles (`explorer`, `test-author`, `test-runner`, `debugger`, `visual-validator`, `synthesizer`) are unchanged from v0.1.

## Self-Verification & Iteration Protocol

Same as v0.1. Read [[BBS Production Plan]] § Self-Verification & Iteration Protocol. Ten attempts per failing check, escalating from naive fix → full-context fix → alternate-approach fix → stop-report. `build-log.jsonl` accumulates every fix attempt.

## Stop Conditions

Same as v0.1, plus:

- The strict validator rejects something Loudon will need to write manually — this is a sign the schema or the validator needs revision; stop and surface the conflict.
- SSE reconnect logic enters a flapping state during testing (5+ rapid disconnects) — likely indicates a server-side resource leak; stop and diagnose before pushing through.

Phase 6 success is still a stop-on-success.

## What's Deferred (v0.3+)

- **The orchestrator** — Infrastructure Spec §3.2's `runAgentCycle`. Still its own project. STIGMERGY v0.2 makes the board operational *for humans*; the orchestrator makes it operational *for agents*. The two are independent.
- **Always-on service / daemonization.** Fine to add when the workflow demands it. Loudon's current pattern is `npm run dev` on demand; that still works.
- **Persistent board promotion ceremony** (Infrastructure Spec §2.8). Coordinator-side; orthogonal to the UI.
- **Authentication / multi-user.** Single-operator continues.
- **Trickster broadcast UI** — for posting non-RESOURCE_REQUEST messages from the UI (e.g., a manual FLAG or a SESSION_INIT for a new songline run from STIGMERGY itself). Scope creep for v0.2; comfortable as v0.3 if Loudon's usage pattern shows demand.
- **Session selector UX improvements.** Currently the session dropdown is functional; richer browsing/filtering is v0.3.
- **Live-tail backpressure.** If the orchestrator floods the board faster than the UI can render, we may need batching. Not a v0.2 concern at human-driven write rates.

## Handoff to Claude Code

This file is the build contract. The session reads it end-to-end, runs the phases autonomously per the Self-Verification & Iteration Protocol, and stops only on a stop condition or after Phase 6 success.

**Opening prompt for the Claude Code session:**

> You are building STIGMERGY v0.2 autonomously. Read `Palace development/BBS Production Plan v0.2.md` end to end — it is your build contract. Then read `Palace development/BBS Production Plan.md` (v0.1, the template you are extending) and `_ops/stigmergy/app/V0.1-COMPLETE.md` (what v0.1 actually shipped). Then read `Palace development/BBS Blackboard.md`, `Palace development/BBS Design System.md`, and `Palace development/Palace Agent Infrastructure Spec.md` for the architectural and visual context.
>
> Before starting Phase 1, read `_ops/stigmergy/app/src/components/primitives.jsx`, `_ops/stigmergy/app/src/App.jsx`, `_ops/stigmergy/app/server/middleware.js`, and `_ops/stigmergy/app/src/components/MessageList.jsx` to understand the v0.1.x state of the code. Also read the existing checklists at `_ops/stigmergy/app/tests/checklists/phase-{1..6}.md` — Phase 1 of this build will rewrite phase-1 and phase-6 checklists, and update phase-3 and phase-5.
>
> Use the live `_ops/swarm/persistent/blackboard.jsonl` (14 messages from `songline-2026-05-04-001`) as canonical clean test data. Every line is §2.2-conformant; the strict validator must accept all 14 lines. If a test seems to require non-conformant data, generate it as a fixture under `tests/fixtures/`.
>
> Then run Phase 1 through Phase 6 autonomously per the Subagent Decomposition table and the Self-Verification & Iteration Protocol. Use up to 10 fix attempts per failing check. Append every check, every fix, every screenshot to `build-log.jsonl`. At each phase boundary: run `npm run check:phase-N`, dispatch the visual-validator, commit with message `STIGMERGY v0.2 — Phase N — [outcome]` if green, advance to the next phase. Do not push.
>
> Stop only when a stop condition triggers (write `STOP-REPORT.md`) or Phase 6 succeeds (write `V0.2-COMPLETE.md`). Loudon will review the report on his return; do not page him during the run.
>
> Unlike the v0.1 build, the design system at `_ops/stigmergy/design-system/` IS modifiable in v0.2 — Phase 1 explicitly updates it. Read the v0.1 plan's read-only rule for context, then ignore it for v0.2.

The session runs unattended. When it returns, exactly one of two artifacts exists at `_ops/stigmergy/app/`:

- `V0.2-COMPLETE.md` — Phase 6 finished, all checks green, ready for Loudon's smoke test
- `STOP-REPORT.md` — execution paused, full context inside, one decision required

Both are designed to be readable in five minutes.

## Open Questions

These are not blockers for Phase 1, but they will surface and need answers before they bite. The defaults below are what the autonomous session uses unless a stop-report surfaces a decision Loudon should make.

- **Confirm-step for click-to-respond.** Required for v0.2 (the modal preview + confirm flow). Loudon may find it annoying for high-volume responding; if usage data after v0.2 lands shows it adds friction without value, v0.3 could add a "quick respond" mode that skips the modal for the four canonical response options.
- **Live tail and Loudon's manual file edits.** When Loudon edits the blackboard file directly (the file-is-truth path, still supported), the SSE endpoint must detect the change and emit an event. `fs.watch` should handle this. Edge case: if Loudon edits in the middle of a write from the orchestrator, line ordering could be unstable — but at human edit rates this is unlikely.
- **What happens to a malformed line that exists on disk?** v0.1 rendered it with red borders. v0.2's strict validator only governs *writes*, not *reads*. The UI's existing read-side warning behavior continues. If we wanted to harden, the read path could ALSO validate strictly and refuse to display malformed lines — but that loses the diagnostic value. Default for v0.2: read-side stays lenient with red-border warnings; write-side is strict. If Loudon prefers strict-on-both-sides, surface as a stop-report.
- **Session-board POSTs creating session directories on the fly.** Convenient, but allows accidental directory creation by typo. Default for v0.2: creates the directory. Add a `?create=false` query param for clients that want to refuse if missing. v0.3 might require explicit session creation via a separate `POST /api/sessions` endpoint.
- **Iteration budget calibration after v0.1.** v0.1's run had ~11 fix iterations across six phases. v0.2's scope is similar; the 10-attempt budget should hold.

---

*"Make the board operational. The agents already use it. Now the human can too."*

*"v0.1 was the spell. v0.2 is the spell answering back."*
