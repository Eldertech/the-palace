// ceremony-scroll.js — a ceremony's scroll. The same three zones as a
// project's (Now · Standing Orders · the making), with a Now that answers the
// ceremony's own questions: which version is live, has it run since the spec
// last changed, and what does its tuning ledger still owe?
//
// A ceremony is any entry with a tuning ledger — `[Entry]/[Entry] — tuning.md`
// (SCHEMA — Reference §6 and §8). The ledger is the marker, so a new ceremony
// needs no registration here.
//
// Runs are read from git: the commits whose subject is that ceremony's record
// (each card says what its record is — RUN_SUBJECTS below mirrors them). Two
// ceremonies leave a record that is not a commit subject: a harvest's record
// file in its bundle, and a map build's map file in `_ops/maps/` (with its Map
// Log row). Trail sections are keyed on the commit hash or the record's own
// name, so re-materializing never duplicates or deletes.
//
// Canon: [[The Scroll]], [[Palace Ceremonies]]. Project scrolls: scroll-file.js.

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { resolveBundleDir, EXCLUDE_DIRS } from './entry-paths.js';
import { parseFrontmatter } from './entry-frontmatter.js';
import {
  MARK, CEREMONY_ORDERS_PLACEHOLDER, renderSkeleton, updateScrollText, existingEntryIds, materializeScroll,
} from './scroll-file.js';

const day = (iso) => (iso ? String(iso).slice(0, 10) : '—');
const dash = (v) => (v == null || v === '' ? '—' : String(v));


