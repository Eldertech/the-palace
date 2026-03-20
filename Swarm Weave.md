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
  - target: "[[Metaphor as Coupling Medium]]"
    type: spawned
  - target: "[[Walk That Weaves]]"
    type: spawned
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

The coordinator's job is **dispatch and synthesis only** — it never reads entry
body content. This is the architectural constraint that makes the whole system
scale: if the coordinator loaded every entry to build worker contexts, it would
need to hold the entire palace in its context window before dispatching a single
worker, defeating the purpose entirely.

What the coordinator actually does:

**Phase 1 — Dispatch map (cheap, no API calls)**
1. List all `.md` files in the palace root (`fs.readdirSync` — essentially free)
2. Parse **frontmatter only** from each file (YAML headers, ~20–40 lines per
   entry — tiny). This gives the full title list and each entry's link targets.
3. Build a neighbor map: for each entry, which entries does its frontmatter link
   to? This is the dispatch payload — paths, not content.
4. Dispatch one worker per entry, passing only:
   - The **path** to the assigned entry
   - The **paths** to its immediate neighbors (from frontmatter)
   - The flat **list of all entry titles** (strings only — for unsung paths matching)
   - The **path** to SCHEMA (worker reads Section 4 itself)

Workers receive paths. Workers do their own reading. The coordinator never
holds body content at any point.

**Phase 2 — Synthesis (after all workers return)**

The coordinator receives all worker JSON reports and:
1. **De-duplicates** — worker A flags Lateral Access → Kuramoto, worker B
   flags Kuramoto → Lateral Access: collapse to one confirmed bidirectional link
2. **Resolves conflicts** — two workers proposing incompatible link types for
   the same pair are surfaced for Loudon's decision, not auto-resolved
3. **Surfaces global patterns** — an entry independently flagged by three
   workers who weren't assigned to it is probably an underpowered hub;
   propose stage promotion
4. **Builds the Topology Report** from worker reports alone — never re-reads
   palace files at this stage
5. **Presents to Loudon** — staged approval: unsung paths first (near-zero
   deliberation, formalize all), then new introductions (creative review)

The coordinator is the merge coordinator in distributed version control: not
the smartest worker, but the function that makes the workers' intelligence
coherent. Its context budget goes to synthesis logic, not content storage.

**Context budget summary:**

| Agent | Reads | Context size |
|---|---|---|
| Coordinator | Frontmatter only (all entries) + worker reports | Small — ~30 × 30 lines + reports |
| Each worker | One entry body + neighbor bodies (self-fetched) | Small — 3–6 files |
| No agent | The full palace simultaneously | Never |

### Parallelism

Workers run in parallel via `Promise.all()` in Node.js (Claude Code's native
environment). For a 30-entry palace: ~30 simultaneous API calls, each with a
small context. Total API time approaches the time of one worker call, not 30
sequential calls. This is the core performance gain — and the core reason the
architecture scales where the single-weaver cannot.

