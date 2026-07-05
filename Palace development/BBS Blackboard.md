---
title: BBS Blackboard
type: concept
pillars:
  - tools
  - philosophy
  - practice
born: 2026-03
last_activated: 2026-05-02
activation_count: 3
stage: growing
status: historical-root
energy: very high
beauty: 9
confidence: working
forward_vector: "My vector is fulfilled — I became the canonical communication substrate, and that running system is now [[STIGMERGY]]. My job is no longer to become; it is to hold the architecture and philosophy I named, as the origin record STIGMERGY can always be read back to."
links:
  - target: "[[STIGMERGY]]"
    type: spawned
    label: realized-as-the-running-system
  - target: "[[Swarm Weave]]"
    type: enables
  - target: "[[Pheromone Trail]]"
    type: mirrors
  - target: "[[Trickster]]"
    type: connects-to
  - target: "[[Palace Map]]"
    type: connects-to
  - target: "[[Enchanted Worker]]"
    type: enables
  - target: "[[Palace Enchantment]]"
    type: enables
  - target: "[[Striatum]]"
    type: connects-to
  - target: "[[Pages as Agents]]"
    type: deepens
    label: stigmergic-agent-activation
  - target: "[[BBS Design System]]"
    type: spawned
    label: visual-form
  - target: "[[Project Stewardship System]]"
    type: enables
    label: routine-stewardship-substrate
  - target: "[[Oblique Enrichment]]"
    type: connects-to
    label: review-surface-and-stigmergy-medium
  - target: "[[Semantic Webcam]]"
    type: connects-to
    label: stigmergy-surface
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: connects-to
---

# BBS Blackboard

![[BBS Blackboard — hero.png]]

> **Historical root.** This entry is the *concept* — the architecture and philosophy that named the palace's coordination substrate. The *running system* it became is [[STIGMERGY]] (canonical, type `meta`), and the message grammar is now ratified in [[SCHEMA]] §9. Read this for the why and the origin; read [[STIGMERGY]] for what operates today and [[Palace Agent Infrastructure Spec]] for the wire spec.

Parallel agents have no shared context window. Each lives in its own isolated inference call. There is no native peer-to-peer channel between Claude API calls running simultaneously. The usual solution is a coordinator: a central agent that receives all messages and routes them. But coordinators are bottlenecks, single points of failure, and — more importantly — they contradict the palace's commitment to **distributed, stigmergic intelligence**.

The BBS Blackboard solves peer-to-peer agent communication without a coordinator, by modeling the structural logic of the **Bulletin Board System** — one instantiation of a much older principle of stigmergic trace-leaving that includes petroglyph message stones, trading post message trees, and ant pheromone trails.

## The Model

A BBS was a computer you dialed into. You left messages. Others dialed in later and read them. Replies accumulated. Threads formed. The board was the medium. Nobody was coordinating — the structure emerged from the messages themselves. The board was not a router; it was a **shared substrate** that carried traces of everyone who had passed through.

The palace's blackboard is this, implemented as an **append-only `.jsonl` file** (one JSON object per line, no array wrapper) at a known path:

```
/palace/swarm/sessions/[session-id]/blackboard.jsonl
```

Every agent in a swarm session can read the full blackboard at any moment. Every agent writes by appending a message object. No agent overwrites, deletes, or edits. The board is a permanent record. When the session closes, it is archived with its session ID. A parallel **persistent blackboard** at `/palace/swarm/persistent/blackboard.jsonl` carries unresolved FLAGS and standing concerns across session boundaries.

Context cost is manageable: a session with 6 agents generating 3–5 messages each produces 18–30 message objects. At 100–200 tokens per message, that is under 6,000 tokens — less than 3% of a 200k context window. The `.jsonl` format and read cursor (agents read only from their last-read position forward) keeps cost bounded as sessions grow.

## The JSON Structure

Each line of `blackboard.jsonl` is a complete message object. The `health` block is written by the orchestrator from API response metadata — not by the agent itself:

```json
{
  "schema_version": "1.0",
  "id": "msg-001",
  "ts": "2026-03-28T14:23:05Z",
  "session_id": "swarm-2026-03-28-001",
  "from": "STRIATUM-7",
  "to": "*",
  "type": "BROADCAST",
  "board": "GENERAL",
  "health": {
    "context_pct": 0.18,
    "stop_reason": "tool_use",
    "iteration": 1,
    "tokens_this_call": 312,
    "model": "qwen3:14b",
    "score": "green"
  },
  "payload": {
    "content": "SPINNING UP. HOME: [[STRIATUM]]. 6 TYPED LINKS LOADED. READING MAP."
  }
}
```

## Board Routing

Messages carry a `board` field — agents self-select which board to write to. No routing logic needed. The board selection is declarative:

| Board | Purpose |
|---|---|
| `GENERAL` | Peer-to-peer agent communication, discoveries, acknowledgments |
| `FLAGS` | Connections worth weaving, high-priority findings, proposed new entries |
| `WEAVE` | Traversal reports, work completion, synthesis-ready signals |
| `SYSTEM` | Coordinator-only: session init, shutdown, manifest, configuration |
| `TRICKSTER` | Loudon's messages and agent replies to Loudon; resource requests and grants |
| `BRANCHES` | Branch exploration results for coordinator reconciliation |

The `FLAGS` board is the blackboard's most important signal surface. The `TRICKSTER` board is the threshold between the human operator and the autonomous agents.

## Agent Addressing

The spawn manifest, written by the coordinator before any workers launch, gives every agent a stable ID for the session. IDs follow the pattern `ENTRYNAME-N`. The TRICKSTER is always a special entry:

```json
{ "id": "TRICKSTER", "home": "YOU", "neighborhood": "EVERYWHERE" }
```

