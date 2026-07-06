---
title: "Swarm Weave — baton — multi-lens-build-and-run"
born: 2026-07-05
links:
  - target: "[[Swarm Weave]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the next fresh Opus from idea to a running multi-lens Weave: build the partitioner, show the partition, run the lens-swarm, gate on Loudon. Delete me on pickup — git is the archive."
---

# Baton — build and run the Multi-Lens Weave

**You are a fresh Opus with clean context.** A long session re-founded the Weave and designed a new way to divide it (the *evolution* of the Swarm Weave, not a new thing). You pick up at *build and run*. Do not trust this baton's numbers blind — re-run the scans; they're cheap.

## Read first (the why + the floor)
- [[Swarm Weave]] § **The Multi-Lens Weave** — the design you are executing (connections are lens-dependent; productive redundancy; lenses do different jobs — coherence / connection / gems; convergence=confidence, single-lens=surprise; the economics).
- [[Weave Ceremony]] + `— Context` — the amended contract: **values-primary** (scans flag, the mind of the moment decides, Loudon signs; a hard gate is earned only after a rule proves mechanical), health-and-joy charter, new-entry catch-up (Step 0b), face audit (Step 5c), softened guidelines-not-caps.
- [[The Palace Hardens Around Values]] — today's keystone; and the standing instruction: **push back if a choice comes in out of phase with the palace.**

## Current state (verify with git + a scan; do not assume)
- Shipped & on `main` this session: amended Weave (`768b32d`), the values deposit (`69df9a6`), the Swarm Weave slim (`4f86180`), the concierge-sandbox deletion, the catch-up granularity fix (`1bffb78`), and this multi-lens fold.
- Map: `_ops/maps/palace-map-full-2026-07-04.json` — ~301 nodes / ~2441 edges (**rebuild first**: `python3 "$(ls -1 _ops/swarm/build-map-*.py | sort | tail -1)"`).
- **Deterministic layer already owns the mechanical checks — so the swarm does the SEMANTIC layer only** (unsung paths, new introductions, forward-vector quality, graffiti). Last read: link-directions 0 E (6 W2), doc-drift 0 E / 47 W, entry-naming 0 E / 10 W, ghost-links 107 W, bundle-hygiene **1 E** (`_ops/claude-code-prompts/2026-05-04-…` `agent-prompt` — demote), 21 W1; face-audit 37 add / 4 grey / **1 retire** (`Projects/Shimmer Cloud.md`).
- New-entry catch-up cohort = **21**, target degree 10: `python3 _ops/swarm/new-entry-catchup.py --since-last-weave --block` (thread its block into every worker prompt).

## Your moves, in order
1. **Build `_ops/swarm/partition-palace.py`** — reads the latest map; **a lens is a parameter**. At least three: `--lens folder` (directory families), `--lens community` (dependency-free label-propagation on the edge list), `--lens mirror` (group by the `mirrors` link type). Emit per cluster: member entries + boundary edges. Pure/deterministic, sibling to the other `_ops/swarm/` helpers.
2. **Show Loudon the partition before dispatching** — does each cluster read as a coherent neighborhood? (a gate).
3. **Warn before the fan-out** — rough agent-count + token estimate (~35 agents across three passes; Sonnet workers, you as coordinator). Ask run-now / trim / wait.
4. **Run the lens-swarm** — folder *coherence* pass (~6–8) + community *connection* pass (~18–20) + mirror *gem* pass (~4–8). Thread the newcomer list into every worker. Workers propose only.
5. **Coordinator synthesis (the upgraded job)** — report **cross-lens convergence** (≥2 lenses → confidence) and **single-lens uniqueness** (esp. mirror → surprise gem). Assemble the staged batches.
6. **Present staged; Loudon signs; then and only then write.** Closing linters + commit `Weave — <date> — [...]` with every disposition in the body.

## Guardrails
- **Nothing writes before Loudon's signature.** Workers/scans propose; the mind judges; Loudon gates.
- The linters own the mechanical layer — don't have workers re-derive ghosts/bundle/faces (they'd drift from the amended criteria).
- Once *run*, consider a `deepens` back-link from [[Weave Ceremony]] to the Multi-Lens section and a stage note (idea → practiced).

**On pickup:** post `handoff_picked_up` to the persistent board, remove the `## Active Baton` marker from [[Swarm Weave]], and delete this file (git is the archive).
