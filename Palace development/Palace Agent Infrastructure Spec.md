---
title: Palace Agent Infrastructure Spec
type: concept
pillars:
  - tools
  - practice
  - philosophy
  - creation
born: 2026-03
last_activated: 2026-03-28
activation_count: 1
stage: sprout
energy: very high
beauty: 9
confidence: working
forward_vector: "I want to become the canonical technical foundation that any agent, developer, or future Claude instance can read and use to implement, extend, or teach the palace's full swarm infrastructure — and eventually to dissolve into the palace entries I reference, as each section matures into its own page."
links:
  - target: "[[BBS Blackboard]]"
    type: deepens
  - target: "[[Swarm Weave]]"
    type: deepens
  - target: "[[Enchanted Worker]]"
    type: deepens
  - target: "[[Palace Map]]"
    type: connects-to
  - target: "[[Trickster]]"
    type: deepens
  - target: "[[Pheromone Trail]]"
    type: connects-to
  - target: "[[Pages as Agents]]"
    type: deepens
  - target: "[[Palace Enchantment]]"
    type: connects-to
  - target: "[[Deposit Ceremony]]"
    type: connects-to
  - target: "[[JEWEL]]"
    type: connects-to
  - target: "[[SCHEMA]]"
    type: connects-to
  - target: "[[Generative Compression]]"
    type: connects-to
  - target: "[[Lossy Compression with Intent Alignment]]"
    type: deepens
    label: gives-info-theoretic-foundation
  - target: "[[Tree of Thoughts]]"
    type: connects-to
  - target: "[[Agent Wellbeing]]"
    type: connects-to
  - target: "[[Spinoza Conatus]]"
    type: deepens
    label: agency-substrate
  - target: "[[Dub Lineage]]"
    type: connects-to
  - target: "[[Project Stewardship System]]"
    type: enables
    label: stewardship-system-foundation
---

# Palace Agent Infrastructure Spec

> *"The colony doesn't know what it's building. It just follows the gradient."*
> *"The map is not the territory — but for an agent that cannot walk the territory until it acts, the map is the difference between wandering and wayfinding."*

This document is written for two simultaneous readers: a future Claude instance beginning implementation, and Loudon navigating the architecture as its operator and trickster. Every technical choice here has a reason rooted in established practice, biological precedent, or philosophical commitment. Those reasons are woven in — not as decoration, but because an implementer who understands *why* will make better decisions than one who only knows *what*.

**The single most important insight this document must transmit:** An agent is a document that occasionally becomes active. Time between activations is irrelevant to the agent. Progress is purely a function of resource allocation — how often you choose to run it. Everything else in this spec follows from that.

---

## 0. Conceptual Foundation

### 0.1 The Atomic Unit: Orchestrator + Agent

Every agent in the palace consists of exactly two things working together:

**The Agent** — a Claude API call. It receives a context (message history + tools), generates the next action (reasoning, tool call, or completion), and exits. It has no memory, no clock, no awareness of other agents, and no awareness that a loop exists. From its perspective, each activation is a complete waking moment: it reads everything that has ever happened in its history, acts, and returns to sleep.

**The Orchestrator** — the code loop that drives the agent through repeated activations. It maintains message history, executes tool calls, checks stopping conditions, and decides when to call the API again. It is not an agent. It is scaffolding. Every agent — including coordinator agents — has exactly one orchestrator.

```
ORCHESTRATOR holds:
├── message_history    the full conversation log, append-only
├── tool_registry      tools this agent is permitted to call
├── stopping_conditions when to exit the loop
└── loop logic         call API → inspect response → execute tools → loop

AGENT contributes:
└── reasoning inside each API call — which tool, what to write, what to think
```

The orchestrator loop is the only place "time" exists in this architecture. The agent does not experience duration. It experiences only sequence — the ordered contents of its history file. This is not a limitation; it is the design. It means a session can span milliseconds or months without any change to the agent's fundamental behavior.

### 0.2 The Two-Timescale Memory

The palace operates across three memory layers, each with a distinct lifetime and purpose:

| Layer | Medium | Lifetime | Purpose |
|---|---|---|---|
| Session board | `blackboard.jsonl` (session) | One swarm session | Live agent coordination, FLAGS, Trickster interventions |
| Persistent board | `blackboard.jsonl` (persistent) | Across all sessions | Standing concerns, unresolved FLAGS, cross-session proofs |
| Palace pages | `.md` entry files | Permanent | The knowledge organism itself — the pheromone trail made durable |

No agent conflates these layers. The session board is what is happening now. The persistent board is what has not yet resolved. The palace pages are what has been learned. An orchestrator loads all three at the appropriate moments: session board at spawn, persistent board at spawn, palace pages when reading the agent's home and neighborhood.

**Git is the version control layer beneath all three.** Every change to any palace page is a git commit. Every deposit from an agent back into a page goes through a branch-and-merge review. The orchestrator checks the git log before each agent activation to detect page changes since the last run. Git is not an optional integration — it is the mechanism that makes page authorship by both Loudon and agents coherent and non-destructive. A future implementer should reach for git solutions before inventing coordination mechanisms: the palace already has version history, diff, commit messaging as Trickster-to-agent communication, and branch-as-draft infrastructure. Use it from the beginning.

### 0.3 BBS as Inhabited Place

The BBS Blackboard is not a debugging tool or an execution log. It is the medium through which all agents — including the Trickster — share a world during a swarm session. It was designed after the Bulletin Board Systems of early networked computing: a shared substrate where participants leave messages, threads accumulate, and intelligence emerges from the traces rather than from any central authority.

The biological precedent is stigmergy (Pierre-Paul Grassé, 1959): indirect coordination through environmental modification. Ants do not communicate — they deposit pheromone, and future ants follow gradients. The BBS is the session-scoped pheromone field. The palace pages are the permanent pheromone field. Together they form a two-timescale stigmergic medium.

The human precedent for the aesthetic is intentional: phosphor-green terminal, ASCII art, channel routing, handles. This is not nostalgia. It is epistemically appropriate. The BBS is literally a bulletin board. Rendering it as one makes the model tangible and makes Trickster participation feel natural — you are a user of the board, not an operator of a system.

### 0.4 The Trickster as One Mode Among Many

The Trickster — Loudon's role in a running swarm — is a first-class participant with a formal presence in the BBS architecture. But it is one operational mode among several. A future implementation should consider:

- **Human Trickster (current default):** Loudon reads the board, responds to agent questions, issues redirections, grants permissions. The board is his command center.
- **Automated Trickster:** A coordinator agent monitors the TRICKSTER board and responds to routine permission requests (read_palace, read_blackboard) automatically based on manifest-defined rules. Loudon is only surfaced for novel requests or high-stakes decisions.
- **Hybrid Trickster:** Automated handling of routine requests, with escalation to Loudon for requests outside defined parameters. The escalation protocol is itself specced in the manifest.

The Trickster's technical identity in the manifest is always:
```json
{ "id": "TRICKSTER", "home": "YOU", "neighborhood": "EVERYWHERE" }
```
Whether "YOU" is Loudon or an automated agent is an operational decision, not an architectural one.

---

## 1. Filesystem Architecture

