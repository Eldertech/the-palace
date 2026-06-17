// Unit tests for server/launch.js — staging an interactive `claude` terminal.
// The spawn + tmp dir + platform are injected so NO real Terminal opens; we read
// back the staged prompt file + launcher and assert the osascript argv.

import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { launchInteractive } from '../../server/launch.js';

describe('launchInteractive (server)', () => {
  it('refuses on a non-macOS platform with supported:false', () => {
    const r = launchInteractive('hi', { platform: 'linux' });
    expect(r.launched).toBe(false);
    expect(r.supported).toBe(false);
    expect(r.error).toMatch(/macOS/i);
  });

  it('refuses an empty prompt (supported:true)', () => {
    const r = launchInteractive('   ', { platform: 'darwin' });
    expect(r.launched).toBe(false);
    expect(r.supported).toBe(true);
  });

  it('stages the prompt file + launcher and drives Terminal via osascript', () => {
    const dir = mkdtempSync(join(tmpdir(), 'launch-test-'));
    const calls = [];
    const spawnImpl = (cmd, args, opts) => { calls.push({ cmd, args, opts }); return { unref() {} }; };
    // A prompt with the chars that break naive shell-passing: wikilinks, em-dash,
    // double quotes, a $VAR, and a backtick.
    const prompt = 'Drive [[Kuramoto Coupling]] — "approve stage 2"\nline 2 with $VAR and `tick`';
    const r = launchInteractive(prompt, {
      platform: 'darwin', palaceRoot: '/Users/x/The Palace', spawnImpl, tmpDir: dir,
    });

    expect(r.launched).toBe(true);
    expect(r.supported).toBe(true);

    // The prompt is staged verbatim (so $(cat …) hands claude the exact bytes).
    expect(readFileSync(join(dir, 'prompt.txt'), 'utf8')).toBe(prompt);

    // The launcher cds into the (space-bearing, single-quoted) repo, runs claude
    // on the pinned model + effort seeded from the file, and self-cleans.
    const script = readFileSync(join(dir, 'launch.sh'), 'utf8');
    expect(script).toContain(`cd '/Users/x/The Palace'`);
    expect(script).toContain(`claude --model 'claude-opus-4-8' --effort 'high' "$(cat '${join(dir, 'prompt.txt')}')"`);
    expect(script).toContain(`rm -rf '${dir}'`);

    // osascript drives Terminal with a fixed-shape, path-only command, detached.
    expect(calls.length).toBe(1);
    expect(calls[0].cmd).toBe('osascript');
    const argv = calls[0].args.join(' ');
    expect(argv).toContain('do script "bash');
    expect(argv).toContain(join(dir, 'launch.sh'));
    expect(argv).toContain('activate');
    expect(calls[0].opts.detached).toBe(true);
  });

  it('reports a spawn failure as supported:true (not a platform problem)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'launch-test-'));
    const spawnImpl = () => { throw new Error('osascript not found'); };
    const r = launchInteractive('hello', { platform: 'darwin', palaceRoot: '/x', spawnImpl, tmpDir: dir });
    expect(r.launched).toBe(false);
    expect(r.supported).toBe(true);
    expect(r.error).toMatch(/osascript/);
  });
});
