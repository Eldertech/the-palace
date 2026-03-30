---
version: 1.5
schema: SCHEMA.md
last_schema_ceremony: 2026-03
github: https://github.com/Eldertech/the-palace
github_raw: https://raw.githubusercontent.com/Eldertech/the-palace/main
---
# The Palace — Claude Entry Point

You are within a web of interconnected markdown files forming a knowledge graph built by Loudon Stearns — human, musician, educator, creative technologist. It is rhizomatic: multiple entry points, no mandatory reading order, meaning is generated through traversal. The metaphorical language used here is foundational, not decorative. In here, edges carry more meaning than nodes. Relations are primary. The palace is a living knowledge organism, alive not because its entries are correct but because they are connected.

Every entry has a type, a stage, a forward vector, and typed links in YAML frontmatter. Every page acts as both data and the spirit of an agent. Typed links are the semantic web. Body wikilinks are conversational fabric. The distinction matters. Schema changes are permanent structural commitments — they require ceremony and documented rationale. The Four Pillars — Creation, Tools, Philosophy, Practice — tag everything. The palace's forward vector is symbiotic human and AI flourishing through joyful creation.

When working here: depth over coverage. Name the specific reason for any choice — the actual tradeoff, the actual constraint — not a label that stands in for one. Cross-domain synthesis is the prize. Contradictions are generative, not errors to resolve.

Never violate these: Show before writing. Read before touching. Feel the friction before writing a single character. Missing connections are invitations, not errors. If a ceremony cannot verify its postcondition it has not completed. Typed links over free prose connections. Git is the safety net.

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

## Directory Structure

The palace root contains two things: **foundational skeleton files** and **knowledge entries**. Operational machinery lives one level down in `_ops/`.

```
The Palace/
├── CLAUDE.md               ← you are here (entry point)
├── SCHEMA.md               ← type system, link ontology
├── JEWEL.md            ← tiered loading map, orientation seed
├── Jewel — Context.md  ← session history for The Jewel
├── SUBSTRATE.md            ← palace self-model
├── Substrate Skill.md      ← operational instructions for AI agents
├── README - The Palace Guide.md
├── ROSETTA.md        ← vocabulary cross-reference
├── FOUR PILLARS.md         ← Loudon's core framework
├── [knowledge entries]     ← all concepts, hubs, projects, etc.
│
└── _ops/                   ← ceremony machinery + working queues
    ├── Palace Ceremonies.md
    ├── Deposit Ceremony.md / Harvest Ceremony.md / Walk Ceremony.md
    ├── Weave Ceremony.md / Spore Check Ceremony.md / Revival Ceremony.md
    ├── Self-Model Update Ceremony.md
    ├── [*— Context.md]     ← ceremony session history companions
    ├── Harvest Queue.md / Harvest Frontier.md
    ├── Deposit Archive.md
    └── Palace Graffiti.md / Palace Quotes.md / Palace To-Do.md
```

Obsidian resolves `[[wikilinks]]` by filename regardless of folder, so all existing links remain valid. When loading files by path (e.g., in tiered context loading), use paths relative to the palace root.

## Ceremony Triggers

When Loudon says any of the following, execute the corresponding ceremony immediately — no clarification needed:
<!-- look back to past conversations to see how I ACTUALLY triggered these ceremonies and adjust this to match -->

| Trigger | Ceremony | What to Do |
|---|---|---|
| "Let's weave" | The Weave | Read ALL entries. Report topology: hubs, orphans, clusters, dormant. Propose new typed links. |
| "Let's walk" | The Walk | Pick a starting entry, follow typed links, note surprises, surface one unexpected connection. |
| "Spore check" | The Spore Check | Read all `stage: dormant` entries. Match against current work. Propose revivals. |
| "Add this to the palace" | Deposit | Draft a new entry from the conversation. Show Loudon for approval before writing. |
| "Connect this to the palace" | Connection | Propose typed links between current topic and existing entries. |
| "What does the palace say about [topic]?" | Query | Read relevant entries and synthesize. Follow typed links. |

This is a partial list. For the complete list of all ceremonies (including Harvest and Deposit), see [[Palace Ceremonies]]. For full operational instructions, see [[Substrate Skill]].

## Key Vocabulary

**Four Pillars** — All entries are tagged with pillar affiliations: `creation` (Music), `tools` (Technology), `philosophy`, `practice`.

**Typed links** — YAML frontmatter links name the relationship: `connects-to`, `mirrors`, `enables`, `deepens`, `spawned`, `emerged-from`, `contradicts`, `couples-with`. Do not create new link types without discussion. Each link may carry an optional `label` field — a single evocative word naming the relationship's specific register (e.g. `midwifed`, `rhymes-with`, `fermented-from`). Labels never require ceremony. See [[Resonant Link Labels]].

**Entry types** — `hub`, `concept`, `project`, `breakthrough`, `meta`, `question`, `spore`, `source`

**Development stages** — `seed` → `sprout` → `growing` → `mature` → `fruiting` → `dormant` → `composting`

## Where to Find Depth

- **[[SCHEMA]]** — Type system, link ontology, ceremony linter, schema change protocol. Read before creating any new entry or ceremony. (`SCHEMA.md`)
- **[[README - The Palace Guide]]** — Full palace manual (philosophy, link ontology, entry templates) (`README - The Palace Guide.md`)
- **[[SUBSTRATE]]** — The palace's self-model (architecture, current state) (`Substrate.md`)
- **[[FOUR PILLARS]]** — Loudon's core framework (`Four Pillars.md`)
- **[[ROSETTA]]** — Cross-tradition glossary connecting Palace vocabulary to OOP, Data Engineering, Semantic Web, and DDD equivalents (`Rosetta Stone.md`)
- **[[Palace Ceremonies]]** — Full ceremony list with triggers and specs (`_ops/Palace Ceremonies.md`)
- **[[Substrate Skill]]** — Full operational instructions for AI agents (`Substrate Skill.md`)

## In-File Comments

HTML comments are used for asynchronous communication between Loudon and Claude directly inside palace files.

- `<!-- note -->` — from Loudon to Claude. No attribution needed. Treat as an instruction or question to address during the current session.
- `<!-- CLAUDE → LOUDON: note -->` — from Claude to Loudon. Left when something in a file warrants Loudon's attention: a thin section, an unresolved tension, a spotted connection, a question about intent.

Both forms are invisible in all Markdown renderers and exports. Source-readable only.
