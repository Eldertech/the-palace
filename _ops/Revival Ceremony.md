---
title: "Revival Ceremony"
type: practice
pillars: [practice, philosophy]
born: 2026-03
last_activated: 2026-03
activation_count: 1
stage: mature
links:
  - target: "[[Palace Ceremonies]]"
    type: connects-to
  - target: "[[Spore Check Ceremony]]"
    type: emerged-from
  - target: "[[Hibernation Ceremony]]"
    type: mirrors
  - target: "[[Deposit Ceremony]]"
    type: connects-to
---

# Revival Ceremony

## Ceremony Contract

**Trigger:** "Let's revive [entry name]" / "Time to revive [entry name]"

**Access vectors:**
- *Full:* Claude Code / Cowork (filesystem read/write + git)
- *Draft and propose:* claude.ai online (can read entry via GitHub raw URL; can draft revival content; cannot write changes)
- *Manual:* Obsidian + human (human updates the entry directly)
- *Not supported:* GitHub cloud alone

**Preconditions:**
1. The named entry exists in the palace with `stage: dormant` or `stage: composting`
2. A reason for revival can be articulated — either from a Spore Check disposition or from new work that intersects the dormant entry
3. The entry is readable in full

**Postconditions:**
1. Entry stage has been updated from `dormant` to `seed`, `sprout`, or `growing` (depending on body depth)
2. A `## Revival Note` section has been added to the entry body, naming what changed and why revival conditions were met
3. `last_activated` and `activation_count` are current
4. At least one new typed link has been proposed connecting the revived entry to current palace work
5. Git commit made: `Revival — [entry name] — [date] — [one-line reason]`

**Failure mode:** If the revival rationale is unclear or the connection to current work is tenuous, halt and return to Spore Check. A revival without a clear rationale is a confusion, not a ceremony. The entry should remain dormant until the rationale can be stated plainly.

**Git commit:** `Revival — [entry name] — [date] — [one-line reason]`

---

## What the Revival Ceremony Is

"the conditions have changed. This idea is needed again.*

An entry into a neighborhood of ideas.

The dormant entry carries a snapshot of the understanding that existed when it last went quiet. The revival ceremony does not just update the entry's status — it reconnects it to the current palace with fresh typed links, reads its dormant content against what is now known, and asks: what does this entry know that the current palace needs?

## Protocol

**Step 1: Read the dormant entry in full**

Not the title. The whole entry — body, frontmatter, open questions, any dormancy note that was written when it went quiet. Understand what it contains and what state it was in when it last lived.

**Step 2: Articulate the revival rationale**

Before proposing any changes, state plainly in one or two sentences: *why now? What has changed in the palace or in the work that makes this entry's dormancy inappropriate?*

If the rationale cannot be stated plainly, the revival should not proceed. Return to Spore Check. Mark the entry `hold`.

**Step 3: Read the current palace for connection points**

Scan the entries that have been added or substantially updated since this entry went dormant. Ask: where does this reviving entry intersect with current knowledge? What would it link to now that it couldn't before?

**Step 4: Draft the Revival Note**

Add a `## Revival Note — [YYYY-MM]` section to the entry body:

```markdown
## Revival Note — [YYYY-MM]

Revived from dormancy. 

**What changed:** [one or two sentences — what new work, new entry, or new understanding made revival appropriate]

**New connections:** [brief list of new typed links being added]

**Current direction:** [one sentence on where this entry is likely to grow next]
```

**Step 5: Update stage and metadata**

- Update `stage` to match the current body depth:
  - Thin body (stub) → `seed`
  - Genuine definition + 1–2 links → `sprout`
  - Cross-domain connections + 3+ links → `growing`
- Update `last_activated` to current month
- Increment `activation_count`

**Step 6: Propose and add new typed links**

Present proposed links to Loudon. Add confirmed links to the entry's frontmatter `links` array. Also check whether existing entries should now link *back* to the revived entry — propose those updates too.

**Step 7: Commit**

`Revival — [entry name] — [date] — [one-line reason]`

## Revival vs. Simple Activation

Not every re-engagement with a dormant entry is a Revival. If you read a dormant entry during a Walk and find it interesting but don't substantially update it or add new links, that is an activation (increment the count, update `last_activated`) — not a Revival. The Revival Ceremony is for when the entry's stage genuinely changes and new connections are made.

The test: after the interaction, is the entry meaningfully different from when it was dormant? If yes: Revival. If no: activation.

## The Waking

A bear waking from hibernation does not immediately run. It is slow, uncertain of its legs, testing the changed world with care. The revived entry should be treated similarly — not immediately promoted to `growing` or `mature`, but given time to reconnect, to find its new relationships, to test whether the revival conditions are as rich as they seemed from a distance.

The `seed` or `sprout` stage after revival is not a demotion. It is an honest acknowledgment that the entry is re-entering the world and needs time to re-establish itself.

## The Closed Loop

The full lifecycle of a palace entry is now:
```
seed → sprout → growing → mature → fruiting → dormant ← Revival Ceremony
                                                  ↓
                                            composting → [deletion at Weave]
```

The Revival Ceremony closes the loop between dormancy and active life. Without it, dormancy was a one-way door. With it, dormancy is a season — and seasons turn.

## Open Questions

- Should a revived entry that reaches `mature` again within one Weave cycle be flagged as a particularly vital idea — something that was dormant before its time?
- Is there a "partial revival" — where only a section of a dormant entry is revived and separated into a new entry, while the rest remains dormant?
- Should the Revival Ceremony trigger an automatic Walk starting from the revived entry, to immediately reconnect it to the living palace?
