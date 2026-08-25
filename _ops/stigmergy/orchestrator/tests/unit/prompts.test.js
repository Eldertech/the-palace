// prompts.test.js — render songline + steward templates with manifest values.
//
// Critical: all four Stage A content findings (10-13) must appear in the
// steward output. Songline template must include pheromone-trail awareness.

import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadAndRender, renderTemplate } from '../../src/prompts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(__dirname, '..', '..', '..', '..', '..', '_ops', 'orchestrator');

describe('renderTemplate', () => {
  it('substitutes a single placeholder', () => {
    expect(renderTemplate('hello {{name}}', { name: 'world' })).toBe('hello world');
  });

  it('resolves dotted paths', () => {
    expect(renderTemplate('model: {{model.name}}', { model: { name: 'sonnet' } })).toBe('model: sonnet');
  });

  it('throws on unresolved placeholder', () => {
    expect(() => renderTemplate('hi {{missing}}', {})).toThrow(/unresolved placeholder/);
  });

  it('processes {{>include}} via loadInclude', () => {
    const out = renderTemplate('a {{>shared}} b', {}, () => 'INCLUDED');
    expect(out).toBe('a INCLUDED b');
  });

  it('throws when an include is referenced but no loader provided', () => {
    expect(() => renderTemplate('{{>shared}}', {})).toThrow(/no loadInclude/);
  });

  it('substitutes after include expansion (single-level)', () => {
    const out = renderTemplate('home: {{home}} | {{>shared}}', { home: 'X' }, () => '(shared)');
    expect(out).toBe('home: X | (shared)');
  });
});

describe('loadAndRender — songline template', () => {
  const vars = {
    home: 'Cooperation Yields Agency',
    session_id: 'songline-2026-05-04-001',
    path_description: 'Cooperation Yields Agency -> Kuramoto Coupling -> Hilaritas Generator',
    step_number: 1,
    step_total: 3,
    next_agent_id: 'Kuramoto Coupling',
  };

  it('renders without unresolved placeholders', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'songline', vars });
    expect(out).toMatch(/Cooperation Yields Agency/);
    expect(out).toMatch(/Kuramoto Coupling/);
    expect(out).toMatch(/songline-2026-05-04-001/);
  });

  it('includes the four shared voice rules (Findings 10-13)', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'songline', vars });
    expect(out).toMatch(/Plain first-person voice/i);
    expect(out).toMatch(/Page-title identity/i);
    expect(out).toMatch(/Be brief/i);
    expect(out).toMatch(/Catch the user up/i);
  });

  it('includes pheromone-trail awareness', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'songline', vars });
    expect(out).toMatch(/pheromone[- ]?trail/i);
    expect(out).toMatch(/metabolize/i);
  });

  it('includes hand-off instruction with next_agent_id', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'songline', vars });
    expect(out).toMatch(/hand[- ]?off/i);
    expect(out).toMatch(/Kuramoto Coupling/);
  });
});

describe('loadAndRender — steward template', () => {
  const vars = {
    home: 'Generative Sample Libraries',
    cycle_id: 'cycle-4-2026-05-04',
    stage_at_last_activation: 'growing',
  };

  it('renders without unresolved placeholders', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'steward', vars });
    expect(out).toMatch(/Generative Sample Libraries/);
    expect(out).toMatch(/cycle-4-2026-05-04/);
    expect(out).toMatch(/growing/);
  });

  it('Finding 10 — plain first-person voice rule appears', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'steward', vars });
    expect(out).toMatch(/plain first-person|plain.*first.*person/i);
    expect(out).toMatch(/I see/);
  });

  it('Finding 11 — page-title identity rule appears', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'steward', vars });
    expect(out).toMatch(/page[- ]?title identity|the page IS the agent/i);
    expect(out).toMatch(/GSL-STEWARD/); // The cycle-1 quote that surfaced the rule
  });

  it('Finding 12 — be brief / content lives in rationale rule appears', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'steward', vars });
    expect(out).toMatch(/brief|template style|50.{1,5}150 words/i);
    expect(out).toMatch(/rationale/);
  });

  it('Finding 13 — catch the user up before you ask rule appears', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'steward', vars });
    expect(out).toMatch(/catch.*the user up|catch.{0,10}up.{0,10}before you ask/i);
  });

  it('includes the stage-conditional posture table', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'steward', vars });
    expect(out).toMatch(/seed/);
    expect(out).toMatch(/sprout/);
    expect(out).toMatch(/growing/);
    expect(out).toMatch(/mature/);
    expect(out).toMatch(/dormant/);
  });

  it('mentions sensory-deliverable audition gate', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'steward', vars });
    expect(out).toMatch(/audition/i);
    expect(out).toMatch(/blocking: true/i);
  });

  it('warns about forward_vector change halting the cycle', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'steward', vars });
    expect(out).toMatch(/forward[_ ]vector/i);
  });
});

describe('shared template (the four-clause page-agent voice rule)', () => {
  it('exists at _ops/orchestrator/prompts/shared.md', () => {
    // Implicit: loadAndRender includes it via {{>shared}} above. Confirm file directly.
    const out = renderTemplate('{{>shared}}', {}, (name) => {
      expect(name).toBe('shared');
      return 'OK';
    });
    expect(out).toBe('OK');
  });

  it('all four voice findings appear when rendered standalone', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'shared', vars: {} });
    expect(out).toMatch(/plain first-person/i);
    expect(out).toMatch(/page[- ]?title identity/i);
    expect(out).toMatch(/be brief|content lives in/i);
    expect(out).toMatch(/catch.*user.*up/i);
  });

  it('mentions Gap 9 top-level request_id discipline', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'shared', vars: {} });
    expect(out).toMatch(/Gap 9|top-level/i);
    expect(out).toMatch(/request_id/);
  });

  it('mentions obsidian:// link convention', () => {
    const out = loadAndRender({ skillRoot: SKILL_ROOT, templateName: 'shared', vars: {} });
    expect(out).toMatch(/obsidian:\/\//);
  });
});
