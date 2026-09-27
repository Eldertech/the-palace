import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'node:http';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, copyFileSync, chmodSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRichHandler, buildReviewMessage } from '../../../../rich-face/rich-handler.mjs';
import * as richHandler from '../../../../rich-face/rich-handler.mjs';

// The rich-face handler on its own (the way rich-server.mjs mounts it), against
// a temp palace. Reviews forward to a capture server standing in for STIGMERGY,
// so a test can see exactly what would have reached the board — and nothing
// here ever talks to a real one.

const __dirname = dirname(fileURLToPath(import.meta.url));
const RICH_SRC = resolve(__dirname, '../../../../rich-face');
const canChmod = typeof process.getuid === 'function' && process.getuid() !== 0; // root reads through mode 000

function listen(server) {
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server.address().port)));
}

// Send a request body in separate writes, pausing between them, so the server
// sees them as separate chunks.
function send(port, path, { method = 'POST', chunks = [], headers = {}, gap = 30 } = {}) {
  return new Promise((ok, fail) => {
    const req = http.request({ host: '127.0.0.1', port, path, method, headers: { 'Content-Type': 'application/json', ...headers } }, (res) => {
      const parts = [];
      res.on('data', (c) => parts.push(c));
      res.on('end', () => ok({ status: res.statusCode, headers: res.headers, text: Buffer.concat(parts).toString('utf8') }));
    });
    req.on('error', fail);
    (async () => {
      for (const c of chunks) { req.write(c); await new Promise((r) => setTimeout(r, gap)); }
      req.end();
    })();
  });
}

