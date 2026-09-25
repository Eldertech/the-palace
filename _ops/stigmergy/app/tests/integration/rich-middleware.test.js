import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { resolve, dirname, join, normalize, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';

// The rich face mounted at /rich/ (server/api/rich.js → _ops/rich-face/).
// A temp palace carries the renderer's two files plus one entry with a bundle
// and a manifest, so every answer here comes from fixtures, not the real palace.

const __dirname = dirname(fileURLToPath(import.meta.url));
const RICH_SRC = resolve(__dirname, '../../../../rich-face');

function makeServer(palaceRoot) {
  const plugin = blackboardMiddleware(palaceRoot);
  const handlers = [];
  plugin.configureServer({ middlewares: { use: (fn) => handlers.push(fn) } });
  return http.createServer((req, res) => {
    let i = 0;
    const next = () => {
      if (i >= handlers.length) { res.statusCode = 404; res.end('not found'); return; }
      handlers[i++](req, res, next);
    };
    next();
  });
}

const WAV = 'RIFF' + 'x'.repeat(2000);

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-rich-test-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  mkdirSync(resolve(root, '_ops/swarm/sessions'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  mkdirSync(resolve(root, '_ops/rich-face'), { recursive: true });
  for (const f of ['rich.html', 'parse.js']) copyFileSync(resolve(RICH_SRC, f), resolve(root, '_ops/rich-face', f));
  writeFileSync(resolve(root, '_ops/rich-face/secret.txt'), 'not a renderer file', 'utf8');
  writeFileSync(resolve(root, 'Demo Entry.md'), '---\ntitle: Demo Entry\n---\n# Demo Entry\n\nSome words.\n\n## A Section\n\nMore words.\n', 'utf8');
  mkdirSync(resolve(root, 'Demo Entry'), { recursive: true });
  writeFileSync(resolve(root, 'Demo Entry/Demo Entry — rich.json'), JSON.stringify({ entry: 'Demo Entry', sections: [] }), 'utf8');
  writeFileSync(resolve(root, 'Demo Entry/bed.wav'), WAV, 'binary');
  mkdirSync(resolve(root, 'Elsewhere'), { recursive: true });
  writeFileSync(resolve(root, 'Elsewhere/stray.png'), 'PNG', 'binary');
  return root;
}

describe('the rich face at /rich/', () => {
  let root, sibling, server;
  beforeAll(() => {
    root = makeTempPalace();
    sibling = root + '-sibling'; // shares the palace's name as a prefix
    mkdirSync(sibling, { recursive: true });
    writeFileSync(resolve(sibling, 'secret.txt'), 'outside the palace', 'utf8');
    server = makeServer(root);
  });
  afterAll(() => {
    server.close();
    rmSync(root, { recursive: true, force: true });
    rmSync(sibling, { recursive: true, force: true });
  });

  test('/rich redirects to /rich/, keeping the query', async () => {
    const r = await request(server).get('/rich?entry=Demo%20Entry');
    expect(r.status).toBe(301);
    expect(r.headers.location).toBe('/rich/?entry=Demo%20Entry');
  });

  test('/rich/ serves the renderer', async () => {
    const r = await request(server).get('/rich/?entry=Demo%20Entry');
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toMatch(/text\/html/);
    expect(r.text).toContain('./_rich/parse.js');
  });

  test('only the renderer files are served under _rich/', async () => {
    expect((await request(server).get('/rich/_rich/parse.js')).status).toBe(200);
    expect((await request(server).get('/rich/_rich/secret.txt')).status).toBe(404);
  });

  test('resolve finds the entry, its bundle and the manifest in the bundle — as relative urls', async () => {
    const r = await request(server).get('/rich/_api/resolve?entry=Demo%20Entry');
    expect(r.status).toBe(200);
    expect(r.body.md).toBe('Demo%20Entry.md');
    expect(r.body.bundle).toBe('Demo%20Entry/');
    expect(decodeURIComponent(r.body.manifest)).toBe('Demo Entry/Demo Entry — rich.json');
    expect(r.body.files).toContain('bed.wav');
  });

  test('an unknown entry is a 404, not a crash', async () => {
    expect((await request(server).get('/rich/_api/resolve?entry=Nope')).status).toBe(404);
  });

  test('palace files stream with byte ranges', async () => {
    const whole = await request(server).get('/rich/Demo%20Entry.md');
    expect(whole.status).toBe(200);
    expect(whole.text).toContain('## A Section');
    const part = await request(server).get('/rich/Demo%20Entry/bed.wav').set('Range', 'bytes=0-3');
    expect(part.status).toBe(206);
    expect(part.headers['content-range']).toBe(`bytes 0-3/${WAV.length}`);
  });

  test('media resolves by bare filename, vault-wide, under the mount', async () => {
    const r = await request(server).get('/rich/_api/media?name=stray.png&prefer=Demo%20Entry%2F');
    expect(r.status).toBe(302);
    expect(r.headers.location).toBe('/rich/Elsewhere/stray.png');
  });

  // Each climb below lands on a file that really exists, so a 404 means the
  // guard refused it — not that there was nothing there to serve.
  test('refuses to climb out of the palace', async () => {
    const climb = '../'.repeat(24);
    expect(normalize(join(root, climb + 'etc/passwd'))).toBe('/etc/passwd');
    expect(existsSync('/etc/passwd')).toBe(true);
    expect((await request(server).get('/rich/' + '..%2F'.repeat(24) + 'etc%2Fpasswd')).status).toBe(404);
  });

  test('refuses a sibling folder whose name starts with the palace\'s', async () => {
    expect(existsSync(resolve(sibling, 'secret.txt'))).toBe(true);
    expect((await request(server).get(`/rich/..%2F${encodeURIComponent(basename(sibling))}%2Fsecret.txt`)).status).toBe(404);
  });

  // On POSIX a backslash is a filename character, not a separator, so this one
  // guards against a future decoder that treats it as one (or a Windows host).
  test('refuses an encoded-backslash climb', async () => {
    expect((await request(server).get('/rich/' + '..%5C'.repeat(24) + 'etc%5Cpasswd')).status).toBe(404);
  });

  test('paths outside /rich are not its business', async () => {
    const r = await request(server).get('/richer');
    expect(r.status).toBe(404);
    expect(r.text).toBe('not found'); // fell through to the harness, not the rich handler
  });
});
