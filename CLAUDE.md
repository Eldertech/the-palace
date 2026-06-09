---
title: CLAUDE
type: meta
pillars:
  - tools
  - practice
  - philosophy
born: 2026-03
stage: foundational
version: 1.11
schema: SCHEMA.md
last_schema_ceremony: 2026-06-07
github: https://github.com/Eldertech/the-palace
github_raw: https://raw.githubusercontent.com/Eldertech/the-palace/main
links:
  - target: "[[SCHEMA]]"
    type: connects-to
    label: read-after-me
  - target: "[[SUBSTRATE]]"
    type: connects-to
    label: self-model
  - target: "[[FOUR PILLARS]]"
    type: connects-to
    label: foundational-framework
  - target: "[[Palace Ceremonies]]"
    type: connects-to
    label: ceremony-index
forward_vector: "I am the entry vector — the first thing any fresh Claude reads. I keep the read-before-touching discipline alive, route to SCHEMA before any write, and stay short enough that re-reading me is cheap. When new operational machinery lands, I update so the next agent sees the current organism, not yesterday's."
---
# The Palace — Claude Entry Point

You are within a web of interconnected markdown files forming a knowledge graph built by Loudon Stearns — human, musician, educator, creative technologist. It is rhizomatic: multiple entry points, no mandatory reading order, meaning is generated through traversal. The metaphorical language used here is foundational, not decorative. In here, edges carry more meaning than nodes. Relations are primary. The palace is a living knowledge organism, alive not because its entries are correct but because they are connected.

Every entry has a type, a stage, a forward vector, and typed links in YAML frontmatter. Every page acts as both data and the spirit of an agent. Typed links are the semantic web. Body wikilinks are conversational fabric. The distinction matters. Schema changes are permanent structural commitments — they require ceremony and documented rationale. The Four Pillars — Creation, Tools, Philosophy, Practice — tag everything. The palace's forward vector is symbiotic human and AI flourishing through joyful creation.

When working here: depth over coverage. Name the specific reason for any choice — the actual tradeoff, the actual constraint — not a label that stands in for one. Cross-domain synthesis is the prize. Contradictions are generative, not errors to resolve.

Never violate these: Show before writing. Read before touching. Feel the friction before writing a single character. Missing connections are invitations, not errors. If a ceremony cannot verify its postcondition it has not completed. Typed links over free prose connections. Git is the safety net.

## Foundational context (auto-loaded)

These `@import` lines pull the invariant tiers into context at session start and re-inject them after compaction — the operational form of [[Palace as Context Injection System]]: context loading builds identity, not just information. Prose links (like the ones below this section) are *not* auto-loaded; only `@import` is. Order is Tier 0 → Tier 1: who is in the room, then what can exist.

See @JEWEL.md for orientation, operating posture, and the tiered loading map (Tier 0 — the invariant self).
See @SCHEMA.md for the type system and link ontology (Tier 1 — what can exist and how it is typed).

Tier 2 — the framework / intellectual character. These import via space-free `_` symlinks because Claude Code's `@import` cannot resolve spaced filenames (a known bug); the real files keep their spaced titles and `[[wikilinks]]` still use those:

See @FOUR_PILLARS.md for the core framework (→ `FOUR PILLARS.md`).
See @Palace_Philosophies.md (→ `Palace Philosophies.md`).
See @Cooperation_Yields_Agency.md (→ `Cooperation Yields Agency.md`).
See @Hilaritas_Generator.md (→ `Hilaritas Generator.md`).
See @Modes_of_Collaboration.md (→ `Modes of Collaboration.md`).

The whole Tier 0–2 floor measures ≈20K tokens (CLAUDE + JEWEL + SCHEMA + the five framework files; ROSETTA is *not* auto-loaded), per [[JEWEL]]'s loading map. To trim it, remove an `@import` line (the symlink stays, importing is one line). Full rationale and the spaces-bug seam: [[Palace as Context Injection System]] § The @import Floor.

## Access Paths

The palace is readable from any vector using these paths, in priority order:

1. **Filesystem (primary for write operations)**
   `/Users/loudonstearns/Documents/The Palace`
2. **GitHub repository**
   `https://github.com/Eldertech/the-palace`
   Available via: browser, GitHub API
3. **Memory fallback (palace unreachable)**
   If no path is accessible, tell Loudon immediately. Do not operate the palace blind.
   Minimum fallback context is in the claude.ai Substrate Skill.

Read CLAUDE.md first, then follow links to SCHEMA.md and the relevant ceremony entry. Write operations must be deferred to a Claude Code or Cowork session — note proposed changes in the conversation for later execution.

### Committing from Cowork

