import React from 'react';
import GslKeyboard from './GslKeyboard.jsx';
import GwlPosition from './GwlPosition.jsx';
import SemanticStage2 from './SemanticStage2.jsx';
import ShepardStage1Drone from './ShepardStage1Drone.jsx';
import ShepardStage2Staircase from './ShepardStage2Staircase.jsx';
import RetroFiveAssetBrief from './RetroFiveAssetBrief.jsx';
import SlimeTubes from './SlimeTubes.jsx';
import PresetCutoff from './PresetCutoff.jsx';

// The schematic component family — all eight hand-authored SVG diagrams lifted
// out of the (now-retired) standalone trickster.html into reusable React
// components, so the same art can render on a Trickster card, a STATE-deck
// entry page, or a LOG card. Colors come from CSS vars (currentColor +
// per-region `color`), so each diagram follows the active skin without a tone
// prop.
//
// The first four attach to currently-pending cards; the last four are exact-
// keyed to their origin requests (not currently pending) and preserved here so
// the art survived the deletion of trickster.html (Phase 6).
const SCHEMATICS = {
  'gsl-keyboard': GslKeyboard,
  'gwl-position': GwlPosition,
  'semantic-stage2': SemanticStage2,
  'shepard-stage1-drone': ShepardStage1Drone,
  'shepard-stage2-staircase': ShepardStage2Staircase,
  'retro-five-asset-brief': RetroFiveAssetBrief,
  'slime-tubes': SlimeTubes,
  'preset-cutoff': PresetCutoff,
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
