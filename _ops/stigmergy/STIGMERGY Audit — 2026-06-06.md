# STIGMERGY Audit — 2026-06-06

**Scope:** the app (front-end + server), the orchestrator, and trickster-auto. (design-system excluded by request.)
**Lens:** structure & architecture + redundancy & dead code, framed by STIGMERGY's role inside The Palace.
**Deliverable:** findings + proposals only. No code changed. Commits, if any follow, are best run Mac-side (Cowork leaves stale git locks).

---

## 0. What STIGMERGY is, and what hardening must not break

STIGMERGY is the palace's **nervous system made visible**: one terminal with three time-ordered decks — STATE (present knowledge / entries), QUEUE (future intentions / open work), LOG (immutable past / commits). It folds three previously-scattered media — Obsidian authoring, the BBS blackboard, and git — into a single operational surface, and it makes the honesty discipline *structural* rather than remembered: nothing is real until it lands in LOG.

The coordination substrate underneath all of it is the **blackboard** (`blackboard.jsonl`) — an append-only, schema-strict (§2.2) stigmergic field. Stewards deposit pheromone (messages); the Trickster (human or automated) reads the gradient and responds; reconciliation closes QUEUE items when git proves the work happened. Everything in this codebase is, ultimately, *something writing to or reading from that field*.

Any refactor must preserve these load-bearing constraints (all confirmed in the design docs):

- **The §2.2 wire schema is sacred.** Protocol terms (`RESOURCE_REQUEST`, `blocking`, `payload`, the health block) stay exact because validators and agent code depend on them. "Speak like a person, log like a protocol" — human surfaces, exact wire.
- **Blackboard is append-only; git is ground truth.** One write path. Never `git add -A` (N-writer repo).
- **The BBS aesthetic and layout rules** (CSS-border CP437 weights, no character-cell ASCII rules, no login screen, viewport-fill with ~78ch only on message body) — these are already recorded as feedback and must survive untouched.
- **The three-deck time ordering is the reconciliation spine.** Do not reorganize by space instead of time.

The audit below is framed by one observation that ties almost every structural finding together: **in the palace, relations are primary — "edges carry more meaning than nodes."** STIGMERGY's most important edge is the §2.2 protocol shared by app, orchestrator, and trickster-auto. Yet that protocol currently has no home of its own. It lives *inside one node* (the app's server folder) and is reached into from the others. The headline recommendation makes the edge first-class.

---

## Session log (2026-06-06, Cowork)

Three items below were **executed and verified this session** against a green baseline of
1054 vitest tests (67 files): **Finding 8** (SSE replay bug — positional-replay fix +
2 regression tests, SSE suite 12/12), the **`gitAsync` dedup** (new `server/git-wrapper.js`;
git/commit suites 89/89), and the **phase-artifact archiving** (Finding 6). The large
structural work (§3 core extraction + workspace, §4 middleware decomposition) is specified
for a Mac-side Claude Code session in the companion `STIGMERGY Hardening — Claude Code
handoff — 2026-06-06.md` (clean multi-package `npm install` + real git checkpoints belong
there, not in the sandbox). Changes are in the working tree, **uncommitted** — review the
diff and commit Mac-side.

## 1. Headline findings (prioritized)

