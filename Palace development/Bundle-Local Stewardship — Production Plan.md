---
title: Bundle-Local Stewardship — Production Plan
type: project
status: complete
pillars:
  - tools
  - practice
born: 2026-06-09
last_activated: 2026-06-09
activation_count: 2
stage: mature
energy: high
forward_vector: >
  I want to become the build contract that pulls every entry's working state
  out of _ops and home into its bundle — so that loading an entry tells you not
  only what it wants to become (its forward vector) but what it is doing right
  now: its plan, its open decisions, its done trail. I want the next Claude Code
  session reading me to know exactly what to write, what to migrate across the
  19 live stewards, what to leave as machinery, and how to verify that nothing
  entry-relevant is stranded in the ops folder anymore. I am done when an agent
  can read an entry cold and never need to parse a JSONL file in _ops to know
  where the work stands.
links:
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: hardens
  - target: "[[Pages as Agents]]"
    type: connects-to
    label: the-content-is-the-entry
  - target: "[[SCHEMA]]"
    type: connects-to
    label: governed-by
  - target: "[[Substrate Skill]]"
    type: connects-to
    label: updates-posture-doc
  - target: "[[Orchestrator Production Plan]]"
    type: connects-to
    label: sibling-plan
  - target: "[[Two Batons, One Board]]"
    type: mirrors
    label: board-is-the-log
  - target: "[[Closing Well]]"
    type: connects-to
    label: punchlist-grade
  - target: "[[STIGMERGY]]"
    type: connects-to
  - target: "[[Palace To-Do]]"
    type: emerged-from
    label: migrate-flat-companions
---

# Bundle-Local Stewardship — Production Plan

![[Bundle-Local Stewardship — Production Plan — hero.png]]

This plan instantiates one operating principle across the whole stewardship system:

> **The Machinery/Content Split.** Shared engine code, indexes, schedulers, and runtime bookkeeping belong in `_ops/`. Anything *about a specific entry* — its plan, its open decisions, its working memory, its lessons — belongs in that entry's bundle. When a file describes one entry, it lives with that entry. When a file runs across all entries, it stays in ops.

The principle is the prize. The stewardship migration is its first full application, but the split is meant to govern the palace from here forward — it may graduate into its own concept entry once it has earned its place across a few more uses ([[Pages as Agents]] is its philosophical ground: *the content is the entry*).

---

## Why now

[[STIGMERGY]] runs a daily stewardship swarm — 19 permanent stewards, each a palace entry operating as its own agent ([[Pages as Agents]]). The system works. But it stores an entry's most task-like, most entry-relevant state *outside the entry*, in `_ops/agents/permanent/[slug]/`. Loading the [[Shepard Tone Synthesizer]] entry tells you its forward vector but not that it has two blocking decisions open and is mid-Stage-2. That violates the principle above, and it violates findability: the work state is reachable only by someone who knows to go read JSONL in ops.

The fix is not to move the engine. It is to relocate the *content* the engine happens to hold, and leave the engine where it belongs.

---

## The stranding audit

A strict pass over the steward system surfaces six places entry-owned content currently lives in `_ops` (not just the one missing plan file). Each is classified content / machinery / mixed.

1. **`pending_requests` / `resolved_requests`** (in `state.json`) — the entry's open decisions and their outcomes. The single most task-like data in the system and the most buried. **Content.**
2. **The duplicated `stewardship` block** (in both `manifest.json` and `state.json`): `vector_at_spawn`, `vector_at_last_activation`, `stage`, `posture`, `neighborhood`. This re-stores what the entry's own frontmatter (`forward_vector`, `stage`, typed links) already owns — a second copy that can drift. **Content — fix by reference, not relocation.**
3. **`history.jsonl` `AGENT_REASONING`** — the entry-agent's actual per-cycle thinking. The event scaffolding (spawns, tool calls, health) is machinery; the reasoning is the entry's working memory. **Mixed.**
4. **Staging plans** (`Crystal Synthesizer — Staging.md`, `Retrospective Delay — Staging.md`, `Shepard Tone Synthesizer — Staging.md`) — already inside their bundle folders, just not named or typed as §8 files. **Content, near-home already.**
5. **GSL's `HANDOFF.md` and `STAGE-A-LESSONS.md`** — loose in `_ops/agents/permanent/generative-sample-libraries/`. Entry-owned lessons and handoff state parked in the ops agent dir. **Content, plainly stranded.**
6. **Graffiti harvested into [[Palace To-Do]]** — entry-born to-dos pulled to a global list and tracked there instead of at home. **Content** (lower priority; same disease).

