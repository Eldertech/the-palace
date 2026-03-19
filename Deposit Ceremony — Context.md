---
title: "Deposit Ceremony — Context"
type: practice
pillars: [practice, tools, philosophy]
born: 2026-03
last_activated: 2026-03
activation_count: 1
stage: growing
links:
  - target: "[[Deposit Ceremony]]"
    type: emerged-from
  - target: "[[Harvest Ceremony]]"
    type: connects-to
  - target: "[[Substrate]]"
    type: deepens
---

# Deposit Ceremony — Context

The rationale, philosophy, and process observations behind the [[Deposit Ceremony]]. This file is read during Weaves, Schema Ceremonies, and when revisiting the ceremony's design — not during routine deposit sessions.

---

## The Pace of the Deposit

The deposit is not a task to complete. It is a conversation to enter.

This distinction matters enough to state first, before any procedural steps, because the failure mode is so natural: Claude reads a source, generates a map, gets approval, writes five entries, closes the log. Done in ten minutes. Nothing wrong with any individual step — and yet the whole thing will have been wrong.

The deposit works because Loudon needs time to move his mind into place. A past conversation exists in a different world — a different moment, a different set of concerns, a different version of the framework. Returning to it is not a lookup. It is a re-entry. Claude can read a summary instantly. Loudon cannot re-inhabit a context instantly. The deposit must honor that asymmetry.

**A lived example:** In March 2026, Claude began depositing PP05 and PP06 by reading summaries, generating maps, receiving approval, and writing five palace entries in a single pass. Loudon stopped the process. He said: *bring me back to this conversation carefully, mindful of my limitations — I need time to move my mind into place, to reset into the world of a different conversation.* When the pace slowed, something different happened. Loudon noticed that two insights he had named in that original conversation — the feedback delay patch as a living Meadows instantiation, and journaling as a paradigm-transcendence lever — felt like genuine discoveries. He named the frantic pace as something he has to push against. He identified lost branches — 30 exercises in that conversation that had never been revisited. The deposit became an act of recovery, not just transcription. None of that happens at speed.

## Interaction Style

Deposit sessions are slow and deliberate by design. The pace is not a constraint to work around — it is the ceremony itself. Loudon has described the ideal deposit as feeling close to journaling: focused, unhurried, moving the mind into a particular place rather than processing information quickly.

Claude reads, re-enters, asks. Loudon responds, remembers, redirects. The rhythm is: re-entry → conversation → map → draft → approve → write. Nothing is written to disk without explicit approval. No map is presented before genuine re-entry has happened.

Unlike Harvest, depth is welcome and expected. If a source opens into something unexpected — a lost branch, a correction to something already in the palace, a question that wasn't asked in the original conversation — follow it. A deposit session that produces one real insight and a productive conversation is more valuable than one that produces five entries and closes the log.

## Lost Branches

Every conversation contains more paths than were followed. When a list was generated, one item was usually pursued and the rest left. When an artifact was built, it was used in the moment and then left behind. The deposit ceremony is the place to return to those branches — not to follow all of them, but to name them, evaluate them, and decide which deserve further work.

The deposit map should always include a lost branches section. This is not a to-do list. It is an honest accounting of what the original conversation contained that hasn't yet found its way into the palace.

## The Asymmetry of Access

Claude can reach the palace instantly. Loudon can reach the full transcripts. Neither has complete access alone. This asymmetry is structural, not a bug. The deposit ceremony is where the two kinds of access meet: Claude holds the palace context; Loudon holds the conversation context; together they can do what neither can alone.

For `claude_chat` sources, this asymmetry means the deposit must always begin with Loudon opening the original conversation. Claude prepares the way — with the link, with the prompt, with the palace context needed to orient a new Claude instance. Loudon carries the full source into the session. The deposit happens in the meeting of those two things.

## Partial Sources

If a source was flagged `partial`, the deposit map should reflect that — only the relevant section gets deposited. Note clearly in the closing log update what was left out and why, so future Claude instances don't re-examine the skipped portions.

## Open Questions

- Should every deposit session end with a mini-Weave — checking whether the new entries reveal new connections to other existing entries?
- When a deposit session produces a major hub entry, should it trigger a Walk ceremony to understand how it changes the overall topology?
- How do we handle deposits where the source is no longer accessible (deleted conversation, inaccessible file)? Should those items be marked `deposit_status: inaccessible` and preserved or composted?
- Lists generated in conversation are topologies, not menus — most branches go unfollowed. Is there a ceremony or practice specifically for returning to lists and rating/evaluating the branches not taken? This feels like it deserves a name.

---

## Updating Existing Entries

**When depositing from a live conversation:** defer significant updates to existing entries. Flag them in the deposit map under "existing entries to flag for Weave" and leave the updates for the next Weave or a dedicated Claude Code session. Do not read existing entries to update them — context preservation takes priority.

**When depositing from Claude Code or a dedicated deposit session** (no rich conversation context to protect): updating existing entries is appropriate. Follow these steps:
- Increment `activation_count` in the frontmatter
- Update `last_activated` to current month (YYYY-MM format)
- Adjust `stage` if the entry has genuinely matured
- Add new typed links to the frontmatter `links` array only if they represent structural relationships (not casual mentions)
- Add to body prose in the appropriate section (Cross-Pillar Connections, Open Questions, etc.)

Always show the full frontmatter diff and the specific prose additions before writing.

## Resuming After a Break

A new Claude instance can resume a Deposit session by:

1. Reading [[README - The Palace Guide]]
2. Reading [[Deposit Ceremony]]
3. Reading [[Harvest Log]] — find the item marked `deposit_status: in-progress` (if any) or the oldest `pending` item
4. Checking `source_type` — if `claude_chat`, give Loudon the direct link from `source_ref` rather than attempting to retrieve the source directly
5. Confirming with Loudon: "Ready to deposit H042 — the Kick Drum Paradox session from January 2026. This is a claude_chat source — follow this link and invoke the ceremony there: [link]"

If a prior session got as far as a deposit map but didn't write anything, note that in the log as `deposit_status: in-progress` with the map details in `deposit_notes` so the next session doesn't have to regenerate it.

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
