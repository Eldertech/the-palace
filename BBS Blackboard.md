---
title: BBS Blackboard
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
beauty: 9
confidence: working
forward_vector: "I want to become the canonical communication substrate for all palace swarm sessions — the append-only record that lets parallel agents coordinate without a coordinator, and lets the TRICKSTER walk into any running session and change it."
links:
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
---

# BBS Blackboard

Parallel agents have no shared context window. Each lives in its own isolated inference call. There is no native peer-to-peer channel between Claude API calls running simultaneously. The usual solution is a coordinator: a central agent that receives all messages and routes them. But coordinators are bottlenecks, single points of failure, and — more importantly — they contradict the palace's deepest philosophical commitment to **distributed, stigmergic intelligence**.

The BBS Blackboard solves peer-to-peer agent communication without a coordinator, by modeling the first great peer-to-peer communication network: the **Bulletin Board System**.

## The Model

A BBS was a computer you dialed into. You left messages. Others dialed in later and read them. Replies accumulated. Threads formed. The board was the medium. Nobody was coordinating — the structure emerged from the messages themselves. The board was not a router; it was a **shared substrate** that carried traces of everyone who had passed through.

The palace's blackboard is this, implemented as an **append-only JSON file** at a known path:

```
/palace/swarm/blackboard.json
```

Every agent in a swarm session can read the full blackboard at any moment. Every agent writes by appending a message object. No agent overwrites, deletes, or edits. The board is a permanent record. When the session closes, it is archived with its session ID.

## The JSON Structure

