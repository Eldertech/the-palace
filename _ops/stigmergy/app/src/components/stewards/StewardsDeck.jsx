import React, { useEffect, useState, useCallback } from 'react';
import { Banner, Box, Button, Tag } from '../primitives.jsx';
import { fetchStewards, advanceSteward, advanceAllStewards } from '../../adapters/stewards.js';

// testid-safe slug for a steward name ("Semantic Delay" -> "semantic-delay").
function slug(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function StatusDot({ running, lastFire }) {
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

// The yellow "N ready" badge -- matches the WORKER-ALIVE accent. (Tag has no
// 'warn' tone, so this is a small inline span.)
function GrantsBadge({ n, name }) {
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

// True when THIS steward is the one whose cycle the lane is actively computing.
// The lane tracks the live steward by agent_id in worker.current (steward-lane.js
// fireOne); the row keys on the same agent_id, so a direct compare marks the
// active row. Gated on worker.running so a stale `current` after a reap doesn't
// keep a row lit.
export function isStewardRunning(steward, worker) {
  return !!(worker && worker.running && steward && steward.agent_id
    && steward.agent_id === worker.current);
}

// The bright-yellow "● running" row marker — mirrors the lane's STEWARD CYCLE
// ALIVE accent so the steward mid-cycle reads at a glance.
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

// The row's single status slot: "● running" while the lane is computing this
// steward's cycle, otherwise the grants-waiting badge. One state, not two --
// while a cycle is live "running" is the truer signal than "N ready", and
// replacing (rather than adding) keeps the row uncluttered.
export function RowStatus({ isRunning, grants_waiting, name }) {
  return isRunning
    ? <RunningTag name={name} />
    : <GrantsBadge n={grants_waiting} name={name} />;
}

export default function StewardsDeck() {
  const [data, setData] = useState(null);
  const [pending, setPending] = useState(null);     // steward name awaiting confirm
  const [feedback, setFeedback] = useState(null);   // last action outcome
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const r = await fetchStewards();
    if (r.ok) setData(r);
    else setData((prev) => prev ?? { stewards: [], worker: {}, error: r.error });
  }, []);

  useEffect(() => {
    refresh();
    // Poll while mounted -- a cycle is short-lived relative to a 2s cadence, and
    // this keeps grants_waiting / batch progress live without hammering.
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [refresh]);

  const stewards = data?.stewards ?? [];
  const worker = data?.worker ?? {};
  const running = !!worker.running;
  const batch = worker.batch ?? { total: 0, done: 0, remaining: 0 };
  const readyCount = stewards.filter((s) => !s.missing && s.grants_waiting > 0).length;

  async function doAdvance(name) {
    setBusy(true);
    setFeedback(null);
    setPending(null);
    const r = await advanceSteward(name);
    if (r.ok && r.fired) setFeedback({ tone: 'ok', text: `advancing ${name} -> cycle ${r.cycle_n}` });
    else if (r.status === 409 || r.busy) setFeedback({ tone: 'warn', text: 'a steward cycle is already running' });
    else if (r.status === 404) setFeedback({ tone: 'err', text: `unknown steward "${name}"` });
    else setFeedback({ tone: 'err', text: r.error || r.msg || `advance failed (${r.status ?? '?'})` });
    setBusy(false);
    refresh();
  }

  async function doAdvanceAll() {
    setBusy(true);
    setFeedback(null);
    setPending(null);
    const r = await advanceAllStewards();
    if (r.ok && Array.isArray(r.queued) && r.queued.length) setFeedback({ tone: 'ok', text: `advancing ${r.queued.length} steward(s): ${r.queued.join(', ')}` });
    else if (r.status === 409 || r.busy) setFeedback({ tone: 'warn', text: 'a steward cycle is already running' });
    else if (r.ok) setFeedback({ tone: 'dim', text: 'no stewards have grants waiting' });
    else setFeedback({ tone: 'err', text: r.error || r.msg || `advance-all failed (${r.status ?? '?'})` });
    setBusy(false);
    refresh();
  }

  const fbColor = { ok: 'var(--phosphor)', warn: 'var(--warn)', err: 'var(--error)', dim: 'var(--phosphor-dim)' };

  return (
    <div data-testid="stewards-screen" style={{ width: '100%' }}>
      <Banner as="h1" strong style={{ fontSize: 32, margin: '0 0 4px' }}>
        stewards -- advance who waits
      </Banner>
      <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 10, fontSize: 13 }}>
        {stewards.length} registered &middot; {readyCount} with grants waiting.
        {data?.stubbed ? <span style={{ color: 'var(--warn)', textShadow: 'var(--glow)', marginLeft: 10 }}>&middot; stub worker (no live cycle)</span> : null}
      </div>

      {/* Batch controls + lane status */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <Button
          hot="W"
          tone="primary"
          disabled={running || busy || readyCount === 0}
          onClick={doAdvanceAll}
        >
          <span data-testid="advance-all">advance all ready ({readyCount})</span>
        </Button>
        <StatusDot running={running} lastFire={worker.lastFire} />
        {worker.pid ? <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>pid {worker.pid}</span> : null}
        {running && batch.total > 0 ? (
          <span data-testid="batch-progress" style={{ color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 12 }}>
            advancing {worker.current || '…'} &middot; {batch.done}/{batch.total} ({batch.remaining} queued)
          </span>
        ) : null}
      </div>

      {feedback ? (
        <div style={{ color: fbColor[feedback.tone], textShadow: feedback.tone === 'dim' ? 'none' : 'var(--glow)', fontSize: 12, marginBottom: 8 }}>
          {feedback.text}
        </div>
      ) : null}

      <Box title="STEWARDS  --  press W to advance all ready" tone="single">
        {stewards.length === 0 ? (
          <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
            {data?.error ? `failed to load stewards: ${data.error}` : 'no registered stewards.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stewards.map((s) => {
              const sid = slug(s.agent_id);
              const confirming = pending === s.agent_id;
              const canAdvance = !s.missing && !running && !busy && s.grants_waiting > 0;
              const isRunning = isStewardRunning(s, worker);
              return (
                <div
                  key={s.agent_id}
                  data-testid={`steward-row-${sid}`}
                  data-running={isRunning ? 'true' : 'false'}
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'nowrap', padding: '3px 0', borderBottom: '1px solid var(--fg4, rgba(31,138,60,.25))' }}
                >
                  <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--link)', textShadow: 'var(--glow)' }}>@{s.agent_id}</span>
                    {s.missing ? (
                      <Tag tone="err">missing state</Tag>
                    ) : (
                      <>
                        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>{s.stage || '—'}</span>
                        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>cyc {s.iteration}</span>
                        <Tag tone={s.health === 'green' ? 'ok' : s.health === 'red' ? 'err' : 'default'}>{s.health || '—'}</Tag>
                        <RowStatus isRunning={isRunning} grants_waiting={s.grants_waiting} name={s.agent_id} />
                      </>
                    )}
                  </div>
                  {!s.missing && (
                    <div style={{ flex: '0 0 auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '58%' }}>
                      {confirming ? (
                        <>
                          <span style={{ color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 12 }}>
                            advance to cycle {s.iteration + 1}? consumes {s.grants_waiting} grant(s)
                          </span>
                          <span data-testid={`steward-confirm-${sid}`}>
                            <Button tone="primary" disabled={busy} onClick={() => doAdvance(s.agent_id)}>confirm</Button>
                          </span>
                          <Button tone="default" disabled={busy} onClick={() => setPending(null)}>cancel</Button>
                        </>
                      ) : (
                        <span data-testid={`steward-advance-${sid}`}>
                          <Button tone="default" disabled={!canAdvance} onClick={() => setPending(s.agent_id)}>advance</Button>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Box>

      {/* Lane log tail + last reap summary */}
      {(worker.logTail?.length || worker.last_cycle) ? (
        <div style={{ marginTop: 10 }}>
          <Box title="LANE  --  worker log" tone="single">
            {worker.last_cycle ? (
              <div style={{ color: worker.last_cycle.ok ? 'var(--phosphor)' : 'var(--error)', textShadow: 'var(--glow)', fontSize: 12, marginBottom: 6 }}>
                last cycle: {worker.last_cycle.ok ? 'ok' : 'FAILED'}
                {worker.last_cycle.name ? ` · ${worker.last_cycle.name}` : ''}
                {worker.last_cycle.posted_ids ? ` · posted ${worker.last_cycle.posted_ids.length}` : ''}
                {typeof worker.last_cycle.resolved_count_after === 'number' ? ` · resolved ${worker.last_cycle.resolved_count_after}` : ''}
                {worker.last_cycle.error ? ` · ${worker.last_cycle.error}` : ''}
              </div>
            ) : null}
            {worker.logTail?.length ? (
              <pre style={{ margin: 0, color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}>
                {worker.logTail.join('\n')}
              </pre>
            ) : null}
          </Box>
        </div>
      ) : null}
    </div>
  );
}
