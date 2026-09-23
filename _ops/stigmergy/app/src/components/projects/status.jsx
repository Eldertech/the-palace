import React from 'react';

// Row-status primitives shared by the PROJECTS deck (moved from the retired
// StewardsDeck, 2026-09-23). The lane reports the live steward by agent_id in
// worker.current; a row keys on the same agent_id, so a direct compare marks
// the active row. Gated on worker.running so a stale `current` after a reap
// doesn't keep a row lit.

// testid-safe slug for a project name ("Semantic Delay" -> "semantic-delay").
export function slug(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function isStewardRunning(steward, worker) {
  return !!(worker && worker.running && steward && steward.agent_id
    && steward.agent_id === worker.current);
}

export function RunningTag({ name }) {
  return (
    <span
      data-testid={`steward-running-${slug(name)}`}
      data-running="true"
      style={{
        color: 'var(--ansi-bright-yellow)', textShadow: 'var(--glow)',
        fontSize: 11, fontFamily: 'var(--font-mono)',
        letterSpacing: '.05em', textTransform: 'uppercase',
      }}
    >● running</span>
  );
}

export function GrantsBadge({ n, name }) {
  if (!n) return <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }} data-testid={`steward-grants-${slug(name)}`}>0 waiting</span>;
  return (
    <span
      data-testid={`steward-grants-${slug(name)}`}
      style={{
        border: '1px solid var(--warn)', color: 'var(--warn)', textShadow: 'var(--glow)',
        padding: '0 6px', fontSize: 11, fontFamily: 'var(--font-mono)',
        letterSpacing: '.05em', textTransform: 'uppercase',
      }}
    >{n} ready</span>
  );
}

// The row's single status slot: "● running" while the lane is computing this
// steward's cycle, otherwise the grants-waiting badge.
export function RowStatus({ isRunning, grants_waiting, name }) {
  return isRunning
    ? <RunningTag name={name} />
    : <GrantsBadge n={grants_waiting} name={name} />;
}

export function StatusDot({ running, lastFire }) {
  let color = 'var(--phosphor-dim)';
  let label = 'idle';
  if (running) { color = 'var(--ansi-bright-yellow)'; label = 'STEWARD CYCLE ALIVE'; }
  else if (lastFire?.status === 'ok') { color = 'var(--phosphor)'; label = 'last cycle: ok'; }
  else if (lastFire?.status === 'failed') { color = 'var(--error)'; label = 'last cycle: FAILED'; }
  else if (lastFire?.status === 'inflight') { color = 'var(--ansi-bright-yellow)'; label = 'last cycle: in-flight'; }
  return (
    <span style={{ color, textShadow: 'var(--glow)' }} data-testid="worker-status" data-running={running ? 'true' : 'false'}>
      {running ? '●' : '○'} {label}
    </span>
  );
}
