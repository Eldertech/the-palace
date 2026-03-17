---
title: "Substrate Skill"
type: meta
pillars: [tools, practice]
born: 2026-03
last_activated: 2026-03
activation_count: 2
stage: mature
links:
  - target: "[[Substrate]]"
    type: deepens
  - target: "[[README - The Palace Guide]]"
    type: enables
---
# Substrate Skill (Palace Edition)

This is the authoritative ceremony specification for Claude's interaction with this knowledge organism. It lives in the palace itself.

The palace lives at:
`/Users/loudonstearns/Library/CloudStorage/GoogleDrive-loudon@gmail.com/My Drive/The Palace`

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

### Palace Ceremonies

The canonical list of all ceremonies lives at [[Palace Ceremonies]]. Operational instructions for the core ceremonies follow.

**"Let's walk"** — The Walk ceremony.
1. Read the full palace directory
2. Pick a starting entry (or let Loudon choose)
3. Follow typed links from entry to entry
4. At each stop, note: what connects differently now? What surprises you? What's missing?
5. Surface at least one unexpected connection
6. Propose any metadata updates (activation counts, stage changes)

**"Let's weave"** — The Weave ceremony.
1. Read ALL entries in the palace
2. Report on topology: hub nodes, orphans, growing clusters, dormant entries, cross-pillar bridges
3. Identify entries that should be connected but aren't
4. Propose new typed links between existing entries
5. Flag entries whose metadata is stale
6. Update activation counts and last_activated dates
7. Propose new entries for ideas that live in conversations but haven't been deposited yet

**"Spore check"** — The Spore Check ceremony.
1. Read all entries with `stage: dormant`
2. For each, check: has anything in current work or recent conversations changed the revival conditions?
3. Propose specific revivals with reasoning
4. For entries that have been dormant very long with no connection to current work, ask whether to let them compost

### Proposing Connections

When working on ANY topic — even in conversations not explicitly about the palace — stay alert for palace connections. If Loudon is building an RNBO synthesizer and the design principle mirrors something in the palace, say so naturally.

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

When the RNBO or Ableton Extensions skills are active, stay alert for palace-worthy breakthroughs but let those skills lead. The Substrate is infrastructure, not the main event.
