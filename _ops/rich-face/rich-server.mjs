// rich-server.mjs — the rich face on its own, for when STIGMERGY isn't running.
// (With STIGMERGY up, the same page lives at http://localhost:5173/rich/.)
//
//   node _ops/rich-face/rich-server.mjs [--port 8842] [--app http://localhost:5173]
//   → http://127.0.0.1:8842/?entry=Kuramoto%20Coupling
//
// Binds 127.0.0.1 only. Never writes to the palace; review notes are forwarded
// to STIGMERGY's board (--app), which must be running to receive them.

import http from 'node:http';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from './palace-find.mjs';
import { createRichHandler } from './rich-handler.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
function arg(name, def) { const i = process.argv.indexOf('--' + name); return i >= 0 ? process.argv[i + 1] : def; }
const PORT = parseInt(arg('port', '8842'), 10);
const APP = arg('app', 'http://localhost:5173');

const handle = createRichHandler({ root: ROOT, here: HERE, base: '', app: () => APP });
http.createServer(async (req, res) => {
  if (!(await handle(req, res))) { res.writeHead(405); res.end(); }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`rich face up — http://127.0.0.1:${PORT}/?entry=Kuramoto%20Coupling  ·  palace ${ROOT}  ·  reviews → ${APP}/api/persistent`);
});
