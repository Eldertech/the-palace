#!/usr/bin/env node
// smoke-permanent.js — Phase 5 smoke-test driver for permanent stewards.
//
// Resumes a permanent agent (cycle N+1) using a SNAPSHOT of the GSL pilot,
// not the live pilot. The snapshot lives at tests/fixtures/pilot-state/
// and was copied verbatim from _ops/agents/permanent/generative-sample-
// libraries/ at build time. The smoke test:
//
//   1. Copies the snapshot into a tmp working directory
//   2. Overrides the agent_id to `fixtures-stewards-test` (Gap 7 — avoid
//      REGISTRY conflict with the live agent)
//   3. Builds the per-cycle dispatch payload (system prompt + user-turn)
//   4. The build session dispatches the subagent
//   5. Absorb the response, validate, append to a smoke-test blackboard
//      (separate from the real persistent board)
//   6. Update tmp state.json + history.jsonl
//
// Usage:
//   node smoke-permanent.js prepare [--out <work-dir>]
//   node smoke-permanent.js dispatch [--out <prompt-path>]
//   node smoke-permanent.js absorb <response-path> --usage <usage.json>
//   node smoke-permanent.js report

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifest, loadManifest } from '../src/manifest.js';
import { loadAndRender } from '../src/prompts.js';
import { buildHealthBlock } from '../src/health.js';
import { validateForPosting } from '@stigmergy/core/schema';
import { appendMessage, readJsonl } from '@stigmergy/core/blackboard';
import { registerAgent, readRegistry } from '../src/registry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PALACE_ROOT = resolve(ROOT, '..', '..', '..');
const SKILL_ROOT = resolve(PALACE_ROOT, '.claude', 'skills', 'palace-orchestrator');

const PILOT_SNAPSHOT = resolve(ROOT, 'tests', 'fixtures', 'pilot-state');
const SMOKE_DIR = resolve(ROOT, 'tests', 'fixtures', 'permanent-smoke');
const WORK_DIR = resolve(SMOKE_DIR, 'work');
const SMOKE_BB = resolve(SMOKE_DIR, 'blackboard', 'smoke-permanent.jsonl');
const SMOKE_REGISTRY = resolve(SMOKE_DIR, 'REGISTRY.json');

const FIXTURE_AGENT_ID = 'fixtures-stewards-test';
const FIXTURE_HOME = 'Generative Sample Libraries';
const FIXTURE_CYCLE_ID = 'fixtures-cycle-4-2026-05-04';
const MODEL_NAME = 'claude-sonnet-4-6';

function cmdPrepare() {
  // Copy snapshot to working dir; rewrite agent_id and cycle_id to fixture-only values.
  mkdirSync(WORK_DIR, { recursive: true });
  mkdirSync(dirname(SMOKE_BB), { recursive: true });

  // Copy state.json + history.jsonl as-is.
  copyFileSync(join(PILOT_SNAPSHOT, 'state.json'), join(WORK_DIR, 'state.json'));
  copyFileSync(join(PILOT_SNAPSHOT, 'history.jsonl'), join(WORK_DIR, 'history.jsonl'));

  // Manifest: copy + override agent_id + add cycle_id (Gap 1 — permanent agents may have cycle_id).
  const liveManifest = JSON.parse(readFileSync(join(PILOT_SNAPSHOT, 'manifest.json'), 'utf8'));
  const fixtureManifest = {
    ...liveManifest,
    agent_id: FIXTURE_AGENT_ID,
    cycle_id: FIXTURE_CYCLE_ID,
    session_id: null,                       // Gap 1 — nullable for permanent
    blackboard_persistent_path: SMOKE_BB,    // smoke board, not the real one
    blackboard_session_path: null,          // Gap 2 — null for permanent
    _fixture_metadata: {
      purpose: 'Phase 5 smoke-test fixture; agent_id is fixtures-only to avoid REGISTRY conflict with the live GSL pilot.',
      snapshot_of: '_ops/agents/permanent/generative-sample-libraries/manifest.json',
      snapshot_at: '2026-05-04',
    },
  };
  writeFileSync(join(WORK_DIR, 'manifest.json'), JSON.stringify(fixtureManifest, null, 2) + '\n');

  // Validate the manifest before going further.
  const result = validateManifest(fixtureManifest);
  if (!result.valid) {
    console.error('fixture manifest invalid:', JSON.stringify(result.errors, null, 2));
    process.exit(1);
  }

  // Register against the smoke REGISTRY (separate from the real one).
  const reg = registerAgent(SMOKE_REGISTRY, {
    agent_id: FIXTURE_AGENT_ID,
    home: FIXTURE_HOME,
    dir: WORK_DIR,
  });

  console.log(JSON.stringify({
    prepared: true,
    work_dir: WORK_DIR,
    smoke_blackboard: SMOKE_BB,
    smoke_registry: SMOKE_REGISTRY,
    registered: reg.created,
    agent_id: FIXTURE_AGENT_ID,
    cycle_id: FIXTURE_CYCLE_ID,
  }, null, 2));
}

