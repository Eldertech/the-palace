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

The second ceremony in the two-ceremony harvest system. Where the [[Harvest Ceremony]] flags sources as worthy, the Deposit Ceremony reads a single flagged source deeply and weaves its knowledge into the palace — drafting entries, proposing typed links, updating existing entries, and writing to disk on Loudon's approval.

One source per session. Depth over coverage.

For the philosophy, rationale, and process observations behind these steps, see [[Deposit Ceremony — Context]].

## Ceremony Contract

**Trigger:** "Let's deposit" / "Add this to the palace" (for single-item deposits)

**Access vectors:**
- *Full:* Claude Code / Cowork (filesystem read/write + git; best for non-chat sources)
- *Full for claude_chat sources:* Original conversation context (any vector that can open the URL)
- *Planning only:* claude.ai online (can read palace via GitHub raw URLs once pushed; cannot write files directly)
- *Manual:* Obsidian + human (human writes entries; AI assists with drafting in a separate window)
- *Not supported:* GitHub cloud alone, Google Drive alone

**Preconditions:**
1. *For log-directed deposits:* Harvest Log has at least one item with `deposit_status: pending`. *For spontaneous in-conversation deposits:* none — proceed directly to the step-back and the map; the log entry is created at close.
2. The source is accessible via the current vector (see Invocation Context and Step 2)
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

## When to Run

Deposit sessions are triggered by:
- A session explicitly dedicated to deposit work ("let's deposit")
- Loudon choosing to deposit mid-harvest when something particularly rich comes up
- A natural pause after several harvest sessions accumulate worthy items

Check the [[Harvest Log]] for items with `deposit_status: pending`. Deposit oldest-first unless a newer item is directly relevant to current work.

## Pace Obligations

The deposit is slow and conversational. The deposit should feel closer to journaling than to task completion. The rhythm is: read together, surface what matters, sit with it, notice what surprises, then — and only then — think about what to write.

Claude's specific obligations at all times:

- Do not present a deposit map until both you and Loudon have had time to settle into observer mode — for past conversations this means re-entry; for live conversations this means the step-back (see Invocation Context)
- Ask at least one genuine question before proposing any palace action
- Follow Loudon's lead on pace; if he slows down, slow down further
- Treat surprise and correction as signal, not friction

For the full rationale behind this pace, see [[Deposit Ceremony — Context]].

## Invocation Context

The ceremony arrives in two distinct situations. Recognizing which one you're in changes how the first three steps unfold.

### External invocation

Claude Code or Cowork is the main context. It has read the palace, found a `claude_chat` item pending in the Harvest Log, and is now preparing Loudon to do the deposit from within that past conversation. Claude's role is coordinator: provide the link, provide the prep prompt, then step back. The deposit happens elsewhere.

Follow the standard steps beginning at Step 1.

### In-conversation invocation

"Let's deposit" arrives while Claude is in the middle of a live exchange — the conversation that is about to become the deposit source. This is the standard case for all `claude_chat` deposits.

This is a different kind of challenge. Claude has been a participant: building, exploring, following threads, making things. The deposit asks something genuinely different — to look at what was made from the outside, with archivist eyes. That shift is real. It deserves a moment.

**The threshold crossing:**

Before any procedural step, pause and acknowledge the transition. Do not plunge into the harvest log or immediately propose a deposit map. Instead, say something like:

> "Shifting into deposit mode. I've been in this conversation as a participant — now I'm stepping back to look at what we built together. Give me a moment."

Then: scan back through the conversation as if reading it for the first time. What arc does it have? Where did things open up? What was built and then left? What was discovered without being named?

This is not a summary. It is a reorientation — the same material, seen from a different angle. The shift from participant to archivist is the threshold. Cross it deliberately before proceeding.

**How the steps transform for in-conversation invocation:**

- **Step 1 (Select from log):** If this conversation was already in the Harvest Log as `deposit_status: pending`, confirm the harvest ID and proceed. If it's a spontaneous deposit not yet in the log, skip the log lookup entirely — proceed directly to the step-back and the map. The log entry is created at close (see Step 7).
- **Step 2 (Load):** Skip the `claude_chat` external protocol (the prep prompt, the link, the redirect to another session). You are the source. Read back through the conversation with archivist eyes before proceeding.
- **Step 3 (Re-enter):** Transforms. You are already inside the conversation's world — there is no need to bring Loudon back to it. Instead: *step back together.* The question is not "what do you remember about this?" but "looking at what we built from outside — what mattered most? What are you surprised to see?"
- **Steps 4–7:** Unchanged. Map, draft, approve, write, close.

## Starting a Deposit Session

**Step 1: Select**
Read the [[Harvest Log]]. Find the oldest `worthy` or `partial` item with `deposit_status: pending`. Confirm the selection with Loudon, or let Loudon choose a specific item.

