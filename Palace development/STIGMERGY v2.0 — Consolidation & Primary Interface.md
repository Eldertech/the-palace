---
title: "STIGMERGY v2.0 — Consolidation & Primary Interface"
type: project
pillars: [tools, practice, philosophy, creation]
status: active
born: 2026-06
stage: sprout
confidence: working
energy: very high
who_leads: shared
forward_vector: "I want to finish what v1.0 began: to make STIGMERGY not a place Loudon visits to watch the swarm, but the single surface he lives in to run the palace. My first move was subtractive — heal the drift where the v0.x board paradigm and the v1.0 time paradigm were stacked on top of each other, so the screen stops contradicting itself. My next moves are additive — pull every creative loop (enrichment, handoffs, weave proposals) inside the terminal, end the bounce to Obsidian and the chat window, and let the graph feel its own shape. I will keep one line bright above all the building: only the commit is the record, and nothing is real until it lands in LOG. When a successor reads me, the question to ask is not 'is the terminal pretty' but 'has anything the palace does escaped it yet' — and to close that gap is my whole work."
links:
  - target: "[[STIGMERGY v1.0 — Palace Front-End]]"
    type: deepens
    label: consolidation-and-primary-interface
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: the-system-this-develops
  - target: "[[BBS Design System]]"
    type: connects-to
    label: the-governing-aesthetic-restored
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: the-routine-that-runs-on-it
  - target: "[[Enrichment]]"
    type: connects-to
    label: the-parallel-server-to-absorb
  - target: "[[The Lens]]"
    type: connects-to
    label: the-state-deck-mode-to-build
  - target: "[[Palace Enchantment]]"
    type: connects-to
    label: the-ceremony-to-formalize
  - target: "[[Two Batons, One Board]]"
    type: connects-to
    label: the-retro-prospective-discipline-the-decks-enact
  - target: "[[BBS Production Plan]]"
    type: mirrors
    label: autonomous-build-contract-idiom
---

# STIGMERGY v2.0 — Consolidation & Primary Interface

> *Assessment, shipped consolidation, and roadmap. Written in the [[BBS Production Plan]] idiom. The locked aesthetic is [[BBS Design System]] — phosphor on black, VT323 + IBM Plex Mono, monospace structural. This document changes the architecture the aesthetic dresses, and corrects where the aesthetic had quietly drifted off-system.*

## Thesis

[[STIGMERGY v1.0 — Palace Front-End]] set the right spine: organize the whole interface by **time** — STATE (present / working tree), QUEUE (future / board), LOG (past / git) — so the honesty discipline (*nothing is real until it lands in LOG*) becomes the shape of the screen, not a rule to remember. That spine is sound and stays.

But the v1.0 thesis was never fully landed, and was then partly reversed. v1.0 said: three decks; the six boards (`GENERAL/FLAGS/WEAVE/SYSTEM/TRICKSTER/BRANCHES`) **demote** to lanes inside QUEUE. The build instead grew to **five** decks (TRICKSTER + STEWARDS were re-promoted, 2026-06-05) and the QUEUE deck **stacked the new ranked inbox on top of the old v0.x board-viewer** rather than replacing it. Two navigation paradigms, layered. v2.0 is the work of finishing the migration and then driving STIGMERGY from *a front-end Loudon watches* to *the primary surface Loudon operates*.

## The assessment (2026-06-16)

**Sound:** the time-deck spine; the wire (SCHEMA §9, hardened v1.10→v1.12; `@stigmergy/core`; strict validator; SSE); stewardship (19 permanent stewards on bundle-local plans); the Companion (Tier-A in-place edits). The mechanics are ready for the next stage.

**The drift that made QUEUE confusing** — two paradigms stacked produced three concrete defects, all now fixed in Phase 0:
1. **The same decisions rendered in three places** — the TRICKSTER deck (`TricksterCard`), the QUEUE ranked inbox (`QueueItem`, a "trickster" lane), and an in-QUEUE `TricksterInbox`+`DigestPanel` block — two of them co-rendering inside QUEUE. This *was* "the queue duplicates the trickster tab."
2. **Two board selectors on one screen** — `QueuePanel`'s lane chips and a second `ChannelTabs` axis, controlling two different views. This *was* "confusing and hard to navigate."
3. **The Trickster aesthetic drift** — `TricksterCard` reached for Loudon Live fonts (Cormorant serif headline, Manrope sans fold) inside a terminal that [[BBS Design System]] governs as monospace-only. The fold summaries actually rendered sans-serif; the headline carried a dead serif fallback (monospace only because `--font-body` happened to be defined). Root cause: v1.0's own line calling for the forward vector "in Cormorant-register prominence" — a phrase that contradicted the governing system.

