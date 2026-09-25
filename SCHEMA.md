---
title: SCHEMA
type: meta
pillars:
  - tools
  - practice
  - philosophy
born: 2026-03
version: "1.20"
stage: foundational
status: canonical
links:
  - target: "[[CLAUDE]]"
    type: enables
  - target: "[[README - The Palace Guide]]"
    type: deepens
  - target: "[[ROSETTA]]"
    type: mirrors
  - target: "[[Substrate Skill]]"
    type: enables
  - target: "[[Weave Ceremony]]"
    type: enables
  - target: "[[Harvest Ceremony]]"
    type: enables
  - target: "[[Deposit Ceremony]]"
    type: enables
  - target: "[[Resonant Link Labels]]"
    type: connects-to
  - target: "[[STIGMERGY]]"
    type: enables
    label: coordination-schema
  - target: "[[FOUR PILLARS]]"
    type: connects-to
  - target: "[[Four Pillars of Enchanted Agency]]"
    type: connects-to
  - target: "[[SCHEMA — Context]]"
    type: spawned
    label: rationale-archive
  - target: "[[SCHEMA — Reference]]"
    type: spawned
    label: writing-rules
---

# SCHEMA — The Palace Type System

![[SCHEMA — hero.png]]

The authoritative TBox for the Palace: what can exist here, and how things can be related. This card is
the **what exists** — the first thing an agent reads when it grows up ([[ELDER]]). A child recognizes the
palace without it; an elder reads it before touching the palace's structure.

**Before you write, read [[SCHEMA — Reference]].** The frontmatter fields (§3), the Schema Change
Protocol (§5), the ceremony-file conventions (§6), the entry-bundle spec (§8), and the [[STIGMERGY]]
coordination wire (§9) live there. They are the rules you need at the moment you create an entry, write
frontmatter, make a bundle file, post to the board, or change the type system — and at no other moment,
which is why they sit apart from this card (v1.18). Section numbers did not change; a `SCHEMA §8` pin still means
§8, now in the Reference. Do not write frontmatter from memory of this card.

**Schema changes are permanent structural commitments.** They require a Schema Ceremony
([[SCHEMA — Reference]] §5), documented rationale, and a version increment. Adding entries and editing
content are routine. Changing the schema is not.

> The **why** — every `v1.x` record, what changed in each section and the rationale behind it — lives in
> [[SCHEMA — Context]], keyed by section. A Weave or a Schema Ceremony reads it there. An operating agent
> reads the current rules, not the archive.

---

## 1. Entry Types

Every entry declares exactly one `type`. **Frontmatter is the canon membership card** — carrying it is what makes a `.md` file an entry. A file *without* frontmatter is not an entry but a learning material, draft, or artifact: invisible to the type system and the ceremonies. The boundary is permeable — a material graduates into canon when it earns an entry. See [[Learning Materials and Canon]].

### The types

Read the table top to bottom and take the first row that fits; `concept` is the default when none do. The **test** column is the question to ask — it replaces the decision tree this section used to carry separately. The **adds** column is the type's extra required fields, on top of the standard set (`title`, `type`, `pillars`, `born`, `stage`, `links`).

| type | use it when — the test | adds | example |
|---|---|---|---|
| `meta` | it is about the palace itself: architecture, ceremonies, infrastructure, self-model | `version` (schema-level entries and ceremonies) | [[SCHEMA]], [[SUBSTRATE]], [[CLAUDE]] |
| `specialist` | it wraps an external creative tool with operational anatomy — Charter, Tiers, Job Contract, accumulated Gotchas | `status` · `medium` · `tool` · `tool_version` | [[Shop/Kokoro]], [[Shop/ComfyUI]] |
| `maker` | it is a foreman for a roster of Specialists, holding house standards and dispatch logic | `status` | [[Shop/Maker]] |
| `source` | it is an external artifact the palace draws from — paper, book, tool, recording | `author` · `year` · `medium` | [[Meaning and the Link (2014)]] |
| `project` | it is being built, composed, or created; it has a temporal arc | `status` (active \| complete \| archived) | [[BLUELINE]], [[Loudon Live]] |
| `question` | it is an unresolved question being actively carried | — | *"When does the wiki warrant its own Project?"* |
| `spore` | it is an idea preserved for a later revival, dormant by choice (`stage` is always `dormant`) | `revival_conditions` | [[1 from 2]] |
| `hub` | it organizes a dense region of the graph — **not self-assigned**, earned at ≥5 inbound typed links via the Weave | — | [[FOUR PILLARS]], [[Kuramoto Coupling]] |
| `practice` | it is a recurring method, workflow, ritual, or embodied way of working — something you *do*, not an idea you hold | `version` (ceremonies) | [[Closing Well]], [[Deposit Ceremony]] |
| `person` | a thinker or collaborator whose ideas are in live dialogue with the palace — not every cited name | `domains` | [[Spinoza]], [[Brian Eno]] |
| `concept` | **the default.** An idea, principle, or framework the palace reasons with | — | [[Kuramoto Coupling]], [[Spinoza Conatus]] |

