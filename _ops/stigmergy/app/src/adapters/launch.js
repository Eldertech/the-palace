// src/adapters/launch.js — POST a prompt to open an interactive Claude Code
// session in a real terminal (the server spawns Terminal.app via osascript).
// The client side of /api/launch. On any failure the UI keeps "copy prompt" as
// the fallback; a 501 (non-macOS) comes back with supported:false so the UI can
// say so plainly.

export async function launchInteractiveSession(prompt) {
  try {
    const res = await fetch('/api/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON body */ }
    if (res.ok && data.launched) return { ok: true, ...data };
    return {
      ok: false,
      status: res.status,
      supported: data.supported !== false,
      error: data.error || `launch failed (${res.status})`,
    };
  } catch (err) {
    return { ok: false, status: 0, supported: true, error: err.message || 'could not reach the server' };
  }
}

// Construct a steward as a page-agent (POST /api/launch/agent). previewAgent
// returns the tiered construction + the assembled prompt without launching, so
// the panel can show how the agent is built; launchAgent opens the terminal on
// it. A 404 (registered:false) means the page isn't a permanent steward — the
// caller should fall back to the simpler launch.
export async function previewAgent({ home, mandate, include }) {
  try {
    const res = await fetch('/api/launch/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home, mandate, include, preview: true }),
    });
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON */ }
    if (res.ok) return { ok: true, ...data };
    return {
      ok: false,
      status: res.status,
      registered: data.registered !== false,
      error: data.error || `preview failed (${res.status})`,
    };
  } catch (err) {
    return { ok: false, status: 0, registered: true, error: err.message || 'could not reach the server' };
  }
}

export async function launchAgent({ home, mandate, model, effort, include }) {
  try {
    const res = await fetch('/api/launch/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home, mandate, model, effort, include }),
    });
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON */ }
    if (res.ok && data.launched) return { ok: true, ...data };
    return {
      ok: false,
      status: res.status,
      supported: data.supported !== false,
      error: data.error || `launch failed (${res.status})`,
    };
  } catch (err) {
    return { ok: false, status: 0, supported: true, error: err.message || 'could not reach the server' };
  }
}
