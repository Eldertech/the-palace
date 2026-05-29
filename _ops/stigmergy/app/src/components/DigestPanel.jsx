import React, { useState, useEffect, useCallback } from 'react';
import { Box } from './primitives.jsx';
import {
  DIGEST_API_PATH, summarizeDigest, tierGroups, autoDecisions, isShadow,
} from '../lib/digest-view.js';

// DigestPanel — renders the Automated Trickster (Stage E) escalation digest:
// the palace's aggregated voice, ranked by how far out of phase each pending
// request is. The digest JSON is produced by the trickster-auto engine and
// served through the existing /api/file route — this panel only fetches and
// renders it. Fully DEFENSIVE: if no digest has been generated yet (404) or the
// fetch fails, it renders a quiet hint and never throws, so it cannot break the
// TRICKSTER board it sits above.

const DIM = 'var(--phosphor-dim)';
const FG = 'var(--phosphor)';
const HOT = 'var(--ansi-bright-cyan)';
const WARN = 'var(--warn, #f5a623)';

export default function DigestPanel() {
  const [digest, setDigest] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | absent | error
  const [open, setOpen] = useState(true);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch(DIGEST_API_PATH);
      if (res.status === 404) { setStatus('absent'); setDigest(null); return; }
      if (!res.ok) { setStatus('error'); return; }
      const data = await res.json();
      setDigest(data);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const summary = summarizeDigest(digest);

  return (
    <Box title="automated trickster · escalation digest" tone="double" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <div style={{ color: DIM, fontSize: 12 }}>
          {status === 'ready' && summary && (
            <span>
              <strong style={{ color: FG }}>{summary.pending}</strong> pending ·{' '}
              <strong style={{ color: WARN }}>{summary.escalate}</strong> for you ·{' '}
              <strong style={{ color: HOT }}>{summary.autoGrant}</strong> auto-grant
              {summary.autoDeny ? <> · {summary.autoDeny} auto-deny</> : null}
              {isShadow(digest) ? <span style={{ color: DIM }}> · shadow (proposals only)</span> : <span style={{ color: HOT }}> · live</span>}
            </span>
          )}
          {status === 'absent' && <span>no digest yet — run <code>trickster-auto</code> to generate one.</span>}
          {status === 'loading' && <span>loading digest…</span>}
          {status === 'error' && <span style={{ color: WARN }}>digest unavailable.</span>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={linkBtn}>refresh</button>
          <button onClick={() => setOpen((o) => !o)} style={linkBtn}>{open ? 'hide' : 'show'}</button>
        </div>
      </div>

      {open && status === 'ready' && digest && (
        <div style={{ marginTop: 10 }}>
          {tierGroups(digest).map((g) => (
            <div key={g.tier} style={{ marginBottom: 10 }}>
              <div style={{ color: WARN, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {g.tier}. {g.label}
              </div>
              <div style={{ color: DIM, fontSize: 11, fontStyle: 'italic', marginBottom: 4 }}>{g.signature}</div>
              {g.items.map((e) => (
                <div key={e.request_id} style={{ marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: HOT }}>#{e.rank}</span>{' '}
                  <span style={{ color: DIM }}>[{e.from}]</span>{' '}
                  <span style={{ color: FG }}>{e.headline}</span>
                  {e.blocking ? <span style={{ color: WARN }}> · blocking</span> : null}
                  <div style={{ color: DIM, fontSize: 11 }}>
                    <code>{e.request_id}</code> · {e.resource}
                    {Array.isArray(e.options) && e.options.length ? <> · {e.options.join(' / ')}</> : null}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {autoDecisions(digest).length > 0 && (
            <div style={{ marginTop: 8, borderTop: '1px dashed var(--phosphor-dim)', paddingTop: 6 }}>
              <div style={{ color: DIM, fontSize: 11, textTransform: 'uppercase' }}>
                {isShadow(digest) ? 'would auto-handle (proposed)' : 'auto-handled'}
              </div>
              {autoDecisions(digest).map((d) => (
                <div key={d.request_id} style={{ fontSize: 12, color: FG }}>
                  <span style={{ color: d.verb === 'auto-grant' ? HOT : WARN }}>{d.verb === 'auto-grant' ? 'grant' : 'deny'}</span>{' '}
                  <span style={{ color: DIM }}>[{d.from}]</span> <code>{d.request_id}</code>
                  {d.option_id ? <> → <span style={{ color: FG }}>{d.option_id}</span></> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Box>
  );
}

const linkBtn = {
  background: 'none', border: 'none', color: 'var(--ansi-bright-cyan)',
  cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, textDecoration: 'underline', padding: 0,
};
