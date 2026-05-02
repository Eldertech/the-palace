---
title: BBS Production Plan
type: project
status: complete
pillars:
  - tools
  - practice
born: 2026-05
last_activated: 2026-05-02
activation_count: 3
stage: mature
energy: very high
forward_vector: >
  I want to become the autonomous build contract that turns the BBS Blackboard architecture,
  the BBS Design System, and the Palace Agent Infrastructure Spec into a running STIGMERGY
  terminal — without Loudon present during the build. Every check is machine-verifiable.
  Every visual decision is reviewed by a vision-capable subagent against the design system.
  Failures iterate up to a budget, then stop with a full-context stop-report. A Claude Code
  session reading this file knows what to build, how to test it, when to retry, when to stop,
  and what to hand back when v0.1 is ready for human review.
links:
  - target: "[[BBS Blackboard]]"
    type: enables
    label: execution-of
  - target: "[[BBS Design System]]"
    type: enables
    label: implements
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: connects-to
    label: derives-from
  - target: "[[Palace To-Do]]"
    type: connects-to
  - target: "[[Substrate]]"
    type: connects-to
    label: technical-substrate
  - target: "[[Progressive Staging]]"
    type: mirrors
    label: phased-build
---

# BBS Production Plan

The architecture is in [[BBS Blackboard]]. The visual language is in [[BBS Design System]]. The infrastructure foundation is in [[Palace Agent Infrastructure Spec]]. This document is the bridge: the executable contract that turns those three specs into a running STIGMERGY terminal.

It exists because as of 2026-05-02 those three specs do not compose into a build sequence Claude Code can grind through without coming back for a dozen decisions. The decisions are made here. The phases below are checkboxes, not narrative.

## Decisions (2026-05-02)

| Decision | Choice | Reason |
|---|---|---|
| Scope of v0.1 | Read-only viewer | Smallest path to a real artifact. Renders existing `blackboard.jsonl` data in the full STIGMERGY skin. Trickster intervention happens by editing files directly — file is the truth, UI is the lens. Unblocks the Enchanted Songline immediately. |
| Frontend stack | Vite + React | The existing `_ops/stigmergy/design-system/ui_kits/blackboard/*.jsx` components transfer directly with no rewrite. Tokens already in `colors_and_type.css`. Standard, boring, well-supported. Tiny build. |
| Local runtime | On-demand dev server | `npm run dev` from `_ops/stigmergy/app/` starts Vite + a tiny Node middleware that reads `.jsonl` files. Browser opens to localhost. No daemon, no plist, no always-on process. |
| Directory home | `_ops/stigmergy/app/` | Sibling to `_ops/stigmergy/design-system/`. Single home for everything BBS-related: design system on one side, running app on the other. |

## What v0.1 Is and Is Not

**v0.1 is** a browser-based BBS terminal that opens at `localhost`, reads the palace's `.jsonl` blackboard files, and renders them with the full STIGMERGY visual language — channel tabs, message-type signatures, health blocks, agent roster, Trickster inbox. Loudon launches it on demand to read the board during or after a swarm session.

