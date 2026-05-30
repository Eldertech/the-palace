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