// The commit subjects that record a run, per ceremony. Each line mirrors what
// the ceremony's card says its record is; the retired forms stay so history
// still counts. Tooling commits that share a prefix are excluded by the pattern.
export const RUN_SUBJECTS = {
  'Deposit Ceremony': [/^deposit\(/, /^Deposit — /],
  'Baton Ceremony': [/^baton\(/],
  'Weave Ceremony': [/^Weave — /, /^Weave follow-up — /, /^weave-apply — /, /^weave\(/],
  'Closing Well': [/^close well\(/, /^close\(/, /^[a-z]+\(close-\d{4}-\d{2}-\d{2}\)/],
  // rich-face runs only: the face batch (`enrich(faces)`, "hero + icon") is a different job
  Enrichment: [/^enrich\((?!faces\))[^)]*\): (?!hero \+ icon)/],
  'Return Ceremony': [/^return\(/],
  'Walk Ceremony': [/^Walk — /],
  'Spore Check Ceremony': [/^Spore Check — /],
  'Revival Ceremony': [/^Revival — /],
  'Self-Model Update Ceremony': [/^Self-Model Update — /],
  'Harvest Ceremony': [/^Harvest — /],
  'Map Build Ceremony': [/^Map Build — /, /^palace\(map-build\)/],
};

/** Does this commit subject record a run of `home`? */
export function isRunSubject(home, subject) {
  const pats = RUN_SUBJECTS[home];
  if (!pats) return false;
  return pats.some((re) => re.test(String(subject || '')));
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

/**
 * Commits from `fromHash` (inclusive) to HEAD, newest first — subjects only,
 * cheap. `HEAD --not <hash>^@` rather than `<hash>~1..HEAD`, so a ceremony
 * versioned in a repository's first commit still counts.
 */
function commitsFrom(palaceRoot, fromHash) {
  const range = fromHash ? ['HEAD', '--not', `${fromHash}^@`] : ['HEAD'];
  const out = git(palaceRoot, ['log', '--format=%H%x1f%aI%x1f%s', ...range]).trim();
  if (!out) return [];
  return out.split('\n').map((line) => {
    const [hash, ts, subject] = line.split('\x1f');
    return { hash, ts, subject };
  });
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

/** Non-commit records: harvest record files, map files. [{ key, ts, label, path }] */
export function recordRuns(palaceRoot, home, bundleDir) {
  const out = [];
  if (home === 'Harvest Ceremony' && bundleDir && existsSync(bundleDir)) {
    for (const f of readdirSync(bundleDir)) {
      const m = /^Harvest — (\d{4}-\d{2}-\d{2}) — (.+)\.md$/.exec(f);
      if (m) out.push({ key: `record-${f}`, ts: m[1], label: `Harvest record — ${m[2]}`, path: relative(palaceRoot, join(bundleDir, f)) });
    }
  }
  if (home === 'Map Build Ceremony') {
    const dir = join(palaceRoot, '_ops/maps');
    const seen = new Set();
    if (existsSync(dir)) {
      for (const f of readdirSync(dir)) {
        const m = /^palace-map-(\w+)-(\d{4}-\d{2}-\d{2})\.(tsv|json)$/.exec(f);
        if (!m || seen.has(`${m[1]}-${m[2]}`)) continue;
        seen.add(`${m[1]}-${m[2]}`);
        out.push({ key: `map-${m[1]}-${m[2]}`, ts: m[2], label: `${m[1]} map built`, path: `_ops/maps/${f}` });
      }
    }
  }
  return out.sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
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
  const first = changes.length ? changes[0] : null;

  const commits = first ? commitsFrom(palaceRoot, first.hash) : [];
  const changeHashes = new Set(changes.map((c) => c.hash));
  const versionAt = (ts) => {
    let v = null;
    for (const c of changes) if (!ts || Date.parse(c.ts) <= Date.parse(ts)) v = c.version;
    return v;
  };
  const matched = commits.filter((c) => isRunSubject(home, c.subject) && !changeHashes.has(c.hash)).slice(0, 60);
  const bodies = bodiesFor(palaceRoot, [...matched.map((c) => c.hash), ...changes.map((c) => c.hash)]);
  for (const c of changes) c.lead = bodyLead(bodies.get(c.hash));
  const runs = matched
    .map((c) => ({ key: `commit-${c.hash}`, hash: c.hash, ts: c.ts, subject: c.subject, lead: bodyLead(bodies.get(c.hash)), version: versionAt(c.ts) }));
  const records = recordRuns(palaceRoot, home, b.bundleDir).map((r) => ({ ...r, version: versionAt(r.ts) }));

  // A commit ran after the change if it descends from it (ancestry, not the
  // clock); a record file has no commit of its own, so its date decides.
  const sinceSpec = spec && spec.hash
    ? new Set(git(palaceRoot, ['log', '--format=%H', `${spec.hash}..HEAD`]).split('\n').filter(Boolean))
    : new Set();
  const specMs = spec && spec.ts ? Date.parse(spec.ts) : NaN;
  const recordAfter = (day10) => (Number.isNaN(specMs) ? false : Date.parse(`${day10}T23:59:59Z`) > specMs);
  const runsSince = [
    ...runs.filter((r) => sinceSpec.has(r.hash)),
    ...records.filter((r) => recordAfter(r.ts)),
  ].sort((x, y) => String(y.ts).localeCompare(String(x.ts)));

  return {
    home,
    path: entryRel,
    tuning: relative(palaceRoot, tuningAbs),
    bundleDir: b.bundleDir,
    version,
    spec,
    versions: changes,
    runs,
    records,
    runs_since: runsSince,
    last_run: [...runs, ...records].sort((x, y) => String(y.ts).localeCompare(String(x.ts)))[0] || null,
    owed: parseOwed(ledger),
    latest: parseLatestLesson(ledger),
  };
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
  if (!st.spec || !st.spec.hash) L.push('- **Runs since the change:** — (nothing to count from until the version is committed)');
  else if (!n) L.push(`- **Runs since the change:** none yet — ${v} has not run`);
  else {
    const days = new Set(st.runs_since.map((r) => day(r.ts))).size;
    L.push(`- **Runs since the change:** ${n} record${n === 1 ? '' : 's'} on ${days} day${days === 1 ? '' : 's'}`);
  }
  if (st.last_run) L.push(`- **Last run:** ${day(st.last_run.ts)} — ${st.last_run.subject || st.last_run.label}${st.last_run.hash ? ` (\`${st.last_run.hash.slice(0, 8)}\`)` : ''}`);
  else L.push('- **Last run:** none recorded since the ceremony was first versioned');
  L.push(`- **Owed in the ledger:** ${st.owed.length ? `${st.owed.length} — item${st.owed.length === 1 ? '' : 's'} ${st.owed.map((o) => o.n).join(', ')}; the next run's tail read picks ${st.owed.length === 1 ? 'it' : 'them'} up first` : 'nothing'}`);
  if (st.latest && st.latest.heading) L.push(`- **Latest lesson:** item ${dash(st.latest.item)}, ${st.latest.heading.replace(/^From /, 'from ')} — [[${st.home} — tuning]]`);
  L.push('');
  L.push(`### Runs since ${v}`);
  L.push('');
  if (!n) L.push('_None yet._');
  for (const r of st.runs_since.slice(0, 8)) L.push(`- ${day(r.ts)} — ${r.subject || r.label}${r.hash ? ` \`${r.hash.slice(0, 8)}\`` : ''}`);
  if (n > 8) L.push(`- _…and ${n - 8} more in the trail below._`);
  L.push('');
  L.push('### Owed');
  L.push('');
  if (!st.owed.length) L.push('_Nothing owed._');
  for (const o of st.owed) L.push(`- **${o.n}.** ${o.text}`);
  L.push('');
  return L.join('\n');
}

/** One trail section: a run, a record, or a version change. */
export function renderCeremonySection(item) {
  const L = [];
  L.push(`<!-- scroll:entry id="${item.key}" -->`);
  if (item.kind === 'version') {
    L.push(`### ${day(item.ts)} — the spec moved to v${item.version}`);
    L.push('');
    L.push(item.subject);
    if (item.lead) { L.push(''); L.push(item.lead); }
    L.push(`<sub>\`${item.hash.slice(0, 8)}\` · version change</sub>`);
  } else if (item.path) {
    L.push(`### ${day(item.ts)} — ${item.label}`);
    L.push('');
    L.push(`[${basename(item.path)}](${item.path})`);
    L.push(`<sub>record${item.version ? ` · under v${item.version}` : ''}</sub>`);
  } else {
    L.push(`### ${day(item.ts)} — ${item.subject}`);
    if (item.lead) { L.push(''); L.push(item.lead); }
    L.push(`<sub>\`${item.hash.slice(0, 8)}\` · a run${item.version ? ` under v${item.version}` : ''}</sub>`);
  }
  L.push('<!-- /scroll:entry -->');
  return L.join('\n');
}

/** Trail items (runs, records, version changes) newest first. */
export function ceremonyTrail(st) {
  const versions = (st.versions || []).map((c) => ({
    kind: 'version', key: `version-${c.hash}`, hash: c.hash, ts: c.ts, subject: c.subject, version: c.version, lead: c.lead || '',
  }));
  return [...versions, ...st.runs, ...st.records]
    .sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
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
      makingText: newSections.join('\n\n') || '_No run recorded since the ceremony was first versioned — the first run will open the trail._',
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
