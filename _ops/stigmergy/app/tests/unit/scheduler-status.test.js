// Unit tests for server/scheduler.js — the pure parsers + the filesystem-only
// status read + the .paused steer lever. No launchctl, no real ~/Library.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, utimesSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  parsePlistCalendar,
  parseIntervalDays,
  nextFireAfter,
  humanCadence,
  readSchedulerStatus,
  setSchedulerPaused,
} from '../../server/scheduler.js';

const STEWARD_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
  <key>Label</key><string>com.loudon.palace.steward-batch</string>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>6</integer><key>Minute</key><integer>0</integer></dict>
</dict></plist>`;

const SHOPKEEPER_PLIST = STEWARD_PLIST
  .replace('steward-batch', 'shopkeeper-sweep')
  .replace('<integer>0</integer></dict>', '<integer>30</integer></dict>');

const WRAPPER = 'set -uo pipefail\nPALACE="/x"\nINTERVAL_DAYS=2\nMODEL="opus"\n';

function makePalace({ withPlistsInRepo = true, installLabels = [], stamps = {}, logs = [], digest = null, paused = false } = {}) {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-sched-'));
  const hb = join(root, '_ops/heartbeat');
  mkdirSync(join(hb, 'launchd'), { recursive: true });
  mkdirSync(join(hb, 'logs'), { recursive: true });
  if (withPlistsInRepo) {
    writeFileSync(join(hb, 'launchd', 'com.loudon.palace.steward-batch.plist'), STEWARD_PLIST);
    writeFileSync(join(hb, 'launchd', 'com.loudon.palace.shopkeeper-sweep.plist'), SHOPKEEPER_PLIST);
  }
  writeFileSync(join(hb, 'run-steward-batch.sh'), WRAPPER);
  writeFileSync(join(hb, 'run-shopkeeper-sweep.sh'), WRAPPER);

  // A fake LaunchAgents dir; only the labels we name are "installed".
  const laDir = join(root, '_fake-launchagents');
  mkdirSync(laDir, { recursive: true });
  for (const label of installLabels) writeFileSync(join(laDir, `${label}.plist`), STEWARD_PLIST);

  for (const [stampFile, secs] of Object.entries(stamps)) {
    writeFileSync(join(hb, stampFile), String(secs));
  }
  for (const [name, mtimeMs] of logs) {
    const p = join(hb, 'logs', name);
    writeFileSync(p, 'log\n');
    if (mtimeMs) { const t = mtimeMs / 1000; utimesSync(p, t, t); }
  }
  if (digest) {
    const dp = join(root, '_ops/stigmergy/trickster-auto/heartbeat-latest.md');
    mkdirSync(join(root, '_ops/stigmergy/trickster-auto'), { recursive: true });
    writeFileSync(dp, digest.text);
    if (digest.mtimeMs) { const t = digest.mtimeMs / 1000; utimesSync(dp, t, t); }
  }
  if (paused) writeFileSync(join(hb, '.paused'), 'paused by test\n');

  return { root, laDir, hb };
}

describe('scheduler pure parsers', () => {
  test('parsePlistCalendar reads Hour/Minute from StartCalendarInterval', () => {
    expect(parsePlistCalendar(STEWARD_PLIST)).toEqual({ hour: 6, minute: 0 });
    expect(parsePlistCalendar(SHOPKEEPER_PLIST)).toEqual({ hour: 6, minute: 30 });
  });

  test('parsePlistCalendar returns null when no interval', () => {
    expect(parsePlistCalendar('<plist><dict></dict></plist>')).toBeNull();
    expect(parsePlistCalendar('')).toBeNull();
  });

  test('parseIntervalDays reads the wrapper guard', () => {
    expect(parseIntervalDays(WRAPPER)).toBe(2);
    expect(parseIntervalDays('INTERVAL_DAYS=1\n')).toBe(1);
    expect(parseIntervalDays('no guard here')).toBeNull();
  });

  test('nextFireAfter rolls to tomorrow when the time today has passed', () => {
    // now = 2026-06-22 08:00 local; 06:00 already passed -> tomorrow 06:00.
    const now = new Date(2026, 5, 22, 8, 0, 0, 0).getTime();
    const next = nextFireAfter({ hour: 6, minute: 0, now });
    expect(next.getDate()).toBe(23);
    expect(next.getHours()).toBe(6);
  });

  test('nextFireAfter stays today when the time is still ahead', () => {
    const now = new Date(2026, 5, 22, 4, 0, 0, 0).getTime();
    const next = nextFireAfter({ hour: 6, minute: 0, now });
    expect(next.getDate()).toBe(22);
    expect(next.getHours()).toBe(6);
  });

  test('humanCadence renders the every-N-days guard', () => {
    expect(humanCadence({ hour: 6, minute: 0, intervalDays: 2 })).toBe('06:00 daily · every 2 days (guard)');
    expect(humanCadence({ hour: 6, minute: 30, intervalDays: 1 })).toBe('06:30 daily');
  });
});

describe('readSchedulerStatus — the truthful watch', () => {
  let made;
  afterEach(() => { if (made) rmSync(made.root, { recursive: true, force: true }); made = null; });

  test('reports NOT INSTALLED (today\'s real state) with a loud warning', () => {
    made = makePalace({ installLabels: [] });
    const s = readSchedulerStatus({ palaceRoot: made.root, launchAgentsDir: made.laDir });
    expect(s.ok).toBe(true);
    const steward = s.jobs.find((j) => j.primary);
    expect(steward.installed).toBe(false);
    expect(steward.repo_plist).toBe(true);
    expect(steward.state).toBe('not_installed');
    expect(s.warnings.some((w) => /NOT INSTALLED/.test(w))).toBe(true);
    // It does not pretend to know launchctl ground truth.
    expect(s.note).toMatch(/never calls launchctl/i);
  });

  test('installed-but-never-run reports cadence + next_fire and the never-run state', () => {
    made = makePalace({ installLabels: ['com.loudon.palace.steward-batch'] });
    const now = new Date(2026, 5, 22, 8, 0, 0, 0).getTime();
    const s = readSchedulerStatus({ palaceRoot: made.root, launchAgentsDir: made.laDir, now });
    const steward = s.jobs.find((j) => j.primary);
    expect(steward.installed).toBe(true);
    expect(steward.state).toBe('installed_never_run');
    expect(steward.cadence.human).toBe('06:00 daily · every 2 days (guard)');
    expect(steward.next_fire).toBe(new Date(2026, 5, 23, 6, 0, 0, 0).toISOString());
    expect(s.warnings.some((w) => /NOT INSTALLED/.test(w))).toBe(false);
  });

  test('a recent run surfaces last_run + the 2-day guard would-skip', () => {
    const now = new Date(2026, 5, 22, 8, 0, 0, 0).getTime();
    const ranMs = now - 6 * 3.6e6; // 6h ago
    made = makePalace({
      installLabels: ['com.loudon.palace.steward-batch'],
      stamps: { '.last-steward-batch': Math.floor(ranMs / 1000) },
      logs: [['steward-batch-2026-06-22T02-00-00.log', ranMs]],
    });
    const s = readSchedulerStatus({ palaceRoot: made.root, launchAgentsDir: made.laDir, now });
    const steward = s.jobs.find((j) => j.primary);
    expect(steward.state).toBe('scheduled');
    expect(steward.last_run.stamp_at).toBe(new Date(ranMs).toISOString());
    expect(steward.last_run.log_file).toBe('steward-batch-2026-06-22T02-00-00.log');
    expect(steward.last_run.age_hours).toBeCloseTo(6, 1);
    // next fire is tomorrow 06:00; only ~22h after a run 6h ago < 48h -> skip.
    expect(steward.next_fire_would_skip_guard).toBe(true);
  });

  test('paused state + warning when the flag is present', () => {
    made = makePalace({ installLabels: ['com.loudon.palace.steward-batch'], paused: true });
    const s = readSchedulerStatus({ palaceRoot: made.root, launchAgentsDir: made.laDir });
    expect(s.paused).toBe(true);
    expect(s.jobs.find((j) => j.primary).state).toBe('paused');
    expect(s.warnings.some((w) => /PAUSED/.test(w))).toBe(true);
  });

  test('digest age comes from the run date, NOT the (fresh-checkout) mtime', () => {
    const now = new Date(2026, 5, 22, 8, 0, 0, 0).getTime();
    // The bug this guards: a fresh git checkout sets mtime to ~now, so an mtime-
    // based age would read "minutes old" for a two-week-old digest. Set mtime
    // FRESH and the run date OLD; the age must follow the run date.
    made = makePalace({
      installLabels: ['com.loudon.palace.steward-batch'],
      digest: { text: '# Palace Heartbeat — Steward Batch Review\n\n**Run:** 2026-06-06 (~10:09 UTC)\n', mtimeMs: now },
    });
    const s = readSchedulerStatus({ palaceRoot: made.root, launchAgentsDir: made.laDir, now });
    expect(s.digest.exists).toBe(true);
    expect(s.digest.run_label).toMatch(/2026-06-06/);
    expect(s.digest.markdown).toMatch(/Steward Batch Review/);
    expect(s.digest.age_basis).toBe('run_date');
    expect(s.digest.age_hours).toBeGreaterThan(72); // ~16 days, despite fresh mtime
    expect(s.warnings.some((w) => /DIGEST STALE/.test(w))).toBe(true);
  });

  test('digest age falls back to mtime when no run date is parseable', () => {
    const now = new Date(2026, 5, 22, 8, 0, 0, 0).getTime();
    const old = now - 5 * 24 * 3.6e6; // 5 days old by mtime
    made = makePalace({
      installLabels: ['com.loudon.palace.steward-batch'],
      digest: { text: '# A digest with no Run line\n', mtimeMs: old },
    });
    const s = readSchedulerStatus({ palaceRoot: made.root, launchAgentsDir: made.laDir, now });
    expect(s.digest.age_basis).toBe('file_mtime');
    expect(s.digest.age_hours).toBeCloseTo(120, 0);
  });

  test('no palace root -> structured 500-shaped error, never a throw', () => {
    const s = readSchedulerStatus({});
    expect(s.ok).toBe(false);
    expect(s.status).toBe(500);
  });
});

describe('setSchedulerPaused — the one steer lever', () => {
  let made;
  afterEach(() => { if (made) rmSync(made.root, { recursive: true, force: true }); made = null; });

  test('pause writes the flag; resume removes it; status reflects both', () => {
    made = makePalace({ installLabels: ['com.loudon.palace.steward-batch'] });
    const flag = join(made.hb, '.paused');

    const p = setSchedulerPaused({ palaceRoot: made.root, paused: true });
    expect(p.ok).toBe(true);
    expect(p.paused).toBe(true);
    expect(existsSync(flag)).toBe(true);
    expect(readSchedulerStatus({ palaceRoot: made.root, launchAgentsDir: made.laDir }).paused).toBe(true);

    const r = setSchedulerPaused({ palaceRoot: made.root, paused: false });
    expect(r.ok).toBe(true);
    expect(r.paused).toBe(false);
    expect(existsSync(flag)).toBe(false);
    expect(readSchedulerStatus({ palaceRoot: made.root, launchAgentsDir: made.laDir }).paused).toBe(false);
  });

  test('resume is idempotent when already unpaused', () => {
    made = makePalace({});
    const r = setSchedulerPaused({ palaceRoot: made.root, paused: false });
    expect(r.ok).toBe(true);
    expect(r.paused).toBe(false);
  });

  test('rejects a non-boolean paused', () => {
    made = makePalace({});
    const r = setSchedulerPaused({ palaceRoot: made.root, paused: 'yes' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });
});