**v0.1 is not** a way to post messages, a service that runs at boot, the orchestrator from §3 of the Infrastructure Spec, a permission-protocol responder, or a Trickster-action surface. All of that is v0.2+ scope (see [What's Deferred](#whats-deferred)).

The honest summary: v0.1 makes the board visible. The agents that write to the board, and the human who responds to them by editing files, are unchanged.

## Autonomous Build Contract

This plan operates as a contract for autonomous execution. A Claude Code session reads this file, dispatches subagents, runs tests, iterates on failures, and runs the build to completion without human intervention except at the final v0.1 review checkpoint.

The contract has four commitments:

**1. Every phase is self-verifiable.** Acceptance criteria are not "looks right" — they are tests that exit 0 on pass and non-zero on fail. Each phase has an `npm run check:phase-N` script that runs every criterion for that phase. The phase is complete only when that script exits 0.

**2. Visual quality is reviewed by a vision-capable subagent.** The BBS is design-heavy, and tests cannot catch ugly. A `visual-validator` subagent receives screenshots at each phase boundary plus a checklist derived from [[BBS Design System]] non-negotiables — no rounded corners, monospace everywhere, 80ch max-width, CP437 borders aligned, no emoji, phosphor primary, amber for FLAGS, type-on motion uses `steps()`. The subagent returns pass/fail per item with reasoned justifications. Visual fails block phase completion just like test fails.

**3. Failures iterate up to a budget, then stop.** When a check fails, the lead session dispatches a `debugger` subagent, applies a fix, re-runs the check. Up to ten attempts per failing check. Only then does the session stop and write a stop-report. Stop-reports are a feature: they arrive with full context so Loudon's intervention is one decision, not a re-investigation.

**4. Loudon is absent until v0.1 is declared complete.** No phase-by-phase approvals. No "does this look right?" mid-flight. The session runs to Phase 6 success, writes a `V0.1-COMPLETE.md` report with all artifacts, and stops. Loudon reviews the report, smoke-tests on his own machine, and either confirms or sends specific issues back for a focused second pass.

## Directory Layout

```
_ops/stigmergy/
├── design-system/              ← already exists (Phase 0, complete)
│   ├── README.md
│   ├── SKILL.md
│   ├── colors_and_type.css
│   ├── fonts/
│   ├── assets/
│   ├── preview/
│   └── ui_kits/blackboard/
│
└── app/                        ← v0.1 lives here
    ├── package.json            ← scripts: dev, build, test, check:phase-1..6, check:all
    ├── vite.config.js          ← includes blackboard data middleware
    ├── playwright.config.js
    ├── vitest.config.js
    ├── index.html
    ├── README.md               ← run instructions + how Claude Code uses this dir
    ├── build-log.jsonl         ← append-only log of every check run + every fix attempt
    ├── public/
    │   └── fonts/              ← copies of woff2 from design-system/fonts/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx             ← top-level shell
    │   ├── adapters/
    │   │   └── blackboard.js   ← fetch + parse helpers
    │   ├── components/
    │   │   ├── Shell.jsx
    │   │   ├── LoginScreen.jsx
    │   │   ├── ChannelTabs.jsx
    │   │   ├── BoardIndex.jsx
    │   │   ├── ThreadView.jsx
    │   │   ├── Message.jsx
    │   │   ├── HealthBlock.jsx
    │   │   ├── AgentRoster.jsx
    │   │   ├── TricksterInbox.jsx
    │   │   ├── StatusBar.jsx
    │   │   ├── CommandBar.jsx
    │   │   └── primitives.jsx  ← lifted from design-system/ui_kits/blackboard/
    │   ├── styles/
    │   │   └── tokens.css      ← imports design-system/colors_and_type.css
    │   └── lib/
    │       ├── parser.js       ← parses blackboard.jsonl, schema-validates
    │       ├── inbox.js        ← derives pending requests from message list
    │       ├── roster.js       ← derives agent state from message list
    │       └── format.js       ← timestamp, columns, glyph helpers
    ├── server/
    │   └── middleware.js       ← Vite plugin: GET /api/persistent etc.
    ├── tests/
    │   ├── unit/               ← Vitest, lib/* coverage
    │   ├── integration/        ← Vitest + supertest, middleware coverage
    │   ├── e2e/                ← Playwright, end-to-end UI behavior
    │   ├── fixtures/           ← sample blackboard.jsonl files for offline tests
    │   └── checklists/
    │       ├── phase-1.md      ← visual-validator checklist per phase
    │       ├── phase-2.md
    │       ├── phase-3.md
    │       ├── phase-4.md
    │       ├── phase-5.md
    │       └── phase-6.md
    ├── screenshots/            ← Playwright outputs; reviewed by visual-validator
    │   ├── phase-1/
    │   ├── phase-2/
    │   └── ...
    └── scripts/
        ├── check-phase.js      ← orchestrates one phase's full verify gate
        └── visual-validate.js  ← invokes visual-validator subagent on screenshots
```

The `design-system/` directory is the source of truth for visual tokens and component prototypes. The `app/` directory imports from it but does not modify it. If a token changes, it changes in `design-system/colors_and_type.css` and `app/` picks it up automatically.

## Data Adapter

A single Vite middleware (in `server/middleware.js`, registered via `configureServer` in `vite.config.js`) exposes three read-only endpoints:

```
GET /api/persistent
  → Reads _ops/swarm/persistent/blackboard.jsonl
  → Returns: { messages: [<msg>, ...], file_size_bytes, last_modified }
  → Skips malformed lines with a console warning; never throws.

GET /api/sessions
  → Globs _ops/swarm/sessions/*/blackboard.jsonl
  → Returns: { sessions: [{ id, path, message_count, last_modified }, ...] }

GET /api/sessions/:id
  → Reads _ops/swarm/sessions/:id/blackboard.jsonl
  → Returns: { messages: [<msg>, ...], file_size_bytes, last_modified }
```

No live tail in v0.1. The UI has a Reload button in the StatusBar; pressing it refetches. If the user wants live updates during a running swarm, they reload manually. Live tail (SSE or WebSocket) is a v0.2 concern.

The middleware resolves palace paths relative to `_ops/stigmergy/app/../../../` (palace root) — but the path is also configurable via env var `PALACE_ROOT` for portability. Tests use `PALACE_ROOT` pointed at `tests/fixtures/` for hermetic runs.

Each parsed message is validated against the schema from Infrastructure Spec §2.2: required fields are `schema_version`, `id`, `ts`, `session_id`, `from`, `to`, `type`, `board`. Missing-field messages are kept but flagged with a `_warnings` array — the UI renders them with a red border.

## Test Strategy

Three layers, executed in order at each phase's verify gate. The `check-phase.js` script runs them and aggregates results.

**Unit tests (Vitest)** — `tests/unit/`

| File | What it covers |
|---|---|
| `parser.test.js` | JSONL line parsing, malformed-line resilience, empty-file handling, BOM handling |
| `schema.test.js` | Message schema validator: required-field detection, type enums, ISO 8601 ts validation |
| `inbox.test.js` | Inbox derivation: pairing requests with responses by `re:`/`request_id`, returning unpaired only, multiple-response edge case |
| `roster.test.js` | Agent extraction from message list, latest-per-agent, context_pct trend detection |
| `format.test.js` | Timestamp helpers, character-cell column alignment, glyph mapping per message type |

**Integration tests (Vitest + supertest)** — `tests/integration/`

| File | What it covers |
|---|---|
| `middleware.test.js` | `GET /api/persistent`, `/api/sessions`, `/api/sessions/:id` against `tests/fixtures/`. Status codes, response shape, file-path resolution, env-var override, missing-file handling |

**End-to-end tests (Playwright)** — `tests/e2e/`

| File | What it covers |
|---|---|
| `boot.spec.js` | Dev server starts, page loads, no console errors, no unhandled promise rejections |
| `tokens.spec.js` | Computed styles: VT323 + IBM Plex Mono loaded, phosphor primary, terminal-black background, `border-radius: 0` everywhere |
| `data.spec.js` | Page fetches `/api/persistent` on mount, ≥1 real message rendered |
| `tabs.spec.js` | Each channel tab filters messages correctly |
| `types.spec.js` | Each message type renders its expected prefix glyph (data-testid checks) |
| `health.spec.js` | Health blocks render; score colors match green/yellow/red rules |
| `roster.spec.js` | Agent roster panel renders; click-to-filter works |
| `inbox.spec.js` | Trickster inbox shows pending count badge; pending items render |
| `polish.spec.js` | Hotkeys (1–6, R, V, Q), type-on animation, scanline toggle |

**Visual validation (vision-capable subagent)** — at each phase boundary

After Playwright runs, screenshots land in `screenshots/phase-N/`. The `visual-validator` subagent receives each screenshot plus the corresponding `tests/checklists/phase-N.md` file (a list of design-system non-negotiables relevant to that phase) and returns one of:

- `pass` — every checklist item satisfied, with a one-line citation per item
- `fail: <reason>` — at least one item failed, with the specific failure and a fix suggestion

A visual `fail` is treated identically to a test fail: routed to the debugger, fix attempted, retry. Same iteration budget.

## Phases

Phase 0 (Deposit) is complete: design system at `_ops/stigmergy/design-system/`, dated 2026-04-21.

### Phase 1 — Project Skeleton

Goal: a working dev server that boots and shows the design system's existing prototype components against seed data.

- [ ] `_ops/stigmergy/app/` directory created
- [ ] `package.json` with dependencies: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`
- [ ] `vite.config.js` includes the React plugin
- [ ] `index.html` loads `src/main.jsx`
- [ ] `src/styles/tokens.css` imports `../../design-system/colors_and_type.css`
- [ ] `public/fonts/` contains copies of VT323 + IBM Plex Mono woff2 files
- [ ] Existing prototype components (Shell, LoginScreen, BoardIndex, ThreadView, Composer, AgentRoster, primitives) imported into `src/components/` and rendered with seed data
- [ ] `npm install` succeeds with no peer-dependency warnings
- [ ] `npm run dev` opens a browser tab showing the STIGMERGY login banner
- [ ] Phosphor green (`#33ff66`) on terminal black (`#050a06`) verified by eye
- [ ] VT323 banner + IBM Plex Mono body fonts both loading (no fallback to Menlo)
- [ ] `README.md` in `app/` explains how to start, stop, and where the data comes from

**Verify (Phase 1):** `npm run check:phase-1` runs `boot.spec.js` + `tokens.spec.js`, captures `screenshots/phase-1/login.png`, and dispatches the `visual-validator` against `tests/checklists/phase-1.md`. Phase complete only when the script exits 0 and the validator returns `pass`.

### Phase 2 — Data Adapter

Goal: real palace data on screen.

- [ ] `server/middleware.js` implements `GET /api/persistent`
- [ ] Middleware registered in `vite.config.js` via `configureServer`
- [ ] `src/adapters/blackboard.js` provides `fetchPersistent()`, `fetchSessions()`, `fetchSession(id)`
- [ ] Adapter validates messages against the Infrastructure Spec §2.2 schema; flags warnings
- [ ] Malformed JSONL lines are skipped with console warnings; the page never crashes on bad data
- [ ] On mount, the app fetches `/api/persistent` and renders the 113 existing messages from the persistent board
- [ ] StatusBar Reload button refetches and updates the view
- [ ] `GET /api/sessions` returns the list of session blackboards (empty list is a valid response)
- [ ] If no sessions exist, the UI shows "NO SESSIONS YET. PERSISTENT BOARD ONLY."

**Verify (Phase 2):** `npm run check:phase-2` runs `parser.test.js` + `schema.test.js` + `middleware.test.js` + `data.spec.js`, captures `screenshots/phase-2/persistent-loaded.png`, and dispatches the `visual-validator` against `tests/checklists/phase-2.md`. All green required.

### Phase 3 — Channel Tabs and Message-Type Signatures

Goal: navigable boards with distinct visual treatments per message type.

- [ ] `ChannelTabs.jsx` renders the six boards: GENERAL / FLAGS / WEAVE / SYSTEM / TRICKSTER / BRANCHES
- [ ] Active tab is inverted (black text on phosphor fill); inactive tabs are dim green
- [ ] Clicking a tab filters the message list to only that board (`message.board === activeTab`)
- [ ] `Message.jsx` renders distinct visual signatures for each type from Infrastructure Spec §2.4:
  - `BROADCAST` — neutral phosphor, no prefix
  - `FLAG` — amber accent (`--amber`), `!` prefix
  - `REPLY` — `> ` prefix, dim green metadata showing `re:` target
  - `PROOF` — double box border, full proof object expanded
  - `RESOURCE_REQUEST` — gold accent (`--cyan` for handles), `?` prefix
  - `RESOURCE_GRANT` — green check, dim
  - `RESOURCE_DENY` — red, `x` prefix
  - `QUERY` — italic-styled (or whatever the design system equivalent is — italic likely doesn't exist in VT323)
  - `SESSION_INIT` / `SESSION_CLOSE` — system-level styling, dim, centered
  - `PAGE_UPDATE` — dim cyan, file-path prefix
  - `HEALTH_NOTICE` — yellow or red border depending on score
- [ ] All ASCII box-drawing aligns. Verified by inspection — no broken `╔═╗` joints in any view.
- [ ] Empty board state: `NO TRACES ON THIS BOARD YET.`

**Verify (Phase 3):** `npm run check:phase-3` runs `tabs.spec.js` + `types.spec.js`, captures `screenshots/phase-3/{general,flags,weave,system,trickster,branches}.png` (six screenshots, one per channel), dispatches `visual-validator` against `tests/checklists/phase-3.md` for each. ASCII alignment is the highest-stakes check at this phase — the validator's checklist explicitly verifies CP437 box-drawing joints.

### Phase 4 — Health Blocks and Agent Roster

Goal: agent state visible at a glance.

- [ ] `HealthBlock.jsx` renders the per-message health metadata: `[ctx 18% · qwen3:14b · green]`
- [ ] Score color: green = phosphor, yellow = amber, red = `--red`
- [ ] `AgentRoster.jsx` panel on the right shows, for each unique `from` field across all messages: `agent_id`, `home` (if knowable), latest health score, latest `context_pct`, last message timestamp
- [ ] An agent whose `context_pct` climbs across successive messages renders a small inline trend (`18% ↗ 34% ↗ 61%`) — no chart library, just numbers
- [ ] Roster sort: by latest message timestamp descending
- [ ] Clicking an agent in the roster filters the message list to messages from that agent

**Verify (Phase 4):** `npm run check:phase-4` runs `roster.test.js` + `health.spec.js` + `roster.spec.js`, captures `screenshots/phase-4/with-roster.png`, dispatches `visual-validator` against `tests/checklists/phase-4.md`.

### Phase 5 — Trickster Inbox

Goal: read-only inbox surface for pending RESOURCE_REQUESTs (per Infrastructure Spec §2.6).

- [ ] `lib/inbox.js` implements the algorithm: scan all messages, build `{ request_id → response? }` map, return requests with no response
- [ ] `TricksterInbox.jsx` renders the pending list when the TRICKSTER tab is active
- [ ] Each pending item shows: `from`, `ts`, `resource`, `rationale`, `blocking` flag, `agent_health`, `agent_context_pct`, `agent_status`
- [ ] Response options from §2.6 are displayed as a list but **not interactive** — captioned `EDIT _ops/swarm/persistent/blackboard.jsonl TO RESPOND` with the exact path
- [ ] Empty state: `NO PENDING REQUESTS. ALL AGENTS UNBLOCKED.`
- [ ] Counter in the channel tab bar: `TRICKSTER (3 PENDING)` when there are unanswered requests

**Verify (Phase 5):** `npm run check:phase-5` runs `inbox.test.js` + `inbox.spec.js`, captures `screenshots/phase-5/{empty,populated}.png`, dispatches `visual-validator` against `tests/checklists/phase-5.md`. Note: this phase requires fixture data with at least one paired and one unpaired RESOURCE_REQUEST in `tests/fixtures/inbox-fixture.jsonl`.

### Phase 6 — Polish

Goal: the spell is unbroken. Reads as a 1988 BBS, not a 2026 SaaS.

- [ ] `LoginScreen.jsx` types on the welcome banner from `_ops/stigmergy/design-system/assets/welcome_screen.txt` at ~20ms/char using `steps()` easing
- [ ] CRT scanline overlay is on by default; toggleable via `[V]` hotkey or a footer link `[V]ISUAL OFF`
- [ ] Footer `CommandBar.jsx` shows persistent hotkey list, e.g. `[1-6] CHANNEL  [R]ELOAD  [V]ISUAL  [Q]UIT`
- [ ] Header `StatusBar.jsx` shows: `BLACKBOARD · NODE 01 · @loudon · [time] · [N] NEW`
- [ ] Hotkeys 1–6 switch channels; R reloads; V toggles scanlines; Q closes the tab (with confirm)
- [ ] CSS `border-radius: 0` enforced everywhere — verified by ripgrep showing zero matches outside the design-system reference styles
- [ ] No emoji anywhere in the app code or rendered output
- [ ] All 80ch max-widths respected — no message body wraps past 80 columns
- [ ] `README.md` updated with screenshots (or ASCII captures) of each major view

**Verify (Phase 6):** `npm run check:phase-6` runs `polish.spec.js` + the full e2e suite + the full unit/integration suite, captures `screenshots/phase-6/{login,general,flags,trickster-inbox,scanlines-off}.png`, dispatches `visual-validator` against `tests/checklists/phase-6.md`. Additionally, `npm run check:all` must exit 0 — the cumulative gate that proves no earlier phase regressed.

**On Phase 6 success:** the lead session writes `_ops/stigmergy/app/V0.1-COMPLETE.md` containing every check that ran, every fix applied (drawn from `build-log.jsonl`), all screenshots, deferred-to-v0.2 items discovered during the build, and any decisions Claude Code made that Loudon should review. Then it stops.

## Subagent Decomposition

Subagent roles invoked during the build. The lead session orchestrates; subagents do focused, scoped work and report back.

| Subagent | Role | Invoked when |
|---|---|---|
| `explorer` | Read-only inspection of palace state, design system files, existing prototypes, current app/ state | Start of each phase, when reconnecting context after a long gap |
| `scaffolder` | Create directories, `package.json`, `vite.config.js`, lockfile-clean install | Phase 1 only |
| `tokens-wirer` | Connect design-system CSS tokens to app components, copy fonts to `public/fonts/` | Phase 1, refresh in Phase 6 |
| `server-builder` | Implement the Vite middleware, server-side parsing, file-path resolution | Phase 2 only |
| `component-builder` | Implement a single React component (Shell, ChannelTabs, Message, etc.) | Phases 3–6, dispatchable in parallel per component when components are independent |
| `test-author` | Write Vitest + Playwright tests for the current phase's acceptance criteria | Each phase, in parallel with component-builder once interfaces are agreed |
| `test-runner` | Execute test suites, capture failure stack traces, record results to `build-log.jsonl` | At each verify gate |
| `debugger` | Read failing test output, diagnose root cause, propose a specific fix grounded in the relevant spec | Whenever a check fails |
| `visual-validator` | Open screenshots, verify against the phase checklist, return pass/fail with reasoned justifications | At each phase boundary, after tests pass |
| `synthesizer` | Summarize phase outcomes, write the commit message, append to `build-log.jsonl`, update internal phase tracker | End of each phase |

**Parallelism rules:**
- `scaffolder` is sequential — nothing runs before it finishes in Phase 1
- `tokens-wirer` runs after `scaffolder`, before any `component-builder`
- `component-builder` instances run in parallel when components don't depend on each other (e.g., `HealthBlock` and `AgentRoster` can both build at once)
- `test-author` can run in parallel with `component-builder` once the component's interface (props, exports) is agreed
- `debugger` runs sequentially with the implementer that owns the failing area
- `visual-validator` runs after `test-runner` passes — fixing visual issues with broken tests creates noise
- `synthesizer` is the last subagent in any phase

## Self-Verification & Iteration Protocol

When any check fails — Vitest, Playwright, or visual-validator — the lead session enters the iteration loop. Every attempt is appended to `_ops/stigmergy/app/build-log.jsonl` as one line: `{ts, phase, check, attempt, fix_applied, outcome}`.

**Attempts 1–4: naive fixes.** `debugger` reads the test output and the relevant component, proposes a fix, implementer applies it, re-run the check. Fast loop.

**Attempt 5: full-context fix.** `debugger` reads the relevant component, the failing test, the matching design-system spec section, and the matching Infrastructure Spec section. Proposes a fix grounded in all of them. This is the "step back and read the spec" attempt.

**Attempts 6–9: alternate-approach fixes.** `debugger` considers whether the test itself is wrong (specs the wrong thing), whether the spec is unclear, or whether the implementation needs a structural change rather than a local fix. The fix may involve rewriting the test, refactoring the component, or both. Each attempt logs its reasoning.

**Attempt 10: stop.** Write `_ops/stigmergy/app/STOP-REPORT.md` containing: the failing check, all 10 attempts and their outcomes, the relevant spec sections, what `debugger` thinks the underlying problem is, what decision Loudon needs to make. Pause execution. Wait.

Stop reports are not failures of the plan — they are the plan working correctly. The plan does not pretend Claude Code can solve every problem autonomously. A stop-report saves Loudon time by arriving with full context: he reads it, makes one decision, and the build resumes from where it stopped.

## Stop Conditions

The session writes a stop-report and pauses when:

- A single check fails 10 attempts in a row without a fix
- Architecture ambiguity is discovered (the spec genuinely doesn't say something needed)
- Test infrastructure itself fails (`npm install` fails, Playwright can't connect, ports collide)
- A scope question affects multiple phases (e.g., realizing the schema needs revision)
- The visual-validator reports a hard-to-resolve aesthetic issue across two consecutive phase boundaries
- A repeating failure pattern is detected across three or more phases — likely a structural problem the iteration loop can't reach
- Phase 6 completes successfully — this is a stop-on-success and triggers the v0.1 review

A stop-report always includes: where execution stopped, what was tried, what spec material is relevant, and a recommended decision frame for Loudon. The session does not editorialize about whether the plan is wrong — it presents the situation neutrally.

## What's Deferred

Explicitly out of scope for v0.1. These are real, but they are different projects.

**Trickster posting (v0.2).** Adds `POST /api/persistent` and `POST /api/sessions/:id` endpoints that append to the appropriate `.jsonl` file. Requires authentication thinking even if local-only. Click-to-respond on the Trickster Inbox lights up.

**Live tail (v0.2 or v0.3).** SSE endpoint emitting new messages as they arrive. UI auto-updates without Reload. Useful for live swarm runs; unnecessary for retrospective inspection.

**The orchestrator (v0.x — its own project).** Implementing `runAgentCycle` from Infrastructure Spec §3.2: manifest loading, history file management, git change detection, model dispatch, health score updates, the full agent lifecycle. This is its own production plan. The BBS UI doesn't depend on it — the orchestrator writes to `.jsonl`; the UI reads `.jsonl`.

**Always-on service.** Daemonizing the dev server, launchd plist, fixed port. Fine to add when the workflow demands it.

**Persistent board promotion ceremony (Infrastructure Spec §2.8).** Coordinator-side logic; orthogonal to the UI.

**Authentication / multi-user.** STIGMERGY is single-operator. If that ever changes, it changes a lot.

## Handoff to Claude Code

This file is the build contract. The session reads it end-to-end, runs the phases autonomously per the Self-Verification & Iteration Protocol, and stops only on a stop condition or after Phase 6 success.

**Opening prompt for the Claude Code session:**

> You are building STIGMERGY v0.1 autonomously. Read `Palace development/BBS Production Plan.md` end to end — it is your build contract. Then read `Palace development/BBS Blackboard.md`, `Palace development/BBS Design System.md`, and `Palace development/Palace Agent Infrastructure Spec.md` for the architectural and visual context. Then read `_ops/stigmergy/design-system/README.md` and `_ops/stigmergy/design-system/SKILL.md` for the visual non-negotiables.
>
> Before starting Phase 1, write the six visual-validator checklists at `_ops/stigmergy/app/tests/checklists/phase-{1..6}.md` derived from the BBS Design System non-negotiables. These are inputs to the visual-validator subagent at each phase boundary. Use the design system's "Visual Language (Non-Negotiables)" section as the source of truth.
>
> Then run Phase 1 through Phase 6 autonomously per the Subagent Decomposition table and the Self-Verification & Iteration Protocol. Use up to 10 fix attempts per failing check. Append every check, every fix, every screenshot to `build-log.jsonl`. At each phase boundary: run `npm run check:phase-N`, dispatch the visual-validator, commit with message `STIGMERGY v0.1 — Phase N — [outcome]` if green, advance to the next phase. Do not push.
>
> Stop only when a stop condition triggers (write `STOP-REPORT.md`) or Phase 6 succeeds (write `V0.1-COMPLETE.md`). Loudon will review the report on his return; do not page him during the run.
>
> Do not modify anything in `_ops/stigmergy/design-system/` — that directory is the source of truth for visual tokens. Read from it; do not write to it. The design system's CSS tokens import into the app via relative path; if you find a token missing or malformed, write a STOP-REPORT rather than editing the design system.

The session runs unattended. When it returns, exactly one of two artifacts exists at `_ops/stigmergy/app/`:

- `V0.1-COMPLETE.md` — Phase 6 finished, all checks green, ready for Loudon's smoke test
- `STOP-REPORT.md` — execution paused, full context inside, one decision required

Both are designed to be readable in five minutes.

## v0.1 Closure (2026-05-02)

The autonomous build ran on 2026-05-02. Six phases. ~11 fix iterations across the run. Zero stop-reports. Phase 6 returned `OVERALL: pass`. The output is at `_ops/stigmergy/app/`; the full forensic report is at `_ops/stigmergy/app/V0.1-COMPLETE.md`.

Verified independently 2026-05-02: 81 unit + integration tests green on a fresh run, 16 visual-validator-vetted screenshots present, git history clean across six phase commits + a final closure commit on branch `stigmergy-v0.1`. The login screen shows the cracked-shareware STIGMERGY moment exactly as the design system specified — phosphor banner, amber + red `cracked by tRiCKSTER` tagline, dim-green status and command bars.

Real findings surfaced and flagged honestly during the build, none of which are v0.1 bugs — they are substrate issues that v0.1 made visible:

- Corrupt fonts in `design-system/fonts/` (`IBMPlexMono-*.woff2` are 1623-byte HTML stubs, not woff2)
- "BLACKBOARD" violation in `design-system/assets/welcome_screen.txt` (the design system's own name rule says STIGMERGY for product copy)
- Em dashes in the same asset (against the design system's no-em-dashes content rule)
- Schema-drift on the persistent palace blackboard (110 of 113 messages don't conform to Infrastructure Spec §2.2)
- Sessions directory shape mismatch (`_ops/swarm/sessions/` has flat files, spec expects `<id>/blackboard.jsonl`)

Two follow-on tickets in [[Palace To-Do]]: STIGMERGY v0.2 — Design System cleanup, STIGMERGY v0.2 — Persistent blackboard normalization. Both are deferrable; neither blocks Stage 5 — Enchanted Songline, which is now unblocked.

This entry is now reference material. The phase checklists, the verify scripts, the test strategy, and the subagent decomposition are the contract that produced the working app — they remain useful as a template for any v0.2 production plan. Active execution moves on; this entry stays mature.

## Open Questions

These are not blockers for Phase 1, but they will surface and need answers before they bite. The defaults below are what the autonomous session uses unless a stop-report surfaces a decision Loudon should make.

- **Multiple sessions visible at once.** v0.1 spec is "one persistent board, plus selectable sessions." If two sessions are running, do we show both as tabs, or pick one? Default for v0.1: dropdown selector, single session at a time, persistent board always visible underneath.
- **Time display.** Messages carry full ISO 8601 with timezone. Display as relative (`3m ago`) or absolute (`14:31:07Z`)? Default for v0.1: absolute, in the message metadata; relative on the agent roster.
- **What "agent_status: suspended_on_this_thread" actually means in the absence of an orchestrator.** Without the orchestrator running, this status is theoretical — it's whatever was true when the agent posted the request, frozen forever. The Trickster inbox should not pretend otherwise. v0.1 displays the status as posted; v0.2 (which has the orchestrator) will be live.
- **Color blindness / amber-mode skin.** The design system mentions an "amber CRT" alternate palette. Out of scope for v0.1 but easy to add later — single CSS variable swap.
- **Visual-validator confidence calibration.** The vision-capable subagent's pass/fail judgments may not match Loudon's eye on subtle calls (kerning, exact bloom intensity, what counts as "phosphor green"). The protocol treats its `pass` as authoritative within the build, but Loudon's smoke-test on `V0.1-COMPLETE.md` is the true acceptance gate. If consistent disagreement appears, the checklists should be tightened in v0.2.
- **Iteration budget calibration.** Ten attempts per failing check is a default, not load-bearing. If stop-reports cluster around the same kind of failure, the budget should be raised for that class — or the test reframed.
- **Build-log forensics.** `build-log.jsonl` accumulates every fix attempt across phases. After v0.1 ships, this file is itself a palace-worthy artifact: it documents the autonomous build's reasoning trace. Worth depositing as a session-archive entry alongside the implementation.

---

*"The aesthetic follows the architecture."* — [[BBS Design System]]

*"An agent is a document that occasionally becomes active. The board is a document the agents write together."* — extension of [[Palace Agent Infrastructure Spec]]
