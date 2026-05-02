import React from 'react';
import { healthColor } from '../lib/format.js';

// Renders a single per-message health badge: [ctx 18% · qwen3:14b · green]
// If health is missing entirely, returns a dim [no health] placeholder.
export default function HealthBlock({ health }) {
  if (!health || typeof health !== 'object') {
    return (
      <span data-testid="health-block" data-score="none" style={{
        color: 'var(--phosphor-dim)', textShadow: 'none',
        fontSize: 11, marginLeft: 8,
      }}>
        [no health]
      </span>
    );
  }
  const { context_pct, model, score } = health;
  const ctx = typeof context_pct === 'number' ? `${Math.round(context_pct * 100)}%` : '—';
  const m = typeof model === 'string' && model ? model : '—';
  const s = typeof score === 'string' && score ? score : '—';
  return (
    <span
      data-testid="health-block"
      data-score={s}
      style={{
        color: healthColor(s),
        textShadow: s === 'green' || s === 'yellow' || s === 'red' ? 'var(--glow)' : 'none',
        fontSize: 11,
        marginLeft: 8,
        whiteSpace: 'nowrap',
      }}
    >
      [ctx {ctx} · {m} · {s}]
    </span>
  );
}
