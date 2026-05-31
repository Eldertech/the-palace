import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, chmodSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runHook } from '../../scripts/commit-msg-hook.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, '..', '..');
const HOOK_LOGIC = join(APP_ROOT, 'scripts', 'commit-msg-hook.mjs');
const INSTALLER = join(APP_ROOT, 'scripts', 'install-hooks.mjs');

describe('runHook (against a message file)', () => {
  let dir;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'hook-')); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  test('passes a conformant message through untouched', () => {
    const msgPath = join(dir, 'MSG');
    const msg = 'deposit(Foo): name it\n\nPalace-Kind: deposit\nPalace-Verify: verified\nPalace-Author: claude\n';
    writeFileSync(msgPath, msg);
    expect(runHook(msgPath, { author: 'claude' })).toBe(0);
    expect(readFileSync(msgPath, 'utf8')).toBe(msg);
  });

  test('annotates an out-of-band message, does not block', () => {
    const msgPath = join(dir, 'MSG');
    writeFileSync(msgPath, 'quick fix from obsidian\n');
    expect(runHook(msgPath, { author: 'loudon' })).toBe(0);
    const out = readFileSync(msgPath, 'utf8');
    expect(out).toMatch(/quick fix from obsidian/);
    expect(out).toMatch(/Palace-Kind: ops/);
    expect(out).toMatch(/Palace-Verify: couldnt/);
    expect(out).toMatch(/Palace-Author: loudon/);
    expect(out).toMatch(/Palace-Annotated: commit-msg-hook/);
  });

  test('a missing message file does not throw and does not block', () => {
    expect(runHook(join(dir, 'does-not-exist'), {})).toBe(0);
  });
});

describe('commit-msg hook installed in a real repo', () => {
  let root;
  function g(...args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }); }
  function lastMsg() { return execFileSync('git', ['log', '-1', '--format=%B'], { cwd: root, encoding: 'utf8' }); }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'hookrepo-'));
    g('init', '-q');
    g('config', 'user.email', 'test@palace');
    g('config', 'user.name', 'Test Palace');
    g('config', 'commit.gpgsign', 'false');
    mkdirSync(join(root, '.git', 'hooks'), { recursive: true });
    const shim = `#!/bin/sh\n# Palace commit-msg hook\nnode "${HOOK_LOGIC}" "$1" || exit 0\nexit 0\n`;
    const hookPath = join(root, '.git', 'hooks', 'commit-msg');
    writeFileSync(hookPath, shim);
    chmodSync(hookPath, 0o755);
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('a raw out-of-band commit is annotated, not rejected', () => {
    writeFileSync(join(root, 'a.md'), 'x');
    g('add', '-A');
    g('commit', '-m', 'just did a thing');
    const msg = lastMsg();
    expect(msg).toMatch(/just did a thing/);
    expect(msg).toMatch(/Palace-Kind: ops/);
    expect(msg).toMatch(/Palace-Verify: couldnt/);
  });

  test('a conformant commit is recorded unchanged', () => {
    writeFileSync(join(root, 'b.md'), 'y');
    g('add', '-A');
    g('commit', '-m', 'deposit(b): add b\n\nPalace-Kind: deposit\nPalace-Verify: verified\nPalace-Author: claude');
    const msg = lastMsg().trim();
    expect(msg).not.toMatch(/Palace-Annotated/);
    expect(msg).toMatch(/deposit\(b\): add b/);
  });

  test('installer --check / --uninstall round-trip works on a real repo', () => {
    const out1 = execFileSync('node', [INSTALLER, '--check'], { cwd: root, encoding: 'utf8' });
    expect(out1).toMatch(/INSTALLED|present/);
    execFileSync('node', [INSTALLER, '--uninstall'], { cwd: root, encoding: 'utf8' });
    const out2 = execFileSync('node', [INSTALLER, '--check'], { cwd: root, encoding: 'utf8' });
    expect(out2).toMatch(/NOT installed/);
  });
});
