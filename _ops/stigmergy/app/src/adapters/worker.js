// Adapter for the actuator (the fired `claude -p` worker). Returns
// { ok, ... } shapes; never throws -- the panel renders an inline error.

export async function fetchWorker() {
  try {
    const res = await fetch('/api/worker', { headers: { Accept: 'application/json' } });
    if (!res.ok) return { ok: false, status: res.status, error: `http ${res.status}` };
    return { ok: true, ...(await res.json()) };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export async function fireWorker(prompt) {
  try {
    const res = await fetch('/api/worker/fire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json().catch(() => ({}));
    // 409 (already running) and 400 (bad prompt) are expected, structured
    // outcomes -- surface them rather than treating them as throws.
    return { ok: res.ok, status: res.status, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}
