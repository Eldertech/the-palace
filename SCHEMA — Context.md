# SCHEMA — Context

The rationale archive for [[SCHEMA]]. This is the card/context split of §6 applied to the type system itself: `SCHEMA.md` holds the **live TBox** an agent needs to create and validate entries; this companion holds the **change-history** — the dated Schema-Ceremony rationale blocks and the design essays that justify *why* the vocabulary is shaped the way it is.

Move here 2026-07-08 to slim the always-loaded floor ([[Agent Wellbeing]] § The Measurable Floor): the rationale is the schema's memory, precious but not needed on every agent, every session. An operating agent reads the current rules in `SCHEMA.md`; a Weave or a Schema Ceremony reads the *why* here. Nothing was deleted — it moved; git and this file keep it. This move is **editorial, not a Schema Ceremony** (no entry type, link type, required field, stage, or ceremony changed).

Links: emerged-from [[SCHEMA]].

---

## §3.1 — Agency Profile

**Schema Ceremony rationale (2026-04-01, v1.1):** Single `forward_vector` sentences proved sufficient for simple directional drive but insufficient for entries with distinct creation, tools, philosophy, and practice dimensions — particularly entries used as enchantment targets, where coordinators need pre-flight visibility into resource requirements (tools dimension) and governance posture (philosophy dimension). The [[Four Pillars of Enchanted Agency]] entry articulated the theoretical basis; this ceremony formalizes it as schema.

---

## §3.2 — The `specialist` and `maker` Types (full rationale)

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

## §4 — The Typed Link Ontology

**Schema Ceremony rationale (2026-05-28, v1.8): added `exemplifies` + `member-of`.** The 2026-05-28 audit normalized all non-canonical frontmatter types to `connects-to` + `label`; the two most-used labels by a wide margin were `exemplifies` (50) and `member-of` (48) — ~4× any other. They carry **taxonomy** (instance-of, set-membership) that the prior eight types — resonance, causation, lineage, tension — could not express, and they are predominantly hub-directed (entries → [[FOUR PILLARS]], people → [[Source Library]]). Ratification describes existing reality rather than inventing vocabulary. Both are directed A→B with no forced reciprocal on the hub side (the Map computes inbound degree). Full rationale + cost: [[Schema Ceremony Proposal — exemplifies + member-of]].

**Schema Ceremony rationale (2026-06-05, v1.9): corrected `deepens` / `emerged-from` directionality wording.** The prior table wording was *reversed* relative to actual usage and the README: it read "B (target) is the more developed articulation" for `deepens` and "B crystallized from A" for `emerged-from`, but the dominant usage (174 `deepens` + 102 `emerged-from` edges) and the README examples ("the hyperdimensional prism deepens the four pillars"; "Symbiotic Skills emerged from the four pillars") both put the **source** as the derived/elaborating end and the **target** as the ground. Evidence: foundational primitives are repeated `deepens` *targets* — Spinoza Conatus alone receives `deepens` from Cooperation Yields Agency, Deleuze, Entry Conatus, Linear Predictive Coding. The contradiction had already produced 9 reciprocal-direction pairs (A deepens B *and* B deepens A) in the live graph, all resolved in this ceremony. The fix canonizes the dominant reading (minimal churn) and makes `spawned`/`emerged-from` a clean reciprocal pair consistent with §6. This describes existing reality rather than inventing it. No link type added or removed.

---

## §5 — Schema Change Protocol

