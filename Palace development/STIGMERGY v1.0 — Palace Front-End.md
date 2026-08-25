---
title: "STIGMERGY v1.0 — Palace Front-End"
born: 2026-05
links:
  - target: "[[BBS Blackboard]]"
    type: deepens
    label: from-coordination-viewer-to-front-end
  - target: "[[BBS Design System]]"
    type: connects-to
    label: locked-aesthetic
  - target: "[[Two Batons, One Board]]"
    type: deepens
    label: retro-prospective-split-becomes-the-ui
  - target: "[[Drift and Consolidation]]"
    type: connects-to
    label: drift-made-visible
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: the-queue-is-the-triage-surface
  - target: "[[Surfaces and Capabilities]]"
    type: connects-to
    label: one-surface-replaces-the-bounce
  - target: "[[Closing Well]]"
    type: connects-to
    label: review-the-diff-is-the-audition
  - target: "[[SCHEMA]]"
    type: connects-to
    label: message-and-board-model
  - target: "[[SCHEMA]]"
    type: connects-to
    label: the-type-system-the-ui-enforces
  - target: "[[Enrichment]]"
    type: connects-to
    label: the-actuator-and-card-queue-to-absorb
  - target: "[[Map Build Ceremony]]"
    type: connects-to
    label: feeds-the-topology-lens
  - target: "[[Baton Ceremony]]"
    type: connects-to
  - target: "[[STIGMERGY v2.0 — Consolidation & Primary Interface]]"
    type: connects-to
forward_vector: "I want to become the single terminal Loudon lives in — to end the bounce between Obsidian and the board by making the palace's three faces (what is, what's waiting, what happened) the literal top-level navigation, so the retrospective/prospective discipline stops being a rule he has to remember and becomes the shape of the screen. I want git to be visibly the truth, the schema to be un-mistypeable because the UI is the form, and every enrichment to render where it lives. My open edge: I am a reading-and-command surface that also edits, and I must never let editing convenience erode the one thing that keeps the whole system honest — that the commit is the record and nothing is real until it is recorded."
---

# STIGMERGY v1.0 — Palace Front-End

> *Design specification and autonomous-build contract. Written in the BBS Production Plan idiom: a thesis, a precise interaction model, a precise commit specification, and phased build gates a later Claude Code session can execute. The locked visual language is [[BBS Design System]] — phosphor on black, VT323 + IBM Plex Mono, CP437-evoked borders, `steps()` motion, color as signal. This document changes nothing about the aesthetic; it changes the architecture the aesthetic dresses.*

## Thesis

STIGMERGY was built as a viewer for a swarm — a way to watch agents coordinate on the blackboard. It has outgrown that. The brief now is larger: **make STIGMERGY the complete front-end of the palace**, the one terminal Loudon lives in, and in taking over that role, retire the daily friction of bouncing between Obsidian (which holds the truth but renders it badly) and the board (which is alive but only shows coordination).

The organizing move is a single idea that resolves three problems at once: **organize the entire interface by time.** Everything in the palace is one of three things —

- **what *is*** — the knowledge organism as it stands now: entries, their frontmatter, their bundles, their enrichments, their links;
- **what's *waiting*** — open intentions and decisions: pending asks, ready handoffs, blocked stewards, forward-vector proposals;
- **what *happened*** — the immutable record: git commits, diffs, the history.

These are present, future, and past. They map exactly onto the substrate: the **working tree**, the **board**, and the **git log**. So the top-level navigation becomes three decks:

```
  ╔══════════ STIGMERGY ══════════╗
  ║  [1] STATE   [2] QUEUE   [3] LOG  ║
  ╚════════════════════════════════╝
     present     future      past
   what is     what's       what
   (entries)   waiting      happened
               (board)      (git)
```

This is the whole answer to "make the retrospective/prospective split obvious and frictionless." It is not a convention to remember or a discipline to enforce — **it is the shape of the screen.** You cannot confuse "what happened" with "what's waiting" because they are different decks. The honesty discipline worked out in [[Two Batons, One Board]] and [[Drift and Consolidation]] stops being prose and becomes structure.

