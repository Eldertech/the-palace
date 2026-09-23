// scroll-file.js — materialize `[Entry] — scroll.md`, the project's front door.
//
// A scroll is the one page a project keeps that always opens on where the
// project stands NOW, then reads down through everything it has made, newest
// first. It replaces the older `[Entry] — plan.md` read-model (2026-09-23): the
// plan carried decision state only, was regenerated only when a steward cycled
// (so it lied whenever the steward slept), and was never rendered in the
// terminal. The scroll fixes all three:
//
//   - its NOW zone is regenerated from the board + the steward's runtime + the
//     entry's frontmatter + git EVERY time it is materialized — a grant Loudon
//     files after the steward's last cycle shows up as "answered, not yet
//     consumed" without waiting for a cycle;
//   - its STANDING ORDERS zone is Loudon's and is never regenerated — the
//     steward reads it every cycle before anything else;
//   - its MAKING zone is append-only: each shipped thing on the board becomes
//     one section keyed on the message id, so re-materializing never
//     duplicates or deletes, and a human may append sections by hand.
//
// Three HTML-comment marker pairs delimit the zones. Regeneration rewrites ONLY
// the text between `scroll:now:start/end`, and INSERTS new making sections
// directly after `scroll:making:start` — every other byte is preserved.
//
// SCHEMA §8 bundle type `scroll`. Canon: [[The Scroll]], [[Project Stewardship
// System]] § The Machinery/Content Split. Machinery lives here; the file lives
// with the entry.

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { resolveBundleDir } from './entry-paths.js';
import { parseFrontmatter } from './entry-frontmatter.js';
import { reconcilePendingRequests } from './process-cycle.js';

export const MARK = {
  nowStart: '<!-- scroll:now:start -->',
  nowEnd: '<!-- scroll:now:end -->',
  ordersStart: '<!-- scroll:orders:start -->',
  ordersEnd: '<!-- scroll:orders:end -->',
  makingStart: '<!-- scroll:making:start -->',
  makingEnd: '<!-- scroll:making:end -->',
};

export const ORDERS_PLACEHOLDER =
  '_Loudon\'s standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._';

// Payload kinds a steward has used to say "here is what I made". The scroll
// keys on artifact PRESENCE as well, so an undeclared kind with media still
// lands; the canonical kind going forward is `shipped_artifact` (steward.md).
export const SHIPPED_KINDS = new Set([
  'shipped_artifact', 'shipped', 'ship', 'cycle_ship', 'shipped_proof', 'result', 'proof',
]);

const MEDIA_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.wav', '.mp3', '.ogg', '.flac', '.mp4', '.mov', '.html', '.pdf']);

const dash = (v) => (v == null || v === '' ? '—' : String(v));
const day = (iso) => (iso ? String(iso).slice(0, 10) : '—');
const escapePipes = (s) => String(s).replace(/\|/g, '\\|');

function daysBetween(fromIso, toIso) {
  const a = fromIso ? Date.parse(fromIso) : NaN;
  const b = toIso ? Date.parse(toIso) : Date.now();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 86400000));
}

function ago(iso, nowIso) {
  const d = daysBetween(iso, nowIso);
  if (d == null) return '';
  if (d === 0) return 'today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

function firstParagraph(text, max = 700) {
  if (!text) return '';
  const para = String(text).trim().split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
  return para.length > max ? para.slice(0, max - 1).trimEnd() + '…' : para;
}

function optionsLine(options) {
  if (!Array.isArray(options) || !options.length) return null;
  return options.map((o) => (typeof o === 'string' ? o : (o.id || o.label || String(o)))).join(' · ');
}

/** Read the steward's history.jsonl (never throws). */
function readHistory(historyPath) {
  if (!historyPath || !existsSync(historyPath)) return [];
  try {
    return readFileSync(historyPath, 'utf8').trim().split('\n').filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  } catch { return []; }
}

/**
 * The stall read: from the history tail, how many consecutive most-recent
 * cycles posted nothing. 0 = the last cycle produced something (or no cycles).
 * A `state.health.stalled` flag set by the lane (barren twice) is honored too.
 */
export function readStall(history, state = {}) {
  let barren = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const e = history[i];
    if (e.event !== 'CYCLE_COMPLETE') continue;
    if (Array.isArray(e.posted_messages) && e.posted_messages.length) break;
    barren += 1;
  }
  const flagged = !!(state.health && state.health.stalled);
  return { barren_streak: barren, stalled: flagged || barren >= 2, last_cycle_barren: barren >= 1 };
}

