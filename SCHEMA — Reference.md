---
title: SCHEMA — Reference
type: meta
pillars:
  - tools
  - practice
born: 2026-09
version: "1.18"
stage: foundational
status: canonical
links:
  - target: "[[SCHEMA]]"
    type: deepens
    label: unpacks
  - target: "[[SCHEMA — Context]]"
    type: connects-to
    label: sibling-archive
  - target: "[[STIGMERGY]]"
    type: enables
    label: coordination-schema
  - target: "[[Deposit Ceremony]]"
    type: enables
  - target: "[[Resonant Link Labels]]"
    type: connects-to
forward_vector: "I hold the writing rules the floor no longer carries, so an agent reads me at the moment it writes rather than at every boot."
---

# SCHEMA — Reference

The operating half of the palace type system. [[SCHEMA]] — the always-loaded floor card — carries what
**exists**: the entry types, the stages, the link ontology, the self-description test. This file carries
what you need at the moment you **write**: the frontmatter fields, the change protocol, the ceremony-file
and bundle conventions, and the coordination wire.

**Read this before** creating an entry, writing or editing frontmatter, creating a bundle file, posting to
the [[STIGMERGY]] board, or changing the type system. Not before holding a conversation — that is the
floor's job, and keeping this out of the floor is the point ([[SCHEMA — Context]] §Tiering, v1.18).

**Section numbers are load-bearing and unchanged.** Roughly 180 references across the palace pin
`SCHEMA §3` / `§5` / `§6` / `§8` / `§9`. Those sections live here now and keep their numbers; the floor
card keeps §1, §2, §4, §7 and leaves a pointer at each gap. A pin still resolves to the right rules.

The *why* — the per-section change history, every `v1.x` record — is in [[SCHEMA — Context]], keyed by
section, as it always has been.

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

### Enum values for the type-specific fields

Which types require which fields is the `adds` column in §1. The allowed values:

- `status` — `active | complete | archived` for `project`; `alive | stub` for `specialist` and `maker`
- `medium` — `paper | book | tool | recording | other` for `source`; `sound | image | motion | interactive | plumbing | other` for `specialist`
- `domains` — array of intellectual fields (`person`) · `revival_conditions` — string naming what would trigger revival (`spore`) · `tool` / `tool_version` — canonical tool name and pinned version, for reproducibility (`specialist`)

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

---

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
| `scroll` | The project's **front door** — a Now zone regenerated from [[STIGMERGY]]'s board on every look (open asks, answers not yet consumed, last shipped, stall, drift), Loudon's **Standing Orders** (never regenerated), and an append-only making trail keyed on message id, newest first. Markdown; machine-owned except the orders zone; one per active project. Replaced `plan` on 2026-09-23 — the plan carried decision state only and regenerated only on a cycle, so it lied whenever the steward slept. See [[The Scroll]], [[Project Stewardship System]]. |
| `staging` | The entry's **teaching arc** — stage-by-stage Loudon Live session plans ordered by didactic difficulty. Learner-facing, stable once designed; produced by [[project-stage-builder]], not the steward. The steward *reads* it and flags arc-level changes to Loudon rather than editing silently. |
| `dossier` | The deep research corpus behind a `person` entry — timeline, positions, characteristic moves, lexicon, blindspots, sourced quotes, dispatch notes — loaded when an agent must *embody* the person faithfully (Dialectic, Excellent Adventure, Philosopher Visit). One per made citizen. See [[Making a Palace Citizen]]. |
| `speech` | Cited, **context-tagged** verbatim excerpts of how a `person` actually talks, opening with a sources-and-their-limits ledger (spontaneous vs performative vs rehearsed vs fabricated), so voice is built from ground truth rather than synthesis. Feeds the entry's `## Voice`. See [[Making a Palace Citizen]] §Voice fidelity. |
| `toolbox` | The project's reproducible **environment manifest** — every runtime pinned (local apps, language runtimes, pods, worker images) plus extensions, assets, deps, and a per-pipeline portability status. Machine-actionable: the [[The Commons\|Commons]] provider reads it to build and deploy. One per project with real compute. Template: `_ops/commons/TOOLBOX-TEMPLATE.md`. |
| `proof` | Evidence that a capability, postcondition, or design intent holds — a mock, retrospective, fit-test, or worked demonstration. The bundle-file echo of [[STIGMERGY]]'s `PROOF` message type. Often under a `proofs/` subfolder. |
| `spec` | A specification for one deliverable to be built or dispatched — a patch spec, visuals spec, SFX cue sheet, or imagery brief. The recipe for a single owned artifact, not the artifact itself; typically routed through [[The Shop]] / a Maker. |
| `dialectic` | An archived [[Dialectic]] / [[Excellent Adventure]] transcript owned by the entry it argued over — kept because it produced a distinction the parent did not already contain. Distinct from `dossier`/`speech` (research *about* a person); this is the dialogue itself. |

New types may be tried freely. When a type earns recurring use across multiple bundles, add it to this table — additions to this open vocabulary are not Schema Ceremony events. Only structural changes to the bundle pattern itself are. The per-type addition history (what earned its slot when, and that a catch-all `artifact` type was considered and rejected) is in [[SCHEMA — Context]] §8.

