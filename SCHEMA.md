---
title: "SCHEMA"
type: meta
pillars: [tools, practice, philosophy]
born: 2026-03
version: 1.0
stage: foundational
status: canonical
links:
  - target: "[[CLAUDE]]"
    type: enables
  - target: "[[README - The Palace Guide]]"
    type: deepens
  - target: "[[Rosetta Stone]]"
    type: mirrors
  - target: "[[Substrate Skill]]"
    type: enables
---

# SCHEMA — The Palace Type System

This is the authoritative TBox (type system) for the Palace. It defines what can exist here and how things can be related. Any human or AI operator must read this before creating new entries, proposing new link types, or modifying ceremony structure.

**Schema changes are permanent structural commitments.** They require a Schema Ceremony, documented rationale, and a version increment. Adding entries and editing content are routine. Changing the schema is not.

---

## 1. Entry Types

Every entry must declare exactly one `type` in its YAML frontmatter.

### Decision Tree

If you are unsure which type to use, follow this path:

1. Is this entry about the palace itself (architecture, ceremonies, infrastructure)? → **meta**
2. Is this an external artifact (paper, book, tool, song) that the palace draws from? → **source**
3. Is this something currently being built or created? → **project**
4. Did a specific moment of understanding shift everything? → **breakthrough**
5. Is this a question being actively carried, not yet resolved? → **question**
6. Is this an idea preserved for future revival, currently inactive? → **spore**
7. Does this node organize a dense region of the graph (5+ typed links)? → **hub**
8. Is this a recurring method, workflow, ritual, or embodied way of working? → **practice**
9. Is this a thinker, maker, or collaborator whose ideas are in active dialogue with the palace? → **person**
10. Otherwise: → **concept**

---

### Type Definitions

**`concept`** — An idea, principle, or framework the palace reasons with. The default type. When in doubt, use this.
- Required fields: title, type, pillars, born, stage, links (≥1)
- Example entries: Kuramoto Coupling, Spinoza Conatus, Frequency-Time Duality

**`hub`** — A high-connectivity node that organizes a region of the graph. Not self-assigned — emerges through the Weave Ceremony when an entry accumulates ≥5 typed links.
- Promotion: during Weave, propose `type: hub` if threshold met
- Demotion: if connections fall below threshold, return to concept
- Example entries: Cooperation Yields Agency, Four Pillars

**`project`** — Something being built, composed, or created. Includes creative works, software tools, teaching series. Has a temporal arc: not yet started → active → complete → archived.
- Required fields: adds `status` (active | complete | archived)
- Example entries: Short Story, SYNCHRONIZE, VERSION

**`breakthrough`** — A specific moment when understanding shifted permanently. These are precious and rare. A concept that could have been discovered gradually is not a breakthrough. A moment where two previously unconnected ideas suddenly became one is.
- Caution: do not inflate. If uncertain, use concept.
- Example entries: Embeddings as Relational Meaning

**`source`** — A primary external artifact the palace draws from: a paper, book, tool, recording, or foundational document. Carries provenance (where it came from, when, why it matters here). Local archival preferred over external links.
- Required fields: adds `author`, `year`, `medium` (paper | book | tool | recording | other)
- Example entries: Meaning and the Link (2014)

**`meta`** — An entry about the palace itself: its architecture, ceremonies, infrastructure, self-model. These entries maintain the organism. Should be few and high-quality.
- Example entries: CLAUDE, README, Substrate, SCHEMA, Palace Ceremonies, Substrate Skill

**`practice`** — A recurring method, workflow, ritual, or embodied way of working. Distinct from concept (an idea you hold) and meta (an entry about the palace). Practices are things you do repeatedly that shape how you work.
- Required fields: standard set
- Example entries: depth-over-coverage discipline, composting thin entries, review-before-write rule, the Tao of deliberate incompleteness

**`person`** — A thinker, maker, or collaborator whose ideas are in active dialogue with the palace. Not every cited name — only those whose thinking has shaped the palace's structure, language, or direction. Carries intellectual biography relevant to the palace's concerns.
- Required fields: adds `born_year` (optional), `domains` (array of fields they work in)
- Example entries: Spinoza, Luhmann, Deleuze, Donna Haraway

**`question`** — An unresolved question being actively carried. Questions are not failures — they are the palace's growing edge. A question entry matures when it either becomes a concept (answered) or spawns a project (acted upon). It composts when the question dissolves without a satisfying answer, and that dissolution is itself noted.
- Example use: "When does this wiki warrant its own Claude Project?"

**`spore`** — An idea preserved for future revival, currently dormant by choice. Not an abandoned idea — a seed waiting for the right conditions. Stage is always `dormant`. Has a `revival_conditions` field naming what would trigger activation.
- Required fields: adds `revival_conditions`
- Example entries: Short Story (revival: Loudon ready to return to fiction)

---

## 2. Development Stages

Every entry has a `stage` in its YAML frontmatter reflecting its lifecycle. Stages are proposed by the operator and confirmed by Loudon. The Weave is the primary ceremony for stage transitions.

```
seed → sprout → growing → mature → fruiting → dormant → composting
```

| Stage | Meaning | Typical word count |
|---|---|---|
| `seed` | The idea has a name and a minimal body. Origin noted. | 50–150 words |
| `sprout` | A genuine definition exists. 1–2 typed links. | 150–400 words |
| `growing` | The idea has cross-domain connections. 3+ typed links. | 400–800 words |
| `mature` | The entry is stable, well-connected, unlikely to change fundamentally. | 800+ words or conceptually complete |
| `fruiting` | Actively generating new entries or connections. | Any stage can fruit. |
| `dormant` | Not currently active but preserved deliberately. | — |
| `composting` | Being broken down; nutrients being redistributed to other entries. | — |