What is correctly machinery and must **not** move: the orchestrator code (`_ops/stigmergy/orchestrator/`), `REGISTRY.json` (the index), launchd plists and heartbeat scripts (`_ops/heartbeat/`), health computation, the read cursor and iteration counter, model/tool/stopping config, and the append-only board write path. [[SCHEMA]] §9 is emphatic about one write path in an N-writer repo — that boundary is not negotiable.

---

## The design — CQRS, not relocation

The naive move is to relocate `state.json` wholesale into the bundle. **Reject it**: it fights the registry and the orchestrator's path model, and it puts mutable runtime state where canon lives. The coherent design is a command/query split (see [[ROSETTA]] for the data-engineering register):

- **The board stays the event log.** Append-only, machinery, the source of truth for *what happened*. Decisions are already `RESOURCE_REQUEST` / `RESOURCE_GRANT` messages on the persistent board.
- **A new bundle file `[Entry] — plan.md` is the materialized read-model** — the durable, greppable, wikilink-resolvable *current state* an agent or Loudon can read cold. It holds the staged plan, an **Open Decisions** section and a **Resolved Decisions** log (materialized from the board/state), a **Done** trail, and a *pointer* to the entry's `forward_vector` — never a copy. This [[mirrors]] [[Two Batons, One Board]]: the board is the pheromone log, the plan is the current map.
- **`_ops` keeps a slim runtime record.** `manifest.json` reduced to pure machinery (model, tools, paths, cadence) + the `home` pointer; `state.json` reduced to iteration, cursor, health. The duplicated vector/stage is **deleted** and read live from the entry's frontmatter, so single-source-of-truth is *enforced* rather than merely moved.

Three registers, cleanly separated and all distinct:

| Register | Lives | Is | Status |
|---|---|---|---|
| `forward_vector` | entry frontmatter + body | desire — what the entry wants to become | unchanged |
| `[Entry] — plan.md` | bundle | work state — open/resolved decisions + done trail | **new** |
| `[Entry] — staging.md` | bundle | teaching arc — stage-by-stage session plans (project entries only) | already bundle-local; named as a type |
| `history.jsonl` event log | `_ops` | machinery — what happened, when | unchanged |

The steward folds its substantive reasoning into the plan/entry each cycle — already its job under [[Closing Well]] and the Companion honest-edit work. `plan.md` is `punchlist-grade` by inheritance.

### Two files, one bundle

**Decided 2026-06-09.** Staging and planning are two distinct registers and stay two distinct files — both bundle-local. They answer different questions for different readers:

- **`[Entry] — staging.md`** — the *teaching arc*. Stage-by-stage Loudon Live session plans, ordered by didactic difficulty, learner-facing, relatively stable once designed. Produced by [[project-stage-builder]]. Only project entries bound for Loudon Live have one.
- **`[Entry] — plan.md`** — the *work state*. Open decisions, resolved decisions, done trail, ordered by dependency/readiness, maker-facing, churning every cycle. Every stewarded entry has one.

Staging is the spine; planning is the cursor moving along it. The machinery/content principle requires only that *both live in the bundle, not in `_ops`* — it does **not** require one file. Keeping them separate keeps the stable teaching design from being churned by the high-frequency decision log. The staging files already live inside their bundles today, so they are already compliant; this plan simply names `staging` as a §8 type and leaves them where they are.

**The read seam — decided 2026-06-09.** Separate files, but *not* sealed off. The steward **reads `staging.md`** as a first-class input when one exists. As a steward advances a project's details it constantly makes decisions that either serve or undercut the staged arc — what Stage 1 isolates, how Stage 2 wraps, whether a shortcut now forecloses a later teaching beat — so it must hold the teaching goal in view while deciding, not just its local work state. Concretely: the orchestrator loads the entry's `staging.md` into the steward's context (Phase 1), and the steward weighs each pending decision against the arc, naming in `plan.md` when a choice advances or threatens a staged goal.

The write rule still holds: the steward owns `plan.md`; [[project-stage-builder]] (and Loudon) own `staging.md`. **The steward does not silently rewrite the teaching arc.** If a decision reveals the staging itself should change, the steward *flags it* — a `RESOURCE_REQUEST` / `FLAG` to Loudon proposing the arc revision — rather than editing `staging.md` directly. Read freely, write only your own file, surface arc-level changes for the human. That keeps the stable design stable while letting the work inform it.