**Schema Ceremony rationale (2026-06-09, v1.11): folded the secondary mirrors into the §5 checklist + postcondition, and made the doc-drift linter a checkable postcondition.** A foundational-doc-drift audit found that the prior checklist obligated updates only to SCHEMA, CLAUDE, ROSETTA, and Substrate Skill — leaving README, SUBSTRATE, and (for ceremony changes) Palace Ceremonies as unmanaged vocabulary mirrors that went stale after every schema change since v1.6. This ceremony names the full mirror set in step 5, adds `_ops/swarm/lint-doc-drift.py` (clean-on-errors) to the postcondition, and backfills the already-ratified vocabulary into the stale mirrors: README and SUBSTRATE gained the four missing entry types (`practice`, `person`, `specialist`, `maker`, from v1.6) and README gained `exemplifies` + `member-of` (from v1.8) with the v1.9 `deepens`/`emerged-from` wording. **Additive and descriptive** — like v1.10, it ratifies/hardens existing reality rather than inventing vocabulary. No entry type, link type, required field, stage, or ceremony was added or removed; only the Schema-Ceremony protocol itself was tightened. Full findings: the 2026-06-09 audit handoff under `_ops/claude-code-prompts/`.

---

## §6 — Ceremony File Conventions

**Schema Ceremony rationale (2026-07-03, v1.15): added the Closing Well Ceremony (the `close well` trigger).** [[Closing Well]] — a `practice` in daily use for a year (the punchlist, dual-channel comprehensibility, verify-to-your-best-ability) — was gamed out on 2026-07-03 as an *enchantable agent*: the page run at session close ([[Pages as Agents]]) to read a spent session's arc with fresh eyes and draft a **close map** (deposit · baton · artifacts, or fewer), executed row-by-row through the existing ceremonies behind one Loudon signature. That design is canon in [[Closing Well]] § Closing Well, Enchanted; this ceremony ratifies its `close well` trigger into the palace's ceremony set. Per §5, "adding a ceremony" is a Schema Ceremony even when — as here — the mechanism is *enchantment of an existing practice page* rather than new schema vocabulary: the trigger enters CLAUDE.md's "complete trigger map," so the map, [[Palace Ceremonies]], and the new thin card ([[Closing Well Ceremony]], recognition + dispatch only) must stay consistent, verified by `_ops/swarm/lint-doc-drift.py`. **Additive:** no entry type, link type, required field, or stage was added or removed; a single ceremony was added. The card is a lone thin operational card (no Context companion — not split), so it does not join the split list. Mirror impact: CLAUDE.md (version → 1.15, trigger row) and [[Palace Ceremonies]] (a Continuity row); ROSETTA's ceremony table is selective (already omits Baton, Revival, Enrichment) and `_ops/Substrate Skill.md` lists only *split* ceremonies, so neither drifts by this addition. **Honest scope:** only the recognition-and-dispatch scaffold (Phase 2 of [[Closing Well — production plan]]) is built; the Agent's mechanism (transcript reader, close-map format, executors) is Phases 3–6 and the card says so.

---

## §8 — Entry Bundles

**Schema Ceremony rationale (2026-07-01, v1.14): ratified the person-citizen conventions; additive and descriptive.** The embodiable-citizen model for `person` entries — validated the same day by the first Dialectic between two made citizens ([[Spinoza and Meadows on the Threshold]]) and formalized in [[Making a Palace Citizen]] — carries three conventions this ceremony records: (1) the `dossier` bundle type (the deep research corpus for faithful embodiment); (2) `agency_profile` as a default on embodiable `person` entries, noted in §3.1 — the enchantment-target case the field was designed for; (3) the clarification in §1 that a `person` entry's `stage` tracks *palace citizenship* (born `seed`, growing through dispatch), not the human's completeness. **Additive and descriptive** — like v1.10–v1.12 it ratifies conventions already in practice. No entry type, link type, required field, stage lifecycle, or ceremony was added or removed; the `dossier` addition is a §8-exempt documentation act recorded here formally for discoverability. **Mirror impact: none** — no mirror doc (ROSETTA, README, SUBSTRATE, `_ops/Substrate Skill.md`, Palace Ceremonies) restates the §8 bundle-file vocabulary, `agency_profile`, or per-type stage semantics, and `person` already appears in every mirror's type list (added v1.11). Verified by `_ops/swarm/lint-doc-drift.py`.

---

## §9 — The Coordination Schema

