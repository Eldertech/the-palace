// Unit tests for GFM table rendering in EntryBody's minimal markdown reader.
//
// Regression target: tables used to fall through to the paragraph branch,
// which joins contiguous lines with spaces -- collapsing a table into an
// unreadable wall of pipes (the SCHEMA.md screenshot bug). These assert the
// rows now become a real <table>, header cells are <th>, escaped \| inside a
// cell is unescaped, and code spans inside cells still render.
//
// Convention matches trickster-card.test.js: renderToStaticMarkup in the
// node env (no jsdom), asserting on the emitted HTML string.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EntryBody from '../../src/components/state/EntryBody.jsx';

function html(body, index = new Map()) {
  return renderToStaticMarkup(React.createElement(EntryBody, { body, index }));
}

// The exact table from SCHEMA.md §Type-Specific Required Fields.
const SCHEMA_TABLE = [
  '| Type | Extra required fields |',
  '|---|---|',
  '| `project` | `status`: active \\| complete \\| archived |',
  '| `source` | `author`, `year`, `medium`: paper \\| book \\| tool \\| recording \\| other |',
].join('\n');

describe('EntryBody — GFM tables', () => {
  it('renders a markdown table as a <table>, not a paragraph wall', () => {
    const out = html(SCHEMA_TABLE);
    expect(out).toContain('data-testid="md-table"');
    expect(out).toContain('<th');
    expect(out).toContain('<td');
    // The |---| delimiter row must be consumed, never shown.
    expect(out).not.toContain('---');
  });

  it('unescapes \\| inside a cell to a literal pipe', () => {
    const out = html(SCHEMA_TABLE);
    expect(out).toContain('active | complete | archived');
    expect(out).not.toContain('active \\|');
  });

  it('renders inline code spans inside cells', () => {
    const out = html(SCHEMA_TABLE);
    expect(out).toContain('<code');
    expect(out).toContain('project');
  });

  it('does not treat a thematic break (---) as a table', () => {
    const out = html('above\n\n---\n\nbelow');
    expect(out).not.toContain('data-testid="md-table"');
  });

  it('does not treat a pipe in prose as a table without a delimiter row', () => {
    const out = html('this is a | b sort of sentence with a pipe');
    expect(out).not.toContain('data-testid="md-table"');
    expect(out).toContain('<p');
  });

  it('renders a header-less-friendly two-column table with body rows', () => {
    const out = html(['| A | B |', '|---|---|', '| 1 | 2 |'].join('\n'));
    expect(out).toContain('data-testid="md-table"');
    expect(out).toContain('>1<');
    expect(out).toContain('>2<');
  });
});
