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
import EntryAgentWindow, { EditMarker } from '../../src/components/state/EntryAgentWindow.jsx';

const render = (props) => renderToStaticMarkup(React.createElement(EntryAgentWindow, props));
const renderMarker = (props) => renderToStaticMarkup(React.createElement(EditMarker, props));

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