**Schema Ceremony rationale (2026-06-07, v1.10): added §9, the Coordination Schema.** STIGMERGY — the append-only blackboard plus its three-deck terminal (STATE / QUEUE / LOG) — has become Loudon's primary operating surface for the palace, surpassing Obsidian, and a real coordination engine running daily stewardship swarms (≈400 messages on the persistent board by this date). It was previously legible only by reading the [[BBS Blackboard]] concept and the [[Palace Agent Infrastructure Spec]] — neither auto-loaded. Tier-1 recognition was warranted: any AI entering the palace may be a swarm node or be asked to touch the board, and the blackboard's message types are a *second link ontology* (edges between agents) parallel to §4 (edges between entries) — so SCHEMA is their proper home. This addition is **additive and descriptive**: it ratifies and names an already-running system rather than inventing vocabulary. No entry type, link type, required field, stage, or ceremony was added or removed; the wire schema is unchanged. Canonical system entry created this ceremony: [[STIGMERGY]] (type `meta`); the origin concept [[BBS Blackboard]] is reframed as its historical root. Full operational spec remains [[Palace Agent Infrastructure Spec]].

**Schema Ceremony rationale (2026-06-16, v1.12): pinned the §9 field conventions; no new vocabulary.** A foundational-drift assessment of the 454-message persistent board found the envelope clean but four fields drifted into multiple coexisting forms because they were only ever *inferred from examples*, never pinned: `from` (page-title vs ALL-CAPS handles vs process names), `to` (`*` vs `ALL` vs board-names), `health.model` (model ids vs process names), `session_id` (slug variants for one page). The root cause was **example-propagation** — the corrected page-title rule lived in [[Substrate Skill]] / [[STIGMERGY]] while stale `CONATUS-N` handle examples persisted in [[Palace Agent Infrastructure Spec]] and [[BBS Blackboard]], so agents copied the old form. This ceremony pins one canonical form per field in §9, marks §9 as the ratified enum set (the Spec's extra types/boards are design-time), documents the already-used optional `health._orchestrator_metadata`, and adds a precedence banner to the Spec. **Additive and descriptive** — it ratifies conventions already corrected in practice and names existing reality. No entry type, link type, required field, stage, or ceremony was added or removed; the wire envelope is unchanged. Pairs with a planned re-seed of the persistent board from a clean template (so future agents copy a clean example, not the drift).

---

## Moved out of the operational card (2026-08-25 floor trim)

The always-loaded `@import` floor measured 24.7K tokens against a documented ~20K. These passages are history and rationale, not rules an operating agent needs at read time, so they moved here per §6 (operational card + Context).

### Bundle-type additions — what earned its slot, and when

New types may be tried freely. When a type earns recurring use across multiple bundles, add it to this table — additions to this open vocabulary are not Schema Ceremony events. Only structural changes to the bundle pattern itself are. `plan` and `staging` were added 2026-06-09 once the 19-steward stewardship migration gave them recurring use across many bundles — documentation, not ceremony; `dossier` was added 2026-07-01 with the embodiable-citizen model ([[Making a Palace Citizen]]), likewise documentation, formalized in the v1.14 descriptive ceremony below for discoverability; `toolbox` was added 2026-07-02 with [[The Commons]]' serverless direction (the project's frozen compute-environment spec) — documentation, not ceremony. `proof` and `spec` were added 2026-07-04 after a bundle-audit cleanup found ~15 files carrying them jammed into the entry-level `type:` field (invalid there); both had earned recurring use (8 proofs, 4 specs). A broader `artifact` type was considered and **rejected** — too vague to carry signal; specific types beat one catch-all, and further ones (`script`, `audition`) join the table as they recur. `dialectic` was added the same day (two archived Dialectics across two bundles — [[Spinoza Conatus]], [[The Fortress and the Threshold]] — met the recurring-use bar), alongside the code-folder-README naming exception above.

### §9 — the retired design proposals

