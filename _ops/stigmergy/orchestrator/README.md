# Palace Orchestrator — Helpers

Deterministic Node helpers for the **Palace Orchestrator v0.1** skill at
`.claude/skills/palace-orchestrator/`.

The skill (a Claude Code `SKILL.md` workflow) drives the model dispatch — it
calls a sub-agent for each cycle. These helpers handle everything that does
NOT need an LLM:

- **Manifest validation** against Infrastructure Spec §3.1 + v0.1 amendments
- **Outgoing-message validation** against §2.2 (re-uses STIGMERGY v0.2's
  strict validator) plus §3.4 posting discipline
- **Atomic append** to `.jsonl` blackboards
- **Health-block construction** from Agent-tool usage
- **Git page-change detection** for §3.2's pre-cycle check
- **Permanent-agent registry** (Gap 7 uniqueness)

## Status

**v0.1 complete** as of 2026-05-04. 97/97 unit + integration tests
green. Two real-subagent smoke tests passed (songline 2-step against
fixture entries; permanent cycle-4 against the GSL pilot snapshot).
Spec-validator OVERALL: pass on Phases 1, 3, 5 — conditional-pass on
Phase 2 (resolved when Phases 4-5 added the mode-workflow files SKILL.md
forward-references) and Phase 4 (two minor anomalies, neither blocking).

See [`ORCHESTRATOR-V0.1-COMPLETE.md`](./ORCHESTRATOR-V0.1-COMPLETE.md)
for the full close-out report and smoke-test recipe.

## CLI usage

```bash
# Validate a manifest
node src/cli.js validate ../../agents/permanent/generative-sample-libraries/manifest.json

# Validate an outgoing message
node src/cli.js validate-message message.json --agent-id "Generative Sample Libraries"

# Append a validated message
node src/cli.js append message.json --target persistent

# Register a permanent agent (Gap 7 uniqueness)
node src/cli.js register "My Agent" "My Home Page" --dir /path/to/agent

# Check page changes
node src/cli.js check-page "Generative Sample Libraries" 2026-05-03T18:30:00Z

# Build a health block from Agent-tool usage
node src/cli.js health '{"total_tokens": 5000, "model": "claude-sonnet-4-6"}'
```

All commands print machine-readable JSON to stdout. Exit codes:

- `0` — ok / valid
- `1` — invalid (validation failure with `errors[]`)
- `2` — usage / I/O error

## v0.1 amendments to §3.1

| Amendment | Effect |
|---|---|
| Gap 1: nullable `session_id` | `long_duration_background` mode may have `session_id: null` and a top-level `cycle_id` instead |
| Gap 2: `blackboard_session_path` ignored on permanent | Field may be `null` for permanent agents |
| Gap 6: cursor on first activation | Read full board, set cursor to actual last-line `id` |
| Gap 7: agent-ID uniqueness | `_ops/agents/permanent/REGISTRY.json` checked at spawn |
| Gap 9: `request_id` location | **Top-level field** on RESOURCE_REQUEST (not inside payload) |
| Finding 11: `agent_id` default | Defaults to `manifest.home` (page title) when omitted |

## Helper-to-skill contract

The skill's workflow files (`SKILL.md`, `songline.md`, `permanent.md`,
`runAgentCycle.md`) call `palace-orch <command>` for every operation that
does not require LLM judgment. Operations that DO require LLM judgment
(building the system prompt, building the user-turn context, dispatching
the subagent, deciding what to write) are the skill's job — they happen
inside Claude Code's runtime, not here.

Single source of truth for §2.2 schema enforcement: `posting.js` imports
`../../app/server/validator.js` directly. STIGMERGY v0.2 owns the validator;
the orchestrator re-uses it.

## Testing

```bash
npm install
npm test                  # full vitest run
npm run check:phase-1     # phase-1 gate
npm run check:all         # cumulative gate
```

Fixtures:

- `tests/fixtures/manifests/` — sample manifests (songline + permanent + invalid)
- `tests/fixtures/pilot-state/` — snapshot of the live GSL pilot (Phase 5 fixture)
- `tests/fixtures/blackboard/` — clean songline-2026-05-04-001 (14 §2.2-conformant messages)

## See also

- `Palace development/Orchestrator Production Plan.md` — build contract
- `Palace development/Palace Agent Infrastructure Spec.md` — §3 architecture
- `Palace development/Project Stewardship System.md` — Stage A lessons (9 gaps + 4 findings)
- `_ops/stigmergy/app/server/validator.js` — the imported §2.2 validator
- `.claude/skills/palace-orchestrator/SKILL.md` — runtime workflow
