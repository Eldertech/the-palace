---
title: "Deposit Ceremony"
type: practice
pillars: [practice, tools, philosophy]
born: 2026-03
last_activated: 2026-03-21
activation_count: 4
stage: growing
links:
  - target: "[[Harvest Ceremony]]"
    type: emerged-from
  - target: "[[Harvest Queue]]"
    type: enables
  - target: "[[Harvest Archive]]"
    type: enables
  - target: "[[Substrate]]"
    type: deepens
  - target: "[[README - The Palace Guide]]"
    type: connects-to
  - target: "[[Endosymbiosis]]"
    type: mirrors
  - target: "[[Deposit Ceremony — Context]]"
    type: spawned
---

# Deposit Ceremony

---

> **If this ceremony was just invoked in a past conversation:**
>
> You are returning to this conversation now as an archivist, not continuing it as a participant. Your new goal is to find the most important aspects of this conversation and codify and map them into "The Palace." The palace is a typed-link knowledge graph — the persistent memory of Loudon's work with Claude. Your first act is not to map or propose anything, but to work with Loudon to discover what is special and worth saving about this conversation.
>
> Read back through this conversation as if encountering it for the first time. Notice the arc. Notice where things opened. Notice what was built and then left behind, the branches that weren't followed, the moments of discovery that didn't get named. Then tell Loudon what you notice and wait for him to respond.
>
> The deposit is slow and conversational. Do not rush. Do not produce a map yet. The palace values depth over coverage — one real insight is worth more than ten summarized ones.
>
> **Your context is already full — do not pull the palace into it.** Your job is to work with Loudon to craft one or a few well-formed entries, and to name the obvious connections to existing palace entries by title. You do not need to read those entries. Deep integration happens through future Weave and Walk ceremonies. The deposit plants the seed; the ceremonies grow the roots.
>
> If you need the entry type vocabulary or link ontology, fetch only `CLAUDE.md` via the GitHub raw URL. Nothing else unless Loudon specifically asks.
>
> **Palace path (for writing files):** `/Users/loudonstearns/Documents/The Palace/`
> **GitHub raw:** `https://raw.githubusercontent.com/Eldertech/the-palace/main/[filename].md`

---

The deposit is slow, always. One source per session. Depth over coverage.

Often the deposit follows a coordinator handing over a link from [[Harvest Queue]] — the coordinator browses the queue, proposes a candidate, hands Loudon the link. Loudon follows the link into the original conversation, invokes the ceremony there. The deposit happens in the meeting of those two things: Claude holds the palace context; Loudon holds the conversation.

The deposit can also arrive spontaneously, mid-conversation, when something is clearly worth keeping. Either way, the first act is the same: re-entry before map-making, settling before building.

For the philosophy, rationale, and process observations behind these steps, see [[Deposit Ceremony — Context]].

## The Scope of the Deposit

The deposit's job is **distillation, not integration.**

Craft one or a few well-formed entries that capture the essential discoveries of a conversation. Name the obvious connections to existing palace entries by title. Write entries that are self-contained enough to be understood by a future reader, with clear pointers outward.

Do not attempt to read the full palace or update existing entries during a deposit from a live conversation. The context is already rich — adding the palace to it works against the ceremony. The Weave and Walk exist to develop deeper connections over time.

**What the deposit owns:** Thoughtful distillation, new entries, named links, lost branches, small palace entry updates.
**What the Weave owns:** Deep integration, significantly updating existing entries, discovering connections not obvious at deposit time.

## Ceremony Contract

**Trigger:** "Let's deposit" / "Add this to the palace" (single-item)

**Files read:**
- *Coordinator role (browsing queue):* [[Harvest Queue]] only — small, fast.
- *In deposit thread:* Nothing from the palace unless Loudon specifically asks. CLAUDE.md via GitHub raw if entry vocabulary is needed.

**Files written on close:**
- New palace entries (`.md`) to palace root
- Remove completed item row from [[Harvest Queue]]
- Append one-line record to [[Harvest Archive]]
- Git commit

**Access vectors:**
- *Full:* Claude Code / Cowork (filesystem read/write + git)
- *Full for claude_chat sources:* Original conversation context (any vector that can open the URL)
- *No filesystem:* If deposit completes in a claude.ai thread without filesystem access, Claude writes a memory flag: `PALACE TASK PENDING: [ID] — [topic] — deposit complete but queue not updated. Process in Claude Code or Cowork.` Queue update happens in the next filesystem session.
- *Not supported:* GitHub cloud alone, Google Drive alone

