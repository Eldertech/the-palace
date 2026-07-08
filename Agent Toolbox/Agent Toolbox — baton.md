---
title: "Agent Toolbox — baton"
born: 2026-07-08
links:
  - target: "[[Agent Toolbox]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the just-built agent toolbox across a session boundary — built and committed but not yet proven live or wired in — waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Agent Toolbox — baton

## Move

**Reload the session, then prove and wire the [[Agent Toolbox]].** Three steps, in order:

1. **Verify the baseline cut on our own profile.** Spawn a `palace-reader` (subagent_type `palace-reader`) with an N0 probe — prompt: *"reply with exactly: ok. Use no tools."* — and read its returned `subagent_tokens`. Expected **~16K** (the Explore probe's read-only baseline), vs general-purpose's ~46K on Haiku. If it lands near 16K, the ~64% cut is confirmed on our profile, not just on Explore. If it's high, the `.claude/agents/` tool allowlist isn't shedding the MCP schemas — investigate before wiring.
2. **Confirm the spawn-tool name.** Dispatch a `palace-orchestrator` and have it try to spawn a trivial subagent. The roster lists `Task` (Claude Code's canonical name) but this harness surfaces the tool as `Agent`. Whichever the config honors, fix `Agent Toolbox.md`'s roster block and re-run `node _ops/agent-toolbox/generate.mjs`.
3. **Wire the Concierge to default to `palace-reader`.** The `concierge` skill currently spawns a general-purpose agent. Change it to spawn `palace-reader` by default and escalate to `palace-writer` for the curator posture / `palace-orchestrator` only when it dispatches. This is the step that actually *uses* the toolbox — until it's wired, the profiles exist but nothing reaches for them.

## Why this move matters

The toolbox is **built and committed but unproven live and unused.** Custom agent types register only at session start, so the three profiles (`palace-reader/writer/orchestrator`) become spawnable only on the next reload — this session never got to test them. And the 64% baseline cut is measured on the built-in **Explore** agent, not yet on our own `palace-reader`. Until step 1 confirms the cut and step 3 wires the Concierge, the toolbox is a promise, not a working economy.

## Current state (all committed to `main` this session)

- `Agent Toolbox.md` (canon roster) + `_ops/agent-toolbox/generate.mjs` + three generated `.claude/agents/` defs — commit `fd3682a`. Canon is the source of truth; the generator projects it into the harness config; edit canon → run generator → reload.
- Floor slim (foundation docs lightened ~4.7K, value-tiers only): SCHEMA split to `SCHEMA — Context` (`31afe27`), CLAUDE trim (`eea786d`), JEWEL trim to seed + `Jewel — Context` (`3be339e`).
- [[Agent Wellbeing]] § The Measurable Floor + the sensor-B proof file — commits `bfb6195`, `14e0c45`, `21f0243`. This is the deposit that grounds the whole toolbox rationale.

## Tried and rejected (don't re-open)

- **Do not re-trim the Tier-2 framework files** (Four Pillars, Palace Philosophies, Cooperation Yields Agency, Hilaritas Generator, Modes of Collaboration). Decided this session per Loudon's principle: *the higher the tier, the more the voice matters.* They are the palace's character; trimming them trades voice for a small token gain. The floor savings came from the value tiers (SCHEMA/CLAUDE/JEWEL); the toolbox is where the bigger, voice-free savings are.
- **Sensor A (`count_tokens`) is permanently unavailable** — Loudon stays on the Agent tool with no API. `subagent_tokens` (Sensor B) is the only capacity signal; the dial is built on it. Do not re-propose count_tokens.
- **The self-report and outside-agent quality-read experiments are deferred** — a field-scale research problem off the palace's critical path. Not the next move.

## Negative space

- **Not built this session:** the Concierge health *dial* itself (read `subagent_tokens` ÷ model window → compact/respawn). It's now fully characterized (see the proof) and buildable, but it's the *next* build, after the toolbox is wired. The original Concierge baton (`Palace development/Concierge/Concierge — baton.md`, Phase 4) still holds for that.
- Don't manufacture new canon around the toolbox — the model is deposited; the remaining work is *proving and wiring* it.

## On pickup (the catcher's checklist — do not rewrite per session)
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it is still live before committing to it: re-read [[Agent Toolbox]] and `git log` since this baton's `born` date; confirm the "Current state" still matches. If the move is already done or superseded, STOP and surface it.
3. If this baton or its board line is uncommitted, commit them first (that commit is the archive Step 7 relies on).
4. Mark it caught: post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) to the board.
5. Delete this baton file (git is its archive).
6. If the baton names a surface/worktree coordinate, confirm it holds before relying on it.
7. Act on the move, holding the calibrations above.
