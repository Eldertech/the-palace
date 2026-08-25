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
  - target: "[[SCHEMA — Context]]"
    type: spawned
    label: rationale-archive
---
	# SCHEMA — The Palace Type System

![[SCHEMA — hero.png]]

This is the authoritative TBox (type system) for the Palace. It defines what can exist here and how things can be related. Any human or AI operator must read this before creating new entries, proposing new link types, or modifying ceremony structure.

**Schema changes are permanent structural commitments.** They require a Schema Ceremony, documented rationale, and a version increment. Adding entries and editing content are routine. Changing the schema is not.

> The per-ceremony **change-history and rationale** (why the vocabulary is shaped as it is, v1.1→v1.15) live in the companion [[SCHEMA — Context]], kept out of this always-loaded card so an operating agent reads the current rules, not the archive. A Weave or a Schema Ceremony reads the *why* there.

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

**Use:** coordinators read `agency_profile` before spawning an enchanted agent — `tools` makes the resource estimate legible up front (and translates directly into a `RESOURCE_REQUEST`), `philosophy` informs a moderator's framing, `practice` names what the agent should revise in itself. Worked detail: [[SCHEMA — Context]] §3.1.
---

### 3.2 The `specialist` and `maker` Types

The operative definitions of these two types are in §1 (types) and §3 (type-specific fields) above. Their full design rationale — why not reuse `practice` or `meta`, why two types not one, the `pillars` and `stage` exceptions, the v1.6 validation, and the 2026-06-16 migration note — lives in [[SCHEMA — Context]] §3.2.

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

*(The v1.11 tightening — folding the full secondary-mirror set into this checklist and making the doc-drift linter a checkable postcondition — is recorded in [[SCHEMA — Context]] §5.)*

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

*(The v1.15 addition of the Closing Well Ceremony — the `close well` trigger — is recorded in [[SCHEMA — Context]] §6.)*

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

**Exception — code-folder READMEs.** A `README.md` that sits inside a code subfolder, beside the source it documents, keeps its conventional name rather than taking the `[Entry] — ` prefix. It is the folder's front-door file for non-Obsidian tooling (Finder, GitHub, editors), it is discovered by opening the folder rather than by wikilink traversal, and it carries no inbound wikilinks to break (a bare `[[README]]` could never resolve unambiguously anyway). It still carries minimal bundle frontmatter, so it stays self-describing.

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
| `plan` | The entry's materialized **work state** — open decisions, resolved decisions, a done trail — regenerated each steward cycle as the read-model of [[STIGMERGY]]'s append-only board. Maker-facing, high-churn; the steward owns it. Holds a *pointer* to the entry's `forward_vector`, never a copy (single-source-of-truth). One per stewarded entry. See [[Project Stewardship System]] and the Machinery/Content Split. |
| `staging` | The entry's **teaching arc** — stage-by-stage Loudon Live session plans, ordered by didactic difficulty. Learner-facing, relatively stable once designed; produced by [[project-stage-builder]] (and Loudon), not the steward. Only project entries bound for Loudon Live have one. The steward *reads* it but does not rewrite it — arc-level changes are flagged to Loudon, never silently edited. |
| `dossier` | The deep research corpus behind a `person` entry — timeline, positions, characteristic moves, lexicon, blindspots, sourced quotes, dispatch notes — loaded when an agent must *embody* the person faithfully (Dialectic, Excellent Adventure, Philosopher Visit). One per made citizen. See [[Making a Palace Citizen]]. |
| `speech` | Cited, **context-tagged** verbatim excerpts of how a `person` actually talks, opening with a "sources & their limits" ledger (spontaneous vs performative vs rehearsed vs fabricated), so an agent builds the voice profile from ground truth rather than a synthesis. Feeds the entry's `## Voice` note; loaded for voice embodiment in enchantment. See [[Making a Palace Citizen]] §Voice fidelity. |
| `toolbox` | The project's reproducible **environment manifest** — every runtime it needs and every version pinned (local apps like Blender/Ableton, language runtimes like a Python venv, RunPod pods, serverless worker images), plus their extensions/addons/nodes/packages, assets/models, deps, and a per-pipeline portability status (frozen→serverless-ready vs iterating→local/pod-only). The recipe to reproduce or build the project's tooling. Machine-actionable for the serverless case: the [[The Commons\|Commons]] provider is meant to read it to build/deploy. One per project with real compute/tooling. Template: `_ops/commons/TOOLBOX-TEMPLATE.md`. |
| `proof` | Evidence that a capability, postcondition, or design intent holds — a mock, retrospective, fit-test, handoff prompt, or worked demonstration owned by the entry it vindicates. The bundle-file echo of [[STIGMERGY]]'s `PROOF` message type (§9): a ceremony's or a build's "it worked." Often lives under a `proofs/` subfolder. |
| `spec` | A specification for one deliverable to be built or dispatched — a patch spec, visuals spec, SFX cue sheet, or imagery brief. The recipe for a single owned artifact, not the artifact itself; typically routed through [[The Shop]] / a Maker. |
| `dialectic` | An archived [[Dialectic]] / [[Excellent Adventure]] transcript owned by the entry it argued over — the recorded run of the palace's named dialogue mode, kept because it produced a distinction the parent did not already contain. Distinct from `dossier`/`speech` (research *about* a person) — this is the dialogue *itself*. |

