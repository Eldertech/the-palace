---
title: "Hibernation Ceremony"
type: meta
pillars: [practice, tools]
born: 2026-03
last_activated: 2026-03
activation_count: 2
stage: growing
links:
  - target: "[[Deposit Ceremony]]"
    type: emerged-from
  - target: "[[Harvest Log]]"
    type: enables
  - target: "[[Palace Ceremonies]]"
    type: connects-to
---

# Hibernation Ceremony

The final act of the [[Deposit Ceremony]]. A conversation that has given everything it has — artifacts written, companion document complete, nothing left unsaid — does not end. It hibernates.

Like a bear in winter: the animal is not gone. Its life continues slowly, at depth, out of sight. The knowledge it carried has been metabolized into the palace. The thread rests, preserved, with the faint possibility of reawakening — but with no expectation of it.

**Trigger:** Loudon says "nothing left unsaid" at the end of a completed deposit. Hibernation begins immediately — it is the continuous closing motion of deposit, not a separate session.

**Design principle:** The hibernation is self-contained. Loudon should be able to end any conversation with this ceremony without needing to return to another context to finish the work. Everything the past Claude needs is carried in the deposit prompt. The harvest log update happens asynchronously via the hibernation queue.

## Prerequisites

Hibernation cannot begin until the deposit is genuinely complete:

1. All artifacts written to the palace with proper frontmatter
2. Companion document written and approved — carrying both content discoveries and process/meta realizations
3. Lost branches named in the deposit map
4. Loudon has confirmed: nothing feels unfinished or unsaid

If any of these are incomplete, return to the [[Deposit Ceremony]]. Hibernation is not an escape from an unfinished deposit — it is the reward for a finished one.

## The Three Acts

**Act 1 — Confirm**

Name what was created. A brief, specific accounting before closing:

> "Written to the palace:
> — [Entry title] → [filename]
> — [Entry title] → [filename]
> The companion document is at [filename].
> Lost branches noted: [brief list].
> Is there anything left unsaid?"

Wait for Loudon's confirmation. If something surfaces — address it before continuing. Do not proceed on assumption.

**Act 2 — Write the closing note**

Write a final message into the conversation itself. This is the thread's resting place marker — brief, specific, and warm. It names what was extracted and where it now lives. It exists for any future Claude instance that might encounter this conversation: do not deposit this again. The work here is done.

Format:

> *This conversation has hibernated.*
>
> *What was built here lives in the palace:*
> *— [Entry title] at [filename]*
> *— [Entry title] at [filename]*
>
> *The thread is dormant. Its knowledge has been metabolized.*
> *Rest well.*

**Act 3 — Write the hibernation queue record**

Do NOT attempt to edit the Harvest Log directly. It is large and editing it from a past conversation risks corruption or truncation. Instead, write a small structured record to:

`The Palace/_hibernation_queue/[HarvestID]_[theme-slug].md`

Use this template exactly:

```
---
harvest_id: [e.g. PP05]
theme: [e.g. Meadows and Music]
hibernated: [YYYY-MM-DD]
source_url: [the URL of this conversation]
---

## Files Written to Palace

- [filename] — [one-line description]
- [filename] — [one-line description]
- Artifacts/[subfolder]/[filename] — [one-line description]

## Harvest Log Update

deposit_status: done

deposit_notes: [one clear sentence summarizing what was created]

Session History row:
| [YYYY-MM-DD] | deposit + hibernation | [N] | [summary of what was created] |

Frontier note: [any update needed to the Frontier, or "no change needed"]
```

This file will be read and processed by the palace keeper (Claude in the main context) during the next Weave or routine maintenance. It requires no immediate follow-up from Loudon.

## Filing Structure for Artifacts

Palace entries (`.md` files) go in the palace root, named by theme:

```
[Theme] — [Document Type].md
```

Example:
```
Meadows and Music — Leverage Points.md
Meadows and Music — Origin and Process.md
```

Every `.md` file written to the palace must include proper YAML frontmatter. The minimum viable template is provided in the deposit prompt. Do not write palace entries without it — files without frontmatter are islands, invisible to the graph.

Non-markdown artifacts (HTML tools, interactive documents) go in:

```
The Palace/Artifacts/[Theme]/[filename]
```

## The Hibernation Queue

`The Palace/_hibernation_queue/` is the palace inbox for completed hibernations. It decouples the act of hibernating (which happens in the past conversation) from the act of updating the log (which happens here, when convenient).

**Processing the queue** is part of the Weave ceremony and can also be done any time:
1. Read each `.md` file in `_hibernation_queue/`
2. Update the Harvest Log using the provided details
3. Check frontmatter on the deposited files — add if missing
4. Delete the queue file once processed

The queue means: no hibernation is ever incomplete. If the log wasn't updated in the moment, it will be updated in the next pass.

## The Bear

Bears do not decide to hibernate. The conditions arrive and the body knows. The ceremony should feel the same way — not a decision to stop, but a recognition that the season has changed. The work is done. The knowledge is safe. The thread can rest.

A hibernating conversation is not a failed conversation or an abandoned one. It is a complete one.

## Open Questions

- Should hibernated conversations be noted somewhere beyond the harvest log — a dedicated registry of dormant threads, so they can be found if revival ever becomes relevant?
- Is there a Revival Ceremony — a way to formally reawaken a hibernated conversation when new work makes it relevant again?
- What happens when a conversation is too old to access fully but hasn't been hibernated? Can we perform a partial hibernation based on summary alone, or does it simply remain unhibernated in the log?
