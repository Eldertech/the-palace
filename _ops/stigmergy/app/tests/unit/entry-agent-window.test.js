// Render-contract tests for EntryAgentWindow — the M0 shell of the
// entry-agent ("companion") window. The dynamic surface (gutter reflow, the
// fixed-on-the-glass pin, scroll-spy reading label + section glow, drag /
// resize) is layout- and effect-driven and is verified live in the browser;
// the node test environment runs no effects and has no layout, so here we
// pin only the static markup contract:
//   - the window, its gutter, titlebar, grips, and grounding stub all render
//   - the reading label defaults to "(top)" before any scroll measurement
//   - the grounding readout is derived from the open entry's frontmatter
//     (title + correctly-pluralised typed-link count)

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EntryAgentWindow, { EditMarker, TodoMarker, ProposalCard, buildTurnHistory } from '../../src/components/state/EntryAgentWindow.jsx';

const render = (props) => renderToStaticMarkup(React.createElement(EntryAgentWindow, props));
const renderMarker = (props) => renderToStaticMarkup(React.createElement(EditMarker, props));
const renderTodo = (props) => renderToStaticMarkup(React.createElement(TodoMarker, props));
const renderProposal = (props) => renderToStaticMarkup(React.createElement(ProposalCard, props));

const entry = {
  title: 'Merleau-Ponty',
  path: 'Merleau-Ponty.md',
  links: [{ target: '[[Phenomenology]]', type: 'connects-to' }, { target: '[[The Body]]', type: 'deepens' }],
};

describe('EntryAgentWindow (floating companion)', () => {
  it('renders the window, titlebar, body, composer, grounding and both grips', () => {
    const html = render({ entry });
    expect(html).toContain('data-testid="eaw-window"');
    expect(html).toContain('data-testid="eaw-titlebar"');
    expect(html).toContain('data-testid="eaw-body"');
    expect(html).toContain('data-testid="eaw-composer"');
    expect(html).toContain('data-testid="eaw-grounding"');
    expect(html).toContain('data-testid="eaw-grip-width"');
    expect(html).toContain('data-testid="eaw-grip-height"');
    expect(html).toContain('data-testid="eaw-close"');
  });

  it('floats above everything: position:fixed with a high z-index, no reflow gutter', () => {
    const html = render({ entry });
    expect(html).toContain('position:fixed');
    expect(html).toMatch(/z-index:9000/);
    expect(html).not.toContain('data-testid="eaw-gutter"'); // no reflow gutter anymore
    expect(html).not.toMatch(/shape-outside/);
  });

  it('the context label defaults to the top of the entry before any scroll', () => {
    const html = render({ entry });
    expect(html).toContain('data-testid="eaw-reading"');
    expect(html).toContain('(top)');
  });

  it('grounds in the open entry: title + pluralised typed-link count', () => {
    const html = render({ entry });
    expect(html).toContain('Merleau-Ponty');
    expect(html).toContain('2 typed links');
    expect(html).toContain('palace floor');
  });

  it('singularises a single typed link', () => {
    const html = render({ entry: { title: 'Solo', links: [{ target: '[[X]]', type: 'connects-to' }] } });
    expect(html).toContain('1 typed link');
    expect(html).not.toContain('1 typed links');
  });

  it('handles an entry with no links and no title gracefully', () => {
    const html = render({ entry: { path: 'Bare.md' } });
    expect(html).toContain('0 typed links');
    expect(html).toContain('Bare.md');
  });
});

