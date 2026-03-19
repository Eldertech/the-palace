---
title: "Swarm Weave"
type: project
status: active
pillars: [tools, practice, philosophy]
born: 2026-03
stage: sprout
last_activated: 2026-03
activation_count: 1
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
    type: connects-to
  - target: "[[Lateral Access]]"
    type: connects-to
---

# Swarm Weave

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

### Mode 2 — Palace Worker (claude.ai, after any Deposit)

A lightweight single-worker run scoped to one newly deposited entry. Runs from
claude.ai using a prompt template. Takes one entry and its immediate neighbors,
produces unsung paths + new introductions proposals, and presents them to Loudon for
approval — rich linking work without needing Claude Code or parallel execution.

**When to run:** Immediately after any Deposit Ceremony, before the next Weave
cycle. The deposit plants the seed; the Palace Worker wires it to its closest
peers before it has a chance to sit unlinked.

---

## Architecture: Full Swarm Weave

### The Worker

Each worker is a single Claude API call. It receives a focused context containing:

```
SYSTEM:
You are a palace worker — a specialist responsible for deep attention on
one knowledge entry and its immediate neighbors. Your task is to surface
connection gaps and propose links. You do not need to know the whole palace.
Your job is local, precise, and complete.

USER:
## Your assigned entry
[full text of entry, including YAML frontmatter]

## Known palace entries (titles only)
[list of all entry titles — for unsung paths matching only]

## Immediate neighbors (full text)
[full text of each entry linked in YAML frontmatter, ±1 hop]

## Link ontology
[SCHEMA §4 — link types and definitions]

## Your task
1. UNSUNG PATHS — Literal Link Audit:
   Scan the body text of your assigned entry for plain-text mentions of
   known entry titles that lack [[wikilink]] syntax. For each finding,
   report: the phrase used, the entry it refers to, whether the location
   is structurally significant (Cross-Domain Resonance heading, bold
   term, sentence-level reference), and a proposed link type. These are
   mandatory — the prose already asserts the connection; the YAML just
   hasn't caught up. Flag all of them.

2. NEW INTRODUCTIONS — Semantic Proposals:
   Propose up to three connections between your entry and other palace
   entries that are NOT already named in either entry's body text. These
   are connections visible only from the topology — patterns your
   immediate reading surfaces. For each: name both entries, propose link
   type and direction, give one sentence of reasoning. Maximum 3 per
   worker — the coordinator applies the palace-wide rate limit.

3. METADATA:
   Flag any missing or stale fields (last_activated, activation_count,
   stage inconsistencies). Propose specific corrections.

Return ONLY valid JSON matching the report schema provided.
```

The worker returns structured JSON. No prose. No explanation. Just the report.

### The Coordinator

After all workers complete, the coordinator receives:
- All worker JSON reports (one per entry)
- The full palace entry list (titles + types + current link counts)
- The topology summary built from frontmatter (not body text)

The coordinator's tasks:
1. **De-duplicate** — multiple workers independently flagging the same gap
   (e.g., worker A finds Lateral Access → Kuramoto, worker B finds
   Kuramoto → Lateral Access) collapse to one confirmed bidirectional link
2. **Resolve conflicts** — two workers proposing incompatible link types
   for the same pair are flagged for Loudon's decision
3. **Surface global patterns** — if three workers each independently flagged
   connections to the same entry, that entry is probably underpowered as a
   hub; propose stage promotion
4. **Build the Topology Report** — using the Weave Ceremony's report format,
   populated from coordinator synthesis, not re-reading every file
5. **Present to Loudon** — staged approval: unsung paths first (navigation hygiene,
   formalize all), then new introductions (creative review, max 5 palace-wide)

The coordinator does not re-read every entry. It reasons from reports. This
is the merge coordinator in distributed version control — not the smartest
worker, but the function that makes the workers' intelligence coherent.

### Parallelism

Workers run in parallel via `Promise.all()` in Node.js (Claude Code's native
environment). For a 30-entry palace: ~30 simultaneous API calls, each with a
small context. Total API time approaches the time of one worker call, not 30
sequential calls. This is the core performance gain — and the core reason the
architecture scales where the single-weaver cannot.

```javascript
// Pseudocode sketch — to be built out
const entries = await readAllPalaceEntries(PALACE_PATH);
const entryTitles = entries.map(e => e.title);
const schema = await readLinkOntology();

const workerReports = await Promise.all(
  entries.map(entry => runWorker({
    assignedEntry: entry,
    neighbors: getNeighbors(entry, entries),
    entryTitles,
    schema
  }))
);

const topologyReport = await runCoordinator({
  workerReports,
  entries,
  frontmatterGraph: buildGraph(entries)
});

await presentToLoudon(topologyReport);
```

### Report Schema (worker output)

