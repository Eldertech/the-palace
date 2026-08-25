#!/usr/bin/env node
// return-map.mjs — the Return Ceremony's query block, in one command.
//
// This script GATHERS EVIDENCE. It does not recommend, rank, or interpret.
// That separation is the point: the record answers, the reader judges. The
// scout posture (_ops/concierge/prompts/scout.md) reads this output and makes
// the one-move call; the [[Return Ceremony]] card holds the human protocol.
//
// Every block prints the command that produced it, so every row of a return map
// can cite a command's output rather than an inference from the file tree —
// the ceremony's rule that outranks the others.
//
// What it will NOT do:
//   - guess whether a handoff is "really" done (the board is truth)
//   - read a gap's length as a cause (a gap is not a finding)
//   - open a single baton body (loading them all biases the choice)
//
// Usage:
//   node _ops/concierge/return-map.mjs            # human-readable survey
//   node _ops/concierge/return-map.mjs --json     # machine-readable, same data
//   node _ops/concierge/return-map.mjs --since 2026-07-04   # override gap start
//
// Exit code is 0 even when individual probes fail — a probe that cannot run is
// reported as `unavailable` with its error, never silently dropped. A missing
// answer must stay visible; that is what stops it being replaced by a guess.

import { execSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { boardPath, loadBoard, foldHandoffs, age, C, ownerRoot } from '../stigmergy/handoff-model.mjs';

const ROOT = ownerRoot();
const argv = process.argv.slice(2);
const JSON_OUT = argv.includes('--json');
const sinceArg = argv.includes('--since') ? argv[argv.indexOf('--since') + 1] : null;

// ---------------------------------------------------------------- probe shell

// Run a command and capture it as an evidence block. Failure is data, not an
// exception: an unavailable probe is reported so the reader knows what is
// missing rather than assuming it was empty.
function probe(label, cmd, { cwd = ROOT, allowFail = false } = {}) {
  try {
    const out = execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { label, cmd, ok: true, out: out.replace(/\s+$/, '') };
  } catch (e) {
    const out = `${e.stdout || ''}${e.stderr || ''}`.replace(/\s+$/, '');
    // A linter exiting non-zero *is* its finding — that output is the answer.
    if (allowFail && out) return { label, cmd, ok: true, exit: e.status, out };
    return { label, cmd, ok: false, error: (e.message || String(e)).split('\n')[0], out };
  }
}

const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

// ------------------------------------------------- 1. where the palace stopped

const lastCommit = probe('last commit', `git log -1 --format='%ad %h %s' --date=short`);
const lastDate = lastCommit.ok ? strip(lastCommit.out).slice(0, 10) : null;

// The gap is measured, never explained. We report days; the cause is Loudon's
// to tell, and reading one out of the record is the failure this ceremony was
// written from (Return Ceremony § a gap is not a finding).
const gapDays = lastDate
  ? Math.max(0, Math.round((Date.now() - Date.parse(`${lastDate}T12:00:00Z`)) / 86400000))
  : null;

// The window worth showing: enough commits to see what Loudon was mid-sentence
// on. `--since` overrides for an explicitly known last-session date.
const arcCmd = sinceArg
  ? `git log --since=${sinceArg} --format='%ad %h %s' --date=short`
  : `git log -12 --format='%ad %h %s' --date=short`;
const arc = probe('the arc', arcCmd);

// ------------------------------------------------------------- 2. work in flight

const board = boardPath();
let handoffs = { ok: false, error: 'board unreadable' };
try {
  const fold = foldHandoffs(loadBoard(board));
  const card = (c) => ({
    id: c.m.id,
    entry: c.p.entry || c.m.from,
    state: c.state,
    age: age(c.m.ts),
    move: c.p.move || '',
    baton: c.p.handoff_path || null,
    worktree: c.p.worktree || null,
  });
  handoffs = {
    ok: true,
    cmd: 'node _ops/stigmergy/list-handoffs.mjs',
    open: fold.open.map(card),
    claimed: fold.claimed.map(card),
  };
} catch (e) {
  handoffs = { ok: false, cmd: 'node _ops/stigmergy/list-handoffs.mjs', error: e.message };
}

// Anyone blocked on Loudon. A steward can wait months in silence, and silence
// is exactly what a returning instance cannot see — so ask the board directly.
let blocked = { ok: false, error: 'board unreadable' };
try {
  const msgs = loadBoard(board);
  const answered = new Set(
    msgs.filter((m) => m.type === 'RESOURCE_GRANT' || m.type === 'RESOURCE_DENY')
      .map((m) => m.re || (m.payload || {}).request_id).filter(Boolean),
  );
  const waiting = msgs
    .filter((m) => m.type === 'RESOURCE_REQUEST' && !answered.has(m.id))
    .map((m) => ({
      id: m.id,
      from: m.from,
      ts: m.ts,
      age: age(m.ts),
      blocking: !!(m.payload || {}).blocking,
      ask: ((m.payload || {}).question || (m.payload || {}).summary || (m.payload || {}).move || '')
        .slice(0, 160),
    }))
    .sort((a, b) => (b.blocking - a.blocking) || (Date.parse(b.ts) - Date.parse(a.ts)));
  blocked = { ok: true, cmd: `unanswered RESOURCE_REQUESTs on ${relative(ROOT, board)}`, waiting };
} catch (e) {
  blocked = { ok: false, error: e.message };
}

// Batons the tooling cannot see. A baton file with no board line is invisible to
// list-handoffs — it is real work parked where nothing will surface it.
function findBatons(dir, hits = [], depth = 0) {
  if (depth > 6) return hits;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return hits; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (/^(\.git|\.obsidian|\.claude|node_modules|\.venvs|_tools|Archive)$/.test(e.name)) continue;
      findBatons(p, hits, depth + 1);
    } else if (/— baton(\s|\.md$)/.test(e.name) && e.name.endsWith('.md')) {
      hits.push(p);
    }
  }
  return hits;
}
const knownBatons = new Set(
  handoffs.ok ? [...handoffs.open, ...handoffs.claimed].map((c) => c.baton).filter(Boolean) : [],
);
const batonFiles = findBatons(ROOT).map((p) => {
  const rel = relative(ROOT, p);
  const onBoard = [...knownBatons].some((b) => rel.endsWith(b) || b.endsWith(rel));
  return { path: rel, onBoard, mtime: statSync(p).mtime.toISOString().slice(0, 10) };
});
const unannounced = batonFiles.filter((b) => !b.onBoard);

