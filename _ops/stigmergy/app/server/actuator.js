// The Actuator -- STIGMERGY's port of Enrichment server.py:_fire_worker.
//
// This is the keystone of the v1.0 consolidation (Revision 2 §3): the board
// becomes an actuator by inheriting the one mechanism that already works --
// "a board action fires a headless `claude -p` worker." The Enrichment server
// proved it in Python; this re-implements it in Node with the hard-won
// robustness scars carried over EXACTLY in spirit:
//
//   1. bypassPermissions is load-bearing. Headless `claude -p` has no TTY to
//      answer Write/Edit permission prompts, so without
//      `--permission-mode bypassPermissions` the worker hangs forever. The
//      default argv carries it.
//   2. Existence != liveness. Before trusting a pid, verify via
//      `ps -p <pid> -o command=` that it is actually our worker -- the OS
//      reuses pids, and a recycled pid reads as "alive" under a bare
//      kill(pid,0). This is `pidIsOurWorker`. Never skipped.
//   3. Exit cleanup. When the worker exits, remove the pid file -- otherwise
//      stale pid state blocks the next fire and the surface wedges silently.
//      The 'exit' handler does this while the server lives; the ps-liveness
//      check in isAlive() heals stale state across restarts.
//   4. Single global worker per lane. Refuse a second fire while one is alive.
//
// "Carry the lessons, not the language." The Flask app is retired (Phase 4.5);
// the liveness check and cleanup -- the parts that took real debugging -- live
// on here.
//
// Testability: the spawn command is injectable via `buildArgv`, so tests fire
// a harmless stub instead of a real `claude -p`. The default fires the real
// worker; nothing in the build/test path ever does.

import { spawn, execFileSync } from 'node:child_process';
import {
  existsSync, mkdirSync, openSync, writeSync, closeSync, writeFileSync,
  readFileSync, readSync, unlinkSync, statSync,
} from 'node:fs';
import { resolve, join } from 'node:path';
import { logTail as tailLines, lastFireStatus } from '../src/lib/worker-log.js';

// The default real-worker argv. The `bypassPermissions` flag doubles as the
// liveness signature (scar #2) -- that flag combination effectively never
// appears in unrelated processes, and survives however the `claude` binary is
// named (node / claude / a shell wrapper).
export function defaultBuildArgv(prompt) {
  return ['claude', '-p', prompt, '--permission-mode', 'bypassPermissions'];
}

const DEFAULT_SIGNATURE = 'bypassPermissions';

