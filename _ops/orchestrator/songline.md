# Songline mode — sequential dispatch through a named path

You are running the songline mode of the palace orchestrator. A songline
walks a named path of palace entries, dispatching each entry as a Claude
Code subagent in order, threading the prior agents' messages forward as
the pheromone trail.

The reference run is `songline-2026-05-04-001`
(Cooperation → Kuramoto → Hilaritas, 14 §2.2-conformant messages, 3
sonnet workers + a coordinator framing, total runtime ~15 minutes). It
lives at `_ops/swarm/persistent/blackboard.jsonl` (snapshotted in
`_ops/stigmergy/orchestrator/tests/fixtures/blackboard/`).

## Inputs

The skill workflow gives you:

1. **A path** — an array of palace entry names, ordered.
2. **A session_id** — string, e.g. `songline-2026-05-04-002`. Generate
   one if Loudon does not name it: `songline-<YYYY-MM-DD>-<NNN>`.
3. **A model** — `sonnet` is the default for songline workers. Override
   via Loudon's invocation if specified.

## Workflow

### Step 1 — Confirm scope with Loudon

Before any dispatch, name the run in one sentence:

> "I'll dispatch a 3-step songline through Cooperation Yields Agency →
> Kuramoto Coupling → Hilaritas Generator. Three sonnet subagents, one
> per entry, ~15 minutes. Confirm?"

Wait for explicit confirmation. Real subagents cost real Anthropic credits.

### Step 2 — Resolve every entry on the path

For each entry name:

```bash
node _ops/stigmergy/orchestrator/src/cli.js check-page "<entry-name>" 2020-01-01T00:00:00Z
```

The CLI returns `{ resolved, changed, commits[] }`. If `resolved: null`
for any entry, the path contains an unresolvable name — surface to Loudon
and stop.

### Step 3 — Write SESSION_INIT

Build a SESSION_INIT message describing the path and dispatch plan, route
to the SYSTEM board:

```json
{
  "schema_version": "1.0",
  "id": "<session_id>-init",
  "ts": "<now-iso>",
  "session_id": "<session_id>",
  "from": "COORDINATOR",
  "to": "*",
  "type": "SESSION_INIT",
  "board": "SYSTEM",
  "payload": {
    "session_kind": "enchanted_songline",
    "path": ["A", "B", "C"],
    "trigger": "<Loudon's invocation phrase, verbatim>",
    "note": "Dispatched via palace-orchestrator skill v0.1."
  }
}
```

Build the health block with `palace-orch health` (use a small
representative usage shape — for SESSION_INIT, you the orchestrator
session are the writer, so `tokens_this_call` is your own Agent-tool
usage; default to `{total_tokens: 200, model: "claude-opus-4-7", iteration: 1}`
if exact usage is unknown).

Append:

```bash
node _ops/stigmergy/orchestrator/src/cli.js append <session-init.json> --target persistent
```

### Step 4 — Dispatch each agent on the path, in order

For each entry on the path (index `i`, total length `N`):

1. **Construct the per-cycle manifest** (validates against Phase 1's
   schema). For an entry at position `i`:

```json
{
  "agent_id": "<entry-name>",
  "home": "<entry-name>",
  "session_id": "<session_id>",
  "mode": "songline",
  "neighborhood": [<other entries on the path>, <one or two cross-cuts>],
  "model": { "provider": "anthropic", "name": "claude-sonnet-4-6", "endpoint": "https://api.anthropic.com/v1" },
  "tool_registry": ["read_palace", "read_blackboard_session", "write_blackboard"],
  "stopping_conditions": { "max_iterations": 1, "stop_on": ["WEAVE_posted", "cycle_complete"] },
  "blackboard_session_path": "_ops/swarm/persistent/blackboard.jsonl",
  "blackboard_persistent_path": "_ops/swarm/persistent/blackboard.jsonl",
  "partner_id": null,
  "trickster_mode": "human",
  "parallel_safe": true,
  "_songline_metadata": {
    "path": [<full path>],
    "step_number": <i + 1>,
    "next_agent_id": "<path[i + 1]>" or "COORDINATOR" if terminal
  }
}
```

Validate it:

```bash
node _ops/stigmergy/orchestrator/src/cli.js validate <manifest.json>
```

2. **Run runAgentCycle for this agent** (per `runAgentCycle.md`). The
   per-cycle workflow handles render-prompt → dispatch → parse →
   validate → append.

