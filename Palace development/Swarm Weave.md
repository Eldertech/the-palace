---
title: Swarm Weave
type: project
status: active
pillars:
  - tools
  - practice
  - philosophy
born: 2026-03
stage: growing
last_activated: 2026-07
activation_count: 2
energy: very high
beauty: 9
links:
  - target: "[[Weave Ceremony]]"
    type: deepens
  - target: "[[Kuramoto Coupling]]"
    type: mirrors
  - target: "[[Mixture of Experts]]"
    type: mirrors
  - target: "[[Palace Ceremonies]]"
    type: enables
    label: replaces-single-agent
  - target: "[[Lateral Access]]"
    type: connects-to
  - target: "[[Metaphor as Coupling Medium]]"
    type: spawned
  - target: "[[Walk That Weaves]]"
    type: spawned
  - target: "[[Endosymbiosis]]"
    type: mirrors
  - target: "[[Palace Enchantment]]"
    type: spawned
  - target: "[[Palace Map]]"
    type: enables
  - target: "[[Deposit Ceremony]]"
    type: connects-to
  - target: "[[Spinoza Conatus]]"
    type: mirrors
    label: philosophical-ground
  - target: "[[Pages as Agents]]"
    type: deepens
    label: foundation
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: coordinated-on
  - target: "[[Hero and Avatar Maker]]"
    type: connects-to
    label: face-check-dispatch
forward_vector: "I am the palace's colony architecture — the why and the shape of weaving as a swarm. I hand the executable how to the [[Weave Ceremony]] card and the swarm templates, and keep the ideas they implement: the scaling constraint, the biological frame, the frontier. I grow as the pheromone-trail differentiation (Phase 2) gets built."
---

# Swarm Weave

![[Swarm Weave — hero.png]]

> **This entry is the *why* and the *architecture*, not the operational manual.** Running the Weave as a swarm is now the [[Weave Ceremony]]'s default — that card owns the contract (steps, postconditions, the linters), and the executable prompts live in the swarm templates (`_ops/swarm/worker-prompt-template.md`, `coordinator-synthesis-template.md`) beside the deterministic helpers (`build-map-*.py`, `new-entry-catchup.py`, the `lint-*.py` scans, `face-audit.py`). This page carries the *ideas those implement* — the colony model, the coordinator's scaling constraint, the biological frame, and the frontier. When the *how* changes it changes there; read this for the shape, not the syntax.

The [[Weave Ceremony]] has a structural ceiling. A single Claude instance reading
the full palace holds every entry in a shared context window — attention gets
distributed thinner and thinner as the palace deepens. At ~30 entries it is
already feeling pressure. At 80 entries it becomes a genuine liability: the
single weaver cannot hold the whole graph simultaneously without lossy
compression. The ceremony gets *worse* as the palace gets *better*.

The Swarm Weave replaces the single all-knowing weaver with a colony: many
lightweight workers, each responsible for deep attention on one entry and its
immediate neighborhood, reporting back to a coordinator who synthesizes,
de-duplicates, and presents to Loudon. No worker needs to hold the whole palace.
The colony's intelligence is distributed — which is exactly what the palace's
own philosophy has always described.

This is the [[Weave Ceremony]] reborn as what it always claimed to be: a
mycorrhizal network doing distributed routing work, not a census-taker arriving
from above.

---

## The Two Modes

The Swarm Weave has two distinct modes with different contexts and scopes.

### Mode 1 — Full Swarm Weave (Claude Code, required)

The complete replacement for the monthly [[Weave Ceremony]], run in Claude Code.
All palace entries are processed in parallel by worker sub-agents. A coordinator
sub-agent synthesizes all reports. Requires Claude Code for the API orchestration
layer and filesystem write access.

**When to run:** Monthly, in place of the single-agent Weave. Becomes the default
Weave once palace exceeds ~50 entries, or the single-agent Weave misses obvious
unsung paths on two consecutive cycles.

### Mode 2 — Palace Worker (single entry, on demand)

A lightweight single-worker run scoped to one entry and its immediate neighborhood.
No coordinator. No parallelism. Focused attention on one node in the graph,
producing unsung paths and new introductions proposals for Loudon's approval.

**When to run:** Any time focused attention on a single entry is warranted —
after a deposit, before a Weave, mid-project, when an entry feels underlinked,
when a new concept lands nearby and the neighborhood needs re-examining.

The invoker can be Loudon, the Swarm coordinator, or another worker that has
identified a neighbor worth deeper examination. Workers can spawn workers.
The tool doesn't know or care who called it — it receives an entry and does
its work.

---

## Architecture: the shape

*The exact worker prompt, coordinator synthesis steps, and output schema are the
templates' job (`worker-prompt-template.md`, `coordinator-synthesis-template.md`).
What follows is the architecture those encode — the ideas, not the syntax.*

### The Worker