### Notes the table can't hold

**`hub` is earned and can be lost.** The Weave proposes promotion at ≥5 inbound typed links and demotion back to `concept` if the degree falls below. Never self-assign it.

**`person` entries are embodiable citizens** (v1.14). The *body* is the fully-formed human — source material an agent can wear in a [[Dialectic]] or [[Excellent Adventure]] — while the *frontmatter* is a newborn palace resident with its own `forward_vector` and usually an `agency_profile`. So a `person`'s `stage` tracks **palace citizenship** (born `seed`, growing through dispatch and enchantment), not the human's completeness — the same move `specialist` and `maker` make with `status`. The research corpus lives in a bundle `dossier`. Method: [[Making a Palace Citizen]].

**`specialist` and `maker` skip `pillars` and `stage`.** They are tool-citizens, not idea-citizens; auto-tagging every Specialist `[tools]` would dilute the pillar signal, and they use `status` (alive \| stub) rather than the seed→fruiting lifecycle. Add `pillars` only when one genuinely participates in another pillar. Why they are two types and not one: [[SCHEMA — Context]] §3.2.

**`meta` should stay few and high-quality.** These entries maintain the organism; inflation here is how a type system starts describing itself instead of the work.

**A ceremony carries its own `version`, whatever its type.** A ceremony is a page [[Palace Ceremonies]] names as a ceremony's full spec — most are `practice`, a few are `meta`. The version moves only when the spec changes; a run never moves it ([[SCHEMA — Reference]] §6).

*(`breakthrough` was retired in v1.17 — see [[SCHEMA — Context]] §1.)*

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

**`foundational`** is a reserved stage for palace meta-entries (CLAUDE, JEWEL, ELDER, SCHEMA, README, Substrate Skill) that are structural and do not follow the seed-to-mature lifecycle. These entries persist as long as the palace exists.

---

## 3. YAML Frontmatter Fields

**Moved to [[SCHEMA — Reference]] §3** — required, recommended, type-specific, and optional fields; the
`links` object shape; `agency_profile` (§3.1); the `specialist` / `maker` field rationale (§3.2). Read it
before writing any frontmatter.

---

## 4. The Typed Link Ontology

Links in YAML frontmatter are **curated and intentional** — the major neural tracts of the palace. Body text `[[wiki links]]` are casual and abundant. The distinction matters: frontmatter links are the semantic web; body links are the conversational fabric.

**Body-text link convention:** Any explicit mention of a known entry by its canonical title should use `[[wikilink]]` syntax in the body — this is especially important in structurally significant locations: Cross-Domain Resonance section headers, bold conceptual terms, and sentence-level references that name the connection explicitly. When a body-text `[[wikilink]]` appears in a structurally significant location, it should also have a corresponding YAML frontmatter link. Body mentions that are passing or historical do not require YAML registration, but should still use wikilink syntax so the Weave's Tier 1 audit can see them and make a deliberate inclusion/exclusion call.

Use only these relationship types:

