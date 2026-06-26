import React, { useEffect, useMemo, useState } from 'react';
import { Box } from '../primitives.jsx';
import EntryAvatar from '../EntryAvatar.jsx';
import PulseDot from './PulseDot.jsx';
import { typeColor } from '../../lib/entry-style.js';
import { scoreEntry } from '../../lib/pulse.js';
import { withRootGroup, flattenVisible } from '../../lib/tree.js';
import { fetchTree } from '../../adapters/tree.js';

// TREE -- the folder-structure lens. PULSE ranks by vitality and TOPOLOGY draws
// the link graph; TREE shows where things LIVE. Organizational folders (Shop/,
// Projects/) collapse and expand; a bundled entry expands to reveal its owned
// files (SCHEMA §8) nested underneath it, never as a sibling. Loose root-level
// entries are gathered under a synthetic "(root)" group so the top level reads
// as a short list of folders rather than a wall of entries.
//
// Self-fetches from /api/tree. Accepts an optional `tree` prop so tests can
// inject a fixture and skip the network (mirrors TopologyLens' `entries` prop).

const INDENT_CH = 2;

// One column of caret width, so entry titles line up whether or not a row has
// a toggle.
function Caret({ open, onClick }) {
  const glyph = onClick ? (open ? 'v' : '>') : ' ';
  return (
    <span
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      style={{
        display: 'inline-block', width: '1.2ch', textAlign: 'center',
        color: 'var(--phosphor)', textShadow: open ? 'var(--glow)' : 'none',
        cursor: onClick ? 'pointer' : 'default', userSelect: 'none',
      }}
    >{glyph}</span>
  );
}

function KindBadge({ kind }) {
  return (
    <span style={{
      color: 'var(--phosphor-dim)', textShadow: 'none',
      fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase',
      border: '1px solid var(--phosphor-dim)', padding: '0 4px', whiteSpace: 'nowrap',
    }}>{kind}</span>
  );
}

const ROW_BASE = {
  display: 'flex', alignItems: 'baseline', gap: 8,
  padding: '3px 6px', borderBottom: '1px dashed var(--phosphor-dim)',
  fontSize: 13,
};

