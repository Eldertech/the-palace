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