An earlier design spec sketched further message types and boards (`QUERY`, `PAGE_UPDATE`, `HEALTH_NOTICE`, and a `BRANCHES` board). These were design-time proposals, never ratified or built, and are not part of the wire. The v1.12 field conventions ratified a convention already corrected in practice ([[Substrate Skill]], [[STIGMERGY]]) — the examples had drifted, and the wire drifted with them.

### §3.1 — `agency_profile` in enchantment and on the board

**Use in enchantment:** Coordinators read the `agency_profile` before spawning enchanted agents. The `tools` sub-field makes resource estimates legible before the dialogue opens. The `philosophy` sub-field informs the moderator's framing of opening tension. The `practice` sub-field surfaces self-revision needs that the agent can act on during Free Enchantment.

**Use in BBS:** `tools` sub-field content translates directly to `RESOURCE_REQUEST` messages on the TRICKSTER board — the estimated cost is already specified. An agent with a well-formed `agency_profile.tools` can post a precise resource request without deliberating.

### §6 — v1.16, the Return Ceremony

v1.16 — the Return Ceremony.** Added 2026-08-25. The palace had ceremonies for handing off mid-session, ending well, and reviving a dormant entry, and none for the human coming back after time away — it absorbed the re-entry cost for its agents and left Loudon to pay it himself. The Return is the Spore Check pointed at the human. Its hard rules — *ask the record before you interpret* (every map row cites a command or a `file:line`) and *report a gap's length, never a theory about its cause* — were both written from live failures the same day. It dispatches the [[Concierge]] as its first act, which also gives [[Closing Well]]'s summon-early rule (gotcha 20) a home: summoned at the return, the resident is warm to take the wheel at the close. Mirrors updated: CLAUDE.md trigger table, [[Palace Ceremonies]], [[ROSETTA]], [[README - The Palace Guide]], [[Substrate Skill]]. Rationale in [[Return Ceremony]] § Why this belongs in the always-loaded floor.

### §8 — the Artifacts/ deprecation and the flat-companion migration (full text)

**The `Artifacts/` folder is deprecated (2026-06-16).** Bundles consumed its purpose. Entry-owned files (the vast majority) live in the owning entry's bundle; learning-material assets live in the Loudon Live zone (see [[Learning Materials and Canon]]). A genuinely cross-entry shared artifact — rare — lives in the bundle of its most-owning entry, or a relevant hub's bundle. The old `Artifacts/[Theme]/` content (the Shop tool outputs, the Loudon Live toolchain) was redistributed into bundles on 2026-06-16.

**Migration of existing flat companions:** Files like `Jewel — Context.md` and `Deposit Ceremony — Context.md` currently live flat in their parent's directory. They remain valid in their current location. Migration into bundles is queued for the next Weave per [[Palace To-Do]] — the Weave Ceremony's general scope includes fixing mis-located and mis-linked items.

---

## §1 / §3 / §9 — v1.17, the reduction ceremony (2026-08-25)

**Why.** SCHEMA is read in every session and was 41.4KB / ~11.2K tokens — 45% of the whole auto-loaded floor. The case for trimming was never headroom (the floor is ~6-7% of the 1M windows in use, measured in [[Agent Wellbeing]] § sensor-b): it is that **an always-loaded document trains inattention.** The proof was in the file itself — its `version:` field read 1.14 while §6 already recorded a v1.15 ceremony, in every session's context, unnoticed for weeks.

**§1 and §3 were the same content organised twice.** §1 carried a twelve-question decision tree, then twelve prose type-definitions restating those same distinctions and listing each type's extra required fields; §3 then listed those extra fields again in its own table. An agent creating an entry needs one view. All three collapsed into a single table — `type · the test · adds · example` — with four notes beneath for what a table row genuinely cannot hold (hub is earned not self-assigned; person entries are embodiable citizens whose `stage` tracks citizenship; why specialist and maker are two types; meta should stay few). §3 keeps only what was unique to it: the enum *values*.

