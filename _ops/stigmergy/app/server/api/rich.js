// server/api/rich.js — the rich face, mounted in the terminal.
//   GET  /rich/?entry=<Entry>   an entry's rich face (the renderer)
//   GET  /rich/_api/*           resolve · find · media;  POST /rich/_api/review
//   GET  /rich/<palace path>    the live .md and the bundle's media, byte-ranged
//
// The handler itself lives with the renderer in _ops/rich-face/ (it also runs
// standalone as rich-server.mjs); this family only mounts it. Reviews post back
// into this same server's /api/persistent — the board's sanctioned write path.

import { resolve } from 'node:path';
import { createRichHandler } from '../../../../rich-face/rich-handler.mjs';

const handlers = new Map(); // palaceRoot -> handler (one per root; tests use temp roots)

// Where a review is forwarded: this same server, addressed by the socket the
// request arrived on — never the client's Host header, which any caller can
// set to point the forward somewhere else.
export function selfOrigin(req) {
  const s = req.socket || {};
  if (!s.localAddress || !s.localPort) return 'http://localhost:5173';
  const addr = s.localAddress.includes(':') ? `[${s.localAddress.replace(/%/g, '%25')}]` : s.localAddress;
  return `${s.encrypted ? 'https' : 'http'}://${addr}:${s.localPort}`;
}

export async function richRoutes(ctx) {
  const { req, res, palaceRoot, urlPath } = ctx;
  if (urlPath !== '/rich' && !urlPath.startsWith('/rich/')) return false;
  let handle = handlers.get(palaceRoot);
  if (!handle) {
    handle = createRichHandler({
      root: palaceRoot,
      here: resolve(palaceRoot, '_ops/rich-face'),
      base: '/rich',
      app: selfOrigin,
    });
    handlers.set(palaceRoot, handle);
  }
  return handle(req, res);
}
