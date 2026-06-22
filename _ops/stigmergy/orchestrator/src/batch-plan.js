#!/usr/bin/env node
// Thin Stage C — batch plan.
//
// Scans the *enchanted* permanent stewards (the dirs under
// _ops/agents/permanent/) and decides which are due for a cycle this run.
// It dispatches NOTHING. It is pure, deterministic planning. The
// orchestrator skill's batch.md consumes this plan and runs one
// permanent.md cycle per due steward.
//
// Design stance (deliberately thin — see Project Stewardship System):
//   - "Enchant one project at a time" stays a manual act: a steward exists
//     only if someone created its _ops/agents/permanent/<name>/ dir. The
//     batch loops what is already enchanted; it never auto-spawns.
//   - The cron IS the cadence. There is no cadence enum here.
//   - The BBS IS the record. There is no digest writer here.
//   - No retire/pause/resume lifecycle, no status registry, no lock files.
//     Let those earn their way in from real runs if they ever do.
//
// The one rule it DOES enforce is stage-posture's floor: never wake a
// dormant or composting page (Substrate Skill § Stage as Alignment
// Confidence). A small debounce also prevents an accidental double-run
// from cycling the same steward twice in a few hours.
//
// Usage:
//   node batch-plan.js [--root <palace-root>] [--min-age-hours N] [--no-unenchanted] [--ignore-debounce]
// Output: JSON { generated_at, debounce_hours, due[], skipped[], unenchanted[], ignore_debounce? }
//
// --ignore-debounce: bypass the recency check for this run, treating every
// non-dormant enchanted steward as due regardless of last_active. Use for
// interactive validation runs ("re-test batch mode now") and for first-time
// catch-up after a long pause. The cron-scheduled run never sets this; the
// debounce is the safety against accidental double-runs.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findEntryFile } from './entry-paths.js';
import { dueForCycle, SKIP_STAGES } from './batch-due.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let yaml = null;
try { yaml = (await import('yaml')).default; } catch { /* fall back to crude parse */ }

const argv = process.argv.slice(2);
function arg(name, def) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
}
const palaceRoot = path.resolve(arg('--root', path.resolve(__dirname, '../../../..')));
const debounceHours = parseFloat(arg('--min-age-hours', '12'));
const showUnenchanted = !argv.includes('--no-unenchanted');
const ignoreDebounce = argv.includes('--ignore-debounce');

// SKIP_STAGES + the due predicate now live in batch-due.js (shared with the
// STIGMERGY STEWARDS deck's "due next run?" column — one rule, two readers).
const permDir = path.join(palaceRoot, '_ops/agents/permanent');

function readFrontmatter(file) {
  try {
    const txt = fs.readFileSync(file, 'utf8');
    const m = txt.match(/^---\n([\s\S]*?)\n---/);
    if (!m) return {};
    if (yaml) return yaml.parse(m[1]) || {};
    const o = {};
    for (const line of m[1].split('\n')) {
      const mm = line.match(/^(\w+):\s*"?([^"]*?)"?\s*$/);
      if (mm) o[mm[1]] = mm[2];
    }
    return o;
  } catch { return {}; }
}

// Entry resolution by title is canonical in entry-paths.js (findEntryFile takes
// palaceRoot explicitly; here it's a module const, threaded at the call site).
// Its EXCLUDE_DIRS adds `.venvs` over this script's former local set — a safe
// widening, since virtualenvs hold no `.md` entries.

const now = Date.now();
const plan = {
  generated_at: new Date().toISOString(),
  debounce_hours: debounceHours,
  ignore_debounce: ignoreDebounce,
  due: [],
  skipped: [],
  unenchanted: [],
};

let stewardDirs = [];
try {
  stewardDirs = fs.readdirSync(permDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(permDir, d.name));
} catch { /* no permanent dir yet */ }

const enchantedHomes = new Set();

for (const dir of stewardDirs) {
  const manifestPath = path.join(dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) continue;
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { continue; }
  if (manifest.mode !== 'long_duration_background') continue; // stewards only

  const home = manifest.home;
  enchantedHomes.add(home);

  let state = {};
  try { state = JSON.parse(fs.readFileSync(path.join(dir, 'state.json'), 'utf8')); } catch { /* never run */ }

  const homeFile = findEntryFile(palaceRoot, home);
  const fm = homeFile ? readFrontmatter(homeFile) : {};
  const stage = fm.stage || 'unknown';
  const status = fm.status || 'unknown';

  const rec = {
    agent: manifest.agent_id || home,
    home,
    dir: path.relative(palaceRoot, dir),
    iteration: state.iteration ?? 0,
    last_active: state.last_active || null,
    stage,
    status,
  };

  if (!homeFile) { rec.reason = 'home_page_not_found'; plan.skipped.push(rec); continue; }
  const verdict = dueForCycle({ stage, status, lastActive: rec.last_active, now, debounceHours, ignoreDebounce });
  if (!verdict.due) { rec.reason = verdict.reason; plan.skipped.push(rec); continue; }
  plan.due.push(rec);
}

// Informational only: active project pages in Projects/ with no steward yet.
// The batch does NOT act on these — they are candidates Loudon may choose to
// enchant, one at a time.
if (showUnenchanted) {
  const projectsDir = path.join(palaceRoot, 'Projects');
  let files = [];
  try { files = fs.readdirSync(projectsDir).filter((f) => f.endsWith('.md')); } catch { /* none */ }
  for (const f of files) {
    const fm = readFrontmatter(path.join(projectsDir, f));
    const title = String(fm.title || f.replace(/\.md$/, '')).replace(/^"|"$/g, '');
    if (fm.type && fm.type !== 'project') continue;
    if (SKIP_STAGES.has(fm.stage)) continue;
    if (fm.status && fm.status !== 'active') continue;
    if (enchantedHomes.has(title)) continue;
    plan.unenchanted.push({ home: title, stage: fm.stage || 'unknown' });
  }
}

process.stdout.write(JSON.stringify(plan, null, 2) + '\n');