| Link Type | Direction | Meaning | When to use |
|---|---|---|---|
| `connects-to` | symmetric | General proximity | Default. Use when the relationship is real but not yet named more precisely. With a `label`, this becomes a permanent named class — not a draft placeholder but a fully specified relationship carrying both topology and semantic register. |
| `mirrors` | symmetric | Deep structural identity across domains | When two things are the same pattern in different material. |
| `enables` | directed A→B | A is a precondition or generative force for B | When B could not exist or be understood without A. |
| `deepens` | directed A→B | A is a more developed articulation of B | When A extends or elaborates B (the more foundational idea) without replacing it. The source elaborates; the target is the ground. |
| `spawned` | directed A→B | A directly produced B as output | For traceable lineage: this session produced this entry. |
| `emerged-from` | directed A→B | A crystallized from B through synthesis | When A grew from B (the origin) but the relationship is diffuse, not direct. |
| `contradicts` | symmetric | Productive tension | Blake's contraries: both true, generative friction between them. |
| `couples-with` | symmetric | Mutual reinforcement, co-activation | Ideas always active together; Kuramoto-style coupling. |
| `exemplifies` | directed A→B | A is a concrete instance of the more general B | When an entry is a worked example or case of a principle, framework, or pattern (e.g. a Bridge → [[FOUR PILLARS]]). |
| `member-of` | directed A→B | A belongs to a named collection, family, or registry B | When an entry is a catalogued member of a set (e.g. a person → [[Source Library]]). |

**Directionality invariant.** For the lineage and taxonomy links, the source points *back toward its ground*: `deepens` → the more foundational idea it elaborates · `emerged-from` → the origin it grew from · `exemplifies` → the class it instances · `member-of` → the set it belongs to. Only `spawned` (origin → product) and `enables` (precondition → enabled) point *forward*. A collection/hub never emits `member-of` at its own members — membership is declared on the member side; the Map computes the hub's inbound degree. When unsure which way a directed link points, read it aloud as `source → type → target` and check the arrow; if it is still contestable, use `connects-to` + label rather than guess a directed type.

**The `label` field:** Each link object may carry an optional `label` — a single word or hyphenated phrase naming the relationship's specific register. The `type` handles topological traversal and ceremony linting; the `label` carries the semantic compression that makes a link generative rather than merely classificatory. A `mirrors` link may mirror in the register of `rhymes-with`, `echoes`, `refracts`, or `shadows` — these are not synonyms. A `contradicts` link may contradict in the register of `argues-with-love`, `mourns`, `refuses`, or `breaks-open`. Label vocabulary: lower-case, evocative over clinical, single word or hyphenated phrase. Suggested vocabulary per family lives in [[Resonant Link Labels]]. New labels never require ceremony.

**Adding a new link type** requires a Schema Ceremony. The link ontology is the palace's semantic vocabulary. Inflation cheapens all existing types. When in doubt, use `connects-to` and differentiate in a later Weave. (The v1.8 addition of `exemplifies` + `member-of` and the v1.9 `deepens`/`emerged-from` directionality correction are recorded in [[SCHEMA — Context]] §4.)

---

## 5. Schema Change Protocol (The Schema Ceremony)

**Moved to [[SCHEMA — Reference]] §5** — what triggers a ceremony, the six steps, the mirror set to
propagate to, the postcondition, and the access vectors.

---

## 6. Ceremony File Conventions

**Moved to [[SCHEMA — Reference]] §6** — the operational-card / `— Context` split at ~8KB, which
ceremonies are currently split, and how a ceremony keeps its version: the `version` field, the tuning
ledger, and what every run report carries.

---

## 7. The Self-Description Test

After any structural change, apply this test:

> Could a fresh AI instance, given only the Palace folder and no prior memory, run a full Deposit Ceremony correctly?

Anywhere the answer is no: that is a documentation debt. Pay it before closing the session.

---

## 8. Entry Bundles

**Moved to [[SCHEMA — Reference]] §8** — what a bundle is, folder and file naming, lazy creation, the
minimal frontmatter every bundle file carries, and the open type vocabulary (`baton`, `context`,
`dossier`, `proof`, `scroll`, `spec`, `tuning`, …).

---

## 9. The Coordination Schema ([[STIGMERGY]])

**Moved to [[SCHEMA — Reference]] §9** — the append-only blackboard, the human node (`TRICKSTER`), the
message envelope, the field conventions, the ratified message-type enum, and the boards.

What this card keeps: **the room may hold other agents.** The palace can be operated by several minds at
once — AI stewards plus a human node — coordinating by leaving marks on a shared board rather than
addressing each other directly. If you are asked to read or post there, read the wire spec first
([[SCHEMA — Reference]] §9); the executor is [[Palace Orchestrator]].

---

*"The purpose of abstracting is not to be vague, but to create a new semantic level in which one can be absolutely precise."* — Edsger Dijkstra
