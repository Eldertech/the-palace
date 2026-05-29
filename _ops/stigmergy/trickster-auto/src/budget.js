// budget.js — Phase 4. A daily palace-wide auto-grant budget.
//
// Keeps a runaway batch from auto-granting unbounded resources without Loudon.
// The budget is a per-DAY cap on the number of auto-grants; when it is spent,
// the evaluator downgrades any further grantable request to escalate (the flip
// lives in evaluate.js / budgetExhausted). State persists to state/budget.json
// and RESETS when the date rolls over.
//
// The cap is deliberately on COUNT, not tokens: on today's board the only
// grantable category is non-blocking directional forks (not token-priced), so
// "how many directions did the machine commit to today" is the meaningful bound.
// A perResource sub-budget carries the (dormant) web_search search cap forward.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_BUDGET_PATH = resolve(__dirname, '../state/budget.json');
export const DEFAULT_DAILY_CAP = 8;

/**
 * Load (and day-reset) the budget state.
 * @param {{ today?: string, cap?: number, statePath?: string }} [opts]
 * @returns {{ state: object, path: string }}
 */
export function loadBudget(opts = {}) {
  const path = opts.statePath || DEFAULT_BUDGET_PATH;
  const today = opts.today || '';

  let persisted = null;
  if (existsSync(path)) {
    try { persisted = JSON.parse(readFileSync(path, 'utf8')); } catch { persisted = null; }
  }

  const cap = (typeof opts.cap === 'number' && Number.isFinite(opts.cap))
    ? opts.cap
    : (persisted && typeof persisted.autoGrantsMax === 'number' ? persisted.autoGrantsMax : DEFAULT_DAILY_CAP);

  const sameDay = persisted && persisted.date === today && today !== '';
  const used = sameDay ? (persisted.autoGrantsUsed || 0) : 0;
  const perResource = sameDay ? (persisted.perResource || {}) : {};

  const state = {
    date: today,
    autoGrantsUsed: used,
    autoGrantsMax: cap,
    autoGrantsRemaining: Math.max(0, cap - used),
    perResource,
  };
  return { state, path };
}

/** Persist the current budget state to disk. */
export function persistBudget(budget) {
  if (!budget || !budget.path) return;
  mkdirSync(dirname(budget.path), { recursive: true });
  writeFileSync(budget.path, JSON.stringify(budget.state, null, 2) + '\n', 'utf8');
}

/**
 * After a LIVE run, decrement the persisted budget by the number of auto-grants
 * actually decided, and write it back. No-op for grants beyond the cap (they
 * were flipped to escalate by the evaluator, so they don't appear as grants).
 *
 * @param {{ state: object, path: string }} budget
 * @param {Array<{verdict:{verb:string}}>} results
 */
export function applyDecisions(budget, results) {
  if (!budget || !budget.state) return budget;
  const grants = results.filter((r) => r.verdict && r.verdict.verb === 'auto-grant').length;
  budget.state.autoGrantsUsed += grants;
  budget.state.autoGrantsRemaining = Math.max(0, budget.state.autoGrantsMax - budget.state.autoGrantsUsed);
  persistBudget(budget);
  return budget;
}

export function summarizeBudget(budget) {
  const s = budget.state;
  return `budget ${s.autoGrantsUsed}/${s.autoGrantsMax} used today (${s.autoGrantsRemaining} grants remaining)`;
}
