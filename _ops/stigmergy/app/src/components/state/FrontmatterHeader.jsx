import React from 'react';
import { Banner, Tag } from '../primitives.jsx';
import StageGlyph from './StageGlyph.jsx';

// YAML rendered as a structured header instead of a raw code fence.
// What's hoisted out of the frontmatter (SCHEMA §3 fields):
//   - title (Banner)
//   - type badge
//   - stage glyph
//   - pillars as chips
//   - forward_vector as the hero quote (the entry's conatus)
//   - compact metadata row: born, last_activated, activation_count,
//     confidence, energy, who_leads, version (for meta)
//
// The forward_vector is large and quoted because it is what the entry
// itself says it wants (per [[Entry Conatus]]). The header is for orienting
// before reading the body, not for browsing data — the body is still where
// the entry lives.

function MetadataItem({ label, value }) {
  if (value == null || value === '' || value === 0) return null;
  return (
    <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
      <span style={{ opacity: 0.7 }}>{label}</span>{' '}
      <span style={{ color: 'var(--phosphor)' }}>{String(value)}</span>
    </span>
  );
}

const PILLAR_COLOR = {
  creation: 'var(--ansi-bright-magenta)',
  tools: 'var(--ansi-bright-cyan)',
  philosophy: 'var(--ansi-bright-yellow)',
  practice: 'var(--phosphor-bright)',
};

function PillarChip({ name }) {
  const c = PILLAR_COLOR[name] ?? 'var(--phosphor)';
  return (
    <span
      data-testid={`pillar-${name}`}
      style={{
        border: `1px solid ${c}`, color: c,
        padding: '0 6px', fontSize: 11, lineHeight: 1.5,
        fontFamily: 'var(--font-mono)', letterSpacing: '.06em',
        textTransform: 'uppercase', textShadow: 'var(--glow)',
      }}
    >
      {name}
    </span>
  );
}

// The forward_vector quote -- exposed as its own component so EntryReader
// can place it in the grid's left column (parallel with the typed-link
// rail) rather than in a full-width strip that pushes the rail downward.
export function ForwardVectorHero({ forward_vector }) {
  if (!forward_vector) return null;
  return (
    <div
      data-testid="forward-vector"
      style={{
        border: '3px double var(--phosphor-dim)',
        padding: '10px 16px',
        margin: '0 0 16px',
        background: 'var(--phosphor-deep)',
        maxWidth: '78ch',
      }}
    >
      <div style={{
        color: 'var(--phosphor-dim)', textShadow: 'none',
        fontSize: 10, letterSpacing: '.12em',
        textTransform: 'uppercase', marginBottom: 4,
      }}>
        forward vector -- the entry's conatus
      </div>
      <div style={{
        color: 'var(--phosphor)', textShadow: 'var(--glow)',
        fontSize: 15, lineHeight: 1.5,
        fontStyle: 'italic',
      }}>
        "{forward_vector}"
      </div>
    </div>
  );
}

export default function FrontmatterHeader({ title, frontmatter = {}, summary = {} }) {
  const {
    type, stage, status, energy, confidence, who_leads,
    born, last_activated, activation_count, version,
  } = frontmatter;
  const pillars = summary.pillars ?? [];

  return (
    <div data-testid="frontmatter-header" style={{ marginBottom: 14 }}>
      <Banner as="h1" strong style={{ fontSize: 32, margin: '0 0 6px' }}>
        {(title ?? '').toLowerCase()}
      </Banner>

      <div style={{
        display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
        marginBottom: 10,
      }}>
        {type ? (
          <span data-testid="type-badge">
            <Tag tone="ok">{type}</Tag>
          </span>
        ) : <Tag tone="default">no type</Tag>}
        <StageGlyph stage={stage} />
        {status ? <Tag tone="default">status: {status}</Tag> : null}
        {pillars.length > 0 ? (
          <div data-testid="pillars" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {pillars.map((p) => <PillarChip key={p} name={p} />)}
          </div>
        ) : null}
      </div>

      <div style={{
        display: 'flex', gap: 18, flexWrap: 'wrap',
        fontSize: 12, fontFamily: 'var(--font-mono)',
      }}>
        <MetadataItem label="born" value={born} />
        <MetadataItem label="last_activated" value={last_activated} />
        <MetadataItem label="activation_count" value={activation_count} />
        <MetadataItem label="confidence" value={confidence} />
        <MetadataItem label="energy" value={energy} />
        <MetadataItem label="who_leads" value={who_leads} />
        <MetadataItem label="version" value={version} />
      </div>
    </div>
  );
}
