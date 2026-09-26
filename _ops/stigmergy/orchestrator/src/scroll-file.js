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
//   - its PLAN zone is the path agreed with Loudon. It is never regenerated:
//     it changes only when Loudon agrees — saved on the deck, written by an
//     elder on his yes, or a steward's proposal he adopts (a plan_revision ask
//     granted with option `adopt`, applied here) — and every change lands on
//     the making trail as a `plan-` section saying what changed and why;
//   - its STANDING ORDERS zone is Loudon's and is never regenerated — the
//     steward reads it every cycle before anything else;
//   - its MAKING zone is append-only: each shipped thing on the board becomes
//     one section keyed on the message id, so re-materializing never
//     duplicates or deletes, and a human may append sections by hand.
//
// Four HTML-comment marker pairs delimit the zones (a ceremony's scroll has
// no plan — its tuning ledger's owed lines are its plan). Regeneration rewrites ONLY
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
  planStart: '<!-- scroll:plan:start -->',
  planEnd: '<!-- scroll:plan:end -->',
  ordersStart: '<!-- scroll:orders:start -->',
  ordersEnd: '<!-- scroll:orders:end -->',
  makingStart: '<!-- scroll:making:start -->',
  makingEnd: '<!-- scroll:making:end -->',
};

export const ORDERS_PLACEHOLDER =
  '_Loudon\'s standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._';

export const CEREMONY_ORDERS_PLACEHOLDER =
  '_Loudon\'s standing direction for this ceremony. An order saved on the PROJECTS deck goes into the tuning ledger as owed; the next run\'s tail read picks it up, and Now shows it as owed until a run acts on it._';

export const PAGE_ORDERS_PLACEHOLDER =
  '_Loudon\'s standing direction for this page — never regenerated. A steward, if the page ever has one, reads it every cycle before anything else._';

export const PLAN_PLACEHOLDER =
  '_No plan agreed yet. Until there is one, the work leans on the page\'s forward vector. A plan is agreed with Loudon — he writes it here, or a steward proposes one as an ask and it lands here when he says yes._';

const ORDERS_PLACEHOLDERS = new Set([ORDERS_PLACEHOLDER, CEREMONY_ORDERS_PLACEHOLDER, PAGE_ORDERS_PLACEHOLDER]);

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

