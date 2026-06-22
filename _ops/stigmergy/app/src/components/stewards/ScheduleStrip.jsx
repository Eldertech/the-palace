import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button } from '../primitives.jsx';
import { fetchSchedulerStatus, setSchedulerPaused } from '../../adapters/scheduler.js';

// The STEWARDS deck's "schedule strip": the watch-and-steer surface for the
// Mac-side heartbeat scheduler (the launchd jobs in _ops/heartbeat/). It is the
// honest window onto an otherwise invisible cron — and right now its honest
// first message is "NOT INSTALLED". STIGMERGY never calls launchctl; this reads
// the filesystem (server/scheduler.js) and steers with one .paused flag-file.

// Coarse, glanceable age. Exported for the unit test.
export function formatAge(hours) {
  if (!Number.isFinite(hours)) return '—';
  if (hours < 1) return '<1h ago';
  if (hours < 48) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const STATE_META = {
  not_installed:       { label: 'NOT INSTALLED', color: 'var(--error)', loud: true },
  paused:              { label: 'PAUSED',         color: 'var(--warn)',  loud: true },
  installed_never_run: { label: 'never run',      color: 'var(--warn)',  loud: false },
  scheduled:           { label: 'scheduled',      color: 'var(--phosphor)', loud: true },
};

// The per-job state pill. Exported for the unit test.
export function JobStateBadge({ state }) {
  const m = STATE_META[state] || { label: state || 'unknown', color: 'var(--phosphor-dim)', loud: false };
  return (
    <span
      data-testid={`scheduler-state-${state}`}
      style={{
        border: `1px solid ${m.color}`, color: m.color,
        textShadow: m.loud ? 'var(--glow)' : 'none',
        padding: '0 6px', fontSize: 11, fontFamily: 'var(--font-mono)',
        letterSpacing: '.05em', textTransform: 'uppercase',
      }}
    >{m.label}</span>
  );
}

// One launchd job's line. Exported for the unit test.
export function JobLine({ job }) {
  const cad = job.cadence?.human || 'cadence unknown';
  return (
    <div
      data-testid={`scheduler-job-${job.kind}`}
      style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '2px 0', opacity: job.primary ? 1 : 0.7 }}
    >
      <span style={{ color: 'var(--link)', textShadow: 'var(--glow)' }}>{job.title}</span>
      <JobStateBadge state={job.state} />
      <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>{cad}</span>
      <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>last: {formatAge(job.last_run?.age_hours)}</span>
      {job.next_fire ? (
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>
          next: {new Date(job.next_fire).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          {job.next_fire_would_skip_guard ? ' (guard may skip)' : ''}
        </span>
      ) : null}
    </div>
  );
}

// The loud warnings — the surface's whole point is to NOT bury these. Exported
// for the unit test. No emoji (BBS is monospace phosphor); a `!!` marker + the
// error color carry the alarm.
export function SchedulerWarnings({ warnings }) {
  if (!warnings || warnings.length === 0) return null;
  return (
    <div data-testid="scheduler-warnings" style={{ marginBottom: 6 }}>
      {warnings.map((w, i) => (
        <div key={i} style={{ color: 'var(--error)', textShadow: 'var(--glow)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
          !! {w}
        </div>
      ))}
    </div>
  );
}

export default function ScheduleStrip() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showDigest, setShowDigest] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const refresh = useCallback(async () => {
    const r = await fetchSchedulerStatus();
    if (r.ok) setData(r);
    else setData((prev) => prev ?? { error: r.error, jobs: [], warnings: [] });
  }, []);

  useEffect(() => {
    refresh();
    // Scheduler state changes slowly (a daily cron), so poll gently.
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  const jobs = data?.jobs ?? [];
  const warnings = data?.warnings ?? [];
  const paused = !!data?.paused;
  const digest = data?.digest;

  async function togglePause() {
    if (!data) return;
    setBusy(true);
    setFeedback(null);
    const r = await setSchedulerPaused(!paused);
    if (r.ok) setFeedback({ tone: 'ok', text: r.paused ? 'heartbeat paused — runs no-op until resumed' : 'heartbeat resumed' });
    else setFeedback({ tone: 'err', text: r.error || r.msg || 'pause toggle failed' });
    setBusy(false);
    refresh();
  }

  const fbColor = { ok: 'var(--phosphor)', err: 'var(--error)' };

  return (
    <div data-testid="schedule-strip" style={{ marginBottom: 12 }}>
      <Box title="HEARTBEAT SCHEDULER  --  watch + steer (no launchctl)" tone="single">
        {data?.error ? (
          <div style={{ color: 'var(--error)', textShadow: 'var(--glow)', fontSize: 12 }}>
            failed to load scheduler: {data.error}
          </div>
        ) : null}

        <SchedulerWarnings warnings={warnings} />

        {jobs.length === 0 && !data?.error ? (
          <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12 }}>reading scheduler state…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {jobs.map((j) => <JobLine key={j.kind} job={j} />)}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          <Button tone={paused ? 'warn' : 'default'} disabled={busy || !data} onClick={togglePause}>
            <span data-testid="scheduler-pause-toggle">{paused ? 'resume heartbeat' : 'pause heartbeat'}</span>
          </Button>
          {paused && data?.paused_since ? (
            <span style={{ color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 11 }}>paused {formatAge(ageHours(data.paused_since, data.generated_at))}</span>
          ) : null}
          {digest?.exists ? (
            <Button tone="default" onClick={() => setShowDigest((s) => !s)}>
              <span data-testid="digest-toggle">{showDigest ? 'hide digest' : `digest · ${formatAge(digest.age_hours)}`}</span>
            </Button>
          ) : (
            <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>no digest yet</span>
          )}
        </div>

        {feedback ? (
          <div style={{ color: fbColor[feedback.tone], textShadow: 'var(--glow)', fontSize: 12, marginTop: 6 }} data-testid="scheduler-feedback">
            {feedback.text}
          </div>
        ) : null}

        {showDigest && digest?.markdown ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, marginBottom: 4 }}>
              {digest.path} · {digest.run_label || 'run date unknown'} · {formatAge(digest.age_hours)}
            </div>
            <pre data-testid="digest-markdown" style={{ margin: 0, color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, whiteSpace: 'pre-wrap', maxHeight: 280, overflow: 'auto' }}>
              {digest.markdown}
            </pre>
          </div>
        ) : null}

        {data?.note ? (
          <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10, marginTop: 8, opacity: 0.75 }}>{data.note}</div>
        ) : null}
      </Box>
    </div>
  );
}

// hours between two ISO timestamps (paused_since vs the status snapshot). Local
// helper, not exported — formatAge does the display.
function ageHours(sinceIso, nowIso) {
  const since = Date.parse(sinceIso);
  const now = nowIso ? Date.parse(nowIso) : Date.now();
  if (!Number.isFinite(since) || !Number.isFinite(now)) return null;
  return (now - since) / 3.6e6;
}
