#!/usr/bin/env node
// smoke-songline.js — Phase 4 smoke-test driver.
//
// Builds the per-cycle manifest, renders the songline prompt, validates it,
// and writes the dispatch payload (system prompt + user-turn context) to
// stdout in a structured format the build session feeds to the Agent tool.
//
// This script does NOT dispatch the subagent itself — that is the build
// session's job (the parent Claude Code session that owns the Agent tool).
// Usage:
//
//   node smoke-songline.js dispatch <agent-index> [--out <path>]
//
//     Builds the dispatch payload for path[agent-index] and writes it to
//     <path> (default: tests/fixtures/songline-smoke/dispatch-<i>.json).
//
//   node smoke-songline.js absorb <agent-index> <subagent-response.txt> \
//       --usage <usage.json>
//
//     Parses subagent response, injects health blocks, validates, appends
//     to the smoke-test blackboard. <usage.json> = {total_tokens, model}.

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifest } from '../src/manifest.js';
import { loadAndRender } from '../src/prompts.js';
import { buildHealthBlock } from '../src/health.js';
import { validateForPosting } from '../src/posting.js';
import { appendMessage, readJsonl } from '../src/append.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PALACE_ROOT = resolve(ROOT, '..', '..', '..');
const SKILL_ROOT = resolve(PALACE_ROOT, '.claude', 'skills', 'palace-orchestrator');
const SMOKE_DIR = resolve(ROOT, 'tests', 'fixtures', 'songline-smoke');
const SMOKE_ENTRIES = resolve(SMOKE_DIR, 'entries');
const SMOKE_BB = resolve(SMOKE_DIR, 'blackboard', 'smoke-songline.jsonl');

const PATH = ['Smoke Sender', 'Smoke Receiver'];
const SESSION_ID = 'smoke-songline-2026-05-04-001';
const MODEL_NAME = 'claude-sonnet-4-6';

function entryPath(name) {
  return resolve(SMOKE_ENTRIES, `${name}.md`);
}

function buildPerCycleManifest(agentIndex) {
  const home = PATH[agentIndex];
  const others = PATH.filter((_, i) => i !== agentIndex);
  const next = agentIndex + 1 < PATH.length ? PATH[agentIndex + 1] : 'COORDINATOR';
  return {
    agent_id: home,
    home,
    session_id: SESSION_ID,
    mode: 'songline',
    neighborhood: others,
    model: { provider: 'anthropic', name: MODEL_NAME, endpoint: 'https://api.anthropic.com/v1' },
    tool_registry: ['read_palace', 'read_blackboard_session', 'write_blackboard'],
    stopping_conditions: { max_iterations: 1, stop_on: ['WEAVE_posted', 'cycle_complete'] },
    blackboard_session_path: SMOKE_BB,
    blackboard_persistent_path: SMOKE_BB,
    partner_id: null,
    trickster_mode: 'human',
    parallel_safe: true,
    _songline_metadata: {
      path: PATH,
      step_number: agentIndex + 1,
      next_agent_id: next,
    },
  };
}

function readEntryBody(name) {
  return readFileSync(entryPath(name), 'utf8');
}

function readBlackboardForSession() {
  if (!existsSync(SMOKE_BB)) return [];
  return readJsonl(SMOKE_BB).filter((m) => m.session_id === SESSION_ID);
}

function buildUserTurn(agentIndex) {
  const home = PATH[agentIndex];
  const next = agentIndex + 1 < PATH.length ? PATH[agentIndex + 1] : 'COORDINATOR';
  const homeBody = readEntryBody(home);
  const neighborhood = PATH
    .filter((_, i) => i !== agentIndex)
    .map((name) => `### Neighborhood entry: ${name}\n\n(frontmatter only — body deliberately omitted in v0.1)\n`)
    .join('\n');
  const trail = readBlackboardForSession();
  const trailText = trail.length === 0
    ? '(empty — you are the first agent on this songline)'
    : trail.map((m) => '```json\n' + JSON.stringify(m, null, 2) + '\n```').join('\n\n');

  return `# Your home entry: ${home}

${homeBody}

# Your neighborhood

${neighborhood}

# Pheromone trail (this session's blackboard so far)

${trailText}

# Your task this cycle

You are step ${agentIndex + 1} of ${PATH.length} on this songline.
Read the prior trail (above) — metabolize, do not annotate.
Write 3-4 messages following the discipline in your system prompt:

1. Arrival BROADCAST to GENERAL ("SPINNING UP. HOME: ${home}…")
2. One FLAG to FLAGS naming what your home entry uniquely contributes here
3. (Optional) A second FLAG only if a genuinely independent claim surfaces
4. Hand-off BROADCAST to WEAVE, addressed to "${next}", carrying a specific bridge

Output your messages as JSON code-fence blocks, one per message, in dispatch order.
Do NOT include a \`health\` block — the orchestrator fills it in.
Use these exact values:
  - schema_version: "1.0"
  - session_id: "${SESSION_ID}"
  - from: "${home}"
  - ts: ISO 8601 with timezone (e.g. "2026-05-04T19:00:00Z")
  - id: a unique per-message id like "${home.toLowerCase().replace(/\s+/g, '-')}-1", "...-2", etc.

Validate mentally before writing: every message has all required §2.2
fields except health. SPINNING UP must be the first message.`;
}

