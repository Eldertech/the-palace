// Tests for the Phase-4 schematic component family + dispatcher.
// renderToStaticMarkup, node env.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Schematic, { SCHEMATIC_NAMES } from '../../src/components/trickster/schematics/index.jsx';

describe('Schematic dispatcher', () => {
  it('renders each named schematic as a framed svg', () => {
    for (const name of SCHEMATIC_NAMES) {
      const html = renderToStaticMarkup(React.createElement(Schematic, { name }));
      expect(html, name).toContain('data-testid="schematic"');
      expect(html, name).toContain(`data-schematic="${name}"`);
      expect(html, name).toContain('<svg');
      // Color flows from CSS vars (skin-adaptive), not hard-coded hex fills.
      expect(html, name).toContain('currentColor');
    }
  });

  it('exposes exactly the four currently-surfacing schematics', () => {
    expect(SCHEMATIC_NAMES.sort()).toEqual(
      ['gsl-keyboard', 'gwl-position', 'semantic-stage2', 'shepard-stage1-drone']
    );
  });

  it('renders nothing for an unknown or absent name', () => {
    expect(renderToStaticMarkup(React.createElement(Schematic, { name: 'nope' }))).toBe('');
    expect(renderToStaticMarkup(React.createElement(Schematic, {}))).toBe('');
  });

  it('the gwl diagram names the three Position behaviours it depicts', () => {
    const html = renderToStaticMarkup(React.createElement(Schematic, { name: 'gwl-position' }));
    expect(html).toContain('CENTROID-FREQ');
    expect(html).toContain('CENTROID-WIDTH');
    expect(html).toContain('OCTAVE-COMB');
  });
});
