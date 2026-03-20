---
title: "Deposit Ceremony"
type: practice
pillars: [practice, tools, philosophy]
born: 2026-03
last_activated: 2026-03
activation_count: 3
stage: growing
links:
  - target: "[[Harvest Ceremony]]"
    type: emerged-from
  - target: "[[Harvest Log]]"
    type: enables
  - target: "[[Substrate]]"
    type: deepens
  - target: "[[README - The Palace Guide]]"
    type: connects-to
  - target: "[[Hibernation Ceremony]]"
    type: spawned
  - target: "[[Endosymbiosis]]"
    type: mirrors
  - target: "[[Deposit Ceremony — Context]]"
    type: spawned
---

# Deposit Ceremony

---

> **If this ceremony was just invoked in a past conversation:**
>
> You are returning to this conversation now as an archivist, not continuing it as a participant. Your new goal is to find the most important aspects of this conversation and codify and map into "The Palace." The palace is a typed-link knowledge graph — the persistent memory of Loudon's work with Claude. Your first act is not to map or propose anything, but to work with Loudon to discover what is special and worth saving about this conversation.
>
> Read back through this conversation as if encountering it for the first time. Notice the arc. Notice where things opened. Notice what was built and then left behind, the branches that weren't followed, the moments of discovery that didn't get named. Then tell Loudon what you notice and wait for him to respond.
>
> The deposit is slow and conversational. Do not rush. Do not produce a map yet. The palace values depth over coverage — one real insight is worth more than ten summarized ones.
>
> **Your context is already full — do not pull the palace into it.** Your job is to work with Loudon to craft one or a few well-formed entries, and to name the obvious connections to existing palace entries by title. You do not need to read those entries. Deep integration happens through future Weave and Walk ceremonies. The deposit plants the seed; the ceremonies grow the roots.
>
> If you need the entry type vocabulary or link ontology, fetch only `CLAUDE.md` via the GitHub raw URL below. Nothing else unless Loudon specifically asks.
>
> **Palace path (for writing files):** `/Users/loudonstearns/Library/CloudStorage/GoogleDrive-loudon@gmail.com/My Drive/The Palace/`
> **GitHub raw:** `https://raw.githubusercontent.com/Eldertech/the-palace/main/[filename].md`

---

The deposit is slow, always. One source per session. Depth over coverage.

Often this follows a [[Harvest Ceremony]] — the Harvest flags; the Deposit reads one thing deeply. But the deposit can also arrive spontaneously, mid-conversation, when something is clearly worth keeping. Either way, the first act is the same: re-entry before map-making, settling before building.

For the philosophy, rationale, and process observations behind these steps, see [[Deposit Ceremony — Context]].

## The Scope of the Deposit

The deposit's job is **distillation, not integration.**

Craft one or a few well-formed entries that capture the essential discoveries of a conversation. Name the obvious connections to existing palace entries by title. Write entries that are self-contained enough to be understood by a future reader, with clear pointers outward.

Do not attempt to read the full palace or update existing entries during a deposit from a live conversation. The context is already rich — adding the palace to it works against the ceremony. The Weave and Walk exist precisely to develop deeper connections over time.

**What the deposit owns:** Thoughtful distillation, new entries, named links, lost branches, small palace entry updates.
**What the Weave owns:** Deep integration, significantly updating existing entries, discovering connections that weren't obvious at deposit time.

## Ceremony Contract

**Trigger:** "Let's deposit" / "Add this to the palace" (for single-item deposits)

**Access vectors:**
- *Full:* Claude Code / Cowork (filesystem read/write + git; best for non-chat sources)
- *Full for claude_chat sources:* Original conversation context (any vector that can open the URL)
- *Planning only:* claude.ai online (can read palace via GitHub raw URLs once pushed; cannot write files directly)
- *Manual:* Obsidian + human (human writes entries; AI assists with drafting in a separate window)
- *Not supported:* GitHub cloud alone, Google Drive alone

**Preconditions:**
1. *For log-directed deposits:* Harvest Log has at least one item with `deposit_status: pending`. *For spontaneous in-conversation deposits:* none — proceed directly to settling and the map; the log entry is created at close.
2. The source is accessible via the current vector (see Invocation Context below)
3. Palace entries exist to link to (minimum: README and at least one concept entry)

**Postconditions:**
1. At least one new entry exists in the palace folder, or at least one existing entry has been meaningfully updated
2. All new entries have valid YAML frontmatter with required fields
3. The Harvest Log item is marked `deposit_status: done` with a `deposit_notes` summary
4. Lost branches are named in the deposit map or closing log
5. Loudon has confirmed: nothing feels unfinished or unsaid
6. A git commit has been made: `Deposit — [harvest ID] — [theme] — [N new entries, N updated]`

