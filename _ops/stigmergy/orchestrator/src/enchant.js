// enchant.js — enchant ONE project page as a permanent steward.
// (No shebang: the app server bundles this via ephemeral-prompt.js, and esbuild
// does NOT strip shebangs — a leading `#!` becomes a bundle syntax error. Same
// reason build-cycle-prompt.js omits one. Invoke as `node src/enchant.js`.)
//
// Reads the page's frontmatter (stage, forward_vector, links), writes the
// steward directory (manifest.json, state.json, empty history.jsonl) under
// _ops/agents/permanent/<kebab>/, validates the manifest, and registers it.
//
// This is the durable, one-at-a-time form of /tmp/enchant-many.mjs. That
// throwaway looped a hardcoded 12-project list for a single mass-enchantment;
// the deliberate act is one project at a time (see batch.md "Enchant a new
// steward"), so the durable helper takes a single title. Register and validate
// run in-process via registry.js / manifest.js rather than shelling to cli.js.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerAgent } from './registry.js';
import { loadManifest } from './manifest.js';
import { findEntryFile } from './entry-paths.js';

// findEntryFile is canonical in entry-paths.js (shared with the plan materializer
// and the prompt builder). Re-exported to preserve enchant.js's export surface.
export { findEntryFile };

const PALACE_ROOT_DEFAULT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');

/**
 * kebab-case a page title for the steward directory slug. Drops apostrophes,
 * collapses non-word runs to single hyphens, trims edge hyphens.
 */
export function kebab(title) {
  return String(title)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parse the fields enchantment needs out of a page's YAML frontmatter, without
 * a YAML dependency: stage, forward_vector (quoted or bare), and links[].target
 * wikilink names.
 *
 * @param {string} text — full page contents
 * @returns {{ stage: string|null, forward_vector: string, links: {target:string}[] }}
 */
export function parseFrontmatter(text) {
  const m = String(text).match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error('no frontmatter');
  const fmText = m[1];

  const stageMatch = fmText.match(/^stage:\s*(.+)$/m);
  const stage = stageMatch ? stageMatch[1].trim().replace(/^["']|["']$/g, '') : null;

  const fvMatch = fmText.match(/^forward_vector:\s*"((?:[^"\\]|\\.)*)"$/m)
    || fmText.match(/^forward_vector:\s*'((?:[^'\\]|\\.)*)'$/m)
    || fmText.match(/^forward_vector:\s*(.+)$/m);
  const forward_vector = fvMatch ? fvMatch[1].trim() : '';

  const links = [];
  for (const linkMatch of fmText.matchAll(/-\s*target:\s*"?\[\[([^\]]+)\]\]"?/g)) {
    links.push({ target: linkMatch[1] });
  }

  return { stage, forward_vector, links };
}

/**
 * Read + parse a page's frontmatter from disk.
 */
export function readPageFrontmatter(file) {
  return parseFrontmatter(readFileSync(file, 'utf8'));
}

/**
 * Build the §3.1 manifest object for a new permanent steward.
 *
 * @param {object} args
 * @param {string} args.title — page title (= agent_id = home)
 * @param {object} args.fm — parsed frontmatter ({ stage, forward_vector, links })
 * @param {string} args.slug — kebab slug
 * @param {string} args.today — YYYY-MM-DD
 */
export function buildManifest({ title, fm, slug, today }) {
  const neighborhood = (fm.links || [])
    .map((l) => String(typeof l === 'string' ? l : l.target).replace(/\[\[|\]\]/g, ''))
    .filter(Boolean);
  neighborhood.push('Substrate Skill', 'Project Stewardship System');

  return {
    agent_id: title,
    agent_id_rationale: 'The page IS the agent. Per Pages-as-Agents and the cycle-1 finding from the GSL Steward pilot (2026-05-03), a permanent agent identity on the BBS is its own page title — not an invented compound handle.',
    home: title,
    session_id: `permanent-stewardship-${slug}-${today}`,
    mode: 'long_duration_background',
    neighborhood,
    model: {
      provider: 'anthropic',
      name: 'claude-opus-4-7',
      endpoint: 'https://api.anthropic.com/v1',
    },
    tool_registry: ['read_palace', 'read_manifest', 'read_blackboard_session', 'read_blackboard_persistent', 'write_blackboard'],
    stopping_conditions: { max_iterations: 1, stop_on: ['cycle_complete', 'blocked_unresolved_10_cycles'] },
    blackboard_session_path: null,
    blackboard_persistent_path: '_ops/swarm/persistent/blackboard.jsonl',
    partner_id: null,
    trickster_mode: 'human',
    parallel_safe: true,
    stewardship: {
      stage_at_spawn: fm.stage || 'unknown',
      vector_at_spawn: fm.forward_vector || '(no forward_vector in frontmatter)',
      posture_source: 'Substrate Skill § Stage as Alignment Confidence',
      posture_summary_at_spawn: `${fm.stage || 'unknown'}-stage posture per the steward template — see steward.md and shared.md.`,
    },
    _spawn_metadata: {
      spawned: today,
      spawned_by: 'palace-orchestrator skill — enchant (one-at-a-time)',
      first_activation: null,
    },
  };
}

