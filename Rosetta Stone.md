---
title: "Rosetta Stone"
type: meta
pillars: [tools, philosophy, practice]
born: 2026-03
version: 1.0
stage: foundational
status: canonical
summary: "Cross-tradition glossary connecting Palace vocabulary to OOP, Data Engineering, Semantic Web, Literate Programming, and Domain-Driven Design. The authoritative translation layer for any operator — human or AI — encountering the Palace for the first time."
links:
  - target: "[[SCHEMA]]"
    type: mirrors
  - target: "[[Substrate Skill]]"
    type: enables
  - target: "[[Meaning and the Link (2014)]]"
    type: emerged-from
  - target: "[[Substrate]]"
    type: deepens
---

# Rosetta Stone — Palace Vocabulary Across Traditions

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
| **Substrate Skill.md** | The method library / API reference | The runbook | The inference rules | The weaving instructions | The domain service definitions |
| **A Ceremony** | A method call | A pipeline run | A SPARQL query + update | A literate weave | A Domain Event handler |
| **Harvest Ceremony** | `extract()` | ETL ingestion pipeline | Graph population run | Source weaving pass | Collection phase |
| **Deposit Ceremony** | `insert()` / `commit()` | Data product materialization | ABox assertion batch | Document integration | Repository write |
| **Walk Ceremony** | `traverse()` | Graph traversal query | SPARQL path query | Hypertext navigation | Domain exploration |
| **Weave Ceremony** | `analyzeGraph()` | Topology report / lineage scan | Inferencing / entailment run | Structural analysis pass | Bounded context mapping |
| **Spore Check** | `audit()` / `gc()` | Data quality scan | Orphan node detection | Dead link check | Stale aggregate review |
| **Schema Ceremony** | Refactoring / interface change | Schema migration | TBox update | Macro redefinition | Ubiquitous language revision |
| **Ceremony Linter** (lives in [[Palace Ceremonies]]) | A unit test suite for method contracts | A pipeline validation check | An ontology consistency check | A structural correctness test | A domain invariant check |
| **The Palace Keeper** | The runtime / interpreter | The pipeline orchestrator | The reasoner / triplestore engine | The literate programming tool | The domain expert / ubiquitous language guardian |
| **A Connection** | A method call between objects | A join / edge in a data graph | An RDF triple (subject–predicate–object) | A cross-reference | An Association |
| **The Harvest Log** | A write-ahead log / commit journal | A pipeline run log | A provenance graph | A revision history | An event store |

---

## 2. The Entry Type System

For the authoritative decision tree and full definitions, see [[SCHEMA]]. This table is a quick-reference translation layer.

| Palace Type | What it is | OWL equivalent | DDD equivalent |
|---|---|---|---|
| `concept` | An idea, framework, or principle the Palace reasons with | Named class instance | Entity |
| `hub` | High-connectivity node (≥5 typed links) organizing a graph region | Well-connected named individual | Aggregate root |
| `project` | Something being built or created, with a temporal arc | Named individual with temporal extent | Aggregate root |
| `breakthrough` | A specific moment when understanding shifted permanently | Provenance assertion | Domain Event |
| `source` | An external artifact (paper, book, tool) the Palace draws from | Bibliographic assertion | External reference |
| `meta` | An entry about the Palace itself — architecture, ceremonies, infrastructure | Ontology annotation | Context map document |
| `practice` | A recurring method, ritual, or embodied way of working | Process pattern | Domain Service |
| `person` | A thinker whose ideas are in active dialogue with the Palace | Agent / foaf:Person | Actor |
| `question` | An unresolved question being actively carried | Open world assertion | Domain uncertainty |
| `spore` | A dormant idea preserved for future revival | Suspended named individual | Deferred aggregate |

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

**Palace rule:** Every ceremony definition in Substrate Skill.md must include at least one postcondition. After each ceremony, verify it explicitly.

---

### 3.6 Versioning and Drift Prevention
**Palace language:** The Palace is under Git version control. CLAUDE.md carries a `version` field. Schema changes increment the version.

**Semantic versioning:** MAJOR.MINOR.PATCH. Schema changes = MAJOR. New ceremony types = MINOR. Entry additions and content edits = PATCH.

**Literate Programming (Knuth):** The code and explanation are formally entangled. If one changes, the other must change in the same commit. Silent drift is a structural failure.

