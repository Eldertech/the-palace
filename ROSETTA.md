---
title: Rosetta Stone
type: meta
pillars:
  - tools
  - philosophy
  - practice
born: 2026-03
version: 1
stage: foundational
status: canonical
summary: Cross-tradition glossary connecting Palace vocabulary to OOP, Data Engineering, Semantic Web, Literate Programming, and Domain-Driven Design. The authoritative translation layer for any operator — human or AI — encountering the Palace for the first time.
links:
  - target: "[[SCHEMA]]"
    type: mirrors
  - target: "[[Substrate Skill]]"
    type: enables
  - target: "[[Meaning and the Link]]"
    type: emerged-from
  - target: "[[SUBSTRATE]]"
    type: deepens
---

# Rosetta Stone — Palace Vocabulary Across Traditions

![[Rosetta Stone — hero.png]]

This is a **meta-entry**: a document about the Palace itself. Its purpose is to ensure that any future operator — human or AI — can understand the Palace's architecture, vocabulary, and operating principles without prior context. It is the Palace's self-description.

---

## 1. What the Palace Is (In Every Language)

| Palace Name | OOP | Data Engineering | Semantic Web | Literate Programming | Domain-Driven Design |
|---|---|---|---|---|---|
| **The Palace** | A system of modules / a runtime | A Personal Knowledge Mesh | A personal triplestore / knowledge graph | A literate corpus | A Bounded Context |
| **A Palace Entry** | A class instance | A Data Product | An ontology instance (ABox assertion) | A literate document | An Entity |
| **An Entry Type** | A class definition | A data schema | A TBox type declaration | A document genre | An Aggregate type |
| **YAML frontmatter** | Constructor arguments / instance variables | Metadata schema | RDF properties | Document header | Value Object fields |
| **A typed link** | A pointer with a role label | A foreign key with relationship semantics | An RDF predicate / edge in a knowledge graph | A cross-reference | An Association with named role |
| **The link ontology** | The class hierarchy + interface contracts | The data model | The TBox (schema / type declarations) | The macro vocabulary | The Ubiquitous Language |
| **CLAUDE.md** | The `main()` entry point / package manifest | The `MLproject` file / operational contract | The ontology header | The root document | The context map |
| **SCHEMA.md** | The class library / type hierarchy | The data model spec | The full TBox | The genre definitions | The domain model |
| **_ops/Substrate Skill.md** | The method library / API reference | The runbook | The inference rules | The weaving instructions | The domain service definitions |
| **A Ceremony** | A method call | A pipeline run | A SPARQL query + update | A literate weave | A Domain Event handler |
| **Harvest Ceremony** | `extract()` | ETL ingestion pipeline | Graph population run | Source weaving pass | Collection phase |
| **Deposit Ceremony** | `insert()` / `commit()` | Data product materialization | ABox assertion batch | Document integration | Repository write |
| **Walk Ceremony** | `traverse()` | Graph traversal query | SPARQL path query | Hypertext navigation | Domain exploration |
| **Weave Ceremony** | `analyzeGraph()` | Topology report / lineage scan | Inferencing / entailment run | Structural analysis pass | Bounded context mapping |
| **Spore Check** | `audit()` / `gc()` | Data quality scan | Orphan node detection | Dead link check | Stale aggregate review |
| **Return** | `git log` since last session / `onResume()` | Changelog since last run | Delta since last crawl | Diff since last snapshot | Replay events since last checkpoint |
| **Schema Ceremony** | Refactoring / interface change | Schema migration | TBox update | Macro redefinition | Ubiquitous language revision |
| **Ceremony Linter** (lives in [[Palace Ceremonies]]) | A unit test suite for method contracts | A pipeline validation check | An ontology consistency check | A structural correctness test | A domain invariant check |
| **The Palace Keeper** | The runtime / interpreter | The pipeline orchestrator | The reasoner / triplestore engine | The literate programming tool | The domain expert / ubiquitous language guardian |
| **A Connection** | A method call between objects | A join / edge in a data graph | An RDF triple (subject–predicate–object) | A cross-reference | An Association |
| **The Deposit Archive** (frozen; the live deposit-journal is now the LOG deck — `Palace-Kind: deposit` commits) | A write-ahead log / commit journal | A pipeline run log | A provenance graph | A revision history | An event store |

