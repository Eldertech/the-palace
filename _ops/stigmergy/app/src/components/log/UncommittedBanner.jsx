import React from 'react';

// The working-tree delta made visible -- the most dangerous failure mode
// from the whole thread (uncommitted dives, invisible to everything) becomes
// a banner instead of a silent hazard. Renders nothing when the tree is clean.
//
// v1.0 surfaces; it does not act. The "record these" one-click is wired to
// palace-commit in Phase 3 (commit spec). Here it states the fact honestly.

function Group({ label, items, tone }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 4 }}>
      <span style={{
        color: tone, textShadow: 'var(--glow)', fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '.06em',
      }}>{label} ({items.length})</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
        {items.slice(0, 20).map((it) => (
          <span key={it.path} style={{
            color: 'var(--phosphor)', textShadow: 'none', fontSize: 11,
            border: '1px dashed var(--phosphor-dim)', padding: '0 5px',
          }}>
            <span style={{ color: tone, marginRight: 4 }}>{it.status}</span>
            {it.path}
          </span>
        ))}
        {items.length > 20 ? (
          <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>
            +{items.length - 20} more
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function UncommittedBanner({ delta }) {
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
  return (
    <div data-testid="uncommitted-banner" style={{
      border: '3px double var(--warn)',
      background: 'var(--phosphor-deep)',
      padding: '6px 12px', marginBottom: 10,
    }}>
      <div style={{
        color: 'var(--warn)', textShadow: 'var(--glow)',
        textTransform: 'uppercase', letterSpacing: '.06em', fontSize: 13,
      }}>
        ! {delta.total} uncommitted change{delta.total === 1 ? '' : 's'} -- not yet recorded
      </div>
      <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, marginTop: 2 }}>
        the invisible-dive hazard, made visible. record via palace-commit (phase 3) or your editor's git.
      </div>
      <Group label="staged" items={delta.staged} tone="var(--phosphor)" />
      <Group label="unstaged" items={delta.unstaged} tone="var(--warn)" />
      <Group label="untracked" items={delta.untracked} tone="var(--ansi-bright-cyan)" />
    </div>
  );
}