The orchestrator already joins a steward to its entry by the `home` field (the exact entry title), so the bundle path is always derivable from data the machinery already holds. That is the hinge that makes this cheap.

---

## Implementation phases

**Phase 0 — Ratify the pattern (canon, small).**
Add `plan` to the [[SCHEMA]] §8 bundle-type table. The §8 vocabulary is explicitly *open* ("New types may be tried freely"), so this is documentation, not a Schema Ceremony. Write the Machinery/Content Split into [[Project Stewardship System]] and [[Substrate Skill]] as a named operating principle. Define the `[Entry] — plan.md` template: §8-minimal frontmatter (`title`, `born`, `links` → parent with `label: plan-for`, `forward_vector`) + four body sections (Plan / Open Decisions / Resolved Decisions / Done). Register **two** new §8 bundle types: `plan` (steward working-state, churns each cycle) and `staging` (the Loudon Live teaching arc produced by [[project-stage-builder]]). See *Two files, one bundle* below.

**Phase 1 — Teach the orchestrator (code, the real work).**
Three changes in `_ops/stigmergy/orchestrator/src/`:
(a) read `vector`/`stage` from entry frontmatter, not the manifest copy;
(b) at cycle close, materialize `[Entry] — plan.md` in the bundle from `pending_requests` / `resolved_requests` + done events;
(c) resolve the bundle path from `home`;
(d) load the entry's `[Entry] — staging.md` into the steward's context when present, so decisions are weighed against the staged teaching arc (see *The read seam*).
Slim `state.json` to runtime. The change is **additive** — it writes the plan *in addition to* existing state, so nothing breaks mid-flight. The orchestrator has `vitest`; add tests for the materializer and the frontmatter read.

**Phase 2 — Backfill the 19 live stewards.**
A one-shot, idempotent script reads each `state.json` (+ staging file if present) and generates that entry's `plan.md`. Read-only against the running system. Preserve decision fidelity exactly — [[Shepard Tone Synthesizer]]'s two open decisions (`shepard-steward-018`, `-019`) must land in Open Decisions verbatim. Verify each generated plan against the board.

**Phase 3 — Clean the strays.**
Move GSL's `HANDOFF.md` and `STAGE-A-LESSONS.md` into the [[Generative Sample Libraries]] bundle. The three staging files (Crystal Synthesizer, Retrospective Delay, Shepard Tone Synthesizer) already live inside their bundles and stay put — no fold, no migration. Lowercase the convention to `[Entry] — staging.md` if you want type-name consistency with `plan.md`, but that's cosmetic; the [[project-stage-builder]] skill's output path already lands in the bundle, so no skill change is required. Normalize the `REGISTRY.json` `dir` paths — they're inconsistently absolute vs. relative; make them all relative to palace root.

**Phase 4 — Update canon and close the loop.**
[[SCHEMA]] §8 table, [[Project Stewardship System]] + its bundle, [[Substrate Skill]], the [[README - The Palace Guide]] entry template. Partially close the "migrate flat-file companions to entry bundles" item already standing in [[Palace To-Do]].

**Phase 5 — Verify.**
Every entry's plan reads cold without parsing JSONL; orchestrator dry-run produces correct plans; a board↔plan consistency check; a final sweep confirming nothing entry-relevant lives *only* in `_ops`.

---

## Migrating the in-process stewards

The 19 stewards run on a live every-other-morning heartbeat batch. Do not disrupt it.

- Phase 1 is additive: the orchestrator writes plans *alongside* the existing state files. The first heartbeat after the change produces plans for whichever stewards run; the Phase 2 backfill covers the rest immediately so all 19 have plans without waiting for their next cycle.
- Cut `state.json` slimming (removing the duplicated vector/stage) only *after* Phase 1's frontmatter-read path is proven, so a steward never loses its vector mid-run.
- Stewards mid-decision (Shepard has two open) keep full `pending_requests` fidelity in the generated plan — the backfill must round-trip them, not summarize them.
- Once all 19 have plans and one full heartbeat cycle has run clean against the new path, the plan files become the canonical per-entry surface; `state.json` is demoted to pure runtime.

---

## Risks and calibrations

