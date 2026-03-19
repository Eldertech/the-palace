---
title: "Weave Ceremony"
type: practice
pillars: [practice, tools, philosophy]
born: 2026-03
last_activated: 2026-03
activation_count: 1
stage: mature
links:
  - target: "[[Palace Ceremonies]]"
    type: connects-to
  - target: "[[Substrate Skill]]"
    type: connects-to
  - target: "[[Walk Ceremony]]"
    type: connects-to
  - target: "[[Spore Check Ceremony]]"
    type: connects-to
  - target: "[[Harvest Log]]"
    type: enables
  - target: "[[Kuramoto Coupling]]"
    type: mirrors
  - target: "[[Weave Ceremony — Context]]"
    type: spawned
  - target: "[[Swarm Weave]]"
    type: spawned
---

# Weave Ceremony

The palace's full-body examination. Where the Walk follows one thread, the Weave reads every thread and asks: how do they relate? What forms? What tangles? What has grown unnoticed? What has died without a marker?

The metaphor is the elder weaving the blanket — not creating new material, but working with what exists, finding the pattern across all threads simultaneously. The Weave is also the mycorrhizal network doing its distributed routing work: redistributing nutrients (connections) toward need, away from surplus.

The Weave is monthly. More frequent and it becomes overhead. Less frequent and the palace begins to drift — orphan entries accumulate, stale metadata misleads, the topology report loses its ability to surprise.

For philosophical reflection on the Weave, see [[Weave Ceremony — Context]].

## Ceremony Contract

**Trigger:** "Let's weave"

**Access vectors:**
- *Full:* Claude Code / Cowork (filesystem read/write + git; required for metadata updates and queue processing)
- *Analysis only:* claude.ai online (can read palace via GitHub raw URLs once pushed; can produce a topology report and propose changes; cannot write files or commit)
- *Manual:* Obsidian + human (human uses graph view; human applies changes manually)
- *Not supported:* GitHub cloud alone

**Preconditions:**
1. Palace has at least 5 entries (fewer and the topology report has nothing to say)
2. Full filesystem read access is available
3. Harvest Log is accessible (needed for queue processing in Step 0)

**Postconditions:**
1. `_hibernation_queue/` has been fully processed — all queue files read, log updated, queue files deleted
2. A topology report has been produced covering: total entry count, hub nodes, orphan entries, most-connected nodes, cross-pillar bridges, dormant entries, stale metadata
2a. A Tier 1 (literal link) audit has been completed: all plain-text body references to known entry titles have been surfaced and either formalized as YAML frontmatter links or flagged for deliberate exclusion with a one-line reason.
3. At least three candidate connections have been proposed (new typed links between existing entries)
4. Any confirmed metadata updates have been written to entry files
5. Git commit made: `Weave — [date] — [N links added, N entries promoted, N orphans flagged]`

**Failure mode:** If the palace is only partially readable (some files inaccessible), produce a partial topology report and note which entries were unreachable. A partial Weave is valid. Do not commit until all accessible files have been processed. If the hibernation queue cannot be processed (Harvest Log inaccessible), note the blockage and proceed with the topology work — queue processing is Step 0, not a prerequisite for the rest of the Weave.

**Git commit:** `Weave — [date] — [N links added, N entries promoted, N orphans flagged]`

---

## Protocol

**Step 0: Process the hibernation queue**

Before anything else, read all files in `_hibernation_queue/`. These are completed deposit sessions waiting for their log updates. For each queue file:
1. Update the Harvest Log: set `deposit_status: done`, add `deposit_notes`, add a Session History row
2. Verify that all files named in the queue record exist in the palace folder. If any are missing, flag as orphaned.
3. Check that each deposited `.md` file has valid YAML frontmatter. Add minimum frontmatter if missing.
4. Delete the queue file once processed.

If the queue is empty, note it and proceed. If the queue cannot be processed (Harvest Log inaccessible, file corrupted), note the blockage and continue — the rest of the Weave is not blocked.

Commit: `Queue processing — [N records processed]` before proceeding to Step 1.

**Step 1: Read the full palace**

Read every `.md` file in the palace root and any subdirectories. Build an internal model of:
- All entries and their types
- All typed links (both directions)
- All stage values
- All `last_activated` dates
- All entries with no outbound typed links (orphans)
- All entries with no inbound typed links (isolated — no one points to them)

**Step 1b: Literal Link Audit (Tier 1)**

From the full-text read completed in Step 1, build a list of all known entry titles in the palace. Then scan every entry's body text for:

