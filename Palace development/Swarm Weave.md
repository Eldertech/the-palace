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
activation_count: 4
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
  - target: "[[Hyperdimensional Prism]]"
    type: exemplifies
    label: weaving-as-projection
  - target: "[[Lateral Access]]"
    type: connects-to
    label: many-angles
  - target: "[[The Practice Rediscovers Its Philosophy]]"
    type: spawned
    label: oblique-lens-yield
  - target: "[[The Palace Hardens Around Values]]"
    type: connects-to
    label: merge-is-the-exhale
forward_vector: "I am the palace's colony architecture — the why and the shape of weaving as a swarm, now cut by many lenses at once. I keep the ideas the templates implement: the scaling constraint, the biological frame, and the two lessons of the first Multi-Lens run — that the cut and the mandate are one choice, and that the anti-lens (chance) finds what no principle can. I grow as the next lenses get built: the Bridge (technical↔philosophical) and the Deep-Structure cut."
---

# Swarm Weave

![[Swarm Weave — hero.png]]

> **This entry is the *why* and the *architecture*, not the operational manual.** Running the Weave as a swarm is now the [[Weave Ceremony]]'s default — that card owns the contract (steps, postconditions, the linters), and the executable prompts live in the swarm templates (`_ops/swarm/Single-Doc Worker Prompt Template.md`, `Coordinator Synthesis Template.md`) beside the deterministic helpers (`build-map-*.py`, `new-entry-catchup.py`, the `lint-*.py` scans, `face-audit.py`). This page carries the *ideas those implement* — the colony model, the coordinator's scaling constraint, the biological frame, and the frontier. When the *how* changes it changes there; read this for the shape, not the syntax.

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
templates' job (`worker-prompt-template.md`, `Coordinator Synthesis Template.md`).
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
step list is in `Coordinator Synthesis Template.md`.

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

## The Multi-Lens Weave

*This is where the per-entry model above evolves.* One worker per entry is wasteful — at average
degree ~16, each entry is read ~17 times (once as home, ~16 times as a neighbor) to produce the
*same* view. The deeper problem: an entry's connections are not a fixed set — **they depend on the
lens you read it in.**

Read [[Kuramoto Coupling]] inside the DSP family and it reaches for oscillators, phase, wavetables;
inside the philosophy family, for Spinoza, cooperation, synchronization-as-agency; inside a biology
family, for fireflies and [[Endosymbiosis]]. Same entry, three connection-sets — and their union is
its *true* profile, which no single partition draws out. This is the [[Hyperdimensional Prism]]
turned on weaving: an entry is a high-dimensional object, each lens a projection, and you reconstruct
it by taking **several projections**.

