import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = resolve(__dirname, '../fixtures/digest-sample.json');

const REQUIRED_TOP_KEYS = [
  'schema', 'generated_at', 'mode', 'board', 'counts',
  'ranked_escalations', 'auto_decisions',
];

const REQUIRED_ESCALATION_KEYS = [
  'rank', 'tier', 'tier_key', 'tier_label', 'disharmony_signature',
  'request_id', 'from', 'resource', 'blocking', 'gate_kind', 'gate_signal',
  'rule_id', 'headline', 'options', 'rationale', 'age_ts', 'two_paths',
];

const REQUIRED_AUTO_DECISION_KEYS = [
  'request_id', 'from', 'resource', 'verb', 'rule_id',
  'option_id', 'option_label', 'rationale',
];

describe('digest-sample fixture mirrors the live digest shape', () => {
  const digest = JSON.parse(readFileSync(FIXTURE, 'utf8'));

  it('has every required top-level key', () => {
    for (const k of REQUIRED_TOP_KEYS) {
      expect(digest, `missing top key: ${k}`).toHaveProperty(k);
    }
  });

  it('every ranked_escalation carries the full key set', () => {
    expect(Array.isArray(digest.ranked_escalations)).toBe(true);
    expect(digest.ranked_escalations.length).toBeGreaterThan(0);
    for (const e of digest.ranked_escalations) {
      for (const k of REQUIRED_ESCALATION_KEYS) {
        expect(e, `escalation ${e.request_id} missing key: ${k}`).toHaveProperty(k);
      }
    }
  });

  it('every auto_decision carries the full key set', () => {
    expect(Array.isArray(digest.auto_decisions)).toBe(true);
    expect(digest.auto_decisions.length).toBeGreaterThan(0);
    for (const d of digest.auto_decisions) {
      for (const k of REQUIRED_AUTO_DECISION_KEYS) {
        expect(d, `auto_decision ${d.request_id} missing key: ${k}`).toHaveProperty(k);
      }
    }
  });

  it('rule_id is present and non-empty on EVERY item in BOTH arrays', () => {
    for (const e of digest.ranked_escalations) {
      expect(typeof e.rule_id).toBe('string');
      expect(e.rule_id.length, `escalation ${e.request_id} has empty rule_id`).toBeGreaterThan(0);
    }
    for (const d of digest.auto_decisions) {
      expect(typeof d.rule_id).toBe('string');
      expect(d.rule_id.length, `auto_decision ${d.request_id} has empty rule_id`).toBeGreaterThan(0);
    }
  });

  it('request_id is present and non-empty on EVERY item in BOTH arrays', () => {
    for (const e of digest.ranked_escalations) {
      expect(typeof e.request_id).toBe('string');
      expect(e.request_id.length).toBeGreaterThan(0);
    }
    for (const d of digest.auto_decisions) {
      expect(typeof d.request_id).toBe('string');
      expect(d.request_id.length).toBeGreaterThan(0);
    }
  });

  it('enumerates the distinct rule_ids present', () => {
    const rules = new Set();
    for (const e of digest.ranked_escalations) rules.add(e.rule_id);
    for (const d of digest.auto_decisions) rules.add(d.rule_id);
    // Live digest as of 2026-06-03 shows: HARD-GATE:audition, default-no-match,
    // grant-nonblocking-recommended-fork. Fixture mirrors that vocabulary.
    expect(rules.has('HARD-GATE:audition')).toBe(true);
    expect(rules.has('default-no-match')).toBe(true);
    expect(rules.has('grant-nonblocking-recommended-fork')).toBe(true);
  });

  it('audition rules carry blocking:true (the audition gate is sacred)', () => {
    const auditions = digest.ranked_escalations.filter((e) => e.rule_id === 'HARD-GATE:audition');
    expect(auditions.length).toBeGreaterThan(0);
    for (const a of auditions) {
      expect(a.blocking).toBe(true);
      expect(a.gate_kind).toBe('audition');
    }
  });
});