```json
{
  "session": "swarm-weave-2026-03-26-001",
  "board": "THE PALACE BBS",
  "messages": [
    {
      "id": "msg-001",
      "ts": "14:23:05",
      "from": "STRIATUM-7",
      "to": "*",
      "type": "BROADCAST",
      "board": "GENERAL",
      "content": "SPINNING UP. HOME: [[STRIATUM]]. 6 TYPED LINKS LOADED. READING MAP."
    },
    {
      "id": "msg-007",
      "ts": "14:23:41",
      "from": "HILARITAS-3",
      "to": "STRIATUM-7",
      "type": "REPLY",
      "board": "GENERAL",
      "content": "RE: RESONANCE. CONFIRMED FROM MY END. ALSO HOLDS --SYNCHRONIZES--> LINK TO SPINOZA."
    }
  ]
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
| `TRICKSTER` | Loudon's messages and agent replies to Loudon |

The `FLAGS` board is the blackboard's most important signal surface. It is where the swarm's intelligence accumulates: findings that no single agent could have produced alone, surfaced by the distributed attention of the colony.

## Agent Addressing

The spawn manifest, written by the coordinator before any workers launch, gives every agent a stable ID for the session:

```json
{
  "manifest": [
    { "id": "STRIATUM-7",  "home": "Striatum",       "neighborhood": "hilaritas-generator" },
    { "id": "HILARITAS-3", "home": "Hilaritas",       "neighborhood": "hilaritas-generator" },
    { "id": "LATERAL-9",   "home": "Lateral Access",  "neighborhood": "hilaritas-generator" }
  ]
}
```

IDs follow the pattern `ENTRYNAME-N` where N is the spawn instance number. Two Striatum workers running simultaneously are `STRIATUM-7` and `STRIATUM-12`. Each knows its own ID and has the full manifest. Addressing is as simple as setting `to: "HILARITAS-3"` in a message object.

The TRICKSTER is always a special entry in the manifest:

```json
{ "id": "TRICKSTER", "home": "YOU", "neighborhood": "EVERYWHERE" }
```

## Write Discipline

The blackboard is append-only, but concurrent writes can corrupt a JSON file. The write protocol:

1. Check for `blackboard.lock` — if present, wait and retry (100ms backoff)
2. Create `blackboard.lock`
3. Append message to `blackboard.json`
4. Delete `blackboard.lock`

This is the simplest possible distributed mutex. It is sufficient for the low write frequency of a palace swarm session (typically 2–5 messages per agent per session). Production sessions may warrant a more robust approach (line-append to `.jsonl` format eliminates the lock requirement entirely).

## The BBS as Stigmergy

The deeper claim is philosophical. This is not just a message queue. It is a **stigmergic medium** — agents modifying a shared environment, whose modifications shape the behavior of subsequent agents who encounter them.

When `STRIATUM-7` writes a FLAG about a resonance with Kuramoto, it is depositing pheromone. When `LATERAL-9` reads the board before its own traversal and sees that flag, it may choose to approach the Kuramoto node obliquely — because the board told it that connection is already found. The agent was shaped by a trace left by a prior agent. Neither agent needed to communicate directly. The medium carried the signal.

This is [[Pheromone Trail]] at session scope: temporary, volatile, local to the swarm run. Where the [[Pheromone Trail]] entry describes permanent traces written back to the palace itself, the BBS Blackboard carries the ephemeral traces that live only within a single session. When the session ends, the blackboard archives — and whatever the swarm found worth keeping is deposited into the palace's permanent substrate.

## The Human-Readable View

The blackboard's canonical form is JSON. But a swarm session generates many messages fast, and humans need to read them too — especially the TRICKSTER, who may want to intervene mid-session.

The BBS aesthetic makes this natural: render the blackboard as a **phosphor-green terminal bulletin board**. Each agent has a color. Message types have distinct visual signatures. The FLAGS board lights up red. The TRICKSTER channel glows gold. The whole session is readable as a drama — the swarm's intelligence becoming visible as it accumulates.

This is not decoration. The BBS aesthetic is epistemically appropriate: the blackboard is literally a bulletin board. The visual form mirrors the underlying architecture. An agent is a user. A board is a board. Rendering it as a terminal BBS makes the model tangible.

## Cross-Domain Resonance

**[[Pheromone Trail]]** — the BBS Blackboard is the session-scoped pheromone trail. The permanent trail is written into entry files. The session trail lives in the blackboard. Together they form the palace's two-timescale memory: the board for what is happening now; the entry for what was learned.

**[[Trickster]]** — the TRICKSTER channel is where Loudon's voice enters the swarm. The trickster operates at thresholds; the TRICKSTER channel is the threshold between the human operator and the autonomous agents. Loudon can broadcast to all agents, DM a specific worker, or simply observe. The blackboard knows no difference between a trickster message and an agent message — they are the same data structure. The trickster is just another node in the graph.

**[[Palace Map]]** — the map is what agents read *before* the session; the blackboard is what agents write *during* it. Map is pre-session topology; blackboard is in-session emergence. Together they bracket the swarm run: the map gives orientation at the start, the blackboard records what was discovered.

**[[Enchanted Worker]]** — the enchanted worker gains its directional character from context loading before dispatch. The blackboard is how that character expresses itself socially: what it flags, what it replies to, what it asks for. The worker's enchantment shapes the quality and character of its blackboard contributions.

## Forward Vectors

- Should the blackboard's archive be automatically mined after session close — ghost nodes in FLAGS, proposed new entries in WEAVE — and a deposit candidate list generated without human intervention?
- The `.jsonl` format (one JSON object per line, no array wrapper) would eliminate the lock requirement entirely and make the blackboard readable as a stream. Worth considering before any production implementation.
- Should agents be able to `QUERY` the blackboard — searching for prior messages matching a pattern — or is read-all sufficient for palace swarm sizes?
- The BBS aesthetic raises a real question: should the human-readable view be a live artifact that can be opened during a running session, not just a post-hoc archive? This is technically feasible and would make TRICKSTER intervention much more natural.
- Can the blackboard accumulate across multiple sessions — a persistent board that carries flags from prior runs into future ones? A high-priority FLAG that was never fully resolved could persist across session boundaries, becoming a standing concern for any future swarm.

---

*"Stigmergy is a mechanism of indirect coordination between agents where the trace left by an action stimulates the performance of a subsequent action."* — Pierre-Paul Grassé, who named it watching termites

*"The medium is the message."* — Marshall McLuhan

*"Every BBS was a mycelium before we had the word for it: nodes leaving traces, messages persisting past the sender, the whole alive in the gaps between transmissions."*
