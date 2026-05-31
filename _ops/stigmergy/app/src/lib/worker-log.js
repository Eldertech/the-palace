// Pure classification of the worker log -- the port of Enrichment
// server.py:_last_fire_status, kept pure so it is unit-testable against
// fixture strings without spawning anything.
//
// The actuator appends a fire header `--- worker fire <iso> ---` before each
// spawn and (via exit cleanup) an exit line `--- worker exit pid N at <iso> ---`
// when the child dies. The supervisor itself may write a success marker
// (`-> reload http://localhost...`). A fire block is "committed" when it shows
// a failure pattern, a success marker, or a clean exit line; otherwise the
// newest fire is in-flight. Walking back to the previous committed fire keeps
// the banner from flickering mid-round and from showing a stale failure for a
// round that actually succeeded.

const FIRE_RE = /^--- worker fire (.+) ---\s*$/;
const EXIT_RE = /^--- worker exit pid \d+ at (.+) ---\s*$/;

// Conservative failure patterns -- classify a fire as failed only on a known
// signal (mirrors the Enrichment scars: an expired OAuth token surfaces as
// "Failed to authenticate" / a 401; spawn errors as "ERROR:").
const FAILURE_PATTERNS = [
  'Failed to authenticate',
  'API Error:',
  'ERROR:',
];

const SUCCESS_MARKERS = [
  '-> reload http://localhost',
  '-> reload http://127.0.0.1',
  '→ reload http://localhost',   // the literal arrow the supervisor may emit
  '→ reload http://127.0.0.1',
];

// Return the last n lines of a log string.
export function logTail(text, n = 12) {
  if (typeof text !== 'string' || text === '') return [];
  return text.split(/\r?\n/).slice(-n);
}

// Classify the most recent *committed* fire in a log string.
// Returns one of:
//   { status: 'ok',       fireTs, exitTs|null }
//   { status: 'failed',   fireTs, exitTs|null, errorLine }
//   { status: 'inflight', fireTs }
//   { status: 'none' }
export function lastFireStatus(text) {
  if (typeof text !== 'string' || text.trim() === '') return { status: 'none' };
  const lines = text.split(/\r?\n/);

  const fires = [];
  const exits = [];
  lines.forEach((line, i) => {
    const mf = line.match(FIRE_RE);
    if (mf) { fires.push({ i, ts: mf[1].trim() }); return; }
    const me = line.match(EXIT_RE);
    if (me) exits.push({ i, ts: me[1].trim() });
  });

  if (fires.length === 0) return { status: 'none' };

  for (let k = fires.length - 1; k >= 0; k -= 1) {
    const fire = fires[k];
    const nextFireIdx = k + 1 < fires.length ? fires[k + 1].i : lines.length;
    const block = lines.slice(fire.i + 1, nextFireIdx);

    let exitTs = null;
    for (const e of exits) {
      if (e.i > fire.i && e.i < nextFireIdx) { exitTs = e.ts; break; }
    }

    // Failure first -- never let a later success marker silence an error.
    let errorLine = null;
    for (const line of block) {
      const s = line.trim();
      if (!s) continue;
      if (FAILURE_PATTERNS.some((p) => s.includes(p))) { errorLine = s; break; }
    }
    if (errorLine) return { status: 'failed', fireTs: fire.ts, exitTs, errorLine };

    if (block.some((l) => SUCCESS_MARKERS.some((m) => l.includes(m)))) {
      return { status: 'ok', fireTs: fire.ts, exitTs };
    }

    if (exitTs !== null) return { status: 'ok', fireTs: fire.ts, exitTs };

    // Only the newest fire can legitimately be in-flight; for it, report so.
    if (k === fires.length - 1) return { status: 'inflight', fireTs: fire.ts };
  }
  return { status: 'none' };
}