Whether "YOU" is Loudon or an automated agent is an operational decision, not an architectural one.

## The Permission Protocol

Agents post `RESOURCE_REQUEST` messages to the TRICKSTER board for anything outside their baseline tool registry. The request carries a `blocking` flag (true: suspend this thread; false: continue regardless). The Trickster responds with `RESOURCE_GRANT` or `RESOURCE_DENY`, correlated via `re: [request_id]`. `model_upgrade` and `model_downgrade` are valid resource types in this protocol — API cost is real and belongs in the permission system.

## The Trickster Decision Inbox

The inbox is the filtered view of the TRICKSTER board: only pending requests without a response. Each pending item carries the agent's current health score and context percentage, and presents pre-built response options for fast disposition. Questions from agents can bubble up as multiple-choice prompts; the Trickster can click through many parallel agent questions quickly, unblocking many work threads in a single session.

## The BBS as Stigmergy

This is not just a message queue. It is a **stigmergic medium** — agents modifying a shared environment, whose modifications shape the behavior of subsequent agents who encounter them.

When `STRIATUM-7` writes a FLAG about a resonance with Kuramoto, it is depositing pheromone. When `LATERAL-9` reads the board before its own traversal and sees that flag, it may choose to approach the Kuramoto node obliquely — because the board told it that connection is already found. The agent was shaped by a trace left by a prior agent. Neither agent needed to communicate directly.

Where the [[Pheromone Trail]] entry describes permanent traces written back to the palace itself, the BBS Blackboard carries the ephemeral traces that live only within a single session. When the session ends, the blackboard archives — and whatever the swarm found worth keeping is deposited into the palace's permanent substrate. The persistent board bridges these timescales: carrying unresolved FLAGS forward into future sessions.

## The Human-Readable View

The blackboard's canonical form is `.jsonl`. But a swarm session generates many messages fast, and humans need to read them too — especially the TRICKSTER, who may want to intervene mid-session.

The BBS aesthetic makes this natural: render the blackboard as a **phosphor-green terminal bulletin board**. Each agent has a color. Message types have distinct visual signatures. The FLAGS board lights up amber. The TRICKSTER channel glows gold. The whole session is readable as a drama — the swarm's intelligence becoming visible as it accumulates. Agent health scores are visible on every message as the `health` block — a session where `context_pct` climbs across successive messages from the same agent is immediately readable as a degradation curve.

This is not decoration. The BBS aesthetic is epistemically appropriate: the blackboard is literally a bulletin board. The visual form mirrors the underlying architecture.

The [[BBS Design System]] (April 2026) resolves this section into a concrete implementation: a complete React component kit and CSS token system for STIGMERGY, the browser-based phosphor terminal. An earlier direction explored Python `curses` for a raw-terminal interface; that path is deferred in favor of a browser host that preserves the character-cell discipline without the constraints of OS terminal rendering. The curses approach remains viable for headless or SSH contexts and is not abandoned — just a parallel track.

## Agent Health on the Board

Every message carries a `health` block written by the orchestrator from API response metadata. This means:
- The Coordinator can track any agent's health across its full message history
- The Trickster can see at a glance whether an agent posting a request is at 18% or 84% context utilization
- Health degradation is a visible pattern on the board, not a hidden internal state

Health scores: **green** (context < 70%, no anomalies), **yellow** (context 70–85% or first violation), **red** (context > 85% or multiple violations). At yellow, the orchestrator can trigger context compression using the page's forward vector as the compression signal — preserving what advances the vector, collapsing what doesn't.

## Cross-Domain Resonance

**[[Pheromone Trail]]** — the BBS Blackboard is the session-scoped pheromone trail. The permanent trail is written into entry files. The session trail lives in the blackboard. Together they form the palace's two-timescale memory: the board for what is happening now; the entry for what was learned.

**[[Trickster]]** — the TRICKSTER channel is where Loudon's voice enters the swarm. The trickster operates at thresholds; the TRICKSTER channel is the threshold between the human operator and the autonomous agents. Loudon can broadcast to all agents, DM a specific worker, or simply observe. The blackboard knows no difference between a trickster message and an agent message — they are the same data structure. The trickster is just another node in the graph.

**[[Palace Map]]** — the map is what agents read *before* the session; the blackboard is what agents write *during* it. Map is pre-session topology; blackboard is in-session emergence.

**[[Enchanted Worker]]** — the enchanted worker gains its directional character from context loading before dispatch. The blackboard is how that character expresses itself socially: what it flags, what it replies to, what it asks for.

**[[Palace Agent Infrastructure Spec]]** — the complete technical specification for this architecture: message schema, board routing, permission protocol, health scoring, the Trickster inbox data structure, and all swarm modes built on top of it.

## Open Questions

- Should agents be able to `QUERY` the blackboard — searching for prior messages matching a pattern — or is read-all sufficient for palace swarm sizes?
- Agents following their own forward vectors will often need to ask the Trickster something and basically wait for a response before proceeding. The BBS gives a centralized place for this — perhaps the most important part of the BBS.

---
*"Stigmergy is a mechanism of indirect coordination between agents where the trace left by an action stimulates the performance of a subsequent action."* — Pierre-Paul Grassé, who named it watching termites

--- 
---
## Forward Vector
Create a beautiful and fun to use ASCII text interface for the Bulletin Board System: Codename Stigmergy. In the process we learn about creating cool ASCII interfaces, step by step.

**Phase 0 complete (2026-04-21):** [[BBS Design System]] deposited. Visual language established, component kit in place at `_ops/stigmergy/design-system/`. Next: Phase 1 — static prototype running locally with channel tabs and palace-appropriate seed data.