describe('the rich-face handler', () => {
  let root, server, port, capture, capturePort, captured, appFn;

  beforeAll(async () => {
    root = mkdtempSync(resolve(tmpdir(), 'rich-handler-test-'));
    mkdirSync(resolve(root, '_ops/rich-face'), { recursive: true });
    for (const f of ['rich.html', 'parse.js']) copyFileSync(resolve(RICH_SRC, f), resolve(root, '_ops/rich-face', f));
    writeFileSync(resolve(root, 'Demo Entry.md'), '# Demo Entry\n\nSome words.\n', 'utf8');
    mkdirSync(resolve(root, 'Demo Entry'), { recursive: true });
    writeFileSync(resolve(root, 'Demo Entry/bed.wav'), 'RIFF' + 'x'.repeat(2000), 'binary');
    writeFileSync(resolve(root, 'Demo Entry/locked.wav'), 'RIFF' + 'y'.repeat(2000), 'binary');
    if (canChmod) chmodSync(resolve(root, 'Demo Entry/locked.wav'), 0o000);

    capture = http.createServer((req, res) => {
      const parts = [];
      req.on('data', (c) => parts.push(c));
      req.on('end', () => {
        captured.push({ url: req.url, body: Buffer.concat(parts).toString('utf8') });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      });
    });
    capturePort = await listen(capture);

    const handle = createRichHandler({ root, here: resolve(root, '_ops/rich-face'), base: '', app: (req) => appFn(req) });
    server = http.createServer(async (req, res) => {
      if (!(await handle(req, res))) { res.writeHead(405); res.end(); }
    });
    port = await listen(server);
  });

  beforeEach(() => { captured = []; appFn = () => `http://127.0.0.1:${capturePort}`; });

  afterAll(() => {
    server.close(); capture.close();
    if (canChmod) chmodSync(resolve(root, 'Demo Entry/locked.wav'), 0o644);
    rmSync(root, { recursive: true, force: true });
  });

  const alive = async () => (await send(port, '/_api/resolve?entry=Demo%20Entry', { method: 'GET' })).status;

  // ── review bodies ──────────────────────────────────────────────────────────
  test.each([['null'], ['[]'], ['"a string"'], ['42'], ['true']])('a review body of %s is a 400, and the server lives', async (body) => {
    const r = await send(port, '/_api/review', { chunks: [body] });
    expect(r.status).toBe(400);
    expect(captured).toHaveLength(0);
    expect(await alive()).toBe(200);
  });

  test('buildReviewMessage tolerates a missing body', () => {
    expect(() => buildReviewMessage(null)).not.toThrow();
    expect(buildReviewMessage(null).payload.task).toBe('rich-face');
  });

  test('a multibyte character split across two chunks arrives whole', async () => {
    const note = 'the drift — é, ü, and a note 🎵 at the end';
    const buf = Buffer.from(JSON.stringify({ task: 'rich-face:Demo Entry:round-1', overall: { note } }), 'utf8');
    const at = buf.indexOf(Buffer.from('🎵', 'utf8')) + 2; // cut inside the four-byte character
    const r = await send(port, '/_api/review', { chunks: [buf.subarray(0, at), buf.subarray(at)] });
    expect(r.status).toBe(200);
    expect(captured).toHaveLength(1);
    expect(JSON.parse(captured[0].body).payload.overall.note).toBe(note);
  });

  test('a body over 64 KB (the board\'s own limit) is refused here, not forwarded', async () => {
    const big = JSON.stringify({ task: 't', overall: { note: 'x'.repeat(70 * 1024) } });
    const r = await send(port, '/_api/review', { chunks: [big] });
    expect(r.status).toBe(413);
    expect(captured).toHaveLength(0);
    expect(await alive()).toBe(200);
  });

  test('a body just under 64 KB still goes through', async () => {
    const r = await send(port, '/_api/review', { chunks: [JSON.stringify({ task: 't', overall: { note: 'x'.repeat(60 * 1024) } })] });
    expect(r.status).toBe(200);
    expect(captured).toHaveLength(1);
  });

  test('a long task name is bounded in the message id', async () => {
    const task = 'rich-face:' + 'a'.repeat(5000);
    const r = await send(port, '/_api/review', { chunks: [JSON.stringify({ task })] });
    expect(r.status).toBe(200);
    const msg = JSON.parse(captured[0].body);
    expect(msg.id.length).toBeLessThanOrEqual(128);
    expect(msg.id).toMatch(/^human-eval-rich-face-a+-\d+$/);
    expect(msg.payload.task).toBe(task); // the task itself travels whole; only the id is bounded
  });

  test('a throw anywhere in the handler is a 500, not a dead server', async () => {
    appFn = () => { throw new Error('boom'); };
    const r = await send(port, '/_api/review', { chunks: [JSON.stringify({ task: 't' })] });
    expect(r.status).toBe(500);
    expect(await alive()).toBe(200);
  });

  // ── file serving ───────────────────────────────────────────────────────────
  test.skipIf(!canChmod)('an unreadable file is an error response, and the server lives', async () => {
    const r = await send(port, '/Demo%20Entry/locked.wav', { method: 'GET' });
    expect(r.status).toBe(403);
    const ranged = await send(port, '/Demo%20Entry/locked.wav', { method: 'GET', headers: { Range: 'bytes=0-3' } });
    expect(ranged.status).toBe(403);
    expect(await alive()).toBe(200);
  });

  test.skipIf(!canChmod)('HEAD answers from the stat alone — it never opens the file', async () => {
    const whole = await send(port, '/Demo%20Entry/locked.wav', { method: 'HEAD' });
    expect(whole.status).toBe(200);
    expect(whole.headers['content-length']).toBe('2004');
    const ranged = await send(port, '/Demo%20Entry/locked.wav', { method: 'HEAD', headers: { Range: 'bytes=0-3' } });
    expect(ranged.status).toBe(206);
    expect(ranged.headers['content-range']).toBe('bytes 0-3/2004');
    expect(await alive()).toBe(200);
  });

  test('a readable file still streams whole and by range', async () => {
    const whole = await send(port, '/Demo%20Entry/bed.wav', { method: 'GET' });
    expect(whole.status).toBe(200);
    expect(whole.text.length).toBe(2004);
    const part = await send(port, '/Demo%20Entry/bed.wav', { method: 'GET', headers: { Range: 'bytes=0-3' } });
    expect(part.status).toBe(206);
    expect(part.text).toBe('RIFF');
  });

  // ── the page's own libraries, served from STIGMERGY's install, never a CDN ──
  const MERMAID_CHUNKS = resolve(RICH_SRC, '../stigmergy/node_modules/mermaid/dist/chunks/mermaid.esm.min');

  test('rich.html imports nothing from another origin', () => {
    const html = readFileSync(resolve(RICH_SRC, 'rich.html'), 'utf8');
    const imports = [...html.matchAll(/\bimport\s*(?:[^'"()]*\bfrom\s*)?\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    expect(imports.length).toBeGreaterThan(0);
    for (const spec of imports) expect(spec, spec).toMatch(/^\.\//);
    expect(html).not.toMatch(/cdn\.jsdelivr|unpkg\.com|cdnjs/);
  });

  test('marked is served from the install, at the version the page pins', async () => {
    const r = await send(port, '/_vendor/marked/marked.esm.js', { method: 'GET' });
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toMatch(/javascript/);
    expect(r.text).toMatch(/marked v12\.0\.2/);
  });

  test('mermaid and its chunks are served from the install', async () => {
    const entry = await send(port, '/_vendor/mermaid/mermaid.esm.min.mjs', { method: 'GET' });
    expect(entry.status).toBe(200);
    expect(entry.text).toMatch(/\.\/chunks\/mermaid\.esm\.min\//);
    const chunk = readdirSync(MERMAID_CHUNKS).find((f) => f.endsWith('.mjs'));
    const r = await send(port, `/_vendor/mermaid/chunks/mermaid.esm.min/${chunk}`, { method: 'GET' });
    expect(r.status).toBe(200);
  });

  test.each([
    '/_vendor/mermaid/mermaid.core.mjs',
    '/_vendor/mermaid/package.json',
    '/_vendor/marked/package.json',
    '/_vendor/marked/lib/marked.esm.js',
    '/_vendor/react/index.js',
    '/_vendor/mermaid/chunks/mermaid.esm.min/%2e%2e%2f%2e%2e%2fmermaid.core.mjs',
  ])('%s is not served — only the two libraries the page imports', async (path) => {
    expect((await send(port, path, { method: 'GET' })).status).toBe(404);
  });

  test('vendorFiles lists what the static build copies: marked, mermaid and every chunk', () => {
    const files = richHandler.vendorFiles();
    const rels = files.map((f) => f.rel);
    expect(rels).toContain('marked/marked.esm.js');
    expect(rels).toContain('mermaid/mermaid.esm.min.mjs');
    expect(rels.filter((r) => r.startsWith('mermaid/chunks/')).length).toBe(readdirSync(MERMAID_CHUNKS).filter((f) => f.endsWith('.mjs')).length);
  });
});