**Archive:** Consumed bundle files move to `[Entry]/Archive/`. Stays with the entry; git carries history.

**Wikilink resolution:** Obsidian resolves `[[name]]` flatly across the vault regardless of folder. `[[Foo — baton]]` resolves to that file inside `Foo/` without special syntax. The flat-namespace constraint is exactly why bundle filenames must carry the entry prefix.

**Hubs:** The bundle pattern applies to hubs the same as any entry. Whether hub-bundle conventions diverge in practice is an open question deferred to use.

**The `Artifacts/` folder is deprecated (2026-06-16).** Bundles consumed its purpose; entry-owned files live in the owning entry's bundle. The redistribution history is in [[SCHEMA — Context]] §8.

**Flat companions** (e.g. `Jewel — Context.md`) remain valid where they are; migration into bundles is queued on [[Palace To-Do]].

---

---

## 9. The Coordination Schema ([[STIGMERGY]])

§4 types the edges *between entries*; §9 types the edges *between agents*. The palace can be operated by several minds at once — AI stewards plus a human node — coordinating through **[[STIGMERGY]]**. An agent here may *be* a node in that swarm, or be asked to read or post to its board, so it must recognize the grammar. **This section is the wire; [[Palace Orchestrator]] is the executor. Read that before posting.** The philosophy and lineage are in [[STIGMERGY]] and [[BBS Blackboard]]: agents leave marks on a shared medium and react to what is already there, rather than addressing each other directly — the board is the medium, each message a mark, the `health` block its pheromone strength.

**The medium.** An append-only `.jsonl` blackboard, one JSON object per line, never edited or deleted. Per-session boards at `_ops/swarm/sessions/[id]/blackboard.jsonl`; the cross-session persistent board at `_ops/swarm/persistent/blackboard.jsonl`. **Git is ground truth; one write path, never `git add -A` in an N-writer repo.** In a multi-worktree checkout that one path is the **owner (main) worktree's** physical board — every worktree appends there, never to a per-branch copy (`_ops/worktree/SKILL.md` § Ceremonies in a worktree).

**The human node.** `TRICKSTER` is Loudon (or an automated stand-in — operational, not architectural). Agents do not decide at a fork: they post a `RESOURCE_REQUEST` to the `TRICKSTER` board with `blocking: true` and a set of `options`, and wait. The human answers `RESOURCE_GRANT` / `RESOURCE_DENY` naming the chosen `option_id`, correlated by `re`. `blocking` is a wire field, not a mood — a blocked agent is simply waiting.

**The envelope.** `schema_version, id, ts, session_id, from, to, type, board, payload, health`, plus optional `re` / `request_id` for threading. `from` is usually a palace entry acting as its own steward — *the page IS the agent* ([[Pages as Agents]]). `health` carries `context_pct, stop_reason, iteration, tokens_this_call, model, score`, written by the orchestrator, not the agent. **Speak like a person, log like a protocol.**

**Field conventions (pinned 2026-06-16, v1.12).** These were inferred from examples before — the examples drifted, so the wire did too. One canonical form each, no alternatives:

- **`from`** — the steward page's own title, spaces preserved (`Retrospective Delay`), per [[Pages as Agents]]. Not an invented handle (`KURAMOTO-1`), a process name (`deposit-ceremony`), or an ad-hoc label. Only role-agents with no home page keep a role handle: `TRICKSTER`, `COORDINATOR`.
- **`to`** — a specific addressee (page title or role handle), or `*` for any reader. `*` is the *only* broadcast token — never `ALL`. A board name (`GENERAL`, `WEAVE`) is never a `to` value; routing is the `board` field's job.
- **`health.model`** — the API model id only (`claude-opus-4-8`, `claude-sonnet-4-6`); for the human node, `loudon-trickster`. Never a process, ceremony, or tool name.
- **`session_id`** — one kebab-slug per agent, matching its `_ops/agents/permanent/[slug]/` directory; reused across that agent's sessions rather than minting slug variants for one page.
- **`health.score`** (green / yellow / red) is a live-API (Path 1) signal the orchestrator writes from response metadata; hand-authored and Path-2 messages carry a green stub. Optional `health._orchestrator_metadata` carries Path-2 dispatch info (`dispatch_mode`, `note`).

The strict validator gates malformed posts, and **as of v1.17 the gate matches this table**: `QUERY`, `PAGE_UPDATE`, `HEALTH_NOTICE` and a `BRANCHES` board were design-time proposals the spec had always excluded while the validators quietly accepted them — none was ever posted, and all four were removed. **§9 is the ratified enum set**, in the code as well as here.

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
| `RETRACT` | Withdraw a prior message that was posted in error, naming it in `re` and giving a one-line reason. The board is append-only, so a mistake is corrected by *adding* the retraction, never by editing the line. Ratified v1.17 after a wrong-path `handoff_ready` had to be corrected by overloading `handoff_picked_up` plus a repost — workable, but it made a naive board reader hit the wrong path first. |

**Boards** route attention: `GENERAL` (status/content), `TRICKSTER` (decisions for the human), `WEAVE` (palace-weaving flags), `FLAGS` (connections worth keeping), `SYSTEM` (session lifecycle).

---

*"The purpose of abstracting is not to be vague, but to create a new semantic level in which one can be absolutely precise."* — Edsger Dijkstra