// ----------------------------------------------------------------- 3. the drift

const linters = [
  ['weave flags', 'python3 _ops/swarm/lint-weave-flags.py'],
  ['doc drift', 'python3 _ops/swarm/lint-doc-drift.py'],
  ['voice drift', 'python3 _ops/swarm/lint-voice-drift.py'],
].map(([label, cmd]) => probe(label, cmd, { allowFail: true }));

const repo = [
  probe('unpushed', `git log --oneline origin/main..main | wc -l | tr -d ' '`, { allowFail: true }),
  probe('worktrees', 'git worktree list'),
  probe('branches', 'git branch -v'),
  probe('uncommitted', 'git status --short'),
];

// ------------------------------------------------------------------ the report

const data = {
  generated: new Date().toISOString(),
  root: ROOT,
  stopped: { lastCommit, gapDays, arc },
  inFlight: { handoffs, blocked, batons: { all: batonFiles, unannounced } },
  drift: { linters, repo },
};

if (JSON_OUT) {
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

const h = (s) => console.log(`\n${C.B}${s}${C.R}`);
const cmdLine = (s) => console.log(`${C.D}  $ ${s}${C.R}`);
const body = (s, indent = '    ') =>
  console.log(strip(s).split('\n').map((l) => indent + l).join('\n'));

console.log(`${C.B}RETURN MAP — evidence${C.R}  ${C.D}${data.generated.slice(0, 16).replace('T', ' ')}Z · ${ROOT}${C.R}`);
console.log(`${C.D}Evidence only — no recommendation. The reader judges; the record answers.${C.R}`);

h('1 · WHERE THE PALACE STOPPED');
cmdLine(lastCommit.cmd);
if (lastCommit.ok) body(lastCommit.out);
else body(`${C.Rd}unavailable${C.R} — ${lastCommit.error}`);
if (gapDays !== null) {
  console.log(`${C.D}    gap: ${gapDays} day${gapDays === 1 ? '' : 's'} since the last commit — length only, never a cause.${C.R}`);
}
cmdLine(arc.cmd);
if (arc.ok) body(arc.out); else body(`${C.Rd}unavailable${C.R} — ${arc.error}`);

h('2 · IN FLIGHT');
cmdLine(handoffs.cmd);
if (!handoffs.ok) {
  body(`${C.Rd}unavailable${C.R} — ${handoffs.error}`);
} else if (!handoffs.open.length && !handoffs.claimed.length) {
  body('no open or claimed handoffs — clean board.');
} else {
  for (const c of [...handoffs.open, ...handoffs.claimed]) {
    const dot = c.state === 'open' ? `${C.G}●${C.R}` : `${C.Y}◐${C.R}`;
    console.log(`    ${dot} ${C.B}${c.entry}${C.R}  ${C.D}${c.state} · ${c.age} · ${c.id}${C.R}`);
    console.log(`      ${c.move.slice(0, 150)}${c.move.length > 150 ? '…' : ''}`);
    if (c.baton) console.log(`${C.D}      baton: ${c.baton}${C.R}`);
  }
  console.log(`${C.D}    (moves only — baton bodies are deliberately not opened here)${C.R}`);
}

console.log('');
cmdLine(blocked.cmd || 'unanswered RESOURCE_REQUESTs');
if (!blocked.ok) body(`${C.Rd}unavailable${C.R} — ${blocked.error}`);
else if (!blocked.waiting.length) body('nobody waiting on a decision.');
else for (const w of blocked.waiting) {
  const tag = w.blocking ? `${C.Rd}BLOCKING${C.R}` : `${C.D}non-blocking${C.R}`;
  console.log(`    ${tag} ${C.B}${w.from}${C.R} ${C.D}· ${w.age} · ${w.id}${C.R}`);
  if (w.ask) console.log(`      ${w.ask}`);
}

console.log('');
cmdLine('baton files on disk vs the board');
if (!unannounced.length) body(`${batonFiles.length} baton file(s), all announced on the board.`);
else {
  body(`${unannounced.length} of ${batonFiles.length} baton file(s) have NO board line — invisible to list-handoffs:`);
  for (const b of unannounced) console.log(`      ${b.path}  ${C.D}(modified ${b.mtime})${C.R}`);
}

h('3 · WHAT A LINTER OR A QUERY CAN PROVE STALE');
for (const l of linters) {
  cmdLine(l.cmd);
  if (l.ok) body(l.out ? l.out.split('\n').slice(-14).join('\n') : '(clean)');
  else body(`${C.Rd}unavailable${C.R} — ${l.error}`);
}
for (const r of repo) {
  cmdLine(r.cmd);
  if (r.ok) body(r.out || '(nothing)');
  else body(`${C.Rd}unavailable${C.R} — ${r.error}`);
}

const unavailable = [lastCommit, arc, ...linters, ...repo].filter((p) => !p.ok).length
  + (handoffs.ok ? 0 : 1) + (blocked.ok ? 0 : 1);
console.log(`\n${C.D}${unavailable ? `${C.Y}${unavailable} probe(s) unavailable${C.R}${C.D} — a return map may not paper over them. ` : ''}`
  + `Next: read this, then recommend exactly one move.${C.R}`);
