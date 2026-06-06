// artifact-backstop.test.js — Layers 2 & 3 of the Trickster Inline Assets work.
//
// Pure cores (selection, declared-path collection, lint) are tested directly;
// the FS walk is tested against a tmpdir bundle.

import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  normalizePath,
  isMediaPath,
  declaredPathsOf,
  selectBackstopMedia,
  scanBundleMedia,
  applyArtifactBackstop,
  lintArtifactReferences,
} from '../../src/artifact-backstop.js';

describe('normalizePath / isMediaPath', () => {
  test('normalizePath forward-slashes and strips leading ./', () => {
    expect(normalizePath('./Projects/Foo\\bar.wav')).toBe('Projects/Foo/bar.wav');
    expect(normalizePath('a//b///c.png')).toBe('a/b/c.png');
  });

  test('isMediaPath allowlists media, rejects scripts/intermediates', () => {
    for (const p of ['a/b.wav', 'x.PNG', 'y.html', 'z.pdf', 'q.mp4']) expect(isMediaPath(p)).toBe(true);
    for (const p of ['build.py', 'model.faust', 'patch.dsp', 'table.wt', 'notes.md', 'data.json', 'run.sh']) expect(isMediaPath(p)).toBe(false);
  });
});

describe('declaredPathsOf', () => {
  test('collects artifacts[].path, artifact_path, and per-option choice artifact_path', () => {
    const declared = declaredPathsOf({
      artifacts: [{ path: 'A/one.wav' }, { path: 'A/two.png' }],
      artifact_path: 'A/three.html',
      options: [{ id: 'X', artifact_path: 'A/four.wav' }, { id: 'Y', label: 'no file' }],
    });
    expect([...declared].sort()).toEqual(['A/four.wav', 'A/one.wav', 'A/three.html', 'A/two.png']);
  });

  test('empty / malformed payloads yield an empty set', () => {
    expect(declaredPathsOf(null).size).toBe(0);
    expect(declaredPathsOf({}).size).toBe(0);
    expect(declaredPathsOf({ artifacts: 'nope' }).size).toBe(0);
  });
});

describe('selectBackstopMedia (pure)', () => {
  const base = [
    { path: 'P/new.wav', mtimeMs: 200 },
    { path: 'P/old.wav', mtimeMs: 50 },
    { path: 'P/script.py', mtimeMs: 300 },
  ];

  test('no window lower bound → no injection', () => {
    const r = selectBackstopMedia({ candidates: base, windowStartMs: null });
    expect(r.inject).toEqual([]);
    expect(r.reason).toBe('no_window');
  });

  test('injects only media modified after the window start, newest first', () => {
    const r = selectBackstopMedia({ candidates: base, windowStartMs: 100 });
    expect(r.inject.map((a) => a.path)).toEqual(['P/new.wav']); // old.wav too early; script.py not media
    expect(r.inject[0].caption).toBeNull();
  });

  test('respects an upper bound', () => {
    const r = selectBackstopMedia({ candidates: base, windowStartMs: 10, windowEndMs: 100 });
    expect(r.inject.map((a) => a.path)).toEqual(['P/old.wav']); // new.wav (200) is past the upper bound
  });

  test('dedups against already-declared paths', () => {
    const r = selectBackstopMedia({ candidates: base, windowStartMs: 10, declared: new Set(['P/new.wav']) });
    expect(r.inject.map((a) => a.path)).toEqual(['P/old.wav']);
  });

  test('caps the injection and reports the dropped count', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ path: `P/m${i}.wav`, mtimeMs: 100 + i }));
    const r = selectBackstopMedia({ candidates: many, windowStartMs: 0, cap: 2 });
    expect(r.inject).toHaveLength(2);
    expect(r.dropped).toBe(3);
    // newest first
    expect(r.inject.map((a) => a.path)).toEqual(['P/m4.wav', 'P/m3.wav']);
  });
});

describe('scanBundleMedia (filesystem)', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  test('walks a bundle, returns palace-relative media paths + mtimes, skips scripts and SKIP_DIRS', () => {
    root = mkdtempSync(path.join(tmpdir(), 'palace-scan-'));
    const bundle = path.join(root, 'Projects/My Synth');
    mkdirSync(path.join(bundle, 'sub'), { recursive: true });
    mkdirSync(path.join(bundle, 'node_modules'), { recursive: true });
    writeFileSync(path.join(bundle, 'a.wav'), 'x');
    writeFileSync(path.join(bundle, 'sub', 'b.png'), 'x');
    writeFileSync(path.join(bundle, 'build.py'), 'x');           // not media
    writeFileSync(path.join(bundle, 'node_modules', 'c.wav'), 'x'); // skipped dir
    const got = scanBundleMedia(root, 'Projects/My Synth');
    expect(got.map((m) => m.path).sort()).toEqual(['Projects/My Synth/a.wav', 'Projects/My Synth/sub/b.png']);
    expect(typeof got[0].mtimeMs).toBe('number');
  });

  test('a missing bundle dir returns []', () => {
    root = mkdtempSync(path.join(tmpdir(), 'palace-scan-'));
    expect(scanBundleMedia(root, 'Projects/Nope')).toEqual([]);
  });
});