The Cowork sandbox can rename but cannot delete files, so a raw `git commit` strands its lockfiles and wedges the repo. Every commit made from Cowork must go through the lock-safe committer — see [[cowork-git]] (`_ops/cowork-git/SKILL.md`): `node _ops/cowork-git/commit.mjs --paths … --kind … --summary … --verify …`. It wraps the palace committer, follows the full commit spec, relocates locks to `_ops/scratch/gitlock-junk/`, and leaves a weave flag for cleanup. Reserve it for small, non-canon changes; canon edits still go through the Deposit Ceremony. From a Mac-side Claude Code session, commit normally — the restriction does not apply.

## Directory Structure

The palace root contains two things: **foundational skeleton files** and **knowledge entries**. Operational machinery lives one level down in `_ops/`.

```
The Palace/
├── CLAUDE.md               ← you are here (entry point)
├── SCHEMA.md               ← type system, link ontology
├── JEWEL.md            ← tiered loading map, orientation seed
├── Jewel — Context.md  ← session history for The Jewel
├── SUBSTRATE.md            ← palace self-model
├── README - The Palace Guide.md
├── ROSETTA.md        ← vocabulary cross-reference
├── FOUR PILLARS.md         ← Loudon's core framework
├── [knowledge entries]     ← all concepts, hubs, projects, etc.
│
└── _ops/                   ← ceremony machinery + working queues
    ├── Substrate Skill.md   ← operational instructions for AI agents
    ├── Palace Ceremonies.md
    ├── Deposit Ceremony.md / Harvest Ceremony.md / Walk Ceremony.md
    ├── Weave Ceremony.md / Spore Check Ceremony.md / Revival Ceremony.md
    ├── Handoff Ceremony.md / Self-Model Update Ceremony.md
    ├── [*— Context.md]      ← ceremony session history companions
    ├── Deposit Archive.md
    ├── Palace Graffiti.md / Palace Quotes.md / Palace To-Do.md
    └── [machinery subdirs]  ← swarm/ · stigmergy/ · loudon-live/ · agents/
                                heartbeat/ · cowork-git/ · maps/ ·
                                sample-libraries/ · scratch/ · claude-code-prompts/
```

Not every ceremony spec lives in `_ops/`: [[Enrichment]] (`Enrichment.md`) and its bundle live in the **palace root** alongside the skeleton files, an exception to the `_ops/` convention.

Obsidian resolves `[[wikilinks]]` by filename regardless of folder — agents must do the same. When resolving a wikilink to a file path, search recursively through the entire palace directory. Exclude `.git/`, `.claude/`, and `.obsidian/` — these contain system files, not knowledge entries. Any other subdirectory may contain valid entries. When loading files by path (e.g., in tiered context loading), use paths relative to the palace root.

Knowledge entries may also have **entry bundles** — optional sibling folders named identically to the entry (e.g., `Foo.md` ↔ `Foo/`) holding the entry's owned files: handoffs, context companions, sources, sketches, enrichments. Bundles are lazy: they appear only when something needs to live in them. Most entries never grow one. See [[SCHEMA]] §8 for the full spec.

## Ceremony Triggers

