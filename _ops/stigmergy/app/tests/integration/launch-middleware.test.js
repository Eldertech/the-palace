// Integration test for POST /api/launch — the route wiring (body parse, status
// codes, palace-root pass-through). The launch impl is injected via opts so NO
// real Terminal opens.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';

function makeServer(palaceRoot, opts = {}) {
  const plugin = blackboardMiddleware(palaceRoot, opts);
  const handlers = [];
  plugin.configureServer({ middlewares: { use: (fn) => handlers.push(fn) } });
  return http.createServer((req, res) => {
    let i = 0;
    const next = () => {
      if (i >= handlers.length) { res.statusCode = 404; res.end('nf'); return; }
      handlers[i++](req, res, next);
    };
    next();
  });
}

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-launch-mw-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  return root;
}

describe('POST /api/launch', () => {
  let root;
  beforeEach(() => { root = makeTempPalace(); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('400 on an empty prompt', async () => {
    const res = await request(makeServer(root)).post('/api/launch').send({ prompt: '   ' });
    expect(res.status).toBe(400);
  });

  test('200 + launched, passing the prompt and palace root to the impl', async () => {
    let seen = null;
    const launchImpl = (prompt, o) => { seen = { prompt, palaceRoot: o.palaceRoot }; return { launched: true, supported: true, scriptPath: '/tmp/x/launch.command' }; };
    const res = await request(makeServer(root, { launchImpl })).post('/api/launch').send({ prompt: 'drive [[Foo]] — "go"' });
    expect(res.status).toBe(200);
    expect(res.body.launched).toBe(true);
    expect(seen.prompt).toBe('drive [[Foo]] — "go"');
    expect(seen.palaceRoot).toBe(root);
  });

  test('501 when the host is not macOS (client falls back to copy)', async () => {
    const launchImpl = () => ({ launched: false, supported: false, error: 'open-in-terminal is macOS-only — use copy prompt.' });
    const res = await request(makeServer(root, { launchImpl })).post('/api/launch').send({ prompt: 'x' });
    expect(res.status).toBe(501);
    expect(res.body.supported).toBe(false);
  });

  test('500 on an unexpected launch failure', async () => {
    const launchImpl = () => ({ launched: false, supported: true, error: 'open exited 1' });
    const res = await request(makeServer(root, { launchImpl })).post('/api/launch').send({ prompt: 'x' });
    expect(res.status).toBe(500);
  });
});

describe('POST /api/launch/agent', () => {
  let root;
  beforeEach(() => { root = makeTempPalace(); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  // A registered steward roster + an injected cycle-prompt builder, so the route
  // is exercised without real agent files on disk.
  const ROW = { agent_id: 'Kuramoto Coupling', home: 'Kuramoto Coupling', dir: '_ops/agents/permanent/kuramoto-coupling', stage: 'growing', iteration: 9 };
  const stewardLane = { list: () => [ROW] };

  test('400 when no home is given', async () => {
    const res = await request(makeServer(root, { stewardLane })).post('/api/launch/agent').send({});
    expect(res.status).toBe(400);
  });

  test('404 when the page is not a registered steward (client falls back)', async () => {
    const res = await request(makeServer(root, { stewardLane: { list: () => [] } }))
      .post('/api/launch/agent').send({ home: 'Not A Steward' });
    expect(res.status).toBe(404);
    expect(res.body.registered).toBe(false);
  });

  test('preview returns the tiered construction + the constructed prompt, built in interactive mode at the right cycle', async () => {
    let built = null;
    const buildCyclePromptImpl = (o) => { built = o; return { full: `CONSTRUCTED for ${o.agentDir} (cycle ${o.cycleN})` }; };
    const res = await request(makeServer(root, { stewardLane, buildCyclePromptImpl }))
      .post('/api/launch/agent').send({ home: 'Kuramoto Coupling', mandate: 'resolve stage 2', preview: true });
    expect(res.status).toBe(200);
    expect(res.body.preview).toBe(true);
    expect(res.body.cycle).toBe(10);                 // iteration 9 -> cycle 10
    expect(res.body.prompt).toContain('CONSTRUCTED for');
    expect(res.body.construction.tiers).toHaveLength(4);   // the JEWEL tiers 0-3
    expect(res.body.construction.tiers[3].loads).toBe('injected'); // active surface is injected
    expect(res.body.construction.framing).toMatch(/narrates every write/i);
    // the builder was driven in interactive mode, at the resolved dir/cycle, with the mandate
    expect(built.mode).toBe('interactive');
    expect(built.agentDir).toBe(ROW.dir);
    expect(built.cycleN).toBe(10);
    expect(built.extraMandate).toBe('resolve stage 2');
  });

  test('launch hands the constructed prompt + model/effort to the launcher', async () => {
    let launched = null;
    const buildCyclePromptImpl = () => ({ full: 'THE CONSTRUCTED PROMPT' });
    const launchImpl = (prompt, o) => { launched = { prompt, model: o.model, effort: o.effort }; return { launched: true, supported: true, scriptPath: '/tmp/x/launch.command' }; };
    const res = await request(makeServer(root, { stewardLane, buildCyclePromptImpl, launchImpl }))
      .post('/api/launch/agent').send({ home: 'Kuramoto Coupling', model: 'claude-opus-4-8', effort: 'xhigh' });
    expect(res.status).toBe(200);
    expect(res.body.launched).toBe(true);
    expect(res.body.cycle).toBe(10);
    expect(launched.prompt).toBe('THE CONSTRUCTED PROMPT');
    expect(launched.model).toBe('claude-opus-4-8');
    expect(launched.effort).toBe('xhigh');
  });

  test('an out-of-range effort is dropped (launcher applies its default)', async () => {
    let launched = null;
    const buildCyclePromptImpl = () => ({ full: 'P' });
    const launchImpl = (prompt, o) => { launched = o; return { launched: true, supported: true }; };
    await request(makeServer(root, { stewardLane, buildCyclePromptImpl, launchImpl }))
      .post('/api/launch/agent').send({ home: 'Kuramoto Coupling', effort: 'ludicrous' });
    expect(launched.effort).toBeUndefined();  // not in the allowlist -> default
  });

  test('include toggles pass to the builder and trim the Tier-3 construction summary', async () => {
    let built = null;
    const buildCyclePromptImpl = (o) => { built = o; return { full: 'P' }; };
    const res = await request(makeServer(root, { stewardLane, buildCyclePromptImpl }))
      .post('/api/launch/agent').send({ home: 'Kuramoto Coupling', include: { board: false, staging: false }, preview: true });
    expect(res.status).toBe(200);
    // normalized: only the toggled-off layers go false; the rest default true
    expect(built.include).toEqual({ board: false, history: true, pageChange: true, staging: false });
    expect(res.body.construction.include.board).toBe(false);
    // Tier-3 text reflects the trim
    expect(res.body.construction.tiers[3].what).not.toMatch(/board slice/i);
    expect(res.body.construction.tiers[3].what).toMatch(/recent history/i);
    // identity + state are never trimmed
    expect(res.body.construction.tiers[3].what).toMatch(/injected in full as identity/i);
    expect(res.body.construction.tiers[3].what).toMatch(/state \(/i);
  });
});

describe('POST /api/launch/ephemeral', () => {
  let root;
  beforeEach(() => { root = makeTempPalace(); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  // The ephemeral path needs no steward roster — it constructs ANY page. An
  // injected builder stands in for buildEphemeralPrompt so the route is exercised
  // without walking a palace.
  const okBuild = (o) => ({ ok: true, status: 'built', home: o.title, stage: 'growing', full: `EPHEMERAL for ${o.title} (mode ${o.mode})` });

  test('400 when no home is given', async () => {
    const res = await request(makeServer(root, { buildEphemeralPromptImpl: okBuild }))
      .post('/api/launch/ephemeral').send({});
    expect(res.status).toBe(400);
  });

  test('preview returns the tiered construction + the constructed prompt, built in interactive mode at cycle 1', async () => {
    let built = null;
    const buildEphemeralPromptImpl = (o) => { built = o; return okBuild(o); };
    const res = await request(makeServer(root, { buildEphemeralPromptImpl }))
      .post('/api/launch/ephemeral').send({ home: 'Murmuration', mandate: 'sketch the boids', preview: true });
    expect(res.status).toBe(200);
    expect(res.body.preview).toBe(true);
    expect(res.body.ephemeral).toBe(true);
    expect(res.body.cycle).toBe(1);                  // a one-off is always a fresh first activation
    expect(res.body.prompt).toContain('EPHEMERAL for Murmuration');
    expect(res.body.construction.tiers).toHaveLength(4);
    expect(res.body.construction.tiers[3].loads).toBe('injected');
    expect(res.body.construction.ephemeral).toBe(true);
    expect(res.body.construction.framing).toMatch(/one-off/i);
    expect(res.body.construction.framing).toMatch(/not registered as a permanent steward/i);
    // the builder was driven by title, in interactive mode, with the mandate + normalized include
    expect(built.title).toBe('Murmuration');
    expect(built.mode).toBe('interactive');
    expect(built.extraMandate).toBe('sketch the boids');
    expect(built.include).toEqual({ board: true, history: true, pageChange: true, staging: true });
  });

  test('launch hands the constructed prompt + model/effort to the launcher', async () => {
    let launched = null;
    const launchImpl = (prompt, o) => { launched = { prompt, model: o.model, effort: o.effort }; return { launched: true, supported: true, scriptPath: '/tmp/x/launch.command' }; };
    const res = await request(makeServer(root, { buildEphemeralPromptImpl: okBuild, launchImpl }))
      .post('/api/launch/ephemeral').send({ home: 'Murmuration', model: 'claude-sonnet-4-6', effort: 'high' });
    expect(res.status).toBe(200);
    expect(res.body.launched).toBe(true);
    expect(res.body.ephemeral).toBe(true);
    expect(res.body.cycle).toBe(1);
    expect(launched.prompt).toBe('EPHEMERAL for Murmuration (mode interactive)');
    expect(launched.model).toBe('claude-sonnet-4-6');
    expect(launched.effort).toBe('high');
  });

  test('404 when the page is not found', async () => {
    const buildEphemeralPromptImpl = () => ({ ok: false, status: 'not_found', home: 'Ghost' });
    const res = await request(makeServer(root, { buildEphemeralPromptImpl }))
      .post('/api/launch/ephemeral').send({ home: 'Ghost' });
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('not_found');
  });

  test('422 when the page has no frontmatter (a learning material, not a canon entry)', async () => {
    const buildEphemeralPromptImpl = () => ({ ok: false, status: 'no_frontmatter', home: 'Plain' });
    const res = await request(makeServer(root, { buildEphemeralPromptImpl }))
      .post('/api/launch/ephemeral').send({ home: 'Plain' });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/no frontmatter/i);
  });

  test('501 when the host is not macOS (client falls back to copy)', async () => {
    const launchImpl = () => ({ launched: false, supported: false, error: 'open-in-terminal is macOS-only — use copy prompt.' });
    const res = await request(makeServer(root, { buildEphemeralPromptImpl: okBuild, launchImpl }))
      .post('/api/launch/ephemeral').send({ home: 'Murmuration' });
    expect(res.status).toBe(501);
    expect(res.body.supported).toBe(false);
  });

  test('include toggles pass to the builder and trim the Tier-3 construction summary', async () => {
    let built = null;
    const buildEphemeralPromptImpl = (o) => { built = o; return okBuild(o); };
    const res = await request(makeServer(root, { buildEphemeralPromptImpl }))
      .post('/api/launch/ephemeral').send({ home: 'Murmuration', include: { board: false, staging: false }, preview: true });
    expect(res.status).toBe(200);
    expect(built.include).toEqual({ board: false, history: true, pageChange: true, staging: false });
    expect(res.body.construction.tiers[3].what).not.toMatch(/board slice/i);
    expect(res.body.construction.tiers[3].what).toMatch(/recent history/i);
    expect(res.body.construction.tiers[3].what).toMatch(/injected in full as identity/i);
  });
});
