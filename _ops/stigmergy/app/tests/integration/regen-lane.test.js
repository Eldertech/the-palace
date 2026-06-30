// Integration test for the regen lane (the Hero and Avatar Maker companion door).
//
// THE proof: regen() fires the real render script (regen_one.py --mock — tiny
// PNGs, no RunPod) for one entry; it places the face into the bundle, embeds the
// hero, writes the face.json sidecar, and on the actuator's exit the reap COMMITS
// those files and posts companion_regen_started → companion_regen_done on the
// board. The window reads those back over SSE (turn-id scoped).
//
// The lane passes the temp palace root via --palace, so the REAL tracked script
// (Shop/Hero and Avatar Maker/regen_one.py) operates on the temp palace; --mock
// keeps it offline (no RunPod).

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRegenLane } from '../../server/regen-lane.js';

const REGEN_SCRIPT_SRC = fileURLToPath(new URL('../../../../../Shop/Hero and Avatar Maker/regen_one.py', import.meta.url));

// -c core.quotepath=false → raw UTF-8 paths in output (else em-dash bundle paths
// come back octal-escaped, e.g. `Face Me \342\200\224 hero.png`).
function git(cwd, args) { return execFileSync('git', ['-c', 'core.quotepath=false', ...args], { cwd, encoding: 'utf8' }); }

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stig-regen-'));
  git(root, ['init', '-q', '-b', 'main']);
  git(root, ['config', 'user.email', 'test@example.com']);
  git(root, ['config', 'user.name', 'Test User']);
  git(root, ['config', 'commit.gpgsign', 'false']);
  mkdirSync(join(root, '_ops/swarm/persistent'), { recursive: true });
  writeFileSync(join(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  // An entry with no face yet.
  writeFileSync(
    join(root, 'Face Me.md'),
    '---\ntitle: "Face Me"\ntype: concept\nstage: growing\nforward_vector: "I want a face."\n---\n# Face Me\n\nA body to illustrate.\n',
  );
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', 'deposit: seed entry']);
  return root;
}

function waitFor(predicate, { timeout = 20000, interval = 60 } = {}) {
  return new Promise((res, rej) => {
    const start = Date.now();
    const tick = () => {
      let ok = false;
      try { ok = predicate(); } catch (_) { ok = false; }
      if (ok) return res(true);
      if (Date.now() - start > timeout) return rej(new Error('waitFor timeout'));
      setTimeout(tick, interval);
    };
    tick();
  });
}

describe('regen lane (companion hero/avatar door)', () => {
  let root, lane;
  const boardPath = (r) => join(r, '_ops/swarm/persistent/blackboard.jsonl');
  const readBoard = (r) => readFileSync(boardPath(r), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));

  beforeEach(() => {
    root = makeTempPalace();
    // The real tracked script, pointed at the temp palace via the lane's --palace.
    lane = createRegenLane({ palaceRoot: root, mock: true, scriptPath: REGEN_SCRIPT_SRC });
  });
  afterEach(async () => {
    try { await waitFor(() => !existsSync(lane.paths.pidFile), { timeout: 6000 }); } catch (_) { /* ignore */ }
    rmSync(root, { recursive: true, force: true });
  });

  test('renders BOTH, places + embeds + commits, and posts started → done (THE proof)', async () => {
    const turnId = 'companion-face-me-1';
    const r = lane.regen({
      path: 'Face Me.md', target: 'both', idiom: 'test woodcut',
      heroPrompt: 'a bold woodcut banner', iconPrompt: 'a bold woodcut emblem', note: 'brighter', turnId,
    });
    expect(r.fired).toBe(true);
    // started posts synchronously, before the async reap
    await waitFor(() => readBoard(root).some((m) => m.payload?.kind === 'companion_regen_started' && m.payload.turn_id === turnId), { timeout: 4000 });

    // wait for the render to exit and the reap to commit + post done
    await waitFor(() => !existsSync(lane.paths.pidFile), { timeout: 20000 });
    await waitFor(() => readBoard(root).some((m) => m.payload?.kind === 'companion_regen_done' && m.payload.turn_id === turnId), { timeout: 8000 });

    const done = readBoard(root).find((m) => m.payload?.kind === 'companion_regen_done' && m.payload.turn_id === turnId);
    expect(done.type).toBe('PROOF');
    expect(done.from).toBe('Hero and Avatar Maker');
    expect(typeof done.payload.commit).toBe('string');
    expect(done.payload.hero_rel).toMatch(/Face Me — hero\.png$/);
    expect(done.payload.icon_rel).toMatch(/Face Me — icon\.png$/);

    // the face landed in the bundle + the hero was embedded
    expect(existsSync(join(root, 'Face Me/Face Me — hero.png'))).toBe(true);
    expect(existsSync(join(root, 'Face Me/Face Me — icon.png'))).toBe(true);
    expect(existsSync(join(root, 'Face Me/Face Me — face.json'))).toBe(true);
    expect(readFileSync(join(root, 'Face Me.md'), 'utf8')).toMatch(/!\[\[Face Me — hero\.png\]\]/);

    // committed surgically as an enrich(<Entry>) commit at HEAD
    expect(git(root, ['log', '-1', '--format=%s'])).toMatch(/^enrich\(Face Me\): regenerate hero \+ icon via companion/);
    const showHead = git(root, ['show', '--stat', 'HEAD']);
    expect(showHead).toMatch(/Face Me — hero\.png/);
    expect(showHead).toMatch(/Face Me — face\.json/);
  }, 40000);

  test('target "icon" remakes only the avatar (no hero png, no md embed)', async () => {
    const turnId = 'companion-face-me-icon-1';
    lane.regen({ path: 'Face Me.md', target: 'icon', idiom: 'bold glyph', iconPrompt: 'a bold emblem', turnId });
    await waitFor(() => !existsSync(lane.paths.pidFile), { timeout: 20000 });
    await waitFor(() => readBoard(root).some((m) => m.payload?.kind === 'companion_regen_done' && m.payload.turn_id === turnId), { timeout: 8000 });

    expect(existsSync(join(root, 'Face Me/Face Me — icon.png'))).toBe(true);
    expect(existsSync(join(root, 'Face Me/Face Me — hero.png'))).toBe(false);
    // no hero → no embed added to the md
    expect(readFileSync(join(root, 'Face Me.md'), 'utf8')).not.toMatch(/!\[\[Face Me — hero\.png\]\]/);
    // the commit staged the icon + sidecar, not the md
    const showHead = git(root, ['show', '--stat', 'HEAD']);
    expect(showHead).toMatch(/Face Me — icon\.png/);
    expect(showHead).not.toMatch(/Face Me\.md/);
  }, 40000);

  test('refuses a second render while one is running (single worker per lane)', async () => {
    const first = lane.regen({ path: 'Face Me.md', target: 'both', heroPrompt: 'h', iconPrompt: 'i', turnId: 'r-a' });
    expect(first.fired).toBe(true);
    await waitFor(() => lane.status().running === true, { timeout: 3000 });
    const second = lane.regen({ path: 'Face Me.md', target: 'both', heroPrompt: 'h', iconPrompt: 'i', turnId: 'r-b' });
    expect(second.fired).toBe(false);
    expect(second.busy).toBe(true);
  }, 40000);

  test('declines an unknown entry honestly', () => {
    const r = lane.regen({ path: 'Nope.md', target: 'both', heroPrompt: 'h', iconPrompt: 'i' });
    expect(r.ok).toBe(false);
    expect(r.fired).toBe(false);
    expect(r.msg).toMatch(/not found/i);
  });
});
