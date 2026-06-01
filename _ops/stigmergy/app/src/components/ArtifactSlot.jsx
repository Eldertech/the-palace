import React from 'react';
import { detectArtifactType, fileUrl, artifactsFromPayload, basenameOf } from '../lib/artifact.js';
import PhosphorAudio from './PhosphorAudio.jsx';

// One rendered artifact. The element depends on the detected type; the frame
// is the same BBS phosphor card for all of them.
function ArtifactBody({ path }) {
  const type = detectArtifactType(path);
  const url = fileUrl(path);
  const name = basenameOf(path);

  if (type === 'image') {
    return (
      <img
        data-testid="artifact-img"
        src={url}
        alt={name}
        style={{ maxWidth: '100%', height: 'auto', display: 'block', borderRadius: 0 }}
      />
    );
  }
  if (type === 'audio') {
    // Phosphor control strip in lieu of the browser's white/grey default
    // chrome. The native player is hidden inside PhosphorAudio; our
    // controls drive it programmatically. The wrapping <div> keeps the
    // existing data-testid so v0.3/v0.4 e2e tests still find the slot.
    return (
      <div data-testid="artifact-audio">
        <PhosphorAudio src={url} />
      </div>
    );
  }
  if (type === 'iframe') {
    // sandbox="allow-scripts" ONLY — deliberately no allow-same-origin. The
    // artifact loads from STIGMERGY's own origin, so withholding same-origin
    // forces it into an opaque origin: scripts run, but it cannot touch the
    // BBS DOM/storage or call the orchestrator's POST endpoint.
    return (
      <iframe
        data-testid="artifact-iframe"
        title={name}
        src={url}
        sandbox="allow-scripts"
        style={{
          width: '100%', height: 480,
          border: '1px solid var(--phosphor-dim)', background: 'var(--bg)', borderRadius: 0,
        }}
      />
    );
  }
  // Unknown type — fall back to a native-open link (reuses GET /api/open).
  return (
    <a
      data-testid="artifact-link"
      href={`/api/open?path=${encodeURIComponent(path)}`}
      style={{
        color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)',
        textDecoration: 'underline', wordBreak: 'break-all',
      }}
    >
      ↗ open {name}
    </a>
  );
}

// Map the detected file type to a human-readable label. "iframe" is a DOM
// term, not a reader's term -- HTML files should read as WEB. Audio plays
// open the native app already (PhosphorAudio's open-native chip), so its
// label here just names the medium.
const TYPE_LABEL = {
  image: 'image',
  audio: 'audio',
  video: 'video',
  iframe: 'web',
  file: 'artifact',
};

// An "open in <native app>" chip. Hits GET /api/open which calls the OS's
// `open` (macOS) / `xdg-open` (Linux) -- HTML files launch the default
// browser, audio opens Audacity/QuickTime, etc. Fires-and-stays: the BBS
// surface never navigates away.
function OpenExternalChip({ path, type }) {
  const title = type === 'iframe'
    ? 'open in your default browser'
    : `open in native ${type} app`;
  function fire(e) {
    e.preventDefault();
    fetch(`/api/open?path=${encodeURIComponent(path)}`).catch(() => {});
  }
  return (
    <a
      data-testid="artifact-open-external"
      href={`/api/open?path=${encodeURIComponent(path)}`}
      onClick={fire}
      title={title}
      style={{
        color: 'var(--phosphor)',
        textShadow: 'var(--glow)',
        textDecoration: 'none',
        fontSize: 10,
        border: '1px solid var(--phosphor-dim)',
        padding: '1px 6px',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '.04em',
      }}
    >↗ open</a>
  );
}

// The artifact slot: renders alongside (not inside) the type-specific payload
// rendering, for any message type. Keyed on artifact presence in the payload,
// per BBS Production Plan v0.3.
export default function ArtifactSlot({ payload }) {
  const artifacts = artifactsFromPayload(payload);
  if (artifacts.length === 0) return null;

  return (
    <div data-testid="artifact-slot" style={{ marginTop: 8, display: 'grid', gap: 10 }}>
      {artifacts.map((a, i) => {
        const type = detectArtifactType(a.path);
        const label = TYPE_LABEL[type] || 'artifact';
        return (
          <div
            key={i}
            data-testid="artifact"
            data-artifact-type={type}
            style={{
              border: '1px solid var(--phosphor-dim)',
              background: 'var(--phosphor-deep)',
              borderRadius: 0,
              padding: '8px 10px',
            }}
          >
            <div style={{
              color: 'var(--phosphor-dim)', textShadow: 'none',
              fontSize: 11, marginBottom: 6,
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'var(--font-mono)',
            }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {label} · {basenameOf(a.path)}
              </span>
              <span style={{ flex: 1 }} />
              <OpenExternalChip path={a.path} type={type} />
            </div>
            <ArtifactBody path={a.path} />
            {a.caption ? (
              <div
                data-testid="artifact-caption"
                style={{
                  color: 'var(--phosphor-dim)', textShadow: 'none',
                  fontSize: 12, marginTop: 6, maxWidth: '78ch',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {a.caption}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
