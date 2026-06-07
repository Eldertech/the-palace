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

// Selection is now CONTROLLED by the deck (Phase 2 keyboard story): the card
// takes `selectedId` + `onSelectOption` props instead of owning the state, so
// the keyboard's 1-N/Enter and the mouse clicks share one source of truth.
// Click→onSelectOption wiring is event-driven (an e2e concern); here we assert
// the render reflects the lifted prop. The card has no lean (ITEM defines no
// recommended_option), so the only default-tone Buttons are the option grid and
// the only disable-able control is the FILE button — which keeps these counts
// unambiguous.
describe('TricksterCard — controlled selection', () => {
  // Button default tone renders a phosphor-dim border; primary (selected)
  // renders a phosphor border. Count the dim option borders to see how many
  // options sit in the default (unselected) register.
  const countDefaultOptionBorders = (html) =>
    (html.match(/2px solid var\(--phosphor-dim\)/g) || []).length;

  it('moves exactly one option into the selected register for the lifted selectedId', () => {
    const none = render({ selectedId: null });
    const picked = render({ selectedId: 'TWEAK' });
    expect(countDefaultOptionBorders(none) - countDefaultOptionBorders(picked)).toBe(1);
  });

  it('keeps every option in the default register when nothing is picked', () => {
    const none = render({ selectedId: null });
    const all = render({ selectedId: 'NOPE-not-an-option' });
    // An unknown selectedId selects nothing, so the dim-border count is stable.
    expect(countDefaultOptionBorders(none)).toBe(countDefaultOptionBorders(all));
  });

  it('disables the FILE button until an option is picked (or a note typed)', () => {
    // Use a request_id that matches no inline-asset registry entry, so the only
    // disable-able control is the FILE button (asset players carry their own
    // disabled state and would otherwise confound the proxy).
    const plain = (props) =>
      renderToStaticMarkup(React.createElement(TricksterCard, {
        item: { ...ITEM, request_id: 'plain-req-keyboard-001' },
        ...props,
      }));
    // Nothing picked + no note → FILE button is the lone disabled control.
    expect(plain({ selectedId: null })).toContain('disabled=""');
    // A lifted pick makes the card fileable → no disabled control remains.
    expect(plain({ selectedId: 'SHIP' })).not.toContain('disabled=""');
  });
});

// FILE & RUN — the fast path that files the grant AND advances the asking
// steward by a cycle. Click→advanceSteward wiring is event-driven (an e2e
// concern); here we assert the button renders alongside FILE and shares FILE's
// fileable gate. (Run-outcome formatting lives in the deck — see
// trickster-run.test.js.)
describe('TricksterCard — file & run', () => {
  it('offers a FILE & RUN button beside the FILE button', () => {
    const html = render({ selectedId: 'SHIP' });
    expect(html).toContain(t('trickster.card.file'));
    // renderToStaticMarkup HTML-escapes the ampersand ('&' → '&amp;'); the
    // browser DOM still shows "file & run ▶". Match the serialized form.
    expect(html).toContain(t('trickster.card.fileandrun').replace(/&/g, '&amp;'));
  });

  it('gates FILE & RUN on the same fileable condition as FILE', () => {
    // A request_id that matches no inline-asset registry entry, so FILE and
    // FILE & RUN are the only disable-able controls.
    const plain = (props) =>
      renderToStaticMarkup(React.createElement(TricksterCard, {
        item: { ...ITEM, request_id: 'plain-req-run-001' },
        ...props,
      }));
    // Nothing picked + no note → both buttons disabled.
    expect((plain({ selectedId: null }).match(/disabled=""/g) || []).length).toBe(2);
    // A lifted pick makes the card fileable → no disabled control remains.
    expect(plain({ selectedId: 'SHIP' })).not.toContain('disabled=""');
  });
});

// FILE LEAN & RUN — the lean-side twin of FILE & RUN. When the steward left a
// recommended_option, the LeanPanel offers FILE LEAN (file the lean, carrying
// any freeform note) and FILE LEAN & RUN (file it AND advance the asking steward
// by a cycle). Click→advanceSteward wiring is event-driven (an e2e concern, same
// as FILE & RUN — see fileGrant's run path); here we assert the panel and both
// buttons render when a lean exists and stay absent when it does not.
describe('TricksterCard — file lean & run', () => {
  const LEANED = {
    ...ITEM,
    recommended_option: { id: 'SHIP', label: 'SHIP — ship the 128-region instrument' },
  };
  const renderLeaned = (props) =>
    renderToStaticMarkup(React.createElement(TricksterCard, { item: LEANED, ...props }));

  it('renders the lean panel with both FILE LEAN and FILE LEAN & RUN when a lean exists', () => {
    const html = renderLeaned();
    expect(html).toContain('data-testid="lean-panel"');
    expect(html).toContain(t('trickster.lean.file'));
    // renderToStaticMarkup HTML-escapes the ampersand ('&' → '&amp;'); the
    // browser DOM still shows "file lean & run ▶". Match the serialized form.
    expect(html).toContain(t('trickster.lean.fileandrun').replace(/&/g, '&amp;'));
  });

  it('renders no lean panel when the steward left no recommended_option', () => {
    // The base ITEM defines no recommended_option, so the panel must not render.
    expect(render()).not.toContain('data-testid="lean-panel"');
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
    // 'crystal-synth-steward-012' matches no trickster-assets registry key, so
    // the only way the player appears is the wire-declared artifacts.
    const html = renderItem({
      request_id: 'crystal-synth-steward-012',
      artifacts: [
        { path: 'Projects/Crystal Synthesizer/dispersion-filter/01_dry_click.wav', caption: '01 dry click — the control.' },
      ],
    });
    expect(html).toContain('data-testid="card-assets"');
    expect(html).toContain('data-testid="artifact-slot"');
    // The full caption survives (ArtifactSlot shows it under the player).
    expect(html).toContain('01 dry click — the control.');
  });

  it('falls back to the registry audition when the wire carries no artifacts', () => {
    // 'portamento-steward-' is a registry prefix carrying an audition strip.
    const html = renderItem({ request_id: 'portamento-steward-009', artifacts: [] });
    expect(html).toContain('data-testid="audition-strip"');
  });

  it('payload artifacts win over a registry audition for the same request', () => {
    const html = renderItem({
      request_id: 'portamento-steward-009', // registry audition exists…
      artifacts: [{ path: 'Projects/Foo/bar.wav', caption: 'wire audio' }], // …but the wire wins
    });
    expect(html).toContain('data-testid="artifact-slot"');
    expect(html).not.toContain('data-testid="audition-strip"');
  });

  it('still renders the registry schematic alongside payload artifacts (authored art)', () => {
    // 'gsl-steward-' carries both a schematic and an audition. With payload
    // artifacts present: schematic stays, audition is suppressed, payload renders.
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
