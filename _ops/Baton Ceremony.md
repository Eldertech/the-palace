---
title: "Baton Ceremony"
aliases:
  - Handoff Ceremony
type: practice
pillars:
  - practice
  - tools
born: 2026-05
last_activated: 2026-06
activation_count: 1
stage: sprout
forward_vector: "I exist to carry an in-progress move across a boundary — a context limit, a surface change, or a deliberate pause — by compressing the live state of a session into a baton the next Claude can catch and keep running with, without restarting."
links:
  - target: "[[Generative Compression]]"
    type: exemplifies
    label: "relay-race-case-of"
  - target: "[[Deposit Ceremony]]"
    type: mirrors
    label: "shares-show-before-write"
  - target: "[[Closing Well]]"
    type: mirrors
    label: "every-baton-closes-well"
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
  - target: "[[Baton Ceremony — Context]]"
    type: spawned
---

# Baton Ceremony

*Formerly the Handoff Ceremony. The **baton** is the file this ceremony generates — the thing that gets passed. "Handoff" is a secondary, looser name; see § Trigger for how to tell an official baton from a casual handoff.*

---

> This ceremony produces a **baton**: a document that lets one Claude continue work another Claude started — across a context limit, a surface change, or a deliberate pause. You likely have a general notion of a "handoff document." Start there, but read on, because the palace baton is more specific than a generic handoff, and the differences are the whole point.
>
> A generic handoff *summarizes* — it recounts what was done so the reader is caught up. The baton does the opposite. It is a *generative compression* of the session (see [[Generative Compression]]): lossy on purpose, in one direction — keep only what the next Claude needs in order to *act*, and drop everything they can recover by other means. The next Claude already knows the palace and already knows Loudon, so re-explaining either is wasted space. The entry being worked on already records its own content, so summarizing it is wasted space. What the next Claude *cannot* recover — the specific move underway, the approaches already tried and ruled out this session, the small calibrations Loudon gave along the way — that, and only that, is the baton.
>
> Three things separate the baton from the handoff you might assume:
>
> 1. **It compresses, it doesn't summarize.** The test for every line is "could the next Claude recover this without me?" If yes, cut it.
> 2. **It is written toward a single move.** Name the move first — it is the signal that decides what's kept and what's dropped. Without it, the baton bloats, because everything looks worth keeping.
> 3. **It is disposable.** Once the next Claude has the move, the baton has done its job and is deleted; git history is its archive. It is not a permanent record — the entry and the deposit are.
>
> Do not assume *why* the baton is being passed. A context limit, a surface change, a pause, and a later scheduled pickup each shape what the next Claude needs differently — so have Loudon name the reason rather than presuming it.
>
> Show the baton to Loudon before writing it. The baton lives where the work lives (see § Where the Baton Lives).

---

## The Scope of the Baton

The baton carries only what survives compression toward *keep running* — what the next Claude needs to act and cannot recover on their own:

- The move in flight — and why it matters (the real reason, the specific tradeoff or constraint, not the obvious one)
- What was tried and rejected this session — the *negative space* the next Claude would otherwise re-explore
- The current state in front of us — the half-written sentence, the unfinished link, the open question. Quote, don't summarize.
- The next move, or the open question
- Tacit calibrations from this session that diverge from defaults — the conversation residue
- The receiving surface and its capability delta, *when the baton crosses surfaces* — what the catching Claude can do that this one can't, and the surface-specific gotcha (git locks, GPU, local-only tool, link scheme). See [[Surfaces and Capabilities]].
- A tiered list of the files the next Claude should load to be ready

The baton does *not* carry:

- Re-explanation of the palace or its conventions (assumed)
- Re-explanation of Loudon's standing preferences (assumed)
- A summary of the entry's content (the entry already does that)
- Speculation about future moves beyond the immediate next one

If a section is uncertain whether to include, exclude it. The baton is the baton, not the biography. The move is the compression signal: what advances it is kept close to verbatim; what doesn't collapses to a sentence or drops.

## Trigger

**Primary — the official baton (unambiguous; run the ceremony):** "baton", "pass the baton", "baton this", "baton it to [surface]", "drop a baton for [X]".

