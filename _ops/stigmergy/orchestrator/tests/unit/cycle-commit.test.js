import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { shippedPaths, selectCommitPaths, headlineOf } from '../../src/cycle-commit.js';
import { processCycle } from '../../src/process-cycle.js';

function assistantLine(fences) {
  const text = fences.map((f) => '```json\n' + JSON.stringify(f) + '\n```').join('\n\n');
  return JSON.stringify({ type: 'assistant', message: { usage: {}, content: [{ type: 'text', text }] } });
}

const git = (root, args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });

let root;
afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

// A palace with one project entry, its bundle, and a steward.
function makePalace() {
  root = mkdtempSync(path.join(tmpdir(), 'palace-cc-'));
  const bundle = path.join(root, 'Projects/Test Steward');
  mkdirSync(bundle, { recursive: true });
  writeFileSync(path.join(root, 'Projects/Test Steward.md'), '---\ntitle: Test Steward\ntype: project\nstage: growing\nstatus: active\n---\n# Test Steward\n');
  const agentDir = path.join(root, '_ops/agents/permanent/test-steward');
  mkdirSync(agentDir, { recursive: true });
  mkdirSync(path.join(root, '_ops/swarm/persistent'), { recursive: true });
  writeFileSync(path.join(agentDir, 'manifest.json'), JSON.stringify({ agent_id: 'Test Steward', home: 'Test Steward', mode: 'long_duration_background', session_id: 's', model: { name: 'claude-sonnet-5' } }));
  writeFileSync(path.join(agentDir, 'state.json'), JSON.stringify({ iteration: 0, last_active: null, last_read_cursor: null }));
  writeFileSync(path.join(agentDir, 'history.jsonl'), '');
  writeFileSync(path.join(root, '_ops/swarm/persistent/blackboard.jsonl'), '');
  return { bundle, agentDir: '_ops/agents/permanent/test-steward' };
}

describe('shippedPaths', () => {
  test('reads artifacts objects, string arrays and the legacy artifact_path', () => {
    const paths = shippedPaths([
      { payload: { artifacts: [{ path: 'Projects/A/x.png', caption: 'x' }, 'Projects/A/y.json'] } },
      { payload: { artifact_path: 'Projects/A/z.wav' } },
    ]);
    expect(paths.sort()).toEqual(['Projects/A/x.png', 'Projects/A/y.json', 'Projects/A/z.wav']);
  });
});

describe('selectCommitPaths', () => {
  test('keeps bundle files; refuses entries, outsiders, missing and oversize files', () => {
    const { bundle } = makePalace();
    writeFileSync(path.join(bundle, 'render.png'), 'png');
    writeFileSync(path.join(bundle, 'big.wav'), Buffer.alloc(2048));
    writeFileSync(path.join(bundle, 'notes.md'), '---\ntitle: notes\nborn: 2026-09\n---\nworkshop notes\n');
    writeFileSync(path.join(bundle, 'Draft.md'), '---\ntitle: Draft\ntype: specialist\n---\nan entry in disguise\n');
    const r = selectCommitPaths({
      palaceRoot: root,
      bundleDir: bundle,
      maxBytes: 1024,
      paths: [
        'Projects/Test Steward/render.png',
        'Projects/Test Steward/notes.md',
        'Projects/Test Steward/Draft.md',
        'Projects/Test Steward/big.wav',
        'Projects/Test Steward/gone.wav',
        'Projects/Test Steward.md',
        '../outside.txt',
      ],
    });
    expect(r.paths.sort()).toEqual(['Projects/Test Steward/notes.md', 'Projects/Test Steward/render.png']);
    expect(r.entries).toEqual(['Projects/Test Steward/Draft.md']);
    expect(r.oversize.map((o) => o.path)).toEqual(['Projects/Test Steward/big.wav']);
    expect(r.missing).toEqual(['Projects/Test Steward/gone.wav']);
    expect(r.outside.sort()).toEqual(['../outside.txt', 'Projects/Test Steward.md']);
  });
});

describe('headlineOf', () => {
  test('takes the first headline-like field and trims it to one line', () => {
    expect(headlineOf([{ payload: { headline: 'I made\n a thing' } }])).toBe('I made a thing');
    expect(headlineOf([])).toBe('machinery and scroll');
  });
});

