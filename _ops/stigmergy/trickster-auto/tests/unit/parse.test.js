// Phase 0 verify gate: the fixtures of real request shapes exist and the
// parser reads every pending request on the (snapshot of the) live board
// without error, absorbing all field-location variance.

import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { readJsonl } from '../../../orchestrator/src/append.js';
import { parseRequest, normalizeOptions, deriveOptionId } from '../../src/parse.js';
import { buildInbox } from '../../src/inbox.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIX = (f) => resolve(__dirname, '../fixtures', f);
const LIVE = resolve(__dirname, '../../../../swarm/persistent/blackboard.jsonl');

describe('Phase 0 — fixtures exist', () => {
  it('board snapshot fixture exists', () => {
    expect(existsSync(FIX('board-snapshot.jsonl'))).toBe(true);
  });
  it('variance-cases fixture exists', () => {
    expect(existsSync(FIX('variance-cases.jsonl'))).toBe(true);
  });
  it('mini-board fixture exists', () => {
    expect(existsSync(FIX('mini-board.jsonl'))).toBe(true);
  });
});

describe('deriveOptionId — leading token before separator', () => {
  it('handles em-dash, hyphen, colon', () => {
    expect(deriveOptionId('APPROVE — pitch reads; greenlight.')).toBe('APPROVE');
    expect(deriveOptionId('try-carry-phase — too tame')).toBe('try-carry-phase');
    expect(deriveOptionId('rms: smooth classic')).toBe('rms');
  });
  it('returns the whole string when no separator', () => {
    expect(deriveOptionId('APPROVE')).toBe('APPROVE');
  });
});

describe('normalizeOptions — object and string shapes', () => {
  it('passes object options through, preserving next', () => {
    const out = normalizeOptions([{ id: 'A', label: 'A — a', next: 'q' }]);
    expect(out).toEqual([{ id: 'A', label: 'A — a', next: 'q' }]);
  });
  it('derives ids from string (lenient) options', () => {
    const out = normalizeOptions(['accept — fine', 'tweak-model — reshape']);
    expect(out).toEqual([
      { id: 'accept', label: 'accept — fine' },
      { id: 'tweak-model', label: 'tweak-model — reshape' },
    ]);
  });
  it('returns [] for missing options', () => {
    expect(normalizeOptions(undefined)).toEqual([]);
    expect(normalizeOptions(null)).toEqual([]);
  });
});

describe('parseRequest — field-location coalescing', () => {
  it('reads resource from payload', () => {
    const r = parseRequest({ request_id: 'x', payload: { resource: 'directional_decision', blocking: false } });
    expect(r.resource).toBe('directional_decision');
    expect(r.blocking).toBe(false);
  });
  it('reads resource + blocking from top-level', () => {
    const r = parseRequest({ request_id: 'x', resource: 'audition', blocking: true, payload: {} });
    expect(r.resource).toBe('audition');
    expect(r.blocking).toBe(true);
  });
  it('fails safe: missing blocking defaults to blocking:true', () => {
    const r = parseRequest({ request_id: 'x', payload: { resource: 'directional_decision' } });
    expect(r.blocking).toBe(true);
    expect(r.parse_warnings.some((w) => /blocking/.test(w))).toBe(true);
  });
  it('records a warning when request_id is missing', () => {
    const r = parseRequest({ payload: { resource: 'directional_decision' } });
    expect(r.request_id).toBe(null);
    expect(r.parse_warnings.some((w) => /request_id/.test(w))).toBe(true);
  });
});

describe('Phase 0 verify gate — real board snapshot parses cleanly', () => {
  const snapshot = readJsonl(FIX('board-snapshot.jsonl'));

  it('snapshot has messages', () => {
    expect(snapshot.length).toBeGreaterThan(100);
  });

  it('every pending request parses with a non-empty request_id and resource', () => {
    const { pending } = buildInbox(snapshot);
    expect(pending.length).toBeGreaterThan(0);
    for (const p of pending) {
      expect(typeof p.request_id).toBe('string');
      expect(p.request_id.length).toBeGreaterThan(0);
      expect(typeof p.resource).toBe('string');
      expect(p.resource.length).toBeGreaterThan(0);
      // options either empty or normalized objects with a label
      for (const o of p.options) {
        expect(typeof o.label).toBe('string');
      }
    }
  });

  it('answered requests are excluded from pending', () => {
    const { pending, answeredIds } = buildInbox(snapshot);
    const pendingIds = new Set(pending.map((p) => p.request_id));
    for (const id of answeredIds) {
      expect(pendingIds.has(id)).toBe(false);
    }
  });

  // Belt-and-suspenders: also parse the LIVE board if present, so the gate
  // catches drift between snapshot and reality at build time.
  it('live board (if present) parses every pending request without throwing', () => {
    if (!existsSync(LIVE)) return;
    const live = readJsonl(LIVE);
    const { pending } = buildInbox(live);
    for (const p of pending) {
      expect(p.request_id).toBeTruthy();
      expect(p.resource).toBeTruthy();
    }
  });
});

describe('variance cases — string options, top-level options, all audition flavors', () => {
  const variance = readJsonl(FIX('variance-cases.jsonl'));
  it('parses all variance cases without throwing and normalizes options', () => {
    for (const m of variance) {
      const r = parseRequest(m);
      expect(r.request_id).toBeTruthy();
      expect(r.resource).toBeTruthy();
      for (const o of r.options) expect(typeof o.label).toBe('string');
    }
  });
});
