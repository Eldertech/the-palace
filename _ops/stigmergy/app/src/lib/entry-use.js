// How each entry is being used — page edit days, bundle edit days, and entries
// that formed a link to it — computed from git by _ops/swarm/entry-use.py
// (SCHEMA — Reference §3, v1.26). Use is never frontmatter: the readers take
// this index as an optional input and attach it to each summary.
//
// The index is cached per palace root and keyed by HEAD, so it recomputes
// only when a commit lands. The script takes a second or two over the whole
// history, so the server never waits on it twice: entryUse() waits for the
// first run and after that answers from the cache, refreshing in the
// background. A root with no git history (a test fixture) gets null, and the
// readers then leave use empty.

import { execFile, execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const SCRIPT = join('_ops', 'swarm', 'entry-use.py');
const HEAD_CHECK_MS = 5000;
const MAX_BUFFER = 64 * 1024 * 1024;

const cache = new Map(); // root -> { head, index, checkedAt, pending }

function headOf(root) {
  try {
    return execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (_) {
    return null;
  }
}

// { [palace-relative path]: { page, bundle, linked, use, last_used, recent } }
function indexOf(record) {
  const out = {};
  for (const u of Object.values(record?.entries ?? {})) {
    if (u && typeof u.path === 'string') out[u.path] = u;
  }
  return out;
}

function runScript(root) {
  return new Promise((done) => {
    const child = execFile('python3', [join(root, SCRIPT), '--root', root, '--json', '-'],
      { maxBuffer: MAX_BUFFER }, (err, stdout) => {
        if (err) { done(null); return; }
        try { done(indexOf(JSON.parse(stdout))); } catch (_) { done(null); }
      });
    child.unref?.();
  });
}

// Wait for the script and return the index. For one-shot callers (the public build).
export function loadEntryUse(palaceRoot) {
  const root = resolve(palaceRoot);
  if (!headOf(root)) return null;
  try {
    const stdout = execFileSync('python3', [join(root, SCRIPT), '--root', root, '--json', '-'], {
      encoding: 'utf8', maxBuffer: MAX_BUFFER, stdio: ['ignore', 'pipe', 'ignore'],
    });
    return indexOf(JSON.parse(stdout));
  } catch (_) {
    return null;
  }
}

// The server's path: waits only for the very first run on a root, then answers
// from the cache and refreshes in the background when HEAD has moved.
export async function entryUse(palaceRoot) {
  const root = resolve(palaceRoot);
  let slot = cache.get(root);
  const now = Date.now();
  if (slot && now - slot.checkedAt < HEAD_CHECK_MS) return slot.index;
  const head = headOf(root);
  if (!head) return null;
  if (!slot) {
    slot = { head, index: null, checkedAt: now, pending: runScript(root) };
    cache.set(root, slot);
    slot.index = await slot.pending;
    slot.pending = null;
    return slot.index;
  }
  slot.checkedAt = now;
  if (head !== slot.head && !slot.pending) {
    slot.head = head;
    slot.pending = runScript(root).then((index) => {
      if (index) slot.index = index;
      slot.pending = null;
    });
  }
  return slot.index;
}

// The two fields a summary carries. `use` keeps the three kinds apart so a
// reader can see WHY an entry is alive, not only that it is.
export function useFields(index, relPath) {
  const u = index?.[relPath];
  if (!u) return { last_used: null, use: null };
  return {
    last_used: u.last_used ?? null,
    use: { page: u.page, bundle: u.bundle, linked: u.linked, use: u.use, recent: u.recent },
  };
}