describe('processCycle with commit', () => {
  test('commits exactly what the cycle shipped, and leaves another writer\'s staged work alone', () => {
    const { bundle, agentDir } = makePalace();
    git(root, ['init', '-q', '-b', 'main']);
    git(root, ['config', 'user.name', 'test']);
    git(root, ['config', 'user.email', 'test@example.com']);
    git(root, ['add', '-A']);
    git(root, ['commit', '-q', '-m', 'init']);

    // Another writer has something staged that must not ride along.
    writeFileSync(path.join(root, 'Other.md'), 'someone else\n');
    git(root, ['add', 'Other.md']);

    writeFileSync(path.join(bundle, 'render.png'), 'png');
    writeFileSync(path.join(bundle, 'Draft.md'), '---\ntitle: Draft\ntype: specialist\n---\nan entry\n');
    const shipped = {
      schema_version: '1.0', id: 'ts-1', ts: '2026-09-25T20:00:00-04:00', session_id: 's',
      from: 'Test Steward', to: '*', type: 'BROADCAST', board: 'GENERAL',
      payload: { kind: 'shipped_artifact', headline: 'A render of the thing', artifacts: [{ path: 'Projects/Test Steward/render.png' }, { path: 'Projects/Test Steward/Draft.md' }] },
    };
    const transcriptPath = path.join(root, 'transcript.jsonl');
    writeFileSync(transcriptPath, assistantLine([shipped]));
    // The transcript itself is scratch, not palace work — keep it out of the tree's status.
    writeFileSync(path.join(root, '.gitignore'), 'transcript.jsonl\n');

    const summary = processCycle({ palaceRoot: root, transcriptPath, agentDir, cycleN: 1, iteration: 1, tsNow: '2026-09-25T20:05:00-04:00', commit: true });

    expect(summary.commit.ok).toBe(true);
    expect(summary.commit.hash).toMatch(/^[0-9a-f]{7,40}$/);
    expect(summary.commit.entries).toEqual(['Projects/Test Steward/Draft.md']);

    const files = git(root, ['-c', 'core.quotepath=false', 'show', '--name-only', '--format=', 'HEAD']).trim().split('\n').sort();
    expect(files).toContain('Projects/Test Steward/render.png');
    expect(files).toContain('_ops/agents/permanent/test-steward/state.json');
    expect(files).toContain('_ops/agents/permanent/test-steward/history.jsonl');
    expect(files).toContain('_ops/swarm/persistent/blackboard.jsonl');
    expect(files).not.toContain('Projects/Test Steward/Draft.md');
    expect(files).not.toContain('Other.md');

    const subject = git(root, ['log', '-1', '--format=%s']).trim();
    expect(subject).toBe('steward(Test Steward): cycle 1 — A render of the thing');

    // The other writer's file is still staged, untouched.
    expect(git(root, ['diff', '--cached', '--name-only']).trim()).toBe('Other.md');
  });

  test('with commit off (the default) nothing is committed', () => {
    const { agentDir } = makePalace();
    git(root, ['init', '-q', '-b', 'main']);
    git(root, ['config', 'user.name', 'test']);
    git(root, ['config', 'user.email', 'test@example.com']);
    git(root, ['add', '-A']);
    git(root, ['commit', '-q', '-m', 'init']);
    const msg = { schema_version: '1.0', id: 'b-1', ts: '2026-09-25T20:00:00-04:00', session_id: 's', from: 'Test Steward', to: '*', type: 'BROADCAST', board: 'GENERAL', payload: { subject: 'hi', content: 'hello' } };
    const transcriptPath = path.join(root, 'transcript.jsonl');
    writeFileSync(transcriptPath, assistantLine([msg]));
    const summary = processCycle({ palaceRoot: root, transcriptPath, agentDir, cycleN: 1, iteration: 1, tsNow: '2026-09-25T20:05:00-04:00' });
    expect(summary.commit).toBeNull();
    expect(git(root, ['rev-list', '--count', 'HEAD']).trim()).toBe('1');
  });
});
