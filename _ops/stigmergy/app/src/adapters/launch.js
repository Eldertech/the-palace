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
