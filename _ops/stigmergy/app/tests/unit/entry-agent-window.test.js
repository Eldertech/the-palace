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
