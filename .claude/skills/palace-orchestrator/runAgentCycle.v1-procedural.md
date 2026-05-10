# runAgentCycle — the §3.2 primitive (Claude-Code-executable)

This file describes one cycle of one agent's lifecycle. Both `songline.md`
and `permanent.md` mode workflows call this. It is the §3.2
`runAgentCycle` sketch from the Infrastructure Spec, made concrete for the
Path 2 (Claude-Code-resident) architecture.

The cycle has 11 steps. Steps 1, 2, 3, 9, 10, 11 are deterministic — they
call the `palace-orch` CLI. Steps 5, 6, 7, 8 require LLM judgment — they
are your job (the parent Claude Code session running the skill).

The CLI lives at `_ops/stigmergy/orchestrator/src/cli.js`. Invoke it as:

```bash
node _ops/stigmergy/orchestrator/src/cli.js <command> [args]
```

All commands print machine-readable JSON. Exit codes: `0` ok, `1` invalid,
`2` usage error. Parse stdout with care; surface stderr to Loudon when it
appears.

---

## Inputs

A single per-cycle manifest object (already validated). It has at minimum:

- `agent_id` (defaults to `home` per Finding 11)
- `home` (the palace entry name)
- `mode` (`songline` or `long_duration_background`)
- `session_id` (string for songline, may be null for permanent)
- `cycle_id` (optional; permanent agents use it instead of session_id)
- `model.name`, `model.provider`, `model.endpoint`
- `tool_registry`, `stopping_conditions`
- `blackboard_persistent_path`
- For songline: `_songline_metadata.path`, `step_number`, `next_agent_id`
- For permanent: `stewardship.stage_at_spawn`, `stewardship.vector_at_spawn`,
  agent directory path

Plus a state object (loaded from `state.json` for permanent agents; ephemeral
for songline workers) carrying `last_active`, `last_read_cursor`,
`pending_requests`, `iteration`.

## Step 1 — Validate the manifest

```bash
node _ops/stigmergy/orchestrator/src/cli.js validate <manifest-path>
```

If exit 1: print the errors to Loudon and stop. Do not proceed to dispatch.

## Step 2 — Registry uniqueness check (permanent only)

```bash
node _ops/stigmergy/orchestrator/src/cli.js register-check <agent-id> --dir <agent-dir>
```

If exit 1 (conflict): surface the conflict and stop. If this is the first
spawn for this agent, `register` (write the entry):

```bash
node _ops/stigmergy/orchestrator/src/cli.js register <agent-id> <home> --dir <agent-dir>
```

Songline workers skip this step entirely — they do not register.

## Step 3 — Detect page changes since last activation

```bash
node _ops/stigmergy/orchestrator/src/cli.js check-page <home-entry-name> <state.last_active-iso>
```

The CLI returns `{ resolved, changed, commits[] }`. If `changed: false`,
proceed to step 4.

If `changed: true`, build a `PAGE_UPDATE_NOTICE` and add it to the user-turn
context (step 6).

## Step 4 — Forward-vector drift check (permanent only)