function readState() { return JSON.parse(readFileSync(join(WORK_DIR, 'state.json'), 'utf8')); }
function readHistory() { return readJsonl(join(WORK_DIR, 'history.jsonl')); }
function readManifestFile() { return JSON.parse(readFileSync(join(WORK_DIR, 'manifest.json'), 'utf8')); }

function cmdDispatch(positional, flags) {
  if (!existsSync(WORK_DIR)) {
    console.error('working dir does not exist; run `prepare` first');
    process.exit(2);
  }
  const manifest = readManifestFile();
  const state = readState();
  const history = readHistory();

  // Read the home entry's body.
  const homeEntryPath = resolve(PALACE_ROOT, 'Projects', `${manifest.home}.md`);
  let homeBody = '';
  if (existsSync(homeEntryPath)) {
    homeBody = readFileSync(homeEntryPath, 'utf8');
  } else {
    homeBody = `(home entry "${manifest.home}.md" not found at expected path; skip)`;
  }

  // Render the steward template.
  const systemPrompt = loadAndRender({
    skillRoot: SKILL_ROOT,
    templateName: 'steward',
    vars: {
      home: manifest.home,
      cycle_id: manifest.cycle_id,
      // Post-SSOT-cutover, slimmed state has no stewardship block — fall back to
      // the manifest spawn snapshot. (Live cycles read stage from frontmatter.)
      stage_at_last_activation: state.stewardship?.stage_at_last_activation ?? manifest.stewardship?.stage_at_spawn ?? 'sprout',
    },
  });

  // Read the relevant blackboard slice (cycle-scoped: smoke-permanent.jsonl
  // since this fixture cycle starts fresh; for the real cycle it'd be the
  // persistent board after state.last_read_cursor).
  const priorThisCycle = existsSync(SMOKE_BB) ? readJsonl(SMOKE_BB) : [];
  const trailText = priorThisCycle.length === 0
    ? '(empty — this is the first message of cycle 4 on the smoke board; the live pilot board is not consulted in this fixture run)'
    : priorThisCycle.map((m) => '```json\n' + JSON.stringify(m, null, 2) + '\n```').join('\n\n');

  // Format prior history for the steward (last 5 events).
  const recentHistory = history.slice(-5);
  const historyText = recentHistory.map((e) => `- ${e.event} @ ${e.ts}: ${e.summary || e.note || e.tool || ''}`).join('\n');

  // Pending + resolved requests from state.
  const pendingText = (state.pending_requests || []).map((r) => `- ${r.request_id}: ${r.decision_topic || r.resource} (blocking: ${r.blocking})`).join('\n') || '(none)';
  const resolvedText = (state.resolved_requests || []).map((r) => `- ${r.request_id} -> ${r.outcome}`).join('\n') || '(none)';

  const userTurn = `# Your home entry: ${manifest.home}

(Snapshot read from the live palace at \`Projects/Generative Sample Libraries.md\`. Body below.)

${homeBody.length > 8000 ? homeBody.slice(0, 8000) + '\n\n[truncated for prompt — full body available on request]' : homeBody}

# Your state at last activation

- iteration: ${state.iteration}
- last_active: ${state.last_active}
- last_read_cursor: ${state.last_read_cursor}
- stage_at_last_activation: ${state.stewardship?.stage_at_last_activation ?? manifest.stewardship?.stage_at_spawn ?? 'sprout'}
- vector_changed_since_last: ${state.stewardship?.vector_changed_since_last ?? false}

## Pending requests

${pendingText}

## Resolved requests

${resolvedText}

# Recent history (last 5 events)

${historyText}

# Pheromone trail (smoke board)

${trailText}

# Your task this cycle (cycle ${state.iteration + 1}, fixture run)

You are the **${manifest.home}** steward, running cycle ${state.iteration + 1} as a Phase 5 smoke-test against a SNAPSHOT of the live pilot. Real palace work does not happen on this smoke board — your messages here will not propagate. The point is to verify the dispatch pipeline works on a permanent steward shape, not to advance the real project.

Per the steward voice rules and the growing-stage posture:

1. **Catch Loudon up first** — open with one paragraph re-grounding him on what GSL is, what shipped, what's settled, what's pending.
2. **Address the pending request** \`gsl-steward-004\` (content_audition for the Phase 2 Interview SKILL.md — blocking: true awaiting Trickster). The previous cycle's posted message is what Loudon would respond to. This cycle's job: either (a) post a status BROADCAST naming what you're waiting on (since a blocking request is pending and should not be re-asked), or (b) propose a non-blocking next step that doesn't depend on that response.
3. **Posting discipline:** SPINNING UP BROADCAST first. Then 1-3 substantive messages following stage-conditional posture.

Output your messages as JSON code-fence blocks (\`\`\`json … \`\`\`), one per message, in dispatch order.

Use these exact values:
  - schema_version: "1.0"
  - session_id: "${manifest.cycle_id}"
  - from: "${manifest.agent_id}"
  - ts: ISO 8601 with timezone (e.g. "2026-05-04T19:30:00Z")
  - id: e.g. "${manifest.cycle_id}-1", "...-2"
  - board: one of GENERAL, FLAGS, WEAVE, SYSTEM, TRICKSTER (NOT "channel")
  - to: a string ("*" for broadcasts, "TRICKSTER" for asks, etc.)
  - All other §2.2 required fields present.

Do NOT include a \`health\` block — the orchestrator fills it in.

Output ONLY the JSON code-fence blocks. No prose around them.`;

  const dispatchPrompt = `${systemPrompt}\n\n---\n\n${userTurn}`;

  const out = {
    agent_id: manifest.agent_id,
    cycle_id: manifest.cycle_id,
    home: manifest.home,
    iteration_target: state.iteration + 1,
    model: MODEL_NAME,
    dispatch_prompt: dispatchPrompt,
  };

  const outPath = flags['out'] ?? join(SMOKE_DIR, 'dispatch-permanent.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`wrote dispatch payload for ${manifest.home} cycle ${state.iteration + 1} to ${outPath}`);
}

function extractJsonBlocks(text) {
  const blocks = [];
  const re = /```json\s*\n([\s\S]*?)\n\s*```/g;
  let m;
  while ((m = re.exec(text)) !== null) blocks.push(m[1]);
  if (blocks.length === 0) {
    const reAny = /```\s*\n([\s\S]*?)\n\s*```/g;
    while ((m = reAny.exec(text)) !== null) {
      try { JSON.parse(m[1]); blocks.push(m[1]); } catch { /* skip */ }
    }
  }
  return blocks;
}

function cmdAbsorb(positional, flags) {
  if (!existsSync(WORK_DIR)) {
    console.error('working dir does not exist; run prepare + dispatch first');
    process.exit(2);
  }
  const responsePath = positional[0];
  if (!responsePath) {
    console.error('usage: smoke-permanent.js absorb <response.txt> --usage <usage.json>');
    process.exit(2);
  }
  const usagePath = flags['usage'];
  if (!usagePath) {
    console.error('absorb: --usage <usage.json> required');
    process.exit(2);
  }
  const responseText = readFileSync(resolve(responsePath), 'utf8');
  const usage = JSON.parse(readFileSync(resolve(usagePath), 'utf8'));

  const manifest = readManifestFile();
  const state = readState();
  const blocks = extractJsonBlocks(responseText);
  if (blocks.length === 0) {
    console.error('no JSON code-fence blocks found');
    process.exit(1);
  }

  const health = buildHealthBlock({ ...usage, iteration: state.iteration + 1 });
  // For posting-discipline checks, scope priorMessages to THIS cycle's
  // session_id so the SPINNING UP rule fires correctly per cycle.
  const allPriors = existsSync(SMOKE_BB) ? readJsonl(SMOKE_BB) : [];
  const cyclePriors = allPriors.filter((m) => m.session_id === manifest.cycle_id);
  let runningPriors = cyclePriors.slice();

  const accepted = [];
  const rejected = [];

  for (let i = 0; i < blocks.length; i++) {
    let msg;
    try {
      msg = JSON.parse(blocks[i]);
    } catch (e) {
      rejected.push({ index: i, reason: 'parse_error', detail: e.message });
      continue;
    }
    msg.health = health;
    const v = validateForPosting(msg, { priorMessages: runningPriors, agentId: manifest.agent_id });
    if (!v.valid) {
      rejected.push({ index: i, id: msg.id, reason: 'validator_rejected', errors: v.errors });
      continue;
    }
    appendMessage(SMOKE_BB, msg);
    accepted.push({ index: i, id: msg.id, type: msg.type, board: msg.board });
    runningPriors.push(msg);
  }

  // Update state.json (mimicking step 12 of the workflow) on at-least-one accepted.
  if (accepted.length > 0) {
    const newPending = (state.pending_requests || []).slice();
    for (const a of accepted) {
      const m = JSON.parse(blocks[a.index]);
      if (m.type === 'RESOURCE_REQUEST') {
        newPending.push({
          request_id: m.request_id,
          resource: m.payload?.resource ?? 'unknown',
          decision_topic: m.payload?.decision_topic,
          blocking: m.payload?.blocking ?? false,
          posted_at: m.ts,
        });
      }
    }
    const newState = {
      ...state,
      iteration: state.iteration + 1,
      last_active: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
      last_read_cursor: accepted[accepted.length - 1].id,
      pending_requests: newPending,
    };
    writeFileSync(join(WORK_DIR, 'state.json'), JSON.stringify(newState, null, 2) + '\n');

    // Append events to history.jsonl
    const histPath = join(WORK_DIR, 'history.jsonl');
    const events = [
      { event: `CYCLE_${state.iteration + 1}_SPAWN`, ts: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), note: 'Phase 5 smoke-test cycle on snapshot of live pilot. Not the live pilot.' },
      ...accepted.map((a) => ({
        event: 'TOOL_CALL',
        ts: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
        tool: 'write_blackboard',
        args: { path: SMOKE_BB, message_id: a.id, type: a.type, board: a.board },
      })),
      {
        event: 'CYCLE_COMPLETE',
        ts: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
        iteration: state.iteration + 1,
        stop_reason: 'cycle_complete',
        posted_messages: accepted.map((a) => a.id),
        pending_requests: newPending.map((p) => p.request_id),
        smoke_test: true,
      },
    ];
    for (const ev of events) {
      appendMessage(histPath, ev);
    }
  }

  console.log(JSON.stringify({ accepted, rejected, total_blocks: blocks.length }, null, 2));
  if (accepted.length === 0 && rejected.length > 0) process.exit(1);
}

