#!/usr/bin/env node
// two-paths-dispatch.js — Stage F, Phase 1: branch dispatch PLANNING (dry-run).
//
// Given a Two Paths–eligible fork (selected by trickster-auto/src/two-paths.js),
// build the deterministic dispatch PLAN: two branch directives (option A / option
// B), two isolated worktree targets, and — optionally — the full steward-cycle
// prompt for each branch (via buildCyclePrompt with the branch directive as the
// cycle mandate).
//
// THIS MODULE NEVER RUNS A MODEL, CREATES A WORKTREE, OR WRITES THE BOARD. It
// produces a plan and renders it. Live execution (dispatching each branch as a
// Claude Code subagent with the Agent tool's isolation:'worktree') is a separate,
// opt-in step the human triggers — not something this code does.
//
// Cost box (Loudon's call, 2026-05-29): each branch is bounded to ONE steward
// cycle producing ONE concrete artifact. The steward self-estimates; a fork whose
// branches would exceed the box falls back to plain Stage E escalation (the
// branch directive instructs the steward to refuse and stop). 2× compute is only
// spent on forks that fit.

import { readFileSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildCyclePrompt } from './build-cycle-prompt.js';

const PALACE_ROOT_DEFAULT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');

// Each branch posts its finished deliverable here for reconciliation. The type
// is BROADCAST, not PROOF: the posting-discipline layer (validateForPosting)
// forces PROOF→WEAVE, so a PROOF could not land on BRANCHES. BROADCAST is
// board-unrestricted and keeps the built result and the oversized fallback
// (also a BROADCAST) on a single consistent type.
export const BRANCH_RESULT_BOARD = 'BRANCHES';
export const BRANCH_RESULT_TYPE = 'BROADCAST';