describe('applyArtifactBackstop', () => {
  const candidates = [{ path: 'P/rendered.wav', mtimeMs: 200 }];

  test('injects undeclared media into a RESOURCE_REQUEST payload', () => {
    const msg = { type: 'RESOURCE_REQUEST', payload: { resource: 'human_ear_check', rationale: 'r' } };
    const r = applyArtifactBackstop(msg, { candidates, windowStartMs: 100 });
    expect(r.reason).toBe('injected');
    expect(r.added).toEqual(['P/rendered.wav']);
    expect(r.payload.artifacts).toEqual([{ path: 'P/rendered.wav', caption: null }]);
  });

  test('preserves the steward\'s declared artifacts and appends after them', () => {
    const msg = { type: 'RESOURCE_REQUEST', payload: { artifacts: [{ path: 'P/declared.png', caption: 'mine' }] } };
    const r = applyArtifactBackstop(msg, { candidates, windowStartMs: 100 });
    expect(r.payload.artifacts).toEqual([
      { path: 'P/declared.png', caption: 'mine' },
      { path: 'P/rendered.wav', caption: null },
    ]);
  });

  test('promotes a lone artifact_path into the array before appending', () => {
    const msg = { type: 'RESOURCE_REQUEST', payload: { artifact_path: 'P/single.html' } };
    const r = applyArtifactBackstop(msg, { candidates, windowStartMs: 100 });
    expect(r.payload.artifacts).toEqual([
      { path: 'P/single.html', caption: null },
      { path: 'P/rendered.wav', caption: null },
    ]);
  });

  test('does not double-inject a file the steward already declared', () => {
    const msg = { type: 'RESOURCE_REQUEST', payload: { artifacts: [{ path: 'P/rendered.wav', caption: 'mine' }] } };
    const r = applyArtifactBackstop(msg, { candidates, windowStartMs: 100 });
    expect(r.added).toEqual([]);
    expect(r.payload.artifacts).toHaveLength(1);
  });

  test('non-RESOURCE_REQUEST messages pass through untouched', () => {
    const msg = { type: 'BROADCAST', payload: { content: 'hi' } };
    const r = applyArtifactBackstop(msg, { candidates, windowStartMs: 100 });
    expect(r.reason).toBe('not_applicable');
    expect(r.added).toEqual([]);
  });
});

describe('lintArtifactReferences (Layer 3, warn-only)', () => {
  test('null when not a RESOURCE_REQUEST or no artifacts', () => {
    expect(lintArtifactReferences({ type: 'BROADCAST', payload: { artifacts: [{ path: 'a.wav' }] } })).toBeNull();
    expect(lintArtifactReferences({ type: 'RESOURCE_REQUEST', payload: { rationale: 'x' } })).toBeNull();
  });

  test('warns when artifacts are declared but prose never refers to them', () => {
    const l = lintArtifactReferences({
      type: 'RESOURCE_REQUEST', request_id: 'r-1',
      payload: { headline: 'pick one', rationale: 'a general question with no anchor', artifacts: [{ path: 'P/zzzz.wav', caption: 'the alpha drone' }] },
    });
    expect(l.warn).toBe(true);
    expect(l.referenced).toBe(0);
  });

  test('does not warn when a caption word appears in the prose', () => {
    const l = lintArtifactReferences({
      type: 'RESOURCE_REQUEST', request_id: 'r-2',
      payload: { headline: 'does the dispersed click read?', artifacts: [{ path: 'P/02_x.wav', caption: 'the dispersed click smeared into a ring' }] },
    });
    expect(l.warn).toBe(false);
    expect(l.referenced).toBe(1);
  });

  test('does not warn when a numeric token from the basename appears in the prose', () => {
    const l = lintArtifactReferences({
      type: 'RESOURCE_REQUEST', request_id: 'r-3',
      payload: { ground: 'three files: 01, 02, 03', artifacts: [{ path: 'P/01_dry.wav' }, { path: 'P/02_wet.wav' }, { path: 'P/03_sweep.wav' }] },
    });
    expect(l.warn).toBe(false);
    expect(l.referenced).toBe(3);
  });

  test('warns when artifacts exist but there is no prose at all', () => {
    const l = lintArtifactReferences({ type: 'RESOURCE_REQUEST', request_id: 'r-4', payload: { artifacts: [{ path: 'P/x.wav' }] } });
    expect(l.warn).toBe(true);
    expect(l.note).toMatch(/no headline/);
  });
});
