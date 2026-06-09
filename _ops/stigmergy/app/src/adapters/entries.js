// Adapter for the STATE deck's data fetches.
//
// fetchEntries() pulls the recursive index from GET /api/entries.
// fetchEntry(relPath) pulls one entry's full read shape from GET /api/entry.
// Both return null on network/HTTP failure rather than throwing — the UI
// renders an inline error band instead of a runtime exception.

export async function fetchEntries() {
  try {
    const res = await fetch('/api/entries', { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `http ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

// POST /api/entry/save — dry-run preview (Stage A).
// Body: { path, frontmatter, body, summary, verify, kind?, scope?, body_message?, author? }
// Returns { ok: true, preview } or { ok: false, status, error?, errors?, warnings? }.
// Never writes the file; never commits. Refused for canon / machinery paths.
export async function previewEntrySave(payload) {
  try {
    const res = await fetch('/api/entry/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, ...data };
    }
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

// POST /api/entry/trickster-save — the REAL write behind the form's Trickster
// Commit button. Body: { path, frontmatter, body, summary, body_message? }.
// Writes + commits the hand-edited entry as Palace-Author: trickster + verify:
// unverified, canon included (path-safety still applies). Returns
// { ok, shortHash, subject, wasAdded } or { ok:false, status, error }.
export async function tricksterSaveEntry(payload) {
  try {
    const res = await fetch('/api/entry/trickster-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, ...data };
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export async function fetchEntry(relPath) {
  if (typeof relPath !== 'string' || relPath === '') {
    return { ok: false, error: 'missing path' };
  }
  try {
    const res = await fetch(`/api/entry?path=${encodeURIComponent(relPath)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `http ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}
