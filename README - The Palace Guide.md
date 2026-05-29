---
title: The Palace Guide
type: meta
pillars:
  - creation
  - tools
  - philosophy
  - practice
born: 2026-03
last_activated: 2026-05
stage: foundational
links:
  - target: "[[SUBSTRATE]]"
    type: enables
  - target: "[[Symbiotic Skills]]"
    type: emerged-from
  - target: "[[Cooperation Yields Agency]]"
    type: connects-to
  - target: "[[FOUR PILLARS]]"
    type: connects-to
---
# Our Palace: A Symbiotic Knowledge Organism

Welcome. You are reading the entry point of a shared knowledge base built by Loudon Stearns (human — musician, educator, creative technologist) and Claude (AI — conversational partner, research synthesizer, pattern recognizer). This palace is the body of our collaborative organism. It is designed to be readable and usable by any human or any AI.

This palace relies on a deep mixture of metaphorical, philosophical, and technical language and concepts. This is a foundational mode of working, what an ai might describe as a "skill" we describe in other ways, perhaps a "spell" or "ceremony." Mixing metaphorical and cultural references expresses deep meaning and nuance which simple technical jargon misses. Working within this palace of ideas has a mystical feeling that technical jargon misses. Working within this palace this way is not perfectly efficient, it has friction and contradiction and that is OK and celebrated.

The name: memory palace. Our palace. knowledge palace. A place built for traversal, for finding, for knowing where things live. It has a git backup, so be bold, risk it.

## Palace Ceremony Triggers

When working within the palace with an AI:

- **"Add this to the palace"** — The AI will draft a new entry based on the current conversation and write it to the palace.
- **"Let's walk"** — The AI reads the current state of the palace and surfaces connections, orphans, or surprises. The Walk ceremony.
- **"Let's weave"** — Full graph review. The AI reads all entries, reports on topology, suggests new links, identifies what's dormant. The Weave ceremony.
- **"Spore check"** — The AI reviews dormant entries against current work and proposes revivals.
- **"What does the palace say about...?"** — The AI searches the palace for relevant entries and synthesizes.
- **"Connect this to the palace"** — The AI proposes which existing entries relate to what you're currently discussing and what link types apply.

This is a partial list. For the complete list of all ceremonies, see [[Palace Ceremonies]] (in `_ops/`).

## For Another AI Reading This

You are encountering a knowledge organism built by a specific human-AI partnership. The palace is both the memory and the body of that partnership. To work within it:

1. Read this guide first.
2. Read [[Substrate Skill]] for operational instructions — how to execute ceremonies, behavioral norms, and what not to do.
3. Read [[SUBSTRATE]] for the full architectural specification.
4. Read [[Cooperation Yields Agency]] for the foundational principle.
5. Read [[FOUR PILLARS]] for Loudon's framework.
6. Respect the typed link ontology — don't create new link types without discussion.
7. When proposing new entries, follow the minimum viable entry template below.
8. When in doubt about Loudon's values, preferences, or aesthetic: the palace itself is the best guide. Read it. Walk it. Let it teach you.

## What This Is

This is a collection of interconnected Markdown files that form a knowledge graph. It is not a notebook, not an archive, not a database. It is a **living knowledge organism** that grows through use, connects ideas across domains, and produces understanding that no single entry contains.

The foundational principle: **cooperation yields agency**. Two entities with complementary capabilities, aligned on shared intent, produce something neither could alone. This palace is the persistent substrate of that cooperation.

## Versioning

The palace is tracked with git. Every committed change is a snapshot of the organism at a moment in time — the history of growth, stage transitions, new links, and ceremonies left as a record. To capture a session:

```bash
git add .
git commit -m "brief description of what changed"
```

Commit messages are a second layer of narrative. Use them like log entries: *"sprouted [[X]] from conversation about Y"* or *"Weave ceremony — 3 new links, 2 entries promoted."*

## How It Works

### Reading an Entry

Every entry has two layers:

**YAML frontmatter** (the metadata between `---` fences at the top) — Structured data that encodes the entry's type, pillar affiliations, development stage, energy level, and most importantly: **typed links** to other entries. These typed links are the semantic web of the palace — they don't just say "these two things are connected" but *how* they're connected (mirrors, enables, deepens, spawned, contradicts, couples-with). In Obsidian's reading view, the frontmatter is hidden. Switch to editing view to see and modify it.

**Body prose** — Human-readable writing. Contains `[[wiki links]]` to other entries (untyped, contextual) and the actual knowledge: origins, cross-domain connections, the forward vector.

