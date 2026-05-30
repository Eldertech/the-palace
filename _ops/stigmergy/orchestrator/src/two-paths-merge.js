// two-paths-merge.js — Stage F, Phase 4: consume the choice_response, auto-merge
// the winning branch, preserve the loser.
//
// THE HUMAN'S PICK IS THE ONLY THING THAT TRIGGERS A MERGE. Two Paths never picks
// a winner. The flow: Loudon picks in the rich-content ChoiceBlock → it posts a
// `choice_response` REPLY correlated to the card by `re` → this module reads that
// REPLY, maps payload.choice (the winning option id) to its branch worktree, and
// (Loudon's call, 2026-05-29) AUTO-MERGES the winner into the working branch. The
// losing branch is NOT deleted — its BRANCHES post stands as the record and a
// one-line alternative note is left on the steward's page (§10.2 contradiction-
// as-finding: sunk work becomes a recorded alternative).
//
// Default is DRY RUN: resolveOutcome + a printed merge plan. The merge executes
// only with an explicit opt-in (the CLI's --execute flag / mergeWinner execute:true).

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { branchName } from './two-paths-dispatch.js';

// HTML-comment-delimited block on the steward's page where losing paths are
// recorded as alternatives. Invisible in every Markdown renderer (palace
// convention), source-greppable, idempotent.
export const ALT_BLOCK_START = '<!-- two-paths-alternatives:start -->';
export const ALT_BLOCK_END = '<!-- two-paths-alternatives:end -->';

function gitRun(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    const stderr = e.stderr ? e.stderr.toString() : e.message;
    throw new Error(`git ${args.join(' ')} failed: ${stderr.trim()}`);
  }
}

function branchExists(repoRoot, branch) {
  try { gitRun(['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], repoRoot); return true; }
  catch { return false; }
}

/**
 * Find the human's pick for a card: the choice_response REPLY whose `re` matches
 * the card id. Returns the winning option id, or null if no pick is in yet.
 * `pick` mode uses payload.choice; a rank response falls back to ranking[0].
 *
 * @param {Array<object>} messages
 * @param {string} cardId
 * @returns {string|null}
 */
export function findWinningPick(messages, cardId) {
  for (const m of Array.isArray(messages) ? messages : []) {
    if (!m || m.re !== cardId) continue;
    const p = m.payload;
    if (!p || p.kind !== 'choice_response') continue;
    if (typeof p.choice === 'string' && p.choice.trim() !== '') return p.choice;
    if (Array.isArray(p.ranking) && p.ranking.length > 0 && typeof p.ranking[0] === 'string') return p.ranking[0];
  }
  return null;
}

/**
 * Resolve the merge outcome from a card + the board messages carrying the pick.
 * Pure. Returns null when no valid human pick exists yet (→ never merge).
 *
 * @param {object} opts
 * @param {object} opts.card — the choice card (payload.request_id + payload.options)
 * @param {Array<object>} opts.messages — board messages to scan for the choice_response
 * @returns {{request_id, winner:{option_id,branch}, loser:{option_id,branch}}|null}
 */
export function resolveOutcome({ card, messages }) {
  if (!card || !card.payload || card.payload.kind !== 'choice') return null;
  const request_id = card.payload.request_id;
  const options = Array.isArray(card.payload.options) ? card.payload.options : [];
  if (!request_id || options.length !== 2) return null;

  const pick = findWinningPick(messages, card.id);
  if (!pick) return null; // NO PICK → NO MERGE. The gate.

  const winnerOpt = options.find((o) => o.id === pick);
  if (!winnerOpt) return null; // pick names an option not on the card → ignore
  const loserOpt = options.find((o) => o.id !== pick);

  return {
    request_id,
    winner: { option_id: winnerOpt.id, branch: branchName(request_id, winnerOpt.id) },
    loser: { option_id: loserOpt.id, branch: branchName(request_id, loserOpt.id) },
  };
}

/** The one-line alternative note left on the steward's page for the losing path. */
export function loserNote(outcome) {
  return `Two Paths (${outcome.request_id}): chose \`${outcome.winner.option_id}\`; \`${outcome.loser.option_id}\` kept as an alternative on branch \`${outcome.loser.branch}\`.`;
}

/**
 * Record the losing path as an alternative on the steward's page, inside an
 * HTML-comment block (invisible in renderers). Idempotent: the block is created
 * once and a note is appended only if not already present. Dry run by default.
 *
 * @param {object} opts
 * @param {string} opts.entryPath — abs path to the steward's home entry .md
 * @param {string} opts.note — typically loserNote(outcome)
 * @param {boolean} [opts.execute] — default false
 */
export function preserveLoserOnPage({ entryPath, note, execute = false }) {
  if (!execute) return { dry_run: true, would_append: note };
  let text = readFileSync(entryPath, 'utf8');
  if (!text.includes(ALT_BLOCK_START)) {
    text = `${text.replace(/\s*$/, '')}\n\n${ALT_BLOCK_START}\n${ALT_BLOCK_END}\n`;
  }
  if (!text.includes(note)) {
    text = text.replace(ALT_BLOCK_END, `- ${note}\n${ALT_BLOCK_END}`);
  }
  writeFileSync(entryPath, text);
  return { executed: true };
}

/**
 * Merge the winning branch into the current working branch. The pick (encoded in
 * `outcome`) is the only trigger — pass an outcome resolved from a real
 * choice_response. With execute:false (default) this returns a PLAN and changes
 * nothing. With execute:true it performs the merge, aborting cleanly on conflict
 * so the tree is never left wedged. The loser branch is never deleted.
 *
 * @param {object} opts
 * @param {string} opts.repoRoot
 * @param {object} opts.outcome — from resolveOutcome(); throws if null/absent
 * @param {boolean} [opts.execute] — default false (dry run)
 * @param {string} [opts.message] — merge commit message
 * @returns {object} result/plan
 */
export function mergeWinner({ repoRoot, outcome, execute = false, message }) {
  if (!outcome || !outcome.winner) {
    throw new Error('mergeWinner: no resolved outcome — Two Paths never merges without a human choice_response');
  }
  const { winner, loser, request_id } = outcome;
  const msg = message || `Two Paths: merge ${winner.option_id} for ${request_id} (Loudon's pick); ${loser.option_id} kept as alternative`;

  const plan = {
    stage: 'F', phase: 4, request_id,
    merge_branch: winner.branch,
    preserved_branch: loser.branch,
    loser_note: loserNote(outcome),
    merge_message: msg,
    executed: false,
  };

  if (!execute) return { ...plan, dry_run: true };

  if (!branchExists(repoRoot, winner.branch)) {
    throw new Error(`mergeWinner: winning branch "${winner.branch}" does not exist in ${repoRoot}`);
  }
  const dirty = gitRun(['status', '--porcelain'], repoRoot);
  if (dirty) {
    throw new Error(`mergeWinner: working tree is dirty; refusing to auto-merge. Commit or stash first.\n${dirty}`);
  }

  try {
    gitRun(['merge', '--no-ff', '-m', msg, winner.branch], repoRoot);
  } catch (e) {
    // Never leave a wedged tree behind.
    try { gitRun(['merge', '--abort'], repoRoot); } catch { /* nothing to abort */ }
    throw new Error(`mergeWinner: merge of "${winner.branch}" hit a conflict and was aborted — resolve by hand. ${e.message}`);
  }

  const head = gitRun(['rev-parse', 'HEAD'], repoRoot);
  return { ...plan, executed: true, head, preserved_branch_exists: branchExists(repoRoot, loser.branch) };
}
