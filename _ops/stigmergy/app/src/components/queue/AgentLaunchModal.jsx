import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Banner } from '../primitives.jsx';
import { previewAgent, launchAgent, previewEphemeral, launchEphemeral } from '../../adapters/launch.js';

// AgentLaunchModal — CONSTRUCT a page as a page-agent, then launch it.
//
// The Pages-as-Agents counterpart to LaunchModal (which carries a raw prompt for
// a task). Here the server CONSTRUCTS the agent the way the canonical orchestrator
// cycle does — the home page injected as identity, its state + neighborhood-
// filtered board + history, the steward posture — via buildCyclePrompt(mode:
// 'interactive'). This panel makes that construction legible (by palace loading
// TIER) and exposes the Core knobs (model · effort · mandate) before opening a
// real Claude Code terminal on it.
//
// Two modes, same construction:
//   - 'steward'   (default) — a REGISTERED permanent steward; /api/launch/agent.
//                 Used from the Trickster + Stewards decks.
//   - 'ephemeral' — ANY canon page as a one-off; /api/launch/ephemeral. The page
//                 is brought to life and launched WITHOUT being registered (the
//                 registry is untouched). Used from the STATE deck's "enchant".
// Only the adapter pair + the header copy differ; the tiered build, the knobs, and
// the launch flow are shared.
//
// It previews on open (and on a debounced mandate change) so "view constructed
// prompt" always reflects what will actually wake. LAUNCH TERMINAL re-builds with
// the current knobs server-side and opens the TUI; copy is the fallback.

const MODELS = [
  { id: 'claude-opus-4-8', label: 'Opus 4.8' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
];
const EFFORTS = ['high', 'medium', 'xhigh', 'max', 'low'];
// The OPTIONAL Tier-3 context layers, toggleable (default on). Identity + state
// are not here — they are never toggled (they ARE the agent).
const LAYER_TOGGLES = [
  { key: 'board', label: 'board slice' },
  { key: 'history', label: 'recent history' },
  { key: 'pageChange', label: 'page-change' },
  { key: 'staging', label: 'staging arc' },
];

function ModalButton({ children, onClick, tone = 'default', disabled, testId }) {
  const fg = tone === 'primary' ? 'var(--phosphor-white)' : 'var(--phosphor)';
  const border = tone === 'primary' ? 'var(--phosphor)' : 'var(--phosphor-dim)';
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'transparent', color: disabled ? 'var(--phosphor-dim)' : fg,
        textShadow: disabled ? 'none' : 'var(--glow)',
        border: `1px solid ${border}`, padding: '4px 12px',
        fontFamily: 'var(--font-mono)', fontSize: 12, cursor: disabled ? 'default' : 'pointer',
        textTransform: 'uppercase', letterSpacing: '.05em',
      }}
    >{children}</button>
  );
}

function Select({ value, onChange, options, testId, disabled }) {
  return (
    <select
      data-testid={testId}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: 'var(--bg)', color: 'var(--phosphor)', textShadow: 'var(--glow)',
        border: '1px solid var(--phosphor-dim)', fontFamily: 'var(--font-mono)', fontSize: 12,
        padding: '2px 6px', borderRadius: 0, outline: 'none',
      }}
    >
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.id;
        const label = typeof o === 'string' ? o : o.label;
        return <option key={val} value={val}>{label}</option>;
      })}
    </select>
  );
}