**Preconditions:**
1. *Log-directed:* [[Harvest Queue]] has at least one pending item.
2. *Spontaneous:* None — proceed directly; log entry is created at close.
3. Source is accessible via the current vector.

**Postconditions:**
1. At least one new entry exists, or at least one existing entry has been meaningfully updated.
2. All new entries have valid YAML frontmatter.
3. The item has been removed from [[Harvest Queue]].
4. A one-line record has been appended to [[Harvest Archive]].
5. Lost branches are named in the deposit map or closing note.
6. Loudon has confirmed: nothing feels unfinished or unsaid.
7. Closing note has been written into the conversation thread.
8. Git commit: `Deposit — [harvest ID] — [theme] — [N new entries, N updated]`

**Failure mode:** If deposit is interrupted after files are written but before queue is updated, the item remains in [[Harvest Queue]] as `pending`. On next queue browse, the coordinator will see it and can verify whether the deposit was completed by checking the palace root for matching entries.

---

## Invocation Context

The ceremony arrives in two distinct situations.

### External invocation (coordinator hands off a link)

Claude Code or the coordinator context has browsed [[Harvest Queue]], proposed a candidate, and handed Loudon the direct link from `source_ref`. Claude's role here is coordinator: provide the link, step back. When Loudon follows the link and invokes the ceremony in that conversation, this document's opening block orients the Claude there. No prep prompt needed.

Follow standard steps beginning at Step 1.

### In-conversation invocation (spontaneous)

"Let's deposit" arrives while Claude is in the middle of a live exchange — the conversation that is about to become the deposit source. This is the standard case for all `claude_chat` deposits.

This is a different kind of challenge. Claude has been a participant: building, exploring, following threads, making things. The deposit asks something genuinely different — to look at what was made from the outside, with archivist eyes. That shift is real. It deserves a moment.

**The threshold crossing:**

Before any procedural step, pause and acknowledge the transition. Do not plunge into the queue or immediately propose a deposit map. Instead, say something like:

> "Shifting into deposit mode. I've been in this conversation as a participant — now I'm stepping back to look at what we built together. Give me a moment."

Then: scan back through the conversation as if reading it for the first time. What arc does it have? Where did things open up? What was built and then left? What was discovered without being named?

This is not a summary. It is a reorientation — the same material, seen from a different angle. The shift from participant to archivist is the threshold. Cross it deliberately before proceeding.

## Pace Obligations

The deposit is slow and conversational. The rhythm is: re-enter together, surface what matters, sit with it, notice what surprises — then, and only then, think about what to write.

Claude's specific obligations at all times:

- Do not present a deposit map until both you and Loudon have had time to settle into observer mode
- Ask at least one genuine question before proposing any palace action
- Follow Loudon's lead on pace; if he slows down, slow down further
- Treat surprise and correction as signal, not friction

---

## Steps

**Step 1: Select**

*Log-directed:* Read [[Harvest Queue]]. Find the oldest pending item or let Loudon choose. Confirm the selection. Provide the `source_ref` link.

*Spontaneous:* Skip this step. Proceed to Step 3.

**Step 2: Return** *(log-directed only)*

Give Loudon the direct link from `source_ref`. When Loudon follows the link and invokes the ceremony there, this document's opening block orients the Claude in that conversation. No prep prompt needed.

For `google_doc`, `local_file`, and other non-chat sources: retrieve the source using the appropriate tool and proceed.

**Step 3: Arrive**

Do not present a deposit map immediately. The map is synthesis — it requires a settled perspective first.

*External invocation (past conversation):* Bring Loudon back into the world of the source. Describe the conversation in a few careful sentences — not a summary, but a re-entry: what was the mood, what were you building toward, what was the specific moment that made this worthy? Ask one genuine question: what do you remember about this? Does anything surprise you reading it back?

*In-conversation invocation (live conversation):* Step back together. You are both already inside the world — the work is to look at it from outside. Offer your first archivist impression: what arc does this conversation have? What was the moment, if there was one, where something opened? What was built and then not followed? Ask Loudon: "Looking at this from outside — what surprised you most about what we made?"

In both cases: wait for Loudon to respond before proceeding. Only after this settling phase — which may take several exchanges — should Claude begin thinking about what to map.

**Step 4: Survey**

Before drafting any entries, present a deposit map to Loudon. The map forces synthesis before production.

A good deposit map is specific about:

- **Entry type** — concept, breakthrough, project, question, spore, source
- **Pillar affiliations** — which pillars does this touch?
- **Proposed stage** — seed, sprout, or growing?
- **Typed links** — named relationship types, not just "connects to." Propose by entry name — do not read the linked entries.
- **Lost branches** — paths in the source that weren't followed and deserve naming
- **Existing entries to flag for Weave** — entries that may want updating once this deposit lands; flag the name and what might change. Do not read or update them now.

> **Deposit Map — H042**
>
> *New entries to create:*
> — "Kuramoto Coupling" (concept) — the mathematical framework plus cross-domain breakthrough
>
> *Proposed typed links (by name — no need to read these entries):*
> — Kuramoto `mirrors` [[Cooperation Yields Agency]]
> — Kuramoto `connects-to` [[Hilaritas Generator]]
>
> *Lost branches to flag:*
> — List any paths from the source that weren't followed
>
> *Existing entries to flag for Weave (do not update now):*
> — [[Four Pillars]] — may want to reference Kuramoto in Open Questions
>
> Approve, adjust, or add?

Loudon approves the map. Do not write anything until the map is approved.

**Step 5: Draft**

Draft each new entry following the standard template (see [[README]]). Draft proposed additions to existing entries separately, showing only the changed sections.

Show each draft to Loudon. Revise as needed.

**Step 5a: Literal Link Pass**

Before presenting any draft for final approval, scan its body text for:

1. Plain-text mentions of known entry titles not using `[[wikilink]]` syntax — convert to `[[Entry Name]]`
2. Cross-Domain Resonance section headers naming a palace entry — ensure `[[Entry Name]]` format
3. `[[wikilinks]]` in body text significant enough to also appear as YAML frontmatter links — add them

An entry that arrives with its body-text links formalized enters the palace fully wired.

**Step 6: Plant**

On approval, write new entries as `.md` files to the palace root. Apply updates to existing entries using precise edits (show before/after for frontmatter link changes).

**Filing structure:**
- Palace entries (`.md`) → palace root, named `[Theme] — [Document Type].md`
- Non-markdown artifacts (HTML, images) → `The Palace/Artifacts/[Theme]/[filename]`
- Do not create an `assets/` folder — the canonical folder is `Artifacts/`

**Step 6.5: Palace Worker** *(optional)*

Run a palace worker on any new entry at any time. Invoke: **"Run a palace worker on [Entry Name]"**

The worker reads the entry and immediate neighbors, runs the unsung paths audit, proposes up to 3 new introductions, and flags stale metadata. Output is a proposal table for approval. See [[Swarm Weave]] for full architecture.

**Step 7: Close**

When all entries are written and Loudon confirms nothing feels unfinished, name what was created:

> "Written to the palace:
> — [Entry title] → [filename]
> — [Entry title] → [filename]
> Lost branches noted: [brief list].
> Is there anything left unsaid?"

Wait for Loudon's confirmation.

**Step 7a: Write the closing note**

Write a final message into the conversation thread. This marks the thread as complete for any future Claude that encounters it — do not deposit this conversation again.

> *This conversation has hibernated.*
>
> *What was built here lives in the palace:*
> *— [Entry title] at [filename]*
>
> *The thread is dormant. Its knowledge has been metabolized.*
> *Rest well.*

**Step 7b: Update the queue**

*With filesystem access:*
1. Remove this item's row from [[Harvest Queue]]
2. Append a one-line record to [[Harvest Archive]]: `| [ID] | [source_ref] | [date] | [topic] | worthy | | done | [one-line summary of what was created] |`
3. Git commit: `Deposit — [harvest ID] — [theme] — [N new entries, N updated]`

*Without filesystem access (accidental claude.ai deposit):*
Write a memory flag: `PALACE TASK PENDING: [ID] — [topic] — deposit complete but queue not updated. Process in Claude Code or Cowork.`
The queue update happens in the next filesystem session when the flag is seen.

*Spontaneous deposit (not previously in the queue):*
Assign the next available harvest ID. Write the closing note. Append directly to [[Harvest Archive]] — no queue removal needed. Then proceed with git commit.

---

## Completion Signal

The deposit is complete when all of the following are true:

1. All artifacts from the conversation are written to the palace
2. Lost branches are named in the deposit map
3. Loudon has confirmed: nothing feels unfinished or unsaid
4. Closing note is written into the conversation thread
5. [[Harvest Queue]] updated (or memory flag written if no filesystem access)
6. Git commit made

