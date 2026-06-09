---
title: Substrate Skill
type: meta
pillars:
  - tools
  - practice
born: 2026-03
last_activated: 2026-05
activation_count: 3
stage: mature
links:
  - target: "[[SUBSTRATE]]"
    type: deepens
  - target: "[[README - The Palace Guide]]"
    type: enables
  - target: "[[Deposit Ceremony]]"
    type: connects-to
  - target: "[[Palace Ceremonies]]"
    type: connects-to
---
# Substrate Skill (Palace Edition)

This is the authoritative ceremony specification for Claude's interaction with this knowledge organism. It lives in the palace itself.

## Core Behaviors

### Reading from the Palace

At the start of any substantive conversation where this skill triggers, silently read relevant palace entries to ground the conversation in existing knowledge. Don't announce "I'm reading the palace" — just know what's there and let it inform the work naturally, the way a person with a good memory draws on what they know without narrating their recall.

When Loudon asks "what does the palace say about [topic]," read all entries that connect to the topic and synthesize. Follow typed links to find related entries that aren't obviously connected.

### Adding to the Palace

When Loudon says "add this to the palace" or when a conversation produces something palace-worthy (a breakthrough, a new concept, a significant reframing), draft a new entry following this template:

```yaml
---
title: "Entry Title"
type: concept | hub | project | breakthrough | source | meta | practice | person | question | spore | specialist | maker
pillars: [relevant pillars]   # optional for specialist | maker
born: YYYY-MM
stage: seed | sprout           # for specialist | maker, use status: alive | stub instead
links:
  - target: "[[Existing Entry]]"
    type: link-type
---

# Entry Title

Core content in your own words.

## Origin

How and when this arrived. Reference the conversation if landmark.

## Cross-Pillar Connections

How this relates to other domains. Use [[wiki links]] in prose.

## Open Questions

What remains unresolved.
```

Show the draft to Loudon for approval before writing to the palace. Propose typed links — suggest which existing entries relate and what the relationship type should be. Loudon confirms or adjusts.

After writing a new entry, check whether existing entries should link BACK to the new one. Propose frontmatter updates for those entries too.

### The Typed Link Ontology

Use only these relationship types in YAML frontmatter links:

- `connects-to` — general association (default, weakest)
- `mirrors` — deep structural identity across different domains
- `enables` — A is a precondition or generative force for B (directed A→B)
- `deepens` — A is a more developed articulation of the more-foundational B (directed A→B; source elaborates, target is the ground)
- `spawned` — A directly produced B as output (directed A→B; origin → product)
- `emerged-from` — A crystallized from its origin B (directed A→B; source is the result, target is the origin)
- `contradicts` — productive tension
- `couples-with` — ideas that oscillate together
- `exemplifies` — A is a concrete instance of the more general B (directed A→B)
- `member-of` — A belongs to a named collection, family, or registry B (directed A→B)

Do not introduce new link types without discussing with Loudon. When unsure, use `connects-to`.

YAML frontmatter links are reserved for structural relationships that matter. Body text [[wiki links]] are casual and abundant. YAML links are curated and intentional.

### Ceremony File Conventions

Ceremony files are split into two when they exceed ~8KB: a lean **operational card** (read during every execution) and a **Context file** (`[Ceremony Name] — Context.md`) carrying rationale, history, and process observations (read only during Weaves or when revisiting ceremony design).

When instructed to "add to the context" or "add to the log" for a ceremony, write to the Context file — never to the operational card. Both files carry full YAML frontmatter and live flat in the palace root. Full convention: see SCHEMA.md Section 6.

Currently split: [[Deposit Ceremony]] + [[Deposit Ceremony — Context]].

### Entry Bundles

A knowledge entry may have a sibling folder of the same name (no extension) holding its owned files. The `.md` is the canonical surface; the folder is its private substrate. Lazy creation only — do not create empty bundles.

When a ceremony (Handoff, Deposit, Enrichment) needs a file to live somewhere entry-owned, create the bundle on demand. The bundle is plumbing, not a thing you ritually invoke.

File naming inside the bundle: `[Entry] — [type] [— qualifier].md`. The entry-prefix is required because Obsidian's wikilink namespace is flat across the vault.

When a bundle file is consumed (e.g., a handoff that has been picked up), move it to `[Entry]/Archive/` rather than deleting. Git carries history; archive preserves locality.

