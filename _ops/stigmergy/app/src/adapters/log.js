// Adapter for the LOG deck's data fetches. Returns { ok, ... } shapes and
// never throws -- the deck renders an inline error band on failure.

export async function fetchLog({ limit = 150, path = null } = {}) {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (path) params.set('path', path);
    const res = await fetch(`/api/log?${params.toString()}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return { ok: false, status: res.status, error: `http ${res.status}` };
    return { ok: true, ...(await res.json()) };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export async function fetchCommit(sha) {
  if (typeof sha !== 'string' || sha === '') return { ok: false, error: 'missing sha' };
  try {
    const res = await fetch(`/api/commit?sha=${encodeURIComponent(sha)}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return { ok: false, status: res.status, error: `http ${res.status}` };
    return { ok: true, ...(await res.json()) };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export async function fetchUncommitted() {
  try {
    const res = await fetch('/api/uncommitted', { headers: { Accept: 'application/json' } });
    if (!res.ok) return { ok: false, status: res.status, error: `http ${res.status}` };
    return { ok: true, ...(await res.json()) };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

// Record a structured palace commit from the LOG deck. Stages ONLY the named
// paths and commits exactly those. 400 (validation) is a structured outcome,
// not a throw.
export async function commitChanges({ paths, kind, scope, summary, body, verify }) {
  try {
    const res = await fetch('/api/commit/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ paths, kind, scope, summary, body, verify }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}
