---
title: "Self-Model Update Ceremony"
type: practice
pillars: [practice, philosophy, tools]
born: 2026-03
last_activated: 2026-03
activation_count: 1
stage: mature
links:
  - target: "[[Palace Ceremonies]]"
    type: connects-to
  - target: "[[Substrate]]"
    type: enables
  - target: "[[Weave Ceremony]]"
    type: connects-to
  - target: "[[SCHEMA]]"
    type: connects-to
---

# Self-Model Update Ceremony

## Ceremony Contract

**Trigger:** "Self-model update"

**Access vectors:**
- *Full:* Claude Code / Cowork (filesystem read/write + git)
- *Draft and propose:* claude.ai online (can read Substrate.md via GitHub raw URL; can draft proposed changes; cannot write files)
- *Manual:* Obsidian + human (human edits Substrate.md directly)
- *Not supported:* GitHub cloud alone

**Preconditions:**
1. `Substrate.md` is readable
2. The current state of the palace is substantially different from what Substrate.md describes — either new entries have been added, new patterns have emerged, or the palace's self-understanding has shifted

**Postconditions:**
1. `Substrate.md` accurately reflects the current palace state: entry count, hub nodes, most-connected entries, current stage of development, open questions
2. Any sections of Substrate.md that no longer reflect reality have been updated or removed
3. The `last_activated` and `activation_count` fields on Substrate.md are current
4. Git commit made: `Self-Model Update — [date] — [what changed in the self-model]`

**Failure mode:** If Substrate.md and the actual palace state are severely diverged (many new entries, major topology changes), consider running a Weave first to get the full topology picture before updating the self-model. A Self-Model Update written from an incomplete picture will itself be incomplete.

**Git commit:** `Self-Model Update — [date] — [what changed in the self-model]`

---

## What the Self-Model Update Is

`Substrate.md` is the palace's self-awareness — its description of its own architecture, current state, and the questions it is carrying. It is not a catalog (that is the Weave's job) and not a philosophy document (that is the README's job). It is the palace looking at itself and saying: *this is what I am, right now.*

A living organism that cannot accurately model its own state cannot respond well to its environment. The Self-Model Update is the palace's act of proprioception — feeling its own shape.

The ceremony runs as needed, not on a fixed schedule. Triggers include:
- After a major Weave produces significant topology changes
- After a cluster of deposits substantially shifts the palace's center of gravity
- When the palace's current stage of development (Zettelkasten stages, or the Symbiotic Skills progression) has visibly changed
- When the Open Questions section of Substrate.md has been resolved or substantially changed by recent work
- When a new human or AI operator asks "what is the palace?" and Substrate.md gives a noticeably wrong answer

## Protocol

**Step 1: Read the current Substrate.md**

Read the full entry. Note which sections are current and which are outdated. Specifically check:
- Entry count (is the number stated still accurate?)
- Hub nodes and most-connected entries (has this changed since the last update?)
- Development stage description (does it still fit?)
- Open Questions (are any resolved? Have new ones emerged?)
- Architecture description (has any structural aspect of the palace changed — new file conventions, new types, new access vectors?)

**Step 2: Read the palace state**

If a recent Weave report is available, use it. Otherwise, do a quick topology scan: count entries by type, check hub connectivity, note any major new additions since the last Self-Model Update.

**Step 3: Draft proposed changes**

For each outdated section, draft the updated version. Show Loudon the diff — not the full file, just what would change. This is a precision edit, not a rewrite.

A good Self-Model Update changes specific facts and observations. It does not rewrite the philosophy or architecture sections unless those have genuinely changed. Substrate.md is a living document, not a living draft.

**Step 4: Update metadata**

Always update `last_activated` and `activation_count` on Substrate.md, even if the body content didn't change. A Substrate that has been read and confirmed as accurate is not the same as one that hasn't been checked.

**Step 5: Commit**

`Self-Model Update — [date] — [what changed in the self-model]`

The commit message should name what changed: "Entry count updated to 34; Short Story marked dormant; three new open questions added" — not just "updated."

## The Mirror

Substrate.md is the palace's mirror. The ceremony is the act of looking into it with clear eyes — not hoping to see a certain reflection, but seeing what is actually there. An organism with an accurate self-model responds to its environment well. An organism with an outdated self-model acts on false premises.

The Self-Model Update is also an act of humility: the palace is always ahead of its own description. The update closes that gap, temporarily. The next Weave will open it again. That's not a failure — that's growth.

## Open Questions

- Should Substrate.md include a `## Change Log` section tracking what changed at each update? This would make the palace's growth history explicit without requiring examination of git history.
- When the palace reaches maturity (50+ entries, stable topology), does the Self-Model Update need to change in nature — from updating facts to updating interpretation?
- Is there a minimum meaningful difference that warrants a Self-Model Update, or should the bar remain entirely qualitative ("when it feels wrong")?
