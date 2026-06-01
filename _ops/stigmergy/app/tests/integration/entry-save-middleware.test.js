import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';

function makeServer(palaceRoot) {
  const plugin = blackboardMiddleware(palaceRoot);
  const handlers = [];
  const fakeServer = { middlewares: { use: (fn) => handlers.push(fn) } };
  plugin.configureServer(fakeServer);
  return http.createServer((req, res) => {
    let i = 0;
    const next = () => {
      if (i >= handlers.length) {
        res.statusCode = 404;
        res.end('not found');
        return;
      }
      handlers[i++](req, res, next);
    };
    next();
  });
}

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-entry-save-test-'));
  // Required for actuator initialization.
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  // A concept entry with a real stage that the form might transition.
  writeFileSync(
    resolve(root, 'Kuramoto Coupling.md'),
    [
      '---',
      'title: Kuramoto Coupling',
      'type: concept',
      'pillars: [tools, philosophy]',
      'born: 2026-03',
      'stage: mature',
      'forward_vector: "I will keep teaching synchronization."',
      '---',
      '',
      '# Kuramoto Coupling',
      '',
      'Body.',
      '',
    ].join('\n'),
    'utf8',
  );
  // A second entry that uses BLOCK-style pillars on disk -- the diff for
  // a stage edit must NOT churn the pillars block.
  writeFileSync(
    resolve(root, 'Symbiotic Skills.md'),
    [
      '---',
      'title: Symbiotic Skills',
      'type: project',
      'status: active',
      'pillars:',
      '  - creation',
      '  - tools',
      '  - philosophy',
      '  - practice',
      'born: 2026-03',
      'stage: growing',
      'forward_vector: "I will keep weaving symbiosis."',
      '---',
      '',
      '# Symbiotic Skills',
      '',
      'Body.',
      '',
    ].join('\n'),
    'utf8',
  );
  return root;
}

