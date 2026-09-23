// Adapter for the PROJECTS deck — every project's row and its scroll. Mirrors
// adapters/stewards.js: every call returns { ok, ... } and never throws.

export async function fetchProjects() {
  try {
    const res = await fetch('/api/projects', { headers: { Accept: 'application/json' } });
    if (!res.ok) return { ok: false, status: res.status, error: `http ${res.status}` };
    return { ok: true, ...(await res.json()) };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export async function fetchScroll(home, { write = false } = {}) {
  try {
    const res = await fetch(`/api/projects/scroll?home=${encodeURIComponent(home)}${write ? '&write=1' : ''}`, { headers: { Accept: 'application/json' } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, error: data.error || `http ${res.status}` };
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export async function saveStandingOrders(home, orders) {
  try {
    const res = await fetch('/api/projects/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ home, orders }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, error: data.error || `http ${res.status}` };
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}
