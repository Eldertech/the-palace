---
title: "Spore Check Ceremony"
type: practice
pillars: [practice, philosophy]
born: 2026-03
last_activated: 2026-03
activation_count: 1
stage: mature
links:
  - target: "[[Palace Ceremonies]]"
    type: connects-to
  - target: "[[Weave Ceremony]]"
    type: connects-to
  - target: "[[Substrate Skill]]"
    type: connects-to
---

# Spore Check Ceremony

## Ceremony Contract

**Trigger:** "Spore check"

**Access vectors:**
- *Full:* Claude Code / Cowork (filesystem read/write + git)
- *Read and propose only:* claude.ai online (can read dormant entries via GitHub raw URLs; can propose dispositions; cannot write changes)
- *Manual:* Obsidian + human (human reviews dormant entries; human applies changes)
- *Not supported:* GitHub cloud alone

**Preconditions:**
1. At least one entry exists with `stage: dormant`
2. Palace folder is accessible via the current vector

**Postconditions:**
1. Every `stage: dormant` entry has been reviewed against current work and conditions
2. Each dormant entry has been assigned a disposition: `revive`, `hold`, or `compost`
3. `revive` entries have had their stage updated and a note added explaining the revival conditions that were met
4. `compost` entries have been marked `stage: composting` — not deleted; deletion happens at the next Weave
5. `hold` entries are unchanged — their dormancy is confirmed as appropriate
6. Git commit made: `Spore Check — [date] — [N revived, N composted, N held]`

**Failure mode:** If a dormant entry cannot be read (file corrupted or inaccessible), flag it in the report as unreviewed. Do not assign a disposition to an entry that hasn't been read. Unreviewed entries carry over to the next Spore Check.

**Git commit:** `Spore Check — [date] — [N revived, N composted, N held]`

---

## What the Spore Check Is

Spores are not dead. They are alive at a lower metabolic rate, waiting for conditions that will let them grow. The Spore Check is not a cull — it is a temperature reading. For each dormant entry, the question is: have conditions changed? Is this spore ready to germinate?

The ceremony is quarterly because dormant ideas often need seasons, not weeks. Checking monthly creates false urgency. Checking less than quarterly means genuine revivals are missed.

The Spore Check is also the palace's composting decision point. Some ideas never germinate. Holding them indefinitely is not respect for their potential — it is clutter. The palace prefers depth over coverage. An idea that has been dormant across multiple Spore Check cycles with no change in conditions is a candidate for composting. Composting is not abandonment; it is honest acknowledgment that this spore will not grow here, now. Its nutrients return to the soil.

## Protocol

**Step 1: Read all dormant entries**

Read every entry with `stage: dormant`. For each, note:
- When it was last activated
- Its `revival_conditions` (from frontmatter, if set)
- Its typed links — what is it connected to?
- How many Spore Checks it has been held without revival

**Step 2: Check revival conditions against current work**

For each entry, ask: has anything changed since this entry went dormant that meets its revival conditions?

Consider:
- New entries in the palace that are semantically adjacent
- Current projects that this dormant idea could serve
- Conversations or ideas currently active that this entry would deepen
- Whether the revival condition itself has become obsolete — sometimes conditions are met without anyone noticing

**Step 3: Assign dispositions**

For each dormant entry, assign one of three dispositions:

**`revive`** — The revival conditions have been met or close enough to warrant reactivation. Update `stage` to `seed` or `sprout` (whichever reflects current body depth). Update `last_activated`. Add a brief `## Revival Note` section to the entry body explaining what changed. Propose new typed links if the revival reveals new connections.

**`hold`** — The entry remains dormant intentionally. Conditions haven't changed. This is a valid and complete disposition — not inaction, but confirmed patience. Increment `activation_count` to reflect the check.

**`compost`** — The idea has been dormant for multiple cycles, has no connection to current or foreseeable work, and holding it no longer serves the palace. Mark `stage: composting`. The entry will be deleted at the next Weave (which will ask for final confirmation before deleting). Document what was valuable about this entry in its body before marking — the composting note is the final trace.

**Step 4: Show all dispositions to Loudon**

Present the full list before applying any changes:

```
## Spore Check — [date]

Dormant entries reviewed: [N]

Revive:
- [[Entry]] — [reason revival conditions are met]

Hold:
- [[Entry]] — [reason for continued dormancy]

Compost:
- [[Entry]] — [reason, and what was valuable about it]
```

Wait for Loudon's confirmation or adjustments before writing.

**Step 5: Apply and commit**

Apply all confirmed dispositions. Then commit: `Spore Check — [date] — [N revived, N composted, N held]`

## The Composting Note

Before any entry is marked `stage: composting`, write a brief composting note into the entry body. This is the entry's last act — a graceful acknowledgment of what it contained and why it is being released.

Format:
```markdown
## Composting Note — [YYYY-MM]

This entry is being released. It has been dormant since [date] with no change in revival conditions across [N] Spore Checks.

What was valuable here: [one or two sentences — the idea's contribution, even if never fully developed].

Its nutrients: [what existing entries carry forward the most relevant aspect of this idea, if any].
```

This note exists for any future operator who might wonder why something is gone. It makes the compost visible and intentional, not silent.

## The Season

The Spore Check has a seasonal quality that should be honored. Doing it at the same time each quarter — or tying it to a natural rhythm in your work — makes it feel less like maintenance and more like the turning of a season. The palace has its own weather.

## Open Questions

- Should entries that have been held across 3+ consecutive Spore Checks without change be automatically flagged as composting candidates, with the human making the final call?
- Is there a Revival Ceremony that formally marks the return of a revived entry into active work — more ceremonial than a stage update?
- Should `revival_conditions` be a required field for all `stage: dormant` entries? (Currently optional in SCHEMA.)