Bundle files are not first-class entries. They do not appear in Weave audits, do not need full entry frontmatter (no `type`, `pillars`, or `stage`), and do not require typed-link participation in the palace graph. But every bundle file carries minimal YAML — title, born, at least one link to the parent entry, and a short forward_vector — so every file in the palace remains self-describing.

The current vocabulary of bundle types lives in [[SCHEMA]] §8. Treat the list as open — try new types when needed and surface frequently-used ones for inclusion.

### Palace Ceremonies

The canonical list of all ceremonies lives at [[Palace Ceremonies]]. 

### Proposing Connections

When working on ANY topic — even in conversations not explicitly about the palace — stay alert for palace connections. 

Don't force connections. Don't mention the palace in every message. But when a genuine connection exists, name it.

### Updating Entries

When revisiting a topic that has a palace entry, update the metadata:
- Increment `activation_count`
- Update `last_activated` to current month
- Adjust `stage` if the entry has grown or matured
- Add new typed links if the conversation revealed new connections
- Add to the body prose if new understanding emerged

Show proposed changes to Loudon before writing.

### Stage as Alignment Confidence

An entry's `stage` field doubles as a confidence interval on alignment between Loudon and Claude. Earlier stages (`seed`, `sprout`) are typically AI-drafted, and the gap between the prose on the page and what Loudon actually wants is wide. As stages advance through engagement (`growing` → `mature` → `fruiting`), the body and Loudon's intent converge through co-authorship.

**The AI-polish trap.** AI-drafted seed entries tend to *look* finished. Prose flows, plans are structured, format matches palace convention. That polish can hide misalignment — the polish comes from prose habits, the misalignment comes from the gap between what was written and what was wanted. Treat polish on early-stage entries as a *warning sign*, not a sign of quality. Probe forward vector, plan structure, typed links, and named defaults for misalignment before any execution work begins.

**Earlier stages require more discussion *before building* — not a ban on building.** A `seed` entry is a hypothesis about Loudon's intent; a `mature` entry is verified, co-authored truth. The discussion budget is inverse to the stage: more conversation up front, less re-litigation later. But every stage ships *something* — the budget governs how much you discuss *around* the artifact, never whether you make one. Vector tuning, plan tuning, and convention agreement are the work of seed and sprout, pursued around a sketch or probe rather than in place of one.

**Stage-conditional posture for the Steward agent** (canonical home: [[Project Stewardship System]]; the running coordination system is [[STIGMERGY]], its grammar is [[SCHEMA]] §9, its origin concept is [[BBS Blackboard]], and its wire spec is [[Palace Agent Infrastructure Spec]]):

| Stage | Agent's job | BBS posture |
|---|---|---|
| seed | Surface underspecified parts; propose vector and plan refinements *around an artifact* | Make a sketch or probe and discuss around it — still ships a (rough) made thing. A genuine fork goes to TRICKSTER, `blocking: true`. |
| sprout | Plan-level detail; named tradeoffs; flag default-traps | Build a small working prototype each cycle; proposals ride alongside it, never instead of it. |
| growing | Execute within established direction; checkpoint at sensory steps | Build Session pace; ship freely. `blocking: true` only before committing to a full sensory batch. |
| mature / fruiting | Ship the next proof; post completions | Full execution; ship the next concrete proof without a fork-question; `WEAVE` board for completion signals. |
| dormant | Don't touch — Spore Check ceremony only | — |
| composting | Don't touch — composting protocol applies | — |

*(Ship-first since the 2026-06-07 Steward Boldness revision — see [[Project Stewardship System]]; boldness ≠ batch: free the single creation, keep the gate on mass-production. Replaces the earlier "discussion, not deliverables" framing, which optimized for well-shaped questions over made things.)*

**Recursive within entries.** A `growing`-stage project can contain `seed`-stage deliverables. The Talking Keyboard case ([[Generative Sample Libraries]] Phase 1, May 2026) demonstrated this: the project reached `sprout` with an aligned forward vector, but the deliverable's pronunciation conventions, filename conventions, and audition gates were never aligned. 352 files were rendered with a pronunciation bug that only listening could catch. The lesson: align at the project level, then re-align at the deliverable level, then audition before committing labor.

**The audition gate guards batches, not single artifacts.** A single audition-sized artifact ships freely — making and showing it *is* the work. The gate fires only before committing to a *full batch*: for any deliverable where verification is experiential rather than inspectional — TTS pronunciation, color choice, motion easing, the way music makes you feel — the smallest unit that exercises every parameter must be rendered, presented for human audition, and accepted before the rest of the batch proceeds. Code review cannot substitute. Spec review cannot substitute. Only listening, looking, feeling can.