/** Filesystem-safe slug for a branch/worktree name. */
export function slug(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Git branch name for one path of a fork. */
export function branchName(requestId, optionId) {
  return `two-paths/${slug(requestId)}/${slug(optionId)}`;
}

/**
 * Suggested worktree path — a SIBLING of the palace, outside the working tree, so
 * no branch contaminates the others or the main checkout (§10.2). Advisory: the
 * Agent tool's isolation:'worktree' creates and returns the real path at dispatch.
 */
export function worktreeHint(palaceRoot, requestId, optionId) {
  return resolve(palaceRoot, '..', '.palace-worktrees', slug(requestId), slug(optionId));
}

/**
 * Resolve a fork's `from` (the steward's home title) to its agent directory via
 * the permanent-agent registry. Returns an absolute path or null.
 */
export function resolveAgentDir(palaceRoot, from, registryPath) {
  const regPath = registryPath || join(palaceRoot, '_ops/agents/permanent/REGISTRY.json');
  let registry;
  try { registry = JSON.parse(readFileSync(regPath, 'utf8')); } catch { return null; }
  const agents = Array.isArray(registry && registry.agents) ? registry.agents : [];
  const hit = agents.find((a) => a.home === from) || agents.find((a) => a.agent_id === from);
  if (!hit || !hit.dir) return null;
  return resolve(palaceRoot, hit.dir); // resolve() leaves absolute dirs untouched
}

/** Read the steward's next cycle number from state.json (iteration + 1). */
export function nextCycleN(agentDirAbs) {
  try {
    const state = JSON.parse(readFileSync(join(agentDirAbs, 'state.json'), 'utf8'));
    return (Number.isFinite(state.iteration) ? state.iteration : 0) + 1;
  } catch {
    return 1;
  }
}

/**
 * The branch directive — the per-cycle mandate that sends the steward down ONE
 * path. Passed to buildCyclePrompt as extraMandate. References the fork by
 * request_id and the branch's option, encodes the cost box, and tells the
 * steward how to report its finished deliverable on the BRANCHES board. It is
 * explicit that the steward must NOT pick a winner or look at the other branch.
 */
export function branchDirective({ fork, option, otherOption, letter }) {
  // Steward labels often already lead with the id ("K-SWEEP — 30s render…"); only
  // prefix the id when the label doesn't already carry it, so we never double it.
  const labelText = String(option.label || '').trim();
  const optionLine = labelText.toUpperCase().startsWith(String(option.id).toUpperCase())
    ? labelText
    : `${option.id} — ${labelText}`;
  return `STAGE F — TWO PATHS, BRANCH ${letter}.

You are running ONE branch of a two-paths exploration of your own fork
\`${fork.request_id}\` ("${fork.headline}"). A separate, isolated branch takes
\`${otherOption.id}\`; you cannot see it and must not reason about it. Take
EXACTLY one option (\`${option.id}\`) and carry it all the way to a finished thing:

    ${optionLine}

Produce ONE concrete, FINISHED deliverable that realizes this option — a real
artifact (a rendered audio file, a built sketch/patch, a written section), not a
plan or a description of one. Save it inside your entry's bundle and note its
path relative to the palace root.

COST BOX (hard limit): a single cycle and one artifact. Self-estimate FIRST. If
carrying \`${option.id}\` to a real deliverable would take more than this one
cycle, or is expensive/unbounded, do NOT start it — post ONE BROADCAST to the
GENERAL board with this exact payload and STOP:
  - payload.kind: "branch_result"
  - payload.request_id: "${fork.request_id}"
  - payload.option_id: "${option.id}"
  - payload.status: "oversized"
  - payload.reason: "<one-line why it doesn't fit the box>"
A fork that does not fit the box falls back to plain escalation; that is a
correct outcome, not a failure.

When the deliverable is finished, post ONE ${BRANCH_RESULT_TYPE} to the
\`${BRANCH_RESULT_BOARD}\` board recording the result for reconciliation:
  - to: TRICKSTER
  - board: ${BRANCH_RESULT_BOARD}
  - payload.kind: "branch_result"
  - payload.request_id: "${fork.request_id}"
  - payload.option_id: "${option.id}"
  - payload.status: "built"
  - payload.artifact_path: "<relative path to the deliverable>"
  - payload.summary: "<2-3 sentences: what you built and how it reads/sounds>"

Do NOT choose a winner, compare against the other branch, or merge anything. You
build one finished path; Loudon picks between the two completed paths.`;
}

/**
 * Build the dispatch plan for one eligible fork. Pure aside from reading the
 * registry/state on disk; never runs a model or writes anything.
 *
 * @param {object} opts
 * @param {string} [opts.palaceRoot]
 * @param {{request_id, from, headline, category, options:[{id,label},{id,label}]}} opts.fork
 * @param {string} [opts.today] — YYYY-MM-DD (pass explicitly for determinism)
 * @param {number} [opts.cycleN] — overrides the state-derived next cycle
 * @param {string} [opts.registryPath]
 * @param {boolean} [opts.withPrompts] — also assemble each branch's full cycle prompt
 * @returns {object} the dispatch plan
 */
export function planTwoPaths(opts) {
  const {
    palaceRoot = PALACE_ROOT_DEFAULT,
    fork,
    today,
    cycleN,
    registryPath,
    withPrompts = false,
  } = opts;

  const warnings = [];
  if (!fork || !Array.isArray(fork.options) || fork.options.length !== 2) {
    throw new Error('planTwoPaths: fork.options must hold exactly two options');
  }

  const agentDirAbs = resolveAgentDir(palaceRoot, fork.from, registryPath);
  if (!agentDirAbs) warnings.push(`no registered agent dir for "${fork.from}" — cannot build cycle prompts; dispatch would need a manifest/state`);
  const agentDirRel = agentDirAbs ? relative(palaceRoot, agentDirAbs) : null;
  const cycle = Number.isFinite(cycleN) ? cycleN : (agentDirAbs ? nextCycleN(agentDirAbs) : 1);

  const [optA, optB] = fork.options;
  const letters = ['A', 'B'];
  const pairs = [[optA, optB], [optB, optA]];

  const branches = pairs.map(([option, otherOption], i) => {
    const directive = branchDirective({ fork, option, otherOption, letter: letters[i] });
    const branch = {
      letter: letters[i],
      option_id: option.id,
      option_label: option.label,
      branch_name: branchName(fork.request_id, option.id),
      worktree: worktreeHint(palaceRoot, fork.request_id, option.id),
      cycle_n: cycle,
      directive,
    };
    if (withPrompts && agentDirRel) {
      try {
        const { full } = buildCyclePrompt({ palaceRoot, agentDir: agentDirRel, cycleN: cycle, today, extraMandate: directive });
        branch.cycle_prompt_bytes = full.length;
        branch.cycle_prompt = full;
      } catch (e) {
        warnings.push(`branch ${letters[i]}: could not assemble cycle prompt — ${e.message}`);
      }
    }
    return branch;
  });

  return {
    stage: 'F',
    phase: 1,
    dry_run: true,
    request_id: fork.request_id,
    from: fork.from,
    headline: fork.headline,
    category: fork.category,
    agent_dir: agentDirRel,
    cycle_n: cycle,
    cost_box: 'one steward cycle + one concrete artifact per branch; oversized → fall back to plain escalation',
    branch_result_board: BRANCH_RESULT_BOARD,
    branches,
    warnings,
  };
}

/** Adapt a trickster-auto digest escalation into a fork for planTwoPaths. */
export function forkFromEscalation(esc) {
  const tp = esc && esc.two_paths;
  if (!tp || !tp.eligible) return null;
  return {
    request_id: esc.request_id,
    from: esc.from,
    headline: esc.headline,
    category: tp.category,
    options: tp.options,
  };
}

/** Render a dispatch plan as a human-readable dry-run report. */
export function renderPlanText(plan) {
  const L = [];
  L.push(`# Two Paths — dispatch plan (DRY RUN)`);
  L.push('');
  L.push(`Fork: \`${plan.request_id}\`  ·  [${plan.from}]  ·  category: ${plan.category}`);
  L.push(`"${plan.headline}"`);
  L.push(`Agent dir: ${plan.agent_dir || '(unresolved)'}  ·  cycle: ${plan.cycle_n}`);
  L.push(`Cost box: ${plan.cost_box}`);
  L.push(`Branch results reconcile on board: \`${plan.branch_result_board}\``);
  L.push('');
  for (const b of plan.branches) {
    L.push(`## Branch ${b.letter} — ${b.option_id}`);
    L.push(`  branch:   ${b.branch_name}`);
    L.push(`  worktree: ${b.worktree}`);
    if (b.cycle_prompt_bytes != null) L.push(`  cycle prompt: ${b.cycle_prompt_bytes} bytes (assembled, not dispatched)`);
    L.push(`  option: ${b.option_label}`);
    L.push('  directive:');
    for (const line of b.directive.split('\n')) L.push(`    ${line}`);
    L.push('');
  }
  if (plan.warnings.length) {
    L.push('## Warnings');
    for (const w of plan.warnings) L.push(`  - ${w}`);
    L.push('');
  }
  L.push('No models were run, no worktrees created, no board writes. Live dispatch is a separate opt-in step.');
  return L.join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
  const has = (n) => argv.includes(n);
  const palaceRoot = resolve(arg('--root', PALACE_ROOT_DEFAULT));
  const digestPath = arg('--digest', join(palaceRoot, '_ops/stigmergy/trickster-auto/digest-latest.json'));
  const requestId = arg('--request-id');
  const today = arg('--today');
  const withPrompts = has('--with-prompts');

  let digest;
  try { digest = JSON.parse(readFileSync(digestPath, 'utf8')); } catch (e) {
    process.stderr.write(`Cannot read digest at ${digestPath}: ${e.message}\n`);
    process.exit(1);
  }
  const escalations = Array.isArray(digest.ranked_escalations) ? digest.ranked_escalations : [];
  const eligible = escalations.filter((e) => e.two_paths && e.two_paths.eligible);

  const targets = requestId
    ? eligible.filter((e) => e.request_id === requestId)
    : eligible;

  if (targets.length === 0) {
    process.stdout.write(requestId
      ? `No eligible Two Paths fork with request_id "${requestId}" in ${digestPath}.\n`
      : `No Two Paths–eligible forks in ${digestPath}.\n`);
    return;
  }

  for (const esc of targets) {
    const fork = forkFromEscalation(esc);
    const plan = planTwoPaths({ palaceRoot, fork, today, withPrompts });
    process.stdout.write(renderPlanText(plan) + '\n\n');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
