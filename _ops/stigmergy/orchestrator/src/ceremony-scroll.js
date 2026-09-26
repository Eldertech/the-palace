// ceremony-scroll.js — a ceremony's scroll. A project's zones less the Plan
// (Now · Standing Orders · the making; a ceremony's plan is its ledger's owed
// lines), with a Now that answers the
// ceremony's own questions: which version is live, has it run since the spec
// last changed, and what does its tuning ledger still owe?
//
// A ceremony is any entry with a tuning ledger — `[Entry]/[Entry] — tuning.md`
// (SCHEMA — Reference §6 and §8). The ledger is the marker, so a new ceremony
// needs no registration here.
//
// Runs are read from the ledger. Every run leaves one line there, whatever it
// taught (SCHEMA — Reference §6):
//
//   - run · 2026-09-25 · v1.1 · close-2026-09-25-ceremonies · taught item 31
//
// Version changes are read from git: the commits where the card's version
// value changed. An order Loudon saves on a ceremony's scroll lands in the
// ledger too, as `- from Loudon · <date> · <his words> · owed`, and counts as
// owed until a run replaces `owed` with what it did. Trail sections are keyed
// on the version commit or on the run line itself, so re-materializing never
// duplicates or deletes.
//
// Canon: [[The Scroll]], [[Palace Ceremonies]]. Project scrolls: scroll-file.js.

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolveBundleDir, EXCLUDE_DIRS } from './entry-paths.js';
import { parseFrontmatter } from './entry-frontmatter.js';
import {
  MARK, CEREMONY_ORDERS_PLACEHOLDER, renderSkeleton, updateScrollText, existingEntryIds, materializeScroll,
} from './scroll-file.js';

const day = (iso) => (iso ? String(iso).slice(0, 10) : '—');
const dash = (v) => (v == null || v === '' ? '—' : String(v));


// A run line: `- run · <date> · v<version> · <what it ran on> · <outcome>`.
// The outcome is `nothing new` or `taught item N`; the "what" field may be
// absent (`- run · <date> · v<version> · <outcome>`), and the reader takes both.
const RUN_RE = /^- run · (\d{4}-\d{2}-\d{2}) · v?(\d[\w.]*) · (.+?)\s*$/;

/** One run line → { date, version, what, outcome }, or null. */
export function parseRunLine(line) {
  const m = RUN_RE.exec(String(line || ''));
  if (!m) return null;
  const cut = m[3].lastIndexOf(' · ');
  return {
    date: m[1],
    version: normVersion(m[2]),
    what: cut >= 0 ? m[3].slice(0, cut).trim() : '',
    outcome: (cut >= 0 ? m[3].slice(cut + 3) : m[3]).trim(),
  };
}

/**
 * Every run line in a ledger, in file order (newest last). Each carries a key
 * made from the line itself, so a trail section keyed on it survives a union
 * merge that reorders lines; a second identical line gets its own key.
 */
export function parseRuns(ledgerText) {
  const seen = new Map();
  const out = [];
  String(ledgerText || '').split('\n').forEach((line, index) => {
    const r = parseRunLine(line);
    if (!r) return;
    const text = line.trim();
    const h = createHash('sha1').update(text).digest('hex').slice(0, 10);
    const n = (seen.get(h) || 0) + 1;
    seen.set(h, n);
    out.push({ ...r, line: text, index, key: `run-${h}${n > 1 ? `-${n}` : ''}` });
  });
  return out;
}

/** The run line a run leaves (SCHEMA — Reference §6). */
export function runLine({ date, version, what = '', outcome = 'nothing new' }) {
  const v = normVersion(version);
  const w = String(what || '').replace(/\s+/g, ' ').replace(/ · /g, ', ').trim();
  return `- run · ${date} · v${v} · ${w ? `${w} · ` : ''}${outcome}`;
}

// An order from Loudon, saved on the ceremony's scroll:
// `- from Loudon · <date> · <his words> · owed` — the last field says `owed`
// until a run acts on it and replaces it with what it did.
const ORDER_RE = /^- from Loudon · (\d{4}-\d{2}-\d{2}) · (.+) · ([^·]+?)\s*$/;

