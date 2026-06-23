// Unit tests for server/launch.js — staging an interactive `claude` terminal.
// The spawn + tmp dir + platform are injected so NO real Terminal opens; we read
// back the staged prompt file + launcher and assert the `open` argv. We drive
// Terminal with `open -a Terminal` (LaunchServices), not osascript (Apple Events),
// so a launchd-orphaned server with no Automation permission can still launch.

import { describe, it, expect } from 'vitest';
import { EventEmitter } from 'node:events';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { launchInteractive } from '../../server/launch.js';

// A fake child process that resolves the launch by emitting `close` with a code.
// stderr is a stub stream so the impl's `.on('data')` wiring is exercised.
function fakeChild(exitCode = 0, stderr = '') {
  const child = new EventEmitter();
  child.stderr = new EventEmitter();
  // emit on next tick so the impl can attach its listeners first
  queueMicrotask(() => {
    if (stderr) child.stderr.emit('data', Buffer.from(stderr));
    child.emit('close', exitCode);
  });
  return child;
}

describe('launchInteractive (server)', () => {
  it('refuses on a non-macOS platform with supported:false', async () => {
    const r = await launchInteractive('hi', { platform: 'linux' });
    expect(r.launched).toBe(false);
    expect(r.supported).toBe(false);
    expect(r.error).toMatch(/macOS/i);
  });

  it('refuses an empty prompt (supported:true)', async () => {
    const r = await launchInteractive('   ', { platform: 'darwin' });
    expect(r.launched).toBe(false);
    expect(r.supported).toBe(true);
  });

  it('stages the prompt file + launcher and drives Terminal via `open`', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'launch-test-'));
    const calls = [];
    const spawnImpl = (cmd, args, opts) => { calls.push({ cmd, args, opts }); return fakeChild(0); };
    // A prompt with the chars that break naive shell-passing: wikilinks, em-dash,
    // double quotes, a $VAR, and a backtick.
    const prompt = 'Drive [[Kuramoto Coupling]] — "approve stage 2"\nline 2 with $VAR and `tick`';
    const r = await launchInteractive(prompt, {
      platform: 'darwin', palaceRoot: '/Users/x/The Palace', spawnImpl, tmpDir: dir,
    });

    expect(r.launched).toBe(true);
    expect(r.supported).toBe(true);
    expect(r.scriptPath).toBe(join(dir, 'launch.command'));

    // The prompt is staged verbatim (so $(cat …) hands claude the exact bytes).
    expect(readFileSync(join(dir, 'prompt.txt'), 'utf8')).toBe(prompt);

    // The launcher cds into the (space-bearing, single-quoted) repo, runs claude
    // on the pinned model + effort seeded from the file, and self-cleans. It's a
    // `.command` so LaunchServices runs it in Terminal when `open`ed.
    const script = readFileSync(join(dir, 'launch.command'), 'utf8');
    expect(script).toContain(`cd '/Users/x/The Palace'`);
    expect(script).toContain(`claude --model 'claude-opus-4-8' --effort 'high' "$(cat '${join(dir, 'prompt.txt')}')"`);
    expect(script).toContain(`rm -rf '${dir}'`);

    // `open -a Terminal <launcher>` — LaunchServices, no Apple Events.
    expect(calls.length).toBe(1);
    expect(calls[0].cmd).toBe('open');
    expect(calls[0].args).toEqual(['-a', 'Terminal', join(dir, 'launch.command')]);
  });

  it('surfaces a non-zero `open` exit as a real failure (no false success)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'launch-test-'));
    const spawnImpl = () => fakeChild(1, 'Unable to find application named Terminal');
    const r = await launchInteractive('hello', { platform: 'darwin', palaceRoot: '/x', spawnImpl, tmpDir: dir });
    expect(r.launched).toBe(false);
    expect(r.supported).toBe(true);
    expect(r.error).toMatch(/open exited 1/);
    expect(r.error).toMatch(/Unable to find application/);
  });

  it('reports a spawn failure as supported:true (not a platform problem)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'launch-test-'));
    const spawnImpl = () => { throw new Error('open not found'); };
    const r = await launchInteractive('hello', { platform: 'darwin', palaceRoot: '/x', spawnImpl, tmpDir: dir });
    expect(r.launched).toBe(false);
    expect(r.supported).toBe(true);
    expect(r.error).toMatch(/open/);
  });
});