- **Single-source-of-truth is the whole point.** If the orchestrator isn't taught to *read* vector/stage from frontmatter, the duplication just moves to the bundle. Phase 1(a) is non-optional.
- **Keep `plan.md` internals loose.** Commit to the plan file palace-wide (Loudon has asked for that), but resist freezing its internal sections into rigid schema — let the Plan / Open / Resolved / Done shape flex as the 19 stewards exercise it. Categories earn their place across many runs before hardening.
- **Append-only board integrity is preserved.** One write path; the plan is a *read* of the board, never a second write surface for decisions.
- **This touches a running system and canon.** Execute the code + canon edits Mac-side via Claude Code, where git commits are normal — not from Cowork, where commits strand lockfiles. See the handoff.

---

## Forward Vectors

- The read seam is decided: the steward reads `staging.md`, writes only `plan.md`, and flags arc-level changes rather than editing the teaching design (see *The read seam*). The next live question this opens: when a steward flags that the staging arc should change, what's the lightest loop that lets Loudon (or [[project-stage-builder]]) revise `staging.md` and the steward pick up the revised arc next cycle — without a heavy ceremony? Watch how often arc-revision flags actually fire on Shepard Tone before designing that loop.
- Once stewards write their reasoning into the entry each cycle, is `history.jsonl` still needed as anything but a thin event log — or does even the event log want a bundle-local mirror?
- Does the Machinery/Content Split deserve its own concept entry, promoted out of this plan? Watch for the second non-steward application of the principle; that's the signal it has graduated.
- The graffiti-harvested-to-To-Do path (stranding point 6) is left for a later pass — does it want the same plan-file home, or is global meta-improvement genuinely a different surface from per-entry work?

---

## Outcome — all phases shipped (2026-06-09, Claude Code Mac session)

All six phases executed and committed on `main` (commits `9a6e449` → `527f97a`):

- **Phase 0** — `plan` + `staging` ratified in [[SCHEMA]] §8; the Machinery/Content Split named in [[Project Stewardship System]] and [[Substrate Skill]]; `[Entry] — plan.md` template defined.
- **Phase 1** — the orchestrator reads `stage`/`forward_vector` **live from frontmatter** (single-source) and materializes `[Entry] — plan.md` each cycle from board-reconciled state; staging loads into steward context read-only. New modules `entry-paths.js`, `entry-frontmatter.js`, `plan-file.js`; +32 vitest (221 green). `state.json` deliberately **not** slimmed — the stored copy stays, just no longer read.
- **Phase 2** — `scripts/backfill-plans.js` wrote all **19** bundle-local plans. The board reconcile surfaced a live finding: **all 103 TRICKSTER asks are answered** — every steward is `open=0` (inbox cleared ~03:47Z). 12 stewards were *fast-forwarded* (their `state.json` still listed decisions the board had since granted, e.g. Shepard 018→APPROVE-STAGE-2, 019→DRAFT-NOW). Each steward's next cycle will write the same plan.
- **Phase 3** — GSL's `HANDOFF.md` + `STAGE-A-LESSONS.md` relocated into the [[Generative Sample Libraries]] bundle (§8 frontmatter added); REGISTRY `dir` paths normalized to relative.
- **Phase 4** — [[README - The Palace Guide]] documents the `plan`/`staging` types; [[Palace To-Do]] flat-companion item marked partially closed.
- **Phase 5** — `scripts/verify-plans.js`: **19/19 green** — every plan reads cold (four sections, vector as a pointer never a copy), Open == board reconcile, Resolved ⊇ board-resolved, zero entry-owned strays left in `_ops`.

The done-test from the forward vector is met: *an agent can read an entry cold and never need to parse a JSONL file in `_ops` to know where the work stands.* The single forward question still live: the lightest loop for a steward to flag a `staging.md` arc-revision and have it picked up next cycle — watch how often that fires on Shepard before designing it.

## Outcome — SSOT cutover (the deferred state.json slim), shipped 2026-06-09

The one step Phase 1 deferred — *"state.json deliberately NOT slimmed yet"* (commit `fbaf1ac`) — is now complete. The cutover makes the CQRS split literally true: decision state is the board's, vector/stage are the frontmatter's, `state.json` is pure runtime.