/** The line an order becomes. His words go in whole, on one line. */
export function orderLine(date, words) {
  return `- from Loudon · ${date} · ${String(words || '').replace(/\s+/g, ' ').trim()} · owed`;
}

/**
 * Loudon's orders in a ledger: [{ date, text, status, owed }]. A union merge
 * can keep both forms of a line paid in place — the paid one and the stale
 * owed one (SCHEMA — Reference §6) — so an order paid anywhere is paid.
 */
export function parseOrders(ledgerText) {
  const all = [];
  for (const line of String(ledgerText || '').split('\n')) {
    const m = ORDER_RE.exec(line);
    if (m) all.push({ date: m[1], text: m[2].trim(), status: m[3].trim() });
  }
  const isOwed = (o) => /^owed$/i.test(o.status);
  const k = (o) => `${o.date}\u0000${o.text}`;
  const paid = new Set(all.filter((o) => !isOwed(o)).map(k));
  const shown = new Set();
  const out = [];
  for (const o of all) {
    if (isOwed(o) && paid.has(k(o))) continue;
    if (shown.has(`${k(o)}\u0000${o.status}`)) continue;
    shown.add(`${k(o)}\u0000${o.status}`);
    out.push({ ...o, owed: isOwed(o) });
  }
  return out;
}

/**
 * Append one line to a ledger's end. A line that follows prose gets a blank
 * line before it, so it reads as a list; one that follows a list item joins it.
 */
export function appendLedgerLine(ledgerPath, line) {
  const text = existsSync(ledgerPath) ? readFileSync(ledgerPath, 'utf8') : '';
  const last = text.replace(/\s+$/, '').split('\n').pop() || '';
  const endsBlank = text === '' || /\n[ \t]*\n$/.test(text);
  const listy = /^\s*(?:[-*]|\d+[a-z]?\.)\s/.test(last);
  let pre = text && !text.endsWith('\n') ? '\n' : '';
  if (!endsBlank && !listy && last.trim()) pre += '\n';
  appendFileSync(ledgerPath, `${pre}${line}\n`);
}