**Secondary — ambiguous (ask first):** "handoff" / "hand this off". Loudon uses "handoff" loosely and sometimes means an informal, non-ceremony pass. So when he says "handoff," do not assume — ask: *"Baton ceremony, or an informal handoff?"* and proceed on his answer. This ask is deliberate and temporary — a training wheel while the "baton" habit sets in. Retire it once "baton" is the reliable word.

## Pace Obligations

- Do not bloat. A baton that runs longer than the entry it's passing is suspicious.
- Show before writing — but a single round of show-and-confirm is usually enough.
- If the move is small enough that the next Claude could reconstruct it from the entry alone, no baton is needed. Tell Loudon and stop.

## Where the Baton Lives

A baton's location and lifecycle depend on the work it continues. Several shapes have come up so far; this list is **open, not exhaustive** — new ones will appear as the palace grows (the Maker and the Shop may grow their own; Loudon may write one). What doesn't flex is the discipline: carry the move, the negative space, the receiving surface, and what the catcher loads first. When a baton doesn't fit a known shape, place it where its work lives, say so in the baton, and let the shape be named later.

Shapes seen so far:

- **Entry-bundle** (default) — one entry's in-progress move. Lives in the entry's bundle at `[Entry]/[Entry] — baton.md`; consumed and deleted on pickup.
- **Cross-surface paste-prompt** — a baton handed to another surface, most often Cowork → Claude Code for a build the sandbox can't run. Lives where the work lives (`Projects/.../` or `_ops/claude-code-prompts/`). Its distinctive content is the receiving-surface capability delta and an explicit *what NOT to do*. See [[Surfaces and Capabilities]]. This shape is the one that also gets *announced on the board* — see § Announcing the Baton on the Board.
- **Session-queue continuation** — picking up a multi-session sweep (a graffiti pass, a deposit run). Carries "how we've been working" and a resume protocol, not just one move. Lives in `_ops/`.
- **Swarm phase baton** — handing the apply-phase of a completed Swarm Weave to a fresh Claude. Lives in `_ops/swarm/sessions/`.
- **Permanent-agent steward** — a Steward (a page operating as an agent) carried across sessions. *Updated in place, never deleted* — the standing exception to disposability — and carries per-surface conventions for every surface it addresses.

The shape flexes the location and the lifecycle. It does not flex the discipline.

---

## Steps

**Pre-step: Baton Declaration**

Before drafting, state in one sentence, visibly: *what is the in-progress move this baton is carrying?* Not the entry's purpose — the specific thing this session has been doing. Example: *"This baton carries the in-progress decision about whether [[Foo]]'s forward vector should split into two distinct vectors for its two readers."*

Stating it out loud is also how the ceremony announces itself: it tells Loudon a baton is being packed, not just a document written. If you cannot state the move in one sentence, the move is either too small (no baton needed) or too vague (the session has wandered, and a deposit may be more appropriate).

**Step 1: Locate or create the home**

Place the baton according to its shape (§ Where the Baton Lives). For the entry-bundle default, it lives at `[Entry]/[Entry] — baton.md`; if the entry has no bundle yet, the bundle is created lazily — not by ceremony, just because a file needs a place to live (see [[SCHEMA]] §8).

If an un-consumed baton already exists at that path, something went wrong — a prior baton was never caught. Surface it to Loudon rather than overwriting it.

**Step 2: Draft the baton**

Use the standard sections, in order. Sections with nothing to carry are omitted, not left blank — **except the final "On pickup" section, which is fixed boilerplate, identical in every baton and never omitted** (see the note after the template for why).

