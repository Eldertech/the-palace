import React from 'react';
import GslKeyboard from './GslKeyboard.jsx';
import GwlPosition from './GwlPosition.jsx';
import SemanticStage2 from './SemanticStage2.jsx';
import ShepardStage1Drone from './ShepardStage1Drone.jsx';

// The schematic component family — hand-authored SVG diagrams lifted out of the
// standalone trickster.html into reusable React components, so the same art can
// render on a Trickster card, a STATE-deck entry page, or a LOG card. Colors
// come from CSS vars (currentColor + per-region `color`), so each diagram
// follows the active skin without a tone prop.
//
// Deferred (mechanical drop-ins when their cycles recur or a STATE/LOG consumer
// wants them): shepard-stage2-staircase, retro-five-asset-brief, slime-tubes,
// preset-cutoff. They depict requests not in the current pending set.
const SCHEMATICS = {
  'gsl-keyboard': GslKeyboard,
  'gwl-position': GwlPosition,
  'semantic-stage2': SemanticStage2,
  'shepard-stage1-drone': ShepardStage1Drone,
};

export const SCHEMATIC_NAMES = Object.keys(SCHEMATICS);

// <Schematic name="gsl-keyboard" /> — renders the named diagram in a framed
// box, or nothing if the name is unknown/absent.
export default function Schematic({ name }) {
  const Cmp = name ? SCHEMATICS[name] : null;
  if (!Cmp) return null;
  return (
    <div
      data-testid="schematic"
      data-schematic={name}
      style={{
        border: '1px solid var(--phosphor-dim)',
        background: 'var(--phosphor-deep)',
        padding: 8,
        marginBottom: 8,
      }}
    >
      <Cmp />
    </div>
  );
}
