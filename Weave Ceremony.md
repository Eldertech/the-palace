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
- *Full:* Claude Code with filesystem access (required — all Weave operations read and write live files)
- *Manual:* Obsidian + human (human uses graph view; human applies changes manually)
- *Not supported:* GitHub cloud alone, claude.ai without filesystem access

**Preconditions:**
1. Palace has at least 5 entries (fewer and the topology report has nothing to say)
2. Full filesystem read access is available
3. Harvest Log is accessible (needed for queue processing in Step 0)

**Postconditions:**
1. `_hibernation_queue/` has been fully processed — all queue files read, log updated, queue files deleted
2. A topology report has been produced covering: total entry count, hub nodes, orphan entries, most-connected nodes, cross-pillar bridges, dormant entries, stale metadata
2a. An **unsung paths** audit has been completed: all plain-text body references to known entry titles have been surfaced and formalized as YAML frontmatter links. Any that should NOT be formalized have been flagged with a one-line reason. Unsung paths are mandatory — the prose already asserts the connection; the YAML is simply catching up.
3. **New introductions** have been proposed — new typed links between entries that do not yet mention each other in prose. No more than 5 per Weave. These are genuine growth events and deserve deliberate curation.
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

**Step 1b: Unsung Path Audit**

From the full-text read completed in Step 1, build a list of all known entry titles in the palace. Then scan every entry's body text for:

1. Plain-text mentions of a known entry title that lack `[[wikilink]]` syntax — e.g., "the Kuramoto model" where "Kuramoto Coupling" is a known entry
2. `[[wikilinks]]` in body text that do not have a corresponding YAML frontmatter link

For each finding, record:
- Which entry contains the body-text mention
- Which known entry is being referenced
- Whether the mention is in a structurally significant location (Cross-Domain Resonance heading, bold term, explicit sentence-level reference)

These are **unsung paths** — connections already stated in prose, not yet registered in the graph. They require near-zero deliberation: the intellectual work is done; only the structural registration is missing.

Collect all unsung paths and add them to the Topology Report. They are resolved in Step 3a, before any new introductions (Step 3b).

The Weave always runs with full filesystem access. No GitHub URL fallback.

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

**Step 3a: Formalize unsung paths**

Present all unsung paths from Step 1b to Loudon. For each:
- Name both entries
- Propose a link type and direction using the link ontology (SCHEMA §4)
- Note whether the mention is in a structurally significant location

Unsung paths are navigation hygiene, not proposals. The body text already asserts the connection; the YAML just hasn't caught up. Formalize all of them. The only exception: if a mention is passing, historical, or explicitly non-structural, note the deliberate exclusion with a one-line reason so it does not resurface in future Weaves.

**No rate limit applies here.** Every unsung path found should be formalized.

**Step 3b: Propose new introductions**

Identify pairs of entries that should be connected but are NOT already named in each other's body text — connections that emerge from reading the topology as a whole. This is the creative work of the Weave and the palace's genuine growth mechanism. For each proposal:
- Name both entries
- Name the proposed link type and direction
- Give one sentence of reasoning

**Rate limit: propose no more than 5 new introductions per Weave.** If more candidates exist, choose the ones that feel most alive right now. This constraint is intentional and serves two purposes: it forces curation (a new introduction should feel earned, not automatic) and it keeps the palace's growth slow enough to remain deliberate. A typed link is a permanent claim about the structure of knowledge. The palace and its gardener both benefit from a slow metabolism.

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

**Unsung paths:** [N findings]
1. [[Entry A]] body mentions "[phrase]" → propose [[Entry B]] as [link-type] — [structurally significant: yes/no]

**New introductions:** [N proposals, max 5]
1. [[Entry A]] —[type]→ [[Entry B]] — [one-line rationale]

**Proposed stage transitions:** [list]

**Deposit candidates flagged:** [list]

**Queue records processed:** [N]
```
