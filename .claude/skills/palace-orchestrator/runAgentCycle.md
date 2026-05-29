# runAgentCycle — the §3.2 primitive (Claude-Code-resident)

One cycle of one agent's lifecycle. Both `songline.md` and `permanent.md` mode workflows call this. Your job, as the parent Claude Code session, is to translate a per-cycle manifest into a sub-agent dispatch, validate what comes back against §2.2, append valid messages atomically to the blackboard, and return cycle status.

## The shape of a clean cycle

Render the system prompt from the appropriate template (`songline` or `steward`) against the manifest's vars. Build a user-turn carrying the **home-entry body**, **neighborhood frontmatter only** (not full bodies — v0.1 default), the **relevant blackboard slice** (session-filtered for songline; since-`last_read_cursor` for permanent), and a `PAGE_UPDATE_NOTICE` if `check-page` returned `changed: true`. Fold system prompt + user turn into a single `prompt` arg (Claude Code subagents don't expose system-prompt override). Dispatch via the Agent tool. Parse JSON code-fence blocks from the response. Inject a fresh `health` block built from the Agent tool's reported usage. Validate each message. Append the valid ones. That is the whole cycle.

## Hard rules (do not violate)

- **Validate the manifest first** with `palace-orch validate`. If it fails, stop — do not dispatch.
- **Permanent stewards only:** run `palace-orch register-check` before first spawn. If `forward_vector` has changed since `state.last_active`, stop and post a `DIRECTIVE_REQUEST` (RESOURCE_REQUEST type with `payload.directive: true`) to the TRICKSTER board instead of dispatching. Songline workers skip both checks.
- **The orchestrator stamps the `health` block** as a Path-2 stub per Infrastructure Spec §3.3.1: `{score: "green", model, _orchestrator_metadata.dispatch_mode: "claude-code-subagent"}`. The subagent does not write its own health. Strip any `health` field the subagent emits and replace with one constructed via `palace-orch health '{"model": "..."}'`. The per-call usage fields (`context_pct`, `tokens_this_call`, etc.) are deliberately omitted in Path 2 — they were approximate heuristics, not authoritative signal. Score is always `"green"` in Path 2; real escalation needs Path 1 (API-direct dispatch with real `input_tokens` per call).
- **Strict §2.2 enforcement is non-negotiable.** Run `palace-orch validate-message --prior-board <bb> --agent-id <id>` on every outgoing message before append. Drop the rejected ones; valid ones in the same batch still proceed to append.
- **`agent_id` defaults to `home`** (the page title — Finding 11). Do not invent compound handles like `GSL-STEWARD` or `KURAMOTO-1`.
- **`request_id` is top-level** on RESOURCE_REQUEST, never inside `payload` (Gap 9 — highest-priority spec gap).
- **One retry max** on a malformed dispatch. Use conversational framing on the retry, not "system override" / "RETRY" framing — that triggers the subagent's prompt-injection defenses (Phase 4 surface, `ORCHESTRATOR-V0.1-COMPLETE.md` Decision #5).

## Helpers available

CLI at `_ops/stigmergy/orchestrator/src/cli.js` — invoke as `node _ops/stigmergy/orchestrator/src/cli.js <cmd>`:

- `validate <manifest.json>` — §3.1 + v0.1 amendments
- `validate-message <msg.json> [--prior-board <path>] [--agent-id <id>]` — §2.2 strict + §3.4 posting discipline
- `append <msg.json> --target persistent --persistent-path <path> [--agent-id <id>] [--prior-board <path>]` — atomic append (re-validates before write)
- `register <id> <home> --dir <dir>` and `register-check <id> [--dir <dir>]` — Gap 7 uniqueness
- `check-page <entry-name> <since-iso>` — git-detected changes since last activation
- `health '{"model": "..."}'` — §2.2 Path-2 health stub (score: "green" + model + `_orchestrator_metadata.dispatch_mode: "claude-code-subagent"`)

System-prompt rendering (no CLI — fast enough for inline use):

```js
import { loadAndRender } from './_ops/stigmergy/orchestrator/src/prompts.js';
loadAndRender({ skillRoot, templateName: 'songline'|'steward', vars });
```

### Composite cycle helpers (durable — use these, do not re-improvise)

Two higher-level helpers compose the primitives above into the per-cycle work
the parent session would otherwise hand-roll. They are pure-cored and tested —
prefer them over ad-hoc scripts.

- `node _ops/stigmergy/orchestrator/src/build-cycle-prompt.js --dir <agent-dir> --cycle-n N [--extra-mandate "…"] [--today YYYY-MM-DD] [--out <path>]`
  Assembles the full prompt: the rendered `steward` system template plus the
  user turn (home body, injected state, history tail, board slice since the
  cursor, page-change notice, this cycle's mandate, output protocol). Writes the
  prompt to `--out` (defaults under `/tmp`) and prints the path. Feed that file
  to the Agent tool.

- `node _ops/stigmergy/orchestrator/src/process-cycle.js --transcript <jsonl> --agent-dir <dir> --cycle-n N --iteration I --ts-now <iso> [--model …] [--cycle-notes-key K --cycle-notes "…"]`
  Post-processes one cycle's subagent transcript: extracts the fenced BBS
  messages, stamps the Path-2 health stub, validates each via the posting
  surface, appends the valid ones, reconciles `pending_requests` against the
  board (resolving asks answered by a GRANT/DENY whose `re` matches), and
  updates `state.json` + `history.jsonl`. Prints a JSON summary (`posted_ids`,
  `invalid_ids`, `pending_after`, `resolved_count_after`).

These supersede the throwaway `/tmp/build-cycle-prompt.mjs` and
`/tmp/process-cycle-v2.mjs` from the 2026-05-27 batch (now promoted, with
tests). The pure pieces `extractMessagesFromTranscript` and
`reconcilePendingRequests` are exported for direct import.

## Stop conditions (return status, do not loop)

- Validator rejects three subagent dispatches in a row → likely template bug. Surface to Loudon, mark cycle `validator_rejected`, exit.
- A `RESOURCE_REQUEST` with `blocking: true` is posted → next agent on a songline cannot proceed. Surface to Loudon, exit.
- `forward_vector` changed (permanent only) → DIRECTIVE_REQUEST posted, exit with `forward_vector_changed`.
- Registry uniqueness conflict (permanent only) → exit with `registry_conflict`.

Otherwise return `cycle_complete` with the list of posted message ids and any `pending_requests`. The mode workflow decides whether to advance.

## Permanent agents only — state + history

After a successful permanent cycle, append `TOOL_CALL` / `AGENT_REASONING` / `CYCLE_COMPLETE` events to `<agent-dir>/history.jsonl` and update `<agent-dir>/state.json` (`iteration`, `last_active`, `last_read_cursor`, rolling `health`, `pending_requests`, `resolved_requests`). Songline workers do not have state files — their cycle state is captured by their messages on the blackboard.

## What this primitive does NOT do (deferred to v0.2)

Yellow-context compression. Branch exploration. Coordinator-as-subagent dispatch. `history.jsonl` compression. Dynamic mid-path adaptation.

---

The procedural / step-by-step version of this primitive lives at [`runAgentCycle.v1-procedural.md`](./runAgentCycle.v1-procedural.md) for reference and rollback. The thinned version above is the working spec as of session `songline-2026-05-04-002` — the rewrite test of whether the procedural rigidity was load-bearing or whether opus-class orchestration phase-locks against purpose + anti-patterns + helpers alone.
