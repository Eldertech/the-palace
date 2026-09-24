import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Button } from '../primitives.jsx';
import { fetchScroll, saveStandingOrders } from '../../adapters/projects.js';
import { parseMakingSections } from '../../lib/scroll-view.js';
import { buildInbox } from '../../lib/inbox.js';
import EntryBody from '../state/EntryBody.jsx';
import ArtifactSlot from '../ArtifactSlot.jsx';
import TricksterCard from '../trickster/TricksterCard.jsx';
import AgentLaunchModal from '../queue/AgentLaunchModal.jsx';
import { usePalaceRef } from '../../lib/palace-ref.jsx';
import { RunningTag } from './status.jsx';

// ScrollView — one project's scroll, rendered live in the terminal.
//
//   Now              — the regenerated top zone (server computes it on every
//                      fetch, so an answer Loudon filed a minute ago already
//                      shows as "ready to advance").
//   Open asks        — the project's pending TRICKSTER cards, answerable here
//                      with the same TricksterCard the TRICKSTER deck uses
//                      (one card component, one grant builder — no fork).
//   Standing Orders  — Loudon's zone, editable here and nowhere else in the
//                      terminal; saved to the scroll file, read by the steward
//                      at the top of every cycle.
//   The making       — the trail, newest first, each section's media inline.
//
// The scroll text is markdown; EntryBody (the STATE deck's renderer) draws it
// so headings, lists, tables, links and wikilinks read the same everywhere.

function ZoneTitle({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, borderBottom: '1px solid var(--phosphor-dim)', margin: '14px 0 8px', paddingBottom: 2 }}>
      <span style={{ fontFamily: 'var(--font-display)', color: 'var(--phosphor-white)', textShadow: 'var(--glow)', fontSize: 18, textTransform: 'uppercase', letterSpacing: '.04em' }}>{children}</span>
      <span style={{ flex: 1 }} />
      {right}
    </div>
  );
}