// Create an actuator bound to a lane directory. One lane = one global worker.
export function createActuator({
  palaceRoot,
  stateDir,
  buildArgv = defaultBuildArgv,
  signature = DEFAULT_SIGNATURE,
} = {}) {
  const root = resolve(palaceRoot ?? process.cwd());
  const dir = stateDir ? resolve(stateDir) : join(root, '_ops/stigmergy/.actuator');
  const pidFile = join(dir, '.worker.pid');
  const logFile = join(dir, '.worker.log');
  const startedFile = join(dir, '.worker.started');

  function ensureDir() {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  // scar #2: `ps -p <pid> -o command=` must contain the signature.
  function pidIsOurWorker(pid) {
    try {
      const out = execFileSync('ps', ['-p', String(pid), '-o', 'command='], {
        timeout: 2000, encoding: 'utf8',
      });
      return out.includes(signature);
    } catch (_) {
      return false; // ps failed / no such process / timeout -> conservatively not ours
    }
  }

  function cleanPid() {
    try { if (existsSync(pidFile)) unlinkSync(pidFile); } catch (_) { /* ignore */ }
  }

  // (running, pid). Cleans stale pid files. Existence != liveness.
  function isAlive() {
    if (!existsSync(pidFile)) return { running: false, pid: null };
    let pid;
    try {
      pid = parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
    } catch (_) {
      return { running: false, pid: null };
    }
    if (!Number.isInteger(pid)) return { running: false, pid: null };
    // Cheap existence probe.
    try {
      process.kill(pid, 0);
    } catch (_) {
      cleanPid();
      return { running: false, pid: null };
    }
    // Existence != liveness -- verify it is actually our worker.
    if (!pidIsOurWorker(pid)) {
      cleanPid();
      return { running: false, pid: null };
    }
    return { running: true, pid };
  }

  // Fire a worker. Idempotent: refuses while one is alive (scar #4).
  // Returns { fired, msg, pid? }.
  function fire(prompt) {
    const alive = isAlive();
    if (alive.running) return { fired: false, msg: `already running (pid ${alive.pid})`, pid: alive.pid };
    if (typeof prompt !== 'string' || prompt.trim() === '') {
      return { fired: false, msg: 'empty prompt' };
    }

    ensureDir();
    let logFd;
    try {
      logFd = openSync(logFile, 'a');
    } catch (e) {
      return { fired: false, msg: `could not open log: ${e.message}` };
    }
    const nowIso = new Date().toISOString();
    writeSync(logFd, `\n--- worker fire ${nowIso} ---\n`);

    const argv = buildArgv(prompt);
    const [cmd, ...args] = argv;

    let child;
    try {
      child = spawn(cmd, args, {
        cwd: root,
        detached: true,
        stdio: ['ignore', logFd, logFd],
        windowsHide: true,
      });
    } catch (e) {
      try { writeSync(logFd, `ERROR: spawn failed: ${e.message}\n`); } catch (_) { /* ignore */ }
      try { closeSync(logFd); } catch (_) { /* ignore */ }
      return { fired: false, msg: `spawn failed: ${e.message}` };
    }

    // spawn() can emit 'error' asynchronously (e.g. ENOENT for a missing
    // binary). Capture it into the log so the banner can classify it.
    child.on('error', (err) => {
      try { writeSync(logFd, `ERROR: ${err.message}\n`); } catch (_) { /* ignore */ }
    });

    const pid = child.pid;
    try {
      writeFileSync(pidFile, String(pid));
      writeFileSync(startedFile, nowIso);
    } catch (_) {
      // If we can't record the pid we can't manage the worker -- best effort.
    }

    // scar #3: cleanup on exit. While the server lives, the 'exit' handler
    // removes the pid file (only if it still names THIS pid -- avoids racing a
    // newer fire). The ps-liveness check heals it across server restarts.
    child.on('exit', () => {
      try {
        if (existsSync(pidFile) && readFileSync(pidFile, 'utf8').trim() === String(pid)) {
          unlinkSync(pidFile);
        }
      } catch (_) { /* ignore */ }
      try { writeSync(logFd, `\n--- worker exit pid ${pid} at ${new Date().toISOString()} ---\n`); } catch (_) { /* ignore */ }
      try { closeSync(logFd); } catch (_) { /* ignore */ }
    });

    // Detach so the worker outlives this request, but keep the listeners
    // active for cleanup (unref lets the parent exit independently).
    child.unref();
    return { fired: true, msg: `fired (pid ${pid})`, pid };
  }

  // Read the worker log (last 32KB) and classify the most recent fire.
  function readLog() {
    if (!existsSync(logFile)) return { content: '', tail: [], lastFire: { status: 'none' } };
    let content = '';
    try {
      const size = statSync(logFile).size;
      const fd = openSync(logFile, 'r');
      const start = Math.max(0, size - 32768);
      const len = size - start;
      const buf = Buffer.alloc(len);
      readSync(fd, buf, 0, len, start);
      closeSync(fd);
      content = buf.toString('utf8');
    } catch (_) {
      content = '';
    }
    return { content, tail: tailLines(content, 12), lastFire: lastFireStatus(content) };
  }

  function status() {
    const alive = isAlive();
    let started = null;
    try { if (existsSync(startedFile)) started = readFileSync(startedFile, 'utf8').trim() || null; } catch (_) { /* ignore */ }
    const log = readLog();
    return {
      running: alive.running,
      pid: alive.pid,
      started,
      logTail: log.tail,
      lastFire: log.lastFire,
    };
  }

  return { fire, status, isAlive, paths: { dir, pidFile, logFile, startedFile } };
}
