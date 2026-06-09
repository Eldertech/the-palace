// Adapter for the entry-agent ("Companion") window.
//
// fetchGrounding(relPath) pulls the open entry's grounding (page + typed-link
// neighborhood + palace floor) from GET /api/entry-agent/ground. Returns null-
// shaped { ok:false } on failure rather than throwing — the window falls back to
// its frontmatter-derived stub readout so it never breaks the deck.

// POST /api/entry-agent/turn — fire one Companion turn.
// Body: { context, message, history?, focus?, section? }. Returns { ok, fired, turnId, busy?, msg }.
// `context` is the resolved grounding descriptor ({kind:'entry',path} | {kind:
// 'app_feedback',deck} | …); a bare `path` is still accepted (entry kind) for
// back-compat. `focus` is the passage the user pinned with "discuss this".
// `section` is the entry section the window's scroll-spy floats over right now
// (the heading text, or null at the top) — entry kind only; it lets the worker
// answer deictic "what are we over?" from position instead of guessing. The
// reply does NOT come back here — it arrives later on the board (a
// companion_reply BROADCAST) which the window reads over SSE.
export async function postTurn({ context, path, message, history, focus, section } = {}) {
  try {
    const res = await fetch('/api/entry-agent/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        context: context || null,
        path: path || (context && context.kind === 'entry' ? context.path : null),
        message, history: history || [], focus: focus || null,
        // Preserve the null-vs-absent distinction: null = "at the top, no
        // section"; absent = "not an entry turn / position unknown".
        ...(section === undefined ? {} : { section }),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, fired: false, status: res.status, ...data };
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, fired: false, error: err?.message ?? String(err) };
  }
}

// POST /api/entry-agent/apply — commit an APPROVED proposed edit to the live
// entry. Body: { path, op, turnId }. Returns { ok, commit?, msg? }. The committed
// marker arrives on the board (a companion_edit PROOF on the same turn) over SSE,
// which the window swaps the proposal card for — like the edit/undo paths.
export async function postApply({ path, op, turnId } = {}) {
  try {
    const res = await fetch('/api/entry-agent/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ path, op, turnId: turnId || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, ...data };
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

// POST /api/entry-agent/undo — revert a committed Companion edit.
// Body: { path, commit, turnId }. Returns { ok, revertHash?, reverts?, msg? }.
// The revert marker does NOT come back here — it arrives on the board (a revert
// PROOF on the same turn) which the window reads over SSE, like the edit itself.
export async function postUndo({ path, commit, turnId } = {}) {
  try {
    const res = await fetch('/api/entry-agent/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ path, commit, turnId: turnId || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, ...data };
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export async function fetchGrounding(relPath) {
  if (typeof relPath !== 'string' || relPath === '') {
    return { ok: false, error: 'missing path' };
  }
  try {
    const res = await fetch(`/api/entry-agent/ground?path=${encodeURIComponent(relPath)}`, {
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
