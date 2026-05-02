import React from 'react';
import { Rule } from './primitives.jsx';
import { buildRoster } from '../lib/roster.js';
import { healthColor, formatTs } from '../lib/format.js';

export default function AgentRoster({ messages, activeFilter, onSelect }) {
  const roster = buildRoster(messages);
  return (
    <div
      data-testid="agent-roster"
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--phosphor)',
        minWidth: 260,
      }}
    >
      <Rule>{`AGENTS · ${roster.length}`}</Rule>
      {roster.length === 0 ? (
        <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', padding: '6px 0' }}>
          (no named agents)
        </div>
      ) : (
        <div style={{ padding: '6px 0' }}>
          {roster.map((a) => {
            const active = activeFilter === a.agent_id;
            return (
              <div
                key={a.agent_id}
                data-testid={`roster-row-${a.agent_id}`}
                data-active={active ? 'true' : 'false'}
                onClick={() => onSelect?.(active ? null : a.agent_id)}
                style={{
                  cursor: 'pointer',
                  padding: '4px 6px',
                  margin: '0 -6px',
                  background: active ? 'var(--phosphor)' : 'transparent',
                  color: active ? 'var(--bg)' : 'var(--phosphor)',
                  textShadow: active ? 'none' : 'var(--glow)',
                  borderBottom: '1px dashed var(--phosphor-dim)',
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{
                    color: active ? 'var(--bg)' : 'var(--ansi-bright-cyan)',
                    textShadow: active ? 'none' : 'var(--glow)',
                    fontWeight: 600,
                  }}>@{a.agent_id}</span>
                  <span style={{
                    color: active ? 'var(--bg)' : healthColor(a.latest_score),
                    textShadow: active ? 'none' : 'var(--glow)',
                    fontSize: 11,
                  }}>{a.latest_score || '—'}</span>
                  <span style={{
                    color: active ? 'var(--bg)' : 'var(--phosphor-dim)',
                    textShadow: 'none', fontSize: 11, marginLeft: 'auto',
                  }}>{formatTs(a.last_ts)}</span>
                </div>
                <div style={{
                  display: 'flex', gap: 8, alignItems: 'baseline',
                  fontSize: 11,
                  color: active ? 'var(--bg)' : 'var(--phosphor-dim)',
                  textShadow: 'none',
                }}>
                  <span>ctx {typeof a.latest_context_pct === 'number'
                    ? `${Math.round(a.latest_context_pct * 100)}%`
                    : '—'}</span>
                  <span>·</span>
                  <span>msgs {a.message_count}</span>
                  {a.context_trend && (
                    <>
                      <span>·</span>
                      <span data-testid="context-trend" style={{
                        color: active ? 'var(--bg)' : 'var(--warn)',
                        textShadow: active ? 'none' : 'var(--glow)',
                      }}>
                        {a.context_trend.map((c) => `${Math.round(c * 100)}%`).join(' -> ')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{
        marginTop: 6,
        padding: '4px 6px',
        color: 'var(--phosphor-dim)',
        textShadow: 'none',
        fontSize: 10,
      }}>
        click an agent to filter the message list. click again to clear.
      </div>
    </div>
  );
}