| # | Finding | Severity | Type |
|---|---------|----------|------|
| **1** | **Circular dependency across two npm packages.** `app/server/steward-lane.js` imports 4 modules from `orchestrator/`; `orchestrator/src/posting.js` imports the validator back from `app/server/validator.js`. The app and the orchestrator each depend on the other. | **Critical** | Structure |
| **2** | **The protocol substrate has no home.** The §2.2 validator, blackboard I/O, inbox-building, and option-parsing — the palace's shared coordination contract — are scattered and partially duplicated across all three projects. The validator lives in the app but is logically owned by no one. | **Critical** | Structure / Redundancy |
| **3** | **`server/middleware.js` is an 858-line megamodule** bundling ~14 orthogonal responsibilities (routing for 15+ endpoints, SSE lifecycle, file I/O, worker creation as a side effect, git, validation, cards, verdicts). | **High** | Structure |
| **4** | **Three separate npm projects, ~291 MB of node_modules, overlapping deps, no shared package.** No workspace/monorepo wiring; cross-project imports reach across sibling directories by relative path. | **High** | Structure / Redundancy |
| **5** | **Duplicated coordination logic:** JSONL append/read exists sync (orchestrator) *and* async-queued (app); `buildInbox()` is implemented twice with the same core algorithm; option-normalization regex/logic is an explicitly-documented copy between `trickster-auto/parse.js` and `app/lib/inbox.js`. | **Medium** | Redundancy |
| **6** | **Phase-artifact clutter.** ~12 `V1.0-PHASE-*-COMPLETE.md` / `*-COMPLETE.md` docs in `app/`, plus `tests/checklists/` carrying the same phase at v0.2 / v0.3 / v1.0. Navigation noise, not a functional defect. | **Low** | Hygiene |
| **7** | **Prop-drilling in `App.jsx`** for cross-deck state (`openEntryInState`, `jumpTarget`, `activeBoard`, `agentFilter`). Acceptable at 5 decks; will bite if decks grow. | **Low** | Structure |
| **8** | **SSE reconnect replay drops messages** (`bug-sse-reconnect-replay.md`). The Last-Event-ID branch in `setupSseStream` compares message ids **lexicographically**, but palace ids are per-steward namespaced, not globally monotonic — so a genuinely-newer message from a different steward is silently skipped from the live feed until a full reload. | **Medium** | Correctness |

Findings 1, 2, 4, and 5 are **one problem wearing four hats.** They all dissolve with the same move. That move is §3.

What is **correctly designed and should not be touched**: the YAML emit/parse pair (round-trip tested), the commit-parse / commit-spec analytic-vs-synthetic split, the strict-server / lenient-client validator divergence, the single enforced blackboard write path, and the documented defensive "scars" in `actuator.js` / `steward-lane.js` / `commit.js`. See §6.

---

## 2. The structural core: a dependency knot, not a pile of bugs

The code quality is good. The layering *within* each project is sound (server → lib → component; helpers stay deterministic). The problem is **where the boundaries between projects are drawn**, and it's a knot:

```
        ┌─────────────────────────────────────────────┐
        │                                             │
        ▼                                             │
   ┌─────────┐   steward-lane imports                  │
   │   APP   │ ──build-cycle-prompt, process-cycle,──▶ ┌──────────────┐
   │ (server)│   registry, append                      │ ORCHESTRATOR │
   │         │ ◀──posting.js imports validator───────  │              │
   └─────────┘                                          └──────────────┘
        ▲                                                     │
        │                                                     │ append, posting
        │ validator (§2.2)                                    ▼
        │                                              ┌──────────────┐
        └──────────────────────────────────────────── │ TRICKSTER-   │
                                                        │ AUTO         │
                                                        └──────────────┘
```

- **app → orchestrator:** `steward-lane.js` pulls `buildCyclePrompt`, `processCycle`, `reconcilePendingRequests`, `readRegistry`, `readJsonl`.
- **orchestrator → app:** `posting.js` pulls `validateMessage` from `app/server/validator.js`.
- **trickster-auto → orchestrator:** `board.js` and `decide.js` pull `readJsonl`, `appendMessage`, `validateForPosting`.

So the *helper* layer (orchestrator) reaches **backward** into the *web server* (app) for the protocol's ground truth, while the web server reaches **forward** into the helper for steward orchestration. Two separate packages with separate `node_modules` are mutually entangled by relative-path imports across sibling folders. This is fragile in exactly the way that matters here: change the append signature or the validator shape and two-or-three projects break silently, with no shared test surface and no package boundary to catch it.

This is the palace lesson in software form. The shared contract — the §2.2 protocol — is the most important *edge* in the system, and right now it's buried inside a *node*.