/**
 * Build the initial state.json object for a freshly-enchanted steward.
 *
 * Born slim (Bundle-Local Stewardship SSOT cutover, 2026-06-09): pure runtime
 * only. `stage` / `forward_vector` are read LIVE from the entry frontmatter and
 * decision state (open/resolved) is derived from the append-only board — so a
 * new steward carries no `stewardship` block and no pending/resolved arrays.
 * The spawn-time stage/vector snapshot, if needed for forensics, lives in
 * manifest.json (`stewardship.{stage,vector}_at_spawn`), not here.
 */
export function buildInitialState() {
  return {
    iteration: 0,
    last_active: null,
    last_read_cursor: null,
    health: {
      context_pct: 0,
      avg_output_tokens_last_5: null,
      duplicate_flags: 0,
      posting_discipline_violations: 0,
      max_tokens_hits: 0,
      score: 'green',
    },
  };
}

/**
 * Enchant one project page as a permanent steward. Idempotent at the directory
 * level: if the steward dir already exists it is left untouched.
 *
 * @param {object} opts
 * @param {string} [opts.palaceRoot]
 * @param {string} opts.title — the page title to enchant
 * @param {string} [opts.today] — YYYY-MM-DD
 * @param {string} [opts.registryPath]
 * @returns {{ title, status, slug?, dir?, stage?, errors? }}
 */
export function enchantSteward(opts) {
  const {
    palaceRoot = PALACE_ROOT_DEFAULT,
    title,
    today = new Date().toISOString().slice(0, 10),
    registryPath = join(palaceRoot, '_ops/agents/permanent/REGISTRY.json'),
  } = opts;

  if (!title) throw new Error('enchantSteward: title is required');

  const pagePath = findEntryFile(palaceRoot, title);
  if (!pagePath) return { title, status: 'not_found' };

  const fm = readPageFrontmatter(pagePath);
  const slug = kebab(title);
  const dir = join(palaceRoot, '_ops/agents/permanent', slug);
  if (existsSync(dir)) return { title, status: 'already_enchanted', dir, slug };

  mkdirSync(dir, { recursive: true });
  const manifestPath = join(dir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(buildManifest({ title, fm, slug, today }), null, 2) + '\n');
  writeFileSync(join(dir, 'state.json'), JSON.stringify(buildInitialState(), null, 2) + '\n');
  writeFileSync(join(dir, 'history.jsonl'), '');

  const validation = loadManifest(manifestPath);
  if (!validation.valid) {
    return { title, status: 'invalid_manifest', dir, slug, errors: validation.errors };
  }

  try {
    registerAgent(registryPath, { agent_id: title, home: title, dir: relative(palaceRoot, dir) });
  } catch (e) {
    return { title, status: 'register_failed', dir, slug, errors: [e.message] };
  }

  return { title, status: 'enchanted', slug, stage: fm.stage, dir };
}

function main() {
  const argv = process.argv.slice(2);
  const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
  // The title is the first token that is neither a flag nor a flag's value.
  const flagValueIdx = new Set();
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--') && argv[i + 1] && !argv[i + 1].startsWith('--')) flagValueIdx.add(i + 1);
  }
  const title = argv.find((a, i) => !a.startsWith('--') && !flagValueIdx.has(i));
  if (!title) {
    process.stderr.write('usage: node enchant.js "<Page Title>" [--root <palace>] [--today YYYY-MM-DD]\n');
    process.exit(2);
  }
  const result = enchantSteward({
    palaceRoot: arg('--root', PALACE_ROOT_DEFAULT),
    title,
    today: arg('--today', new Date().toISOString().slice(0, 10)),
  });
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.status === 'enchanted' || result.status === 'already_enchanted' ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