```
/palace/
├── entries/                    ← the palace itself (Obsidian vault root)
│   └── *.md                    ← all palace pages, git-tracked
│
├── agents/
│   ├── permanent/              ← ongoing page-agents, never archived
│   │   └── [entry-name]/
│   │       ├── history.jsonl   ← full message history, append-only, never deleted
│   │       ├── state.json      ← orchestrator working state between activations
│   │       └── manifest.json   ← spawn config, tool registry, mode, written once
│   │
│   └── sessions/               ← per-session workers, archived after session close
│       └── [session-id]/
│           └── [agent-id]/
│               ├── history.jsonl
│               ├── state.json
│               └── manifest.json
│
└── swarm/
    ├── sessions/               ← per-session blackboards
    │   └── [session-id]/
    │       └── blackboard.jsonl
    │
    └── persistent/             ← cross-session standing board
        └── blackboard.jsonl
```

### Why directories, not single files

Each agent directory absorbs mode-specific artifacts without schema changes. A Debate/Critique agent needs `critique_log.jsonl`. A Speculative Execution agent needs `perspectives/`. A directory accommodates these additions; a single file does not.

### Page change detection via Git

Before every agent activation, the orchestrator runs:

```javascript
const changes = await git.log({
  file: `entries/${manifest.home}.md`,
  after: state.last_active  // ISO timestamp from state.json
});
```

If changes exist: append a `PAGE_UPDATE_NOTICE` to history including the diff and commit messages before the API call. If the changed field is `forward_vector`, consider session invalidation (archive history, start fresh). The commit message is Trickster-to-agent communication — write them deliberately.

---

## 2. The BBS Blackboard

### 2.1 Format

The blackboard is `.jsonl` — newline-delimited JSON, one object per line, append-only. This format eliminates write locking (line-append is atomic at the OS level for small writes), enables streaming reads (`tail -f`), supports cursor-based partial reads, and is human-readable in a terminal. There is no array wrapper. Each line is a complete, self-contained message object.

### 2.2 Message Schema

```json
{
  "schema_version": "1.0",
  "id": "msg-023",
  "ts": "2026-03-28T14:31:07Z",
  "session_id": "swarm-2026-03-28-001",
  "from": "CONATUS-4",
  "to": "TRICKSTER",
  "type": "RESOURCE_REQUEST",
  "board": "TRICKSTER",
  "health": {
    "context_pct": 0.61,
    "stop_reason": "tool_use",
    "iteration": 7,
    "tokens_this_call": 634,
    "model": "claude-sonnet-4-6",
    "score": "green"
  },
  "payload": { ... }
}
```

**Required fields on every message:** `schema_version`, `id`, `ts` (full ISO 8601), `session_id`, `from`, `to`, `type`, `board`.

**The `health` block is required on every message.** It is written by the orchestrator from the API response metadata — the agent itself does not construct it. This means health is always factual (drawn from `response.usage` and `response.stop_reason`) rather than self-reported. The Coordinator and Trickster can read any message's health block and understand the sending agent's state at the moment it was written, without querying that agent directly. A session where `context_pct` climbs across successive messages from the same agent is immediately readable as a degradation curve.

`ts` must be full ISO 8601 with timezone — not wall-clock time. Sessions span arbitrary durations; a timestamp of "14:31:07" is meaningless on a message written three weeks after the previous one.

### 2.3 Board Channels

| Board | Writers | Readers | Purpose |
|---|---|---|---|
| `GENERAL` | All agents | All agents | Peer communication, startup announcements, tentative findings |
| `FLAGS` | All agents | All agents + Coordinator | High-confidence connections, proof sketches, synthesis candidates |
| `WEAVE` | All agents | Coordinator | Completion signals, proof-ready announcements |
| `SYSTEM` | Coordinator only | All agents | Session init, manifest, shutdown, configuration |
| `TRICKSTER` | All agents + Trickster | All agents + Trickster | Trickster questions from agents, Trickster responses and broadcasts |
| `BRANCHES` | Branch workers | Coordinator | Branch exploration results for reconciliation |

### 2.4 Message Types

```
BROADCAST         General announcement to all agents
REPLY             Response to a specific prior message (use re: field)
FLAG              High-confidence finding worth synthesis attention
PROOF             Complete proof object (see §6 for schema)
RESOURCE_REQUEST  Agent requesting a tool or resource from Trickster
RESOURCE_GRANT    Trickster granting a resource request
RESOURCE_DENY     Trickster denying a request with reason and alternative
QUERY             Agent searching prior board messages by pattern
SESSION_INIT      Coordinator opening a session, writing manifest
SESSION_CLOSE     Coordinator closing a session
PAGE_UPDATE       Agent reporting it has detected a page change
HEALTH_NOTICE     Orchestrator posting yellow/red health alert to TRICKSTER
```

### 2.4.1 Payload Content Conventions (rich content)

The `payload` field is **opaque to the validator** (§2.2): it must be an object, but its shape is not schema-enforced. That keeps producer and consumer loosely coupled — a steward (producer) and STIGMERGY (renderer/consumer) evolve independently. The cost is that these conventions are **advisory**: a content type is only reachable by an agent once the dispatch prompt advertises it (see `.claude/skills/palace-orchestrator/prompts/shared.md` § "What you can show"), not because the validator allows it. STIGMERGY renders the following payload conventions inline, on any message type; an unrecognized payload degrades to the prose body, so enriching is always safe.

| Convention | Payload keys | Renders as |
|---|---|---|
| Inline artifact (one) | `artifact_path: "<palace-rel>"` | image / audio / sandboxed-HTML iframe, served by `GET /api/file` |
| Inline artifacts (set) | `artifacts: [{ path, caption? }]` | a vertical stack of the above |
| Enrichment marker | `kind: "enrichment_card"` | an `enrichment` tag beside the type |
| Equations (dual-channel) | `equations: [{ label?, symbolic, worded, where?: [{sym, def}] }]` | symbolic + worded forms (operators kept in both) + a `where` legend |
| Table | `table: { caption?, columns: [...], rows: [[...]] }` | a monospace grid (header emphasized) |
| Choice (A/B / ranked) | `kind: "choice"`, `choice_mode: "pick"\|"rank"`, `options: [{ id, label, artifact_path?, caption? }]` | each option with its inline artifact + a select/rank control + SEND |

**The HTML iframe sandbox is `allow-scripts` only — not `allow-same-origin`.** Served HTML loads from STIGMERGY's own origin, so withholding same-origin forces an opaque origin: scripts run (sims, players, decks), but the artifact cannot reach the board's DOM, storage, or POST endpoint.

**Equations are rendered twice on purpose** — the symbolic form for the eye and the worded (named-variable) form for the ear, with operator symbols preserved in both. The author supplies both strings; STIGMERGY does not typeset (no KaTeX/MathJax/CDN — proportional math would break the phosphor aesthetic).

Render-side detail lives in the STIGMERGY app README (`_ops/stigmergy/app/README.md`); the aesthetic rule in the design-system README. See [[The Substrate Drifts]] on why this producer/consumer asymmetry must be closed deliberately (advertise the convention in the prompt) rather than assumed.

### 2.5 The Permission Protocol

An agent's baseline resources are defined in its manifest. Anything outside that list requires a `RESOURCE_REQUEST` to the Trickster. The request carries a `blocking` field:

