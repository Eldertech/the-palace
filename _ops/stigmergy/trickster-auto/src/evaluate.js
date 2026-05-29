// evaluate.js — the pure triage evaluator (Phase 1).
//
//   evaluate(request, ruleset, budgetState) → { verb, ruleId, rationale, ... }
//
// Pure: no I/O, no board writes, no clock. Given the same inputs it always
// returns the same verdict — this is what makes shadow mode a meaningful
// comparison against Loudon's own decisions.
//
// Order of decision (each step can only make the outcome SAFER):
//   1. HARD GATE  — auditionOrIrreversible(): sensory/destructive → escalate.
//                   Cannot be overridden by any rule.
//   2. RULES      — first matching rule in ruleset order wins.
//   3. BUDGET     — an auto-grant whose daily budget is exhausted → escalate.
//   4. DEFAULT    — no rule matched → ruleset.default_verb (escalate).

import { auditionOrIrreversible } from './audition-gate.js';
import { matchRecommendationToOption } from './parse.js';

/** Is the daily auto-grant budget exhausted? Phase 4 owns the real state. */
function budgetExhausted(budgetState) {
  if (!budgetState) return false; // no budget tracking → not exhausted
  if (typeof budgetState.autoGrantsRemaining === 'number') {
    return budgetState.autoGrantsRemaining <= 0;
  }
  if (typeof budgetState.autoGrantsUsed === 'number' && typeof budgetState.autoGrantsMax === 'number') {
    return budgetState.autoGrantsUsed >= budgetState.autoGrantsMax;
  }
  return false;
}

/** Does a resource type sit over its per-resource daily budget? (dormant) */
function overDailyBudget(resource, budgetState) {
  if (!budgetState || !budgetState.perResource) return false;
  const r = budgetState.perResource[resource];
  if (!r || typeof r.used !== 'number' || typeof r.max !== 'number') return false;
  return r.used >= r.max;
}

/** Evaluate a single match predicate set against a parsed request. */
function ruleMatches(request, match, budgetState) {
  for (const [key, want] of Object.entries(match)) {
    switch (key) {
      case 'resource_in':
        if (!Array.isArray(want) || !want.includes(request.resource)) return false;
        break;
      case 'resource_equals':
        if (request.resource !== want) return false;
        break;
      case 'blocking':
        if (request.blocking !== want) return false;
        break;
      case 'has_steward_recommendation':
        if (Boolean(request.steward_recommendation) !== want) return false;
        break;
      case 'has_options':
        if ((request.options.length > 0) !== want) return false;
        break;
      case 'from_in':
        if (!Array.isArray(want) || !want.includes(request.from)) return false;
        break;
      case 'over_daily_budget':
        if (overDailyBudget(request.resource, budgetState) !== want) return false;
        break;
      default:
        // ruleset.js validation forbids unknown predicates, so this is
        // unreachable in practice — fail closed if it ever happens.
        return false;
    }
  }
  return true;
}

/**
 * Pick the option a grant should record. For "steward_recommendation", match
 * the option whose id equals the steward's recommendation (or whose label's
 * derived id does); otherwise the first option. Returns {id,label} or null.
 */
export function pickGrantOption(request, rule) {
  const opts = request.options || [];
  if (rule.grant_option === 'steward_recommendation' && request.steward_recommendation) {
    const matched = matchRecommendationToOption(request);
    if (matched) return matched;
  }
  if (opts.length > 0) return { id: opts[0].id, label: opts[0].label, source: 'first' };
  return null;
}

/**
 * @param {object} request — a parseRequest() record
 * @param {object} ruleset — a validateRuleset() result
 * @param {object|null} [budgetState]
 * @returns {{
 *   verb: 'auto-grant'|'auto-deny'|'escalate',
 *   ruleId: string,
 *   rationale: string,
 *   hardGate?: boolean,
 *   gateKind?: string,
 *   grantOption?: {id,label,source}|null,
 *   denyReason?: string,
 *   supersededRuleId?: string,
 *   request_id: string|null
 * }}
 */
export function evaluate(request, ruleset, budgetState = null) {
  const base = { request_id: request?.request_id ?? null };

  // 1. HARD GATE — sacred, cannot be overridden.
  const gate = auditionOrIrreversible(request);
  if (gate.blocked) {
    return {
      ...base,
      verb: 'escalate',
      ruleId: `HARD-GATE:${gate.kind}`,
      rationale: gate.reason,
      hardGate: true,
      gateKind: gate.kind,
      gateSignal: gate.signal,
    };
  }

  // 2. RULES — first match wins.
  for (const rule of ruleset.rules) {
    if (!ruleMatches(request, rule.match, budgetState)) continue;

    if (rule.verb === 'auto-grant') {
      // 3. BUDGET — exhausted budget downgrades a grant to escalate.
      if (budgetExhausted(budgetState)) {
        return {
          ...base,
          verb: 'escalate',
          ruleId: 'budget-exhausted',
          rationale: 'Daily auto-grant budget exhausted; the remaining grantable requests escalate to Loudon instead of auto-granting.',
          supersededRuleId: rule.id,
        };
      }
      return {
        ...base,
        verb: 'auto-grant',
        ruleId: rule.id,
        rationale: rule.rationale ?? '',
        grantOption: pickGrantOption(request, rule),
      };
    }

    if (rule.verb === 'auto-deny') {
      return {
        ...base,
        verb: 'auto-deny',
        ruleId: rule.id,
        rationale: rule.rationale ?? '',
        denyReason: rule.deny_reason ?? 'Auto-denied by ruleset.',
      };
    }

    // explicit escalate rule
    return { ...base, verb: 'escalate', ruleId: rule.id, rationale: rule.rationale ?? '' };
  }

  // 4. DEFAULT — novel request escalates.
  return {
    ...base,
    verb: ruleset.default_verb || 'escalate',
    ruleId: 'default-no-match',
    rationale: 'No rule matched; a novel/unrecognized request escalates to Loudon by default.',
  };
}

/** Convenience: evaluate a whole list of parsed requests (no budget threading). */
export function evaluateAll(requests, ruleset, budgetState = null) {
  return requests.map((r) => ({ request: r, verdict: evaluate(r, ruleset, budgetState) }));
}

/**
 * Evaluate a batch while THREADING the daily budget: each auto-grant consumes
 * one unit of a working copy of the remaining budget, so the (cap+1)-th
 * grantable request in a single run flips to escalate (budget-exhausted). The
 * caller's persisted budget is NOT mutated — only this run's working copy.
 *
 * @param {Array<object>} requests
 * @param {object} ruleset
 * @param {object|null} budgetState — { autoGrantsRemaining, ... } or null
 */
export function evaluateBatch(requests, ruleset, budgetState = null) {
  const working = budgetState
    ? { ...budgetState }
    : null;
  return requests.map((r) => {
    const verdict = evaluate(r, ruleset, working);
    if (verdict.verb === 'auto-grant' && working && typeof working.autoGrantsRemaining === 'number') {
      working.autoGrantsRemaining -= 1;
    }
    return { request: r, verdict };
  });
}
