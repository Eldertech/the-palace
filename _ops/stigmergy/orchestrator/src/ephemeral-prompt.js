// ephemeral-prompt.js — build the interactive wake prompt for ANY page WITHOUT
// registering it as a permanent steward. The one-off counterpart to enchant.js +
// build-cycle-prompt.js: same construction, no durable footprint.
//
// Loudon's STATE-deck "enchant" is a one-off live session — bring a page to life,
// launch a terminal on it, leave the registry (_ops/agents/permanent/ +
// REGISTRY.json) untouched. The established rich construction
// (buildCyclePrompt(mode:'interactive')) needs an on-disk agentDir with
// state.json + manifest.json + history.jsonl. A freshly-enchanted permanent
// steward also has exactly that at cycle 1 — iteration 0, null cursor, empty
// history. So rather than fork a parallel prompt-builder that would drift, we
// STAGE that same trio in a throwaway tmp dir, run the real buildCyclePrompt
// verbatim, and delete the dir. The ephemeral prompt is therefore byte-identical
// to a registered steward's cycle-1 prompt — tight correlation by construction,
// not by careful copying — minus the one honest divergence noted below.
//
// Reuse map: buildManifest + buildInitialState come straight from enchant.js (the
// permanent path), and buildCyclePrompt is the orchestrator's own. The only thing
// new here is the tmp staging + cleanup wrapper.

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findEntryFile } from './entry-paths.js';
import { readPageFrontmatter, buildManifest, buildInitialState, kebab } from './enchant.js';
import { buildCyclePrompt } from './build-cycle-prompt.js';

const PALACE_ROOT_DEFAULT = process.cwd();

/**
 * Build the interactive cycle prompt for a page as a one-off (no registration).
 *
 * Idempotent and side-effect-free on the palace: nothing is written under
 * _ops/agents/permanent/, the REGISTRY is not touched, and the tmp dir is removed
 * before returning (even on a builder throw).
 *
 * @param {object} opts
 * @param {string} [opts.palaceRoot]
 * @param {string} opts.title — the page title to bring to life
 * @param {'interactive'|'headless'} [opts.mode] — defaults to 'interactive'
 * @param {object} [opts.include] — { board, history, pageChange, staging } layer toggles
 * @param {string} [opts.extraMandate] — this session's focus
 * @param {string} [opts.today] — YYYY-MM-DD
 * @returns {{ ok: boolean, status: string, home?: string, stage?: string|null, full?: string, errors?: string[] }}
 */
export function buildEphemeralPrompt(opts) {
  const {
    palaceRoot = PALACE_ROOT_DEFAULT,
    title,
    mode = 'interactive',
    include = {},
    extraMandate = '',
    today = new Date().toISOString().slice(0, 10),
  } = opts || {};

  if (!title) throw new Error('buildEphemeralPrompt: title is required');

  const pagePath = findEntryFile(palaceRoot, title);
  if (!pagePath) return { ok: false, status: 'not_found', home: title };

  // Only a page carrying frontmatter is a canon entry — and only a canon entry is
  // an agent (a frontmatter-less learning material is not). parseFrontmatter
  // throws 'no frontmatter'; surface that as a clean status rather than a 500.
  let fm;
  try { fm = readPageFrontmatter(pagePath); }
  catch (e) { return { ok: false, status: 'no_frontmatter', home: title, errors: [e.message] }; }

  const slug = kebab(title);
  const manifest = buildManifest({ title, fm, slug, today });
  // The one honest divergence from the permanent path: relabel the session so the
  // wake prompt's posting instructions don't claim "permanent-stewardship" for a
  // throwaway session. session_id appears only in the closing posting block, never
  // in the identity/state/board/posture the correlation is about — so this keeps
  // the construction tight where it matters and truthful where it counts.
  manifest.session_id = `ephemeral-${slug}-${today}`;

  const dir = mkdtempSync(join(tmpdir(), `stigmergy-ephemeral-${slug || 'page'}-`));
  try {
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    writeFileSync(join(dir, 'state.json'), JSON.stringify(buildInitialState(), null, 2) + '\n');
    writeFileSync(join(dir, 'history.jsonl'), '');

    const { full } = buildCyclePrompt({
      palaceRoot,
      agentDir: dir,
      cycleN: 1,
      extraMandate,
      today,
      mode,
      include,
    });
    return { ok: true, status: 'built', home: title, stage: fm.stage || null, full };
  } finally {
    // unlink-while-the-prompt-string-is-already-in-memory is safe — we've captured
    // `full` before this runs. force:true so a partial stage never wedges cleanup.
    rmSync(dir, { recursive: true, force: true });
  }
}