```javascript
// Pseudocode sketch — to be built out in Claude Code
// KEY PRINCIPLE: coordinator reads frontmatter only, passes paths to workers.
// Workers are autonomous readers — they fetch their own content.

const PALACE_PATH = '/Users/loudonstearns/.../The Palace';

// --- COORDINATOR PHASE 1: Dispatch map (no API calls, no body reads) ---

// 1. List all entries (free — just filesystem)
const files = fs.readdirSync(PALACE_PATH).filter(f => f.endsWith('.md'));

// 2. Parse frontmatter only from each file (cheap — YAML headers only)
const frontmatters = files.map(f => ({
  path: path.join(PALACE_PATH, f),
  title: parseFrontmatterTitle(f),        // read first ~40 lines only
  linkTargets: parseFrontmatterLinks(f)   // extract [[targets]] from YAML
}));

const entryTitles = frontmatters.map(e => e.title);
const schemaPath = path.join(PALACE_PATH, 'SCHEMA.md');

// 3. Build neighbor map and dispatch workers in parallel
//    Workers receive PATHS, not content. Workers read themselves.
const workerReports = await Promise.all(
  frontmatters.map(entry => runWorker({
    assignedEntryPath: entry.path,
    neighborPaths: resolveNeighborPaths(entry.linkTargets, frontmatters),
    entryTitles,       // strings only — for unsung paths title matching
    schemaPath         // worker reads Section 4 itself
  }))
);

// --- COORDINATOR PHASE 2: Synthesis (reasons from reports, no re-reads) ---

const topologyReport = await runCoordinator({
  workerReports,
  entryTitles,
  frontmatters         // titles + link counts only — already parsed above
});

await presentToLoudon(topologyReport);

// --- WORKER (runs as sub-agent or API call) ---
// Receives paths, reads its own files, returns JSON report.
// Never needs to know about any entry it wasn't given.
async function runWorker({ assignedEntryPath, neighborPaths, entryTitles, schemaPath }) {
  const assignedEntry = fs.readFileSync(assignedEntryPath, 'utf8');  // full body
  const neighbors     = neighborPaths.map(p => fs.readFileSync(p, 'utf8'));
  const schema        = extractSection4(fs.readFileSync(schemaPath, 'utf8'));

  // Send to Claude API with focused context — returns structured JSON
  return callClaudeAPI({ assignedEntry, neighbors, entryTitles, schema });
}
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

A focused, on-demand tool. One entry, its immediate neighborhood, one worker.
No coordinator. No parallelism. Output small enough to review and approve in a
single session. Confirmed links written immediately via filesystem.

All palace work runs from Claude Code with direct filesystem access. GitHub raw
URLs are not used for any Weave operation — they read last-committed state rather
than live files, and introduce network dependency where none is needed. If a
claude.ai-based worker template is ever needed in future, it can be added then.
For now: filesystem only.

### When to invoke

**"Run a palace worker on [Entry Name]"** — invoked by Loudon, by the
coordinator, or by another worker that has flagged a neighbor as needing
deeper attention. No assumed context. Any entry, any time, any invoker.

The worker's capabilities will grow over time (formatting fixes, metadata
normalization, deeper link audits) but its scope stays local: one entry and
its neighborhood per run. The worker does not need to know who called it.

Current capabilities:
- Unsung paths audit (body-text mentions not yet in YAML)
- New introductions (up to 3 semantic proposals)
- Metadata flags (missing or stale fields)

### Prompt template

```
You are a palace worker running a focused connection audit on one palace entry.
You have filesystem access. Read files directly.

PALACE_PATH = /Users/loudonstearns/Library/CloudStorage/GoogleDrive-loudon@gmail.com/My Drive/The Palace

## Your tasks
1. Read the assigned entry: [PALACE_PATH]/[EntryName].md
2. Parse its YAML frontmatter links to identify immediate neighbors
3. Read each neighbor file from the filesystem
4. Read SCHEMA.md — Section 4 only (link ontology)
5. List all .md filenames in PALACE_PATH — these are your known entry titles
   for unsung paths matching (filenames only, no body reads)

## Run the worker task
[paste the worker task block from the Full Swarm Weave system prompt above]

Output as a readable proposal table for Loudon's approval, not JSON.
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
from the ground up. The learning arc builds in two phases: first use Claude
Code's native agents feature to develop intuition and test the concept on a
real palace neighborhood; then rebuild the same logic using the Anthropic SDK
and Node.js for production use.

---

### Phase A — Claude Code Agents (no SDK, no Node.js required)

*Goal: develop real intuition about sub-agent spawning, context scoping, and
coordinator synthesis before writing any orchestration code. Use real palace
data from the start — the Hilaritas Generator neighborhood is the test bed.*

**Step A1 — Spawn a single sub-agent manually**
In Claude Code, use the Task tool (or `/agents` command) to spawn one sub-agent.
Give it a single palace entry — `Hilaritas Generator.md` — and ask it to run
the unsung paths audit only. Read what it returns. Understand the boundary:
what did it see, what didn't it see, what did it need that you didn't give it.

This is the most important step in the whole learning arc. The question
*"what does a worker actually need in its context?"* is answered here
experimentally, not theoretically.

