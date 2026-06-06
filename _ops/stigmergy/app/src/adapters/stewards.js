// Adapter for the steward lane -- the BBS surface that advances a permanent
// steward by one cycle (consuming its pending TRICKSTER grants). Mirrors
// adapters/worker.js: every call returns { ok, ... } and never throws; the
// deck renders inline errors. 404 / 409 / 400 are structured outcomes, not
// thrown.

export async function fetchStewards() {
  try {
    const res = await fetch('/api/stewards', { headers: { Accept: 'application/json' } });
    if (!res.ok) return { ok: false, status: res.status, error: `http ${res.status}` };
    return { ok: true, ...(await res.json()) };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export async function advanceSteward(name) {
  try {
    const res = await fetch('/api/steward/advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export async function advanceAllStewards(names) {
  try {
    const res = await fetch('/api/stewards/advance-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(names ? { names } : {}),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}