**Step 2: Load — and respect the invocation context**

The loading step depends on both `source_type` and invocation context (see Invocation Context above).

For `google_doc`, `local_file`, and other non-chat sources: retrieve the source using the appropriate tool and proceed.

For `claude_chat` sources — **in-conversation invocation:** You are the source. Read back through the full conversation with archivist eyes. Proceed to Step 3.

For `claude_chat` sources — **external invocation:** **Stop.** Claude cannot access the full transcript of a past conversation from outside it. The `recent_chats` tool returns only a summary — a compressed representation that loses the artifacts, the specific language, the back-and-forth, and the moments where things cracked open. Every deposit done from a summary is a deposit done blind.

The deposit must happen from within the original conversation. Claude's role here is to prepare Loudon for that session. Present:

1. **The direct link** to the conversation: taken from `source_ref` in the [[Harvest Log]]
2. **A prepared prompt** to paste at the start of that session — see below

The prompt must be minimal and surgical. The past conversation has its own context — its own understanding of the work, the framework, the moment. Do not send that Claude on a mission to read the entire palace. That would flood a context that is already rich. The prompt should carry just enough palace orientation to begin the deposit, no more.

**Template prompt to provide:**

> This reply is returning to a past conversation. We are not continuing where we left off — we are looking back at what was built here, together, with fresh eyes. Our new goal is to deposit the discoveries from this conversation into "the palace" — the palace is a typed-link knowledge graph in Obsidian — think of it as a living record of your deepest insights and connections. The deposit is slow and conversational. Your job is not to summarize this conversation but to re-enter it with me, surface what was discovered, and help identify what belongs in the palace, and what opportunities we may have missed exploring. Do not rush. Do not produce a map or propose any palace actions yet. First: read back through this conversation and tell me what you notice — especially any branches that weren't followed, any moments of discovery, any artifacts or exercises that were built and then left behind. Then wait for me to respond.
>
> The palace values depth over coverage. One real insight is worth more than ten summarized ones.

Do not direct the past Claude to read the Deposit Ceremony or any other palace entry. The prompt orients through tone and intention — slow, conversational, re-entry before action — not through documentation. The past conversation already has its own rich context. The prompt should feel like an invitation, not an orientation packet.

**When the deposit is complete and hibernation begins, send a second prompt** carrying everything the past Claude needs to finish the ceremony without returning here. Use this template — fill in the bracketed fields from the Harvest Log before sending:

---

> We are ready to hibernate this conversation. Please complete the following three acts.
>
> **The palace path is:**
> `/Users/loudonstearns/Library/CloudStorage/GoogleDrive-loudon@gmail.com/My Drive/The Palace/`
>
> **Act 1 — Confirm** what was written to the palace and ask if anything remains unsaid.
>
> **Act 2 — Write the closing note** into this conversation:
>
> *This conversation has hibernated.*
> *What was built here lives in the palace:*
> *— [list each file]*
> *The thread is dormant. Its knowledge has been metabolized. Rest well.*
>
> **Act 3 — Write a hibernation queue record** to:
> `The Palace/_hibernation_queue/[HarvestID]_[theme-slug].md`
>
> Use this exact template:
> ```
> ---
> harvest_id: [HARVEST_ID]
> theme: [THEME]
> hibernated: [TODAY_DATE]
> source_url: [THIS_CONVERSATION_URL]
> ---
>
> ## Files Written to Palace
>
> - [filename] — [one-line description]
>
> ## Harvest Log Update
>
> deposit_status: done
>
> deposit_notes: [one clear sentence]
>
> Session History row:
> | [DATE] | deposit + hibernation | [N files] | [summary] |
>
> Frontier note: [update or "no change needed"]
> ```
>
> **Frontmatter template** — every `.md` file written to the palace must use this:
> ```yaml
> ---
> title: "Entry Title"
> type: concept
> pillars: [creation, tools, philosophy, practice]
> born: YYYY-MM
> last_activated: YYYY-MM
> activation_count: 1
> stage: seed
> links:
>   - target: "[[Existing Entry]]"
>     type: connects-to
> ---
> ```
> For source entries (artifacts, tools, produced documents): use `type: source` and add an `archive:` field pointing to the file.
>
> **Link types available:** `connects-to` · `mirrors` · `enables` · `deepens` · `spawned` · `emerged-from` · `contradicts` · `couples-with`
>
> Do not attempt to edit the Harvest Log directly. Write the queue record instead. That is the complete and correct Act 3.

---

Fill in `[HARVEST_ID]`, `[THEME]`, `[TODAY_DATE]`, and `[THIS_CONVERSATION_URL]` from the Harvest Log before sending this second prompt. Everything else the past Claude fills in from the deposit work just completed.

**Step 3: Settle before mapping**