export default function AgentLaunchModal({ home, mandateSeed = '', mode = 'steward', onClose }) {
  const isEphemeral = mode === 'ephemeral';
  // Same panel, different route: a registered steward vs. a one-off any-page wake.
  const doPreview = isEphemeral ? previewEphemeral : previewAgent;
  const doLaunch = isEphemeral ? launchEphemeral : launchAgent;
  const [model, setModel] = useState(MODELS[0].id);
  const [effort, setEffort] = useState('high');
  const [mandate, setMandate] = useState(mandateSeed);
  // Context-layer toggles — which OPTIONAL Tier-3 layers to inject. Default all
  // on (the canonical cycle). The identity (the page) + state are never toggled.
  const [include, setInclude] = useState({ board: true, history: true, pageChange: true, staging: true });
  const [preview, setPreview] = useState(null);   // { construction, prompt, cycle, stage }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchMsg, setLaunchMsg] = useState(null);
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef(null);
  const debounce = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Preview the construction on open and whenever the mandate settles (debounced)
  // — so the shown build + the "view prompt" always match what will wake.
  useEffect(() => {
    let alive = true;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const r = await doPreview({ home, mandate, include });
      if (!alive) return;
      if (r.ok) { setPreview(r); setError(null); }
      else { setError(r.registered === false ? `${home} isn't a registered steward.` : r.error); }
      setLoading(false);
    }, preview ? 400 : 0);
    return () => { alive = false; clearTimeout(debounce.current); };
  }, [home, mandate, include]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => { if (!launching) onClose(); }, [launching, onClose]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  const copy = useCallback(async () => {
    const text = preview?.prompt || '';
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { /* selectable in the <pre> */ }
  }, [preview]);

  const launch = useCallback(async () => {
    if (launching) return;
    setLaunching(true); setLaunchMsg(null); setError(null);
    const r = await doLaunch({ home, mandate, model, effort, include });
    if (r.ok) setLaunchMsg('opening a Claude Code terminal…');
    else setError(r.error);
    setLaunching(false);
  }, [launching, home, mandate, model, effort, include]);

  const construction = preview?.construction || null;
  const stage = preview?.stage;
  const cycle = preview?.cycle;

  return (
    <div
      data-testid="agent-launch-modal"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) handleClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, fontFamily: 'var(--font-mono)',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 800, margin: '0 16px', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        border: '3px double var(--phosphor-dim)', background: 'var(--bg)', overflow: 'hidden',
      }}>
        <div style={{ borderBottom: '3px double var(--phosphor-dim)', padding: '8px 12px', flexShrink: 0 }}>
          <Banner strong>{isEphemeral ? 'enchant page' : 'construct agent'}</Banner>
          <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12, marginTop: 2 }}>
            {isEphemeral ? 'bring ' : 'wake '}
            <span style={{ color: 'var(--link)', textShadow: 'var(--glow)' }}>{home}</span>
            {stage ? <span> — {stage}</span> : null}
            {isEphemeral
              ? ' to life — a one-off live session you watch + steer (not registered as a steward)'
              : <>{cycle ? <span> · cycle {cycle}</span> : null}{' '}as a page-agent you watch + steer</>}
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error ? (
            <div data-testid="agent-launch-error" style={{ border: '1px solid var(--error)', padding: '6px 10px', color: 'var(--error)', fontSize: 12, lineHeight: 1.5 }}>{error}</div>
          ) : null}

          {/* The construction, by palace loading TIER. */}
          <div>
            <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
              how this agent is built — palace tiers
            </div>
            {!construction && loading ? (
              <div style={{ color: 'var(--phosphor-dim)', fontSize: 12 }}>constructing…</div>
            ) : construction ? (
              <div data-testid="agent-tiers" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {construction.tiers.map((tr) => {
                  const injected = tr.loads === 'injected';
                  return (
                    <div key={tr.tier} data-testid={`agent-tier-${tr.tier}`} style={{
                      display: 'flex', gap: 8, alignItems: 'baseline',
                      fontSize: 12, lineHeight: 1.4,
                      color: injected ? 'var(--phosphor)' : 'var(--phosphor-dim)',
                      textShadow: injected ? 'var(--glow)' : 'none',
                    }}>
                      <span style={{ flex: '0 0 auto', fontWeight: 600, color: injected ? 'var(--phosphor-white)' : 'var(--phosphor-dim)' }}>T{tr.tier}</span>
                      <span style={{ flex: '0 0 78px' }}>{tr.name}</span>
                      <span style={{
                        flex: '0 0 auto', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase',
                        border: `1px solid ${injected ? 'var(--phosphor)' : 'var(--phosphor-dim)'}`, padding: '0 4px',
                        color: injected ? 'var(--phosphor-white)' : 'var(--phosphor-dim)',
                      }}>{injected ? 'inject' : 'floor'}</span>
                      <span style={{ flex: 1 }}>{tr.what}</span>
                    </div>
                  );
                })}
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--phosphor-dim)', textShadow: 'none', lineHeight: 1.5 }}>
                  <div><b style={{ color: 'var(--phosphor)' }}>posture</b> · {construction.posture}</div>
                  <div><b style={{ color: 'var(--phosphor)' }}>framing</b> · {construction.framing}</div>
                </div>
                {/* Context-layer toggles — trim the OPTIONAL Tier-3 layers. Steward
                    only: a woken page (ephemeral) has no board/state/staging layers
                    to trim — it wakes from itself, its desire, and its neighbors. */}
                {!isEphemeral ? (
                <div data-testid="agent-toggles" style={{ marginTop: 8, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--phosphor-dim)', textShadow: 'none', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    context layers
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--phosphor-dim)', textShadow: 'none', border: '1px solid var(--phosphor-dim)', padding: '0 4px' }} title="the identity and state are always injected — they are the agent">
                    identity + state · locked
                  </span>
                  {LAYER_TOGGLES.map((tg) => (
                    <label
                      key={tg.key}
                      data-testid={`agent-toggle-${tg.key}`}
                      style={{
                        display: 'inline-flex', gap: 5, alignItems: 'center', fontSize: 11, cursor: launching ? 'default' : 'pointer',
                        color: include[tg.key] ? 'var(--phosphor)' : 'var(--phosphor-dim)',
                        textShadow: include[tg.key] ? 'var(--glow)' : 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={include[tg.key]}
                        disabled={launching}
                        onChange={() => setInclude((p) => ({ ...p, [tg.key]: !p[tg.key] }))}
                      />
                      {tg.label}
                    </label>
                  ))}
                </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* The Core knobs. */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 11, color: 'var(--phosphor-dim)', textShadow: 'none', textTransform: 'uppercase', letterSpacing: '.05em', display: 'flex', gap: 6, alignItems: 'center' }}>
              model <Select value={model} onChange={setModel} options={MODELS} testId="agent-model" disabled={launching} />
            </label>
            <label style={{ fontSize: 11, color: 'var(--phosphor-dim)', textShadow: 'none', textTransform: 'uppercase', letterSpacing: '.05em', display: 'flex', gap: 6, alignItems: 'center' }}>
              effort <Select value={effort} onChange={setEffort} options={EFFORTS} testId="agent-effort" disabled={launching} />
            </label>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--phosphor-dim)', textShadow: 'none', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>mandate — this session's focus</div>
            <textarea
              data-testid="agent-mandate"
              value={mandate}
              onChange={(e) => setMandate(e.target.value)}
              placeholder="leave blank for the standard next-cycle mandate"
              rows={2}
              disabled={launching}
              style={{
                width: '100%', background: 'transparent', color: 'var(--phosphor)', textShadow: 'var(--glow)',
                border: '1px dashed var(--phosphor-dim)', fontFamily: 'var(--font-mono)', fontSize: 12,
                padding: '5px 8px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', caretColor: 'var(--phosphor-white)',
              }}
            />
          </div>

          {/* Full transparency: the exact constructed prompt. */}
          {construction ? (
            <details data-testid="agent-prompt-fold" open={showPrompt} onToggle={(e) => setShowPrompt(e.currentTarget.open)}>
              <summary style={{ cursor: 'pointer', color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                ▸ view constructed prompt {loading ? '(updating…)' : ''}
              </summary>
              <pre data-testid="agent-prompt" style={{
                margin: '8px 0 0', border: '1px solid var(--phosphor-dim)', padding: '10px',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                color: 'var(--phosphor)', textShadow: 'var(--glow)',
                fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.5, maxHeight: 300, overflowY: 'auto',
              }}>{preview?.prompt || ''}</pre>
            </details>
          ) : null}
        </div>

        <div style={{ borderTop: '1px solid var(--phosphor-dim)', padding: '8px 12px', display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0 }}>
          {launchMsg ? <span data-testid="agent-launch-ok" style={{ marginRight: 'auto', color: 'var(--phosphor)', textShadow: 'var(--glow)', fontSize: 12 }}>{launchMsg}</span> : null}
          <ModalButton tone="default" onClick={handleClose} disabled={launching} testId="agent-close">close</ModalButton>
          <ModalButton tone="default" onClick={copy} disabled={!preview} testId="agent-copy">{copied ? 'copied' : 'copy prompt'}</ModalButton>
          <ModalButton tone="primary" onClick={launch} disabled={launching || !preview} testId="agent-launch-terminal">
            {launching ? 'opening…' : 'launch terminal'}
          </ModalButton>
        </div>
      </div>
    </div>
  );
}
