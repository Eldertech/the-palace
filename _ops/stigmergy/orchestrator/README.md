# Palace Orchestrator — Helpers

Deterministic Node helpers for the **Palace Orchestrator v0.1** skill at
`.claude/skills/palace-orchestrator/`.

The skill (a Claude Code `SKILL.md` workflow) drives the model dispatch — it
calls a sub-agent for each cycle. These helpers handle everything that does
NOT need an LLM:

- **Manifest validation** against the Palace Orchestrator entry (Definitions of record) + v0.1 amendments
- **Outgoing-message validation** against SCHEMA §9 (re-uses STIGMERGY v0.2's
  strict validator) plus §3.4 posting discipline
- **Atomic append** to `.jsonl` blackboards
- **Health-block construction** from Agent-tool usage
- **Git page-change detection** for §3.2's pre-cycle check
- **Permanent-agent registry** (Gap 7 uniqueness)

Three **composite helpers** sit on top of the above — deterministic, no LLM —
and replace the throwaway `/tmp` scripts the 2026-05-27 batch session improvised:

- **`build-cycle-prompt.js`** — assemble a permanent steward's full cycle prompt
  (system template + user turn) from its dir + cycle number.
- **`process-cycle.js`** — post-process a cycle transcript: extract emitted BBS
  messages, health-stamp, validate, append, reconcile `pending_requests`, and
  update `state.json` + `history.jsonl`.
- **`enchant.js`** — enchant one project page as a permanent steward (the
  one-at-a-time act in `batch.md`).

## Status

**v0.1 complete** as of 2026-05-04. 97/97 unit + integration tests
green. Two real-subagent smoke tests passed (songline 2-step against
fixture entries; permanent cycle-4 against the GSL pilot snapshot).
Spec-validator OVERALL: pass on Phases 1, 3, 5 — conditional-pass on
Phase 2 (resolved when Phases 4-5 added the mode-workflow files SKILL.md
forward-references) and Phase 4 (two minor anomalies, neither blocking).

See [`ORCHESTRATOR-V0.1-COMPLETE.md`](./ORCHESTRATOR-V0.1-COMPLETE.md)
for the full close-out report and smoke-test recipe.

**Update 2026-05-27:** the three composite helpers above were promoted from the
batch session's `/tmp` scripts into `src/` with tests (transcript extraction
rewritten in pure JS — no more embedded python3; palace root made configurable).
33 tests added → **130/130 green**.

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

Composite cycle helpers (standalone scripts, not `cli.js` subcommands):

```bash
# Assemble a permanent steward's cycle prompt (writes to --out, defaults /tmp)
node src/build-cycle-prompt.js --dir _ops/agents/permanent/generative-sample-libraries \
  --cycle-n 14 --extra-mandate "…" --out /tmp/gsl-c14.txt

# Post-process a finished cycle transcript onto the board + state files
node src/process-cycle.js --transcript /tmp/gsl-c14-transcript.jsonl \
  --agent-dir _ops/agents/permanent/generative-sample-libraries \
  --cycle-n 14 --iteration 14 --ts-now 2026-05-28T09:00:00-04:00

# Enchant one project page as a permanent steward
node src/enchant.js "Generative Wavetable Libraries"
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
- `Palace development/Palace Orchestrator.md` — Definitions of record (manifest, git detection, dual-path health, options[] shape)
- `Palace development/Project Stewardship System.md` — Stage A lessons (9 gaps + 4 findings)
- `_ops/stigmergy/app/server/validator.js` — the imported SCHEMA §9 validator
- `.claude/skills/palace-orchestrator/SKILL.md` — runtime workflow
