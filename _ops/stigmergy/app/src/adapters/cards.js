// Adapter for the Enrichment card queue (Phase 4.5). Returns { ok, ... }
// shapes; never throws -- the panel renders an inline error band on failure.

export async function fetchCards() {
  try {
    const res = await fetch('/api/cards', { headers: { Accept: 'application/json' } });
    if (!res.ok) return { ok: false, status: res.status, error: `http ${res.status}` };
    return { ok: true, ...(await res.json()) };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

// Respond to a card: writes the inbox block server-side and fires the
// supervisor worker through the actuator. `action` is one of
// deposit|revise|discard|tweak-vector|graffiti|more-like-this.
export async function respondToCard({ cardId, action, note, targetName, purpose }) {
  try {
    const res = await fetch('/api/cards/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ cardId, action, note, targetName, purpose }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}
