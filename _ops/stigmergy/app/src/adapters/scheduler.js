// Adapter for the heartbeat scheduler watch-and-steer surface. Mirrors
// adapters/stewards.js: every call returns { ok, ... } and never throws; the
// strip renders inline errors. The two endpoints:
//   GET  /api/scheduler/status  — truthful launchd/heartbeat state (no launchctl)
//   POST /api/scheduler/pause   — toggle the global .paused flag-file

export async function fetchSchedulerStatus() {
  try {
    const res = await fetch('/api/scheduler/status', { headers: { Accept: 'application/json' } });
    if (!res.ok) return { ok: false, status: res.status, error: `http ${res.status}` };
    return { ok: true, ...(await res.json()) };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export async function setSchedulerPaused(paused) {
  try {
    const res = await fetch('/api/scheduler/pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ paused }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}
