// ruleset.js — load + validate the declarative ruleset (Phase 1).
//
// Fails CLOSED: a malformed ruleset throws rather than silently degrading to
// "grant everything" or skipping a rule. A broken ruleset must stop the engine,
// not loosen it.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_RULES_PATH = resolve(__dirname, '../rules.json');

const VALID_VERBS = new Set(['auto-grant', 'auto-deny', 'escalate']);
const VALID_PREDICATES = new Set([
  'resource_in', 'resource_equals', 'blocking',
  'has_steward_recommendation', 'has_options', 'from_in', 'over_daily_budget',
]);

/**
 * Validate a parsed ruleset object. Throws on any structural problem.
 * @returns {{ version: string, default_verb: string, rules: Array }}
 */
export function validateRuleset(rs) {
  if (!rs || typeof rs !== 'object' || Array.isArray(rs)) {
    throw new Error('ruleset must be a JSON object');
  }
  const default_verb = rs.default_verb ?? 'escalate';
  if (!VALID_VERBS.has(default_verb)) {
    throw new Error(`ruleset.default_verb must be one of ${[...VALID_VERBS].join(', ')}, got "${default_verb}"`);
  }
  if (default_verb !== 'escalate') {
    // Fail safe toward the human: an unmatched (novel) request must escalate.
    throw new Error('ruleset.default_verb must be "escalate" — an unmatched request is by definition novel and belongs to the human');
  }
  if (!Array.isArray(rs.rules)) {
    throw new Error('ruleset.rules must be an array');
  }

  const seenIds = new Set();
  rs.rules.forEach((rule, i) => {
    if (!rule || typeof rule !== 'object') throw new Error(`rule[${i}] must be an object`);
    if (typeof rule.id !== 'string' || rule.id.trim() === '') throw new Error(`rule[${i}] needs a non-empty string id`);
    if (seenIds.has(rule.id)) throw new Error(`duplicate rule id "${rule.id}"`);
    seenIds.add(rule.id);
    if (!VALID_VERBS.has(rule.verb)) throw new Error(`rule "${rule.id}" verb must be one of ${[...VALID_VERBS].join(', ')}, got "${rule.verb}"`);
    if (!rule.match || typeof rule.match !== 'object' || Array.isArray(rule.match)) {
      throw new Error(`rule "${rule.id}" needs a match object`);
    }
    for (const key of Object.keys(rule.match)) {
      if (!VALID_PREDICATES.has(key)) {
        throw new Error(`rule "${rule.id}" has unknown match predicate "${key}"; supported: ${[...VALID_PREDICATES].join(', ')}`);
      }
    }
    // An auto-grant rule with no constraint at all would grant everything —
    // refuse it.
    if (rule.verb === 'auto-grant' && Object.keys(rule.match).length === 0) {
      throw new Error(`rule "${rule.id}" is auto-grant with an empty match — refusing an unconstrained grant rule`);
    }
  });

  return { version: rs.version ?? '0', default_verb, rules: rs.rules, _raw: rs };
}

/** Load + validate the ruleset from disk (defaults to ../rules.json). */
export function loadRuleset(path = DEFAULT_RULES_PATH) {
  const text = readFileSync(path, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(`ruleset ${path} is not valid JSON: ${e.message}`);
  }
  return validateRuleset(parsed);
}