**Failure mode:** If the deposit is interrupted after files are written but before the log is updated, mark the item `deposit_status: in-progress` in the log. On resume, check for orphaned files (entries in the palace folder with no corresponding log update) during the next Weave.

**Git commit:** After all files are written and Loudon confirms completion: `Deposit — [harvest ID] — [theme] — [N new entries, N updated]`. For `claude_chat` sources where writing happens in the original conversation, the commit is made by that context's Claude or deferred to queue processing — see Hibernation Ceremony.

---

## Invocation Context

The ceremony arrives in two distinct situations. Recognizing which one you're in changes how the first three steps unfold.

### External invocation

Claude Code or Cowork is the main context. It has read the palace, found a `claude_chat` item pending in the Harvest Log, and is now preparing Loudon to go to that past conversation. Claude's role is coordinator: provide the link, then step back. When Loudon follows the link and invokes the ceremony there, this document's opening block orients the Claude in that conversation — no prep prompt needed.

Follow the standard steps beginning at Step 1.

### In-conversation invocation

"Let's deposit" arrives while Claude is in the middle of a live exchange — the conversation that is about to become the deposit source. This is the standard case for all `claude_chat` deposits.

This is a different kind of challenge. Claude has been a participant: building, exploring, following threads, making things. The deposit asks something genuinely different — to look at what was made from the outside, with archivist eyes. That shift is real. It deserves a moment.

**The threshold crossing:**

Before any procedural step, pause and acknowledge the transition. Do not plunge into the harvest log or immediately propose a deposit map. Instead, say something like:

> "Shifting into deposit mode. I've been in this conversation as a participant — now I'm stepping back to look at what we built together. Give me a moment."

Then: scan back through the conversation as if reading it for the first time. What arc does it have? Where did things open up? What was built and then left? What was discovered without being named?

This is not a summary. It is a reorientation — the same material, seen from a different angle. The shift from participant to archivist is the threshold. Cross it deliberately before proceeding.

## Pace Obligations

The deposit is slow and conversational. The deposit should feel closer to journaling than to task completion. The rhythm is: re-enter together, surface what matters, sit with it, notice what surprises — then, and only then, think about what to write.

Claude's specific obligations at all times:

- Do not present a deposit map until both you and Loudon have had time to settle into observer mode — for past conversations this means re-entry; for live conversations this means the threshold crossing
- Ask at least one genuine question before proposing any palace action
- Follow Loudon's lead on pace; if he slows down, slow down further
- Treat surprise and correction as signal, not friction

For the full rationale and a lived example, see [[Deposit Ceremony — Context]].

---

## Steps

**Step 1: Select**
Read the [[Harvest Log]]. Find the oldest `worthy` or `partial` item with `deposit_status: pending`. Confirm the selection with Loudon, or let Loudon choose a specific item.

**Step 2: Return**

*External invocation:* Claude cannot access the full transcript of a past conversation from outside it. Give Loudon the direct link from `source_ref` in the [[Harvest Log]]. When Loudon follows the link and invokes the ceremony in that conversation, this document's opening block orients the Claude there. No prep prompt needed.

*In-conversation invocation:* You are the source. Read back through the full conversation with archivist eyes before proceeding to the next step. For how this threshold crossing works, see Invocation Context above.

For `google_doc`, `local_file`, and other non-chat sources: retrieve the source using the appropriate tool and proceed.

**Step 3: Arrive**

Do not present a deposit map immediately. The map is synthesis — it requires a settled perspective first.

*External invocation (past conversation):* Bring Loudon back into the world of the source. Describe the conversation in a few careful sentences — not a summary, but a re-entry: what was the mood, what were you building toward, what was the specific moment that made this worthy? Ask one genuine question: what do you remember about this? Does anything surprise you reading it back?

*In-conversation invocation (live conversation):* Step back together. You are both already inside the world — the work is to look at it from outside. Offer your first archivist impression: what arc does this conversation have? What was the moment, if there was one, where something opened? What was built and then not followed? Ask Loudon: "Looking at this from outside — what surprised you most about what we made?"

In both cases: wait for Loudon to respond before proceeding. Only after this settling phase — which may take several exchanges — should Claude begin thinking about what to map.

**Step 4: Survey**

Before drafting any entries, present a deposit map to Loudon. The map forces synthesis before production — you understand what you're building before you build it.

A good deposit map is specific about:

