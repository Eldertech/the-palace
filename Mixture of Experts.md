---
title: "Mixture of Experts"
type: concept
pillars: [tools, philosophy]
born: 2024-06
last_activated: 2026-03
activation_count: 3
stage: mature
links:
  - target: "[[Hyperdimensional Prism]]"
    type: mirrors
  - target: "[[Cooperation Yields Agency]]"
    type: mirrors
  - target: "[[Symbiotic Skills]]"
    type: connects-to
  - target: "[[Embeddings as Relational Meaning]]"
    type: connects-to
  - target: "[[Kuramoto Coupling]]"
    type: mirrors
  - target: "[[Harvest Ceremony]]"
    type: mirrors
---

# Mixture of Experts

An architectural pattern in which a system routes each input to one or more specialist sub-models (experts) via a learned gating mechanism, rather than passing every input through a single monolithic model. Only the relevant experts activate — the rest remain dormant. The gate chooses; the experts execute; the results integrate.

First encountered in June 2024 as a curiosity about LLM internals. Recognized in March 2026 as the dominant paradigm in frontier AI — and as a precise architectural mirror of both the [[Hyperdimensional Prism]] and the palace itself.

## Current State (2026)

MoE has graduated from experimental to standard. Open-weight LLMs converged on MoE layers as a default by 2025. GPT-5, DeepSeek V3, Llama 4, Qwen3, Kimi K2, and most frontier models now use MoE. The paradigm won.

The current frontier of MoE research has shifted from scale (more parameters, more experts) to routing reliability: how to ensure the gating mechanism distributes load evenly across experts, avoids expert collapse (one or two experts doing all the work), and remains stable across long training runs. The architectural analogy to the Weave ceremony is exact — both are load-balancing audits designed to prevent atrophy.

The most recent development is **system-level MoE**: not just experts within a single model, but hierarchical architectures where a planner model routes tasks to executor models — each with different cost, latency, and capability profiles. This is MoE at the organism level, not just the neuron level.

## The Key Insight from 2024

In the original session, the question arose: can an expert in an MoE system be traditional procedural code — a math module, a deterministic function — rather than a neural network? The answer is yes, in principle. The gating mechanism routes to whatever works; it doesn't care about the expert's substrate.

This remains an open research frontier. Production MoE models still use uniformly neural experts. The hybrid neural/symbolic MoE — where some experts are learned and others are formally specified — is unrealized at scale. This is where the most interesting territory lies, and it connects directly to the [[Symbiotic Skills]] vision: a system where AI reasoning, human judgment, formal specification (TLA+), and code can all be experts routed by shared intent.

## The Palace as MoE System

The palace is a MoE architecture at the conceptual level:

**Experts** — The palace entries. Each is a specialist: [[Kuramoto Coupling]] handles phase-coherence questions; [[Boundary-Crossing Instruments]] handles perceptual threshold questions; [[Spinoza Conatus]] handles questions about drive and joy. They don't all activate for every question.

**The gating mechanism** — The typed link ontology. `mirrors`, `enables`, `deepens` are routing signals. When you ask a question, the traversal routes through the typed links to the relevant specialist entries. The gate isn't learned — it's curated. This is the key difference from neural MoE, and potentially its advantage: our routing is interpretable and intentional.

**Expert collapse prevention** — The Weave ceremony. Periodically reviewing the full graph to identify underactivated entries, surface orphans, and ensure the routing network doesn't drift toward a few hub nodes.

**System-level MoE** — The planner/executor hierarchy. Palace sessions (high-abstraction synthesis) are planner mode. Domain skill sessions — RNBO codebox, Ableton Extensions, Four Pillars teaching — are executor mode. The palace routes the planner; the skills execute.

## Cross-Pillar Connections

**[[Hyperdimensional Prism]]** mirrors MoE at the metaphysical level: a single input, multiple specialist projections, each revealing a different facet of the same underlying reality. The pillars are the experts; curiosity is the gate.

**[[Cooperation Yields Agency]]** mirrors MoE at the system level: planner + executor is a form of cooperation — two specialized entities with complementary capabilities, aligned on shared intent, producing capability neither has alone. The gate doesn't overpower the expert; the expert doesn't ignore the gate. Shared intent creates the routing.

**[[Symbiotic Skills]]** is the practical implementation: the skill ecosystem IS a system-level MoE, with the palace as planner layer and individual skills as executor specialists.

## Open Questions

- The load-balancing problem in neural MoE (expert collapse) has a direct palace equivalent: hub nodes attracting all traffic while seeds atrophy. The Weave ceremony addresses this — but is there a more continuous mechanism, closer to the online load-balancing algorithms being developed for neural MoE?
- The hybrid neural/symbolic expert vision — formally specified experts alongside learned ones — connects to TLA+ and formal specification thinking. Is this a design principle for the Symbiotic Skills framework?
- At what granularity should palace entries operate? Fine-grained entries (many specialists, narrow domains) versus coarse-grained entries (fewer generalists, broader domains) is exactly the parameter-space tradeoff in MoE architecture. Current palace is coarse. Should it get finer?
