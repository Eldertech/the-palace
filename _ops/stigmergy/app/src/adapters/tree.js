// Adapter for the STATE deck's TREE lens.
//
// fetchTree() pulls the folder-structure tree from GET /api/tree. Returns null
// on network/HTTP failure rather than throwing — the lens renders an inline
// error band instead of a runtime exception (same contract as fetchEntries).

export async function fetchTree() {
  try {
    const res = await fetch('/api/tree', { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `http ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}
