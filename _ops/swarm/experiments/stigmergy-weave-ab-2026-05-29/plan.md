---
title: "Stigmergy Weave A/B — Experiment Plan"
type: meta
pillars:
  - tools
  - practice
  - philosophy
born: 2026-05-29
stage: seed
status: active
links:
  - target: "[[Swarm Weave]]"
    type: connects-to
    label: tests-phase-2
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: stress-tests
  - target: "[[Pheromone Trail]]"
    type: connects-to
    label: cross-cycle-arm
forward_vector: "I exist to settle one question with evidence: does a swarm of weave workers reading each other's traces produce anything a swarm of isolated workers does not? When I have a verdict, I compost into a finding."
---

# Stigmergy Weave A/B — Experiment Plan

## The question

The [[Swarm Weave]] as actually run (2026-03-30, 04-07, 04-27) uses a
**coordinator-synthesis** architecture: each worker audits its entry in
isolation and reports to a coordinator who de-duplicates. Workers never read
each other. The [[BBS Blackboard]] was proposed as the medium through which
swarm agents *would* communicate — but that function has only ever been
exercised in **songlines** (sequential path traversal) and **stewardship
batches** (agent→Trickster decisions), never inside a Weave.

This experiment isolates one variable: **does giving weave workers access to
each other's traces change — and ideally improve — the weave's output, or is it
noise and duplication?**

## Hypotheses

- **H1 (live peer board helps):** A worker that reads peers' FLAGS before its
  second pass will produce findings it would not have produced alone —
  specifically *bridge* introductions spanning two workers' entries, and
  convergence it can confirm rather than guess.
- **H0 (null / it's noise):** The two-round board adds duplication and
  restatement without net-new, useful structural findings. The 04-27 run already
  achieved cross-worker convergence *without* a board, which is mild prior
  evidence for H0.
- **H2 (pheromone trail helps):** A worker seeded with a prior cycle's
  high-signal `worker_trace` focuses attention productively (faster to the real
  gap, fewer low-value proposals) versus a cold-start worker.

## Arms

Run identically on **two independent neighborhoods** for replication.

| Arm | Stigmergy | Mechanism |
|---|---|---|
| **A — Control** | OFF | Workers audit in isolation, parallel, report to coordinator. The standard weave. |
| **B — Live peer board** | ON (intra-cycle) | Round 1 = Arm A. Round 2: each worker re-audits after reading the round-1 FLAGS board. |
| **C — Pheromone trail** | ON (cross-cycle) | Fresh workers audit after reading `worker_trace` pheromone derived from a prior cycle's convergence. |

Dispatch 1 does double duty: it is both Arm A (control) and Round 1 of Arm B.

## Neighborhoods (5 entries each, cleanly separated)

- **Hilaritas:** Hilaritas Generator (anchor), Spinoza Conatus, Cooperation
  Yields Agency, Striatum, Tristitia Generator
- **Kuramoto:** Kuramoto Coupling (anchor), Hyperdimensional Prism, Action
  Potential Oscillator, Lateral Access, Mixture of Experts

The two hubs' mutual link is deliberately excluded from each other's worker set
so the neighborhoods are independent test beds.

## Workers

Each worker is an isolated subagent (sonnet) with file access. It receives: its
assigned entry, the other four neighborhood entries, the path to SCHEMA §4, and
instruction to glob the palace root for the full title list (unsung-path
matching). It returns a structured report: unsung paths, up to 3 new
introductions, metadata flags, forward-vector check, and a short FLAGS list of
its highest-signal findings. Coordinator = this session (opus).

## Metrics (defined before running, to avoid post-hoc bias)

1. **Unsung paths** found (count; should be ~stable across arms — these are
   deterministic, a sanity check on worker consistency).
2. **New introductions** (count and a coordinator quality grade A/B/C).
3. **Convergence** — introductions independently proposed by ≥2 workers.
4. **Stigmergy-unique findings** — findings present in Arm B/C but absent from
   Arm A. The core signal.
5. **Causal-stigmergy evidence** — a Round-2/trace worker explicitly
   referencing a peer's flag as the reason for a finding. Direct proof the trace
   did work, not coincidence.
6. **Noise introduced** — restatements, duplications, or degraded proposals the
   board caused. The cost side.
7. **Verdict** per arm per neighborhood: USEFUL / DIFFERENT-BUT-NEUTRAL /
   NO-SIGNAL.

## Non-destructive guarantee

No real palace entry is modified. Worker subagents are read-only on the palace.
The blackboards, traces, worker reports, and findings live entirely in this
experiment bundle (`_ops/swarm/experiments/stigmergy-weave-ab-2026-05-29/`).
Any link proposals the experiment surfaces are reported for Loudon's separate
approval — they are not written by the experiment.

## Outputs

- `blackboards/{hilaritas,kuramoto}-flags.jsonl` — the round-1 peer boards
- `reports/` — raw worker reports per arm
- `findings.md` — the verdict, evidence, and a recommendation on whether the
  board belongs in the production Weave
