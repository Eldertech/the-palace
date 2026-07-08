#!/usr/bin/env node
// The Concierge health dial — one objective read, two systems.
//
// Reads a single OBJECTIVE token count (never the judged instance's self-report)
// and returns a zone + a recommended action. Serves two callers on one signal
// (see [[Concierge]] § the health dial, [[The Palace Speaks — production plan]] Phase 4):
//
//   • companion health — tokens = `subagent_tokens` from the Agent tool's <usage>
//     block on the companion's last resume → continue / compact / respawn.
//   • close intensity  — tokens = a transcript token estimate for the MAIN thread,
//     computed OUTSIDE the judged instance → slim / standard / heavy moderator.
//
// The design constraint this script exists to enforce (proven 2026-07-04, when a
// live instance asserted "context full" while it was not): the number comes from
// the harness/transcript, NOT from asking the agent how full it feels. Pipe the
// objective number in; do not eyeball it.
//
// Two arms on one number, because on the 1M-window models capacity almost never
// binds (a resident would have to ingest hundreds of K — sensor-B proof), yet a
// heavy resident is still costly: every resume re-bills its whole accumulated
// context. So:
//   capacity = tokens ÷ model window   (the safety backstop; bites on Haiku)
//   economy  = tokens as per-resume cost (what actually bites on 1M models)
// The action is the WORSE of the two.
//
// Usage:
//   node dial.mjs --tokens 89106 --model claude-opus-4-8
//   node dial.mjs --tokens 26511 --model claude-haiku-4-5 --for close
//   node dial.mjs --tokens 150000 --model claude-sonnet-5 --json
//
// Calibrations are first-cut (from the sensor-B characterization) and meant to be
// re-tuned by real runs — the proof said the sensor semantics are inferred
// black-box; re-check periodically.

// ── Model windows ────────────────────────────────────────────────────────────
// Family-fuzzy so version drift doesn't strand the table: only the Haiku family
// is 200K; every current + future large-context model is 1M. Override with --window.
function windowFor(model) {
  const m = (model || '').toLowerCase();
  if (m.includes('haiku')) return 200_000;
  return 1_000_000; // opus / sonnet / fable / unknown-large
}

// ── Zone thresholds ──────────────────────────────────────────────────────────
// capacity: fraction of the window. Headroom matters — a context past ~70% both
// degrades and starves the reply, so red well before the wall.
const CAP = { yellow: 0.40, red: 0.70 };

// economy: absolute per-resume cost. Each resume re-reads this many tokens before
// any work. Past ~200K, paying the one-time ~62K floor of a respawn beats carrying
// the load forward (unless the session is nearly done). Window-independent by design.
const ECON = { yellow: 100_000, red: 200_000 };

const RANK = { green: 0, yellow: 1, red: 2 };
const worse = (a, b) => (RANK[a] >= RANK[b] ? a : b);

// ── Action vocabulary, per caller ────────────────────────────────────────────
const ACTION = {
  companion: {
    green: 'continue',
    yellow: 'compact at the next natural break (re-address with a distilled brief, drop stale reads)',
    red: 'compact or respawn now (fresh spawn resets to the ~62K floor; re-seed only what the work ahead needs)',
  },
  close: {
    green: 'slim close — the parent is fresh; the moderator carries little, mostly confirms',
    yellow: 'standard close — the parent is partway spent; the moderator reads the arc and drafts fully',
    red: 'heavy close — the parent is spent; the moderator carries the reckoning, reads coldest, trusts the transcript over the tired account',
  },
};

// ── Core ─────────────────────────────────────────────────────────────────────
export function dial(tokens, model, { window: win, forWhom = 'companion' } = {}) {
  const window = win || windowFor(model);
  const pct = tokens / window;

  const capZone = pct >= CAP.red ? 'red' : pct >= CAP.yellow ? 'yellow' : 'green';
  const econZone = tokens >= ECON.red ? 'red' : tokens >= ECON.yellow ? 'yellow' : 'green';
  const zone = worse(capZone, econZone);
  const bind = RANK[econZone] > RANK[capZone] ? 'economy'
    : RANK[capZone] > RANK[econZone] ? 'capacity'
    : (zone === 'green' ? 'neither' : 'both');

  return {
    tokens,
    model: model || '(unspecified)',
    window,
    pct: Math.round(pct * 1000) / 10, // one decimal %
    capacity_zone: capZone,
    economy_zone: econZone,
    zone,
    binding: bind, // which arm drove the zone — the thing to actually act on
    action: ACTION[forWhom][zone],
    per_resume_cost: tokens, // plain restatement: what a resume re-bills
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = { forWhom: 'companion', json: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--tokens') a.tokens = Number(argv[++i]);
    else if (k === '--model') a.model = argv[++i];
    else if (k === '--window') a.window = Number(argv[++i]);
    else if (k === '--for') a.forWhom = argv[++i]; // companion | close
    else if (k === '--json') a.json = true;
    else if (k === '-h' || k === '--help') a.help = true;
  }
  return a;
}

const DOT = { green: '\x1b[32m●\x1b[0m', yellow: '\x1b[33m●\x1b[0m', red: '\x1b[31m●\x1b[0m' };

function render(r, forWhom) {
  const k = (n) => (n >= 1000 ? `${Math.round(n / 100) / 10}K` : String(n));
  const lines = [
    `${DOT[r.zone]} ${r.zone.toUpperCase()}  ${k(r.tokens)} tok / ${k(r.window)} window = ${r.pct}%  ` +
      `\x1b[2m(cap ${r.capacity_zone} · econ ${r.economy_zone} → ${r.binding} binds)\x1b[0m`,
    `  ${forWhom === 'close' ? 'close' : 'health'}: ${r.action}`,
  ];
  return lines.join('\n');
}

import { pathToFileURL } from 'node:url';
const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const a = parseArgs(process.argv.slice(2));
  if (a.help || a.tokens === undefined || Number.isNaN(a.tokens)) {
    console.error(
      'The Concierge health dial — objective read → zone + action.\n\n' +
      'Usage: node dial.mjs --tokens <N> --model <id> [--for companion|close] [--window N] [--json]\n\n' +
      '  --tokens   REQUIRED. The objective count. For companion health this is\n' +
      '             `subagent_tokens` from the Agent tool <usage> block. For close\n' +
      '             intensity it is a transcript estimate computed outside the instance.\n' +
      '  --model    Model id (windows are family-fuzzy; only *haiku* = 200K, else 1M).\n' +
      '  --for      companion (default) | close — tunes the advice wording.\n' +
      '  --window   Override the window (tokens).\n' +
      '  --json     Emit the full result object.\n'
    );
    process.exit(a.help ? 0 : 2);
  }
  const r = dial(a.tokens, a.model, { window: a.window, forWhom: a.forWhom });
  if (a.json) console.log(JSON.stringify(r, null, 2));
  else console.log(render(r, a.forWhom));
}