If page changes were detected in step 3, compare the current
`forward_vector` (read directly from the entry's frontmatter) against
`state.stewardship.vector_at_last_activation`. If different:

1. Construct a `DIRECTIVE_REQUEST` (RESOURCE_REQUEST type with
   `payload.directive: true` until §2.3 introduces a dedicated type) to
   TRICKSTER stating the vector changed and requesting Loudon's directive.
2. Append it via step 9-10.
3. Return `{ status: "forward_vector_changed", action: "consult_trickster" }`.

Do **not** dispatch the subagent. The cycle exits here.

## Step 5 — Build the system prompt

Render the relevant prompt template. Use the `palace-orch` CLI **only for
deterministic operations** — prompt rendering happens via the `prompts.js`
helper module imported into a small Node one-liner:

```bash
node --input-type=module -e "
  import('./_ops/stigmergy/orchestrator/src/prompts.js').then(m => {
    const out = m.loadAndRender({
      skillRoot: '.claude/skills/palace-orchestrator',
      templateName: '<songline|steward>',
      vars: <manifest-vars>,
    });
    process.stdout.write(out);
  });
"
```

Or just call it from the Read tool against the rendered output. (For Phase
3 the deterministic CLI does NOT expose a `render-prompt` command — that
operation is fast enough for inline use.)

The template `vars` object includes:

For songline:
```
{
  home: manifest.home,
  session_id: manifest.session_id,
  path_description: manifest._songline_metadata.path.join(' -> '),
  step_number: manifest._songline_metadata.step_number,
  step_total: manifest._songline_metadata.path.length,
  next_agent_id: manifest._songline_metadata.next_agent_id || 'COORDINATOR',
}
```

For steward:
```
{
  home: manifest.home,
  cycle_id: manifest.cycle_id,
  stage_at_last_activation: state.stewardship.stage_at_last_activation,
}
```

## Step 6 — Build the user-turn context

The user turn carries everything the agent needs to act:

1. **The home entry's body** — read with `Read` from the resolved file path.
2. **Frontmatter of first-degree neighbors** — for each entry name in
   `manifest.neighborhood`, read the file with Read, extract the frontmatter,
   include the title + frontmatter only (NOT the body). This is the v0.1
   default to keep context bounded.
3. **The relevant blackboard slice:**
   - For songline: every message with `session_id == manifest.session_id`.
   - For permanent: messages since `state.last_read_cursor`. On first
     activation (no cursor), the full board is loaded and the cursor will
     be set to the actual last-line `id` after the cycle (Gap 6).
4. **PAGE_UPDATE_NOTICE** if step 3 produced one.
5. **Pending-request review** (permanent only): the agent's
   `state.pending_requests` and `state.resolved_requests` so it can act on
   any newly-resolved requests.

Format the user turn as a single text payload that includes labeled
sections — markdown headers, code-fenced blackboard messages,
explicit "your home entry:" and "your neighborhood:" labels.

## Step 7 — Dispatch the subagent

Use the parent Claude Code session's `Agent` tool:

```
Agent({
  description: "<one-line per-cycle description>",
  subagent_type: "general-purpose",
  model: <"sonnet"|"opus"|"haiku">,    // from manifest.model.name
  prompt: <user-turn context from step 6>,
  // The system prompt from step 5 cannot be set directly on the Agent tool
  // — Claude Code subagents don't expose system-prompt override. So fold
  // step 5's content into the head of the prompt: "You are the page X
  // operating as a songline worker. <render>. Your task: <user turn>."
})
```

**Important:** the Agent tool takes a single `prompt`. The skill-shaped
distinction between system prompt and user turn collapses into a single
message at dispatch time. Lead with the rendered template (step 5),
then a divider, then the user-turn context (step 6).

The subagent returns its work as a free-text response. Within the response
it should produce one or more JSON blocks containing §2.2-conformant
messages — instruct it explicitly:

> "Output your messages as JSON code-fence blocks, one per message, in the
> order you want them appended. Do not include the `health` block — the
> orchestrator will fill it in. Use this skeleton:
> ```json
> { "schema_version": "1.0", "id": "<unique-id>", "ts": "<iso-now>", ... }
> ```"

## Step 8 — Parse the subagent's output

Extract every JSON code-fence block from the subagent's response. For each
block:

1. Parse it.
2. Inject the `health` block (step 9 — depends on usage data the Agent tool
   surfaces in its result).
3. Validate (step 10).
4. Append (step 11).

If parsing fails on any block: log the failure, retry the dispatch ONCE
with a sharpened prompt ("your previous output had a JSON parse error in
block N — fix it and resubmit the entire response"). If the second attempt
also fails: mark the cycle `{ status: "blocked", reason:
"validator_rejected" }` and return.

## Step 9 — Build the health block

Construct the §2.2-conformant `health` block from the Agent tool's reported
usage:

```bash
node _ops/stigmergy/orchestrator/src/cli.js health '{
  "total_tokens": <usage.total_tokens>,
  "model": "<manifest.model.name>",
  "stop_reason": "end_turn",
  "iteration": <state.iteration + 1>
}'
```

The CLI's `health` command emits a `_orchestrator_metadata.dispatch_mode:
"claude-code-subagent"` flag automatically. Inject the returned `health`
block into every parsed message from step 8.

If the agent's output is a `HEALTH_NOTICE` itself, build the block as
above and merge — the agent does not write the health block, the
orchestrator does (Decisions table).

## Step 10 — Validate every outgoing message

```bash
node _ops/stigmergy/orchestrator/src/cli.js validate-message <msg.json> \
  --agent-id "<manifest.agent_id>" \
  --prior-board <blackboard.jsonl>
```

If exit 1: surface the errors. Drop the offending message; valid messages
in the same batch still proceed to step 11. Log the rejection.

If three consecutive messages fail validation, retry the dispatch with the
specific errors fed back — sharpened prompt. After one retry, mark the
cycle `validator_rejected` and exit.

## Step 11 — Append valid messages atomically

```bash
node _ops/stigmergy/orchestrator/src/cli.js append <msg.json> \
  --target persistent \
  --persistent-path "<manifest.blackboard_persistent_path>" \
  --agent-id "<manifest.agent_id>" \
  --prior-board "<manifest.blackboard_persistent_path>"
```

The CLI re-validates before append (defense in depth) and writes one line
per call.

## Step 12 — Update state and history (permanent only)

For permanent agents, after the cycle:

1. Append events to `<agent-dir>/history.jsonl`:
   - `{event: "TOOL_CALL", ts, tool: "read_palace", ...}`
   - `{event: "AGENT_REASONING", ts, summary: "<3-5 sentence summary of
     what the agent surfaced>"}`
   - `{event: "TOOL_CALL", ts, tool: "write_blackboard", message_id, ...}`
     (one per message written)
   - `{event: "CYCLE_COMPLETE", ts, iteration, stop_reason,
     posted_messages, pending_requests}`

2. Update `<agent-dir>/state.json`:
   - `iteration` += 1
   - `last_active` = now ISO
   - `last_read_cursor` = ID of the last-read blackboard message
   - `health` = the rolling-window state.health summary (NOT the message-
     level health — they are different shapes per §3.3)
   - `pending_requests` = any RESOURCE_REQUESTs this cycle posted that are
     still unresolved
   - `resolved_requests` = append any newly-resolved requests

Songline workers do not update state files — their per-cycle state is
captured by their messages on the blackboard.

## Step 13 — Return cycle status

The cycle returns one of:

```js
{ status: "cycle_complete", iteration, posted_messages: [...] }
{ status: "blocked", reason: "validator_rejected", attempts: N }
{ status: "blocked", reason: "blocking_request_pending", request_id }
{ status: "forward_vector_changed", action: "consult_trickster" }
{ status: "registry_conflict", conflict: {...} }
```

The mode workflow (`songline.md` or `permanent.md`) inspects this status
and decides whether to advance to the next cycle, stop the songline, or
surface to Loudon.

## What the orchestrator does NOT do (deferred to v0.2-orchestrator)

- **Yellow-context compression** (§3.3 yellow). The hook is wired in (step 9
  reports yellow scores via `HEALTH_NOTICE`) but no compression pass runs in
  v0.1. Yellow → log + post HEALTH_NOTICE; red → log + stop and consult.
- **Branch exploration** (§10.2). One subagent per cycle. Branch dispatch
  is v0.2.
- **Coordinator agent dispatch.** The skill itself plays the Coordinator
  role for songlines (writing SESSION_INIT/CLOSE). A dedicated Coordinator
  subagent is deferred.
- **Generative-compression on history.jsonl.** Permanent agents'
  history.jsonl grows indefinitely. Compression policy is v0.2.

## Self-check before dispatching

Before step 7, mentally verify:

1. The user-turn context fits — neighbor frontmatters only, no whole-body
   neighbor expansion unless the prompt explicitly names a needed body.
2. The agent has read access (in its tool registry) for everything you put
   in the user turn. If you're loading a session board for an agent whose
   tool_registry lacks `read_blackboard_session`, that's a manifest bug.
3. The model in `manifest.model.name` exists in `MODEL_CONTEXT_LIMITS`. If
   not, the health-block build will use the 200k default and warn.
4. `manifest.agent_id` is non-empty. If it defaulted to `home` per Finding
   11, that's correct.

If any check fails: stop, fix the manifest, re-dispatch.
