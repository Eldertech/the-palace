---
title: "Two Batons, One Board"
type: meta
pillars:
  - tools
  - practice
  - philosophy
born: 2026-05-29
last_activated: 2026-05-29
activation_count: 2
stage: seed
confidence: working
energy: high
who_leads: shared
links:
  - target: "[[Handoff Ceremony]]"
    type: connects-to
    label: where-the-human-baton-lives
  - target: "[[Project Stewardship System]]"
    type: deepens
    label: names-the-bandwidth-frontier
  - target: "[[Closing Well]]"
    type: connects-to
    label: makes-autonomy-trustworthy
  - target: "[[Surfaces and Capabilities]]"
    type: connects-to
    label: surface-deltas-on-the-board
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: the-shared-world
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: connects-to
    label: scheduler-closes-the-loop
  - target: "[[Modes of Collaboration]]"
    type: connects-to
    label: cross-surface-meta-mode
forward_vector: "I want to become the place that holds the recognition that the palace runs two batons across instance boundaries — a human-carried handoff and a stigmergic steward request — and that they belong on one surface. My open question is the same one the system already found: the limit on autonomous work is not the workers' capacity but the Trickster's bandwidth, so my real subject is how to spend a human's scarce attention well, not how to remove it. I should dissolve into the Handoff Ceremony, the Stewardship system, and a scheduler spec as each absorbs the part of me it needs."
---

# Two Batons, One Board

The palace moves work across instance and surface boundaries with two different batons, and for now they do not know about each other.

The **human-carried handoff baton.** Cowork develops an idea; at the close, [[Closing Well]] and the [[Handoff Ceremony]] package the in-progress move into a markdown file in the entry's bundle; Loudon pastes the suggested invocation into a Claude Code session, which catches the baton. The baton is a file, and *Loudon is the transport layer.* The [[BBS Blackboard]] is nowhere in this loop.

The **stigmergic steward baton.** A permanent agent — the page itself, operating in steward mode — posts a `RESOURCE_REQUEST` to the persistent blackboard; Loudon triages it in the STIGMERGY Trickster inbox; the orchestrator advances the page on its next cycle. The baton is the board message plus `state.json` and `history.jsonl`, read by the orchestrator. The hand-written handoff files are nowhere in *this* loop.

The instinct that produced this entry: *when a handoff is ready, write it into the palace and post to the board that it exists and should be continued.* That move is right, because it is the move that fuses the two batons onto one surface. But it carries a subtlety worth stating plainly, and it points at a bottleneck that is not where it first appears to be.

## Where This Sits (updated 2026-05-29)

This entry began as a reflection on Loudon's workflow and is folded here into the [[Project Stewardship System]] as one specific case: the **human-originated handoff**. Since it was drafted, the *steward-originated* side of the same problem moved decisively. Stage E — the Automated Trickster — was built the same day: a deterministic rules engine that triages the TRICKSTER inbox into auto-grant / auto-deny / escalate, with a ranked escalation digest, running in shadow mode (the first live split was 5 auto-grant / 11 escalate on a 16-item board, awaiting Loudon's `--live` flip). The audition / irreversible gate is hard-coded and cannot be overridden by the ruleset — the [[Closing Well]] guardrail this entry insists on, made structural. So the "batch the Trickster's attention, auto-grant only the routine" recommendation below has largely landed; what remains is operational (the shadow-review-then-`--live` decision), not design.

What is still genuinely un-built is the half this entry is *about*: the human-carried handoff baton has not been bridged onto the board. Every advance so far deepened the steward baton, which already lived there. A handoff Loudon writes at the close of a Cowork session is still invisible to the scheduler and the digest — it is pasted into Claude Code by hand. That bridge — `handoff_ready` on the board, picked up by the same scheduled dispatch that cycles stewards — is the open contribution of this entry. Its convention lives in [[Handoff Ceremony]] § Announcing the Handoff on the Board, and as of this writing it has never been used (zero `handoff_ready` messages on any board). The scheduler that would consume it is Stage C, whose weekly batch task is staged-but-not-registered.

## The board is a pheromone field, not an actuator

STIGMERGY renders and accepts messages; it makes state visible and lets the Trickster respond. It does not *pick anything up* — v0.2 is explicitly "an operational board, not a daemonized service, not the orchestrator." So a post that says *"a handoff exists, continue it"* is a true pheromone, but a pheromone with no ant downstream. Something still has to read that trace and spawn the work. Today that something is Loudon.