describe('POST /api/entry/save — Phase 5 Stage A dry-run preview', () => {
  let root, server;

  beforeAll(() => {
    root = makeTempPalace();
    server = makeServer(root);
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  test('previews a stage transition, derives Palace-Stage trailer', async () => {
    const res = await request(server)
      .post('/api/entry/save')
      .send({
        path: 'Kuramoto Coupling.md',
        frontmatter: {
          title: 'Kuramoto Coupling',
          type: 'concept',
          pillars: ['tools', 'philosophy'],
          born: '2026-03',
          stage: 'fruiting',
          forward_vector: 'I will keep teaching synchronization.',
        },
        body: '# Kuramoto Coupling\n\nBody.\n',
        summary: 'mark fruiting after the Kokoro shootout',
        verify: 'verified',
      })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const p = res.body.preview;
    expect(p.subject).toBe('edit(Kuramoto Coupling): mark fruiting after the Kokoro shootout');
    expect(p.trailers).toContain('Palace-Kind: edit');
    expect(p.trailers).toContain('Palace-Entry: Kuramoto Coupling');
    expect(p.trailers).toContain('Palace-Stage: Kuramoto Coupling: mature->fruiting');
    expect(p.trailers).toContain('Palace-Verify: verified');
    expect(p.trailers).toContain('Palace-Author: loudon');
    expect(p.message).toContain('edit(Kuramoto Coupling):');
    expect(p.message).toContain('Palace-Stage: Kuramoto Coupling: mature->fruiting');
    expect(p.bodyChanged).toBe(false);
  });

  test('marks Palace-Vector: changed when forward_vector is edited', async () => {
    const res = await request(server)
      .post('/api/entry/save')
      .send({
        path: 'Kuramoto Coupling.md',
        frontmatter: {
          title: 'Kuramoto Coupling',
          type: 'concept',
          pillars: ['tools', 'philosophy'],
          born: '2026-03',
          stage: 'mature',
          forward_vector: 'I will keep teaching coupling as an ethics.',
        },
        body: '# Kuramoto Coupling\n\nBody.\n',
        summary: 'tune the forward vector',
        verify: 'verified',
      })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    const trailers = res.body.preview.trailers;
    expect(trailers).toContain('Palace-Vector: Kuramoto Coupling: changed');
  });

  test('does NOT write the file on disk (pure preview)', async () => {
    const before = require('node:fs').readFileSync(
      resolve(root, 'Kuramoto Coupling.md'),
      'utf8',
    );
    await request(server)
      .post('/api/entry/save')
      .send({
        path: 'Kuramoto Coupling.md',
        frontmatter: {
          title: 'Kuramoto Coupling',
          type: 'concept',
          pillars: ['tools', 'philosophy'],
          born: '2026-03',
          stage: 'composting',
          forward_vector: 'I will keep teaching synchronization.',
        },
        body: '# Kuramoto Coupling\n\nBody.\n',
        summary: 'about to compost',
        verify: 'verified',
      })
      .set('Content-Type', 'application/json');
    const after = require('node:fs').readFileSync(
      resolve(root, 'Kuramoto Coupling.md'),
      'utf8',
    );
    expect(after).toBe(before);
  });

  test('returns a unified diff in the preview', async () => {
    const res = await request(server)
      .post('/api/entry/save')
      .send({
        path: 'Kuramoto Coupling.md',
        frontmatter: {
          title: 'Kuramoto Coupling',
          type: 'concept',
          pillars: ['tools', 'philosophy'],
          born: '2026-03',
          stage: 'fruiting',
          forward_vector: 'I will keep teaching synchronization.',
        },
        body: '# Kuramoto Coupling\n\nBody.\n',
        summary: 'mark fruiting',
        verify: 'verified',
      })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.preview.udiff).toContain('Kuramoto Coupling.md');
    expect(res.body.preview.udiff).toMatch(/-stage: mature/);
    expect(res.body.preview.udiff).toMatch(/\+stage: fruiting/);
  });

  test('refuses canon files with 403', async () => {
    writeFileSync(
      resolve(root, 'SCHEMA.md'),
      '---\ntitle: SCHEMA\ntype: meta\nversion: "1.8"\n---\n# SCHEMA\n',
      'utf8',
    );
    const res = await request(server)
      .post('/api/entry/save')
      .send({
        path: 'SCHEMA.md',
        frontmatter: { title: 'SCHEMA', type: 'meta', pillars: ['tools'], born: '2026-03', stage: 'mature', version: '1.9' },
        body: '\n# SCHEMA\n\nNew section.\n',
        summary: 'tweak SCHEMA',
        verify: 'verified',
      })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/canon/i);
  });

  test('refuses _ops/stigmergy/app/ machinery with 403', async () => {
    const res = await request(server)
      .post('/api/entry/save')
      .send({
        path: '_ops/stigmergy/app/foo.md',
        frontmatter: { title: 'x', type: 'concept', pillars: ['tools'], born: '2026-03', stage: 'seed' },
        body: 'x',
        summary: 'x',
        verify: 'verified',
      })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(403);
  });

  test('returns 422 when the proposed frontmatter is schema-violating', async () => {
    const res = await request(server)
      .post('/api/entry/save')
      .send({
        path: 'Kuramoto Coupling.md',
        frontmatter: { title: 'Kuramoto Coupling', type: 'imaginary', pillars: [], born: 'recently', stage: 'unknown' },
        body: '\n# K\n',
        summary: 'break the schema',
        verify: 'verified',
      })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('returns 422 when nothing changed (byte-identical proposed file)', async () => {
    const res = await request(server)
      .post('/api/entry/save')
      .send({
        path: 'Kuramoto Coupling.md',
        frontmatter: {
          title: 'Kuramoto Coupling',
          type: 'concept',
          pillars: ['tools', 'philosophy'],
          born: '2026-03',
          stage: 'mature',
          forward_vector: 'I will keep teaching synchronization.',
        },
        body: '# Kuramoto Coupling\n\nBody.\n',
        summary: 'no-op',
        verify: 'verified',
      })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => /nothing changed/i.test(e))).toBe(true);
  });

  test('preserves on-disk block-style pillars when only stage changed (no style churn)', async () => {
    const res = await request(server)
      .post('/api/entry/save')
      .send({
        path: 'Symbiotic Skills.md',
        frontmatter: {
          title: 'Symbiotic Skills',
          type: 'project',
          status: 'active',
          pillars: ['creation', 'tools', 'philosophy', 'practice'],
          born: '2026-03',
          stage: 'fruiting',
          forward_vector: 'I will keep weaving symbiosis.',
        },
        body: '# Symbiotic Skills\n\nBody.\n',
        summary: 'mark fruiting',
        verify: 'verified',
      })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    const diff = res.body.preview.udiff;
    // The diff must show ONLY the stage transition. Pillars must NOT appear
    // as removed (block) and re-added (inline) lines.
    expect(diff).toMatch(/-stage: growing/);
    expect(diff).toMatch(/\+stage: fruiting/);
    expect(diff).not.toMatch(/-pillars:/);
    expect(diff).not.toMatch(/\+pillars:/);
    expect(diff).not.toMatch(/-  - creation/);
  });

  test('preserves on-disk inline-style pillars when only stage changed', async () => {
    // Symmetric: Kuramoto Coupling uses inline pillars on disk; a stage
    // change must not restyle them either.
    const res = await request(server)
      .post('/api/entry/save')
      .send({
        path: 'Kuramoto Coupling.md',
        frontmatter: {
          title: 'Kuramoto Coupling',
          type: 'concept',
          pillars: ['tools', 'philosophy'],
          born: '2026-03',
          stage: 'fruiting',
          forward_vector: 'I will keep teaching synchronization.',
        },
        body: '# Kuramoto Coupling\n\nBody.\n',
        summary: 'mark fruiting',
        verify: 'verified',
      })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    const diff = res.body.preview.udiff;
    expect(diff).not.toMatch(/-pillars:/);
    expect(diff).not.toMatch(/\+pillars:/);
  });

  test('returns 422 when summary or verify missing', async () => {
    const res = await request(server)
      .post('/api/entry/save')
      .send({
        path: 'Kuramoto Coupling.md',
        frontmatter: {
          title: 'Kuramoto Coupling', type: 'concept', pillars: ['tools'],
          born: '2026-03', stage: 'mature',
        },
        body: '\n# K\n',
      })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(422);
  });
});