/** Now as ISO 8601 in local time with its offset — the date Loudon sees on his clock. */
export function localIso(d = new Date()) {
  const p = (n) => String(Math.abs(n)).padStart(2, '0');
  const off = -d.getTimezoneOffset();
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${off >= 0 ? '+' : '-'}${p(Math.trunc(off / 60))}:${p(off % 60)}`;
}

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

// Payload keys that are wire plumbing, never prose worth showing on a trail.
const PLUMBING_KEYS = new Set(['kind', 'entry', 'entry_path', 'turn_id', 'in_reply_to', 'worktree', 'headline', 'ground', 'catchup', 'content', 'rationale', 'summary', 'subject', 'artifacts', 'artifact_path', 'caption', 'options', 'table', 'left_rough', 'next_moves', 'equations', 'resource', 'blocking', 'choice_mode', 'prompt', 'request_id', 'plan', 'off_plan']);

/**
 * The prose a message carries, in order of preference: the canonical fields,
 * else every other string field the steward wrote (BLUELINE's `result`
 * messages carry `move` / `verdict` / `m3_7` / `design_rule` / `next` and no
 * `content` at all). Returns '' when there is genuinely nothing to show.
 */
export function payloadProse(p) {
  if (!p || typeof p !== 'object') return '';
  const canon = p.content || p.rationale || p.summary || '';
  if (canon) return String(canon).trim();
  const lines = [];
  for (const [k, v] of Object.entries(p)) {
    if (PLUMBING_KEYS.has(k)) continue;
    if (typeof v === 'string' && v.trim() && !/^[\w-]+:\/\//.test(v)) lines.push(`**${k.replace(/_/g, ' ')}:** ${v.trim()}`);
    else if (typeof v === 'number' || typeof v === 'boolean') lines.push(`**${k.replace(/_/g, ' ')}:** ${v}`);
    else if (Array.isArray(v) && v.length && v.every((x) => typeof x === 'string') && !v.every((x) => /\.[a-z0-9]{2,5}$/i.test(x))) lines.push(`**${k.replace(/_/g, ' ')}:** ${v.join(' · ')}`);
  }
  return lines.join('\n');
}

/** String-array payload fields that look like file paths → artifacts. */
export function payloadPathArtifacts(p) {
  const out = [];
  if (!p || typeof p !== 'object') return out;
  for (const [k, v] of Object.entries(p)) {
    if (PLUMBING_KEYS.has(k)) continue;
    const arr = Array.isArray(v) ? v : (typeof v === 'string' && /\.(png|jpe?g|gif|webp|svg|wav|mp3|ogg|flac|mp4|mov|html?|pdf|md)$/i.test(v) ? [v] : []);
    for (const x of arr) if (typeof x === 'string' && /\.[a-z0-9]{2,5}$/i.test(x) && !/^[\w-]+:\/\//.test(x)) out.push({ path: x, caption: null });
  }
  return out;
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
 * A `state.health.stalled` flag set by the lane (barren twice) is honored too;
 * a `STALL_CLEARED` history event ends the backward count.
 */
export function readStall(history, state = {}) {
  let barren = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const e = history[i];
    // A reviewed clearance (a human or an elder read the transcripts and found
    // the barren cycles were something else — a usage limit, say) ends the count.
    if (e.event === 'STALL_CLEARED') break;
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

/**
 * A made thing a steward flagged as off plan: `payload.off_plan` is the one-line
 * direction it argues for (or `true`). Returns the direction ('' when only
 * flagged), or null when the thing was made on plan.
 */
export function offPlanDirection(p) {
  if (!p || p.off_plan == null || p.off_plan === false) return null;
  return typeof p.off_plan === 'string' ? p.off_plan.trim() : '';
}

/** Render one shipped message as a making section. */
export function renderMakingSection(m, { cycle } = {}) {
  const p = m.payload || {};
  const headline = p.headline || p.subject || p.move || p.verdict || p.note || (p.kind ? p.kind.replace(/_/g, ' ') : m.type.toLowerCase());
  const cyc = cycle != null ? ` — cycle ${cycle}` : '';
  const offPlan = offPlanDirection(p);
  const lines = [];
  lines.push(`<!-- scroll:entry id="${m.id}" -->`);
  lines.push(`### ${day(m.ts)}${cyc} — ${offPlan != null ? 'Off plan — ' : ''}${headline}`);
  if (p.ground) lines.push(`> ${p.ground}`);
  if (offPlan != null) { lines.push(''); lines.push(`_Off plan${offPlan ? ` — ${offPlan}` : ''}. Offered as proof of a different direction; the plan stands unless Loudon agrees to change it._`); }
  const body = payloadProse(p);
  if (body) { lines.push(''); lines.push(body); }
  const artifacts = [];
  if (Array.isArray(p.artifacts)) for (const a of p.artifacts) if (a && a.path) artifacts.push(a);
  if (typeof p.artifact_path === 'string' && p.artifact_path && !artifacts.some((a) => a.path === p.artifact_path)) artifacts.push({ path: p.artifact_path, caption: p.caption || null });
  if (Array.isArray(p.options)) for (const o of p.options) if (o && o.artifact_path && !artifacts.some((a) => a.path === o.artifact_path)) artifacts.push({ path: o.artifact_path, caption: o.caption || o.label || null });
  for (const a of payloadPathArtifacts(p)) if (!artifacts.some((x) => x.path === a.path)) artifacts.push(a);
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
export function computeNow({ home, board = [], state = null, history = [], meta = {}, entryText = '', tsNow, lastTouch = null, bundleMedia = [], plan = null }) {
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
  for (let i = spoken.length - 1; i >= 0 && !stands; i--) if (isMakingMessage(spoken[i])) stands = firstParagraph(payloadProse(spoken[i].payload));
  for (let i = spoken.length - 1; i >= 0 && !stands; i--) stands = firstParagraph(payloadProse(spoken[i].payload));

  // The plan: agreed or not, when it last changed, how much has been made since,
  // and whether a proposed revision is waiting on Loudon.
  const planInfo = plan || { text: '', revised: null };
  const revisedMs = planInfo.revised ? Date.parse(planInfo.revised) : NaN;
  const planView = {
    agreed: !!planInfo.text,
    revised: planInfo.revised || null,
    shipped_since: Number.isNaN(revisedMs) ? null : shipped.filter((m) => { const t = Date.parse(m.ts); return !Number.isNaN(t) && t > revisedMs; }).length,
    waiting: stillPending.filter((r) => r.kind === 'plan_revision').length,
  };

  return {
    type: typeof meta?.data?.type === 'string' ? meta.data.type : null,
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
    plan: planView,
    stands,
    last_touch: lastTouch,
    bundle_media_count: bundleMedia.length,
    ts_now: tsNow,
  };
}

/** The Now zone's one-line read of the plan. */
function planLine(now) {
  const p = now.plan || { agreed: false };
  const waiting = p.waiting ? ` · **a proposed revision is waiting on you**` : '';
  if (!p.agreed) return `none agreed yet — the work leans on the forward vector${waiting}`;
  if (!p.revised) return `agreed (no dated change on the trail yet)${waiting}`;
  const made = p.shipped_since == null ? '' : ` · ${p.shipped_since} made thing${p.shipped_since === 1 ? '' : 's'} since`;
  return `agreed ${day(p.revised)} (${ago(p.revised, now.ts_now)})${made}${waiting}`;
}

/** Render the NOW zone (between the markers, markers excluded). */
export function renderNow(now, { home }) {
  const noun = now.type && now.type !== 'project' ? 'page' : 'project';
  const L = [];
  L.push('## Now');
  L.push('');
  L.push(`> _Regenerated ${dash(now.ts_now)} from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — the ${noun} is steered by the **Plan** and **Standing Orders** below, never here._`);
  L.push('');
  const stewardBit = now.stewarded
    ? `**Steward:** cycle ${dash(now.iteration)} · last ran ${day(now.last_active)}${now.last_active ? ` (${ago(now.last_active, now.ts_now)})` : ''}`
    : `**Steward:** none — this ${noun} has no permanent steward yet`;
  L.push(`- **Status:** ${dash(now.status)} · **Stage:** ${dash(now.stage)} · ${stewardBit}`);
  L.push(`- **Plan:** ${planLine(now)}`);
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
  if (now.last_touch) L.push(`- **Last commit touching this ${noun}:** ${day(now.last_touch.ts)} \`${now.last_touch.hash}\` — ${now.last_touch.subject}`);
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
  L.push(now.stands || (now.stewarded ? '_The steward has not spoken yet._' : `_No steward has spoken for this ${noun}. Its direction is the \`forward_vector\` in [[${home}]]'s frontmatter${noun === 'project' ? '; enchant a steward to start the trail' : ''}._`));
  L.push('');
  L.push('### Open asks');
  L.push('');
  if (!now.open.length) L.push('_None — nothing is waiting on you._');
  for (const r of now.open) {
    L.push(`- \`${r.request_id}\` — ${r.kind === 'plan_revision' ? 'proposed plan revision: ' : ''}${dash(r.decision_topic || r.resource)}${r.blocking ? ' · **steward paused on this**' : ''} · posted ${day(r.posted_at)}${optionsLine(r.options) ? ` · options: ${optionsLine(r.options)}` : ''}`);
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
// What a scroll is for, by the kind of page it fronts. A project's opens on
// where the work stands; a ceremony's on which version is live and whether it
// has run since it changed; any other page's on its state and what was made.
const SKELETON_VOICE = {
  project: {
    vector: (h) => `I am ${h}'s scroll — the one page that always opens on where the project stands now and the plan it is following, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my plan changes only when Loudon agrees, and every change is logged on my trail; my standing orders are Loudon's; my trail only ever grows.`,
    intro: (h) => `> The project's front door. **Now** is regenerated on every look; the **Plan** is the path agreed with Loudon, changed only with his yes; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[${h}]] stays the considered truth and this is the live one. See [[The Scroll]].`,
  },
  ceremony: {
    vector: (h) => `I am ${h}'s scroll — the one page that opens on which version of the ceremony is live, whether it has run since it last changed, and what its tuning ledger still owes, then reads down through its runs and version changes, newest first. My top is regenerated whenever anyone looks; my standing orders are Loudon's; my trail only ever grows.`,
    intro: (h) => `> The ceremony's front door. **Now** is regenerated on every look — its version, its runs since the spec last changed, what its ledger owes; **Standing Orders** are Loudon's; **The making** is the trail of runs and version changes, newest first. The card [[${h}]] stays the spec, and its lessons live in [[${h} — tuning]]. Rendered in [[STIGMERGY]]'s PROJECTS deck. See [[The Scroll]].`,
  },
  page: {
    vector: (h) => `I am ${h}'s scroll — the page's front door, opening on where it stands now and the plan it is following, then reading down through what was made from it, newest first. My top is regenerated whenever anyone looks; my plan changes only when Loudon agrees; my standing orders are Loudon's; my trail only ever grows.`,
    intro: (h) => `> The page's front door. **Now** is regenerated on every look; the **Plan** is the path agreed with Loudon, changed only with his yes; **Standing Orders** are Loudon's; **The making** is the trail, newest first. The entry [[${h}]] stays the considered truth and this is the live one. See [[The Scroll]].`,
  },
};

export function renderSkeleton({ home, born, nowText, planText = PLAN_PLACEHOLDER, ordersText = ORDERS_PLACEHOLDER, makingText = '', kind = 'project' }) {
  const voice = SKELETON_VOICE[kind] || SKELETON_VOICE.project;
  const fm = [
    '---',
    `title: "${home} — scroll"`,
    `born: ${born}`,
    'links:',
    `  - target: "[[${home}]]"`,
    '    type: connects-to',
    '    label: scroll-for',
    `forward_vector: "${voice.vector(home)}"`,
    '---',
  ].join('\n');
  return [
    fm,
    '',
    `# ${home} — scroll`,
    '',
    voice.intro(home),
    '',
    MARK.nowStart,
    nowText,
    MARK.nowEnd,
    '',
    // A ceremony's plan is its tuning ledger's owed lines, which Now shows.
    ...(kind === 'ceremony' ? [] : ['## Plan', '', MARK.planStart, planText, MARK.planEnd, '']),
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
  return ORDERS_PLACEHOLDERS.has(t) ? '' : t;
}

/** Read the agreed plan from a scroll (placeholder or no zone → ''). */
export function readPlan(text) {
  const z = readZone(text, MARK.planStart, MARK.planEnd);
  if (z == null) return '';
  const t = z.trim();
  return t === PLAN_PLACEHOLDER ? '' : t;
}

/**
 * The plan and when it last changed: the newest `plan-` section on the making
 * trail (the trail is newest-first, so the first one found) carries the moment
 * Loudon agreed in its footer (`agreed <iso>`), or at least in its heading date.
 */
export function readPlanInfo(text) {
  const plan = readPlan(text);
  const making = readZone(text, MARK.makingStart, MARK.makingEnd) || '';
  const m = /<!--\s*scroll:entry id="(plan-[^"]+)"\s*-->([\s\S]*?)<!--\s*\/scroll:entry\s*-->/.exec(making);
  if (!m) return { text: plan, revised: null, id: null };
  const agreed = /agreed (\d{4}-\d{2}-\d{2}T[0-9:.]+(?:Z|[+-]\d{2}:\d{2})?)/.exec(m[2]);
  const heading = /^###\s+(\d{4}-\d{2}-\d{2})/m.exec(m[2]);
  return { text: plan, revised: agreed ? agreed[1] : (heading ? heading[1] : null), id: m[1] };
}

/**
 * Give an older scroll its Plan zone (empty, the placeholder) just above
 * Standing Orders. Idempotent; a scroll that already has one is untouched.
 */
export function ensurePlanZone(text) {
  const t = String(text || '');
  if (t.includes(MARK.planStart)) return t;
  const zone = `## Plan\n\n${MARK.planStart}\n${PLAN_PLACEHOLDER}\n${MARK.planEnd}\n\n`;
  const os = t.indexOf(MARK.ordersStart);
  if (os >= 0) {
    const h = t.lastIndexOf('## Standing Orders', os);
    const at = h >= 0 ? h : os;
    return t.slice(0, at) + zone + t.slice(at);
  }
  const ne = t.indexOf(MARK.nowEnd);
  if (ne < 0) return t;
  const at = ne + MARK.nowEnd.length;
  return t.slice(0, at) + '\n\n' + zone.trimEnd() + t.slice(at);
}

/** The trail section a plan change leaves: what changed, why, and the plan it replaced. */
export function renderPlanSection({ id, headline = '', why = '', by = '', ts, previous = '' }) {
  const L = [];
  L.push(`<!-- scroll:entry id="${id}" -->`);
  L.push(`### ${day(ts)} — ${previous ? 'Plan revised' : 'Plan agreed'}${headline ? `: ${headline}` : ''}`);
  if (why && String(why).trim()) { L.push(''); L.push(String(why).trim()); }
  if (previous) {
    L.push('');
    L.push('_The plan before this change:_');
    L.push('');
    L.push(previous.split('\n').map((l) => (l.trim() ? `> ${l}` : '>')).join('\n'));
  }
  L.push(`<sub>\`${id}\` · plan ${previous ? 'revised' : 'agreed'} · agreed ${ts}${by ? ` · ${by}` : ''}</sub>`);
  L.push('<!-- /scroll:entry -->');
  return L.join('\n');
}

/**
 * Change the plan: replace the Plan zone and log the change as a `plan-` section
 * at the top of the making trail. The one write path for every plan change —
 * the deck, an elder's CLI write on Loudon's yes, and an adopted proposal all
 * come through here. Idempotent on `id`; refuses text carrying scroll markers.
 */
export function applyPlan(existing, { plan, id, headline = '', why = '', by = '', ts = localIso() }) {
  const text = ensurePlanZone(existing);
  const pid = id || `plan-${ts.replace(/[:.+]/g, '-')}`;
  if (existingEntryIds(text).has(pid)) return { applied: false, text, reason: 'already-applied' };
  const body = String(plan || '').trim();
  if (/<!--\s*\/?scroll:/.test(body)) return { applied: false, text, reason: 'plan-contains-scroll-markers' };
  const previous = readPlan(text);
  if (body === previous) return { applied: false, text, reason: 'unchanged' };
  const ps = text.indexOf(MARK.planStart);
  const pe = text.indexOf(MARK.planEnd, ps);
  const ms = text.indexOf(MARK.makingStart);
  if (ps < 0 || pe < 0) return { applied: false, text, reason: 'plan-markers-missing' };
  if (ms < 0) return { applied: false, text, reason: 'making-marker-missing' };
  let next = text.slice(0, ps + MARK.planStart.length) + '\n' + (body || PLAN_PLACEHOLDER) + '\n' + text.slice(pe);
  const at = next.indexOf(MARK.makingStart) + MARK.makingStart.length;
  next = next.slice(0, at) + '\n' + renderPlanSection({ id: pid, headline, why, by, ts, previous }) + '\n' + next.slice(at);
  return { applied: true, text: next, id: pid };
}

/**
 * A steward's proposed plans that Loudon adopted: its `plan_revision` asks
 * (a RESOURCE_REQUEST carrying the whole revised plan in `payload.plan`) whose
 * latest answer is a RESOURCE_GRANT choosing option `adopt`. Board order.
 */
export function adoptedPlanRevisions(board, home) {
  const answers = new Map();
  for (const m of board) if (m && (m.type === 'RESOURCE_GRANT' || m.type === 'RESOURCE_DENY') && m.re) answers.set(m.re, m);
  const out = [];
  for (const m of board) {
    if (!m || m.type !== 'RESOURCE_REQUEST' || m.from !== home) continue;
    const p = m.payload || {};
    if (p.kind !== 'plan_revision' || typeof p.plan !== 'string' || !p.plan.trim()) continue;
    const rid = m.request_id || m.id;
    const g = answers.get(rid);
    if (!g || g.type !== 'RESOURCE_GRANT' || (g.payload && g.payload.option_id) !== 'adopt') continue;
    out.push({ ask: m, grant: g, request_id: rid });
  }
  return out;
}

/** Apply every adopted proposal not yet on the trail (keyed `plan-<request id>`). */
export function applyAdoptedPlans(text, board, home) {
  let t = text;
  const applied = [];
  for (const { ask, grant, request_id: rid } of adoptedPlanRevisions(board, home)) {
    const p = ask.payload || {};
    const notes = grant.payload && grant.payload.notes ? `Loudon: "${String(grant.payload.notes).trim()}"` : '';
    const why = [firstParagraph(p.rationale || p.content || p.catchup || '', 1200), notes].filter(Boolean).join('\n\n');
    const r = applyPlan(t, {
      plan: p.plan, id: `plan-${rid}`, headline: p.headline || p.decision_topic || '', why,
      by: `proposed by ${home}'s steward (\`${rid}\`), adopted by Loudon (\`${grant.id}\`)`, ts: grant.ts,
    });
    if (r.applied) { t = r.text; applied.push(rid); }
  }
  return { text: t, applied };
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
    const dirAbs = opts.agentDir.startsWith('/') ? opts.agentDir : join(palaceRoot, opts.agentDir);
    try { state = JSON.parse(readFileSync(join(dirAbs, 'state.json'), 'utf8')); } catch { /* keep given state */ }
    history = readHistory(join(dirAbs, 'history.jsonl'));
  }

  const entryText = (() => { try { return readFileSync(entryFile, 'utf8'); } catch { return ''; } })();
  const fm = parseFrontmatter(entryText);
  const meta = { file: entryFile, stage: typeof fm.stage === 'string' ? fm.stage : undefined, data: fm };
  const lastTouch = lastGitTouch(palaceRoot, [relative(palaceRoot, entryFile), relative(palaceRoot, bundleDir)].filter(Boolean));
  const bundleMedia = scanBundleMediaFiles(palaceRoot, bundleDir);

  const scrollPath = join(bundleDir, `${home} — scroll.md`);
  const existing = existsSync(scrollPath) ? readFileSync(scrollPath, 'utf8') : null;
  const have = existingEntryIds(existing || '');
  const cycles = cycleIndex(history);
  const making = ownMessages(board, home).filter(isMakingMessage).filter((m) => !have.has(m.id));
  // newest first in the file → build sections newest-first
  const newSections = making.slice().reverse().map((m) => renderMakingSection(m, { cycle: cycles.get(m.id) }));

  let text;
  if (existing == null) {
    let seed = newSections.join('\n\n');
    if (!seed && bundleMedia.length) {
      // Unstewarded backfill: the bundle's media is the only trail there is.
      const top = bundleMedia.slice(0, 20).map((f) => `- [${basename(f.path)}](${f.path})${f.mtime ? ` · ${day(f.mtime)}` : ''}`).join('\n');
      seed = [`<!-- scroll:entry id="backfill-${day(tsNow)}" -->`, `### ${day(tsNow)} — backfilled from the bundle`, '', `No steward has posted a made thing for this project yet, so the trail opens with what the bundle already holds (${bundleMedia.length} media file${bundleMedia.length === 1 ? '' : 's'}, newest first):`, '', top, `<sub>backfill · scroll born ${day(tsNow)}</sub>`, '<!-- /scroll:entry -->'].join('\n');
    }
    const kind = fm.type && fm.type !== 'project' ? 'page' : 'project';
    text = renderSkeleton({
      home, born: day(tsNow), nowText: '', kind,
      ordersText: kind === 'page' && !state ? PAGE_ORDERS_PLACEHOLDER : ORDERS_PLACEHOLDER,
      makingText: seed || '_Nothing made yet — the first shipped thing will open the trail._',
    });
  } else {
    const r = updateScrollText(existing, { nowText: '', newSections });
    if (!r.applied) return { written: false, reason: r.reason, scrollPath };
    // An older scroll gains its (empty) Plan zone the first time it is regenerated.
    text = ensurePlanZone(r.text);
  }

  // A proposal Loudon adopted since the last look becomes the plan, and the
  // change lands on the trail. Then Now is computed against the plan as it stands.
  const adopted = applyAdoptedPlans(text, board, home);
  text = adopted.text;
  const now = computeNow({ home, board, state, history, meta, entryText, tsNow, lastTouch, bundleMedia, plan: readPlanInfo(text) });
  text = updateScrollText(text, { nowText: renderNow(now, { home }), newSections: [] }).text;

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
    plan_adopted: adopted.applied,
    now: { open: now.open.length, answered_unconsumed: now.answered_unconsumed.length, stalled: now.stall.stalled, iteration: now.iteration },
  };
}

