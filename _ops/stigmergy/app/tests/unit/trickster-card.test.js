// Unit tests for the native TricksterCard (the [T] deck's card).
//
// Two layers, matching the codebase's conventions:
//   1. Render assertions via renderToStaticMarkup (node env, no DOM) — proves
//      the v2.0 locked reading order: who → orientation → evidence → question →
//      options → ▸more/▸details, the two-step execute row, the recommended-on-
//      its-button marking, and the radical-minimalism chrome strip (no pill, no
//      field labels). (Click/keyboard interaction is an e2e concern; this suite
//      is environment 'node' with no jsdom.)
//   2. Pure-logic assertions on buildCardGrant() — the file-path's message
//      builder — validated against the real §2.2 validator, the same way
//      response-builder.test.js validates buildResponse().

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TricksterCard, { buildCardGrant } from '../../src/components/trickster/TricksterCard.jsx';
import { validateMessage } from '@stigmergy/core/schema';
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

describe('TricksterCard — locked reading order', () => {
  it('renders the question (headline) when present', () => {
    const html = render();
    expect(html).toContain(ITEM.headline);
    expect(html).toContain('data-testid="card-headline"');
  });

  it('renders the orientation (ground) line, dim and pill-free', () => {
    const html = render();
    expect(html).toContain(ITEM.ground);
    expect(html).toContain('data-testid="card-orientation"');
    // The cut chrome: no PARKED/DOING tag, no "no catchup" pill, ever.
    expect(html).not.toContain('data-testid="no-catchup-pill"');
  });

  it('renders each request-supplied option label', () => {
    const html = render();
    for (const opt of ITEM.options) expect(html).toContain(opt.label);
    expect(html).toContain('data-testid="card-options"');
  });

  it('shows the project name in the who-row (no @ handle, no request-id header)', () => {
    const html = render();
    expect(html).toContain('data-testid="card-from"');
    expect(html).toContain('GSL-STEWARD');
    // The bare '@handle' prefix is gone — the project reads as its own name.
    expect(html).not.toContain('@GSL-STEWARD');
  });

  it('shows a quiet "waiting on you" only when the steward is blocking', () => {
    expect(render()).toContain('data-testid="card-waiting"');
    const nonBlocking = renderToStaticMarkup(
      React.createElement(TricksterCard, { item: { ...ITEM, blocking: false } })
    );
    expect(nonBlocking).not.toContain('data-testid="card-waiting"');
  });

  it('always offers a freeform note field (the notes-only path)', () => {
    const html = render();
    expect(html).toContain('data-testid="card-notes"');
    // The verbose label + hint were cut; only the minimal placeholder remains.
    expect(html).not.toContain('a note back (optional)');
  });

  it('folds the wire facts under ▸details, never open by default', () => {
    const html = render();
    expect(html).toContain('data-testid="card-details-fold"');
    expect(html).not.toMatch(/<details[^>]*\sopen/);
  });
});

// Orientation falls back to the steward's raw reasoning when no catchup
// (headline/ground) was written — and shows NO pill (radical minimalism).
describe('TricksterCard — no-catchup fallback', () => {
  it('uses the rationale as orientation when ground is absent, with no pill', () => {
    const bare = { ...ITEM, headline: null, ground: null };
    const html = renderToStaticMarkup(React.createElement(TricksterCard, { item: bare }));
    expect(html).not.toContain('data-testid="no-catchup-pill"');
    // The raw reasoning stands in as the orientation line.
    expect(html).toContain('data-testid="card-orientation"');
    expect(html).toContain(ITEM.rationale);
    // No headline → no question slot; no separate ▸more (the rationale is the
    // orientation now) — just the ▸details fold, still collapsed.
    expect(html).not.toContain('data-testid="card-headline"');
    expect(html).not.toContain('data-testid="card-more-fold"');
    expect(html).toContain('data-testid="card-details-fold"');
    expect(html).not.toMatch(/<details[^>]*\sopen/);
  });

  it('puts the rationale under ▸more (deep why) when ground IS the orientation', () => {
    const html = render(); // ITEM has both ground and rationale
    expect(html).toContain('data-testid="card-more-fold"');
    expect(html).toContain('GSL'); // rationale wikilink survives Linkify
  });
});

// The two-step interaction (anti-misclick): the execute row is hidden until the
// human selects an option (or types a note); then it offers file / file & run /
// cancel. Click→handler wiring is event-driven (the e2e spec's job); here we
// assert the render reflects the lifted selectedId prop.
describe('TricksterCard — two-step execute row', () => {
  it('hides the execute row until something is selected', () => {
    expect(render({ selectedId: null })).not.toContain('data-testid="card-execute"');
  });

  it('reveals file / file & run / cancel once an option is selected', () => {
    const html = render({ selectedId: 'SHIP' });
    expect(html).toContain('data-testid="card-execute"');
    expect(html).toContain(t('trickster.card.file'));
    // renderToStaticMarkup HTML-escapes the ampersand ('&' → '&amp;'); the
    // browser DOM still shows "file & run ▶". Match the serialized form.
    expect(html).toContain(t('trickster.card.fileandrun').replace(/&/g, '&amp;'));
    expect(html).toContain('data-testid="card-cancel"');
    // The chosen option's label sits in the "— how?" confirmation.
    expect(html).toContain('SHIP — ship the 128-region instrument');
    expect(html).toContain(t('trickster.card.how').replace(/&/g, '&amp;'));
  });

  it('carries no duplicated always-visible file buttons (only the armed row)', () => {
    const idle = render({ selectedId: null });
    // The only FILE control lives inside the (hidden-until-armed) execute row.
    expect(idle).not.toContain(t('trickster.card.file'));
  });
});