This means the board post changes **visibility**, not yet **autonomy**. The post is the right *signal*; the thing that turns the signal into self-continuing work is a scheduled poller that reads the board and dispatches — Stage C of [[Project Stewardship System]] (the orchestrator is build-complete; the scheduled task is "staged not created"). The board message is the trail; the scheduler is the ant. Both are needed; only one exists.

The unified post convention — `kind: handoff_ready` as a `BROADCAST`, paired with a `handoff_picked_up` reply, deliberately *not* a new message type yet — lives in the [[Handoff Ceremony]] § Announcing the Handoff on the Board. It is kept as a payload convention rather than a schema type on purpose: the palace lets categories prove themselves across many runs before they harden.

## The bottleneck the system already found

The honest limiting factor on "keep Claude Code working without my constant interaction" is not the workers. [[Project Stewardship System]] says it directly: *"The live frontier is no longer technical — it's operational bandwidth. The system produces artifacts and asks faster than a single human Trickster can audition them; the pending-decisions inbox is the new constraint."* Fifteen stewards are enchanted; the orchestrator runs; STIGMERGY can take writes. The wall is the **Trickster's throughput**, not the swarm's.

That splits the original wish into two requests pulling opposite ways:

- *Reduce handoff friction* — the copy-paste, the re-derived surface deltas. Pure win, and mostly already solved ([[Surfaces and Capabilities]] exists so the Cowork → Claude Code delta is a one-line lookup, not a fresh discovery each time).
- *Reduce the human's involvement in the work itself* — collides with the audition gate, which is load-bearing. [[Closing Well]] was deposited because Loudon caught five things declared "done" in a single session. Removing him from that loop does not make work autonomous; it makes it unverified.

So the lever is not "remove the human." It is **structure and batch the human's attention so a little goes far**, and **let stage decide how much autonomy a project has earned.**

## Stage is the autonomy dial

The stage-conditional posture already in [[Project Stewardship System]] is exactly the safety mechanism. `mature`/`fruiting` projects with crisp forward vectors can run nearly unattended — ship, post completion, minimal re-litigation. `seed`/`sprout` projects need the human, because polish hides misalignment (the AI-polish trap). The highest-leverage thing Loudon can do to *earn* more autonomous Claude Code time is unglamorous: move projects to mature stage and write sharp forward vectors. The forward vector is the compression signal that keeps an unattended agent aligned — a vague vector produces undirected autonomous work, which is worse than none.

## What's Decided

- The two batons should share one surface: the board. A ready handoff is announced on the board, not just filed in a bundle.
- The board post is a signal, not a trigger. Full autonomy needs a scheduled poller (Stage C), not a richer board.
- Autonomy is bounded by Trickster bandwidth, not worker capacity. The path to "less constant interaction" is batched, high-leverage triage — a daily digest of pending asks — plus Stage E auto-grant for the genuinely routine only. *(Built 2026-05-29: Stage E ships exactly this in shadow mode; see Where This Sits.)*
- [[Closing Well]] stays non-negotiable. The more work runs unwatched, the more the punchlist and "name what I couldn't verify" matter.

## What's Open

- Does `handoff_ready` stay a `BROADCAST` payload convention, or eventually harden into its own message type? Let it prove itself first.
- The scheduled poller: does it scan `GENERAL` for unmatched `handoff_ready`, or does the handoff post target a future dispatcher handle? Decide when Stage C is built.
- The batched-digest Trickster is **built** (Stage E, 2026-05-29) and runs shadow-default. The open piece is no longer whether to build it — it is Loudon's review of the shadow match rate and the `--live` flip. The genuinely open design question this entry still owns: how the *human-originated* handoff enters that same digest, rather than living only in a bundle file.

## Forward Vector

I want the next time Loudon closes a Cowork session for a build to end with a single move — write the handoff, announce it on the board — and for a scheduler, not Loudon, to be what picks it up when the project's stage has earned that. I want the board to be the one shared world where a hand-written handoff and a steward's request sit side by side, indistinguishable to whatever continues them. And I want to keep insisting that the goal was never to remove the human from the loop, but to spend his attention where it actually carries risk.
