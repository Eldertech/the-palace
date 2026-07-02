---
title: assume multi-agent
type: practice
pillars:
  - tools
  - practice
born: 2026-07
stage: sprout
last_activated: 2026-07
activation_count: 1
forward_vector: "I want to be the discipline no tool skips: build every tool expecting a second agent is already running it. I keep my scar close — a lost day of phantom RunPod nodes — because it's the why, and I hand my machinery to [[The Commons]]."
links:
  - target: "[[Tool Builder]]"
    type: member-of
    label: deepest-member
  - target: "[[The Commons]]"
    type: connects-to
    label: made-real-by
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: coordinates-on
  - target: "[[RunPod GPU Backend]]"
    type: connects-to
    label: the-scar
---

# assume multi-agent

![[assume multi-agent — hero.png]]

Build every palace tool expecting two or more Claudes to run it at once — on the same repo, the same service, the same account. Single-tenant is the exception you justify and flag loudly, never the silent default.

## The four habits

- **Namespace what you make.** Put a per-agent slug in the name of every pod, session, branch, or temp file you create.
- **Scope every list and delete to your own.** Never "get all, then act on all" — that is exactly how you reach across and kill another agent's work. Filter to *your* namespace first.
- **Keep per-agent local state.** No shared `/tmp/pod_id`; make it `/tmp/pod_id-<slug>`. One shared file is one race.
- **Lease genuinely-scarce singletons.** One GPU account, one rate budget — announce your claim on a shared medium instead of racing for it.

## The scar

A full day (2026-07-02) looked like a RunPod outage: pods booted RUNNING but the renderer never came up, roughly ten failures in a row. The real cause was a *second* Claude on the same account. The tooling was single-tenant in three ways — one shared pod name (so name-based delete hit the other's pod), a guard that aborted if *any* pod existed, and stray sweeps that listed all pods and deleted them. A pod killed at ~120s reads exactly like a slow boot that never finishes. That indistinguishability is what cost the day, and it's why this discipline is a floor, not a nicety.

## Where it lives now

This is one discipline in [[Tool Builder]] — the deepest one, so it earns its own page. Its machinery is [[The Commons]] (`_ops/commons/`): identity, ownership, scoping, leasing, reaping, made general so every future service inherits the safety. When you *can't* namespace a tool yet, only one agent may use it at a time — and say so, loudly. Coordinate on the [[STIGMERGY]] board.
