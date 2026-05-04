# Permanent steward mode — one cycle of a long-duration agent

You are running the permanent steward mode of the palace orchestrator.
A permanent steward is a palace page operating as an ongoing agent that
advances its work one cycle at a time, across days or weeks of real time.
The agent has no clock; it wakes when invoked, reads everything that
happened since last activation, advances the work by one cycle, posts
status/blocks/questions to the BBS, and exits.

The reference pilot is **Generative Sample Libraries** (Stage A of
[[Project Stewardship System]]), which ran 3 hand-run cycles between
2026-05-03 and 2026-05-04 — the fixture snapshot lives at
`tests/fixtures/pilot-state/`. **Do not touch the live pilot at
`_ops/agents/permanent/generative-sample-libraries/`** during a smoke run
or a fresh build — Loudon's cycle 4 is reserved for him to run via the
skill manually.

## Inputs

The skill workflow gives you:

1. **An agent directory** — `_ops/agents/permanent/<name>/` containing
   `manifest.json`, `state.json`, `history.jsonl`.
2. **A model** — usually `opus` (richer voice over many cycles); override
   via the manifest.

## Workflow

### Step 1 — Confirm scope with Loudon

Before any dispatch, name the run in one sentence:

> "I'll advance the Generative Sample Libraries steward by one cycle.
> One sonnet/opus subagent, ~3 minutes. Confirm?"

Wait for explicit confirmation. Skip this only when Loudon's invocation
includes an explicit "go" or "run cycle N now".

### Step 2 — Load manifest, state, history

```bash
node _ops/stigmergy/orchestrator/src/cli.js validate <agent-dir>/manifest.json
```

Then read `state.json` and `history.jsonl` directly with the Read tool.
The state carries `last_active`, `last_read_cursor`,
`pending_requests`, `resolved_requests`, `iteration`, and a `stewardship`
sub-block with `stage_at_last_activation`, `vector_at_last_activation`.

### Step 3 — Registry uniqueness check

```bash
node _ops/stigmergy/orchestrator/src/cli.js register-check <agent_id> --dir <agent-dir>
```

If exit 1 (conflict with a different directory): surface and stop. If the
agent isn't registered yet (first activation), register it now:

```bash
node _ops/stigmergy/orchestrator/src/cli.js register <agent_id> <home> --dir <agent-dir>
```

### Step 4 — First-activation cursor handling (Gap 6)

If `state.last_read_cursor` is null/missing/empty, this is the agent's
first activation. Read the full persistent blackboard. After the cycle,
set the cursor to the actual `id` of the last line (NOT a pattern-match;
the genuine ID).

If `state.last_read_cursor` exists, the cursor-based partial read is
straightforward — read every line after the cursor.

### Step 5 — Page-change detection

```bash
node _ops/stigmergy/orchestrator/src/cli.js check-page <home> <state.last_active>
```

If the CLI returns `changed: true`, build a `PAGE_UPDATE_NOTICE` with the
commits and add it to the user-turn context for the agent to see. If the
agent's `forward_vector` (read directly from the entry frontmatter) is
different from `state.stewardship.vector_at_last_activation`:

1. Construct a TRICKSTER DIRECTIVE_REQUEST stating the vector changed.
   Append it to the persistent board.
2. Return `forward_vector_changed`. **Do not dispatch the subagent.**
   Loudon must respond before the next cycle runs.

### Step 6 — Build the system prompt

```js
import { loadAndRender } from './_ops/stigmergy/orchestrator/src/prompts.js';
const prompt = loadAndRender({
  skillRoot: '.claude/skills/palace-orchestrator',
  templateName: 'steward',
  vars: {
    home: manifest.home,
    cycle_id: manifest.cycle_id || `cycle-${state.iteration + 1}-<today>`,
    stage_at_last_activation: state.stewardship.stage_at_last_activation,
  },
});
```

### Step 7 — Build the user-turn context

The user turn includes:

1. **Your home entry's body** — read the file at `entryPath(home)`.
2. **Frontmatter of first-degree neighbors** (NOT bodies — v0.1 default).
3. **Your state file** — pending_requests, resolved_requests, iteration,
   stewardship block. Permanent agents need to know what's outstanding
   from prior cycles.
4. **Your history.jsonl** since last cycle's CYCLE_COMPLETE (so the agent
   can see any post-cycle FIX events from Loudon).
5. **PAGE_UPDATE_NOTICE** if step 5 produced one.
6. **The relevant blackboard slice** since `last_read_cursor` — focus on:
   - Messages addressed to you (`to: "<agent_id>"` or `to: "*"`)
   - TRICKSTER responses to your pending requests (`re:` matches your
     `pending_requests[].request_id`)
7. **Catch-up framing** explicitly: "You ran on `<state.last_active>`.
   The gap is invisible to you. Continue from where state shows."

Per the steward prompt template, the cycle's posture is dictated by
`state.stewardship.stage_at_last_activation`. Recursion within entries
applies — if the cycle is working a `seed` deliverable inside a `growing`
project, switch to seed-stage posture for that deliverable.

### Step 8 — Dispatch the subagent

Use the parent Claude Code session's `Agent` tool:

```
Agent({
  description: "<page> cycle <iteration+1>",
  subagent_type: "general-purpose",
  model: <"sonnet" | "opus" | "haiku">,    // from manifest.model.name
  prompt: <system prompt + divider + user-turn context>,
})
```

Lead the prompt with the rendered template (step 6), then `---`, then
the user-turn context (step 7). Output instructions: same as
`runAgentCycle.md` Step 7 — JSON code-fence blocks, one per message,
schema_version 1.0, no health block.

### Step 9 — Parse, validate, append