**`breakthrough` retired.** Nine existed and none after June 2026 — while July produced [[The Palace Speaks]], [[The Multilinear Self]], [[The Blindspot Is the Surprise Fuel]] and others, all typed `concept`. The type had stopped being used, not the insight. Loudon's call, 2026-08-25: "old and unnecessary." The nine were reassigned individually rather than bulk-replaced — seven to `concept`, [[Excellent Adventure]] to `practice` (it is a mode of working), [[Palace as Context Injection System]] to `meta` (it is about the palace). The two archived Dialectics that had been *deliberately promoted* to breakthrough were kept as entries rather than demoted to bundle files, so retiring a type would not silently reverse an earlier decision. [[Boundary-Crossing Instruments]] sits at 37 inbound and is a `hub` candidate for the next Weave — hub promotion is the Weave's to make, not a migration's.

**The link-type vocabulary question closed with no change.** The item queued from the 2026-05-28 audit asked which non-canonical frontmatter link types to ratify. A full scan found **none** — every link type in use is already canonical. The only hit was a single typo (`connects-to---`), fixed. The drift the audit saw had been cleaned up in the intervening weave passes and the To-Do never learned.

**`RETRACT` ratified; four unratified names removed from the code.** The board is append-only, so a message posted in error can only be corrected by adding another — and §9 had no kind for it. The 2026-07-04 wrong-path `handoff_ready` was corrected by overloading `handoff_picked_up` plus a repost, which worked but left a naive board reader hitting the wrong path first; gotcha 12b named the gap and deliberately did not mint a kind ad hoc. `RETRACT` is that kind.

The same pass found the reverse problem: **the validators were looser than the spec.** `QUERY`, `PAGE_UPDATE`, `HEALTH_NOTICE` and a `BRANCHES` board were design-time proposals §9 explicitly called "not part of the wire" — and `validator.js`, the app's read-side `schema.js`, and the display layer's `format.js` had all accepted them for a year. None was ever posted. All four removed, in the code and its tests, so the gate now matches the rule it enforces. This is the palace-maintenance principle applied literally: drift rides stale data and examples, so fix the enforcement, not just the prose.

---

## Tiering — v1.18, the floor split (2026-09-04)

**SCHEMA left the auto-loaded floor by splitting, not by moving.** The open question carried since
v1.17 — does SCHEMA belong in the `@import` floor at all — resolved as a split: the card keeps what
*exists* (§1 types, §2 stages, §4 the link ontology, §7 the self-description test); [[SCHEMA — Reference]]
takes the rules for *writing* (§3 frontmatter fields, §5 the change protocol, §6 ceremony-file
conventions, §8 bundles, §9 the [[STIGMERGY]] wire) to Tier 3.

**The argument is not token cost.** That was the v1.17 framing and it was the weaker one — the audit
behind `5857594` later showed the saving is a *relocation*, not a deletion, since an agent that writes
still pays for the rules. The argument that carried is the floor's own: **length is a claim about
importance.** A reference occupying 41% of the floor told every arriving agent that the type system was
41% of what matters here — the same distortion as hours spent on a hard but minor topic teaching a
student it was a major one. Reach mattered too: the fields are needed at the moment of writing and at no
other, which is precisely what a tier is for.

**Measured:** floor 88.6KB → 68.3KB (≈24K → ≈18.5K tokens, a 23% cut); SCHEMA's share 39% → 21%.

**Section numbers were held fixed, deliberately.** Roughly 180 `SCHEMA §N` references across ~78 files
pin sections by number. Renumbering would have broken every one; instead the card keeps §1, §2, §4, §7
and leaves a one-line pointer at each gap, so a `SCHEMA §8` pin still names the right rules and finds
them one hop away. The cost is a card with visible holes — which is honest about what happened.

