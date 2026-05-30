import React from 'react';
import { Box } from '../primitives.jsx';
import ArtifactSlot from '../ArtifactSlot.jsx';

// SCHEMA §8 made visible: an entry renders WITH its owned files
// (handoff, context, sources, sketches, enrichments). Media artifacts
// render inline using the existing ArtifactSlot — image as <img>, audio
// as <audio controls>, html as a sandboxed iframe — so the "enrichment
// renders where it lives" promise in the STATE deck is kept by reusing
// the Phase 7-9 engine rather than building a parallel one.
//
// Non-media files (.md, .py, .json, .pdf) render as named rows the human
// can click to open natively.

function KindBadge({ kind }) {
  return (
    <span style={{
      color: 'var(--phosphor-dim)', textShadow: 'none',
      fontSize: 10, letterSpacing: '.08em',
      textTransform: 'uppercase',
      border: '1px solid var(--phosphor-dim)',
      padding: '0 5px',
    }}>{kind}</span>
  );
}

function MediaCard({ file }) {
  // ArtifactSlot expects payload.artifacts: [{path, caption?}]. Reuse it
  // verbatim so the rendering matches QUEUE-side enrichment cards 1:1.
  const synthPayload = { artifacts: [{ path: file.relPath, caption: null }] };
  return (
    <div data-testid="bundle-media" data-kind={file.kind} data-path={file.relPath}>
      <ArtifactSlot payload={synthPayload} />
    </div>
  );
}

function FileRow({ file }) {
  return (
    <div
      data-testid="bundle-file"
      data-kind={file.kind}
      style={{
        display: 'flex', gap: 12, alignItems: 'baseline',
        padding: '3px 0',
        borderBottom: '1px dashed var(--phosphor-dim)',
      }}
    >
      <KindBadge kind={file.kind} />
      <a
        href={`/api/open?path=${encodeURIComponent(file.relPath)}`}
        style={{
          color: 'var(--link)', textShadow: 'var(--glow)',
          textDecoration: 'none', borderBottom: '1px dashed currentColor',
          flex: 1, wordBreak: 'break-all',
        }}
      >
        {file.name}
      </a>
      <span style={{
        color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11,
      }}>
        {file.size > 0 ? formatBytes(file.size) : ''}
      </span>
    </div>
  );
}

function formatBytes(n) {
  if (n < 1024) return `${n} b`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kb`;
  return `${(n / 1024 / 1024).toFixed(1)} mb`;
}

const MEDIA_KINDS = new Set(['image', 'audio', 'video', 'html']);

export default function BundlePanel({ bundle }) {
  if (!bundle || !Array.isArray(bundle.files) || bundle.files.length === 0) {
    return null;
  }
  const media = bundle.files.filter((f) => MEDIA_KINDS.has(f.kind));
  const rest = bundle.files.filter((f) => !MEDIA_KINDS.has(f.kind));

  return (
    <Box title={`BUNDLE  ${bundle.dir}  (${bundle.files.length} files)`} tone="single">
      {media.length > 0 ? (
        <div data-testid="bundle-media-list" style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
          {media.map((f) => <MediaCard key={f.relPath} file={f} />)}
        </div>
      ) : null}
      {rest.length > 0 ? (
        <div data-testid="bundle-file-list">
          {rest.map((f) => <FileRow key={f.relPath} file={f} />)}
        </div>
      ) : null}
    </Box>
  );
}
