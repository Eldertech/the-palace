import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Check } from '../primitives.jsx';
import StageGlyph from './StageGlyph.jsx';
import { pulseSort, pulseUniverse } from '../../lib/pulse.js';
import { sortEntries, DEFAULT_DIR, SORT_KEYS } from '../../lib/entry-sort.js';
import { activeIndex, stepCursor } from '../../lib/list-cursor.js';
import { parseFilterFromUrl, replaceFilterInUrl } from '../../lib/url-nav.js';
import EntryAvatar from '../EntryAvatar.jsx';
import PulseDot from './PulseDot.jsx';
import { typeColor } from '../../lib/entry-style.js';
import { IS_PUBLIC } from '../../lib/public-mode.js';

// PULSE: the vitality lens that is STATE's default index. Entries sorted
// by how alive they are right now (recency * recent use * stage *
// has-active-handoff). One ranked list, not a flat file tree -- which is
// the whole point of leaving Obsidian's file browser behind for triage.
//
// A filter input narrows by title/type/path; clicking a row opens that
// entry in EntryReader. From the keyboard, ↑/↓ move a highlight through the
// list and Enter opens the highlighted entry; typing a filter highlights the
// top match, so filter-then-Enter opens the best hit.

// Memoized so holding ↓ repaints the two rows whose highlight changed, not
// the whole several-hundred-row index.
const EntryRow = React.memo(function EntryRow({ entry, onSelect, active }) {
  const rowColor = typeColor(entry.type);
  return (
    <div
      data-testid="pulse-row"
      className="pulse-cols"
      data-path={entry.path}
      data-active={active ? '1' : '0'}
      role="option"
      aria-selected={active}
      onClick={() => onSelect?.(entry.path)}
      style={{
        display: 'grid',
        gridTemplateColumns: '8ch 9ch 1fr 16ch 10ch',
        gap: 12, alignItems: 'baseline',
        padding: '4px 6px',
        borderBottom: '1px dashed var(--phosphor-dim)',
        cursor: 'pointer',
        // Deep-green fill + a phosphor bar on the left: the row reads as
        // picked without inverting it, so the type colours and chips stay
        // legible.
        background: active ? 'var(--fill-card)' : 'transparent',
        boxShadow: active ? 'inset 3px 0 0 var(--phosphor)' : 'none',
      }}
    >
      <PulseDot score={entry.pulse ?? 0} />
      <span style={{
        color: rowColor, textShadow: 'var(--glow)',
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
          {entry.has_bundle && !IS_PUBLIC ? <span style={{
            marginLeft: 6, color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)', fontSize: 10,
          }}>[+bundle]</span> : null}
          {Array.isArray(entry.faces) && entry.faces.includes('rich') ? <span data-testid="entry-rich-chip" title="has a rich face — sound, image and interactives beside the text" style={{
            marginLeft: 6, color: 'var(--ansi-bright-magenta)', textShadow: 'var(--glow)', fontSize: 10,
          }}>[rich]</span> : null}
          {entry.has_active_handoff && !IS_PUBLIC ? <span style={{
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
        {entry.last_used ?? entry.born ?? '--'}
      </span>
    </div>
  );
});

// initialCursor: the row to highlight on mount -- StateDeck hands back the
// entry you last opened from here, so coming back puts you where you left and
// ↓ carries on to the next match.
export default function EntryList({ entries = [], loadState, error, onSelect, initialCursor = null }) {
  // The filter lives in the URL (?q=), so it outlives this component, which
  // unmounts whenever an entry is open.
  const [filter, setFilter] = useState(
    () => (typeof window === 'undefined' ? '' : parseFilterFromUrl(window.location.search)),
  );
  const [sortKey, setSortKey] = useState('pulse');
  const [sortDir, setSortDir] = useState(DEFAULT_DIR.pulse);
  // PULSE is canon only (lib/pulse.js pulseUniverse): entries with a real
  // SCHEMA §1 type. Bundle files (§8 owned files: batons, scrolls, specs,
  // context) are an entry's private substrate, so they join only when the
  // toggle is on; files with no frontmatter at all (READMEs, SKILL.md, build
  // logs) never do — the TREE lens is where the folders live.
  const [showBundleFiles, setShowBundleFiles] = useState(false);

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

  // The universe the filter and the header count operate over, so "N/M
  // entries" reflects what PULSE actually triages, not the raw .md count.
  const base = useMemo(
    () => pulseUniverse(sorted, { withBundles: showBundleFiles }),
    [sorted, showBundleFiles],
  );

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return base;
    return base.filter((e) =>
      (e.title ?? '').toLowerCase().includes(q)
      || (e.path ?? '').toLowerCase().includes(q)
      || (e.type ?? '').toLowerCase().includes(q)
    );
  }, [filter, base]);

  // The keyboard cursor. Held as a path (see lib/list-cursor.js) and reset on
  // every keystroke in the filter, so a fresh query always starts from its
  // top match.
  const [cursorPath, setCursorPath] = useState(initialCursor);
  const active = activeIndex(filtered, cursorPath, filter);
  const boxRef = useRef(null);
  const listRef = useRef(null);

  const onFilterChange = (value) => {
    setFilter(value);
    setCursorPath(null);
    replaceFilterInUrl(value);
  };

  // On a return from an entry the list mounts scrolled to the top; bring the
  // row you left from back into view.
  useEffect(() => {
    if (initialCursor && active >= 0) {
      listRef.current?.children[active]?.scrollIntoView?.({ block: 'nearest' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ↑/↓ move the highlight, Enter opens it. Shift/Cmd/Ctrl/Alt combos pass
  // through untouched (text selection, browser shortcuts).
  const onNavKey = (e) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (filtered.length === 0) return;
      e.preventDefault();
      const next = stepCursor(active, e.key === 'ArrowDown' ? 1 : -1, filtered.length);
      setCursorPath(filtered[next].path);
      listRef.current?.children[next]?.scrollIntoView?.({ block: 'nearest' });
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      onSelect?.(filtered[active].path);
    }
  };

  // The same keys when you haven't clicked into the filter: the list answers
  // from the bare page or from anywhere inside the PULSE box, but never while
  // you are typing somewhere else (the Companion, an editor), and never for a
  // key a focused control already claimed -- a sort header keeps its Enter.
  const navKeyRef = useRef(onNavKey);
  navKeyRef.current = onNavKey;
  useEffect(() => {
    function onKey(e) {
      if (e.defaultPrevented) return;
      const t = e.target;
      if (t !== document.body && !boxRef.current?.contains(t)) return;
      if (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable) return;
      navKeyRef.current(e);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
    <div ref={boxRef}>
    <Box title={`PULSE  --  vitality lens  (${filtered.length}/${base.length} entries)`} tone="double">
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12 }}>
          filter:
        </span>
        <input
          data-testid="pulse-filter"
          type="text"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          onKeyDown={(e) => {
            // Esc clears the filter; a second Esc lets go of the input so the
            // deck hotkeys (S / Q / L ...) answer again.
            if (e.key === 'Escape') {
              e.preventDefault();
              if (filter) onFilterChange('');
              else e.currentTarget.blur();
              return;
            }
            onNavKey(e);
          }}
          placeholder="title / type / path"
          style={{
            flex: 1, minWidth: '12ch', maxWidth: '40ch',
            background: 'transparent', border: 'none',
            borderBottom: '1px dashed var(--phosphor-dim)',
            color: 'var(--phosphor)', textShadow: 'var(--glow)',
            fontFamily: 'var(--font-mono)', fontSize: 13,
            outline: 'none', padding: '2px 0',
          }}
        />
        <span data-testid="pulse-keys-hint" style={{
          color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, whiteSpace: 'nowrap',
        }}>
          [↑↓] move  [enter] open
        </span>
        <Check
          testId="pulse-bundle-toggle"
          checked={showBundleFiles}
          onToggle={setShowBundleFiles}
          title="add the files inside each entry's bundle"
        >bundle files</Check>
      </div>

      <div data-testid="pulse-header" className="pulse-cols" style={{
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

      <div ref={listRef} role="listbox" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {filtered.map((e, i) => (
          <EntryRow key={e.path} entry={e} onSelect={onSelect} active={i === active} />
        ))}
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
    </div>
  );
}