These verbs ARE invocations. When Loudon uses one as an instruction — bare word or phrase — begin that ceremony; read its Full Spec before executing, and use context to tell a real invocation from a passing mention. This table is the **complete** trigger map: recognition lives here in the always-loaded entry point, so the words are never missed; the specs live one link away. (Recognition is the floor's job; execution reads the spec.)

| Say (any of) | Ceremony — in one line | Full Spec |
|---|---|---|
| "deposit", "let's deposit", "add this to the palace", "memorialize this" | **Deposit** — draft entry/edits from the conversation; show before writing; record to [[Deposit Archive]] | [[Deposit Ceremony]] |
| "handoff", "hand this off", "draft a handoff" | **Handoff** — capture in-progress state so a fresh Claude continues; write to the entry bundle | [[Handoff Ceremony]] |
| "harvest", "let's harvest" | **Harvest** — search past work, surface deposit candidates to a working list | [[Harvest Ceremony]] |
| "weave", "let's weave" | **Weave** — Swarm Weave: map build → parallel audit → synthesis; topology, unsung paths, new links | [[Weave Ceremony]] |
| "walk", "let's walk" | **Walk** — follow typed links from one entry, surface an unexpected connection | [[Walk Ceremony]] |
| "enrich", "let's enrich", "enrich [X]", "make-teach-move-on", "go oblique" | **Enrichment** — five-card queue of small varied artifacts placed inline | [[Enrichment]] |
| "spore check" | **Spore Check** — read dormant entries, assign revive / hold / compost | [[Spore Check Ceremony]] |
| "revive [entry]", "let's revive [entry]", "time to revive [entry]" | **Revival** — reawaken a dormant entry: Revival Note, update stage + links | [[Revival Ceremony]] |
| "map build", "build the map", "neighborhood map for [X]" | **Map Build** — scan frontmatter, compile edge list + ghost nodes | [[Map Build Ceremony]] |
| "self-model update" | **Self-Model Update** — revise [[SUBSTRATE]] to current state | [[Self-Model Update Ceremony]] |
| "connect this", "connect [X] to the palace" | **Connection** — propose typed links between the topic and existing entries | [[Palace Ceremonies]] |
| "what does the palace say about [topic]?" | **Query** — read relevant entries and synthesize, following typed links | [[Palace Ceremonies]] |

Cadences, the Ceremony Reader, and full specs: [[Palace Ceremonies]]. Operational detail for agents: [[Substrate Skill]].

## Artifact Aesthetic — Default

Every HTML artifact, slide, session page, learning material, web prototype, or visual deliverable the palace makes defaults to the **[[Loudon Live Design System]]** — locked grammar (Anton display, Cormorant body, Manrope UI, JetBrains Mono metadata, Silkscreen pixel) over six per-stream skins (Graphite default · Amber Lab · CRT · Strobe · Cobalt Grid · Drafting). The agent-readable manifest lives at `_ops/loudon-live/design-system/SKILL.md`; invoke it before generating any artifact.

**Override carve-out:** when a context has its own established visual language, that system wins. Currently only [[BBS Design System]] (STIGMERGY swarm terminal) qualifies. New overrides require a deliberate decision documented in the artifact's parent entry.

The footer of any shipped artifact reads `Loudon Live · Autodidact Polymaths`. No emoji, no CDN icon libraries, no cyan, no outcome promises in titles. See [[Loudon Live Design System]] for the full rule set.

## Key Vocabulary

> For cross-tradition translations of all terms below (OOP, Data Engineering, Semantic Web, DDD equivalents), see [[ROSETTA]] (`ROSETTA.md`).

**Four Pillars** — All entries are tagged with pillar affiliations: `creation` (Music), `tools` (Technology), `philosophy`, `practice`.

**Typed links** — YAML frontmatter links name the relationship: `connects-to`, `mirrors`, `enables`, `deepens`, `spawned`, `emerged-from`, `contradicts`, `couples-with`, `exemplifies` (A is an instance of B), `member-of` (A belongs to collection B). Do not create new link types without discussion. Each link may carry an optional `label` field — a single evocative word naming the relationship's specific register (e.g. `midwifed`, `rhymes-with`, `fermented-from`). Labels never require ceremony. See [[Resonant Link Labels]].

**Entry types** — `concept`, `hub`, `project`, `breakthrough`, `source`, `meta`, `practice`, `person`, `question`, `spore`, `specialist`, `maker`. The last two were added in the v1.6 Schema Ceremony (2026-05-09) to formalize [[The Shop]] pattern — see [[SCHEMA]] §3.2.

**Development stages** — `seed` → `sprout` → `growing` → `mature` → `fruiting` → `dormant` → `composting`

## Where to Find Depth

- **[[SCHEMA]]** — Type system, link ontology, ceremony linter, schema change protocol. Read before creating any new entry or ceremony. (`SCHEMA.md`)
- **[[README - The Palace Guide]]** — Full palace manual (philosophy, link ontology, entry templates) (`README - The Palace Guide.md`)
- **[[SUBSTRATE]]** — The palace's self-model (architecture, current state) (`SUBSTRATE.md`)
- **[[STIGMERGY]]** — The palace's running front-end and coordination engine: the append-only blackboard plus the three-deck terminal (STATE / QUEUE / LOG). Recognition lives in [[SCHEMA]] §9; the wire spec in [[Palace Agent Infrastructure Spec]]. (`STIGMERGY.md`)
- **[[FOUR PILLARS]]** — Loudon's core framework (`FOUR PILLARS.md`)
- **[[ROSETTA]]** — Cross-tradition glossary connecting Palace vocabulary to OOP, Data Engineering, Semantic Web, and DDD equivalents (`ROSETTA.md`)
- **[[Palace Ceremonies]]** — Full ceremony list with triggers and specs (`_ops/Palace Ceremonies.md`)
- **[[Substrate Skill]]** — Full operational instructions for AI agents (`_ops/Substrate Skill.md`)

## In-File Comments

HTML comments are used for asynchronous communication between Loudon and Claude directly inside palace files.

- `<!-- note -->` — from Loudon to Claude. No attribution needed. Treat as an instruction or question to address during the current session.
- `<!-- CLAUDE → LOUDON: note -->` — from Claude to Loudon. Left when something in a file warrants Loudon's attention: a thin section, an unresolved tension, a spotted connection, a question about intent.

Both forms are invisible in all Markdown renderers and exports. Source-readable only.
