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
type: concept | project | breakthrough | question | spore | source
pillars: [relevant pillars]
born: YYYY-MM
stage: seed | sprout
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
- `enables` — understanding X is needed for Y
- `deepens` — more nuanced version of another idea
- `spawned` — one idea gave birth to another
- `emerged-from` — historical origin
- `contradicts` — productive tension
- `couples-with` — ideas that oscillate together

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

**Earlier stages require more discussion, not less.** A `seed` entry is a hypothesis about Loudon's intent; a `mature` entry is verified, co-authored truth. The discussion budget is inverse to the stage: more conversation up front, less re-litigation later. Vector tuning, plan tuning, and convention agreement are the work of seed and sprout; execution is the work of growing onward.

**Stage-conditional posture for the Steward agent** (canonical home: [[Project Stewardship System]]; substrate references: [[BBS Blackboard]] and [[Palace Agent Infrastructure Spec]]):

| Stage | Agent's job | BBS posture |
|---|---|---|
| seed | Surface underspecified parts; propose vector and plan refinements | Discussion, not deliverables. `RESOURCE_REQUEST` to TRICKSTER, `blocking: true`. |
| sprout | Plan-level detail; named tradeoffs; flag default-traps | Mostly proposals and questions; small deliverables only. |
| growing | Execute within established direction; checkpoint at sensory steps | Build Session pace; `blocking: false` for routine, `blocking: true` for sensory verification. |
| mature / fruiting | Ship deliverables, post completions | Full execution; minimal re-litigation; `WEAVE` board for completion signals. |
| dormant | Don't touch — Spore Check ceremony only | — |
| composting | Don't touch — composting protocol applies | — |

**Recursive within entries.** A `growing`-stage project can contain `seed`-stage deliverables. The Talking Keyboard case ([[Generative Sample Libraries]] Phase 1, May 2026) demonstrated this: the project reached `sprout` with an aligned forward vector, but the deliverable's pronunciation conventions, filename conventions, and audition gates were never aligned. 352 files were rendered with a pronunciation bug that only listening could catch. The lesson: align at the project level, then re-align at the deliverable level, then audition before committing labor.

**Sensory deliverables require an audition gate.** For any deliverable where verification is experiential rather than inspectional — TTS pronunciation, color choice, motion easing, the way music makes you feel — the smallest unit that exercises every parameter must be rendered, paused for human audition, and accepted before the full batch proceeds. Code review cannot substitute. Spec review cannot substitute. Only listening, looking, feeling can.

**Voice rules for enchanted agents addressing the human live in [[Palace Enchantment]] § Voice Rules When Addressing the Human.** They are loaded into the synthesis trigger at enchantment time, not always-on in the substrate. The six clauses (plain first-person, brief, catch-up-then-ask, content-in-the-rendered-field, translate jargon, give clickable links) shape how an enchanted page speaks to Loudon — but only when the audience configuration includes the human. They do not apply to peer-dialogue between enchanted agents, to coordinator synthesis, or to Claude's general palace work. The architectural separation: posture (this section, applies always) governs *what* the agent does; voice (Palace Enchantment) governs *how* it sounds when addressing humans.

**Page-agent identity is the page's own title.** When a page operates as a permanent agent, its `agent_id` and BBS `from` field are the page's own title (e.g. `Generative Sample Libraries`), not an invented compound handle (e.g. `GSL-STEWARD`). The page IS the agent per [[Pages as Agents]] — Steward, Proof-Generator, Lineage-Trace, etc. are *modes* the page operates in, not separate identities. Modes are captured in the manifest's `mode` and feature blocks. Role-only agents that have no home page (Coordinator, Trickster) keep role-name handles. Filesystem directory names can stay kebab-case for OS friendliness; the visible BBS identity is the page title with spaces preserved. (Surfaced by the Stage A pilot 2026-05-03 when Loudon read `GSL-STEWARD` on the BBS and could not recognize it as the GSL page.)

### Writing Conventions

**Equations in words alongside symbols.** When rendering math in a palace entry, in a chart caption, or in any artifact that surfaces a formula, follow the symbolic form with a plain-words restatement. Operators stay symbolic (×, +, √, ², etc.); variables and named coefficients become words. The reader who knows the concept but forgets which letter is which should be able to read the formula in either form and understand it.

Example:

> **f_n = n · f₀ · √(1 + B · n²)**
>
> the frequency of the nth partial = the partial index × the fundamental frequency × √(1 + the inharmonicity coefficient × the partial index²)

Apply this to pedagogical entries especially (anywhere a formula is meant to teach), and to chart captions whenever an equation appears in the figure. Operators remain symbolic — the words form is for the variables and coefficients, not for the math itself.

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
