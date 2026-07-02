// src/adapters/launch.js — POST a prompt to open an interactive Claude Code
// session in a real terminal (the server stages a launcher and opens it in
// Terminal.app via `open`/LaunchServices — no Automation permission needed).
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

// Bring ANY canon page to life as a one-off (POST /api/launch/ephemeral). The
// twins of previewAgent/launchAgent, pointed at the ephemeral route: the server
// stages a throwaway agent dir and runs the SAME buildCyclePrompt, so the
// construction is identical to a registered steward's — only nothing is written to
// the registry. Works for any page with frontmatter, not just stewards (a 422
// `no_frontmatter` means a learning material, not a canon entry).
export async function previewEphemeral({ home, mandate, include, lensSubject }) {
  try {
    const res = await fetch('/api/launch/ephemeral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home, mandate, include, lensSubject, preview: true }),
    });
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON */ }
    if (res.ok) return { ok: true, ...data };
    return {
      ok: false,
      status: res.status,
      error: data.error || `preview failed (${res.status})`,
    };
  } catch (err) {
    return { ok: false, status: 0, error: err.message || 'could not reach the server' };
  }
}

// Ranked glass candidates for a lensing subject (GET /api/lens/suggest),
// nearest-by-link-distance first — [[The Lens]]'s "lean on the graph to
// suggest" design. A 404 (no Map Build snapshot yet) is not an error the UI
// needs to surface loudly; the picker just falls back to the unranked index.
export async function fetchLensSuggestions(subject, limit = 8) {
  try {
    const res = await fetch(`/api/lens/suggest?subject=${encodeURIComponent(subject)}&limit=${limit}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json();
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

// `lensSubject` runs this wake as [[The Lens]]: `home` (the glass) wakes fully
// as itself, then reads `lensSubject`'s page through its own apparatus per the
// fixed procedure in buildLensMandate. `mandate` here becomes an extra note on
// top of that procedure, same as previewEphemeral/launchEphemeral otherwise.
export async function launchEphemeral({ home, mandate, model, effort, include, lensSubject }) {
  try {
    const res = await fetch('/api/launch/ephemeral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home, mandate, model, effort, include, lensSubject }),
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