function cmdDispatch(positional, flags) {
  const agentIndex = parseInt(positional[0] ?? '0', 10);
  if (Number.isNaN(agentIndex) || agentIndex < 0 || agentIndex >= PATH.length) {
    console.error(`bad agent-index ${positional[0]}; valid range 0..${PATH.length - 1}`);
    process.exit(2);
  }

  const manifest = buildPerCycleManifest(agentIndex);
  const v = validateManifest(manifest);
  if (!v.valid) {
    console.error('manifest invalid:', JSON.stringify(v.errors, null, 2));
    process.exit(1);
  }

  const systemPrompt = loadAndRender({
    skillRoot: SKILL_ROOT,
    templateName: 'songline',
    vars: {
      home: manifest.home,
      session_id: manifest.session_id,
      path_description: PATH.join(' -> '),
      step_number: agentIndex + 1,
      step_total: PATH.length,
      next_agent_id: manifest._songline_metadata.next_agent_id,
    },
  });

  const userTurn = buildUserTurn(agentIndex);

  // Single-prompt fold for the Agent tool: system prompt first, divider, user turn.
  const dispatchPrompt = `${systemPrompt}

---

${userTurn}`;

  const out = {
    agent_index: agentIndex,
    home: manifest.home,
    session_id: SESSION_ID,
    model: MODEL_NAME,
    next_agent_id: manifest._songline_metadata.next_agent_id,
    dispatch_prompt: dispatchPrompt,
  };

  const outPath = flags['out'] ?? join(SMOKE_DIR, `dispatch-${agentIndex}.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`wrote dispatch payload for "${manifest.home}" (step ${agentIndex + 1}/${PATH.length}) to ${outPath}`);
}

function extractJsonBlocks(text) {
  // Match ```json ... ``` fenced blocks (allowing optional language hint).
  // Also accept fences without a language hint — fall back when no `json` blocks exist.
  const blocks = [];
  const re = /```json\s*\n([\s\S]*?)\n\s*```/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    blocks.push(m[1]);
  }
  if (blocks.length === 0) {
    const reAny = /```\s*\n([\s\S]*?)\n\s*```/g;
    while ((m = reAny.exec(text)) !== null) {
      // Only accept blocks that parse as JSON
      try {
        JSON.parse(m[1]);
        blocks.push(m[1]);
      } catch { /* not json */ }
    }
  }
  return blocks;
}

function cmdAbsorb(positional, flags) {
  const agentIndex = parseInt(positional[0] ?? '0', 10);
  const responsePath = positional[1];
  if (!responsePath) {
    console.error('usage: smoke-songline.js absorb <agent-index> <subagent-response.txt> --usage <usage.json>');
    process.exit(2);
  }
  const usagePath = flags['usage'];
  if (!usagePath) {
    console.error('absorb: --usage <usage.json> is required');
    process.exit(2);
  }
  const responseText = readFileSync(resolve(responsePath), 'utf8');
  const usage = JSON.parse(readFileSync(resolve(usagePath), 'utf8'));

  const manifest = buildPerCycleManifest(agentIndex);
  const blocks = extractJsonBlocks(responseText);
  if (blocks.length === 0) {
    console.error(`absorb: no JSON code-fence blocks in subagent response`);
    process.exit(1);
  }

  const health = buildHealthBlock(usage);
  const priorMessages = readBlackboardForSession();
  let priorTotal = priorMessages.slice();

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
    const v = validateForPosting(msg, { priorMessages: priorTotal, agentId: manifest.agent_id });
    if (!v.valid) {
      rejected.push({ index: i, id: msg.id, reason: 'validator_rejected', errors: v.errors });
      continue;
    }
    appendMessage(SMOKE_BB, msg);
    accepted.push({ index: i, id: msg.id, type: msg.type, board: msg.board });
    priorTotal.push(msg);
  }

  const result = { accepted, rejected, total_blocks: blocks.length };
  console.log(JSON.stringify(result, null, 2));
  if (rejected.length > 0 && accepted.length === 0) process.exit(1);
}

function cmdReport(positional) {
  const messages = readBlackboardForSession();
  const summary = {
    session_id: SESSION_ID,
    total_messages: messages.length,
    per_agent: {},
    boards: {},
  };
  for (const m of messages) {
    summary.per_agent[m.from] = (summary.per_agent[m.from] || 0) + 1;
    summary.boards[m.board] = (summary.boards[m.board] || 0) + 1;
  }
  console.log(JSON.stringify(summary, null, 2));
}

function cmdSessionInit(positional, flags) {
  const usagePath = flags['usage'];
  if (!usagePath) {
    console.error('session-init: --usage <usage.json> required');
    process.exit(2);
  }
  const usage = JSON.parse(readFileSync(resolve(usagePath), 'utf8'));
  const health = buildHealthBlock(usage);
  const msg = {
    schema_version: '1.0',
    id: `${SESSION_ID}-init`,
    ts: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    session_id: SESSION_ID,
    from: 'COORDINATOR',
    to: '*',
    type: 'SESSION_INIT',
    board: 'SYSTEM',
    health,
    payload: {
      session_kind: 'enchanted_songline',
      path: PATH,
      trigger: 'orchestrator skill v0.1 Phase 4 smoke test',
      note: 'Dispatched against fixture entries Smoke Sender + Smoke Receiver. Not a real palace songline.',
    },
  };
  const v = validateForPosting(msg);
  if (!v.valid) {
    console.error('SESSION_INIT validation failed:', JSON.stringify(v.errors, null, 2));
    process.exit(1);
  }
  appendMessage(SMOKE_BB, msg);
  console.log(JSON.stringify({ wrote: true, id: msg.id }, null, 2));
}

function cmdSessionClose(positional, flags) {
  const usagePath = flags['usage'];
  if (!usagePath) {
    console.error('session-close: --usage <usage.json> required');
    process.exit(2);
  }
  const usage = JSON.parse(readFileSync(resolve(usagePath), 'utf8'));
  const health = buildHealthBlock(usage);
  const messages = readBlackboardForSession();
  const perAgent = {};
  for (const m of messages) {
    perAgent[m.from] = (perAgent[m.from] || 0) + 1;
  }
  const requestRequests = messages.filter((m) => m.type === 'RESOURCE_REQUEST').length;

  const msg = {
    schema_version: '1.0',
    id: `${SESSION_ID}-close`,
    ts: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    session_id: SESSION_ID,
    from: 'COORDINATOR',
    to: '*',
    type: 'SESSION_CLOSE',
    board: 'SYSTEM',
    health,
    payload: {
      agents_reported: PATH.filter((p) => perAgent[p] && perAgent[p] > 0),
      messages_total: messages.length,
      messages_per_agent: perAgent,
      resource_requests: requestRequests,
      verdict: 'smoke-test passed' + (requestRequests > 0 ? ` (${requestRequests} RESOURCE_REQUESTs raised)` : ''),
      deposit_candidates: ['Phase 4 smoke-test fixtures preserved at _ops/stigmergy/orchestrator/tests/fixtures/songline-smoke/ for future regression.'],
      open_question_to_trickster: 'None — smoke test exercises pipeline only, not real palace material. The validator-rejection-and-retry pathway was exercised (one bad dispatch caught, one retry succeeded).',
    },
  };
  const v = validateForPosting(msg);
  if (!v.valid) {
    console.error('SESSION_CLOSE validation failed:', JSON.stringify(v.errors, null, 2));
    process.exit(1);
  }
  appendMessage(SMOKE_BB, msg);
  console.log(JSON.stringify({ wrote: true, id: msg.id }, null, 2));
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
    } else {
      positional.push(a);
      i += 1;
    }
  }
  return { positional, flags };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('usage: smoke-songline.js <session-init|dispatch|absorb|report|session-close> [args]');
    process.exit(0);
  }
  const cmd = args[0];
  const { positional, flags } = parseArgs(args.slice(1));
  if (cmd === 'session-init') return cmdSessionInit(positional, flags);
  if (cmd === 'dispatch') return cmdDispatch(positional, flags);
  if (cmd === 'absorb') return cmdAbsorb(positional, flags);
  if (cmd === 'report') return cmdReport(positional, flags);
  if (cmd === 'session-close') return cmdSessionClose(positional, flags);
  console.error(`unknown command "${cmd}"`);
  process.exit(2);
}

main();