New types may be tried freely. When a type earns recurring use across multiple bundles, add it to this table — additions to this open vocabulary are not Schema Ceremony events. Only structural changes to the bundle pattern itself are. The per-type addition history (what earned its slot when, and that a catch-all `artifact` type was considered and rejected) is in [[SCHEMA — Context]] §8.

*(The v1.14 ratification of the person-citizen conventions — the `dossier` bundle type, `agency_profile` as a `person` default, and the citizenship-`stage` clarification — is recorded in [[SCHEMA — Context]] §8.)*

**Archive:** Consumed bundle files move to `[Entry]/Archive/`. Stays with the entry; git carries history.

**Wikilink resolution:** Obsidian resolves `[[name]]` flatly across the vault regardless of folder. `[[Foo — baton]]` resolves to that file inside `Foo/` without special syntax. The flat-namespace constraint is exactly why bundle filenames must carry the entry prefix.

**Hubs:** The bundle pattern applies to hubs the same as any entry. Whether hub-bundle conventions diverge in practice is an open question deferred to use.

**The `Artifacts/` folder is deprecated (2026-06-16).** Bundles consumed its purpose. Entry-owned files (the vast majority) live in the owning entry's bundle; learning-material assets live in the Loudon Live zone (see [[Learning Materials and Canon]]). A genuinely cross-entry shared artifact — rare — lives in the bundle of its most-owning entry, or a relevant hub's bundle. The old `Artifacts/[Theme]/` content (the Shop tool outputs, the Loudon Live toolchain) was redistributed into bundles on 2026-06-16.

**Migration of existing flat companions:** Files like `Jewel — Context.md` and `Deposit Ceremony — Context.md` currently live flat in their parent's directory. They remain valid in their current location. Migration into bundles is queued for the next Weave per [[Palace To-Do]] — the Weave Ceremony's general scope includes fixing mis-located and mis-linked items.

---

## 9. The Coordination Schema ([[STIGMERGY]])

§4 types the edges *between entries*. This section types the edges *between agents*. The palace can be operated by more than one mind at once — multiple AI stewards and a human node — coordinating through **[[STIGMERGY]]**, the palace's running front-end and engine. An AI entering the palace may *be* a node in that swarm, or may be asked to read or post to its blackboard. It needs to recognize the grammar; the wire spec is this section (§9), and the executor that runs it is [[Palace Orchestrator]] (appending to the [[STIGMERGY]] board). Recognition and the wire live here; the executor lives there. Read [[Palace Orchestrator]] before posting.

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

The strict validator gates malformed posts. **§9 is the ratified enum set** — types and boards outside these tables are not part of the wire (see [[SCHEMA — Context]] §9 for the retired proposals).

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

*(The v1.10 addition of this §9 Coordination Schema and the v1.12 pinning of its field conventions are recorded in [[SCHEMA — Context]] §9.)*

---

*"The purpose of abstracting is not to be vague, but to create a new semantic level in which one can be absolutely precise."* — Edsger Dijkstra