export default function ScrollView({ home, row, worker, messages = [], onConfirmed, onBack, onAdvance, canAdvance, feedback, onEnchant, canEnchant }) {
  const [confirmEnchant, setConfirmEnchant] = useState(false);
  const [scroll, setScroll] = useState(null);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState('');
  const [ordersDirty, setOrdersDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [launch, setLaunch] = useState(false);
  const palace = usePalaceRef();
  useEffect(() => { palace?.ensureLoaded?.(); }, [palace?.ensureLoaded]);

  const load = useCallback(async () => {
    const r = await fetchScroll(home);
    if (!r.ok) { setError(r.error || 'could not load the scroll'); return; }
    setError(null);
    setScroll(r);
    setOrders((cur) => (ordersDirty ? cur : (r.zones?.orders || '')));
  }, [home, ordersDirty]);

  useEffect(() => { load(); }, [load]);
  // Re-read the Now zone as the board moves (a filed grant, a cycle landing).
  useEffect(() => {
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  const myAsks = useMemo(() => buildInbox(messages).pending_requests.filter((p) => p.from === home), [messages, home]);
  const sections = useMemo(() => parseMakingSections(scroll?.zones?.making || ''), [scroll]);
  const index = palace?.index || new Map();
  const refIndex = palace?.refIndex || null;
  const onNavigate = palace?.openEntryInState || null;
  const running = !!(worker && worker.running && worker.current === home);

  async function doSave() {
    setSaving(true); setSaved(null);
    const r = await saveStandingOrders(home, orders);
    if (r.ok) { setScroll(r); setOrdersDirty(false); setSaved({ tone: 'ok', text: `saved to ${r.path} — the steward reads it at its next cycle` }); }
    else setSaved({ tone: 'err', text: r.error || 'save failed' });
    setSaving(false);
  }

  const fbColor = { ok: 'var(--phosphor)', warn: 'var(--warn)', err: 'var(--error)', dim: 'var(--phosphor-dim)' };

  return (
    <div data-testid="scroll-view" data-home={home}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
        <span data-testid="scroll-back" onClick={onBack} style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)', cursor: 'pointer', border: '1px solid var(--phosphor-dim)', padding: '1px 8px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em' }}>← projects</span>
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--phosphor-white)', textShadow: 'var(--glow-strong)', fontSize: 24, textTransform: 'uppercase' }}>{home}</span>
        {row ? <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>{row.status || '—'} · {row.stage || '—'}{row.stewarded ? ` · cycle ${row.iteration ?? 0}` : ' · no steward'}</span> : null}
        {running ? <RunningTag name={home} /> : null}
        <span style={{ flex: 1 }} />
        {row && row.stewarded ? (
          <>
            <span data-testid={`steward-launch-${String(home).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}><Button tone="default" disabled={running} onClick={() => setLaunch(true)}>launch interactive</Button></span>
            <span data-testid="scroll-advance"><Button tone="primary" disabled={!canAdvance} onClick={onAdvance}>advance (run up to {row.run_cap || 1})</Button></span>
          </>
        ) : row && onEnchant ? (confirmEnchant ? (
          <>
            <span style={{ color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 11 }}>give {home} a steward?</span>
            <span data-testid="scroll-enchant-confirm"><Button tone="primary" disabled={!canEnchant} onClick={() => { setConfirmEnchant(false); onEnchant(); }}>confirm</Button></span>
            <Button tone="default" onClick={() => setConfirmEnchant(false)}>cancel</Button>
          </>
        ) : (
          <span data-testid="scroll-enchant"><Button tone="primary" disabled={!canEnchant} onClick={() => setConfirmEnchant(true)}>enchant a steward</Button></span>
        )) : null}
        {scroll ? <a href={`/api/open?path=${encodeURIComponent(scroll.path)}`} style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, textDecoration: 'none', borderBottom: '1px dashed currentColor' }} title={scroll.path}>{scroll.exists ? 'open the file' : 'not on disk yet — first cycle or save creates it'}</a> : null}
      </div>
      {feedback ? <div style={{ color: fbColor[feedback.tone], textShadow: feedback.tone === 'dim' ? 'none' : 'var(--glow)', fontSize: 12, marginBottom: 8 }}>{feedback.text}</div> : null}
      {error ? <div data-testid="scroll-error" style={{ color: 'var(--error)', textShadow: 'var(--glow)', border: '1px solid var(--error)', padding: 8 }}>{error}</div> : null}
      {!scroll && !error ? <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>loading the scroll…</div> : null}

      {scroll ? (
        <>
          <Box title={`NOW  --  regenerated ${scroll.ts ? scroll.ts.replace('T', ' ').slice(0, 16) + 'Z' : ''} · this zone is machine-owned`} tone="double">
            <div data-testid="scroll-now">
              <EntryBody body={scroll.zones.now.replace(/^## Now\s*/, '')} index={index} refIndex={refIndex} onNavigate={onNavigate} />
            </div>
          </Box>

          <ZoneTitle right={<span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>{myAsks.length ? 'answer here — same cards as the TRICKSTER deck' : 'nothing waiting on you'}</span>}>Open asks</ZoneTitle>
          <div data-testid="scroll-asks">
            {myAsks.length === 0 ? <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12 }}>none.</div> : null}
            {myAsks.map((p) => (
              <TricksterCard key={p.request_id || p.from + p.ts} item={p} onConfirmed={onConfirmed} onRun={() => {}} onLaunch={() => setLaunch(true)} />
            ))}
          </div>

          <ZoneTitle right={<span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>yours — the steward reads this before anything else, every cycle</span>}>Standing Orders</ZoneTitle>
          <div data-testid="scroll-orders">
            <textarea
              data-testid="scroll-orders-input"
              value={orders}
              onChange={(e) => { setOrders(e.target.value); setOrdersDirty(true); setSaved(null); }}
              placeholder="Taste, priorities, 'stop asking me about X', 'always prefer Y'. Write it once here instead of answering it every cycle."
              rows={Math.max(4, Math.min(16, (orders.match(/\n/g) || []).length + 2))}
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--phosphor-deep)', color: 'var(--phosphor)', textShadow: 'var(--glow)', border: '1px solid var(--phosphor-dim)', borderRadius: 0, fontFamily: 'var(--font-mono)', fontSize: 13, padding: 8, outline: 'none', caretColor: 'var(--phosphor-white)', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
              <span data-testid="scroll-orders-save"><Button tone="primary" disabled={saving || !ordersDirty} onClick={doSave}>{saving ? 'saving…' : 'save standing orders'}</Button></span>
              {ordersDirty ? <span style={{ color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 11 }}>unsaved</span> : null}
              {saved ? <span style={{ color: fbColor[saved.tone], textShadow: 'var(--glow)', fontSize: 11 }}>{saved.text}</span> : null}
            </div>
          </div>

          <ZoneTitle right={<span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>{sections.filter((s) => s.id).length} made thing{sections.filter((s) => s.id).length === 1 ? '' : 's'} · newest first</span>}>The making</ZoneTitle>
          <div data-testid="scroll-making" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sections.map((s, i) => (
              <div key={s.id || `free-${i}`} data-testid={s.id ? `scroll-entry-${s.id}` : undefined} style={{ borderLeft: s.id ? '2px solid var(--phosphor-dim)' : 'none', paddingLeft: s.id ? 10 : 0 }}>
                {s.heading ? <div style={{ color: 'var(--phosphor-white)', textShadow: 'var(--glow)', fontSize: 14, marginBottom: 4 }}>{s.heading}</div> : null}
                <EntryBody body={s.body} index={index} refIndex={refIndex} onNavigate={onNavigate} />
                {s.artifacts.length ? <ArtifactSlot payload={{ artifacts: s.artifacts }} /> : null}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {launch ? <AgentLaunchModal home={home} onClose={() => setLaunch(false)} /> : null}
    </div>
  );
}