For each JSON block in the subagent's response:

1. Parse → check structure
2. Inject the orchestrator-built `health` block (from Agent-tool usage)
3. Validate via `palace-orch validate-message` (with `--prior-board` for
   duplicate-FLAG and SPINNING UP discipline checks)
4. Append via `palace-orch append --target persistent`

If 3 messages in a row fail validation, retry the dispatch ONCE with
sharpened prompt (feed back the specific errors). After one retry, mark
the cycle `validator_rejected` and exit.

**Special posting-discipline note for permanent agents:** the SPINNING UP
rule applies to the agent's first message *of this cycle's session*. For
permanent agents the `session_id` is the cycle_id (not a long-running
session_id), so each cycle starts fresh — every cycle posts a SPINNING UP
BROADCAST first. (This differs from the v0.2 STIGMERGY validator's
session-scoped check; the orchestrator handles it by passing
`prior_messages` filtered to only this cycle's messages.)

### Step 10 — Update state.json and history.jsonl

After the cycle:

1. Append events to `<agent-dir>/history.jsonl`:
   - `{event: "CYCLE_<N>_SPAWN", ts, note}`
   - `{event: "TOOL_CALL", ts, tool: "read_manifest" | "read_state" | "read_palace" | "read_blackboard_persistent" | "git_log", ...}`
   - `{event: "AGENT_REASONING", ts, summary}` — the agent's gist
   - `{event: "TOOL_CALL", ts, tool: "write_blackboard", message_id, ...}` — one per message
   - `{event: "CYCLE_COMPLETE", ts, iteration, stop_reason, posted_messages, pending_requests, stage_a_claims_validated?}`

2. Update `<agent-dir>/state.json`:
   - `iteration` += 1
   - `last_active` = now ISO
   - `last_read_cursor` = ID of the last-read blackboard message
   - `health` = the rolling-window state.health summary (NOT message-level)
   - `pending_requests` = update with this cycle's new RESOURCE_REQUESTs;
     remove any that got TRICKSTER responses
   - `resolved_requests` = append any newly-resolved requests
   - `stewardship.stage_at_last_activation` = current stage (read from
     home frontmatter — may have changed since last cycle)
   - `stewardship.vector_at_last_activation` = current vector
   - `stewardship.vector_changed_since_last` = boolean
   - `stewardship.stage_changed_since_last` = boolean
   - `stewardship.page_updates_observed_since_last` = the commits from
     step 5 (or empty array)

### Step 11 — Return cycle status

```js
{ status: "cycle_complete", iteration, posted_messages, pending_requests }
{ status: "blocked", reason: "validator_rejected", attempts }
{ status: "blocked", reason: "blocking_request_pending", request_id }
{ status: "forward_vector_changed", action: "consult_trickster" }
```

### Step 12 — Surface result to Loudon

A 1-2 sentence synthesis: what the agent said, what it asked, where to
respond. Plus the STIGMERGY pointer.

## Stage-conditional posture summary

The agent's behavior comes from the prompt template (`steward.md`), which
loads the stage-conditional posture table. Your job at this skill level
is to make sure the right stage is reported in the prompt vars — that's
why Step 6 sets `stage_at_last_activation` from `state.json` (NOT from
the entry's current frontmatter; the agent sees the stage *as it was* at
last activation, with stage drift surfaced via the page-update notice in
step 5).

## Cycle-by-cycle continuity

What survives between cycles:

| Survives | Lives in |
|---|---|
| Pending RESOURCE_REQUESTs | state.json `pending_requests` |
| Resolved decisions | state.json `resolved_requests` |
| Cursor advance | state.json `last_read_cursor` |
| Iteration count | state.json `iteration` |
| Health rolling window | state.json `health` |
| Full reasoning record | history.jsonl |
| Posted messages | _ops/swarm/persistent/blackboard.jsonl |

What does NOT survive:

- Working memory, scratchpad, intermediate deliberation. The next cycle
  reads only the artifacts above. If a thought needs to persist, it must
  be in history.jsonl or the BBS.
- Context window state. Each cycle is a fresh subagent.

## Failure modes

| Failure | Response |
|---|---|
| Subagent returns malformed JSON | One retry with sharpened prompt; then `validator_rejected`. |
| §2.2 rejection on a posted message | Drop that message; valid messages still append. Log. |
| RESOURCE_REQUEST with `blocking: true` posted | Cycle complete. State carries the pending request forward. Surface to Loudon: response needed before next cycle. |
| forward_vector changed since last activation | Stop dispatch. Post DIRECTIVE_REQUEST. Loudon must respond. |
| REGISTRY conflict on first activation | Stop. The agent_id is taken by a different directory. Either rename the agent or move the conflicting directory. |
| Stage shifted to `dormant` or `composting` | Per [[Substrate Skill]] § Stage as Alignment Confidence: "Don't touch — Spore Check ceremony only" / composting protocol. Cycle should not run. Surface to Loudon. |

## What this mode does NOT do (deferred to v0.2-orchestrator)

- **Generative compression of history.jsonl.** Permanent agents'
  history grows indefinitely. Compression policy is v0.2.
- **Cron / daemon scheduling.** Cycles run on Loudon's invocation only.
  Scheduled execution requires Path 1 (API key); out of scope for v0.1.
- **Multi-cycle batches.** One cycle per invocation. Loudon can re-invoke
  for cycle N+1.
- **Deposit ceremony automation.** When a steward proposes a page edit,
  it goes through the human Deposit Ceremony — the orchestrator does not
  write directly to the home entry.
- **Automated trickster.** Loudon responds to RESOURCE_REQUESTs
  manually (file edit or STIGMERGY click-to-respond).
