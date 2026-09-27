// server/request-guard.js — the doors in front of every palace route.
//
// STIGMERGY listens on loopback, but the browser on this Mac visits the whole
// web, and any page it loads can aim a request at localhost:5173. Two checks run
// before an api/ family sees a request under /api/ or /rich/:
//
// 1. Host. A DNS-rebinding page reaches the server under its own name. Vite's
//    host check sits behind this plugin's middleware, so it never sees these
//    routes; this one does. Allowed, as Vite allows them: IP literals, localhost
//    and *.localhost, and whatever `server.allowedHosts` names.
// 2. Cross-site actions. A write (POST, PUT, PATCH, DELETE) must carry
//    `application/json` — a type a cross-site page can send only after a CORS
//    preflight this server never answers — and must not come from a foreign
//    page: a browser's Origin, when it sends one, is loopback or this host, and
//    its Sec-Fetch-Site is never `cross-site`. GET /api/open runs `open` on this
//    Mac, so it refuses a cross-site request too. Other reads stay open to
//    cross-site requests: sandboxed artifacts load their media that way, and the
//    browser will not let a foreign page read the answer.
//
// Callers that are not browsers (curl, node's fetch, the eval server) send no
// Origin and no Sec-Fetch-Site, and pass.

import { isIP } from 'node:net';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ACTION_GETS = new Set(['/api/open']);

export function isGuardedPath(urlPath) {
  return urlPath.startsWith('/api/') || urlPath === '/rich' || urlPath.startsWith('/rich/');
}

// The hostname in a Host header or URL host: lower-cased, port and IPv6
// brackets removed.
export function hostnameOf(host) {
  const h = String(host || '').trim().toLowerCase();
  if (h.startsWith('[')) return h.slice(1, h.indexOf(']') === -1 ? undefined : h.indexOf(']'));
  const colon = h.indexOf(':');
  return colon === -1 ? h : h.slice(0, colon);
}

function isLoopbackName(name) {
  if (name === 'localhost' || name.endsWith('.localhost')) return true;
  if (isIP(name) === 4) return name.startsWith('127.');
  if (isIP(name) === 6) return name === '::1';
  return false;
}

/**
 * Is this Host header one the server answers to? Mirrors Vite's own rule.
 * @param {string|undefined} host — the raw Host header
 * @param {true|string[]|undefined} allowedHosts — Vite's `server.allowedHosts`
 */
export function isHostAllowed(host, allowedHosts) {
  if (host === undefined || host === '') return true; // HTTP/1.0 or a non-browser client
  if (allowedHosts === true) return true;
  const name = hostnameOf(host);
  if (isIP(name)) return true; // a rebinding attack needs a name, not an address
  if (name === 'localhost' || name.endsWith('.localhost')) return true;
  for (const entry of Array.isArray(allowedHosts) ? allowedHosts : []) {
    const e = String(entry).toLowerCase();
    if (e.startsWith('.') ? (name === e.slice(1) || name.endsWith(e)) : name === e) return true;
  }
  return false;
}

// Did a browser send this from a page that is not ours?
function isForeignBrowserRequest(req) {
  const origin = req.headers.origin;
  if (origin !== undefined) {
    let parsed;
    try { parsed = new URL(origin); } catch { return true; } // "null" (sandboxed, file://) and garbage
    const name = hostnameOf(parsed.host);
    if (!isLoopbackName(name) && parsed.host.toLowerCase() !== String(req.headers.host || '').toLowerCase()) return true;
  }
  return req.headers['sec-fetch-site'] === 'cross-site';
}

function mediaType(req) {
  return String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
}

function refuse(res, status, error) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error }));
}

/**
 * Check a request before any api/ family sees it.
 * @returns {boolean} true if it refused (the response is sent), false to go on.
 */
export function guardRequest(req, res, { urlPath, method, allowedHosts }) {
  if (!isGuardedPath(urlPath)) return false;

  if (!isHostAllowed(req.headers.host, allowedHosts)) {
    refuse(res, 403, 'host not allowed — STIGMERGY answers to localhost only (server.allowedHosts widens it)');
    return true;
  }

  const isWrite = WRITE_METHODS.has(method);
  if ((isWrite || ACTION_GETS.has(urlPath)) && isForeignBrowserRequest(req)) {
    refuse(res, 403, 'cross-site request refused — STIGMERGY takes actions only from its own pages');
    return true;
  }
  if (isWrite && mediaType(req) !== 'application/json') {
    refuse(res, 415, 'a write must be sent as application/json');
    return true;
  }
  return false;
}