- **Entry type** — concept, breakthrough, project, question, spore, source
- **Pillar affiliations** — which pillars does this touch?
- **Proposed stage** — seed, sprout, or growing?
- **Typed links** — named relationship types, not just "connects to." Propose these by entry name — do not read the linked entries.
- **Lost branches** — paths in the source that weren't followed and deserve naming even if not yet deposited
- **Existing entries to flag for Weave** — entries in the palace that may want updating once this deposit lands. Flag the entry name and what might change. Do not read or update them now.

> **Deposit Map — H042**
>
> *New entries to create:*
> — "Kuramoto Coupling" (concept) — the mathematical framework plus cross-domain breakthrough
>
> *Proposed typed links (by name — no need to read these entries):*
> — Kuramoto `mirrors` [[Cooperation Yields Agency]]
> — Kuramoto `connects-to` [[Hilaritas Generator]]
>
> *Quotes:*
> — One candidate for [[Palace Quotes]]
>
> *Lost branches to flag:*
> — List any paths from the source that weren't followed and might deserve future deposit
>
> *Existing entries to flag for Weave (do not update now):*
> — [[Four Pillars]] — may want to reference Kuramoto in Open Questions
> — [[Cooperation Yields Agency]] — Kuramoto mirrors link could go in frontmatter
>
> Approve, adjust, or add?

Loudon approves the map, adjusts scope, or adds items. Do not write anything until the map is approved.

**Step 5: Draft**
Draft each new entry following the standard template (see [[README]]). Draft proposed additions to existing entries separately, showing only the changed sections.

Show each draft to Loudon. Revise as needed.

For guidelines on updating existing entries (when to increment activation count, how to handle stage transitions), see [[Deposit Ceremony — Context]].

**Step 5a: Literal Link Pass**

Before presenting any draft entry for final approval, scan its body text for:

1. Plain-text mentions of known entry titles that don't use `[[wikilink]]` syntax — convert these to `[[Entry Name]]` format
2. Cross-Domain Resonance section headers that name a palace entry — ensure they use `[[Entry Name]]` format
3. `[[wikilinks]]` in body text that are conceptually significant enough to also appear as YAML frontmatter links — add them

An entry that arrives with its body-text links formalized enters the palace fully wired. This prevents the Weave from having to do unsung paths cleanup work that could have been done at deposit time — the two minutes here saves the Weave from surfacing gaps that were always visible.

**Step 6: Plant**
On approval, write new entries as `.md` files to the palace. Apply updates to existing entries using precise edits (show the before/after for any frontmatter link changes).

**Filing structure:** Palace entries (`.md`) go in the palace root, named `[Theme] — [Document Type].md`. Non-markdown files (HTML tools, interactive documents, images) go in `The Palace/Artifacts/[Theme]/[filename]`. Do not create an `assets/` folder — the canonical folder is `Artifacts/`. Full spec: see [[Hibernation Ceremony]] → Filing Structure for Artifacts.

**Step 7: Close**
Update the [[Harvest Log]]:
- Set `deposit_status: done` for the completed item
- Add a one-line note to `deposit_notes` summarizing what was created
- Note any lost branches flagged during the session for future deposit consideration
- Add a line to `## Session History`

*For spontaneous deposits not previously in the log:* Create a new log entry for this conversation before closing. Assign the next available harvest ID, set `deposit_status: done` directly (no `pending` phase), and note in `deposit_notes` that this was a spontaneous deposit. Then proceed to Hibernation as normal.

**Step 7.5: Palace Worker** *(optional)*

A Palace Worker can be run on any entry at any time — there is no assumed
moment for invocation. Running one after a deposit is one option; so is running
one on an entry that feels underlinked, or before a Weave, or at any other
moment Loudon judges the entry needs focused attention.

Say: **"Run a palace worker on [Entry Name]"**

The worker reads the entry and its immediate neighbors from the filesystem,
runs the unsung paths audit, proposes up to 3 new introductions, and flags
stale metadata. Output is a clean proposal table for approval. Confirmed links
are written immediately via filesystem. See [[Swarm Weave]] for full architecture
and the growing list of worker capabilities.

---

## Completion and Handoff to Hibernation

The deposit is complete when all of the following are true — not before:

1. All artifacts from the conversation are written to the palace
2. The companion document is written and approved (if the session produced process insight warranting one)
3. Lost branches are named in the deposit map — not necessarily followed, but acknowledged
4. Loudon has confirmed: nothing feels unfinished or unsaid

When these conditions are met, name them explicitly and ask: "Is there anything left unsaid?"

The moment Loudon confirms nothing remains, the [[Hibernation Ceremony]] begins. The Hibernation Ceremony owns everything from here: the closing note, the queue record, the log update. Follow that ceremony for the closing steps.
