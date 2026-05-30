// Pure filtering + grouping for the LOG commit stream.
//
// Filters only structured commits enable (STIGMERGY v1.0 §Deck III):
//   - by entry   (an entry's whole life as a timeline)
//   - by kind    (all deposits, all steward cycles, all schema ceremonies)
//   - by author  (claude vs loudon vs a named steward)
//   - by pillar  (joins touched paths → the entries catalog's pillars)
//   - by time    (since / until, ISO date prefixes)
//
// `pathPillars` is an optional Map of palace-relative path → string[] pillars,
// built from /api/entries, used only for the pillar filter.

import { tsToEpoch } from './format.js';

// Does a commit match the entry filter? True when the entry name appears in
// the commit's derived/declared entries (case-insensitive exact).
function matchesEntry(commit, entry) {
  if (!entry) return true;
  const want = entry.toLowerCase();
  return (commit.entries ?? []).some((e) => e.toLowerCase() === want);
}

// Author match: the git author name OR the Palace-Author trailer.
function matchesAuthor(commit, author) {
  if (!author) return true;
  const want = author.toLowerCase();
  const git = (commit.author ?? '').toLowerCase();
  const declared = (commit.trailers?.['Palace-Author']?.[0] ?? '').toLowerCase();
  return git.includes(want) || declared.includes(want);
}

// Pillar match: any touched .md path resolves to an entry carrying the pillar.
function matchesPillar(commit, pillar, pathPillars) {
  if (!pillar) return true;
  if (!pathPillars || !(pathPillars.get || pathPillars[pillar] !== undefined)) {
    // No map available -- can't evaluate; treat as non-matching so the filter
    // is honest about needing the catalog rather than silently passing all.
    return false;
  }
  const want = pillar.toLowerCase();
  for (const f of commit.files ?? []) {
    const pillars = pathPillars.get ? pathPillars.get(f.path) : pathPillars[f.path];
    if (Array.isArray(pillars) && pillars.map((p) => p.toLowerCase()).includes(want)) {
      return true;
    }
  }
  return false;
}

function matchesTime(commit, since, until) {
  const t = tsToEpoch(commit.date);
  if (since) {
    const s = tsToEpoch(since.length <= 10 ? `${since}T00:00:00Z` : since);
    if (Number.isFinite(s) && t < s) return false;
  }
  if (until) {
    const u = tsToEpoch(until.length <= 10 ? `${until}T23:59:59Z` : until);
    if (Number.isFinite(u) && t > u) return false;
  }
  return true;
}

function matchesText(commit, text) {
  if (!text) return true;
  const q = text.toLowerCase();
  return (commit.subject ?? '').toLowerCase().includes(q)
    || (commit.shortHash ?? '').includes(q)
    || (commit.entries ?? []).some((e) => e.toLowerCase().includes(q));
}

export function filterCommits(commits, filter = {}, pathPillars = null) {
  if (!Array.isArray(commits)) return [];
  const { kind, author, entry, pillar, since, until, text } = filter;
  return commits.filter((c) =>
    (!kind || c.kind === kind)
    && matchesAuthor(c, author)
    && matchesEntry(c, entry)
    && matchesPillar(c, pillar, pathPillars)
    && matchesTime(c, since, until)
    && matchesText(c, text)
  );
}

// Distinct kinds present in a commit set, with counts -- drives the kind
// filter chips.
export function kindCounts(commits) {
  const out = new Map();
  for (const c of commits ?? []) {
    out.set(c.kind, (out.get(c.kind) ?? 0) + 1);
  }
  return out;
}

// Distinct git authors present, with counts -- drives the author filter.
export function authorCounts(commits) {
  const out = new Map();
  for (const c of commits ?? []) {
    const a = c.author ?? 'unknown';
    out.set(a, (out.get(a) ?? 0) + 1);
  }
  return out;
}

// Group a commit list into campaign threads. Commits sharing a
// Palace-Campaign trailer collapse into one thread; the rest stand alone.
// Returns an array of { campaign | null, commits: [...] } preserving order
// (a campaign thread anchors at its newest commit's position).
export function groupByCampaign(commits) {
  const threads = [];
  const byCampaign = new Map();
  for (const c of commits ?? []) {
    if (c.campaign) {
      if (!byCampaign.has(c.campaign)) {
        const thread = { campaign: c.campaign, commits: [] };
        byCampaign.set(c.campaign, thread);
        threads.push(thread);
      }
      byCampaign.get(c.campaign).commits.push(c);
    } else {
      threads.push({ campaign: null, commits: [c] });
    }
  }
  return threads;
}
