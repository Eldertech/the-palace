import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseFrontmatter, readEntryMeta } from '../../src/entry-frontmatter.js';

describe('parseFrontmatter', () => {
  test('parses a leading YAML frontmatter block', () => {
    const fm = parseFrontmatter('---\nstage: growing\nforward_vector: "I will teach."\n---\n\n# Body');
    expect(fm.stage).toBe('growing');
    expect(fm.forward_vector).toBe('I will teach.');
  });

  test('returns {} when there is no frontmatter', () => {
    expect(parseFrontmatter('# Just a body, no fence')).toEqual({});
  });

  test('returns {} on malformed YAML rather than throwing', () => {
    expect(parseFrontmatter('---\nstage: : : broken\n  - oops\n---\n')).toEqual({});
  });

  test('handles CRLF line endings', () => {
    const fm = parseFrontmatter('---\r\nstage: seed\r\n---\r\n# x');
    expect(fm.stage).toBe('seed');
  });

  test('ignores a fence that is not at the very top', () => {
    expect(parseFrontmatter('intro\n---\nstage: mature\n---\n')).toEqual({});
  });
});

describe('readEntryMeta', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  test('reads live stage + forward_vector from the entry frontmatter', () => {
    root = mkdtempSync(path.join(tmpdir(), 'palace-fm-'));
    mkdirSync(path.join(root, 'Projects'), { recursive: true });
    const file = path.join(root, 'Projects', 'Shepard Tone Synthesizer.md');
    writeFileSync(file, '---\nstage: growing\nforward_vector: "I want to become a staged instrument."\n---\n# body');
    const meta = readEntryMeta(root, 'Shepard Tone Synthesizer');
    expect(meta.file).toBe(file);
    expect(meta.stage).toBe('growing');
    expect(meta.forward_vector).toBe('I want to become a staged instrument.');
  });

  test('returns null when the entry file is absent', () => {
    root = mkdtempSync(path.join(tmpdir(), 'palace-fm-'));
    expect(readEntryMeta(root, 'Ghost Entry')).toBeNull();
  });

  test('leaves stage/forward_vector undefined when the frontmatter lacks them', () => {
    root = mkdtempSync(path.join(tmpdir(), 'palace-fm-'));
    writeFileSync(path.join(root, 'Bare.md'), '---\ntitle: Bare\n---\n# x');
    const meta = readEntryMeta(root, 'Bare');
    expect(meta.stage).toBeUndefined();
    expect(meta.forward_vector).toBeUndefined();
  });
});
