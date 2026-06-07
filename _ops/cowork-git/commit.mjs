// commit.mjs — the cowork-git lock-safe committer.
//
// WHY THIS EXISTS. The Cowork sandbox mounts the palace with a filesystem that
// can create and rename files but CANNOT unlink (delete) them. A normal `git
// commit` writes its data fine (objects/refs land via rename) but then fails to
// remove its own `*.lock` files at the end — and the stranded `index.lock`
// wedges the NEXT git op. Your committer (`server/commit.js commitSelected`)
// already does the right palace things (stage only named paths, derive the
// Palace-* trailers, write a spec message) and even tries to clear locks — but
// via rmSync, which is exactly the call that no-ops in Cowork.
//
// So this is a THIN wrapper, not a reimplementation: sweep stale locks by
// RENAME (which works) → call commitSelected unchanged → sweep the newly
// stranded locks by rename → leave a weave_flag so the next Weave clears the
// litter. The git spec lives in one place (commitSelected); we only add the
// lock handling the sandbox forces on us.
//
// Layer A (phased core). Direct commit for small, non-canon changes. When the
// situation is NOT ideal (canon/knowledge entries, a fresh lock that may be a
// live op, an in-progress merge/rebase) it REFUSES and tells you to hand off
// rather than risk the repo. The BBS commit-handoff consumer is layer B.
//
// Usage:
//   node _ops/cowork-git/commit.mjs --paths "a.js,b.md" --kind ops \
//        --scope cowork-git --summary "what changed" [--body "why"] \
//        --verify unverified [--author claude] [--lock-threshold 30] \
//        [--no-flag] [--dry-run] [--root <palace>]

import { existsSync, statSync, renameSync, mkdirSync, readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── arg parsing ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = { paths: [], kind: null, scope: null, summary: null, body: '', verify: null,
    author: 'claude', lockThreshold: 30, flag: true, dryRun: false, root: null };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    const v = () => argv[++i];
    if (k === '--paths') a.paths.push(...v().split(',').map((s) => s.trim()).filter(Boolean));
    else if (k === '--path') a.paths.push(v().trim());
    else if (k === '--kind') a.kind = v();
    else if (k === '--scope') a.scope = v();
    else if (k === '--summary') a.summary = v();
    else if (k === '--body') a.body = v();
    else if (k === '--verify') a.verify = v();
    else if (k === '--author') a.author = v();
    else if (k === '--lock-threshold') a.lockThreshold = Number(v());
    else if (k === '--no-flag') a.flag = false;
    else if (k === '--dry-run') a.dryRun = true;
    else if (k === '--root') a.root = v();
  }
  return a;
}

// ── lock handling (the whole point) ─────────────────────────────────────────
function findLockFiles(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let ents;
    try { ents = readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      const p = join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.name.endsWith('.lock')) out.push(p);
    }
  }
  return out;
}

// An operation is "in progress" if git left a transaction marker.
function transactionInProgress(gitDir) {
  const markers = ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'BISECT_LOG', 'rebase-merge', 'rebase-apply'];
  return markers.filter((m) => existsSync(join(gitDir, m)));
}

// Move locks to the junk dir by RENAME (the sandbox allows rename, not unlink).
//   - thresholdSec: locks younger than this are treated as possibly-live and
//     left in place (reported in `fresh`) — the pre-commit guard uses this to
//     refuse when an external op might be running.
//   - force: ignore age entirely and move every lock. Used for the POST-commit
//     sweep, where any lock present was just stranded by OUR own commit (which
//     already returned), so it is definitionally safe to relocate. Force also
//     avoids a clock-skew trap: a freshly stranded lock can carry an mtime a
//     hair ahead of the node clock, yielding a slightly-negative age that an
//     age check would misread as "fresh".
function sweepLocks(gitDir, junkDir, palaceRoot, { thresholdSec = 30, force = false } = {}) {
  const locks = findLockFiles(gitDir);
  const now = Date.now();
  const moved = [];
  const fresh = [];
  const failed = [];
  if (locks.length) mkdirSync(junkDir, { recursive: true });
  for (const lk of locks) {
    let ageSec = Infinity;
    try { ageSec = (now - statSync(lk).mtimeMs) / 1000; } catch { /* gone */ }
    if (!force && ageSec < thresholdSec) { fresh.push({ path: relative(palaceRoot, lk), ageSec: Math.round(ageSec) }); continue; }
    const flat = relative(gitDir, lk).replace(/[\\/]/g, '_');
    const dest = join(junkDir, `${Date.now()}-${flat}`);
    try { renameSync(lk, dest); moved.push(relative(palaceRoot, lk)); } catch (e) { failed.push({ path: relative(palaceRoot, lk), error: e.message }); }
  }
  return { moved, fresh, failed };
}

