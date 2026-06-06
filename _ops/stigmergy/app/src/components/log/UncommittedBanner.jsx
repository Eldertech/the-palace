import React, { useState, useMemo } from 'react';
import { Button } from '../primitives.jsx';
import { commitChanges } from '../../adapters/log.js';
import { KNOWN_KINDS } from '../../lib/commit-parse.js';
import { VERIFY_VALUES } from '../../lib/commit-spec.js';

// The working-tree delta made visible -- the most dangerous failure mode from
// the whole thread (uncommitted dives, invisible to everything) becomes a
// banner instead of a silent hazard. Renders nothing when the tree is clean.
//
// v1.0 surfaced; Phase 20 ACTS: select files, write a palace-spec message, and
// record them. Staging is strictly the selected paths (never -A -- the
// N-writer lesson), so unrelated workstreams stay in separate commits.

const fieldStyle = {
  background: 'transparent', border: 'none', borderBottom: '1px dashed var(--phosphor-dim)',
  color: 'var(--phosphor)', textShadow: 'var(--glow)', fontFamily: 'var(--font-mono)',
  fontSize: 12, outline: 'none', padding: '2px 4px',
};
const selectStyle = { ...fieldStyle, borderBottom: '1px solid var(--phosphor-dim)' };

function FileChip({ item, tone, selected, onToggle }) {
  return (
    <span
      data-testid="commit-file"
      data-path={item.path}
      data-selected={selected ? 'true' : 'false'}
      role="checkbox"
      aria-checked={selected}
      onClick={() => onToggle(item.path)}
      style={{
        color: 'var(--phosphor)', textShadow: 'none', fontSize: 11,
        border: `1px ${selected ? 'solid var(--phosphor)' : 'dashed var(--phosphor-dim)'}`,
        padding: '0 5px', cursor: 'pointer',
        background: selected ? 'rgba(51,255,102,0.10)' : 'transparent',
      }}
    >
      <span style={{ color: selected ? 'var(--phosphor)' : 'var(--phosphor-dim)', marginRight: 4 }}>{selected ? '[x]' : '[ ]'}</span>
      <span style={{ color: tone, marginRight: 4 }}>{item.status}</span>
      {item.path}
    </span>
  );
}