**Composting protocol:** Before deleting any entry, mark it `stage: composting` for one Weave cycle. During the next Weave, confirm deletion or revive. This prevents accidental loss.

**`foundational`** is a reserved stage for palace meta-entries (CLAUDE, SCHEMA, README, Substrate Skill) that are structural and do not follow the seed-to-mature lifecycle. These entries persist as long as the palace exists.

---

## 3. YAML Frontmatter Fields

### Required Fields (every entry)

| Field | Type | Notes |
|---|---|---|
| `title` | string | The entry's canonical name. Must match the filename (minus .md). |
| `type` | enum | See Section 1. |
| `pillars` | array | One or more of: creation, tools, philosophy, practice |
| `born` | YYYY-MM | Month the entry was created. |
| `stage` | enum | See Section 2. |

### Strongly Recommended Fields

| Field | Type | Notes |
|---|---|---|
| `links` | array of {target, type} | At minimum 1 typed link before an entry is considered a sprout. Use `[[Wiki Link]]` format for targets. |
| `last_activated` | YYYY-MM | Updated each time the entry is read or meaningfully engaged in a session. |
| `activation_count` | integer | Incremented each activation. Tracks the entry's vitality. |

### Type-Specific Required Fields

| Type | Extra required fields |
|---|---|
| `project` | `status`: active \| complete \| archived |
| `source` | `author`, `year`, `medium`: paper \| book \| tool \| recording \| other |
| `spore` | `revival_conditions`: string describing what would trigger revival |
| `person` | `domains`: array of intellectual fields |
| `meta` | `version` for schema-level entries (CLAUDE, SCHEMA, Substrate Skill) |

### Optional Fields (used selectively)

| Field | Type | Notes |
|---|---|---|
| `confidence` | enum | hypothesis \| working \| established |
| `energy` | string | Qualitative: low / medium / high / very high |
| `hook_quality` | integer 1–10 | Teaching/communication hook strength |
| `beauty` | integer 1–10 | Aesthetic resonance |
| `who_leads` | string | human / AI / shared |
| `tags` | array | Free-form. Do not use as a substitute for typed links. |
| `summary` | string | One-sentence description. Used in Rosetta Stone and meta-entries. |
| `status` | enum | For project entries: active \| complete \| archived |

**Field discipline:** Do not add new optional fields speculatively. If a field is only going to be used on one entry, it belongs in the body prose, not the frontmatter. New fields intended for multiple entries require a Schema Ceremony.

---

## 4. The Typed Link Ontology

Links in YAML frontmatter are **curated and intentional** — the major neural tracts of the palace. Body text `[[wiki links]]` are casual and abundant. The distinction matters: frontmatter links are the semantic web; body links are the conversational fabric.

Use only these relationship types:

| Link Type | Direction | Meaning | When to use |
|---|---|---|---|
| `connects-to` | symmetric | General proximity | Default. Use when the relationship is real but not yet named more precisely. |
| `mirrors` | symmetric | Deep structural identity across domains | When two things are the same pattern in different material. |
| `enables` | directed A→B | A is a precondition or generative force for B | When B could not exist or be understood without A. |
| `deepens` | directed A→B | B is a more developed articulation of A | When B extends or elaborates A without replacing it. |
| `spawned` | directed A→B | A directly produced B as output | For traceable lineage: this session produced this entry. |
| `emerged-from` | directed A→B | B crystallized from A through synthesis | When B grew from A but the relationship is diffuse, not direct. |
| `contradicts` | symmetric | Productive tension | Blake's contraries: both true, generative friction between them. |
| `couples-with` | symmetric | Mutual reinforcement, co-activation | Ideas always active together; Kuramoto-style coupling. |

**Adding a new link type** requires a Schema Ceremony. The link ontology is the palace's semantic vocabulary. Inflation cheapens all existing types. When in doubt, use `connects-to` and differentiate in a later Weave.

---

## 5. Schema Change Protocol (The Schema Ceremony)

When any of the following change, a Schema Ceremony is required:

- Adding or removing an entry type
- Adding or removing a link type
- Adding a new required YAML field
- Changing the stage lifecycle
- Adding or removing a ceremony

**The Schema Ceremony steps:**

1. Propose the change with documented rationale
2. Review against existing entries: does this break or orphan anything?
3. Update SCHEMA.md
4. Update CLAUDE.md version field (increment MAJOR if breaking change, MINOR if additive)
5. Update the Rosetta Stone if affected
6. Update Substrate Skill.md if affected
7. Git commit with message: `Schema Ceremony — [what changed] — v[new version]`

**Postcondition:** SCHEMA.md, CLAUDE.md, Rosetta Stone, and Substrate Skill.md are internally consistent. Git commit made with Schema Ceremony message.

**Failure mode:** If a schema change is made but the commit message does not follow the Schema Ceremony format, the change is not considered a Schema Ceremony — it is an undocumented structural edit. On next Weave: flag any version increments whose git commit messages lack the Schema Ceremony format. Reconstruct the rationale from the diff and add it retroactively as a note in SCHEMA.md.

**Access vectors:**
- *Full:* Claude Code / Cowork (filesystem read/write + git)
- *Planning only:* claude.ai online (can deliberate and draft changes; cannot write files or commit)
- *Manual:* Obsidian + human (human makes edits; human runs git commit)
- *Not supported:* GitHub cloud alone

---

## 6. The Self-Description Test

After any structural change, apply this test:

> Could a fresh AI instance, given only the Palace folder and no prior memory, run a full Deposit Ceremony correctly?

Anywhere the answer is no: that is a documentation debt. Pay it before closing the session.

---

*"The purpose of abstracting is not to be vague, but to create a new semantic level in which one can be absolutely precise."* — Edsger Dijkstra
