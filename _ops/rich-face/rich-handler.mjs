// rich-handler.mjs — everything a rich face needs from a server, as one request
// handler. Mounted two ways, same code:
//   · inside STIGMERGY at /rich/  (server/api/rich.js)  — the everyday door
//   · standalone at /             (rich-server.mjs)      — when STIGMERGY is down
//
// Four jobs, all same-origin so the page has no CORS to fight:
//   1. Serve the renderer (rich.html, _rich/*) and any palace file — the live
//      .md, the bundle's media — with byte ranges, so video and audio can seek.
//   2. Resolve an entry name to its .md, its bundle and its manifest.
//   3. Find media by bare filename, the way an Obsidian embed does.
//   4. Forward review notes to STIGMERGY as a `human_eval` BROADCAST — the
//      message shape _ops/loudon-eval proved against the board's strict
//      validator, posted to the sanctioned write path (POST /api/persistent).
//
// Every URL it hands the page is relative, so the page works under any base.
// It never writes to the palace.

import { createReadStream, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname, normalize, relative, sep, resolve } from 'node:path';
import { makeFinder } from './palace-find.mjs';

const CT = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.flac': 'audio/flac',
};
// The renderer's own files; nothing else in this folder is served as _rich/*.
const RENDERER_FILES = new Set(['parse.js']);

const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
const statOrNull = (p) => { try { return statSync(p); } catch { return null; } };
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// A review is refused here at the size the board itself refuses
// (MAX_BODY_BYTES in app/server/http.js), so nothing is forwarded only to bounce.
const MAX_REVIEW_BYTES = 64 * 1024;
const ID_TASK_CHARS = 64; // the task travels whole in the payload; only its slug in the id is cut

// Collect the body as bytes and decode once at the end: decoding chunk by chunk
// garbles a character whose bytes land in two chunks. Past the cap it answers
// 413 and resolves null; the rest of the body is read and dropped, not kept.
function readBody(req, res, cap) {
  return new Promise((ok, fail) => {
    const chunks = [];
    let total = 0, settled = false;
    const settle = (fn, v) => { if (!settled) { settled = true; fn(v); } };
    req.on('data', (c) => {
      if (settled) return;
      total += c.length;
      if (total > cap) { chunks.length = 0; json(res, 413, { error: `too large — the board takes at most ${cap / 1024} KB` }); settle(ok, null); return; }
      chunks.push(c);
    });
    req.on('end', () => settle(ok, Buffer.concat(chunks).toString('utf8')));
    req.on('error', (e) => settle(fail, e));
    req.on('close', () => settle(fail, new Error('the request closed before its body ended')));
  });
}

// The human_eval message — honest zeros for a human, iteration >= 1, and the
// human node's model id (SCHEMA — Reference §9).
export function buildReviewMessage(data) {
  const d = isPlainObject(data) ? data : {};
  const ts = new Date().toISOString();
  const task = String(d.task || 'rich-face');
  return {
    schema_version: '1.0', id: `human-eval-${task.replace(/[^\w-]+/g, '-').slice(0, ID_TASK_CHARS)}-${Date.now()}`, ts,
    session_id: `human-eval-${ts.slice(0, 10)}`, from: 'TRICKSTER', to: '*', type: 'BROADCAST', board: 'FLAGS',
    health: { context_pct: 0, stop_reason: 'human_eval', iteration: 1, tokens_this_call: 0, model: 'loudon-trickster', score: 'green' },
    payload: { kind: 'human_eval', task, groups: d.groups || {}, overall: d.overall || {} },
  };
}

/**
 * @param {object} o
 * @param {string} o.root   palace root
 * @param {string} o.here   the rich-face folder (rich.html, parse.js, manifests/)
 * @param {string} [o.base] mount point, '' or e.g. '/rich'
 * @param {(req) => string} o.app  STIGMERGY origin for review forwarding
 * @returns {(req, res) => Promise<boolean>} true when it owned the response
 */