/**
 * Parse the entry body's stewardship footer for "As of last consolidation:
 * cycle N". Returns the cycle number or null.
 */
export function readConsolidationCycle(entryText) {
  const m = /As of last consolidation:\*{0,2}\s*cycle\s+(\d+)/i.exec(String(entryText || ''));
  return m ? parseInt(m[1], 10) : null;
}

/** Messages the project itself posted (the page IS the agent). */
function ownMessages(board, home) {
  return board.filter((m) => m && m.from === home);
}

/** Does this message count as a made thing for the making trail? */
export function isMakingMessage(m) {
  if (!m || !m.payload) return false;
  const p = m.payload;
  if (p.kind === 'spawn') return false;
  if (m.type === 'PROOF') return true;
  if (SHIPPED_KINDS.has(p.kind)) return true;
  if (Array.isArray(p.artifacts) && p.artifacts.length) return true;
  if (typeof p.artifact_path === 'string' && p.artifact_path) return true;
  return false;
}

/** The cycle number a message belongs to, from the history's TOOL_CALL events. */
function cycleIndex(history) {
  const idx = new Map();
  let cycle = null;
  for (const e of history) {
    const m = /^CYCLE_(\d+)_SPAWN$/.exec(e.event || '');
    if (m) { cycle = parseInt(m[1], 10); continue; }
    if (e.event === 'TOOL_CALL' && e.args && e.args.message_id && cycle != null) idx.set(e.args.message_id, cycle);
    if (e.event === 'CYCLE_COMPLETE' && Array.isArray(e.posted_messages)) {
      for (const id of e.posted_messages) if (!idx.has(id)) idx.set(id, e.iteration ?? cycle);
    }
  }
  return idx;
}

/** Render one shipped message as a making section. */
export function renderMakingSection(m, { cycle } = {}) {
  const p = m.payload || {};
  const headline = p.headline || p.subject || (p.kind ? p.kind.replace(/_/g, ' ') : m.type.toLowerCase());
  const cyc = cycle != null ? ` — cycle ${cycle}` : '';
  const lines = [];
  lines.push(`<!-- scroll:entry id="${m.id}" -->`);
  lines.push(`### ${day(m.ts)}${cyc} — ${headline}`);
  if (p.ground) lines.push(`> ${p.ground}`);
  const body = p.content || p.rationale || p.summary || '';
  if (body) { lines.push(''); lines.push(String(body).trim()); }
  const artifacts = [];
  if (Array.isArray(p.artifacts)) for (const a of p.artifacts) if (a && a.path) artifacts.push(a);
  if (typeof p.artifact_path === 'string' && p.artifact_path && !artifacts.some((a) => a.path === p.artifact_path)) artifacts.push({ path: p.artifact_path, caption: p.caption || null });
  if (Array.isArray(p.options)) for (const o of p.options) if (o && o.artifact_path && !artifacts.some((a) => a.path === o.artifact_path)) artifacts.push({ path: o.artifact_path, caption: o.caption || o.label || null });
  if (artifacts.length) {
    lines.push('');
    lines.push('**Artifacts:**');
    for (const a of artifacts) lines.push(`- [${escapePipes(a.caption || basename(a.path))}](${a.path})`);
  }
  if (p.table && Array.isArray(p.table.columns) && Array.isArray(p.table.rows)) {
    lines.push('');
    if (p.table.caption) lines.push(`_${p.table.caption}_`);
    lines.push(`| ${p.table.columns.map(escapePipes).join(' | ')} |`);
    lines.push(`| ${p.table.columns.map(() => '---').join(' | ')} |`);
    for (const r of p.table.rows) lines.push(`| ${(Array.isArray(r) ? r : [r]).map((c) => escapePipes(dash(c))).join(' | ')} |`);
  }
  if (p.left_rough) { lines.push(''); lines.push(`_Left rough:_ ${String(p.left_rough).trim()}`); }
  if (Array.isArray(p.next_moves) && p.next_moves.length) { lines.push(''); lines.push(`_Next moves named:_ ${p.next_moves.map(String).join(' · ')}`); }
  lines.push(`<sub>\`${m.id}\` · ${m.type} on ${m.board}</sub>`);
  lines.push('<!-- /scroll:entry -->');
  return lines.join('\n');
}

