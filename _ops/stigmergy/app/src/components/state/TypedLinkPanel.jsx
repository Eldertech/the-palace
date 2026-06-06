import React from 'react';
import { Box } from '../primitives.jsx';
import EntryRefChips from '../EntryRefChips.jsx';
import { resolveRef } from '../../lib/entry-ref.js';

// SCHEMA §4 made visible: frontmatter links (the semantic web) render as
// a typed-relation panel; body wikilinks (the conversational fabric) render
// inline in EntryBody. Two registers, two treatments. Obsidian flattens
// them; STATE separates them.
//
// Each row: `<type>  <label>  -> [[target]]`. Clicking the target navigates
// to that entry (when resolved against the wikilink index).

// Group entries by link type for readability. Order mirrors SCHEMA's table.
const TYPE_ORDER = [
  'mirrors', 'enables', 'deepens',
  'spawned', 'emerged-from',
  'contradicts', 'couples-with',
  'exemplifies', 'member-of',
  'connects-to',
];

const TYPE_COLOR = {
  mirrors: 'var(--ansi-bright-cyan)',
  enables: 'var(--phosphor-bright)',
  deepens: 'var(--phosphor)',
  spawned: 'var(--ansi-bright-magenta)',
  'emerged-from': 'var(--ansi-bright-yellow)',
  contradicts: 'var(--error)',
  'couples-with': 'var(--phosphor-white)',
  exemplifies: 'var(--ansi-bright-cyan)',
  'member-of': 'var(--ansi-bright-cyan)',
  'connects-to': 'var(--phosphor-dim)',
};

function LinkRow({ link, onNavigate, index, refIndex }) {
  const resolvedPath = index?.get?.(link.target) ?? null;
  const known = resolvedPath !== null;
  const ref = resolveRef(refIndex, link.target);
  const typeColor = TYPE_COLOR[link.type] ?? 'var(--phosphor-dim)';
  return (
    <div
      data-testid="typed-link-row"
      data-known={known ? 'true' : 'false'}
      style={{
        display: 'grid',
        gridTemplateColumns: '11ch 14ch 1fr',
        gap: 8, alignItems: 'baseline',
        padding: '2px 0',
      }}
    >
      <span style={{
        color: typeColor, textShadow: 'var(--glow)',
        fontFamily: 'var(--font-mono)', fontSize: 12,
        textTransform: 'uppercase', letterSpacing: '.04em',
      }}>{link.type}</span>
      <span style={{
        color: link.label ? 'var(--phosphor-dim)' : 'transparent',
        textShadow: 'none', fontSize: 12, fontStyle: 'italic',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{link.label ? `(${link.label})` : '--'}</span>
      <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', minWidth: 0 }}>
        <span
          style={{
            color: known ? 'var(--link)' : 'var(--phosphor-dim)',
            textShadow: known ? 'var(--glow)' : 'none',
            cursor: known && onNavigate ? 'pointer' : 'default',
            borderBottom: known ? '1px dashed currentColor' : 'none',
          }}
          onClick={() => { if (known && onNavigate) onNavigate(resolvedPath); }}
        >
          {known ? `-> ${link.target}` : `?? ${link.target}`}
        </span>
        {/* [OBS]/[BUN] ride the resolved target. onOpen navigates in-deck to
            the target's STATE view (where its bundle renders). */}
        <EntryRefChips resolved={ref} onOpen={onNavigate} />
      </span>
    </div>
  );
}

export default function TypedLinkPanel({ links = [], onNavigate, index, refIndex }) {
  if (!Array.isArray(links) || links.length === 0) {
    return (
      <Box title="TYPED LINKS" tone="single">
        <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12 }}>
          (no typed links -- consider proposing some via the next Weave)
        </div>
      </Box>
    );
  }

  // Group by type but preserve original order within each group.
  const byType = new Map();
  for (const l of links) {
    const t = l.type ?? 'connects-to';
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t).push(l);
  }
  const orderedTypes = [
    ...TYPE_ORDER.filter((t) => byType.has(t)),
    ...[...byType.keys()].filter((t) => !TYPE_ORDER.includes(t)),
  ];

  return (
    <Box title={`TYPED LINKS  (${links.length})`} tone="single">
      {orderedTypes.map((t) => (
        <div key={t} style={{ marginBottom: 4 }}>
          {byType.get(t).map((l, i) => (
            <LinkRow key={`${t}-${i}`} link={l} onNavigate={onNavigate} index={index} refIndex={refIndex} />
          ))}
        </div>
      ))}
    </Box>
  );
}