```markdown
---
title: "[Entry] — baton"
born: YYYY-MM-DD
links:
  - target: "[[Entry]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[Entry]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
session_thread: <optional link or note>
---

# Baton: [Entry]

## Move
One sentence. The in-progress move this baton is carrying.

## Why this move matters
The actual reason — the specific tradeoff, the specific constraint — not the obvious one.

## Tried and rejected
The paths considered and ruled out this session, with one-line reasons. The fewer the better, but completeness here is the baton's most distinctive value — it is the negative space the next Claude would otherwise re-explore.

## Current state
What's literally in front of us right now. The half-written sentence, the unfinished link, the open question. Quote, don't summarize. When the baton carries a near-finished deliverable, this section is also the closing-well punchlist — file paths, the named risk per item, and what you couldn't verify. See [[Closing Well]]; reference it, don't restate it.

## Next move
What the next Claude should do first. One short paragraph.

## Receiving environment
*Cross-surface batons only; omit for same-surface.* Name the receiving surface and the capability delta that matters for *this* move — why it's being handed here, and the surface-specific gotcha (git locks, GPU, local-only tool, link scheme). Point to [[Surfaces and Capabilities]] for the full picture; carry only the deltas this move actually hits.

## Calibrations from this session
Anything Loudon corrected, accepted, or surprised you with that diverges from defaults. Bullets, terse.

## Load these files first
Tiered list of what the next Claude should read before doing anything. Most-load-bearing first.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
*Identical in every baton. It rides along because the catching Claude loads the
baton and the entry, not this ceremony — so the catcher's obligations live where
the catcher will see them. Omit nothing here.*
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive Step 6 relies on.
3. Mark it caught: remove the "Active Baton" section from the parent entry; for a board-announced baton with no parent entry, post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) instead.
4. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
5. If the baton names a receiving-surface capability delta, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — a build that was supposed to run here but can't is a finding to report, not a failure to hide.
6. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.
```

*Why the last section is fixed, not authored:* the **author** runs this ceremony — you triggered it by saying "baton," so the authoring discipline lives in this spec. The **catcher** does not — it arrives on a work invocation and reads only the baton and the entry, never this file. So the one half of the ceremony the catcher must obey has to travel inside the artifact it actually opens. Everything else still compresses toward the move; this rides along.

**Step 3: Show**

Present the draft baton to Loudon in conversation. Loudon approves, edits, or rejects. Do not write before approval. If Loudon rejects, the most common cause is over-bloat. Cut to the move.

**Step 4: Write and link**

On approval, write the baton to its home and add a small section to the bottom of the entry pointing to it:

```markdown
## Active Baton

[[Entry — baton]] — drafted YYYY-MM-DD
```

The section sits at the bottom of the entry and is removed when the baton is caught. No YAML field — keeps removal clean. *(For shapes with no parent entry — e.g. a cross-surface paste-prompt — there is no entry to mark; the board announcement is the pointer instead.)*

**Step 5: Close**

Tell Loudon the baton path and the suggested invocation for the next Claude. Example:

> Baton written to `Foo/Foo — baton.md`.
>
> To start the next Claude:
> "Read `Foo/Foo — baton.md` and `Foo.md`, follow its On-pickup steps, then pick up the move."

Wait for confirmation that the next session has caught the baton, or for Loudon to indicate he's done.

**Step 6: Delete on pickup**

When the next Claude has picked up the move, the baton has done its job. It is **deleted** — git history is its archive (any cross-session baton will have been committed at least once, so its full content is recoverable via `git log --follow`). The palace keeps no `Archive/` graveyard of spent batons; the entry and the deposit are the permanent record, not the baton.

Deletion is normally performed by the *incoming* Claude as its first act (per the On-pickup footer), not by the outgoing one. The consume-marker is the **entry pointer, not the file**: removing the "Active Baton" section from the entry is the logical "caught" signal, and it works on any surface because it is an edit, not a delete. The file deletion follows.

*Surface caveat:* the Cowork sandbox can rename but cannot delete. An incoming Cowork Claude removes the "Active Baton" pointer (marking the baton spent) and notes "baton caught — deletion pending"; a later delete-capable touch (Mac-side or Loudon) removes the file. Permanent-agent steward batons are the exception to all of this — updated in place, never deleted.

---

## Announcing the Baton on the Board

*Cross-surface batons only. Optional today, load-bearing once a scheduler exists.*

A baton filed in a bundle is invisible to everything but a human who knows to go read it. When the move crosses to a surface that the [[Project Stewardship System]] coordinates — Claude Code on the Mac, picked up by a future scheduled dispatch — announce the baton on the persistent blackboard so it lives on the same surface as every steward's request. See [[Two Batons, One Board]] for why the two batons belong together.