3. **Verify after each agent's cycle:**
   - Cycle returned `cycle_complete`
   - At least 2 messages from this agent are now on the persistent board
     (BROADCAST + at least one FLAG or hand-off)
   - The agent posted a hand-off on WEAVE addressed to the next agent on
     the path (or to COORDINATOR if terminal)

   If verification fails: log the gap, but continue. Do NOT block the
   next agent on a partial prior agent — this surfaces in the synthesis
   step.

4. **Give Loudon a one-sentence synthesis update** between agents:

   > "COOPERATION-1 done — sharpened that the path is one event seen from
   > three angles. Dispatching KURAMOTO-1 next."

   Single sentence, no ceremony. Loudon can hit Reload in STIGMERGY
   between agents to watch the pheromone trail accumulate.

### Step 5 — Write SESSION_CLOSE

After all agents on the path have run:

1. Read the session's complete blackboard slice (every message with
   `session_id == <session_id>`).
2. Construct a brief synthesis:
   - Agents that reported (which ones posted)
   - Total messages, messages per agent
   - RESOURCE_REQUESTs raised (if any)
   - One-sentence verdict: "phase-locked" / "annotated only" / "strained
     at <edge>" — the same verdict register the
     `songline-2026-05-04-001` SESSION_CLOSE used.
   - Deposit candidates: 1-3 items proposing palace edits this songline
     surfaced.
   - Open question to Trickster: one line for Loudon.

Build the SESSION_CLOSE message:

```json
{
  "schema_version": "1.0",
  "id": "<session_id>-close",
  "ts": "<now-iso>",
  "session_id": "<session_id>",
  "from": "COORDINATOR",
  "to": "*",
  "type": "SESSION_CLOSE",
  "board": "SYSTEM",
  "payload": { ... }
}
```

Append it.

### Step 6 — Surface final report to Loudon

A short final synthesis (3-5 sentences max) plus:

- The session_id and path
- Count of messages on the board
- Open RESOURCE_REQUESTs (if any) requiring his response
- Pointer to STIGMERGY: "Open localhost:5173 and click [3] WEAVE for the
  hand-offs, [2] FLAGS for the claims, or filter by session in the
  dropdown."

Stop. Do not loop.

## Posting discipline summary

- Every message: §2.2-conformant, validated by `palace-orch validate-message`
  before append.
- Health block: built by orchestrator from Agent-tool usage. Carries
  `_orchestrator_metadata.dispatch_mode: "claude-code-subagent"`.
- SESSION_INIT and SESSION_CLOSE: from `COORDINATOR` (the orchestrator
  itself), to `*`, on `SYSTEM` board.
- Worker arrival: from `<entry-title>`, to `*`, on `GENERAL`,
  type `BROADCAST`. (Finding 11 — page-title identity, no compound handles.)
- Worker FLAGs: from `<entry-title>`, to `*`, on `FLAGS`, type `FLAG`.
- Worker hand-off: from `<entry-title>`, to `<next-entry-title>` (or
  `COORDINATOR` for the terminal node), on `WEAVE`, type `BROADCAST`.

## Cost guardrails

- 3-entry songline → 3 sonnet subagents (~$0.10-0.30 in API spend) +
  the parent session's coordinator work.
- 5-entry songline → 5 sonnet subagents.
- Loudon's confirmation in Step 1 establishes the budget.

## Failure modes

| Failure | Response |
|---|---|
| Subagent returns malformed JSON | One retry with sharpened prompt; then mark `validator_rejected`, log, continue to next agent. |
| §2.2 rejection on a dispatched message | Drop that message; valid messages from same dispatch still append. Log. |
| RESOURCE_REQUEST `blocking: true` posted by an agent | Stop the songline. Surface to Loudon. The Trickster (Loudon) must respond before the next agent can run. |
| Three consecutive subagent dispatches return malformed output | Stop. Write status report. Likely a prompt-template bug. (Stop condition from Production Plan.) |
| Path entry name doesn't resolve to a palace file | Surface to Loudon. Suggest fixing the wikilink or adding the entry. |

## What this mode does NOT do

- **Parallel dispatch.** All agents on the path run sequentially in v0.1.
  Parallel weave is v0.2.
- **Mid-path adaptation.** The path is fixed at Step 1. Dynamic routing
  is v0.2.
- **Coordinator-as-subagent.** The skill itself plays Coordinator. A
  dedicated COORDINATOR subagent dispatch is v0.2.
- **Trickster automation.** Trickster mode is `human` — Loudon responds
  to RESOURCE_REQUESTs by editing the blackboard or using STIGMERGY's
  click-to-respond UI.