**Integration scorecard:** Stewardship ✅ · Companion ✅ · Weave ◑ (flags land; Topology Lens unbuilt) · Handoffs ◑ (`handoff_ready` spec'd; no scheduler) · Enrichment ⚠ (parallel Flask server still live) · Lens ○ (designed, unbuilt) · Enchantment ○ (practiced via stewards, not a callable ceremony).

**The honest gap:** STIGMERGY succeeds at stewardship visibility + decision triage. The *single surface for all palace operations* is partial — authoring still lives mostly in the Claude conversation + Obsidian; Enrichment runs its own server; Lens/Topology are unbuilt. The path: heal the surface first (Phase 0), then close the integration seams (Phases 1–3).

## The clean deck identities (after Phase 0)

| Deck | Time | Job |
|---|---|---|
| **STATE** | present | read + edit entries |
| **QUEUE** | future | *the open-work board* — proposals, flags, to-dos, ready handoffs; the raw per-board feed demoted to a collapsible firehose. **No decision cards.** Its unique value is the QUEUE↔LOG reconciliation engine. |
| **LOG** | past | git explorer |
| **TRICKSTER** | decide | *the one decision inbox* — `RESOURCE_REQUEST`s + the auto-Trickster escalation digest |
| **STEWARDS** | advance | the orchestrator roster control |

The crisp line: **TRICKSTER = a steward is waiting on your answer; QUEUE = everything else open you might act on, nothing blocked on you.**

## Phase 0 — Consolidation (shipped 2026-06-16)

- **Decisions live only on TRICKSTER.** `QueuePanel` now filters out `resource_request` items (`buildQueue` still models them — the model stays complete and unit-tested — the QUEUE *view* simply doesn't surface them). The duplicate in-QUEUE `DigestPanel`+`TricksterInbox` block was removed.
- **`DigestPanel` relocated to the TRICKSTER deck**, where the escalation digest + alignment-review verdicts belong — **below the decision cards and collapsed by default** (it's the auto-trickster *tuning* panel, not the decision list, so the cards lead), with its wire labels humanized per [[Speak Like a Person, Log Like a Protocol]] (e.g. `BLOCKING AUDITION` → "paused — needs your ear"; `audition_verification` → "listen + approve"; `auto-grant` → "would approve"). *(Refined 2026-06-16 after the digest first led the deck and leaked protocol jargon — Loudon flagged the confusion.)*
- **One board selector.** The `ChannelTabs`/`MessageList`/`AgentRoster` board-viewer is demoted to a collapsible "raw board feed" firehose **under** the ranked QUEUE — folded by default for focus, auto-open in demo/e2e.
- **One decision card.** `TricksterCard` is canonical; the redundant `TricksterInbox.jsx` was deleted; the duplicated `Linkify` was hoisted to `src/lib/linkify.jsx` (the long-deferred "Phase 6 convergence").
- **Pure monospace restored.** Cormorant/Manrope/`--font-ui` leaks in `TricksterCard` + `EntryBody` replaced with `--font-mono`/`--font-display`; zero Loudon Live fonts remain in the rendered DOM.
- **Verified:** `npm run build` clean · 1223 vitest green · live-DOM assertions on both decks (no duplicate inbox, zero decision cards in QUEUE, DigestPanel on TRICKSTER, no serif/sans) · affected board-viewer e2e (`tabs`, `command-bar-active`, `rich-content-roundtrip`) green. Retired `inbox.spec`/`click-to-respond.spec` (tested the removed in-QUEUE surface); redirected `digest-verdicts.spec` to the TRICKSTER deck.

## The roadmap (priority order, set with Loudon)

**Phase 1 — Coordination & autonomy.** Pull every creative loop inside the terminal.

- **Enrichment consolidation — done (2026-06-16).** The hard part was already shipped in STIGMERGY's Phase 4.5: the actuator (`_fire_worker` robustness — PID-liveness via `ps`, daemon cleanup, idempotent fire), the card I/O, and the card queue were ported to the Node server (`server/actuator.js`, `server/cards.js`, `POST /api/cards/respond`), all tested. This phase pointed every doc — [[Enrichment]], the supervisor prompt, [[Oblique Enrichment]], the app README — at STIGMERGY's QUEUE and **retired the Flask `localhost:7878` server** (`Enrichment/server.py` deleted; git-recoverable; nothing automated started it). *Correction to the earlier plan: enrichment cards stay in **QUEUE**, not TRICKSTER — they are open-work studio-visits, not blocked-steward decisions, so they belong on the open-work board.*
- **Launch Interactive v1 — done (2026-06-16).** A `handoff_ready` item in the QUEUE now exposes a **launch interactive** action: it hands the baton to a session you can *watch and steer* — a ready catch-the-baton prompt (`buildLaunchPrompt`) to paste into a fresh Claude Code / Cowork / Companion session — and posts the paired `handoff_picked_up` (`buildHandoffPickup`) so the item self-clears, while the baton's own On-pickup checklist still governs the real catch + file deletion. **The design choice (Loudon's): complex work wants a watchable, steerable interactive session, *not* a fire-and-forget headless catcher** (which suits enrichment but not a multi-step baton). The same "launch interactive" primitive is wanted next on enrichment cards, stewards, and steward-*requested* sessions — `buildLaunchPrompt` is `kind`-discriminated for exactly that. The autonomous scheduler (auto-fire without a human click) is deferred.
- **Launch Interactive — now on enrichment cards too (2026-06-16).** Each enrichment card in the QUEUE has a **launch interactive** action that opens a session to *work the card in dialogue* (sharpen the artifact, then deposit/revise/discard) — no pickup semantics, unlike a baton. The primitive generalized cleanly: `LaunchModal` is now **context-driven** (only handoffs get MARK PICKED UP) and `buildLaunchPrompt` carries a `card` kind beside `handoff`. Proven: a live card opens the card prompt with copy + no mark-picked-up; a handoff still shows mark-picked-up.
- **The Agent Construction Launcher — done (2026-06-17).** The deferred "Launch Interactive → stewards + steward-requested sessions" item, taken further than spec'd. Two moves. **(1) One-click into a real terminal.** A launched session no longer pastes a hand-rolled prose nudge — `POST /api/launch` → `server/launch.js` → osascript opens Terminal.app running `claude --model claude-opus-4-8 --effort high "$(cat …)"` (the prompt goes through a temp file to dodge all shell/AppleScript escaping; the model is the *exact id* because the `opus` alias resolves to 4.7-low-effort on Claude Code v2.1.x). The desktop app has **no** URL-scheme deep-link and `node-pty` embedding is **unsupported** (TTY + keychain), both verified — a real terminal is the supported path. **(2) Constitute the steward as a page-agent.** `POST /api/launch/agent` runs the orchestrator's `buildCyclePrompt` in a new **`mode: 'interactive'`** — the home page injected as identity + state + neighborhood-filtered board + the steward posture, *the same context the headless cycle gets* (one source of truth, per [[Pages as Agents]]); only the closing swaps to **narrate-every-write** (Loudon: tell me before any board post / file edit / commit). The construct-agent panel (`AgentLaunchModal`) makes the build **legible by JEWEL tier** (T0–2 the `@import` floor · T3 the injected identity) and **tunable**: Core knobs (model · effort · editable mandate) + context-layer toggles (identity + state locked; board · history · page-change · staging trimmable, defaults on) + a full constructed-prompt view. Reached from the **STEWARDS** roster *and* a **TRICKSTER** card's *open interactive* (a registered steward routes to construction with the decision pre-filled as the mandate; a non-steward asker falls back to the simple launch — no regression). Shipped across ~8 commits; full app + orchestrator suites green; verified in-browser end-to-end (the only step left unproven is the macOS automation grant on the first real LAUNCH TERMINAL).
- **Still open:** the steward *emitting* a "request interactive" mark (the launcher **reads + wakes** a steward today; stewards don't yet *self-request* a session at a critical moment); Orchestrator v0.2 (v0.1 is **done** — 97 tests; v0.2 = batch cadence, spawn-from-project, scheduled tasks, ~1200–1500 LOC) — the **autonomous scheduler** (auto-fire a cycle without a human click) lives here, the watch-and-steer counterpart to everything above; wire Weave *proposals* end-to-end — the QUEUE already **displays + grants** `vector_proposal`/`weave_flag`, so the gap is the Weave actually *posting* them (Swarm Weave Phase B) and an executor *applying* a grant.

**Phase 2 — Authoring: end the bounce.** Mature STATE frontmatter forms (schema un-mistypeable by construction, satisfying SCHEMA §7 through the UI), the body editor with `[[wikilink]]` autocomplete + inline enrichment preview, the bundle-aware navigator, and the concurrent-edit-with-Obsidian conflict surface. Scope honestly: most generative ceremonies stay in chat (show-before-write); this targets quick tweaks + the structured-frontmatter guarantee + review.

**Phase 3 — Sense-making & Lens.** The Topology Lens in STATE (graph fed by `_ops/maps/palace-map-*.json`); [[The Lens]] as a draggable STATE-deck glass (render page A through page B's apparatus); and formalizing [[Palace Enchantment]] as a callable ceremony with a verifiable postcondition — closing the last conceptual gap on the integration list.

## Open questions

- Should QUEUE's `vector_proposal`/`weave_flag` items (also a kind of decision) eventually migrate to TRICKSTER too, or is "blocked-on-you vs. open-work" the durable seam?
- Once Loudon confirms he rarely opens the firehose, flip its default and consider retiring the raw per-board feed entirely (the LOG deck + the lane filter may already cover it).
- When the scheduler lands, does QUEUE gain a one-click "pick up this handoff" that fires a worker — and does that make STEWARDS redundant?

## Palace connections

- **[[STIGMERGY v1.0 — Palace Front-End]]** — the front-end thesis this completes (and where the "Cormorant-register" drift was seeded; corrected in v1.0's Revision 3).
- **[[STIGMERGY]]** — the running system; its forward vector ("become the front door") is what this drives toward.
- **[[BBS Design System]]** — the governing aesthetic, restored as monospace-only on every surface.
- **[[Project Stewardship System]]** / **[[Enrichment]]** / **[[The Lens]]** / **[[Palace Enchantment]]** — the integration surfaces the roadmap pulls inside the terminal.
