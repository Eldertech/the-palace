// palace-find.mjs — find an entry or a media file the way Obsidian would:
// by name, anywhere in the vault, shallowest match first, skipping tooling.
// Shared by the rich-face handler and fingerprint.mjs so both resolve the same
// file. `makeFinder(root)` binds to a palace root; ROOT is this checkout's.

import { readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SKIP = new Set(['.git', 'node_modules', '_tools', '__pycache__', '.obsidian', '.trash']);

export function makeFinder(root = ROOT) {
  function bfs(match, maxDepth) {
    let queue = [root];
    for (let depth = 0; depth < maxDepth && queue.length; depth++) {
      const next = [];
      for (const dir of queue) {
        let ents;
        try { ents = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
        for (const e of ents) if (e.isFile() && match(e.name)) return join(dir, e.name);
        for (const e of ents) if (e.isDirectory() && !SKIP.has(e.name) && !e.name.startsWith('.')) next.push(join(dir, e.name));
      }
      queue = next;
    }
    return null;
  }
  return {
    findEntry(name) {
      const want = name.toLowerCase() + '.md';
      return bfs((f) => f.toLowerCase() === want, 4);
    },
    findByName(name, preferDir) {
      if (preferDir) {
        try { if (readdirSync(preferDir).includes(name)) return join(preferDir, name); } catch { /* fall through */ }
      }
      return bfs((f) => f === name, 5);
    },
  };
}

export const { findEntry, findByName } = makeFinder(ROOT);
