// server/scheduler.js — the WATCH-AND-STEER surface for the Mac-side heartbeat
// scheduler (the launchd jobs in _ops/heartbeat/).
//
// The autonomy mechanism is NOT greenfield: the steward batch + Shopkeeper sweep
// already auto-fire via launchd plists in _ops/heartbeat/launchd/, each wrapped
// by a shell script that holds a 2-day stamp guard. The problem the v2.0 baton
// names is that this machinery is an INVISIBLE cron — and right now it is not
// even installed. This module makes it legible (WATCH) and gives it one honest
// lever (STEER), without ever shelling out.
//
// Two hard rules from the design (Loudon's call this round):
//   1. STIGMERGY NEVER runs `launchctl`. Install/load is the operator's act
//      (see _ops/heartbeat/README.md). This module INFERS state from the
//      filesystem only — the in-repo plists, the LaunchAgents install dir, the
//      run stamps + logs, and the .paused flag. It says so out loud (`note`),
//      so a reader never mistakes inference for launchctl ground truth.
//   2. The single steer lever is a `.paused` FLAG-FILE the wrappers check and
//      no-op on. Pause/resume is a file write, not a process call — no shell,
//      no permission surface, trivially reversible.
//
// The first milestone the baton insists on: the status must be TRUTHFUL — it
// must show "not installed" until launchd is actually loaded (today's real
// state), never a comforting green that lies.

import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const HEARTBEAT_REL = '_ops/heartbeat';
const DIGEST_REL = '_ops/stigmergy/trickster-auto/heartbeat-latest.md';
const PAUSE_BASENAME = '.paused';

// The two heartbeat jobs, in display order. The steward-batch is the primary
// surface for the STEWARDS deck; the shopkeeper-sweep rides alongside because
// the `.paused` flag pauses BOTH wrappers (a genuine global heartbeat pause).
const JOBS = [
  {
    kind: 'steward-batch',
    primary: true,
    label: 'com.loudon.palace.steward-batch',
    plist: 'com.loudon.palace.steward-batch.plist',
    wrapper: 'run-steward-batch.sh',
    stamp: '.last-steward-batch',
    logPrefix: 'steward-batch-',
    title: 'steward batch',
  },
  {
    kind: 'shopkeeper-sweep',
    primary: false,
    label: 'com.loudon.palace.shopkeeper-sweep',
    plist: 'com.loudon.palace.shopkeeper-sweep.plist',
    wrapper: 'run-shopkeeper-sweep.sh',
    stamp: '.last-shopkeeper-sweep',
    logPrefix: 'shopkeeper-sweep-',
    title: 'shopkeeper sweep',
  },
];

// ── pure parsers (exported for unit tests) ──────────────────────────────────

/** Parse the StartCalendarInterval Hour/Minute from a launchd plist's XML. */
export function parsePlistCalendar(xml) {
  const src = String(xml ?? '');
  // Scope to the StartCalendarInterval dict so a stray Hour/Minute elsewhere
  // can't be misread. The plists here are simple single-interval dicts.
  const seg = src.slice(src.indexOf('StartCalendarInterval'));
  const hour = seg.match(/<key>Hour<\/key>\s*<integer>(\d+)<\/integer>/);
  const minute = seg.match(/<key>Minute<\/key>\s*<integer>(\d+)<\/integer>/);
  if (!hour && !minute) return null;
  return {
    hour: hour ? Number(hour[1]) : null,
    minute: minute ? Number(minute[1]) : 0,
  };
}

/** Parse the `INTERVAL_DAYS=N` cadence guard from a wrapper script. */
export function parseIntervalDays(sh) {
  const m = String(sh ?? '').match(/^\s*INTERVAL_DAYS=(\d+)/m);
  return m ? Number(m[1]) : null;
}

/**
 * The next wall-clock fire at hour:minute strictly after `now`, in LOCAL time
 * (launchd's StartCalendarInterval is local). Returns a Date, or null when the
 * cadence is unknown.
 */
export function nextFireAfter({ hour, minute, now = Date.now() }) {
  if (!Number.isFinite(hour)) return null;
  const min = Number.isFinite(minute) ? minute : 0;
  const base = new Date(now);
  const fire = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, min, 0, 0);
  if (fire.getTime() <= now) fire.setDate(fire.getDate() + 1);
  return fire;
}

/** A one-line human cadence string, e.g. "06:00 daily · every 2 days (guard)". */
export function humanCadence({ hour, minute, intervalDays }) {
  if (!Number.isFinite(hour)) return 'unknown';
  const hh = String(hour).padStart(2, '0');
  const mm = String(Number.isFinite(minute) ? minute : 0).padStart(2, '0');
  const base = `${hh}:${mm} daily`;
  if (Number.isFinite(intervalDays) && intervalDays > 1) return `${base} · every ${intervalDays} days (guard)`;
  return base;
}

function hoursBetween(laterMs, earlierMs) {
  if (!Number.isFinite(laterMs) || !Number.isFinite(earlierMs)) return null;
  return (laterMs - earlierMs) / 3.6e6;
}

// ── filesystem reads ────────────────────────────────────────────────────────

