// Entries catalog — server-side recursive walk of palace .md files.
//
// Per CLAUDE.md:
//   "Exclude .git/, .claude/, and .obsidian/. Any other subdirectory may
//    contain valid entries. When loading files by path, use paths
//    relative to the palace root."
//
// We extend the exclusion list with build/test/dep artifacts that would
// otherwise drown the index (node_modules, dist/, playwright-report, the
// stigmergy app's own __pycache__, etc.) and Enrichment card folders
// (card-NNN cards are not knowledge entries; they're work-product data
// already rendered by Phase 4.5). Everything else is included; the
// frontmatter decides whether the entry has type/pillars/stage signal.

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, sep, basename, dirname } from 'node:path';
import { parseFrontmatter, normalizeLinks, normalizePillars } from './yaml-frontmatter.js';
import { bundleDirFor, listBundleFiles } from './bundle.js';

// Top-level dirs we never walk into.
const HARD_EXCLUDE_DIRS = new Set([
  '.git', '.claude', '.obsidian',
  'node_modules',
  // The stigmergy app dir is machinery, not knowledge.
  // (Handled below with a path prefix check, since it's nested.)
]);

// Per-directory "this is build/state, not knowledge" exclusions. Matched
// on basename anywhere in the tree.
const SOFT_EXCLUDE_DIRS = new Set([
  'dist', 'build', 'test-results', 'playwright-report',
  '__pycache__', '.venv', 'venv',
  'screenshots', 'fonts',
]);

// Path prefixes (palace-relative, leading-segment match) excluded as
// machinery rather than knowledge. We keep _ops/-rooted markdown like
// `_ops/Substrate Skill.md` and `_ops/stigmergy/v1.0-build-handoff.md`
// because those ARE knowledge — but we skip the app/, swarm/, and
// Enrichment card folders.
const EXCLUDE_PREFIXES = [
  '_ops/stigmergy/app/',
  '_ops/stigmergy/orchestrator/',
  '_ops/stigmergy/trickster-auto/',
  '_ops/swarm/',
  'Enrichment/card-',
  'Enrichment/Archive/',
];

function isHardExcluded(name) {
  return HARD_EXCLUDE_DIRS.has(name) || SOFT_EXCLUDE_DIRS.has(name) || name.startsWith('.');
}

function isExcludedRelPath(rel) {
  for (const p of EXCLUDE_PREFIXES) {
    if (rel.startsWith(p)) return true;
  }
  return false;
}