1. Plain-text mentions of a known entry title that lack `[[wikilink]]` syntax — e.g., "the Kuramoto model" where "Kuramoto Coupling" is a known entry
2. `[[wikilinks]]` in body text that do not have a corresponding YAML frontmatter link

For each finding, record:
- Which entry contains the body-text mention
- Which known entry is being referenced
- Whether the mention is in a structurally significant location (Cross-Domain Resonance heading, bold term, explicit sentence-level reference)

These are **Tier 1 candidates** — connections already stated in prose, not yet registered in the graph. They require near-zero deliberation: the intellectual work is done; only the structural registration is missing.

Collect all Tier 1 candidates and add them to the Topology Report. They are resolved in Step 3a, before any creative (Tier 2) proposals.

If operating in analysis-only mode (GitHub raw URLs, no filesystem write access), still complete this audit and surface findings — note that write operations require a full-access session.

**Step 2: Produce the topology report**

Report on:
- **Total entries** by type (concept, hub, practice, source, etc.)
- **Hub nodes** — entries with ≥5 typed links. Are any that should be hubs not yet promoted?
- **Orphans** — entries with no typed links in either direction. Flag for connection or composting.
- **Isolated entries** — entries no one links to. May be genuine roots or may be forgotten.
- **Most-connected entries** — top 5 by total typed link count. These are the palace's centers of gravity.
- **Cross-pillar bridges** — entries that link entries from different pillars. These are often the most generative nodes.
- **Dormant entries** — `stage: dormant`. Have conditions changed? Any ready for revival?
- **Stale metadata** — entries missing `last_activated`, `activation_count`, or with stage that seems wrong given content.
- **Composting candidates** — entries at `stage: composting` from a prior Weave. Confirm deletion or revive.

**Step 3a: Formalize literal links (Tier 1)**

Present the Tier 1 candidates from Step 1b to Loudon. For each candidate:
- Name both entries
- Propose a link type and direction using the link ontology (SCHEMA §4)
- Note whether the mention is in a structurally significant location

These are maintenance, not proposals. The reasoning already exists in the prose. On Loudon's confirmation, add to YAML frontmatter.

If a Tier 1 candidate should NOT become a YAML link (the mention is passing, historical, or explicitly non-structural), note the deliberate exclusion with a one-line reason. This prevents it from re-surfacing in future Weaves.

**Step 3b: Propose semantic links (Tier 2)**

Identify at least three pairs of entries that should be connected but are NOT already named in each other's body text — connections that emerge from reading the topology as a whole. This is the creative work of the Weave. For each proposal:
- Name both entries
- Name the proposed link type and direction
- Give one sentence of reasoning

Present to Loudon. Add confirmed links to the appropriate entry frontmatter.

**Step 4: Propose metadata updates**

For any entries with stale or missing metadata: propose specific corrections. Show before/after for each. Apply on confirmation.

**Step 5: Flag stage transitions**

For any entries whose stage seems wrong given their content and connection density:
- `seed` entries with substantial body content and multiple links → propose `sprout` or `growing`
- `growing` entries that have been stable and well-connected for multiple Weave cycles → propose `mature`
- `mature` entries generating new entries or connections → propose `fruiting`
- Entries not activated in multiple Weave cycles with no connection to current work → propose `dormant`

Show all proposed transitions to Loudon before applying.

**Step 6: Note deposit candidates**

Flag any ideas currently living only in conversations or in the Palace To-Do that should be deposited. Add them to Palace To-Do if not already there.

**Step 7: Commit**

After all confirmed changes are written: `Weave — [date] — [N links added, N entries promoted, N orphans flagged]`

## The Topology Report Format

```
## Weave Report — [YYYY-MM-DD]

**Palace state:** [N] entries | [N] typed links | [N] orphans

**Hubs:** [list entries with ≥5 links and their counts]

**Orphans:** [list entries with no typed links — disposition needed]

**Most connected:** [top 5 entries by total link count]

**Cross-pillar bridges:** [entries linking different pillar clusters]

**Dormant:** [entries at stage: dormant — revival conditions reviewed?]

**Stale metadata:** [entries missing required fields or with outdated stage]

**Tier 1 — unformalized body-text links:** [N findings]
1. [[Entry A]] body mentions "[phrase]" → propose [[Entry B]] as [link-type] — [structurally significant: yes/no]

**Tier 2 — semantic proposals:** [N proposals]
1. [[Entry A]] —[type]→ [[Entry B]] — [one-line rationale]

**Proposed stage transitions:** [list]

**Deposit candidates flagged:** [list]

**Queue records processed:** [N]
```