/** Default install dir launchd reads (per the README's `cp … ~/Library/LaunchAgents`). */
export function defaultLaunchAgentsDir() {
  return join(homedir(), 'Library', 'LaunchAgents');
}

/** Epoch-seconds stamp file -> ms, or null. The wrapper writes `date +%s`. */
function readStampMs(stampPath) {
  try {
    const raw = readFileSync(stampPath, 'utf8').trim();
    const secs = Number(raw);
    return Number.isFinite(secs) && secs > 0 ? secs * 1000 : null;
  } catch { return null; }
}

/** Newest `${prefix}*.log` in the logs dir -> { file, at_ms }, or null. */
function newestLog(logsDir, prefix) {
  let best = null;
  try {
    for (const name of readdirSync(logsDir)) {
      if (!name.startsWith(prefix) || !name.endsWith('.log')) continue;
      let mtimeMs;
      try { mtimeMs = statSync(join(logsDir, name)).mtimeMs; } catch { continue; }
      if (!best || mtimeMs > best.at_ms) best = { file: name, at_ms: mtimeMs };
    }
  } catch { /* no logs dir yet */ }
  return best;
}

function isoOrNull(ms) {
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

/**
 * Read the whole scheduler picture from the filesystem. No launchctl, no shell.
 *
 * @param {object} opts
 * @param {string} opts.palaceRoot
 * @param {string} [opts.launchAgentsDir] — defaults to ~/Library/LaunchAgents
 * @param {number} [opts.now] — epoch ms (injectable for tests)
 * @returns {object} the status object served at GET /api/scheduler/status
 */
export function readSchedulerStatus({ palaceRoot, launchAgentsDir, now = Date.now() } = {}) {
  if (!palaceRoot) return { ok: false, status: 500, error: 'no palace root configured' };
  const heartbeatDir = join(palaceRoot, HEARTBEAT_REL);
  const logsDir = join(heartbeatDir, 'logs');
  const laDir = launchAgentsDir || defaultLaunchAgentsDir();

  // The global pause flag — one file, both wrappers honor it.
  const flagPath = join(heartbeatDir, PAUSE_BASENAME);
  const paused = existsSync(flagPath);
  let pausedSince = null, pausedNote = null;
  if (paused) {
    try { pausedSince = new Date(statSync(flagPath).mtimeMs).toISOString(); } catch { /* keep null */ }
    try { pausedNote = readFileSync(flagPath, 'utf8').split('\n').find((l) => l.trim() && !l.startsWith('#'))?.trim() ?? null; } catch { /* keep null */ }
  }

  const jobs = JOBS.map((j) => {
    const repoPlistPath = join(heartbeatDir, 'launchd', j.plist);
    const repoPlist = existsSync(repoPlistPath);
    let cadence = null;
    if (repoPlist) {
      try { cadence = parsePlistCalendar(readFileSync(repoPlistPath, 'utf8')); } catch { /* unparsable */ }
    }
    let intervalDays = null;
    try { intervalDays = parseIntervalDays(readFileSync(join(heartbeatDir, j.wrapper), 'utf8')); } catch { /* missing */ }

    const installed = existsSync(join(laDir, j.plist));
    const stampMs = readStampMs(join(heartbeatDir, j.stamp));
    const log = newestLog(logsDir, j.logPrefix);

    const next = cadence ? nextFireAfter({ hour: cadence.hour, minute: cadence.minute, now }) : null;
    const nextFireMs = next ? next.getTime() : null;
    // The 2-day stamp guard would skip the next clock fire if too soon after the
    // last real run — surfaced honestly so "fires daily" isn't mistaken for
    // "runs daily".
    const wouldSkipGuard = (Number.isFinite(nextFireMs) && Number.isFinite(stampMs) && Number.isFinite(intervalDays))
      ? hoursBetween(nextFireMs, stampMs) < intervalDays * 24
      : false;

    let state;
    if (!installed) state = 'not_installed';
    else if (paused) state = 'paused';
    else if (!Number.isFinite(stampMs)) state = 'installed_never_run';
    else state = 'scheduled';

    return {
      kind: j.kind,
      primary: j.primary,
      title: j.title,
      label: j.label,
      repo_plist: repoPlist,
      installed,
      cadence: cadence ? {
        hour: cadence.hour,
        minute: cadence.minute,
        interval_days: intervalDays,
        human: humanCadence({ hour: cadence.hour, minute: cadence.minute, intervalDays }),
      } : null,
      last_run: {
        stamp_at: isoOrNull(stampMs),
        log_at: log ? isoOrNull(log.at_ms) : null,
        log_file: log ? log.file : null,
        age_hours: Number.isFinite(stampMs) ? round1(hoursBetween(now, stampMs)) : null,
      },
      next_fire: next ? next.toISOString() : null,
      next_fire_would_skip_guard: wouldSkipGuard,
      state,
    };
  });

  // The digest — render inline WITH ITS AGE (the baton: a stale digest must read
  // as stale, not as fresh).
  const digestPath = join(palaceRoot, DIGEST_REL);
  let digest = { path: DIGEST_REL, exists: false, mtime: null, age_hours: null, run_label: null, markdown: null };
  if (existsSync(digestPath)) {
    let markdown = null, mtimeMs = null;
    try { markdown = readFileSync(digestPath, 'utf8'); } catch { /* unreadable */ }
    try { mtimeMs = statSync(digestPath).mtimeMs; } catch { /* keep null */ }
    const runLabel = markdown ? (markdown.match(/\*\*Run:\*\*\s*(.+)/)?.[1]?.trim() ?? null) : null;
    // Age from the digest's OWN run date ("**Run:** YYYY-MM-DD"), NOT the file
    // mtime: a fresh git checkout (e.g. a worktree) resets mtime to "now", which
    // would make a two-week-old digest read as minutes old — the precise kind of
    // comforting lie the baton says this surface must never tell. Fall back to
    // mtime only when no run date is parseable.
    const runDateMatch = markdown ? markdown.match(/\*\*Run:\*\*\s*(\d{4}-\d{2}-\d{2})/) : null;
    const runAtMs = runDateMatch ? Date.parse(runDateMatch[1]) : NaN;
    const ageBasisMs = Number.isFinite(runAtMs) ? runAtMs : mtimeMs;
    digest = {
      path: DIGEST_REL,
      exists: true,
      mtime: isoOrNull(mtimeMs),
      run_at: Number.isFinite(runAtMs) ? new Date(runAtMs).toISOString() : null,
      age_basis: Number.isFinite(runAtMs) ? 'run_date' : 'file_mtime',
      age_hours: Number.isFinite(ageBasisMs) ? round1(hoursBetween(now, ageBasisMs)) : null,
      run_label: runLabel,
      markdown,
    };
  }

  // Warnings — the honest, loud signals the surface must not bury.
  const warnings = [];
  const primary = jobs.find((j) => j.primary);
  if (primary && !primary.installed) {
    warnings.push('NOT INSTALLED — launchd has no steward-batch job loaded; the scheduler will not auto-fire. Install it from _ops/heartbeat/README.md.');
  }
  if (paused) warnings.push('PAUSED — the heartbeat wrappers no-op while the .paused flag is present; resume to re-enable.');
  if (digest.exists && Number.isFinite(digest.age_hours) && digest.age_hours > 72) {
    warnings.push(`DIGEST STALE — the steward-batch review digest is ${Math.round(digest.age_hours / 24)} days old.`);
  }

  return {
    ok: true,
    generated_at: new Date(now).toISOString(),
    paused,
    paused_since: pausedSince,
    paused_note: pausedNote,
    pause_flag_rel: `${HEARTBEAT_REL}/${PAUSE_BASENAME}`,
    jobs,
    digest,
    warnings,
    // Say plainly how this was learned — never let inference masquerade as the
    // launchctl ground truth STIGMERGY deliberately does not consult.
    note: 'STIGMERGY infers install state from ~/Library/LaunchAgents and run state from the heartbeat stamps/logs; it never calls launchctl. Loading/unloading the launchd job stays the operator’s act.',
  };
}

function round1(n) {
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

// ── the one steer lever: toggle the .paused flag-file ───────────────────────

/**
 * Pause or resume the heartbeat by writing/removing the `.paused` flag-file the
 * wrappers check. This is the ONLY write this module performs — and it is a
 * file, never a launchctl call.
 *
 * @param {object} opts
 * @param {string} opts.palaceRoot
 * @param {boolean} opts.paused — desired state (true = paused)
 * @param {number} [opts.now] — epoch ms (injectable for tests)
 * @returns {object} { ok, paused, flag_path, paused_since? } or { ok:false, status, error }
 */
export function setSchedulerPaused({ palaceRoot, paused, now = Date.now() } = {}) {
  if (!palaceRoot) return { ok: false, status: 500, error: 'no palace root configured' };
  if (typeof paused !== 'boolean') return { ok: false, status: 400, error: '"paused" must be a boolean' };
  const heartbeatDir = join(palaceRoot, HEARTBEAT_REL);
  const flagPath = join(heartbeatDir, PAUSE_BASENAME);
  try {
    if (paused) {
      mkdirSync(heartbeatDir, { recursive: true });
      const ts = new Date(now).toISOString();
      writeFileSync(flagPath,
        `paused by STIGMERGY at ${ts}\n` +
        '# While this file exists, the heartbeat wrappers (run-steward-batch.sh,\n' +
        '# run-shopkeeper-sweep.sh) no-op on each fire. Remove it — or click resume\n' +
        '# in the STEWARDS deck — to re-enable. launchd is never touched.\n',
        'utf8');
      return { ok: true, paused: true, flag_path: flagPath, pause_flag_rel: `${HEARTBEAT_REL}/${PAUSE_BASENAME}`, paused_since: ts };
    }
    if (existsSync(flagPath)) rmSync(flagPath, { force: true });
    return { ok: true, paused: false, flag_path: flagPath, pause_flag_rel: `${HEARTBEAT_REL}/${PAUSE_BASENAME}` };
  } catch (err) {
    return { ok: false, status: 500, error: `pause toggle failed: ${err.message}` };
  }
}
