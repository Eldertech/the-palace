---
title: "Deposit Ceremony"
type: concept
pillars: [practice, tools, philosophy]
born: 2026-03
last_activated: 2026-03
activation_count: 1
stage: sprout
links:
  - target: "[[Harvest Ceremony]]"
    type: emerged-from
  - target: "[[Harvest Log]]"
    type: enables
  - target: "[[Substrate]]"
    type: deepens
  - target: "[[README - The Palace Guide]]"
    type: connects-to
---

# Deposit Ceremony

The second ceremony in the two-ceremony harvest system. Where the [[Harvest Ceremony]] flags sources as worthy, the Deposit Ceremony reads a single flagged source deeply and weaves its knowledge into the palace — drafting entries, proposing typed links, updating existing entries, and writing to disk on Loudon's approval.

One source per session. Depth over coverage.

## When to Run

Deposit sessions are triggered by:
- A session explicitly dedicated to deposit work ("let's deposit")
- Loudon choosing to deposit mid-harvest when something particularly rich comes up
- A natural pause after several harvest sessions accumulate worthy items

Check the [[Harvest Log]] for items with `deposit_status: pending`. Deposit oldest-first unless a newer item is directly relevant to current work.

## Starting a Deposit Session

**Step 1: Select**
Read the [[Harvest Log]]. Find the oldest `worthy` or `partial` item with `deposit_status: pending`. Confirm the selection with Loudon, or let Loudon choose a specific item.

**Step 2: Load**
Retrieve the source using the appropriate tool:
- `claude_chat`: Use `recent_chats` with the chat's datetime, or `conversation_search` with keywords from `deposit_notes`
- `google_doc`: Use `google_drive_fetch` with the doc ID from `source_ref`
- `local_file`: Use Filesystem read tools with the path from `source_ref`

**Step 3: Read Deeply**
Read the full source. Identify:
- New concepts not yet in the palace
- Breakthroughs — moments where understanding shifted
- Cross-domain connections that should become typed links
- Quotes for [[Palace Quotes]]
- Open questions that belong in existing entries
- Projects that deserve their own entry

**Step 4: Map Before Building**
Before drafting any entries, present a deposit map to Loudon:

> **Deposit Map — H042**
> 
> *New entries to create:*  
> — "Kuramoto Coupling" (concept) — the mathematical framework plus cross-domain breakthrough
> 
> *Existing entries to update:*  
> — [[Four Pillars]] → add Kuramoto to Open Questions  
> — [[Cooperation Yields Agency]] → add a mirrors link to Kuramoto
> 
> *Proposed typed links:*  
> — Kuramoto `mirrors` Cooperation Yields Agency  
> — Kuramoto `connects-to` Hilaritas Generator
> 
> *Quotes:*  
> — One candidate for [[Palace Quotes]]
> 
> Approve, adjust, or add?

Loudon approves the map, adjusts scope, or adds items. Do not write anything until the map is approved.

**Step 5: Draft**
Draft each new entry following the standard template (see [[README]]). Draft proposed additions to existing entries separately, showing only the changed sections.

Show each draft to Loudon. Revise as needed.

**Step 6: Write**
On approval, write new entries as `.md` files to the palace. Apply updates to existing entries using precise edits (show the before/after for any frontmatter link changes).

**Step 7: Close**
Update the [[Harvest Log]]:
- Set `deposit_status: done` for the completed item
- Add a one-line note to `deposit_notes` summarizing what was created
- Add a line to `## Session History`

## The Deposit Map

The deposit map is the most important step. It forces synthesis before production — you understand what you're building before you build it. It also gives Loudon control over scope: some sources could generate five entries; others might only update two existing ones. The map lets Loudon decide how deep to go before any work is done.

A good deposit map is specific about:
- **Entry type** — concept, breakthrough, project, question, spore, source
- **Pillar affiliations** — which pillars does this touch?
- **Proposed stage** — seed, sprout, or growing?
- **Typed links** — named relationship types, not just "connects to"

## Interaction Style

Deposit sessions are slow and deliberate. Claude reads, synthesizes, maps. Loudon reviews, adjusts, approves. The rhythm is: draft → review → revise → approve → write. No entry is written to disk without explicit approval.

Unlike Harvest, depth is welcome. If a source opens into something unexpected, follow it. A single deposit session might surface connections that weren't in the original `deposit_notes`.

## Partial Sources

If a source was flagged `partial`, the deposit map should reflect that — only the relevant section gets deposited. Note clearly in the closing log update what was left out and why, so future Claude instances don't re-examine the skipped portions.

## Updating Existing Entries

When adding to an existing entry:
- Increment `activation_count` in the frontmatter
- Update `last_activated` to current month (YYYY-MM format)
- Adjust `stage` if the entry has genuinely matured
- Add new typed links to the frontmatter `links` array only if they represent structural relationships (not casual mentions)
- Add to body prose in the appropriate section (Cross-Pillar Connections, Open Questions, etc.)

Always show the full frontmatter diff and the specific prose additions before writing.

## Resuming After a Break

A new Claude instance can resume a Deposit session by:

1. Reading [[README - The Palace Guide]]
2. Reading this entry
3. Reading [[Harvest Log]] — find the item marked `deposit_status: in-progress` (if any) or the oldest `pending` item
4. Retrieving the source using the `source_ref`
5. Confirming with Loudon: "Ready to deposit H042 — the Kuramoto coupling session from April 2025. Shall I produce the deposit map?"

If a prior session got as far as a deposit map but didn't write anything, note that in the log as `deposit_status: in-progress` with the map details in `deposit_notes` so the next session doesn't have to regenerate it.

## Open Questions

- Should every deposit session end with a mini-Weave — checking whether the new entries reveal new connections to other existing entries?
- When a deposit session produces a major hub entry, should it trigger a Walk ceremony to understand how it changes the overall topology?
- How do we handle deposits where the source is no longer accessible (deleted conversation, inaccessible file)? Should those items be marked `deposit_status: inaccessible` and preserved or composted?
