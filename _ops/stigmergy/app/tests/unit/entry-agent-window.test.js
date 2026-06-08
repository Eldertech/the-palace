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
import EntryAgentWindow from '../../src/components/state/EntryAgentWindow.jsx';

const render = (props) => renderToStaticMarkup(React.createElement(EntryAgentWindow, props));

const entry = {
  title: 'Merleau-Ponty',
  path: 'Merleau-Ponty.md',
  links: [{ target: '[[Phenomenology]]', type: 'connects-to' }, { target: '[[The Body]]', type: 'deepens' }],
};

describe('EntryAgentWindow (M0 shell)', () => {
  it('renders the window, gutter, titlebar, body, grounding and both grips', () => {
    const html = render({ entry });
    expect(html).toContain('data-testid="eaw-window"');
    expect(html).toContain('data-testid="eaw-gutter"');
    expect(html).toContain('data-testid="eaw-titlebar"');
    expect(html).toContain('data-testid="eaw-body"');
    expect(html).toContain('data-testid="eaw-grounding"');
    expect(html).toContain('data-testid="eaw-grip-width"');
    expect(html).toContain('data-testid="eaw-grip-height"');
    expect(html).toContain('data-testid="eaw-close"');
  });

  it('pins position:fixed (fixed on the glass, not scrolling with the text)', () => {
    expect(render({ entry })).toContain('position:fixed');
  });

  it('the gutter is a right float with shape-outside so text wraps to its left', () => {
    const html = render({ entry });
    expect(html).toContain('float:right');
    expect(html).toMatch(/shape-outside/);
  });

  it('the reading label defaults to the top of the entry before any scroll', () => {
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
