import React, { useMemo, useState } from 'react';
import { Box } from '../primitives.jsx';
import StageGlyph from './StageGlyph.jsx';
import { pulseSort } from '../../lib/pulse.js';
import { sortEntries, DEFAULT_DIR, SORT_KEYS } from '../../lib/entry-sort.js';
import EntryAvatar from '../EntryAvatar.jsx';

// PULSE: the vitality lens that is STATE's default index. Entries sorted
// by how alive they are right now (recency * activation_count * stage *
// has-active-handoff). One ranked list, not a flat file tree -- which is
// the whole point of leaving Obsidian's file browser behind for triage.
//
// A filter input narrows by title/type/path; clicking a row opens that
// entry in EntryReader.

function PulseDot({ score }) {
  // 5-position dot meter -- compact, monospace-friendly.
  const filled = Math.max(0, Math.min(5, Math.round(score * 5)));
  return (
    <span
      data-testid="pulse-dot"
      data-score={filled}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 12,
        color: 'var(--phosphor-dim)', textShadow: 'none', letterSpacing: '0.1em',
      }}
    >
      {Array.from({ length: 5 }, (_, i) => i < filled ? '*' : '.').map((g, i) => (
        <span key={i} style={{
          color: i < filled ? 'var(--phosphor)' : 'var(--phosphor-dim)',
          textShadow: i < filled ? 'var(--glow)' : 'none',
        }}>{g}</span>
      ))}
    </span>
  );
}

const TYPE_COLOR = {
  meta: 'var(--phosphor-white)',
  concept: 'var(--phosphor)',
  hub: 'var(--ansi-bright-cyan)',
  project: 'var(--ansi-bright-yellow)',
  breakthrough: 'var(--ansi-bright-magenta)',
  source: 'var(--ansi-bright-cyan)',
  practice: 'var(--phosphor-bright)',
  person: 'var(--ansi-bright-magenta)',
  question: 'var(--warn)',
  spore: 'var(--phosphor-dim)',
  specialist: 'var(--phosphor-bright)',
  maker: 'var(--phosphor-bright)',
};

function EntryRow({ entry, onSelect }) {
  const typeColor = TYPE_COLOR[entry.type ?? ''] ?? 'var(--phosphor-dim)';
  return (
    <div
      data-testid="pulse-row"
      data-path={entry.path}
      onClick={() => onSelect?.(entry.path)}
      style={{
        display: 'grid',
        gridTemplateColumns: '8ch 9ch 1fr 16ch 10ch',
        gap: 12, alignItems: 'baseline',
        padding: '4px 6px',
        borderBottom: '1px dashed var(--phosphor-dim)',
        cursor: 'pointer',
      }}
    >
      <PulseDot score={entry.pulse ?? 0} />
      <span style={{
        color: typeColor, textShadow: 'var(--glow)',
        fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{entry.type ?? '--'}</span>
      <span style={{
        display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
        color: 'var(--phosphor)', textShadow: 'var(--glow)',
      }}>
        {/* Avatar only for entries that carry bundle art — a subtle "this one
            is enriched" mark; no monogram clutter across the dense index. It
            sits OUTSIDE the ellipsis box so its round frame + glow aren't
            clipped; only the title text truncates. */}
        {entry.icon ? (
          <EntryAvatar name={entry.title ?? entry.path} icon={entry.icon} size={15} />
        ) : null}
        <span style={{
          minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {entry.title ?? entry.path}
          {entry.has_bundle ? <span style={{
            marginLeft: 6, color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)', fontSize: 10,
          }}>[+bundle]</span> : null}
          {entry.has_active_handoff ? <span style={{
            marginLeft: 6, color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 10,
          }}>[handoff]</span> : null}
        </span>
      </span>
      <span style={{
        color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11,
      }}>
        {entry.stage ? entry.stage : '--'}
      </span>
      <span style={{
        color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {entry.last_activated ?? entry.born ?? '--'}
      </span>
    </div>
  );
}

export default function EntryList({ entries = [], loadState, error, onSelect }) {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState('pulse');
  const [sortDir, setSortDir] = useState(DEFAULT_DIR.pulse);

  // Always pulse-stamp first (the dot meter shows score regardless of sort
  // column), then apply the column sort on top.
  const stamped = useMemo(() => pulseSort(entries), [entries]);
  const sorted = useMemo(
    () => sortEntries(stamped, { key: sortKey, dir: sortDir }),
    [stamped, sortKey, sortDir],
  );

  const onHeaderClick = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(DEFAULT_DIR[key] ?? 'desc');
    }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((e) =>
      (e.title ?? '').toLowerCase().includes(q)
      || (e.path ?? '').toLowerCase().includes(q)
      || (e.type ?? '').toLowerCase().includes(q)
    );
  }, [filter, sorted]);

  if (loadState === 'loading') {
    return (
      <div data-testid="pulse-loading" style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
        indexing palace entries...
      </div>
    );
  }
  if (loadState === 'error') {
    return (
      <div data-testid="pulse-error" style={{
        color: 'var(--error)', textShadow: 'var(--glow)',
        border: '1px solid var(--error)', padding: 12,
      }}>
        could not index palace entries: {error ?? 'unknown error'}
      </div>
    );
  }

  return (
    <Box title={`PULSE  --  vitality lens  (${filtered.length}/${entries.length} entries)`} tone="double">
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12 }}>
          filter:
        </span>
        <input
          data-testid="pulse-filter"
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="title / type / path"
          style={{
            flex: 1, maxWidth: '40ch',
            background: 'transparent', border: 'none',
            borderBottom: '1px dashed var(--phosphor-dim)',
            color: 'var(--phosphor)', textShadow: 'var(--glow)',
            fontFamily: 'var(--font-mono)', fontSize: 13,
            outline: 'none', padding: '2px 0',
          }}
        />
      </div>

      <div data-testid="pulse-header" style={{
        display: 'grid',
        gridTemplateColumns: '8ch 9ch 1fr 16ch 10ch',
        gap: 12,
        padding: '2px 6px 4px',
        borderBottom: '1px solid var(--phosphor-dim)',
        color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10,
        letterSpacing: '.08em', textTransform: 'uppercase',
      }}>
        {SORT_KEYS.map((key) => {
          const active = key === sortKey;
          const glyph = active ? (sortDir === 'asc' ? '^' : 'v') : ' ';
          return (
            <span
              key={key}
              data-testid={`pulse-header-${key}`}
              data-active={active ? '1' : '0'}
              data-dir={active ? sortDir : ''}
              role="button"
              tabIndex={0}
              onClick={() => onHeaderClick(key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onHeaderClick(key);
                }
              }}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
                color: active ? 'var(--phosphor)' : 'var(--phosphor-dim)',
                textShadow: active ? 'var(--glow)' : 'none',
              }}
            >
              {key === 'activity' ? 'activity' : key}
              <span style={{ marginLeft: 4, fontFamily: 'var(--font-mono)' }}>{glyph}</span>
            </span>
          );
        })}
      </div>

      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {filtered.map((e) => <EntryRow key={e.path} entry={e} onSelect={onSelect} />)}
        {filtered.length === 0 ? (
          <div style={{
            color: 'var(--phosphor-dim)', textShadow: 'none',
            padding: 12, fontStyle: 'italic',
          }}>
            no entries match the filter.
          </div>
        ) : null}
      </div>
    </Box>
  );
}
