// Unit: weave-generate — the generation step. The model call is injected
// (runImpl), so this never spawns a real `claude -p`. Covers the pure prompt +
// parse helpers and the validity gates on generateVectorTuning.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildGenerationPrompt, extractGeneration, generateVectorTuning,
} from '../../server/weave-generate.js';

describe('buildGenerationPrompt', () => {
  test('carries title, current vector, body, and the JSON contract', () => {
    const p = buildGenerationPrompt({ title: 'Kuramoto Coupling', currentVector: 'I remain X.', body: '# Body\n\nphase-lock.' });
    expect(p).toContain('Kuramoto Coupling');
    expect(p).toContain('I remain X.');
    expect(p).toContain('phase-lock');
    expect(p).toContain('"proposed_vector"');
    expect(p).toMatch(/conatus/i);
  });
  test('notes truncation on a long body and says (none yet) for a missing vector', () => {
    const p = buildGenerationPrompt({ title: 'Big', currentVector: '', body: 'x'.repeat(20000) });
    expect(p).toMatch(/truncated/i);
    expect(p).toContain('(none yet)');
  });
});

describe('extractGeneration', () => {
  test('parses a bare JSON object', () => {
    expect(extractGeneration('{"proposed_vector":"I will keep X-ing.","rationale":"r"}'))
      .toEqual({ proposedVector: 'I will keep X-ing.', rationale: 'r' });
  });
  test('parses JSON wrapped in prose / a fence and takes the last valid one', () => {
    const raw = 'Here you go:\n```json\n{"proposed_vector":"I will cast Y.","rationale":"because"}\n```\nDone.';
    expect(extractGeneration(raw)).toEqual({ proposedVector: 'I will cast Y.', rationale: 'because' });
  });
  test('returns null when there is no parseable proposed_vector', () => {
    expect(extractGeneration('no json here')).toBeNull();
    expect(extractGeneration('{"reply":"not a vector"}')).toBeNull();
    expect(extractGeneration('')).toBeNull();
  });
});

describe('generateVectorTuning', () => {
  let root;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'vt-gen-'));
    writeFileSync(join(root, 'Foo.md'),
      '---\ntitle: Foo\ntype: concept\nstage: growing\npillars: [tools]\nforward_vector: "I remain the Foo."\n---\n# Foo\n\nFoo couples to bar.\n');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  const stub = (json) => () => json;

  test('resolves the entry, reads its vector, and returns the parsed tuning', () => {
    const r = generateVectorTuning({
      palaceRoot: root, candidate: { path: 'Foo.md' },
      runImpl: stub('{"proposed_vector":"I will keep coupling Foo to bar until the pattern teaches itself.","rationale":"rest→striving"}'),
    });
    expect(r.ok).toBe(true);
    expect(r.title).toBe('Foo');
    expect(r.currentVector).toBe('I remain the Foo.');
    expect(r.proposedVector).toMatch(/^I will keep coupling Foo/);
    expect(r.rationale).toBe('rest→striving');
  });

  test('resolves by title too', () => {
    const r = generateVectorTuning({
      palaceRoot: root, candidate: { title: 'Foo' },
      runImpl: stub('{"proposed_vector":"I will spawn new Foo connections.","rationale":"x"}'),
    });
    expect(r.ok).toBe(true);
    expect(r.path).toBe('Foo.md');
  });

  test('rejects a multi-line proposed_vector (set-vector refuses it)', () => {
    const r = generateVectorTuning({
      palaceRoot: root, candidate: { path: 'Foo.md' },
      runImpl: stub('{"proposed_vector":"line one\\nline two","rationale":"x"}'),
    });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
    expect(r.error).toMatch(/single line/i);
  });

  test('rejects a no-op (proposed identical to current)', () => {
    const r = generateVectorTuning({
      palaceRoot: root, candidate: { path: 'Foo.md' },
      runImpl: stub('{"proposed_vector":"I remain the Foo.","rationale":"x"}'),
    });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
    expect(r.error).toMatch(/no-op|identical/i);
  });

  test('rejects an unparseable reply', () => {
    const r = generateVectorTuning({ palaceRoot: root, candidate: { path: 'Foo.md' }, runImpl: stub('sorry, I cannot') });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
  });

  test('reports a 404 when the entry does not resolve', () => {
    const r = generateVectorTuning({ palaceRoot: root, candidate: { path: 'Nope.md' }, runImpl: stub('{}') });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(404);
  });

  test('reports a 502 when the worker throws', () => {
    const r = generateVectorTuning({
      palaceRoot: root, candidate: { path: 'Foo.md' },
      runImpl: () => { throw new Error('spawn ENOENT'); },
    });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(502);
  });
});