describe('EntryAgentWindow (context-driven, Stage 0)', () => {
  it('renders the entry kind from a context prop, same as the entry prop', () => {
    const html = render({ context: { kind: 'entry', path: 'Spinoza.md', title: 'Spinoza' } });
    expect(html).toContain('data-testid="eaw-window"');
    expect(html).toContain('(top)');               // the entry section label
    expect(html).toContain('Spinoza');
  });

  it('renders the app_feedback (STIGMERGY) kind: intro, no entry-only chrome', () => {
    const html = render({ context: { kind: 'app_feedback', deck: 'LOG' } });
    expect(html).toContain('data-testid="eaw-app-intro"');
    expect(html).toContain('STIGMERGY companion');
    expect(html).toContain('development feedback'); // the footer readout
    expect(html).toContain('STIGMERGY · log');       // the context label
    expect(html).not.toContain('(top)');             // no scroll-spy section label
    expect(html).not.toContain('typed link');        // no neighborhood readout
  });

  it('renders the trickster_request kind: project intro + the ask, read-only', () => {
    const html = render({ context: {
      kind: 'trickster_request', request_id: 'req-1',
      project: 'Waveguide Synthesizer', ask: 'pick the excitation model',
    } });
    expect(html).toContain('data-testid="eaw-trickster-intro"');
    expect(html).toContain('Waveguide Synthesizer'); // the project (titlebar + intro)
    expect(html).toContain('pick the excitation model'); // the ask
    expect(html).toContain('pending decision');      // footer
    expect(html).toContain('read-only');             // footer
    expect(html).not.toContain('(top)');             // not the entry surface
  });

  it('renders a trickster LIST-context, defaulting to the top decision (the box scroll-spies the rest)', () => {
    const html = render({ context: { kind: 'trickster_request', requests: [
      { request_id: 'r1', project: 'Waveguide Synthesizer', ask: 'pick a model' },
      { request_id: 'r2', project: 'Slime Mold Delay', ask: 'tube count' },
    ] } });
    expect(html).toContain('data-testid="eaw-trickster-intro"');
    expect(html).toContain('Waveguide Synthesizer'); // top is active before any scroll
    expect(html).toContain('as:');                   // the "responding as" titlebar
  });
});

