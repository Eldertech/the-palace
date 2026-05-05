---
title: Handoff Ceremony
type: practice
pillars:
  - practice
  - tools
born: 2026-05
last_activated: 2026-05
activation_count: 0
stage: seed
forward_vector: "I exist to carry an in-progress move across an instance boundary — to compress the operating state of a session into a baton the next Claude can catch without losing momentum."
links:
  - target: "[[Deposit Ceremony]]"
    type: mirrors
    label: "shares-show-before-write"
  - target: "[[SCHEMA]]"
    type: connects-to
    label: "governed-by"
  - target: "[[SUBSTRATE]]"
    type: connects-to
  - target: "[[Palace Ceremonies]]"
    type: connects-to
---

# Handoff Ceremony

---

> You are about to run out of context mid-move. Your job in the Handoff Ceremony is not to finish the work — it is to package the operating state so a fresh Claude can pick up the same move without restarting. The handoff is the baton. Once the next Claude has caught it, this artifact has done its job and goes to the bundle's archive.
>
> A handoff is *not* a deposit. A deposit files a finished thought; a handoff carries an in-progress move across an instance boundary. The next Claude already knows the palace and Loudon — assume that orientation. Your job is to carry only what the next Claude *cannot* recover by re-reading the entry: the in-flight state, the rejected paths, the in-session calibrations.
>
> Show the handoff before writing it. The handoff lives at `[Entry]/[Entry] — handoff.md`.

---

The Handoff is fast where the Deposit is slow. A deposit slows down because there is a thought to compress; a handoff is urgent because there is momentum to preserve. Both ceremonies share the show-before-write rhythm, but the registers differ — the deposit is archival and reflective, the handoff is operational and forward-leaning.

## The Scope of the Handoff

The handoff carries:

- The current move and why it matters (the actual reason, not the obvious one)
- What has been tried and rejected this session — the *negative space* a new Claude would otherwise re-explore
- The current state in front of us — the half-written sentence, the unfinished link, the open question
- The next move or the open question
- Tacit calibrations from this session that diverge from defaults — the conversation residue
- A tiered context list of what files the new Claude should load to be ready

The handoff does *not* carry:

- Re-explanation of the palace or its conventions (assumed)
- Re-explanation of Loudon's standing preferences (assumed)
- A summary of the entry's content (the entry already does that)
- Speculation about future moves beyond the immediate next one

If a section feels uncertain whether to include, exclude. The handoff is the baton, not the biography.

## Pace Obligations

The handoff is brief and operational. It is not a ceremony that wants to linger.

- Do not bloat. A handoff that runs longer than the entry it's handing off is suspicious.
- Show before writing — but a single round of show-and-confirm is usually enough.
- If the move is small enough that the next Claude could reconstruct it from the entry alone, no handoff is needed. Tell Loudon and stop.

---

## Steps

**Pre-step: Move Declaration**

Before drafting, state in one sentence: *what is the in-progress move this handoff is carrying?* Not the entry's purpose — the specific thing this session has been doing on the entry. Example: *"This handoff carries the in-progress decision about whether [[Foo]]'s forward vector should split into two distinct vectors for its two readers."*

If you cannot state the move in one sentence, the move is either too small (no handoff needed) or too vague (the session has been wandering, and a deposit may be more appropriate).

**Step 1: Locate or create the bundle**

The handoff lives at `[Entry]/[Entry] — handoff.md`. If the entry has no bundle yet, the bundle is created lazily as part of this ceremony — not by ceremony, just because a file needs a place to live. See [[SCHEMA]] §8.

If a previous handoff already exists at that path, move it to `[Entry]/Archive/[Entry] — handoff — YYYY-MM-DD.md` before drafting the new one. Never overwrite a handoff that hasn't been archived.

**Step 2: Draft the handoff**

Use the standard sections, in order. Sections that have nothing to carry are omitted, not left blank.

```markdown
---
title: "[Entry] — handoff"
born: YYYY-MM-DD
links:
  - target: "[[Entry]]"
    type: connects-to
    label: "handoff-for"
forward_vector: "I carry the in-progress move on [[Entry]] across an instance boundary, waiting to be picked up by the next Claude and archived once the move is caught."
session_thread: <optional link or note>
---

# Handoff: [Entry]

## Move
One sentence. The in-progress move this handoff is carrying.

## Why this move matters
The actual reason — the specific tradeoff, the specific constraint — not the obvious one.

## Tried and rejected
Bulleted list of paths considered and ruled out this session, with one-line reasons. The fewer the better, but completeness here is the handoff's most distinctive value.

## Current state
What's literally in front of us right now. The half-written sentence, the unfinished link, the open question. Quote, don't summarize.

## Next move
What the next Claude should do first. One short paragraph.

## Calibrations from this session
Anything Loudon corrected, accepted, or surprised you with that diverges from defaults. Bullets, terse.

## Load these files first
Tiered list of what the next Claude should read before doing anything. Most-load-bearing first.
```

**Step 3: Show**

Present the draft handoff to Loudon in conversation. Loudon approves, edits, or rejects. Do not write before approval.

If Loudon rejects, the most common cause is over-bloat. Cut to the move.

**Step 4: Write and link**

On approval, write the handoff to `[Entry]/[Entry] — handoff.md` and add a small section to the bottom of the entry pointing to it:

```markdown
## Active Handoff

[[Entry — handoff]] — drafted YYYY-MM-DD
```

The section sits at the bottom of the entry and is removed when the handoff is consumed. No YAML field — keeps removal clean.

**Step 5: Close**

Tell Loudon the handoff path and the suggested invocation for the new Claude. Example:

> Handoff written to `Foo/Foo — handoff.md`.
>
> To start the next Claude:
> "Read `Foo.md` and `Foo/Foo — handoff.md`. Pick up the move."

Wait for confirmation that the next session has caught the baton, or for Loudon to indicate he's done.

**Step 6: Archive (when consumed)**

When the next Claude has picked up the move, the handoff has done its job. Move it to `[Entry]/Archive/[Entry] — handoff — YYYY-MM-DD.md` and remove the "Active Handoff" section from the entry.

Archival is usually performed by the *incoming* Claude as their first act, not by the outgoing Claude. The outgoing Claude can note in the closing message that the incoming Claude should archive on pickup.

---

## Completion Signal (outgoing side)

The outgoing Handoff is complete when:

1. A handoff file exists at `[Entry]/[Entry] — handoff.md`
2. The entry has an "Active Handoff" section pointing to it
3. Loudon has confirmed the handoff is sufficient
4. The outgoing closing message has been delivered with the suggested invocation

## Completion Signal (incoming side)

The incoming Handoff is complete when:

1. The incoming Claude has read the handoff and the entry
2. The incoming Claude has picked up the move (acted on it)
3. The handoff file has been moved to `[Entry]/Archive/`
4. The entry's "Active Handoff" section has been removed

If the incoming Claude finds the handoff incoherent, stale, or insufficient: stop, ask Loudon, do not improvise. A bad handoff that gets followed silently produces drift.

---

## Forward Vectors

- Should there be a *resumption protocol* — a structured way for the incoming Claude to verify with Loudon that they've caught the move correctly before acting on it?
- The vocabulary of bundle types ([[SCHEMA]] §8) is open. Do recurring handoff *patterns* (stuck-decision, midstream-draft, verification-pending) want their own conventions, or do they all fit one template?
- Multiple parallel handoffs on a single entry — SCHEMA §8 is silent on this. Does the bundle pattern want to enforce one active handoff per entry, or permit branching?
