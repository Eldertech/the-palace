// server/projects.js — the PROJECTS deck's data: every `type: project` entry
// as one row, stewarded or not, plus the read/write seam for its scroll.
//
// The big-picture view Loudon asked for (2026-09-23): "no really good big-
// picture view of the projects and all their current states." One row per
// project, computed by the SAME code the scroll's Now zone uses (computeNow in
// the orchestrator's scroll-file.js) — so the table and the scroll can never
// disagree about what is waiting on him, what is ready to advance, or which
// steward is stalled. One rule, two readers.
//
// Reading a scroll here regenerates its Now zone IN MEMORY for display (the
// "regenerated on every look" promise) without touching disk — the on-disk
// scroll is written by steward cycles, by an explicit `write`, and whenever
// Loudon saves Standing Orders. That keeps the working tree quiet between
// cycles while the terminal always shows the live state.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { readJsonl } from '@stigmergy/core/blackboard';
import { listProjectEntries, stewardIndex } from '../../orchestrator/src/scroll.js';
import {
  MARK, ORDERS_PLACEHOLDER, computeNow, renderNow, renderSkeleton, readZone, readStandingOrders,
  updateScrollText, materializeScroll, lastGitTouch, scanBundleMediaFiles,
} from '../../orchestrator/src/scroll-file.js';
import { resolveBundleDir } from '../../orchestrator/src/entry-paths.js';
import { parseFrontmatter } from '../../orchestrator/src/entry-frontmatter.js';
import { enchantSteward } from '../../orchestrator/src/enchant.js';

const PERSISTENT_REL = '_ops/swarm/persistent/blackboard.jsonl';

function readBoard(palaceRoot) {
  const p = join(palaceRoot, PERSISTENT_REL);
  return existsSync(p) ? readJsonl(p) : [];
}

function readJsonSafe(p) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}

