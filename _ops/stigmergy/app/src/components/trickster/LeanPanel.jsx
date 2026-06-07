import React from 'react';
import { Button } from '../primitives.jsx';
import { t } from '../../lib/lexicon.js';

// LeanPanel — the steward's recommended option as the one-click default.
//
// Renders above the options grid on any card whose steward left a detectable
// lean (item.recommended_option, see inbox.tagRecommendation). The amber
// register marks it as the suggested path; the options grid below stays the
// override. FILE LEAN files the recommended option (carrying any freeform note);
// FILE LEAN & RUN also advances the asking steward by a cycle so it picks the
// grant up now — the lean-side twin of the card's FILE & RUN. Presentational —
// the card owns the actual write path and passes both handlers down.
export default function LeanPanel({ optionLabel, onFileLean, onFileLeanAndRun, disabled = false }) {
  if (!optionLabel) return null;
  return (
    <div data-testid="lean-panel" style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      border: '1px solid var(--warn)', padding: '6px 10px', marginBottom: 8,
    }}>
      <span style={{
        color: 'var(--warn)', textShadow: 'var(--glow)',
        fontFamily: 'var(--font-mono)', fontSize: 12,
      }}>
        {t('trickster.lean.prefix')}{' '}
        <b style={{ color: 'var(--phosphor-white)' }}>{optionLabel}</b>
      </span>
      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          color: 'var(--phosphor-dim)', textShadow: 'none',
          fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase',
        }}>{t('trickster.lean.hint')}</span>
        <Button tone="warn" onClick={onFileLean} disabled={disabled}>
          {t('trickster.lean.file')}
        </Button>
        {onFileLeanAndRun ? (
          <Button tone="warn" onClick={onFileLeanAndRun} disabled={disabled}>
            {t('trickster.lean.fileandrun')}
          </Button>
        ) : null}
      </span>
    </div>
  );
}