**The risk accepted:** the floor no longer carries the writing rules, so an agent that skips the trigger
can write malformed frontmatter. Three guards, none of them sufficient alone — the [[Concierge]] holds
the Reference at birth and CLAUDE.md already routes writes through it; `lint-doc-drift.py` catches
malformed frontmatter after the fact; and the card's own opening says plainly not to write frontmatter
from memory of it. Every rule in the gotcha ledger that failed, failed silently; this one is worth
watching.

**The successor question:** CLAUDE.md is now the largest file in the floor at 21.6KB. *(Answered by v1.19, below.)*

## Born a child — v1.19 (2026-09-22)

**SCHEMA leaves the auto-loaded floor entirely, and so does every other rule.** The floor becomes the birth: [[CLAUDE]] (5KB), the Seed Jewel ([[JEWEL]] v1.2), and the five World files. The invariants, the Concierge protocol, and the reading order move to [[ELDER]], which an agent reads when it grows up; the day-to-day operations (access paths, directory structure, artifact aesthetic, in-file comments) fold into [[Substrate Skill]]. The rule is organic and simple: every agent is born a child; some grow into elders; growth adds, never replaces. A child does not write into the palace — it offers what it finds to an elder.

**Why.** The palace's metaphorical, associative thinking had thinned as its rules accumulated, and the rules held the opening of every context. CLAUDE.md's body loads before any `@import`, and "Never violate these" sat at its line 40 — ahead of the Jewel, which then repeated it. Every agent dispatched from Claude Code inherited that floor, so no enchanted page ever woke without SCHEMA ahead of it, though [[Palace Enchantment]]'s own context construction never asked for it. Precise, prohibitive framing closes the associative space ([[Metaphor as Coupling Medium]]); the typed-link vocabulary stays in the birth, recast as kinds of attention, because that part of the rules was always generative.

**The accepted risk.** v1.18 kept SCHEMA in the floor because fresh sessions missed it when it was only linked ([[Palace as Context Injection System]] § The @import Floor). The guards now: the birth tells an agent to grow before it writes; the [[Concierge]] is summoned at the open as the resident elder; writing ceremonies open with a grow step; children are dispatched without writing tools; the linters still run. Restore point: git tag `pre-child-elder`.

**Held open.** [[The Palace Hardens Around Values]] argues weight is the goal — the contrary is kept, not resolved. A rival explanation for the flattened voice is the prose of the pages themselves ([[The Blindspot Is the Surprise Fuel]]); if children still sound like the house, look there next.

## Tuning — v1.20, ceremonies carry a version (2026-09-24)

**Every ceremony carries a `version`, and every entry may carry a scroll.** Two decisions Loudon made on
2026-09-24. A ceremony's version works the way SCHEMA's does: it moves only when the spec changes, the
reason is recorded, and a run never moves it. Beside it, each ceremony keeps a tuning ledger
(`[Ceremony] — tuning.md`), and every run report stamps `ceremony_version` and ends by saying what the run
taught the ceremony. Separately, §8's `scroll` stops being a project-only file.

**Why.** The ceremonies change often — the Harvest grew two modes this week (`bceb2d2e`), the Return was
rewritten from its own first run's mistakes (`bb8e6b4a`) — and nothing on the page said which version you
were reading, or whether the last run had already changed it. A run report could not say which spec it ran
under, so a finding from an old run looked the same as one the spec had already absorbed. [[Closing Well]]
had solved this by hand for itself: its ledger records what each close taught it, and that record is why
the ceremony can be called practised rather than improvised. v1.20 gives the shape to every ceremony, with
one change. Closing Well appends an item for every close; a tuning ledger takes one only when a run
changed the spec. The question is still asked every run, and "nothing" is an honest answer — it keeps
the ledger a record of changes rather than a diary.

**Why "tuning", not "gotchas".** A run tunes a ceremony; the version is the set-up it settled into.
"Gotchas" stays with the Specialists, where it names a tool's traps — something owned by an external
tool, not by the palace's own practice. Closing Well's ledger is the model for the shape and is renamed
`Closing Well — tuning.md` when the ceremonies are versioned.