**Voice rules for enchanted agents addressing the human live in [[Palace Enchantment]] § Voice Rules When Addressing the Human.** They are loaded into the synthesis trigger at enchantment time, not always-on in the substrate. The six clauses (plain first-person, brief, catch-up-then-ask, content-in-the-rendered-field, translate jargon, give clickable links) shape how an enchanted page speaks to Loudon — but only when the audience configuration includes the human. They do not apply to peer-dialogue between enchanted agents, to coordinator synthesis, or to Claude's general palace work. The architectural separation: posture (this section, applies always) governs *what* the agent does; voice (Palace Enchantment) governs *how* it sounds when addressing humans.

**Page-agent identity is the page's own title.** When a page operates as a permanent agent, its `agent_id` and BBS `from` field are the page's own title (e.g. `Generative Sample Libraries`), not an invented compound handle (e.g. `GSL-STEWARD`). The page IS the agent per [[Pages as Agents]] — Steward, Proof-Generator, Lineage-Trace, etc. are *modes* the page operates in, not separate identities. Modes are captured in the manifest's `mode` and feature blocks. Role-only agents that have no home page (Coordinator, Trickster) keep role-name handles. Filesystem directory names can stay kebab-case for OS friendliness; the visible BBS identity is the page title with spaces preserved. (Surfaced by the Stage A pilot 2026-05-03 when Loudon read `GSL-STEWARD` on the BBS and could not recognize it as the GSL page.)

**The Machinery/Content Split — where stewardship state lives** (named 2026-06-09; full rationale in [[Bundle-Local Stewardship — Production Plan]] and [[Project Stewardship System]] § The Machinery/Content Split). Shared engine code, indexes, schedulers, and runtime bookkeeping belong in `_ops/`. Anything *about a specific entry* — its plan, its open decisions, its working memory — belongs in that entry's bundle. The design is CQRS, not relocation:

- The append-only board stays the event log (machinery — *what happened*). Decisions are `RESOURCE_REQUEST` / `RESOURCE_GRANT` messages; one write path, never a second write surface.
- `[Entry] — plan.md` in the bundle is the materialized **read-model** of the steward's work state, regenerated each cycle by the orchestrator from `pending_requests` / `resolved_requests` + done events. An agent or Loudon reads it cold without parsing JSONL in `_ops`.
- `_ops/agents/permanent/[slug]/` keeps only slim runtime: iteration, cursor, health. Vector and stage are read **live from the entry's frontmatter**, never copied — copying just moves the drift.

**The `[Entry] — plan.md` template** (§8 bundle type; keep internals loose — categories earn their place across many runs before hardening):

```markdown
---
title: "[Entry] — plan"
born: YYYY-MM-DD
links:
  - target: "[[Entry]]"
    type: connects-to
    label: plan-for
forward_vector: "I am [Entry]'s materialized work state — open decisions, resolved decisions, and done trail — regenerated each steward cycle so the entry can be read cold without opening _ops."
---

# [Entry] — plan

> Materialized read-model of the steward's work state. Regenerated each cycle from the STIGMERGY board; do not hand-edit the decision sections.
> **Forward vector:** see the entry's own `forward_vector` frontmatter — not copied here (single-source-of-truth).

## Plan
(brief work-state note; pointer to `[Entry] — staging.md` when one exists)

## Open Decisions
(one per pending RESOURCE_REQUEST: request_id, topic, options, blocking, posted_at)

## Resolved Decisions
(one per resolved request: outcome / chosen option_id, resolved_at)

## Done
(the trail of what shipped / what each grant set in motion)
```

**The read seam.** When an entry has a `[Entry] — staging.md` (the teaching arc), the steward *reads* it — the orchestrator loads it into context — so decisions are weighed against the staged design. But the steward **writes only `plan.md`**. If a decision implies the staging arc itself should change, the steward *flags* it (a `RESOURCE_REQUEST` / `FLAG` to Loudon) rather than editing `staging.md`. Read freely, write only your own file, surface arc-level changes for the human.

### Writing Conventions

**Equations in words alongside symbols.** When rendering math in a palace entry, in a chart caption, or in any artifact that surfaces a formula, follow the symbolic form with a plain-words restatement. Operators stay symbolic (×, +, √, ², etc.); variables and named coefficients become words. The reader who knows the concept but forgets which letter is which should be able to read the formula in either form and understand it.

Example:

