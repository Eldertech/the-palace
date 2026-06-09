// Unit tests for graffiti rendering in EntryBody's minimal markdown reader.
//
// Decided 2026-06-08 (M1d): HTML-comment graffiti is no longer stripped. The
// palace's in-file marks (CLAUDE.md "In-File Comments" / [[Palace Graffiti]])
// were invisible in every renderer; now that STIGMERGY is the first-class
// palace interface, it surfaces them as visible scrawls — block-level and
// inline — while Obsidian/exports still hide them (storage is unchanged).
// "All graffiti visible": graffiti:, CLAUDE → LOUDON:, and plain note: forms
// all render, each tagged with its form.
//
// Convention matches entry-body-table.test.js: renderToStaticMarkup in node.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EntryBody from '../../src/components/state/EntryBody.jsx';

function html(body, index = new Map()) {
  return renderToStaticMarkup(React.createElement(EntryBody, { body, index }));
}

describe('EntryBody — graffiti scrawls', () => {
  it('renders a block-level <!-- graffiti: ... --> as a visible scrawl', () => {
    const out = html('# H\n\n<!-- graffiti: route through the permitted neighbor -->');
    expect(out).toContain('data-testid="graffiti"');
    expect(out).toContain('data-form="graffiti"');
    expect(out).toContain('route through the permitted neighbor');
  });

  it('tags a CLAUDE → LOUDON note with its form', () => {
    const out = html('<!-- CLAUDE → LOUDON: this section is thin -->');
    expect(out).toContain('data-testid="graffiti"');
    expect(out).toContain('this section is thin');
    expect(out).toContain('claude'); // form label "claude → loudon"
  });

  it('treats a bare comment as a Loudon note, stripping a leading note:', () => {
    const out = html('<!-- note: come back to this -->');
    expect(out).toContain('data-form="note"');
    expect(out).toContain('come back to this');
    expect(out).not.toContain('note: come back'); // the prefix is consumed
  });

  it('drops an empty comment (no text) — matching the old strip-on-empty', () => {
    const out = html('before\n\n<!-- -->\n\nafter');
    expect(out).not.toContain('data-testid="graffiti"');
    expect(out).toContain('before');
    expect(out).toContain('after');
  });

  it('renders an inline comment as an inline scrawl, keeping the prose around it', () => {
    const out = html('the flesh <!-- note: per MP --> is the medium.');
    expect(out).toContain('data-testid="graffiti-inline"');
    expect(out).toContain('per MP');
    expect(out).toContain('the flesh');
    expect(out).toContain('is the medium');
    // the surrounding text is still a paragraph, not swallowed by the comment
    expect(out).toContain('<p');
  });

  it('renders a multi-line block comment in full', () => {
    const out = html('<!-- graffiti: line one\nline two -->');
    expect(out).toContain('data-testid="graffiti"');
    expect(out).toContain('line one');
    expect(out).toContain('line two');
  });

  it('does not let a block comment swallow an adjacent paragraph', () => {
    const out = html('a real paragraph\n<!-- graffiti: a mark -->\nanother paragraph');
    expect(out).toContain('a real paragraph');
    expect(out).toContain('another paragraph');
    expect(out).toContain('data-testid="graffiti"');
    expect(out).toContain('a mark');
  });

  it('renders wikilinks inside a graffiti scrawl', () => {
    const out = html('<!-- graffiti: see [[Merleau-Ponty]] -->', new Map([['Merleau-Ponty', 'Merleau-Ponty.md']]));
    expect(out).toContain('data-testid="graffiti"');
    expect(out).toContain('data-testid="body-wikilink"');
  });
});