This announcement does **not** replace writing the baton file (Steps 1–4). It is a pointer to it, posted to the [[BBS Blackboard]] so the board becomes the one place "what is ready to continue" lives.

**The convention (not a new message type).** A baton announcement is a `BROADCAST` to `GENERAL` carrying `payload.kind: "handoff_ready"`. The wire field keeps its `handoff_ready` name for protocol stability even though the ceremony is now named for the baton — the palace lets categories prove themselves before hardening, and renaming a live wire field is a separate decision (see [[Speak Like a Person, Log Like a Protocol]]). The `from` field is the entry's own title (the page is the agent; see [[Pages as Agents]]). Health uses the Path 2 stub, since the message is hand-authored or subagent-dispatched, not measured against a direct API call (see [[Palace Agent Infrastructure Spec]] §3.3.1).

```json
{
  "schema_version": "1.0",
  "id": "semantic-delay-handoff-001",
  "ts": "2026-05-29T14:30:00-04:00",
  "session_id": "handoff-2026-05-29",
  "from": "Semantic Delay",
  "to": "*",
  "type": "BROADCAST",
  "board": "GENERAL",
  "health": {
    "score": "green",
    "model": "claude-opus-4-8",
    "_orchestrator_metadata": {
      "dispatch_mode": "claude-code-subagent",
      "note": "Hand-authored at session close; Path 2 stub health, see Infrastructure Spec §3.3.1."
    }
  },
  "payload": {
    "kind": "handoff_ready",
    "entry": "Semantic Delay",
    "handoff_path": "Semantic Delay/Semantic Delay — baton.md",
    "receiving_surface": "Claude Code (Mac, palace root)",
    "move": "Wire the feedback-path saturation stage; decide pre/post filter placement.",
    "invocation": "Read Semantic Delay.md and the baton, then pick up the move."
  }
}
```

**Pairing, the way `RESOURCE_REQUEST`/`GRANT` pair.** When the catcher picks the move up, it posts a `REPLY` carrying `re: "<the handoff_ready id>"` and `payload.kind: "handoff_picked_up"`. Pending work is then exactly: every `handoff_ready` with no matching `handoff_picked_up`. This mirrors the inbox-builder logic already used for resource requests (§2.6), so a future scheduled poller — or Loudon scanning `GENERAL` — reads the open batons with the same scan that finds open asks.

**How to post.** From Cowork or Claude Code, append one valid §2.2 line to `_ops/swarm/persistent/blackboard.jsonl` (the board renders it on reload / live-tail), or `POST /api/persistent` when the STIGMERGY dev server is running. Either way the strict validator (`_ops/stigmergy/app/server/validator.js`) gates the write — a malformed announcement is rejected, not coerced.

**The honest limit.** Until the scheduled dispatch of Stage C exists, this post is for *visibility* — it surfaces the ready baton on the board for Loudon, but a human still triggers the pickup. The post is the trail; the scheduler is the ant. Announcing now is still worth it: it builds the convention and the board history that the scheduler will later read. See [[Two Batons, One Board]] § The board is a pheromone field, not an actuator.

---

## Completion Signal (outgoing side)

The outgoing Baton is complete when:

1. A baton file exists at its shape-correct home
2. The entry has an "Active Baton" section pointing to it (or, for no-parent shapes, the board announcement is posted)
3. Loudon has confirmed the baton is sufficient
4. The outgoing closing message has been delivered with the suggested invocation
5. The baton is committed to git — or, if authored on a surface that can't commit (Cowork), the closing message flags it uncommitted so the catcher commits it on pickup

## Completion Signal (incoming side)

The incoming Baton is complete when:

1. The incoming Claude has read the baton and the entry
2. The incoming Claude has picked up the move (acted on it)
3. The catch is marked — the "Active Baton" pointer removed, or for a board-announced baton the `handoff_picked_up` REPLY posted — the baton committed if it wasn't already, and the file deleted (or marked deletion-pending where the surface can't delete)

If the incoming Claude finds the baton incoherent, stale, or insufficient: stop, ask Loudon, do not improvise. A bad baton that gets followed silently produces drift.
