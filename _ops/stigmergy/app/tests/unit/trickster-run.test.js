// Unit tests for formatRun() — the TricksterDeck helper that turns a card's
// FILE & RUN advanceSteward() result into a deck banner. Pure logic, tested in
// isolation the same way trickster-keys.test.js tests its pure key map.
//
// The contract that matters most: the grant is ALREADY filed by the time a run
// outcome is shaped, so every branch must lead with "filed" — a skipped or
// failed run never reads as a lost decision.

import { describe, it, expect } from 'vitest';
import { formatRun } from '../../src/components/TricksterDeck.jsx';

describe('formatRun', () => {
  it('reports an advancing cycle when the run fired', () => {
    const r = formatRun({ ok: true, fired: true, cycle_n: 12 }, 'Blood Compressor');
    expect(r.tone).toBe('ok');
    expect(r.text).toContain('filed');
    expect(r.text).toContain('@Blood Compressor');
    expect(r.text).toContain('cycle 12');
  });

  it('treats a 409 / busy result as filed-but-deferred', () => {
    const r = formatRun({ ok: false, status: 409, busy: true }, 'Semantic Delay');
    expect(r.tone).toBe('warn');
    expect(r.text).toContain('filed');
    expect(r.text).toContain('already running');
  });

  it('explains a 404 (the asker is not a registered steward)', () => {
    const r = formatRun({ ok: false, status: 404 }, 'some-session-agent');
    expect(r.tone).toBe('warn');
    expect(r.text).toContain('filed');
    expect(r.text).toContain('registered steward');
  });

  it('surfaces an unexpected failure but still leads with filed', () => {
    const r = formatRun({ ok: false, status: 500, error: 'lane unreachable' }, 'GSL');
    expect(r.tone).toBe('err');
    expect(r.text).toContain('filed');
    expect(r.text).toContain('lane unreachable');
  });

  it('always leads with "filed" regardless of the run outcome', () => {
    const cases = [
      formatRun({ ok: true, fired: true, cycle_n: 1 }, 'A'),
      formatRun({ ok: false, busy: true }, 'B'),
      formatRun({ ok: false, status: 404 }, 'C'),
      formatRun({ ok: false }, 'D'),
      formatRun(null, 'E'),
    ];
    for (const c of cases) expect(c.text.startsWith('filed')).toBe(true);
  });
});
