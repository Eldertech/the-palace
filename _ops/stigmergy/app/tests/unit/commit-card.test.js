// Unit tests for CommitCard's inline deposit body.
//
// After the 2026-06-19 "Deposit Archive → LOG Deck" migration a deposit's
// record IS its commit body. CommitCard renders that synthesis inline for
// deposit-kind cards (other kinds keep drill-in only, so the stream isn't
// bloated). Render assertions use renderToStaticMarkup (node env, no DOM) —
// the same convention as trickster-card.test.js; bodyProse is tested as a
// pure function.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CommitCard from '../../src/components/log/CommitCard.jsx';
import { bodyProse } from '../../src/lib/commit-parse.js';

const SYNTH = [
  'Migrated the deposit record into the LOG deck.',
  'The synthesis lives here now, in the commit body.',
  '',
  'Weave flags: none.',
  '',
  'Palace-Kind: deposit',
  'Palace-Entry: Deposit Ceremony',
  'Palace-Author: claude',
  'Palace-Verify: verified',
].join('\n');

const DEPOSIT = {
  hash: 'abc123def4567890',
  shortHash: 'abc123d',
  kind: 'deposit',
  kindSource: 'trailer',
  knownKind: true,
  scope: 'D-2026-06-19-ARCHIVE',
  summary: 'folded the deposit archive into the LOG deck',
  entries: ['Deposit Ceremony', 'Deposit Archive'],
  body: SYNTH,
  author: 'loudon',
  date: '2026-06-21T18:00:00Z',
  added: 19,
  deleted: 10,
  fileCount: 2,
  verify: 'verified',
  stage: [],
  vector: [],
  resolves: [],
  campaign: null,
};

const render = (commit, props) =>
  renderToStaticMarkup(React.createElement(CommitCard, { commit, ...props }));

describe('CommitCard — inline deposit body', () => {
  it('renders the synthesis body inline on a deposit card', () => {
    const html = render(DEPOSIT);
    expect(html).toContain('data-testid="commit-card-body"');
    expect(html).toContain('The synthesis lives here now');
  });

  it('keeps synthesis content like the Weave flags line', () => {
    // "Weave flags:" is synthesis prose, NOT a Palace- trailer — it must stay.
    expect(render(DEPOSIT)).toContain('Weave flags: none.');
  });

  it('strips Palace-* trailers from the inline body (already shown as chips/badges)', () => {
    const html = render(DEPOSIT);
    expect(html).not.toContain('Palace-Kind');
    expect(html).not.toContain('Palace-Verify');
    expect(html).not.toContain('Palace-Entry');
  });

  it('still renders the summary on a deposit card', () => {
    expect(render(DEPOSIT)).toContain('folded the deposit archive into the LOG deck');
  });

  it('does NOT render the inline body for non-deposit kinds', () => {
    const edit = { ...DEPOSIT, kind: 'edit', kindSource: 'subject' };
    const html = render(edit);
    expect(html).not.toContain('data-testid="commit-card-body"');
    expect(html).not.toContain('The synthesis lives here now');
    // ...but the card itself still renders.
    expect(html).toContain('folded the deposit archive into the LOG deck');
  });

  it('does NOT render the inline body in compact mode', () => {
    const html = render(DEPOSIT, { compact: true });
    expect(html).not.toContain('data-testid="commit-card-body"');
  });

  it('renders no body block when a deposit has an empty body', () => {
    const html = render({ ...DEPOSIT, body: '' });
    expect(html).not.toContain('data-testid="commit-card-body"');
  });

  it('renders no body block when a deposit body is only trailers', () => {
    const html = render({ ...DEPOSIT, body: 'Palace-Kind: deposit\nPalace-Author: claude' });
    expect(html).not.toContain('data-testid="commit-card-body"');
  });
});

describe('bodyProse — strip machine trailers, keep prose', () => {
  it('drops Palace-* trailer lines', () => {
    const out = bodyProse('Real synthesis.\n\nPalace-Kind: deposit\nPalace-Entry: X');
    expect(out).toBe('Real synthesis.');
  });

  it('keeps a Weave flags: line (not a Palace- trailer)', () => {
    const out = bodyProse('Synthesis.\n\nWeave flags: posted GSL→Kuramoto.\n\nPalace-Kind: deposit');
    expect(out).toContain('Weave flags: posted GSL→Kuramoto.');
    expect(out).not.toContain('Palace-Kind');
  });

  it('collapses the blank runs trailer removal leaves, and trims', () => {
    const out = bodyProse('A.\n\n\n\nPalace-Kind: deposit\n');
    expect(out).toBe('A.');
    expect(out).not.toMatch(/\n{3,}/);
  });

  it('returns "" for non-string input', () => {
    expect(bodyProse(undefined)).toBe('');
    expect(bodyProse(null)).toBe('');
    expect(bodyProse(42)).toBe('');
  });

  it('leaves a trailer-free body untouched (aside from trimming)', () => {
    expect(bodyProse('  Just prose.  ')).toBe('Just prose.');
  });
});