// ── weave cleanup flag (idempotent) ─────────────────────────────────────────
function readBoard(board) {
  try { return readFileSync(board, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); }
  catch { return []; }
}
function openCleanupFlag(boardMsgs) {
  const flags = boardMsgs.filter((m) => m.type === 'BROADCAST' && m.board === 'WEAVE'
    && m.payload && m.payload.kind === 'weave_flag' && m.payload.flag_type === 'cowork_litter_sweep');
  if (flags.length === 0) return null;
  const resolved = new Set(boardMsgs.filter((m) => (m.type === 'RESOURCE_GRANT' || m.type === 'RESOURCE_DENY') && m.re).map((m) => m.re));
  return flags.find((f) => !resolved.has(f.id)) || null;
}
async function emitCleanupFlag(palaceRoot, board, shortHash) {
  const existing = openCleanupFlag(readBoard(board));
  if (existing) return { posted: false, existing: existing.id };
  const msg = {
    schema_version: '1.0',
    id: randomUUID(),
    ts: new Date().toISOString(),
    session_id: 'cowork-git',
    from: 'cowork-git',
    to: 'weave-ceremony',
    type: 'BROADCAST',
    board: 'WEAVE',
    health: { score: 'green', model: 'cowork-git', _orchestrator_metadata: { dispatch_mode: 'cowork-git', note: 'lock-safe commit litter' } },
    payload: {
      kind: 'weave_flag',
      flag_type: 'cowork_litter_sweep',
      source_entries: ['SUBSTRATE'],
      target_entry: '_ops/scratch/gitlock-junk',
      proposed_action: 'Cowork lock-safe commits relocate stranded git *.lock files to _ops/scratch/gitlock-junk/ (rename, since the sandbox cannot unlink) and leave tmp_obj_* litter in .git/objects. Mac-side: delete _ops/scratch/gitlock-junk/* and any stray .git/objects/**/tmp_obj_*, then this flag may close.',
      rationale: 'The Cowork mount blocks unlink; only a Mac-side process can delete the litter lock-safe committing leaves behind. One open flag covers all such commits until swept.',
      source_deposit_id: shortHash || 'cowork-git',
    },
  };
  let validation = { valid: true };
  try {
    const { validateMessage } = await import(pathToFileURL(join(palaceRoot, '_ops/stigmergy/core/schema/validator.js')).href);
    validation = validateMessage(msg);
  } catch (e) { validation = { valid: false, errors: [{ path: '', message: `validator import failed: ${e.message}` }] }; }
  if (!validation.valid) return { posted: false, error: 'flag failed §2.2 validation', detail: validation.errors };
  appendFileSync(board, JSON.stringify(msg) + '\n');
  return { posted: true, id: msg.id };
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const palaceRoot = resolve(args.root || resolve(__dirname, '../..'));
  const gitDir = join(palaceRoot, '.git');
  const junkDir = join(palaceRoot, '_ops', 'scratch', 'gitlock-junk'); // _ops/scratch is already gitignored
  const board = join(palaceRoot, '_ops', 'swarm', 'persistent', 'blackboard.jsonl');
  const out = (o) => process.stdout.write(JSON.stringify(o, null, 2) + '\n');
  const fail = (error, extra = {}) => { out({ ok: false, error, ...extra }); process.exit(1); };

  if (args.paths.length === 0) return fail('no --paths given');
  if (!args.summary) return fail('no --summary given');
  if (!args.kind) return fail('no --kind given (deposit|edit|enrich|handoff|steward|weave|schema|ops|merge|mixed)');
  if (!args.verify) return fail('no --verify given (verified|unverified|couldnt) — be honest');
  if (!existsSync(gitDir)) return fail(`no .git at palace root ${palaceRoot}`);

  // Guard 1: an in-progress git transaction is a hard stop.
  const txn = transactionInProgress(gitDir);
  if (txn.length) return fail(`git transaction in progress (${txn.join(', ')}) — resolve it before committing, or hand off`, { handoff: true });

  // Guard 2: a fresh lock may be a live op we cannot see (other sandbox / heartbeat).
  // Stale locks (older than threshold) are relocated and we proceed; a fresh one
  // refuses, because we can't distinguish it from a live external commit.
  const pre = sweepLocks(gitDir, junkDir, palaceRoot, { thresholdSec: args.lockThreshold });
  if (pre.fresh.length) {
    return fail(`fresh git lock(s) younger than ${args.lockThreshold}s — a git op may be running; retry shortly or hand off`,
      { handoff: true, freshLocks: pre.fresh, movedStaleLocks: pre.moved });
  }

  if (args.dryRun) return out({ ok: true, dryRun: true, palaceRoot, wouldCommit: args, movedStaleLocks: pre.moved });

  // The actual commit — your committer, unchanged (single source of truth for the spec).
  const { commitSelected } = await import(pathToFileURL(join(palaceRoot, '_ops/stigmergy/app/server/commit.js')).href);
  const result = await commitSelected(palaceRoot, {
    paths: args.paths, kind: args.kind, scope: args.scope || null,
    summary: args.summary, body: args.body || '', verify: args.verify, author: args.author,
  });

  // ALWAYS post-sweep, FORCE — a commit (success OR partial) re-creates locks it
  // cannot unlink; those are ours and must be cleared so the next commit is not wedged.
  const post = sweepLocks(gitDir, junkDir, palaceRoot, { force: true });
  const movedLocks = [...pre.moved, ...post.moved];
  const lockFailures = [...pre.failed, ...post.failed];

  if (!result.ok) return fail(result.error || 'commitSelected failed', { handoff: true, movedLocks, lockFailures, commitMessagePreview: result.message });

  let flag = { posted: false, skipped: 'no-flag' };
  if (args.flag) { try { flag = await emitCleanupFlag(palaceRoot, board, result.shortHash); } catch (e) { flag = { posted: false, error: e.message }; } }

  out({ ok: true, shortHash: result.shortHash, subject: result.subject, committed: result.committed, movedLocks, ...(lockFailures.length ? { lockFailures } : {}), weaveFlag: flag });
}

main().catch((e) => { process.stdout.write(JSON.stringify({ ok: false, error: e.message, stack: e.stack }, null, 2) + '\n'); process.exit(1); });