/** "2" → "2.0"; strips quotes. So a quoting fix never reads as a spec change. */
export function normVersion(v) {
  if (v == null) return null;
  const s = String(v).trim().replace(/^["']|["']$/g, '');
  if (!s) return null;
  return /^\d+$/.test(s) ? `${s}.0` : s;
}

/** Tuning-ledger path for an entry, or null when it isn't a ceremony. */
export function tuningPathFor(palaceRoot, home) {
  const b = resolveBundleDir(palaceRoot, home);
  if (!b) return null;
  const p = join(b.bundleDir, `${home} — tuning.md`);
  return existsSync(p) ? p : null;
}

export function isCeremony(palaceRoot, home) {
  return tuningPathFor(palaceRoot, home) != null;
}

/** Every ceremony in the palace — every entry with a tuning ledger. */
export function listCeremonies(palaceRoot) {
  const out = [];
  const stack = [palaceRoot];
  while (stack.length) {
    const dir = stack.pop();
    let ents;
    try { ents = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      if (e.isDirectory()) { if (!EXCLUDE_DIRS.has(e.name)) stack.push(join(dir, e.name)); continue; }
      const m = / — tuning\.md$/.exec(e.name);
      if (!m || e.isSymbolicLink()) continue;
      const title = e.name.slice(0, m.index);
      if (basename(dir) !== title) continue; // a ledger lives in its ceremony's bundle
      out.push({ title, tuning: relative(palaceRoot, join(dir, e.name)) });
    }
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * The items a ledger still owes: numbered items carrying the ledgers' own
 * phrase, "spec change owed" (or "still owed"), and not "paid". Stricter than
 * the tail read's `grep -w owed` (SCHEMA — Reference §6), which also catches
 * the word in passing; that grep is a reader's net, this is a count.
 */
export function parseOwed(ledgerText) {
  const out = [];
  for (const line of String(ledgerText || '').split('\n')) {
    const m = /^\s*(\d+[a-z]?)\.\s+(.*)$/.exec(line);
    if (!m) continue;
    if (!/\bchange (still )?owed\b/i.test(m[2]) || /\bpaid\b/i.test(m[2])) continue;
    const text = m[2].replace(/\*\*/g, '');
    out.push({ n: m[1], text: text.length > 180 ? `${text.slice(0, 177)}…` : text });
  }
  return out;
}

/** The ledger's newest group heading and the last item number. */
export function parseLatestLesson(ledgerText) {
  let heading = null; let item = null;
  for (const line of String(ledgerText || '').split('\n')) {
    const h = /^##\s+(.+)$/.exec(line);
    if (h) heading = h[1].trim();
    const i = /^\s*(\d+[a-z]?)\.\s/.exec(line);
    if (i) item = i[1];
  }
  return { heading, item };
}

function git(palaceRoot, args) {
  try {
    return execFileSync('git', args, {
      cwd: palaceRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000, maxBuffer: 32 * 1024 * 1024,
    });
  } catch { return ''; }
}

/**
 * The commits where the card's version VALUE changed, oldest first:
 * [{ hash, ts, subject, version }]. A reformat that keeps the value (2 → "2.0")
 * is not a change.
 */
export function versionHistory(palaceRoot, entryRel) {
  const out = git(palaceRoot, ['log', '--reverse', '--format=%H%x09%aI%x09%s', '-G^version:', '--', entryRel]).trim();
  if (!out) return [];
  const changes = [];
  let prev = null;
  for (const line of out.split('\n')) {
    const [hash, ts, ...s] = line.split('\t');
    const text = git(palaceRoot, ['show', `${hash}:${entryRel}`]);
    const v = normVersion(parseFrontmatter(text).version);
    if (v && v !== prev) changes.push({ hash, ts, subject: s.join('\t'), version: v });
    prev = v;
  }
  return changes;
}

/** Bodies for a handful of commits, in one git call: Map hash → body. */
function bodiesFor(palaceRoot, hashes) {
  const map = new Map();
  if (!hashes.length) return map;
  const out = git(palaceRoot, ['log', '--no-walk=unsorted', '--format=%H%x1f%b%x1e', ...hashes]);
  for (const r of out.split('\x1e')) {
    const [hash, body = ''] = r.replace(/^\n/, '').split('\x1f');
    if (hash) map.set(hash.trim(), body);
  }
  return map;
}

/** First prose paragraph of a commit body — trailers and blank lines dropped. */
export function bodyLead(body, max = 600) {
  const paras = String(body || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const lead = paras.find((p) => !/^[A-Z][A-Za-z-]+: /.test(p.split('\n')[0]));
  if (!lead) return '';
  const flat = lead.replace(/\n/g, ' ');
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/**
 * Where a run sits in time, for ordering the trail. A run line carries only
 * its date, so it is placed inside the span its version was live — after the
 * change that made the version, before the next — and same-day runs keep the
 * ledger's own order (newest last).
 */
function runMs(run, changes) {
  const i = changes.findIndex((c) => c.version === run.version);
  const from = i >= 0 ? Date.parse(changes[i].ts) : NaN;
  const to = i >= 0 && i + 1 < changes.length ? Date.parse(changes[i + 1].ts) : NaN;
  let base = Date.parse(`${run.date}T00:00:00`);
  if (!Number.isNaN(from) && base <= from) base = from + 1;
  if (!Number.isNaN(to) && base + run.index >= to) base = to - 1e6;
  return base + run.index;
}

/**
 * Everything a ceremony's Now zone and trail need, read from the card, its
 * ledger and git. Never throws.
 */
export function readCeremonyState(palaceRoot, home) {
  const b = resolveBundleDir(palaceRoot, home);
  if (!b) return null;
  const entryRel = relative(palaceRoot, b.entryFile);
  const tuningAbs = join(b.bundleDir, `${home} — tuning.md`);
  const entryText = (() => { try { return readFileSync(b.entryFile, 'utf8'); } catch { return ''; } })();
  const ledger = (() => { try { return readFileSync(tuningAbs, 'utf8'); } catch { return ''; } })();
  const fm = parseFrontmatter(entryText);
  const version = normVersion(fm.version);

  const changes = versionHistory(palaceRoot, entryRel);
  const last = changes.length ? changes[changes.length - 1] : null;
  // The working tree can hold a version git hasn't seen yet.
  const spec = last && last.version === version ? last : (version ? { hash: null, ts: null, subject: 'not committed yet', version } : null);
  const bodies = bodiesFor(palaceRoot, changes.map((c) => c.hash));
  for (const c of changes) c.lead = bodyLead(bodies.get(c.hash));

  // Newest first. A run belongs to the version its line names.
  const runs = parseRuns(ledger)
    .map((r) => ({ ...r, kind: 'run', ts: r.date, ms: runMs(r, changes) }))
    .sort((x, y) => y.ms - x.ms);

  return {
    home,
    path: entryRel,
    tuning: relative(palaceRoot, tuningAbs),
    bundleDir: b.bundleDir,
    version,
    spec,
    versions: changes,
    runs,
    runs_since: version ? runs.filter((r) => r.version === version) : [],
    last_run: runs[0] || null,
    owed: parseOwed(ledger),
    orders: parseOrders(ledger),
    latest: parseLatestLesson(ledger),
  };
}

/** How a run reads in a list: its date, what it ran on, what it taught. */
export function runText(r) {
  return `${r.date} — ${r.what || 'a run'} · ${r.outcome}`;
}

/** Render a ceremony's NOW zone (between the markers, markers excluded). */
export function renderCeremonyNow(st, { tsNow }) {
  const L = [];
  const v = st.version ? `v${st.version}` : 'unversioned';
  L.push('## Now');
  L.push('');
  L.push(`> _Regenerated ${dash(tsNow)} from the card's frontmatter, its tuning ledger and git. This zone is machine-owned — steer the ceremony in **Standing Orders** below, never here._`);
  L.push('');
  if (st.spec && st.spec.hash) L.push(`- **Version:** ${v} · the spec last changed ${day(st.spec.ts)} (\`${st.spec.hash.slice(0, 8)}\`) — ${st.spec.subject}`);
  else if (st.spec) L.push(`- **Version:** ${v} · changed in the working tree, not committed yet`);
  else L.push('- **Version:** none on the card — the ceremony is not versioned yet');
  const n = st.runs_since.length;
  if (!st.version) L.push('- **Runs since the change:** — (no version to count against)');
  else if (!n) L.push(`- **Runs since the change:** none yet — ${v} has not run`);
  else {
    const days = new Set(st.runs_since.map((r) => r.date)).size;
    L.push(`- **Runs since the change:** ${n} run${n === 1 ? '' : 's'} on ${days} day${days === 1 ? '' : 's'}, counted from the ledger's run lines`);
  }
  L.push(`- **Last run:** ${st.last_run ? `${runText(st.last_run)} (under v${st.last_run.version})` : 'none in the ledger yet'}`);
  const orders = (st.orders || []).filter((o) => o.owed);
  const owedCount = st.owed.length + orders.length;
  const parts = [];
  if (st.owed.length) parts.push(`item${st.owed.length === 1 ? '' : 's'} ${st.owed.map((o) => o.n).join(', ')}`);
  if (orders.length) parts.push(`${orders.length} order${orders.length === 1 ? '' : 's'} from Loudon`);
  L.push(`- **Owed in the ledger:** ${owedCount ? `${owedCount} — ${parts.join(' and ')}; the next run's tail read picks ${owedCount === 1 ? 'it' : 'them'} up first` : 'nothing'}`);
  if (st.latest && st.latest.heading) L.push(`- **Latest lesson:** item ${dash(st.latest.item)}, ${st.latest.heading.replace(/^From /, 'from ')} — [[${st.home} — tuning]]`);
  L.push('');
  L.push(`### Runs since ${v}`);
  L.push('');
  if (!n) L.push('_None yet._');
  for (const r of st.runs_since.slice(0, 8)) L.push(`- ${runText(r)}`);
  if (n > 8) L.push(`- _…and ${n - 8} more in the trail below._`);
  L.push('');
  L.push('### Owed');
  L.push('');
  if (!owedCount) L.push('_Nothing owed._');
  for (const o of st.owed) L.push(`- **${o.n}.** ${o.text}`);
  for (const o of orders) L.push(`- **From Loudon, ${o.date}.** ${o.text}`);
  L.push('');
  return L.join('\n');
}

/** One trail section: a run or a version change. */
export function renderCeremonySection(item) {
  const L = [];
  L.push(`<!-- scroll:entry id="${item.key}" -->`);
  if (item.kind === 'version') {
    L.push(`### ${day(item.ts)} — the spec moved to v${item.version}`);
    L.push('');
    L.push(item.subject);
    if (item.lead) { L.push(''); L.push(item.lead); }
    L.push(`<sub>\`${item.hash.slice(0, 8)}\` · version change</sub>`);
  } else {
    L.push(`### ${item.date} — ${item.what || 'a run'}`);
    L.push('');
    L.push(item.outcome);
    L.push(`<sub>a run${item.version ? ` under v${item.version}` : ''} · its line in the tuning ledger</sub>`);
  }
  L.push('<!-- /scroll:entry -->');
  return L.join('\n');
}

/** Trail items (runs and version changes) newest first. */
export function ceremonyTrail(st) {
  const versions = (st.versions || []).map((c) => ({
    kind: 'version', key: `version-${c.hash}`, hash: c.hash, ts: c.ts, ms: Date.parse(c.ts), subject: c.subject, version: c.version, lead: c.lead || '',
  }));
  return [...versions, ...st.runs].sort((a, b) => b.ms - a.ms);
}

/**
 * Materialize `[Ceremony] — scroll.md`. Returns { written, created, scrollPath,
 * text, state, added_sections }. With dryRun the text is returned, not written.
 */
export function materializeCeremonyScroll({ palaceRoot, home, tsNow = new Date().toISOString(), dryRun = false }) {
  const st = readCeremonyState(palaceRoot, home);
  if (!st) return { written: false, reason: 'entry-file-not-found' };
  const nowText = renderCeremonyNow(st, { tsNow });
  const scrollPath = join(st.bundleDir, `${home} — scroll.md`);
  const existing = existsSync(scrollPath) ? readFileSync(scrollPath, 'utf8') : null;
  const have = existingEntryIds(existing || '');
  const newSections = ceremonyTrail(st).filter((i) => !have.has(i.key)).map(renderCeremonySection);

  let text;
  if (existing == null) {
    text = renderSkeleton({
      home, born: day(tsNow), nowText, kind: 'ceremony',
      ordersText: CEREMONY_ORDERS_PLACEHOLDER,
      makingText: newSections.join('\n\n') || '_No run in the ledger yet — the first run\'s line will open the trail._',
    });
  } else {
    const r = updateScrollText(existing, { nowText, newSections });
    if (!r.applied) return { written: false, reason: r.reason, scrollPath: relative(palaceRoot, scrollPath) };
    text = r.text;
  }
  if (!dryRun) {
    if (!existsSync(st.bundleDir)) mkdirSync(st.bundleDir, { recursive: true });
    writeFileSync(scrollPath, text);
  }
  return {
    written: !dryRun, created: existing == null, scrollPath: relative(palaceRoot, scrollPath),
    text, state: st, added_sections: newSections.length,
  };
}

/** One entry point for any page's scroll: a ceremony's, or the project/page one. */
export function materializeAnyScroll(opts) {
  if (isCeremony(opts.palaceRoot, opts.home)) return materializeCeremonyScroll(opts);
  return materializeScroll(opts);
}

export { MARK, CEREMONY_ORDERS_PLACEHOLDER };
