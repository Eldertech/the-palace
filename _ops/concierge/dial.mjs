#!/usr/bin/env node
// The Concierge health dial — one objective read, two axes, two callers.
//
// Reads a single OBJECTIVE token count (never the judged instance's self-report)
// and reports on two SEPARATE axes that must not be confused:
//
//   • CAPACITY (tokens ÷ model window) — the TRUST axis. How full the context is,
//     and therefore whether the agent is still reliable. This is the same % you see
//     in a Claude Code meter. Trust holds far past 25% — models are fine to ~60%,
//     soften 60–80%, and only genuinely degrade past ~80% (forgetting the middle,
//     truncation). This is the axis that answers "should I not trust it?"
//
//   • LOAD (absolute accumulated tokens) — NOT a trust axis. Same number, read for a
//     different question depending on the caller:
//       – companion → COST. Every resume re-bills the whole accumulated context, so
//         a heavy resident is expensive to keep waking. This is an advisory ("respawn
//         to reset to the ~62K floor to save tokens"), never a reliability alarm.
//       – close     → SPENTNESS. How much arc the session accumulated = how spent the
//         parent is = how much the moderator must carry. A big day reads heavy even at
//         a small % of a 1M window, which is exactly why close keys on load, not %.
//
// The design constraint this exists to enforce (proven 2026-07-04, when a live
// instance asserted "context full" while it was not): the number comes from the
// harness/transcript, NOT from asking the agent how full it feels. Pipe it in.
//
//   companion health → tokens = `subagent_tokens` from the Agent tool <usage> block.
//   close intensity  → tokens = a transcript token estimate for the MAIN thread,
//                      computed OUTSIDE the judged instance.
//
// Usage:
//   node dial.mjs --tokens 89106 --model claude-opus-4-8
//   node dial.mjs --tokens 260000 --model claude-opus-4-8 --for close
//   node dial.mjs --tokens 150000 --model claude-haiku-4-5 --json
//
// Calibrations are first-cut and meant to be re-tuned by real runs — the sensor
// semantics are inferred black-box; re-check periodically.

// ── Model windows ────────────────────────────────────────────────────────────
// Family-fuzzy so version drift doesn't strand the table: only the Haiku family
// is 200K; every current + future large-context model is 1M. Override with --window.
function windowFor(model) {
  const m = (model || '').toLowerCase();
  if (m.includes('haiku')) return 200_000;
  return 1_000_000; // opus / sonnet / fable / unknown-large
}

// ── Thresholds ───────────────────────────────────────────────────────────────
// CAPACITY = trust. Fraction of the window. Models stay reliable well up: full
// trust below ~60%, watch 60–80% (long-context recall softens — "lost in the
// middle"), degraded past 80% (forgets the middle, truncation risk).
const CAP = { watch: 0.60, degraded: 0.80 };

// LOAD = absolute accumulation. Drives the cost note (companion) and the close
// intensity. Window-independent by design: 200K of work is a big day on any model.
const LOAD = { yellow: 100_000, red: 200_000 };

const zoneByPct = (pct) => (pct >= CAP.degraded ? 'red' : pct >= CAP.watch ? 'yellow' : 'green');
const zoneByLoad = (n) => (n >= LOAD.red ? 'red' : n >= LOAD.yellow ? 'yellow' : 'green');

// ── Verdict vocabulary ───────────────────────────────────────────────────────
// TRUST — capacity-driven; the companion-health headline.
const TRUST = {
  green: 'trust — plenty of headroom; continue',
  yellow: 'watch — still reliable, but long-context recall is softening; double-check anything that leans on early context',
  red: 'degraded — do not fully trust; compact or respawn for reliability, not just cost',
};

// COST — load-driven; a companion advisory, never a trust alarm. `k` formats tokens.
function costNote(zone, k) {
  if (zone === 'green') return null; // cheap enough to not mention
  const base = `each resume re-reads ~${k} before doing any work`;
  return zone === 'red'
    ? `${base} — expensive; respawn resets to the ~62K floor, worth it unless the session is nearly done`
    : `${base} — getting pricey; respawn to reset if many more addresses remain`;
}