---

## 2. The Entry Type System

For the authoritative decision tree and full definitions, see [[SCHEMA]]. This table is a quick-reference translation layer.

| Palace Type | What it is | OWL equivalent | DDD equivalent |
|---|---|---|---|
| `concept` | An idea, framework, or principle the Palace reasons with | Named class instance | Entity |
| `hub` | High-connectivity node (≥5 typed links) organizing a graph region | Well-connected named individual | Aggregate root |
| `project` | Something being built or created, with a temporal arc | Named individual with temporal extent | Aggregate root |
| `source` | An external artifact (paper, book, tool) the Palace draws from | Bibliographic assertion | External reference |
| `meta` | An entry about the Palace itself — architecture, ceremonies, infrastructure | Ontology annotation | Context map document |
| `practice` | A recurring method, ritual, or embodied way of working | Process pattern | Domain Service |
| `person` | A thinker whose ideas are in active dialogue with the Palace | Agent / foaf:Person | Actor |
| `question` | An unresolved question being actively carried | Open world assertion | Domain uncertainty |
| `spore` | A dormant idea preserved for future revival | Suspended named individual | Deferred aggregate |
| `specialist` | A wrapper around an external creative tool with operational anatomy (Charter, Tiers, Job Contract, Gotchas) | Class with method dispatch + accumulated state | Service / Adapter (with embedded knowledge) |
| `maker` | An orchestrator/foreman for a roster of Specialists, holding house standards and dispatch logic | Coordinator class / mediator | Aggregate root over Service Adapters |

---

## 3. The Core Architectural Concepts

### 3.1 Encapsulation
**Palace language:** Each entry is self-contained. A concept entry holds its own definition, connections, provenance, and status. You do not need to read other entries to understand what an entry *is*, only to understand what it *connects to*.

**OOP:** Encapsulation — bundling state and behavior inside a module boundary, exposing only a defined interface.

**Data Mesh:** Data Product autonomy — each product is independently operable, deployable, and discoverable.

**Palace rule:** Every entry must be operable standalone. If an entry requires external context to be understood, that context must be linked, not assumed.

---

### 3.2 Schema vs. Instance (TBox / ABox)
**Palace language:** The link ontology and entry type definitions are the *schema* (what things can be). Individual entries are the *instances* (what things are). Schema changes are high-ceremony events. Instance changes are routine.

**Semantic Web:** TBox (Terminological Box) = schema/type definitions. ABox (Assertional Box) = actual data/instances.

**Palace rule:** Never add a new entry type, link type, or YAML field without a Schema Ceremony. Treat schema changes as permanent structural commitments.

---

### 3.3 Open World Assumption
**Palace language:** Absence of a connection does not mean no connection exists. The Palace is always incomplete. Gaps are invitations, not errors.

**Semantic Web:** The Open World Assumption (OWA) — the default in RDF/OWL. Contrast with the Closed World Assumption of relational databases.

**Palace rule:** Never interpret a missing link as evidence of disconnection. Spore Check surfaces dormant entries as candidates for connection, not failures.

---

### 3.4 Self-Description
**Palace language:** The Palace describes itself. CLAUDE.md is the entry point. The Rosetta Stone is the translation layer. SCHEMA.md is the type system. Any operator — human or AI — should be able to pick up the Palace folder and operate it correctly using only what is inside.

**Data Mesh:** A Data Product must be self-describing — it carries its own interface, schema, quality guarantees, and operational instructions.

**Literate Programming:** The code and its explanation are the same document, written for human readers first.

**Palace rule:** Test of self-description: could a fresh AI instance with no prior context, given only the Palace folder, run a full Deposit Ceremony correctly? Where the answer is no, there is documentation debt.

---