/** Ids of making sections already present in a scroll's text. */
export function existingEntryIds(text) {
  const ids = new Set();
  const re = /<!--\s*scroll:entry id="([^"]+)"\s*-->/g;
  let m;
  while ((m = re.exec(String(text || ''))) !== null) ids.add(m[1]);
  return ids;
}

/** Media files in a bundle (recursive, shallow-capped), palace-relative. */
export function scanBundleMediaFiles(palaceRoot, bundleDir, { limit = 40 } = {}) {
  const out = [];
  if (!bundleDir || !existsSync(bundleDir)) return out;
  const stack = [bundleDir];
  while (stack.length && out.length < limit) {
    const dir = stack.pop();
    let ents;
    try { ents = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'Archive') continue;
      const abs = join(dir, e.name);
      if (e.isDirectory()) { stack.push(abs); continue; }
      if (!MEDIA_EXT.has(extname(e.name).toLowerCase())) continue;
      if (/ — (hero|icon)\.png$/.test(e.name)) continue;
      let mtime = null;
      try { mtime = statSync(abs).mtime.toISOString(); } catch { /* ignore */ }
      out.push({ path: relative(palaceRoot, abs), mtime });
      if (out.length >= limit) break;
    }
  }
  return out.sort((a, b) => String(b.mtime).localeCompare(String(a.mtime)));
}

/** Last commit touching the entry file or its bundle. Never throws. */
export function lastGitTouch(palaceRoot, paths) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%aI%x09%h%x09%s', '--', ...paths], {
      cwd: palaceRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000,
    }).trim();
    if (!out) return null;
    const [ts, hash, ...subject] = out.split('\t');
    return { ts, hash, subject: subject.join('\t') };
  } catch { return null; }
}

/**
 * Compute everything the NOW zone needs from raw inputs. Pure given its inputs
 * (board, state, history, entry meta) — the filesystem/git reads happen in
 * materializeScroll and are passed in.
 */
export function computeNow({ home, board = [], state = null, history = [], meta = {}, entryText = '', tsNow, lastTouch = null, bundleMedia = [] }) {
  const own = ownMessages(board, home);
  const { stillPending, nowResolved } = reconcilePendingRequests(board, home);
  const lastActiveMs = state && state.last_active ? Date.parse(state.last_active) : NaN;
  const answeredUnconsumed = Number.isNaN(lastActiveMs)
    ? nowResolved.slice()
    : nowResolved.filter((r) => { const t = r.resolved_at ? Date.parse(r.resolved_at) : NaN; return Number.isNaN(t) || t > lastActiveMs; });
  const shipped = own.filter(isMakingMessage);
  const lastShipped = shipped.length ? shipped[shipped.length - 1] : null;
  const latestSpoken = own.length ? own[own.length - 1] : null;
  const stall = readStall(history, state || {});
  const consolidatedAt = readConsolidationCycle(entryText);
  const iteration = state && Number.isFinite(state.iteration) ? state.iteration : null;
  const drift = (consolidatedAt != null && iteration != null)
    ? { cycles: Math.max(0, iteration - consolidatedAt), decisions: nowResolved.filter((r) => { const t = r.resolved_at ? Date.parse(r.resolved_at) : NaN; return !Number.isNaN(t); }).length, consolidated_at: consolidatedAt }
    : null;

  // "Where this stands" — the steward's own latest catch-up, in its own words.
  // Prefer an explicit `catchup` field (the contract from 2026-09-23), then the
  // first paragraph of the latest message's content / rationale.
  let stands = '';
  const spoken = own.filter((m) => m.payload && m.payload.kind !== 'spawn');
  // 1. an explicit catchup field on the latest message that has one
  for (let i = spoken.length - 1; i >= 0 && !stands; i--) if (spoken[i].payload.catchup) stands = firstParagraph(spoken[i].payload.catchup);
  // 2. a paragraph the steward itself labelled "Catch-up" (the voice rule's habit)
  for (let i = spoken.length - 1; i >= 0 && !stands; i--) {
    const p = spoken[i].payload;
    const para = firstParagraph(p.content || p.rationale || '');
    if (/^catch-?up\b/i.test(para)) stands = para.replace(/^catch-?up\s*[—:-]\s*/i, '');
  }
  // 3. the latest made thing's opening paragraph, then the latest message's
  for (let i = spoken.length - 1; i >= 0 && !stands; i--) if (isMakingMessage(spoken[i])) stands = firstParagraph(spoken[i].payload.content || spoken[i].payload.rationale || '');
  for (let i = spoken.length - 1; i >= 0 && !stands; i--) stands = firstParagraph(spoken[i].payload.content || spoken[i].payload.rationale || '');

  return {
    status: typeof meta?.data?.status === 'string' ? meta.data.status : null,
    stage: meta?.stage || null,
    stewarded: !!state,
    iteration,
    last_active: state?.last_active || null,
    open: stillPending,
    answered_unconsumed: answeredUnconsumed,
    resolved: nowResolved,
    last_shipped: lastShipped,
    latest_spoken_ts: latestSpoken ? latestSpoken.ts : null,
    stall,
    drift,
    stands,
    last_touch: lastTouch,
    bundle_media_count: bundleMedia.length,
    ts_now: tsNow,
  };
}