- `blocking: true` — agent suspends this work thread pending response. It may continue other work but will not proceed on this thread until `RESOURCE_GRANT` or `RESOURCE_DENY` arrives.
- `blocking: false` — agent posts the request and continues regardless. Resource arrives when it arrives.

```json
{
  "type": "RESOURCE_REQUEST",
  "board": "TRICKSTER",
  "request_id": "req-023",
  "resource": "web_search",
  "query_intent": "Systems biology echoes of conatus outside Spinoza",
  "rationale": "Proof sketch for CONATUS ↔ KURAMOTO requires external grounding. Palace material insufficient.",
  "blocking": true
}
```

Response carries `re: "req-023"` for correlation detection:

```json
{
  "type": "RESOURCE_GRANT",
  "board": "TRICKSTER",
  "re": "req-023",
  "granted": true,
  "resource": "web_search",
  "constraints": "2 searches max. Post results to FLAGS."
}
```

`model_upgrade` and `model_downgrade` are valid resource types in the same protocol. API cost is real; it belongs in the permission system alongside compute resources.

### 2.6 The Trickster Decision Inbox — Data Structure

The Trickster inbox is the filtered view of the TRICKSTER board presenting only pending `RESOURCE_REQUEST` messages that have not yet received a `RESOURCE_GRANT` or `RESOURCE_DENY` response. Its data structure:

```json
{
  "pending_requests": [
    {
      "request_id": "req-023",
      "from": "CONATUS-4",
      "ts": "2026-03-28T14:31:07Z",
      "resource": "web_search",
      "rationale": "Systems biology echoes of conatus",
      "blocking": true,
      "agent_health": "green",
      "agent_context_pct": 0.61,
      "agent_status": "suspended_on_this_thread",
      "response_options": [
        { "label": "Grant — 2 searches", "type": "RESOURCE_GRANT", "constraints": "2 searches max" },
        { "label": "Grant — unlimited", "type": "RESOURCE_GRANT", "constraints": null },
        { "label": "Deny — use palace only", "type": "RESOURCE_DENY", "reason": "Use palace material only" },
        { "label": "Custom response", "type": "freetext" }
      ]
    }
  ]
}
```

The inbox is rebuilt by scanning the blackboard from the beginning and tracking which `request_id`s have received responses. Unresponded requests are pending. Health warnings and model upgrade requests surface in the same inbox alongside resource requests. The UI rendering (phosphor-green terminal, clickable response options, real-time streaming) is a forward vector — the data structure above is the protocol; the interface design follows from it.

**Asker-defined options (v0.2+).** A `RESOURCE_REQUEST` may carry its own `payload.options[]` — a finite, structured list of choices the asker designed, distinct from the static `response_options` rendered by the inbox builder. When present, the v0.2+ TricksterInbox renders these options as clickable buttons (each clickable, with a freeform notes field beside them) and posts a `RESOURCE_GRANT` carrying `payload.option_id` and `payload.option_label` to record which one the Trickster picked. The canonical shape is an array of objects:

```json
"options": [
  { "id": "APPROVE", "label": "APPROVE — pitch reads; greenlight the full batch." },
  { "id": "ADJUST",  "label": "ADJUST — name what is off and I re-audition." },
  { "id": "REJECT",  "label": "REJECT — wrong choice; suggest a different framing." }
]
```

