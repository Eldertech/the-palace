import React, { useEffect, useRef, useState } from 'react';

// Phosphor-themed mermaid diagram renderer.
//
// Code fences tagged ` ```mermaid ` are routed here. We lazy-load mermaid
// only when the first diagram appears -- the library is ~600KB minified,
// so most palace views (entries without diagrams) never pay the cost.
// On parse error we fall back to a phosphor <pre> so the source is still
// readable, mirroring how Obsidian degrades on a broken diagram.
//
// Theme: stroke = phosphor, fill = phosphor-deep, text = phosphor-bright.
// Diagrams are inherently graphical so they're a different visual register
// than the surrounding VT323 prose -- but the palette keeps them visually
// belonging to the BBS surface.

let mermaidPromise = null;
let nextId = 0;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => {
      const m = mod.default ?? mod;
      m.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'strict',
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
        themeVariables: {
          background: 'transparent',
          primaryColor: '#0a1f0a',          // phosphor-deep
          primaryTextColor: '#b5ffb5',      // phosphor-bright
          primaryBorderColor: '#33ff33',    // phosphor
          lineColor: '#33ff33',             // phosphor
          secondaryColor: '#1a3a1a',
          secondaryTextColor: '#b5ffb5',
          secondaryBorderColor: '#33ff33',
          tertiaryColor: '#0a1f0a',
          tertiaryTextColor: '#b5ffb5',
          tertiaryBorderColor: '#33ff33',
          // Text colors for cluster/edge labels
          labelTextColor: '#b5ffb5',
          edgeLabelBackground: '#0a1f0a',
          nodeBorder: '#33ff33',
          mainBkg: '#0a1f0a',
          clusterBkg: '#050d05',
          clusterBorder: '#33ff33',
          titleColor: '#b5ffb5',
        },
      });
      return m;
    });
  }
  return mermaidPromise;
}

export default function MermaidBlock({ source }) {
  const ref = useRef(null);
  const [state, setState] = useState({ kind: 'loading' });
  const idRef = useRef(`mermaid-${++nextId}`);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    loadMermaid()
      .then((m) => m.render(idRef.current, source))
      .then((result) => {
        if (cancelled) return;
        setState({ kind: 'ok', svg: result.svg });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ kind: 'err', error: err?.message ?? String(err) });
      });
    return () => { cancelled = true; };
  }, [source]);

  if (state.kind === 'loading') {
    return (
      <div data-testid="mermaid-loading" style={{
        border: '1px solid var(--phosphor-dim)',
        background: 'var(--phosphor-deep)',
        padding: '12px',
        margin: '12px 0',
        color: 'var(--phosphor-dim)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
      }}>
        loading mermaid...
      </div>
    );
  }

  if (state.kind === 'err') {
    return (
      <div data-testid="mermaid-error" style={{
        border: '1px solid var(--warn)',
        background: 'var(--phosphor-deep)',
        margin: '12px 0',
      }}>
        <div style={{
          color: 'var(--warn)', fontSize: 11,
          padding: '4px 12px', borderBottom: '1px solid var(--warn)',
          textTransform: 'uppercase', letterSpacing: '.06em',
        }}>
          mermaid render failed: {state.error}
        </div>
        <pre style={{
          margin: 0, padding: '8px 12px',
          color: 'var(--phosphor-bright)', textShadow: 'var(--glow)',
          fontFamily: 'var(--font-mono)', fontSize: 12,
          overflowX: 'auto',
        }}>
          <code>{source}</code>
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      data-testid="mermaid-block"
      // The wrapping div must be a block with explicit width so the SVG
      // (which mermaid emits with width="100%" + viewBox + max-width but
      // NO explicit height) has a layout box to expand into. Without
      // this, the SVG's default `display: inline` collapses to 0x0.
      style={{
        display: 'block',
        width: '100%',
        border: '1px solid var(--phosphor-dim)',
        background: 'var(--phosphor-deep)',
        padding: 12,
        margin: '12px 0',
        boxSizing: 'border-box',
        overflowX: 'auto',
        textAlign: 'center',
        // Force the injected SVG to behave as a block element with
        // height derived from its intrinsic aspect ratio.
        ['--mermaid-svg-display']: 'block',
      }}
      // mermaid.render returns sanitized SVG (securityLevel: 'strict' above).
      // We wrap it in a fragment-with-style-tag so the SVG renders as block.
      dangerouslySetInnerHTML={{
        __html: `<style>[data-testid="mermaid-block"] > svg { display: block; height: auto; margin: 0 auto; }</style>${state.svg}`,
      }}
    />
  );
}
