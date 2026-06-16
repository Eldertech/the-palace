// _ops/loudon-eval/eval-server.mjs — the Loudon-evaluation skill's local server.
//
// Robust · easy · repeatable · low-cost human visual eval, posted to STIGMERGY.
//
//   node eval-server.mjs --dir <folder-of-images+manifest> [--port 8211] [--app http://localhost:5173]
//
// Serves the rating harness (rate.html) + the task's rating_manifest.json + images
// SAME-ORIGIN, so the browser has no CORS. On Send it wraps the ratings in a §2.2
// `human_eval` BROADCAST and FORWARDS it server-to-server to the running STIGMERGY
// app's sanctioned write path (POST /api/persistent) — the app's own strict validator
// + append helper do the work, so this stays tiny and correct by reuse. No app changes.
//
// Then the agent reads the eval straight off the board (GET /api/persistent, kind=human_eval).

import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
function arg(name, def) { const i = process.argv.indexOf('--' + name); return i >= 0 ? process.argv[i + 1] : def; }

const DIR  = resolve(arg('dir', '.'));
const PORT = parseInt(arg('port', '8211'), 10);
const APP  = arg('app', 'http://localhost:5173').replace(/\/$/, '');
const HARNESS = join(HERE, 'rate.html');

const CT = { '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif',
             '.webp':'image/webp', '.svg':'image/svg+xml', '.json':'application/json',
             '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'application/javascript' };

const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };

// resolve a request path inside DIR, refusing traversal
function safeFile(urlPath) {
  const rel = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const abs = join(DIR, rel);
  if (abs !== DIR && !abs.startsWith(DIR + '/')) return null;
  return abs;
}

function buildMessage(data) {
  const ts = new Date().toISOString();             // ISO8601 with Z — passes the validator
  const task = String(data.task || 'eval');
  return {
    schema_version: '1.0',
    id: `human-eval-${task}-${Date.now()}`,
    ts,
    session_id: `human-eval-${ts.slice(0, 10)}`,
    from: 'TRICKSTER', to: '*', type: 'BROADCAST', board: 'FLAGS',
    // human-eval health stub: honest zeros (no context/tokens), iteration >= 1
    health: { context_pct: 0, stop_reason: 'human_eval', iteration: 1, tokens_this_call: 0, model: 'human', score: 'green' },
    payload: { kind: 'human_eval', task, groups: data.groups || {}, overall: data.overall || {} },
  };
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');

  if (req.method === 'POST' && u.pathname === '/eval') {
    let body = '';
    for await (const c of req) { body += c; if (body.length > 256 * 1024) { return json(res, 413, { error: 'too large' }); } }
    let data; try { data = JSON.parse(body); } catch (e) { return json(res, 400, { error: 'bad json: ' + e.message }); }
    const msg = buildMessage(data);
    try {
      const r = await fetch(APP + '/api/persistent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg) });
      const txt = await r.text();
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ forwarded: r.status, board_response: safeParse(txt), message_id: msg.id }));
    } catch (e) {
      json(res, 502, { error: `cannot reach STIGMERGY app at ${APP} — is it running on :5173?`, detail: String(e) });
    }
    return;
  }

  // GET — serve the harness, else files from DIR
  let file = (u.pathname === '/' || u.pathname === '/rate.html') ? HARNESS : safeFile(u.pathname);
  if (!file || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); return res.end('not found: ' + u.pathname); }
  res.writeHead(200, { 'Content-Type': CT[extname(file).toLowerCase()] || 'application/octet-stream' });
  res.end(readFileSync(file));
});

function safeParse(t) { try { return JSON.parse(t); } catch { return t; } }

server.listen(PORT, '127.0.0.1', () => {
  console.log(`loudon-eval up — http://127.0.0.1:${PORT}/  ·  serving ${DIR}  ·  posting to ${APP}/api/persistent`);
});