describe('buildTurnHistory (worker sees its own committed edits)', () => {
  it('passes spoken turns through and turns edit markers into "already" notes', () => {
    const convo = [
      { role: 'user', text: 'sharpen my forward vector' },
      { role: 'companion', text: 'done' },
      { role: 'edit', op: 'set-vector', commit: 'abc1234', vectorChange: { from: 'old', to: 'I will keep weaving.' } },
      { role: 'user', text: 'approved' },
    ];
    const h = buildTurnHistory(convo);
    expect(h).toHaveLength(4);
    expect(h[0]).toEqual({ role: 'user', text: 'sharpen my forward vector' });
    expect(h[1]).toEqual({ role: 'companion', text: 'done' });
    // the edit became a companion-side note naming what already landed
    expect(h[2].role).toBe('companion');
    expect(h[2].text).toMatch(/already updated this entry's forward_vector to: "I will keep weaving\."/);
    expect(h[2].text).toMatch(/do NOT set it again/);
    expect(h[3]).toEqual({ role: 'user', text: 'approved' });
  });

  it('notes a body edit and a revert distinctly', () => {
    const h = buildTurnHistory([
      { role: 'edit', op: 'append', commit: 'a1', summary: 'a line about li' },
      { role: 'edit', op: 'revert', commit: 'b2', reverts: 'a1' },
    ]);
    expect(h[0].text).toMatch(/already committed a append: a line about li/);
    expect(h[1].text).toMatch(/already reverted commit a1/);
  });

  it('is SSR/empty safe', () => {
    expect(buildTurnHistory(null)).toEqual([]);
    expect(buildTurnHistory([])).toEqual([]);
  });
});

describe('ProposalCard (show before editing — propose → approve)', () => {
  it('shows a set-vector proposal as a from→to diff with approve/discard', () => {
    const html = renderProposal({
      op: { op: 'set-vector', text: 'I will roam outside the palace.' },
      vectorChange: { from: 'I want to grow.', to: 'I will roam outside the palace.' },
      onApprove: () => {}, onDiscard: () => {},
    });
    expect(html).toContain('data-testid="eaw-proposal"');
    expect(html).toContain('proposed edit');
    expect(html).toContain('forward vector');
    expect(html).toContain('I want to grow.');                 // old (struck)
    expect(html).toContain('I will roam outside the palace.');  // new
    expect(html).toContain('approve?');
    expect(html).toContain('data-testid="eaw-proposal-approve"');
    expect(html).toContain('data-testid="eaw-proposal-discard"');
  });

  it('shows a rewrite proposal as find→replace', () => {
    const html = renderProposal({
      op: { op: 'rewrite', find: 'seat of perception', replace: 'medium of perception' },
      onApprove: () => {}, onDiscard: () => {},
    });
    expect(html).toContain('seat of perception');
    expect(html).toContain('medium of perception');
  });

  it('shows [approving…] while in flight (no second click)', () => {
    const html = renderProposal({ op: { op: 'append', text: 'a line' }, applying: true, onApprove: () => {}, onDiscard: () => {} });
    expect(html).toContain('approving…');
    expect(html).not.toContain('[approve]');
  });
});

describe('TodoMarker (Stage 1 captured to-do)', () => {
  it('confirms the to-do was filed to the QUEUE, with area + severity', () => {
    const html = renderTodo({ title: 'make the LOG filters clearer', area: 'log', severity: 'minor' });
    expect(html).toContain('data-testid="eaw-todo"');
    expect(html).toContain('filed to QUEUE');
    expect(html).toContain('make the LOG filters clearer');
    expect(html).toContain('area: log');
    expect(html).toContain('minor');
  });
});

describe('EditMarker (committed edit + post-commit undo)', () => {
  const base = { op: 'append', commit: 'abc1234', branch: 'stigmergy-edits', summary: 'a line about li' };

  it('shows the committed edit with its op, commit and branch', () => {
    const html = renderMarker(base);
    expect(html).toContain('data-testid="eaw-edit"');
    expect(html).toContain('append');
    expect(html).toContain('abc1234');
    expect(html).toContain('stigmergy-edits');
  });

  it('offers an [undo] control only when onUndo is given and not yet reverted', () => {
    const withUndo = renderMarker({ ...base, onUndo: () => {} });
    expect(withUndo).toContain('data-testid="eaw-edit-undo"');
    expect(withUndo).toContain('[undo]');
    const noUndo = renderMarker(base); // no handler → no control
    expect(noUndo).not.toContain('data-testid="eaw-edit-undo"');
  });

  it('shows "undoing…" while a revert is in flight (no second click)', () => {
    const html = renderMarker({ ...base, onUndo: () => {}, undoing: true });
    expect(html).toContain('undoing…');
    expect(html).not.toContain('[undo]');
  });

  it('marks the edit reverted (no undo control) once a revert has landed', () => {
    const html = renderMarker({ ...base, onUndo: () => {}, undone: true });
    expect(html).toContain('reverted');
    expect(html).not.toContain('data-testid="eaw-edit-undo"');
    expect(html).toMatch(/line-through/);
  });

  it('flags a forward-vector change prominently (from → to), never silent', () => {
    const html = renderMarker({
      op: 'set-vector', commit: 'abc1234', branch: 'stigmergy-edits',
      vectorChange: { from: 'I want to grow.', to: 'I will keep weaving what I touch.' },
      onUndo: () => {},
    });
    expect(html).toContain('data-testid="eaw-vector-flag"');
    expect(html).toContain('forward vector changed');
    expect(html).toContain('I want to grow.');                 // the old (struck)
    expect(html).toContain('I will keep weaving what I touch.'); // the new
    expect(html).toContain('data-testid="eaw-edit-undo"');      // a vector change is undoable too
  });

  it('renders a revert marker distinctly, naming the commit it reverts', () => {
    const html = renderMarker({ op: 'revert', commit: 'def5678', branch: 'stigmergy-edits', reverts: 'abc1234' });
    expect(html).toContain('data-op="revert"');
    expect(html).toContain('↩ reverted');
    expect(html).toContain('abc1234'); // the original
    expect(html).toContain('def5678'); // the new inverse commit
    expect(html).not.toContain('data-testid="eaw-edit-undo"'); // a revert isn't itself undoable here
  });
});