### 3.5 Ceremonies as Methods with Contracts
**Palace language:** Each ceremony has a trigger, preconditions, protocol, and postconditions. Postconditions are checkable assertions, not aspirations.

**Design by Contract (Bertrand Meyer):** Methods carry preconditions, postconditions, and invariants. A method that cannot verify its postcondition has failed, even if it completed without error.

**Palace rule:** Every ceremony definition in `_ops/Substrate Skill.md` must include at least one postcondition. After each ceremony, verify it explicitly.

---

### 3.6 Versioning and Drift Prevention
**Palace language:** The Palace is under Git version control. CLAUDE.md carries a `version` field. Schema changes increment the version.

**Semantic versioning:** MAJOR.MINOR.PATCH. Schema changes = MAJOR. New ceremony types = MINOR. Entry additions and content edits = PATCH.

**Literate Programming (Knuth):** The code and explanation are formally entangled. If one changes, the other must change in the same commit. Silent drift is a structural failure.

**Palace rule:** When SCHEMA.md changes, CLAUDE.md's version must be incremented in the same commit. A mismatch is a red flag.

---

## 4. The Typed Link Ontology

Each link between entries carries a **predicate** — a named relationship type. The predicate is as important as the nodes it connects. This is the Semantic Web's core insight: edges are where meaning lives. (See [[Meaning and the Link]].)

| Link Type | Direction | Meaning | RDF/OWL analogy |
|---|---|---|---|
| `connects-to` | symmetric | Structural or conceptual proximity | `owl:related` |
| `mirrors` | symmetric | Same structure in different domains | `owl:equivalentClass` (loose) |
| `enables` | directed | A is a precondition or generative force for B | `schema:enablesAction` |
| `deepens` | directed | A is a more developed articulation of B (the ground) | `skos:broader` (target is the broader concept) |
| `spawned` | directed | A produced B as a direct output | `prov:wasDerivedFrom` |
| `emerged-from` | directed | A crystallized from B (the origin) through synthesis | `prov:wasInfluencedBy` |
| `contradicts` | symmetric | Productive tension | `owl:disjointWith` (loose) |
| `couples-with` | symmetric | Mutual reinforcement, co-constitution | `owl:complementOf` (loose) |
| `exemplifies` | directed | A is a concrete instance of the more general B | `rdf:type` |
| `member-of` | directed | A belongs to a named collection or family B | `skos:member` |

Each link object may carry an optional `label` field — a single word or hyphenated phrase naming the relationship's specific register. The `type` is the structural predicate (topological scaffold, traversal, ceremony linting). The `label` is the semantic compression (cultural nuance, emotional register, generative resonance). Examples: `midwifed`, `rhymes-with`, `fermented-from`, `argues-with-love`. In RDF terms, `label` functions like `skos:altLabel` applied to the predicate itself — it qualifies *how* the relationship holds, not *what kind* it is. Labels never require ceremony. See [[Resonant Link Labels]] for vocabulary per family.

### 4b. The Coordination Ontology (edges between agents)

The link ontology above types edges *between entries*. The Palace also has a second ontology, typing edges *between agents* on the [[STIGMERGY]] blackboard — ratified in [[SCHEMA]] §9. Where §4 is the static semantic web, this is the live message bus.