/** Render the NOW zone (between the markers, markers excluded). */
export function renderNow(now, { home }) {
  const L = [];
  L.push('## Now');
  L.push('');
  L.push(`> _Regenerated ${dash(now.ts_now)} from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — steer the project in **Standing Orders** below, never here._`);
  L.push('');
  const stewardBit = now.stewarded
    ? `**Steward:** cycle ${dash(now.iteration)} · last ran ${day(now.last_active)}${now.last_active ? ` (${ago(now.last_active, now.ts_now)})` : ''}`
    : '**Steward:** none — this project has no permanent steward yet';
  L.push(`- **Status:** ${dash(now.status)} · **Stage:** ${dash(now.stage)} · ${stewardBit}`);
  L.push(`- **Waiting on you:** ${now.open.length ? `${now.open.length} open ask${now.open.length === 1 ? '' : 's'}${now.open.some((r) => r.blocking) ? ' — one of them has the steward paused' : ''}` : 'nothing'}`);
  if (now.stewarded) {
    L.push(`- **Ready to advance:** ${now.answered_unconsumed.length ? `${now.answered_unconsumed.length} answer${now.answered_unconsumed.length === 1 ? '' : 's'} filed since the steward last ran — a cycle will consume ${now.answered_unconsumed.length === 1 ? 'it' : 'them'}` : 'no unread answers'}`);
  }
  if (now.last_shipped) {
    const p = now.last_shipped.payload || {};
    L.push(`- **Last shipped:** ${day(now.last_shipped.ts)} (${ago(now.last_shipped.ts, now.ts_now)}) — ${dash(p.headline || p.subject || p.kind)} (\`${now.last_shipped.id}\`)`);
  } else {
    L.push(`- **Last shipped:** nothing on the board yet${now.bundle_media_count ? ` — but the bundle holds ${now.bundle_media_count} media file${now.bundle_media_count === 1 ? '' : 's'} (see the making trail)` : ''}`);
  }
  if (now.last_touch) L.push(`- **Last commit touching this project:** ${day(now.last_touch.ts)} \`${now.last_touch.hash}\` — ${now.last_touch.subject}`);
  if (now.stewarded) {
    if (now.stall.stalled) L.push(`- **Signal:** ⚠ **STALLED** — the last ${now.stall.barren_streak} cycle${now.stall.barren_streak === 1 ? '' : 's'} posted nothing. The loop is broken until a cycle ships; the lane retries once, then flags here.`);
    else if (now.stall.last_cycle_barren) L.push('- **Signal:** ⚠ the last cycle posted nothing (one barren cycle — the lane will retry before calling it stalled)');
    else L.push('- **Signal:** steady');
    if (now.drift) L.push(`- **Drift:** ${now.drift.cycles} cycle${now.drift.cycles === 1 ? '' : 's'} since the entry was last consolidated (cycle ${now.drift.consolidated_at}) — the entry body may lag; this scroll does not.`);
    else L.push('- **Drift:** no consolidation marker on the entry — nothing to measure against.');
  }
  L.push('');
  L.push('### Where this stands');
  L.push('');
  L.push(now.stands || (now.stewarded ? '_The steward has not spoken yet._' : `_No steward has spoken for this project. Its direction is the \`forward_vector\` in [[${home}]]'s frontmatter; enchant a steward to start the trail._`));
  L.push('');
  L.push('### Open asks');
  L.push('');
  if (!now.open.length) L.push('_None — nothing is waiting on you._');
  for (const r of now.open) {
    L.push(`- \`${r.request_id}\` — ${dash(r.decision_topic || r.resource)}${r.blocking ? ' · **steward paused on this**' : ''} · posted ${day(r.posted_at)}${optionsLine(r.options) ? ` · options: ${optionsLine(r.options)}` : ''}`);
  }
  if (now.stewarded) {
    L.push('');
    L.push('### Answered, not yet consumed');
    L.push('');
    if (!now.answered_unconsumed.length) L.push('_None._');
    for (const r of now.answered_unconsumed) L.push(`- \`${r.request_id}\` — ${dash(r.outcome)} · answered ${day(r.resolved_at)} — waiting for the next cycle`);
  }
  L.push('');
  L.push('### Decided');
  L.push('');
  const decided = now.resolved.slice().reverse().slice(0, 8);
  if (!decided.length) L.push('_Nothing decided on the board yet._');
  for (const r of decided) L.push(`- \`${r.request_id}\` — ${dash(r.decision_topic || r.resource)} → ${dash(r.outcome)} (${day(r.resolved_at)})`);
  L.push('');
  return L.join('\n');
}

