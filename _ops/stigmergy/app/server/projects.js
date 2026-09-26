// server/projects.js — the PROJECTS deck's data: every `type: project` entry
// as one row, stewarded or not, plus the read/write seam for its scroll. Two
// more groups share the deck (2026-09-25): SERVICES, stewarded pages that are
// not projects (the Shopkeeper, once enchanted), and CEREMONIES, every entry
// with a tuning ledger — its version, its runs since the spec last changed
// (counted from the ledger's run lines), and what the ledger still owes
// (orchestrator/src/ceremony-scroll.js).
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
// Loudon saves a project's Standing Orders. That keeps the working tree quiet
// between cycles while the terminal always shows the live state. A ceremony's
// orders go to its tuning ledger instead, as an owed line the next run reads.

import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { readJsonl } from '@stigmergy/core/blackboard';
import { listProjectEntries, stewardIndex } from '../../orchestrator/src/scroll.js';
import {
  MARK, ORDERS_PLACEHOLDER, computeNow, renderNow, renderSkeleton, readZone, readStandingOrders,
  updateScrollText, materializeScroll, lastGitTouch, scanBundleMediaFiles,
  readPlan, readPlanInfo, ensurePlanZone, applyAdoptedPlans, writePlan as writePlanFile,
} from '../../orchestrator/src/scroll-file.js';
import { resolveBundleDir, findEntryFile } from '../../orchestrator/src/entry-paths.js';
import {
  listCeremonies, readCeremonyState, isCeremony, materializeCeremonyScroll, materializeAnyScroll,
  tuningPathFor, appendLedgerLine, orderLine,
} from '../../orchestrator/src/ceremony-scroll.js';
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
    rows.push(entryRow({ palaceRoot, p, boardMsgs, stewards, worker, now }));
  }
  return sortProjects(rows);
}

/**
 * Stewarded pages that are not projects — the SERVICES group. Same row shape
 * and signal as a project row, so the deck renders them with the same code.
 */
export function buildServiceRows({ palaceRoot, board = null, stewardLane = null, now = new Date().toISOString() }) {
  const boardMsgs = board || readBoard(palaceRoot);
  const stewards = stewardIndex(palaceRoot);
  const worker = stewardLane ? stewardLane.status() : null;
  const projects = new Set(listProjectEntries(palaceRoot).map((p) => p.title));
  const rows = [];
  for (const home of stewards.keys()) {
    if (projects.has(home)) continue;
    const file = findEntryFile(palaceRoot, home);
    if (!file) continue;
    const fm = (() => { try { return parseFrontmatter(readFileSync(file, 'utf8')); } catch { return {}; } })();
    const p = { title: home, file: relative(palaceRoot, file), status: typeof fm.status === 'string' ? fm.status : null, stage: typeof fm.stage === 'string' ? fm.stage : null };
    rows.push({ ...entryRow({ palaceRoot, p, boardMsgs, stewards, worker, now }), kind: 'service', type: fm.type || null });
  }
  return sortProjects(rows);
}

function entryRow({ palaceRoot, p, boardMsgs, stewards, worker, now }) {
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
  return {
    kind: 'project',
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
  };
}

// Ceremony state reads git history, so it is cached per ceremony until HEAD or
// one of its files changes; the ceremony list itself is re-walked at most every
// 30 s. The deck polls every 3 s and must not pay for twelve git walks each time.
const ceremonyCache = { root: null, listAt: 0, list: null, states: new Map() };

function gitHead(palaceRoot) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: palaceRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).trim();
  } catch { return ''; }
}

const mtimes = (paths) => paths.map((p) => { try { return statSync(p).mtimeMs; } catch { return 0; } }).join(':');

