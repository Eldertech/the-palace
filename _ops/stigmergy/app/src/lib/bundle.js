// Entry bundle resolution (SCHEMA §8).
//
// An entry bundle is an optional sibling folder, named identically to the
// entry (no extension), that holds the entry's owned files: handoffs,
// context companions, sources, sketches, enrichments. `Foo.md` ↔ `Foo/`.
//
// This module is *server-side* (Node). It walks a real bundle folder up
// to 2 levels deep, skipping hidden files, Archive/, __pycache__/, and
// anything whose name starts with `.`.

import { existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve, sep, dirname, basename } from 'node:path';

const BUNDLE_HIDDEN = new Set(['Archive', '__pycache__', 'node_modules', 'test-results']);

// Given an entry's absolute path (e.g. /palace/Kuramoto Coupling.md),
// return the absolute path to its sibling bundle folder if it exists,
// else null.
export function bundleDirFor(absEntryPath) {
  if (typeof absEntryPath !== 'string' || !absEntryPath.endsWith('.md')) return null;
  const dir = dirname(absEntryPath);
  const stem = basename(absEntryPath, '.md');
  const bundleDir = join(dir, stem);
  if (existsSync(bundleDir) && statSync(bundleDir).isDirectory()) {
    return bundleDir;
  }
  return null;
}

// Classify a bundle file by extension so the UI can render media inline
// (image/audio/video/html) and treat the rest as openable files.
export function classifyFile(name) {
  const ext = extname(name).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) return 'image';
  if (['.wav', '.mp3', '.ogg', '.m4a', '.flac'].includes(ext)) return 'audio';
  if (['.mp4', '.webm', '.mov'].includes(ext)) return 'video';
  if (['.html', '.htm'].includes(ext)) return 'html';
  if (['.md', '.txt'].includes(ext)) return 'text';
  if (['.json', '.jsonl'].includes(ext)) return 'json';
  if (['.py', '.js', '.jsx', '.ts', '.tsx', '.css', '.sh'].includes(ext)) return 'code';
  if (ext === '.pdf') return 'pdf';
  return 'file';
}

function isHidden(name) {
  return name.startsWith('.') || BUNDLE_HIDDEN.has(name);
}

// List files inside a bundle folder. Returns an array of:
//   { name, relPath, ext, kind, size, depth }
// `relPath` is relative to the palace root (so it can be served by /api/file).
// Walks up to maxDepth levels deep (default 2). Always sorted by relPath.
export function listBundleFiles(palaceRoot, absBundleDir, { maxDepth = 2 } = {}) {
  const root = resolve(palaceRoot);
  const out = [];
  function walk(dir, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const ent of entries) {
      if (isHidden(ent.name)) continue;
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full, depth + 1);
        continue;
      }
      if (!ent.isFile()) continue;
      let stat;
      try { stat = statSync(full); } catch (_) { continue; }
      // Compute palace-relative path.
      let rel = full;
      if (full.startsWith(root + sep)) rel = full.slice(root.length + 1);
      out.push({
        name: ent.name,
        relPath: rel,
        ext: extname(ent.name).toLowerCase(),
        kind: classifyFile(ent.name),
        size: stat.size,
        depth,
      });
    }
  }
  walk(absBundleDir, 1);
  out.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return out;
}
