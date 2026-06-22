// src/adapters/weave.js — the Weave's client write surface.
//
//   applyWeaveProposal  -> POST /api/weave/apply: execute a granted proposal's
//     `apply` op against the live entry. On any failure the grant still stands
//     (it was already posted) — the UI reports the apply didn't land, never that
//     the decision was lost.
//   emitUnsungAudit     -> POST /api/weave/emit-unsung: run the unsung-path
//     audit. DRY-RUN by default (read-only, honest counts); dryRun:false seeds
//     promote_unsung proposals onto the WEAVE board (they arrive via SSE).

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

export async function emitUnsungAudit({ dryRun = true, limit } = {}) {
  try {
    const res = await fetch('/api/weave/emit-unsung', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun, ...(Number.isFinite(limit) ? { limit } : {}) }),
    });
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON body */ }
    if (res.ok && data.ok) return { ok: true, ...data };
    return {
      ok: false,
      status: res.status,
      error: data.error || `audit failed (${res.status})`,
    };
  } catch (err) {
    return { ok: false, status: 0, error: err.message || 'could not reach the server' };
  }
}

export async function emitHubAudit({ dryRun = true, limit } = {}) {
  try {
    const res = await fetch('/api/weave/emit-hub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun, ...(Number.isFinite(limit) ? { limit } : {}) }),
    });
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON body */ }
    if (res.ok && data.ok) return { ok: true, ...data };
    return {
      ok: false,
      status: res.status,
      error: data.error || `audit failed (${res.status})`,
    };
  } catch (err) {
    return { ok: false, status: 0, error: err.message || 'could not reach the server' };
  }
}

// The GENERATIVE audit. Dry run is a cheap scan (candidate counts, no model
// call); dryRun:false GENERATES a sharper forward_vector per candidate then
// posts vector_tuning proposals to the WEAVE board (slower — one LLM call each).
export async function emitVectorTuningAudit({ dryRun = true, limit } = {}) {
  try {
    const res = await fetch('/api/weave/emit-vector-tuning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun, ...(Number.isFinite(limit) ? { limit } : {}) }),
    });
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON body */ }
    if (res.ok && data.ok) return { ok: true, ...data };
    return {
      ok: false,
      status: res.status,
      error: data.error || `audit failed (${res.status})`,
    };
  } catch (err) {
    return { ok: false, status: 0, error: err.message || 'could not reach the server' };
  }
}