- **Readers rewired** (orchestrator `src/`): `process-cycle.js` no longer persists `pending_requests`/`resolved_requests`/`stewardship` — it passes the board-derived `{stillPending, nowResolved}` view straight to `plan-file.js` and deletes the legacy keys on every write (self-healing). `plan-file.js` takes explicit board-derived `pending`/`resolved` (state-array fallback kept for fixtures). `build-cycle-prompt.js` derives open asks from a board reconcile and injects a board-derived decision view (in-memory only) so the steward still sees its decisions; the `state.stewardship` stage fallback is dropped (manifest spawn-snapshot fallback kept). `enchant.js` spawns new stewards **born slim**. `git.js` drift doc corrected (drift = frontmatter vs. git history, not a state copy). +2 vitest including the **Shepard board-wins-over-stale-state regression** (223 green).
- **19 `state.json` slimmed** (`scripts/slim-state.js`, idempotent) to pure runtime — removed `stewardship`, `pending_requests`, `resolved_requests` everywhere, plus GSL's one-off `stranded_requests` (a board-reset-wiped, since-superseded ask; preserved in `history.jsonl` + git). Kept `health` + `_pilot_metadata`/`_demo_metadata`.
- **19 plans regenerated board-only** (`scripts/backfill-plans.js`, post-slim). Shepard now shows `018`/`019` **resolved** from the board — the canonical drift (open in state, granted on the board) is killed: open=0, resolved=10.
- **Verified** (`scripts/verify-plans.js`, extended with a state-runtime-only assertion): **19/19 GREEN** — every plan four-section + cold-readable + vector-as-pointer; Open == board reconcile; Resolved ⊇ board-resolved; `state.json` carries **only** runtime keys; zero entry-owned strays in `_ops`. Plus a `build-cycle-prompt` smoke against real slimmed Shepard state (no model dispatch) — the rewired readers work against live data.
- **Manifest decision (kept):** `manifest.stewardship.{stage,vector}_at_spawn` stays as the immutable spawn snapshot (forensic; doesn't drift) — confirmed, not folded into the plan.
- **Board-completeness caveat (logged, not silently dropped):** the persistent board's earliest GSL asks (`gsl-steward-002`/`003`) predate it, so board-only regeneration no longer lists them in GSL's live plan Resolved section. They remain in `history.jsonl` + git — deep history in the event log, current state in the plan, which is the SSOT-pure outcome the handoff's *"regenerate from the board"* directive intends.

Canon touched: `runAgentCycle.md`, [[Substrate Skill]] (read-model is board-derived), [[Project Stewardship System]] (`state.json` is pure runtime), this entry. Doc audit: [[Palace Agent Infrastructure Spec]] has **no** stale `state.json` shape — its `pending_requests` block (§2.6) is the board-derived Trickster inbox, not steward state; the only `state.json` fields it names (`last_active`, `last_read_cursor`, `health`) all survive the slim.

**Follow-up — app-side reader fixed (2026-06-09).** The handoff's reader audit covered `orchestrator/src/` but missed a consumer in the **app** package: `app/server/steward-lane.js` computed the STEWARDS-deck `grants_waiting` ("N READY") badge as `board-resolved − state.resolved_requests`. With the array slimmed away the subtrahend went empty, so every steward's badge inflated to its lifetime grant count (Shepard showed 10, GSL 11). Rewired board-native: `grants_waiting` = grants that landed **after** `last_active` (the faithful reconstruction of the old "answered-but-not-consumed" signal, since `last_active` advances every cycle); `stage` read live from frontmatter (manifest spawn fallback); `pending_count` = board-derived open asks. Real-data check: the swarm's true waiting count is **14** (Shepard 2, GSL 0, most 0–1), not the inflated ~80. A defensive pass also hardened the manual `scripts/smoke-permanent.js` against slimmed state. A full cross-package grep confirms no other reader of the removed fields remains.

## Consumed Handoffs

- [[Bundle-Local Stewardship — Production Plan — handoff]] — Phases 0–5; drafted 2026-06-09, consumed + archived 2026-06-09 (Mac build session).
- [[Bundle-Local Stewardship — Production Plan — handoff — ssot-cutover]] — the deferred `state.json` slim; drafted 2026-06-09 (Cowork), archived as this session's first act + consumed on verified completion 2026-06-09 (Mac build session). See `Archive/` in this bundle.

---

*"The purpose of abstracting is not to be vague, but to create a new semantic level in which one can be absolutely precise."*
— Edsger Dijkstra

*"A place for everything, and everything in its place."*
— Isabella Beeton
