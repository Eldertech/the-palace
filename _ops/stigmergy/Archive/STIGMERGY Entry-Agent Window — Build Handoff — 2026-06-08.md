---
title: "STIGMERGY Entry-Agent Window — Build Handoff"
born: 2026-06-08
genre: cross-surface paste-prompt (Cowork → Claude Code)
status: ready
links:
  - target: "[[STIGMERGY Entry-Agent Window — Integration Plan]]"
    type: connects-to
    label: "handoff-for"
  - target: "[[Surfaces and Capabilities]]"
    type: connects-to
    label: "capability-delta-source"
forward_vector: "I carry the move from a proven Cowork prototype to a real, toggle-gated build of the entry-agent window inside STIGMERGY — built in an isolated worktree, starting at M0. I am caught when the Mac-side session has the worktree green and Loudon has driven M0 live; then I archive."
---

# Handoff: STIGMERGY Entry-Agent Window

## Move

Carry the entry-agent window from a proven Cowork prototype to a real, toggle-gated build inside STIGMERGY's STATE deck — in an isolated worktree, starting at M0.

## Why this move matters

The interaction is proven and the spec is settled, but what remains can only run where a clean multi-package `npm install` and durable git hold — the Mac, not the sandbox. Handing it now is what makes the worktree discipline real: build M0 and *feel it live* before any agent exists, rather than designing forward blind.

## Tried and rejected

- **Canvas text rendering** → DOM + `shape-outside`. The right-pin means text flows only left, so one float suffices and native selection + `[[wikilink]]` hit-testing survive.
- **Naive `fs.write` for edit liveness** → the armed-write path. The honesty spine is the whole point of STIGMERGY.
- **A cheap in-browser reflex classifier as the starting point** → capability-first: strongest model first, optimize down later.
- **New §2.2 message verbs for the window** → reuse `RESOURCE_REQUEST`/`PROOF`/`BROADCAST` + a `mode: Companion` convention. The wire is sacred.
- **Building on main** → isolated worktree, iterate, merge later (Loudon's directive).
- **A Shop Specialist for the editor** → the Companion is a *mode* of the page; its standards live in a meta-spec entry.

## Current state

Nothing is built. The interaction exists only as the `merleau-entry-agent` Cowork artifact — the reference to match. The full build order (M0–M2 milestones, worktree workflow, the edit toggle, the `@stigmergy/core` precondition, acceptance criteria) and the invariants live in the Integration Plan **§5–§6**; this handoff does not restate them. The five open decisions are **resolved** (Plan §7). No branch, no worktree, no code yet.

## Next move

Create the worktree (`feature/stigmergy-entry-agent`), capture the green vitest baseline, confirm the `@stigmergy/core` precondition (Plan §5), then build **M0** — the toggle-gated shell in `EntryBody.jsx` / `App.jsx`, DOM + `shape-outside`, no inference, fully reversible — and get Loudon driving it live before starting M1.

## Receiving environment

Claude Code, Mac, palace root (`/Users/loudonstearns/Documents/The Palace`). Capability deltas that bite this move: a clean multi-package `npm install` (the sandbox can't), durable git commits, and the **Mac host for heavy Specialists** (ComfyUI/Manim/Remotion/FLUX-local) that M2 needs. Surface-specific gotchas: stale Cowork git locks (`rm -f .git/HEAD.lock .git/index.lock` first); never `git add -A`; **no direct Anthropic API** — agents are actuator-spawned workers only. See [[Surfaces and Capabilities]].

## Calibrations from this session

- **Capability-first:** strongest model/path first to prove the behavior, optimize down later; not token-budget-constrained for this prototype.
- **Ceremony fidelity is load-bearing** — this handoff was itself redrafted to honor the Handoff Ceremony rather than an improvised doc form.
- The five Plan decisions are resolved — build to them, don't reopen.
- The ambition lives in the Plan (the spec); this baton stays lean and points to it.

## Load these files first

1. `Palace development/STIGMERGY Entry-Agent Window — Integration Plan v0.1.md` (the spec — §5 build order, §6 invariants, §7 decisions)
2. this handoff
3. `STIGMERGY.md` and `Palace Agent Infrastructure Spec` (wire, decks, boards)
4. `_ops/stigmergy/STIGMERGY Audit — 2026-06-06.md` (§3 core precondition; §6 do-not-touch)
5. `_ops/stigmergy/app/src/components/EntryBody.jsx`, `app/src/App.jsx`, `app/server/middleware.js` (M0 mount points)
6. `app/server/actuator.js`, `app/server/steward-lane.js` (worker spawning + scars — M1+)
7. `Shop/Maker.md`, `The Shop.md` (Tier-B dispatch — M2)
8. `BBS Design System.md` (glow + window styling must conform)
9. the `merleau-entry-agent` Cowork artifact (the interaction to match)

---

*Loudon Live · Autodidact Polymaths*
