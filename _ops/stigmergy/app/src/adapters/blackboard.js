// Client-side fetch helpers for the blackboard middleware.
// Each helper returns validated messages (annotated with `_warnings`) so
// the rendering layer can render warning-flagged messages with a red border.

import { validateAll } from '../lib/schema.js';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${url} → ${res.status} ${res.statusText}${body ? `: ${body}` : ''}`);
  }
  return res.json();
}

export async function fetchPersistent() {
  const data = await fetchJSON('/api/persistent');
  return {
    ...data,
    messages: validateAll(data.messages || []),
  };
}

export async function fetchSessions() {
  return fetchJSON('/api/sessions');
}

export async function fetchSession(id) {
  const data = await fetchJSON(`/api/sessions/${encodeURIComponent(id)}`);
  return {
    ...data,
    messages: validateAll(data.messages || []),
  };
}

// ── Write path ──────────────────────────────────────────────────────────────

/**
 * Thrown when the server returns a 400 validation error.
 * `.errors` is the array of `{path, message}` objects from the server.
 */
export class InvalidMessageError extends Error {
  constructor(errors) {
    super('invalid message');
    this.errors = errors;
  }
}

/**
 * POST a §2.2-conformant message to the blackboard.
 *
 * @param {object} message — the message to persist
 * @param {'persistent'|{session: string}} target
 *   - 'persistent'   → POST /api/persistent
 *   - { session: id } → POST /api/sessions/:id
 * @returns {Promise<object>} — the persisted message on success
 * @throws {InvalidMessageError} on 400 (validation failure)
 * @throws {Error} on other non-2xx responses
 */
export async function postMessage(message, target = 'persistent') {
  const url =
    target === 'persistent'
      ? '/api/persistent'
      : `/api/sessions/${encodeURIComponent(target.session)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(message),
  });

  if (res.status === 400) {
    const body = await res.json().catch(() => ({}));
    throw new InvalidMessageError(body.errors || []);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${url} → ${res.status} ${res.statusText}${body ? `: ${body}` : ''}`);
  }

  const body = await res.json();
  // The server returns { ok: true, line: '<json string>' }.
  // Parse the line back into an object so callers get the persisted message.
  return JSON.parse(body.line);
}
