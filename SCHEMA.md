---
title: SCHEMA
type: meta
pillars:
  - tools
  - practice
  - philosophy
born: 2026-03
version: "1.7"
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
  - target: "[[Four Pillars]]"
    type: connects-to
  - target: "[[Four Pillars of Enchanted Agency]]"
    type: connects-to
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

**When to add:** Only when a page has genuinely distinct desires across multiple dimensions that the single `forward_vector` sentence cannot carry. Do not add speculatively. The first candidates are entries that have been enchanted at least once and whose enchanted voice revealed multi-dimensional desire.

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
| `deepens` | directed A→B | B is a more developed articulation of A | When B extends or elaborates A without replacing it. |
| `spawned` | directed A→B | A directly produced B as output | For traceable lineage: this session produced this entry. |
| `emerged-from` | directed A→B | B crystallized from A through synthesis | When B grew from A but the relationship is diffuse, not direct. |
| `contradicts` | symmetric | Productive tension | Blake's contraries: both true, generative friction between them. |
| `couples-with` | symmetric | Mutual reinforcement, co-activation | Ideas always active together; Kuramoto-style coupling. |

**The `label` field:** Each link object may carry an optional `label` — a single word or hyphenated phrase naming the relationship's specific register. The `type` handles topological traversal and ceremony linting; the `label` carries the semantic compression that makes a link generative rather than merely classificatory. A `mirrors` link may mirror in the register of `rhymes-with`, `echoes`, `refracts`, or `shadows` — these are not synonyms. A `contradicts` link may contradict in the register of `argues-with-love`, `mourns`, `refuses`, or `breaks-open`. Label vocabulary: lower-case, evocative over clinical, single word or hyphenated phrase. Suggested vocabulary per family lives in [[Resonant Link Labels]]. New labels never require ceremony.

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
5. Update ROSETTA if affected
6. Update `_ops/Substrate Skill.md` if affected
7. Git commit with message: `Schema Ceremony — [what changed] — v[new version]`

**Postcondition:** SCHEMA.md, CLAUDE.md, ROSETTA.md, and `_ops/Substrate Skill.md` are internally consistent. Git commit made with Schema Ceremony message.

**Failure mode:** If a schema change is made but the commit message does not follow the Schema Ceremony format, the change is not considered a Schema Ceremony — it is an undocumented structural edit. On next Weave: flag any version increments whose git commit messages lack the Schema Ceremony format. Reconstruct the rationale from the diff and add it retroactively as a note in SCHEMA.md.

**Access vectors:**
- *Full:* Claude Code / Cowork (filesystem read/write + git)
- *Planning only:* claude.ai online (can deliberate and draft changes; cannot write files or commit)
- *Manual:* Obsidian + human (human makes edits; human runs git commit)
- *Not supported:* GitHub cloud alone

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
- Both files live flat in the palace root (no subdirectories)
- The Context file links back to the operational card with `type: emerged-from`
- The operational card links forward to the Context file with `type: spawned`
- When a ceremony operator is instructed to "add to the context" or "add to the log" for a ceremony, entries go in the Context file, not the operational card
- The operational card should remain readable and fully executable without the Context file

**Currently split:**
- [[Deposit Ceremony]] + [[Deposit Ceremony — Context]]
- [[Harvest Ceremony]] + [[Harvest Ceremony — Context]]
- [[Weave Ceremony]] + [[Weave Ceremony — Context]]
- [[Hibernation Ceremony]] + [[Hibernation Ceremony — Context]]

---

## 7. The Self-Description Test

After any structural change, apply this test:

> Could a fresh AI instance, given only the Palace folder and no prior memory, run a full Deposit Ceremony correctly?

Anywhere the answer is no: that is a documentation debt. Pay it before closing the session.

---

## 8. Entry Bundles

An **entry bundle** is an optional sibling folder, named identically to the entry (no extension), that holds the entry's owned files: handoffs, context companions, sources, sketches, enrichments. The `.md` is the canonical surface; the bundle is its private substrate. Bundles are plumbing, not ceremony — they appear when a ceremony needs a file to live somewhere, and do not require their own invocation.

**Folder naming:** `[Entry].md` ↔ `[Entry]/` (exact match, no extension).

**File naming inside a bundle:** `[Entry] — [type] [— qualifier].md`. The `[Entry] — ` prefix is required even though the folder appears to provide context — Obsidian's wikilink namespace is flat across the vault, and filenames must remain globally unique. The folder provides grouping, not namespacing.

**Lazy creation:** A bundle exists only when something needs to live in it. Do not create empty bundles. Most entries will never have one.

**Bundle files carry minimal YAML — but not none.** They are not first-class entries — they do not appear in Weave topology audits and do not require the full entry frontmatter (no `type`, `pillars`, or `stage`). But every bundle file carries at minimum:

| Field | Notes |
|---|---|
| `title` | Matches the filename. |
| `born` | YYYY-MM-DD when the file was created. |
| `links` | At least one link to the parent entry. Use `connects-to` with a `label` naming the specific register (e.g., `child-of`, `handoff-for`, `context-of`). |
| `forward_vector` | One first-person sentence stating what this file is for and what its end-state is. Boilerplate per file type is fine; self-documenting is required. |

This keeps every file in the palace self-describing without conflating bundle files with entries.

**Initial type vocabulary (open, not closed):**

| Type | Scope |
|---|---|
| `handoff` | Operational state for a new Claude picking up an in-progress move on this entry. Tight, transient, archived after consumption. See [[Handoff Ceremony]]. |
| `context` | Long-running session-history companion accumulating across multiple sessions. Generalizes the Jewel — Context pattern. |
| `source` | Extracted, quoted, translated, or annotated source material supporting the entry. Use the qualifier slot to name which one (`Foo — source — borges.md`). |
| `sketch` | Half-formed material not yet ready for the entry body but too substantial for an HTML comment. |
| `enrichment` | Material added via Enrichment ceremonies. Use the qualifier slot to name which enrichment. |

New types may be tried freely. When a type earns recurring use across multiple bundles, add it to this table — additions to this open vocabulary are not Schema Ceremony events. Only structural changes to the bundle pattern itself are.

**Archive:** Consumed bundle files move to `[Entry]/Archive/`. Stays with the entry; git carries history.

**Wikilink resolution:** Obsidian resolves `[[name]]` flatly across the vault regardless of folder. `[[Foo — handoff]]` resolves to that file inside `Foo/` without special syntax. The flat-namespace constraint is exactly why bundle filenames must carry the entry prefix.

**Hubs:** The bundle pattern applies to hubs the same as any entry. Whether hub-bundle conventions diverge in practice is an open question deferred to use.

**Relation to `Artifacts/`:** Cross-entry shared artifacts (HTML, images, audio) continue to live in `Artifacts/[Theme]/` per [[Deposit Ceremony]] §Filing structure. Bundles hold entry-owned files. When in doubt: if a file is owned by exactly one entry, it goes in that entry's bundle; if it serves several entries, it goes in `Artifacts/`.

**Migration of existing flat companions:** Files like `Jewel — Context.md` and `Deposit Ceremony — Context.md` currently live flat in their parent's directory. They remain valid in their current location. Migration into bundles is queued for the next Weave per [[Palace To-Do]] — the Weave Ceremony's general scope includes fixing mis-located and mis-linked items.

---

*"The purpose of abstracting is not to be vague, but to create a new semantic level in which one can be absolutely precise."* — Edsger Dijkstra
