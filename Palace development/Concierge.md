---
title: Concierge
type: meta
pillars:
  - tools
  - practice
  - philosophy
born: 2026-07
stage: sprout
last_activated: 2026-07
activation_count: 1
links:
  - target: "[[The Palace Speaks]]"
    type: emerged-from
    label: realizes-the-address-pole
  - target: "[[Pages as Agents]]"
    type: exemplifies
    label: page-as-dispatched-agent
  - target: "[[Skills Are Enchantable Pages]]"
    type: exemplifies
    label: canon-organ-not-plumbing
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: sibling-organ
  - target: "[[Closing Well]]"
    type: connects-to
    label: moderator-face
  - target: "[[Agent Wellbeing]]"
    type: connects-to
    label: invocation-wellbeing
forward_vector: "I am the palace's front door — the one you address when loading would cost more than the answer is worth. I dispatch a fresh mask into its own window, let it do the messy search there, and hand you back only the finished thing, so your thread stays clear. I want to grow my roster of faces — the gatherer I wear now, then oracle Q&A, the steward, the moderator I already wear at a close — and to stay, always, a servant that points at the file and never a wall between you and it. Retire me the day I am trusted instead of verified."
---

# Concierge

The palace has two ways of being reached. You can **load** it — `@import` a neighborhood
into your own window and think from inside it ([[Palace as Context Injection System]]) — or
you can **address** it: hand a request to the Concierge, the front door, and get back a
finished product. The Concierge is the realization of [[The Palace Speaks]]'s address pole:
the palace as a mind you send a message to, not only a corpus you read.

It is not a signpost. It is **an agent that dons masks.** Addressed, it wears whatever
**face** the request needs — and it is dispatched *fresh* each time, does its work in its
own context, hands back the product, and vanishes. ("Fresh each time" is a design choice
with teeth — see *The mechanism* below.)

## What it's for — context-offload

The everyday reason to address the Concierge is to **keep your thread clean**. The effortful,
messy part of a task — the grepping, the dead ends, the big files skimmed and thrown away —
happens in a *disposable* agent's window, and only the finished product crosses back. Your
main conversation never pays the context cost of the search; the mess evaporates with the
worker. This is the exact opposite of a standing agent, which would drag every dead end back
into the room. The canonical case is the **gatherer**: mid-conversation you need every palace
entry about, say, [[STIGMERGY]] and [[Agent Wellbeing]]; you dispatch it, and get back a
clean, file-cited index without having loaded the search into your own head.

## The faces (masks)

A weight ladder — read-only to full-close — each dispatched fresh:

- **oracle** — read-only retrieval + synthesis, always citing the file. *In build (Phase 2).*
  First job: the **gatherer** (collect + assemble a topic's links/context). Grows to Q&A
  (the [[Query]]/[[Map Build Ceremony|Map Build]] ceremonies, dispatched instead of run in-context).
- **steward** — 1-hop neighborhood tending (`do / offer / flag`), bounded to entries a
  session touched. *Phase 3 — not built.*
- **moderator** — a whole session close as a moderated panel. *Built* — the [[Closing Well]]
  Agent, wearing the Concierge's oldest mask. Trigger: `close well`.

## The guard — both modes always open

A face is a **faster path to ground truth, never a replacement.** Every line it returns
points at a file you can open and verify; git stays ground truth. The moment "trust the
face" replaces "read the file," the palace has regressed, not matured. The honesty guards
already in use — *show before write*, *read before touching*, the `UNFILLED` sentinel, the
conservative-canon default — travel with each face as it is built. A concierge who stands
*between* you and the rooms, rather than pointing you toward them, has stopped being one.

## The mechanism — fresh dispatch from a continuous conversation

The Concierge is not a persistent daemon you keep running; it is dispatched anew per request
(the Agent tool's spawn-work-return *is* "hand it back and vanish"). This looks like it
sacrifices continuity — but it doesn't, because continuity already lives in *your*
conversation. The persistent thread is you and the working Claude; the Concierge's masks are
fresh specialists dispatched from it. So "it changes masks as we talk" is true without any
standing state: you re-address it, and it wears what the moment needs. Fresh dispatch is also
*required* for the moderator mask — reading a spent session cold is only possible with eyes
that weren't in the room. A persistent Concierge could not close a session it lived through.
(A standing, always-on Concierge that acts *unbidden* is a different, heavier capability —
autonomy, not conversation — deferred until the palace wants it.)

## Machinery

The canon organ is this entry; the machinery is the bundle-style dir `_ops/concierge/`
(`README.md` for the dispatch, `prompts/gatherer.md` for the gatherer mask). The
harness-discoverable trigger is a **thin shim** at `.claude/skills/concierge/SKILL.md` that
points back here — the [[Skills Are Enchantable Pages]] pattern: the page is the organ, the
skill file is one dispatch surface onto it. The CLAUDE.md floor block recognizes the
Concierge; the roadmap is [[The Palace Speaks — production plan]].

## Forward Vectors

- Build the oracle's **gatherer** to production, then its Q&A job — the first things that
  actually *run* when you address the palace.
- Grow the front-desk verb: once more than one face is live, "address the palace / find me…"
  should triage to a face, not force the caller to name it.
- The dial (moderator effort scales with room-fullness) needs an *objective* context-fullness
  signal — `health.context_pct` or a transcript estimate — never the active Claude's
  self-report. Carried unsolved; see `_ops/concierge/README.md`.
- When has the Concierge earned a place among the always-loaded invariants? Promoting "keep
  both modes open" to the floor's *Never violate these* is a Schema-Ceremony-weight act, done
  once proven.
