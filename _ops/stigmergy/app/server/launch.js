// server/launch.js — open an INTERACTIVE Claude Code session in a real terminal,
// seeded with a prompt. The supported counterpart to the actuator's headless
// `claude -p`: a human-driven TUI in a native Terminal window. Claude Code needs
// a real TTY + the user's keychain auth — both present in a Terminal, neither in
// a headless or node-pty context (verified 2026-06-17) — which is why this drives
// a real Terminal rather than embedding one.
//
// macOS-only. We drive Terminal with `open -a Terminal <launcher>` (LaunchServices),
// NOT `osascript … tell application "Terminal"` (Apple Events). This is deliberate
// and load-bearing: Apple Events require macOS Automation (TCC) permission, granted
// per *responsible app*. The dev server is frequently orphaned to launchd (parent
// PID 1 — started detached, or its launching terminal closed), so it has no
// foreground responsible app: macOS can neither honor an Automation grant nor
// *prompt* for one, and the Apple Event is silently denied. The old osascript path
// then no-opped while reporting success (it never checked the exit code), so the
// window never opened and the UI showed a false "launched". `open` goes through
// LaunchServices, needs no Automation permission, and works from any process in the
// user's GUI session — orphaned or not. (Root-caused 2026-06-22.)
//
// Robust prompt-passing without shell/AppleScript escaping hell: the multi-line
// prompt (which itself carries [[wikilinks]], em-dashes, and double quotes) is
// written to a temp file, and a tiny `.command` launcher runs
//   cd "<palaceRoot>" && claude "$(cat "<promptfile>")"
// `$(cat …)` inside double quotes passes the file's bytes as ONE literal argument —
// no re-parsing of quotes/backticks/$ in the prompt. The launcher self-cleans.
// (`.command` is the file type LaunchServices runs in Terminal when opened.)
//
// Testability mirrors the actuator: the spawn is injectable (opts.spawnImpl) and
// the platform/tmp dir are overridable, so tests assert the staged script + the
// `open` argv without opening a real Terminal. Because we now wait for `open` to
// exit and surface its real result, launchInteractive returns a Promise.

import { spawn as realSpawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Single-quote a string for bash: wrap in '…', rewriting embedded ' as '\''.
function shq(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

/**
 * Stage + launch an interactive `claude` session in Terminal.app.
 *
 * @param {string} prompt    the seed prompt (multi-line ok)
 * @param {object} opts      { palaceRoot, platform?, spawnImpl?, tmpDir?, model?, effort? }
 * @returns {Promise<{launched:boolean, supported:boolean, error?:string, scriptPath?:string}>}
 */
export function launchInteractive(prompt, opts = {}) {
  const platform = opts.platform || process.platform;
  if (platform !== 'darwin') {
    return Promise.resolve({ launched: false, supported: false, error: 'open-in-terminal is macOS-only — use copy prompt.' });
  }
  if (typeof prompt !== 'string' || prompt.trim() === '') {
    return Promise.resolve({ launched: false, supported: true, error: 'missing or empty prompt' });
  }

  const palaceRoot = opts.palaceRoot || process.cwd();
  const spawnImpl = opts.spawnImpl || realSpawn;
  // Pin the model + effort. A launched session drives a steward / catches a
  // baton / works a card — real read-edit-commit palace work — so it opens on
  // the LATEST Opus at a real reasoning budget, independent of the operator's
  // global /model. We pin the exact id `claude-opus-4-8` rather than the `opus`
  // alias: on Claude Code v2.1.x that alias resolves to 4.7-low-effort, not 4.8.
  // `--effort high` overrides the alias's "low" default. Both overridable via
  // opts for a future picker; bump the id when a newer Opus ships.
  const model = opts.model || 'claude-opus-4-8';
  const effort = opts.effort || 'high';

  let dir, promptPath, scriptPath;
  try {
    dir = opts.tmpDir || mkdtempSync(join(tmpdir(), 'stigmergy-launch-'));
    promptPath = join(dir, 'prompt.txt');
    // `.command` so LaunchServices runs it in Terminal when `open`ed.
    scriptPath = join(dir, 'launch.command');
    // The launcher: into the repo, run claude (pinned model + effort) seeded from
    // the prompt file, then clean the temp dir once the session ends
    // (unlink-while-open is safe on unix, so removing this script mid-run does
    // not abort it).
    const script = [
      '#!/bin/bash',
      `cd ${shq(palaceRoot)} || exit 1`,
      `claude --model ${shq(model)} --effort ${shq(effort)} "$(cat ${shq(promptPath)})"`,
      `rm -rf ${shq(dir)}`,
      '',
    ].join('\n');
    writeFileSync(promptPath, prompt, 'utf8');
    writeFileSync(scriptPath, script, { mode: 0o700 });
  } catch (e) {
    return Promise.resolve({ launched: false, supported: true, error: `could not stage launcher: ${e.message}` });
  }

  // Drive Terminal via `open` (LaunchServices) — no Automation/TCC permission
  // needed, so it works even when the server is orphaned to launchd. `open`
  // returns once the launch is *requested* (not when the claude session ends), so
  // awaiting its exit is fast — and lets us surface a REAL result instead of the
  // old fire-and-forget assumed success. A non-zero exit (missing file/app) or a
  // spawn error becomes a visible error the UI can show instead of a silent no-op.
  return new Promise((resolve) => {
    let child;
    try {
      child = spawnImpl('open', ['-a', 'Terminal', scriptPath], { stdio: ['ignore', 'ignore', 'pipe'] });
    } catch (e) {
      resolve({ launched: false, supported: true, error: `open failed: ${e.message}` });
      return;
    }
    if (!child || typeof child.on !== 'function') {
      // Defensive: a spawnImpl that returns no event emitter — assume requested.
      resolve({ launched: true, supported: true, scriptPath });
      return;
    }
    let stderr = '';
    if (child.stderr && typeof child.stderr.on === 'function') {
      child.stderr.on('data', (d) => { stderr += String(d); });
    }
    let settled = false;
    const done = (r) => { if (!settled) { settled = true; resolve(r); } };
    child.on('error', (e) => done({ launched: false, supported: true, error: `open failed: ${e.message}` }));
    child.on('close', (code) => {
      if (code === 0) done({ launched: true, supported: true, scriptPath });
      else done({ launched: false, supported: true, error: `open exited ${code}${stderr ? `: ${stderr.trim()}` : ''}` });
    });
  });
}