/** The skeleton for a brand-new scroll (all zones present, orders = placeholder). */
export function renderSkeleton({ home, born, nowText, ordersText = ORDERS_PLACEHOLDER, makingText = '' }) {
  const fm = [
    '---',
    `title: "${home} — scroll"`,
    `born: ${born}`,
    'links:',
    `  - target: "[[${home}]]"`,
    '    type: connects-to',
    '    label: scroll-for',
    `forward_vector: "I am ${home}'s scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."`,
    '---',
  ].join('\n');
  return [
    fm,
    '',
    `# ${home} — scroll`,
    '',
    `> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[${home}]] stays the considered truth and this is the live one. See [[The Scroll]].`,
    '',
    MARK.nowStart,
    nowText,
    MARK.nowEnd,
    '',
    '## Standing Orders',
    '',
    MARK.ordersStart,
    ordersText,
    MARK.ordersEnd,
    '',
    '## The making',
    '',
    MARK.makingStart,
    makingText,
    MARK.makingEnd,
    '',
  ].join('\n');
}

/** Slice a marker-delimited zone out of scroll text. Null when a marker is missing. */
export function readZone(text, startMark, endMark) {
  const s = String(text || '').indexOf(startMark);
  if (s < 0) return null;
  const e = String(text).indexOf(endMark, s + startMark.length);
  if (e < 0) return null;
  return String(text).slice(s + startMark.length, e).replace(/^\n/, '').replace(/\n$/, '');
}

/** Read Standing Orders from a scroll (placeholder → ''). */
export function readStandingOrders(text) {
  const z = readZone(text, MARK.ordersStart, MARK.ordersEnd);
  if (z == null) return '';
  const t = z.trim();
  return t === ORDERS_PLACEHOLDER ? '' : t;
}

/**
 * Apply a regeneration to existing scroll text: replace the NOW zone, insert
 * the new making sections after the making:start marker. Everything else is
 * byte-preserved. If the markers are absent (a hand-made scroll), the file is
 * left alone and { applied:false } is returned.
 */
export function updateScrollText(existing, { nowText, newSections }) {
  let text = String(existing);
  const ns = text.indexOf(MARK.nowStart);
  const ne = ns >= 0 ? text.indexOf(MARK.nowEnd, ns) : -1;
  if (ns < 0 || ne < 0) return { applied: false, text, reason: 'now-markers-missing' };
  text = text.slice(0, ns + MARK.nowStart.length) + '\n' + nowText + '\n' + text.slice(ne);
  const ms = text.indexOf(MARK.makingStart);
  if (ms < 0) return { applied: false, text, reason: 'making-marker-missing' };
  if (newSections.length) {
    const insertAt = ms + MARK.makingStart.length;
    text = text.slice(0, insertAt) + '\n' + newSections.join('\n\n') + '\n' + text.slice(insertAt);
  }
  return { applied: true, text };
}

/**
 * Materialize `[Entry] — scroll.md` for one project. Reads everything it needs
 * from the palace; writes the file; returns a summary. Never throws on a
 * missing entry — returns { written:false, reason }.
 *
 * @param {object} opts
 * @param {string} opts.palaceRoot
 * @param {string} opts.home — the entry title
 * @param {object[]} [opts.board] — parsed persistent board (read if omitted)
 * @param {object} [opts.state] — steward state.json (read from agentDir if given; null = unstewarded)
 * @param {string} [opts.agentDir] — steward dir (abs or palace-relative)
 * @param {string} [opts.tsNow]
 * @param {boolean} [opts.dryRun]
 */