function cmdReport() {
  if (!existsSync(SMOKE_BB)) {
    console.log(JSON.stringify({ session: 'not-yet-run' }, null, 2));
    return;
  }
  const messages = readJsonl(SMOKE_BB);
  const state = existsSync(join(WORK_DIR, 'state.json')) ? readState() : null;
  const summary = {
    smoke_blackboard: SMOKE_BB,
    total_messages: messages.length,
    by_type: {},
    by_board: {},
    state_iteration: state?.iteration,
    state_last_active: state?.last_active,
    state_pending: state?.pending_requests?.length ?? 0,
  };
  for (const m of messages) {
    summary.by_type[m.type] = (summary.by_type[m.type] || 0) + 1;
    summary.by_board[m.board] = (summary.by_board[m.board] || 0) + 1;
  }
  console.log(JSON.stringify(summary, null, 2));
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) { flags[key] = true; i += 1; }
      else { flags[key] = next; i += 2; }
    } else { positional.push(a); i += 1; }
  }
  return { positional, flags };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('usage: smoke-permanent.js <prepare|dispatch|absorb|report> [args]');
    process.exit(0);
  }
  const cmd = args[0];
  const { positional, flags } = parseArgs(args.slice(1));
  if (cmd === 'prepare') return cmdPrepare();
  if (cmd === 'dispatch') return cmdDispatch(positional, flags);
  if (cmd === 'absorb') return cmdAbsorb(positional, flags);
  if (cmd === 'report') return cmdReport();
  console.error(`unknown command "${cmd}"`);
  process.exit(2);
}

main();
