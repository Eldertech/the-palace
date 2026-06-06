// Unit tests for the native TricksterCard (the [T] deck's card).
//
// Two layers, matching the codebase's conventions:
//   1. Render assertions via renderToStaticMarkup (node env, no DOM) — proves
//      the catchup-first layout shows headline/ground/options and falls back
//      to the no-catchup pill. (Click/keyboard interaction is an e2e concern;
//      this suite is environment 'node' with no jsdom.)
//   2. Pure-logic assertions on buildCardGrant() — the file-path's message
//      builder — validated against the real §2.2 validator, the same way
//      response-builder.test.js validates buildResponse().

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TricksterCard, { buildCardGrant } from '../../src/components/trickster/TricksterCard.jsx';
import { validateMessage } from '../../server/validator.js';
import { t } from '../../src/lib/lexicon.js';

// A pending_requests[] entry in the shape buildInbox() produces.
const ITEM = {
  request_id: 'gsl-steward-028',
  from: 'GSL-STEWARD',
  ts: '2026-06-03T09:00:00Z',
  resource: 'human_ear_check',
  headline: 'Does each of the twelve drones read as a single fused tone?',
  ground: 'paused on your ears · all 12 drones rendered · no lean — you decide',
  rationale: 'Twelve octave-stacked sines, one per pitch class. See [[GSL]].',
  query_intent: 'confirm perceptual fusion before shipping the instrument',
  blocking: true,
  agent_health: 'green',
  agent_context_pct: 0.42,
  agent_status: 'suspended_on_this_thread',
  options: [
    { id: 'SHIP', label: 'SHIP — ship the 128-region instrument' },
    { id: 'TWEAK', label: 'TWEAK — adjust the Gaussian' },
    { id: 'REJECT', label: 'REJECT — reject the recipe' },
  ],
  _message_id: 'msg-gsl-028',
  _session_id: 'gsl-steward-session-01',
};

const render = (props) =>
  renderToStaticMarkup(React.createElement(TricksterCard, { item: ITEM, ...props }));

describe('TricksterCard — render', () => {
  it('renders the headline when present', () => {
    const html = render();
    expect(html).toContain(ITEM.headline);
    expect(html).toContain('data-testid="card-headline"');
  });

  it('renders the ground breadcrumb', () => {
    const html = render();
    expect(html).toContain(ITEM.ground);
    expect(html).toContain('data-testid="card-ground"');
  });

  it('renders each request-supplied option label', () => {
    const html = render();
    for (const opt of ITEM.options) expect(html).toContain(opt.label);
  });

  it('always offers a freeform note field', () => {
    const html = render();
    expect(html).toContain('data-testid="card-notes"');
  });

  it('shows the correlation id and steward in the header', () => {
    const html = render();
    expect(html).toContain('gsl-steward-028');
    expect(html).toContain('@GSL-STEWARD');
  });

  it('falls back to the no-catchup pill when headline and ground are both absent', () => {
    const bare = { ...ITEM, headline: null, ground: null };
    const html = renderToStaticMarkup(React.createElement(TricksterCard, { item: bare }));
    expect(html).toContain('data-testid="no-catchup-pill"');
    expect(html).toContain(t('trickster.card.nocatchup'));
    // With no catchup, the longform fold opens by default.
    expect(html).toMatch(/<details[^>]*\sopen/);
  });

  it('does not open the fold by default when catchup is present', () => {
    const html = render();
    expect(html).not.toMatch(/<details[^>]*\sopen/);
  });
});

describe('buildCardGrant — message building', () => {
  it('builds a §2.2-valid RESOURCE_GRANT from a chosen option', () => {
    const msg = buildCardGrant(ITEM, {
      optionId: 'SHIP',
      optionLabel: 'SHIP — ship the 128-region instrument',
    });
    const result = validateMessage(msg);
    expect(result.valid, JSON.stringify(result)).toBe(true);
    expect(msg.type).toBe('RESOURCE_GRANT');
    expect(msg.payload.option_id).toBe('SHIP');
    expect(msg.payload.option_label).toBe('SHIP — ship the 128-region instrument');
    expect(msg.payload.granted).toBe(true);
  });

  it('correlates re: to the request_id (not the message id)', () => {
    const msg = buildCardGrant(ITEM, { optionId: 'SHIP', optionLabel: 'SHIP' });
    expect(msg.re).toBe('gsl-steward-028');
    expect(msg.re).not.toBe('msg-gsl-028');
  });

  it('carries the freeform note into the payload', () => {
    const msg = buildCardGrant(ITEM, { optionId: 'TWEAK', optionLabel: 'TWEAK', notes: 'widen the tails a touch' });
    expect(msg.payload.notes).toBe('widen the tails a touch');
  });

  it('supports a notes-only grant (no option chosen)', () => {
    const msg = buildCardGrant(ITEM, { notes: 'sounds great, ship it' });
    expect(validateMessage(msg).valid).toBe(true);
    expect(msg.payload.option_id).toBe(null);
    expect(msg.payload.notes).toBe('sounds great, ship it');
  });

  it('routes the grant to the original requester on the TRICKSTER board', () => {
    const msg = buildCardGrant(ITEM, { optionId: 'SHIP', optionLabel: 'SHIP' });
    expect(msg.to).toBe('GSL-STEWARD');
    expect(msg.board).toBe('TRICKSTER');
    expect(msg.from).toBe('TRICKSTER');
  });

  it('throws when neither an option nor a note is supplied', () => {
    expect(() => buildCardGrant(ITEM, {})).toThrow();
  });
});