| Palace term | What it is | Cross-tradition equivalent |
|---|---|---|
| blackboard (`blackboard.jsonl`) | Append-only shared medium agents read/write | Blackboard pattern (AI); event log / append-only store; message bus |
| `BROADCAST` | A mark left for any reader | Publish (pub/sub) to a topic |
| `RESOURCE_REQUEST` / `RESOURCE_GRANT` / `RESOURCE_DENY` | Ask the human node for a decision; the answer | Request/response with human-in-the-loop; approval gate |
| `board` field | Self-selected routing channel | Topic / queue name |
| `health` block | Self-reported agent vitals on every message | Telemetry / liveness heartbeat |
| `TRICKSTER` | The human node at the threshold | Operator / supervisor in the control loop |
| stigmergy | Coordination via traces in a shared medium, no central router | Indirect coordination; pheromone/Grassé; eventually-consistent choreography (not orchestration) |
| `handoff_ready` (open baton) | A unit of continued work left on the board for any catcher | An **enqueued / ready** message in a work queue (SQS message; Beanstalkd `ready` job) |
| `handoff_picked_up` + `lifecycle: claim` | "I've caught it, starting" — card goes CLAIMED, stays visible | A **reservation / lease / in-flight** receive: SQS visibility-timeout, AMQP unacked delivery, Beanstalkd `reserved` |
| `handoff_closed` (cites the commit) | The only thing that retires a card — done is explicit, never inferred | An explicit **ack / DeleteMessage / commit-offset**; complete-or-re-baton ≈ a saga's compensating/forward-recovery step |
| the **fumble** (a claim that ages with no close) | A caught baton dropped mid-move, now *visible* rather than lost | A crashed consumer whose lease expires and the message redelivers; Airflow's **zombie task** |
| the board as append-only log; state = fold | STATE/QUEUE/LOG projected from the message stream | **Event sourcing / CQRS**; Kafka log + committed offset (vs a mutable delete-on-done queue) |
| reconciliation-before-work (`pickup-handoff.mjs`) | "This may already be done — check first" | The **idempotent consumer** guard that at-least-once delivery requires |
| the ladder's rungs 2–4 (lease-TTL · heartbeat-fade · dead-letter) | Deferred hardening of the lifecycle | Visibility-timeout, lease heartbeat, and a **dead-letter queue** — pheromone evaporation *is* lease-TTL. See [[STIGMERGY]] § Handoff Lifecycle |

### 4c. The Palace ↔ Claude Code (harness-speak)

§1 translates the palace into *conceptual* traditions (OOP, DDD, the Semantic Web). But the palace also runs on one concrete **operational substrate** — Claude Code, the harness — and the two vocabularies map directly. This is that dictionary. It is also where the realization that *a palace page and a harness skill are the same object* is recorded: [[Skills Are Enchantable Pages]].