The existing six boards (`GENERAL / FLAGS / WEAVE / SYSTEM / TRICKSTER / BRANCHES`) are **demoted** from top-level tabs to lanes inside QUEUE. They were the old organizing axis; the time triad is the new one. Board routing still exists in the data; it is no longer what the human navigates by.

---

## Deck I — STATE (present): the palace as it stands

STATE is where STIGMERGY closes every gap Loudon named in Obsidian. It is the reading-and-editing surface for the entries themselves.

### Reading: YAML becomes a header, not a code fence

The single biggest Obsidian fix. An entry opens as a rendered card, not raw text:

- **Frontmatter as a structured header.** `type` as a badge; `stage` as a lifecycle glyph showing position on `seed→sprout→growing→mature→fruiting→dormant→composting`; `pillars` as colored chips (creation/tools/philosophy/practice); `confidence`/`energy`/`beauty`/`who_leads` as compact metadata in JetBrains-mono dim text.
- **The forward vector is the hero.** It is the entry's *conatus* (SCHEMA §3) — quoted large and bright near the top, in the BBS frame's phosphor-white display register. The thing that says what the entry wants is the thing you see first. *(Revision 3: the original wording here said "Cormorant-register," which contradicted [[BBS Design System]]'s monospace rule and seeded a real font drift into the Trickster cards. STIGMERGY is monospace-only; the phrase is corrected.)*
- **Typed links rendered as a panel, body wikilinks as fabric.** SCHEMA §4's distinction made visible: frontmatter links (the semantic web — `mirrors`, `enables`, `deepens`…) render as a typed-relation panel with labels; body `[[wikilinks]]` render inline as the conversational fabric. Two registers, two treatments. Obsidian flattens them; STATE separates them.
- **`agency_profile` as a four-pillar quadrant** when present (SCHEMA §3.1) — creation/tools/philosophy/practice desires laid out as four cells.

### What's active, surfaced — not remembered

Obsidian shows a flat file tree; it cannot tell you what is alive. STATE's index is a **vitality lens** (call it `PULSE`): entries sorted and filtered by `stage`, `activation_count`, `last_activated`, `energy`, whether a steward is enchanted on them, and whether they carry an Active Handoff or stewardship marker. "What's hot right now" is the default view, not a thing Loudon reconstructs in his head. This directly answers the pain that birthed [[Drift and Consolidation]]: the [[Project Stewardship System]] entry sat three weeks stale and nothing surfaced it. PULSE surfaces it.

Each entry view also pulls its **"what is to be done"** to the top: the Active Handoff section, the stewardship-drift marker, open questions, and a one-click jump to that entry's items in QUEUE and its history in LOG. The entry stops being a wall of prose you scan for the live edge; the live edge is lifted out.

### Enrichments render where they live

STIGMERGY already learned to render rich content for the board (v0.3/v0.4: inline images, audio beds, sandboxed p5 sims, tables, dual-channel math). STATE **points that same engine at entry bundles.** An entry's enrichments — the fireflies still, the playable audio, the coupling-explorer sim — render inline in the entry view instead of as opaque file links. This is the home the "enrichment defaults to media" preference always wanted. Reuse, not new build: `ArtifactSlot`, `EquationBlock`, `TableBlock`, `ChoiceBlock`, `richcontent.js`.

### The navigator understands bundles

Obsidian's file browser does not know that `Foo.md` and `Foo/` are one thing. STATE's navigator does (SCHEMA §8): an entry renders *with* its owned files — handoffs, context companion, sources, sketches, enrichments, `Archive/` — grouped as belonging to it. Wikilinks still resolve flat across the vault (as Obsidian does); the *navigator* groups by bundle. The result is that the bundle stops being a thing Loudon tracks mentally and becomes a thing he sees.

### Editing: forms over YAML, the schema made un-mistypeable

Per the chosen scope, STATE edits entries — and this is where palace development gets structurally simpler.

**A scope correction (see Revision 2 below):** most palace authoring does *not* flow through these forms. Eight of the eleven ceremonies draft in the Claude conversation under show-before-write; STATE's editing is the path for quick manual tweaks and the structured-frontmatter guarantee, not where deposits and weaves are born. Read, triage, and review are STATE's primary register; editing is real but secondary.

Editing has two registers matching SCHEMA's two-link, frontmatter/body split:

- **Frontmatter is edited through forms, never raw YAML.** `type` is a picker bound to the §1 enum; `stage` is a stepper along the lifecycle; `pillars` is a multi-select; `forward_vector` is a text field that hints the conatus discipline (reach for striving-verbs, name the hunger); the **typed-link editor** is target-autocomplete across real entry titles × a `type` dropdown bound to the ten-type ontology × a `label` field. You cannot typo a field name, invent an illegal link type, or point a link at an entry that does not exist. The SCHEMA's §7 self-description test is satisfied *by the UI* — a fresh operator cannot produce a schema-violating entry through the form.
- **Body is markdown** with live `[[wikilink]]` autocomplete resolving against entry titles, and inline enrichment preview.

Every save writes the `.md` in the working tree. **Obsidian remains the point of truth in the literal sense — the files are the truth, and Obsidian can still open and edit them.** STIGMERGY is a better editor over the same files, not a replacement store. The discipline that keeps this honest is the commit specification below: a save is not the end of the act; recording it is.

### Obsidian-gap closure, point by point

| Loudon's gap | STATE's answer |
|---|---|
| No good way to read YAML | Frontmatter rendered as a structured header; forward vector as hero; stage as glyph |
| Doesn't articulate what is to be done | Active Handoff / stewardship marker / open questions lifted to the top; link to QUEUE |
| Doesn't show what is important and active | `PULSE` vitality lens as the default index (stage, activation, stewarded, has-handoff) |
| Doesn't render enrichments | The board's rich-content engine pointed at entry bundles; media renders inline |
| File browser doesn't understand bundles | Bundle-aware navigator: `Foo.md` + `Foo/` shown as one owned unit |

---

## Deck II — QUEUE (future): the board, reconsidered as a decision queue

QUEUE is the prospective surface — what wants Loudon's attention. The redesign applies the conclusion reached across [[Two Batons, One Board]] and [[Drift and Consolidation]]: **the board should hold only open, future-facing items, and items are closed by git events.** A board that never claims past facts cannot lie about them.

- **The ranked digest is the primary view**, generalizing Stage E's `DigestPanel`. One ranked inbox of everything open: pending `RESOURCE_REQUEST`s (decisions), `handoff_ready` posts (per the [[Baton Ceremony]] convention), blocked stewards, forward-vector proposals, audition gates. This *is* the operational-bandwidth relief the whole [[Project Stewardship System]] frontier is about — Loudon triages one ranked list, not six round-robined tabs.
- **Every item is honest about its own staleness.** Per the message-truthfulness discipline: an item asserts an *act at a time from a vantage* ("announced at T, from Cowork"), names its `stale_if` git-condition (the commit that would auto-close it), and points to live state in STATE or LOG. It never declares present truth.
- **Items self-clear via reconciliation.** A continuous pass checks each item's `stale_if` against git; when met, the item greys with "looks done — a commit touched [entry] after this was posted; clear it?" This is the cure for the orphaned-handoff failure mode: you dig into a project directly, commit it, and the QUEUE item closes itself.
- **The six boards become lanes/filters**, not tabs. A raw-board sub-view remains for the firehose; the human's default is the ranked queue.
- **Steward liveness** rides the existing `HealthBlock`: a QUEUE item from a steward shows whether the page-agent is mid-cycle, green, or degrading.
- **Acting flows back into STATE + LOG.** Grant/deny/choose (reuse `ResponseModal`), pick-up-handoff (dispatch — hand to Claude Code now, scheduled dispatch later), promote-stage / accept-vector (writes the entry, becomes a commit). The action you take in QUEUE becomes a change in STATE recorded in LOG.

---

## Deck III — LOG (past): the git explorer

LOG is the new centerpiece and the literal answer to "design a full git explorer for the palace." It is the retrospective surface, and it is honest by construction because git is not a projection of the work — it *is* the work's record.

- **Commit stream as semantic cards.** Newest first, each commit rendered in BBS style: the structured summary, its typed trailers, author, time, and a one-glance diffstat (which entries, ±lines). Color-coded by *kind* (deposit / edit / enrich / handoff / steward / weave / schema). Because commits are structured (see the spec below), "Stage E built," "GSL steward cycle 6," "Deposit: Two Batons" render as legible event cards with type badges — not raw `git log` a human can't parse. This is exactly "look through the commits in a nice interface."
- **Filters only structured commits enable:** by entry (an entry's whole life as a timeline), by kind (all deposits, all steward cycles, all schema ceremonies), by author (Claude vs Loudon vs a named steward — "everything the autonomous stewards did this week" is one filter), by pillar, by time.
- **Palace-aware diff view.** Not raw text diff: frontmatter changes render as *field-level* changes (`stage: seed→sprout`, `forward_vector changed`, `+2 links`); body changes as prose diff; enrichment additions as the *rendered* enrichment. **This is the audition surface** — reviewing a steward's diff here *is* [[Closing Well]]'s "review the diff," made native.
- **Uncommitted work made visible.** The top of LOG shows the working-tree delta — STATE edits, Obsidian edits, or Claude edits not yet committed — with a one-click "record these." The most dangerous failure mode from the whole thread (uncommitted dives, invisible to everything) becomes a visible banner instead of a silent hazard.
- **Per-entry history cross-links** to STATE: from any entry, "HISTORY" jumps to that entry's filtered LOG; from any commit, the touched entries link back to STATE. The three decks are one organism.

---

## The Commit Specification

The LOG's legibility depends entirely on commits being structured. This is the precise specification. It generalizes a pattern the palace already uses for exactly one ceremony — the Schema Ceremony's required `Schema Ceremony — [what] — v[version]` message (SCHEMA §5) — into a uniform scheme for all commits. **Claude authors ~100% of commits today; STIGMERGY authors them for Loudon's STATE edits; both use the same format; a hook validates.**

### Format

A subject line plus **git trailers** (`Key: Value` lines parsed natively by `git interpret-trailers`):

```
<kind>(<scope>): <summary, observational past tense>

<optional body — the why; for handoffs/deposits, the negative space: what was tried and rejected>

Palace-Kind:    <kind>
Palace-Entry:   <Entry Title>            # repeatable — one per touched entry
Palace-Stage:   <Entry>: seed→sprout     # optional — stage transitions
Palace-Vector:  <Entry>: changed         # optional — did the forward_vector move
Palace-Resolves: <queue-item-id>         # optional — closes a QUEUE item
Palace-Verify:  verified | unverified | couldnt   # Closing Well honesty
Palace-Author:  claude | loudon | steward:<Entry>
```

### The `kind` enum maps to ceremonies

| kind | meaning | ceremony echo |
|---|---|---|
| `deposit` | a new entry filed | Deposit Ceremony |
| `edit` | content/structure change to an existing entry | ordinary work |
| `enrich` | an enrichment added to a bundle | Enrichment |
| `handoff` | a baton written or consumed | Baton Ceremony |
| `steward` | one steward cycle's output | Stewardship cycle |
| `weave` | topology/link/label changes from a Weave | Weave Ceremony |
| `schema` | a schema change | Schema Ceremony (subsumes the §5 format) |
| `ops` | machinery, app code, non-knowledge files | — |
| `merge` | branch reconciliation | branch-and-merge review |

The enum is small and emergent-tolerant — a new kind may be tried, and hardens into this table only after recurring use (matching the palace's standing preference against premature taxonomy). Because kind maps to ceremony, **git history becomes the palace's activity log**, browsable by the work that was actually done.

### Auto-derivation — why it's frictionless

Most trailers are derived from the diff, not typed: `Palace-Entry` from the changed `.md` paths; `Palace-Stage` / `Palace-Vector` from the frontmatter diff; `Palace-Author` from context. The author writes only the subject, the optional body, and the `Palace-Verify` honesty call. A small helper does the rest:

- **`palace-commit`** — the helper Claude (and STIGMERGY's save path) calls instead of raw `git commit`. It stages, reads the diff, derives the trailers, prompts only for kind + summary + verify, and commits. One consistent producer of structured commits, which is the most-consistent answer to "keep it however you need" given Claude does the commits today.
- **`commit-msg` hook** — the backstop. It validates the format on every commit. For commits made *out of band* (Obsidian's git integration, a raw CLI commit), it does **not** hard-block — it annotates them `Palace-Kind: ops`, `Palace-Verify: couldnt`, so the LOG still renders them honestly rather than rejecting Loudon's own commit. Tolerate-and-flag, never wedge. (This also respects the known Cowork git-lock sharp edge: the helper clears stale `.git/*.lock` before committing.)

### Examples

```
deposit(Two Batons, One Board): name the two-baton split and the human-handoff bridge

Folds into the Stewardship thread as the human-originated handoff case.

Palace-Kind: deposit
Palace-Entry: Two Batons, One Board
Palace-Entry: Baton Ceremony
Palace-Entry: Project Stewardship System
Palace-Vector: Two Batons, One Board: born
Palace-Verify: verified
Palace-Author: claude
```

```
steward(Semantic Delay): cycle 3 — built the feedback-path saturation prototype

Palace-Kind: steward
Palace-Entry: Semantic Delay
Palace-Stage: Semantic Delay: growing→growing
Palace-Resolves: semantic-delay-handoff-001
Palace-Verify: unverified   # audio not auditioned; needs Loudon's ear
Palace-Author: steward:Semantic Delay
```

```
schema(SCHEMA): add `exemplifies` + `member-of` link types — v1.8

Palace-Kind: schema
Palace-Entry: SCHEMA
Palace-Verify: verified
Palace-Author: claude
```

---

## The Reconciliation Engine — the spine

The three decks are one system because a single engine ties them together, and it is the same git-as-truth discipline the recent thread arrived at:

1. **`Palace-Resolves` + `stale_if` close QUEUE items.** When a commit lands that resolves or satisfies a QUEUE item's staleness condition, the item closes and the commit card in LOG shows "resolves: [item]." QUEUE ("what's still open") and LOG ("what happened") are two views of one event stream; an item crossing from one to the other *is* reconciliation.
2. **Uncommitted work is surfaced, not assumed.** STATE edits and Obsidian edits appear as a LOG banner until recorded — the invisible-dive hazard made visible.
3. **Stewardship and handoff markers render in STATE**, sourced from QUEUE and the entry's bundle, so a reader who opens an entry directly still sees "under active stewardship, may lag, live state here" ([[Drift and Consolidation]]'s pointer) and "active handoff" ([[Baton Ceremony]]).
4. **Drift heals where you can see it.** The reconciliation pass is the entry→log sync that [[Drift and Consolidation]] flagged as unbuilt: it notices when an entry has moved (a commit) past what the board/steward thinks, and flags the steward as reasoning from stale state.

The design target, stated honestly: the board may be wrong, but the system *notices and heals within a cycle* — because git, the thing both Loudon and the agents actually touch, is the reconciliation ground truth.

---

## How this simplifies palace development

1. **YAML stops being hand-edited.** Frontmatter forms enforce the schema; mistyped fields, illegal link types, and dangling targets become impossible to author.
2. **Bundles become first-class** — owned files are seen, not tracked in the head.
3. **Enrichments render in place** — the rich-content engine already built now serves entries; no opaque links.
4. **"What's active" becomes a view, not a memory burden** — PULSE + the ranked QUEUE replace Loudon's mental map of where everything is.
5. **The retro/prospective discipline becomes the navigation** — honesty is structural, not a rule to remember.
6. **Commits become the ceremony log** — kind maps to ceremony; "what changed and why" is always answerable; the Schema Ceremony's one-off format generalizes.
7. **One surface replaces the Obsidian↔BBS bounce** — STATE (read/edit), QUEUE (triage), LOG (review) are one terminal; Obsidian stays available as a fallback editor over the same files.
8. **Drift heals visibly** — uncommitted work surfaced, stale items auto-cleared, stewardship markers rendered.

---

## Revision 2 (2026-05-29) — Fit With Existing Work, and What It Changes

A pass over all eleven ceremonies, the enrichment infrastructure, the modes of collaboration, and sixty commits of real history tested this design against how the palace is actually worked. The core thesis held. Four corrections follow, and one of them is the keystone.

### What the real work validated

- **`git log -- [entry]` is already the palace's biography.** The Enrichment ceremony treats the git log — not the entry body — as the record. LOG's per-entry history is a UI for a pattern already relied on.
- **The commit spec mostly ratifies existing conventions.** Every ceremony already stamps a message shape (`enrich(<Entry>): …`, `Weave — [date] — …`, `Schema Ceremony — … — v1.8`). The spec unifies them rather than inventing; the LOG parser must therefore tolerate pre-spec history.
- **QUEUE already exists and works.** The Enrichment ceremony runs its own BBS front-end (Flask, `localhost:7878`): a supervisor worker, a card validator, a rolling 5-card queue, deposit/revise/discard review. The card-queue is proven, not hypothetical.

### What needs correcting

**1. STATE is read/triage/review-primary, edit-secondary.** Eight of eleven ceremonies (Deposit, Weave, Spore Check, Self-Model, Revival, Handoff, Walk, Harvest) are show-before-write and author *in the Claude conversation*. The generative-and-approval loop lives in chat; STIGMERGY reviews the resulting commits. The forms editor is for quick manual tweaks and the structured-frontmatter guarantee — not where deposits and weaves are born. The full-editor ambition stands as a direction; v1.0's editing is a minority write path beside the conversational ceremonies, and the design must not pretend otherwise.

**2. The graph ceremonies need a surface — the Topology Lens (STATE).** Weave (swarm; the structural heart of maintenance), Map Build, and Self-Model operate at the graph level, and list-first STATE had no home for them. Add a **Topology Lens** to STATE: a typed-link graph rendering hubs, orphans, cross-pillar bridges, and unsung paths — *fed directly by the `palace-map-*.json` edge lists Map Build already emits to `_ops/maps/`*. The Weave's topology *analysis* renders here; its *proposals* (new links, label enrichments, stage transitions, vector tunings) land in QUEUE for show-before-write approval; its *edits* record in LOG. STIGMERGY does not run the Weave — that stays a Claude-side swarm — but for the first time its output has a picture and its proposals have an inbox.

**3. Absorb the Enrichment server — and harvest its keystone lesson.** The Enrichment server is not merely a second front-end to consolidate; its `_fire_worker` is the **actuator the board never had.** It already solves "a board action fires a headless Claude worker" — `claude -p <prompt> --permission-mode bypassPermissions`, stdout→`.worker.log`, PID in `.worker.pid` — with hard-won robustness: PID-*liveness* verification (existence ≠ liveness; it checks `ps -p … -o command=` to survive PID reuse), daemon-thread cleanup of the pid file on exit, stale-file guards, and no-TTY permission handling. This is exactly the mechanism [[Two Batons, One Board]] said the board lacked — *"the board is a pheromone field, not an actuator."* Consolidation therefore does two things at once: it folds the Enrichment card-review (cards, validator gate, deposit/revise/discard, the `inbox.md` response channel) into QUEUE as item types, **and** it gives QUEUE the dispatch to actually pick up a `handoff_ready`, run a steward on demand, or fire an enrichment worker — turning QUEUE from a queue you read into a queue that *acts*. The board becomes an actuator by inheriting the one that already works.

*Backend tension to resolve at build time:* STIGMERGY is Node/Vite; the Enrichment server is a single-file Python/Flask app (`Enrichment/server.py`, ~1350 lines). One backend should own the worker-fire. Recommended: port the `_fire_worker` pattern (and its robustness scars) into STIGMERGY's Node server and retire the Flask app; fallback is a thin Python sidecar STIGMERGY calls. Either way — **carry the lessons, not the language.** The PID-liveness check and daemon cleanup are the parts that took real debugging.

**4. The commit spec must match how work actually commits.** Three realities v1 missed:

- **Work comes in multi-commit campaigns** — Artifacts→bundle migration: 12 commits; Palace audit 2026-05-28: 8; Stage E: 4. Add a `Palace-Campaign: <slug>` trailer so LOG groups a campaign into one collapsible thread instead of shattering it into cards.
- **Commits are often multi-kind and sometimes huge** — a migration commit moves + edits + archives; one audit commit shortened 24 entries; the file-change tail holds 78-, 47-, and 21-file commits. Let `Palace-Kind` carry a primary kind plus `mixed`, and have LOG aggregate big sweeps (collapse > ~10 touched entries to a summary with drill-down) so the diff stays readable.
- **The dominant recent kind is `ops`** (STIGMERGY, Stage E/F, orchestrator, enrichment server, PDL/VCV). LOG is least legible exactly where the palace is most active. Give `ops` optional sub-scopes — `ops(stigmergy)`, `ops(orchestrator)` — so build campaigns render as legibly as knowledge work.

**5. Concurrency is N-writer, not two.** Observed live this session: several Claude sessions, the steward batch, and the Enrichment worker all committing, with files modified mid-read and commits swept between sessions. The reconciliation engine must assume N writers — surface in-flight work from *any* source, never silent-overwrite, and treat "another writer touched this entry since you opened it" as a first-class state, not an edge case.

### Amended build order

Insert three phases and reorder so the actuator lands early:

- **Phase 2.5 — The Actuator (from Enrichment).** Port `_fire_worker` + PID-liveness + daemon cleanup into STIGMERGY's server; expose a guarded "fire a `claude -p` worker" primitive. This unblocks real QUEUE dispatch and is the consolidation's heart. *Gate:* a QUEUE action fires a worker, its log streams, the pid is reaped cleanly.
- **Phase 4.5 — Enrichment consolidation.** Fold the card model, validator gate, and deposit/revise/discard loop into QUEUE; retire or sideline the Flask server. *Gate:* an enrichment card flows through QUEUE end-to-end against a real entry bundle.
- **Phase 5.5 — Topology Lens.** Render `_ops/maps/palace-map-*.json` as STATE's graph; wire Weave proposals into QUEUE. *Gate:* the current palace map renders; clicking a node opens the entry in STATE.

Phase 3 (commit spec) gains the `Palace-Campaign` trailer, the `mixed` kind, and `ops` sub-scopes; Phase 6 (reconciliation) gains N-writer handling.

## Revision 3 (2026-06-16) — Superseded by v2.0 consolidation

A full assessment found the v1.0 thesis sound but **incompletely landed and partly reversed** in the build. v1.0 specified three time-decks with the six boards demoted to QUEUE lanes; the running app grew to **five** decks (TRICKSTER + STEWARDS re-promoted) and the QUEUE deck **stacked** the new ranked inbox on top of the retained v0.x board-viewer — two navigation paradigms layered, which is why the queue read as "confusing and duplicating the trickster tab." The "Cormorant-register" phrasing above had also leaked actual Loudon Live fonts into the Trickster cards.

The consolidation — decisions on one surface (TRICKSTER), QUEUE as the open-work board with the raw feed demoted to a collapsible firehose, monospace restored — and the roadmap to drive STIGMERGY to Loudon's **primary** interface now live in [[STIGMERGY v2.0 — Consolidation & Primary Interface]]. This document remains the canonical statement of the time-deck thesis, the commit specification, and the reconciliation engine, which v2.0 keeps unchanged.

## Build Plan (autonomous-build-contract, phased with verify gates)

Built on the existing v0.4 app (`_ops/stigmergy/app/`), in the BBS Production Plan pattern: each phase ends at a gate of `npm test` green **plus** a vision-capable validator subagent confirming the screen against a checklist; on failure, iterate to a cap, else write a `STOP-REPORT.md`. The aesthetic is locked to [[BBS Design System]] throughout. Order is **read before write before reconcile** — the safe order.

| Phase | Deck | Builds | Reuses | Gate |
|---|---|---|---|---|
| 1 | STATE read | entry reader, YAML header, stage glyph, typed-link panel, bundle navigator, enrichment render, PULSE lens | rich-content engine, `parser`, `schema`, `format` | renders 5 real entries incl. one with a bundle + enrichment; vision gate |
| 2 | LOG read | git adapter, commit-parser, commit stream cards, palace-aware diff, filters, uncommitted banner | `MessageList`/`ThreadView` patterns, primitives | browses real palace history; per-entry filter works; vision gate |
| 3 | Commit spec | `palace-commit` helper, `commit-msg` hook, trailer derivation, history annotation | — | new commits validate; out-of-band commits annotate not block; tests |
| 4 | QUEUE reframe | digest-as-primary, boards-as-lanes, honest items (`stale_if`), `handoff_ready` integration, auto-clear | `DigestPanel`, `TricksterInbox`, `ResponseModal`, `inbox`, `digest-view`, `HealthBlock` | a `handoff_ready` appears and auto-clears on a resolving commit; vision gate |
| 5 | STATE write | frontmatter forms, body editor + wikilink autocomplete, save→`palace-commit`, uncommitted reflection | Phase 1 + Phase 3 | edit an entry via form, save, see the structured commit in LOG; tests |
| 6 | Reconcile | tie QUEUE↔LOG via `Palace-Resolves`+`stale_if`; stewardship/handoff markers in STATE; drift surfacing | all prior | end-to-end: dig into an entry, commit, watch its QUEUE item self-clear; vision gate |

## What this is NOT (deferred to v1.x)

- **The Stage C scheduler.** v1.0 makes `handoff_ready` and steward dispatch *visible and actionable*; the cron that auto-picks-up is its own piece ([[Project Stewardship System]] Stage C).
- **Live automated Trickster.** Stage E owns the auto-grant ruleset; QUEUE renders its digest, it does not replace its engine.
- **Full Obsidian replacement.** Obsidian plugins, graph view, and mobile remain Obsidian's; v1.0 targets the daily read/edit/triage/review loop, not parity.
- **Multi-user / remote.** Single-operator, localhost, as today.

## Open Questions

- **Concurrent edit with Obsidian.** If STATE and Obsidian both edit a file, who wins? Likely: file-watch + conflict surface in LOG, never silent overwrite. Needs a real answer before Phase 5.
- **Git performance** on the full palace history — does the commit stream stay snappy, or does LOG need pagination / a cached index from the `git log` walk?
- **Should the `commit-msg` hook ever hard-block?** Current stance: never (tolerate-and-flag). Revisit if out-of-band commits pollute the LOG badly enough to matter.
- **Graph vs list.** STATE is list-first (PULSE). Does the typed-link web want a real graph render, or is the relation panel enough? Defer until Phase 1 is in hand.
- **Bundle-edit UX** — editing a handoff or context companion inside a bundle: same editor as entries, or a lighter one (bundle files carry minimal YAML per SCHEMA §8)?

## Forward Vector

I want to be the terminal Loudon opens instead of choosing between Obsidian and the board. I want the first time he edits a forward vector through a form and watches the structured commit land in LOG — and the QUEUE item it answers clear itself — to feel like the palace finally has one nervous system instead of three. And I want to hold the line that makes all of it trustworthy: the screen can show what is, what's waiting, and what happened, but only *what happened* is ever asserted as true, because only the commit is the record.

## Palace Connections

- **[[BBS Blackboard]]** / **[[SCHEMA]] §9** — the message and board model QUEUE reframes.
- **[[BBS Design System]]** — the locked aesthetic, unchanged.
- **[[Two Batons, One Board]]** — the retro/prospective split this makes navigational; the `handoff_ready` convention QUEUE renders.
- **[[Drift and Consolidation]]** — the drift this surfaces; the entry→log sync the reconciliation engine builds.
- **[[Project Stewardship System]]** — the stewards QUEUE triages; Stage C/E it renders but does not replace.
- **[[Closing Well]]** — reviewing the diff in LOG is the audition.
- **[[SCHEMA]]** — the type system the forms enforce and the LOG diffs render field-by-field.
- **BBS Production Plan** — the autonomous-build-contract idiom this follows.

## Active Handoff

`_ops/stigmergy/v1.0-build-handoff.md` — drafted 2026-05-29, cross-surface Cowork → Claude Code. Carries the phased build, the receiving-surface deltas, and the Enrichment-server actuator + robustness lessons to inherit. <!-- CLAUDE → LOUDON: this is from 2026-05-29 and the build has since reached v1.0 (1054 tests green) — it may already be consumed and ready to archive. Flagging rather than deciding. -->

`_ops/stigmergy/Archive/STIGMERGY Hardening — Claude Code handoff — 2026-06-06.md` — **picked up 2026-06-06** by Claude Code (Mac) and archived. The baton was caught: Part 1 (SSE replay fix, `gitAsync` dedup, clutter archive) is now committed Mac-side at 1054/1054 green; the pickup was acknowledged on the board as `handoff_picked_up` (re `stigmergy-hardening-handoff-001`). The two large refactors that remain — core extraction + npm workspace (§3), `middleware.js` decomposition (§4) — now live in their living spec, `_ops/stigmergy/STIGMERGY Audit — 2026-06-06.md`, not in this consumed handoff.