// The steward's recommendation is marked ON its own option button (brighter +
// a dim `rec`), never a separate yellow lean panel (which was deleted).
describe('TricksterCard — recommendation marked on the button', () => {
  const LEANED = {
    ...ITEM,
    recommended_option: { id: 'SHIP', label: 'SHIP — ship the 128-region instrument' },
  };
  const renderLeaned = (props) =>
    renderToStaticMarkup(React.createElement(TricksterCard, { item: LEANED, ...props }));

  it('marks exactly the recommended option and shows a dim `rec`', () => {
    const html = renderLeaned();
    expect(html).toContain('data-recommended="true"');
    expect(html).toContain(t('trickster.card.rec'));
    // Exactly one option carries the marker.
    expect((html.match(/data-recommended="true"/g) || []).length).toBe(1);
  });

  it('renders no separate lean panel (it was retired)', () => {
    expect(renderLeaned()).not.toContain('data-testid="lean-panel"');
    expect(render()).not.toContain('data-testid="lean-panel"');
  });
});

// Selection is CONTROLLED by the deck: the card takes `selectedId` and reflects
// it by filling exactly one option button. ITEM has no recommended_option, so
// every option starts in the default (dim-border) register; selecting one moves
// it into the filled (phosphor-border) register.
describe('TricksterCard — controlled selection', () => {
  const countDefaultOptionBorders = (html) =>
    (html.match(/2px solid var\(--phosphor-dim\)/g) || []).length;

  it('moves exactly one option out of the default register for the lifted selectedId', () => {
    const none = render({ selectedId: null });
    const picked = render({ selectedId: 'TWEAK' });
    expect(countDefaultOptionBorders(none) - countDefaultOptionBorders(picked)).toBe(1);
  });

  it('keeps every option in the default register when nothing valid is picked', () => {
    const none = render({ selectedId: null });
    const all = render({ selectedId: 'NOPE-not-an-option' });
    // An unknown selectedId selects no option, so the dim-border count is stable.
    expect(countDefaultOptionBorders(none)).toBe(countDefaultOptionBorders(all));
  });

  it('marks the selected option with data-selected', () => {
    const html = render({ selectedId: 'TWEAK' });
    expect(html).toContain('data-selected="true"');
    expect((html.match(/data-selected="true"/g) || []).length).toBe(1);
  });
});

// Inline assets, payload-first (the inline-assets wire-through, 2026-06-06):
// the card renders artifacts the steward declared on the wire (item.artifacts,
// produced by buildInbox from payload.artifacts) ahead of the hand-curated
// trickster-assets registry. The registry stays as a fallback; its `schematic`
// slot renders regardless because authored diagrams are not steward-rendered
// files. renderToStaticMarkup is enough — these are presence/precedence checks.
describe('TricksterCard — inline assets (payload-first)', () => {
  const renderItem = (overrides) =>
    renderToStaticMarkup(React.createElement(TricksterCard, { item: { ...ITEM, ...overrides } }));

  it('renders payload artifacts via ArtifactSlot with NO registry entry needed', () => {
    const html = renderItem({
      request_id: 'crystal-synth-steward-012',
      artifacts: [
        { path: 'Projects/Crystal Synthesizer/dispersion-filter/01_dry_click.wav', caption: '01 dry click — the control.' },
      ],
    });
    expect(html).toContain('data-testid="card-assets"');
    expect(html).toContain('data-testid="artifact-slot"');
    expect(html).toContain('01 dry click — the control.');
  });

  it('falls back to the registry audition when the wire carries no artifacts', () => {
    const html = renderItem({ request_id: 'portamento-steward-009', artifacts: [] });
    expect(html).toContain('data-testid="audition-strip"');
  });

  it('payload artifacts win over a registry audition for the same request', () => {
    const html = renderItem({
      request_id: 'portamento-steward-009',
      artifacts: [{ path: 'Projects/Foo/bar.wav', caption: 'wire audio' }],
    });
    expect(html).toContain('data-testid="artifact-slot"');
    expect(html).not.toContain('data-testid="audition-strip"');
  });

  it('still renders the registry schematic alongside payload artifacts (authored art)', () => {
    const html = renderItem({
      request_id: 'gsl-steward-028',
      artifacts: [{ path: 'Projects/GSL/shepard_C.wav', caption: 'C drone' }],
    });
    expect(html).toContain('data-schematic="gsl-keyboard"');
    expect(html).toContain('data-testid="artifact-slot"');
    expect(html).not.toContain('data-testid="audition-strip"');
  });

  it('renders no asset block when neither the wire nor the registry has anything', () => {
    const html = renderItem({ request_id: 'plain-req-no-assets-001', artifacts: [] });
    expect(html).not.toContain('data-testid="card-assets"');
  });
});

// The "open interactive" action — a card-level escape hatch to drive the asking
// steward and resolve the decision in a watch+steer session, instead of just
// filing a grant. Renders only when the deck wires onLaunch; the click is the
// deck's (it owns the LaunchModal), so here we assert presence/absence.
describe('TricksterCard — open interactive', () => {
  it('renders the launch action only when onLaunch is provided', () => {
    expect(render()).not.toContain('data-testid="card-launch"');
    const html = render({ onLaunch: () => {} });
    expect(html).toContain('data-testid="card-launch"');
    expect(html).toContain(t('trickster.card.launch'));
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