export function createRichHandler({ root, here, base = '', app }) {
  const ROOT = resolve(root), HERE = resolve(here);
  const { findEntry, findByName } = makeFinder(ROOT);

  const inside = (dir, rel) => {
    let r;
    try { r = decodeURIComponent(rel); } catch { return null; }
    const abs = normalize(join(dir, r));
    return abs === dir || abs.startsWith(dir + sep) ? abs : null;
  };
  const relUrl = (abs) => relative(ROOT, abs).split(sep).map(encodeURIComponent).join('/');

  function resolveEntry(name) {
    const md = findEntry(name);
    if (!md) return null;
    const bundle = md.replace(/\.md$/i, '');
    const title = bundle.split(sep).pop();
    const manifest = [join(bundle, `${title} — rich.json`), join(HERE, 'manifests', `${title} — rich.json`)].find((p) => existsSync(p)) || null;
    let files = [];
    try { files = existsSync(bundle) ? readdirSync(bundle).filter((f) => !f.startsWith('.')) : []; } catch { /* none */ }
    return { title, md: relUrl(md), bundle: existsSync(bundle) ? relUrl(bundle) + '/' : null, manifest: manifest ? relUrl(manifest) : null, files };
  }

  function serveFile(req, res, file, size) {
    const headers = { 'Content-Type': CT[extname(file).toLowerCase()] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
    const range = req.headers.range && req.headers.range.match(/bytes=(\d*)-(\d*)/);
    let status = 200, opts;
    if (range) {
      const start = range[1] === '' ? size - parseInt(range[2], 10) : parseInt(range[1], 10);
      let end = range[1] !== '' && range[2] !== '' ? parseInt(range[2], 10) : size - 1;
      if (!(start >= 0) || start >= size || end < start) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }); res.end(); return; }
      end = Math.min(end, size - 1);
      status = 206; opts = { start, end };
      Object.assign(headers, { 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    } else headers['Content-Length'] = size;
    // HEAD answers from the stat alone and never opens the file.
    if (req.method === 'HEAD') { res.writeHead(status, headers); res.end(); return; }
    // Answer only once the file is open: one that went missing since the stat,
    // or that can't be read, gets an honest status instead of a half-sent 200,
    // and a stream error is always handled here — never an uncaught 'error'.
    const stream = createReadStream(file, opts);
    stream.on('open', () => { res.writeHead(status, headers); stream.pipe(res); });
    stream.on('error', (e) => {
      if (res.headersSent) { res.destroy(); return; }
      res.writeHead(e.code === 'ENOENT' ? 404 : 403, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end('cannot read: ' + relative(ROOT, file));
    });
    res.on('close', () => stream.destroy());
  }

  // A bad request must never take the server down: whatever throws on the way
  // through becomes a 500 for that request alone.
  return async function handle(req, res) {
    try {
      return await route(req, res);
    } catch (e) {
      console.error('[rich-face]', req.method, req.url, e);
      if (res.headersSent) res.destroy();
      else json(res, 500, { error: 'the rich face failed on this request: ' + (e && e.message ? e.message : String(e)) });
      return true;
    }
  };

  async function route(req, res) {
    const u = new URL(req.url, 'http://x');
    let path = u.pathname;
    if (base) {
      if (path === base) { res.writeHead(301, { Location: base + '/' + u.search }); res.end(); return true; }
      if (!path.startsWith(base + '/')) return false;
      path = path.slice(base.length);
    }

    if (path === '/_api/resolve') {
      const r = resolveEntry(u.searchParams.get('entry') || '');
      r ? json(res, 200, r) : json(res, 404, { error: `no entry named "${u.searchParams.get('entry')}"` });
      return true;
    }
    if (path === '/_api/find' || path === '/_api/media') {
      const prefer = u.searchParams.get('prefer') ? inside(ROOT, u.searchParams.get('prefer')) : null;
      const hit = findByName(u.searchParams.get('name') || '', prefer);
      if (path === '/_api/find') { hit ? json(res, 200, { url: relUrl(hit) }) : json(res, 404, { error: 'not found' }); return true; }
      if (!hit) { res.writeHead(404); res.end('not found'); return true; }
      res.writeHead(302, { Location: (base || '') + '/' + relUrl(hit), 'Cache-Control': 'no-store' });
      res.end();
      return true;
    }
    if (path === '/_api/review' && req.method === 'POST') {
      const body = await readBody(req, res, MAX_REVIEW_BYTES);
      if (body === null) return true; // 413 already sent
      let data;
      try { data = JSON.parse(body); } catch (e) { json(res, 400, { error: 'bad json: ' + e.message }); return true; }
      if (!isPlainObject(data)) { json(res, 400, { error: 'a review is a JSON object' }); return true; }
      const msg = buildReviewMessage(data);
      const target = app(req).replace(/\/$/, '');
      try {
        const r = await fetch(target + '/api/persistent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg) });
        const txt = await r.text();
        let board; try { board = JSON.parse(txt); } catch { board = txt; }
        json(res, r.status, { forwarded: r.status, board_response: board, message_id: msg.id });
      } catch (e) {
        json(res, 502, { error: `cannot reach STIGMERGY at ${target} — is it running?`, detail: String(e) });
      }
      return true;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') return false;
    let file;
    if (path === '/' || path === '/index.html') file = join(HERE, 'rich.html');
    else if (path.startsWith('/_rich/')) {
      const name = path.slice('/_rich/'.length);
      file = RENDERER_FILES.has(name) ? join(HERE, name) : null;
    } else file = inside(ROOT, path);
    const st = file ? statOrNull(file) : null;
    if (!st || !st.isFile()) { res.writeHead(404); res.end('not found: ' + path); return true; }
    serveFile(req, res, file, st.size);
    return true;
  }
}
