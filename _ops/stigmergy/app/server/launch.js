// server/launch.js — open an INTERACTIVE Claude Code session in a real terminal,
// seeded with a prompt. The supported counterpart to the actuator's headless
// `claude -p`: a human-driven TUI in a native Terminal window. Claude Code needs
// a real TTY + the user's keychain auth — both present in a Terminal, neither in
// a headless or node-pty context (verified 2026-06-17) — which is why this drives
// a real Terminal rather than embedding one.
//
// macOS-only: osascript drives Terminal.app. Robust prompt-passing without
// shell/AppleScript escaping hell: the multi-line prompt (which itself carries
// [[wikilinks]], em-dashes, and double quotes) is written to a temp file, and a
// tiny launcher runs
//   cd "<palaceRoot>" && claude "$(cat "<promptfile>")"
// so the AppleScript only ever carries a fixed, path-only command. `$(cat …)`
// inside double quotes passes the file's bytes as ONE literal argument — no
// re-parsing of quotes/backticks/$ in the prompt. The launcher self-cleans.
//
// Testability mirrors the actuator: the spawn is injectable (opts.spawnImpl) and
// the platform/tmp dir are overridable, so tests assert the staged script + the
// osascript argv without opening a real Terminal.

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
 * @param {object} opts      { palaceRoot, platform?, spawnImpl?, tmpDir? }
 * @returns {{launched:boolean, supported:boolean, error?:string, scriptPath?:string}}
 */
export function launchInteractive(prompt, opts = {}) {
  const platform = opts.platform || process.platform;
  if (platform !== 'darwin') {
    return { launched: false, supported: false, error: 'open-in-terminal is macOS-only — use copy prompt.' };
  }
  if (typeof prompt !== 'string' || prompt.trim() === '') {
    return { launched: false, supported: true, error: 'missing or empty prompt' };
  }

  const palaceRoot = opts.palaceRoot || process.cwd();
  const spawnImpl = opts.spawnImpl || realSpawn;

  let dir, promptPath, scriptPath;
  try {
    dir = opts.tmpDir || mkdtempSync(join(tmpdir(), 'stigmergy-launch-'));
    promptPath = join(dir, 'prompt.txt');
    scriptPath = join(dir, 'launch.sh');
    // The launcher: into the repo, run claude seeded from the prompt file, then
    // clean the temp dir once the session ends (unlink-while-open is safe on
    // unix, so removing this script mid-run does not abort it).
    const script = [
      '#!/bin/bash',
      `cd ${shq(palaceRoot)} || exit 1`,
      `claude "$(cat ${shq(promptPath)})"`,
      `rm -rf ${shq(dir)}`,
      '',
    ].join('\n');
    writeFileSync(promptPath, prompt, 'utf8');
    writeFileSync(scriptPath, script, { mode: 0o700 });
  } catch (e) {
    return { launched: false, supported: true, error: `could not stage launcher: ${e.message}` };
  }

  // Drive Terminal.app. The do-script command is fixed-shape (`bash '<path>'`);
  // only the path varies, and mkdtemp paths carry no quote chars.
  const osaArgs = [
    '-e', `tell application "Terminal" to do script "bash ${shq(scriptPath)}"`,
    '-e', 'tell application "Terminal" to activate',
  ];
  try {
    const child = spawnImpl('osascript', osaArgs, { stdio: 'ignore', detached: true });
    if (child && typeof child.unref === 'function') child.unref();
  } catch (e) {
    return { launched: false, supported: true, error: `osascript failed: ${e.message}` };
  }
  return { launched: true, supported: true, scriptPath };
}
