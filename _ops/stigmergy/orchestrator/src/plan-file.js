// plan-file.js — materialize `[Entry] — plan.md`, the bundle-local read-model.
//
// Bundle-Local Stewardship plan, Phase 1b/1c. The append-only board is the event
// log (what happened); state.json keeps slim runtime; this file is the
// materialized CURRENT work-state an agent or Loudon can read cold — open
// decisions, resolved decisions, a done trail — without parsing JSONL in _ops.
// It is regenerated each cycle from state + history. It holds a POINTER to the
// entry's forward_vector, never a copy (single-source-of-truth). SCHEMA §8 type
// `plan`; template + read seam in [[Substrate Skill]] § Stage as Alignment Confidence.

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { resolveBundleDir } from './entry-paths.js';
import { parseFrontmatter } from './entry-frontmatter.js';

const DECISION_EVENTS = new Set(['AGENT_REASONING', 'CYCLE_COMPLETE']);

const dash = (v) => (v == null || v === '' ? '—' : String(v));
const optsLine = (options) =>
  Array.isArray(options) && options.length
    ? options.map((o) => (typeof o === 'string' ? o : o.id || o.label || String(o))).join(' · ')
    : '—';

/** One pending/resolved request rendered as a markdown block. */
function renderDecision(r, { resolved }) {
  const lines = [];
  const head = `### \`${dash(r.request_id)}\` — ${dash(r.resource)}${r.blocking ? '  ·  **blocking**' : ''}`;
  lines.push(head);
  if (r.decision_topic) lines.push(`- **Topic:** ${r.decision_topic}`);
  lines.push(`- **Options:** ${optsLine(r.options)}`);
  if (r.steward_recommendation) lines.push(`- **Steward recommendation:** ${r.steward_recommendation}`);
  if (!resolved && r.next_cycle_action_if_granted) lines.push(`- **If granted:** ${r.next_cycle_action_if_granted}`);
  lines.push(`- **Posted:** ${dash(r.posted_at)}`);
  if (resolved) {
    lines.push(`- **Resolved:** ${dash(r.resolved_at)}${r.resolved_by ? ` (by \`${r.resolved_by}\`)` : ''}`);
    if (r.outcome) lines.push(`- **Outcome:** ${r.outcome}`);
  }
  return lines.join('\n');
}

/** Read the history tail and build the Done trail (shipped + reasoning events, newest first). */
function renderDone(historyPath, { limit = 14 } = {}) {
  let events = [];
  if (historyPath && existsSync(historyPath)) {
    try {
      events = readFileSync(historyPath, 'utf8')
        .trim().split('\n').filter(Boolean)
        .map((l) => { try { return JSON.parse(l); } catch { return null; } })
        .filter((e) => e && DECISION_EVENTS.has(e.event));
    } catch { events = []; }
  }
  if (!events.length) return '_No done trail yet — first cycle, or history not written._';
  const lines = events.slice(-limit).reverse().map((e) => {
    if (e.event === 'AGENT_REASONING') return `- ${dash(e.ts)} — ${dash(e.summary)}`;
    const posted = Array.isArray(e.posted_messages) && e.posted_messages.length ? e.posted_messages.join(', ') : 'none';
    return `- ${dash(e.ts)} — cycle complete (iteration ${dash(e.iteration)}); posted: ${posted}`;
  });
  return lines.join('\n');
}

/**
 * Render the full plan.md markdown. Pure — no filesystem writes.
 *
 * @param {object} opts
 * @param {string} opts.home — entry title
 * @param {object} opts.state — the steward's state.json (pending/resolved/iteration)
 * @param {string} [opts.stage] — live stage read from the entry's frontmatter
 * @param {string} [opts.born] — YYYY-MM-DD to preserve from an existing plan.md
 * @param {string} [opts.today] — YYYY-MM-DD for a new file's born
 * @param {string} [opts.tsNow] — ISO timestamp of this materialization
 * @param {number} [opts.iteration]
 * @param {string} [opts.stagingTitle] — bundle staging file's wikilink title, if present
 * @param {string} [opts.historyPath] — abs path to history.jsonl for the Done trail
 * @returns {string}
 */
export function renderPlanMarkdown(opts) {
  const { home, state = {}, stage, born, today, tsNow, iteration, stagingTitle, historyPath } = opts;
  // Decision state is board-derived (single-source-of-truth): callers pass the
  // reconciled `pending` / `resolved` view computed from the append-only board.
  // Fall back to the legacy `state.{pending,resolved}_requests` arrays only when
  // no explicit view is given (pre-cutover callers / unit fixtures); after the
  // SSOT cutover state no longer carries them, so the fallback yields [].
  const pending = Array.isArray(opts.pending) ? opts.pending
    : (Array.isArray(state.pending_requests) ? state.pending_requests : []);
  const resolved = Array.isArray(opts.resolved) ? opts.resolved
    : (Array.isArray(state.resolved_requests) ? state.resolved_requests : []);
  const bornDate = born || today || (tsNow ? String(tsNow).slice(0, 10) : '');
  const iter = iteration ?? state.iteration;

  const fm = [
    '---',
    `title: "${home} — plan"`,
    `born: ${bornDate}`,
    'links:',
    `  - target: "[[${home}]]"`,
    '    type: connects-to',
    '    label: plan-for',
    `forward_vector: "I am ${home}'s materialized work state — open decisions, resolved decisions, and a done trail — regenerated each steward cycle so the entry can be read cold without opening _ops."`,
    '---',
  ].join('\n');

  const planSection = [
    `- **Stage:** ${dash(stage)} (read live from [[${home}]] frontmatter)`,
    stagingTitle ? `- **Teaching arc:** [[${stagingTitle}]] — read by the steward; arc changes are flagged, not edited here.` : null,
    `- **Open:** ${pending.length}  ·  **Resolved:** ${resolved.length}  ·  **Iteration:** ${dash(iter)}`,
  ].filter(Boolean).join('\n');

  const openSection = pending.length
    ? pending.map((r) => renderDecision(r, { resolved: false })).join('\n\n')
    : '_None open._';

  const resolvedSection = resolved.length
    ? resolved.slice().reverse().map((r) => renderDecision(r, { resolved: true })).join('\n\n')
    : '_None yet._';

  return [
    fm,
    '',
    `# ${home} — plan`,
    '',
    '> Materialized read-model of the steward\'s work state. Regenerated each cycle from the [[STIGMERGY]] persistent board; do not hand-edit the decision sections.',
    `> **Forward vector:** see [[${home}]] frontmatter \`forward_vector\` — not copied here (single-source-of-truth).`,
    tsNow ? `> _Last materialized: ${tsNow}._` : null,
    '',
    '## Plan',
    '',
    planSection,
    '',
    '## Open Decisions',
    '',
    openSection,
    '',
    '## Resolved Decisions',
    '',
    resolvedSection,
    '',
    '## Done',
    '',
    renderDone(historyPath),
    '',
  ].filter((l) => l !== null).join('\n');
}

/**
 * Detect a bundle-local staging file (`[Entry] — Staging.md`, any case on
 * "staging"). Returns the wikilink title (filename minus .md) or null.
 */
export function findStagingTitle(bundleDir, home) {
  let names;
  try { names = readdirSync(bundleDir); } catch { return null; }
  const want = `${home} — staging.md`.toLowerCase();
  const hit = names.find((n) => n.toLowerCase() === want);
  return hit ? hit.replace(/\.md$/i, '') : null;
}

/**
 * Materialize `[Entry] — plan.md` into the entry's bundle. Additive and
 * defensive: resolves the bundle from `home`, preserves an existing file's
 * `born`, creates the bundle folder if absent (it now owns a file), and writes.
 * Returns a summary; never throws on a missing entry — returns { written:false }.
 *
 * @param {object} opts
 * @param {string} opts.palaceRoot
 * @param {string} opts.home
 * @param {object} opts.state
 * @param {string} [opts.stage]
 * @param {string} [opts.tsNow]
 * @param {string} [opts.today]
 * @param {number} [opts.iteration]
 * @param {string} [opts.historyPath]
 * @param {object[]} [opts.pending] — board-derived open decisions (SSOT); preferred over state arrays
 * @param {object[]} [opts.resolved] — board-derived resolved decisions (SSOT); preferred over state arrays
 * @returns {{ written: boolean, planPath?: string, bundleDir?: string, stagingTitle?: string|null, reason?: string }}
 */
export function materializePlan(opts) {
  const { palaceRoot, home, state, stage, tsNow, today, iteration, historyPath, pending, resolved } = opts;
  const bundle = resolveBundleDir(palaceRoot, home);
  if (!bundle) return { written: false, reason: 'entry-file-not-found' };
  const { bundleDir } = bundle;

  const planPath = join(bundleDir, `${home} — plan.md`);
  let born;
  if (existsSync(planPath)) {
    try {
      const prior = parseFrontmatter(readFileSync(planPath, 'utf8'));
      if (typeof prior.born === 'string') born = prior.born;
    } catch { /* fall through to fresh born */ }
  }

  if (!existsSync(bundleDir)) mkdirSync(bundleDir, { recursive: true });
  const stagingTitle = findStagingTitle(bundleDir, home);

  const md = renderPlanMarkdown({ home, state, stage, born, today, tsNow, iteration, stagingTitle, historyPath, pending, resolved });
  writeFileSync(planPath, md);
  return { written: true, planPath, bundleDir, stagingTitle };
}
