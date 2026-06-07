// handoff.mjs — cowork-git LAYER B: the BBS commit-handoff.
//
// When a direct lock-safe commit is NOT ideal — a knowledge/canon entry that
// belongs to the Deposit Ceremony, a wedged repo, or a large cross-cutting web
// of changes that wants human/Mac-side judgment — the Cowork side does not
// commit. It posts a structured `commit_handoff` flag to the STIGMERGY board
// carrying the WHOLE plan, so a Mac-side worker (Claude Code) can pick it up,
// understand the full web of changes, and commit each group through the palace
// spec where unlink works and nothing strands.
//
// Two subcommands:
//   emit --plan <file.json>   post a commit_handoff flag from a plan
//   show                      print all OPEN handoffs as an execution plan
//
// Plan JSON shape:
//   { "reason": "why this is a handoff",
//     "groups": [ { "paths":[...], "kind":"ops", "scope":"x", "summary":"...",
//                   "body":"...", "verify":"unverified",
//                   "disposition":"commit"|"deposit-review", "note":"..." } ] }
//
// Resolution: after executing, the worker appends a `commit_handoff_done`
// BROADCAST with top-level `re: <flag id>` (and the resulting commit hashes in
// payload). `show` then treats that handoff as closed.

import { readFileSync, appendFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const a = { cmd: argv[0] || 'show', plan: null, root: null, json: false };
  for (let i = 1; i < argv.length; i += 1) {
    const k = argv[i];
    if (k === '--plan') a.plan = argv[++i];
    else if (k === '--root') a.root = argv[++i];
    else if (k === '--json') a.json = true;
  }
  return a;
}

const KNOWN_KINDS = ['deposit', 'edit', 'enrich', 'handoff', 'steward', 'weave', 'schema', 'ops', 'merge', 'mixed'];
const VERIFY_VALUES = ['verified', 'unverified', 'couldnt'];

function readBoard(board) {
  try { return readFileSync(board, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); }
  catch { return []; }
}

// A handoff is open unless a commit_handoff_done references its id.
function openHandoffs(boardMsgs) {
  const done = new Set(boardMsgs.filter((m) => m.payload && m.payload.kind === 'commit_handoff_done' && m.re).map((m) => m.re));
  return boardMsgs.filter((m) => m.type === 'BROADCAST' && m.payload && m.payload.kind === 'commit_handoff' && !done.has(m.id));
}

function planId(groups) {
  const paths = groups.flatMap((g) => g.paths || []).sort();
  return createHash('sha1').update(paths.join('\n')).digest('hex').slice(0, 12);
}

function validatePlan(plan) {
  const errs = [];
  if (!plan || !Array.isArray(plan.groups) || plan.groups.length === 0) errs.push('plan.groups must be a non-empty array');
  for (const [i, g] of (plan.groups || []).entries()) {
    if (!Array.isArray(g.paths) || g.paths.length === 0) errs.push(`group[${i}].paths must be a non-empty array`);
    if (!KNOWN_KINDS.includes(g.kind)) errs.push(`group[${i}].kind must be one of ${KNOWN_KINDS.join('|')}`);
    if (!g.summary || !String(g.summary).trim()) errs.push(`group[${i}].summary is required`);
    if (!VERIFY_VALUES.includes(g.verify)) errs.push(`group[${i}].verify must be one of ${VERIFY_VALUES.join('|')}`);
  }
  return errs;
}

async function emit(palaceRoot, board, planPath) {
  const plan = JSON.parse(readFileSync(resolve(planPath), 'utf8'));
  const errs = validatePlan(plan);
  if (errs.length) return { ok: false, error: 'invalid plan', detail: errs };

  const pid = planId(plan.groups);
  const existing = openHandoffs(readBoard(board)).find((m) => m.payload.plan_id === pid);
  if (existing) return { ok: true, posted: false, existing: existing.id, plan_id: pid, note: 'an open handoff with the same path set already exists' };

  const msg = {
    schema_version: '1.0',
    id: randomUUID(),
    ts: new Date().toISOString(),
    session_id: 'cowork-git',
    from: 'cowork-git',
    to: 'claude-code',
    type: 'BROADCAST',
    board: 'GENERAL',
    health: { score: 'green', model: 'cowork-git', _orchestrator_metadata: { dispatch_mode: 'claude-code-subagent', tool: 'cowork-git', note: 'commit handoff (layer B)' } },
    payload: {
      kind: 'commit_handoff',
      plan_id: pid,
      reason: plan.reason || 'direct lock-safe commit not ideal; handed off to a Mac-side worker',
      created_in: 'cowork',
      status: 'open',
      groups: plan.groups,
    },
  };
  let v = { valid: true };
  try { const { validateMessage } = await import(pathToFileURL(join(palaceRoot, '_ops/stigmergy/core/schema/validator.js')).href); v = validateMessage(msg); }
  catch (e) { v = { valid: false, errors: [{ path: '', message: `validator import failed: ${e.message}` }] }; }
  if (!v.valid) return { ok: false, error: 'handoff failed §2.2 validation', detail: v.errors };
  appendFileSync(board, JSON.stringify(msg) + '\n');
  return { ok: true, posted: true, id: msg.id, plan_id: pid, groups: plan.groups.length };
}

function show(board) {
  const open = openHandoffs(readBoard(board));
  if (open.length === 0) return 'No open commit_handoff flags on the board.\n';
  const lines = [`${open.length} open commit handoff(s):\n`];
  for (const h of open) {
    lines.push(`HANDOFF ${h.id}  (plan ${h.payload.plan_id})`);
    lines.push(`  reason: ${h.payload.reason}`);
    h.payload.groups.forEach((g, i) => {
      const subj = `${g.kind}${g.scope ? `(${g.scope})` : ''}: ${g.summary}`;
      lines.push(`  [${i + 1}] ${g.disposition === 'deposit-review' ? 'DEPOSIT-REVIEW' : 'commit'} — ${subj}  (verify: ${g.verify})`);
      if (g.note) lines.push(`        note: ${g.note}`);
      for (const p of g.paths) lines.push(`        · ${p}`);
    });
    lines.push('');
    lines.push('  To execute (Mac-side, normal git — unlink works there):');
    lines.push('    - commit each "commit" group through the palace spec (scripts/palace-commit.mjs or the LOG deck),');
    lines.push('      staging ONLY that group\'s paths (never -A).');
    lines.push('    - route each DEPOSIT-REVIEW group through the Deposit Ceremony (review the diff first).');
    lines.push(`    - then close this handoff: append a commit_handoff_done BROADCAST with re: "${h.id}" and the commit hashes.`);
    lines.push('');
  }
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const palaceRoot = resolve(args.root || resolve(__dirname, '../..'));
  const board = join(palaceRoot, '_ops', 'swarm', 'persistent', 'blackboard.jsonl');
  const out = (o) => process.stdout.write(typeof o === 'string' ? o : JSON.stringify(o, null, 2) + '\n');

  if (args.cmd === 'emit') {
    if (!args.plan) return out({ ok: false, error: 'emit requires --plan <file.json>' });
    out(await emit(palaceRoot, board, args.plan));
  } else if (args.cmd === 'show') {
    out(args.json ? { open: openHandoffs(readBoard(board)) } : show(board));
  } else {
    out({ ok: false, error: `unknown command "${args.cmd}" (use: emit | show)` });
  }
}

main().catch((e) => { process.stdout.write(JSON.stringify({ ok: false, error: e.message }, null, 2) + '\n'); process.exit(1); });
