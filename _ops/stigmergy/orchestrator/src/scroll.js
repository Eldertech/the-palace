// scroll.js — materialize scrolls from the command line: a project's, a
// ceremony's, or any page's.
// (No shebang: the app server may import scroll-file.js through vite/esbuild.)
//
//   node _ops/stigmergy/orchestrator/src/scroll.js --home "Generative Sample Libraries"
//   node _ops/stigmergy/orchestrator/src/scroll.js --all            # every active project
//   node _ops/stigmergy/orchestrator/src/scroll.js --all --dry-run  # report, write nothing
//   node _ops/stigmergy/orchestrator/src/scroll.js --ceremonies     # every ceremony (entries with a tuning ledger)
//   node _ops/stigmergy/orchestrator/src/scroll.js --home "Weave Ceremony"   # any page; a ceremony gets a ceremony's scroll
//   node _ops/stigmergy/orchestrator/src/scroll.js --home "Crystal Synthesizer" --plan plan.md --why "what changed and why" [--headline "…"] [--by "…"]
//        # write an agreed plan (only on Loudon's yes); the change is logged on the trail
//
// `--all` walks every `type: project` entry whose status is `active` (or has
// no status) — stewarded or not — and joins each to its steward via
// REGISTRY.json when one exists. Dormant stewarded projects still get a scroll
// (the trail is real even when the page sleeps); complete / archived /
// composting projects are skipped unless named with --home.

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { materializeScroll, writePlan } from './scroll-file.js';
import { listCeremonies, materializeCeremonyScroll, materializeAnyScroll, isCeremony } from './ceremony-scroll.js';
import { parseFrontmatter } from './entry-frontmatter.js';
import { EXCLUDE_DIRS } from './entry-paths.js';
import { readRegistry } from './registry.js';

const PALACE_ROOT_DEFAULT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');

/** Every `type: project` entry in the palace: { title, file, status, stage }. */
export function listProjectEntries(palaceRoot) {
  const out = [];
  const stack = [palaceRoot];
  while (stack.length) {
    const dir = stack.pop();
    let ents;
    try { ents = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      if (e.isDirectory()) { if (!EXCLUDE_DIRS.has(e.name)) stack.push(join(dir, e.name)); continue; }
      if (!e.name.endsWith('.md') || e.isSymbolicLink()) continue;
      const file = join(dir, e.name);
      let text;
      try { text = readFileSync(file, 'utf8'); } catch { continue; }
      if (!text.startsWith('---')) continue;
      const fm = parseFrontmatter(text);
      if (fm.type !== 'project') continue;
      const title = typeof fm.title === 'string' && fm.title ? fm.title : e.name.replace(/\.md$/, '');
      out.push({ title, file: relative(palaceRoot, file), status: typeof fm.status === 'string' ? fm.status : null, stage: typeof fm.stage === 'string' ? fm.stage : null });
    }
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
}

/** home → registry entry (agent dir), for joining projects to stewards. */
export function stewardIndex(palaceRoot) {
  const idx = new Map();
  try {
    const reg = readRegistry(join(palaceRoot, '_ops/agents/permanent/REGISTRY.json'));
    for (const a of reg.agents || []) idx.set(a.home, a);
  } catch { /* no registry */ }
  return idx;
}

export function scrollAll({ palaceRoot, dryRun = false, tsNow = new Date().toISOString(), includeInactive = false }) {
  const stewards = stewardIndex(palaceRoot);
  const results = [];
  for (const p of listProjectEntries(palaceRoot)) {
    const active = p.status == null || p.status === 'active';
    if (!active && !includeInactive) { results.push({ home: p.title, skipped: `status_${p.status}` }); continue; }
    const s = stewards.get(p.title);
    const r = materializeScroll({ palaceRoot, home: p.title, agentDir: s ? s.dir : undefined, tsNow, dryRun });
    results.push({ home: p.title, stewarded: !!s, ...r });
  }
  return results;
}

function main() {
  const argv = process.argv.slice(2);
  const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
  const palaceRoot = resolve(arg('--root', PALACE_ROOT_DEFAULT));
  const dryRun = argv.includes('--dry-run');
  const home = arg('--home');
  if (home && arg('--plan')) {
    if (isCeremony(palaceRoot, home)) { process.stderr.write('a ceremony has no Plan zone — its plan is its tuning ledger\'s owed lines\n'); process.exit(2); }
    const s = stewardIndex(palaceRoot).get(home);
    const plan = readFileSync(resolve(arg('--plan')), 'utf8');
    const r = writePlan({ palaceRoot, home, plan, headline: arg('--headline', ''), why: arg('--why', ''), by: arg('--by', 'Loudon'), agentDir: s ? s.dir : undefined });
    process.stdout.write(JSON.stringify(r, null, 2) + '\n');
    if (r.error) process.exit(1);
    return;
  }
  if (home) {
    const s = stewardIndex(palaceRoot).get(home);
    const { text, state, ...r } = materializeAnyScroll({ palaceRoot, home, agentDir: s ? s.dir : undefined, dryRun });
    process.stdout.write(JSON.stringify(r, null, 2) + '\n');
    return;
  }
  if (argv.includes('--ceremonies')) {
    const rs = listCeremonies(palaceRoot).map((c) => {
      const { text, state, ...r } = materializeCeremonyScroll({ palaceRoot, home: c.title, dryRun });
      return { home: c.title, ...r };
    });
    process.stdout.write(JSON.stringify(rs, null, 2) + '\n');
    return;
  }
  if (argv.includes('--all')) {
    const rs = scrollAll({ palaceRoot, dryRun, includeInactive: argv.includes('--include-inactive') });
    process.stdout.write(JSON.stringify(rs, null, 2) + '\n');
    return;
  }
  process.stderr.write('usage: node scroll.js (--home "<Title>" [--plan <file> --why "…"] | --all [--include-inactive] | --ceremonies) [--dry-run] [--root <palace>]\n');
  process.exit(2);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
