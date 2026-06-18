// src/adapters/weave.js — apply a granted Weave proposal (POST /api/weave/apply).
//
// The client side of the executor. When the operator clicks "grant & apply" on a
// proposal that carries a structured `apply` op, the QUEUE posts the grant and
// then calls this to execute the change against the live entry. On any failure
// the grant still stands (it was already posted) — the UI reports that the apply
// did not land, never that the decision was lost.

export async function applyWeaveProposal({ apply, proposalId }) {
  try {
    const res = await fetch('/api/weave/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apply, proposalId }),
    });
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON body */ }
    if (res.ok && data.ok) return { ok: true, ...data };
    return {
      ok: false,
      status: res.status,
      error: data.error || `apply failed (${res.status})`,
    };
  } catch (err) {
    return { ok: false, status: 0, error: err.message || 'could not reach the server' };
  }
}