function readHistorySafe(p) {
  try {
    return readFileSync(p, 'utf8').trim().split('\n').filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}

/**
 * Sort key for the table: what needs Loudon first, then what he can advance,
 * then what is stuck, then everything else by most recent activity. Pure.
 */
export function projectSortKey(row) {
  // lower sorts first
  let bucket = 4;
  if (row.open_asks > 0) bucket = 0;
  else if (row.answered_unconsumed > 0) bucket = 1;
  else if (row.stalled) bucket = 2;
  else if (row.stewarded) bucket = 3;
  const t = row.last_activity ? Date.parse(row.last_activity) : 0;
  return [bucket, -(Number.isNaN(t) ? 0 : t)];
}

export function sortProjects(rows) {
  return rows.slice().sort((a, b) => {
    const [ba, ta] = projectSortKey(a);
    const [bb, tb] = projectSortKey(b);
    return ba - bb || ta - tb || String(a.home).localeCompare(String(b.home));
  });
}

/**
 * One row per `type: project` entry. `stewardLane` (optional) supplies the
 * live worker status so the row can show "● running" and the run position.
 */
export function buildProjectRows({ palaceRoot, board = null, stewardLane = null, now = new Date().toISOString() }) {
  const boardMsgs = board || readBoard(palaceRoot);
  const stewards = stewardIndex(palaceRoot);
  const worker = stewardLane ? stewardLane.status() : null;
  const rows = [];
  for (const p of listProjectEntries(palaceRoot)) {
    const bundle = resolveBundleDir(palaceRoot, p.title);
    const entryText = (() => { try { return readFileSync(join(palaceRoot, p.file), 'utf8'); } catch { return ''; } })();
    const fm = parseFrontmatter(entryText);
    const s = stewards.get(p.title) || null;
    let state = null; let history = []; let manifest = null;
    if (s) {
      const dirAbs = s.dir.startsWith('/') ? s.dir : join(palaceRoot, s.dir);
      state = readJsonSafe(join(dirAbs, 'state.json'));
      manifest = readJsonSafe(join(dirAbs, 'manifest.json'));
      history = readHistorySafe(join(dirAbs, 'history.jsonl'));
    }
    const nowView = computeNow({
      home: p.title, board: boardMsgs, state, history,
      meta: { stage: fm.stage, data: fm }, entryText, tsNow: now,
      lastTouch: null, bundleMedia: [],
    });
    const scrollRel = bundle ? relative(palaceRoot, join(bundle.bundleDir, `${p.title} — scroll.md`)) : null;
    const scrollExists = scrollRel ? existsSync(join(palaceRoot, scrollRel)) : false;
    const lastShip = nowView.last_shipped;
    const lastActivity = [nowView.latest_spoken_ts, state && state.last_active].filter(Boolean).sort().pop() || null;
    const running = !!(worker && worker.running && worker.current === p.title);
    rows.push({
      home: p.title,
      path: p.file,
      status: p.status,
      stage: p.stage,
      stewarded: !!s,
      steward_dir: s ? s.dir : null,
      iteration: nowView.iteration,
      last_active: nowView.last_active,
      run_cap: manifest && manifest.stopping_conditions && Number.isInteger(manifest.stopping_conditions.max_iterations) ? manifest.stopping_conditions.max_iterations : (s ? 1 : null),
      model: manifest && manifest.model ? manifest.model.name || null : null,
      health: state && state.health ? state.health.score || null : null,
      stalled: nowView.stall.stalled,
      barren_streak: nowView.stall.barren_streak,
      open_asks: nowView.open.length,
      open_blocking: nowView.open.some((r) => r.blocking),
      answered_unconsumed: nowView.answered_unconsumed.length,
      last_shipped: lastShip ? { id: lastShip.id, ts: lastShip.ts, headline: (lastShip.payload && (lastShip.payload.headline || lastShip.payload.subject)) || null } : null,
      last_activity: lastActivity,
      drift: nowView.drift,
      stands: nowView.stands || '',
      scroll_path: scrollRel,
      scroll_exists: scrollExists,
      running,
      run: running && worker.current_run ? { position: worker.current_run.position, cap: worker.current_run.cap, cycle_n: worker.current_run.cycle_n } : null,
    });
  }
  return sortProjects(rows);
}

/**
 * Read a project's scroll with a LIVE Now zone. Returns the full text as it
 * would be on disk after a regeneration (without writing unless `write`).
 * A project with no scroll yet gets one rendered in memory (and on disk when
 * `write`), so the deck can always open a project.
 */
export function readScroll({ palaceRoot, home, write = false, now = new Date().toISOString() }) {
  const bundle = resolveBundleDir(palaceRoot, home);
  if (!bundle) return null;
  const stewards = stewardIndex(palaceRoot);
  const s = stewards.get(home) || null;
  const scrollPath = join(bundle.bundleDir, `${home} — scroll.md`);
  if (write) {
    const r = materializeScroll({ palaceRoot, home, agentDir: s ? s.dir : undefined, tsNow: now });
    if (!r.written && r.reason) return { home, path: relative(palaceRoot, scrollPath), exists: false, error: r.reason };
  }
  // In-memory regeneration: same inputs the materializer uses.
  const board = readBoard(palaceRoot);
  let state = null; let history = [];
  if (s) {
    const dirAbs = s.dir.startsWith('/') ? s.dir : join(palaceRoot, s.dir);
    state = readJsonSafe(join(dirAbs, 'state.json'));
    history = readHistorySafe(join(dirAbs, 'history.jsonl'));
  }
  const entryText = (() => { try { return readFileSync(bundle.entryFile, 'utf8'); } catch { return ''; } })();
  const fm = parseFrontmatter(entryText);
  const lastTouch = lastGitTouch(palaceRoot, [relative(palaceRoot, bundle.entryFile), relative(palaceRoot, bundle.bundleDir)]);
  const bundleMedia = scanBundleMediaFiles(palaceRoot, bundle.bundleDir);
  const nowView = computeNow({ home, board, state, history, meta: { stage: fm.stage, data: fm }, entryText, tsNow: now, lastTouch, bundleMedia });
  const nowText = renderNow(nowView, { home });

  const exists = existsSync(scrollPath);
  let text;
  if (exists) {
    const onDisk = readFileSync(scrollPath, 'utf8');
    const r = updateScrollText(onDisk, { nowText, newSections: [] });
    text = r.applied ? r.text : onDisk;
  } else {
    text = renderSkeleton({ home, born: now.slice(0, 10), nowText, makingText: '_Nothing made yet — the first shipped thing will open the trail._' });
  }
  return {
    home,
    path: relative(palaceRoot, scrollPath),
    exists,
    text,
    zones: {
      now: readZone(text, MARK.nowStart, MARK.nowEnd) || '',
      orders: readStandingOrders(text),
      making: readZone(text, MARK.makingStart, MARK.makingEnd) || '',
    },
    now: {
      status: nowView.status, stage: nowView.stage, stewarded: nowView.stewarded, iteration: nowView.iteration,
      last_active: nowView.last_active, open: nowView.open, answered_unconsumed: nowView.answered_unconsumed,
      stalled: nowView.stall.stalled, drift: nowView.drift, stands: nowView.stands,
      last_shipped: nowView.last_shipped ? { id: nowView.last_shipped.id, ts: nowView.last_shipped.ts } : null,
    },
    steward: s ? { dir: s.dir, agent_id: s.agent_id } : null,
    ts: now,
  };
}

/**
 * Write Loudon's Standing Orders into the scroll (creating the scroll first if
 * needed). Only the orders zone changes; the Now zone is regenerated as part
 * of the write so the file on disk is fresh. Returns the updated readScroll.
 */
export function writeStandingOrders({ palaceRoot, home, orders, now = new Date().toISOString() }) {
  const bundle = resolveBundleDir(palaceRoot, home);
  if (!bundle) return { error: 'entry-file-not-found' };
  const stewards = stewardIndex(palaceRoot);
  const s = stewards.get(home) || null;
  const scrollPath = join(bundle.bundleDir, `${home} — scroll.md`);
  if (!existsSync(scrollPath)) {
    const r = materializeScroll({ palaceRoot, home, agentDir: s ? s.dir : undefined, tsNow: now });
    if (!r.written) return { error: r.reason || 'could-not-create-scroll' };
  }
  const text = readFileSync(scrollPath, 'utf8');
  const start = text.indexOf(MARK.ordersStart);
  const end = start >= 0 ? text.indexOf(MARK.ordersEnd, start) : -1;
  if (start < 0 || end < 0) return { error: 'orders-markers-missing', path: relative(palaceRoot, scrollPath) };
  const body = String(orders || '').trim();
  const next = text.slice(0, start + MARK.ordersStart.length) + '\n' + (body || ORDERS_PLACEHOLDER) + '\n' + text.slice(end);
  if (!existsSync(bundle.bundleDir)) mkdirSync(bundle.bundleDir, { recursive: true });
  writeFileSync(scrollPath, next);
  // Refresh the Now zone on disk too (a save is a look).
  materializeScroll({ palaceRoot, home, agentDir: s ? s.dir : undefined, tsNow: now });
  return readScroll({ palaceRoot, home, now });
}

/**
 * Give a project a steward from the deck — the one-at-a-time enchantment that
 * batch.md § "Enchant a new steward" describes, reached from the "no steward"
 * rows instead of a terminal. Wraps enchantSteward (manifest + state + history
 * + registry) and maps its status to an HTTP shape. Idempotent: a project that
 * already has a steward comes back `already_enchanted`, not an error. The files
 * it writes are steward machinery, left uncommitted like a cycle's output; the
 * heartbeat wrapper's scoped commit picks them up.
 */
export function enchantProject({ palaceRoot, home, today = new Date().toISOString().slice(0, 10) }) {
  const { status: result, ...r } = enchantSteward({ palaceRoot, title: home, today });
  const http = result === 'enchanted' || result === 'already_enchanted' ? 200
    : result === 'not_found' ? 404
    : 422;
  return { http, ok: http === 200, result, ...r, home };
}