/**
 * Write an agreed plan into a project's (or page's) scroll — the deck's save and
 * an elder's CLI write on Loudon's yes. Creates the scroll first if needed, logs
 * the change on the trail (`why` says what changed and why), then regenerates Now.
 * Not for ceremonies: a ceremony's plan is its tuning ledger's owed lines.
 */
export function writePlan({ palaceRoot, home, plan, headline = '', why = '', by = 'Loudon', agentDir, ts = localIso() }) {
  const bundle = resolveBundleDir(palaceRoot, home);
  if (!bundle) return { error: 'entry-file-not-found' };
  const scrollPath = join(bundle.bundleDir, `${home} — scroll.md`);
  if (!existsSync(scrollPath)) {
    const r = materializeScroll({ palaceRoot, home, agentDir, tsNow: ts });
    if (!r.written) return { error: r.reason || 'could-not-create-scroll' };
  }
  const r = applyPlan(readFileSync(scrollPath, 'utf8'), { plan, headline, why, by, ts });
  if (!r.applied) return { error: r.reason, path: relative(palaceRoot, scrollPath) };
  writeFileSync(scrollPath, r.text);
  materializeScroll({ palaceRoot, home, agentDir, tsNow: ts });
  return { written: true, id: r.id, path: relative(palaceRoot, scrollPath) };
}

/** Palace-relative path of a project's scroll, or null if the entry is missing. */
export function scrollPathFor(palaceRoot, home) {
  const b = resolveBundleDir(palaceRoot, home);
  return b ? relative(palaceRoot, join(b.bundleDir, `${home} — scroll.md`)) : null;
}
