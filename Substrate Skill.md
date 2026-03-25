---
title: Substrate Skill
type: meta
pillars:
  - tools
  - practice
born: 2026-03
last_activated: 2026-03
activation_count: 2
stage: mature
links:
  - target: "[[SUBSTRATE]]"
    type: deepens
  - target: "[[README - The Palace Guide]]"
    type: enables
---
<!-- Should this live in _Ops -->
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
