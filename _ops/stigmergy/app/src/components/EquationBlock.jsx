import React from 'react';
import { equationsFromPayload } from '../lib/richcontent.js';

// Dual-channel math. The palace rule: render an equation TWICE — the symbolic
// form and the worded (named-variable) form — keeping operator symbols in both.
// Terminal-native: monospace Unicode, no KaTeX/MathJax/CDN (proportional serif
// math would break the phosphor aesthetic and the no-CDN house rule). The author
// supplies both strings; this just frames them.
export default function EquationBlock({ payload }) {
  const equations = equationsFromPayload(payload);
  if (equations.length === 0) return null;

  return (
    <div data-testid="equation-block" style={{ marginTop: 8, display: 'grid', gap: 10 }}>
      {equations.map((eq, i) => (
        <div
          key={i}
          data-testid="equation"
          style={{
            border: '1px solid var(--phosphor-dim)',
            background: 'var(--phosphor-deep)',
            borderRadius: 0,
            padding: '8px 12px',
          }}
        >
          {eq.label ? (
            <div style={{
              color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6,
            }}>{eq.label}</div>
          ) : null}

          {eq.symbolic ? (
            <div data-testid="equation-symbolic" style={{
              fontFamily: 'var(--font-mono)', fontSize: 16,
              color: 'var(--phosphor-bright)', textShadow: 'var(--glow)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>{eq.symbolic}</div>
          ) : null}

          {eq.worded ? (
            <div data-testid="equation-worded" style={{
              fontFamily: 'var(--font-mono)', fontSize: 13,
              color: 'var(--phosphor)', textShadow: 'var(--glow)',
              marginTop: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              maxWidth: '78ch',
            }}>{eq.worded}</div>
          ) : null}

          {eq.where.length > 0 ? (
            <div data-testid="equation-where" style={{
              marginTop: 8, color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12,
            }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>where</span>
              {eq.where.map((w, wi) => (
                <div key={wi} style={{ marginLeft: 10 }}>
                  <span style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>{w.sym}</span>
                  {' = '}{w.def}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