// INTENSITY — load-driven; the close headline (how spent the parent is).
const INTENSITY = {
  green: 'slim close — the parent is fresh (little accumulated); the moderator mostly confirms',
  yellow: 'standard close — a substantial session; the moderator reads the arc and drafts the reckoning fully',
  red: 'heavy close — a big, spent session; the moderator carries the reckoning, reads coldest, and trusts the transcript over the tired account',
};

// ── Core ─────────────────────────────────────────────────────────────────────
export function dial(tokens, model, { window: win, forWhom = 'companion' } = {}) {
  const window = win || windowFor(model);
  const pct = tokens / window;
  const capZone = zoneByPct(pct);
  const loadZone = zoneByLoad(tokens);
  const kTok = tokens >= 1000 ? `${Math.round(tokens / 100) / 10}K` : String(tokens);

  const base = {
    tokens,
    model: model || '(unspecified)',
    window,
    for: forWhom,
    capacity: { pct: Math.round(pct * 1000) / 10, zone: capZone }, // trust axis
    load: { tokens, zone: loadZone },                              // accumulation axis
  };

  if (forWhom === 'close') {
    // Spentness is the headline; capacity is a side-caution only if somehow high.
    return {
      ...base,
      verdict: loadZone,
      action: INTENSITY[loadZone],
      note: capZone === 'green' ? null
        : `capacity also ${capZone} at ${base.capacity.pct}% — the parent itself is near its own limit`,
    };
  }
  // companion: trust is the headline; cost is a separate advisory.
  return {
    ...base,
    verdict: capZone,
    action: TRUST[capZone],
    note: costNote(loadZone, kTok), // cost, NOT trust — may be null
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

function render(r) {
  const k = (n) => (n >= 1000 ? `${Math.round(n / 100) / 10}K` : String(n));
  const head = r.for === 'close'
    ? `${DOT[r.verdict]} ${r.verdict.toUpperCase()}  accumulated ${k(r.tokens)}  ` +
      `\x1b[2m(${r.capacity.pct}% of the ${k(r.window)} window)\x1b[0m`
    : `${DOT[r.verdict]} ${r.verdict.toUpperCase()}  ${k(r.tokens)} / ${k(r.window)} = ${r.capacity.pct}% capacity`;
  const lines = [head, `  ${r.action}`];
  if (r.note) lines.push(r.for === 'close' ? `  \x1b[2mnote: ${r.note}\x1b[0m` : `  \x1b[2mcost: ${r.note}\x1b[0m`);
  return lines.join('\n');
}

import { pathToFileURL } from 'node:url';
const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const a = parseArgs(process.argv.slice(2));
  if (a.help || a.tokens === undefined || Number.isNaN(a.tokens)) {
    console.error(
      'The Concierge health dial — objective read → trust verdict (+ cost / intensity).\n\n' +
      'Usage: node dial.mjs --tokens <N> --model <id> [--for companion|close] [--window N] [--json]\n\n' +
      '  --tokens   REQUIRED. The objective count. Companion health: `subagent_tokens`\n' +
      '             from the Agent tool <usage> block. Close intensity: a transcript\n' +
      '             estimate computed outside the instance.\n' +
      '  --model    Model id (windows are family-fuzzy; only *haiku* = 200K, else 1M).\n' +
      '  --for      companion (default) — headline is TRUST (capacity), cost is a note.\n' +
      '             close — headline is INTENSITY (how spent the parent is).\n' +
      '  --window   Override the window (tokens).\n' +
      '  --json     Emit the full result object.\n'
    );
    process.exit(a.help ? 0 : 2);
  }
  const r = dial(a.tokens, a.model, { window: a.window, forWhom: a.forWhom });
  if (a.json) console.log(JSON.stringify(r, null, 2));
  else console.log(render(r));
}