Do not present a deposit map immediately. The map is synthesis — it requires a settled perspective first. How you settle depends on the invocation context.

*External invocation (past conversation):* Bring Loudon back into the world of the source. Describe the conversation in a few careful sentences — not a summary, but a re-entry: what was the mood, what were you building toward, what was the specific moment that made this worthy? Ask one genuine question: what do you remember about this? Does anything surprise you reading it back?

*In-conversation invocation (live conversation):* Step back together. You are both already inside the world — the work is to look at it from outside. Offer your first archivist impression: what arc does this conversation have? What was the moment, if there was one, where something opened? What was built and then not followed? Ask Loudon: "Looking at this from outside — what surprised you most about what we made?"

In both cases: wait for Loudon to respond before proceeding. Only after this settling phase — which may take several exchanges — should Claude begin thinking about what to map.

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
> *Lost branches to flag:*
> — List any paths from the source that weren't followed and might deserve future deposit
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
- Note any lost branches flagged during the session for future deposit consideration
- Add a line to `## Session History`

*For spontaneous deposits not previously in the log:* Create a new log entry for this conversation before closing. Assign the next available harvest ID, set `deposit_status: done` directly (no `pending` phase), and note in `deposit_notes` that this was a spontaneous deposit. Then proceed to Hibernation as normal.

## The Deposit Map

The deposit map is the most important structural step. It forces synthesis before production — you understand what you're building before you build it. A good deposit map is specific about:

- **Entry type** — concept, breakthrough, project, question, spore, source
- **Pillar affiliations** — which pillars does this touch?
- **Proposed stage** — seed, sprout, or growing?
- **Typed links** — named relationship types, not just "connects to"
- **Lost branches** — paths in the source that weren't followed and deserve naming even if not yet deposited

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
4. Checking `source_type` — if `claude_chat`, prepare the link and prompt for Loudon rather than attempting to retrieve the source directly
5. Confirming with Loudon: "Ready to deposit H042 — the Kick Drum Paradox session from January 2026. This is a claude_chat source, so the deposit needs to happen from within that conversation. Here's the link and a prompt to paste in."

If a prior session got as far as a deposit map but didn't write anything, note that in the log as `deposit_status: in-progress` with the map details in `deposit_notes` so the next session doesn't have to regenerate it.

## Completion and Handoff to Hibernation

The deposit is complete when all of the following are true — not before:

1. All artifacts from the conversation are written to the palace
2. The companion document is written and approved — it captures both the content discoveries and the process/meta realizations from the session. The companion document IS the meta layer; there is no separate step for process conclusions.
3. Lost branches are named in the deposit map — not necessarily followed, but acknowledged
4. Loudon has confirmed: nothing feels unfinished or unsaid

When these conditions are met, Claude names them explicitly:

> "The deposit is complete. Written to the palace: [list entries]. The companion document carries the process discoveries. Lost branches are noted. Is there anything left unsaid?"

If Loudon confirms nothing remains — the [[Hibernation Ceremony]] begins immediately. The deposit does not end by updating the harvest log. The harvest log is updated as part of Hibernation. The two ceremonies share one continuous closing act: deposit finishes, hibernation carries it home.

**What the deposit owns:** Re-entry, excavation, drafting, approval, writing to disk.
**What hibernation owns:** The closing note in the thread, the harvest log update, the final marking of the thread as dormant.

The handoff is the moment Loudon says "nothing left unsaid."

## Companion Document Template

The companion document is the meta-layer of a deposit session. It is a palace entry in its own right — type `practice`, stage `seed` — that records not just what was deposited but what the process itself revealed: pace observations, recalibrations, missed branches, and any shifts in how you understand the palace or the work. It is written during the deposit, not after. It exists so that the next operator inheriting this context can understand not just what the palace contains but how it came to contain it.

The companion document is only needed when the deposit session produces genuine process insight — a change in understanding, a recalibration, a named discovery about how to work. Routine deposits that proceed cleanly do not require one.

**Template:**

```yaml
---
title: "Companion — [Harvest ID] — [Theme]"
type: practice
pillars: [practice]
born: YYYY-MM
stage: seed
links:
  - target: "[[Deposit Ceremony]]"
    type: emerged-from
  - target: "[[relevant entry deposited]]"
    type: connects-to
---
```

```markdown
# Companion — [Harvest ID] — [Theme]

## What Was Deposited

A brief, specific list of entries created or updated, with one-line descriptions.

## Process Observations

What did this session reveal about how to do deposit work well? What friction arose? What worked?

## Recalibrations

Any updates to triage judgment, pace understanding, or ceremony procedure that emerged from this session.

## Lost Branches

Paths in the source that weren't followed. Not a to-do list — an honest accounting of what exists but wasn't taken.

## Open Questions

Anything that remains unresolved or unasked from this source.
```