**Palace rule:** When SCHEMA.md changes, CLAUDE.md's version must be incremented in the same commit. A mismatch is a red flag.

---

## 4. The Typed Link Ontology

Each link between entries carries a **predicate** — a named relationship type. The predicate is as important as the nodes it connects. This is the Semantic Web's core insight: edges are where meaning lives. (See [[Meaning and the Link (2014)]].)

| Link Type | Direction | Meaning | RDF/OWL analogy |
|---|---|---|---|
| `connects-to` | symmetric | Structural or conceptual proximity | `owl:related` |
| `mirrors` | symmetric | Same structure in different domains | `owl:equivalentClass` (loose) |
| `enables` | directed | A is a precondition or generative force for B | `schema:enablesAction` |
| `deepens` | directed | B is a more developed articulation of A | `skos:narrower` |
| `spawned` | directed | A produced B as a direct output | `prov:wasDerivedFrom` |
| `emerged-from` | directed | B crystallized from A through synthesis | `prov:wasInfluencedBy` |
| `contradicts` | symmetric | Productive tension | `owl:disjointWith` (loose) |
| `couples-with` | symmetric | Mutual reinforcement, co-constitution | `owl:complementOf` (loose) |

---

## 5. Ceremony Reference Card

| Ceremony | Trigger phrase | Precondition | Core action | Postcondition |
|---|---|---|---|---|
| **Harvest** | "Let's harvest" | Harvest Log exists and is current | Extract palace-worthy items from source conversations; assign IDs; log in Harvest Log | All items assigned IDs; Harvest Log row count matches item count |
| **Deposit** | "Let's deposit" / "Add this to the palace" | Harvest Log has undeposited items | Draft entry → review → write to palace → mark deposited in log | Entry file exists in palace; Harvest Log row marked deposited |
| **Walk** | "Let's walk" | ≥1 entry with typed links | Follow typed links entry to entry, narrating connections | Path described; surprise named; metadata updated if needed; commit if files changed | [[Walk Ceremony]] |
| **Weave** | "Let's weave" | ≥5 entries + filesystem access | Process queue → full topology report → propose links → propose stage transitions | Queue clear; topology report produced; ≥3 links proposed; commit made | [[Weave Ceremony]] |
| **Spore Check** | "Spore check" | ≥1 dormant entry | Review all dormant entries; assign revive / hold / compost | Every dormant entry has a disposition; commit made | [[Spore Check Ceremony]] |
| **Revival** | "Let's revive [entry]" | Named entry is dormant; revival rationale is statable | Re-enter dormant entry; add Revival Note; update stage; add new typed links | Stage updated; Revival Note written; new links added; commit made | [[Revival Ceremony]] |
| **Hibernation** | "Nothing left unsaid" | Deposit is complete | Write closing note; write hibernation queue record | Closing note in thread; queue record in `_hibernation_queue/`; deferred commit | [[Hibernation Ceremony]] |
| **Self-Model Update** | "Self-model update" | Substrate.md is readable; palace state has changed | Read current Substrate.md; compare to actual state; draft and apply corrections | Substrate.md reflects current reality; commit made | [[Self-Model Update Ceremony]] |
| **Schema Ceremony** | "Let's update the schema" | Current SCHEMA.md version on record | Deliberate on change → document rationale → update SCHEMA.md → update CLAUDE.md version → update Rosetta Stone | SCHEMA.md, CLAUDE.md, Rosetta Stone internally consistent; commit made | [[SCHEMA]] |

---

## 6. File Architecture Map

```
The Palace/
├── CLAUDE.md               ← Entry point. Read first. Contains: version, ceremony table, depth index.
├── SCHEMA.md               ← Type system (TBox). Authoritative list of entry types, link types, YAML fields, Ceremony Linter.
├── Substrate Skill.md      ← Full ceremony protocols. Method library. Operational instructions.
├── Rosetta Stone.md        ← This file. Cross-tradition glossary. Self-description.
├── README - The Palace Guide.md  ← Philosophy, founding principles, palace manual.
├── Harvest Log.md          ← Pipeline run journal. Source of truth for deposit queue.
├── Palace Ceremonies.md    ← Canonical ceremony list with triggers and cadences.
├── Palace To-Do.md         ← Active improvement queue for palace infrastructure.
└── [Content entries]       ← concept, hub, project, breakthrough, source, practice, person, question, spore entries
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