---

## 3. Primary recommendation — extract the substrate (`stigmergy-core`)

**Create one shared package that owns the coordination contract, and make all three projects depend on it — never on each other.**

This is the palace's own architecture applied to its own tooling: the blackboard is the substrate; the protocol is the substrate's grammar; the substrate is foundational and everything else drifts on top of it. Give it a node of its own so the edges can be clean.

Proposed package: `_ops/stigmergy/core/` (npm name `@stigmergy/core`), owning exactly the things all three already share:

- **`schema/`** — the §2.2 message shape, enums, the strict `validateMessage` (moved out of `app/server/validator.js`), and `validateForPosting` posting discipline (moved out of `orchestrator/posting.js`). One source of truth for the wire.
- **`blackboard/`** — a *single* JSONL module: read (`readJsonl`) + atomic async-queued append (`appendMessage`). Keep the app's promise-queue serialization — it is the safest of the two — and delete the orchestrator's sync variant and the app's separate copy. Everything writes through this.
- **`inbox/`** — one `buildInbox()` returning a rich shape, with the UI's enrichment (leans, catchup, artifacts) as an *optional* second-stage decorator the app applies. Trickster-auto consumes the plain build; the app consumes build + decorate. The core *algorithm* (scan GRANT/DENY → answered set → filter unanswered REQUESTs) lives once.
- **`request-parse/`** — option normalization + `LENIENT_ID` regex + recommendation matching, exported once. Deletes the documented "MIRRORS…" copy in `trickster-auto/parse.js`. (The comment itself is the smell admitting it.)
- **`commit-spec/` + `commit-parse/`** — already cleanly split and shared by server and components; relocate here so they stop being imported across the app's internal server/lib seam by external consumers.

**Resulting dependency graph (acyclic):**

```
                 ┌────────────────┐
                 │ @stigmergy/core│  ← schema, blackboard, inbox, parse, commit
                 └───────┬────────┘
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
    ┌───────┐      ┌──────────────┐  ┌──────────────┐
    │  APP  │      │ ORCHESTRATOR │  │ TRICKSTER-   │
    └───────┘      └──────────────┘  │ AUTO         │
        │                            └──────────────┘
        └── steward dispatch: app calls orchestrator's
            *cycle* helpers only (build-cycle-prompt,
            process-cycle, registry) — a one-way edge,
            no longer a cycle, because the protocol no
            longer round-trips through the app.
```

The circular edge (Finding 1) is cut because the validator no longer lives in the app. The scattered-substrate problem (2) is solved by definition. The triplication (5) collapses to single implementations. And it sets up the cleanup in §4.

**Wire it as an npm workspace.** Add a top-level `_ops/stigmergy/package.json` with `workspaces: ["core", "app", "orchestrator", "trickster-auto"]`. One `npm install` hoists shared deps (currently ~291 MB across three duplicated `node_modules`), gives real package boundaries instead of `../../` relative reaches, and lets `core` be imported as `@stigmergy/core` everywhere. This is the lowest-ceremony way to make the boundaries enforceable.

**Effort / risk.** Mechanical and well-tested-against: every moved module already has unit tests. Do it as a pure *move + re-point imports* with no behavior change, run the existing 700+ vitest + e2e suite as the safety net, in one focused session. Risk is low precisely because nothing's logic changes — only its address.

---

## 4. Secondary recommendation — dissolve `middleware.js` (Finding 3)

`server/middleware.js` (858 lines) is the app's single biggest structural risk: 15+ inline endpoint handlers plus SSE lifecycle, file I/O, request parsing, content-type table, path-traversal guards, git reads, card I/O, verdict I/O, *and* the creation of two long-lived workers (`actuator`, `stewardLane`) as a side effect of the Vite-plugin factory (which is why every test has to inject `opts.actuator`/`opts.stewardLane` to avoid spawning real workers).

It is not buggy — it's over-consolidated. Disentangle into:

- `server/api/` — one module per endpoint family: `persistent.js`, `entries.js`, `log.js`, `worker.js`, `stewards.js`, `cards.js`, `digest.js`. Each is a small, testable handler set.
- `server/sse.js` — the stream lifecycle (`setupSseStream`), currently orthogonal but trapped inside the factory.
- `server/workers.js` — explicit construction of `actuator` + `stewardLane`, `require`d by middleware so the dependency is visible and tests stop fighting side effects.
- `server/router.js` — a small method+path dispatch table, reducing `middleware.js` to a ~150-line factory + dispatch.

Fold in the trivial duplicate while you're there: `gitAsync` is copied (~10 lines) in `git.js` and `commit.js` — extract to `server/git-wrapper.js`.

This is a v1.1 candidate: valuable, but not blocking the remaining v1.0 work (Topology Lens, reconciliation, armed writes) as long as the suite stays green.

---

## 4b. The SSE replay bug is the first slice of the middleware split (Finding 8)

`bug-sse-reconnect-replay.md` is a textbook case for *why* `middleware.js` should be decomposed — and it makes the fix concrete. The defect lives in `setupSseStream`'s Last-Event-ID replay branch (~line 275), which decides "is this message newer than the client's cursor?" with `msg.id > lastEventId` — a **string comparison**. That is only correct if ids are globally monotonic, but palace ids are per-steward sequences (`crystal-synth-steward-014`, `waveguide-synthesizer-steward-005`). After a silent `EventSource` reconnect (sleep/wake, network blip), any message whose id sorts lexicographically *before* the last-seen id is skipped from replay **and** marked `seen`, so the steady-state watcher never re-emits it either. Symptom: a steward's next `RESOURCE_REQUEST` intermittently fails to appear in the Trickster inbox until `[R] RELOAD`. On-disk state is always correct — this is a live-delivery gap only.

The fix the report proposes is sound and minimal: replace lexicographic comparison with **positional** replay — find the index of the message whose `id === lastEventId` and emit everything after it by file order (true append/time order); if the id isn't found, emit all (the client's `mergeLive` dedupes by id, so over-replay is harmless, under-replay is the bug). No wire change, no monotonic-id assumption. A paste-ready failing regression test is included in the bug report.