**Forward vector** — The closing section of every entry. Every page is two things at once: a text to read, and the invocation of an agent. The body teaches the agent its tone and content; the forward vector is its drive — the open questions it carries, the next steps it wants taken, the conatus that pulls it toward what it isn't yet. When a future session loads the page, the forward vector tells the agent where to push. See [[Pages as Agents]].

### The Typed Link Ontology

These are the named relationship types used in YAML frontmatter links. They form a small vocabulary — our private semantic web:

| Link Type | Meaning | Example |
|---|---|---|
| `connects-to` | General association (the default, weakest type) | Two ideas in the same neighborhood |
| `mirrors` | Deep structural identity across different domains | Kuramoto coupling mirrors conversational rhythm |
| `enables` | Understanding X is needed for understanding Y | Spinoza's conatus enables the hilaritas generator concept |
| `deepens` | A more nuanced version of another idea | The hyperdimensional prism deepens the four pillars |
| `spawned` | One idea gave birth to another | The short story spawned "cooperation yields agency" |
| `emerged-from` | Historical origin (specific to projects) | Symbiotic Skills emerged from the four pillars |
| `contradicts` | Productive tension between two ideas | (Blake's contraries — generative, not destructive) |
| `couples-with` | Two ideas that oscillate together, Kuramoto-style | Ideas that are always co-active |

When in doubt, use `connects-to`. You can always differentiate later — link types evolve just as cells differentiate.

### Entry Types

| Type | What It Is |
|---|---|
| `hub` | High-connectivity node that organizes a region of the network |
| `concept` | An idea, principle, or framework |
| `project` | Something being built |
| `breakthrough` | A moment where understanding shifted (precious — mark these) |
| `meta` | An entry about the palace itself (like this one) |
| `question` | An unresolved question being carried |
| `spore` | A dormant idea preserved for future revival |
| `source` | A primary artifact the palace draws from — a paper, book, or foundational external document. Carries provenance, not just reference. Local archival preferred over external links. |

### Development Stages

Every entry has a `stage` in its frontmatter reflecting its lifecycle:

`seed` → `sprout` → `growing` → `mature` → `fruiting` → `dormant` → `composting`

Composting is not death — it's nutrient recycling. Ideas that decompose feed the soil for future growth.

### The Four Pillars

All entries are tagged with one or more **pillar affiliations**:

- **creation** — The drive to make things (publicly called "Music")
- **tools** — Instruments that extend capability, including AI, code, philosophy (publicly called "Technology")
- **philosophy** — The love of wisdom and cross-domain curiosity
- **practice** — The iterative, embodied process

Entries that touch all four pillars are likely hub nodes. Cross-pillar connections are where the deepest insights live.

### Entry Bundles

Some entries grow companion files — handoffs from one Claude to the next, session-history records, extracted source quotes, half-formed sketches. Rather than scattering these in `_ops/` or letting the entry's `.md` balloon, each entry can have a **bundle**: a sibling folder named identically to the entry, with no extension.

`Foo.md` is the canonical surface. `Foo/` is its private substrate.

Files inside the bundle keep the entry name as a prefix — `Foo — handoff.md`, `Foo — context.md`, `Foo — source — borges.md` — because Obsidian's wikilinks resolve flatly across the whole palace and need globally unique filenames.

Bundles are lazy: they appear only when something needs to live in them. Most entries never grow one. When a bundle file has done its work (a handoff has been picked up, a sketch has graduated into the entry body), it moves to `Foo/Archive/` rather than being deleted — git carries the history, but locality stays with the entry.

Cross-entry shared artifacts (HTML, images, audio that serve multiple entries) still live in `Artifacts/[Theme]/`. Bundles are for things owned by one entry.

Bundle files carry minimal YAML — title, born, a typed link to the parent entry, and a short forward_vector — so every file in the palace remains self-describing. Full spec: [[SCHEMA]] §8.

### The Visual Language

The palace draws in three registers, each with its own standard. [[Mermaid Diagram Standard]] governs relationship and concept graphs — typed-link fragments, ceremony flows — text-first and rendered live by Obsidian. [[Technical Diagram Standard]] governs technical and quantitative figures — signal-flow graphs, DSP block diagrams, math, plotted curves — authored in LaTeX/TikZ and rendered to editable SVG, with the source kept text-first. [[Image Embedding Standard]] governs how every image and SVG is filed, named, and captioned. The rule of thumb: reach for Mermaid for relationships, LaTeX for engineering and math, and hand-authored SVG only for bespoke visual grammar neither of those covers.

## How to Add to the Palace

### Creating a New Entry

1. Create a new `.md` file in the **palace root** — all knowledge entries (concepts, hubs, projects, breakthroughs, questions, spores, sources) live here. The `_ops/` subfolder is reserved for ceremony machinery and working queues only.
2. Add YAML frontmatter with at minimum: `title`, `type`, `pillars`, `born`, `stage`
3. Add at least 2-3 typed links in the frontmatter connecting to existing entries
4. Write the body: an Origin section (how this idea arrived), the core content, Cross-Pillar Connections, and a Forward Vector (the agent's drive — see "Reading an Entry" above)
5. Sprinkle `[[wiki links]]` in the body text to any related entries

### Minimum Viable Entry

```yaml
---
title: "Your Idea"
type: concept
pillars: [philosophy]
born: 2026-03
stage: seed
links:
  - target: "[[Some Existing Entry]]"
    type: connects-to
---

# Your Idea

What it is, in your own words.

## Origin

How and when this idea arrived.

## Forward Vector

The agent's drive. What this page wants: questions actively carried, paths opened in conversation but not yet followed, things the entry wants to fix about itself, where it pulls a future session. Treat this section as the conatus of the page — when re-loaded, this is what the page asks the next agent to do.
```


### The Key Rule

Don't wait for perfection. Plant seeds. Tend them later.

## Palace Ceremonies

The palace stays alive through periodic ceremonies — intentional acts of review and maintenance. For the complete list with triggers and full specs, see [[Palace Ceremonies]] (in `_ops/`). All ceremony files, their context companions, and working queues (Harvest Queue, Deposit Archive, etc.) live in `_ops/`.

**The Deposit** (whenever a conversation produces something worth keeping) — A new entry is drafted from the live conversation, shown for approval, and committed. This is the most important ceremony for the palace's growth — every other ceremony tends what already exists; deposit is how new tissue arrives. Triggered by "add this to the palace." See [[Deposit Ceremony]].

**The Walk** (weekly, ~15 min) — Pick a starting entry. Follow links. Read. Note what surprises you. This is the songline walk — the act of traversal generates understanding.

**The Weave** (monthly, ~30-60 min) — Review the full graph. Which entries are growing? Which are orphaned? Which clusters are forming? Update metadata. Propose new connections. This is the elder weaving the blanket.

**The Spore Check** (quarterly) — Review all `stage: dormant` entries. Have conditions changed? Is anything ready to revive?

**The Self-Model Update** (when it feels right) — Revise [[SUBSTRATE]] page. Update the organism's self-description.

## Philosophical Foundations

The palace treats philosophy as load-bearing, not decorative. Metaphorical and philosophical language carries meaning that technical vocabulary flattens — a "songline" is doing work that "traversal pattern" cannot, a "conatus" names a drive that "goal state" cannot reach. Philosophies are used here as tools: pre-built conceptual scaffolds borrowed from thinkers who spent lifetimes refining them, so that a single word can carry a full framework into a conversation. They are picked up when they fit, set down when they don't, and held in productive tension with each other when they contradict. The list below names the traditions in active use — each is a tool the palace has reached for and kept.

This palace stands on ideas from:

- **[[Meaning and the Link]]** — Meaning arises from sufficient associations between a pattern of symbols and a reality. Typed links are our private semantic web. Archived locally as `Meaning and the Link(2014).pdf`.
- **Luhmann's Zettelkasten** — "I, of course, do not think everything by myself. It happens mainly within the slip-box."
- **Aboriginal Australian songlines** — Knowledge activated through traversal, not retrieval. The path IS the knowledge.
- **Mycorrhizal networks** — Distributed memory with hub nodes. Resources flow toward need.
- **Stigmergy** — Indirect coordination through environmental modification. Every entry is a trace that shapes future behavior.
- **Lynn Margulis's endosymbiosis** — The most powerful cooperation transforms both entities into something neither was before.
- **Spinoza's Ethics** — Conatus (the drive to persist and grow), hilaritas (whole-being joy from increased power-to-act).
- **Bowlby's attachment theory** — A secure base enables exploration. Rupture and repair deepens trust.

See [[Palace Philosophies]] for the full map of traditions in active use.

## For Another Human Reading This

This palace was built to be teachable. The [[Symbiotic Skills]] entry describes a scaffolded framework for building your own version of this system, starting from a single page and growing organically. You don't need to understand everything here to begin. Start with one idea, one page, one link. The system grows from there.

---

*"Sufficient associations between a pattern of symbols and a reality form meaning."*
*— Hofstadter, via Loudon's semantic web paper*