// Walk the tree from palaceRoot, yielding palace-relative paths to every
// included .md file.
function* walkMarkdownFiles(palaceRoot) {
  const stack = [{ abs: resolve(palaceRoot), depth: 0 }];
  while (stack.length > 0) {
    const { abs, depth } = stack.pop();
    let entries;
    try {
      entries = readdirSync(abs, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    for (const ent of entries) {
      if (isHardExcluded(ent.name)) continue;
      const full = join(abs, ent.name);
      const rel = full.startsWith(palaceRoot + sep) ? full.slice(palaceRoot.length + 1) : full;
      // Path-prefix exclusions apply to the resolved rel path.
      if (isExcludedRelPath(rel.replaceAll(sep, '/'))) continue;
      if (ent.isDirectory()) {
        stack.push({ abs: full, depth: depth + 1 });
        continue;
      }
      if (ent.isFile() && ent.name.endsWith('.md')) {
        yield rel.replaceAll(sep, '/');
      }
    }
  }
}

// Cheap check: does the body carry the structured-marker affordances that
// STATE's renderer wants to surface?
function probeMarkers(body) {
  if (typeof body !== 'string') return { has_active_handoff: false, has_stewardship_marker: false };
  return {
    has_active_handoff: /^##\s+Active Handoff\b/m.test(body),
    has_stewardship_marker: /under (?:active\s+)?stewardship/i.test(body),
  };
}

// Build the summary shape used by PULSE + the list view.
function summarize(relPath, fm, body) {
  const title = typeof fm.title === 'string' && fm.title.trim() !== ''
    ? fm.title
    : basename(relPath, '.md');
  const pillars = normalizePillars(fm.pillars);
  const links = normalizeLinks(fm.links);
  const markers = probeMarkers(body);
  return {
    path: relPath,
    title,
    type: typeof fm.type === 'string' ? fm.type : null,
    stage: typeof fm.stage === 'string' ? fm.stage : null,
    status: typeof fm.status === 'string' ? fm.status : null,
    pillars,
    born: typeof fm.born === 'string' ? fm.born : null,
    last_activated: typeof fm.last_activated === 'string' ? fm.last_activated : null,
    activation_count: typeof fm.activation_count === 'number' ? fm.activation_count : 0,
    energy: typeof fm.energy === 'string' ? fm.energy : null,
    who_leads: typeof fm.who_leads === 'string' ? fm.who_leads : null,
    forward_vector: typeof fm.forward_vector === 'string' ? fm.forward_vector : null,
    link_count: links.length,
    body_size: typeof body === 'string' ? body.length : 0,
    has_bundle: false, // patched in caller (needs absolute path)
    has_active_handoff: markers.has_active_handoff,
    has_stewardship_marker: markers.has_stewardship_marker,
  };
}

// List every knowledge entry in the palace. Reads each .md to parse its
// frontmatter — a few hundred files at most; on a real palace this is well
// under a second.
export function listEntries(palaceRoot) {
  const root = resolve(palaceRoot);
  const out = [];
  for (const rel of walkMarkdownFiles(root)) {
    const abs = join(root, rel);
    let text;
    try { text = readFileSync(abs, 'utf8'); } catch (_) { continue; }
    const { frontmatter, body } = parseFrontmatter(text);
    const summary = summarize(rel, frontmatter, body);
    summary.has_bundle = bundleDirFor(abs) !== null;
    out.push(summary);
  }
  return out;
}

// Walk every knowledge entry yielding { path, title, links, body } — used
// by /api/unsung-paths to compute body-wikilink-not-in-YAML edges. Same
// exclusions as listEntries; carries the body so wikilinks can be scanned.
export function* walkEntryRecords(palaceRoot) {
  const root = resolve(palaceRoot);
  for (const rel of walkMarkdownFiles(root)) {
    const abs = join(root, rel);
    let text;
    try { text = readFileSync(abs, 'utf8'); } catch (_) { continue; }
    const { frontmatter, body } = parseFrontmatter(text);
    const title = typeof frontmatter.title === 'string' && frontmatter.title.trim() !== ''
      ? frontmatter.title
      : basename(rel, '.md');
    yield {
      path: rel,
      title,
      links: normalizeLinks(frontmatter.links),
      body: typeof body === 'string' ? body : '',
    };
  }
}

// Resolve a palace-relative entry path and return the full read shape:
//   { path, title, frontmatter (raw), body, bundle: {dir, files} | null,
//     summary, links (normalized), error? }
// Path traversal is rejected. Files outside the palace root yield null.
export function readEntry(palaceRoot, relPath) {
  if (typeof relPath !== 'string' || relPath === '' || relPath.includes('\0')) return null;
  const root = resolve(palaceRoot);
  const abs = resolve(root, relPath);
  if (abs !== root && !abs.startsWith(root + sep)) return null;
  if (!existsSync(abs) || !statSync(abs).isFile()) return null;
  if (!abs.endsWith('.md')) return null;
  const normalizedRel = abs.slice(root.length + 1).replaceAll(sep, '/');
  if (isExcludedRelPath(normalizedRel)) return null;

  const text = readFileSync(abs, 'utf8');
  const { frontmatter, body, error } = parseFrontmatter(text);
  const summary = summarize(normalizedRel, frontmatter, body);
  const bundleDir = bundleDirFor(abs);
  let bundle = null;
  if (bundleDir) {
    summary.has_bundle = true;
    bundle = {
      dir: bundleDir.slice(root.length + 1).replaceAll(sep, '/'),
      files: listBundleFiles(root, bundleDir),
    };
  }
  return {
    path: normalizedRel,
    title: summary.title,
    frontmatter,
    body,
    links: normalizeLinks(frontmatter.links),
    bundle,
    summary,
    error: error ?? null,
  };
}