function Group({ label, items, tone, selected, onToggle }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 4 }}>
      <span style={{ color: tone, textShadow: 'var(--glow)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {label} ({items.length})
      </span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
        {items.map((it) => (
          <FileChip key={it.path} item={it} tone={tone} selected={selected.has(it.path)} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

export default function UncommittedBanner({ delta, onCommitted }) {
  const [selected, setSelected] = useState(() => new Set());
  const [kind, setKind] = useState('edit');
  const [scope, setScope] = useState('');
  const [summary, setSummary] = useState('');
  const [verify, setVerify] = useState('verified');
  const [bodyText, setBodyText] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const allItems = useMemo(
    () => [...(delta?.staged ?? []), ...(delta?.unstaged ?? []), ...(delta?.untracked ?? [])],
    [delta],
  );

  if (!delta || delta.total === 0) {
    return (
      <div data-testid="uncommitted-clean" style={{
        color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12,
        border: '1px solid var(--phosphor-dim)', padding: '4px 10px', marginBottom: 10,
      }}>
        working tree clean -- nothing uncommitted.
      </div>
    );
  }

  function toggle(path) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }
  const selectAll = () => setSelected(new Set(allItems.map((i) => i.path)));
  const clearSel = () => setSelected(new Set());

  const canRecord = selected.size > 0 && summary.trim() !== '' && !busy;

  async function record() {
    if (!canRecord) return;
    setBusy(true);
    setFeedback(null);
    const r = await commitChanges({
      paths: [...selected],
      kind,
      scope: scope.trim() || undefined,
      summary: summary.trim(),
      body: bodyText.trim() || undefined,
      verify,
    });
    if (r.ok) {
      setFeedback({ tone: 'ok', text: `recorded ${r.shortHash} — ${(r.committed?.length ?? selected.size)} file(s)` });
      setSelected(new Set());
      setSummary('');
      setScope('');
      setBodyText('');
      onCommitted?.();
    } else {
      setFeedback({ tone: 'err', text: r.error || `commit failed (${r.status ?? '?'})` });
    }
    setBusy(false);
  }

  const subjectPreview = `${kind}${scope.trim() ? `(${scope.trim()})` : ''}: ${summary.trim() || '…'}`;

  return (
    <div data-testid="uncommitted-banner" style={{
      border: '3px double var(--warn)', background: 'var(--phosphor-deep)',
      padding: '6px 12px', marginBottom: 10,
    }}>
      <div style={{ color: 'var(--warn)', textShadow: 'var(--glow)', textTransform: 'uppercase', letterSpacing: '.06em', fontSize: 13 }}>
        ! {delta.total} uncommitted change{delta.total === 1 ? '' : 's'} -- not yet recorded
      </div>
      <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, marginTop: 2 }}>
        select files, write a palace-spec message, and record them.
        <span onClick={selectAll} style={{ cursor: 'pointer', color: 'var(--phosphor)', marginLeft: 8 }}>[select all]</span>
        <span onClick={clearSel} style={{ cursor: 'pointer', color: 'var(--phosphor)', marginLeft: 6 }}>[none]</span>
        <span style={{ marginLeft: 8 }}>{selected.size} selected</span>
      </div>

      <Group label="staged" items={delta.staged} tone="var(--phosphor)" selected={selected} onToggle={toggle} />
      <Group label="unstaged" items={delta.unstaged} tone="var(--warn)" selected={selected} onToggle={toggle} />
      <Group label="untracked" items={delta.untracked} tone="var(--ansi-bright-cyan)" selected={selected} onToggle={toggle} />

      {/* The composer -- the LOG deck stops surfacing and acts. */}
      <div data-testid="commit-composer" style={{ marginTop: 10, borderTop: '1px dashed var(--phosphor-dim)', paddingTop: 8 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
          <label style={{ color: 'var(--phosphor-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            kind&nbsp;
            <select data-testid="commit-kind" value={kind} onChange={(e) => setKind(e.target.value)} style={selectStyle}>
              {KNOWN_KINDS.map((k) => <option key={k} value={k} style={{ background: 'var(--bg)' }}>{k}</option>)}
            </select>
          </label>
          <input
            data-testid="commit-scope"
            type="text"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="scope (optional)"
            style={{ ...fieldStyle, width: '18ch' }}
          />
          <label style={{ color: 'var(--phosphor-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            verify&nbsp;
            <select data-testid="commit-verify" value={verify} onChange={(e) => setVerify(e.target.value)} style={selectStyle}>
              {VERIFY_VALUES.map((v) => <option key={v} value={v} style={{ background: 'var(--bg)' }}>{v}</option>)}
            </select>
          </label>
        </div>
        <input
          data-testid="commit-summary"
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') record(); }}
          placeholder="summary — what changed (the subject line)"
          style={{ ...fieldStyle, width: '100%', fontSize: 13, marginBottom: 6 }}
        />
        <input
          data-testid="commit-body"
          type="text"
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="body / why (optional)"
          style={{ ...fieldStyle, width: '100%', marginBottom: 6 }}
        />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span data-testid="commit-record">
            <Button tone="primary" disabled={!canRecord} onClick={record}>
              {busy ? 'recording…' : `record ${selected.size} file${selected.size === 1 ? '' : 's'}`}
            </Button>
          </span>
          <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            {subjectPreview}
          </span>
        </div>
        {feedback ? (
          <div data-testid="commit-feedback" style={{
            marginTop: 6, fontSize: 12,
            color: feedback.tone === 'ok' ? 'var(--phosphor)' : 'var(--error)', textShadow: 'var(--glow)',
          }}>
            {feedback.text}
          </div>
        ) : null}
      </div>
    </div>
  );
}