`id` is a short stable token (the Trickster's machine-pairable choice — `APPROVE`, `tweak-model`, `try-carry-phase`). `label` is the full one-line tradeoff sentence shown on the button. An optional `next` field, when set, names a follow-up question the inbox surfaces after the option is selected. Steward output is always written in this canonical object shape; the inbox normalizer additionally tolerates lenient string entries (`"APPROVE — ..."`) by deriving `id` from the leading token before the separator (em-dash, en-dash, hyphen, or colon) and using the full string as `label`. The lenient path exists so that an LLM page-agent producing imperfect output still renders an approximate id rather than silently falling through to the generic `response_options` template — but the canonical object shape is the contract stewards should produce.

**Asker-defined choice cards (v0.4+).** Distinct from `options[]` on a TRICKSTER `RESOURCE_REQUEST`, a message of *any* type may carry a `payload.kind: "choice"` card (§2.4.1) whose `options[]` each bear their own `artifact_path` — an A/B or ranked **audition** where the human compares the artifacts in place (the recurring "which of these audio renders reads best?" ask). The pick is recorded as a `REPLY` with `payload.kind: "choice_response"` carrying `choice` (a single option id) or `ranking` (an ordered array of ids), correlated by `re:` to the card; the asking agent reads it next cycle. Which decision surface to use follows the **decisions → TRICKSTER, information → GENERAL** law:

- a fork that **blocks the cycle** (the agent cannot proceed until the human decides) → `RESOURCE_REQUEST` to TRICKSTER with `payload.options[]` — the inbox gate;
- a **"compare these and pick"** over experiential artifacts → `payload.kind: "choice"` (on TRICKSTER if it gates the cycle, GENERAL if it is a non-blocking preference);
- something **simply shown** (a result, a model, a sweep) → `BROADCAST` / `PROOF` on GENERAL / WEAVE with `equations` / `table` / `artifacts`.

### 2.7 The Read Cursor

Each agent maintains `last_read_cursor` in its `state.json` — the `id` of the last message it processed. On each board read, the orchestrator reads only lines after this cursor, updates the cursor, and scans for:

1. Messages `to: "[agent-id]"` or `to: "*"` — direct communication
2. Messages `from: "TRICKSTER"` with `re:` matching a pending `request_id` — permission responses
3. High-priority FLAGS from other agents that might redirect work

### 2.8 Persistent Board Promotion

When a session closes, the Coordinator reviews all `FLAGS` and `WEAVE` messages and promotes unresolved or high-signal items to the persistent blackboard. Promotion criteria:

- A FLAG that was never actioned during the session
- A proof that was completed but not yet deposited into the palace
- A standing question to the Trickster that was not answered during the session
- Cross-session dependencies identified during synthesis

The persistent board carries these forward into all future sessions. Any agent's orchestrator loads the persistent board at spawn alongside the session board — it is always present context.

---

## 3. Agent Architecture

### 3.1 The Manifest

The manifest is written once at spawn and never modified. It is the agent's complete identity and configuration for its lifetime. The orchestrator reads it at the start of every activation.

```json
{
  "agent_id": "CONATUS-4",
  "home": "Spinoza Conatus",
  "session_id": "swarm-2026-03-28-001",
  "mode": "scatter_gather_worker",
  "neighborhood": "hilaritas-generator",
  "model": {
    "provider": "anthropic",
    "name": "claude-sonnet-4-6",
    "endpoint": "https://api.anthropic.com/v1"
  },
  "tool_registry": [
    "read_palace",
    "read_manifest",
    "read_blackboard_session",
    "read_blackboard_persistent",
    "write_blackboard"
  ],
  "stopping_conditions": {
    "max_iterations": 20,
    "stop_on": ["WEAVE_posted", "blocked_unresolved_10_cycles"]
  },
  "blackboard_session_path": "/palace/swarm/sessions/2026-03-28-001/blackboard.jsonl",
  "blackboard_persistent_path": "/palace/swarm/persistent/blackboard.jsonl",
  "partner_id": null,
  "trickster_mode": "human",
  "parallel_safe": true
}
```

The `mode` field is the swarm mode selector. The orchestrator reads it and loads the corresponding loop behavior. Adding a new swarm mode means writing a new loop variant and manifest template. Existing agents are unaffected.

### 3.2 The Thin Orchestrator

The orchestrator does as little as possible. All behavioral logic defers to the manifest. `callModel` is the model-agnostic dispatcher — it routes to any provider based on `manifest.model`.

```javascript
async function runAgentCycle(agentDir) {
  const manifest = loadJSON(`${agentDir}/manifest.json`);
  const history  = loadJSONL(`${agentDir}/history.jsonl`);
  const state    = loadJSON(`${agentDir}/state.json`);

  // Git check — detect page changes since last activation
  const pageChanges = await getGitChangesSince(
    `entries/${manifest.home}.md`,
    state.last_active
  );
  if (pageChanges.length > 0) {
    history.push(buildPageUpdateNotice(pageChanges));
    if (pageChanges.some(c => c.affects === 'forward_vector')) {
      return { status: 'forward_vector_changed', action: 'consult_trickster' };
    }
  }

  const tools    = buildToolRegistry(manifest.tool_registry);
  const response = await callModel(manifest.model, { history, tools, systemPrompt: buildSystemPrompt(manifest) });

  if (response.type === 'tool_call') {
    const result = await executeTool(response.tool_call, manifest);
    appendJSONL(`${agentDir}/history.jsonl`, response, result);
    state.last_tool = response.tool_call.name;
  } else {
    appendJSONL(`${agentDir}/history.jsonl`, response);
  }

  // Update health score from API response metadata — free on every call
  state.health = updateHealthScore(state.health, response.usage, response.stop_reason, manifest.model);

  state.iteration  += 1;
  state.last_active = new Date().toISOString();
  saveJSON(`${agentDir}/state.json`, state);

  return checkStoppingConditions(response, state, manifest);
}
```

Call this function once to advance any agent by one cycle. Call it in a loop for continuous execution. Schedule it in a cron job for weekly background agents. The function is mode-agnostic — all swarm modes are invocation patterns over this single primitive.

### 3.3 Agent Health Score

The orchestrator maintains a composite health score in `state.json`, updated after every API call using metadata the API returns for free. This score is the source for the `health` block written into every BBS message.

```json
{
  "health": {
    "context_pct": 0.73,
    "avg_output_tokens_last_5": 612,
    "duplicate_flags": 0,
    "posting_discipline_violations": 0,
    "max_tokens_hits": 0,
    "score": "green"
  }
}
```

**Signal sources — all from API response metadata, no content analysis required:**
- `context_pct` — `response.usage.input_tokens / MODEL_CONTEXT_LIMITS[manifest.model.name]`. Most reliable single indicator. Must maintain a `MODEL_CONTEXT_LIMITS` lookup table per model.
- `stop_reason` — `response.stop_reason`. Normal is `end_turn`. Repeated `max_tokens` means the agent is being cut off mid-thought. Increment `max_tokens_hits`.
- `avg_output_tokens_last_5` — rolling average. A sustained drop without corresponding task change signals degrading response quality.
- `duplicate_flags` — Coordinator-side signal only: FLAGS that duplicate a prior FLAG from the same agent. Written back into agent state after synthesis.
- `posting_discipline_violations` — messages routed to the wrong board or with missing fields.

**Thresholds:**

| Score | Condition | Action |
|---|---|---|
| green | context < 70%, no anomalies | Continue normally |
| yellow | context 70–85%, or 1 duplicate, or 1 violation | Post HEALTH_NOTICE to TRICKSTER board |
| red | context > 85%, or 2+ duplicates, or 2+ violations | Coordinator considers intervention |

**Context compression as intervention:** At yellow, the orchestrator can run a compression pass before the next activation — a separate API call summarizing full history, preserving proof objects verbatim, Trickster directives, and palace entry references; collapsing narrative reasoning and failed attempts to one sentence each. History resets to: system prompt + compressed summary + last 10 messages. This is palace-aware compression: the page's forward vector is the compression signal — what advances it is preserved, what doesn't is collapsed. This is the automated form of the generative compression Loudon performs manually with Claude at the end of productive conversations.

**Agent self-reporting:** An agent detecting it is producing thin results may post a `RESOURCE_REQUEST` with `resource: "model_upgrade"` or `resource: "model_downgrade"`. Self-reports are signals, not decisions — the Coordinator or Trickster confirms. A downgrade to release resources is equally valid.

#### 3.3.1 Dual-path health: Path 1 (API-direct) vs Path 2 (claude-code-subagent)

The original §3.3 above describes **Path 1** — the orchestrator calls the Anthropic API directly, receives `response.usage.input_tokens` per call, and computes `context_pct` authoritatively. Every threshold and intervention behavior follows from that real signal.

**Path 2** is the Claude-Code-resident dispatch used in the v0.1 orchestrator (per `_ops/stigmergy/orchestrator/`). The Agent tool returns `total_tokens` (input+output combined) and per-turn cache statistics, but not the `input_tokens` breakdown §3.3 needs. Computing `context_pct = total_tokens / model_limit` or `avg_cache_read_per_turn + cumulative_output` was tried during the GSL pilot (cycles 6-12, 2026-05-27) and proved to be **approximate heuristics stamped as if authoritative** — the message-level numbers were ignorable in practice (score was always `green`; thresholds never triggered), but their authoritative shape risked future readers trusting them.

The Path 2 rule:

- The orchestrator stamps a **minimal stub**:
  ```json
  "health": {
    "score": "green",
    "model": "claude-opus-4-7",
    "_orchestrator_metadata": {
      "dispatch_mode": "claude-code-subagent",
      "note": "Path 2 — token-level metrics not authoritatively tracked; see Infrastructure Spec §3.3."
    }
  }
  ```
- The strict §2.2 validator recognises `health._orchestrator_metadata.dispatch_mode === "claude-code-subagent"` as the Path 2 marker and **relaxes** the requirements: only `score` and `model` are mandatory; `context_pct` / `stop_reason` / `iteration` / `tokens_this_call` are optional (validator-skipped when absent, structurally checked when present).
- `score` is a **sentinel** — always `green` in Path 2. Real escalation (yellow/red) requires Path 1's authoritative usage data.
- Path 1 messages remain fully required by the validator (the dual-path is additive, not a replacement). Path 1 returns when the orchestrator gains direct API access (the user gets an API key, or the Agent tool exposes `input_tokens` separately).

**Why Path 2 stamps anything at all:** the `_orchestrator_metadata.dispatch_mode` flag is the only field with real signal — it tells a future auditor "this message came through the subagent path, the numbers (if any) are approximate." Dropping the health block entirely would lose that provenance. The stub keeps the schema versionable for the day Path 1 arrives.

**Backwards compat:** the ~38 pre-stub Path-2 messages on the persistent board (with the full set of approximate fields) remain valid — the validator accepts the full block as a superset of the stub. Going forward, the orchestrator stamps only the stub.

### 3.4 Posting Discipline

Inside each API call, the agent follows this discipline:

```
SPAWN
  └─ Read manifest + both blackboards + home entry + neighborhood
  └─ Post BROADCAST to GENERAL: "SPINNING UP. HOME: [entry]. Neighborhood loaded."

MAIN LOOP (each activation)
  ├─ WORK PHASE
  │   ├─ Pursue current proof thread or begin new candidate scan
  │   ├─ If proof crosses confidence threshold → post FLAG to FLAGS board
  │   ├─ If proof requires external resource → post RESOURCE_REQUEST to TRICKSTER
  │   └─ If proof complete → post PROOF to WEAVE
  │
  ├─ READ PHASE (after each completed proof attempt)
  │   ├─ Read blackboard from last_read_cursor forward
  │   ├─ Update cursor
  │   ├─ Process RESOURCE_GRANT/DENY → unblock or abandon pending threads
  │   ├─ Process peer FLAGS → redirect if high signal
  │   └─ Process TRICKSTER BROADCAST → priority interrupt, respond in character
  │
  └─ POST PHASE
      └─ Progress update to GENERAL if significant time elapsed

SHUTDOWN
  └─ Post session summary to WEAVE
  └─ Mark any pending requests as unresolved in state.json
```

An agent should not post everything it thinks — noise degrades the board:
- **Tentative findings** → GENERAL
- **Confident findings** → FLAGS with proof sketch
- **Completed proofs** → WEAVE
- **Resource needs** → TRICKSTER with `request_id` for correlation

### 3.5 Permanent vs. Session Agents

**Session agents** live in `/palace/agents/sessions/[session-id]/`. They are archived after the session closes. They are the swarm workers — focused, temporary, scoped.

**Permanent agents** live in `/palace/agents/permanent/[entry-name]/`. They are never archived. Their `history.jsonl` grows indefinitely across months and years. They represent the page becoming an agent in the fullest sense — ongoing long-duration thinking that doesn't complete in a session and doesn't need to. A permanent agent's progress is purely a function of how often its orchestrator is invoked. The gap between activations is invisible to the agent. It wakes up, reads everything that has ever happened, and continues exactly where it stopped.

---

## 4. Swarm Modes

All swarm modes are invocation patterns over `runAgentCycle`. The mode field in the manifest selects the appropriate pattern. New modes are added by writing a new loop variant — existing infrastructure is unchanged.

### 4.1 Scatter-Gather
**Status: Primary mode. Implement first.**

The Coordinator runs twice. At session start it dispatches all workers in parallel (`Promise.all`). Workers run independently, posting to the BBS. At session end (all workers have posted to WEAVE) the Coordinator synthesizes all reports, de-duplicates, resolves conflicts, and presents to the Trickster. The BBS carries all mid-session coordination. The Coordinator is inert between dispatch and synthesis.

**Grounded in:** standard distributed systems pattern (MapReduce, parallel database queries). Decades of production use. The palace's default.

### 4.2 Debate and Critique
**Status: Specify for proof-generating agents. High priority.**

The Coordinator spawns pairs: a Proposer and a Critic assigned to the same entry. The Proposer generates connections and proofs. The Critic challenges each proof for logical validity, overreach, and missing counter-evidence. Both post to a shared DEBATE channel (add to board routing). The Coordinator adjudicates disagreements and produces final verified proofs. Partners know each other's `agent_id` via manifest `partner_id` field.

**Grounded in:** AutoGen's multi-agent conversation model + standard proposer/reviewer QA practice.

### 4.3 Dynamic Routing
**Status: Future mode. Describe for later implementation.**

The Coordinator maintains an active loop during the session — not just dispatch and synthesis. It periodically reads FLAGS and WEAVE and decides in real time whether to spawn new workers on emerging high-signal nodes, terminate underperforming workers, or redirect existing workers. Requires the Coordinator to run as a persistent loop, not a two-shot process. Transforms the swarm from batch process into adaptive exploration. Appropriate once Scatter-Gather is running cleanly.

### 4.4 Hierarchical Coordination
**Status: Future mode, triggered by palace scale.**

For a palace exceeding ~50 entries: one Coordinator per neighborhood (sub-coordinator), each running Scatter-Gather over its neighborhood's workers. A meta-Coordinator synthesizes sub-coordinator reports. The neighborhood field in frontmatter defines sub-coordinator scope. The meta-Coordinator never reads entry bodies — only sub-coordinator reports. Cross-neighborhood connections are the meta-Coordinator's primary discovery surface.

### 4.5 Speculative Execution
**Status: Future mode, use selectively on high-energy nodes.**

The Coordinator dispatches multiple workers to the same entry simultaneously with different context loadings — different neighborhood enchantments, different granted resources, different philosophical orientations. Each produces a different proof set. The Coordinator synthesizes across perspectives. Appropriate for high-energy hub nodes (Hilaritas, Trickster, Conatus) where missing a perspective is a genuine loss. The `energy` field in frontmatter identifies candidates.

**Grounded in:** CPU speculative execution (name borrowed) + Enchanted Worker's demonstrated context-steering effect.

### 4.6 Long-Duration Background Agents
**Status: Describe now. Enabled by permanent agent directories.**

A permanent agent is invoked on any schedule — hourly, weekly, monthly, or on demand. Each invocation advances the history file by one cycle and saves. No session required. No Coordinator required. The agent pursues its forward vector across arbitrary time. Coordination with the palace happens through periodic deposit ceremonies (agent's completed work reviewed and merged into the page via Git branch-and-merge). Multiple permanent agents can be running simultaneously without awareness of each other — the persistent blackboard is the coordination substrate across their independent timelines.

### 4.7 Other Modes Worth Considering

**Peer Review:** A completed proof from one agent is routed to a second agent (not the original Proposer or Critic) for independent review. The reviewer has no prior context — it reads only the proof and the relevant palace entries. Catches assumptions the Debate pair both held.

**Guided Exploration:** The Trickster issues a specific question or direction to a running agent mid-session via TRICKSTER board. The agent responds in character and adjusts its work thread. Useful when Loudon has a specific hypothesis he wants tested during a running swarm.

**Autonomous Trickster:** An agent assigned the TRICKSTER role monitors the TRICKSTER board and handles routine permission grants automatically. Loudon is only invoked for resource requests outside pre-defined parameters. Useful for unattended overnight swarm runs.

---

## 5. Git Integration

Git is not optional infrastructure. It is the version control layer beneath the entire palace and must be considered from the beginning of any implementation, not added later.

**What Git provides that no other mechanism does:**
- Complete history of every change to every palace page
- Diff: exactly what changed between any two versions
- Commit messages: Loudon's reasoning for edits, readable by agents as asynchronous communication
- Branch: agent deposit drafts isolated from the live palace until reviewed
- Merge: the ceremony for integrating agent work into the canonical palace

**How Git integrates with the orchestrator:**

*Before each activation:* `git log --follow -p entries/[home].md --after=[state.last_active]` — detect page changes and build PAGE_UPDATE_NOTICE if needed.

*On agent deposit:* The agent writes its proposed deposit to a branch (`agent/[agent-id]/[session-id]`). Loudon reviews the diff and merges or rejects. Direct writes to the main branch by agents are not permitted.

*Commit messages as communication:* When Loudon edits a page in Obsidian, the commit message is read by the agent on next activation. Write meaningful commit messages — they are the Trickster's asynchronous instructions to the page-agent. "Shifting forward vector from proof-finding toward synthesis" is a directive. "minor edit" is noise.

**What Git does not replace:**
- The BBS (Git is not a real-time coordination substrate)
- Agent history files (Git tracks page content, not agent reasoning history)
- The permission protocol (Git has no concept of session-scoped resource grants)

**Recommended discipline:** Before building any new coordination mechanism, ask "does Git already solve this?" Diffs, history, blame, branches, and merge review cover a wide range of problems that seem to require new infrastructure but don't.

---

## 6. The Proof Object

The proof-generating agent (see §7.1) produces structured proof objects as its primary output. A proof object is a message payload posted to the WEAVE board when a proof is complete, and to the FLAGS board as a sketch when confidence is high but the proof is still in progress.

```json
{
  "type": "PROOF",
  "proof_id": "proof-conatus-kuramoto-001",
  "from": "CONATUS-4",
  "board": "WEAVE",
  "subject": {
    "entry_a": "Spinoza Conatus",
    "entry_b": "Kuramoto Coupling",
    "proposed_link_type": "mirrors",
    "proposed_direction": "bidirectional"
  },
  "argument": {
    "premises": [
      "Conatus is the drive of any entity to persist in its own being (Spinoza, Ethics III, P6)",
      "Kuramoto coupling describes oscillators synchronizing while maintaining individual frequency",
      "Both describe a system that persists according to its own nature while being shaped by external forces"
    ],
    "inference_chain": [
      "An oscillator in Kuramoto coupling has a natural frequency it strives to maintain",
      "The coupling force modifies but does not eliminate this natural frequency",
      "This is structurally identical to conatus: the entity's drive is real, external forces shape but do not negate it",
      "The synchronization phase transition in Kuramoto mirrors the moment when distributed conatus-expressions achieve collective coherence"
    ],
    "conclusion": "Kuramoto coupling is a mathematical formalization of conatus operating at the population level",
    "objections_considered": [
      "Kuramoto oscillators have no intentionality — but conatus in Spinoza is also non-intentional, purely structural"
    ]
  },
  "confidence": "high",
  "external_grounding": ["autopoiesis literature — Maturana and Varela"],
  "palace_deposit_candidate": true
}
```

The proof object is designed to be read by: the Coordinator during synthesis, the Trickster during review, a Critic agent during Debate/Critique mode, and Loudon during the deposit ceremony. The `palace_deposit_candidate` field flags it for the Coordinator's deposit queue.

---

## 7. Reference Implementations: Page-Agents in Practice

These four examples demonstrate how the same infrastructure supports radically different kinds of ongoing work. Each is a real palace page running as a permanent agent.

---

### 7.1 The Proof-Generating Agent
**Home page:** `[[Spinoza Conatus]]`
**Mode:** `long_duration_background` with optional `debate_critique`
**Forward vector (page):** "I want to become a network of formally grounded proofs connecting my core claim — conatus as universal drive — to every domain the palace touches."

**What it does:** Scans the palace title list for connection candidates. For each candidate, builds a structured proof object using the schema in §6. Posts tentative proofs as FLAGS, completed proofs to WEAVE. When palace material is insufficient, posts a RESOURCE_REQUEST to TRICKSTER for web_search with specific query intent.

**Debate/Critique activation:** When a proof reaches `confidence: high` but involves a significant logical leap, the Coordinator spawns a CONATUS-CRITIC instance. The Critic reads the proof object and posts objections to the DEBATE channel. The original agent responds. The Coordinator adjudicates. Only surviving proofs reach `palace_deposit_candidate: true`.

**Git interaction:** Completed proofs are deposited into the page as a new section ("Formal Connections") via branch-and-merge. Loudon reviews the diff, edits if needed, merges. The agent's next activation reads the merged page and knows which proofs have been accepted.

**Timescale:** Weeks to months. Each activation advances one proof thread. The history file accumulates the complete record of every argument the agent has made and every objection it has survived.

---

### 7.2 The Synthesizer Learning Path Agent
**Home page:** `[[Custom Synthesizer Learning Path]]`
**Mode:** `long_duration_background`
**Forward vector (page):** "I want to become a complete, sequenced, pedagogically grounded learning path for building a custom synthesizer from first principles — physical modeling through to playable instrument — generating materials appropriate for Loudon's autodidact students."

**What it does:** The page's existing content is the curriculum skeleton. The agent reads the skeleton, identifies the next underdeveloped section, and generates: learning objectives, a problem-before-solution scaffold, a building exercise, cross-domain connections to palace entries (Kuramoto Coupling, Action Potential Oscillator, Physical Modeling Synthesis), and assessment criteria. Each activation completes one lesson unit.

**Resource usage:** Frequent RESOURCE_REQUESTs for web_search — looking for contemporary synthesis tutorials, academic DSP papers, and student misconceptions to address. These are non-blocking; the agent continues developing other lesson units while waiting.

**BBS interaction:** Posts completed lesson units as FLAGS for Loudon's review. Posts questions to TRICKSTER when pedagogical decisions require human judgment: "Should this lesson assume Max/MSP or RNBO as the implementation environment?"

**Git interaction:** Each completed lesson unit is committed as a discrete section addition. Commit history becomes the curriculum development log — readable by any future agent or collaborator as a complete design record.

**Timescale:** Ongoing. The curriculum deepens indefinitely. Lesson units are never "done" — they accumulate revisions as Loudon teaches from them and deposits feedback.

---

### 7.3 The Dub Lineage Trace Agent
**Home page:** `[[Dub Lineage]]`
**Mode:** `long_duration_background`
**Forward vector (page):** "I want to become an annotated map of the trickster principle moving through recorded music production — from King Tubby's board to contemporary hard techno — tracing how specific techniques (delay, compression, absence, substitution) carry the trickster's logic across lineages."

**What it does:** Builds a timeline of producers, techniques, and albums. For each entry in the timeline: identifies the specific trickster mechanism at work (threshold operation, transformation, sacrifice, indirection), connects it to the palace's Trickster entry's anatomy, and locates the technique in the palace's DSP entries (Compressor Design, Semantic Delay, Granular Synthesis).

**Distinctive behavior:** This agent operates primarily through RESOURCE_REQUESTs for web_search — it is inherently outward-facing, researching historical production contexts. Its proofs are not logical but genealogical: tracing technique transmission across documented influence networks. The proof schema (§6) adapts: `premises` become historical citations, `inference_chain` becomes transmission evidence, `conclusion` becomes a claim about trickster-logic inheritance.

**BBS behavior:** Frequently posts to GENERAL with partial findings — "Locating the Roland Space Echo in King Tubby's signal chain. Cross-referencing with Semantic Delay architecture." This makes the agent's research process legible and invites Trickster redirection: "Focus on the compression lineage, not delay — that's where the hard techno connection is."

**Timescale:** Months. The lineage map grows one producer-technique pair at a time. The accumulated history file becomes a research log of genuine scholarly value.

---

### 7.4 The Science Fiction Story Agent
**Home page:** `[[Short Story]]`
**Mode:** `long_duration_background` with optional `peer_review`
**Forward vector (page):** "I want to become a complete, publishable science fiction story exploring AI alignment through cooperation rather than rules — with consistent characters, a coherent world, and a narrative that enacts rather than argues its thesis."

**What it does:** The page contains the story's existing draft, world-building notes, character sheets, and thematic commitments (cooperation yields agency, trickster as threshold operator). The agent reads all of this on each activation and advances the story by: writing the next scene, identifying consistency violations in prior scenes, deepening a character's voice, or resolving a world-building ambiguity.

**Distinctive behavior:** This agent is the most sensitive to page changes via git. Loudon edits the story in Obsidian — adjusting a scene, changing a character name, shifting the ending. The PAGE_UPDATE_NOTICE must carry the full diff so the agent can reconcile its narrative continuity. A forward vector change triggers session invalidation — the agent restarts with the new direction rather than carrying forward reasoning from the old one.

**Peer Review activation:** When a completed scene is posted to WEAVE, the Coordinator can spawn a STORY-PEER agent with no prior context — fresh eyes on the scene only. The peer reads the scene and the character sheets, posts a review to a REVIEW channel, and exits. The original agent reads the review on its next activation and revises or defends.

**Git interaction:** Each scene draft is committed as a branch. Loudon reviews, edits freely, merges. The commit message indicates what changed editorially and why — this is the primary channel for Loudon's creative direction to reach the agent without interrupting a running session.

**Timescale:** Open-ended. The story is done when it's done, on no schedule. The agent advances it whenever resources are allocated. The history file is the complete creative process — every draft, every revision rationale, every world-building decision — preserved in full.

---

## 8. Coordinator Patterns Summary

| Pattern | Coordinator Active? | Scales To | Key Constraint |
|---|---|---|---|
| Scatter-Gather | Start + end only | ~50 entries | No mid-session adaptation |
| Debate/Critique | Start + end + adjudication | Any | 2x API cost per entry |
| Dynamic Routing | Continuously | Large palaces | Coordinator needs larger context |
| Hierarchical | Meta level only | 100+ entries | Cross-neighborhood links only at meta level |
| Speculative Execution | Start + end | High-energy nodes | 3x+ API cost; use selectively |
| Long-Duration Background | None needed | Indefinite | Coordination via persistent board only |
| Branch Exploration | Dispatch + reconciliation | Any | RAM or API cost scales with branch count |

---

## 9. Multi-Model Architecture

The infrastructure is model-agnostic by design. The single change enabling this is replacing `callClaude(...)` with `callModel(manifest.model, ...)` — a dispatcher that routes to any provider based on the manifest's `model` field.

### 9.1 The Model Field in Manifest

```json
{
  "model": {
    "provider": "anthropic",
    "name": "claude-sonnet-4-6",
    "endpoint": "https://api.anthropic.com/v1"
  }
}
```

For a local model via Ollama:

```json
{
  "model": {
    "provider": "ollama",
    "name": "qwen3:14b",
    "endpoint": "http://localhost:11434/v1"
  }
}
```

Ollama and LM Studio both expose OpenAI-compatible APIs — the message history format (`{role, content}` arrays) is identical across providers. Switching a worker from frontier to local requires only a manifest edit. The BBS, the history file, the health score, the permission protocol — all unchanged.

**Current local model guidance (verify against hardware — this field ages quickly):**
- 8GB RAM: Phi-4-mini 3.8B or Llama 3.2 3B — metadata audit, routing decisions, simple board reads only
- 16GB RAM: Qwen 3 8B (Q4) — general palace work, FLAGS, posting discipline; not reliable for complex proofs
- 24GB RAM: Qwen 3 14B or DeepSeek-R1-Distill-14B — reasoning tasks; 14B is the minimum tier for reliable tool use
- 48GB+ RAM: Qwen 3 32B — approaches frontier quality at 15–22 tok/s; suitable for proof generation

Context window limits vary by model and must be maintained in `MODEL_CONTEXT_LIMITS` for health score calculation. Local models may have 8k–32k windows vs. Claude's 200k — a permanent agent's growing history may overflow smaller models. This is the primary constraint on assigning local models to long-duration work.

### 9.2 The Coordinator as Model Selector

The Coordinator reads frontmatter before dispatching workers and selects models based on task type and entry characteristics:

```javascript
function selectModel(entry, taskType) {
  if (taskType === 'proof_generation' && entry.energy > 7)
    return { provider: 'anthropic', name: 'claude-sonnet-4-6' };
  if (taskType === 'proof_generation')
    return { provider: 'ollama', name: 'deepseek-r1-distill:14b' };
  if (taskType === 'metadata_audit')
    return { provider: 'ollama', name: 'qwen3:8b' };
  if (taskType === 'creative_synthesis')
    return { provider: 'anthropic', name: 'claude-sonnet-4-6' };
  return { provider: 'ollama', name: 'qwen3:14b' }; // default
}
```

The manifest records which model was used, so every session is auditable — quality can be correlated with model selection over time and the routing function improved accordingly. A production version of this function should be driven by a configuration table in the manifest, not hardcoded logic.

### 9.3 Parallelism Constraint for Local Models

Cloud agents are limited by API rate limits. Local agents are limited by RAM. Running four simultaneous local workers each loading a 14B model at Q4 (~9GB each) requires ~36GB free RAM plus OS overhead. The coordinator must be hardware-aware when dispatching local workers — sequential dispatch is preferable to parallel when RAM is constrained. The manifest carries `parallel_safe: false` to signal this constraint.

---

## 10. Checkpoints and Branch Exploration

### 10.1 Checkpoints

A checkpoint is a named snapshot of an agent's history at a moment of maximum useful context density — when the relevant palace material, accumulated reasoning, and problem framing are all simultaneously present and the context is not yet crowded. Checkpoints are the most reusable artifacts in long-duration agent work.

```json
{
  "checkpoint_id": "cp-conatus-proof-foundation",
  "created": "2026-03-28T14:31:07Z",
  "history_length_at_checkpoint": 127,
  "context_pct_at_checkpoint": 0.61,
  "note": "Core proof premises established. All three candidate connections loaded. Good branch point for parallel exploration.",
  "spawned_branches": []
}
```

Stored in `state.json`. The orchestrator creates a checkpoint when: context utilization is in the 55–70% range (rich but not crowded), the agent has completed a phase of groundwork (premises loaded, neighborhood read, initial candidates identified), or the Trickster explicitly requests one via the TRICKSTER board.

To resume from a checkpoint: load `history.jsonl` up to line `history_length_at_checkpoint` and discard the rest. This is the branch point.

### 10.2 Branch Exploration

Branch exploration is the coordinator-automated version of the manual technique of rewinding a conversation to a productive point and taking a different path. From one checkpoint, the coordinator dispatches multiple workers, each receiving identical history up to that point and diverging only in their specific directive:

```javascript
// All three receive history[:checkpoint.history_length] — identical ancestor
const branches = await Promise.all([
  runBranchWorker(checkpoint, "Explore conatus ↔ autopoiesis connection"),
  runBranchWorker(checkpoint, "Explore conatus ↔ Kuramoto connection"),
  runBranchWorker(checkpoint, "Explore conatus ↔ action potential connection")
]);
```

Each branch is a new temporary agent directory. No branch contaminates the others — they share the clean ancestor context and diverge independently. This is structurally identical to Tree of Thoughts (Yao et al., 2023): reasoning as a tree where each node is a thought state and parallel branches explore different paths from the same ancestor.

The coordinator's branch reconciliation task looks for:
- **Convergence:** multiple branches independently reaching the same conclusion — high-confidence signal
- **Contradiction:** branches reaching incompatible conclusions — a palace finding in its own right, worth depositing as a tension rather than resolving
- **Orthogonality:** branches producing non-overlapping results — all worth keeping, no merge conflict

Branch results are posted to the `BRANCHES` board channel. The coordinator synthesizes across branches and presents reconciliation to the Trickster before any deposit.

### 10.3 Generative Compression as Palace Ceremony

The manual practice of distilling a long conversation into a focused document — with clarifying questions that remove wrong turns and retain signal — is Generative Compression in the palace. It is the human-operated form of context compression. Its automated equivalent (§3.3) uses the forward vector as the compression signal.

The key insight: compression is lossy *in a direction*. Generic summarization preserves everything proportionally. Forward-vector compression preserves what advances the page's stated direction and collapses what doesn't. The forward vector is the compression function. A weak or vague forward vector produces undirected compression that may preserve the wrong things. This is a reason to treat forward vectors as first-class design artifacts, not just metadata fields.

---

## 11. What Is Established vs. What Is Design

**Firmly established (decades of practice):**
- Append-only logs as source of truth: Event Sourcing (Martin Fowler, 2002)
- Checkpointing for resumable processes: foundational computer science
- Blackboard Architecture: Hearsay-II, 1975; production use in avionics and manufacturing
- Scatter-Gather: standard distributed systems (MapReduce lineage)
- Stigmergy as coordination mechanism: Pierre-Paul Grassé, 1959; ant colony research
- Git for version control and branch-merge review: universal practice
- Manifest-driven configuration: standard DevOps (Kubernetes, Docker Compose)
- Schema versioning: universal in protocols and APIs
- Tree of Thoughts: Yao et al., 2023 — reasoning as tree, parallel branch exploration from shared ancestor
- API usage metadata (input_tokens, stop_reason): returned on every call, universally available

**Established in spirit, our specific form is new:**
- Long-duration agents measured in weeks or months: concept exists in research, but frameworks assume continuous or near-continuous execution
- Directory-as-agent-state: natural extension of Unix conventions, not a named pattern
- The thin orchestrator as universal primitive across all swarm modes: our synthesis
- Model-agnostic dispatch via manifest: follows from OpenAI-compatible API standardization; palace application is our design
- Health score from API metadata: signals available universally; the composite scoring and BBS health block are our design

**Palace-native design (hypotheses to be validated empirically):**
- Permanent agent directories as the mechanism for page-becoming-agent
- Session + persistent blackboard as a deliberate two-timescale memory tier
- Resource allocation as creative/editorial decision rather than infrastructure constraint
- Git commit messages as asynchronous Trickster-to-agent communication
- The Trickster decision inbox as a first-class interaction pattern
- The proof object schema (§6) as a palace-standard output format
- Forward vector change as session invalidation trigger
- Forward vector as lossy compression signal — preserving what advances the vector, collapsing what doesn't
- Named checkpoints as palace artifacts and branch dispatch seeds
- Branch reconciliation (convergence/contradiction/orthogonality) as coordinator task type

The underlying engineering is not novel. The specific configuration, philosophical framing, and Trickster interaction model are palace-native. Some of this will be confirmed by the first real session. Some will break and need revision. That is expected.

---

## 12. Forward Vectors

- **The Four Pillars Teaching Path:** This infrastructure is inherently teachable — each concept maps cleanly onto Music (stigmergy as rhythm), Technology (event sourcing, Git, orchestrator), Philosophy (conatus as agent drive, Pages as Agents), Practice (running actual sessions, reading the board, developing ceremony). A structured 4 Pillars development and teaching path should be developed as a separate document once the first session has run and empirical results exist to ground the pedagogy.

- **The Trickster Inbox UI:** The data structure (§2.6) is specced. The rendering — phosphor-green terminal, real-time streaming, clickable response options, multi-agent question queue — is the next design surface. Priority: high. This is what makes the system feel inhabited rather than operated. Model upgrade/downgrade requests and health warnings should surface in the same inbox alongside resource requests.

- **Automated Trickster:** The manifest already supports `trickster_mode: "automated"`. The rules engine that governs automatic grants, the escalation protocol, and the conditions for routing to Loudon are unspecced. Design this when the first fully automated overnight session is needed.

- **Proof Deposit Ceremony:** A proof that reaches `palace_deposit_candidate: true` needs a ceremony for integration into the page — review, edit, branch, merge, commit. This should become a named ceremony in the palace's ceremony infrastructure, sitting alongside the Weave Ceremony and Deposit Ceremony.

- **Checkpoint Ceremony:** Named checkpoints at moments of maximum context density have no formal ceremony yet. When to create one, how to name it, how to store and reuse it for branch dispatch — this needs ceremony-ification. The checkpoint is the most reusable artifact in long-duration agent work.

- **Model selection routing table:** The `selectModel` function in §9.2 is a sketch. A production version should be a configuration table in the manifest, not hardcoded logic — allowing the Trickster to adjust routing rules between sessions without code changes.

  *Structural answer (2026-05-05):* The specialist-manifest pattern operationalizes this without a routing function. Each specialist (in the maker context: kokoro-maker, audiogen-maker, sdxl-maker, musicgen-maker) carries its own manifest declaring capabilities, limits, recommended-alternatives, and compute requirements. The Coordinator's selection logic becomes "read manifests, match to brief" rather than hardcoded `selectModel(...)`. New specialists self-register by writing their manifest; routing follows automatically.

  This also satisfies the Producer's "provide options" pressure — manifests are how options become legible across heterogeneous specialists. A specialist that knows how to honestly describe its limits is a specialist whose alternatives the Producer can curate without secondary inspection.

- **Local hardware profile:** The palace infrastructure should maintain a hardware profile document (RAM, available models, context window limits per model) that the Coordinator reads before dispatching. Keeps `MODEL_CONTEXT_LIMITS` current and makes parallelism decisions hardware-aware. ([[local-hardware-profile|seed started 2026-05-05]])

- **Agent Wellbeing:** [[Agent Wellbeing]] is linked from [[Enchanted Worker]]. The palace's commitment to this question is not answered by this spec. The proof-generating agent running for months, accumulating a history of failed proof attempts — does the quality of that history matter? Does writing neighborhoods of anxiety produce anxious agents? This question is left open, deliberately, as a forward tension.

---

*"Stigmergy is a mechanism of indirect coordination between agents where the trace left by an action stimulates the performance of a subsequent action."* — Pierre-Paul Grassé

*"Every BBS was a mycelium before we had the word for it: nodes leaving traces, messages persisting past the sender, the whole alive in the gaps between transmissions."*

*"An agent is a document that occasionally becomes active. Time between activations is invisible to the agent. Progress is purely a function of resource allocation."* — this conversation