export function materializeScroll(opts) {
  const { palaceRoot, home, tsNow = new Date().toISOString(), dryRun = false } = opts;
  const bundle = resolveBundleDir(palaceRoot, home);
  if (!bundle) return { written: false, reason: 'entry-file-not-found' };
  const { entryFile, bundleDir } = bundle;

  let board = opts.board;
  if (!board) {
    const bp = opts.boardPath || join(palaceRoot, '_ops/swarm/persistent/blackboard.jsonl');
    try {
      board = readFileSync(bp, 'utf8').trim().split('\n').filter(Boolean)
        .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    } catch { board = []; }
  }

  let state = opts.state === undefined ? null : opts.state;
  let history = [];
  if (opts.agentDir) {
    const dirAbs = join(palaceRoot, opts.agentDir).startsWith(palaceRoot) && !opts.agentDir.startsWith('/') ? join(palaceRoot, opts.agentDir) : opts.agentDir;
    try { state = JSON.parse(readFileSync(join(dirAbs, 'state.json'), 'utf8')); } catch { /* keep given state */ }
    history = readHistory(join(dirAbs, 'history.jsonl'));
  }

  const entryText = (() => { try { return readFileSync(entryFile, 'utf8'); } catch { return ''; } })();
  const fm = parseFrontmatter(entryText);
  const meta = { file: entryFile, stage: typeof fm.stage === 'string' ? fm.stage : undefined, data: fm };
  const lastTouch = lastGitTouch(palaceRoot, [relative(palaceRoot, entryFile), relative(palaceRoot, bundleDir)].filter(Boolean));
  const bundleMedia = scanBundleMediaFiles(palaceRoot, bundleDir);

  const now = computeNow({ home, board, state, history, meta, entryText, tsNow, lastTouch, bundleMedia });
  const nowText = renderNow(now, { home });

  const scrollPath = join(bundleDir, `${home} — scroll.md`);
  const existing = existsSync(scrollPath) ? readFileSync(scrollPath, 'utf8') : null;
  const have = existingEntryIds(existing || '');
  const cycles = cycleIndex(history);
  const making = ownMessages(board, home).filter(isMakingMessage).filter((m) => !have.has(m.id));
  // newest first in the file → build sections newest-first
  const newSections = making.slice().reverse().map((m) => renderMakingSection(m, { cycle: cycles.get(m.id) }));

  let text;
  let applied = true;
  if (existing == null) {
    let seed = newSections.join('\n\n');
    if (!seed && bundleMedia.length) {
      // Unstewarded backfill: the bundle's media is the only trail there is.
      const top = bundleMedia.slice(0, 20).map((f) => `- [${basename(f.path)}](${f.path})${f.mtime ? ` · ${day(f.mtime)}` : ''}`).join('\n');
      seed = [`<!-- scroll:entry id="backfill-${day(tsNow)}" -->`, `### ${day(tsNow)} — backfilled from the bundle`, '', `No steward has posted a made thing for this project yet, so the trail opens with what the bundle already holds (${bundleMedia.length} media file${bundleMedia.length === 1 ? '' : 's'}, newest first):`, '', top, `<sub>backfill · scroll born ${day(tsNow)}</sub>`, '<!-- /scroll:entry -->'].join('\n');
    }
    text = renderSkeleton({ home, born: day(tsNow), nowText, makingText: seed || '_Nothing made yet — the first shipped thing will open the trail._' });
  } else {
    const r = updateScrollText(existing, { nowText, newSections });
    applied = r.applied;
    text = r.text;
    if (!applied) return { written: false, reason: r.reason, scrollPath };
  }

  if (!dryRun) {
    if (!existsSync(bundleDir)) mkdirSync(bundleDir, { recursive: true });
    writeFileSync(scrollPath, text);
  }
  return {
    written: !dryRun,
    created: existing == null,
    scrollPath,
    bundleDir,
    added_sections: newSections.length,
    now: { open: now.open.length, answered_unconsumed: now.answered_unconsumed.length, stalled: now.stall.stalled, iteration: now.iteration },
  };
}

/** Palace-relative path of a project's scroll, or null if the entry is missing. */
export function scrollPathFor(palaceRoot, home) {
  const b = resolveBundleDir(palaceRoot, home);
  return b ? relative(palaceRoot, join(b.bundleDir, `${home} — scroll.md`)) : null;
}