export function ceremonyStates({ palaceRoot, fresh = false }) {
  const t = Date.now();
  if (fresh || ceremonyCache.root !== palaceRoot || !ceremonyCache.list || t - ceremonyCache.listAt > 30000) {
    if (ceremonyCache.root !== palaceRoot) ceremonyCache.states.clear();
    ceremonyCache.root = palaceRoot;
    ceremonyCache.list = listCeremonies(palaceRoot);
    ceremonyCache.listAt = t;
  }
  const head = gitHead(palaceRoot);
  const out = [];
  for (const c of ceremonyCache.list) {
    const tuningAbs = join(palaceRoot, c.tuning);
    const hit = ceremonyCache.states.get(c.title);
    const watch = [tuningAbs, dirname(tuningAbs), join(palaceRoot, '_ops/maps')];
    if (hit && hit.state) watch.push(join(palaceRoot, hit.state.path));
    const key = `${head}|${mtimes(watch)}`;
    if (!fresh && hit && hit.key === key) { if (hit.state) out.push(hit.state); continue; }
    const state = readCeremonyState(palaceRoot, c.title);
    const keyAfter = state ? `${head}|${mtimes([...watch.slice(0, 3), join(palaceRoot, state.path)])}` : key;
    ceremonyCache.states.set(c.title, { key: keyAfter, state });
    if (state) out.push(state);
  }
  return out;
}

/** One row per ceremony, newest activity first. */
export function buildCeremonyRows({ palaceRoot }) {
  const rows = ceremonyStates({ palaceRoot }).map((st) => {
    const scrollRel = relative(palaceRoot, join(st.bundleDir, `${st.home} — scroll.md`));
    const lastTs = st.last_run ? String(st.last_run.ts) : null;
    const ordersOwed = (st.orders || []).filter((o) => o.owed);
    return {
      kind: 'ceremony',
      home: st.home,
      path: st.path,
      tuning: st.tuning,
      version: st.version,
      spec_changed: st.spec ? { ts: st.spec.ts, hash: st.spec.hash, subject: st.spec.subject } : null,
      runs_since: st.runs_since.length,
      run_days_since: new Set(st.runs_since.map((r) => r.date)).size,
      last_run: st.last_run ? { ts: lastTs, subject: `${st.last_run.what || 'a run'} · ${st.last_run.outcome}`, version: st.last_run.version } : null,
      owed: [...st.owed.map((o) => o.n), ...ordersOwed.map((o) => `Loudon ${o.date}`)],
      orders_owed: ordersOwed.length,
      latest: st.latest,
      last_activity: [lastTs, st.spec && st.spec.ts].filter(Boolean).sort().pop() || null,
      scroll_path: scrollRel,
      scroll_exists: existsSync(join(palaceRoot, scrollRel)),
    };
  });
  return rows.sort((a, b) => String(b.last_activity || '').localeCompare(String(a.last_activity || '')) || a.home.localeCompare(b.home));
}

/** A ceremony's scroll, Now regenerated live; written to disk only with `write`. */
function readCeremonyScroll({ palaceRoot, home, write, now }) {
  const r = materializeCeremonyScroll({ palaceRoot, home, tsNow: now, dryRun: !write });
  if (!r.text) return r.reason === 'entry-file-not-found' ? null : { home, path: r.scrollPath || null, exists: false, error: r.reason };
  const st = r.state;
  return {
    home,
    kind: 'ceremony',
    path: r.scrollPath,
    exists: write || !r.created,
    text: r.text,
    zones: {
      now: readZone(r.text, MARK.nowStart, MARK.nowEnd) || '',
      plan: '',
      orders: readStandingOrders(r.text),
      making: readZone(r.text, MARK.makingStart, MARK.makingEnd) || '',
    },
    now: {
      version: st.version,
      spec_changed: st.spec ? { ts: st.spec.ts, hash: st.spec.hash } : null,
      runs_since: st.runs_since.length,
      owed: st.owed.map((o) => o.n),
      stewarded: false, open: [], answered_unconsumed: [], stalled: false, drift: null, stands: '',
    },
    tuning: st.tuning,
    ledger_orders: st.orders,
    steward: null,
    ts: now,
  };
}

/**
 * Read a project's scroll with a LIVE Now zone. Returns the full text as it
 * would be on disk after a regeneration (without writing unless `write`).
 * A project with no scroll yet gets one rendered in memory (and on disk when
 * `write`), so the deck can always open a project.
 */