function FolderRow({ row, onToggle }) {
  const { node, depth, isExpanded } = row;
  const label = node.synthetic ? node.name : `${node.name}/`;
  return (
    <div
      data-testid="tree-folder-row"
      data-path={node.path}
      data-expanded={isExpanded ? '1' : '0'}
      onClick={() => onToggle(node.path)}
      style={{ ...ROW_BASE, paddingLeft: `${6 + depth * INDENT_CH * 8}px`, cursor: 'pointer' }}
    >
      <Caret open={isExpanded} onClick={() => onToggle(node.path)} />
      <span style={{
        color: 'var(--phosphor-dim)', textShadow: 'none',
        letterSpacing: '.04em', flex: 1, minWidth: 0,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{label}</span>
      <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>
        {node.entryCount}
      </span>
    </div>
  );
}

function EntryRow({ row, onToggle, onSelect }) {
  const { node, depth, isExpanded, hasChildren } = row;
  const entry = node.summary ?? {};
  const pulse = scoreEntry(entry);
  return (
    <div
      data-testid="tree-entry-row"
      data-path={node.path}
      onClick={() => onSelect?.(node.path)}
      style={{ ...ROW_BASE, paddingLeft: `${6 + depth * INDENT_CH * 8}px`, cursor: 'pointer' }}
    >
      <Caret open={isExpanded} onClick={hasChildren ? () => onToggle(node.path) : null} />
      <span style={{
        color: typeColor(entry.type), textShadow: 'var(--glow)',
        fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase',
        width: '9ch', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{entry.type ?? '--'}</span>
      <span style={{
        display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1,
        color: 'var(--phosphor)', textShadow: 'var(--glow)',
      }}>
        {entry.icon ? <EntryAvatar name={entry.title ?? node.path} icon={entry.icon} size={15} /> : null}
        <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {entry.title ?? node.name}
          {entry.has_active_handoff ? <span style={{
            marginLeft: 6, color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 10,
          }}>[handoff]</span> : null}
        </span>
      </span>
      <PulseDot score={pulse} />
      <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, width: '10ch' }}>
        {entry.stage ?? '--'}
      </span>
    </div>
  );
}

function formatBytes(n) {
  if (!n || n <= 0) return '';
  if (n < 1024) return `${n} b`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kb`;
  return `${(n / 1024 / 1024).toFixed(1)} mb`;
}

function BundleFileRow({ row, onSelect }) {
  const { node: file, depth } = row;
  const open = () => {
    // Owned .md files are entries — open them in the reader. Everything else
    // opens natively, the way BundlePanel does it.
    if (file.isEntry) onSelect?.(file.relPath);
    else window.open(`/api/open?path=${encodeURIComponent(file.relPath)}`, '_self');
  };
  return (
    <div
      data-testid="tree-bundle-file-row"
      data-path={file.relPath}
      data-is-entry={file.isEntry ? '1' : '0'}
      onClick={open}
      style={{ ...ROW_BASE, paddingLeft: `${6 + depth * INDENT_CH * 8}px`, cursor: 'pointer' }}
    >
      <span style={{ width: '1.2ch', textAlign: 'center', color: 'var(--phosphor-dim)' }}>·</span>
      <KindBadge kind={file.kind} />
      <span style={{
        flex: 1, minWidth: 0, color: 'var(--link)', textShadow: 'var(--glow)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{file.name}</span>
      <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>
        {formatBytes(file.size)}
      </span>
    </div>
  );
}

export default function TreeLens({ onSelect, tree = null, defaultExpanded = null }) {
  const [state, setState] = useState(
    tree ? { kind: 'ok', root: tree.root, counts: tree.counts } : { kind: 'loading' },
  );
  // `defaultExpanded` seeds the open-set — used by tests today and the Phase-2
  // `?tree=<path>` deep-link (open a path's ancestors) tomorrow.
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded ?? []));
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (tree) return undefined; // injected — no fetch
    let cancelled = false;
    setState({ kind: 'loading' });
    fetchTree().then((r) => {
      if (cancelled) return;
      if (r.ok) setState({ kind: 'ok', root: r.root, counts: r.counts });
      else setState({ kind: 'err', error: r.error ?? 'unknown error' });
    });
    return () => { cancelled = true; };
  }, [tree]);

  const grouped = useMemo(
    () => (state.kind === 'ok' ? withRootGroup(state.root) : null),
    [state],
  );
  const rows = useMemo(
    () => (grouped ? flattenVisible(grouped, { expanded, filter }) : []),
    [grouped, expanded, filter],
  );

  const onToggle = (path) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  if (state.kind === 'loading') {
    return (
      <div data-testid="tree-loading" style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
        mapping palace structure...
      </div>
    );
  }
  if (state.kind === 'err') {
    return (
      <div data-testid="tree-error" style={{
        color: 'var(--error)', textShadow: 'var(--glow)',
        border: '1px solid var(--error)', padding: 12,
      }}>
        could not read palace tree: {state.error}
      </div>
    );
  }

  const c = state.counts ?? {};
  return (
    <Box title={`TREE  --  folder structure  (${c.entries ?? '?'} entries / ${c.folders ?? '?'} folders / ${c.bundles ?? '?'} bundles)`} tone="double">
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12 }}>filter:</span>
        <input
          data-testid="tree-filter"
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
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {rows.map((row) => {
          if (row.kind === 'folder') return <FolderRow key={row.key} row={row} onToggle={onToggle} />;
          if (row.kind === 'entry') return <EntryRow key={row.key} row={row} onToggle={onToggle} onSelect={onSelect} />;
          return <BundleFileRow key={row.key} row={row} onSelect={onSelect} />;
        })}
        {rows.length === 0 ? (
          <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', padding: 12, fontStyle: 'italic' }}>
            nothing matches the filter.
          </div>
        ) : null}
      </div>
    </Box>
  );
}
