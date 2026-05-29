// Tests for src/lib/artifact.js — pure render-side helpers for inline
// rich-content rendering (the browser counterpart to GET /api/file).

import { describe, it, expect } from 'vitest';
import {
  extOf,
  detectArtifactType,
  fileUrl,
  artifactsFromPayload,
  basenameOf,
} from '../../src/lib/artifact.js';

describe('extOf', () => {
  it('returns the lowercased extension without the dot', () => {
    expect(extOf('Foo/Bar.PNG')).toBe('png');
    expect(extOf('a/b/c.Wav')).toBe('wav');
    expect(extOf('deck.HTML')).toBe('html');
  });
  it('takes the basename extension, not a directory dot', () => {
    expect(extOf('Kuramoto Coupling/v1.2/explorer')).toBe('');
    expect(extOf('a.b.c/file.svg')).toBe('svg');
  });
  it('returns "" for no extension and for dotfiles', () => {
    expect(extOf('README')).toBe('');
    expect(extOf('dir/.gitignore')).toBe('');
    expect(extOf('')).toBe('');
  });
  it('is non-string-safe', () => {
    expect(extOf(null)).toBe('');
    expect(extOf(undefined)).toBe('');
    expect(extOf(42)).toBe('');
  });
});

describe('detectArtifactType', () => {
  it('maps audio extensions', () => {
    for (const p of ['x.wav', 'x.mp3', 'x.ogg', 'x.m4a', 'x.flac']) {
      expect(detectArtifactType(p)).toBe('audio');
    }
  });
  it('maps image extensions', () => {
    for (const p of ['x.png', 'x.jpg', 'x.jpeg', 'x.gif', 'x.svg', 'x.webp']) {
      expect(detectArtifactType(p)).toBe('image');
    }
  });
  it('maps html extensions to iframe', () => {
    expect(detectArtifactType('sim.html')).toBe('iframe');
    expect(detectArtifactType('sim.htm')).toBe('iframe');
  });
  it('falls back to file for unknown or missing extensions', () => {
    expect(detectArtifactType('notes.md')).toBe('file');
    expect(detectArtifactType('data.json')).toBe('file');
    expect(detectArtifactType('README')).toBe('file');
    expect(detectArtifactType('archive.zip')).toBe('file');
  });
});

describe('fileUrl', () => {
  it('builds the GET /api/file URL with an encoded path', () => {
    expect(fileUrl('Kuramoto Coupling/fireflies-pond.png'))
      .toBe('/api/file?path=' + encodeURIComponent('Kuramoto Coupling/fireflies-pond.png'));
  });
  it('encodes spaces and special characters', () => {
    expect(fileUrl('a b/c&d.wav')).toBe('/api/file?path=' + encodeURIComponent('a b/c&d.wav'));
  });
});

describe('artifactsFromPayload', () => {
  it('reads a single artifact_path string', () => {
    expect(artifactsFromPayload({ artifact_path: 'Foo/bar.png' }))
      .toEqual([{ path: 'Foo/bar.png', caption: null }]);
  });
  it('reads an artifacts array with optional captions', () => {
    expect(artifactsFromPayload({
      artifacts: [
        { path: 'a.png', caption: 'the still' },
        { path: 'b.wav' },
      ],
    })).toEqual([
      { path: 'a.png', caption: 'the still' },
      { path: 'b.wav', caption: null },
    ]);
  });
  it('prefers artifacts over artifact_path when both present', () => {
    const out = artifactsFromPayload({
      artifact_path: 'single.png',
      artifacts: [{ path: 'multi.png' }],
    });
    expect(out).toEqual([{ path: 'multi.png', caption: null }]);
  });
  it('drops malformed array entries (no non-empty string path)', () => {
    expect(artifactsFromPayload({
      artifacts: [{ path: '' }, { caption: 'orphan' }, null, { path: 'good.png' }],
    })).toEqual([{ path: 'good.png', caption: null }]);
  });
  it('returns [] when neither convention is present', () => {
    expect(artifactsFromPayload({ content: 'just text' })).toEqual([]);
    expect(artifactsFromPayload({})).toEqual([]);
  });
  it('returns [] for non-object / empty / whitespace inputs', () => {
    expect(artifactsFromPayload(null)).toEqual([]);
    expect(artifactsFromPayload(undefined)).toEqual([]);
    expect(artifactsFromPayload('x')).toEqual([]);
    expect(artifactsFromPayload({ artifact_path: '   ' })).toEqual([]);
  });
});

describe('basenameOf', () => {
  it('returns the final path segment', () => {
    expect(basenameOf('Kuramoto Coupling/fireflies-pond.png')).toBe('fireflies-pond.png');
    expect(basenameOf('flat.wav')).toBe('flat.wav');
  });
  it('is non-string-safe', () => {
    expect(basenameOf(null)).toBe('');
  });
});
