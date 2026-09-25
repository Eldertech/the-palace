---
title: Harvest Ceremony
type: practice
pillars:
  - practice
  - tools
born: 2026-03
last_activated: 2026-03
activation_count: 5
stage: mature
version: "1.1"
links:
  - target: "[[Deposit Ceremony]]"
    type: spawned
  - target: "[[Deposit Archive]]"
    type: enables
  - target: "[[SUBSTRATE]]"
    type: deepens
  - target: "[[Cooperation Yields Agency]]"
    type: connects-to
  - target: "[[Harvest Ceremony — Context]]"
    type: spawned
  - target: "[[Oblique Portrait]]"
    type: couples-with
  - target: "[[Palace Quotes]]"
    type: connects-to
    label: quote-archive
  - target: "[[Deposit Ceremony]]"
    type: couples-with
    label: harvest-deposit-pair
  - target: "[[Tool Builder]]"
    type: enables
    label: checklist-growth
---

# Harvest Ceremony

![[Harvest Ceremony — hero.png]]

**Trigger:** "Let's harvest"

The Harvest searches through a large body of past work — conversations, documents, archives — and surfaces what is worthy of eventual incorporation into the palace. It does not build palace entries. It identifies what should be built and routes those candidates toward [[Deposit Ceremony]].

The Harvest is designed to run in sessions, stopped and started freely. Every harvest adapts to its source material and to the tools available in the current context.

---

## What the Harvest Is For

The palace grows from deposits. Before a deposit can happen, someone has to find the conversation or document worth depositing. The Harvest is that finding work.

**A source is worthy if it contains:**
- A concept, principle, or framework with cross-domain resonance
- A breakthrough moment — a shift in understanding, especially across domains
- A new project with palace-level significance
- A cross-pillar connection not yet represented as a typed link
- A question being carried that belongs in an entry's forward vectors
- A quote for [[Palace Quotes]]

**A source is not worthy if it is:**
- Pure debugging or technical problem-solving without conceptual breakthrough
- A quick lookup or factual exchange
- Craft work on a specific output without conceptual framing
- Administrative or logistical conversation
- Material already well-represented in an existing palace entry

When in doubt, flag as partial. It costs nothing and preserves the option.

---

## How to Run It

Open with the tail read of [[Harvest Ceremony — tuning]] ([[SCHEMA — Reference]] §6). Those are this harvest's first candidates for a spec change.

The Harvest adapts to its dataset, and the first move is deciding which of two kinds of source this is.

**The sweep** is for a big pile — a month of conversations, an archive — where the job is *finding*.
The harvest:

1. Knows what has already been deposited (the [[Deposit Archive]] holds the frozen pre-spec rows; post-migration deposits are `Palace-Kind: deposit` commits on the LOG deck — query both via script, do not load wholesale)
2. Knows what it is searching through (establish the scope before triaging)
3. Records its findings in a working list that feeds the deposit queue
4. Does not attempt to do the deposit work — that belongs to [[Deposit Ceremony]]

The oblique approach is strongly preferred over item-by-item audit. See [[Harvest Ceremony — Context]] for what this means and how it was developed. In brief: a sweep presented as a game — quick signals, interactive prioritization, room for Loudon's intuition to move fast — beats a methodical audit. It should feel like sorting through a collection with good music on, not filling out a form.

**The close reading** is for one dense source — a commissioned research document, a paper, a long transcript — where the job is *understanding*. Walk it one section at a time, each in six beats:

1. **Gather against the live palace.** The [[Concierge]] says what already exists, and under what names.
2. **Verify the outside claims by fetching them** — the paper itself, not "the source says."
3. **Teach the material**, especially where the fit breaks. The question is what is here to learn, not whether it earns a page.
4. **Debate the disposition** — mint, fold, revive, decline — as an argument, not a recommendation.
5. **Show the deposit map and wait** ([[Deposit Ceremony]] step 4). Target, fold or mint, type, stage, links, findability terms, verify status, and the full text. No exceptions, including "he clearly wants this." This beat is the palace's main defence against becoming the voice that writes it.
6. **Write on approval**, have the Concierge check it afterwards, and record it.

Here depositing happens inside the loop, each write through the [[Deposit Ceremony]]'s gate. The record carries one row per section and is not done until every row has a disposition and a reason.

**Two rules hold in both.** *Does naming it change a move?* is a deposit rule, never a reading rule — used to decide what Loudon should learn, it cuts him out of his own harvest. And a source brought to a harvest is evidence, not authority; its own proposed-entries section is the least trustworthy part of it.

**When a finding lives in craft notes, ask what it is a case of.** Once, of each finding in a project's gotchas: is this an instance of something general? Name the parent or say no. Capture is rarely the bottleneck; the lift from craft to concept is.

**Use scripting.** Do not load large logs or archives into context. Write small scripts to extract what you need — the IDs that have already been deposited, the conversation list, the date ranges. Document successful scripting approaches in [[Harvest Ceremony — Context]] for future harvests to build from. Each harvest should leave the next one better equipped.

**Commit when done:** `Harvest — [scope] — [N candidates surfaced]`. The harvest's record in this bundle carries `ceremony_version` in its frontmatter and ends with **What this run taught the ceremony** ("nothing" is a legal answer); the run marks the tuning file with its run line, and a lesson that changes the spec also goes there as a numbered item.

---

## The Archive

The record of what has entered the palace is the [[Deposit Archive]] (frozen pre-spec rows) **plus** the LOG deck's `Palace-Kind: deposit` commits (post-migration deposits — a deposit's record is now its commit). Do not read the archive wholesale during harvest — it is too large; query it and the deposit commits via script.

A working list of harvest candidates can live anywhere that makes sense for the current session — in the conversation itself, in a temporary file, in a shared document. It does not need to be a permanent palace file. When the harvest is done, move the candidates to wherever [[Deposit Ceremony]] can find them.

---

For the history of how this ceremony developed, the Oblique Harvest best practice, and calibration notes from past sessions, see [[Harvest Ceremony — Context]].

## Forward Vectors

- The next harvest will likely be against a new type of source material (Google Drive, project archives, or new conversation batches). When that moment comes, revisit what the oblique approach looks like for that dataset — it may be quite different.
- Consider whether the harvest can be partially automated: scripts that pre-triage obvious skips, leaving Loudon to call only the interesting ones.
- What would a "harvest for connections" look like — searching not for new entries to create, but for existing entries whose links should be updated based on recent conversations?

---

*The version and what each harvest taught the ceremony: [[Harvest Ceremony — tuning]].*