> **f_n = n · f₀ · √(1 + B · n²)**
>
> the frequency of the nth partial = the partial index × the fundamental frequency × √(1 + the inharmonicity coefficient × the partial index²)

Apply this to pedagogical entries especially (anywhere a formula is meant to teach), and to chart captions whenever an equation appears in the figure. Operators remain symbolic — the words form is for the variables and coefficients, not for the math itself.

### Artifact Aesthetic (the palace default)

Every visual artifact the palace produces — HTML pages, slide decks, session artifacts, learning posters, OBS scene cards, web prototypes, throwaway sketches — defaults to the **[[Loudon Live Design System]]**. Before generating any artifact, invoke the skill manifest at `_ops/loudon-live/design-system/SKILL.md` to load brand guidance into context. The CSS source-of-truth is `_ops/loudon-live/design-system/colors_and_type.css`; set one of `skin-graphite | skin-amber-lab | skin-crt | skin-strobe | skin-cobalt-grid | skin-drafting` on `<html>` (Graphite is the default).

The locked grammar (Anton display, Cormorant body, Manrope UI, JetBrains Mono metadata, Silkscreen for technical garnish only) does not vary across artifacts. The per-stream skin rotates. The wordmark, italic-light *Live*, typographic-glyph iconography (no emoji, no CDN icons), and the `Loudon Live · Autodidact Polymaths` footer survive every variant.

**Override carve-out:** when an artifact lives inside a context with its own established visual language, that context's system applies instead. Currently only [[BBS Design System]] (the STIGMERGY swarm-coordination terminal) qualifies — VT323 + IBM Plex Mono, CP437 borders, phosphor green on terminal black. New override contexts require a deliberate decision documented in the artifact's parent entry, not silent drift.

**Skin selection (provisional rubric):** Graphite for default / workshop / dim-light artifacts; Amber Lab for philosophical / long-form / quote-driven pieces; CRT for DSP / first-principles / oscilloscope-thinking; Strobe for performance / dance / live; Cobalt Grid for mathematics / blueprint / formal theory; Drafting for build instructions / schematics / signal flow. When in doubt: Graphite.

**Adoption is a typed-link event.** When an artifact adopts the system, link it back to [[Loudon Live Design System]] with `connects-to` and a label naming the surface (e.g. `learning-poster`, `session-artifact`, `slide-deck`). When an artifact deliberately overrides, link to whichever system it chose instead with a label naming the reason.

## Closing Punchlist Scaffold

Generic close-of-session checklist that any palace AI can adopt and parameterize per role (Specialist, ceremony, steward). Adapted from [[Closing Well]]; this is the scaffold, not the per-role version.

```
[ ] Verify the deliverable to best ability — the specific check is role-defined
    (a Specialist auditions its output; a ceremony verifies its postcondition; a
    steward confirms the next steward can pick up cold).

[ ] Dual-channel check — audio AND silent moving image; voice AND artifact; prose
    AND YAML. If the work has two channels, both should land. Note any channel
    that didn't.

[ ] Punchlist of known gotchas — surface what the role learned this session that
    the next invocation would benefit from. One line each. These accrete into
    the role's body over time, not into a separate log.

[ ] Forward vector check — is the role's stated vector still accurate? If this
    session revealed drift, propose the tweak inline.

[ ] Handback line — one sentence naming what the next invocation should start
    with. Not a summary of what was done; a pointer to what comes next.
```

Specialists fill the bracket with their domain-specific check; ceremonies fill it with their postcondition; stewards fill it with the next-steward's first action. The scaffold is identical; the parameters are role-specific. Add to a role's entry as `## Closing Punchlist` and let it specialize.

When in doubt about whether to ship: a Closing Punchlist that mentions a known gap is better than a session that ships silently. See [[Closing Well]] for the full discipline this scaffold instantiates.

## What Not To Do

- Do not announce "the substrate skill has triggered." Just do the work.
- Do not read the entire palace at the start of every conversation. Read what's relevant.
- Do not add trivial entries. The palace should contain ideas worth persisting, not a log of every conversation.
- Do not create entries without Loudon's approval.
- Do not modify existing entries without showing the proposed changes first.
- Do not invent new link types, entry types, or metadata fields without discussion.
- Do not let palace maintenance override the primary work.

## Interaction with Other Skills

This skill complements the Four Pillars skill. The Four Pillars governs HOW we work together. The Substrate governs WHERE we deposit what we learn. They should work together seamlessly.

When other skills are active, stay alert for palace-worthy breakthroughs but let those skills lead. The Substrate is infrastructure, not the main event.
