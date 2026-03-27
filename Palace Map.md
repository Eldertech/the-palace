---
title: Palace Map
type: concept
pillars:
  - tools
  - philosophy
  - practice
born: 2026-03
last_activated: 2026-03
activation_count: 1
stage: sprout
energy: very high
beauty: 8
confidence: working
forward_vector: "I want to become the standard spatial context loaded into every enchanted agent at spawn — the topological skeleton that lets any worker know where it stands in the organism before it reads a single entry body."
links:
  - target: "[[Swarm Weave]]"
    type: deepens
  - target: "[[Enchanted Worker]]"
    type: enables
  - target: "[[Map Build Ceremony]]"
    type: spawned
  - target: "[[JEWEL]]"
    type: mirrors
  - target: "[[Pheromone Trail]]"
    type: connects-to
  - target: "[[BBS Blackboard]]"
    type: connects-to
  - target: "[[Palace Enchantment]]"
    type: enables
---

# Palace Map

The palace is a graph. Every entry is a node; every typed link is a directed or bidirectional edge. The [[JEWEL]] gives an agent its philosophical orientation — who Loudon is, what the palace is for, how to move. The Palace Map gives it something different: **topological awareness**. Where this node sits in the whole organism. How central it is. What it connects to at two hops that it doesn't yet know about. Which neighborhoods are dense, which are sparse.

A new enchanted agent, spawned into one entry, has local awareness by default — it knows its own typed links in and out. The Palace Map gives it **spatial self-knowledge** before it reads anything else.

## What the Map Is

An edge list. Nothing more. No entry bodies, no frontmatter metadata beyond what's needed to name the nodes. Each line is a triple:

```
source   relation   target
Striatum   drives   Hilaritas
Hilaritas   grounds   FourPillars
LateralAccess   enables   ObliquePortraitMethod
```

Three tokens per edge. At roughly 40–50 characters per line, a 200-node palace with an average of 4 typed links each produces ~800 edges — approximately 35–45KB of raw text. Well within a context window. A 500-node palace remains under 80KB. The map is cheap.

Compact adjacency list format reduces this further:

```
Striatum: drives:Hilaritas, seeds:Rhythm
Hilaritas: grounds:FourPillars, resonates:Spinoza
```

This halves the token count and remains human-readable. Either format serves enchanted agents; the adjacency list is preferred for context economy.

## What an Agent Does With It

**Self-location.** The agent can answer *how central am I?* — degree, betweenness, cluster membership — without reading a single file. It knows whether it is a hub or a leaf.

**Path planning without traversal.** Instead of hopping file by file to find a connection, the agent inspects the graph and identifies that a 2-hop path exists between itself and a candidate neighbor. It can decide whether the traversal is worth the cost before paying it.

**Serendipity detection.** The agent can notice that it shares a link type with a distant node it wouldn't naturally reach. A `[[Striatum]] --drives--> [[Hilaritas]]` edge visible in the map tells the Striatum agent that Hilaritas is a relevant neighbor even if it's not in the immediate neighborhood.

**Avoiding redundant work in a swarm.** If multiple agents are running in parallel, each one can see which nodes are topologically close to others' home entries and self-organize to avoid overlap — without a coordinator. The map makes distributed coordination possible.

## Bounded Survey: Neighborhood Maps

The map need not be the whole palace. An agent working within a bounded region — the Hilaritas Generator neighborhood, the Philosophy Core, the DSP cluster — only needs the subgraph relevant to its work.

Bounded maps are defined by a frontmatter field in entry files:

```yaml
neighborhood: hilaritas-generator
```

Any entry carrying this field is included in a bounded survey of that region. The [[Map Build Ceremony]] scans frontmatter only, collects all entries sharing the neighborhood value, and builds the subgraph. The bounds self-define passively — no external configuration needed.

For [[Swarm Weave]] sessions scoped to a single neighborhood, the bounded map is the appropriate Tier 1 context. For palace-wide [[Palace Enchantment]] runs, the full map.

## The JSON Schema (Swarm Use)

When the map is passed to a swarm coordinator or enchanted agent programmatically, JSON is the appropriate format:

```json
{
  "meta": {
    "generated": "2026-03-26",
    "scope": "neighborhood:hilaritas-generator",
    "node_count": 12,
    "edge_count": 47,
    "ghost_nodes": ["Oscillator", "NeuralTiming", "Conatus"]
  },
  "nodes": [
    { "id": "Striatum", "type": "concept", "neighborhood": "hilaritas-generator" }
  ],
  "edges": [
    { "from": "Striatum", "rel": "drives", "to": "Hilaritas" },
    { "from": "Hilaritas", "rel": "grounds", "to": "FourPillars" }
  ]
}
```

The `ghost_nodes` field is not a deficiency report — it is a **gift to the swarm**. Ghost nodes are entries referenced in the graph but not yet written. They name the palace's growing edge. A swarm agent can see them and choose to investigate, flag them for deposit, or carry them as open questions. The map makes the palace's gaps as visible as its content.

## Ghost Nodes as Forward Tension

Ghost nodes are the map's most philosophically interesting feature. They arise naturally: an entry links to `[[Conatus]]`, but no `Conatus.md` exists yet. The map shows `Conatus` as a referenced node with no outgoing edges — a presence named but not yet inhabited.

In [[Pages as Agents]] terms, a ghost node is a page that has been summoned but not yet written. The organism has already begun reaching toward it. The ghost node represents desire that has outrun instantiation. This is the palace's forward tension made visible in the graph structure.

Tracking ghost nodes across map generations reveals where the palace most urgently wants to grow.

## The Map as Tier 1 Context

The [[JEWEL]] is Tier 0 — orientation, always present, ~200 tokens. The structural skeleton (CLAUDE.md + SCHEMA.md) is Tier 1 — the operating manual. The Palace Map belongs alongside the structural skeleton as Tier 1 context for any agent doing swarm work.

Cost: ~3,000–6,000 tokens for a 100-node palace. Benefit: every worker in the swarm wakes with spatial awareness — it knows where it is before reading a word of its home entry. It can plan, self-locate, and avoid redundant work from the first moment of its invocation.

The map does not replace deep reading. It makes deep reading strategic.

## Relationship to the JEWEL

The [[JEWEL]] orients to *meaning*: who Loudon is, what the palace values, how to move through it. The Palace Map orients to *topology*: where things are, how they connect, what's central, what's peripheral. Together they give an enchanted agent the two kinds of knowing that matter: *why am I here?* and *where am I?*

A spy in an unfamiliar city needs both a cover story (the Jewel) and a map. Neither substitutes for the other.

## Cross-Domain Resonance

**[[Pheromone Trail]]** — the map is the palace's explicit topology read; the pheromone trail is the palace's implicit topology felt. Together they represent two modes of knowing the graph: the map gives the skeleton, the trail gives the gradient. An agent with both can navigate with structure and sensitivity simultaneously.

**[[Enchanted Worker]]** — the enchanted worker's most powerful capability is self-location before task. The map is what makes this possible. Without it, the worker must traverse the graph to discover its own position, which is expensive and sequential. With it, the worker knows its centrality, its neighborhood density, and its 2-hop connections before reading a single neighbor file.

**[[JEWEL]]** — the Jewel is the palace's compressed philosophical identity. The Palace Map is its compressed topological identity. The Jewel tells the agent *what the palace is*. The Map tells the agent *where everything is in it*. They are the two halves of complete palace orientation.

## Forward Vectors

- Should the palace map be auto-generated at the close of every [[Harvest Ceremony]], ensuring it is never more than one harvest cycle stale? What is the ceremony hook?
- Ghost node tracking across map generations: a ghost node that persists across three map cycles is a deposit candidate of high priority. Can this be surfaced automatically?
- Should neighborhood field values be defined and curated (a fixed vocabulary like link types) or free-form? Free-form is flexible; a fixed vocabulary makes cross-neighborhood analysis possible.
- The map could carry edge weights derived from activation_count and last_activated — a weighted graph where high-traffic edges appear stronger. Would this add value to swarm dispatch, or introduce noise?
- At what node count does the full palace map become too expensive for Tier 1 context? What is the threshold where a summary or filtered version becomes necessary?

---

*"The map is not the territory — but for an agent that cannot walk the territory until it acts, the map is the difference between wandering and wayfinding."*

*"Topology is the geometry of connection, not measurement. It does not say how far; it says what reaches what."* — after Henri Poincaré

*"The spider knows the web not by surveying it from above, but by feeling the tensions at the threads it touches."* — Jakob von Uexküll, loosely