**Productive redundancy is the operating principle.** Re-reading an entry inside *different families*
is not waste — it is the point. A nexus entry (a hub, a bridge) earns its multiple readings, one per
family it belongs to. The Weave converts *accidental* redundancy (neighbor re-reads that add nothing)
into *purposeful* redundancy (multi-lens re-reads of the graph's genuine crossing-points).

**Different lenses do different jobs** — not the same task run twice:

- **Organizational lenses (the folders)** → coherence. The whole `Shop/` in one agent sees
  cross-specialist consistency a per-specialist worker structurally cannot (tier vocab, recipe
  coverage, roster gaps); `_ops/` audits the ceremony machinery *as a system*; `Projects/` sees
  curriculum scaffolding; `People/` checks citizen consistency and dialectic pairings.
- **Cross-cutting lenses (pillar, graph-community)** → connection. They cut *across* the folders,
  surfacing the cross-domain links the org-lens is blind to.
- **The `mirrors` / structural lens** → the gems. Grouping entries that rhyme across domains
  (Kuramoto + Endosymbiosis + [[Cooperation Yields Agency]]) surfaces the deepest cross-domain
  synthesis — the prize no organizational structure captures.

A partial lens catalogue: **folder** · **pillar** · **topological community** · **mirror/structural**
· **lifecycle** (the catch-up cohort) · **genealogy** (`emerged-from` lineage) · **warmth**
(co-activation — what's thought about together now). Each is dense *within* its grouping and blind
*across* it — which is exactly why you run several.

**Two signals fall out.** A connection that survives re-framing across lenses is **confidence** (the
old "two workers agree," raised to "it survives the re-frame"); a connection seen under *one* lens
only — especially the mirror lens — is a **surprise gem** a single-partition weave cannot produce,
having nothing to contrast against. So the coordinator's job upgrades from *de-dup the fragments* to
*read the graph through N lenses and report agreement (trust) vs single-lens sightings (surprise).*

**Cheaper and richer** — the tell of a right design: an org-coherence pass (~6 agents) + a
community-connection pass (~8, splitting the big communities) + a mirror gem-pass (~6) + an oblique
pass (~12) ran the first Multi-Lens Weave with ~32 agents over 301 entries — nexus entries
multiply-read *on purpose*. The tool it needs is built: `_ops/swarm/partition-palace.py` cuts the map
by a `--lens` parameter (folder · community · mirror · random), and the worker mandate lives in
`_ops/swarm/Multi-Lens Worker Prompt Template.md`. **First run: 2026-07-06 — idea → practiced.**

## The cut and the mandate are one choice

The deepest lesson of the first run: **a lens is not merely how you divide the palace — it decides
what is even visible, so it also decides the worker's job.** You can only maintain the properties a
projection makes legible. That splits every task into two pools by one test — *is cross-lens
redundancy signal or noise?*

- **Core tasks** (every worker, every lens): propose typed relations, catch unsung paths, flag
  entry-health drift. Their answers *differ by cut*, so running them everywhere and getting
  conflicting reports is the point — the coordinator adjudicates by palace values, and agreement
  across cuts is the confidence signal.
- **Segmentation-specific tasks** (grafted to one cut): coherence audit is *folder-only*; gem
  articulation is *mirror-only*; open-question cross-resolution, **merge**, and **compost** are
  *folder + community* (where co-located siblings make them answerable). Asking these off their
  native cut yields noise — or, for **merge on the mirror lens, active harm**: it would point the
  worker at the gems and tell it to destroy them. A mismatched mandate doesn't just waste; it fights
  what its lens exists to find.

Two jobs the multi-lens weave adds, both cluster-native: **open-question cross-resolution** (a
question carried in one entry is often already answered three entries over — the cluster is where
question and answer co-locate) and **merge/compost**, the palace's *exhale*. Deposits only ever
inhale; merge folds one entry into a subsection of another, compost lets a neighbourless one die.
Together they push sprawl down so weight accumulates as coherence, not clutter ([[The Palace Hardens
Around Values]]). One job is the coordinator's, not a worker's — **hub emergence** (who gets pointed
at from everywhere is a cross-worker read). And any worker may raise a rare **synthesis-spawn** — an
unnamed crossing that wants its own entry — which pushes sprawl *up*, held in deliberate tension with
merge.

## The oblique lens — the anti-lens

The lens catalogue — **folder · pillar · topological community · mirror/structural · lifecycle ·
genealogy · warmth** — shares one bias: each groups by *some* principle, so it can only confirm and
extend structure, never violate it. The genuinely new lens is **random / oblique**: a chance cover
with *no axis at all* — a Cage/Eno move ([[Oblique Portrait]], the `go oblique` Enrichment trigger).
It is the one cut that can put Spinoza next to a compressor and ask whether they rhyme — and when they
do, that rhyme has no home in any structured search. Its mandate is its own: hunt *only* the odd,
under a hard guard (a null is a valid answer; rate your surprise; never force a generic link), because
chance is noisy. Each entry lands in `--cover` distinct rooms (default 2): two lottery tickets, and a
surprise that survives *both* rooms is real, not an artifact.

## What the first oblique run taught — the next segmentations

The fruitful oblique pairs were not evenly spread. **~⅔ of the strong finds were a dry technical entry
meeting a philosopher or artist** — *one mind, two vocabularies*: the DSP library and the Source
Library were built in separate sessions with separate words, so every structured lens keeps them on
separate shelves while the same mind pressed the same patterns into both. Random is the only cut that
crosses *that* seam. (`assume multi-agent` = the Stoic dichotomy of control; [[Registry Pattern]] = wu
wei; [[BBS Blackboard]] = the striatum's reward trace — the tools were re-deriving the philosophy,
deposited as [[The Practice Rediscovers Its Philosophy]].) The waste is equally clear: ~40% of random
pairs fall *within* one dense cluster, where a structured lens already owns the rhyme. So the first run
names the lenses to prioritise next:

1. **The Bridge lens** — a deliberate bipartite cut pairing every tool/project entry with a
   person/philosophy entry. Mines the "one mind, two vocabularies" gold on purpose, none of the
   within-cluster waste. Highest priority.
2. **The Deep-Structure lens** — the oblique gold landed on ~8 recurring universal patterns
   (*scope-what-is-yours · the-boundary-is-the-finding · constraint-enables · fill-vs-honor-the-gap ·
   decouple-maker-from-critic · receptivity-is-authored · category-crosses-at-a-rate ·
   show-vs-hide-the-seam*). Tag entries by pattern and group by it — cross-domain by construction. The
   [[Hyperdimensional Prism]] turned from metaphor into an index.
3. **Stratified random** — keep the obliqueness, cut the noise: stratify the chance cover across
   communities so every room draws one entry per community. Same serendipity, ~40% less waste.

## Deploying the writes — disjoint files, one committer

A multi-lens weave surfaces far more than one mind can write. The write phase splits by *who is best
placed*: the coordinator applies the mechanical, deterministic edits directly; **authorship** (folds,
new deposits) goes to dispatched write-agents, **one per disjoint file-set so no two ever touch the
same file.** Agents *never commit* — they return drafts for review (the [[Concierge]] rule: review,
don't rubber-stamp); the coordinator makes the single commit with explicit pathspecs. Destructive
moves go through the composting protocol — mark, don't delete, so a cycle of reversibility stands
first. That partition-by-owning-file is what makes parallel writing safe: no branch thrash, no
collision, one legible LOG entry. The first run wrote through 5 authorship-agents + 3 scribes into a
single `Weave — 2026-07-06` commit.

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

- **What is the right worker scope?** Answered above (*The Multi-Lens Weave*): not one
  worker per entry but one per *neighborhood*, and the palace divided by *several* lenses
  at once so nexus entries are read in each family they belong to. What remains open is
  building the `partition-palace.py` that cuts the map multiple ways (a lens as a parameter)
  and first-running the lens-swarm — carried in this entry's baton.
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