Each worker is a single focused Claude call scoped to one entry and its immediate
neighborhood. It does **not** embody the entry — it is maintenance crew, not a
channeled voice: janitor, plumber, electrician, asking *"is this correct?"* not
*"is this alive?"* (that second question belongs to [[Palace Enchantment]]). Its
work is local, precise, and complete: it audits unsung paths, proposes a few
genuine new introductions, flags stale metadata, reads the entry's graffiti,
checks the forward vector, considers whether a newcomer born this cycle deserves
an inbound link from it (the new-entry catch-up), and checks whether the entry
merits a face. It never needs to hold the whole palace. The exact task list and
JSON output shape live in `worker-prompt-template.md`.

### The Coordinator

The coordinator's job is **dispatch and synthesis only** — it never reads entry
body content. This is the architectural constraint that makes the whole system
scale: if the coordinator loaded every entry to build worker contexts, it would
need to hold the entire palace in its context window before dispatching a single
worker, defeating the purpose entirely.

**Phase 1 — dispatch map (cheap, no API calls).** List the entries, parse
*frontmatter only* (the map builder does this), build a neighbor map, and dispatch
one worker per entry passing *paths, not content*. Workers do their own reading;
the coordinator never holds body content at any point.

**Phase 2 — synthesis (after all workers return).** The coordinator reasons from
the JSON reports alone, never re-reading files — de-duplicating reciprocal
proposals, surfacing incompatible link-type proposals for Loudon rather than
auto-resolving, spotting an entry flagged by three workers *not* assigned to it
(an under-powered hub wanting promotion), and assembling the discrete batches:
the graffiti action queue, the forward-vector batch, and the face-request batch.
It presents to Loudon in staged order — unsung paths first (near-zero
deliberation), then graffiti, then vectors, then new introductions. The granular
step list is in `coordinator-synthesis-template.md`.

**Context budget summary:**

| Agent | Reads | Context size |
|---|---|---|
| Coordinator | Frontmatter only (all entries) + worker reports | Small — ~30 × 30 lines + reports |
| Each worker | One entry body + neighbor bodies (self-fetched) | Small — 3–6 files |
| No agent | The full palace simultaneously | Never |

The coordinator is the merge coordinator in distributed version control: not
the smartest worker, but the function that makes the workers' intelligence
coherent. Its context budget goes to synthesis logic, not content storage.

### Parallelism

Workers run in parallel via `Promise.all()` in Node.js (Claude Code's native
environment). For a 30-entry palace: ~30 simultaneous API calls, each with a
small context. Total API time approaches the time of one worker call, not 30
sequential calls. This is the core performance gain — and the core reason the
architecture scales where the single-weaver cannot.

### Execution

Mode 1 runs the workers and coordinator as Claude Code sub-agents
(`Agent(subagent_type="Explore")`), dispatched in parallel from the orchestration
layer. Mode 2 (single entry) can run the same way, or — for a zero-API-cost pass —
via a local model with a pre-loaded prompt: `build-preloaded-prompt.py` embeds the
entry, its neighbors, and SCHEMA §4 directly into a prompt for `gemma4:26b` over
Ollama (serialized, no tool calls, no parallelism; validated for focused
single-entry work, not the full swarm). The current prompt scaffolds and helpers
are what these read; this page does not restate them.

---

## Philosophical Frame

The [[Mixture of Experts]] architecture is the closest technical analogue:
specialist workers handle what they are best positioned to see; a gating function
coordinates their outputs; no single expert needs to process everything. The
Swarm Weave is MoE applied to knowledge graph maintenance.

[[Kuramoto Coupling]] is the deeper mirror: each worker is an oscillator with
its own natural frequency (the particular conceptual character of its assigned
entry). The coordinator is the order parameter — not an oscillator itself, but
the emergent measure of collective coherence. When multiple workers independently
surface the same gap, synchrony has occurred. The critical coupling constant K
is the API call rate — high enough for coherence, low enough to preserve the
workers' independence.

The palace always claimed to be a mycorrhizal network. The Swarm Weave is the
first ceremony that actually *runs* that way rather than merely *describing* it.

The Swarm Weave is not an Enchantment ceremony. A palace worker does not
inhabit its assigned entry, channel its perspective, or ask what it desires.
Workers are maintenance agents — they inspect entries against the schema and
flag deviations. They ask: *is this correct?* [[Palace Enchantment]] — a
distinct ceremony building on this foundation — asks: *is this alive?* A
structurally sound palace is the substrate that makes meaningful enchantment
possible. The Weave comes first.

---

## What Comes Next — Enchantment

Once the Swarm Weave is producing clean forward vector proposals, the palace has
the structural foundation for a qualitatively different kind of ceremony:
[[Palace Enchantment]]. Where the Swarm Weave asks *"is this correct?"*,
Enchantment asks *"is this alive?"* — agents that inhabit pages, follow their
forward vectors, and propose what would increase each page's power to act.

The forward vectors the Swarm Weave produces are Enchantment's raw material.
The structural integrity the Swarm Weave maintains is the substrate Enchantment
needs. The Swarm Weave is the maintenance crew. Enchantment is the life it
enables.

---

## Phase 2: Pheromone Trails and Worker Differentiation