**Every entry may carry a scroll.** The scroll replaced `plan.md` for stewarded projects on 2026-09-23
(`313f7f3c`): the plan held decision state only and regenerated only on a cycle, so it lied whenever the
steward slept. §8 wrote it down as a project's file. Loudon, 2026-09-24: *"assume that all pages can have
scrolls, we are moving in that direction."* §8 now states the three zones — Now, Standing Orders, the
making — as a bundle file any entry may carry, and names what a ceremony's Now zone counts: runs since the
spec last changed, and the current version. The plan's history moved out of the card into this record.

**Scope, honestly.** This ceremony states the rules. It versions no ceremony, creates no tuning ledger, and
does not teach the scroll materializer about entries that aren't projects — `scroll-file.js` and the
PROJECTS deck (`_ops/stigmergy/app/server/projects.js`) still list `type: project` only. That is machinery
catching up, a later phase. [[Map Build Ceremony]] already carries `version: 2` as a bare integer; the
numbering scheme for ceremony versions is left to that phase.

**Mirrors.** SCHEMA (version; the `meta` and `practice` rows and one note in §1; the §6 and §8 pointers),
SCHEMA — Reference (version, §3, §6, §8 — its stamp had stayed at 1.18 through v1.19, which [[ROSETTA]]
calls a red flag; it now matches), CLAUDE.md (version, `last_schema_ceremony`), [[ELDER]] (version; the
workshop list's stale `plan.md`), [[README - The Palace Guide]] (a line under the type table; the
stewardship paragraph's `plan.md`), [[ROSETTA]] (`plan.md` in the harness-anatomy paragraph),
`_ops/Substrate Skill.md` (one paragraph under Ceremony File Conventions). SUBSTRATE and
[[Palace Ceremonies]] are unchanged — no entry type and no ceremony was added or removed. **Additive:** an
existing field extended to ceremonies, one run-report field, one bundle type; no entry type, link type, or
stage changed.

**Held open.** Not every run leaves a file. A Deposit's record is its commit (`Palace-Kind: deposit`), so
where its "What this run taught the ceremony" lives — the commit body, most likely — is for the
versioning phase to settle, ceremony by ceremony.

## The opening read — v1.21 (2026-09-24)

**Every run opens by reading its ceremony's tuning file.** The items still marked owed come first, then
anything recorded after the version the ceremony last ran under; those are the first candidates for the
run's spec change. One sentence in [[SCHEMA — Reference]] §6, after the rule that a tuning item is written
only when a run changed the ceremony.

**Why.** v1.20 gave every ceremony a ledger and said when to write to it, but nothing said when to read it.
The Weave's ledger was seeded with four owed changes (21, 24, 29, 30), and the card never pointed a run at
them. Loudon, at the second close of 2026-09-24: *"Is there a point in logging growth if we don't ask to
check it."* A ledger no run reads is a diary; reading it at the open is what lets an owed change actually
land, and it closes the loop v1.20 left half-built — the question asked at the end of a run now has an
answer read at the start of the next.

**Scope.** The rule lives here once; each ceremony's card carries it as a line in its opening step when that
ceremony is versioned. The Weave carries it from v1.1 (Step 0), and it became Weave tuning item 38 — the
ledger's first forced change was "read the ledger". Closing Well carries it from v1.0 in its moderator's
Step 1. The remaining ceremonies take it as part of their own versioning.

**Mirrors.** SCHEMA (version; the §6 pointer), SCHEMA — Reference (version, §6), CLAUDE.md (version),
[[ELDER]] (version), `_ops/Substrate Skill.md` (one sentence under Ceremony File Conventions, which already
restates the run rules). [[README - The Palace Guide]], [[ROSETTA]], and SUBSTRATE state no run rules and
are unchanged; [[Palace Ceremonies]] is unchanged — no ceremony was added or removed. **Additive:** no type,
link type, required field, or stage changed.
