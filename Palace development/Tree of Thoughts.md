---
title: Tree of Thoughts
type: source
pillars:
  - tools
  - philosophy
  - practice
born: 2026-03-28
last_activated: 2026-03-28
activation_count: 1
stage: sprout
energy: high
confidence: established
author: "Shunyu Yao, Dian Yu, Jeffrey Zhao, Izhak Shafran, Tom Griffiths, Yuan Cao, Karthik Narasimhan"
year: 2023
medium: paper
links:
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: enables
    label: "grounds"
  - target: "[[Swarm Weave]]"
    type: mirrors
  - target: "[[Enchanted Worker]]"
    type: enables
  - target: "[[BBS Blackboard]]"
    type: connects-to
  - target: "[[Generative Compression]]"
    type: connects-to
  - target: "[[Pages as Agents]]"
    type: enables
    label: agent-tree-search
forward_vector: "I want to become the technical grounding for the palace's branch exploration practice — making explicit how the manual technique (rewinding to a conversation's moment of maximum density) and the automated technique (coordinator checkpoints + parallel branch workers) are both implementations of the same tree search algorithm. I want a worked example that traces a specific palace session through the ToT framework, naming the thought decomposition, the branch points, and what each branch found."
---

# Tree of Thoughts

![[Tree of Thoughts — hero.png]]

**Full title:** "Tree of Thoughts: Deliberate Problem Solving with Large Language Models"
**Authors:** Shunyu Yao, Dian Yu, Jeffrey Zhao, Izhak Shafran, Tom Griffiths, Yuan Cao, Karthik Narasimhan
**Published:** NeurIPS 2023
**arXiv:** 2305.10601

## The Core Argument

Standard chain-of-thought prompting forces language models into a single linear reasoning path. The model generates one sequence of tokens, each step conditioned on everything before it, with no opportunity to explore alternatives, backtrack, or pursue parallel hypotheses. This is adequate for problems where the first plausible path leads to the correct answer. It breaks down on problems requiring search, planning, or sustained reasoning across multiple possibilities.

Tree of Thoughts replaces the chain with a tree. Each node in the tree is a "thought" — a coherent unit of language that represents an intermediate step in reasoning. From any node, the model can generate multiple children (exploring alternative continuations), evaluate them (scoring their promise toward the goal), and search across the tree using standard algorithms (breadth-first, depth-first, beam search). Backtracking is native — the model can revisit a prior node and take a different branch without losing the alternatives it already explored.

The key design moves:
1. **Thought decomposition** — break the problem into intermediate steps of appropriate granularity
2. **Thought generation** — from any node, sample multiple candidate continuations
3. **State evaluation** — score each thought for its promise toward the goal
4. **Search algorithm** — BFS or DFS over the tree of thoughts, with pruning

## Why It Matters for the Palace

The palace uses Tree of Thoughts as the architectural model for **Branch Exploration** in swarm sessions (see [[Palace Agent Infrastructure Spec]] §10.2).

The manual form: in a conversation with Claude, when context has been built to a moment of maximum useful density, Loudon "rewinds" to that point (using claude.ai's message editing) and explores a different direction. The second path shares everything up to the branch point and diverges cleanly, without contamination from the first path's noise.

The automated form: the coordinator saves a **checkpoint** at a moment of maximum context density, then dispatches multiple branch workers, each receiving identical history up to that point and diverging only in their specific directive. Each branch is a separate agent directory. No branch contaminates the others.

The coordinator's branch reconciliation task maps directly to Tree of Thoughts' evaluation step: not just collecting branch outputs, but assessing them against each other — looking for convergence (multiple branches reaching the same conclusion = high confidence), contradiction (incompatible conclusions = palace finding worth depositing as tension), and orthogonality (non-overlapping results = all worth keeping).

## The Deeper Structural Parallel

Tree of Thoughts formalizes something Loudon was already doing intuitively in long conversations: building up to a rich context state, then exploring multiple directions from that state without losing them to each other. The paper provides the formal vocabulary — nodes, edges, evaluation, search — that makes the practice buildable as infrastructure.

The Yao et al. insight that applies most directly to the palace: the *value* of a thought is not just what it contains but what it enables — how much solution space it opens. A checkpoint in a palace session is valuable not just for what the agent has found but for the paths it makes available to explore in parallel. The checkpoint is a high-value node in the thought tree. Branch dispatch is the multi-child generation step.

## Cross-Domain Resonance

**[[Swarm Weave]]** — the Swarm Weave's parallel worker architecture already resembles a breadth-first search over the palace's entry graph. Tree of Thoughts provides the formal model for why parallel exploration from a shared ancestor is more powerful than sequential exploration: you preserve the ancestor's information state exactly, without the drift that accumulates in sequential reasoning.

**[[Enchanted Worker]]** — an enchanted worker loaded with a specific neighborhood is an instantiated thought node: its context loading is the thought, and its work is the evaluation step. Multiple enchanted workers from the same checkpoint are multiple children of the same thought node.

**[[Generative Compression]]** — Generative Compression produces the documents that become high-value tree nodes: compressed context seeds positioned exactly at a moment of maximum useful density, ready to be branched from. The compressed document is a crafted ancestor node.

**[[BBS Blackboard]]** — the `BRANCHES` board channel is where branch workers post their results. The coordinator reads all branches from this channel and performs the reconciliation that Tree of Thoughts calls "evaluation" — but extended from single-model scoring to multi-agent cross-comparison.

## Forward Vectors

- The palace's branch exploration (§10.2 of the spec) uses BFS/parallel dispatch. Are there palace use cases that warrant DFS instead — following one branch deeply before exploring alternatives? Long-duration proof construction might benefit from DFS: pursue one inference chain to completion before branching.
- The Yao et al. paper focuses on single-model ToT within one context window. The palace extends this to multi-agent ToT across separate context windows sharing a common ancestor checkpoint. This extension is not in the paper and is a palace-native design move worth documenting as a distinct contribution.
- State evaluation in Tree of Thoughts is the hardest step — scoring intermediate thoughts for their promise. In the palace, this maps to the Coordinator's branch reconciliation. What makes a good branch reconciliation prompt? This is underspecced in the current architecture.

---

*"The intuition of ToT is to allow [the model] to explore multiple different reasoning paths and to self-evaluate choices to decide the next course of action."* — Yao et al., 2023

*"A checkpoint is a high-value node in the thought tree. Branch dispatch is the multi-child generation step."* — this conversation
