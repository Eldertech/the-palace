// Unit: the label-generation pieces in weave-generate. The model call is
// injected (runImpl), so this never spawns a real `claude -p`.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildLabelPrompt, extractLabel, generateLabel } from '../../server/weave-generate.js';

describe('buildLabelPrompt', () => {
  test('carries both titles, the type, the family vocab, and the JSON contract', () => {
    const p = buildLabelPrompt({ sourceTitle: 'Wu Wei', sourceBody: 'flow.', targetTitle: 'Kuramoto Coupling', targetBody: 'phase.', type: 'mirrors' });
    expect(p).toContain('Wu Wei');
    expect(p).toContain('Kuramoto Coupling');
    expect(p).toContain('mirrors');
    expect(p).toMatch(/rhymes-with/); // a mirrors-family register
    expect(p).toContain('"label"');
  });
  test('falls back gracefully for a type with no register family', () => {
    const p = buildLabelPrompt({ sourceTitle: 'A', sourceBody: 'x', targetTitle: 'B', targetBody: 'y', type: 'member-of' });
    expect(p).toMatch(/no preset register family/i);
  });
});

describe('extractLabel', () => {
  test('parses a bare object, a fenced one, takes the last valid', () => {
    expect(extractLabel('{"label":"rhymes-with","rationale":"r"}')).toEqual({ label: 'rhymes-with', rationale: 'r' });
    expect(extractLabel('ok:\n```json\n{"label":"haunts","rationale":"because"}\n```')).toEqual({ label: 'haunts', rationale: 'because' });
  });
  test('returns null without a parseable label', () => {
    expect(extractLabel('no json')).toBeNull();
    expect(extractLabel('{"reply":"nope"}')).toBeNull();
  });
});

describe('generateLabel', () => {
  let root;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'vt-label-'));
    writeFileSync(join(root, 'Foo.md'), '---\ntitle: Foo\ntype: concept\nstage: growing\npillars: [tools]\n---\n# Foo\n\nFoo flows.\n');
    writeFileSync(join(root, 'Bar.md'), '---\ntitle: Bar\ntype: concept\nstage: growing\npillars: [philosophy]\n---\n# Bar\n\nBar couples.\n');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  const cand = { source: 'Foo.md', target: 'Bar.md', type: 'mirrors' };
  const stub = (json) => () => json;

  test('reads both ends, returns the parsed label (lower-cased)', () => {
    const r = generateLabel({ palaceRoot: root, candidate: cand, runImpl: stub('{"label":"Rhymes-With","rationale":"r"}') });
    expect(r.ok).toBe(true);
    expect(r.label).toBe('rhymes-with'); // normalized to §4 lower-case
    expect(r.sourceTitle).toBe('Foo');
    expect(r.targetTitle).toBe('Bar');
    expect(r.type).toBe('mirrors');
  });

  test('rejects a whitespace label', () => {
    const r = generateLabel({ palaceRoot: root, candidate: cand, runImpl: stub('{"label":"two words"}') });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
  });

  test('rejects a label that merely restates the type', () => {
    const r = generateLabel({ palaceRoot: root, candidate: cand, runImpl: stub('{"label":"mirrors"}') });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
  });

  test('rejects an unparseable reply', () => {
    const r = generateLabel({ palaceRoot: root, candidate: cand, runImpl: stub('sorry') });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
  });

  test('404 when an endpoint does not resolve', () => {
    const r = generateLabel({ palaceRoot: root, candidate: { source: 'Foo.md', target: 'Nope.md', type: 'mirrors' }, runImpl: stub('{"label":"x"}') });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(404);
  });
});