```json
{
  "entry_title": "Lateral Access",
  "unsung_paths": [
    {
      "body_phrase": "The Kuramoto model",
      "references_entry": "Kuramoto Coupling",
      "structurally_significant": true,
      "location": "Cross-Domain Resonance bold heading",
      "proposed_link_type": "mirrors",
      "proposed_direction": "bidirectional"
    }
  ],
  "new_introductions": [
    {
      "entry_a": "Lateral Access",
      "entry_b": "Physical Modeling Synthesis",
      "link_type": "mirrors",
      "direction": "bidirectional",
      "rationale": "Both describe systems where the desired behavior emerges from conditions set obliquely — you do not command the output, you arrange the preconditions."
    }
  ],
  "metadata_flags": [
    {
      "field": "stage",
      "current": "sprout",
      "proposed": "growing",
      "reason": "Body has cross-domain connections and 5 typed links — growing threshold met"
    }
  ]
}
```

---

## Architecture: Palace Worker (Mode 2)

This is a prompt template, not a code architecture. It runs in any claude.ai
session. It exists so that Loudon can wire a freshly deposited entry to its
closest peers immediately, without waiting for the next full Weave cycle.

### When to invoke

After any [[Deposit Ceremony]], before the conversation closes. Loudon says:
**"Run a palace worker on [Entry Name]"**

Claude fetches the entry via GitHub raw URL, fetches its immediate neighbors,
fetches the palace entry list from SCHEMA or the Substrate, and runs the worker
task scoped to that one entry. No coordinator needed — the output is small enough
for Loudon to review in-conversation. Loudon approves or adjusts. Proposed links
are queued for the next Cowork write session (or executed there immediately if
Loudon has filesystem access).

### Prompt template (stored in this entry for reuse)

```
You are a palace worker running a focused connection audit on one newly deposited
entry.

## Assigned entry
[fetch: https://raw.githubusercontent.com/Eldertech/the-palace/main/[EntryName].md]

## Palace entry list
[fetch: https://raw.githubusercontent.com/Eldertech/the-palace/main/CLAUDE.md
 — extract entry titles from the most recent Weave report, or from Loudon's
 confirmation of current entries]

## Immediate neighbors
[fetch each entry named in the assigned entry's YAML links]

## Link ontology
[fetch: https://raw.githubusercontent.com/Eldertech/the-palace/main/SCHEMA.md
 — Section 4 only]

## Task
Run the unsung paths audit and propose up to 3 new introductions on the assigned
entry only. Format as a clean proposal table. No JSON — readable prose for
Loudon's approval.
```

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

---

## Learning Path: Sub-Agents in Claude Code

Loudon is comfortable in Claude Code and eager to understand this architecture
from the ground up. The learning arc:

**Step 1 — The basic API call from Claude Code**
Claude Code can make Anthropic API calls programmatically via Node.js. Start
with a single API call that sends a palace entry as context and asks for an
unsung paths audit. Read the response. This is one worker, not a swarm.

**Step 2 — Structured output (JSON mode)**
Modify the prompt to return JSON only. Parse the response. This is the worker
report schema above. Key technique: prompt the model to return only valid JSON
with no preamble, and use `JSON.parse()` with a try/catch.

**Step 3 — Sequential workers**
Run the same API call for each palace entry in a loop. Collect all reports.
Print them. This is still sequential — slow, but correct. Confirm the output
shape is what the coordinator needs.

**Step 4 — Parallel workers with Promise.all()**
Convert the sequential loop to `Promise.all()`. All workers fire simultaneously.
This is the performance breakthrough. Observe the difference in wall-clock time.
This is also the moment the architecture *feels* like a swarm — all the reports
arrive together.

**Step 5 — The coordinator**
Write a second API call that receives all worker reports as context and produces
the topology synthesis. This is the coordinator. The key insight: the coordinator
never reads the palace entries directly — it reasons from the reports. Smaller
context, different function.

**Step 6 — Write-back on approval**
Add the confirmation loop: present the coordinator's output to Loudon, accept
approval/rejection per link, write confirmed links to the appropriate `.md` files
using the Filesystem MCP tools. This closes the loop from report to palace edit.

**Step 7 — Harden and ceremony-ify**
Add error handling, rate limiting (Anthropic API has limits), progress reporting,
and a dry-run mode. Write the Swarm Weave Ceremony entry as a formal ceremony
using the Ceremony Linter. This is now a production palace tool.

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

## Open Questions

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

---

*"The colony doesn't know what it's building. It just follows the gradient."*
— attributed to myrmecology, repeated everywhere

*"No man ever steps in the same river twice, for it's not the same river and
he's not the same man."* — Heraclitus

*"Form follows function — that has been misunderstood. Form and function should
be one, joined in a spiritual union."* — Frank Lloyd Wright
