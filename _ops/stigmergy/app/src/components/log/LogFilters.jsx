import React from 'react';
import { kindCounts, authorCounts } from '../../lib/log-filter.js';
import { kindColor } from '../../lib/commit-parse.js';

// Filters only structured commits enable. Kind + author render as chips (with
// counts) computed from the visible commit set; entry + text + time render as
// inputs. An active filter is inverted; clicking it again clears it.

function Chip({ label, count, active, color, onClick, testid }) {
  return (
    <span
      data-testid={testid}
      data-active={active ? 'true' : 'false'}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        background: active ? (color ?? 'var(--phosphor)') : 'transparent',
        color: active ? 'var(--bg)' : (color ?? 'var(--phosphor-dim)'),
        border: `1px solid ${color ?? 'var(--phosphor-dim)'}`,
        padding: '0 6px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em',
        textShadow: active ? 'none' : 'var(--glow)',
      }}
    >
      {label}{typeof count === 'number' ? ` (${count})` : ''}
    </span>
  );
}

const PILLARS = ['creation', 'tools', 'philosophy', 'practice'];

export default function LogFilters({ commits, filter, onChange, pillarsAvailable }) {
  const kinds = [...kindCounts(commits).entries()].sort((a, b) => b[1] - a[1]);
  const authors = [...authorCounts(commits).entries()].sort((a, b) => b[1] - a[1]);

  const set = (patch) => onChange({ ...filter, ...patch });
  const toggle = (key, val) => set({ [key]: filter[key] === val ? null : val });

  return (
    <div data-testid="log-filters" style={{
      border: '1px solid var(--phosphor-dim)', padding: '6px 10px', marginBottom: 10,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10, textTransform: 'uppercase', width: '6ch' }}>kind</span>
        {kinds.map(([k, n]) => (
          <Chip key={k} testid={`filter-kind-${k}`} label={k} count={n} color={kindColor(k)}
            active={filter.kind === k} onClick={() => toggle('kind', k)} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10, textTransform: 'uppercase', width: '6ch' }}>author</span>
        {authors.map(([a, n]) => (
          <Chip key={a} testid={`filter-author-${a}`} label={a} count={n}
            active={filter.author === a} onClick={() => toggle('author', a)} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10, textTransform: 'uppercase', width: '6ch' }}>pillar</span>
        {PILLARS.map((p) => (
          <Chip key={p} testid={`filter-pillar-${p}`} label={p}
            active={filter.pillar === p}
            onClick={() => toggle('pillar', p)} />
        ))}
        {!pillarsAvailable ? (
          <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10 }}>
            (loading catalog for pillar join...)
          </span>
        ) : null}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10, textTransform: 'uppercase', width: '6ch' }}>find</span>
        <input
          data-testid="filter-text"
          type="text" value={filter.text ?? ''}
          onChange={(e) => set({ text: e.target.value })}
          placeholder="subject / hash / entry"
          style={{
            background: 'transparent', border: 'none', borderBottom: '1px dashed var(--phosphor-dim)',
            color: 'var(--phosphor)', textShadow: 'var(--glow)', fontFamily: 'var(--font-mono)',
            fontSize: 12, outline: 'none', padding: '2px 0', minWidth: '24ch',
          }}
        />
        {filter.entry ? (
          <span data-testid="active-entry-filter" style={{
            color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 11,
            border: '1px dashed var(--warn)', padding: '0 6px', cursor: 'pointer',
          }} onClick={() => set({ entry: null })}>
            entry: {filter.entry} · clear
          </span>
        ) : null}
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10 }}>since</span>
        <input data-testid="filter-since" type="text" value={filter.since ?? ''}
          onChange={(e) => set({ since: e.target.value })} placeholder="YYYY-MM-DD"
          style={{ background: 'transparent', border: 'none', borderBottom: '1px dashed var(--phosphor-dim)', color: 'var(--phosphor)', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', width: '12ch' }} />
        {hasAnyFilter(filter) ? (
          <span data-testid="clear-filters" onClick={() => onChange({})} style={{
            cursor: 'pointer', color: 'var(--error)', textShadow: 'var(--glow)', fontSize: 11,
            border: '1px solid var(--error)', padding: '0 6px', textTransform: 'uppercase',
          }}>clear all</span>
        ) : null}
      </div>
    </div>
  );
}

function hasAnyFilter(f) {
  return !!(f.kind || f.author || f.entry || f.pillar || f.text || f.since || f.until);
}