*This section describes work that begins only after the basic swarm is running and
producing clean output. Do not build Phase 2 until Phase 1 is ceremony-ified.*

Once the swarm is functioning, it will begin to know things that no single prior
agent has known: which entries consistently generate conflicting worker reports,
which produce unusually rich new introductions, which hub nodes keep appearing
in reports from workers not assigned to them, which entries yield thin output
cycle after cycle. This knowledge belongs in the palace — not as human annotation,
but as trails written by the swarm itself.

### The Pheromone Trail

After each Swarm Weave cycle, the coordinator writes a `worker_trace` block back
to entries where something notable happened:

```yaml
worker_trace:
  last_weave: 2026-04
  finding: "Three independent workers flagged connection to Physical Modeling Synthesis"
  status: unresolved
  signal_strength: high
```

On the next cycle, the worker assigned to that entry reads this trace before it
begins. A high-strength unresolved trace means: look here first. A resolved trace
clears itself. No worker needs to remember what the previous swarm found — the
memory lives in the entry itself. This is stigmergy in the exact biological sense:
the environment carries marks left by prior agents, and those marks shape the
behavior of future agents.

### Worker Differentiation (Epigenetics)

As traces accumulate over multiple cycles, the coordinator can begin writing
`worker_profile` blocks — not as human pre-annotation, but as swarm-derived
instruction:

```yaml
worker_profile:
  depth: deep
  scope: pillar
  note: "Cross-pillar hub — three prior cycles produced conflicting link-type proposals. Prioritize disambiguation over new introductions."
```

This profile is written *by the coordinator* based on observed swarm behavior,
not declared in advance by any single agent. An entry earns its profile by
demonstrating complexity. The differentiation is emergent, not imposed.

All workers are the same base model — the same genome. What differs is the local
signal environment they receive: the assigned entry, its neighbors, and whatever
traces prior cycles have left in the frontmatter. This is the epigenetics model:
same DNA, different expression, shaped by local environment.

### The Biological Parallels, Made Precise

**Ant colony stigmergy** — pheromone concentration on a trail reflects how many
ants have found it useful. High-signal entries in the palace attract deeper worker
attention in future cycles because prior cycles left strong traces. Low-signal
entries get lighter treatment — the trail fades.

**Developmental biology / morphogen gradients** — a stem cell's fate is determined
by what it reads in its local chemical environment, not by central instruction.
Workers read their local environment (entry + neighbors + traces) and express
different behavior accordingly.

**LangGraph routing** — in agent graph frameworks, nodes route themselves into
different behavioral branches based on local state. The `worker_profile` is the
state. The worker reads it and routes: deep analysis vs. shallow metadata check,
local scope vs. pillar-wide search.

**Kuramoto threshold** — entries below a certain `activation_count` or `energy`
get a minimal worker automatically, without needing an explicit profile. The
coupling is below threshold; don't attempt synchrony. This can be derived from
existing frontmatter fields — the pheromone concentration is already in the page,
if you know how to read it.

### What the Swarm Should Never Do

No single pre-pass should annotate `worker_profile` across all entries before the
swarm runs. That reintroduces the centralized queen. The differentiation earns
itself through cycles. The trail is written by the colony's accumulated experience,
not declared by any prior agent who thought they knew in advance which entries were
complex. They didn't. The swarm will find out.

---

## Forward Vectors

- **What is the right worker scope?** One worker per entry is the cleanest model.
  An alternative is one worker per *cluster* (entries sharing a pillar or a hub
  node). Clusters might produce richer new introductions but require a clustering
  step before worker dispatch.
- **How should the coordinator handle disagreement between workers?** If worker A
  proposes A→B as `mirrors` and worker B proposes B→A as `deepens`, present both
  to Loudon with the rationale — do not auto-resolve.
- **Rate limits:** The Anthropic API rate-limits by tokens per minute. A 30-worker
  swarm with medium-context entries may hit limits. Build in backoff/retry from
  the start.
- **When does the Palace Worker become the default post-deposit step?** It has
  been added to the [[Deposit Ceremony]] as Step 7.5. The question becomes: when
  is it built and tested enough to be non-optional?
- **Should the coordinator produce a diff against the previous Weave's topology
  report?** Tracking what changed cycle-to-cycle would reveal the palace's growth
  arc over time.
- **Resource pooling across enchanted agents:** When multiple enchanted pages
  independently request similar tools — search over the same corpus, shared
  codebases for related projects — can the coordinator identify and surface
  these overlaps before dispatching? A synthesizer project page and a DSP spec
  page both reaching for physical modeling code are proposing a commons neither
  named explicitly. The coordinator that spots this produces not just an
  allocation decision but a mutualism proposal. What would the coordinator
  need to see in worker resource requests to detect pooling opportunities?

---

*"The colony doesn't know what it's building. It just follows the gradient."*
— attributed to myrmecology, repeated everywhere

*"No man ever steps in the same river twice, for it's not the same river and
he's not the same man."* — Heraclitus

*"Form follows function — that has been misunderstood. Form and function should
be one, joined in a spiritual union."* — Frank Lloyd Wright
