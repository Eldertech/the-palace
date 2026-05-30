import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bundleDirFor, classifyFile, listBundleFiles } from '../../src/lib/bundle.js';

describe('classifyFile', () => {
  it('classifies by extension', () => {
    expect(classifyFile('a.png')).toBe('image');
    expect(classifyFile('a.WAV')).toBe('audio');
    expect(classifyFile('a.mp4')).toBe('video');
    expect(classifyFile('a.html')).toBe('html');
    expect(classifyFile('a.md')).toBe('text');
    expect(classifyFile('a.json')).toBe('json');
    expect(classifyFile('a.py')).toBe('code');
    expect(classifyFile('a.pdf')).toBe('pdf');
    expect(classifyFile('a.weird')).toBe('file');
    expect(classifyFile('Makefile')).toBe('file');
  });
});

describe('bundleDirFor + listBundleFiles', () => {
  let root;
  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'stigmergy-bundle-'));
    // Entry without a bundle.
    writeFileSync(join(root, 'Alone.md'), '---\ntitle: Alone\n---\nbody\n');
    // Entry with a bundle (Foo.md + Foo/...).
    writeFileSync(join(root, 'Foo.md'), '---\ntitle: Foo\n---\nbody\n');
    mkdirSync(join(root, 'Foo'));
    writeFileSync(join(root, 'Foo', 'Foo — handoff.md'), '# h\n');
    writeFileSync(join(root, 'Foo', 'image.png'), 'PNGDATA');
    writeFileSync(join(root, 'Foo', '.DS_Store'), 'hidden');
    mkdirSync(join(root, 'Foo', 'Archive'));
    writeFileSync(join(root, 'Foo', 'Archive', 'old.md'), '# old\n');
    mkdirSync(join(root, 'Foo', 'media'));
    writeFileSync(join(root, 'Foo', 'media', 'song.wav'), 'WAVDATA');
  });
  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('returns null when no sibling folder', () => {
    expect(bundleDirFor(join(root, 'Alone.md'))).toBeNull();
  });

  it('returns the bundle dir when present', () => {
    const b = bundleDirFor(join(root, 'Foo.md'));
    expect(b).toBe(join(root, 'Foo'));
  });

  it('returns null on non-.md input', () => {
    expect(bundleDirFor('whatever.txt')).toBeNull();
    expect(bundleDirFor(null)).toBeNull();
  });

  it('listBundleFiles walks 2 levels, skips hidden/Archive, classifies', () => {
    const bundle = bundleDirFor(join(root, 'Foo.md'));
    const files = listBundleFiles(root, bundle);
    const names = files.map((f) => f.name).sort();
    expect(names).toEqual(['Foo — handoff.md', 'image.png', 'song.wav']);
    const png = files.find((f) => f.name === 'image.png');
    expect(png.kind).toBe('image');
    expect(png.relPath).toBe('Foo/image.png');
    expect(png.size).toBeGreaterThan(0);
    const wav = files.find((f) => f.name === 'song.wav');
    expect(wav.kind).toBe('audio');
    expect(wav.depth).toBe(2);
  });
});