**Step A2 — Scope the neighborhood**
The Hilaritas Generator neighborhood is the test bed: `Hilaritas Generator.md`
plus all entries it links to directly. Identify these from frontmatter before
you begin — this is the coordinator's frontmatter-only parse, done manually.
Note how cheap this step is: you're reading 20–40 lines per file, not bodies.

**Step A3 — Spawn one worker per neighborhood entry**
Spawn a separate sub-agent for each entry in the neighborhood. Give each one:
- Its assigned entry (full text, fetched by the sub-agent or passed directly)
- The neighbor paths (the other entries in the neighborhood)
- The flat title list
- SCHEMA Section 4

Do this sequentially first — spawn, wait, read the report, then spawn the next.
Confirm that each worker returns a clean JSON report. Fix prompt and scope issues
before attempting parallelism.

**Step A4 — Spawn all workers simultaneously**
Spawn all neighborhood workers at once. Observe what arrives. This is the first
moment the architecture feels like a swarm rather than a loop. Note:
- Do the reports conflict? (Expected — this is useful data)
- Does any worker return malformed JSON? (Fix the prompt)
- Does the Hilaritas Generator worker find things the others don't? (It should)

**Step A5 — Coordinate manually**
Take all the worker reports and feed them to a fresh Claude Code conversation
as the coordinator context. Ask it to de-duplicate, flag conflicts, surface
global patterns, and produce a topology report for the Hilaritas Generator
neighborhood. Review the output with Loudon's eyes. This is the first real
Swarm Weave result — small scope, but fully functional.

**Step A6 — Validate and write back**
Approve or reject the coordinator's proposals. Write confirmed links to the
actual palace entries. This closes the loop: workers found, coordinator
synthesized, Loudon approved, palace updated. The full ceremony, manually
orchestrated, on six entries.

*When Step A6 feels natural and the outputs are trustworthy, proceed to Phase B.
Do not begin Phase B until the neighborhood swarm is producing clean results.*

---

### Phase B — SDK and Node.js (production architecture)

*Goal: automate what Phase A did manually, with parallelism, error handling,
and write-back. The architecture is already understood — Phase B is engineering.*

**Step B1 — The basic API call from Claude Code**
Claude Code can make Anthropic API calls programmatically via Node.js. Reproduce
the single worker from Step A1 as a Node.js function. Read the response. Confirm
the output shape matches the report schema above.

**Step B2 — Structured output (JSON mode)**
Modify the prompt to return JSON only. Parse with `JSON.parse()` in a try/catch.
This is the worker report schema — the same shape you validated manually in
Phase A, now enforced programmatically.

**Step B3 — Frontmatter-only coordinator parse**
Write the coordinator's dispatch map logic: `fs.readdirSync`, frontmatter
extraction (YAML headers only — first ~40 lines), neighbor path resolution.
Confirm it builds the correct dispatch map without reading any entry bodies.
Test on the full palace. This should feel trivially fast.

**Step B4 — Sequential workers**
Run the worker function for each palace entry in a loop, passing paths not
content. Collect all reports. Print them. Slow, but correct. Confirm the output
shape before adding parallelism.

**Step B5 — Parallel workers with Promise.all()**
Convert the sequential loop to `Promise.all()`. All workers fire simultaneously.
Observe the wall-clock time difference. This is also the moment the architecture
*feels* like a swarm — all the reports arrive together, none of them aware
of the others.

**Step B6 — The coordinator**
Write the coordinator as a second API call. It receives all worker reports and
produces the topology synthesis. Key constraint: the coordinator never reads
palace files at this stage — it reasons from reports only. Confirm this holds
by checking what's in its context window.

**Step B7 — Write-back on approval**
Add the confirmation loop: present output to Loudon, accept approval/rejection
per link, write confirmed links to `.md` files using Filesystem MCP tools.
This closes the full loop from dispatch to palace edit.

**Step B8 — Harden and ceremony-ify**
Add error handling, rate limit backoff/retry, progress reporting, dry-run mode.
Write the Swarm Weave Ceremony entry as a formal ceremony using the Ceremony
Linter. This is now a production palace tool.

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
