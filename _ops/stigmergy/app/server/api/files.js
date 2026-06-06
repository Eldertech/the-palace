// server/api/files.js — read-side file endpoints (open in native app / serve inline).
//   GET /api/open  — open a palace file in its native app (or reveal in Finder)
//   GET /api/file  — stream a palace file for inline rendering

import { existsSync, statSync, createReadStream } from 'node:fs';
import { execFile } from 'node:child_process';
import { jsonResponse, resolveInsidePalace, contentTypeFor } from '../http.js';

// Native open command: macOS `open`, otherwise `xdg-open` (Linux).
const OPEN_CMD = process.platform === 'darwin' ? 'open' : 'xdg-open';

export async function filesRoutes(ctx) {
  const { res, palaceRoot, urlPath, query, method } = ctx;

  // `open:` links in messages resolve here so a rendered artifact (e.g. a WAV)
  // opens in the OS default app / DAW. Path must be palace-relative; ?reveal=1
  // reveals in Finder instead. Returns 204 so an <a> click fires the open
  // without navigating the BBS away.
  if (urlPath === '/api/open' && method === 'GET') {
    const rel = query.get('path');
    const abs = resolveInsidePalace(palaceRoot, rel);
    if (!abs) {
      jsonResponse(res, 400, { error: 'invalid or missing path (must be palace-relative, no traversal)', path: rel });
      return true;
    }
    if (!existsSync(abs)) {
      jsonResponse(res, 404, { error: 'file not found', path: rel });
      return true;
    }
    const reveal = query.get('reveal') === '1' || query.get('reveal') === 'true';
    execFile(OPEN_CMD, reveal ? ['-R', abs] : [abs], (err) => {
      if (err) {
        jsonResponse(res, 500, { error: 'open failed', detail: err.message });
        return;
      }
      res.statusCode = 204;
      res.end();
    });
    return true; // response owned by the execFile callback
  }

  // The read-side counterpart to the strict write-side validator: lenient about
  // WHAT it serves, strict about WHERE it reads from. The renderer's iframe
  // sandbox is `allow-scripts` only (no allow-same-origin), so served HTML
  // cannot reach STIGMERGY's origin even though it loads from here.
  if (urlPath === '/api/file' && method === 'GET') {
    const rel = query.get('path');
    const abs = resolveInsidePalace(palaceRoot, rel);
    if (!abs) {
      jsonResponse(res, 400, { error: 'invalid or missing path (must be palace-relative, no traversal)', path: rel });
      return true;
    }
    if (!existsSync(abs)) {
      jsonResponse(res, 404, { error: 'file not found', path: rel });
      return true;
    }
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      jsonResponse(res, 400, { error: 'path is a directory, not a file', path: rel });
      return true;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', contentTypeFor(abs));
    res.setHeader('Content-Length', String(stat.size));
    res.setHeader('Cache-Control', 'no-cache');
    const stream = createReadStream(abs);
    // A mid-stream read error must not crash the dev server. Headers are already
    // sent, so the cleanest recovery is to drop the connection.
    stream.on('error', () => { try { res.destroy(); } catch (_) {} });
    stream.pipe(res);
    return true; // response owned by the stream
  }

  return false;
}
