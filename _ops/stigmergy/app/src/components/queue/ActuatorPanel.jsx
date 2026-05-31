import React, { useEffect, useState, useCallback } from 'react';
import { Box } from '../primitives.jsx';
import { fetchWorker, fireWorker } from '../../adapters/worker.js';

// The actuator made visible -- the keystone of v1.0 (Revision 2 §3): a QUEUE
// action that FIRES a headless `claude -p` worker, not just a queue you read.
// This is the minimal Phase 2.5 surface: a status line (idle / running / last
// fire verdict), a streaming log tail, and a guarded fire control. Phase 4.5
// wires real card actions through this same actuator; here it proves the
// mechanism end-to-end against the live server.

function StatusDot({ running, lastFire }) {
  let color = 'var(--phosphor-dim)';
  let label = 'idle';
  if (running) { color = 'var(--ansi-bright-yellow)'; label = 'WORKER ALIVE'; }
  else if (lastFire?.status === 'ok') { color = 'var(--phosphor)'; label = 'last fire: ok'; }
  else if (lastFire?.status === 'failed') { color = 'var(--error)'; label = 'last fire: FAILED'; }
  else if (lastFire?.status === 'inflight') { color = 'var(--ansi-bright-yellow)'; label = 'last fire: in-flight'; }
  return (
    <span style={{ color, textShadow: 'var(--glow)' }} data-testid="worker-status" data-running={running ? 'true' : 'false'}>
      {running ? '●' : '○'} {label}
    </span>
  );
}

export default function ActuatorPanel() {
  const [status, setStatus] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const r = await fetchWorker();
    if (r.ok) setStatus(r);
  }, []);

  useEffect(() => {
    refresh();
    // Poll while mounted -- cheap, and the worker is short-lived. A 2s cadence
    // keeps the status + log tail live without hammering the server.
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [refresh]);

  const onFire = async () => {
    if (prompt.trim() === '' || busy) return;
    setBusy(true);
    setFeedback(null);
    const r = await fireWorker(prompt);
    if (r.ok && r.fired) {
      setFeedback({ tone: 'ok', text: `fired (pid ${r.pid})` });
      setPrompt('');
    } else if (r.status === 409) {
      setFeedback({ tone: 'warn', text: r.msg || 'a worker is already running' });
    } else {
      setFeedback({ tone: 'err', text: r.error || r.msg || `fire failed (${r.status ?? '?'})` });
    }
    setBusy(false);
    refresh();
  };

  const running = status?.running ?? false;

  return (
    <Box title="ACTUATOR  --  fire a claude -p worker" tone="single">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
        <StatusDot running={running} lastFire={status?.lastFire} />
        {status?.pid ? <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>pid {status.pid}</span> : null}
        {status?.started ? <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>since {status.started.split('T')[1]?.slice(0, 8)}</span> : null}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <input
          data-testid="actuator-prompt"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onFire(); }}
          placeholder={running ? 'worker alive -- wait for it to finish' : 'worker prompt...'}
          disabled={running || busy}
          style={{
            flex: 1, minWidth: '24ch',
            background: 'transparent', border: 'none',
            borderBottom: '1px dashed var(--phosphor-dim)',
            color: 'var(--phosphor)', textShadow: 'var(--glow)',
            fontFamily: 'var(--font-mono)', fontSize: 13,
            outline: 'none', padding: '2px 0',
            opacity: running ? 0.5 : 1,
          }}
        />
        <span
          data-testid="actuator-fire"
          onClick={onFire}
          aria-disabled={running || busy || prompt.trim() === ''}
          style={{
            cursor: running || busy || prompt.trim() === '' ? 'not-allowed' : 'pointer',
            color: running || busy ? 'var(--fg3)' : 'var(--phosphor)',
            textShadow: running || busy ? 'none' : 'var(--glow)',
            border: `1px solid ${running || busy ? 'var(--fg3)' : 'var(--phosphor-dim)'}`,
            padding: '2px 10px', textTransform: 'uppercase', letterSpacing: '.05em', fontSize: 12,
          }}
        >
          [F] FIRE
        </span>
      </div>

      {feedback ? (
        <div
          data-testid="actuator-feedback"
          style={{
            fontSize: 12, marginBottom: 6,
            color: feedback.tone === 'ok' ? 'var(--phosphor)' : feedback.tone === 'warn' ? 'var(--warn)' : 'var(--error)',
            textShadow: 'var(--glow)',
          }}
        >
          {feedback.text}
        </div>
      ) : null}

      {status?.logTail?.length ? (
        <pre
          data-testid="actuator-log"
          style={{
            margin: 0, maxHeight: 160, overflowY: 'auto',
            border: '1px solid var(--phosphor-dim)', background: 'var(--bg)',
            color: 'var(--phosphor-dim)', textShadow: 'none',
            fontSize: 11, lineHeight: 1.4, padding: '6px 8px',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}
        >
          {status.logTail.join('\n')}
        </pre>
      ) : (
        <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>
          no worker log yet -- fire one to begin.
        </div>
      )}
    </Box>
  );
}
