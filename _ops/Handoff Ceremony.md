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
  - target: "[[Closing Well]]"
    type: mirrors
    label: "every-handoff-closes-well"
  - target: "[[Surfaces and Capabilities]]"
    type: connects-to
    label: "capability-delta-source"
  - target: "[[SCHEMA]]"
    type: connects-to
    label: "governed-by"
  - target: "[[SUBSTRATE]]"
    type: connects-to
  - target: "[[Palace Ceremonies]]"
    type: connects-to
  - target: "[[Handoff Ceremony — Context]]"
    type: spawned
---

# Handoff Ceremony

---

> You are about to run out of context mid-move. Your job in the Handoff Ceremony is not to finish the work — it is to package the operating state so a fresh Claude can pick up the same move without restarting. The handoff is the baton. Once the next Claude has caught it, this artifact has done its job and goes to the bundle's archive.
>
> A handoff is *not* a deposit. A deposit files a finished thought; a handoff carries an in-progress move across an instance boundary. The next Claude already knows the palace and Loudon — assume that orientation. Your job is to carry only what the next Claude *cannot* recover by re-reading the entry: the in-flight state, the rejected paths, the in-session calibrations.
>
> Show the handoff before writing it. The handoff lives at `[Entry]/[Entry] — handoff.md`.

---

## The Scope of the Handoff

The handoff carries:

- The current move and why it matters (the actual reason, not the obvious one)
- What has been tried and rejected this session — the *negative space* a new Claude would otherwise re-explore
- The current state in front of us — the half-written sentence, the unfinished link, the open question
- The next move or the open question
- Tacit calibrations from this session that diverge from defaults — the conversation residue
- The receiving surface and its capability delta, *when the handoff crosses surfaces* — what the catching tool can do that this one can't, and the surface-specific gotcha (git locks, GPU, local-only tool, link scheme). See [[Surfaces and Capabilities]].
- A tiered context list of what files the new Claude should load to be ready

The handoff does *not* carry:

- Re-explanation of the palace or its conventions (assumed)
- Re-explanation of Loudon's standing preferences (assumed)
- A summary of the entry's content (the entry already does that)
- Speculation about future moves beyond the immediate next one

If a section feels uncertain whether to include, exclude. The handoff is the baton, not the biography.

## Pace Obligations

- Do not bloat. A handoff that runs longer than the entry it's handing off is suspicious.
- Show before writing — but a single round of show-and-confirm is usually enough.
- If the move is small enough that the next Claude could reconstruct it from the entry alone, no handoff is needed. Tell Loudon and stop.

## Handoff Genres

This ceremony was written for the *entry-bundle handoff* — a move on a single entry, handed off at `[Entry]/[Entry] — handoff.md`, consumed and archived. That is the default, and the steps below assume it. But handoffs in practice come in several genres, and the genre changes where the file lives and whether it is consumed or kept alive:

- **Entry-bundle** (default) — one entry's in-progress move. Lives in the entry's bundle; consumed and archived on pickup.
- **Cross-surface paste-prompt** — a prompt handed to another surface, most often Cowork → Claude Code for a build the sandbox can't run. Lives where the work lives (`Projects/.../` or `_ops/claude-code-prompts/`). Its distinctive content is the receiving-surface capability delta and an explicit *what NOT to do*. See [[Surfaces and Capabilities]].
- **Session-queue continuation** — picking up a multi-session sweep (a graffiti pass, a deposit run). Carries "how we've been working" and a resume protocol, not just one move. Lives in `_ops/`.
- **Swarm phase baton** — handing the apply-phase of a completed Swarm Weave to a fresh Claude. Lives in `_ops/swarm/sessions/`.
- **Permanent-agent steward handoff** — a Steward (a page operating as an agent) handed across sessions. *Updated in place, never consumed*, and carries per-surface conventions for every surface it addresses.

The genre flexes the location and the lifecycle. It does not flex the discipline: carry the move, the negative space, the receiving surface, and what the catcher loads first.

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
What's literally in front of us right now. The half-written sentence, the unfinished link, the open question. Quote, don't summarize. When the handoff carries a near-finished deliverable, this section is also the closing-well punchlist — file paths, the named risk per item, and what you couldn't verify. See [[Closing Well]]; reference it, don't restate it.

## Next move
What the next Claude should do first. One short paragraph.

## Receiving environment
*Cross-surface handoffs only; omit for same-surface.* Name the receiving surface and the capability delta that matters for *this* move — why it's being handed here, and the surface-specific gotcha (git locks, GPU, local-only tool, link scheme). Point to [[Surfaces and Capabilities]] for the full picture; carry only the deltas this move actually hits.

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

## Resumption Protocol (incoming side)

The catcher's job on arrival, before touching any work:

1. **Read the whole handoff, then the entry.** Most-load-bearing first, per *Load these files first*.
2. **State the move back in one sentence.** If you can't, the baton wasn't caught — say so to Loudon and ask, rather than improvising.
3. **Check the receiving environment.** If the handoff names a capability delta, confirm it holds before relying on it — the catalog in [[Surfaces and Capabilities]] can be stale. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
4. **Archive the handoff as your first act** (entry-bundle and most genres): move it to `[Entry]/Archive/[Entry] — handoff — YYYY-MM-DD.md` and remove the "Active Handoff" section from the entry. Steward handoffs are the exception — they are updated in place, not archived.
5. **Then act on the move,** holding the calibrations the handoff carried.

Deliberately light — a confirmation rhythm, not a gate.