This is exactly the `setupSseStream` logic §4 recommends lifting into `server/sse.js`. So the bug fix and the structural fix are the same motion at two sizes: **fix the replay logic and extract it into `sse.js` in one pass, with the regression test as the proof.** Doing the fix this way turns a medium correctness bug into the first, lowest-risk increment of the middleware decomposition — a clean place to start hardening rather than a detour from it. (The bug report's own adjacent notes — mixed `ts` offset-vs-`Z` formats in `mergeLive` sort keys, and the `emitMessage` empty-id fallback — are worth normalizing in the same touch but are cosmetic, not the defect.)

## 5. Cleanup — phase artifacts and checklist clutter (Findings 6, 7)

- **Archive the COMPLETE docs.** `app/` carries ~12 `V1.0-PHASE-*-COMPLETE.md` / `V0.x-COMPLETE.md` / `WEAVE-FLAG-V1.0-COMPLETE.md` / `ALIGNMENT-REVIEW-COMPLETE.md` files in the project root. They're valuable history but they're clutter at the working root. Move them to `app/Archive/phases/` (an `Archive/` sibling already exists at `_ops/stigmergy/Archive/`). Keep only the live `v1.0-next-handoff.md` and `README.md` at the working surface.
- **Prune checklist versions.** `tests/checklists/` has the same phase at multiple versions (`phase-5.md` *and* `phase-5-v0.2.md`, etc.). Keep the live v1.0 checklists; archive phases 1–9.
- **Prop-drilling (low):** leave `App.jsx`'s union-state-at-the-hub pattern as-is for now; it's justified at 5 decks. If Topology Lens or philosophy lenses add cross-deck talk, introduce a single `DeckContext` rather than more props. Note it; don't act yet.
- **Not dead code (corrected):** `orchestrator/src/two-paths-merge.js` is exercised by `orchestrator/tests/unit/two-paths-merge.test.js` and referenced in `app/src/lib/demo-data.js` — it is Stage-F-Phase-4 logic not yet wired to a runtime script. Leave it. The `scripts/smoke-*.js` are intentionally-kept historical smoke tests per the README; leave them too.

---

## 6. What is correct and must be left alone

Hardening is as much about *not* churning good code. These are well-factored and should survive any refactor unchanged:

- **YAML emit/parse pair** (`yaml-emit.js` + `yaml-frontmatter.js`) — pure, round-trip tested, no duplication. Move into core's orbit only if entry-editing logic migrates; otherwise leave.
- **commit-parse vs commit-spec** — correct analytic (read existing commits) vs synthetic (derive new trailers) split.
- **Strict server validator vs lenient client `schema.js`** — intentional: server gates writes, client gives feedback. (This *informs* the core extraction: move the strict validator to core; the lenient render-side `schema.js` stays in the app.)
- **Single enforced blackboard write path** — already honored in code; the core extraction strengthens it.
- **The documented "scars"** in `actuator.js` (bypassPermissions load-bearing; existence ≠ liveness; exit cleanup; single global worker per lane), `steward-lane.js`, and `commit.js` (never `git add -A`; clear stale Cowork locks first) — these are hard-won defensive patterns. Preserve verbatim.
- **All locked design/aesthetic constraints** from §0.

---

## 7. Recommended sequence

1. **Extract `@stigmergy/core` + add the npm workspace** (§3). Pure move, tests as net, one session. Cuts the circular dependency, unifies the substrate, kills the triplication, shrinks `node_modules`. *Highest leverage; do first.*
2. **Archive phase/checklist clutter** (§5). Trivial, immediate signal-to-noise win; can ride along with step 1's commit.
3. **Confirm or cover `two-paths-merge.js`** (§5) — one quick check.
4. **Fix the SSE replay bug + extract `sse.js`** (§4b). Small, test-backed, single-pass; doubles as the first slice of the middleware split. A good *immediate* hardening win — can be done before or independently of step 1.
5. **Dissolve the rest of `middleware.js`** (§4). v1.1; schedule after the next visible v1.0 win (Topology Lens) lands so it doesn't stall feature momentum.
6. **Hold** prop-drilling refactor until a deck actually forces it.

None of this blocks the in-flight v1.0 roadmap (Phase 5.5 Topology Lens, Phase 6 reconciliation, Stage B armed writes). Step 1 in fact *de-risks* them: armed writes and reconciliation both lean hard on the validator and blackboard I/O, and they should be leaning on a single owned `core`, not on a validator that currently lives three folders deep inside the very app that's about to start writing to the working tree.

---

## Appendix — evidence

- Circular import, verified: `app/server/steward-lane.js` → `orchestrator/src/{build-cycle-prompt,process-cycle,registry,append}.js`; `orchestrator/src/posting.js:16` → `app/server/validator.js`.
- Two append implementations, both 58 lines: `app/server/append.js` (async promise-queue) and `orchestrator/src/append.js` (sync). trickster-auto reaches into the orchestrator's for both read and write.
- Documented intentional mirror: `trickster-auto/src/parse.js:19–20` — "Canonical lenient-id regex — MIRRORS _ops/stigmergy/app/src/lib/inbox.js (the single source of truth…)."
- `middleware.js` = 858 lines (largest server file); `DigestPanel.jsx` = 590, `EntryBody.jsx` = 492, `QueueItem.jsx` = 454, `App.jsx` = 403.
- node_modules: app 228 MB, orchestrator 37 MB, trickster-auto 26 MB (~291 MB total), three separate installs.
- LOC (excl. node_modules/dist): app ~35K (incl. tests), orchestrator ~6.3K, trickster-auto ~2.5K.

*Loudon Live · Autodidact Polymaths*
