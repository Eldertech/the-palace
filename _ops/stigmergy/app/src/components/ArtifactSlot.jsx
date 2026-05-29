import React from 'react';
import { detectArtifactType, fileUrl, artifactsFromPayload, basenameOf } from '../lib/artifact.js';

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
    // Browser-default controls are an accepted v0.3 break; a phosphor control
    // strip is v0.4 polish (see BBS Production Plan v0.3).
    return (
      <audio data-testid="artifact-audio" controls preload="none" src={url} style={{ width: '100%' }} />
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
        const label = type === 'file' ? 'artifact' : type;
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
              textTransform: 'uppercase', letterSpacing: '.06em',
              fontFamily: 'var(--font-mono)',
            }}>
              {label} · {basenameOf(a.path)}
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
