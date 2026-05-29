import React from 'react';
import { tableFromPayload } from '../lib/richcontent.js';

// Structured comparison grid — what PROOF/data wanted to be instead of raw JSON.
// Monospace, CP437-weight borders, header row emphasized, no rounded corners.
export default function TableBlock({ payload }) {
  const table = tableFromPayload(payload);
  if (!table) return null;

  const cell = {
    border: '1px solid var(--phosphor-dim)',
    padding: '3px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    textAlign: 'left',
    verticalAlign: 'top',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  return (
    <div data-testid="table-block" style={{ marginTop: 8, overflowX: 'auto' }}>
      {table.caption ? (
        <div style={{
          color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4,
        }}>{table.caption}</div>
      ) : null}
      <table style={{ borderCollapse: 'collapse', maxWidth: '100%', color: 'var(--phosphor)' }}>
        <thead>
          <tr>
            {table.columns.map((c, i) => (
              <th key={i} style={{ ...cell, color: 'var(--phosphor-bright)', textShadow: 'var(--glow)', fontWeight: 600 }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} data-testid="table-row">
              {row.map((c, ci) => (
                <td key={ci} style={{ ...cell, textShadow: 'var(--glow)' }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