export function readScroll({ palaceRoot, home, write = false, now = new Date().toISOString() }) {
  if (isCeremony(palaceRoot, home)) return readCeremonyScroll({ palaceRoot, home, write, now });
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

  // The same steps the materializer takes, in memory: the Plan zone an older
  // scroll lacks, any proposal Loudon adopted since the last write, then Now.
  const exists = existsSync(scrollPath);
  let text = exists
    ? ensurePlanZone(readFileSync(scrollPath, 'utf8'))
    : renderSkeleton({ home, born: now.slice(0, 10), nowText: '', makingText: '_Nothing made yet — the first shipped thing will open the trail._' });
  text = applyAdoptedPlans(text, board, home).text;
  const nowView = computeNow({ home, board, state, history, meta: { stage: fm.stage, data: fm }, entryText, tsNow: now, lastTouch, bundleMedia, plan: readPlanInfo(text) });
  const r = updateScrollText(text, { nowText: renderNow(nowView, { home }), newSections: [] });
  if (r.applied) text = r.text;
  return {
    home,
    path: relative(palaceRoot, scrollPath),
    exists,
    text,
    zones: {
      now: readZone(text, MARK.nowStart, MARK.nowEnd) || '',
      plan: readPlan(text),
      orders: readStandingOrders(text),
      making: readZone(text, MARK.makingStart, MARK.makingEnd) || '',
    },
    now: {
      status: nowView.status, stage: nowView.stage, stewarded: nowView.stewarded, iteration: nowView.iteration,
      last_active: nowView.last_active, open: nowView.open, answered_unconsumed: nowView.answered_unconsumed,
      stalled: nowView.stall.stalled, drift: nowView.drift, stands: nowView.stands, plan: nowView.plan,
      last_shipped: nowView.last_shipped ? { id: nowView.last_shipped.id, ts: nowView.last_shipped.ts } : null,
    },
    steward: s ? { dir: s.dir, agent_id: s.agent_id } : null,
    ts: now,
  };
}

/** Loudon's local date, YYYY-MM-DD — the date the palace's ledgers use. */
function localDay(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Write Loudon's Standing Orders. For a project (or any page), into the
 * scroll, creating it first if needed: only the orders zone changes, and the
 * Now zone is regenerated as part of the write so the file on disk is fresh.
 * For a ceremony, one owed line appended to its tuning ledger
 * (`- from Loudon · <date> · <his words> · owed`, SCHEMA — Reference §6),
 * which the next run's tail read picks up; the scroll file is not touched.
 * Returns the updated readScroll.
 */
export function writeStandingOrders({ palaceRoot, home, orders, now = new Date().toISOString(), today = localDay() }) {
  const bundle = resolveBundleDir(palaceRoot, home);
  if (!bundle) return { error: 'entry-file-not-found' };
  if (isCeremony(palaceRoot, home)) {
    const words = String(orders || '').replace(/\s+/g, ' ').trim();
    if (!words) return { error: 'empty-order' };
    appendLedgerLine(tuningPathFor(palaceRoot, home), orderLine(today, words));
    return readScroll({ palaceRoot, home, now });
  }
  const stewards = stewardIndex(palaceRoot);
  const s = stewards.get(home) || null;
  const scrollPath = join(bundle.bundleDir, `${home} — scroll.md`);
  if (!existsSync(scrollPath)) {
    const r = materializeAnyScroll({ palaceRoot, home, agentDir: s ? s.dir : undefined, tsNow: now });
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
  materializeAnyScroll({ palaceRoot, home, agentDir: s ? s.dir : undefined, tsNow: now });
  return readScroll({ palaceRoot, home, now });
}

/**
 * Write the agreed plan from the deck — Loudon's own edit, so it goes in as
 * agreed. The change is logged on the scroll's trail with his `why`. A
 * ceremony has no Plan zone (its plan is its tuning ledger's owed lines).
 * Returns the updated readScroll.
 */
export function writePlan({ palaceRoot, home, plan, why = '', headline = '', now = new Date().toISOString() }) {
  if (!resolveBundleDir(palaceRoot, home)) return { error: 'entry-file-not-found' };
  if (isCeremony(palaceRoot, home)) return { error: 'ceremony-has-no-plan' };
  const s = stewardIndex(palaceRoot).get(home) || null;
  const r = writePlanFile({ palaceRoot, home, plan, why, headline, by: 'Loudon, on the PROJECTS deck', agentDir: s ? s.dir : undefined, ts: now });
  if (r.error) return r;
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
