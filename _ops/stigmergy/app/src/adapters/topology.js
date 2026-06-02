// Topology adapter — fetches the freshest palace-map-full-*.json via the
// server endpoint. Returns null on network/HTTP failure rather than
// throwing; the UI renders an inline error band instead.

export async function fetchTopology() {
  try {
    const res = await fetch('/api/topology', { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `http ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

// Unsung paths — body wikilinks not in YAML, computed live from the
// palace's current state (not from the dated map snapshot).
export async function fetchUnsungPaths() {
  try {
    const res = await fetch('/api/unsung-paths', { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `http ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}