| Palace | Claude Code (harness) | Note |
|---|---|---|
| **enchantable page / ceremony / specialist** — a page with a *dispatch surface* | a **skill** (`.claude/skills/<name>/SKILL.md`: `name` + `description` + body) | Same object. The one real difference: the harness *auto-fires* a skill by matching its `description`; a page waits for a reading Claude to notice its trigger. See [[Skills Are Enchantable Pages]]. |
| a **steward** — a page in `long_duration_background` mode, *looped* | a **scheduled / cron-fired agent** (the batch task invoking the orchestrator) | Same object as a skill, but the trigger is a *cadence* and the executor is the orchestrator; each cycle is one baton handoff. See [[Two Batons, One Board]], [[Project Stewardship System]]. |
| **enchant a page** / invoke a ceremony | **invoke a skill** / load a page into context | enchant = invoke = run-as-skill |
| a **trigger** (a ceremony word; a page's enchantment) | a skill's **`description`** (intent-matched by the harness) | different trigger substrate, same mechanism |
| a **face / mask** — a page run as an agent ([[Pages as Agents]]) | a **subagent** (an `agentType`) | the page brings the *who*, the model brings the thinking |
| the [[Concierge]] **dispatching a fresh mask** — do the work, hand it back, vanish | the **Agent tool** — spawn a subagent; its final message returns; its context is discarded | this *is* "hand it back and vanish" — the basis of context-offload |
| the **thin shim** — a `.claude/skills/…` file pointing at a canon page | a skill file used as a **pointer to the organ**, not the organ itself | canon page = organ; skill = one dispatch surface onto it |
| **CLAUDE.md** (the auto-loaded floor) | the project's **`CLAUDE.md`** — read into every session | not an analogy: literally the same file |
| the `_`-symlink **`@import`** block | **`@import`** in CLAUDE.md | harness-native mechanism |
| **Path 2 dispatch** (e.g. the `palace-orchestrator` skill) | **subagents via the Agent tool**, no API key required | how the palace runs agents without an Anthropic key |
| a **Baton** (session hand-off) | a fresh session / subagent **picking up a task**; session continuation | the palace adds the compression discipline the harness doesn't |
| the **[[STIGMERGY]] blackboard** | — *(no first-class harness equivalent — the palace built its own)* | an honest gap, not a translation |

The gap in the last row is the point: where the harness has a word, the palace should use the **shim** and not reinvent it; where it has none ([[STIGMERGY]]), the palace grew its own. That is the working lesson of [[Skills Are Enchantable Pages]].

**One harness anatomy under all of these.** However a dispatch surface is triggered — a harness `description`, a CLAUDE.md word, a cron cadence — the palace wraps the entry the same way: the **canon page is the organ**, shared **machinery lives in `_ops/`** (`_ops/concierge/`, `_ops/agents/permanent/[slug]/`, the orchestrator), a **thin trigger surface** fires it (the `.claude/skills/…` shim, a trigger row, a scheduled task), and **entry-specific working state lives in the bundle** (`[Entry] — plan.md`, with stage and `forward_vector` read live from frontmatter, never copied). That is the **Machinery/Content Split** — engine in ops, content with the entry. The [[Project Stewardship System]] is its most built-out instance; the [[Concierge]] is the same shape at a one-shot tempo.

---

## 5. Ceremony Reference Card

| Ceremony | Trigger phrase | Precondition | Core action | Postcondition |
|---|---|---|---|---|
| **Harvest** | "Let's harvest" | Source material exists | Find palace-worthy items using oblique approach; assign IDs | Worthy items identified and staged for deposit |
| **Deposit** | "Let's deposit" / "Add this to the palace" | Source material identified | Draft entry → review → write to palace → commit as `deposit(<id>):` with the synthesis in the commit body | Entry file exists; the commit self-classifies on the LOG deck (`Palace-Kind: deposit`) — no archive row (the [[Deposit Archive]] is frozen) |
| **Walk** | "Let's walk" | ≥1 entry with typed links | Follow typed links entry to entry, narrating connections | Path described; surprise named; metadata updated if needed; commit if files changed | [[Walk Ceremony]] |
| **Weave** | "Let's weave" | ≥5 entries + filesystem access | Orient to recent deposits → full topology report → propose links → propose stage transitions | Topology report produced; ≥3 links proposed; commit made | [[Weave Ceremony]] |
| **Return** | "I'm back" / "return" | a gap since the last session | Summon the companion; run the query block; show a return map; Loudon signs | Query block run before any interpretation; every map row cites a command or `file:line`; one re-entry move named; nothing written before the map is signed | [[Return Ceremony]] |
| **Spore Check** | "Spore check" | ≥1 dormant entry | Review all dormant entries; assign revive / hold / compost | Every dormant entry has a disposition; commit made | [[Spore Check Ceremony]] |
| **Revival** | "Let's revive [entry]" | Named entry is dormant; revival rationale is statable | Re-enter dormant entry; add Revival Note; update stage; add new typed links | Stage updated; Revival Note written; new links added; commit made | [[Revival Ceremony]] |
| **Baton** | "baton" / "pass the baton" / "baton this" | An in-progress move exists | Compress the session's operating state into a baton the next Claude can catch; write to the entry bundle | Baton written to `[Entry]/[Entry] — baton.md`; deleted on pickup (git is the archive) | [[Baton Ceremony]] |
| **Map Build** | "map build" / "build the map" / "neighborhood map for [X]" | ≥1 entry with frontmatter | Scan frontmatter; compile edge list + ghost nodes | Map artifact produced under `_ops/maps/` (or session dir) | [[Map Build Ceremony]] |
| **Enrichment** | "enrich" / "let's enrich" / "go oblique" / "make-teach-move-on" | A target entry to enrich | Five-card queue of small varied artifacts placed inline | Cards placed; entry updated | [[Enrichment]] |
| **Self-Model Update** | "Self-model update" | SUBSTRATE.md is readable; palace state has changed | Read current SUBSTRATE.md; compare to actual state; draft and apply corrections | SUBSTRATE.md reflects current reality; commit made | [[Self-Model Update Ceremony]] |
| **Schema Ceremony** | "Let's update the schema" | Current SCHEMA.md version on record | Deliberate → document rationale → update SCHEMA.md → bump CLAUDE.md version → propagate to mirrors (ROSETTA, README, SUBSTRATE, `_ops/Substrate Skill.md`; + `_ops/Palace Ceremonies` & CLAUDE.md trigger table for ceremony add/remove) | SCHEMA, CLAUDE, ROSETTA, README, SUBSTRATE, Substrate Skill internally consistent — `_ops/swarm/lint-doc-drift.py` clean on errors; commit made | [[SCHEMA]] |

*Connection and Query are informal ceremonies (no postcondition file); their triggers live in [[CLAUDE]]'s ceremony table.*

---

## 6. File Architecture Map

```
The Palace/
├── CLAUDE.md               ← Entry point. Read first. Contains: version, ceremony table, depth index.
├── SCHEMA.md               ← Type system (TBox). Authoritative list of entry types, link types, YAML fields, Ceremony Linter.
├── ROSETTA.md              ← This file. Cross-tradition glossary. Self-description.
├── README - The Palace Guide.md  ← Philosophy, founding principles, palace manual.
├── [Content entries]       ← concept, hub, project, source, practice, person, question, spore, specialist, maker entries
│
├── Shop/                   ← Operational sub-system: specialist + maker entries (added v1.6, 2026-05)
│
└── _ops/                   ← Ceremony machinery + working queues. All ceremony files, their context companions, and palace operational queues live here.
    ├── Substrate Skill.md  ← Full ceremony protocols. Method library. Operational instructions.
    ├── Palace Ceremonies.md ← Canonical ceremony list with triggers and cadences.
    ├── Deposit Archive.md  ← Frozen pre-spec deposit record; deposits are now their commits (LOG deck).
    └── Palace To-Do.md     ← Active improvement queue for palace infrastructure.
```

---

## 7. Operating Invariants

These conditions must always be true, regardless of which ceremony is running or which operator is present.

1. **Show before writing.** No file is modified without the operator seeing the proposed change and approving it.
2. **Schema changes are permanent structural commitments.** Each requires documented rationale and a Schema Ceremony.
3. **Open world.** Missing connections are invitations, not errors.
4. **Self-description is the target.** The Palace must be operable by a fresh operator using only its contents.
5. **Postconditions are checkable.** If a ceremony cannot verify its postcondition, it has not completed.
6. **Compost without regret.** Thin or redundant entries are removed cleanly. Depth over coverage.
7. **Typed links over free prose connections.** When two entries are related, name the relationship type.
8. **Git is the safety net.** Every structural change is committed. The commit message names the ceremony.

---

## 8. Dependency Map

| Dependency | What it enables | Risk if lost | Mitigation |
|---|---|---|---|
| Obsidian | Graph visualization, local editing | Low — palace is plain markdown | Any markdown editor works |
| Google Drive | Cloud sync | Medium — primary cloud store | Git/GitHub is the canonical backup |
| Git / GitHub | Version control, history | Low | Regular pushes; local clone always current |
| Claude (AI) | Ceremony execution, reasoning | Medium | All ceremony protocols written in plain language; a human can run them |
| Filesystem MCP / Cowork | Bulk file operations | Low | Claude Code or any shell access substitutes |
| The Substrate Skill (claude.ai) | Trigger routing to palace | Low | CLAUDE.md is the real entry point; skill is a thin forwarding address |

**Design goal:** All dependencies in the Low column. Ceremonies should be runnable by a human with a text editor and no AI.

---

*"The purpose of abstracting is not to be vague, but to create a new semantic level in which one can be absolutely precise."* — Edsger Dijkstra

*"A map is not the territory it represents, but, if correct, it has a similar structure to the territory, which accounts for its usefulness."* — Alfred Korzybski

*"Ontology is the theory of what there is."* — W.V.O. Quine
