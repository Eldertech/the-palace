// Unit tests for entry-grounding — the Companion's grounding assembly.
// Builds a tiny temp palace and asserts the grounding resolves the entry's
// typed-link neighborhood (titles + stages + forward_vectors), de-dupes
// repeated targets, flags ghost (unresolved) neighbors, and always carries the
// palace floor. Pure over the filesystem (readEntry/listEntries).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assembleGrounding, assembleGroundingByTitle, resolveTitleToPath, PALACE_FLOOR } from '../../src/lib/entry-grounding.js';

let root;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'stigmergy-grounding-'));

  // The open entry: two real neighbors + one ghost, and the same real neighbor
  // referenced twice (different link types) to exercise de-dup.
  writeFileSync(
    join(root, 'Merleau-Ponty.md'),
    '---\n'
    + 'title: Merleau-Ponty\n'
    + 'type: person\n'
    + 'pillars: [philosophy]\n'
    + 'stage: growing\n'
    + 'forward_vector: "I want to put the lived body back into the loop."\n'
    + 'links:\n'
    + '  - target: "[[Phenomenology]]"\n'
    + '    type: deepens\n'
    + '    label: grounds\n'
    + '  - target: "[[The Body Schema]]"\n'
    + '    type: connects-to\n'
    + '  - target: "[[Phenomenology]]"\n'
    + '    type: connects-to\n'         // duplicate target — should appear once
    + '  - target: "[[A Ghost Node]]"\n'  // unresolved — ghost
    + '    type: connects-to\n'
    + '---\n# Body\n\n## Core\nthe body is the seat of perception.\n'
  );

  writeFileSync(
    join(root, 'Phenomenology.md'),
    '---\ntitle: Phenomenology\ntype: concept\nstage: mature\nforward_vector: "I want to describe experience before theory."\n---\n# P\n'
  );
  writeFileSync(
    join(root, 'The Body Schema.md'),
    '---\ntitle: "The Body Schema"\ntype: concept\nstage: sprout\nforward_vector: "I want to map the body I do not look at."\n---\n# BS\n'
  );
});

afterAll(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

describe('assembleGroundingByTitle (Stage 2 — ground a trickster request by its project)', () => {
  it('resolves a title to its path', () => {
    expect(resolveTitleToPath(root, 'Phenomenology')).toBe('Phenomenology.md');
    expect(resolveTitleToPath(root, 'Nobody Here')).toBe(null);
    expect(resolveTitleToPath(root, '')).toBe(null);
  });

  it('grounds in the entry behind a title', () => {
    const { path, grounding } = assembleGroundingByTitle(root, 'Merleau-Ponty');
    expect(path).toBe('Merleau-Ponty.md');
    expect(grounding.entry.title).toBe('Merleau-Ponty');
    expect(grounding.entry.forward_vector).toMatch(/lived body/);
  });

  it('returns nulls (not a throw) when the title names no entry', () => {
    expect(assembleGroundingByTitle(root, '@weave-swarm')).toEqual({ path: null, grounding: null });
  });
});

describe('assembleGrounding', () => {
  it('returns null for an entry that cannot be read', () => {
    expect(assembleGrounding(root, 'Nope.md')).toBe(null);
  });

  it('carries the open entry summary including its forward vector', () => {
    const g = assembleGrounding(root, 'Merleau-Ponty.md');
    expect(g.entry.title).toBe('Merleau-Ponty');
    expect(g.entry.type).toBe('person');
    expect(g.entry.stage).toBe('growing');
    expect(g.entry.forward_vector).toMatch(/lived body/);
    expect(g.entry.link_count).toBe(4);
  });

  it('resolves real neighbors with their stage + forward_vector', () => {
    const g = assembleGrounding(root, 'Merleau-Ponty.md');
    const phen = g.neighbors.find((n) => n.name === 'Phenomenology');
    expect(phen.resolved).toBe(true);
    expect(phen.path).toBe('Phenomenology.md');
    expect(phen.stage).toBe('mature');
    expect(phen.forward_vector).toMatch(/before theory/);
    // first relation's type/label is kept for the de-duped target
    expect(phen.type).toBe('deepens');
    expect(phen.label).toBe('grounds');
  });

  it('de-dupes a target referenced by two link types', () => {
    const g = assembleGrounding(root, 'Merleau-Ponty.md');
    const phenCount = g.neighbors.filter((n) => n.name === 'Phenomenology').length;
    expect(phenCount).toBe(1);
  });

  it('keeps ghost (unresolved) neighbors, flagged', () => {
    const g = assembleGrounding(root, 'Merleau-Ponty.md');
    const ghost = g.neighbors.find((n) => n.name === 'A Ghost Node');
    expect(ghost).toBeTruthy();
    expect(ghost.resolved).toBe(false);
    expect(ghost.path).toBe(null);
    expect(ghost.forward_vector).toBe(null);
  });

  it('reports counts (links, resolved, ghost) and the palace floor', () => {
    const g = assembleGrounding(root, 'Merleau-Ponty.md');
    expect(g.counts.links).toBe(4);
    expect(g.counts.neighbors_resolved).toBe(2);
    expect(g.counts.neighbors_ghost).toBe(1);
    expect(g.floor).toBe(PALACE_FLOOR);
    expect(g.floor.pillars).toEqual(['creation', 'tools', 'philosophy', 'practice']);
  });
});
