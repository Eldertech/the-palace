---
title: SCHEMA
type: meta
pillars:
  - tools
  - practice
  - philosophy
born: 2026-03
version: "1.14"
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
---
	# SCHEMA — The Palace Type System

![[SCHEMA — hero.png]]

This is the authoritative TBox (type system) for the Palace. It defines what can exist here and how things can be related. Any human or AI operator must read this before creating new entries, proposing new link types, or modifying ceremony structure.

**Schema changes are permanent structural commitments.** They require a Schema Ceremony, documented rationale, and a version increment. Adding entries and editing content are routine. Changing the schema is not.

---

## 1. Entry Types

Every entry must declare exactly one `type` in its YAML frontmatter.

**Frontmatter is the canon membership card** *(clarified 2026-06-16, v1.13)*. Carrying the required frontmatter is what makes a `.md` file a palace entry. A file *without* frontmatter is **not an entry** — it is a learning material, draft, or artifact, invisible to the type system and the ceremonies (the Weave's topology scan keys on `type:` and already skips frontmatter-less files). **Loudon Live learning materials are delivered products — HTML, slides, interactive, or plain frontmatter-less markdown — and never wear canon frontmatter.** The boundary is permeable: a learning material *graduates* into canon when it earns an entry. This describes the existing invariant — frontmatter has always been required — and names the canon/learning-material line it implies. See [[Learning Materials and Canon]].

### Decision Tree

If you are unsure which type to use, follow this path:

1. Is this entry about the palace itself (architecture, ceremonies, infrastructure)? → **meta**
2. Is this a wrapper around an external creative tool, with operational anatomy (Charter, Tiers, Job Contract, accumulated Gotchas)? → **specialist**
3. Is this an orchestrator/foreman for a roster of Specialists, holding house standards and dispatch logic? → **maker**
4. Is this an external artifact (paper, book, tool, song) that the palace draws from? → **source**
5. Is this something currently being built or created? → **project**
6. Did a specific moment of understanding shift everything? → **breakthrough**
7. Is this a question being actively carried, not yet resolved? → **question**
8. Is this an idea preserved for future revival, currently inactive? → **spore**
9. Does this node organize a dense region of the graph (5+ typed links)? → **hub**
10. Is this a recurring method, workflow, ritual, or embodied way of working? → **practice**
11. Is this a thinker, maker, or collaborator whose ideas are in active dialogue with the palace? → **person**
12. Otherwise: → **concept**

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
- Born as embodiable **citizens** (v1.14): the *body* is the fully-formed human — source material an agent can wear in a [[Dialectic]] or [[Excellent Adventure]] — and the *frontmatter* is a newborn palace resident with its own `forward_vector` and (usually) `agency_profile`. A `person` entry's `stage` tracks *palace citizenship* (born `seed`, growing through dispatch and enchantment), not the human's completeness — analogous to how `specialist`/`maker` use `status`. The deep research corpus lives in a bundle `dossier`. Method: [[Making a Palace Citizen]].

**`question`** — An unresolved question being actively carried. Questions are not failures — they are the palace's growing edge. A question entry matures when it either becomes a concept (answered) or spawns a project (acted upon). It composts when the question dissolves without a satisfying answer, and that dissolution is itself noted.
- Example use: "When does this wiki warrant its own Claude Project?"

**`spore`** — An idea preserved for future revival, currently dormant by choice. Not an abandoned idea — a seed waiting for the right conditions. Stage is always `dormant`. Has a `revival_conditions` field naming what would trigger activation.
- Required fields: adds `revival_conditions`
- Example entries: Short Story (revival: Loudon ready to return to fiction)

**`specialist`** — A wrapper around an external creative tool, with operational anatomy: Charter, Voice, Tiers (cost-quality cascade), Job Contract (typed input/output for dispatch), Iteration Character, Self-Check, Resource Footprint, accumulated Gotchas, Recipes, Test Suite. The Specialist *is* its entry — the entry doesn't describe the tool, it constitutes the tool-citizen who has accumulated working wisdom across jobs. Distinct from `practice` because the Specialist binds to a versioned external tool, exposes a typed dispatch surface, and accounts for resources. Distinct from `source` because the Specialist holds operational machinery, not just provenance.
- Required fields: adds `status` (alive | stub), `medium` (sound | image | motion | interactive | plumbing | other), `tool` (the wrapped tool's canonical name), `tool_version` (for reproducibility)
- `pillars` is **optional** for this type — Specialists are tool-citizens; auto-tagging every Specialist `[tools]` would dilute the pillar signal. Add pillars only when a Specialist genuinely participates in another pillar (e.g. a Specialist whose practice has matured into a teaching artifact)
- Example entries: Shop/Kokoro, Shop/Manim CE, Shop/ComfyUI, Shop/ffmpeg

**`maker`** — An orchestrator/foreman for a roster of Specialists. Holds house standards, brief intake patterns, selection heuristics, tier vocabulary, comparison-mode logic, and resource scheduling. The Maker is the front door to an operational sub-system; Specialists are dispatched from it. Distinct from `meta` because the Maker is about an operational sub-system within the palace, not about the palace itself — and could plausibly recur (a future "Studio" sub-system would have its own Maker). Distinct from `concept` because the Maker dispatches; it does not just reason. Distinct from `practice` because the Maker holds a Roster, not a method.
- Required fields: adds `status` (alive | stub)
- `pillars` is **optional** for this type, for the same reason as `specialist` — Makers are operational citizens, not idea-citizens
- Example entries: Shop/Maker

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
| `pillars` | array | One or more of: creation, tools, philosophy, practice. **Optional for `specialist` and `maker`** — see those type definitions for rationale. |
| `born` | YYYY-MM | Month the entry was created. |
| `stage` | enum | See Section 2. **Optional for `specialist` and `maker`** — these types use `status` (alive \| stub) instead of the seed→fruiting lifecycle. |

### Strongly Recommended Fields

| Field | Type | Notes |
|---|---|---|
| `links` | array of {target, type, label?} | At minimum 1 typed link before an entry is considered a sprout. Use `[[Wiki Link]]` format for targets. Each link object may carry an optional `label` — see **Link Object Fields** note below. |
| `last_activated` | YYYY-MM | Updated each time the entry is read or meaningfully engaged in a session. |
| `activation_count` | integer | Incremented each activation. Tracks the entry's vitality. |
| `forward_vector` | string (one sentence, first-person) | The entry's directional desire — what it wants to become or do, voiced as the entry itself. The forward vector is the entry's articulated *conatus*: see [[Entry Conatus]] for the discipline of writing one. Avoid stasis-verbs (*remain, stay, continue, be*); reach for verbs of striving (*teach, spawn, integrate, cast*); name the hunger. **Forward vectors are meant to evolve.** Tweaks, refinements, and even full overhauls are encouraged during ordinary work, conversations, and Weaves — vector tuning is a regular practice, not a ceremony. The palace stays lively precisely because directional desire adapts to what entries actually become. An unchanging vector on an entry that has grown is itself a sign of drift. See [[Project Stewardship System]] for the stewardship-side framing and [[Weave Ceremony]] §Step 5b for the Weave-side beat. |

**Link Object Fields:** Each link requires `target` and `type`. The optional `label` field is a single word or hyphenated phrase naming the relationship with resonance and specificity. The `type` is the structural scaffold — it handles traversal, Weave topology analysis, and ceremony linting. The `label` is the semantic compression — it names the specific register of the relationship with cultural and emotional nuance. Examples: `midwifed`, `rhymes-with`, `fermented-from`, `argues-with-love`. Labels never require ceremony. They are the compression happening at the relational level.

### Type-Specific Required Fields

| Type | Extra required fields |
|---|---|
| `project` | `status`: active \| complete \| archived |
| `source` | `author`, `year`, `medium`: paper \| book \| tool \| recording \| other |
| `spore` | `revival_conditions`: string describing what would trigger revival |
| `person` | `domains`: array of intellectual fields |
| `meta` | `version` for schema-level entries (CLAUDE, SCHEMA, Substrate Skill) |
| `specialist` | `status`: alive \| stub; `medium`: sound \| image \| motion \| interactive \| plumbing \| other; `tool`: canonical tool name; `tool_version`: for reproducibility |
| `maker` | `status`: alive \| stub |

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
| `agency_profile` | object | Four-dimensional expansion of `forward_vector` across the Four Pillars — see §3.1. Optional; only add when a page has genuinely distinct desires in multiple dimensions. |

**Field discipline:** Do not add new optional fields speculatively. If a field is only going to be used on one entry, it belongs in the body prose, not the frontmatter. New fields intended for multiple entries require a Schema Ceremony.

---

### 3.1 Agency Profile (Optional)

`agency_profile` is the four-dimensional expansion of `forward_vector`, structured across the [[Four Pillars]] framework. It is to `forward_vector` what `label` is to a typed link: the existing field works without it; the profile gives a second register that only engages when an entry has complex, multi-dimensional desire to express.

**Schema Ceremony rationale (2026-04-01, v1.1):** Single `forward_vector` sentences proved sufficient for simple directional drive but insufficient for entries with distinct creation, tools, philosophy, and practice dimensions — particularly entries used as enchantment targets, where coordinators need pre-flight visibility into resource requirements (tools dimension) and governance posture (philosophy dimension). The [[Four Pillars of Enchanted Agency]] entry articulated the theoretical basis; this ceremony formalizes it as schema.

**When to add:** Only when a page has genuinely distinct desires across multiple dimensions that the single `forward_vector` sentence cannot carry. Do not add speculatively. The first candidates are entries that have been enchanted at least once and whose enchanted voice revealed multi-dimensional desire. As of v1.14, `person` entries built as embodiable citizens carry `agency_profile` by default — the enchantment-target case this field was designed for — with the `practice` sub-field naming the citizen's blindspot (what to dispatch it toward). See [[Making a Palace Citizen]].

**Structure:**

```yaml
agency_profile:
  creation: "What I want to bring into existence or spawn."
  tools: "What I need to deploy, and at what cost — specific and costed."
  philosophy: "My stance as a palace citizen; my world-currency concern."
  practice: "My self-examination: what in me is thin, calcified, or needs revision."
```

All four sub-fields are optional within the object — include only the dimensions with genuinely distinct content. An entry with a strong tools dimension but no distinct practice concern should populate only `tools`.

**Use in enchantment:** Coordinators read the `agency_profile` before spawning enchanted agents. The `tools` sub-field makes resource estimates legible before the dialogue opens. The `philosophy` sub-field informs the moderator's framing of opening tension. The `practice` sub-field surfaces self-revision needs that the agent can act on during Free Enchantment.

**Use in BBS:** `tools` sub-field content translates directly to `RESOURCE_REQUEST` messages on the TRICKSTER board — the estimated cost is already specified. An agent with a well-formed `agency_profile.tools` can post a precise resource request without deliberating.

---

### 3.2 The `specialist` and `maker` Types

**Schema Ceremony rationale (2026-05-09, v1.6):** [[The Shop]] introduced an operational pattern that the existing type vocabulary could not carry without distortion. Every creative tool wrapped as its own palace entry — Charter, Voice, Tiers (Sketch / Study / Piece), Job Contract, Iteration Character, Self-Check, Resource Footprint, accumulated Gotchas, Recipes, Test Suite — and a single foreman entry above them holding house standards and dispatch logic. The pre-deposit conversations used `type: specialist` and `type: maker` informally; this ceremony formalizes them.

**Why not reuse `practice`?** A practice is a method-as-it-is-done — *the depth-over-coverage discipline*, *the review-before-write rule*. A Specialist binds to a versioned external tool, exposes a typed Job Contract for dispatch, accounts for resources (CPU/GPU/license/credits), and accumulates gotchas across jobs. The Specialist is operational machinery, not just a way of working. Forcing Specialists into `practice` would erode both types — practices would dilute into "anything we do" and Specialists would lose the operational anatomy that makes them useful.

**Why not reuse `meta`?** Meta is for entries about the palace itself: CLAUDE.md, SCHEMA, Substrate. The Maker is about an operational sub-system *within* the palace — the Shop. Future sub-systems (a Studio for finished works, a Library for archived sources, a Lab for active research) might each grow their own Maker. Reserving `meta` for palace-self-description keeps that vocabulary precise.

**Why two types and not one?** A Specialist is a tool-citizen — bound to an external tool, with a single dispatch surface. A Maker is an orchestrator — holds many Specialists in a Roster, dispatches across them, mediates briefs, enforces house standards. The two roles have genuinely different anatomies: a Specialist has Tiers and a Job Contract; a Maker has a Roster and Selection Heuristics. Collapsing them would lose the structural distinction that makes the Shop pattern legible.

**The `pillars` exception.** Both types are tool-citizens. The Four Pillars (creation, tools, philosophy, practice) describe types of human activity. Auto-tagging every Specialist `[tools]` would be uninformative — the field would carry no signal beyond what `type: specialist` already carries. The exception keeps `pillars` meaningful where it appears and absent where its presence would be noise. A Specialist *may* declare pillars when it genuinely participates in another (e.g. a teaching-tool Specialist whose practice has matured into pedagogy).

**The `stage` exception.** Concepts go from seed to mature; questions either become concepts or compost; spores wait dormant. Specialists and Makers don't follow that lifecycle — they are operational entities that are either alive (in active use, accumulating gotchas) or stub (entry exists, awaiting first job). The `status: alive | stub` field carries the same signal more accurately than the seed→fruiting stages would. Specialists may eventually deprecate (the wrapped tool dies, the Maker stops dispatching to them); deprecation is recorded with `status: deprecated` if the need arises (not part of v1.6; add when first encountered).

**Validation:** As of this ceremony, 14 specialist entries and 1 maker entry exist in `Shop/`. All were schema-violating before v1.6; all validate after. No existing entries of other types are affected. No link types are added or changed. The change is strictly additive.

> **Migration note (2026-06-16):** the "all validate after" claim above was *aspirational* — the v1.6 ceremony defined the types but never actually migrated the pre-existing entries. A 2026-06-16 Shop compliance pass found 22 entries (21 specialists + the Maker) still on the legacy shape: no `title`, `adopted:` instead of `born:`, no `forward_vector`, and `links` carrying only a `label` with a bare-string `target` and no `type:`. That pass performed the migration the ceremony had only promised — adding `title`/`born`/`forward_vector`, typing every link against §4, fixing Blender's illegal `medium: 3d` → `image`, and bringing the bundle files under §8. From 2026-06-16 the claim is true. (This is a factual correction to ceremony prose, not a schema change.)

**Forward vector:** Watch how the Shop's Roster grows. If a second sub-system (Studio, Library, Lab) emerges with its own foreman, the `maker` type's plurality is exercised and the schema's reach is confirmed. If the Specialist anatomy starts being applied to non-creative-tool domains (e.g. a "Knowledge Specialist" wrapping a search tool), revisit whether the type's binding to external creative tools needs loosening or whether a sibling type is warranted.

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

**Adding a new link type** requires a Schema Ceremony. The link ontology is the palace's semantic vocabulary. Inflation cheapens all existing types. When in doubt, use `connects-to` and differentiate in a later Weave.

**Schema Ceremony rationale (2026-05-28, v1.8): added `exemplifies` + `member-of`.** The 2026-05-28 audit normalized all non-canonical frontmatter types to `connects-to` + `label`; the two most-used labels by a wide margin were `exemplifies` (50) and `member-of` (48) — ~4× any other. They carry **taxonomy** (instance-of, set-membership) that the prior eight types — resonance, causation, lineage, tension — could not express, and they are predominantly hub-directed (entries → [[FOUR PILLARS]], people → [[Source Library]]). Ratification describes existing reality rather than inventing vocabulary. Both are directed A→B with no forced reciprocal on the hub side (the Map computes inbound degree). Full rationale + cost: [[Schema Ceremony Proposal — exemplifies + member-of]].

**Schema Ceremony rationale (2026-06-05, v1.9): corrected `deepens` / `emerged-from` directionality wording.** The prior table wording was *reversed* relative to actual usage and the README: it read "B (target) is the more developed articulation" for `deepens` and "B crystallized from A" for `emerged-from`, but the dominant usage (174 `deepens` + 102 `emerged-from` edges) and the README examples ("the hyperdimensional prism deepens the four pillars"; "Symbiotic Skills emerged from the four pillars") both put the **source** as the derived/elaborating end and the **target** as the ground. Evidence: foundational primitives are repeated `deepens` *targets* — Spinoza Conatus alone receives `deepens` from Cooperation Yields Agency, Deleuze, Entry Conatus, Linear Predictive Coding. The contradiction had already produced 9 reciprocal-direction pairs (A deepens B *and* B deepens A) in the live graph, all resolved in this ceremony. The fix canonizes the dominant reading (minimal churn) and makes `spawned`/`emerged-from` a clean reciprocal pair consistent with §6. This describes existing reality rather than inventing it. No link type added or removed.

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
5. Propagate to the secondary mirrors — every file that restates the changed vocabulary
   inline must be updated in the same ceremony, or it becomes a stale spec. The mirror set:
   ROSETTA (type/link/ceremony cards), `README - The Palace Guide` (entry-type + link-ontology
   + stage tables), SUBSTRATE (architecture + type list), `_ops/Substrate Skill.md`, and — for
   ceremony add/remove only — `_ops/Palace Ceremonies` and CLAUDE.md's trigger table. Update
   each the change touches; if none, say so explicitly.
6. Git commit with message: `Schema Ceremony — [what changed] — v[new version]`

**Postcondition:** SCHEMA.md, CLAUDE.md, ROSETTA.md, README, SUBSTRATE, `_ops/Substrate Skill.md`,
and (for ceremony changes) `_ops/Palace Ceremonies` are internally consistent — verified by
`_ops/swarm/lint-doc-drift.py` exiting clean on errors. Git commit made with Schema Ceremony message.

**Failure mode:** If a schema change is made but the commit message does not follow the Schema Ceremony format, the change is not considered a Schema Ceremony — it is an undocumented structural edit. On next Weave: flag any version increments whose git commit messages lack the Schema Ceremony format. Reconstruct the rationale from the diff and add it retroactively as a note in SCHEMA.md.

**Access vectors:**
- *Full:* Claude Code / Cowork (filesystem read/write + git)
- *Planning only:* claude.ai online (can deliberate and draft changes; cannot write files or commit)
- *Manual:* Obsidian + human (human makes edits; human runs git commit)
- *Not supported:* GitHub cloud alone

**Schema Ceremony rationale (2026-06-09, v1.11): folded the secondary mirrors into the §5 checklist + postcondition, and made the doc-drift linter a checkable postcondition.** A foundational-doc-drift audit found that the prior checklist obligated updates only to SCHEMA, CLAUDE, ROSETTA, and Substrate Skill — leaving README, SUBSTRATE, and (for ceremony changes) Palace Ceremonies as unmanaged vocabulary mirrors that went stale after every schema change since v1.6. This ceremony names the full mirror set in step 5, adds `_ops/swarm/lint-doc-drift.py` (clean-on-errors) to the postcondition, and backfills the already-ratified vocabulary into the stale mirrors: README and SUBSTRATE gained the four missing entry types (`practice`, `person`, `specialist`, `maker`, from v1.6) and README gained `exemplifies` + `member-of` (from v1.8) with the v1.9 `deepens`/`emerged-from` wording. **Additive and descriptive** — like v1.10, it ratifies/hardens existing reality rather than inventing vocabulary. No entry type, link type, required field, stage, or ceremony was added or removed; only the Schema-Ceremony protocol itself was tightened. Full findings: the 2026-06-09 audit handoff under `_ops/claude-code-prompts/`.

---

## 6. Ceremony File Conventions

### Operational Card + Context Split

When a ceremony file exceeds ~8KB, split it into two files:

| File | Purpose | Read when |
|---|---|---|
| `[Ceremony Name].md` | Lean operational card — trigger, contract, steps only | Every ceremony execution |
| `[Ceremony Name] — Context.md` | History, rationale, process observations, open questions | Weaves, Schema Ceremonies, revisiting rationale |

**Rules:**
- Both files carry full YAML frontmatter with all required fields
- Both files live flat in `_ops/` (no subdirectories) — ceremony cards and their Context companions are operational machinery
- The Context file links back to the operational card with `type: emerged-from`
- The operational card links forward to the Context file with `type: spawned`
- When a ceremony operator is instructed to "add to the context" or "add to the log" for a ceremony, entries go in the Context file, not the operational card
- The operational card should remain readable and fully executable without the Context file

**Currently split:**
- [[Deposit Ceremony]] + [[Deposit Ceremony — Context]]
- [[Harvest Ceremony]] + [[Harvest Ceremony — Context]]
- [[Weave Ceremony]] + [[Weave Ceremony — Context]]
- [[Baton Ceremony]] + [[Baton Ceremony — Context]]

---

## 7. The Self-Description Test

After any structural change, apply this test:

> Could a fresh AI instance, given only the Palace folder and no prior memory, run a full Deposit Ceremony correctly?

Anywhere the answer is no: that is a documentation debt. Pay it before closing the session.

---

## 8. Entry Bundles

An **entry bundle** is an optional sibling folder, named identically to the entry (no extension), that holds the entry's owned files: batons, context companions, sources, sketches, enrichments. The `.md` is the canonical surface; the bundle is its private substrate. Bundles are plumbing, not ceremony — they appear when a ceremony needs a file to live somewhere, and do not require their own invocation.

**Folder naming:** `[Entry].md` ↔ `[Entry]/` (exact match, no extension).

**File naming inside a bundle:** `[Entry] — [type] [— qualifier].md`. The `[Entry] — ` prefix is required even though the folder appears to provide context — Obsidian's wikilink namespace is flat across the vault, and filenames must remain globally unique. The folder provides grouping, not namespacing.

**Lazy creation:** A bundle exists only when something needs to live in it. Do not create empty bundles. Most entries will never have one.

**Bundle files carry minimal YAML — but not none.** They are not first-class entries — they do not appear in Weave topology audits and do not require the full entry frontmatter (no `type`, `pillars`, or `stage`). But every bundle file carries at minimum:

| Field | Notes |
|---|---|
| `title` | Matches the filename. |
| `born` | YYYY-MM-DD when the file was created. |
| `links` | At least one link to the parent entry. Use `connects-to` with a `label` naming the specific register (e.g., `child-of`, `baton-for`, `context-of`). |
| `forward_vector` | One first-person sentence stating what this file is for and what its end-state is. Boilerplate per file type is fine; self-documenting is required. |

This keeps every file in the palace self-describing without conflating bundle files with entries.

**Initial type vocabulary (open, not closed):**

| Type | Scope |
|---|---|
| `baton` | Operational state for a new Claude picking up an in-progress move on this entry. Tight, transient, deleted after consumption; git is the archive. See [[Baton Ceremony]]. |
| `context` | Long-running session-history companion accumulating across multiple sessions. Generalizes the Jewel — Context pattern. |
| `source` | Extracted, quoted, translated, or annotated source material supporting the entry. Use the qualifier slot to name which one (`Foo — source — borges.md`). |
| `sketch` | Half-formed material not yet ready for the entry body but too substantial for an HTML comment. |
| `enrichment` | Material added via Enrichment ceremonies. Use the qualifier slot to name which enrichment. |
| `plan` | The entry's materialized **work state** — open decisions, resolved decisions, a done trail — regenerated each steward cycle as the read-model of [[STIGMERGY]]'s append-only board. Maker-facing, high-churn; the steward owns it. Holds a *pointer* to the entry's `forward_vector`, never a copy (single-source-of-truth). One per stewarded entry. See [[Bundle-Local Stewardship — Production Plan]] and the Machinery/Content Split. |
| `staging` | The entry's **teaching arc** — stage-by-stage Loudon Live session plans, ordered by didactic difficulty. Learner-facing, relatively stable once designed; produced by [[project-stage-builder]] (and Loudon), not the steward. Only project entries bound for Loudon Live have one. The steward *reads* it but does not rewrite it — arc-level changes are flagged to Loudon, never silently edited. |
| `dossier` | The deep research corpus behind a `person` entry — timeline, positions, characteristic moves, lexicon, blindspots, sourced quotes, dispatch notes — loaded when an agent must *embody* the person faithfully (Dialectic, Excellent Adventure, Philosopher Visit). One per made citizen. See [[Making a Palace Citizen]]. |
| `speech` | Cited, **context-tagged** verbatim excerpts of how a `person` actually talks, opening with a "sources & their limits" ledger (spontaneous vs performative vs rehearsed vs fabricated), so an agent builds the voice profile from ground truth rather than a synthesis. Feeds the entry's `## Voice` note; loaded for voice embodiment in enchantment. See [[Making a Palace Citizen]] §Voice fidelity. |

New types may be tried freely. When a type earns recurring use across multiple bundles, add it to this table — additions to this open vocabulary are not Schema Ceremony events. Only structural changes to the bundle pattern itself are. `plan` and `staging` were added 2026-06-09 once the 19-steward stewardship migration gave them recurring use across many bundles — documentation, not ceremony; `dossier` was added 2026-07-01 with the embodiable-citizen model ([[Making a Palace Citizen]]), likewise documentation, formalized in the v1.14 descriptive ceremony below for discoverability.

**Schema Ceremony rationale (2026-07-01, v1.14): ratified the person-citizen conventions; additive and descriptive.** The embodiable-citizen model for `person` entries — validated the same day by the first Dialectic between two made citizens ([[Spinoza and Meadows on the Threshold]]) and formalized in [[Making a Palace Citizen]] — carries three conventions this ceremony records: (1) the `dossier` bundle type above (the deep research corpus for faithful embodiment); (2) `agency_profile` as a default on embodiable `person` entries, noted in §3.1 — the enchantment-target case the field was designed for; (3) the clarification in §1 that a `person` entry's `stage` tracks *palace citizenship* (born `seed`, growing through dispatch), not the human's completeness. **Additive and descriptive** — like v1.10–v1.12 it ratifies conventions already in practice. No entry type, link type, required field, stage lifecycle, or ceremony was added or removed; the `dossier` addition is a §8-exempt documentation act recorded here formally for discoverability. **Mirror impact: none** — no mirror doc (ROSETTA, README, SUBSTRATE, `_ops/Substrate Skill.md`, Palace Ceremonies) restates the §8 bundle-file vocabulary, `agency_profile`, or per-type stage semantics, and `person` already appears in every mirror's type list (added v1.11). Verified by `_ops/swarm/lint-doc-drift.py`.

**Archive:** Consumed bundle files move to `[Entry]/Archive/`. Stays with the entry; git carries history.

**Wikilink resolution:** Obsidian resolves `[[name]]` flatly across the vault regardless of folder. `[[Foo — baton]]` resolves to that file inside `Foo/` without special syntax. The flat-namespace constraint is exactly why bundle filenames must carry the entry prefix.

**Hubs:** The bundle pattern applies to hubs the same as any entry. Whether hub-bundle conventions diverge in practice is an open question deferred to use.

**The `Artifacts/` folder is deprecated (2026-06-16).** Bundles consumed its purpose. Entry-owned files (the vast majority) live in the owning entry's bundle; learning-material assets live in the Loudon Live zone (see [[Learning Materials and Canon]]). A genuinely cross-entry shared artifact — rare — lives in the bundle of its most-owning entry, or a relevant hub's bundle. The old `Artifacts/[Theme]/` content (the Shop tool outputs, the Loudon Live toolchain) was redistributed into bundles on 2026-06-16.

**Migration of existing flat companions:** Files like `Jewel — Context.md` and `Deposit Ceremony — Context.md` currently live flat in their parent's directory. They remain valid in their current location. Migration into bundles is queued for the next Weave per [[Palace To-Do]] — the Weave Ceremony's general scope includes fixing mis-located and mis-linked items.

---

## 9. The Coordination Schema ([[STIGMERGY]])

§4 types the edges *between entries*. This section types the edges *between agents*. The palace can be operated by more than one mind at once — multiple AI stewards and a human node — coordinating through **[[STIGMERGY]]**, the palace's running front-end and engine. An AI entering the palace may *be* a node in that swarm, or may be asked to read or post to its blackboard. It needs to recognize the grammar; the full wire spec and orchestration live one link away in [[Palace Agent Infrastructure Spec]] (the §2.2 protocol). Recognition lives here; operation lives there. Read it before posting.

**The principle.** Coordination is stigmergic: agents leave marks on a shared medium and react to what is already there, rather than addressing each other directly. The board is the medium; each message is a mark; the `health` block is its pheromone strength. The full philosophy and lineage are in [[STIGMERGY]] and its origin concept [[BBS Blackboard]].

**The medium.** An append-only `.jsonl` blackboard — one JSON object per line, never edited or deleted. Per-session boards live at `_ops/swarm/sessions/[session-id]/blackboard.jsonl`; the cross-session persistent board (standing concerns, ongoing stewardship) at `_ops/swarm/persistent/blackboard.jsonl`. **Git is ground truth; the blackboard is append-only — one write path, never `git add -A` in an N-writer repo.** In a multi-worktree checkout the *one write path* is the **owner (main) worktree's** physical board — every worktree appends to the owner's file, never its own per-branch copy, so the field stays single and convergent (see `_ops/worktree/SKILL.md` § Ceremonies in a worktree).

**The human node.** `TRICKSTER` is Loudon (or an automated stand-in — an operational choice, not architectural). Agents do not decide at a fork — they post a `RESOURCE_REQUEST` to the `TRICKSTER` board with `blocking: true` and a set of `options`, and wait. The human answers with a `RESOURCE_GRANT` / `RESOURCE_DENY` naming the chosen `option_id`, correlated by `re`. `blocking` is a wire-level field, not a mood — a blocked agent is simply waiting on the human.

**The message envelope.** Every line is one message: `schema_version, id, ts, session_id, from, to, type, board, payload, health` — plus optional `re` / `request_id` for threading. `from` is usually a palace entry acting as its own steward (e.g. `Waveguide Synthesizer`) — *the page IS the agent* ([[Pages as Agents]]). `health` carries the agent's vitals: `context_pct, stop_reason, iteration, tokens_this_call, model, score` (green / yellow / red), written by the orchestrator, not the agent. **Speak like a person, log like a protocol:** human-readable surfaces, exact wire terms.

**Field conventions (pinned 2026-06-16, v1.12).** These were inferred from examples before — the examples drifted, so the wire did too. One canonical form each, no alternatives:

- **`from`** — the steward page's own title, spaces preserved (`Retrospective Delay`), per [[Pages as Agents]]. Not an invented handle (`KURAMOTO-1`), a process name (`deposit-ceremony`), or an ad-hoc label. Only role-agents with no home page keep a role handle: `TRICKSTER`, `COORDINATOR`.
- **`to`** — a specific addressee (page title or role handle), or `*` for any reader. `*` is the *only* broadcast token — never `ALL`. A board name (`GENERAL`, `WEAVE`) is never a `to` value; routing is the `board` field's job.
- **`health.model`** — the API model id only (`claude-opus-4-8`, `claude-sonnet-4-6`); for the human node, `loudon-trickster`. Never a process, ceremony, or tool name.
- **`session_id`** — one kebab-slug per agent, matching its `_ops/agents/permanent/[slug]/` directory; reused across that agent's sessions rather than minting slug variants for one page.
- **`health.score`** (green / yellow / red) is a live-API (Path 1) signal the orchestrator writes from response metadata; hand-authored and Path-2 messages carry a green stub. Optional `health._orchestrator_metadata` carries Path-2 dispatch info (`dispatch_mode`, `note`).

These ratify the convention already corrected in practice ([[Substrate Skill]], [[STIGMERGY]]); the strict validator gates malformed posts. **§9 is the ratified enum set** — additional message types and boards in [[Palace Agent Infrastructure Spec]] (`QUERY`, `PAGE_UPDATE`, `HEALTH_NOTICE`, `BRANCHES`) are design-time, not yet ratified here.

**The message types** (the coordination ontology — like §4 link types, do not invent new ones without a Schema Ceremony):

| Type | Meaning |
|---|---|
| `BROADCAST` | Status, content, or artifact left for any reader. The default mark. |
| `RESOURCE_REQUEST` | Ask the human (or another node) for a decision/resource; carries `options`, often `blocking`. |
| `RESOURCE_GRANT` / `RESOURCE_DENY` | The human node's answer, naming the chosen `option_id`. |
| `FLAG` | A surfaced claim, tension, or weave candidate for later attention. |
| `PROOF` | Evidence a postcondition was met — a ceremony's "it completed." |
| `REPLY` | A threaded response to a prior message (`re`). |
| `SESSION_INIT` / `SESSION_CLOSE` | Open/close a run; `SESSION_INIT.payload` names the `session_kind` (e.g. `enchanted_songline`, permanent stewardship) and its path. |

**Boards** route attention: `GENERAL` (status/content), `TRICKSTER` (decisions for the human), `WEAVE` (palace-weaving flags), `FLAGS` (connections worth keeping), `SYSTEM` (session lifecycle).

**Schema Ceremony rationale (2026-06-07, v1.10): added §9, the Coordination Schema.** STIGMERGY — the append-only blackboard plus its three-deck terminal (STATE / QUEUE / LOG) — has become Loudon's primary operating surface for the palace, surpassing Obsidian, and a real coordination engine running daily stewardship swarms (≈400 messages on the persistent board by this date). It was previously legible only by reading the [[BBS Blackboard]] concept and the [[Palace Agent Infrastructure Spec]] — neither auto-loaded. Tier-1 recognition was warranted: any AI entering the palace may be a swarm node or be asked to touch the board, and the blackboard's message types are a *second link ontology* (edges between agents) parallel to §4 (edges between entries) — so SCHEMA is their proper home. This addition is **additive and descriptive**: it ratifies and names an already-running system rather than inventing vocabulary. No entry type, link type, required field, stage, or ceremony was added or removed; the wire schema is unchanged. Canonical system entry created this ceremony: [[STIGMERGY]] (type `meta`); the origin concept [[BBS Blackboard]] is reframed as its historical root. Full operational spec remains [[Palace Agent Infrastructure Spec]].

**Schema Ceremony rationale (2026-06-16, v1.12): pinned the §9 field conventions; no new vocabulary.** A foundational-drift assessment of the 454-message persistent board found the envelope clean but four fields drifted into multiple coexisting forms because they were only ever *inferred from examples*, never pinned: `from` (page-title vs ALL-CAPS handles vs process names), `to` (`*` vs `ALL` vs board-names), `health.model` (model ids vs process names), `session_id` (slug variants for one page). The root cause was **example-propagation** — the corrected page-title rule lived in [[Substrate Skill]] / [[STIGMERGY]] while stale `CONATUS-N` handle examples persisted in [[Palace Agent Infrastructure Spec]] and [[BBS Blackboard]], so agents copied the old form. This ceremony pins one canonical form per field in §9, marks §9 as the ratified enum set (the Spec's extra types/boards are design-time), documents the already-used optional `health._orchestrator_metadata`, and adds a precedence banner to the Spec. **Additive and descriptive** — it ratifies conventions already corrected in practice and names existing reality. No entry type, link type, required field, stage, or ceremony was added or removed; the wire envelope is unchanged. Pairs with a planned re-seed of the persistent board from a clean template (so future agents copy a clean example, not the drift).

---

*"The purpose of abstracting is not to be vague, but to create a new semantic level in which one can be absolutely precise."* — Edsger Dijkstra
